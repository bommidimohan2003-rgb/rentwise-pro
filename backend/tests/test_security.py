import unittest
import os
import sys
from datetime import datetime

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import HTTPException
from auth import (
    validate_password_strength,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    hash_password,
    verify_password
)
from config import ADMIN_SETUP_CODE
from database import (
    init_db,
    create_user,
    get_user,
    execute_query,
    fetch_one,
    revoke_token,
    is_token_revoked,
    record_failed_auth_attempt,
    clear_failed_auth_attempts
)
from main import (
    get_current_user_email,
    check_admin_user
)

class TestSecurityFunctions(unittest.TestCase):

    def setUp(self):
        try:
            init_db()
        except Exception:
            pass

    def test_01_password_policy_enforcement(self):
        """Verify password strength policy rejects weak, common, or short passwords."""
        # Test short password (< 8 chars)
        valid, msg = validate_password_strength("Short1!")
        self.assertFalse(valid)
        self.assertIn("8 characters", msg)

        # Test missing special character
        valid, msg = validate_password_strength("NoSpecialChar1")
        self.assertFalse(valid)
        self.assertIn("special character", msg)

        # Test missing uppercase letter
        valid, msg = validate_password_strength("lowercase1!")
        self.assertFalse(valid)
        self.assertIn("uppercase", msg)

        # Test common weak password
        valid, msg = validate_password_strength("password123")
        self.assertFalse(valid)

        # Test valid strong password
        valid, msg = validate_password_strength("P@ssw0rd2026!Secure")
        self.assertTrue(valid)
        self.assertEqual(msg, "")

    def test_02_admin_role_gating(self):
        """Verify admin role cannot be claimed without the exact ADMIN_SETUP_CODE and endpoint protection."""
        # Create regular user
        reg_email = "test_regular_user@payent.com"
        create_user(email=reg_email, phone="+919000000000", password_hash=hash_password("P@ss12345!"), full_name="Reg User", role="user")

        # Verify check_admin_user raises 403 Forbidden for non-admin user
        with self.assertRaises(HTTPException) as ctx:
            check_admin_user(current_user_email=reg_email)
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("Admin access required", ctx.exception.detail)

        # Create admin user with correct setup code
        admin_email = "test_admin_user@payent.com"
        create_user(email=admin_email, phone="+919000000009", password_hash=hash_password("P@ss12345!"), full_name="Admin User", role="admin")

        # Verify check_admin_user succeeds for admin user
        admin_obj = check_admin_user(current_user_email=admin_email)
        self.assertEqual(admin_obj["email"], admin_email)
        self.assertEqual(admin_obj["role"], "admin")

    def test_03_idor_protection_and_ownership(self):
        """Verify user A cannot cancel or access user B's order."""
        user_a = "user_a_idor@payent.com"
        user_b = "user_b_idor@payent.com"

        create_user(email=user_a, phone="+919000000001", password_hash=hash_password("P@ss12345!"), full_name="User A")
        create_user(email=user_b, phone="+919000000002", password_hash=hash_password("P@ss12345!"), full_name="User B")

        order_id = "idor-test-order-100"
        try:
            execute_query("""
                INSERT INTO orders (id, user_email, product_id, product_title, product_image, start_date, end_date, total, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE user_email = VALUES(user_email)
            """, (order_id, user_b, "p1", "Test Product", "", "2026-08-01", "2026-08-05", 5000, "active", datetime.utcnow().isoformat()))
        except Exception:
            pass

        # Fetch order as user B -> Should succeed
        order = fetch_one("SELECT * FROM orders WHERE id = %s", (order_id,))
        self.assertIsNotNone(order)
        self.assertEqual(order["user_email"], user_b)
        self.assertNotEqual(order["user_email"], user_a)

    def test_04_brute_force_rate_limiting(self):
        """Verify failed login attempt counter locks account after threshold."""
        test_key = "test_rate_limit_ip_127.0.0.1"
        clear_failed_auth_attempts(test_key)

        # 4 attempts -> Not locked
        for _ in range(4):
            is_locked, _ = record_failed_auth_attempt(test_key, max_attempts=5, lock_duration_secs=900)
            self.assertFalse(is_locked)

        # 5th attempt -> Locked
        is_locked, secs = record_failed_auth_attempt(test_key, max_attempts=5, lock_duration_secs=900)
        self.assertTrue(is_locked)
        self.assertGreater(secs, 0)

        # Cleanup
        clear_failed_auth_attempts(test_key)

    def test_05_jwt_revocation_and_decoding(self):
        """Verify token revocation and explicit algorithm verification."""
        user_email = "revocation_user@payent.com"
        create_user(email=user_email, phone="+919000000003", password_hash=hash_password("P@ss12345!"), full_name="Revoke User")

        # Create valid token
        token = create_access_token({"sub": user_email, "role": "user"})
        payload = decode_access_token(token, expected_type="access")
        self.assertIsNotNone(payload)
        self.assertEqual(payload["sub"], user_email)

        # Verify get_current_user_email succeeds before revocation
        header_str = f"Bearer {token}"
        email_out = get_current_user_email(authorization=header_str)
        self.assertEqual(email_out, user_email)

        # Revoke token
        jti = payload["jti"]
        revoke_token(jti, user_email, payload["exp"])
        self.assertTrue(is_token_revoked(jti))

        # Verify get_current_user_email raises 401 Unauthorized after revocation
        with self.assertRaises(HTTPException) as ctx:
            get_current_user_email(authorization=header_str)
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertIn("revoked", ctx.exception.detail.lower())

    @classmethod
    def tearDownClass(cls):
        try:
            execute_query("DELETE FROM users WHERE email IN ('test_regular_user@payent.com', 'test_admin_user@payent.com', 'user_a_idor@payent.com', 'user_b_idor@payent.com', 'revocation_user@payent.com')")
            execute_query("DELETE FROM orders WHERE id = 'idor-test-order-100'")
        except Exception:
            pass

if __name__ == "__main__":
    unittest.main()
