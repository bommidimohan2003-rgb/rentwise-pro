import os
import sys

# Ensure backend directory is in sys.path for serverless environment compatibility
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pymysql
import ssl
import logging
import hashlib
import datetime
from typing import Optional, List
from datetime import datetime as dt, timezone, timedelta
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

    now = dt.now(timezone.utc).timestamp()
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
            autocommit=True,
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

    now = dt.now(timezone.utc).timestamp()
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
    try:
        execute_query("ALTER TABLE users MODIFY COLUMN avatar LONGTEXT NULL")
    except Exception:
        pass
    try:
        execute_query("ALTER TABLE users MODIFY COLUMN profile_photo_url LONGTEXT NULL")
    except Exception:
        pass

    add_column_safely("users", "status VARCHAR(50) DEFAULT 'active'")
    add_column_safely("users", "verified BOOLEAN DEFAULT TRUE")
    add_column_safely("users", "avatar LONGTEXT NULL")
    add_column_safely("users", "address VARCHAR(500)")
    add_column_safely("users", "city VARCHAR(100)")
    add_column_safely("users", "state VARCHAR(100)")
    add_column_safely("users", "pincode VARCHAR(20)")
    add_column_safely("users", "occupation VARCHAR(255)")
    add_column_safely("users", "bio TEXT")
    add_column_safely("users", "country VARCHAR(100) DEFAULT 'India'")
    add_column_safely("users", "latitude DECIMAL(10, 8) NULL")
    add_column_safely("users", "longitude DECIMAL(11, 8) NULL")
    add_column_safely("users", "firebase_uid VARCHAR(255) NULL")
    add_column_safely("users", "last_login_at VARCHAR(100)")
    add_column_safely("users", "aadhaar_number VARCHAR(20) NULL")
    add_column_safely("users", "profile_photo_url LONGTEXT NULL")
    add_index_safely("users", "idx_users_aadhaar_number", "aadhaar_number")
    add_index_safely("users", "idx_users_phone", "phone")

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

    # Create sessions table for multi-device session management
    execute_query("""
        CREATE TABLE IF NOT EXISTS sessions (
            id VARCHAR(255) PRIMARY KEY,
            user_email VARCHAR(255) NOT NULL,
            refresh_token_hash VARCHAR(255) NOT NULL,
            device_name VARCHAR(255) NULL,
            ip_address VARCHAR(100) NULL,
            user_agent TEXT NULL,
            created_at VARCHAR(100) NOT NULL,
            last_used_at VARCHAR(100) NOT NULL,
            expires_at VARCHAR(100) NOT NULL,
            revoked_at VARCHAR(100) NULL
        )
    """)
    add_index_safely("sessions", "idx_sessions_user_email", "user_email")
    add_index_safely("sessions", "idx_sessions_token_hash", "refresh_token_hash")
    add_index_safely("sessions", "idx_sessions_expires_at", "expires_at")

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
    add_index_safely("custom_products", "idx_custom_products_user_email", "user_email")

    # Create agents table
    execute_query("""
        CREATE TABLE IF NOT EXISTS agents (
            id VARCHAR(255) PRIMARY KEY,
            user_email VARCHAR(255) UNIQUE NOT NULL,
            status VARCHAR(50) DEFAULT 'active',
            created_at VARCHAR(100) NOT NULL,
            updated_at VARCHAR(100)
        )
    """)
    add_index_safely("agents", "idx_agents_user_email", "user_email")

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

    # Safely alter reviews table for real customer review fields
    add_column_safely("reviews", "user_email VARCHAR(255)")
    add_column_safely("reviews", "user_location VARCHAR(255)")
    add_column_safely("reviews", "user_role VARCHAR(255)")
    add_column_safely("reviews", "booking_id VARCHAR(255)")
    add_column_safely("reviews", "product_image LONGTEXT")
    add_column_safely("reviews", "is_verified BOOLEAN DEFAULT TRUE")
    add_column_safely("reviews", "updated_at VARCHAR(100)")
    add_index_safely("reviews", "idx_reviews_product_id", "product_id")
    add_index_safely("reviews", "idx_reviews_user_email", "user_email")
    add_index_safely("reviews", "idx_reviews_booking_id", "booking_id")
    add_index_safely("reviews", "idx_reviews_rating", "rating")
    add_index_safely("reviews", "idx_reviews_created_at", "created_at")

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

    # Create api_keys table for secure API key authentication & permissions
    execute_query("""
        CREATE TABLE IF NOT EXISTS api_keys (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            key_prefix VARCHAR(50) NOT NULL,
            key_hash VARCHAR(255) NOT NULL,
            user_email VARCHAR(255) NOT NULL,
            scopes VARCHAR(1000) DEFAULT 'read',
            rate_limit INT DEFAULT 100,
            is_active BOOLEAN DEFAULT TRUE,
            expires_at VARCHAR(100) NULL,
            last_used_at VARCHAR(100) NULL,
            created_at VARCHAR(100) NOT NULL,
            updated_at VARCHAR(100) NOT NULL
        )
    """)

    add_index_safely("api_keys", "idx_api_keys_prefix", "key_prefix")
    add_index_safely("api_keys", "idx_api_keys_user", "user_email")
    add_index_safely("api_keys", "idx_api_keys_active", "is_active")

    # Seed initial data if tables are empty
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Seed default admin user
            cursor.execute("SELECT COUNT(*) as count FROM users WHERE LOWER(email) = 'bommidimohan2003@gmail.com'")
            if cursor.fetchone()["count"] == 0:
                hashed_pwd = "$2b$12$XbPCF4zGTgcZs6Z9afnXVuenqYPwmRIjLRs8PwXT7KZy99U8W2nE2"
                created_at = dt.now(timezone.utc).isoformat()
                cursor.execute("""
                    INSERT INTO users (email, phone, password_hash, full_name, role, created_at, last_login_at, status, verified)
                    VALUES ('bommidimohan2003@gmail.com', '+91 8810519885', %s, 'Bommidi Mohan', 'admin', %s, %s, 'active', TRUE)
                """, (hashed_pwd, created_at, created_at))
                print("Seeded admin user bommidimohan2003@gmail.com into users table.")

        conn.commit()
    finally:
        conn.close()

    # Auto-synchronize all existing product owners to agents table
    try:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT DISTINCT user_email FROM custom_products WHERE user_email IS NOT NULL AND user_email != ''")
                    owners = cursor.fetchall()
                    for o in owners:
                        email_val = o.get("user_email")
                        if email_val:
                            ensure_agent_profile(email_val)
            finally:
                conn.close()
    except Exception as sync_err:
        print(f"Notice: Auto sync existing product owners to agents notice: {sync_err}")

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
        "created_at": dt.now(timezone.utc).isoformat(),
        "last_login_at": dt.now(timezone.utc).isoformat(),
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
MOCK_REVIEWS = {}

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

