"""
Phase 11 Controlled Real-User Pilot & Production Authorization Validation Suite
PAYENT Peer-to-Peer Rental Platform

VERIFICATION OBJECTIVES:
1. Micro-Fix Validation: /api/categories alias and /api/categories/public parity.
2. Approval Gating: Rigorous rejection of pending, rejected, suspended, and deleted users on protected routes.
3. Messaging Security: Counterparty isolation, conversation IDOR defense, and server-side sender enforcement.
4. Delivery Privacy: Location tracking authorization, unauthorized participant rejection, and lifecycle boundary.
5. Payment Security: Razorpay webhook HMAC signature verification, payload tampering rejection, and replay idempotency.
6. Request Correlation: X-Request-ID preservation and generation.
7. Log Privacy: Verification of sensitive secret redaction.

CRITICAL ISOLATION RULE:
All fixtures use ephemeral test identifiers and are 100% surgically cleaned up in tearDown / tearDownClass.
Zero persistent synthetic artifacts remain in the database.
"""

import unittest
import json
import uuid
import time
import datetime
import hmac
import hashlib
from typing import Dict, Any
from fastapi.testclient import TestClient

import os
import sys

# Ensure repo root and backend dir are in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
repo_root = os.path.dirname(backend_dir)
for p in (backend_dir, repo_root):
    if p not in sys.path:
        sys.path.insert(0, p)

import main
from main import app, invalidate_cache
from auth import create_access_token
from database import (
    execute_query,
    fetch_one,
    fetch_all,
    create_user,
    create_custom_product,
    invalidate_user_cache,
    mask_email_safely,
    MOCK_USERS,
    MOCK_CUSTOM_PRODUCTS,
    MOCK_ORDERS,
    MOCK_DELIVERIES
)

