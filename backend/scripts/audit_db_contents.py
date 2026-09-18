import sys
import os

sys.path.insert(0, r"c:\Users\bommi\payent_project\rentwise-pro\backend")
from database import get_db_connection

conn = get_db_connection()
if not conn:
    print("Failed to connect to TiDB Cloud database.")
    sys.exit(1)

try:
    with conn.cursor() as cur:
        # Check table row counts
        tables = [
            "users", "custom_products", "orders", "cart_items", "otps", 
            "wishlist", "sessions", "token_blocklist", "reviews", "reports", 
            "admin_logs", "admin_notifications", "notifications", "payments", 
            "processed_payment_events", "deliveries", "delivery_location_updates", 
            "conversations", "conversation_members", "messages"
        ]
        print("=" * 60)
        print("TIDB CLOUD DATABASE CURRENT STATE AUDIT")
        print("=" * 60)
        for tbl in tables:
            try:
                cur.execute(f"SELECT COUNT(*) as count FROM `{tbl}`")
                row = cur.fetchone()
                cnt = row["count"] if row else 0
                print(f"{tbl:<30}: {cnt} rows")
            except Exception as e:
                print(f"{tbl:<30}: ERROR ({e})")
                
        print("\n" + "=" * 60)
        print("LEGITIMATE PRODUCTION USERS AUDIT")
        print("=" * 60)
        cur.execute("SELECT email, full_name, role, status, verified, created_at FROM users")
        users = cur.fetchall() or []
        for u in users:
            print(f"User: {u.get('email')} | Name: {u.get('full_name')} | Role: {u.get('role')} | Status: {u.get('status')} | Verified: {u.get('verified')} | Created: {u.get('created_at')}")

        print("\n" + "=" * 60)
        print("CUSTOM PRODUCTS AUDIT")
        print("=" * 60)
        cur.execute("SELECT id, user_email, title, price, available, status, created_at FROM custom_products")
        prods = cur.fetchall() or []
        for p in prods:
            print(f"Product: {p.get('id')} | Owner: {p.get('user_email')} | Title: {p.get('title')} | Price: {p.get('price')} | Avail: {p.get('available')} | Status: {p.get('status')}")

finally:
    conn.close()
