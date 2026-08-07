import pymysql
from datetime import datetime
from config import MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB

def get_db_connection():
    # Attempt connecting directly to the specified database first (ideal for cloud MySQL like Railway/Aiven/PlanetScale)
    try:
        return pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DB,
            cursorclass=pymysql.cursors.DictCursor,
            connect_timeout=10
        )
    except Exception:
        # Fallback to connecting without database and creating database if it does not exist yet
        conn = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            cursorclass=pymysql.cursors.DictCursor,
            connect_timeout=10
        )
        try:
            with conn.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DB}`")
            conn.select_db(MYSQL_DB)
        except Exception:
            pass
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
    # Helper to safely add column if not exists
    def add_column_safely(table: str, column_def: str):
        try:
            execute_query(f"ALTER TABLE {table} ADD COLUMN {column_def}")
            print(f"Added column {column_def} to {table} successfully.")
        except Exception as e:
            if hasattr(e, 'args') and len(e.args) > 0 and e.args[0] == 1060:
                pass  # Column already exists
            else:
                print(f"Notice: Altering {table} for {column_def} got: {e}")

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
    
    # Safely alter users table for new fields
    add_column_safely("users", "status VARCHAR(50) DEFAULT 'active'")
    add_column_safely("users", "verified BOOLEAN DEFAULT TRUE")
    add_column_safely("users", "avatar VARCHAR(1000) DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'")
    add_column_safely("users", "address VARCHAR(500)")
    add_column_safely("users", "city VARCHAR(100)")
    add_column_safely("users", "pincode VARCHAR(20)")

    # Create token_blocklist table for server-side JWT revocation
    execute_query("""
        CREATE TABLE IF NOT EXISTS token_blocklist (
            jti VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255),
            expires_at INT,
            created_at VARCHAR(100) NOT NULL
        )
    """)

    # Create auth_rate_limits table for brute-force tracking
    execute_query("""
        CREATE TABLE IF NOT EXISTS auth_rate_limits (
            key_id VARCHAR(255) PRIMARY KEY,
            attempts INT DEFAULT 1,
            last_attempt INT,
            locked_until INT DEFAULT 0
        )
    """)

    # Create OTPs table
    execute_query("""
        CREATE TABLE IF NOT EXISTS otps (
            email VARCHAR(255) PRIMARY KEY,
            phone VARCHAR(50),
            otp VARCHAR(10) NOT NULL,
            attempts INT DEFAULT 0,
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

    # Safely alter orders table for Razorpay payment fields
    add_column_safely("orders", "razorpay_order_id VARCHAR(255)")
    add_column_safely("orders", "razorpay_payment_id VARCHAR(255)")
    add_column_safely("orders", "razorpay_signature VARCHAR(500)")
    add_column_safely("orders", "payment_status VARCHAR(50) DEFAULT 'unpaid'")
    add_column_safely("orders", "refund_id VARCHAR(255)")
    add_column_safely("orders", "refund_status VARCHAR(50)")

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

    # Safely alter custom_products table for new fields
    add_column_safely("custom_products", "status VARCHAR(50) DEFAULT 'approved'")
    add_column_safely("custom_products", "featured BOOLEAN DEFAULT FALSE")
    add_column_safely("custom_products", "hidden BOOLEAN DEFAULT FALSE")
    add_column_safely("custom_products", "images LONGTEXT")
    add_column_safely("custom_products", "documents LONGTEXT")

    # Create notifications table (user-facing)
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

    # Create categories table
    execute_query("""
        CREATE TABLE IF NOT EXISTS categories (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) UNIQUE,
            icon VARCHAR(100),
            color VARCHAR(100),
            enabled BOOLEAN DEFAULT TRUE
        )
    """)

    # Create reviews table
    execute_query("""
        CREATE TABLE IF NOT EXISTS reviews (
            id VARCHAR(255) PRIMARY KEY,
            product_id VARCHAR(255),
            product_title VARCHAR(255),
            user_name VARCHAR(255),
            user_avatar VARCHAR(1000),
            rating INT,
            comment TEXT,
            hidden BOOLEAN DEFAULT FALSE,
            created_at VARCHAR(100)
        )
    """)

    # Create reports table
    execute_query("""
        CREATE TABLE IF NOT EXISTS reports (
            id VARCHAR(255) PRIMARY KEY,
            reason VARCHAR(1000),
            evidence TEXT,
            product_id VARCHAR(255),
            product_title VARCHAR(255),
            reporter_name VARCHAR(255),
            owner_name VARCHAR(255),
            owner_id VARCHAR(255),
            status VARCHAR(50) DEFAULT 'open',
            created_at VARCHAR(100)
        )
    """)

    # Create admin_notifications table
    execute_query("""
        CREATE TABLE IF NOT EXISTS admin_notifications (
            id VARCHAR(255) PRIMARY KEY,
            title VARCHAR(255),
            message VARCHAR(1000),
            type VARCHAR(50),
            is_read BOOLEAN DEFAULT FALSE,
            created_at VARCHAR(100)
        )
    """)

    # Create support_tickets table
    execute_query("""
        CREATE TABLE IF NOT EXISTS support_tickets (
            id VARCHAR(255) PRIMARY KEY,
            subject VARCHAR(255),
            category VARCHAR(255),
            status VARCHAR(50) DEFAULT 'open',
            priority VARCHAR(50) DEFAULT 'medium',
            user_name VARCHAR(255),
            user_email VARCHAR(255),
            messages LONGTEXT,
            created_at VARCHAR(100)
        )
    """)

    # Create admin_settings table
    execute_query("""
        CREATE TABLE IF NOT EXISTS admin_settings (
            id INT PRIMARY KEY,
            website_name VARCHAR(255),
            logo_url VARCHAR(1000),
            theme VARCHAR(50),
            contact_email VARCHAR(255),
            contact_phone VARCHAR(255),
            social_facebook VARCHAR(255),
            social_twitter VARCHAR(255),
            social_instagram VARCHAR(255),
            seo_title VARCHAR(255),
            seo_description TEXT,
            homepage_banner_text TEXT,
            footer_text TEXT
        )
    """)

    # Create admin_logs table
    execute_query("""
        CREATE TABLE IF NOT EXISTS admin_logs (
            id VARCHAR(255) PRIMARY KEY,
            timestamp VARCHAR(100),
            user_name VARCHAR(255),
            action VARCHAR(255),
            module VARCHAR(255),
            ip_address VARCHAR(100)
        )
    """)

    # Create payments table
    execute_query("""
        CREATE TABLE IF NOT EXISTS payments (
            id VARCHAR(255) PRIMARY KEY,
            booking_id VARCHAR(255),
            customer_id VARCHAR(255),
            customer_name VARCHAR(255),
            amount INT,
            status VARCHAR(50),
            method VARCHAR(100),
            invoice_url VARCHAR(1000),
            created_at VARCHAR(100)
        )
    """)

    # Create processed_payment_events table for webhook idempotency
    execute_query("""
        CREATE TABLE IF NOT EXISTS processed_payment_events (
            event_id VARCHAR(255) PRIMARY KEY,
            event_type VARCHAR(100),
            payment_id VARCHAR(255),
            order_id VARCHAR(255),
            created_at VARCHAR(100)
        )
    """)

    # Create user_events table for behavioral recommendation tracking
    execute_query("""
        CREATE TABLE IF NOT EXISTS user_events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_email VARCHAR(255) NULL,
            session_id VARCHAR(255) NULL,
            event_type VARCHAR(50) NOT NULL,
            product_id VARCHAR(255) NULL,
            category VARCHAR(100) NULL,
            search_query VARCHAR(255) NULL,
            recommendation_type VARCHAR(100) NULL,
            variant VARCHAR(10) NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user (user_email),
            INDEX idx_session (session_id),
            INDEX idx_event_type (event_type),
            INDEX idx_created (created_at),
            INDEX idx_product (product_id)
        )
    """)

    # Create item_similarities table for precomputed collaborative filtering similarity matrix
    execute_query("""
        CREATE TABLE IF NOT EXISTS item_similarities (
            product_id_a VARCHAR(255) NOT NULL,
            product_id_b VARCHAR(255) NOT NULL,
            score DECIMAL(5, 4) NOT NULL,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (product_id_a, product_id_b)
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
            # Purge mock/test data & reset analytics records for clean startup
            cursor.execute("DELETE FROM users WHERE email LIKE '%@example.com' OR email IN ('test_regular_user@payent.com', 'test_admin_user@payent.com', 'user_a_idor@payent.com', 'user_b_idor@payent.com', 'revocation_user@payent.com')")
            cursor.execute("DELETE FROM custom_products")
            cursor.execute("DELETE FROM orders")
            cursor.execute("DELETE FROM payments")
            cursor.execute("DELETE FROM reviews WHERE user_name IN ('Michael Chang', 'Jessica Ross')")
            cursor.execute("DELETE FROM reports WHERE owner_id LIKE '%@example.com' OR reporter_name = 'Michael Chang'")
            cursor.execute("DELETE FROM admin_notifications WHERE message LIKE '%Alex Mercer%' OR message LIKE '%Michael Chang%' OR message LIKE '%Jessica Ross%'")
            cursor.execute("DELETE FROM support_tickets WHERE user_email LIKE '%@example.com'")
            cursor.execute("DELETE FROM admin_logs WHERE user_name IN ('Sarah Connor', 'Alex Mercer')")
            print("Purged all test listings, orders, payments, and reset total revenue and active listings to 0.")

            # Seed categories
            cursor.execute("SELECT COUNT(*) as count FROM categories")
            if cursor.fetchone()["count"] == 0:
                categories_data = [
                    ("cat-1", "Cameras", "Camera", "bg-secondary text-foreground", True),
                    ("cat-2", "Drones", "Plane", "bg-secondary text-foreground", True),
                    ("cat-3", "Laptops", "Laptop", "bg-secondary text-foreground", True),
                    ("cat-4", "Audio", "Mic", "bg-secondary text-foreground", True),
                    ("cat-5", "VR & AR", "Glasses", "bg-secondary text-foreground", True),
                ]
                cursor.executemany(
                    "INSERT INTO categories (id, name, icon, color, enabled) VALUES (%s, %s, %s, %s, %s)",
                    categories_data
                )
                print("Seeded initial categories.")

            # Seed admin settings
            cursor.execute("SELECT COUNT(*) as count FROM admin_settings")
            if cursor.fetchone()["count"] == 0:
                cursor.execute("""
                    INSERT INTO admin_settings (id, website_name, logo_url, theme, contact_email, contact_phone, social_facebook, social_twitter, social_instagram, seo_title, seo_description, homepage_banner_text, footer_text)
                    VALUES (1, 'Payent', '/favicon.svg', 'dark', 'support@payent.com', '+1 (800) 555-GEAR', 'https://facebook.com/payent', 'https://twitter.com/payent', 'https://instagram.com/payent', 'Payent — Premium Tech Gear Rental Marketplace', 'Rent professional video gear, cameras, laptops, drones, and consoles. Safe, secure, and fully insured.', 'Unlock premium gear at a fraction of the cost.', '© 2026 Payent Inc. All rights reserved.')
                """)
                print("Seeded initial admin settings.")

        conn.commit()
    finally:
        conn.close()

    print("MySQL database structures initialized.")

MOCK_USERS = {}
MOCK_OTPS = {}
MOCK_ORDERS = {}

def get_user(email: str):
    if not email:
        return None
    clean_email = email.strip().lower()
    try:
        user = fetch_one("SELECT * FROM users WHERE LOWER(email) = LOWER(%s)", (clean_email,))
        if user:
            return user
    except Exception as e:
        print(f"Warning: Database read error in get_user: {e}")
    return MOCK_USERS.get(clean_email)

def get_admin_notifications(limit: int = 20) -> list:
    """Fetch recent admin notifications for serverless HTTP polling."""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT %s", (limit,))
                return cursor.fetchall()
        finally:
            conn.close()
    except Exception as e:
        print(f"Notice: Database query in get_admin_notifications fallback: {e}")
        return []

def create_user(email: str, phone: str, password_hash: str, full_name: str, role: str = "user", address: str = None, city: str = None, pincode: str = None):
    created_at = datetime.utcnow().isoformat()
    clean_email = email.strip().lower()
    user_data = {
        "email": clean_email,
        "phone": phone,
        "password_hash": password_hash,
        "full_name": full_name,
        "role": role,
        "address": address,
        "city": city,
        "pincode": pincode,
        "created_at": created_at
    }
    MOCK_USERS[clean_email] = user_data
    try:
        execute_query(
            "INSERT INTO users (email, phone, password_hash, full_name, role, address, city, pincode, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (clean_email, phone, password_hash, full_name, role, address, city, pincode, created_at)
        )
    except Exception as e:
        print(f"Notice: Database write error in create_user: {e}")
    return {
        "email": clean_email,
        "phone": phone,
        "fullName": full_name,
        "role": role,
        "address": address,
        "city": city,
        "pincode": pincode,
        "createdAt": created_at
    }

def update_user_password(email: str, password_hash: str):
    if not email:
        return
    clean_email = email.strip().lower()
    if clean_email in MOCK_USERS:
        MOCK_USERS[clean_email]["password_hash"] = password_hash
    try:
        execute_query("UPDATE users SET password_hash = %s WHERE LOWER(email) = LOWER(%s)", (password_hash, clean_email))
    except Exception as e:
        print(f"Notice: Database write error in update_user_password: {e}")

def save_otp(email: str, phone: str, otp: str):
    created_at = datetime.utcnow().isoformat()
    clean_email = email.strip().lower()
    MOCK_OTPS[clean_email] = {"email": clean_email, "phone": phone, "otp": otp, "created_at": created_at}
    try:
        execute_query(
            "REPLACE INTO otps (email, phone, otp, created_at) VALUES (%s, %s, %s, %s)",
            (clean_email, phone, otp, created_at)
        )
    except Exception as e:
        print(f"Notice: Database write error in save_otp: {e}")

def get_otp(email: str):
    if not email:
        return None
    clean_email = email.strip().lower()
    try:
        otp_rec = fetch_one("SELECT * FROM otps WHERE LOWER(email) = LOWER(%s)", (clean_email,))
        if otp_rec:
            return otp_rec
    except Exception as e:
        print(f"Warning: Database read error in get_otp: {e}")
    return MOCK_OTPS.get(clean_email)

def delete_otp(email: str):
    if not email:
        return
    clean_email = email.strip().lower()
    MOCK_OTPS.pop(clean_email, None)
    try:
        execute_query("DELETE FROM otps WHERE LOWER(email) = LOWER(%s)", (clean_email,))
    except Exception as e:
        print(f"Notice: Database delete error in delete_otp: {e}")

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

    # Create matching payment transaction
    tx_id = f"tx-{order['id']}"
    user = get_user(email)
    customer_name = user["full_name"] if user else email.split("@")[0]
    
    execute_query("""
        INSERT INTO payments (id, booking_id, customer_id, customer_name, amount, status, method, invoice_url, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE status = VALUES(status)
    """, (
        tx_id,
        order["id"],
        email,
        customer_name,
        order["total"],
        "successful" if order["status"] != "cancelled" else "failed",
        "UPI / Card",
        "#",
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

# Token Revocation Helpers
REVOKED_JTIS = set()

def revoke_token(jti: str, email: str, expires_at: int):
    if not jti:
        return
    REVOKED_JTIS.add(jti)
    created_at = datetime.utcnow().isoformat()
    try:
        execute_query(
            "REPLACE INTO token_blocklist (jti, email, expires_at, created_at) VALUES (%s, %s, %s, %s)",
            (jti, email, expires_at, created_at)
        )
    except Exception as e:
        print(f"Notice: Database write error in revoke_token: {e}")

def is_token_revoked(jti: str) -> bool:
    if not jti:
        return True
    if jti in REVOKED_JTIS:
        return True
    try:
        res = fetch_one("SELECT 1 FROM token_blocklist WHERE jti = %s", (jti,))
        if res:
            REVOKED_JTIS.add(jti)
            return True
    except Exception as e:
        print(f"Warning: Database read error in is_token_revoked: {e}")
    return False

# Rate-Limiting and OTP Attempt Helpers
RATE_LIMIT_STORE = {}

def record_failed_auth_attempt(key: str, max_attempts: int = 5, lock_duration_secs: int = 900) -> tuple[bool, int]:
    """
    Record a failed login attempt for a key (IP or email) with DB-backed persistence for serverless scaling.
    Returns (is_locked, seconds_remaining).
    """
    now = int(datetime.utcnow().timestamp())
    attempts = 0
    last_attempt = now
    locked_until = 0

    # Read existing rate-limit state from DB
    try:
        row = fetch_one("SELECT attempts, last_attempt, locked_until FROM auth_rate_limits WHERE key_id = %s", (key,))
        if row:
            attempts = int(row.get("attempts") or 0)
            last_attempt = int(row.get("last_attempt") or now)
            locked_until = int(row.get("locked_until") or 0)
    except Exception:
        mem_rec = RATE_LIMIT_STORE.get(key, {})
        attempts = mem_rec.get("attempts", 0)
        last_attempt = mem_rec.get("last_attempt", now)
        locked_until = mem_rec.get("locked_until", 0)

    if locked_until > now:
        return True, locked_until - now

    # Reset attempt count if window expired (> 15 minutes)
    if now - last_attempt > 900:
        attempts = 1
    else:
        attempts += 1

    last_attempt = now
    is_locked = False
    secs_remaining = 0

    if attempts >= max_attempts:
        locked_until = now + lock_duration_secs
        is_locked = True
        secs_remaining = lock_duration_secs

    # Update state in DB and in-memory cache
    RATE_LIMIT_STORE[key] = {
        "attempts": attempts,
        "last_attempt": last_attempt,
        "locked_until": locked_until
    }

    try:
        execute_query(
            "REPLACE INTO auth_rate_limits (key_id, attempts, last_attempt, locked_until) VALUES (%s, %s, %s, %s)",
            (key, attempts, last_attempt, locked_until)
        )
    except Exception as e:
        print(f"Notice: Database write error in record_failed_auth_attempt: {e}")

    return is_locked, secs_remaining

def clear_failed_auth_attempts(key: str):
    RATE_LIMIT_STORE.pop(key, None)
    try:
        execute_query("DELETE FROM auth_rate_limits WHERE key_id = %s", (key,))
    except Exception:
        pass

def increment_otp_attempt(email: str) -> int:
    clean_email = email.strip().lower()
    otp_rec = get_otp(clean_email)
    if not otp_rec:
        return 0
    attempts = otp_rec.get("attempts", 0) + 1
    otp_rec["attempts"] = attempts
    MOCK_OTPS[clean_email] = otp_rec
    try:
        execute_query("UPDATE otps SET attempts = %s WHERE LOWER(email) = LOWER(%s)", (attempts, clean_email))
    except Exception:
        pass
    return attempts


# Order Persistence & Razorpay Helpers
def create_order_record(
    order_id: str,
    user_email: str,
    product_id: str,
    product_title: str,
    product_image: str,
    start_date: str,
    end_date: str,
    total: int,
    status: str = "pending",
    razorpay_order_id: str = None,
    payment_status: str = "unpaid"
):
    created_at = datetime.utcnow().isoformat()
    order_data = {
        "id": order_id,
        "user_email": user_email,
        "product_id": product_id,
        "product_title": product_title,
        "product_image": product_image,
        "start_date": start_date,
        "end_date": end_date,
        "total": total,
        "status": status,
        "created_at": created_at,
        "razorpay_order_id": razorpay_order_id,
        "payment_status": payment_status
    }
    MOCK_ORDERS[order_id] = order_data
    try:
        execute_query(
            """INSERT INTO orders 
               (id, user_email, product_id, product_title, product_image, start_date, end_date, total, status, created_at, razorpay_order_id, payment_status) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (order_id, user_email, product_id, product_title, product_image, start_date, end_date, total, status, created_at, razorpay_order_id, payment_status)
        )
    except Exception as e:
        print(f"Notice: Database write error in create_order_record: {e}")
    return order_data

def get_order_by_id(order_id: str):
    if not order_id:
        return None
    try:
        order = fetch_one("SELECT * FROM orders WHERE id = %s", (order_id,))
        if order:
            return order
    except Exception as e:
        print(f"Warning: Database read error in get_order_by_id: {e}")
    return MOCK_ORDERS.get(order_id)

MOCK_PROCESSED_EVENTS = set()

def is_payment_event_processed(event_id: str) -> bool:
    """Check if a Razorpay webhook event_id has already been processed."""
    if not event_id:
        return False
    try:
        row = fetch_one("SELECT 1 FROM processed_payment_events WHERE event_id = %s", (event_id,))
        return bool(row)
    except Exception:
        return event_id in MOCK_PROCESSED_EVENTS

def record_payment_event(event_id: str, event_type: str = "", payment_id: str = None, order_id: str = None):
    """Record a processed Razorpay webhook event_id for idempotency."""
    if not event_id:
        return
    MOCK_PROCESSED_EVENTS.add(event_id)
    try:
        execute_query("""
            INSERT INTO processed_payment_events (event_id, event_type, payment_id, order_id, created_at)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE created_at = VALUES(created_at)
        """, (event_id, event_type or "", payment_id or "", order_id or "", datetime.utcnow().isoformat()))
    except Exception:
        pass

def get_order_by_razorpay_order_id(razorpay_order_id: str):
    if not razorpay_order_id:
        return None
    try:
        order = fetch_one("SELECT * FROM orders WHERE razorpay_order_id = %s", (razorpay_order_id,))
        if order:
            return order
    except Exception as e:
        print(f"Warning: Database read error in get_order_by_razorpay_order_id: {e}")
    for o in MOCK_ORDERS.values():
        if o.get("razorpay_order_id") == razorpay_order_id:
            return o
    return None

def update_order_payment_status(
    order_id: str,
    payment_status: str,
    status: str = None,
    razorpay_payment_id: str = None,
    razorpay_signature: str = None,
    refund_id: str = None,
    refund_status: str = None
):
    fields = ["payment_status = %s"]
    params = [payment_status]

    if status:
        fields.append("status = %s")
        params.append(status)
    if razorpay_payment_id:
        fields.append("razorpay_payment_id = %s")
        params.append(razorpay_payment_id)
    if razorpay_signature:
        fields.append("razorpay_signature = %s")
        params.append(razorpay_signature)
    if refund_id:
        fields.append("refund_id = %s")
        params.append(refund_id)
    if refund_status:
        fields.append("refund_status = %s")
        params.append(refund_status)

    params.append(order_id)
    sql = f"UPDATE orders SET {', '.join(fields)} WHERE id = %s"

    try:
        execute_query(sql, tuple(params))
    except Exception as e:
        print(f"Notice: Database write error in update_order_payment_status: {e}")

    if order_id in MOCK_ORDERS:
        MOCK_ORDERS[order_id]["payment_status"] = payment_status
        if status:
            MOCK_ORDERS[order_id]["status"] = status
        if razorpay_payment_id:
            MOCK_ORDERS[order_id]["razorpay_payment_id"] = razorpay_payment_id
        if razorpay_signature:
            MOCK_ORDERS[order_id]["razorpay_signature"] = razorpay_signature
        if refund_id:
            MOCK_ORDERS[order_id]["refund_id"] = refund_id
        if refund_status:
            MOCK_ORDERS[order_id]["refund_status"] = refund_status


# Recommendation System Database Helpers

MOCK_USER_EVENTS = []

def record_user_event_record(event: dict):
    """Insert a single behavioral event record into user_events."""
    try:
        query = """
            INSERT INTO user_events (user_email, session_id, event_type, product_id, category, search_query, recommendation_type, variant, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """
        params = (
            event.get("user_email"),
            event.get("session_id"),
            event.get("event_type"),
            event.get("product_id"),
            event.get("category"),
            event.get("search_query"),
            event.get("recommendation_type"),
            event.get("variant"),
        )
        execute_query(query, params)
    except Exception as e:
        print(f"Notice: Database write error in record_user_event_record: {e}")
        MOCK_USER_EVENTS.append({**event, "created_at": datetime.utcnow().isoformat()})

def record_user_events_batch(events: list):
    """Batch insert multiple behavioral event records."""
    if not events:
        return
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            query = """
                INSERT INTO user_events (user_email, session_id, event_type, product_id, category, search_query, recommendation_type, variant, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """
            params_list = [
                (
                    ev.get("user_email"),
                    ev.get("session_id"),
                    ev.get("event_type"),
                    ev.get("product_id"),
                    ev.get("category"),
                    ev.get("search_query"),
                    ev.get("recommendation_type"),
                    ev.get("variant"),
                )
                for ev in events
            ]
            cursor.executemany(query, params_list)
        conn.commit()
    except Exception as e:
        print(f"Notice: Database batch write error in record_user_events_batch: {e}")
        for ev in events:
            MOCK_USER_EVENTS.append({**ev, "created_at": datetime.utcnow().isoformat()})
    finally:
        conn.close()

def get_recent_user_events(user_email: str = None, session_id: str = None, limit: int = 20):
    """Fetch recent user events for cold-start and personalized recommendations."""
    if not user_email and not session_id:
        return []
    try:
        if user_email and session_id:
            query = """
                SELECT * FROM user_events
                WHERE LOWER(user_email) = LOWER(%s) OR session_id = %s
                ORDER BY created_at DESC LIMIT %s
            """
            params = (user_email, session_id, limit)
        elif user_email:
            query = """
                SELECT * FROM user_events
                WHERE LOWER(user_email) = LOWER(%s)
                ORDER BY created_at DESC LIMIT %s
            """
            params = (user_email, limit)
        else:
            query = """
                SELECT * FROM user_events
                WHERE session_id = %s
                ORDER BY created_at DESC LIMIT %s
            """
            params = (session_id, limit)

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchall()
        finally:
            conn.close()
    except Exception as e:
        print(f"Warning: Database error in get_recent_user_events: {e}")
        results = []
        for ev in reversed(MOCK_USER_EVENTS):
            if (user_email and ev.get("user_email") == user_email) or (session_id and ev.get("session_id") == session_id):
                results.append(ev)
                if len(results) >= limit:
                    break
        return results

def get_trending_event_counts(days: int = 30):
    """Aggregate weighted interaction event counts for product ranking with time decay."""
    try:
        query = """
            SELECT product_id,
                   SUM(CASE WHEN event_type = 'booking_completed' THEN 5.0
                            WHEN event_type = 'add_to_cart' THEN 3.0
                            WHEN event_type = 'view_product' THEN 1.0
                            ELSE 0.5 END * EXP(-0.05 * DATEDIFF(NOW(), created_at))) AS score
            FROM user_events
            WHERE product_id IS NOT NULL AND created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
            GROUP BY product_id
            ORDER BY score DESC
            LIMIT 50
        """
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(query, (days,))
                return cursor.fetchall()
        finally:
            conn.close()
    except Exception as e:
        print(f"Warning: Database error in get_trending_event_counts: {e}")
        # Fallback to counting in mock array
        scores = {}
        for ev in MOCK_USER_EVENTS:
            pid = ev.get("product_id")
            if pid:
                weight = 5.0 if ev.get("event_type") == "booking_completed" else (3.0 if ev.get("event_type") == "add_to_cart" else 1.0)
                scores[pid] = scores.get(pid, 0.0) + weight
        return [{"product_id": k, "score": v} for k, v in sorted(scores.items(), key=lambda x: x[1], reverse=True)]

def get_order_co_occurrences(product_id: str, limit: int = 10):
    """Find products frequently ordered by the same user as product_id."""
    if not product_id:
        return []
    try:
        query = """
            SELECT o2.product_id, COUNT(*) as count
            FROM orders o1
            JOIN orders o2 ON o1.user_email = o2.user_email AND o1.product_id != o2.product_id
            WHERE o1.product_id = %s AND o2.product_id IS NOT NULL
            GROUP BY o2.product_id
            ORDER BY count DESC
            LIMIT %s
        """
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(query, (product_id, limit))
                return cursor.fetchall()
        finally:
            conn.close()
    except Exception as e:
        print(f"Warning: Database error in get_order_co_occurrences: {e}")
        return []

def get_precomputed_similarities(product_id: str, limit: int = 10):
    """Retrieve precomputed item-based collaborative filtering similarity scores."""
    if not product_id:
        return []
    try:
        query = """
            SELECT product_id_b as product_id, score
            FROM item_similarities
            WHERE product_id_a = %s
            ORDER BY score DESC
            LIMIT %s
        """
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(query, (product_id, limit))
                return cursor.fetchall()
        finally:
            conn.close()
    except Exception as e:
        print(f"Warning: Database error in get_precomputed_similarities: {e}")
        return []

def save_precomputed_similarities(rows: list):
    """Insert or replace precomputed item similarity pairs."""
    if not rows:
        return
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            query = """
                REPLACE INTO item_similarities (product_id_a, product_id_b, score, updated_at)
                VALUES (%s, %s, %s, NOW())
            """
            params_list = [(r["product_id_a"], r["product_id_b"], float(r["score"])) for r in rows]
            cursor.executemany(query, params_list)
        conn.commit()
    except Exception as e:
        print(f"Notice: Database write error in save_precomputed_similarities: {e}")
    finally:
        conn.close()

def get_interaction_matrix_data():
    """Fetch user-item interaction pairs for ML training."""
    try:
        query = """
            SELECT COALESCE(user_email, session_id) as user_identifier, product_id,
                   SUM(CASE WHEN event_type = 'booking_completed' THEN 5.0
                            WHEN event_type = 'add_to_cart' THEN 3.0
                            WHEN event_type = 'view_product' THEN 1.0
                            ELSE 0.5 END) as interaction_score
            FROM user_events
            WHERE product_id IS NOT NULL AND (user_email IS NOT NULL OR session_id IS NOT NULL)
            GROUP BY user_identifier, product_id
        """
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(query)
                return cursor.fetchall()
        finally:
            conn.close()
    except Exception as e:
        print(f"Warning: Database error in get_interaction_matrix_data: {e}")
        return []

def get_user_category_affinities(user_email: str = None, session_id: str = None) -> dict:
    """Calculate user category affinities based on user_events history."""
    if not user_email and not session_id:
        return {}
    affinities = {}
    try:
        query = """
            SELECT category, COUNT(*) as interaction_count
            FROM user_events
            WHERE (LOWER(user_email) = LOWER(%s) OR session_id = %s)
              AND category IS NOT NULL AND category != ''
            GROUP BY category
        """
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(query, (user_email or "", session_id or ""))
                rows = cursor.fetchall()
                for r in rows:
                    if r.get("category"):
                        affinities[r["category"]] = float(r.get("interaction_count", 0))
        finally:
            conn.close()
    except Exception as e:
        print(f"Notice: Database query fallback in get_user_category_affinities: {e}")
        # Fallback to in-memory event tracking
        for ev in MOCK_USER_EVENTS:
            em = ev.get("user_email") or ""
            sid = ev.get("session_id") or ""
            if (user_email and em.lower() == user_email.lower()) or (session_id and sid == session_id):
                cat = ev.get("category")
                if cat:
                    affinities[cat] = affinities.get(cat, 0.0) + 1.0
    return affinities

def get_popular_search_queries(limit: int = 5) -> list:
    """Fetch top search queries recorded in user_events."""
    try:
        query = """
            SELECT search_query, COUNT(*) as cnt
            FROM user_events
            WHERE event_type = 'search' AND search_query IS NOT NULL AND TRIM(search_query) != ''
            GROUP BY search_query
            ORDER BY cnt DESC
            LIMIT %s
        """
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(query, (limit,))
                rows = cursor.fetchall()
                return [r["search_query"] for r in rows if r.get("search_query")]
        finally:
            conn.close()
    except Exception as e:
        print(f"Notice: Database fallback in get_popular_search_queries: {e}")
        counts = {}
        for ev in MOCK_USER_EVENTS:
            if ev.get("event_type") == "search" and ev.get("search_query"):
                sq = ev["search_query"].strip()
                if sq:
                    counts[sq] = counts.get(sq, 0) + 1
        sorted_queries = sorted(counts.items(), key=lambda x: x[1], reverse=True)
        return [sq for sq, _ in sorted_queries[:limit]]





