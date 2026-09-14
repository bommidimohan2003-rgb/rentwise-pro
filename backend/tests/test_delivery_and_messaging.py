import os
import sys
import unittest
import time
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

os.environ["FASTAPI_ENV"] = "testing"
os.environ["PAYENT_ENABLE_TESTING_ENDPOINTS"] = "true"
os.environ["JWT_SECRET_KEY"] = "test-jwt-secret-key-1234567890"

from main import app
from auth import create_access_token
from database import (
    init_db,
    execute_query,
    calculate_haversine_distance_km,
    estimate_delivery_eta_minutes,
    MOCK_DELIVERIES,
    MOCK_ORDERS,
    MOCK_CUSTOM_PRODUCTS,
)

class TestDeliveryAndMessaging(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.customer_email = "renter_bob@payent.in"
        self.lender_email = "lender_alice@payent.in"
        self.intruder_email = "intruder_eve@payent.in"

        self.customer_token = create_access_token({"sub": self.customer_email, "email": self.customer_email, "role": "customer"})
        self.lender_token = create_access_token({"sub": self.lender_email, "email": self.lender_email, "role": "customer"})
        self.intruder_token = create_access_token({"sub": self.intruder_email, "email": self.intruder_email, "role": "customer"})

        self.customer_headers = {"Authorization": f"Bearer {self.customer_token}"}
        self.lender_headers = {"Authorization": f"Bearer {self.lender_token}"}
        self.intruder_headers = {"Authorization": f"Bearer {self.intruder_token}"}

        # Create a test booking
        self.booking_id = f"test-bk-{int(time.time() * 1000)}"
        self.product_id = f"test-p-{int(time.time() * 1000)}"

        # Mock DB setup for order and product
        MOCK_ORDERS[self.booking_id] = {
            "id": self.booking_id,
            "user_email": self.customer_email,
            "product_id": self.product_id,
            "product_title": "Sony FX3 Cinema Camera",
            "product_image": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600",
            "start_date": "2026-09-15",
            "end_date": "2026-09-18",
            "total": 18000,
            "status": "active"
        }
        MOCK_CUSTOM_PRODUCTS[self.product_id] = {
            "id": self.product_id,
            "title": "Sony FX3 Cinema Camera",
            "price": 6000,
            "image": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600",
            "user_email": self.lender_email,
            "city": "Bengaluru",
            "available": True
        }

    def test_haversine_and_eta_calculations(self):
        # Distance between Indiranagar (12.9784, 77.6408) and Koramangala (12.9352, 77.6245) is ~5 km
        dist = calculate_haversine_distance_km(12.9784, 77.6408, 12.9352, 77.6245)
        self.assertTrue(4.0 <= dist <= 6.0, f"Expected ~5km, got {dist}")

        # ETA calculation: 5 km at default speed should return between 10 and 30 minutes
        eta = estimate_delivery_eta_minutes(12.9784, 77.6408, 12.9352, 77.6245, speed_kmh=25)
        self.assertGreater(eta, 0)
        self.assertLessEqual(eta, 45)

    def test_delivery_idor_protection(self):
        # 1. Customer can access their booking delivery
        res = self.client.get(f"/api/bookings/{self.booking_id}/delivery", headers=self.customer_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        delivery = data["delivery"]
        self.assertEqual(delivery["status"], "PENDING")
        self.assertTrue(data["isCustomer"])

        delivery_id = delivery["id"]

        # 2. Lender can access the delivery
        res_lender = self.client.get(f"/api/deliveries/{delivery_id}/tracking", headers=self.lender_headers)
        self.assertEqual(res_lender.status_code, 200)
        self.assertFalse(res_lender.json()["tracking"]["isCustomer"])

        # 3. Intruder / unrelated third party is blocked with 403 Forbidden (IDOR protection)
        res_intruder = self.client.get(f"/api/deliveries/{delivery_id}/tracking", headers=self.intruder_headers)
        self.assertEqual(res_intruder.status_code, 403)

    def test_state_machine_and_location_broadcasting(self):
        # Get delivery
        res = self.client.get(f"/api/bookings/{self.booking_id}/delivery", headers=self.customer_headers)
        delivery_id = res.json()["delivery"]["id"]

        # 1. Customer cannot arbitrarily change lender delivery state
        res_fail = self.client.post(f"/api/deliveries/{delivery_id}/status", json={"status": "OUT_FOR_DELIVERY"}, headers=self.customer_headers)
        self.assertEqual(res_fail.status_code, 403)

        # 2. Lender transitions PENDING -> PREPARING
        res_prep = self.client.post(f"/api/deliveries/{delivery_id}/status", json={"status": "PREPARING"}, headers=self.lender_headers)
        self.assertEqual(res_prep.status_code, 200)
        self.assertEqual(res_prep.json()["delivery"]["status"], "PREPARING")

        # 3. Invalid transition test: Cannot jump from PREPARING to DELIVERED directly
        res_invalid = self.client.post(f"/api/deliveries/{delivery_id}/status", json={"status": "DELIVERED"}, headers=self.lender_headers)
        self.assertEqual(res_invalid.status_code, 400)

        # 4. Valid transitions: PREPARING -> READY -> OUT_FOR_DELIVERY
        self.client.post(f"/api/deliveries/{delivery_id}/status", json={"status": "READY"}, headers=self.lender_headers)
        res_out = self.client.post(f"/api/deliveries/{delivery_id}/status", json={"status": "OUT_FOR_DELIVERY"}, headers=self.lender_headers)
        self.assertEqual(res_out.status_code, 200)
        self.assertEqual(res_out.json()["delivery"]["status"], "OUT_FOR_DELIVERY")

        # 5. GPS location update with validation
        # Bad latitude (> 90) must return 400 or 422
        res_bad_gps = self.client.post(f"/api/deliveries/{delivery_id}/location", json={"latitude": 150.0, "longitude": 77.6}, headers=self.lender_headers)
        self.assertIn(res_bad_gps.status_code, [400, 422])

        # Valid GPS update
        res_gps = self.client.post(f"/api/deliveries/{delivery_id}/location", json={"latitude": 12.9750, "longitude": 77.6350, "speed_kmh": 30.0}, headers=self.lender_headers)
        self.assertEqual(res_gps.status_code, 200)
        self.assertTrue(res_gps.json()["success"])

        # Customer views tracking with real location update
        res_track = self.client.get(f"/api/deliveries/{delivery_id}/tracking", headers=self.customer_headers)
        track_data = res_track.json()["tracking"]
        self.assertEqual(track_data["status"], "OUT_FOR_DELIVERY")
        self.assertIsNotNone(track_data["currentLatitude"])

        # 6. Customer confirms delivery receipt
        res_confirm = self.client.post(f"/api/deliveries/{delivery_id}/confirm", headers=self.customer_headers)
        self.assertEqual(res_confirm.status_code, 200)
        self.assertEqual(res_confirm.json()["delivery"]["status"], "DELIVERED")

        # 7. Privacy check: Location broadcasting is halted once delivered
        res_halted = self.client.post(f"/api/deliveries/{delivery_id}/location", json={"latitude": 12.9760, "longitude": 77.6360}, headers=self.lender_headers)
        self.assertEqual(res_halted.status_code, 400)

    def test_booking_realtime_messaging_flow(self):
        # 1. Customer initiates/retrieves conversation for booking
        res = self.client.get(f"/api/bookings/{self.booking_id}/conversation", headers=self.customer_headers)
        self.assertEqual(res.status_code, 200)
        conv = res.json()["conversation"]
        conv_id = conv["id"]
        self.assertEqual(conv["bookingId"], self.booking_id)

        # 2. Customer sends a message
        res_msg1 = self.client.post(
            f"/api/conversations/{conv_id}/messages",
            json={"content": "Hi! Please include the second battery and charger in the case."},
            headers=self.customer_headers
        )
        self.assertEqual(res_msg1.status_code, 200)
        self.assertEqual(res_msg1.json()["message"]["content"], "Hi! Please include the second battery and charger in the case.")

        # 3. Lender reads conversation and replies
        res_lender_conv = self.client.get(f"/api/conversations/{conv_id}", headers=self.lender_headers)
        self.assertEqual(res_lender_conv.status_code, 200)
        self.assertGreaterEqual(len(res_lender_conv.json()["conversation"]["messages"]), 1)

        res_msg2 = self.client.post(
            f"/api/conversations/{conv_id}/messages",
            json={"content": "Got it! Packed with 2 batteries and 128GB V90 SD card."},
            headers=self.lender_headers
        )
        self.assertEqual(res_msg2.status_code, 200)

        # 4. Mark read
        res_read = self.client.patch(f"/api/conversations/{conv_id}/read", headers=self.customer_headers)
        self.assertEqual(res_read.status_code, 200)

        # 5. Intruder cannot message or read this conversation (IDOR protection)
        res_intruder_msg = self.client.post(
            f"/api/conversations/{conv_id}/messages",
            json={"content": "I am an intruder."},
            headers=self.intruder_headers
        )
        self.assertEqual(res_intruder_msg.status_code, 403)

if __name__ == "__main__":
    unittest.main()
