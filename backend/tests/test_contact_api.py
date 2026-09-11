import unittest
from fastapi.testclient import TestClient
from backend.main import app

class TestContactApi(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_contact_submission_success(self):
        payload = {
            "name": "Sarah Jenkins",
            "email": "sarah.jenkins@example.com",
            "phone": "+91 9876543210",
            "category": "Rental Question",
            "subject": "Inquiry regarding Sony FX3 rental availability",
            "message": "Hello, I am planning an indie documentary shoot next week and wanted to check camera package availability."
        }
        response = self.client.post("/api/contact", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("INQ-", data.get("ticketId", ""))
        self.assertEqual(data.get("message"), "Message sent successfully. We received your message.")

    def test_contact_validation_failure(self):
        # Invalid email and too short message
        payload = {
            "name": "S",
            "email": "not-an-email",
            "subject": "Hi",
            "message": "short"
        }
        response = self.client.post("/api/contact", json=payload)
        self.assertEqual(response.status_code, 422)

if __name__ == "__main__":
    unittest.main()
