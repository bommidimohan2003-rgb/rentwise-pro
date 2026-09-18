import sys
sys.path.insert(0, r"c:\Users\bommi\payent_project\rentwise-pro\backend")
from database import get_db_connection, execute_query, invalidate_user_cache

print("Cleaning up verified test artifacts from live TiDB...")
execute_query("DELETE FROM users WHERE email = 'p10_rejected_e8833fbd@example.com'")
invalidate_user_cache('p10_rejected_e8833fbd@example.com')
execute_query("DELETE FROM custom_products WHERE id IN ('p-ephem-7eff94', 'p-p10-gear-e8833fbd')")

conn = get_db_connection()
if conn:
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT email, full_name, role, status FROM users")
            print("Remaining Users:")
            for u in cur.fetchall():
                print(f"  {u}")
                
            cur.execute("SELECT id, user_email, title FROM custom_products")
            print("Remaining Products:")
            for p in cur.fetchall():
                print(f"  {p}")
    finally:
        conn.close()
print("Cleanup of test artifacts complete. Only legitimate production records remain.")
