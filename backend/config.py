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

# ENVIRONMENT Config
ENV = os.getenv("ENV", os.getenv("ENVIRONMENT", "development")).lower()
IS_PRODUCTION = ENV in ("production", "prod")

# Security & Secrets Audit
DEFAULT_SECRET = "payent_super_secret_key_change_me_in_production"
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", DEFAULT_SECRET)
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")

if IS_PRODUCTION:
    if not JWT_SECRET_KEY or JWT_SECRET_KEY == DEFAULT_SECRET:
        raise RuntimeError("FATAL SECURITY ERROR: JWT_SECRET_KEY must be set to a strong secret in production!")
    if not MYSQL_PASSWORD or MYSQL_PASSWORD == "Bmohan":
        raise RuntimeError("FATAL SECURITY ERROR: MYSQL_PASSWORD environment variable must be set to a strong password in production!")
    if not os.getenv("ADMIN_SETUP_CODE"):
        raise RuntimeError("FATAL SECURITY ERROR: ADMIN_SETUP_CODE environment variable must be set in production!")
    if not RAZORPAY_WEBHOOK_SECRET:
        raise RuntimeError("FATAL SECURITY ERROR: RAZORPAY_WEBHOOK_SECRET environment variable must be set in production mode!")

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
if JWT_ALGORITHM not in ["HS256", "HS384", "HS512"]:
    raise RuntimeError(f"FATAL SECURITY ERROR: Insecure or unsupported JWT_ALGORITHM '{JWT_ALGORITHM}'")

# Token Expiries
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))  # 30 minutes
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))        # 7 days

# CORS Config
ALLOWED_ORIGINS_RAW = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173,http://localhost:3001")
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_RAW.split(",") if origin.strip()]

# Real-time Twilio Verify Config
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_VERIFY_SERVICE_SID = os.getenv("TWILIO_VERIFY_SERVICE_SID", "")

# Admin Registration Config
ADMIN_SETUP_CODE = os.getenv("ADMIN_SETUP_CODE", "PAYENT-ADMIN-2026")

# Payment Gateway (Razorpay) Config
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")

if IS_PRODUCTION:
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        print("Warning: Production RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing. Payment processing will operate in test fallback mode.")
    if not RAZORPAY_WEBHOOK_SECRET:
        print("Warning: Production RAZORPAY_WEBHOOK_SECRET is missing. Register webhook secret in backend environment variables.")

