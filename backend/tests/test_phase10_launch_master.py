import unittest
import json
import uuid
import time
import datetime
from typing import Dict
from fastapi.testclient import TestClient

import os
import sys

# Ensure repo root and backend dir are in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
repo_root = os.path.dirname(backend_dir)
for p in (backend_dir, repo_root):
    if p not in sys.path:
        sys.path.insert(0, p)

from main import app, invalidate_cache
from auth import create_access_token
from database import (
    execute_query,
    fetch_one,
    fetch_all,
    clear_user_cart,
    create_user,
    invalidate_user_cache,
    mask_email_safely,
    MOCK_USERS,
    MOCK_CUSTOM_PRODUCTS,
    MOCK_ORDERS,
    MOCK_DELIVERIES
)

class TestPhase10LaunchMaster(unittest.TestCase):
    """
    PAYENT Phase 10 Master Launch Readiness & Product Validation Test Suite
    Tests the 22 comprehensive validation vectors across Customer, Lender, Admin,
    Edge-Cases, Privacy Redaction, Lifecycle, and Integrity.
    """

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.run_id = uuid.uuid4().hex[:8]

        # 1. Admin account
        cls.admin_email = f"p10_admin_{cls.run_id}@payent.com"
        cls.admin_token = create_access_token(data={"sub": cls.admin_email, "role": "admin"})
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}
        create_user(
            email=cls.admin_email,
            phone="+919900000001",
            password_hash="mock_hash_admin",
            full_name="Phase10 Master Admin",
            role="admin",
            status="active"
        )
        execute_query("UPDATE users SET verified = 1 WHERE email = %s", (cls.admin_email,))

        # 2. Approved Lender account
        cls.lender_email = f"p10_lender_{cls.run_id}@payent.com"
        cls.lender_token = create_access_token(data={"sub": cls.lender_email, "role": "user"})
        cls.lender_headers = {"Authorization": f"Bearer {cls.lender_token}"}
        create_user(
            email=cls.lender_email,
            phone="+919900000002",
            password_hash="mock_hash_lender",
            full_name="Phase10 Pro Lender",
            role="user",
            status="approved"
        )
        execute_query("""
            UPDATE users SET verified = 1, address = '123 Private Lender Sanctuary', 
                             city = 'Bengaluru', state = 'Karnataka', pincode = '560001' 
            WHERE email = %s
        """, (cls.lender_email,))

        # 3. Approved Customer account
        cls.cust_email = f"p10_cust_{cls.run_id}@example.com"
        cls.cust_token = create_access_token(data={"sub": cls.cust_email, "role": "user"})
        cls.cust_headers = {"Authorization": f"Bearer {cls.cust_token}"}
        create_user(
            email=cls.cust_email,
            phone="+919900000003",
            password_hash="mock_hash_cust",
            full_name="Phase10 Happy Renter",
            role="user",
            status="approved"
        )
        execute_query("UPDATE users SET verified = 1 WHERE email = %s", (cls.cust_email,))

        # 4. Pending Customer account
        cls.pending_email = f"p10_pending_{cls.run_id}@example.com"
        cls.pending_token = create_access_token(data={"sub": cls.pending_email, "role": "user"})
        cls.pending_headers = {"Authorization": f"Bearer {cls.pending_token}"}
        create_user(
            email=cls.pending_email,
            phone="+919900000004",
            password_hash="mock_hash_pending",
            full_name="Phase10 Pending User",
            role="user",
            status="pending"
        )

        # 5. Rejected User account
        cls.rejected_email = f"p10_rejected_{cls.run_id}@example.com"
        cls.rejected_token = create_access_token(data={"sub": cls.rejected_email, "role": "user"})
        cls.rejected_headers = {"Authorization": f"Bearer {cls.rejected_token}"}
        create_user(
            email=cls.rejected_email,
            phone="+919900000005",
            password_hash="mock_hash_rejected",
            full_name="Phase10 Rejected User",
            role="user",
            status="rejected"
        )

        # 6. Seed an approved gear listing for testing (valid schema columns)
        cls.product_id = f"p-p10-gear-{cls.run_id}"
        execute_query("""
            INSERT INTO custom_products (id, user_email, title, description, category, price, 
                                        status, available, image, created_at, owner_name)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE status = 'approved', available = TRUE, owner_name = 'Phase10 Pro Lender'
        """, (
            cls.product_id,
            cls.lender_email,
            "Sony FX3 Cinema Camera Kit (Phase 10)",
            "Professional cinema camera with 24-70mm GM II lens.",
            "Cameras",
            4500,
            "approved",
            True,
            "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600",
            datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "Phase10 Pro Lender"
        ))
        invalidate_cache("public_custom_products")
        invalidate_cache(f"product:{cls.product_id}")

    @classmethod
    def tearDownClass(cls):
        # Ephemeral data cleanup
        test_emails = (
            cls.admin_email, cls.lender_email, cls.cust_email,
            cls.pending_email, cls.rejected_email
        )
        for em in test_emails:
            clear_user_cart(em)
            execute_query("DELETE FROM orders WHERE LOWER(user_email) = %s", (em.lower(),))
            execute_query("DELETE FROM reviews WHERE LOWER(user_email) = %s", (em.lower(),))
            execute_query("DELETE FROM notifications WHERE LOWER(user_email) = %s", (em.lower(),))
            execute_query("DELETE FROM users WHERE LOWER(email) = %s", (em.lower(),))

        execute_query("DELETE FROM custom_products WHERE id = %s", (cls.product_id,))

    # ==========================================================================
    # SECTION 1 & 4: User Approval Lifecycle & Access Gates
    # ==========================================================================

    def test_01_pending_user_blocked_from_adding_to_cart(self):
        """Pending users must be blocked from adding items to cart (403 Forbidden)."""
        res = self.client.post("/api/cart", json={
            "product_id": self.product_id,
            "start_date": "2026-10-10",
            "end_date": "2026-10-14"
        }, headers=self.pending_headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn("pending", res.json().get("detail", "").lower())

    def test_02_pending_user_blocked_from_creating_listing(self):
        """Pending users must be blocked from listing custom gear (403 Forbidden)."""
        res = self.client.post("/api/products/custom", json={
            "title": "Pending User Unauthorized Drone",
            "category": "Drones",
            "price": 2000,
            "description": "Should fail",
            "image": "https://example.com/drone.jpg",
            "city": "Bengaluru",
            "state": "Karnataka"
        }, headers=self.pending_headers)
        self.assertEqual(res.status_code, 403)

    def test_03_pending_user_allowed_to_view_catalog_and_status(self):
        """Pending users can view public catalog and check their account status."""
        res_status = self.client.get("/api/auth/status", headers=self.pending_headers)
        self.assertEqual(res_status.status_code, 200)
        self.assertEqual(res_status.json().get("status"), "pending")

        # Check public catalog
        res_cat = self.client.get("/api/products/custom/public")
        self.assertEqual(res_cat.status_code, 200)

    def test_04_rejected_user_blocked_from_cart_and_checkout(self):
        """Rejected users must be blocked with 403 Forbidden."""
        res = self.client.post("/api/cart", json={
            "product_id": self.product_id,
            "start_date": "2026-10-10",
            "end_date": "2026-10-14"
        }, headers=self.rejected_headers)
        self.assertEqual(res.status_code, 403)

    def test_05_admin_approves_user_and_invalidates_cache(self):
        """Admin approving user grants access and dispatches notification."""
        res = self.client.post(f"/api/admin/users/{self.pending_email}/approve", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["user"]["status"], "approved")

        # Verify user can now access status as approved
        res_status = self.client.get("/api/auth/status", headers=self.pending_headers)
        self.assertEqual(res_status.status_code, 200)
        self.assertTrue(res_status.json().get("is_approved"))

        # Revert back to pending for other tests
        execute_query("UPDATE users SET status = 'pending', verified = 0 WHERE email = %s", (self.pending_email,))
        invalidate_user_cache(self.pending_email)

    # ==========================================================================
    # SECTION 5: Product Privacy & Lender Residence Redaction
    # ==========================================================================

    def test_06_public_catalog_redacts_lender_private_details(self):
        """Public catalog (GET /api/products/custom/public) must redact lender address, pincode, and email."""
        invalidate_cache("public_custom_products")
        res = self.client.get("/api/products/custom/public")
        self.assertEqual(res.status_code, 200)
        items = res.json()
        target_item = next((p for p in items if p.get("id") == self.product_id), None)
        self.assertIsNotNone(target_item, "Product should be present in public catalog.")
        
        owner = target_item.get("owner", {})
        self.assertIsNone(owner.get("address"), "Lender private street address must be redacted from public catalog.")
        self.assertIsNone(owner.get("pincode"), "Lender pincode must be redacted from public catalog.")
        self.assertIsNone(owner.get("email"), "Lender private email must be redacted from public catalog.")
        self.assertEqual(owner.get("city"), "Bengaluru")
        self.assertEqual(owner.get("name"), "Phase10 Pro Lender")

    def test_07_public_product_detail_redacts_lender_private_details(self):
        """Public product detail (GET /api/products/{id}) must redact lender address, pincode, and email."""
        invalidate_cache(f"product:{self.product_id}")
        res = self.client.get(f"/api/products/{self.product_id}")
        self.assertEqual(res.status_code, 200)
        owner = res.json().get("owner", {})
        self.assertIsNone(owner.get("address"), "Lender private address must be redacted in detail view.")
        self.assertIsNone(owner.get("pincode"), "Lender pincode must be redacted in detail view.")
        self.assertIsNone(owner.get("email"), "Lender email must be redacted in detail view.")

    def test_08_deleted_lender_product_becomes_unavailable(self):
        """If a lender account is deleted, evaluate_product_availability marks product unavailable."""
        ephem_lender = f"ephem_lender_{uuid.uuid4().hex[:6]}@example.com"
        ephem_pid = f"p-ephem-{uuid.uuid4().hex[:6]}"
        execute_query("""
            INSERT INTO custom_products (id, user_email, title, category, price, status, available, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (ephem_pid, ephem_lender, "Orphaned Gear", "Audio", 1000, "approved", True, datetime.datetime.now(datetime.timezone.utc).isoformat()))

        res = self.client.get(f"/api/products/{ephem_pid}")
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.json().get("available"))
        self.assertEqual(res.json().get("availability_status"), "deleted")

        execute_query("DELETE FROM custom_products WHERE id = %s", (ephem_pid,))

    # ==========================================================================
    # SECTION 6: Cart Validation & Date Boundary Edge Cases
    # ==========================================================================

    def test_09_cart_rejects_empty_checkout(self):
        """Checkout on an empty cart must be rejected with 400 Bad Request."""
        clear_user_cart(self.cust_email)
        res = self.client.post("/api/cart/checkout", headers=self.cust_headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("cart is empty", res.json().get("detail", "").lower())

    def test_10_cart_rejects_past_dates(self):
        """Adding to cart with past dates must be rejected with 400 Bad Request."""
        res = self.client.post("/api/cart", json={
            "product_id": self.product_id,
            "start_date": "2020-01-01",
            "end_date": "2020-01-05"
        }, headers=self.cust_headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("past", res.json().get("detail", "").lower())

    def test_11_cart_rejects_inverted_dates(self):
        """Adding to cart with start_date > end_date must be rejected with 400 Bad Request."""
        res = self.client.post("/api/cart", json={
            "product_id": self.product_id,
            "start_date": "2026-11-10",
            "end_date": "2026-11-05"
        }, headers=self.cust_headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("start_date cannot be after end_date", res.json().get("detail", "").lower())

    def test_12_cart_add_and_retrieve_success(self):
        """Approved customer can add available gear to cart and retrieve calculated subtotal/tax/total."""
        clear_user_cart(self.cust_email)
        res_add = self.client.post("/api/cart", json={
            "product_id": self.product_id,
            "start_date": "2026-11-01",
            "end_date": "2026-11-04"
        }, headers=self.cust_headers)
        self.assertEqual(res_add.status_code, 200)
        self.assertTrue(res_add.json().get("success"))

        res_get = self.client.get("/api/cart", headers=self.cust_headers)
        self.assertEqual(res_get.status_code, 200)
        data = res_get.json()
        self.assertEqual(data["count"], 1)
        self.assertGreater(data["subtotal"], 0)
        self.assertGreater(data["total"], data["subtotal"])

    # ==========================================================================
    # SECTION 7: Booking Creation, Conflict Prevention & Date Integrity
    # ==========================================================================

    def test_13_booking_creation_and_double_booking_prevention(self):
        """
        Creates an initial booking, then verifies that overlapping booking attempts
        for the same product are rejected with 409 Conflict.
        """
        order_id_1 = f"ord-p10-1-{self.run_id}"
        res_create = self.client.post("/api/orders", json={
            "id": order_id_1,
            "productId": self.product_id,
            "startDate": "2026-12-01",
            "endDate": "2026-12-05",
            "total": 18000,
            "status": "confirmed"
        }, headers=self.cust_headers)
        self.assertEqual(res_create.status_code, 200)

        # Attempt overlapping booking (Dec 3 to Dec 7)
        order_id_2 = f"ord-p10-2-{self.run_id}"
        res_conflict = self.client.post("/api/orders", json={
            "id": order_id_2,
            "productId": self.product_id,
            "startDate": "2026-12-03",
            "endDate": "2026-12-07",
            "total": 18000,
            "status": "confirmed"
        }, headers=self.cust_headers)
        self.assertEqual(res_conflict.status_code, 409)
        self.assertIn("conflict", res_conflict.json().get("detail", "").lower())

    def test_14_booking_rejects_past_dates(self):
        """Booking with past dates must be rejected with 400 Bad Request."""
        order_id = f"ord-past-{self.run_id}"
        res = self.client.post("/api/orders", json={
            "id": order_id,
            "productId": self.product_id,
            "startDate": "2021-05-01",
            "endDate": "2021-05-04",
            "total": 13500
        }, headers=self.cust_headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("past", res.json().get("detail", "").lower())

    # ==========================================================================
    # SECTION 10: Delivery Tracking & IDOR Protection
    # ==========================================================================

    def test_15_delivery_tracking_and_location_idor_protection(self):
        """
        Ensures that only participants (customer, lender, or admin) can view delivery tracking
        and GPS coordinates. Strangers must be rejected with 403 Forbidden.
        """
        order_id = f"ord-p10-del-{self.run_id}"
        execute_query("""
            INSERT INTO orders (id, user_email, product_id, product_title, start_date, end_date, total, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE status = 'active'
        """, (
            order_id,
            self.cust_email,
            self.product_id,
            "Sony FX3 Cinema Camera Kit",
            "2026-11-15",
            "2026-11-18",
            13500,
            "active",
            datetime.datetime.now(datetime.timezone.utc).isoformat()
        ))

        delivery_id = f"del-p10-{self.run_id}"
        execute_query("""
            INSERT INTO deliveries (id, booking_id, status, pickup_address, delivery_address,
                                   current_latitude, current_longitude, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE status = 'OUT_FOR_DELIVERY'
        """, (
            delivery_id,
            order_id,
            "OUT_FOR_DELIVERY",
            "Lender Studio Bengaluru",
            "Renter Studio Bengaluru",
            12.9716,
            77.5946,
            datetime.datetime.now(datetime.timezone.utc).isoformat(),
            datetime.datetime.now(datetime.timezone.utc).isoformat()
        ))

        # 1. Customer can view tracking
        res_cust = self.client.get(f"/api/deliveries/{delivery_id}/tracking", headers=self.cust_headers)
        self.assertEqual(res_cust.status_code, 200)

        # 2. Customer can view locations
        res_cust_loc = self.client.get(f"/api/deliveries/{delivery_id}/locations", headers=self.cust_headers)
        self.assertEqual(res_cust_loc.status_code, 200)

        # 3. Unauthorized stranger cannot view locations (IDOR protected)
        stranger_email = f"stranger_{self.run_id}@example.com"
        stranger_token = create_access_token(data={"sub": stranger_email, "role": "user"})
        stranger_headers = {"Authorization": f"Bearer {stranger_token}"}
        create_user(
            email=stranger_email,
            phone="+919900000099",
            password_hash="mock",
            full_name="Unauthorized Stranger",
            role="user",
            status="approved"
        )

        res_stranger_loc = self.client.get(f"/api/deliveries/{delivery_id}/locations", headers=stranger_headers)
        self.assertEqual(res_stranger_loc.status_code, 403)

        execute_query("DELETE FROM users WHERE email = %s", (stranger_email,))
        execute_query("DELETE FROM deliveries WHERE id = %s", (delivery_id,))
        execute_query("DELETE FROM orders WHERE id = %s", (order_id,))

    # ==========================================================================
    # SECTION 11: Return & Rental Completion Lifecycle
    # ==========================================================================

    def test_16_return_and_completion_lifecycle(self):
        """
        Tests the full return lifecycle:
          Customer initiates return -> Lender confirms return -> Lender marks completed.
        """
        order_id = f"ord-return-cycle-{self.run_id}"
        execute_query("""
            INSERT INTO orders (id, user_email, product_id, product_title, start_date, end_date, total, status, payment_status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE status = 'active'
        """, (
            order_id,
            self.cust_email,
            self.product_id,
            "Sony FX3 Cinema Camera Kit",
            "2026-10-01",
            "2026-10-05",
            18000,
            "active",
            "paid",
            datetime.datetime.now(datetime.timezone.utc).isoformat()
        ))

        # Customer initiates return
        res_ret = self.client.post(f"/api/orders/{order_id}/return", headers=self.cust_headers)
        self.assertEqual(res_ret.status_code, 200)
        self.assertEqual(res_ret.json().get("status"), "return_initiated")

        # Lender confirms receipt
        res_confirm = self.client.post(f"/api/orders/{order_id}/return-confirm", headers=self.lender_headers)
        self.assertEqual(res_confirm.status_code, 200)
        self.assertEqual(res_confirm.json().get("status"), "returned")

        # Lender completes order
        res_comp = self.client.post(f"/api/orders/{order_id}/complete", headers=self.lender_headers)
        self.assertEqual(res_comp.status_code, 200)
        self.assertEqual(res_comp.json().get("status"), "completed")

        # Verify DB state
        row = fetch_one("SELECT status FROM orders WHERE id = %s", (order_id,))
        self.assertEqual(row["status"], "completed")

        execute_query("DELETE FROM orders WHERE id = %s", (order_id,))

    # ==========================================================================
    # SECTION 12: Review Eligibility & User Email Masking
    # ==========================================================================

    def test_17_review_eligibility_and_email_masking(self):
        """
        Tests review verification:
          - Customer can review completed booking.
          - userId in response and public reviews is safely masked (e.g. p***t@example.com).
          - Cancelled booking cannot be reviewed.
          - Duplicate reviews rejected (409).
        """
        order_id = f"ord-rev-test-{self.run_id}"
        execute_query("""
            INSERT INTO orders (id, user_email, product_id, product_title, start_date, end_date, total, status, payment_status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE status = 'completed'
        """, (
            order_id,
            self.cust_email,
            self.product_id,
            "Sony FX3 Cinema Camera Kit",
            "2026-09-01",
            "2026-09-04",
            13500,
            "completed",
            "paid",
            datetime.datetime.now(datetime.timezone.utc).isoformat()
        ))

        # 1. Submit verified review
        res_rev = self.client.post("/api/reviews", json={
            "productId": self.product_id,
            "bookingId": order_id,
            "rating": 5,
            "comment": "Absolutely pristine camera gear. Highly recommend this lender!"
        }, headers=self.cust_headers)
        self.assertEqual(res_rev.status_code, 201)
        rev_data = res_rev.json()
        
        # Privacy check: userId must NOT be raw email
        self.assertNotEqual(rev_data.get("userId"), self.cust_email)
        self.assertIn("*", rev_data.get("userId"), "Reviewer userId must be anonymized/masked.")

        # 2. Public reviews API must also return masked userId
        invalidate_cache("public_reviews")
        res_pub_rev = self.client.get(f"/api/reviews?product_id={self.product_id}")
        self.assertEqual(res_pub_rev.status_code, 200)
        reviews_list = res_pub_rev.json().get("reviews", [])
        self.assertTrue(len(reviews_list) > 0)
        for r in reviews_list:
            u_id = r.get("userId") or r.get("user_id") or ""
            self.assertNotEqual(u_id, self.cust_email, "Public reviews must never leak raw email addresses.")

        # 3. Duplicate review rejected
        res_dup = self.client.post("/api/reviews", json={
            "productId": self.product_id,
            "bookingId": order_id,
            "rating": 4,
            "comment": "Trying to duplicate review."
        }, headers=self.cust_headers)
        self.assertEqual(res_dup.status_code, 409)

        execute_query("DELETE FROM orders WHERE id = %s", (order_id,))

    def test_18_cancelled_booking_cannot_be_reviewed(self):
        """Cancelled bookings cannot receive customer reviews (400 Bad Request)."""
        cancel_ord_id = f"ord-cancel-rev-{self.run_id}"
        execute_query("""
            INSERT INTO orders (id, user_email, product_id, product_title, start_date, end_date, total, status, payment_status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE status = 'cancelled'
        """, (
            cancel_ord_id,
            self.cust_email,
            self.product_id,
            "Sony FX3 Cinema Camera Kit",
            "2026-09-05",
            "2026-09-08",
            13500,
            "cancelled",
            "refunded",
            datetime.datetime.now(datetime.timezone.utc).isoformat()
        ))

        res_cancel_rev = self.client.post("/api/reviews", json={
            "productId": self.product_id,
            "bookingId": cancel_ord_id,
            "rating": 1,
            "comment": "Booking was cancelled"
        }, headers=self.cust_headers)
        self.assertEqual(res_cancel_rev.status_code, 400)
        self.assertIn("cancelled", res_cancel_rev.json().get("detail", "").lower())

        execute_query("DELETE FROM orders WHERE id = %s", (cancel_ord_id,))

    # ==========================================================================
    # SECTION 13: Notification Event Wiring
    # ==========================================================================

    def test_19_notifications_wired_on_booking_and_return(self):
        """Verifies notifications are created in DB for customer and lender on booking actions."""
        cust_notifs = self.client.get("/api/notifications", headers=self.cust_headers)
        self.assertEqual(cust_notifs.status_code, 200)
        self.assertTrue(len(cust_notifs.json()) > 0)

        lender_notifs = self.client.get("/api/notifications", headers=self.lender_headers)
        self.assertEqual(lender_notifs.status_code, 200)
        self.assertTrue(len(lender_notifs.json()) > 0)

if __name__ == "__main__":
    unittest.main()
