import os
import sys
import time

sys.path.insert(0, r"c:\Users\bommi\payent_project\rentwise-pro\backend")
from database import get_db_connection

conn = get_db_connection()
if not conn:
    print("Failed to get DB connection")
    sys.exit(1)

try:
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM custom_products WHERE status = 'approved' LIMIT 1")
        prod = cur.fetchone()
        pid = prod["id"] if prod else "p-sony-a7iv"
        
        test_user = "test_perf_user@example.com"
        start_d = "2026-10-01"
        end_d = "2026-10-05"
        
        query = """
            SELECT 
                cp.id AS product_id,
                cp.user_email AS owner_email,
                cp.title,
                cp.price,
                cp.image,
                cp.category,
                cp.available,
                cp.status AS product_status,
                cp.hidden,
                u.address AS owner_address,
                u.city AS owner_city,
                u.state AS owner_state,
                u.pincode AS owner_pincode,
                u.status AS owner_status,
                u.verified AS owner_verified,
                a.status AS agent_status,
                (
                    SELECT COUNT(*) 
                    FROM orders o 
                    WHERE o.product_id = cp.id 
                      AND o.status NOT IN ('cancelled', 'refunded', 'rejected')
                      AND o.start_date <= %s 
                      AND o.end_date >= %s
                ) AS conflict_count,
                (
                    SELECT ci.id 
                    FROM cart_items ci 
                    WHERE LOWER(ci.user_email) = LOWER(%s) 
                      AND ci.product_id = cp.id 
                    LIMIT 1
                ) AS existing_cart_item_id
            FROM custom_products cp
            LEFT JOIN users u ON cp.user_email = u.email
            LEFT JOIN agents a ON cp.user_email = a.user_email
            WHERE cp.id = %s
        """
        for i in range(5):
            t0 = time.perf_counter()
            cur.execute(query, (end_d, start_d, test_user, pid))
            row = cur.fetchone()
            t1 = time.perf_counter()
            print(f"Run {i+1}: {(t1 - t0)*1000:.2f} ms")
finally:
    conn.close()
