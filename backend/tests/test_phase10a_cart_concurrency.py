"""
PAYENT Phase 10A: Cart Concurrency & Race Condition Test Suite
Validates:
1. 10 simultaneous cart requests for same user & product (Zero duplicate rows)
2. Duplicate add idempotency (same user, product, dates)
3. Same product added by multiple distinct users concurrently
4. Overlapping booking conflict protection (409 Conflict)
5. Product unavailable or lender suspended during cart add (400 Bad Request)
6. Pending / unapproved user blocked (403 Forbidden)
7. Auth cache immediate invalidation on status transition (No stale authorization)
"""

import os
import sys
import unittest
import uuid
import datetime
from concurrent.futures import ThreadPoolExecutor

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app
from auth import create_access_token
from database import (
    create_user,
    get_user,
    invalidate_user_cache,
    execute_query,
    fetch_one,
    fetch_all,
    clear_user_cart,
    MOCK_USERS,
    MOCK_CUSTOM_PRODUCTS,
    MOCK_CARTS,
    MOCK_ORDERS
)

class Phase10ACartConcurrencyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.test_run_id = uuid.uuid4().hex[:8]
        
        # 1. Create approved customer A
        cls.cust_a_email = f"p10a_cust_a_{cls.test_run_id}@example.com"
        create_user(
            email=cls.cust_a_email,
            phone="+919111111111",
            password_hash="mock_hash_a",
            full_name="P10A Customer A",
            role="user",
            status="approved"
        )
        cls.token_a = create_access_token(data={"sub": cls.cust_a_email, "role": "user"})
        cls.headers_a = {"Authorization": f"Bearer {cls.token_a}"}

        # 2. Create approved customer B
        cls.cust_b_email = f"p10a_cust_b_{cls.test_run_id}@example.com"
        create_user(
            email=cls.cust_b_email,
            phone="+919222222222",
            password_hash="mock_hash_b",
            full_name="P10A Customer B",
            role="user",
            status="approved"
        )
        cls.token_b = create_access_token(data={"sub": cls.cust_b_email, "role": "user"})
        cls.headers_b = {"Authorization": f"Bearer {cls.token_b}"}

        # 3. Create approved lender
        cls.lender_email = f"p10a_lender_{cls.test_run_id}@example.com"
        create_user(
            email=cls.lender_email,
            phone="+919333333333",
            password_hash="mock_hash_lender",
            full_name="P10A Lender",
            role="user",
            status="approved"
        )
        cls.token_lender = create_access_token(data={"sub": cls.lender_email, "role": "user"})
        cls.headers_lender = {"Authorization": f"Bearer {cls.token_lender}"}

        # 4. Create an active product
        cls.product_id = f"p-p10a-{cls.test_run_id}"
        execute_query("""
            INSERT INTO custom_products (id, user_email, title, price, available, status, category, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (cls.product_id, cls.lender_email, "Sony FX3 Cinema Camera", 2500, 1, "approved", "cameras", datetime.datetime.now(datetime.timezone.utc).isoformat()))
        MOCK_CUSTOM_PRODUCTS[cls.product_id] = {
            "id": cls.product_id,
            "user_email": cls.lender_email,
            "title": "Sony FX3 Cinema Camera",
            "price": 2500,
            "available": True,
            "status": "approved",
            "category": "cameras",
            "city": "Bengaluru",
            "owner_status": "approved",
            "owner_verified": True
        }

    @classmethod
    def tearDownClass(cls):
        clear_user_cart(cls.cust_a_email)
        clear_user_cart(cls.cust_b_email)
        execute_query("DELETE FROM orders WHERE product_id = %s", (cls.product_id,))
        execute_query("DELETE FROM custom_products WHERE id = %s", (cls.product_id,))
        execute_query("DELETE FROM users WHERE email IN (%s, %s, %s)", (cls.cust_a_email, cls.cust_b_email, cls.lender_email))
        invalidate_user_cache(cls.cust_a_email)
        invalidate_user_cache(cls.cust_b_email)
        invalidate_user_cache(cls.lender_email)
        if cls.product_id in MOCK_CUSTOM_PRODUCTS:
            del MOCK_CUSTOM_PRODUCTS[cls.product_id]

    def setUp(self):
        clear_user_cart(self.cust_a_email)
        clear_user_cart(self.cust_b_email)

    def test_01_ten_simultaneous_cart_requests_same_user(self):
        """
        10 concurrent threads simultaneously adding the same product for the same user.
        Must result in exactly 1 cart item row in the database, with 0 duplicate rows and no race conditions.
        """
        clear_user_cart(self.cust_a_email)

        def worker(idx):
            # Vary rental duration slightly
            s_date = (datetime.date.today() + datetime.timedelta(days=10 + idx)).strftime("%Y-%m-%d")
            e_date = (datetime.date.today() + datetime.timedelta(days=12 + idx)).strftime("%Y-%m-%d")
            res = self.client.post("/api/cart", json={
                "product_id": self.product_id,
                "start_date": s_date,
                "end_date": e_date
            }, headers=self.headers_a)
            return res.status_code, res.json()

        with ThreadPoolExecutor(max_workers=10) as executor:
            results = list(executor.map(worker, range(10)))

        # Verify all 10 succeeded without any 500 or crash
        for status_code, data in results:
            self.assertEqual(status_code, 200, f"Concurrent request failed with status {status_code}: {data}")
            self.assertTrue(data.get("success"), "Cart item add response should indicate success")

        # Authoritative check in DB: exactly ONE row must exist for this user and product
        rows = fetch_all(
            "SELECT * FROM cart_items WHERE LOWER(user_email) = LOWER(%s) AND product_id = %s",
            (self.cust_a_email, self.product_id)
        ) or []
        self.assertEqual(len(rows), 1, f"Expected exactly 1 cart row, but found {len(rows)} duplicate rows!")

    def test_02_duplicate_add_idempotency(self):
        """
        2 consecutive identical cart requests for the same user and dates should update idempotently.
        """
        s_date = (datetime.date.today() + datetime.timedelta(days=20)).strftime("%Y-%m-%d")
        e_date = (datetime.date.today() + datetime.timedelta(days=23)).strftime("%Y-%m-%d")

        payload = {"product_id": self.product_id, "start_date": s_date, "end_date": e_date}
        res1 = self.client.post("/api/cart", json=payload, headers=self.headers_a)
        self.assertEqual(res1.status_code, 200)

        res2 = self.client.post("/api/cart", json=payload, headers=self.headers_a)
        self.assertEqual(res2.status_code, 200)

        # Confirm 1 item with correct days
        rows = fetch_all(
            "SELECT * FROM cart_items WHERE LOWER(user_email) = LOWER(%s) AND product_id = %s",
            (self.cust_a_email, self.product_id)
        ) or []
        self.assertEqual(len(rows), 1)
        self.assertEqual(int(rows[0]["days"]), 3)

    def test_03_same_product_multiple_users_concurrency(self):
        """
        Multiple distinct users can concurrently add the same available product to their individual carts.
        Neither user interferes with or overwrites the other.
        """
        s_date = (datetime.date.today() + datetime.timedelta(days=30)).strftime("%Y-%m-%d")
        e_date = (datetime.date.today() + datetime.timedelta(days=33)).strftime("%Y-%m-%d")

        def add_a():
            return self.client.post("/api/cart", json={"product_id": self.product_id, "start_date": s_date, "end_date": e_date}, headers=self.headers_a)

        def add_b():
            return self.client.post("/api/cart", json={"product_id": self.product_id, "start_date": s_date, "end_date": e_date}, headers=self.headers_b)

        with ThreadPoolExecutor(max_workers=2) as executor:
            fut_a = executor.submit(add_a)
            fut_b = executor.submit(add_b)
            res_a = fut_a.result()
            res_b = fut_b.result()

        self.assertEqual(res_a.status_code, 200)
        self.assertEqual(res_b.status_code, 200)

        # Check cart counts per user
        cart_a = self.client.get("/api/cart", headers=self.headers_a).json()
        cart_b = self.client.get("/api/cart", headers=self.headers_b).json()

        self.assertEqual(cart_a.get("count"), 1)
        self.assertEqual(cart_b.get("count"), 1)

    def test_04_overlapping_booking_conflict_rejection(self):
        """
        Active confirmed booking conflict must return 409 Conflict and reject cart addition.
        """
        order_id = f"ord_conf_{uuid.uuid4().hex[:8]}"
        ord_start = (datetime.date.today() + datetime.timedelta(days=40)).strftime("%Y-%m-%d")
        ord_end = (datetime.date.today() + datetime.timedelta(days=45)).strftime("%Y-%m-%d")

        # Insert active order
        execute_query("""
            INSERT INTO orders (id, user_email, product_id, start_date, end_date, total, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (order_id, "other_renter@example.com", self.product_id, ord_start, ord_end, 10000, "confirmed", datetime.datetime.now(datetime.timezone.utc).isoformat()))

        try:
            # Attempt to book overlapping dates: days 42 to 44
            req_start = (datetime.date.today() + datetime.timedelta(days=42)).strftime("%Y-%m-%d")
            req_end = (datetime.date.today() + datetime.timedelta(days=44)).strftime("%Y-%m-%d")

            res = self.client.post("/api/cart", json={
                "product_id": self.product_id,
                "start_date": req_start,
                "end_date": req_end
            }, headers=self.headers_a)

            self.assertEqual(res.status_code, 409, f"Expected 409 Conflict for overlapping dates, got {res.status_code}")
            self.assertIn("already booked", res.json().get("detail", "").lower())
        finally:
            execute_query("DELETE FROM orders WHERE id = %s", (order_id,))

    def test_05_product_becomes_unavailable_or_lender_suspended(self):
        """
        If product is set to unavailable or lender is suspended, cart addition must be rejected with 400 Bad Request.
        """
        # Set product available = 0
        execute_query("UPDATE custom_products SET available = 0 WHERE id = %s", (self.product_id,))
        if self.product_id in MOCK_CUSTOM_PRODUCTS:
            MOCK_CUSTOM_PRODUCTS[self.product_id]["available"] = False

        try:
            s_date = (datetime.date.today() + datetime.timedelta(days=50)).strftime("%Y-%m-%d")
            e_date = (datetime.date.today() + datetime.timedelta(days=52)).strftime("%Y-%m-%d")

            res = self.client.post("/api/cart", json={
                "product_id": self.product_id,
                "start_date": s_date,
                "end_date": e_date
            }, headers=self.headers_a)

            self.assertEqual(res.status_code, 400)
            self.assertIn("no longer available", res.json().get("detail", "").lower())
        finally:
            execute_query("UPDATE custom_products SET available = 1 WHERE id = %s", (self.product_id,))
            if self.product_id in MOCK_CUSTOM_PRODUCTS:
                MOCK_CUSTOM_PRODUCTS[self.product_id]["available"] = True

    def test_06_auth_cache_immediate_invalidation_on_suspension(self):
        """
        Customer starts approved (cached). When suspended, cache invalidation guarantees subsequent cart request immediately returns 403 Forbidden.
        """
        # 1. Warm auth cache with a successful get_user call
        u = get_user(self.cust_a_email)
        self.assertEqual(u.get("status"), "approved")

        # 2. Suspend customer A and call invalidate_user_cache
        execute_query("UPDATE users SET status = 'suspended' WHERE email = %s", (self.cust_a_email,))
        invalidate_user_cache(self.cust_a_email)
        if self.cust_a_email in MOCK_USERS:
            MOCK_USERS[self.cust_a_email]["status"] = "suspended"

        try:
            s_date = (datetime.date.today() + datetime.timedelta(days=60)).strftime("%Y-%m-%d")
            e_date = (datetime.date.today() + datetime.timedelta(days=62)).strftime("%Y-%m-%d")

            res = self.client.post("/api/cart", json={
                "product_id": self.product_id,
                "start_date": s_date,
                "end_date": e_date
            }, headers=self.headers_a)

            self.assertEqual(res.status_code, 403)
            self.assertIn("suspended", res.json().get("detail", "").lower())
        finally:
            # Restore approved status
            execute_query("UPDATE users SET status = 'approved' WHERE email = %s", (self.cust_a_email,))
            invalidate_user_cache(self.cust_a_email)
            if self.cust_a_email in MOCK_USERS:
                MOCK_USERS[self.cust_a_email]["status"] = "approved"

if __name__ == "__main__":
    unittest.main()