def get_user_by_aadhaar(aadhaar_number: str):
    if not aadhaar_number:
        return None
    clean = "".join(c for c in str(aadhaar_number) if c.isdigit())
    if not clean:
        return None
    try:
        user = fetch_one("SELECT * FROM users WHERE aadhaar_number = %s", (clean,))
        if user:
            return user
    except Exception as e:
        logger.warning("DB read error in get_user_by_aadhaar: %s", e)
    for u in MOCK_USERS.values():
        if u.get("aadhaar_number") == clean:
            return u
    return None

def get_user_by_phone(phone: str):
    if not phone:
        return None
    clean = str(phone).strip()
    try:
        user = fetch_one("SELECT * FROM users WHERE phone = %s", (clean,))
        if user:
            return user
    except Exception as e:
        logger.warning("DB read error in get_user_by_phone: %s", e)
    for u in MOCK_USERS.values():
        if u.get("phone") == clean:
            return u
    return None

def create_user(
    email: str,
    phone: str,
    password_hash: str,
    full_name: str,
    role: str = "user",
    address: str = None,
    city: str = None,
    pincode: str = None,
    aadhaar_number: str = None,
    status: str = None
):
    created_at = dt.now(timezone.utc).isoformat()
    clean_email = email.strip().lower()
    clean_aadhaar = "".join(c for c in str(aadhaar_number) if c.isdigit()) if aadhaar_number else None
    user_status = status if status else ("approved" if role == "admin" else "pending")
    user_data = {
        "email": clean_email,
        "phone": phone,
        "password_hash": password_hash,
        "full_name": full_name,
        "role": role,
        "address": address,
        "city": city,
        "pincode": pincode,
        "aadhaar_number": clean_aadhaar,
        "status": user_status,
        "verified": bool(role == "admin"),
        "created_at": created_at
    }
    MOCK_USERS[clean_email] = user_data
    try:
        execute_query(
            "INSERT INTO users (email, phone, password_hash, full_name, role, address, city, pincode, aadhaar_number, status, verified, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (clean_email, phone, password_hash, full_name, role, address, city, pincode, clean_aadhaar, user_status, 1 if role == "admin" else 0, created_at)
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
        "aadhaar_number": clean_aadhaar,
        "status": user_status,
        "verified": bool(role == "admin"),
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
    created_at = dt.now(timezone.utc).isoformat()
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

        now_iso = dt.now(timezone.utc).isoformat()
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
    created_at = dt.now(timezone.utc).isoformat()
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
    created = order.get("createdAt") or order.get("created_at") or dt.now(timezone.utc).isoformat()
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
                    cursor.execute("""
                        SELECT cp.*, 
                               u.address AS owner_address, 
                               u.city AS owner_city, 
                               u.state AS owner_state, 
                               u.pincode AS owner_pincode
                        FROM custom_products cp
                        LEFT JOIN users u ON cp.user_email = u.email
                        WHERE cp.user_email = %s 
                        ORDER BY cp.created_at DESC
                    """, (clean_email,))
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
                    cursor.execute("""
                        SELECT cp.*, 
                               u.address AS owner_address, 
                               u.city AS owner_city, 
                               u.state AS owner_state, 
                               u.pincode AS owner_pincode
                        FROM custom_products cp
                        LEFT JOIN users u ON cp.user_email = u.email
                        ORDER BY cp.created_at DESC
                    """)
                    rows = cursor.fetchall()
                    if rows:
                        return rows
            finally:
                conn.close()
    except Exception as e:
        print(f"Notice: Database read error in get_all_custom_products: {e}")
    return list(MOCK_CUSTOM_PRODUCTS.values())

MOCK_AGENTS = {}

def ensure_agent_profile(email: str):
    clean_email = (email or "").strip().lower()
    if not clean_email or clean_email.endswith("@payent.com"):
        return None

    created_at = dt.now(timezone.utc).isoformat()
    agent_id = f"agent-{clean_email.replace('@', '-at-').replace('.', '-')}"

    if clean_email not in MOCK_AGENTS:
        MOCK_AGENTS[clean_email] = {
            "id": agent_id,
            "user_email": clean_email,
            "status": "active",
            "created_at": created_at,
            "updated_at": created_at
        }

    try:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT id FROM agents WHERE user_email = %s", (clean_email,))
                    row = cursor.fetchone()
                    if not row:
                        cursor.execute("""
                            INSERT INTO agents (id, user_email, status, created_at, updated_at)
                            VALUES (%s, %s, %s, %s, %s)
                        """, (agent_id, clean_email, "active", created_at, created_at))
                        conn.commit()
                        logger.info(f"Created agent profile for user '{clean_email}'.")
            finally:
                conn.close()
    except Exception as e:
        logger.warning(f"Notice: ensure_agent_profile for {clean_email} notice: {e}")

def get_all_approved_custom_products():
    try:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        SELECT cp.*, 
                               u.address AS owner_address, 
                               u.city AS owner_city, 
                               u.state AS owner_state, 
                               u.pincode AS owner_pincode
                        FROM custom_products cp
                        LEFT JOIN users u ON cp.user_email = u.email
                        WHERE (cp.status = 'approved' OR cp.status IS NULL) 
                          AND (cp.hidden = 0 OR cp.hidden IS NULL) 
                        ORDER BY cp.created_at DESC
                    """)
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
    created_at = dt.now(timezone.utc).isoformat()
    
    owner_info = product.get("owner") if isinstance(product.get("owner"), dict) else {}
    owner_name = owner_info.get("name") or product.get("owner_name") or clean_email.split("@")[0]
    owner_email = owner_info.get("email") or clean_email
    owner_avatar = owner_info.get("avatar") or product.get("owner_avatar") or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
    owner_rating = float(owner_info.get("rating") or product.get("owner_rating") or 5.0)

    prod_status = str(product.get("status", "pending"))
    is_available = bool(product.get("available", False if prod_status == "pending" else True))

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
    ensure_agent_profile(clean_email)

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
        n.get("createdAt") or n.get("created_at") or dt.now(timezone.utc).isoformat()
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
    created_at = dt.now(timezone.utc).isoformat()
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
    now = int(dt.now(timezone.utc).timestamp())
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
    created_at = dt.now(timezone.utc).isoformat()
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
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
               ON DUPLICATE KEY UPDATE 
               user_email=VALUES(user_email), product_id=VALUES(product_id), product_title=VALUES(product_title),
               product_image=VALUES(product_image), start_date=VALUES(start_date), end_date=VALUES(end_date),
               total=VALUES(total), status=VALUES(status), razorpay_order_id=VALUES(razorpay_order_id), payment_status=VALUES(payment_status)""",
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
    if event_id in MOCK_PROCESSED_EVENTS:
        return True
    try:
        row = fetch_one("SELECT 1 FROM processed_payment_events WHERE event_id = %s", (event_id,))
        if row:
            MOCK_PROCESSED_EVENTS.add(event_id)
            return True
    except Exception:
        pass
    return False

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
        """, (event_id, event_type or "", payment_id or "", order_id or "", dt.now(timezone.utc).isoformat()))
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
        MOCK_USER_EVENTS.append({**event, "created_at": dt.now(timezone.utc).isoformat()})

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
            MOCK_USER_EVENTS.append({**ev, "created_at": dt.now(timezone.utc).isoformat()})
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


# ----------------------------------------------------------------------
# API Key Management Database Operations
# ----------------------------------------------------------------------

MOCK_API_KEYS = {}

def get_api_keys_db(page: int = 1, limit: int = 25, search: str = None):
    try:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    where_clause = ""
                    params = []
                    if search:
                        where_clause = "WHERE name LIKE %s OR key_prefix LIKE %s OR user_email LIKE %s"
                        pattern = f"%{search}%"
                        params = [pattern, pattern, pattern]
                    
                    cursor.execute(f"SELECT COUNT(*) as count FROM api_keys {where_clause}", tuple(params))
                    total = cursor.fetchone()["count"]
                    
                    offset = (page - 1) * limit
                    cursor.execute(f"""
                        SELECT id, name, key_prefix, user_email, scopes, rate_limit, is_active, expires_at, last_used_at, created_at, updated_at
                        FROM api_keys
                        {where_clause}
                        ORDER BY created_at DESC
                        LIMIT %s OFFSET %s
                    """, tuple(params + [limit, offset]))
                    items = cursor.fetchall()
                    for item in items:
                        item["is_active"] = bool(item.get("is_active", True))
                    return {"items": items, "total": total, "page": page, "limit": limit}
            finally:
                conn.close()
    except Exception as e:
        logger.warning(f"Failed to fetch api_keys from DB: {e}")

    items = list(MOCK_API_KEYS.values())
    if search:
        s = search.lower()
        items = [k for k in items if s in k["name"].lower() or s in k["key_prefix"].lower() or s in k["user_email"].lower()]
    total = len(items)
    offset = (page - 1) * limit
    page_items = items[offset:offset + limit]
    clean_items = [{k: v for k, v in item.items() if k != "key_hash"} for item in page_items]
    return {"items": clean_items, "total": total, "page": page, "limit": limit}

def get_api_key_by_id_db(key_id: str):
    try:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        SELECT id, name, key_prefix, user_email, scopes, rate_limit, is_active, expires_at, last_used_at, created_at, updated_at
                        FROM api_keys WHERE id = %s
                    """, (key_id,))
                    res = cursor.fetchone()
                    if res:
                        res["is_active"] = bool(res.get("is_active", True))
                        return res
            finally:
                conn.close()
    except Exception as e:
        logger.warning(f"Failed to fetch api_key by id from DB: {e}")

    item = MOCK_API_KEYS.get(key_id)
    if item:
        return {k: v for k, v in item.items() if k != "key_hash"}
    return None

