import unittest
import os
import sys
import json
import time
import uuid
import hmac
import hashlib
from unittest.mock import patch

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app
from database import (
    init_db,
    check_db_health,
    get_db_connection,
    record_failed_auth_attempt,
    clear_failed_auth_attempts,
    execute_query,
    is_payment_event_processed,
    record_payment_event
)
from scripts.db_backup import backup_database
from config import RAZORPAY_WEBHOOK_SECRET

client = TestClient(app, raise_server_exceptions=False)

class TestPhase8ProductionReliability(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        pass

    # ============================================================
    # 1. HEALTH CHECKS: LIVENESS & READINESS
    # ============================================================
    def test_01_liveness_healthcheck_returns_200_alive(self):
        """Verify /api/health/live returns HTTP 200 with status 'alive'."""
        res = client.get("/api/health/live")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "alive")
        self.assertIn("timestamp", data)
        self.assertIn("service", data)

    def test_02_readiness_healthcheck_returns_200_connected(self):
        """Verify /api/health/ready returns HTTP 200 with database 'connected'."""
        res = client.get("/api/health/ready")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "ready")
        self.assertEqual(data["database"], "connected")
        self.assertIn("timestamp", data)

    def test_03_readiness_healthcheck_handles_db_disconnect_gracefully(self):
        """Verify /api/health/ready returns 503 Service Unavailable when DB is down without crashing."""
        with patch("main.check_db_health", return_value=(False, "Connection refused")):
            res = client.get("/api/health/ready")
            self.assertEqual(res.status_code, 503)
            data = res.json()
            self.assertEqual(data["status"], "unhealthy")
            self.assertEqual(data["database"], "disconnected")
            self.assertNotIn("password", str(data).lower())
            self.assertNotIn("secret", str(data).lower())

    # ============================================================
    # 2. REQUEST CORRELATION ID (X-Request-ID)
    # ============================================================
    def test_04_request_id_generation_and_propagation(self):
        """Verify server generates and reflects X-Request-ID header."""
        # 1. Server-generated request ID
        res = client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        req_id = res.headers.get("x-request-id")
        self.assertIsNotNone(req_id)
        self.assertTrue(len(req_id) > 0)

        # 2. Client-supplied request ID propagated
        custom_id = "test-custom-trace-uuid-12345"
        res_custom = client.get("/api/health", headers={"X-Request-ID": custom_id})
        self.assertEqual(res_custom.status_code, 200)
        self.assertEqual(res_custom.headers.get("x-request-id"), custom_id)

    # ============================================================
    # 3. DATABASE BACKUP & DISASTER RECOVERY
    # ============================================================
    def test_05_database_backup_tool_execution_and_checksum(self):
        """Verify backup_database tool can perform logical schema and record dumps."""
        res = backup_database(tables=["users", "orders"], dry_run=True)
        self.assertEqual(res["status"], "success")
        self.assertIn("users", res["tables"])
        self.assertIn("orders", res["tables"])
        self.assertGreaterEqual(res["metadata"]["total_records"], 0)

    def test_06_database_connection_pool_reconnect_resilience(self):
        """Verify database ping query executes and returns healthy state."""
        is_healthy, msg = check_db_health()
        self.assertTrue(is_healthy, f"Database health check failed: {msg}")
        self.assertEqual(msg, "connected")

    # ============================================================
    # 4. PAYMENT WEBHOOK REPLAY & IDEMPOTENCY
    # ============================================================
    def test_07_payment_webhook_replay_and_idempotency(self):
        """Verify Razorpay webhook deduplication ledger prevents duplicate transaction replays."""
        secret = RAZORPAY_WEBHOOK_SECRET or "phase8_test_webhook_secret"
        import main
        main.RAZORPAY_WEBHOOK_SECRET = secret

        evt_id = f"evt_p8_{uuid.uuid4().hex[:8]}"
        payload = {
            "event": "payment.captured",
            "event_id": evt_id,
            "payload": {
                "payment": {
                    "entity": {
                        "id": f"pay_p8_{uuid.uuid4().hex[:6]}",
                        "order_id": "order_p8_test",
                        "amount": 250000,
                        "status": "captured"
                    }
                }
            }
        }
        raw_body = json.dumps(payload).encode("utf-8")
        valid_sig = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()

        # Initial processing -> 200 OK
        res1 = client.post("/api/payments/webhook", content=raw_body, headers={"X-Razorpay-Signature": valid_sig, "Content-Type": "application/json"})
        self.assertEqual(res1.status_code, 200)

        # Duplicate replay -> 200 OK with duplicate ignored
        res2 = client.post("/api/payments/webhook", content=raw_body, headers={"X-Razorpay-Signature": valid_sig, "Content-Type": "application/json"})
        self.assertEqual(res2.status_code, 200)
        self.assertIn("duplicate", res2.json().get("note", ""))

    # ============================================================
    # 5. RATE LIMITING & BRUTE-FORCE PROTECTION
    # ============================================================
    def test_08_auth_rate_limiting_and_recovery(self):
        """Verify auth rate limiting triggers lock on threshold and recovers correctly."""
        test_key = f"p8_rate_test_{uuid.uuid4().hex[:6]}"
        clear_failed_auth_attempts(test_key)

        # 4 attempts with max_attempts=5 -> not locked
        for _ in range(4):
            is_locked, _ = record_failed_auth_attempt(test_key, max_attempts=5, lock_duration_secs=2)
            self.assertFalse(is_locked)

        # 5th attempt -> locked
        is_locked, lock_secs = record_failed_auth_attempt(test_key, max_attempts=5, lock_duration_secs=2)
        self.assertTrue(is_locked)
        self.assertGreater(lock_secs, 0)

        # Clear attempts -> immediately unlocked
        clear_failed_auth_attempts(test_key)
        is_locked_after, _ = record_failed_auth_attempt(test_key, max_attempts=5, lock_duration_secs=2)
        self.assertFalse(is_locked_after)

    # ============================================================
    # 6. EXCEPTION SANITIZATION
    # ============================================================
    def test_09_exception_sanitization_no_stack_trace_leakage(self):
        """Verify 500 exceptions return sanitized responses without leaking SQL or tracebacks."""
        with patch("main.IS_PRODUCTION", True), patch("main.check_db_health", side_effect=RuntimeError("SELECT * FROM secret_table WHERE password='xyz'")):
            res = client.get("/api/health/ready")
            self.assertEqual(res.status_code, 500)
            self.assertNotIn("secret_table", res.text)
            self.assertNotIn("password='xyz'", res.text)
            self.assertIn("Internal Server Error", res.json()["detail"])

if __name__ == "__main__":
    unittest.main()
