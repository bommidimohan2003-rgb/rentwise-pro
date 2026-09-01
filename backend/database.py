import os
import sys

# Ensure backend directory is in sys.path for serverless environment compatibility
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pymysql
import ssl
import logging
from datetime import datetime
from config import MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB, MYSQL_SSL

logger = logging.getLogger("payent.database")

def get_ssl_kwargs():
    if MYSQL_SSL or "tidbcloud.com" in (MYSQL_HOST or "").lower():
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return {"ssl": ctx}
    return {}

def ensure_database_exists():
    """Ensure the target TiDB / MySQL database exists before table initialization."""
    ssl_kwargs = get_ssl_kwargs()
    try:
        conn = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            cursorclass=pymysql.cursors.DictCursor,
            connect_timeout=5,
            **ssl_kwargs
        )
        try:
            with conn.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DB}`")
            conn.commit()
            logger.info(f"Database '{MYSQL_DB}' ensured successfully on MySQL server.")
        finally:
            conn.close()
    except Exception as e:
        logger.warning(f"Notice: Auto database creation for '{MYSQL_DB}' notice: {e}")

try:
    from dbutils.pooled_db import PooledDB
    HAS_POOLED_DB = True
except ImportError:
    HAS_POOLED_DB = False

_db_pool = None
_last_db_failure_timestamp = 0.0

def get_db_pool():
    global _db_pool, _last_db_failure_timestamp
    if not HAS_POOLED_DB:
        return None
    if _db_pool is not None:
        return _db_pool

    now = datetime.now().timestamp()
    if _last_db_failure_timestamp > 0 and (now - _last_db_failure_timestamp) < 5.0:
        return None

    ssl_kwargs = get_ssl_kwargs()
    try:
        _db_pool = PooledDB(
            creator=pymysql,
            mincached=2,
            maxcached=10,
            maxshared=10,
            maxconnections=20,
            blocking=True,
            maxusage=1000,
            ping=1,
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DB,
            cursorclass=pymysql.cursors.DictCursor,
            connect_timeout=3,
            **ssl_kwargs
        )
        _last_db_failure_timestamp = 0.0
        logger.info("TiDB Cloud connection pool initialized successfully with DBUtils PooledDB.")
        return _db_pool
    except Exception as e:
        _last_db_failure_timestamp = now
        logger.warning(f"Failed to initialize TiDB connection pool ({e}). Operating in direct fallback mode.")
        return None

def get_db_connection():
    global _last_db_failure_timestamp
    pool = get_db_pool()
    if pool is not None:
        try:
            return pool.connection()
        except Exception as e:
            logger.warning(f"Pooled connection acquisition error: {e}")

    now = datetime.now().timestamp()
    if _last_db_failure_timestamp > 0 and (now - _last_db_failure_timestamp) < 5.0:
        return None

    ssl_kwargs = get_ssl_kwargs()
    try:
        conn = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DB,
            cursorclass=pymysql.cursors.DictCursor,
            connect_timeout=3,
            **ssl_kwargs
        )
        _last_db_failure_timestamp = 0.0
        return conn
    except Exception as e:
        _last_db_failure_timestamp = now
        logger.warning(f"MySQL connection to '{MYSQL_HOST}' failed ({e}). Operating in degraded fallback mode.")
        return None

def execute_query(query: str, params: tuple = ()):
    try:
        conn = get_db_connection()
        if not conn:
            return
        try:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
            conn.commit()
        finally:
            conn.close()
    except Exception as e:
        print(f"Notice: Database execute_query notice: {e}")

def fetch_one(query: str, params: tuple = ()):
    try:
        conn = get_db_connection()
        if not conn:
            return None
        try:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchone()
        finally:
            conn.close()
    except Exception as e:
        print(f"Notice: Database fetch_one notice: {e}")
        return None

def fetch_all(query: str, params: tuple = ()):
    try:
        conn = get_db_connection()
        if not conn:
            return []
        try:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchall()
        finally:
            conn.close()
    except Exception as e:
        print(f"Notice: Database fetch_all notice: {e}")
        return []

def init_db():
    # Ensure database exists before table setup
    ensure_database_exists()

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

    # Helper to safely add index if not exists
    def add_index_safely(table: str, index_name: str, column_def: str):
        try:
            execute_query(f"CREATE INDEX {index_name} ON {table} ({column_def})")
            print(f"Added index {index_name} on {table}({column_def}).")
        except Exception:
            pass  # Index already exists or unsupported syntax

    # Create users table
    execute_query("""
        CREATE TABLE IF NOT EXISTS users (
            email VARCHAR(255) PRIMARY KEY,
            phone VARCHAR(50),
            password_hash VARCHAR(255) NULL,
            full_name VARCHAR(255),
            role VARCHAR(50) DEFAULT 'user',
            created_at VARCHAR(100) NOT NULL
        )
    """)
    
    # Safely alter users table for new fields and nullable password_hash
    try:
        execute_query("ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL")
    except Exception:
        pass

    add_column_safely("users", "status VARCHAR(50) DEFAULT 'active'")
    add_column_safely("users", "verified BOOLEAN DEFAULT TRUE")
    add_column_safely("users", "avatar VARCHAR(1000) DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'")
    add_column_safely("users", "address VARCHAR(500)")
    add_column_safely("users", "city VARCHAR(100)")
    add_column_safely("users", "pincode VARCHAR(20)")
    add_column_safely("users", "firebase_uid VARCHAR(255) NULL")
    add_column_safely("users", "last_login_at VARCHAR(100)")

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

    # Ensure performance indexes exist on frequently queried fields
    add_index_safely("users", "idx_users_role", "role")
    add_index_safely("orders", "idx_orders_user_email", "user_email")
    add_index_safely("orders", "idx_orders_product_id", "product_id")
    add_index_safely("orders", "idx_orders_status", "status")
    add_index_safely("orders", "idx_orders_rzp_order", "razorpay_order_id")
    add_index_safely("orders", "idx_orders_rzp_payment", "razorpay_payment_id")
    add_index_safely("custom_products", "idx_cp_user_email", "user_email")
    add_index_safely("custom_products", "idx_cp_category", "category")
    add_index_safely("custom_products", "idx_cp_available", "available")
    add_index_safely("payments", "idx_payments_booking", "booking_id")
    add_index_safely("payments", "idx_payments_customer", "customer_id")
    add_index_safely("notifications", "idx_notif_user_read", "user_email")
    add_index_safely("reviews", "idx_reviews_product", "product_id")

    # Seed initial data if tables are empty
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Purge mock/test data & reset analytics records for clean startup
            cursor.execute("""
                DELETE FROM users
                WHERE email LIKE '%@example.com'
                   OR email IN (
                       'test_regular_user@payent.com', 'test_admin_user@payent.com',
                       'user_a_idor@payent.com', 'user_b_idor@payent.com', 'revocation_user@payent.com',
                       'marcus.vance@techgear.io', 'elena.rostova@drones.com',
                       'devon.carter@creatives.co', 'priya.sharma@studios.in',
                       'marcus@payent.com', 'elena@payent.com', 'devon@payent.com',
                       'bengaluru@payent.com', 'mumbai@payent.com', 'delhi@payent.com'
                   )
            """)
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

            # Seed default admin user
            cursor.execute("SELECT COUNT(*) as count FROM users WHERE LOWER(email) = 'bommidimohan2003@gmail.com'")
            if cursor.fetchone()["count"] == 0:
                hashed_pwd = "$2b$12$XbPCF4zGTgcZs6Z9afnXVuenqYPwmRIjLRs8PwXT7KZy99U8W2nE2"
                created_at = datetime.utcnow().isoformat()
                cursor.execute("""
                    INSERT INTO users (email, phone, password_hash, full_name, role, created_at, last_login_at, status, verified)
                    VALUES ('bommidimohan2003@gmail.com', '+91 8810519885', %s, 'Bommidi Mohan', 'admin', %s, %s, 'active', TRUE)
                """, (hashed_pwd, created_at, created_at))
                print("Seeded admin user bommidimohan2003@gmail.com into users table.")

        conn.commit()
    finally:
        conn.close()

    print("MySQL database structures initialized.")

_admin_hashed_pwd = "$2b$12$XbPCF4zGTgcZs6Z9afnXVuenqYPwmRIjLRs8PwXT7KZy99U8W2nE2"
MOCK_USERS = {
    "bommidimohan2003@gmail.com": {
        "email": "bommidimohan2003@gmail.com",
        "firebase_uid": "admin-uid-mohan",
        "phone": "+91 8810519885",
        "password_hash": _admin_hashed_pwd,
        "full_name": "Bommidi Mohan",
        "role": "admin",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        "address": "123 Innovation Way",
        "city": "Bangalore",
        "pincode": "560001",
        "created_at": datetime.utcnow().isoformat(),
        "last_login_at": datetime.utcnow().isoformat(),
        "status": "active",
        "verified": True
    }
}
MOCK_OTPS = {}
MOCK_ORDERS = {}
MOCK_WISHLISTS = {}
MOCK_NOTIFICATIONS = {}
MOCK_PROCESSED_EVENTS = set()
MOCK_USER_EVENTS = []
MOCK_CUSTOM_PRODUCTS = {}

def get_user(email: str):
    if not email:
        return None
    clean_email = email.strip().lower()
    try:
        user = fetch_one("SELECT * FROM users WHERE LOWER(email) = LOWER(%s)", (clean_email,))
        if user:
            return user
    except Exception as e:
        logger.warning("DB read error in get_user for %s — falling back to MOCK_USERS: %s", clean_email, e)
    return MOCK_USERS.get(clean_email)

def has_admin_user() -> bool:
    """Check if at least one administrator account exists in the database."""
    try:
        row = fetch_one("SELECT COUNT(*) as count FROM users WHERE LOWER(role) = 'admin'")
        if row and row.get("count", 0) > 0:
            return True
    except Exception as e:
        logger.warning(f"Error checking admin user existence in DB: {e}")

    for u in MOCK_USERS.values():
        if u.get("role", "").lower() == "admin":
            return True
    return False

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

def get_user_by_firebase_uid(firebase_uid: str):
    if not firebase_uid:
        return None
    try:
        user = fetch_one("SELECT * FROM users WHERE firebase_uid = %s", (firebase_uid,))
        if user:
            return user
    except Exception as e:
        print(f"Warning: Database read error in get_user_by_firebase_uid: {e}")
    for u in MOCK_USERS.values():
        if u.get("firebase_uid") == firebase_uid:
            return u
    return None

def save_google_user(email: str, full_name: str, firebase_uid: str = "", phone: str = "", avatar: str = "", address: str = "", city: str = "", pincode: str = "", role: str = "user", google_email_verified: bool = True):
    created_at = datetime.utcnow().isoformat()
    clean_email = email.strip().lower()

    # Check if user already exists by firebase_uid or email (linking rule)
    existing_user = None
    if firebase_uid:
        existing_user = get_user_by_firebase_uid(firebase_uid)
    if not existing_user and clean_email:
        existing_user = get_user(clean_email)

    if existing_user:
        is_existing_verified = bool(existing_user.get("verified", True))
        if not is_existing_verified and not google_email_verified:
            print(f"[SECURITY NOTICE]: Refusing auto-link for unverified email: {clean_email}")
            raise ValueError(f"Cannot auto-link Google identity to unverified account: {clean_email}")

        now_iso = datetime.utcnow().isoformat()
        clean_email = existing_user["email"]
        existing_user["firebase_uid"] = firebase_uid or existing_user.get("firebase_uid")
        existing_user["verified"] = True
        existing_user["last_login_at"] = now_iso
        if full_name:
            existing_user["full_name"] = full_name
        if avatar:
            existing_user["avatar"] = avatar
        if phone:
            existing_user["phone"] = phone
        if address:
            existing_user["address"] = address
        if city:
            existing_user["city"] = city
        if pincode:
            existing_user["pincode"] = pincode
        MOCK_USERS[clean_email] = existing_user
        try:
            execute_query(
                """
                UPDATE users SET 
                    firebase_uid = COALESCE(NULLIF(%s, ''), firebase_uid),
                    full_name = COALESCE(NULLIF(%s, ''), full_name),
                    avatar = COALESCE(NULLIF(%s, ''), avatar),
                    phone = COALESCE(NULLIF(%s, ''), phone),
                    address = COALESCE(NULLIF(%s, ''), address),
                    city = COALESCE(NULLIF(%s, ''), city),
                    pincode = COALESCE(NULLIF(%s, ''), pincode),
                    last_login_at = %s,
                    verified = TRUE
                WHERE LOWER(email) = LOWER(%s)
                """,
                (firebase_uid or "", full_name or "", avatar or "", phone or "", address or "", city or "", pincode or "", now_iso, clean_email)
            )
        except Exception as e:
            print(f"Notice: Database write error in save_google_user update: {e}")
        return existing_user

    user_data = {
        "email": clean_email,
        "firebase_uid": firebase_uid or "",
        "phone": phone or "",
        "password_hash": None,
        "full_name": full_name,
        "role": role or "user",
        "avatar": avatar or "",
        "address": address or "",
        "city": city or "",
        "pincode": pincode or "",
        "created_at": created_at,
        "last_login_at": created_at,
        "status": "active",
        "verified": True
    }
    MOCK_USERS[clean_email] = user_data

    try:
        execute_query(
            """
            INSERT INTO users (email, firebase_uid, phone, password_hash, full_name, role, avatar, address, city, pincode, created_at, last_login_at, status, verified)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active', TRUE)
            ON DUPLICATE KEY UPDATE
                firebase_uid = COALESCE(NULLIF(VALUES(firebase_uid), ''), firebase_uid),
                full_name = COALESCE(NULLIF(VALUES(full_name), ''), full_name),
                phone = COALESCE(NULLIF(VALUES(phone), ''), phone),
                avatar = COALESCE(NULLIF(VALUES(avatar), ''), avatar),
                address = COALESCE(NULLIF(VALUES(address), ''), address),
                city = COALESCE(NULLIF(VALUES(city), ''), city),
                pincode = COALESCE(NULLIF(VALUES(pincode), ''), pincode),
                last_login_at = VALUES(last_login_at),
                verified = TRUE
            """,
            (clean_email, firebase_uid or "", phone or "", None, full_name, role or "user", avatar or "", address or "", city or "", pincode or "", created_at, created_at)
        )
    except Exception as e:
        print(f"Notice: Database write error in save_google_user insert: {e}")

    return user_data

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
    clean_email = (email or "").strip().lower()
    try:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT product_id FROM wishlist WHERE email = %s", (clean_email,))
                    return [row["product_id"] for row in cursor.fetchall()]
            finally:
                conn.close()
    except Exception as e:
        print(f"Notice: Database read error in get_wishlist: {e}")
    return MOCK_WISHLISTS.get(clean_email, [])

def toggle_wishlist(email: str, product_id: str):
    clean_email = (email or "").strip().lower()
    wishlist = MOCK_WISHLISTS.setdefault(clean_email, [])
    if product_id in wishlist:
        wishlist.remove(product_id)
    else:
        wishlist.append(product_id)
    try:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT 1 FROM wishlist WHERE email = %s AND product_id = %s", (clean_email, product_id))
                    exists = cursor.fetchone()
                    if exists:
                        cursor.execute("DELETE FROM wishlist WHERE email = %s AND product_id = %s", (clean_email, product_id))
                    else:
                        cursor.execute("INSERT INTO wishlist (email, product_id) VALUES (%s, %s)", (clean_email, product_id))
                conn.commit()
            finally:
                conn.close()
    except Exception as e:
        print(f"Notice: Database write error in toggle_wishlist: {e}")
    return wishlist

# Orders CRUD
def get_orders(email: str):
    clean_email = (email or "").strip().lower()
    try:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT * FROM orders WHERE user_email = %s ORDER BY created_at DESC", (clean_email,))
                    rows = cursor.fetchall()
                    if rows:
                        return rows
            finally:
                conn.close()
    except Exception as e:
        print(f"Notice: Database read error in get_orders: {e}")
    return [o for o in MOCK_ORDERS.values() if (o.get("user_email") or o.get("userEmail")) == clean_email]

def create_order(email: str, order: dict):
    clean_email = (email or "").strip().lower()
    pid = order.get("productId") or order.get("product_id") or ""
    title = order.get("productTitle") or order.get("product_title") or "Gear Rental"
    img = order.get("productImage") or order.get("product_image") or "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600"
    start = order.get("startDate") or order.get("start_date") or "Today"
    end = order.get("endDate") or order.get("end_date") or "Tomorrow"
    created = order.get("createdAt") or order.get("created_at") or datetime.utcnow().isoformat()
    status = order.get("status") or "active"
    total = float(order.get("total", 0))

    normalized = {
        "id": order["id"],
        "user_email": clean_email,
        "userEmail": clean_email,
        "productId": pid,
        "product_id": pid,
        "productTitle": title,
        "product_title": title,
        "productImage": img,
        "product_image": img,
        "startDate": start,
        "start_date": start,
        "endDate": end,
        "end_date": end,
        "total": total,
        "status": status,
        "createdAt": created,
        "created_at": created
    }
    MOCK_ORDERS[order["id"]] = normalized

    execute_query("""
        INSERT INTO orders (id, user_email, product_id, product_title, product_image, start_date, end_date, total, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        order["id"],
        clean_email,
        pid,
        title,
        img,
        start,
        end,
        total,
        status,
        created
    ))

    # Create matching payment transaction
    tx_id = f"tx-{order['id']}"
    user = get_user(clean_email)
    customer_name = user["full_name"] if (user and isinstance(user, dict) and "full_name" in user) else clean_email.split("@")[0]
    
    execute_query("""
        INSERT INTO payments (id, booking_id, customer_id, customer_name, amount, status, method, invoice_url, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE status = VALUES(status)
    """, (
        tx_id,
        order["id"],
        clean_email,
        customer_name,
        total,
        "successful" if status != "cancelled" else "failed",
        "UPI / Card",
        "#",
        created
    ))
    return normalized

def cancel_order(order_id: str):
    for key, o in list(MOCK_ORDERS.items()):
        if key == order_id or o.get("id") == order_id or o.get("productId") == order_id or o.get("product_id") == order_id:
            MOCK_ORDERS[key]["status"] = "cancelled"
    execute_query("UPDATE orders SET status = 'cancelled' WHERE id = %s OR product_id = %s", (order_id, order_id))

# Custom Products CRUD
def get_custom_products(email: str):
    clean_email = (email or "").strip().lower()
    try:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT * FROM custom_products WHERE user_email = %s ORDER BY created_at DESC", (clean_email,))
                    rows = cursor.fetchall()
                    if rows:
                        return rows
            finally:
                conn.close()
    except Exception as e:
        print(f"Notice: Database read error in get_custom_products: {e}")
    return [p for p in MOCK_CUSTOM_PRODUCTS.values() if (p.get("user_email") or p.get("userEmail")) == clean_email]

def get_all_custom_products():
    try:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT * FROM custom_products ORDER BY created_at DESC")
                    rows = cursor.fetchall()
                    if rows:
                        return rows
            finally:
                conn.close()
    except Exception as e:
        print(f"Notice: Database read error in get_all_custom_products: {e}")
    return list(MOCK_CUSTOM_PRODUCTS.values())

def get_all_approved_custom_products():
    try:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT * FROM custom_products WHERE (status = 'approved' OR status IS NULL) AND (hidden = 0 OR hidden IS NULL) ORDER BY created_at DESC")
                    rows = cursor.fetchall()
                    if rows:
                        return rows
            finally:
                conn.close()
    except Exception as e:
        print(f"Notice: Database read error in get_all_approved_custom_products: {e}")
    return [p for p in MOCK_CUSTOM_PRODUCTS.values() if p.get("status") in ("approved", None) and not p.get("hidden")]

def create_custom_product(email: str, product: dict):
    clean_email = (email or "").strip().lower()
    created_at = datetime.utcnow().isoformat()
    
    owner_info = product.get("owner") if isinstance(product.get("owner"), dict) else {}
    owner_name = owner_info.get("name") or product.get("owner_name") or clean_email.split("@")[0]
    owner_email = owner_info.get("email") or clean_email
    owner_avatar = owner_info.get("avatar") or product.get("owner_avatar") or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
    owner_rating = float(owner_info.get("rating") or product.get("owner_rating") or 5.0)

    is_available = bool(product.get("available", True))
    prod_status = str(product.get("status", "approved"))

    product_entry = {
        "id": str(product.get("id", "")),
        "user_email": clean_email,
        "title": str(product.get("title", "")),
        "description": str(product.get("description", "")),
        "price": float(product.get("price", 0)),
        "image": str(product.get("image", "")),
        "category": str(product.get("category", "General")),
        "rating": float(product.get("rating", 5.0)),
        "reviews": int(product.get("reviews", 0)),
        "available": is_available,
        "status": prod_status,
        "owner_name": owner_name,
        "owner_avatar": owner_avatar,
        "owner_rating": owner_rating,
        "owner": {
            "name": owner_name,
            "email": owner_email,
            "avatar": owner_avatar,
            "rating": owner_rating
        },
        "created_at": created_at
    }
    MOCK_CUSTOM_PRODUCTS[product_entry["id"]] = product_entry

    try:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO custom_products (id, user_email, title, description, price, image, category, rating, reviews, available, status, owner_name, owner_avatar, owner_rating, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        product_entry["id"],
                        clean_email,
                        product_entry["title"],
                        product_entry["description"],
                        product_entry["price"],
                        product_entry["image"],
                        product_entry["category"],
                        product_entry["rating"],
                        product_entry["reviews"],
                        1 if is_available else 0,
                        prod_status,
                        owner_name,
                        owner_avatar,
                        owner_rating,
                        created_at
                    ))
                conn.commit()
            finally:
                conn.close()
    except Exception as e:
        print(f"Notice: Database write error in create_custom_product: {e}")

    return product_entry

def update_custom_product(product_id: str, email: str, patch: dict):
    clean_email = (email or "").strip().lower()
    if product_id in MOCK_CUSTOM_PRODUCTS:
        MOCK_CUSTOM_PRODUCTS[product_id].update(patch)
    
    fields = []
    params = []
    
    mapping = {
        "title": "title",
        "description": "description",
        "price": "price",
        "image": "image",
        "category": "category",
        "available": "available",
        "rating": "rating",
        "reviews": "reviews"
    }
    
    for key, col in mapping.items():
        if key in patch and patch[key] is not None:
            fields.append(f"{col} = %s")
            params.append(patch[key])
            
    if fields:
        params.extend([product_id, clean_email])
        execute_query(
            f"UPDATE custom_products SET {', '.join(fields)} WHERE id = %s AND user_email = %s",
            tuple(params)
        )
    return MOCK_CUSTOM_PRODUCTS.get(product_id)

# Notifications CRUD
def get_notifications(email: str):
    clean_email = (email or "").strip().lower()
    try:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT * FROM notifications WHERE user_email = %s ORDER BY created_at DESC", (clean_email,))
                    rows = cursor.fetchall()
                    if rows:
                        return rows
            finally:
                conn.close()
    except Exception as e:
        print(f"Notice: Database read error in get_notifications: {e}")
    return [n for n in MOCK_NOTIFICATIONS.values() if (n.get("user_email") or n.get("userEmail")) == clean_email]

def create_notification(email: str, n: dict):
    clean_email = (email or "").strip().lower()
    MOCK_NOTIFICATIONS[n["id"]] = {**n, "user_email": clean_email}
    execute_query("""
        INSERT INTO notifications (id, user_email, title, message, type, is_read, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (
        n["id"],
        clean_email,
        n["title"],
        n["message"],
        n["type"],
        n.get("read") or n.get("is_read") or False,
        n.get("createdAt") or n.get("created_at") or datetime.utcnow().isoformat()
    ))

def mark_notifications_read(email: str):
    clean_email = (email or "").strip().lower()
    for n in MOCK_NOTIFICATIONS.values():
        if (n.get("user_email") or n.get("userEmail")) == clean_email:
            n["is_read"] = True
            n["read"] = True
    execute_query("UPDATE notifications SET is_read = TRUE WHERE user_email = %s", (clean_email,))

def delete_custom_product(product_id: str, email: str):
    clean_email = (email or "").strip().lower()
    MOCK_CUSTOM_PRODUCTS.pop(product_id, None)
    try:
        execute_query("DELETE FROM custom_products WHERE id = %s", (product_id,))
        execute_query("DELETE FROM wishlist WHERE product_id = %s", (product_id,))
        print(f"[MySQL Workbench Database] Product '{product_id}' deleted from custom_products & wishlist tables.")
    except Exception as e:
        print(f"Notice: Database delete error in delete_custom_product: {e}")

def get_public_stats():
    """
    Query real live statistics directly from MySQL Workbench database tables.
    """
    db_custom_count = 0
    db_orders_count = 0
    db_users_count = 0
    db_cities_count = 0

    try:
        custom_row = fetch_one("SELECT COUNT(*) as c FROM custom_products")
        if custom_row and "c" in custom_row and custom_row["c"] is not None:
            db_custom_count = int(custom_row["c"])
    except Exception as e:
        print(f"Notice: Stats query custom_products error: {e}")

    try:
        orders_row = fetch_one("SELECT COUNT(*) as c FROM orders")
        if orders_row and "c" in orders_row and orders_row["c"] is not None:
            db_orders_count = int(orders_row["c"])
    except Exception as e:
        print(f"Notice: Stats query orders error: {e}")

    try:
        users_row = fetch_one("SELECT COUNT(*) as c FROM users")
        if users_row and "c" in users_row and users_row["c"] is not None:
            db_users_count = int(users_row["c"])
    except Exception as e:
        print(f"Notice: Stats query users error: {e}")

    try:
        cities_row = fetch_one("SELECT COUNT(DISTINCT city) as c FROM users WHERE city IS NOT NULL AND TRIM(city) != ''")
        if cities_row and "c" in cities_row and cities_row["c"] is not None:
            db_cities_count = int(cities_row["c"])
    except Exception as e:
        print(f"Notice: Stats query cities error: {e}")

    # Return EXACT real live counts calculated directly from MySQL Workbench datastore
    return {
        "activeListings": db_custom_count,
        "totalRentals": db_orders_count,
        "happyLenders": db_users_count,
        "citiesCovered": db_cities_count if db_cities_count > 0 else (1 if db_users_count > 0 else 0),
    }

def toggle_custom_product_availability(product_id: str, email: str):
    clean_email = (email or "").strip().lower()
    if product_id in MOCK_CUSTOM_PRODUCTS:
        curr = MOCK_CUSTOM_PRODUCTS[product_id].get("available", True)
        MOCK_CUSTOM_PRODUCTS[product_id]["available"] = not curr
    try:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT available FROM custom_products WHERE id = %s AND user_email = %s", (product_id, clean_email))
                    row = cursor.fetchone()
                    if row:
                        new_val = not bool(row["available"])
                        cursor.execute("UPDATE custom_products SET available = %s WHERE id = %s AND user_email = %s", (new_val, product_id, clean_email))
                        conn.commit()
                        return new_val
            finally:
                conn.close()
    except Exception as e:
        print(f"Notice: Database toggle_custom_product_availability notice: {e}")
    return MOCK_CUSTOM_PRODUCTS.get(product_id, {}).get("available", True)

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
        logger.warning(
            "SECURITY: token_blocklist DB write failed for jti=%s email=%s — "
            "token revocation stored only in-process REVOKED_JTIS (lost on restart). "
            "Error: %s", jti, email, e
        )

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