def get_api_key_by_hash_db(key_hash: str):
    try:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        SELECT id, name, key_prefix, key_hash, user_email, scopes, rate_limit, is_active, expires_at, last_used_at, created_at, updated_at
                        FROM api_keys WHERE key_hash = %s
                    """, (key_hash,))
                    res = cursor.fetchone()
                    if res:
                        res["is_active"] = bool(res.get("is_active", True))
                        return res
            finally:
                conn.close()
    except Exception as e:
        logger.warning(f"Failed to fetch api_key by hash from DB: {e}")

    for k in MOCK_API_KEYS.values():
        if k.get("key_hash") == key_hash:
            return dict(k)
    return None

def create_api_key_db(data: dict):
    now_str = dt.now(timezone.utc).isoformat()
    key_id = data.get("id") or f"ak_{int(dt.now(timezone.utc).timestamp())}_{random.randint(100, 999)}"
    record = {
        "id": key_id,
        "name": data["name"],
        "key_prefix": data["key_prefix"],
        "key_hash": data["key_hash"],
        "user_email": data["user_email"],
        "scopes": data.get("scopes", "read"),
        "rate_limit": int(data.get("rate_limit", 100)),
        "is_active": bool(data.get("is_active", True)),
        "expires_at": data.get("expires_at"),
        "last_used_at": None,
        "created_at": now_str,
        "updated_at": now_str,
    }
    try:
        execute_query("""
            INSERT INTO api_keys (id, name, key_prefix, key_hash, user_email, scopes, rate_limit, is_active, expires_at, last_used_at, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            record["id"], record["name"], record["key_prefix"], record["key_hash"],
            record["user_email"], record["scopes"], record["rate_limit"],
            1 if record["is_active"] else 0, record["expires_at"], record["last_used_at"],
            record["created_at"], record["updated_at"]
        ))
    except Exception as e:
        logger.warning(f"Failed to insert api_key into DB: {e}")

    MOCK_API_KEYS[key_id] = record
    return {k: v for k, v in record.items() if k != "key_hash"}

