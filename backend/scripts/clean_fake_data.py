import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database import get_db_connection, execute_query, MOCK_CUSTOM_PRODUCTS

def clean_fake_data():
    conn = get_db_connection()
    if not conn:
        print("Could not connect to database.")
        return

    try:
        with conn.cursor() as cursor:
            # 1. Identify fake users
            cursor.execute("""
                SELECT email FROM users 
                WHERE email LIKE '%@example.com' 
                   OR email LIKE '%@payent.com'
                   OR email LIKE '%@test.com'
                   OR email LIKE 'test_%'
            """)
            fake_users = [r['email'] for r in cursor.fetchall()]
            print(f"Found {len(fake_users)} fake users to remove: {fake_users}")

            # 2. Identify fake products
            cursor.execute("""
                SELECT id, title, user_email FROM custom_products 
                WHERE user_email LIKE '%@example.com' 
                   OR user_email LIKE '%@payent.com'
                   OR user_email LIKE '%@test.com'
                   OR title LIKE '%Test%' 
                   OR title LIKE '%Pending User Drone%'
                   OR title LIKE '%Approve Me Gear%'
                   OR title LIKE '%Reject Me Gear%'
                   OR id LIKE '%test%'
            """)
            fake_prods = cursor.fetchall()
            print(f"Found {len(fake_prods)} fake products to remove: {[p['title'] for p in fake_prods]}")

            # 3. Delete related fake records
            for u in fake_users:
                execute_query("DELETE FROM cart_items WHERE user_email = %s", (u,))
                execute_query("DELETE FROM wishlist WHERE user_email = %s", (u,))
                execute_query("DELETE FROM notifications WHERE user_email = %s", (u,))
                execute_query("DELETE FROM password_reset_tokens WHERE user_email = %s", (u,))
                execute_query("DELETE FROM otps WHERE email = %s", (u,))
                execute_query("DELETE FROM sessions WHERE user_email = %s", (u,))
                execute_query("DELETE FROM auth_rate_limits WHERE identifier = %s", (u,))
                execute_query("DELETE FROM conversation_members WHERE user_email = %s", (u,))
                execute_query("DELETE FROM agents WHERE user_email = %s", (u,))
                execute_query("DELETE FROM users WHERE email = %s", (u,))

            for p in fake_prods:
                pid = p['id']
                execute_query("DELETE FROM cart_items WHERE product_id = %s", (pid,))
                execute_query("DELETE FROM wishlist WHERE product_id = %s", (pid,))
                execute_query("DELETE FROM reviews WHERE product_id = %s", (pid,))
                execute_query("DELETE FROM reports WHERE product_id = %s", (pid,))
                execute_query("DELETE FROM custom_products WHERE id = %s", (pid,))
                MOCK_CUSTOM_PRODUCTS.pop(pid, None)

        print("Cleanup completed successfully.")
    finally:
        conn.close()

if __name__ == "__main__":
    clean_fake_data()
