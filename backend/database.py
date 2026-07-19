import pymysql
from datetime import datetime
from config import MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB

def get_db_connection():
    # Connect to MySQL Server first without database to ensure it exists
    conn = pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        cursorclass=pymysql.cursors.DictCursor
    )
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {MYSQL_DB}")
        conn.select_db(MYSQL_DB)
    except Exception as e:
        conn.close()
        raise e
    return conn

def execute_query(query: str, params: tuple = ()):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, params)
        conn.commit()
    finally:
        conn.close()

def fetch_one(query: str, params: tuple = ()):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchone()
    finally:
        conn.close()

def init_db():
    # Create users table
    execute_query("""
        CREATE TABLE IF NOT EXISTS users (
            email VARCHAR(255) PRIMARY KEY,
            phone VARCHAR(50),
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(255),
            role VARCHAR(50) DEFAULT 'user',
            created_at VARCHAR(100) NOT NULL
        )
    """)
    
    # Create OTPs table
    execute_query("""
        CREATE TABLE IF NOT EXISTS otps (
            email VARCHAR(255) PRIMARY KEY,
            phone VARCHAR(50),
            otp VARCHAR(10) NOT NULL,
            created_at VARCHAR(100) NOT NULL
        )
    """)

    # Create wishlist table
    execute_query("""
        CREATE TABLE IF NOT EXISTS wishlist (
            email VARCHAR(255),
            product_id VARCHAR(255),
            PRIMARY KEY (email, product_id)
        )
    """)

    # Create orders table
    execute_query("""
        CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(255) PRIMARY KEY,
            user_email VARCHAR(255),
            product_id VARCHAR(255),
            product_title VARCHAR(255),
            product_image LONGTEXT,
            start_date VARCHAR(100),
            end_date VARCHAR(100),
            total INT,
            status VARCHAR(50),
            created_at VARCHAR(100)
        )
    """)

    # Create custom_products table
    execute_query("""
        CREATE TABLE IF NOT EXISTS custom_products (
            id VARCHAR(255) PRIMARY KEY,
            user_email VARCHAR(255),
            title VARCHAR(255),
            description TEXT,
            price INT,
            image LONGTEXT,
            category VARCHAR(100),
            rating DECIMAL(3, 2),
            reviews INT,
            available BOOLEAN,
            owner_name VARCHAR(255),
            owner_avatar VARCHAR(1000),
            owner_rating DECIMAL(3, 2),
            created_at VARCHAR(100)
        )
    """)

    # Create notifications table
    execute_query("""
        CREATE TABLE IF NOT EXISTS notifications (
            id VARCHAR(255) PRIMARY KEY,
            user_email VARCHAR(255),
            title VARCHAR(255),
            message VARCHAR(1000),
            type VARCHAR(50),
            is_read BOOLEAN,
            created_at VARCHAR(100)
        )
    """)

    # Migrate existing databases that might have been initialized with VARCHAR(1000)
    try:
        execute_query("ALTER TABLE custom_products MODIFY COLUMN image LONGTEXT")
        print("Migrated custom_products.image column to LONGTEXT.")
    except Exception as e:
        print(f"Failed to migrate custom_products.image: {e}")

    try:
        execute_query("ALTER TABLE orders MODIFY COLUMN product_image LONGTEXT")
        print("Migrated orders.product_image column to LONGTEXT.")
    except Exception as e:
        print(f"Failed to migrate orders.product_image: {e}")

    # Seed initial data if tables are empty
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Seed users
            from auth import hash_password
            now_str = datetime.utcnow().isoformat()
            users_data = [
                ("admin@payent.com", "+919876543210", hash_password("admin@123"), "Sarah Connor", "admin", now_str),
                ("alex@example.com", "+919876543211", hash_password("mohan@1234"), "Alex Mercer", "agent", now_str),
                ("emily@example.com", "+919876543212", hash_password("mohan@1234"), "Emily Davis", "agent", now_str),
                ("michael@example.com", "+919876543213", hash_password("mohan@1234"), "Michael Chang", "user", now_str),
                ("jessica@example.com", "+919876543214", hash_password("mohan@1234"), "Jessica Ross", "user", now_str),
            ]
            cursor.executemany(
                "REPLACE INTO users (email, phone, password_hash, full_name, role, created_at) VALUES (%s, %s, %s, %s, %s, %s)",
                users_data
            )
            print("Seeded initial users.")

            # Seed products
            products_data = [
                ("p-1", "alex@example.com", "Sony FX3 Cinema Camera", "Compact cinema camera with full-frame sensor, outstanding low-light capabilities.", 120, "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500", "Cameras", 4.90, 15, True, "Alex Mercer", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", 4.80, now_str),
                ("p-2", "alex@example.com", "DJI Inspire 3 Drone", "Professional cinema drone with 8K sensor, full-frame capability.", 350, "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=500", "Drones", 4.80, 9, True, "Alex Mercer", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", 4.80, now_str),
                ("p-3", "emily@example.com", "MacBook Pro 16\" M3 Max", "16-inch liquid retina XDR display, Apple M3 Max chip with 16-core CPU.", 95, "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500", "Computers", 4.70, 22, True, "Emily Davis", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", 4.50, now_str),
                ("p-4", "alex@example.com", "DJI Ronin 4D 4-Axis Stabilizer", "Next-gen camera stabilizer with integrated LiDAR range finder and wireless video transmission.", 180, "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=500", "Stabilizers", 4.90, 7, True, "Alex Mercer", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", 4.80, now_str),
                ("p-5", "emily@example.com", "RED V-Raptor 8K Camera", "High-performance cinema camera with 8K multi-format sensor and REDCODE RAW recording.", 450, "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500", "Cameras", 5.00, 4, True, "Emily Davis", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", 4.50, now_str),
                ("p-6", "emily@example.com", "Sennheiser Ambeo VR Mic", "Ambisonics microphone designed for 3D spatial audio recording in VR/AR productions.", 40, "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500", "Audio", 4.60, 11, True, "Emily Davis", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", 4.50, now_str),
            ]
            cursor.executemany(
                "REPLACE INTO custom_products (id, user_email, title, description, price, image, category, rating, reviews, available, owner_name, owner_avatar, owner_rating, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                products_data
            )
            print("Seeded initial products.")

            # Seed orders (bookings)
            orders_data = [
                ("b-1", "michael@example.com", "p-1", "Sony FX3 Cinema Camera", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500", "2026-07-10", "2026-07-13", 360, "completed", now_str),
                ("b-2", "jessica@example.com", "p-3", "MacBook Pro 16\" M3 Max", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500", "2026-07-20", "2026-07-25", 475, "pending", now_str),
                ("b-3", "michael@example.com", "p-2", "DJI Inspire 3 Drone", "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=500", "2026-06-01", "2026-06-05", 1400, "completed", now_str),
            ]
            cursor.executemany(
                "REPLACE INTO orders (id, user_email, product_id, product_title, product_image, start_date, end_date, total, status, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                orders_data
            )
            print("Seeded initial bookings.")
        conn.commit()
    finally:
        conn.close()

    print("MySQL database structures initialized.")

def get_user(email: str):
    return fetch_one("SELECT * FROM users WHERE email = %s", (email,))

def create_user(email: str, phone: str, password_hash: str, full_name: str, role: str = "user"):
    created_at = datetime.utcnow().isoformat()
    execute_query(
        "INSERT INTO users (email, phone, password_hash, full_name, role, created_at) VALUES (%s, %s, %s, %s, %s, %s)",
        (email, phone, password_hash, full_name, role, created_at)
    )
    return {
        "email": email,
        "phone": phone,
        "fullName": full_name,
        "role": role,
        "createdAt": created_at
    }

def update_user_password(email: str, password_hash: str):
    execute_query("UPDATE users SET password_hash = %s WHERE email = %s", (password_hash, email))

def save_otp(email: str, phone: str, otp: str):
    created_at = datetime.utcnow().isoformat()
    execute_query(
        "REPLACE INTO otps (email, phone, otp, created_at) VALUES (%s, %s, %s, %s)",
        (email, phone, otp, created_at)
    )

def get_otp(email: str):
    return fetch_one("SELECT * FROM otps WHERE email = %s", (email,))

def delete_otp(email: str):
    execute_query("DELETE FROM otps WHERE email = %s", (email,))

# Wishlist CRUD
def get_wishlist(email: str):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT product_id FROM wishlist WHERE email = %s", (email,))
            return [row["product_id"] for row in cursor.fetchall()]
    finally:
        conn.close()

def toggle_wishlist(email: str, product_id: str):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1 FROM wishlist WHERE email = %s AND product_id = %s", (email, product_id))
            exists = cursor.fetchone()
            if exists:
                cursor.execute("DELETE FROM wishlist WHERE email = %s AND product_id = %s", (email, product_id))
            else:
                cursor.execute("INSERT INTO wishlist (email, product_id) VALUES (%s, %s)", (email, product_id))
        conn.commit()
    finally:
        conn.close()

# Orders CRUD
def get_orders(email: str):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM orders WHERE user_email = %s ORDER BY created_at DESC", (email,))
            return cursor.fetchall()
    finally:
        conn.close()

def create_order(email: str, order: dict):
    execute_query("""
        INSERT INTO orders (id, user_email, product_id, product_title, product_image, start_date, end_date, total, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        order["id"],
        email,
        order["productId"],
        order["productTitle"],
        order["productImage"],
        order["startDate"],
        order["endDate"],
        order["total"],
        order["status"],
        order.get("createdAt") or datetime.utcnow().isoformat()
    ))
    return order

def cancel_order(order_id: str):
    execute_query("UPDATE orders SET status = 'cancelled' WHERE id = %s", (order_id,))

# Custom Products CRUD
def get_custom_products(email: str):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM custom_products WHERE user_email = %s ORDER BY created_at DESC", (email,))
            return cursor.fetchall()
    finally:
        conn.close()

def get_all_custom_products():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM custom_products ORDER BY created_at DESC")
            return cursor.fetchall()
    finally:
        conn.close()

def create_custom_product(email: str, product: dict):
    created_at = datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO custom_products (id, user_email, title, description, price, image, category, rating, reviews, available, owner_name, owner_avatar, owner_rating, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        product["id"],
        email,
        product["title"],
        product["description"],
        product["price"],
        product["image"],
        product["category"],
        product.get("rating", 5.0),
        product.get("reviews", 0),
        product.get("available", True),
        product["owner"]["name"],
        product["owner"]["avatar"],
        product["owner"].get("rating", 5.0),
        created_at
    ))
    return product

# Notifications CRUD
def get_notifications(email: str):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM notifications WHERE user_email = %s ORDER BY created_at DESC", (email,))
            return cursor.fetchall()
    finally:
        conn.close()

def create_notification(email: str, n: dict):
    execute_query("""
        INSERT INTO notifications (id, user_email, title, message, type, is_read, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (
        n["id"],
        email,
        n["title"],
        n["message"],
        n["type"],
        n.get("read") or n.get("is_read") or False,
        n.get("createdAt") or n.get("created_at") or datetime.utcnow().isoformat()
    ))

def mark_notifications_read(email: str):
    execute_query("UPDATE notifications SET is_read = TRUE WHERE user_email = %s", (email,))

def delete_custom_product(product_id: str, email: str):
    execute_query("DELETE FROM custom_products WHERE id = %s AND user_email = %s", (product_id, email))

def toggle_custom_product_availability(product_id: str, email: str):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT available FROM custom_products WHERE id = %s AND user_email = %s", (product_id, email))
            row = cursor.fetchone()
            if row:
                new_val = not bool(row["available"])
                cursor.execute("UPDATE custom_products SET available = %s WHERE id = %s AND user_email = %s", (new_val, product_id, email))
                conn.commit()
                return new_val
            return None
    finally:
        conn.close()