def update_api_key_db(key_id: str, updates: dict):
    now_str = dt.now(timezone.utc).isoformat()
    fields = ["updated_at = %s"]
    params = [now_str]

    if "name" in updates:
        fields.append("name = %s")
        params.append(updates["name"])
    if "scopes" in updates:
        fields.append("scopes = %s")
        params.append(updates["scopes"])
    if "rate_limit" in updates:
        fields.append("rate_limit = %s")
        params.append(int(updates["rate_limit"]))
    if "is_active" in updates:
        fields.append("is_active = %s")
        params.append(1 if updates["is_active"] else 0)
    if "expires_at" in updates:
        fields.append("expires_at = %s")
        params.append(updates["expires_at"])

    params.append(key_id)
    try:
        execute_query(f"UPDATE api_keys SET {', '.join(fields)} WHERE id = %s", tuple(params))
    except Exception as e:
        logger.warning(f"Failed to update api_key in DB: {e}")

    if key_id in MOCK_API_KEYS:
        MOCK_API_KEYS[key_id].update(updates)
        MOCK_API_KEYS[key_id]["updated_at"] = now_str
    return get_api_key_by_id_db(key_id)

def delete_api_key_db(key_id: str):
    try:
        execute_query("DELETE FROM api_keys WHERE id = %s", (key_id,))
    except Exception as e:
        logger.warning(f"Failed to delete api_key from DB: {e}")
    MOCK_API_KEYS.pop(key_id, None)
    return True

