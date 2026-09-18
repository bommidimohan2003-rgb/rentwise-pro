import sys
sys.path.insert(0, r"c:\Users\bommi\payent_project\rentwise-pro\backend")
from database import get_db_connection

conn = get_db_connection()
if not conn:
    sys.exit(1)

try:
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM cart_items")
        print("Active Cart Items:")
        print(cur.fetchall())
        
        cur.execute("DESCRIBE notifications")
        print("Notifications schema:")
        print([r["Field"] for r in cur.fetchall()])
        
        cur.execute("SELECT * FROM notifications")
        print("Existing notifications:")
        print(cur.fetchall())
finally:
    conn.close()
