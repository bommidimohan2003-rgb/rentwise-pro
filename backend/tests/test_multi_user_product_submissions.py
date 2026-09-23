import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app, create_access_token
from database import create_user, get_user, execute_query, get_db_connection

class TestMultiUserProductSubmissions(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

        # Admin user
        cls.admin_email = "admin_e2e_test@example.com"
        cls.admin_token = create_access_token({"sub": cls.admin_email, "role": "admin"})
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}
        create_user(
            email=cls.admin_email,
            phone="9998887770",
            password_hash="hashed_pw_admin",
            full_name="Admin E2E Tester",
            role="admin",
            status="approved"
        )

        # Mohan user
        cls.mohan_email = "mohan_e2e_test@example.com"
        cls.mohan_token = create_access_token({"sub": cls.mohan_email, "role": "user"})
        cls.mohan_headers = {"Authorization": f"Bearer {cls.mohan_token}"}
        create_user(
            email=cls.mohan_email,
            phone="9998887771",
            password_hash="hashed_pw_mohan",
            full_name="Mohan Bommidi",
            role="user",
            status="active"
        )

        # User B (brand new normal user, status: pending)
        cls.user_b_email = "user_b_normal@example.com"
        cls.user_b_token = create_access_token({"sub": cls.user_b_email, "role": "user"})
        cls.user_b_headers = {"Authorization": f"Bearer {cls.user_b_token}"}
        create_user(
            email=cls.user_b_email,
            phone="9998887772",
            password_hash="hashed_pw_user_b",
            full_name="Alice User B",
            role="user",
            status="pending"
        )

        # User C (another brand new normal user, status: pending)
        cls.user_c_email = "user_c_normal@example.com"
        cls.user_c_token = create_access_token({"sub": cls.user_c_email, "role": "user"})
        cls.user_c_headers = {"Authorization": f"Bearer {cls.user_c_token}"}
        create_user(
            email=cls.user_c_email,
            phone="9998887773",
            password_hash="hashed_pw_user_c",
            full_name="Bob User C",
            role="user",
            status="pending"
        )

    def test_01_mohan_creates_product_a_and_appears_in_admin_pending(self):
        """TEST 1: Mohan creates Product A. Expected: Product A appears in Admin -> Pending Approvals."""
        payload_a = {
            "title": "Mohan Sony FX3 Cinema Camera",
            "description": "Full frame cinema line camera with XLR handle",
            "price": 3500.0,
            "category": "Cameras",
            "image": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800"
        }
        res = self.client.post("/api/products/custom", json=payload_a, headers=self.mohan_headers)
        self.assertEqual(res.status_code, 200, f"Mohan product creation failed: {res.text}")
        data = res.json()
        self.assertTrue(data.get("success"))
        product_a = data.get("product")
        self.assertIsNotNone(product_a)
        product_a_id = product_a["id"]
        self.assertEqual(product_a["status"], "pending")
        self.assertFalse(product_a["available"])

        # Check Admin Pending Approvals
        admin_res = self.client.get("/api/admin/products?status=pending", headers=self.admin_headers)
        self.assertEqual(admin_res.status_code, 200)
        pending_list = admin_res.json()
        pending_ids = [p["id"] for p in pending_list]
        self.assertIn(product_a_id, pending_ids, "Product A must appear in Admin Pending list")

    def test_02_user_b_creates_product_b_and_appears_in_admin_pending(self):
        """TEST 2: Create/login as completely different normal user B. Create Product B. Expected: Appears in Admin -> Pending Approvals."""
        payload_b = {
            "title": "Alice DJI Ronin RS3 Pro Gimbal",
            "description": "Automated axis locks with carbon fiber arms",
            "price": 1200.0,
            "category": "Stabilizers",
            "image": "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800"
        }
        res = self.client.post("/api/products/custom", json=payload_b, headers=self.user_b_headers)
        self.assertEqual(res.status_code, 200, f"User B product creation failed: {res.text}")
        data = res.json()
        self.assertTrue(data.get("success"))
        product_b = data.get("product")
        self.assertIsNotNone(product_b)
        product_b_id = product_b["id"]
        self.assertEqual(product_b["status"], "pending")
        self.assertEqual(product_b["owner"]["email"], self.user_b_email)

        # Check Admin Pending Approvals
        admin_res = self.client.get("/api/admin/products?status=pending", headers=self.admin_headers)
        self.assertEqual(admin_res.status_code, 200)
        pending_list = admin_res.json()
        pending_ids = [p["id"] for p in pending_list]
        self.assertIn(product_b_id, pending_ids, "Product B by User B MUST appear in Admin Pending Approvals")

    def test_03_user_c_creates_product_c_and_appears_in_admin_pending(self):
        """TEST 3: Create Product C using another different user C. Expected: Appears in Admin -> Pending Approvals."""
        payload_c = {
            "title": "Bob Sennheiser MKH 416 Boom Mic",
            "description": "Short shotgun interference tube microphone",
            "price": 800.0,
            "category": "Audio",
            "image": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800"
        }
        res = self.client.post("/api/products/custom", json=payload_c, headers=self.user_c_headers)
        self.assertEqual(res.status_code, 200, f"User C product creation failed: {res.text}")
        data = res.json()
        self.assertTrue(data.get("success"))
        product_c = data.get("product")
        self.assertIsNotNone(product_c)
        product_c_id = product_c["id"]
        self.assertEqual(product_c["status"], "pending")
        self.assertEqual(product_c["owner"]["email"], self.user_c_email)

        # Check Admin Pending Approvals
        admin_res = self.client.get("/api/admin/products?status=pending", headers=self.admin_headers)
        self.assertEqual(admin_res.status_code, 200)
        pending_list = admin_res.json()
        pending_ids = [p["id"] for p in pending_list]
        self.assertIn(product_c_id, pending_ids, "Product C by User C MUST appear in Admin Pending Approvals")

    def test_04_admin_approves_product_b(self):
        """TEST 4: Admin approves Product B. Expected: Product B status changes to approved and available=1."""
        payload_b = {
            "title": "Product B for Approval Test",
            "description": "Testing admin approval workflow",
            "price": 1500.0,
            "category": "Lenses",
            "image": "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800"
        }
        res = self.client.post("/api/products/custom", json=payload_b, headers=self.user_b_headers)
        self.assertEqual(res.status_code, 200)
        prod_id = res.json()["product"]["id"]

        # Approve as Admin
        appr_res = self.client.post(f"/api/admin/products/{prod_id}/approve", headers=self.admin_headers)
        self.assertEqual(appr_res.status_code, 200)
        appr_data = appr_res.json()
        self.assertEqual(appr_data["status"], "approved")
        self.assertTrue(appr_data["available"])

        # Verify it no longer appears in pending list
        admin_res = self.client.get("/api/admin/products?status=pending", headers=self.admin_headers)
        self.assertEqual(admin_res.status_code, 200)
        pending_ids = [p["id"] for p in admin_res.json()]
        self.assertNotIn(prod_id, pending_ids)

        # Verify it appears in public catalog
        pub_res = self.client.get("/api/products/custom/public")
        self.assertEqual(pub_res.status_code, 200)
        pub_ids = [p["id"] for p in pub_res.json()]
        self.assertIn(prod_id, pub_ids)

    def test_05_admin_rejects_product_c(self):
        """TEST 5: Admin rejects Product C. Expected: Product C status changes to rejected and available=0."""
        payload_c = {
            "title": "Product C for Rejection Test",
            "description": "Testing admin rejection workflow",
            "price": 900.0,
            "category": "Lighting",
            "image": "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800"
        }
        res = self.client.post("/api/products/custom", json=payload_c, headers=self.user_c_headers)
        self.assertEqual(res.status_code, 200)
        prod_id = res.json()["product"]["id"]

        # Reject as Admin
        rej_res = self.client.post(f"/api/admin/products/{prod_id}/reject", headers=self.admin_headers)
        self.assertEqual(rej_res.status_code, 200)
        rej_data = rej_res.json()
        self.assertEqual(rej_data["status"], "rejected")
        self.assertFalse(rej_data["available"])

        # Verify it does not appear in pending list
        admin_res = self.client.get("/api/admin/products?status=pending", headers=self.admin_headers)
        self.assertEqual(admin_res.status_code, 200)
        pending_ids = [p["id"] for p in admin_res.json()]
        self.assertNotIn(prod_id, pending_ids)

        # Verify it does NOT appear in public catalog
        pub_res = self.client.get("/api/products/custom/public")
        self.assertEqual(pub_res.status_code, 200)
        pub_ids = [p["id"] for p in pub_res.json()]
        self.assertNotIn(prod_id, pub_ids)

    def test_06_non_admin_cannot_access_admin_panel_or_api(self):
        """TEST 6: Verify normal user cannot access admin product endpoints."""
        res = self.client.get("/api/admin/products", headers=self.user_b_headers)
        self.assertEqual(res.status_code, 403)

        res_appr = self.client.post("/api/admin/products/p-test-fake/approve", headers=self.user_b_headers)
        self.assertEqual(res_appr.status_code, 403)

    def test_07_unauthenticated_request_rejected(self):
        """TEST 7: Verify unauthenticated requests to create or moderate products are rejected."""
        res_create = self.client.post("/api/products/custom", json={"title": "No Auth Product"})
        self.assertEqual(res_create.status_code, 401)

        res_admin = self.client.get("/api/admin/products?status=pending")
        self.assertEqual(res_admin.status_code, 401)


if __name__ == "__main__":
    unittest.main()