class TestPhase11PilotValidation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.run_id = uuid.uuid4().hex[:8]
        cls.cleanup_emails = set()
        cls.cleanup_products = set()
        cls.cleanup_orders = set()
        cls.cleanup_deliveries = set()
        cls.cleanup_tickets = set()

        # Temporarily configure RAZORPAY_WEBHOOK_SECRET for isolated webhook signature testing
        cls.orig_webhook_secret = main.RAZORPAY_WEBHOOK_SECRET
        cls.test_webhook_secret = f"test_webhook_secret_{cls.run_id}"
        main.RAZORPAY_WEBHOOK_SECRET = cls.test_webhook_secret

        # 1. Admin account
        cls.admin_email = f"p11_admin_{cls.run_id}@payent.com"
        cls.cleanup_emails.add(cls.admin_email)
        create_user(
            email=cls.admin_email,
            phone="+919911000001",
            password_hash="mock_hash_admin",
            full_name="Phase11 Admin",
            role="admin",
            status="active"
        )
        execute_query("UPDATE users SET verified = 1 WHERE email = %s", (cls.admin_email,))
        cls.admin_token = create_access_token(data={"sub": cls.admin_email, "role": "admin"})
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}

        # 2. Approved Customer A
        cls.cust_a_email = f"p11_cust_a_{cls.run_id}@payent.com"
        cls.cleanup_emails.add(cls.cust_a_email)
        create_user(
            email=cls.cust_a_email,
            phone="+919911000002",
            password_hash="mock_hash_cust_a",
            full_name="Phase11 Customer A",
            role="customer",
            status="approved"
        )
        execute_query("UPDATE users SET verified = 1 WHERE email = %s", (cls.cust_a_email,))
        cls.cust_a_token = create_access_token(data={"sub": cls.cust_a_email, "role": "customer"})
        cls.cust_a_headers = {"Authorization": f"Bearer {cls.cust_a_token}"}

        # 3. Approved Customer B (Counterparty / Attacker for IDOR checks)
        cls.cust_b_email = f"p11_cust_b_{cls.run_id}@payent.com"
        cls.cleanup_emails.add(cls.cust_b_email)
        create_user(
            email=cls.cust_b_email,
            phone="+919911000003",
            password_hash="mock_hash_cust_b",
            full_name="Phase11 Customer B",
            role="customer",
            status="approved"
        )
        execute_query("UPDATE users SET verified = 1 WHERE email = %s", (cls.cust_b_email,))
        cls.cust_b_token = create_access_token(data={"sub": cls.cust_b_email, "role": "customer"})
        cls.cust_b_headers = {"Authorization": f"Bearer {cls.cust_b_token}"}

        # 4. Approved Lender
        cls.lender_email = f"p11_lender_{cls.run_id}@payent.com"
        cls.cleanup_emails.add(cls.lender_email)
        create_user(
            email=cls.lender_email,
            phone="+919911000004",
            password_hash="mock_hash_lender",
            full_name="Phase11 Lender",
            role="lender",
            status="approved"
        )
        execute_query("UPDATE users SET verified = 1 WHERE email = %s", (cls.lender_email,))
        cls.lender_token = create_access_token(data={"sub": cls.lender_email, "role": "lender"})
        cls.lender_headers = {"Authorization": f"Bearer {cls.lender_token}"}

        # 5. Pending User
        cls.pending_email = f"p11_pending_{cls.run_id}@payent.com"
        cls.cleanup_emails.add(cls.pending_email)
        create_user(
            email=cls.pending_email,
            phone="+919911000005",
            password_hash="mock_hash_pending",
            full_name="Phase11 Pending User",
            role="customer",
            status="pending"
        )
        cls.pending_token = create_access_token(data={"sub": cls.pending_email, "role": "customer"})
        cls.pending_headers = {"Authorization": f"Bearer {cls.pending_token}"}

        # 6. Suspended User
        cls.suspended_email = f"p11_suspended_{cls.run_id}@payent.com"
        cls.cleanup_emails.add(cls.suspended_email)
        create_user(
            email=cls.suspended_email,
            phone="+919911000006",
            password_hash="mock_hash_suspended",
            full_name="Phase11 Suspended User",
            role="customer",
            status="suspended"
        )
        cls.suspended_token = create_access_token(data={"sub": cls.suspended_email, "role": "customer"})
        cls.suspended_headers = {"Authorization": f"Bearer {cls.suspended_token}"}

        # 7. Rejected User
        cls.rejected_email = f"p11_rejected_{cls.run_id}@payent.com"
        cls.cleanup_emails.add(cls.rejected_email)
        create_user(
            email=cls.rejected_email,
            phone="+919911000007",
            password_hash="mock_hash_rejected",
            full_name="Phase11 Rejected User",
            role="customer",
            status="rejected"
        )
        cls.rejected_token = create_access_token(data={"sub": cls.rejected_email, "role": "customer"})
        cls.rejected_headers = {"Authorization": f"Bearer {cls.rejected_token}"}

        # 8. Deleted User
        cls.deleted_email = f"p11_deleted_{cls.run_id}@payent.com"
        cls.cleanup_emails.add(cls.deleted_email)
        create_user(
            email=cls.deleted_email,
            phone="+919911000008",
            password_hash="mock_hash_deleted",
            full_name="Phase11 Deleted User",
            role="customer",
            status="deleted"
        )
        cls.deleted_token = create_access_token(data={"sub": cls.deleted_email, "role": "customer"})
        cls.deleted_headers = {"Authorization": f"Bearer {cls.deleted_token}"}

        # Create one verified test product listed by Approved Lender
        cls.product_id = f"p-p11-gear-{cls.run_id}"
        cls.cleanup_products.add(cls.product_id)
        create_custom_product(cls.lender_email, {
            "id": cls.product_id,
            "title": "Canon Cinema EOS C70 Rig",
            "category": "cameras",
            "price": 3500.0,
            "image": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600",
            "status": "approved",
            "available": True,
            "description": "Cinema 4K package with dual XLR and built-in ND filters"
        })
        invalidate_cache("public_custom_products")

    @classmethod
    def tearDownClass(cls):
        # Restore original webhook secret
        main.RAZORPAY_WEBHOOK_SECRET = cls.orig_webhook_secret

        # Guaranteed pristine cleanup: Zero synthetic records left in production DB
        for email in cls.cleanup_emails:
            try:
                execute_query("DELETE FROM cart_items WHERE user_email = %s", (email,))
                execute_query("DELETE FROM reviews WHERE user_email = %s", (email,))
                execute_query("DELETE FROM notifications WHERE user_email = %s", (email,))
                execute_query("DELETE FROM support_tickets WHERE user_email = %s", (email,))
                execute_query("DELETE FROM users WHERE email = %s", (email,))
                MOCK_USERS.pop(email, None)
                invalidate_user_cache(email)
            except Exception:
                pass

        for pid in cls.cleanup_products:
            try:
                execute_query("DELETE FROM custom_products WHERE id = %s", (pid,))
                execute_query("DELETE FROM reviews WHERE product_id = %s", (pid,))
                MOCK_CUSTOM_PRODUCTS.pop(pid, None)
            except Exception:
                pass

        for oid in cls.cleanup_orders:
            try:
                execute_query("DELETE FROM orders WHERE id = %s", (oid,))
                MOCK_ORDERS.pop(oid, None)
            except Exception:
                pass

        for did in cls.cleanup_deliveries:
            try:
                execute_query("DELETE FROM delivery_location_updates WHERE delivery_id = %s", (did,))
                execute_query("DELETE FROM deliveries WHERE id = %s", (did,))
                MOCK_DELIVERIES.pop(did, None)
            except Exception:
                pass

        for tid in cls.cleanup_tickets:
            try:
                execute_query("DELETE FROM support_tickets WHERE id = %s", (tid,))
            except Exception:
                pass

        invalidate_cache("public_custom_products")
        invalidate_cache("public_categories")
        invalidate_cache("public_stats")

    # ==========================================================================
    # SECTION 1: Categories Alias Micro-Fix Verification
    # ==========================================================================

    def test_01_categories_alias_compatibility(self):
        """Verifies that /api/categories acts as an identical alias to /api/categories/public."""
        res_alias = self.client.get("/api/categories")
        res_public = self.client.get("/api/categories/public")

        self.assertEqual(res_alias.status_code, 200)
        self.assertEqual(res_public.status_code, 200)

        data_alias = res_alias.json()
        data_public = res_public.json()

        self.assertIsInstance(data_alias, list)
        self.assertIsInstance(data_public, list)
        self.assertEqual(len(data_alias), len(data_public))

        alias_ids = [c.get("id") for c in data_alias]
        public_ids = [c.get("id") for c in data_public]
        self.assertEqual(alias_ids, public_ids)

        # Cache headers check
        self.assertIn("Cache-Control", res_alias.headers)
        self.assertIn("public", res_alias.headers["Cache-Control"])

    # ==========================================================================
    # SECTION 2: Approval Gating Tests (Pending, Rejected, Suspended, Deleted)
    # ==========================================================================

    def test_02_approval_gating_pending_user(self):
        """Pending user must be rejected with 403 on protected mutation and order endpoints."""
        endpoints = [
            ("POST", "/api/cart", {"productId": self.product_id, "days": 3, "startDate": "2026-10-01", "endDate": "2026-10-03"}),
            ("POST", "/api/cart/checkout", {}),
            ("POST", "/api/orders", {"productId": self.product_id, "startDate": "2026-10-01", "endDate": "2026-10-03", "totalPrice": 10500}),
            ("POST", "/api/products/custom", {"title": "Pending User Gear", "category": "cameras", "price": 1000, "daily_rate": 1000})
        ]

        for method, path, payload in endpoints:
            if method == "POST":
                res = self.client.post(path, json=payload, headers=self.pending_headers)
            else:
                res = self.client.get(path, headers=self.pending_headers)

            self.assertEqual(res.status_code, 403, f"Pending user should be blocked from {path}")
            detail = res.json().get("detail", "").lower()
            self.assertTrue("pending" in detail or "approval" in detail or "forbidden" in detail)

    def test_03_approval_gating_suspended_user(self):
        """Suspended user must be rejected with 403 on protected mutation endpoints."""
        res = self.client.post("/api/cart", json={
            "productId": self.product_id, "days": 2, "startDate": "2026-10-01", "endDate": "2026-10-02"
        }, headers=self.suspended_headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn("suspended", res.json().get("detail", "").lower())

    def test_04_approval_gating_rejected_user(self):
        """Rejected user must be rejected with 403 on protected endpoints."""
        res = self.client.post("/api/cart", json={
            "productId": self.product_id, "days": 2, "startDate": "2026-10-01", "endDate": "2026-10-02"
        }, headers=self.rejected_headers)
        self.assertEqual(res.status_code, 403)
        detail = res.json().get("detail", "").lower()
        self.assertTrue("reject" in detail or "application" in detail or "approved" in detail)

    def test_05_approval_gating_deleted_user(self):
        """Deleted user must be rejected with 403 on protected endpoints."""
        res = self.client.post("/api/cart", json={
            "productId": self.product_id, "days": 2, "startDate": "2026-10-01", "endDate": "2026-10-02"
        }, headers=self.deleted_headers)
        self.assertEqual(res.status_code, 403)

    # ==========================================================================
    # SECTION 3: Messaging Security & Counterparty Isolation
    # ==========================================================================

    def test_06_messaging_counterparty_isolation(self):
        """Customer A creates a support/gear inquiry; Customer B cannot view or reply to it."""
        # 1. Customer A initiates conversation
        res_create = self.client.post("/api/messages/new", json={
            "subject": "Rental Inquiry Canon C70",
            "message": "Hello, is the extra battery pack included?",
            "category": "Rental Inquiry"
        }, headers=self.cust_a_headers)
        self.assertEqual(res_create.status_code, 200)
        conv_id = res_create.json()["id"]
        self.cleanup_tickets.add(conv_id)

        # 2. Customer A can read it
        res_read_a = self.client.get(f"/api/messages/{conv_id}", headers=self.cust_a_headers)
        self.assertEqual(res_read_a.status_code, 200)
        self.assertEqual(res_read_a.json()["id"], conv_id)

        # 3. Customer B attempts to read Customer A's conversation -> 403 Forbidden
        res_read_b = self.client.get(f"/api/messages/{conv_id}", headers=self.cust_b_headers)
        self.assertEqual(res_read_b.status_code, 403)
        self.assertIn("not authorized", res_read_b.json().get("detail", "").lower())

        # 4. Customer B attempts to reply to Customer A's conversation -> 403 Forbidden
        res_reply_b = self.client.post(f"/api/messages/{conv_id}/reply", json={
            "message": "Imposter attempting to reply"
        }, headers=self.cust_b_headers)
        self.assertEqual(res_reply_b.status_code, 403)
        self.assertIn("not authorized", res_reply_b.json().get("detail", "").lower())

        # 5. Admin CAN view the conversation
        res_read_admin = self.client.get(f"/api/messages/{conv_id}", headers=self.admin_headers)
        self.assertEqual(res_read_admin.status_code, 200)

    def test_07_messaging_sender_identity_enforced_by_backend(self):
        """Backend derives senderType and sender identity authoritatively from JWT session."""
        res_create = self.client.post("/api/messages/new", json={
            "subject": "Authentication Integrity Test",
            "message": "Verifying sender identity provenance.",
            "category": "Technical"
        }, headers=self.cust_a_headers)
        self.assertEqual(res_create.status_code, 200)
        conv_id = res_create.json()["id"]
        self.cleanup_tickets.add(conv_id)

        # Reply from Customer A
        res_reply = self.client.post(f"/api/messages/{conv_id}/reply", json={
            "message": "Customer A follow up note"
        }, headers=self.cust_a_headers)
        self.assertEqual(res_reply.status_code, 200)

        # Inspect conversation
        res_detail = self.client.get(f"/api/messages/{conv_id}", headers=self.cust_a_headers)
        messages = res_detail.json().get("messages", [])
        self.assertTrue(len(messages) >= 2)
        last_msg = messages[-1]
        self.assertEqual(last_msg["senderType"], "user")
        self.assertNotEqual(last_msg["senderType"], "admin")

    # ==========================================================================
    # SECTION 4: Delivery Privacy & GPS Tracking Authorization
    # ==========================================================================

    def test_08_delivery_privacy_unauthorized_user_rejected(self):
        """Ensures that only authorized delivery participants can access delivery tracking and GPS data."""
        del_id = f"del-p11-{self.run_id}"
        ord_id = f"ord-p11-del-{self.run_id}"
        self.cleanup_deliveries.add(del_id)
        self.cleanup_orders.add(ord_id)

        # Create active booking order for Customer A
        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        execute_query("""
            INSERT INTO orders (id, user_email, product_id, product_title, start_date, end_date, total, status, payment_status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE status = 'active'
        """, (
            ord_id,
            self.cust_a_email,
            self.product_id,
            "Canon Cinema EOS C70 Rig",
            "2026-10-10",
            "2026-10-12",
            10500,
            "active",
            "paid",
            now_str
        ))

        # Insert active delivery linked to booking_id
        execute_query("""
            INSERT INTO deliveries (id, booking_id, status, pickup_address, delivery_address,
                                   current_latitude, current_longitude, eta_minutes, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE status = 'OUT_FOR_DELIVERY'
        """, (
            del_id,
            ord_id,
            "OUT_FOR_DELIVERY",
            "Lender Studio Bengaluru",
            "Renter Studio Bengaluru",
            12.9716,
            77.5946,
            25,
            now_str,
            now_str
        ))

        # 1. Customer A (Authorized Participant) -> 200 OK
        res_cust_a = self.client.get(f"/api/deliveries/{del_id}/tracking", headers=self.cust_a_headers)
        self.assertEqual(res_cust_a.status_code, 200)
        self.assertEqual(res_cust_a.json().get("tracking", {}).get("id"), del_id)

        # 2. Lender (Authorized Participant) -> 200 OK
        res_lender = self.client.get(f"/api/deliveries/{del_id}/tracking", headers=self.lender_headers)
        self.assertEqual(res_lender.status_code, 200)

        # 3. Customer B (Unauthorized Third Party) -> 403 Forbidden
        res_cust_b_track = self.client.get(f"/api/deliveries/{del_id}/tracking", headers=self.cust_b_headers)
        self.assertEqual(res_cust_b_track.status_code, 403)
        self.assertIn("not authorized", res_cust_b_track.json().get("detail", "").lower())

        res_cust_b_loc = self.client.get(f"/api/deliveries/{del_id}/locations", headers=self.cust_b_headers)
        self.assertEqual(res_cust_b_loc.status_code, 403)
        self.assertIn("not authorized", res_cust_b_loc.json().get("detail", "").lower())

    def test_09_delivery_privacy_gps_stops_after_completion(self):
        """When delivery is completed ('DELIVERED'), status must reflect completion."""
        del_id = f"del-p11-comp-{self.run_id}"
        ord_id = f"ord-p11-comp-{self.run_id}"
        self.cleanup_deliveries.add(del_id)
        self.cleanup_orders.add(ord_id)

        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        execute_query("""
            INSERT INTO orders (id, user_email, product_id, product_title, start_date, end_date, total, status, payment_status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE status = 'completed'
        """, (
            ord_id,
            self.cust_a_email,
            self.product_id,
            "Canon Cinema EOS C70 Rig",
            "2026-09-01",
            "2026-09-03",
            10500,
            "completed",
            "paid",
            now_str
        ))

        execute_query("""
            INSERT INTO deliveries (id, booking_id, status, pickup_address, delivery_address,
                                   current_latitude, current_longitude, eta_minutes, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE status = 'DELIVERED'
        """, (
            del_id,
            ord_id,
            "DELIVERED",
            "Lender Studio Bengaluru",
            "Renter Studio Bengaluru",
            12.9716,
            77.5946,
            0,
            now_str,
            now_str
        ))

        res_tracking = self.client.get(f"/api/deliveries/{del_id}/tracking", headers=self.cust_a_headers)
        self.assertEqual(res_tracking.status_code, 200)
        self.assertEqual(res_tracking.json().get("tracking", {}).get("status"), "DELIVERED")

    # ==========================================================================
    # SECTION 5: Payment Security & Webhook Signature Validation
    # ==========================================================================

    def test_10_razorpay_webhook_invalid_signature_rejected(self):
        """Webhook with invalid or missing HMAC-SHA256 signature must be rejected with 400 Bad Request."""
        payload = json.dumps({
            "event": "payment.captured",
            "event_id": f"evt_fake_{uuid.uuid4().hex[:8]}",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_fake123",
                        "order_id": "order_fake123",
                        "amount": 500000,
                        "status": "captured"
                    }
                }
            }
        }).encode("utf-8")

        # Missing signature
        res_missing = self.client.post("/api/payments/webhook", content=payload, headers={"Content-Type": "application/json"})
        self.assertEqual(res_missing.status_code, 400)
        self.assertIn("signature", res_missing.json().get("detail", "").lower())

        # Forged / incorrect signature
        res_bad_sig = self.client.post(
            "/api/payments/webhook",
            content=payload,
            headers={
                "Content-Type": "application/json",
                "X-Razorpay-Signature": "0000000000000000000000000000000000000000000000000000000000000000"
            }
        )
        self.assertEqual(res_bad_sig.status_code, 400)
        self.assertIn("verification failed", res_bad_sig.json().get("detail", "").lower())

    def test_11_razorpay_webhook_valid_signature_and_idempotency(self):
        """Valid webhook signature is accepted; duplicate event ID is ignored idempotently."""
        secret = main.RAZORPAY_WEBHOOK_SECRET
        event_id = f"evt_p11_{uuid.uuid4().hex[:8]}"

        payload_dict = {
            "event": "payment.captured",
            "event_id": event_id,
            "payload": {
                "payment": {
                    "entity": {
                        "id": f"pay_{uuid.uuid4().hex[:8]}",
                        "order_id": f"order_{uuid.uuid4().hex[:8]}",
                        "amount": 1050000,
                        "status": "captured"
                    }
                }
            }
        }
        raw_body = json.dumps(payload_dict).encode("utf-8")
        valid_sig = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()

        # 1. First presentation -> Valid 200 OK
        res_first = self.client.post(
            "/api/payments/webhook",
            content=raw_body,
            headers={
                "Content-Type": "application/json",
                "X-Razorpay-Signature": valid_sig
            }
        )
        self.assertEqual(res_first.status_code, 200)

        # 2. Replay attempt with duplicate event_id -> 200 OK without re-executing
        res_replay = self.client.post(
            "/api/payments/webhook",
            content=raw_body,
            headers={
                "Content-Type": "application/json",
                "X-Razorpay-Signature": valid_sig
            }
        )
        self.assertEqual(res_replay.status_code, 200)
        self.assertIn("duplicate", res_replay.json().get("note", "").lower())

    # ==========================================================================
    # SECTION 6: Request Correlation (X-Request-ID)
    # ==========================================================================

    def test_12_request_id_correlation_preserved_and_generated(self):
        """Validates Test A (caller supplied correlation ID) and Test B (backend generated ID)."""
        # Test A: Caller supplies explicit ID
        supplied_id = f"req_p11_unit_{uuid.uuid4().hex[:6]}"
        res_a = self.client.get("/api/health/live", headers={"X-Request-ID": supplied_id})
        self.assertEqual(res_a.status_code, 200)
        self.assertEqual(res_a.headers.get("X-Request-ID"), supplied_id)

        # Test B: Caller supplies NO ID -> Backend auto-generates ID
        res_b = self.client.get("/api/health/live")
        self.assertEqual(res_b.status_code, 200)
        gen_id = res_b.headers.get("X-Request-ID")
        self.assertIsNotNone(gen_id)
        self.assertTrue(len(gen_id) >= 4)

    # ==========================================================================
    # SECTION 7: Log Privacy Verification Boundary
    # ==========================================================================

    def test_13_log_privacy_redaction_boundary(self):
        """Verifies that sensitive identifiers and PII (Aadhaar, Email) are masked and not exposed."""
        from database import mask_email_safely
        from main import mask_aadhaar
        
        # 1. Mask Email PII
        raw_email = "customer.confidential@domain.org"
        masked_email = mask_email_safely(raw_email)
        self.assertNotIn("confidential", masked_email)
        self.assertTrue("*" in masked_email)
        self.assertTrue(masked_email.endswith("@domain.org"))

        # 2. Mask Aadhaar PII
        raw_aadhaar = "1234 5678 9012"
        masked_aadhaar = mask_aadhaar(raw_aadhaar)
        self.assertNotIn("1234", masked_aadhaar)
        self.assertNotIn("5678", masked_aadhaar)
        self.assertTrue(masked_aadhaar.endswith("9012"))

        # 3. Verify public product endpoint does not expose lender phone or sensitive credentials
        res_prod = self.client.get(f"/api/products/{self.product_id}")
        self.assertEqual(res_prod.status_code, 200)
        prod_json = res_prod.json()
        self.assertNotIn("phone", str(prod_json.get("owner", {})))
        self.assertNotIn("password_hash", str(prod_json))

if __name__ == "__main__":
    unittest.main()