def touch_api_key_last_used_db(key_id: str):
    now_str = dt.now(timezone.utc).isoformat()
    try:
        execute_query("UPDATE api_keys SET last_used_at = %s WHERE id = %s", (now_str, key_id))
    except Exception:
        pass
    if key_id in MOCK_API_KEYS:
        MOCK_API_KEYS[key_id]["last_used_at"] = now_str

# Session Management DB Helpers
def hash_refresh_token(token: str) -> str:
    """Compute SHA-256 hash of refresh token for secure database storage."""
    return hashlib.sha256(token.encode('utf-8')).hexdigest()

def create_db_session(session_id: str, user_email: str, raw_refresh_token: str, device_name: str, ip_address: str, user_agent: str, expires_at_str: str) -> bool:
    clean_email = user_email.strip().lower()
    token_hash = hash_refresh_token(raw_refresh_token)
    now_str = dt.now(timezone.utc).isoformat()
    return execute_query("""
        INSERT INTO sessions (id, user_email, refresh_token_hash, device_name, ip_address, user_agent, created_at, last_used_at, expires_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (session_id, clean_email, token_hash, device_name, ip_address, user_agent, now_str, now_str, expires_at_str))

def get_valid_db_session(raw_refresh_token: str) -> Optional[dict]:
    token_hash = hash_refresh_token(raw_refresh_token)
    now_str = dt.now(timezone.utc).isoformat()
    conn = get_db_connection()
    if not conn:
        return None
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT * FROM sessions
                WHERE refresh_token_hash = %s AND revoked_at IS NULL AND expires_at > %s
            """, (token_hash, now_str))
            return cursor.fetchone()
    finally:
        conn.close()

