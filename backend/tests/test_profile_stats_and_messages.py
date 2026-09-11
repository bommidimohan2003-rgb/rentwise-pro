import os
import unittest
import json
from fastapi.testclient import TestClient

os.environ["FASTAPI_ENV"] = "testing"
os.environ["PAYENT_ENABLE_TESTING_ENDPOINTS"] = "true"
os.environ["JWT_SECRET_KEY"] = "test-jwt-secret-key-1234567890"

from main import app
from auth import create_access_token
from database import init_db, execute_query

class TestProfileStatsAndMessages(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        try:
            init_db()
        except Exception as e:
            print(f"init_db notice: {e}")

    def setUp(self):
        self.client = TestClient(app)
        self.test_user_email = "stats_test_user@payent.com"
        self.token = create_access_token({"sub": self.test_user_email, "email": self.test_user_email, "role": "customer"})
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_profile_stats_real_aggregation(self):
        # 1. Unauthenticated request should fail with 401
        res_unauth = self.client.get("/api/profile/stats")
        self.assertEqual(res_unauth.status_code, 401)

        # 2. Authenticated user with 0 bookings should return clean real stats
        res = self.client.get("/api/profile/stats", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("completed_rentals", data)
        self.assertIn("lender_rating", data)
        self.assertIn("review_count", data)
        self.assertIn("on_time_return_rate", data)
        self.assertIn("average_response_time_minutes", data)
        self.assertIsInstance(data["completed_rentals"], int)

    def test_public_stats_real_counts(self):
        res = self.client.get("/api/stats/public")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("activeListings", data)
        self.assertIn("totalRentals", data)
        self.assertIn("happyLenders", data)
        self.assertIn("citiesCovered", data)
        self.assertIsInstance(data["activeListings"], int)
        self.assertIsInstance(data["totalRentals"], int)

    def test_messages_flow_and_authorization(self):
        # 1. Create a new inquiry/conversation
        payload = {
            "subject": "Test Inquiry for Sony A7S III",
            "category": "Rental Question",
            "message": "Is this camera kit available with 2 extra batteries?"
        }
        res_create = self.client.post("/api/messages/new", json=payload, headers=self.headers)
        self.assertEqual(res_create.status_code, 200)
        conv_data = res_create.json()
        self.assertTrue(conv_data["success"])
        conv_id = conv_data["id"]

        # 2. Fetch conversation list
        res_list = self.client.get("/api/messages", headers=self.headers)
        self.assertEqual(res_list.status_code, 200)
        conversations = res_list.json()
        self.assertTrue(any(c["id"] == conv_id for c in conversations))

        # 3. Fetch conversation detail
        res_detail = self.client.get(f"/api/messages/{conv_id}", headers=self.headers)
        self.assertEqual(res_detail.status_code, 200)
        detail_data = res_detail.json()
        self.assertEqual(detail_data["id"], conv_id)
        self.assertGreaterEqual(len(detail_data["messages"]), 1)

        # 4. Reply to conversation
        reply_payload = {"message": "Yes, we also need an SD card."}
        res_reply = self.client.post(f"/api/messages/{conv_id}/reply", json=reply_payload, headers=self.headers)
        self.assertEqual(res_reply.status_code, 200)
        reply_data = res_reply.json()
        self.assertTrue(reply_data["success"])
        self.assertGreaterEqual(len(reply_data["messages"]), 2)

        # 5. Mark conversation as read
        res_read = self.client.patch(f"/api/messages/{conv_id}/read", headers=self.headers)
        self.assertEqual(res_read.status_code, 200)
        self.assertTrue(res_read.json()["success"])

        # 6. Verify another user CANNOT access this conversation (Authorization check)
        other_token = create_access_token({"sub": "other_unauth_user@payent.com", "email": "other_unauth_user@payent.com", "role": "customer"})
        other_headers = {"Authorization": f"Bearer {other_token}"}
        res_forbidden = self.client.get(f"/api/messages/{conv_id}", headers=other_headers)
        self.assertEqual(res_forbidden.status_code, 403)

    def test_contact_form_submission(self):
        contact_payload = {
            "name": "Alex Tester",
            "email": "alex.tester@example.com",
            "phone": "+919876543210",
            "category": "Technical Issue",
            "subject": "Issue with calendar date picker",
            "message": "The calendar selector was loading slightly slowly on my 4G connection."
        }
        res = self.client.post("/api/contact", json=contact_payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIn("ticketId", data)

if __name__ == "__main__":
    unittest.main()
