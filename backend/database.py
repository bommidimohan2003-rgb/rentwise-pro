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