def update_session_activity(session_id: str):
    now_str = dt.now(timezone.utc).isoformat()
    execute_query("UPDATE sessions SET last_used_at = %s WHERE id = %s", (now_str, session_id))

def revoke_db_session(session_id: str) -> bool:
    now_str = dt.now(timezone.utc).isoformat()
    return execute_query("UPDATE sessions SET revoked_at = %s WHERE id = %s AND revoked_at IS NULL", (now_str, session_id))

def revoke_db_session_by_token(raw_refresh_token: str) -> bool:
    token_hash = hash_refresh_token(raw_refresh_token)
    now_str = dt.now(timezone.utc).isoformat()
    return execute_query("UPDATE sessions SET revoked_at = %s WHERE refresh_token_hash = %s AND revoked_at IS NULL", (now_str, token_hash))

def revoke_all_user_sessions(user_email: str) -> bool:
    clean_email = user_email.strip().lower()
    now_str = dt.now(timezone.utc).isoformat()
    return execute_query("UPDATE sessions SET revoked_at = %s WHERE LOWER(user_email) = LOWER(%s) AND revoked_at IS NULL", (now_str, clean_email))

def get_user_active_sessions(user_email: str) -> List[dict]:
    clean_email = user_email.strip().lower()
    now_str = dt.now(timezone.utc).isoformat()
    conn = get_db_connection()
    if not conn:
        return []
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id, device_name, ip_address, created_at, last_used_at, expires_at
                FROM sessions
                WHERE LOWER(user_email) = LOWER(%s) AND revoked_at IS NULL AND expires_at > %s
                ORDER BY last_used_at DESC
            """, (clean_email, now_str))
            return cursor.fetchall()
    finally:
        conn.close()

def cleanup_expired_sessions() -> bool:
    now_str = dt.now(timezone.utc).isoformat()
    return execute_query("DELETE FROM sessions WHERE expires_at <= %s OR revoked_at IS NOT NULL", (now_str,))

def is_session_revoked(session_id: str) -> bool:
    if not session_id:
        return False
    conn = get_db_connection()
    if not conn:
        return False
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT revoked_at, expires_at FROM sessions WHERE id = %s
            """, (session_id,))
            row = cursor.fetchone()
            if not row:
                return False
            now_str = dt.now(timezone.utc).isoformat()
            if row.get("revoked_at") is not None:
                return True
            exp = row.get("expires_at")
            if exp and exp <= now_str:
                return True
            return False
    except Exception:
        return False
    finally:
        conn.close()

# ----------------------------------------------------------------------
# Real Customer Reviews DB Helpers
# ----------------------------------------------------------------------

