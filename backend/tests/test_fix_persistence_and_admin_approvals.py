import os
import sys
import unittest
import time
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from database import (
    get_db_connection,
    create_custom_product,
    MOCK_CUSTOM_PRODUCTS,
    execute_query,
)
from auth import create_access_token

class TestProductSubmissionPersistenceAndAdminApprovals(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        
        # Test Users
        cls.admin_email = "bommidimohan2003@gmail.com"
        cls.mohan_email = "bommidimohan304@gmail.com"
        cls.vasanth_email = "vasnathchikkala@gmail.com"
        cls.third_email = "dsriyogendra@gmail.com"
        
        cls.admin_token = create_access_token({"sub": cls.admin_email, "role": "admin"})
        cls.mohan_token = create_access_token({"sub": cls.mohan_email, "role": "user"})
        cls.vasanth_token = create_access_token({"sub": cls.vasanth_email, "role": "user"})
        cls.third_token = create_access_token({"sub": cls.third_email, "role": "user"})
        
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}
        cls.mohan_headers = {"Authorization": f"Bearer {cls.mohan_token}"}
        cls.vasanth_headers = {"Authorization": f"Bearer {cls.vasanth_token}"}
        cls.third_headers = {"Authorization": f"Bearer {cls.third_token}"}

    def test_01_vasanth_submits_bike_persists_in_db_and_shows_in_admin(self):
        """Vasanth submits Bike at 1500/day -> verified in DB and pending admin queue."""
        bike_id = f"p-test-bike-{int(time.time() * 1000)}"
        payload = {
            "id": bike_id,
            "title": "Royal Enfield Hunter 350 Bike",
            "description": "Premium 350cc Cruiser bike in pristine condition.",
            "price": 1500,
            "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...",
            "category": "bikes",
            "rating": 5.0,
            "reviews": 0,
            "available": False,
            "status": "pending",
        }
        
        res = self.client.post("/api/products/custom", json=payload, headers=self.vasanth_headers)
        self.assertIn(res.status_code, [200, 201])
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["product_id"], bike_id)
        self.assertEqual(data["status"], "pending")
        
        # Verify in MySQL Database directly
        conn = get_db_connection()
        self.assertIsNotNone(conn)
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, user_email, title, price, status FROM custom_products WHERE id = %s", (bike_id,))
                row = cursor.fetchone()
                self.assertIsNotNone(row)
                self.assertEqual(row["user_email"], self.vasanth_email)
                self.assertEqual(row["title"], "Royal Enfield Hunter 350 Bike")
                self.assertEqual(float(row["price"]), 1500.0)
                self.assertEqual(row["status"], "pending")
        finally:
            conn.close()
            
        # Verify Admin Pending Approvals endpoint returns Vasanth's Bike
        admin_res = self.client.get("/api/admin/products?status=pending", headers=self.admin_headers)
        self.assertEqual(admin_res.status_code, 200)
        admin_prods = admin_res.json()
        matching = [p for p in admin_prods if p["id"] == bike_id]
        self.assertEqual(len(matching), 1)
        self.assertEqual(matching[0]["owner"]["email"], self.vasanth_email)
        self.assertEqual(matching[0]["status"], "pending")
        
        # Clean up
        execute_query("DELETE FROM custom_products WHERE id = %s", (bike_id,))
        MOCK_CUSTOM_PRODUCTS.pop(bike_id, None)

    def test_02_mohan_submits_laptop_persists_in_db_and_shows_in_admin(self):
        """Mohan submits Laptop at 1000/day -> verified in DB and pending admin queue."""
        laptop_id = f"p-test-laptop-{int(time.time() * 1000)}"
        payload = {
            "id": laptop_id,
            "title": "Lenovo ThinkPad X1 Carbon",
            "description": "High performance ultrabook for business & coding.",
            "price": 1000,
            "image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
            "category": "laptops",
            "rating": 5.0,
            "reviews": 0,
            "available": False,
            "status": "pending",
        }
        
        res = self.client.post("/api/products/custom", json=payload, headers=self.mohan_headers)
        self.assertIn(res.status_code, [200, 201])
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["product_id"], laptop_id)
        
        # Verify Admin Pending queue has Mohan's product
        admin_res = self.client.get("/api/admin/products?status=pending", headers=self.admin_headers)
        self.assertEqual(admin_res.status_code, 200)
        matching = [p for p in admin_res.json() if p["id"] == laptop_id]
        self.assertEqual(len(matching), 1)
        self.assertEqual(matching[0]["owner"]["email"], self.mohan_email)
        
        # Clean up
        execute_query("DELETE FROM custom_products WHERE id = %s", (laptop_id,))
        MOCK_CUSTOM_PRODUCTS.pop(laptop_id, None)

    def test_03_third_user_submits_product(self):
        """Third user submits gear -> properly isolated and verified in admin queue."""
        vr_id = f"p-test-vr-{int(time.time() * 1000)}"
        payload = {
            "id": vr_id,
            "title": "Meta Quest 3 VR Headset",
            "description": "512GB standalone VR headset with controllers.",
            "price": 1200,
            "image": "https://images.unsplash.com/photo-1593508512255-86ab42a8e620",
            "category": "vr",
            "status": "pending",
        }
        
        res = self.client.post("/api/products/custom", json=payload, headers=self.third_headers)
        self.assertIn(res.status_code, [200, 201])
        
        # Verify in admin pending queue
        admin_res = self.client.get("/api/admin/products?status=pending", headers=self.admin_headers)
        matching = [p for p in admin_res.json() if p["id"] == vr_id]
        self.assertEqual(len(matching), 1)
        self.assertEqual(matching[0]["owner"]["email"], self.third_email)
        
        # Clean up
        execute_query("DELETE FROM custom_products WHERE id = %s", (vr_id,))
        MOCK_CUSTOM_PRODUCTS.pop(vr_id, None)

    def test_04_intentional_database_failure_does_not_return_success(self):
        """Intentionally failing or unauthenticated insert returns error, never false success."""
        # Unauthenticated request
        payload = {
            "title": "Broken Test Product",
            "description": "Should fail",
            "price": 999,
            "image": "test",
            "category": "cameras",
        }
        res = self.client.post("/api/products/custom", json=payload)
        self.assertIn(res.status_code, [401, 403])
        self.assertNotEqual(res.status_code, 200)
        self.assertNotEqual(res.status_code, 201)

    def test_05_admin_approval_and_rejection_workflow(self):
        """Admin approves and rejects gear listings with live status change confirmation."""
        item_a = f"p-test-appr-{int(time.time() * 1000)}"
        item_b = f"p-test-rej-{int(time.time() * 1000)}"
        
        # Create item A (to approve) and item B (to reject)
        self.client.post("/api/products/custom", json={
            "id": item_a,
            "title": "Approve Me Gear",
            "description": "Will be approved",
            "price": 500,
            "image": "test.jpg",
            "category": "tools",
            "status": "pending"
        }, headers=self.vasanth_headers)
        
        self.client.post("/api/products/custom", json={
            "id": item_b,
            "title": "Reject Me Gear",
            "description": "Will be rejected",
            "price": 600,
            "image": "test.jpg",
            "category": "tools",
            "status": "pending"
        }, headers=self.vasanth_headers)
        
        # Admin approves item A
        appr_res = self.client.post(f"/api/admin/products/{item_a}/approve", headers=self.admin_headers)
        self.assertEqual(appr_res.status_code, 200)
        
        # Admin rejects item B
        rej_res = self.client.post(f"/api/admin/products/{item_b}/reject", headers=self.admin_headers)
        self.assertEqual(rej_res.status_code, 200)
        
        # Verify in DB
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, status, available FROM custom_products WHERE id = %s", (item_a,))
                row_a = cursor.fetchone()
                self.assertEqual(row_a["status"], "approved")
                self.assertTrue(bool(row_a["available"]))
                
                cursor.execute("SELECT id, status, available FROM custom_products WHERE id = %s", (item_b,))
                row_b = cursor.fetchone()
                self.assertEqual(row_b["status"], "rejected")
                self.assertFalse(bool(row_b["available"]))
        finally:
            conn.close()
            
        # Clean up
        execute_query("DELETE FROM custom_products WHERE id IN (%s, %s)", (item_a, item_b))
        MOCK_CUSTOM_PRODUCTS.pop(item_a, None)
        MOCK_CUSTOM_PRODUCTS.pop(item_b, None)

if __name__ == "__main__":
    unittest.main()
