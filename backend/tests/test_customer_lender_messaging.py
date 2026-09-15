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
    MOCK_CONVERSATIONS,
    MOCK_MESSAGES,
    MOCK_ORDERS,
    MOCK_CUSTOM_PRODUCTS,
    get_user_conversations,
    get_conversation_detail,
    get_total_unread_messages_count,
)

class TestCustomerLenderMessaging(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        try:
            init_db()
        except Exception:
            pass

    def setUp(self):
        self.client = TestClient(app)
        self.customer_email = f"customer_{int(time.time() * 1000)}@payent.in"
        self.lender_email = f"lender_{int(time.time() * 1000)}@payent.in"
        self.intruder_email = f"intruder_{int(time.time() * 1000)}@payent.in"

        self.customer_token = create_access_token({"sub": self.customer_email, "email": self.customer_email, "role": "customer"})
        self.lender_token = create_access_token({"sub": self.lender_email, "email": self.lender_email, "role": "customer"})
        self.intruder_token = create_access_token({"sub": self.intruder_email, "email": self.intruder_email, "role": "customer"})

        self.customer_headers = {"Authorization": f"Bearer {self.customer_token}"}
        self.lender_headers = {"Authorization": f"Bearer {self.lender_token}"}
        self.intruder_headers = {"Authorization": f"Bearer {self.intruder_token}"}

        self.product_id = f"test-prod-{int(time.time() * 1000)}"
        self.booking_id = f"test-bk-{int(time.time() * 1000)}"

        MOCK_CUSTOM_PRODUCTS[self.product_id] = {
            "id": self.product_id,
            "user_email": self.lender_email,
            "title": "DJI Mavic 3 Pro Drone",
            "price": 4500,
            "image": "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600",
            "category": "Drones",
            "owner_name": "Alice Lender",
            "available": True,
            "status": "approved"
        }

        MOCK_ORDERS[self.booking_id] = {
            "id": self.booking_id,
            "user_email": self.customer_email,
            "product_id": self.product_id,
            "product_title": "DJI Mavic 3 Pro Drone",
            "product_image": "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600",
            "start_date": "2026-09-20",
            "end_date": "2026-09-22",
            "total_price": 9000,
            "status": "active"
        }

    def test_pre_booking_conversation_flow(self):
        # 1. Customer initiates conversation on product page
        res = self.client.post(
            "/api/conversations",
            json={"product_id": self.product_id, "initial_message": "Is the drone available for rent this weekend?"},
            headers=self.customer_headers
        )
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertTrue(data["success"])
        conv = data["conversation"]
        self.assertIsNotNone(conv["id"])
        conv_id = conv["id"]
        self.assertEqual(conv["productId"], self.product_id)
        self.assertTrue(conv["isCustomer"])
        self.assertEqual(conv["counterparty"]["email"], self.lender_email)

        # 2. Prevent duplicate conversation on re-clicking "Message Lender"
        res2 = self.client.post(
            "/api/conversations",
            json={"product_id": self.product_id},
            headers=self.customer_headers
        )
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.json()["conversation"]["id"], conv_id)

        # 3. Prevent self-messaging (lender messaging their own listing)
        res_self = self.client.post(
            "/api/conversations",
            json={"product_id": self.product_id},
            headers=self.lender_headers
        )
        self.assertEqual(res_self.status_code, 400)
        self.assertIn("own listing", res_self.json()["detail"].lower())

        # 4. Lender sees the conversation in their inbox
        res_lender_list = self.client.get("/api/conversations", headers=self.lender_headers)
        self.assertEqual(res_lender_list.status_code, 200)
        lender_convs = res_lender_list.json()["conversations"]
        self.assertTrue(any(c["id"] == conv_id for c in lender_convs))

        # 5. Lender replies
        res_reply = self.client.post(
            f"/api/conversations/{conv_id}/messages",
            json={"content": "Yes, it is available with 3 extra batteries!"},
            headers=self.lender_headers
        )
        self.assertEqual(res_reply.status_code, 200)
        reply_msg = res_reply.json()["message"]
        self.assertEqual(reply_msg["sender_email"], self.lender_email)
        self.assertEqual(reply_msg["content"], "Yes, it is available with 3 extra batteries!")

        # 6. Customer unread count check
        res_unread = self.client.get("/api/conversations/unread-count", headers=self.customer_headers)
        self.assertEqual(res_unread.status_code, 200)
        self.assertGreaterEqual(res_unread.json()["unreadCount"], 1)

        # 7. Customer marks read
        res_read = self.client.patch(f"/api/conversations/{conv_id}/read", headers=self.customer_headers)
        self.assertEqual(res_read.status_code, 200)

        # 8. IDOR protection: Intruder cannot view or message this conversation
        res_intruder_view = self.client.get(f"/api/conversations/{conv_id}", headers=self.intruder_headers)
        self.assertEqual(res_intruder_view.status_code, 404)

        res_intruder_msg = self.client.post(
            f"/api/conversations/{conv_id}/messages",
            json={"content": "I am an intruder trying to message"},
            headers=self.intruder_headers
        )
        self.assertEqual(res_intruder_msg.status_code, 403)

    def test_booking_conversation_and_attachments(self):
        # 1. Booking-linked conversation
        res = self.client.get(f"/api/bookings/{self.booking_id}/conversation", headers=self.customer_headers)
        self.assertEqual(res.status_code, 200)
        conv = res.json()["conversation"]
        conv_id = conv["id"]
        self.assertEqual(conv["bookingId"], self.booking_id)

        # 2. Upload image attachment in chat
        res_att = self.client.post(
            f"/api/conversations/{conv_id}/attachments",
            json={
                "file_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                "file_name": "pre_inspection_photo.png",
                "file_type": "image/png",
                "file_size": 1024
            },
            headers=self.customer_headers
        )
        self.assertEqual(res_att.status_code, 200)
        att_msg = res_att.json()["message"]
        self.assertEqual(att_msg["message_type"], "IMAGE")
        self.assertEqual(len(att_msg["attachments"]), 1)
        self.assertEqual(att_msg["attachments"][0]["file_name"], "pre_inspection_photo.png")

        # 3. Verify conversation detail contains all messages and attachments
        res_detail = self.client.get(f"/api/conversations/{conv_id}", headers=self.lender_headers)
        self.assertEqual(res_detail.status_code, 200)
        detail = res_detail.json()["conversation"]
        self.assertGreaterEqual(len(detail["messages"]), 2)
        has_att = any(len(m.get("attachments", [])) > 0 for m in detail["messages"])
        self.assertTrue(has_att)

    def test_contact_inquiry_system_independence(self):
        # Verify System A (Contact Inquiries) still functions independently with support_tickets
        contact_payload = {
            "name": "David Business Partner",
            "email": "david.partner@company.com",
            "phone": "+91 9988776655",
            "category": "Business Inquiry",
            "subject": "Corporate Equipment Rental Partnership",
            "message": "We would like to partner with Payent for corporate media production gear rentals."
        }
        res_contact = self.client.post("/api/contact", json=contact_payload)
        self.assertEqual(res_contact.status_code, 200)
        self.assertTrue(res_contact.json()["success"])
        self.assertTrue(res_contact.json()["ticketId"].startswith("INQ-"))

if __name__ == "__main__":
    unittest.main()