def get_reviews_from_db(
    page: int = 1,
    limit: int = 20,
    sort: str = "newest",
    rating_filter: Optional[int] = None,
    product_id: Optional[str] = None,
    verified_only: bool = False
) -> dict:
    page = max(1, page)
    limit = max(1, min(100, limit))
    offset = (page - 1) * limit

    conditions = ["hidden = FALSE"]
    params: list = []

    if rating_filter is not None and 1 <= rating_filter <= 5:
        conditions.append("rating = %s")
        params.append(rating_filter)

    if product_id:
        conditions.append("product_id = %s")
        params.append(product_id)

    if verified_only:
        conditions.append("is_verified = TRUE")

    where_clause = " WHERE " + " AND ".join(conditions)

    order_clause = "ORDER BY created_at DESC"
    if sort == "highest":
        order_clause = "ORDER BY rating DESC, created_at DESC"
    elif sort == "lowest":
        order_clause = "ORDER BY rating ASC, created_at DESC"
    elif sort == "oldest":
        order_clause = "ORDER BY created_at ASC"

    conn = get_db_connection()
    if not conn:
        filtered = [
            r for r in MOCK_REVIEWS.values()
            if not r.get("hidden")
            and (rating_filter is None or r.get("rating") == rating_filter)
            and (not product_id or r.get("product_id") == product_id)
            and (not verified_only or r.get("is_verified", True))
        ]
        if sort == "highest":
            filtered.sort(key=lambda x: (x.get("rating", 0), x.get("created_at", "")), reverse=True)
        elif sort == "lowest":
            filtered.sort(key=lambda x: (x.get("rating", 0), -len(x.get("created_at", ""))))
        elif sort == "oldest":
            filtered.sort(key=lambda x: x.get("created_at", ""))
        else:
            filtered.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        total = len(filtered)
        paginated = filtered[offset:offset+limit]
        return {
            "reviews": paginated,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": (total + limit - 1) // limit if total > 0 else 1
            }
        }

    try:
        with conn.cursor() as cursor:
            cursor.execute(f"SELECT COUNT(*) as total FROM reviews {where_clause}", tuple(params))
            count_row = cursor.fetchone()
            total = count_row["total"] if count_row else 0

            query = f"""
                SELECT r.*, 
                       u.full_name AS db_user_name, 
                       u.avatar AS db_user_avatar, 
                       u.city AS db_user_city, 
                       u.occupation AS db_user_role
                FROM reviews r
                LEFT JOIN users u ON LOWER(r.user_email) = LOWER(u.email)
                {where_clause}
                {order_clause}
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, tuple(params + [limit, offset]))
            rows = cursor.fetchall()
            
            reviews = []
            for r in rows:
                user_display = r.get("db_user_name") or r.get("user_name") or "Creator"
                avatar_url = r.get("db_user_avatar") or r.get("user_avatar") or f"https://ui-avatars.com/api/?name={user_display}&background=0D151D&color=fff"
                reviews.append({
                    "id": r["id"],
                    "productId": r.get("product_id"),
                    "productTitle": r.get("product_title"),
                    "productImage": r.get("product_image"),
                    "bookingId": r.get("booking_id"),
                    "userId": r.get("user_email"),
                    "userName": user_display,
                    "userAvatar": avatar_url,
                    "userLocation": r.get("db_user_city") or r.get("user_location") or "",
                    "userRole": r.get("db_user_role") or r.get("user_role") or "",
                    "rating": int(r.get("rating", 5)),
                    "comment": r.get("comment", ""),
                    "isVerified": bool(r.get("is_verified", True)),
                    "createdAt": r.get("created_at"),
                    "updatedAt": r.get("updated_at")
                })
                
            return {
                "reviews": reviews,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total,
                    "totalPages": (total + limit - 1) // limit if total > 0 else 1
                }
            }
    finally:
        conn.close()

def get_review_stats_from_db(product_id: Optional[str] = None) -> dict:
    conditions = ["hidden = FALSE"]
    params: list = []
    if product_id:
        conditions.append("product_id = %s")
        params.append(product_id)

    where_clause = " WHERE " + " AND ".join(conditions)

    conn = get_db_connection()
    if not conn:
        revs = [r for r in MOCK_REVIEWS.values() if not r.get("hidden") and (not product_id or r.get("product_id") == product_id)]
        total = len(revs)
        if total == 0:
            return {"averageRating": 0.0, "totalReviews": 0, "ratingDistribution": {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}}
        avg = round(sum(r.get("rating", 5) for r in revs) / total, 1)
        dist = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
        for r in revs:
            k = str(int(r.get("rating", 5)))
            if k in dist: dist[k] += 1
        return {"averageRating": avg, "totalReviews": total, "ratingDistribution": dist}

    try:
        with conn.cursor() as cursor:
            cursor.execute(f"""
                SELECT COUNT(*) as total, IFNULL(AVG(rating), 0) as avg_rating
                FROM reviews
                {where_clause}
            """, tuple(params))
            stats_row = cursor.fetchone()
            total = stats_row["total"] if stats_row else 0
            avg_rating = round(float(stats_row["avg_rating"]), 1) if stats_row and stats_row["avg_rating"] else 0.0

            cursor.execute(f"""
                SELECT rating, COUNT(*) as cnt
                FROM reviews
                {where_clause}
                GROUP BY rating
            """, tuple(params))
            dist_rows = cursor.fetchall()
            distribution = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
            for row in dist_rows:
                r_key = str(int(row["rating"]))
                if r_key in distribution:
                    distribution[r_key] = int(row["cnt"])

            return {
                "averageRating": avg_rating,
                "totalReviews": total,
                "ratingDistribution": distribution
            }
    finally:
        conn.close()

def get_review_by_id(review_id: str) -> Optional[dict]:
    conn = get_db_connection()
    if not conn:
        return MOCK_REVIEWS.get(review_id)
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM reviews WHERE id = %s", (review_id,))
            return cursor.fetchone()
    finally:
        conn.close()

def create_review_record(review_data: dict) -> bool:
    rev_id = review_data["id"]
    conn = get_db_connection()
    if not conn:
        MOCK_REVIEWS[rev_id] = review_data
        return True
    try:
        execute_query("""
            INSERT INTO reviews (
                id, product_id, product_title, product_image, user_email, user_name,
                user_avatar, user_location, user_role, booking_id, rating, comment,
                is_verified, hidden, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            rev_id,
            review_data.get("product_id"),
            review_data.get("product_title"),
            review_data.get("product_image"),
            review_data.get("user_email"),
            review_data.get("user_name"),
            review_data.get("user_avatar"),
            review_data.get("user_location"),
            review_data.get("user_role"),
            review_data.get("booking_id"),
            review_data.get("rating"),
            review_data.get("comment"),
            review_data.get("is_verified", True),
            False,
            review_data.get("created_at"),
            review_data.get("updated_at")
        ))
        return True
    except Exception as e:
        logger.error(f"Error creating review record: {e}")
        return False

