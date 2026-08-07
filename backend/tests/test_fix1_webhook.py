import unittest
import json
import hmac
import hashlib
import sys
import os
sys.path.insert(0, os.path.abspath("backend"))
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

class TestFix1PaymentWebhookIntegrity(unittest.TestCase):
    def test_a1_fail_fast_when_webhook_secret_missing_in_production(self):
        """Verify that starting config with empty RAZORPAY_WEBHOOK_SECRET in production raises RuntimeError."""
        with patch.dict("os.environ", {
            "ENVIRONMENT": "production",
            "JWT_SECRET_KEY": "supersecretkey_production_test_12345",
            "MYSQL_PASSWORD": "StrongProductionPassword123!",
            "ADMIN_SETUP_CODE": "AdminSetupCode123!",
            "RAZORPAY_WEBHOOK_SECRET": ""
        }):
            import importlib
            with self.assertRaises(RuntimeError) as ctx:
                import config
                importlib.reload(config)
            self.assertIn("RAZORPAY_WEBHOOK_SECRET", str(ctx.exception))

        # Restore development config
        with patch.dict("os.environ", {"ENVIRONMENT": "development", "RAZORPAY_WEBHOOK_SECRET": "test_webhook_secret_12345"}):
            import importlib
            import config
            importlib.reload(config)

    def test_a2_idempotent_duplicate_webhook_processing(self):
        """Verify that duplicate webhook calls return 200 OK without double processing."""
        from database import MOCK_PROCESSED_EVENTS, execute_query
        MOCK_PROCESSED_EVENTS.clear()
        try:
            execute_query("DELETE FROM processed_payment_events WHERE event_id = %s", ("event_test_uuid_unique_1001",))
        except Exception:
            pass

        from main import app
        client = TestClient(app)
        
        webhook_secret = "test_webhook_secret_12345"
        event_payload = {
            "event_id": "event_test_uuid_unique_1001",
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_test_1001",
                        "order_id": "order_rzp_mock_1234"
                    }
                }
            }
        }
        body_bytes = json.dumps(event_payload).encode("utf-8")
        sig = hmac.new(webhook_secret.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()

        headers = {
            "X-Razorpay-Signature": sig,
            "Content-Type": "application/json"
        }

        with patch("main.RAZORPAY_WEBHOOK_SECRET", webhook_secret):
            # First POST call
            resp1 = client.post("/api/payments/webhook", content=body_bytes, headers=headers)
            self.assertEqual(resp1.status_code, 200)
            data1 = resp1.json()
            self.assertEqual(data1.get("status"), "ok")
            self.assertNotIn("note", data1)

            # Second POST call (Duplicate)
            resp2 = client.post("/api/payments/webhook", content=body_bytes, headers=headers)
            self.assertEqual(resp2.status_code, 200)
            data2 = resp2.json()
            self.assertEqual(data2.get("status"), "ok")
            self.assertEqual(data2.get("note"), "duplicate event ignored")

if __name__ == "__main__":
    unittest.main()
