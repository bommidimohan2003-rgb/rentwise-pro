import os
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

# Database Config
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "Shiny@123")
MYSQL_DB = os.getenv("MYSQL_DB", "payent_db")

# JWT/Security Config
# Fallback is a static secret for development, override in production environment
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "payent_super_secret_key_change_me_in_production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

# Real-time Twilio Verify Config
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_VERIFY_SERVICE_SID = os.getenv("TWILIO_VERIFY_SERVICE_SID", "")
