import os
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

# Parse DATABASE_URL if provided by Railway
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    try:
        url = urlparse(DATABASE_URL)
        MYSQL_HOST = url.hostname or "localhost"
        MYSQL_PORT = url.port or 3306
        MYSQL_USER = url.username or "root"
        MYSQL_PASSWORD = url.password or ""
        MYSQL_DB = url.path.lstrip("/") or "payent_db"
    except Exception as e:
        print(f"Warning: Failed to parse DATABASE_URL: {e}")
        MYSQL_HOST = os.getenv("MYSQLHOST", os.getenv("MYSQL_HOST", "localhost"))
        MYSQL_PORT = int(os.getenv("MYSQLPORT", os.getenv("MYSQL_PORT", "3306")))
        MYSQL_USER = os.getenv("MYSQLUSER", os.getenv("MYSQL_USER", "root"))
        MYSQL_PASSWORD = os.getenv("MYSQLPASSWORD", os.getenv("MYSQL_PASSWORD", "Bmohan"))
        MYSQL_DB = os.getenv("MYSQLDATABASE", os.getenv("MYSQL_DB", "payent_db"))
else:
    # Railway environment variable aliases (MYSQLHOST / MYSQL_HOST, etc.)
    MYSQL_HOST = os.getenv("MYSQLHOST", os.getenv("MYSQL_HOST", "localhost"))
    MYSQL_PORT = int(os.getenv("MYSQLPORT", os.getenv("MYSQL_PORT", "3306")))
    MYSQL_USER = os.getenv("MYSQLUSER", os.getenv("MYSQL_USER", "root"))
    MYSQL_PASSWORD = os.getenv("MYSQLPASSWORD", os.getenv("MYSQL_PASSWORD", "Bmohan"))
    MYSQL_DB = os.getenv("MYSQLDATABASE", os.getenv("MYSQL_DB", "payent_db"))

# JWT/Security Config
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "payent_super_secret_key_change_me_in_production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

# Real-time Twilio Verify Config
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_VERIFY_SERVICE_SID = os.getenv("TWILIO_VERIFY_SERVICE_SID", "")

# Admin Registration Config
ADMIN_SETUP_CODE = os.getenv("ADMIN_SETUP_CODE", "PAYENT-ADMIN-2026")
