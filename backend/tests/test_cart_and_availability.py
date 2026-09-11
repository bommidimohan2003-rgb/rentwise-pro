import unittest
import json
import uuid
import datetime
from fastapi.testclient import TestClient
import sys
import os

# Set sys.path to backend dir
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app
from database import (
    init_db,
    parse_date_safely,
    check_products_booking_conflicts,
    add_or_update_cart_item,
    get_user_cart,
    remove_cart_item,
    clear_user_cart,
    MOCK_CARTS,
    MOCK_ORDERS,
    execute_query
)
from auth import create_access_token

class TestCartAndAvailability(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        try:
            init_db()
        except Exception:
            pass

    def setUp(self):
        self.client = TestClient(app)
        self.test_user = f"test_cart_{uuid.uuid4().hex[:8]}@example.com"
        self.token = create_access_token({"sub": self.test_user, "role": "user"})
        self.auth_headers = {"Authorization": f"Bearer {self.token}"}
        clear_user_cart(self.test_user)

    def tearDown(self):
        clear_user_cart(self.test_user)

    def test_date_conflict_overlap_logic(self):
        test_pid = f"prod_test_{uuid.uuid4().hex[:6]}"
        order_id = f"ord_{uuid.uuid4().hex[:8]}"
        
        MOCK_ORDERS[order_id] = {
            "id": order_id,
            "product_id": test_pid,
            "start_date": "2026-10-10",
            "end_date": "2026-10-15",
            "status": "active"
        }

        # Case 1: Overlaps inside (2026-10-12 to 2026-10-14)
        conflicts = check_products_booking_conflicts([test_pid], "2026-10-12", "2026-10-14")
        self.assertIn(test_pid, conflicts)

        # Case 2: Exact overlap (2026-10-10 to 2026-10-15)
        conflicts = check_products_booking_conflicts([test_pid], "2026-10-10", "2026-10-15")
        self.assertIn(test_pid, conflicts)

        # Case 3: Overlaps end (2026-10-14 to 2026-10-20)
        conflicts = check_products_booking_conflicts([test_pid], "2026-10-14", "2026-10-20")
        self.assertIn(test_pid, conflicts)

        # Case 4: Overlaps start (2026-10-05 to 2026-10-11)
        conflicts = check_products_booking_conflicts([test_pid], "2026-10-05", "2026-10-11")
        self.assertIn(test_pid, conflicts)

        # Case 5: Completely before (2026-10-01 to 2026-10-09) -> No conflict
        conflicts = check_products_booking_conflicts([test_pid], "2026-10-01", "2026-10-09")
        self.assertNotIn(test_pid, conflicts)

        # Case 6: Completely after (2026-10-16 to 2026-10-20) -> No conflict
        conflicts = check_products_booking_conflicts([test_pid], "2026-10-16", "2026-10-20")
        self.assertNotIn(test_pid, conflicts)

        if order_id in MOCK_ORDERS:
            del MOCK_ORDERS[order_id]

    def test_batch_availability_endpoint(self):
        test_pid = f"prod_batch_{uuid.uuid4().hex[:6]}"
        order_id = f"ord_batch_{uuid.uuid4().hex[:8]}"
        
        MOCK_ORDERS[order_id] = {
            "id": order_id,
            "product_id": test_pid,
            "start_date": "2026-11-01",
            "end_date": "2026-11-05",
            "status": "active"
        }

        payload = {
            "start_date": "2026-11-02",
            "end_date": "2026-11-04",
            "product_ids": [test_pid, "non_conflicted_prod_xyz"]
        }
        res = self.client.post("/api/products/availability/batch", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("availability", data)
        self.assertFalse(data["availability"][test_pid]["is_available"])
        self.assertEqual(data["availability"][test_pid]["status"], "unavailable")
        self.assertTrue(data["availability"]["non_conflicted_prod_xyz"]["is_available"])

        if order_id in MOCK_ORDERS:
            del MOCK_ORDERS[order_id]

    def test_cart_crud_and_pricing(self):
        payload = {
            "product_id": "test_cam_1",
            "start_date": "2026-12-01",
            "end_date": "2026-12-04"
        }
        res = self.client.post("/api/cart", json=payload, headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)
        res_data = res.json()
        self.assertTrue(res_data["success"])
        item = res_data["item"]
        self.assertEqual(item["product_id"], "test_cam_1")
        self.assertEqual(item["days"], 3)

        get_res = self.client.get("/api/cart", headers=self.auth_headers)
        self.assertEqual(get_res.status_code, 200)
        cart_data = get_res.json()
        self.assertEqual(cart_data["count"], 1)
        expected_subtotal = item["daily_price"] * 3
        expected_tax = int(round(expected_subtotal * 0.08))
        self.assertEqual(cart_data["subtotal"], expected_subtotal)
        self.assertEqual(cart_data["tax"], expected_tax)
        self.assertEqual(cart_data["total"], expected_subtotal + expected_tax)

        del_res = self.client.delete(f"/api/cart/{item['id']}", headers=self.auth_headers)
        self.assertEqual(del_res.status_code, 200)
        
        get_res2 = self.client.get("/api/cart", headers=self.auth_headers)
        self.assertEqual(get_res2.json()["count"], 0)

    def test_cart_rejection_on_conflict(self):
        test_pid = f"prod_conf_{uuid.uuid4().hex[:6]}"
        order_id = f"ord_conf_{uuid.uuid4().hex[:8]}"
        
        MOCK_ORDERS[order_id] = {
            "id": order_id,
            "product_id": test_pid,
            "start_date": "2026-12-10",
            "end_date": "2026-12-15",
            "status": "active"
        }

        payload = {
            "product_id": test_pid,
            "start_date": "2026-12-12",
            "end_date": "2026-12-14"
        }
        res = self.client.post("/api/cart", json=payload, headers=self.auth_headers)
        self.assertEqual(res.status_code, 409)
        self.assertIn("already booked", res.json()["detail"])

        if order_id in MOCK_ORDERS:
            del MOCK_ORDERS[order_id]

if __name__ == "__main__":
    unittest.main()
