import sys
sys.path.insert(0, r"c:\Users\bommi\payent_project\rentwise-pro\backend")
from database import get_db_connection

conn = get_db_connection()
if not conn:
    sys.exit(1)

try:
    with conn.cursor() as cur:
        test_pids = ['p-ephem-7eff94', 'p-p10-gear-e8833fbd']
        test_emails = ['p10_rejected_e8833fbd@example.com', 'ephem_lender_762ed8@example.com', 'p10_lender_e8833fbd@payent.com']
        
        print("Checking test product references in orders:")
        cur.execute("SELECT id, product_id, user_email, status FROM orders WHERE product_id IN (%s, %s)", tuple(test_pids))
        print(cur.fetchall())
        
        print("Checking test product references in cart_items:")
        cur.execute("SELECT id, product_id, user_email FROM cart_items WHERE product_id IN (%s, %s)", tuple(test_pids))
        print(cur.fetchall())

        print("Checking test email references in orders:")
        cur.execute("SELECT id, product_id, user_email FROM orders WHERE user_email IN (%s, %s, %s)", tuple(test_emails))
        print(cur.fetchall())

        print("Checking test email references in cart_items:")
        cur.execute("SELECT id, product_id, user_email FROM cart_items WHERE user_email IN (%s, %s, %s)", tuple(test_emails))
        print(cur.fetchall())
        
        print("Checking test email references in notifications:")
        cur.execute("SELECT id, email, title FROM notifications WHERE email IN (%s, %s, %s)", tuple(test_emails))
        print(cur.fetchall())

        print("Checking cart_items total:")
        cur.execute("SELECT * FROM cart_items")
        print(cur.fetchall())
finally:
    conn.close()
