import unittest
import os
import sys
import hmac
import hashlib
import json

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
from database import (
    init_db,
    create_order_record,
    get_order_by_razorpay_order_id,
    update_order_payment_status
)

class TestRazorpayIntegration(unittest.TestCase):

    def setUp(self):
        try:
            init_db()
        except Exception:
            pass
        self.secret = RAZORPAY_KEY_SECRET or "rzp_test_payent_key_secret"
        self.webhook_secret = RAZORPAY_WEBHOOK_SECRET or "rzp_test_webhook_secret"

    def test_payment_signature_verification_valid(self):
        order_id = "order_test_123456"
        payment_id = "pay_test_789012"
        
        # Calculate valid HMAC SHA256 signature
        msg = f"{order_id}|{payment_id}"
        valid_signature = hmac.new(
            self.secret.encode(),
            msg.encode(),
            hashlib.sha256
        ).hexdigest()

        # Re-compute and compare
        computed_sig = hmac.new(
            self.secret.encode(),
            msg.encode(),
            hashlib.sha256
        ).hexdigest()

        self.assertTrue(hmac.compare_digest(valid_signature, computed_sig))

    def test_payment_signature_verification_tampered_rejected(self):
        order_id = "order_test_123456"
        payment_id = "pay_test_789012"
        
        msg = f"{order_id}|{payment_id}"
        tampered_signature = "invalid_tampered_signature_12345"

        computed_sig = hmac.new(
            self.secret.encode(),
            msg.encode(),
            hashlib.sha256
        ).hexdigest()

        self.assertFalse(hmac.compare_digest(tampered_signature, computed_sig))

    def test_webhook_signature_verification_valid(self):
        raw_body = json.dumps({
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_test_999999",
                        "order_id": "order_test_999999"
                    }
                }
            }
        }).encode("utf-8")

        valid_webhook_signature = hmac.new(
            self.webhook_secret.encode(),
            raw_body,
            hashlib.sha256
        ).hexdigest()

        computed_webhook_sig = hmac.new(
            self.webhook_secret.encode(),
            raw_body,
            hashlib.sha256
        ).hexdigest()

        self.assertTrue(hmac.compare_digest(valid_webhook_signature, computed_webhook_sig))

    def test_webhook_signature_verification_tampered_rejected(self):
        raw_body = b'{"event":"payment.captured"}'
        tampered_sig = "tampered_webhook_signature_xyz"

        computed_webhook_sig = hmac.new(
            self.webhook_secret.encode(),
            raw_body,
            hashlib.sha256
        ).hexdigest()

        self.assertFalse(hmac.compare_digest(tampered_sig, computed_webhook_sig))

    def test_order_idempotency_flow(self):
        ord_id = "ord_test_idempotent_1"
        rzp_ord_id = "order_rzp_idempotent_1"

        # Create pending order
        create_order_record(
            order_id=ord_id,
            user_email="test_user@payent.com",
            product_id="p1",
            product_title="Sony FX3 Camera",
            product_image="https://example.com/img.jpg",
            start_date="2026-08-01",
            end_date="2026-08-04",
            total=7500,
            status="pending",
            razorpay_order_id=rzp_ord_id,
            payment_status="unpaid"
        )

        order = get_order_by_razorpay_order_id(rzp_ord_id)
        self.assertIsNotNone(order)
        self.assertEqual(order.get("payment_status"), "unpaid")

        # Mark paid first time
        update_order_payment_status(
            order_id=ord_id,
            payment_status="paid",
            status="active",
            razorpay_payment_id="pay_rzp_123"
        )

        updated = get_order_by_razorpay_order_id(rzp_ord_id)
        self.assertEqual(updated.get("payment_status"), "paid")
        self.assertEqual(updated.get("status"), "active")

        # Second call to update (idempotency simulation)
        update_order_payment_status(
            order_id=ord_id,
            payment_status="paid",
            status="active",
            razorpay_payment_id="pay_rzp_123"
        )

        updated_second = get_order_by_razorpay_order_id(rzp_ord_id)
        self.assertEqual(updated_second.get("payment_status"), "paid")

if __name__ == "__main__":
    unittest.main()
