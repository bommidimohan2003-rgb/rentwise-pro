import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app
from auth import create_access_token
from database import execute_query, fetch_one

client = TestClient(app)

def test_full_review_lifecycle():
    test_user_email = "creator.test@payent.com"
    test_user_2_email = "other.creator@payent.com"
    
    # 1. Ensure test users exist
    execute_query("DELETE FROM reviews WHERE product_id = %s", ("test-cam-fx3",))
    execute_query("DELETE FROM users WHERE email IN (%s, %s)", (test_user_email, test_user_2_email))
    execute_query("""
        INSERT INTO users (email, full_name, role, city, occupation, created_at)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (test_user_email, "Test Creator", "user", "Mumbai", "Cinematographer", "2026-09-01T00:00:00Z"))
    execute_query("""
        INSERT INTO users (email, full_name, role, city, occupation, created_at)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (test_user_2_email, "Other User", "user", "Delhi", "Photographer", "2026-09-01T00:00:00Z"))

    # Generate tokens
    token_1 = create_access_token({"sub": test_user_email, "role": "user"})
    token_2 = create_access_token({"sub": test_user_2_email, "role": "user"})
    headers_1 = {"Authorization": f"Bearer {token_1}"}
    headers_2 = {"Authorization": f"Bearer {token_2}"}

    # 2. Test Unauthenticated creation -> 401
    resp = client.post("/api/reviews", json={"rating": 5, "comment": "Great camera"})
    assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"

    # 3. Test Ineligible user (no completed bookings) -> 403
    resp = client.post("/api/reviews", json={
        "productId": "sony-fx3",
        "rating": 5,
        "comment": "Attempting unverified review without renting"
    }, headers=headers_1)
    assert resp.status_code == 403, f"Expected 403, got {resp.status_code}: {resp.text}"

    # 4. Create an eligible order for test_user_email
    order_id = "test-ord-rev-999"
    product_id = "test-cam-fx3"
    execute_query("DELETE FROM orders WHERE id = %s", (order_id,))
    execute_query("""
        INSERT INTO orders (id, user_email, product_id, product_title, product_image, start_date, end_date, total, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (order_id, test_user_email, product_id, "Sony FX3 Full-Frame", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500", "2026-08-10", "2026-08-15", 4500, "completed", "2026-08-10T10:00:00Z"))

    # 5. Check eligible bookings endpoint
    resp = client.get("/api/reviews/eligible-bookings", headers=headers_1)
    assert resp.status_code == 200
    eligible = resp.json()
    assert any(b["bookingId"] == order_id for b in eligible), f"Order {order_id} not in eligible list: {eligible}"

    # 6. Post valid verified review
    review_payload = {
        "bookingId": order_id,
        "productId": product_id,
        "rating": 5,
        "comment": "Absolutely outstanding camera! Pristine condition and buttery smooth 4K 120fps."
    }
    resp = client.post("/api/reviews", json=review_payload, headers=headers_1)
    assert resp.status_code == 201, f"Expected 201, got {resp.status_code}: {resp.text}"
    created_review = resp.json()
    review_id = created_review["id"]
    assert created_review["isVerified"] is True
    assert created_review["userName"] == "Test Creator"
    assert created_review["userLocation"] == "Mumbai"
    assert created_review["userRole"] == "Cinematographer"

    # 7. Check Duplicate prevention for same booking -> 400
    resp_dup = client.post("/api/reviews", json=review_payload, headers=headers_1)
    assert resp_dup.status_code == 400, f"Expected 400 for duplicate, got {resp_dup.status_code}"

    # 8. Check eligible bookings now excludes the reviewed booking
    resp_eligible_after = client.get("/api/reviews/eligible-bookings", headers=headers_1)
    assert not any(b["bookingId"] == order_id for b in resp_eligible_after.json())

    # 9. Verify GET /api/reviews returns the new review
    resp_list = client.get(f"/api/reviews?product_id={product_id}")
    assert resp_list.status_code == 200
    list_data = resp_list.json()
    assert list_data["pagination"]["total"] >= 1
    assert any(r["id"] == review_id for r in list_data["reviews"])

    # 10. Verify GET /api/reviews/stats reflects 5-star rating
    resp_stats = client.get(f"/api/reviews/stats?product_id={product_id}")
    assert resp_stats.status_code == 200
    stats = resp_stats.json()
    assert stats["totalReviews"] >= 1
    assert stats["averageRating"] == 5.0
    assert stats["ratingDistribution"]["5"] >= 1

    # 11. Test unauthorized edit by user 2 -> 403
    resp_unauth_edit = client.put(f"/api/reviews/{review_id}", json={"rating": 4, "comment": "Hacked comment"}, headers=headers_2)
    assert resp_unauth_edit.status_code == 403

    # 12. Test authorized edit by user 1 -> 200
    resp_edit = client.put(f"/api/reviews/{review_id}", json={"rating": 4, "comment": "Updated: Super great camera, minor scuff on battery door."}, headers=headers_1)
    assert resp_edit.status_code == 200
    updated_rev = resp_edit.json()
    assert updated_rev["rating"] == 4
    assert "battery door" in updated_rev["comment"]

    # 13. Test unauthorized delete by user 2 -> 403
    resp_unauth_del = client.delete(f"/api/reviews/{review_id}", headers=headers_2)
    assert resp_unauth_del.status_code == 403

    # 14. Test authorized delete by user 1 -> 200
    resp_del = client.delete(f"/api/reviews/{review_id}", headers=headers_1)
    assert resp_del.status_code == 200

    # 15. Verify deleted from list and DB clean
    resp_after_del = client.get(f"/api/reviews?product_id={product_id}")
    assert not any(r["id"] == review_id for r in resp_after_del.json()["reviews"])

    # Cleanup test data
    execute_query("DELETE FROM orders WHERE id = %s", (order_id,))
    execute_query("DELETE FROM users WHERE email IN (%s, %s)", (test_user_email, test_user_2_email))
    print("ALL REVIEW LIFECYCLE TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_full_review_lifecycle()