def update_review_record(review_id: str, rating: int, comment: str, updated_at: str) -> bool:
    conn = get_db_connection()
    if not conn:
        if review_id in MOCK_REVIEWS:
            MOCK_REVIEWS[review_id]["rating"] = rating
            MOCK_REVIEWS[review_id]["comment"] = comment
            MOCK_REVIEWS[review_id]["updated_at"] = updated_at
            return True
        return False
    try:
        execute_query("""
            UPDATE reviews
            SET rating = %s, comment = %s, updated_at = %s
            WHERE id = %s
        """, (rating, comment, updated_at, review_id))
        return True
    except Exception as e:
        logger.error(f"Error updating review record: {e}")
        return False

def delete_review_record(review_id: str) -> bool:
    conn = get_db_connection()
    if not conn:
        MOCK_REVIEWS.pop(review_id, None)
        return True
    try:
        execute_query("DELETE FROM reviews WHERE id = %s", (review_id,))
        return True
    except Exception as e:
        logger.error(f"Error deleting review record: {e}")
        return False

def recalculate_product_ratings(product_id: str):
    if not product_id:
        return
    conn = get_db_connection()
    if not conn:
        return
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) as cnt, IFNULL(AVG(rating), 0) as avg_rating
                FROM reviews
                WHERE product_id = %s AND hidden = FALSE
            """, (product_id,))
            row = cursor.fetchone()
            if row:
                cnt = int(row["cnt"])
                avg_r = round(float(row["avg_rating"]), 1)
                execute_query("""
                    UPDATE custom_products
                    SET rating = %s, reviews = %s
                    WHERE id = %s
                """, (avg_r, cnt, product_id))
    except Exception as e:
        logger.warning(f"Failed to recalculate rating for product {product_id}: {e}")
    finally:
        conn.close()

def get_user_eligible_bookings(user_email: str) -> List[dict]:
    clean_email = user_email.strip().lower()
    conn = get_db_connection()
    if not conn:
        user_orders = get_orders(clean_email)
        reviewed_bookings = {r.get("booking_id") for r in MOCK_REVIEWS.values() if r.get("booking_id")}
        eligible = []
        for o in user_orders:
            b_id = o.get("id")
            if b_id and b_id not in reviewed_bookings and o.get("status") not in ("cancelled", "refunded"):
                eligible.append({
                    "bookingId": b_id,
                    "productId": o.get("productId") or o.get("product_id"),
                    "productTitle": o.get("productTitle") or o.get("product_title"),
                    "productImage": o.get("productImage") or o.get("product_image"),
                    "startDate": o.get("startDate") or o.get("start_date"),
                    "endDate": o.get("endDate") or o.get("end_date"),
                    "status": o.get("status", "completed")
                })
        return eligible

    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT o.id as booking_id, o.product_id, o.product_title, o.product_image,
                       o.start_date, o.end_date, o.status, o.created_at
                FROM orders o
                LEFT JOIN reviews r ON o.id = r.booking_id
                WHERE LOWER(o.user_email) = LOWER(%s)
                  AND o.status NOT IN ('cancelled', 'refunded')
                  AND r.id IS NULL
                ORDER BY o.created_at DESC
            """, (clean_email,))
            rows = cursor.fetchall()
            return [
                {
                    "bookingId": r["booking_id"],
                    "productId": r["product_id"],
                    "productTitle": r["product_title"],
                    "productImage": r["product_image"],
                    "startDate": r["start_date"],
                    "endDate": r["end_date"],
                    "status": r["status"]
                }
                for r in rows
            ]
    finally:
        conn.close()






