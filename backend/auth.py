import os
import re
import hashlib
import uuid
import urllib.request
from datetime import datetime, timedelta, timezone
import bcrypt
import jwt
from config import JWT_SECRET_KEY, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS, IS_PRODUCTION

COMMON_WEAK_PASSWORDS = {
    "12345678", "password", "password123", "123456789", "1234567890",
    "admin123", "admin@123", "welcome123", "letmein123", "payent123",
    "qwerty123", "iloveyou", "sunshine", "princess", "monkey123"
}

def check_hibp_pwned_password(password: str) -> bool:
    """
    Check if a password has been breached using the HaveIBeenPwned Range API (k-Anonymity model).
    Returns True if the password is known to be compromised, False otherwise.
    """
    try:
        sha1_pwd = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
        prefix = sha1_pwd[:5]
        suffix = sha1_pwd[5:]
        url = f"https://api.pwnedpasswords.com/range/{prefix}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Payent-Security-Audit'})
        with urllib.request.urlopen(req, timeout=3) as response:
            if response.status == 200:
                body = response.read().decode('utf-8')
                for line in body.splitlines():
                    hash_suffix, count = line.split(':')
                    if hash_suffix.strip() == suffix:
                        return True  # Found in breach database!
    except Exception:
        # Offline or API request failed; gracefully rely on local rules
        pass
    return False

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password complexity and check against common/breached password lists.
    Returns (is_valid, error_message).
    """
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if len(password) > 128:
        return False, "Password cannot exceed 128 characters."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit."
    
    if password.lower() in COMMON_WEAK_PASSWORDS:
        return False, "This password is too common and easily guessed. Please choose a stronger password."

    if IS_PRODUCTION and check_hibp_pwned_password(password):
        return False, "This password has appeared in a known data breach. Please choose a safer password."

    return True, ""

def hash_password(password: str) -> str:
    """Hash password using bcrypt with work factor = 12."""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password safely."""
    try:
        if not plain_password or not hashed_password:
            return False
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create a new signed JWT access token with explicit algorithm and jti."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": now,
        "nbf": now,
        "type": "access",
        "jti": str(uuid.uuid4())
    })
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create a new signed JWT refresh token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "iat": now,
        "nbf": now,
        "type": "refresh",
        "jti": str(uuid.uuid4())
    })
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str, expected_type: str = "access") -> dict:
    """
    Decode and validate a JWT access or refresh token with pinned algorithm.
    """
    try:
        decoded_token = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_nbf": True,
                "require": ["exp", "sub", "type", "jti"]
            }
        )
        if decoded_token.get("type") != expected_type:
            return None
        return decoded_token
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

