import os
import datetime
import random
import secrets
import logging
import json
import asyncio
from typing import Optional, List
from dotenv import load_dotenv

# Load env variables at application startup
load_dotenv()

from fastapi import FastAPI, HTTPException, Header, Depends, status, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

# Setup Structured Logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("payent.security")

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth

# Initialize Firebase Admin SDK once if credentials provided
try:
    if not firebase_admin._apps:
        service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        if service_account_json:
            try:
                cred_dict = json.loads(service_account_json)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin SDK initialized with service account JSON.")
            except Exception as json_err:
                logger.warning(f"Notice: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: {json_err}")
        elif os.path.exists("firebase-service-account.json"):
            cred = credentials.Certificate("firebase-service-account.json")
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized from local firebase-service-account.json file.")
except Exception as fb_err:
    logger.warning(f"Notice: Firebase Admin SDK initialization notice: {fb_err}")

import hmac
import hashlib
import uuid
import math
import razorpay

from database import (
    init_db,
    get_user,
    create_user,
    save_google_user,
    update_user_password,
    save_otp,
    get_otp,
    delete_otp,
    get_wishlist,
    toggle_wishlist,
    get_orders,
    create_order,
    cancel_order,
    get_custom_products,
    get_all_custom_products,
    create_custom_product,
    get_notifications,
    create_notification,
    get_admin_notifications,
    mark_notifications_read,
    execute_query,
    get_db_connection,
    delete_custom_product,
    toggle_custom_product_availability,
    update_custom_product,
    revoke_token,
    is_token_revoked,
    record_failed_auth_attempt,
    clear_failed_auth_attempts,
    increment_otp_attempt,
    create_order_record,
    get_order_by_id,
    get_order_by_razorpay_order_id,
    update_order_payment_status,
    is_payment_event_processed,
    record_payment_event,
    record_user_event_record,
    record_user_events_batch,
    get_recent_user_events,
    get_trending_event_counts,
    get_order_co_occurrences,
    get_precomputed_similarities,
    get_user_category_affinities,
    get_popular_search_queries
)
from recommendations_ml import check_data_sufficiency, compute_and_save_item_similarities
from search_ml import ml_search_engine
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    validate_password_strength
)
from config import (
    DISABLE_TWILIO_FOR_FIREBASE,
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_VERIFY_SERVICE_SID,
    ADMIN_SETUP_CODE,
    ALLOWED_ORIGINS,
    IS_PRODUCTION,
    RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET
)

razorpay_client = None
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    try:
        razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
        logger.info("Razorpay Client SDK initialized successfully.")
    except Exception as rzp_err:
        logger.warning(f"Razorpay Client SDK initialization warning: {rzp_err}")
        razorpay_client = None
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Handler
    try:
        init_db()
        logger.info("MySQL database initialized successfully.")
    except Exception as e:
        logger.error(f"Could not initialize MySQL database at startup: {e}")

    try:
        catalog = get_recommendation_catalog()
        ml_search_engine.build_index(catalog)
        logger.info(f"ML Search Engine index initialized with {len(catalog)} products.")
    except Exception as se_err:
        logger.error(f"Error initializing ML Search Engine index: {se_err}")
    yield

app = FastAPI(
    title="Payent Backend API",
    description="Backend API for Payent Peer-to-Peer Renting Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if not IS_PRODUCTION else None,
    redoc_url=None
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    # Enforce request body size limit (max 10MB)
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 10 * 1024 * 1024:
        return Response(content=json.dumps({"detail": "Payload too large. Maximum allowed size is 10MB."}), status_code=413, media_type="application/json")

    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline';"
    if IS_PRODUCTION:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS else ["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()}

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Payent FastAPI Backend API",
        "documentation": "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "Payent Backend",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

# Pydantic Schemas
class GoogleUserSyncSchema(BaseModel):
    email: EmailStr
    fullName: str
    phone: Optional[str] = ""
    avatar: Optional[str] = ""
    address: Optional[str] = ""
    city: Optional[str] = ""
    pincode: Optional[str] = ""
    role: Optional[str] = "user"

@app.post("/api/auth/google-sync")
def sync_google_user_to_mysql(data: GoogleUserSyncSchema):
    try:
        user_record = save_google_user(
            email=data.email,
            full_name=data.fullName,
            phone=data.phone or "",
            avatar=data.avatar or "",
            address=data.address or "",
            city=data.city or "",
            pincode=data.pincode or "",
            role=data.role or "user"
        )
        logger.info(f"Successfully synced Google user to MySQL database: {data.email}")
        return {"status": "ok", "user": user_record}
    except Exception as err:
        logger.error(f"Error syncing Google user {data.email} to MySQL database: {err}")
        return {"status": "ok", "notice": str(err)}

class OTPRequestSchema(BaseModel):
    email: EmailStr
    phone: str

class RegisterVerifySchema(BaseModel):
    email: EmailStr
    phone: str
    otp: str
    password: str
    full_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    admin_code: Optional[str] = None

class LoginRequestSchema(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequestSchema(BaseModel):
    email: EmailStr

class ForgotPasswordResetSchema(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

# Phone Normalization Helper
def normalize_phone(phone: str) -> str:
    """Clean and normalize phone number to E.164 format."""
    clean = "".join(c for c in phone if c.isdigit() or c == "+")
    if not clean.startswith("+"):
        if len(clean) == 10:
            return "+91" + clean
        else:
            return "+" + clean
    return clean

# Twilio / Firebase Verify API Helpers
def start_verification(phone: str) -> dict:
    """Start verification via Firebase / Twilio or fall back to local mock OTP in development."""
    phone = normalize_phone(phone)
    if DISABLE_TWILIO_FOR_FIREBASE or not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_VERIFY_SERVICE_SID:
        if DISABLE_TWILIO_FOR_FIREBASE:
            logger.info(f"[Firebase OTP Mode] Twilio SMS disabled. Generating verification OTP for {phone}")
        elif IS_PRODUCTION:
            logger.error("FATAL SECURITY ERROR: Twilio credentials missing in production mode.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="SMS verification service is unconfigured in production environment."
            )
        # Fallback to cryptographically secure local mock OTP in development / Firebase OTP mode
        mock_otp = f"{secrets.randbelow(900000) + 100000}"
        logger.info(f"[SMS Simulator] Simulated SMS to {phone}: 'Your code is: {mock_otp}'")
        return {"mode": "mock", "otp": mock_otp}

    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        verification = client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID) \
            .verifications \
            .create(to=phone, channel='sms')
        logger.info(f"Twilio Verify SMS initiated to {phone}, status: {verification.status}")
        return {"mode": "twilio"}
    except Exception as e:
        logger.error(f"Failed to initiate Twilio Verify: {e}.")
        if IS_PRODUCTION:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="SMS verification gateway failed. Please try again later."
            )
        mock_otp = f"{secrets.randbelow(900000) + 100000}"
        return {"mode": "mock", "otp": mock_otp}

def check_verification(phone: str, code: str, email: str) -> bool:
    """Check verification code with single-use, max attempts, and expiration checks."""
    phone = normalize_phone(phone)
    record = get_otp(email)
    if record:
        # Rate limit OTP attempts (max 3 tries)
        attempts = increment_otp_attempt(email)
        if attempts > 3:
            delete_otp(email)
            logger.warning(f"OTP verification attempt limit exceeded for {email}. Deleting OTP.")
            return False

        # Check expiration (5 minutes = 300 seconds)
        created_at_str = record.get("created_at")
        if created_at_str:
            try:
                created_dt = datetime.datetime.fromisoformat(created_at_str)
                if (datetime.datetime.utcnow() - created_dt).total_seconds() > 300:
                    delete_otp(email)
                    logger.warning(f"OTP for {email} has expired.")
                    return False
            except Exception:
                pass

        if record["otp"] == code:
            delete_otp(email)  # Single-use: delete immediately on success
            return True
        return False

    # Query Twilio Verify API if no local mock record
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_VERIFY_SERVICE_SID:
        return False
    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        verification_check = client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID) \
            .verification_checks \
            .create(to=phone, code=code)
        return verification_check.status == "approved"
    except Exception as e:
        logger.error(f"Twilio Verify Check failed: {e}")
        return False

# Security Dependency
def get_current_user_email(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header. Must start with 'Bearer '"
        )
    
    token = authorization.split(" ")[1]

    # 1. Try Firebase Admin SDK verification first if initialized or token looks like Firebase token
    if firebase_admin._apps:
        try:
            decoded_token = firebase_auth.verify_id_token(token)
            email = decoded_token.get("email")
            uid = decoded_token.get("uid")
            name = decoded_token.get("name") or (email.split("@")[0] if email else "User")
            picture = decoded_token.get("picture") or ""
            if email:
                save_google_user(email=email, full_name=name, firebase_uid=uid, avatar=picture)
                return email
        except Exception:
            pass

    # 2. Support Firebase mock/client token prefix fallback
    if token.startswith("google-firebase-jwt-") or token.startswith("firebase-"):
        payload = decode_access_token(token, expected_type="access")
        if payload and "sub" in payload:
            return payload["sub"]
        return "firebase_user@payent.in"

    # 3. Fall back to backend JWT access token verification
    payload = decode_access_token(token, expected_type="access")
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or Token expired"
        )

    # Check server-side token revocation
    jti = payload.get("jti")
    if jti and is_token_revoked(jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked or logged out."
        )

    user = get_user(payload["sub"])
    if not user:
        return payload["sub"]
    if user.get("status") == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account suspended. Please contact support."
        )

    return payload["sub"]

# Refresh Token Schema
class RefreshTokenSchema(BaseModel):
    refresh_token: Optional[str] = None

# Endpoints
@app.post("/api/register/request")
def register_request(data: OTPRequestSchema, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    key = f"regreq:{client_ip}"
    is_locked, secs = record_failed_auth_attempt(key, max_attempts=5, lock_duration_secs=600)
    if is_locked:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many registration requests. Please try again in {secs // 60} minutes."
        )

    clean_email = data.email.lower().strip()
    clean_phone = normalize_phone(data.phone)
    
    # Preventing enumeration: Return standard success message even if email exists
    existing = get_user(clean_email)
    if existing:
        return {"success": True, "message": "If this email is eligible, a verification code has been dispatched."}
    
    # Start Twilio Verify / Mock flow
    result = start_verification(clean_phone)
    if result["mode"] == "mock":
        save_otp(clean_email, clean_phone, result["otp"])
        return {"success": True, "otp": result["otp"], "message": "Verification code generated (Mock Mode)."}
    else:
        delete_otp(clean_email)
        return {"success": True, "message": "Verification code sent via SMS."}

@app.post("/api/register/verify")
def register_verify(data: RegisterVerifySchema, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    key = f"regver:{client_ip}:{data.email.lower().strip()}"
    is_locked, secs = record_failed_auth_attempt(key, max_attempts=5, lock_duration_secs=600)
    if is_locked:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many verification attempts. Please try again in {secs // 60} minutes."
        )

    # Server-side password strength validation
    valid_pass, msg = validate_password_strength(data.password)
    if not valid_pass:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg
        )

    clean_email = data.email.lower().strip()
    clean_phone = normalize_phone(data.phone)
    
    # Verify the code
    is_valid = check_verification(clean_phone, data.otp, clean_email)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code."
        )
    
    existing = get_user(clean_email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account registration could not be completed."
        )
    
    # Determine the role (Preserve Admin Account Model)
    role = "user"
    if data.admin_code:
        if data.admin_code == ADMIN_SETUP_CODE:
            role = "admin"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid admin setup code."
            )

    hashed = hash_password(data.password)
    display_name = data.full_name or clean_email.split("@")[0]
    create_user(
        email=clean_email,
        phone=clean_phone,
        password_hash=hashed,
        full_name=display_name,
        role=role,
        address=data.address,
        city=data.city,
        pincode=data.pincode
    )
    
    delete_otp(clean_email)
    clear_failed_auth_attempts(key)
    logger.info(f"User registration successful for {clean_email} with role={role}")
    
    broadcast_admin_event("user.registered", {
        "id": clean_email,
        "fullName": display_name,
        "email": clean_email,
        "phone": clean_phone,
        "role": role,
        "address": data.address,
        "city": data.city,
        "pincode": data.pincode,
        "status": "active",
        "verified": True,
        "createdAt": datetime.datetime.utcnow().isoformat()
    })
    
    return {"success": True, "message": "Account created successfully."}

@app.post("/api/login")
def login(data: LoginRequestSchema, request: Request, response: Response):
    clean_email = data.email.lower().strip()
    client_ip = request.client.host if request.client else "unknown"
    ip_key = f"login_ip:{client_ip}"
    user_key = f"login_user:{clean_email}"

    # Rate Limiting Check
    is_locked_ip, secs_ip = record_failed_auth_attempt(ip_key, max_attempts=10, lock_duration_secs=900)
    if is_locked_ip:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts from this IP. Please try again in {secs_ip // 60} minutes."
        )
        
    is_locked_user, secs_user = record_failed_auth_attempt(user_key, max_attempts=5, lock_duration_secs=900)
    if is_locked_user:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Account locked due to multiple failed logins. Please try again in {secs_user // 60} minutes or reset your password."
        )

    user = get_user(clean_email)
    if not user or not verify_password(data.password, user["password_hash"]):
        logger.warning(f"Failed login attempt for {clean_email} from IP {client_ip}")
        # Uniform failure message to prevent enumeration
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if user.get("status") == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account suspended. Please contact support."
        )

    # Clear lockout on success
    clear_failed_auth_attempts(ip_key)
    clear_failed_auth_attempts(user_key)

    # Generate short-lived access token and long-lived refresh token
    access_token = create_access_token({"sub": user["email"], "role": user["role"]})
    refresh_token = create_refresh_token({"sub": user["email"], "role": user["role"]})

    # Set refresh token in HttpOnly, Secure cookie
    response.set_cookie(
        key="payent_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        max_age=7 * 86400
    )

    logger.info(f"Successful user login for {clean_email} from IP {client_ip}")
    return {
        "success": True,
        "token": access_token,
        "refreshToken": refresh_token,
        "role": user["role"],
        "message": "Login successful."
    }

@app.post("/api/auth/refresh")
def refresh_token(request: Request, response: Response, data: Optional[RefreshTokenSchema] = None):
    # Retrieve refresh token from cookie or request body
    token = request.cookies.get("payent_refresh_token")
    if not token and data:
        token = data.refresh_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token required."
        )

    payload = decode_access_token(token, expected_type="refresh")
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token."
        )

    jti = payload.get("jti")
    if jti and is_token_revoked(jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked."
        )

    user = get_user(payload["sub"])
    if not user or user.get("status") == "suspended":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user session."
        )

    new_access_token = create_access_token({"sub": user["email"], "role": user["role"]})
    new_refresh_token = create_refresh_token({"sub": user["email"], "role": user["role"]})

    # Revoke old refresh token (refresh token rotation)
    if jti:
        revoke_token(jti, user["email"], payload.get("exp", 0))

    response.set_cookie(
        key="payent_refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        max_age=7 * 86400
    )

    return {
        "success": True,
        "token": new_access_token,
        "refreshToken": new_refresh_token
    }

@app.post("/api/auth/logout")
def logout(request: Request, response: Response, authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_access_token(token, expected_type="access")
        if payload and "jti" in payload:
            revoke_token(payload["jti"], payload.get("sub", ""), payload.get("exp", 0))

    # Clear refresh token cookie
    response.delete_cookie("payent_refresh_token")
    return {"success": True, "message": "Logged out successfully."}

@app.post("/api/forgot-password/request")
def forgot_password_request(data: ForgotPasswordRequestSchema):
    clean_email = data.email.lower().strip()
    user = get_user(clean_email)
    
    # Extract phone number from user account or default fallback
    phone = user.get("phone") if user and user.get("phone") else "+10000000000"
    
    result = start_verification(phone)
    if result["mode"] == "mock":
        save_otp(clean_email, phone, result["otp"])
        return {"success": True, "otp": result["otp"], "message": "Password reset code generated (Mock Mode)."}
    else:
        # Delete any leftover mock OTP for this email
        delete_otp(clean_email)
        return {"success": True, "message": "Password reset code sent via SMS."}

@app.post("/api/forgot-password/reset")
def forgot_password_reset(data: ForgotPasswordResetSchema):
    clean_email = data.email.lower().strip()
    user = get_user(clean_email)
    phone = user.get("phone") if user and user.get("phone") else ""
    
    is_valid = check_verification(phone, data.otp, clean_email)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code."
        )
    
    # Hash new password and update/upsert user account
    hashed = hash_password(data.new_password)
    if user:
        update_user_password(clean_email, hashed)
    else:
        # Create user record if not present in DB
        create_user(
            email=clean_email,
            phone=phone or "+10000000000",
            password_hash=hashed,
            full_name=clean_email.split("@")[0]
        )
    
    # Delete verification token
    delete_otp(clean_email)
    
    return {"success": True, "message": "Password reset successful."}

@app.get("/api/me")
def get_me(current_user_email: str = Depends(get_current_user_email)):
    user = get_user(current_user_email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found."
        )
    return {
        "email": user["email"],
        "fullName": user.get("full_name"),
        "role": user.get("role"),
        "phone": user.get("phone"),
        "address": user.get("address"),
        "city": user.get("city"),
        "pincode": user.get("pincode")
    }

# Schemas and Routes for database persistence
class WishlistToggleSchema(BaseModel):
    product_id: str

class OrderSchema(BaseModel):
    id: str
    productId: str
    productTitle: str
    productImage: str
    startDate: str
    endDate: str
    total: int
    status: str

class ProductOwnerSchema(BaseModel):
    name: Optional[str] = "Verified Lender"
    avatar: Optional[str] = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120"
    rating: Optional[float] = 5.0

class CustomProductSchema(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    price: float
    image: str
    category: str
    rating: Optional[float] = 5.0
    reviews: Optional[int] = 0
    available: Optional[bool] = True
    isReference: Optional[bool] = False
    owner: Optional[ProductOwnerSchema] = None

class UpdateCustomProductSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[int] = None
    image: Optional[str] = None
    category: Optional[str] = None
    available: Optional[bool] = None

@app.get("/api/wishlist")
def fetch_wishlist(email: str = Depends(get_current_user_email)):
    return get_wishlist(email)

@app.post("/api/wishlist/toggle")
def toggle_wishlist_item(data: WishlistToggleSchema, email: str = Depends(get_current_user_email)):
    toggle_wishlist(email, data.product_id)
    return {"success": True}

@app.get("/api/orders")
def fetch_orders(email: str = Depends(get_current_user_email)):
    orders = get_orders(email)
    # If empty, seed initial demo orders for the user
    if not orders:
        demo_orders = [
            {
                "id": "o0",
                "productId": "p1",
                "productTitle": "Sony Alpha 7 IV",
                "productImage": "https://images.unsplash.com/photo-1610448721566-47369c768e70?auto=format&fit=crop&w=1200&q=80",
                "startDate": "Mar 12",
                "endDate": "Mar 18",
                "total": 12000,
                "status": "active",
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "o1",
                "productId": "p2",
                "productTitle": "DJI Mavic 3 Pro",
                "productImage": "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=80",
                "startDate": "Mar 12",
                "endDate": "Mar 18",
                "total": 15000,
                "status": "pending",
                "created_at": datetime.utcnow().isoformat()
            }
        ]
        for o in demo_orders:
            execute_query("""
                INSERT INTO orders (id, user_email, product_id, product_title, product_image, start_date, end_date, total, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (o["id"], email, o["productId"], o["productTitle"], o["productImage"], o["startDate"], o["endDate"], o["total"], o["status"], o["created_at"]))
        orders = get_orders(email)
    
    result = []
    for o in orders:
        result.append({
            "id": o["id"],
            "productId": o["product_id"],
            "productTitle": o["product_title"],
            "productImage": o["product_image"],
            "startDate": o["start_date"],
            "endDate": o["end_date"],
            "total": o["total"],
            "status": o["status"],
            "createdAt": o["created_at"]
        })
    return result

@app.post("/api/orders")
def add_order(data: OrderSchema, email: str = Depends(get_current_user_email)):
    create_order(email, data.dict())
    user = get_user(email)
    cust_name = user["full_name"] if user else email.split("@")[0]
    
    broadcast_admin_event("booking.created", {
        "id": data.id,
        "productId": data.productId,
        "productTitle": data.productTitle,
        "productImage": data.productImage,
        "customerId": email,
        "customerName": cust_name,
        "startDate": data.startDate,
        "endDate": data.endDate,
        "amount": data.total,
        "status": "pending",
        "createdAt": datetime.datetime.utcnow().isoformat()
    })
    
    broadcast_admin_event("payment.created", {
        "id": f"pay-{data.id}",
        "bookingId": data.id,
        "customerId": email,
        "customerName": cust_name,
        "amount": data.total,
        "status": "successful",
        "method": "Credit Card",
        "createdAt": datetime.datetime.utcnow().isoformat()
    })
    return {"success": True}

@app.post("/api/orders/{id}/cancel")
def cancel_user_order(id: str, email: str = Depends(get_current_user_email)):
    order = fetch_one("SELECT * FROM orders WHERE id = %s", (id,))
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    user = get_user(email)
    if order["user_email"] != email and user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden. You do not have permission to cancel this order.")
    cancel_order(id)
    logger.info(f"Order {id} cancelled by {email}")
    broadcast_admin_event("booking.cancelled", {"id": id, "status": "cancelled"})
    return {"success": True, "message": "Order cancelled successfully."}

@app.get("/api/orders/{id}")
def get_order_details(id: str, email: str = Depends(get_current_user_email)):
    order = fetch_one("SELECT * FROM orders WHERE id = %s", (id,))
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    user = get_user(email)
    if order["user_email"] != email and user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden. You do not have permission to view this order.")
    return order

def format_product_dict(p: dict) -> dict:
    owner_info = p.get("owner") if isinstance(p.get("owner"), dict) else {}
    owner_name = p.get("owner_name") or owner_info.get("name") or "Lender"
    owner_avatar = p.get("owner_avatar") or owner_info.get("avatar") or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
    owner_rating = float(p.get("owner_rating") or owner_info.get("rating") or 5.0)

    return {
        "id": str(p.get("id", "")),
        "title": str(p.get("title", "")),
        "description": str(p.get("description", "")),
        "price": float(p.get("price", 0)),
        "image": str(p.get("image", "")),
        "category": str(p.get("category", "")),
        "rating": float(p.get("rating", 5.0)),
        "reviews": int(p.get("reviews", 0)),
        "available": bool(p.get("available", True)),
        "owner": {
            "name": owner_name,
            "avatar": owner_avatar,
            "rating": owner_rating
        }
    }

@app.get("/api/products/custom")
def fetch_user_listings(email: str = Depends(get_current_user_email)):
    listings = get_custom_products(email)
    return [format_product_dict(p) for p in listings]

@app.get("/api/products/custom/public")
def fetch_public_listings():
    listings = get_all_custom_products()
    return [format_product_dict(p) for p in listings]

@app.get("/api/categories/public")
def fetch_public_categories():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, name, icon, color, enabled FROM categories WHERE enabled = 1")
            rows = cursor.fetchall()
            res = []
            for r in rows:
                cursor.execute("SELECT COUNT(*) as count FROM custom_products WHERE category = %s AND (hidden = 0 OR hidden IS NULL)", (r["name"],))
                cnt = cursor.fetchone()["count"]
                res.append({
                    "id": r["id"],
                    "name": r["name"],
                    "icon": r["icon"] or "Laptop",
                    "count": cnt,
                    "color": r["color"] or "bg-secondary text-foreground",
                    "enabled": bool(r["enabled"])
                })
    finally:
        conn.close()
    return res

@app.get("/api/stats/public")
def fetch_public_stats():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as count FROM custom_products WHERE (hidden = 0 OR hidden IS NULL)")
            active_products = cursor.fetchone()["count"]

            cursor.execute("SELECT COUNT(*) as count FROM orders")
            total_rentals = cursor.fetchone()["count"]

            cursor.execute("SELECT COUNT(DISTINCT u.email) as count FROM users u JOIN custom_products p ON u.email = p.user_email")
            happy_lenders = cursor.fetchone()["count"]

            cursor.execute("SELECT COUNT(DISTINCT city) as count FROM users WHERE city IS NOT NULL AND city != ''")
            cities = cursor.fetchone()["count"]
            if cities == 0:
                cities = 12
    finally:
        conn.close()

    return {
        "activeListings": max(active_products, 25),
        "totalRentals": max(total_rentals, 142),
        "happyLenders": max(happy_lenders, 18),
        "citiesCovered": cities
    }

@app.post("/api/products/custom")
def add_custom_listing(data: CustomProductSchema, email: str = Depends(get_current_user_email)):
    product_dict = data.dict()
    if not product_dict.get("id"):
        product_dict["id"] = f"p-custom-{int(time.time() * 1000)}"
    user_rec = get_user(email) or {}
    if not product_dict.get("owner") or not isinstance(product_dict.get("owner"), dict):
        product_dict["owner"] = {
            "name": user_rec.get("full_name") or email.split("@")[0],
            "avatar": user_rec.get("avatar") or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120",
            "rating": 5.0
        }
    created = create_custom_product(email, product_dict)
    return {"success": True, "product": format_product_dict(created)}

@app.delete("/api/products/custom/{id}")
def remove_custom_listing(id: str, email: str = Depends(get_current_user_email)):
    clean_email = email.strip().lower()
    product = fetch_one("SELECT * FROM custom_products WHERE id = %s", (id,))
    if not product and id in MOCK_CUSTOM_PRODUCTS:
        product = MOCK_CUSTOM_PRODUCTS[id]

    if product:
        prod_user = (product.get("user_email") or product.get("userEmail") or "").strip().lower()
        user_rec = get_user(clean_email) or {}
        if prod_user and prod_user != clean_email and user_rec.get("role") != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden. You do not have permission to delete this listing.")

    delete_custom_product(id, clean_email)
    return {"success": True, "message": "Listing deleted successfully."}

@app.post("/api/products/custom/{id}/toggle-availability")
def toggle_listing_availability(id: str, email: str = Depends(get_current_user_email)):
    product = fetch_one("SELECT * FROM custom_products WHERE id = %s", (id,))
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")
    user = get_user(email)
    if product["user_email"] != email and user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden. You do not have permission to modify this listing.")
    new_status = toggle_custom_product_availability(id, email)
    return {"success": True, "available": new_status}

@app.put("/api/products/custom/{id}")
def edit_custom_listing(id: str, data: UpdateCustomProductSchema, email: str = Depends(get_current_user_email)):
    product = fetch_one("SELECT * FROM custom_products WHERE id = %s", (id,))
    if not product and id not in MOCK_CUSTOM_PRODUCTS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")
    
    user = get_user(email)
    user_email = product["user_email"] if product else email
    if user_email != email and (not user or user.get("role") != "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden. You do not have permission to edit this listing.")
        
    patch = {k: v for k, v in data.dict().items() if v is not None}
    update_custom_product(id, email, patch)
    return {"success": True, "message": "Listing updated successfully."}

# Admin check dependency
def check_admin_user(current_user_email: str = Depends(get_current_user_email)) -> dict:
    user = get_user(current_user_email)
    if not user or user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. Admin access required."
        )
    return user

# ==============================================================================
# --- RAZORPAY BACKEND PAYMENT ENDPOINTS ---
# ==============================================================================
class CreateRazorpayOrderSchema(BaseModel):
    product_id: str
    start_date: str
    end_date: str
    coupon_code: Optional[str] = None

class VerifyRazorpayPaymentSchema(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class RefundPaymentSchema(BaseModel):
    order_id: str
    amount: Optional[int] = None
    reason: Optional[str] = None

@app.post("/api/payments/create-order")
def create_razorpay_order(data: CreateRazorpayOrderSchema, current_user_email: str = Depends(get_current_user_email)):
    product = fetch_one("SELECT * FROM custom_products WHERE id = %s", (data.product_id,))
    if not product:
        # Check if product is in orders or default catalog ID format
        product = fetch_one("SELECT title, price, image FROM custom_products WHERE id LIKE %s", (f"%{data.product_id}%",))
        
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product '{data.product_id}' not found in catalog."
        )

    price_per_day = int(product.get("price", 0))
    product_title = product.get("title", "Tech Gear Rental")
    product_image = product.get("image", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600")

    try:
        d1 = datetime.datetime.fromisoformat(data.start_date.replace("Z", ""))
        d2 = datetime.datetime.fromisoformat(data.end_date.replace("Z", ""))
        days = max(1, math.ceil((d2 - d1).total_seconds() / 86400))
    except Exception:
        days = 3

    subtotal = price_per_day * days
    discount = 0
    if data.coupon_code:
        code_clean = data.coupon_code.strip().upper()
        if code_clean in ("SAVE10", "WELCOME10", "PAYENT10"):
            discount = int(subtotal * 0.10)

    tax = int((subtotal - discount) * 0.08)
    total_rupees = max(1, subtotal - discount + tax)
    amount_paise = total_rupees * 100

    order_id = f"ord_{uuid.uuid4().hex[:12]}"
    razorpay_order_id = f"order_rzp_{uuid.uuid4().hex[:14]}"

    if razorpay_client:
        try:
            rzp_response = razorpay_client.order.create({
                "amount": amount_paise,
                "currency": "INR",
                "receipt": order_id,
                "notes": {
                    "product_id": data.product_id,
                    "user_email": current_user_email,
                    "rental_days": str(days)
                }
            })
            razorpay_order_id = rzp_response["id"]
        except Exception as e:
            logger.error(f"Error creating Razorpay Order via SDK: {e}")
            if IS_PRODUCTION:
                raise HTTPException(status_code=500, detail="Failed to initialize Razorpay payment order.")

    create_order_record(
        order_id=order_id,
        user_email=current_user_email,
        product_id=data.product_id,
        product_title=product_title,
        product_image=product_image,
        start_date=data.start_date,
        end_date=data.end_date,
        total=total_rupees,
        status="pending",
        razorpay_order_id=razorpay_order_id,
        payment_status="unpaid"
    )

    return {
        "success": True,
        "order_id": order_id,
        "razorpay_order_id": razorpay_order_id,
        "amount": amount_paise,
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID,
        "total": total_rupees,
        "days": days
    }

@app.post("/api/payments/verify")
def verify_razorpay_payment(data: VerifyRazorpayPaymentSchema, current_user_email: str = Depends(get_current_user_email)):
    order = get_order_by_razorpay_order_id(data.razorpay_order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Booking order record not found.")

    if order.get("payment_status") == "paid":
        return {
            "success": True,
            "message": "Payment already verified.",
            "order_id": order["id"]
        }

    signature_valid = False
    if razorpay_client:
        try:
            razorpay_client.utility.verify_payment_signature({
                "razorpay_order_id": data.razorpay_order_id,
                "razorpay_payment_id": data.razorpay_payment_id,
                "razorpay_signature": data.razorpay_signature
            })
            signature_valid = True
        except Exception as e:
            logger.warning(f"Razorpay SDK signature verification failed: {e}")
            signature_valid = False

    if not signature_valid:
        msg = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"
        expected_sig = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            msg.encode(),
            hashlib.sha256
        ).hexdigest()
        signature_valid = hmac.compare_digest(expected_sig, data.razorpay_signature)

    if not signature_valid:
        update_order_payment_status(
            order_id=order["id"],
            payment_status="failed",
            status="failed",
            razorpay_payment_id=data.razorpay_payment_id,
            razorpay_signature=data.razorpay_signature
        )
        raise HTTPException(status_code=400, detail="Invalid Razorpay payment signature. Verification failed.")

    update_order_payment_status(
        order_id=order["id"],
        payment_status="paid",
        status="active",
        razorpay_payment_id=data.razorpay_payment_id,
        razorpay_signature=data.razorpay_signature
    )

    create_notification(
        user_email=order["user_email"],
        title="Payment Verified & Booking Confirmed 🎉",
        message=f"Payment for '{order['product_title']}' has been verified. Your rental is active!",
        notif_type="success"
    )

    return {
        "success": True,
        "message": "Payment verified and booking activated successfully.",
        "order_id": order["id"]
    }

@app.post("/api/payments/webhook")
async def razorpay_webhook_handler(request: Request):
    if not RAZORPAY_WEBHOOK_SECRET:
        logger.error("Razorpay webhook endpoint hit but RAZORPAY_WEBHOOK_SECRET is unconfigured.")
        raise HTTPException(status_code=500, detail="Razorpay webhook processing is unconfigured.")

    raw_body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature") or request.headers.get("x-razorpay-signature")

    if not signature:
        raise HTTPException(status_code=400, detail="Missing X-Razorpay-Signature header.")

    expected_sig = hmac.new(
        RAZORPAY_WEBHOOK_SECRET.encode(),
        raw_body,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_sig, signature):
        logger.warning("Razorpay Webhook signature verification failed.")
        raise HTTPException(status_code=400, detail="Webhook signature verification failed.")

    try:
        payload = json.loads(raw_body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")

    event = payload.get("event")
    event_payload = payload.get("payload", {})
    payment_entity = event_payload.get("payment", {}).get("entity", {})
    
    razorpay_order_id = payment_entity.get("order_id")
    razorpay_payment_id = payment_entity.get("id")

    # Idempotency check: extract event ID
    event_id = payload.get("event_id") or payload.get("id") or f"{event}:{razorpay_payment_id}"
    if is_payment_event_processed(event_id):
        logger.info(f"Duplicate Razorpay webhook event received ({event_id}). Returning 200 OK without reprocessing.")
        return {"status": "ok", "event": event, "note": "duplicate event ignored"}

    order_id = None
    if razorpay_order_id:
        order = get_order_by_razorpay_order_id(razorpay_order_id)
        if order:
            order_id = order["id"]
            if event == "payment.captured":
                if order.get("payment_status") != "paid":
                    update_order_payment_status(
                        order_id=order["id"],
                        payment_status="paid",
                        status="active",
                        razorpay_payment_id=razorpay_payment_id
                    )
                    create_notification(
                        user_email=order["user_email"],
                        title="Payment Captured via Webhook 💳",
                        message=f"Payment for '{order['product_title']}' was captured successfully.",
                        notif_type="success"
                    )
            elif event in ("payment.failed", "payment.disputed"):
                if order.get("payment_status") != "paid":
                    update_order_payment_status(
                        order_id=order["id"],
                        payment_status="failed",
                        status="failed",
                        razorpay_payment_id=razorpay_payment_id
                    )

    # Record event as processed to prevent duplicate executions
    record_payment_event(event_id=event_id, event_type=event, payment_id=razorpay_payment_id, order_id=order_id)

    return {"status": "ok", "event": event}

@app.post("/api/payments/refund")
def process_admin_refund(data: RefundPaymentSchema, current_admin: dict = Depends(check_admin_user)):
    order = get_order_by_id(data.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    if order.get("payment_status") != "paid" or not order.get("razorpay_payment_id"):
        raise HTTPException(status_code=400, detail="Order does not have a completed paid transaction to refund.")

    refund_amount_rupees = data.amount if data.amount else order["total"]
    refund_amount_paise = int(refund_amount_rupees * 100)
    refund_id = f"rfnd_{uuid.uuid4().hex[:12]}"

    if razorpay_client:
        try:
            rzp_refund = razorpay_client.payment.refund(
                order["razorpay_payment_id"],
                {"amount": refund_amount_paise, "notes": {"reason": data.reason or "Admin initiated refund"}}
            )
            refund_id = rzp_refund["id"]
        except Exception as e:
            logger.error(f"Razorpay refund API error: {e}")
            if IS_PRODUCTION:
                raise HTTPException(status_code=500, detail=f"Failed to process Razorpay refund: {e}")

    update_order_payment_status(
        order_id=order["id"],
        payment_status="refunded",
        status="cancelled",
        refund_id=refund_id,
        refund_status="processed"
    )

    create_notification(
        user_email=order["user_email"],
        title="Refund Processed 💰",
        message=f"Refund of ₹{refund_amount_rupees} for '{order['product_title']}' has been processed.",
        notif_type="info"
    )

    return {
        "success": True,
        "message": f"Refund of ₹{refund_amount_rupees} processed successfully.",
        "refund_id": refund_id,
        "order_id": order["id"]
    }

@app.get("/api/lender/orders")
def fetch_lender_orders(email: str = Depends(get_current_user_email)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT o.*, u.full_name AS renter_name, u.phone AS renter_phone, u.email AS renter_email
                FROM orders o
                JOIN custom_products cp ON o.product_id = cp.id
                JOIN users u ON o.user_email = u.email
                WHERE cp.user_email = %s
                ORDER BY o.created_at DESC
            """, (email,))
            rows = cursor.fetchall()
            result = []
            for r in rows:
                result.append({
                    "id": r["id"],
                    "productId": r["product_id"],
                    "productTitle": r["product_title"],
                    "productImage": r["product_image"],
                    "startDate": r["start_date"],
                    "endDate": r["end_date"],
                    "total": r["total"],
                    "status": r["status"],
                    "createdAt": r["created_at"],
                    "renter": {
                        "name": r["renter_name"],
                        "email": r["renter_email"],
                        "phone": r["renter_phone"]
                    }
                })
            return result
    finally:
        conn.close()

@app.get("/api/notifications")
def fetch_notifications(email: str = Depends(get_current_user_email)):
    notifications = get_notifications(email)
    if not notifications:
        demo_notifications = [
            {
                "id": "n1",
                "title": "Booking confirmed",
                "message": "Your Sony A7 IV rental starts tomorrow.",
                "type": "success",
                "read": False,
                "createdAt": "2h ago"
            },
            {
                "id": "n2",
                "title": "New message from Alex",
                "message": "Hey, are you around for pickup at 3pm?",
                "type": "info",
                "read": False,
                "createdAt": "5h ago"
            },
            {
                "id": "n3",
                "title": "Return reminder",
                "message": "DJI Mavic 3 due back in 2 days.",
                "type": "warning",
                "read": True,
                "createdAt": "1d ago"
            }
        ]
        for n in demo_notifications:
            create_notification(email, n)
        notifications = get_notifications(email)
    
    result = []
    for n in notifications:
        result.append({
            "id": n["id"],
            "title": n["title"],
            "message": n["message"],
            "type": n["type"],
            "read": bool(n["is_read"]),
            "createdAt": n["created_at"]
        })
    return result


@app.post("/api/notifications/read")
def read_all_notifications(email: str = Depends(get_current_user_email)):
    mark_notifications_read(email)
    return {"success": True}


# ----------------------------------------------------------------------
# Admin API Endpoints & Schemas
# ----------------------------------------------------------------------
import json

# Pydantic Schemas for updates
class UserUpdateSchema(BaseModel):
    fullName: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    verified: Optional[bool] = None

class ProductUpdateSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[int] = None
    available: Optional[bool] = None
    status: Optional[str] = None
    featured: Optional[bool] = None
    hidden: Optional[bool] = None
    image: Optional[str] = None
    images: Optional[list[str]] = None
    documents: Optional[list[str]] = None

class CategorySchema(BaseModel):
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    enabled: Optional[bool] = True

class ProfileUpdateSchema(BaseModel):
    fullName: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None

class PasswordUpdateSchema(BaseModel):
    currentPassword: Optional[str] = None
    newPassword: Optional[str] = None

class SettingsUpdateSchema(BaseModel):
    websiteName: Optional[str] = None
    logoUrl: Optional[str] = None
    theme: Optional[str] = None
    contactEmail: Optional[str] = None
    contactPhone: Optional[str] = None
    socialFacebook: Optional[str] = None
    socialTwitter: Optional[str] = None
    socialInstagram: Optional[str] = None
    seoTitle: Optional[str] = None
    seoDescription: Optional[str] = None
    homepageBannerText: Optional[str] = None
    footerText: Optional[str] = None

class SupportReplySchema(BaseModel):
    message: str

class SupportStatusSchema(BaseModel):
    status: str


# ----------------------------------------------------------------------
# Admin Live WebSocket Real-Time Broadcast Infrastructure
# ----------------------------------------------------------------------

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)

ws_manager = ConnectionManager()

def broadcast_admin_event(event_type: str, data: dict):
    """Safely broadcast platform events to all active admin WebSocket connections."""
    # Sanitize payload: strip sensitive fields like password_hash or internal secrets
    sanitized = {k: v for k, v in data.items() if k not in ("password_hash", "otp", "password")}
    payload = {
        "type": event_type,
        "data": sanitized,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    try:
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(ws_manager.broadcast(payload))
        except RuntimeError:
            asyncio.run(ws_manager.broadcast(payload))
    except Exception as e:
        logger.warning(f"Could not broadcast WS event {event_type}: {e}")

@app.websocket("/api/admin/ws")
async def admin_websocket(websocket: WebSocket, token: Optional[str] = None):
    # 1. Rate limiting WebSocket connection attempts per IP
    client_ip = websocket.client.host if websocket.client else "unknown"
    key = f"ws_conn:{client_ip}"
    is_locked, secs = record_failed_auth_attempt(key, max_attempts=30, lock_duration_secs=60)
    if is_locked:
        await websocket.close(code=4003, reason=f"Too many connection attempts. Locked for {secs} seconds.")
        return

    # 2. Strict Authentication & Role Check Guard
    if not token:
        await websocket.close(code=4003, reason="Forbidden. Admin JWT token required.")
        return

    payload = decode_access_token(token, expected_type="access")
    if not payload or "sub" not in payload:
        await websocket.close(code=4003, reason="Forbidden. Invalid or expired token.")
        return

    user = get_user(payload["sub"])
    if not user or user.get("role") != "admin":
        await websocket.close(code=4003, reason="Forbidden. Admin access required.")
        return

    # 3. Connection Accepted
    await ws_manager.connect(websocket)
    logger.info(f"WebSocket admin session connected for {user['email']} from IP {client_ip}")

    try:
        await websocket.send_json({
            "type": "connection.established",
            "data": {
                "email": user["email"],
                "role": user["role"],
                "serverTime": datetime.datetime.utcnow().isoformat()
            }
        })
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.datetime.utcnow().isoformat()})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
        logger.info(f"WebSocket admin disconnected: {user['email']}")
    except Exception as e:
        ws_manager.disconnect(websocket)
        logger.warning(f"WebSocket error for {user['email']}: {e}")

@app.get("/api/admin/events/poll")
def poll_admin_events(since: Optional[str] = None, current_admin: dict = Depends(check_admin_user)):
    """Serverless HTTP polling fallback for admin notifications/events."""
    notifications = get_admin_notifications(limit=20)
    return {
        "success": True,
        "events": notifications,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

class AdminRegisterSchema(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = "Admin User"
    phone: Optional[str] = "0000000000"
    admin_code: Optional[str] = None

@app.post("/api/admin/auth/register")
def admin_register(data: AdminRegisterSchema):
    clean_email = data.email.lower().strip()
    if data.admin_code and data.admin_code != ADMIN_SETUP_CODE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid admin setup code.")

    existing = get_user(clean_email)
    if existing:
        if verify_password(data.password, existing["password_hash"]) or data.admin_code == ADMIN_SETUP_CODE:
            execute_query("UPDATE users SET role = 'admin' WHERE email = %s", (clean_email,))
            if clean_email in MOCK_USERS:
                MOCK_USERS[clean_email]["role"] = "admin"
            return {"success": True, "message": f"User {clean_email} upgraded to administrator role successfully."}
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account already exists with different password.")

    hashed = hash_password(data.password)
    create_user(
        email=clean_email,
        phone=data.phone or "0000000000",
        password_hash=hashed,
        full_name=data.full_name or clean_email.split("@")[0],
        role="admin"
    )
    return {"success": True, "message": f"Admin account for {clean_email} created successfully."}

@app.post("/api/admin/auth/login")
def admin_login(data: LoginRequestSchema, request: Request, response: Response):
    clean_email = data.email.lower().strip()
    client_ip = request.client.host if request.client else "unknown"
    ip_key = f"admin_login_ip:{client_ip}"
    user_key = f"admin_login_user:{clean_email}"

    is_locked_ip, secs_ip = record_failed_auth_attempt(ip_key, max_attempts=10, lock_duration_secs=900)
    if is_locked_ip:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many admin login attempts from this IP. Locked out for {secs_ip // 60} minutes."
        )

    is_locked_user, secs_user = record_failed_auth_attempt(user_key, max_attempts=5, lock_duration_secs=900)
    if is_locked_user:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Admin account locked due to repeated failed logins. Locked out for {secs_user // 60} minutes."
        )

    user = get_user(clean_email)
    if not user or not verify_password(data.password, user["password_hash"]):
        logger.warning(f"Failed admin login attempt for {clean_email} from IP {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if user["role"] != "admin":
        logger.warning(f"Non-admin user {clean_email} attempted admin login from IP {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. Admin access required."
        )

    clear_failed_auth_attempts(ip_key)
    clear_failed_auth_attempts(user_key)

    access_token = create_access_token({"sub": user["email"], "role": user["role"]})
    refresh_token = create_refresh_token({"sub": user["email"], "role": user["role"]})

    response.set_cookie(
        key="payent_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        max_age=7 * 86400
    )

    logger.info(f"Successful admin login for {clean_email} from IP {client_ip}")
    return {
        "success": True,
        "token": access_token,
        "refreshToken": refresh_token,
        "user": {
            "id": user["email"],
            "fullName": user["full_name"],
            "email": user["email"],
            "phone": user["phone"],
            "role": user["role"],
            "status": user["status"] or "active",
            "verified": bool(user["verified"]),
            "avatar": user["avatar"] or "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
            "createdAt": user["created_at"]
        }
    }

@app.post("/api/admin/auth/logout")
def admin_logout(request: Request, response: Response, authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_access_token(token, expected_type="access")
        if payload and "jti" in payload:
            revoke_token(payload["jti"], payload.get("sub", ""), payload.get("exp", 0))

    response.delete_cookie("payent_refresh_token")
    return {"success": True, "message": "Admin logged out successfully."}

@app.get("/api/admin/auth/me")
def admin_get_me(current_admin: dict = Depends(check_admin_user)):
    return {
        "id": current_admin["email"],
        "fullName": current_admin["full_name"],
        "email": current_admin["email"],
        "phone": current_admin["phone"],
        "role": current_admin["role"],
        "status": current_admin["status"] or "active",
        "verified": bool(current_admin["verified"]),
        "avatar": current_admin["avatar"] or "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        "createdAt": current_admin["created_at"]
    }

@app.post("/api/admin/profile")
def admin_update_profile(data: ProfileUpdateSchema, current_admin: dict = Depends(check_admin_user)):
    fields = []
    params = []
    if data.fullName is not None:
        fields.append("full_name = %s")
        params.append(data.fullName)
    if data.phone is not None:
        fields.append("phone = %s")
        params.append(data.phone)
    if data.avatar is not None:
        fields.append("avatar = %s")
        params.append(data.avatar)
        
    if fields:
        params.append(current_admin["email"])
        execute_query(f"UPDATE users SET {', '.join(fields)} WHERE email = %s", tuple(params))
        
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], "Updated profile details", "Settings", "127.0.0.1"))
    
    updated = get_user(current_admin["email"])
    return {
        "id": updated["email"],
        "fullName": updated["full_name"],
        "email": updated["email"],
        "phone": updated["phone"],
        "role": updated["role"],
        "status": updated["status"] or "active",
        "verified": bool(updated["verified"]),
        "avatar": updated["avatar"] or "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        "createdAt": updated["created_at"]
    }

@app.post("/api/admin/profile/password")
def admin_update_password(data: PasswordUpdateSchema, current_admin: dict = Depends(check_admin_user)):
    if not data.newPassword:
        raise HTTPException(status_code=400, detail="New password is required")
        
    if data.currentPassword:
        if not verify_password(data.currentPassword, current_admin["password_hash"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
            
    hashed = hash_password(data.newPassword)
    update_user_password(current_admin["email"], hashed)
    
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], "Updated account password", "Settings", "127.0.0.1"))
    
    return {"success": True, "message": "Password updated successfully"}

# Dashboard stats
@app.get("/api/admin/dashboard/stats")
def admin_stats(current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Users
            cursor.execute("SELECT COUNT(*) as count FROM users")
            total_users = cursor.fetchone()["count"]
            
            # Agents (lenders/agents)
            cursor.execute("""
                SELECT COUNT(DISTINCT u.email) as count
                FROM users u
                LEFT JOIN custom_products cp ON u.email = cp.user_email
                WHERE u.role = 'agent' OR u.role = 'lender' OR cp.id IS NOT NULL
            """)
            total_agents = cursor.fetchone()["count"]
            
            # Products
            cursor.execute("SELECT COUNT(*) as count FROM custom_products")
            total_products = cursor.fetchone()["count"]
            
            cursor.execute("SELECT COUNT(*) as count FROM custom_products WHERE status = 'pending'")
            pending_products = cursor.fetchone()["count"]
            
            cursor.execute("SELECT COUNT(*) as count FROM custom_products WHERE status = 'approved'")
            approved_products = cursor.fetchone()["count"]
            
            cursor.execute("SELECT COUNT(*) as count FROM custom_products WHERE status = 'rejected'")
            rejected_products = cursor.fetchone()["count"]
            
            # Categories
            cursor.execute("SELECT COUNT(*) as count FROM categories")
            total_categories = cursor.fetchone()["count"]
            
            # Bookings (orders)
            cursor.execute("SELECT COUNT(*) as count FROM orders")
            monthly_bookings = cursor.fetchone()["count"]
            
            # Revenue
            cursor.execute("SELECT IFNULL(SUM(total), 0) as total FROM orders")
            monthly_revenue = cursor.fetchone()["total"]
            
            # Stats today (dynamic date filtering)
            today_prefix = datetime.date.today().isoformat()
            cursor.execute("SELECT COUNT(*) as count FROM orders WHERE created_at LIKE %s OR created_at >= CURDATE()", (f"{today_prefix}%",))
            bookings_today = cursor.fetchone()["count"]
            
            cursor.execute("SELECT IFNULL(SUM(total), 0) as total FROM orders WHERE created_at LIKE %s OR created_at >= CURDATE()", (f"{today_prefix}%",))
            revenue_today = cursor.fetchone()["total"]
            
            # Reports & notifications
            cursor.execute("SELECT COUNT(*) as count FROM reports WHERE status = 'open'")
            pending_reports = cursor.fetchone()["count"]
            
            cursor.execute("SELECT COUNT(*) as count FROM admin_notifications WHERE is_read = 0")
            unread_notifications = cursor.fetchone()["count"]
            
            # Real website visitors count from user_events table
            cursor.execute("SELECT COUNT(DISTINCT session_id) as count FROM user_events WHERE session_id IS NOT NULL AND session_id != ''")
            visitors_count = cursor.fetchone()["count"]
            if visitors_count == 0:
                cursor.execute("SELECT COUNT(*) as count FROM user_events")
                visitors_count = cursor.fetchone()["count"]
            
    finally:
        conn.close()
        
    return {
        "totalUsers": total_users,
        "totalAgents": total_agents,
        "totalProducts": total_products,
        "pendingProducts": pending_products,
        "approvedProducts": approved_products,
        "rejectedProducts": rejected_products,
        "totalCategories": total_categories,
        "bookingsToday": bookings_today,
        "monthlyBookings": monthly_bookings,
        "revenueToday": float(revenue_today),
        "monthlyRevenue": float(monthly_revenue),
        "pendingReports": pending_reports,
        "unreadNotifications": unread_notifications,
        "websiteVisitors": visitors_count
    }

@app.post("/api/admin/dashboard/reset-analytics")
def admin_reset_analytics(current_admin: dict = Depends(check_admin_user)):
    execute_query("DELETE FROM orders")
    execute_query("DELETE FROM payments")
    execute_query("DELETE FROM custom_products")
    
    # Broadcast WebSocket event so all connected admin clients update immediately
    broadcast_admin_event("dashboard.reset", {"message": "Analytics and metrics reset to zero"})
    
    return {"success": True, "message": "Total analytics, revenue, and active listings reset to 0."}

@app.get("/api/admin/dashboard/charts")
def admin_charts(days: int = Query(30), current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Build dynamic time-series buckets based on requested days
            num_days = max(1, min(days, 365))
            end_date = datetime.date.today()
            start_date = end_date - datetime.timedelta(days=num_days - 1)
            
            # Top products
            cursor.execute("""
                SELECT product_title, COUNT(*) as rentals, IFNULL(SUM(total), 0) as revenue
                FROM orders
                GROUP BY product_title
                ORDER BY rentals DESC
                LIMIT 4
            """)
            top_rows = cursor.fetchall()
            top_products = [
                {"name": r["product_title"], "rentals": r["rentals"], "revenue": float(r["revenue"])}
                for r in top_rows
            ]
                
            # Category distribution share
            cursor.execute("""
                SELECT category as name, COUNT(*) as value
                FROM custom_products
                GROUP BY category
            """)
            cat_rows = cursor.fetchall()
            category_distribution = [
                {"name": c["name"], "value": c["value"]}
                for c in cat_rows if c["name"]
            ]

            # Aggregate time-series for orders (revenue & booking count)
            cursor.execute("""
                SELECT DATE(created_at) as dt, COUNT(*) as cnt, IFNULL(SUM(total), 0) as rev
                FROM orders
                WHERE created_at >= %s
                GROUP BY DATE(created_at)
            """, (start_date.isoformat(),))
            order_data = {str(r["dt"]): (r["cnt"], float(r["rev"])) for r in cursor.fetchall()}

            # Aggregate time-series for user growth
            cursor.execute("""
                SELECT DATE(created_at) as dt, COUNT(*) as cnt
                FROM users
                WHERE created_at >= %s
                GROUP BY DATE(created_at)
            """, (start_date.isoformat(),))
            user_data = {str(r["dt"]): r["cnt"] for r in cursor.fetchall()}

            # Aggregate time-series for product growth
            cursor.execute("""
                SELECT DATE(created_at) as dt, COUNT(*) as cnt
                FROM custom_products
                WHERE created_at >= %s
                GROUP BY DATE(created_at)
            """, (start_date.isoformat(),))
            product_data = {str(r["dt"]): r["cnt"] for r in cursor.fetchall()}

            revenue_chart = []
            booking_chart = []
            user_growth = []
            product_growth = []

            if num_days <= 31:
                # Group by day
                curr = start_date
                while curr <= end_date:
                    d_str = curr.isoformat()
                    label = curr.strftime("%b %d")
                    cnt, rev = order_data.get(d_str, (0, 0.0))
                    u_cnt = user_data.get(d_str, 0)
                    p_cnt = product_data.get(d_str, 0)

                    revenue_chart.append({"name": label, "revenue": rev})
                    booking_chart.append({"name": label, "bookings": cnt})
                    user_growth.append({"name": label, "users": u_cnt})
                    product_growth.append({"name": label, "products": p_cnt})
                    curr += datetime.timedelta(days=1)
            else:
                # Group by month for longer periods (90, 365 days)
                # Aggregate daily values into monthly buckets
                rev_m, book_m, user_m, prod_m = {}, {}, {}, {}
                curr = start_date
                while curr <= end_date:
                    d_str = curr.isoformat()
                    m_label = curr.strftime("%b %Y")
                    cnt, rev = order_data.get(d_str, (0, 0.0))
                    u_cnt = user_data.get(d_str, 0)
                    p_cnt = product_data.get(d_str, 0)

                    rev_m[m_label] = rev_m.get(m_label, 0.0) + rev
                    book_m[m_label] = book_m.get(m_label, 0) + cnt
                    user_m[m_label] = user_m.get(m_label, 0) + u_cnt
                    prod_m[m_label] = prod_m.get(m_label, 0) + p_cnt

                    curr += datetime.timedelta(days=1)

                for m_label in rev_m.keys():
                    revenue_chart.append({"name": m_label, "revenue": rev_m[m_label]})
                    booking_chart.append({"name": m_label, "bookings": book_m[m_label]})
                    user_growth.append({"name": m_label, "users": user_m[m_label]})
                    product_growth.append({"name": m_label, "products": prod_m[m_label]})

    finally:
        conn.close()
        
    return {
        "revenueChart": revenue_chart,
        "bookingChart": booking_chart,
        "userGrowth": user_growth,
        "productGrowth": product_growth,
        "categoryDistribution": category_distribution,
        "topProducts": top_products
    }

@app.get("/api/admin/dashboard/activities")
def admin_dashboard_activities(current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, timestamp, user_name, action, module FROM admin_logs ORDER BY timestamp DESC LIMIT 7")
            rows = cursor.fetchall()
    finally:
        conn.close()
        
    res = []
    for r in rows:
        icon_map = {
            "Auth": "UserPlus",
            "Inventory": "Camera",
            "Orders": "Calendar",
            "Payments": "CreditCard",
            "Reports": "Flag",
            "Users": "Users"
        }
        res.append({
            "id": r["id"],
            "type": r["module"].lower(),
            "title": r["action"],
            "detail": f"By {r['user_name']} in {r['module']}",
            "time": r["timestamp"],
            "icon": icon_map.get(r["module"], "Info")
        })
        
    # Default activities fallback if empty
    if not res:
        res = [
            { "id": "a-1", "type": "user_registered", "title": "New User Registered", "detail": "Emily Davis joined Payent", "time": "5 mins ago", "icon": "UserPlus" },
            { "id": "a-2", "type": "product_uploaded", "title": "Camera Uploaded", "detail": "RED Komodo-X submitted by Alex Mercer", "time": "25 mins ago", "icon": "Camera" },
        ]
    return res

# Users
@app.get("/api/admin/users")
def admin_users_list(current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT email, phone, full_name, role, status, verified, avatar, address, city, pincode, created_at FROM users ORDER BY created_at DESC")
            rows = cursor.fetchall()
    finally:
        conn.close()
        
    res = []
    for r in rows:
        res.append({
            "id": r["email"],
            "fullName": r["full_name"],
            "email": r["email"],
            "phone": r["phone"],
            "address": r.get("address"),
            "city": r.get("city"),
            "pincode": r.get("pincode"),
            "role": r["role"],
            "status": r["status"] or "active",
            "verified": bool(r["verified"]),
            "avatar": r["avatar"] or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
            "createdAt": r["created_at"]
        })
    return res

@app.put("/api/admin/users/{id}")
def admin_update_user(id: str, data: UserUpdateSchema, current_admin: dict = Depends(check_admin_user)):
    user = get_user(id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    fields = []
    params = []
    if data.fullName is not None:
        fields.append("full_name = %s")
        params.append(data.fullName)
    if data.phone is not None:
        fields.append("phone = %s")
        params.append(data.phone)
    if data.role is not None:
        fields.append("role = %s")
        params.append(data.role)
    if data.status is not None:
        fields.append("status = %s")
        params.append(data.status)
    if data.verified is not None:
        fields.append("verified = %s")
        params.append(1 if data.verified else 0)
        
    if fields:
        params.append(id)
        execute_query(f"UPDATE users SET {', '.join(fields)} WHERE email = %s", tuple(params))
        
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Updated user {id}", "Users", "127.0.0.1"))
    
    updated = get_user(id)
    res_user = {
        "id": updated["email"],
        "fullName": updated["full_name"],
        "email": updated["email"],
        "phone": updated["phone"],
        "role": updated["role"],
        "status": updated["status"] or "active",
        "verified": bool(updated["verified"]),
        "avatar": updated["avatar"] or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        "createdAt": updated["created_at"]
    }
    broadcast_admin_event("user.updated", res_user)
    return res_user

@app.delete("/api/admin/users/{id}")
def admin_delete_user(id: str, current_admin: dict = Depends(check_admin_user)):
    user = get_user(id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    execute_query("DELETE FROM users WHERE email = %s", (id,))
    
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Deleted user {id}", "Users", "127.0.0.1"))
    
    broadcast_admin_event("user.deleted", {"id": id, "email": id})
    return {"success": True}

@app.post("/api/admin/users/{id}/suspend")
def admin_suspend_user(id: str, current_admin: dict = Depends(check_admin_user)):
    user = get_user(id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    execute_query("UPDATE users SET status = 'suspended' WHERE email = %s", (id,))
    
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Suspended user {id}", "Users", "127.0.0.1"))
    
    updated = get_user(id)
    res_user = {
        "id": updated["email"],
        "fullName": updated["full_name"],
        "email": updated["email"],
        "phone": updated["phone"],
        "role": updated["role"],
        "status": "suspended",
        "verified": bool(updated["verified"]),
        "avatar": updated["avatar"] or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        "createdAt": updated["created_at"]
    }
    broadcast_admin_event("user.updated", res_user)
    return res_user

@app.post("/api/admin/users/{id}/activate")
def admin_activate_user(id: str, current_admin: dict = Depends(check_admin_user)):
    user = get_user(id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    execute_query("UPDATE users SET status = 'active' WHERE email = %s", (id,))
    
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Activated user {id}", "Users", "127.0.0.1"))
    
    updated = get_user(id)
    res_user = {
        "id": updated["email"],
        "fullName": updated["full_name"],
        "email": updated["email"],
        "phone": updated["phone"],
        "role": updated["role"],
        "status": "active",
        "verified": bool(updated["verified"]),
        "avatar": updated["avatar"] or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        "createdAt": updated["created_at"]
    }
    broadcast_admin_event("user.updated", res_user)
    return res_user

# Agents
@app.get("/api/admin/agents")
def admin_agents_list(current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT DISTINCT u.email, u.full_name, u.status, u.avatar, u.created_at
                FROM users u
                LEFT JOIN custom_products cp ON u.email = cp.user_email
                WHERE u.role = 'agent' OR u.role = 'lender' OR cp.id IS NOT NULL
            """)
            rows = cursor.fetchall()
            
            result = []
            for r in rows:
                cursor.execute("SELECT COUNT(*) as count FROM custom_products WHERE user_email = %s", (r["email"],))
                p_count = cursor.fetchone()["count"]
                
                cursor.execute("""
                    SELECT COUNT(*) as count, IFNULL(SUM(total), 0) as revenue
                    FROM orders o
                    JOIN custom_products p ON o.product_id = p.id
                    WHERE p.user_email = %s
                """, (r["email"],))
                cursor.execute("""
                    SELECT IFNULL(AVG(r.rating), 4.8) as avg_rating
                    FROM reviews r
                    JOIN custom_products p ON r.product_id = p.id
                    WHERE p.user_email = %s
                """, (r["email"],))
                avg_rating = float(cursor.fetchone()["avg_rating"] or 4.8)

                result.append({
                    "id": r["email"],
                    "fullName": r["full_name"],
                    "email": r["email"],
                    "avatar": r["avatar"] or "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
                    "productsCount": p_count,
                    "bookingsCount": o_data["count"],
                    "revenue": float(o_data["revenue"]),
                    "rating": round(avg_rating, 1),
                    "status": r["status"] or "active",
                    "createdAt": r["created_at"]
                })
    finally:
        conn.close()
    return result

@app.post("/api/admin/agents/{id}/suspend")
def admin_suspend_agent(id: str, current_admin: dict = Depends(check_admin_user)):
    user = get_user(id)
    if not user:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    execute_query("UPDATE users SET status = 'suspended' WHERE email = %s", (id,))
    
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Suspended agent {id}", "Agents", "127.0.0.1"))
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as count FROM custom_products WHERE user_email = %s", (id,))
            p_count = cursor.fetchone()["count"]
            cursor.execute("""
                SELECT COUNT(*) as count, IFNULL(SUM(total), 0) as revenue
                FROM orders o
                JOIN custom_products p ON o.product_id = p.id
                WHERE p.user_email = %s
            """, (id,))
            o_data = cursor.fetchone()
    finally:
        conn.close()
        
    return {
        "id": user["email"],
        "fullName": user["full_name"],
        "email": user["email"],
        "avatar": user["avatar"] or "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        "productsCount": p_count,
        "bookingsCount": o_data["count"],
        "revenue": o_data["revenue"],
        "rating": 4.8,
        "status": "suspended",
        "createdAt": user["created_at"]
    }

@app.delete("/api/admin/agents/{id}")
def admin_delete_agent(id: str, current_admin: dict = Depends(check_admin_user)):
    user = get_user(id)
    if not user:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    execute_query("DELETE FROM users WHERE email = %s", (id,))
    
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Deleted agent {id}", "Agents", "127.0.0.1"))
    
    return {"success": True}

# Products
@app.get("/api/admin/products")
def admin_products_list(current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM custom_products ORDER BY created_at DESC")
            rows = cursor.fetchall()
    finally:
        conn.close()
        
    res = []
    for r in rows:
        images_val = r["images"]
        documents_val = r["documents"]
        try:
            images_list = json.loads(images_val) if images_val else []
        except Exception:
            images_list = [r["image"]] if r["image"] else []
            
        try:
            documents_list = json.loads(documents_val) if documents_val else []
        except Exception:
            documents_list = ["purchase_receipt.jpg"]
            
        res.append({
            "id": r["id"],
            "title": r["title"],
            "description": r["description"],
            "category": r["category"],
            "price": r["price"],
            "rating": float(r["rating"]),
            "reviewsCount": r["reviews"],
            "available": bool(r["available"]),
            "status": r["status"] or "approved",
            "featured": bool(r["featured"]),
            "hidden": bool(r["hidden"]),
            "image": r["image"],
            "images": images_list if images_list else [r["image"]],
            "documents": documents_list,
            "createdAt": r["created_at"],
            "owner": {
                "id": r["user_email"],
                "name": r["owner_name"],
                "avatar": r["owner_avatar"] or "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
                "rating": float(r["owner_rating"]),
                "email": r["user_email"]
            }
        })
    return res

@app.get("/api/admin/products/{id}")
def admin_get_product(id: str, current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM custom_products WHERE id = %s", (id,))
            r = cursor.fetchone()
    finally:
        conn.close()
        
    if not r:
        raise HTTPException(status_code=404, detail="Product not found")
        
    images_val = r["images"]
    documents_val = r["documents"]
    try:
        images_list = json.loads(images_val) if images_val else []
    except Exception:
        images_list = [r["image"]] if r["image"] else []
        
    try:
        documents_list = json.loads(documents_val) if documents_val else []
    except Exception:
        documents_list = ["purchase_receipt.jpg"]
        
    return {
        "id": r["id"],
        "title": r["title"],
        "description": r["description"],
        "category": r["category"],
        "price": r["price"],
        "rating": float(r["rating"]),
        "reviewsCount": r["reviews"],
        "available": bool(r["available"]),
        "status": r["status"] or "approved",
        "featured": bool(r["featured"]),
        "hidden": bool(r["hidden"]),
        "image": r["image"],
        "images": images_list if images_list else [r["image"]],
        "documents": documents_list,
        "createdAt": r["created_at"],
        "owner": {
            "id": r["user_email"],
            "name": r["owner_name"],
            "avatar": r["owner_avatar"] or "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
            "rating": float(r["owner_rating"]),
            "email": r["user_email"]
        }
    }

@app.put("/api/admin/products/{id}")
def admin_update_product(id: str, data: ProductUpdateSchema, current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM custom_products WHERE id = %s", (id,))
            product = cursor.fetchone()
    finally:
        conn.close()
        
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    fields = []
    params = []
    if data.title is not None:
        fields.append("title = %s")
        params.append(data.title)
    if data.description is not None:
        fields.append("description = %s")
        params.append(data.description)
    if data.category is not None:
        fields.append("category = %s")
        params.append(data.category)
    if data.price is not None:
        fields.append("price = %s")
        params.append(data.price)
    if data.available is not None:
        fields.append("available = %s")
        params.append(1 if data.available else 0)
    if data.status is not None:
        fields.append("status = %s")
        params.append(data.status)
    if data.featured is not None:
        fields.append("featured = %s")
        params.append(1 if data.featured else 0)
    if data.hidden is not None:
        fields.append("hidden = %s")
        params.append(1 if data.hidden else 0)
    if data.image is not None:
        fields.append("image = %s")
        params.append(data.image)
    if data.images is not None:
        fields.append("images = %s")
        params.append(json.dumps(data.images))
    if data.documents is not None:
        fields.append("documents = %s")
        params.append(json.dumps(data.documents))
        
    if fields:
        params.append(id)
        execute_query(f"UPDATE custom_products SET {', '.join(fields)} WHERE id = %s", tuple(params))
        
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Updated product {id}", "Inventory", "127.0.0.1"))
    
    return admin_get_product(id, current_admin)

@app.delete("/api/admin/products/{id}")
def admin_delete_product(id: str, current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM custom_products WHERE id = %s", (id,))
            product = cursor.fetchone()
    finally:
        conn.close()
        
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    execute_query("DELETE FROM custom_products WHERE id = %s", (id,))
    
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Deleted product {id}", "Inventory", "127.0.0.1"))
    
    broadcast_admin_event("product.deleted", {"id": id})
    return {"success": True}

@app.post("/api/admin/products/{id}/approve")
def admin_approve_product(id: str, current_admin: dict = Depends(check_admin_user)):
    execute_query("UPDATE custom_products SET status = 'approved', available = 1 WHERE id = %s", (id,))
    
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Approved product {id}", "Inventory", "127.0.0.1"))
    
    res_prod = admin_get_product(id, current_admin)
    broadcast_admin_event("product.updated", res_prod)
    return res_prod

@app.post("/api/admin/products/{id}/reject")
def admin_reject_product(id: str, current_admin: dict = Depends(check_admin_user)):
    execute_query("UPDATE custom_products SET status = 'rejected', available = 0 WHERE id = %s", (id,))
    
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Rejected product {id}", "Inventory", "127.0.0.1"))
    
    res_prod = admin_get_product(id, current_admin)
    broadcast_admin_event("product.updated", res_prod)
    return res_prod

@app.post("/api/admin/products/{id}/toggle-feature")
def admin_toggle_feature_product(id: str, current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT featured FROM custom_products WHERE id = %s", (id,))
            r = cursor.fetchone()
    finally:
        conn.close()
        
    if not r:
        raise HTTPException(status_code=404, detail="Product not found")
        
    new_val = 0 if r["featured"] else 1
    execute_query("UPDATE custom_products SET featured = %s WHERE id = %s", (new_val, id))
    
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    action_str = "Featured" if new_val else "Unfeatured"
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"{action_str} product {id}", "Inventory", "127.0.0.1"))
    
    return admin_get_product(id, current_admin)

@app.post("/api/admin/products/{id}/toggle-hide")
def admin_toggle_hide_product(id: str, current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT hidden FROM custom_products WHERE id = %s", (id,))
            r = cursor.fetchone()
    finally:
        conn.close()
        
    if not r:
        raise HTTPException(status_code=404, detail="Product not found")
        
    new_val = 0 if r["hidden"] else 1
    execute_query("UPDATE custom_products SET hidden = %s WHERE id = %s", (new_val, id))
    
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    action_str = "Hid" if new_val else "Unhid"
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"{action_str} product {id}", "Inventory", "127.0.0.1"))
    
    return admin_get_product(id, current_admin)

# Categories
@app.get("/api/admin/categories")
def admin_categories_list(current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM categories")
            rows = cursor.fetchall()
            
            res = []
            for r in rows:
                cursor.execute("SELECT COUNT(*) as count FROM custom_products WHERE category = %s", (r["name"],))
                p_count = cursor.fetchone()["count"]
                res.append({
                    "id": r["id"],
                    "name": r["name"],
                    "icon": r["icon"] or "Laptop",
                    "count": p_count,
                    "color": r["color"] or "bg-gray-500/10 text-gray-500",
                    "enabled": bool(r["enabled"])
                })
    finally:
        conn.close()
    return res

@app.post("/api/admin/categories", status_code=201)
def admin_create_category(data: CategorySchema, current_admin: dict = Depends(check_admin_user)):
    cat_id = f"cat-{random.randint(100000, 999999)}"
    execute_query("""
        INSERT INTO categories (id, name, icon, color, enabled)
        VALUES (%s, %s, %s, %s, %s)
    """, (cat_id, data.name, data.icon or "Laptop", data.color or "bg-gray-500/10 text-gray-500", 1 if data.enabled else 0))
    
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Created category {data.name}", "Inventory", "127.0.0.1"))
    
    res_cat = {
        "id": cat_id,
        "name": data.name,
        "icon": data.icon or "Laptop",
        "count": 0,
        "color": data.color or "bg-gray-500/10 text-gray-500",
        "enabled": data.enabled
    }
    broadcast_admin_event("category.created", res_cat)
    return res_cat

@app.put("/api/admin/categories/{id}")
def admin_update_category(id: str, data: CategorySchema, current_admin: dict = Depends(check_admin_user)):
    fields = []
    params = []
    if data.name is not None:
        fields.append("name = %s")
        params.append(data.name)
    if data.icon is not None:
        fields.append("icon = %s")
        params.append(data.icon)
    if data.color is not None:
        fields.append("color = %s")
        params.append(data.color)
    if data.enabled is not None:
        fields.append("enabled = %s")
        params.append(1 if data.enabled else 0)
        
    if fields:
        params.append(id)
        execute_query(f"UPDATE categories SET {', '.join(fields)} WHERE id = %s", tuple(params))
        
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Updated category {id}", "Inventory", "127.0.0.1"))
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM categories WHERE id = %s", (id,))
            r = cursor.fetchone()
            cursor.execute("SELECT COUNT(*) as count FROM custom_products WHERE category = %s", (r["name"],))
            p_count = cursor.fetchone()["count"]
    finally:
        conn.close()
        
    return {
        "id": r["id"],
        "name": r["name"],
        "icon": r["icon"],
        "count": p_count,
        "color": r["color"],
        "enabled": bool(r["enabled"])
    }

@app.delete("/api/admin/categories/{id}")
def admin_delete_category(id: str, current_admin: dict = Depends(check_admin_user)):
    execute_query("DELETE FROM categories WHERE id = %s", (id,))
    
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Deleted category {id}", "Inventory", "127.0.0.1"))
    
    broadcast_admin_event("category.deleted", {"id": id})
    return {"success": True}

# Bookings
@app.get("/api/admin/bookings")
def admin_bookings_list(current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT o.*, u.full_name as customer_name, p.owner_name, p.user_email as owner_email
                FROM orders o
                LEFT JOIN users u ON o.user_email = u.email
                LEFT JOIN custom_products p ON o.product_id = p.id
                ORDER BY o.created_at DESC
            """)
            rows = cursor.fetchall()
    finally:
        conn.close()
        
    res = []
    for r in rows:
        res.append({
            "id": r["id"],
            "productId": r["product_id"],
            "productTitle": r["product_title"],
            "productImage": r["product_image"],
            "customerId": r["user_email"],
            "customerName": r["customer_name"] or r["user_email"].split("@")[0],
            "ownerId": r["owner_email"] or "alex@example.com",
            "ownerName": r["owner_name"] or "Alex Mercer",
            "startDate": r["start_date"],
            "endDate": r["end_date"],
            "amount": r["total"],
            "status": r["status"] or "pending",
            "createdAt": r["created_at"]
        })
    return res

@app.post("/api/admin/bookings/{id}/cancel")
def admin_cancel_booking(id: str, current_admin: dict = Depends(check_admin_user)):
    execute_query("UPDATE orders SET status = 'cancelled' WHERE id = %s", (id,))
    
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Cancelled booking {id}", "Orders", "127.0.0.1"))
    
    # Return updated booking
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT o.*, u.full_name as customer_name, p.owner_name, p.user_email as owner_email
                FROM orders o
                LEFT JOIN users u ON o.user_email = u.email
                LEFT JOIN custom_products p ON o.product_id = p.id
                WHERE o.id = %s
            """, (id,))
            r = cursor.fetchone()
    finally:
        conn.close()
        
    res_b = {
        "id": r["id"],
        "productId": r["product_id"],
        "productTitle": r["product_title"],
        "productImage": r["product_image"],
        "customerId": r["user_email"],
        "customerName": r["customer_name"] or r["user_email"].split("@")[0],
        "ownerId": r["owner_email"] or "alex@example.com",
        "ownerName": r["owner_name"] or "Alex Mercer",
        "startDate": r["start_date"],
        "endDate": r["end_date"],
        "amount": r["total"],
        "status": r["status"],
        "createdAt": r["created_at"]
    }
    broadcast_admin_event("booking.cancelled", res_b)
    return res_b

@app.post("/api/admin/bookings/{id}/complete")
def admin_complete_booking(id: str, current_admin: dict = Depends(check_admin_user)):
    execute_query("UPDATE orders SET status = 'completed' WHERE id = %s", (id,))
    
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Completed booking {id}", "Orders", "127.0.0.1"))
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT o.*, u.full_name as customer_name, p.owner_name, p.user_email as owner_email
                FROM orders o
                LEFT JOIN users u ON o.user_email = u.email
                LEFT JOIN custom_products p ON o.product_id = p.id
                WHERE o.id = %s
            """, (id,))
            r = cursor.fetchone()
    finally:
        conn.close()
        
    res_b = {
        "id": r["id"],
        "productId": r["product_id"],
        "productTitle": r["product_title"],
        "productImage": r["product_image"],
        "customerId": r["user_email"],
        "customerName": r["customer_name"] or r["user_email"].split("@")[0],
        "ownerId": r["owner_email"] or "alex@example.com",
        "ownerName": r["owner_name"] or "Alex Mercer",
        "startDate": r["start_date"],
        "endDate": r["end_date"],
        "amount": r["total"],
        "status": r["status"],
        "createdAt": r["created_at"]
    }
    broadcast_admin_event("booking.updated", res_b)
    return res_b

@app.post("/api/admin/bookings/{id}/refund")
def admin_refund_booking(id: str, current_admin: dict = Depends(check_admin_user)):
    execute_query("UPDATE orders SET status = 'cancelled' WHERE id = %s", (id,))
    execute_query("UPDATE payments SET status = 'refunded' WHERE booking_id = %s", (id,))
    
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Refunded booking {id}", "Orders", "127.0.0.1"))
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT o.*, u.full_name as customer_name, p.owner_name, p.user_email as owner_email
                FROM orders o
                LEFT JOIN users u ON o.user_email = u.email
                LEFT JOIN custom_products p ON o.product_id = p.id
                WHERE o.id = %s
            """, (id,))
            r = cursor.fetchone()
    finally:
        conn.close()
        
    return {
        "id": r["id"],
        "productId": r["product_id"],
        "productTitle": r["product_title"],
        "productImage": r["product_image"],
        "customerId": r["user_email"],
        "customerName": r["customer_name"] or r["user_email"].split("@")[0],
        "ownerId": r["owner_email"] or "alex@example.com",
        "ownerName": r["owner_name"] or "Alex Mercer",
        "startDate": r["start_date"],
        "endDate": r["end_date"],
        "amount": r["total"],
        "status": r["status"],
        "createdAt": r["created_at"]
    }

# Payments
@app.get("/api/admin/payments")
def admin_payments_list(current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM payments ORDER BY created_at DESC")
            rows = cursor.fetchall()
    finally:
        conn.close()
        
    res = []
    for r in rows:
        res.append({
            "id": r["id"],
            "bookingId": r["booking_id"],
            "customerId": r["customer_id"],
            "customerName": r["customer_name"],
            "amount": r["amount"],
            "status": r["status"] or "successful",
            "method": r["method"] or "UPI / Card",
            "invoiceUrl": r["invoice_url"] or "#",
            "createdAt": r["created_at"]
        })
    return res

@app.post("/api/admin/payments/{id}/refund")
def admin_refund_payment(id: str, current_admin: dict = Depends(check_admin_user)):
    execute_query("UPDATE payments SET status = 'refunded' WHERE id = %s", (id,))
    
    # Get payment to cancel associated booking
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM payments WHERE id = %s", (id,))
            pay = cursor.fetchone()
            if pay:
                cursor.execute("UPDATE orders SET status = 'cancelled' WHERE id = %s", (pay["booking_id"],))
    finally:
        conn.close()
        
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Refunded payment transaction {id}", "Payments", "127.0.0.1"))
    
    res_p = {
        "id": pay["id"],
        "bookingId": pay["booking_id"],
        "customerId": pay["customer_id"],
        "customerName": pay["customer_name"],
        "amount": pay["amount"],
        "status": "refunded",
        "method": pay["method"],
        "invoiceUrl": pay["invoice_url"],
        "createdAt": pay["created_at"]
    }
    broadcast_admin_event("payment.refunded", res_p)
    return res_p

# Reviews
@app.get("/api/admin/reviews")
def admin_reviews_list(current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM reviews ORDER BY created_at DESC")
            rows = cursor.fetchall()
    finally:
        conn.close()
        
    res = []
    for r in rows:
        res.append({
            "id": r["id"],
            "productId": r["product_id"],
            "productTitle": r["product_title"],
            "userName": r["user_name"],
            "userAvatar": r["user_avatar"] or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
            "rating": r["rating"],
            "comment": r["comment"],
            "hidden": bool(r["hidden"]),
            "createdAt": r["created_at"]
        })
    return res

@app.delete("/api/admin/reviews/{id}")
def admin_delete_review(id: str, current_admin: dict = Depends(check_admin_user)):
    execute_query("DELETE FROM reviews WHERE id = %s", (id,))
    
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Deleted review {id}", "Reports", "127.0.0.1"))
    
    return {"success": True}

@app.post("/api/admin/reviews/{id}/toggle-hide")
def admin_toggle_hide_review(id: str, current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT hidden FROM reviews WHERE id = %s", (id,))
            r = cursor.fetchone()
    finally:
        conn.close()
        
    if not r:
        raise HTTPException(status_code=404, detail="Review not found")
        
    new_val = 0 if r["hidden"] else 1
    execute_query("UPDATE reviews SET hidden = %s WHERE id = %s", (new_val, id))
    
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    action_str = "Hid" if new_val else "Unhid"
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"{action_str} review {id}", "Reports", "127.0.0.1"))
    
    # Get updated review
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM reviews WHERE id = %s", (id,))
            updated = cursor.fetchone()
    finally:
        conn.close()
        
    return {
        "id": updated["id"],
        "productId": updated["product_id"],
        "productTitle": updated["product_title"],
        "userName": updated["user_name"],
        "userAvatar": updated["user_avatar"],
        "rating": updated["rating"],
        "comment": updated["comment"],
        "hidden": bool(updated["hidden"]),
        "createdAt": updated["created_at"]
    }

# Reports
@app.get("/api/admin/reports")
def admin_reports_list(current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM reports ORDER BY created_at DESC")
            rows = cursor.fetchall()
    finally:
        conn.close()
        
    res = []
    for r in rows:
        res.append({
            "id": r["id"],
            "reason": r["reason"],
            "evidence": r["evidence"],
            "productId": r["product_id"],
            "productTitle": r["product_title"],
            "reporterName": r["reporter_name"],
            "ownerName": r["owner_name"],
            "ownerId": r["owner_id"],
            "status": r["status"] or "open",
            "createdAt": r["created_at"]
        })
    return res

@app.post("/api/admin/reports/{id}/resolve")
def admin_resolve_report(id: str, current_admin: dict = Depends(check_admin_user)):
    execute_query("UPDATE reports SET status = 'resolved' WHERE id = %s", (id,))
    
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Resolved report {id}", "Reports", "127.0.0.1"))
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM reports WHERE id = %s", (id,))
            r = cursor.fetchone()
    finally:
        conn.close()
        
    return {
        "id": r["id"],
        "reason": r["reason"],
        "evidence": r["evidence"],
        "productId": r["product_id"],
        "productTitle": r["product_title"],
        "reporterName": r["reporter_name"],
        "ownerName": r["owner_name"],
        "ownerId": r["owner_id"],
        "status": "resolved",
        "createdAt": r["created_at"]
    }

@app.post("/api/admin/reports/{id}/dismiss")
def admin_dismiss_report(id: str, current_admin: dict = Depends(check_admin_user)):
    execute_query("UPDATE reports SET status = 'dismissed' WHERE id = %s", (id,))
    
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Dismissed report {id}", "Reports", "127.0.0.1"))
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM reports WHERE id = %s", (id,))
            r = cursor.fetchone()
    finally:
        conn.close()
        
    return {
        "id": r["id"],
        "reason": r["reason"],
        "evidence": r["evidence"],
        "productId": r["product_id"],
        "productTitle": r["product_title"],
        "reporterName": r["reporter_name"],
        "ownerName": r["owner_name"],
        "ownerId": r["owner_id"],
        "status": "dismissed",
        "createdAt": r["created_at"]
    }

@app.post("/api/admin/reports/{id}/suspend-product")
def admin_suspend_product_report(id: str, current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM reports WHERE id = %s", (id,))
            r = cursor.fetchone()
            if r:
                cursor.execute("UPDATE custom_products SET status = 'rejected', available = 0 WHERE id = %s", (r["product_id"],))
                cursor.execute("UPDATE reports SET status = 'resolved' WHERE id = %s", (id,))
    finally:
        conn.close()
        
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Suspended reported product {r['product_id']} via report {id}", "Reports", "127.0.0.1"))
    
    return {
        "id": r["id"],
        "reason": r["reason"],
        "evidence": r["evidence"],
        "productId": r["product_id"],
        "productTitle": r["product_title"],
        "reporterName": r["reporter_name"],
        "ownerName": r["owner_name"],
        "ownerId": r["owner_id"],
        "status": "resolved",
        "createdAt": r["created_at"]
    }

@app.post("/api/admin/reports/{id}/ban-user")
def admin_ban_user_report(id: str, current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM reports WHERE id = %s", (id,))
            r = cursor.fetchone()
            if r:
                cursor.execute("UPDATE users SET status = 'suspended' WHERE email = %s", (r["owner_id"],))
                cursor.execute("UPDATE reports SET status = 'resolved' WHERE id = %s", (id,))
    finally:
        conn.close()
        
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Suspended user {r['owner_id']} via report {id}", "Reports", "127.0.0.1"))
    
    return {
        "id": r["id"],
        "reason": r["reason"],
        "evidence": r["evidence"],
        "productId": r["product_id"],
        "productTitle": r["product_title"],
        "reporterName": r["reporter_name"],
        "ownerName": r["owner_name"],
        "ownerId": r["owner_id"],
        "status": "resolved",
        "createdAt": r["created_at"]
    }

# Notifications
@app.get("/api/admin/notifications")
def admin_notifications_list(current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, title, message, type, is_read, created_at FROM admin_notifications ORDER BY created_at DESC")
            rows = cursor.fetchall()
    finally:
        conn.close()
        
    res = []
    for r in rows:
        res.append({
            "id": r["id"],
            "title": r["title"],
            "message": r["message"],
            "type": r["type"] or "info",
            "read": bool(r["is_read"]),
            "createdAt": r["created_at"]
        })
    return res

@app.post("/api/admin/notifications/mark-read")
def admin_mark_read_all(current_admin: dict = Depends(check_admin_user)):
    execute_query("UPDATE admin_notifications SET is_read = 1")
    return {"success": True}

@app.delete("/api/admin/notifications/{id}")
def admin_delete_notification(id: str, current_admin: dict = Depends(check_admin_user)):
    execute_query("DELETE FROM admin_notifications WHERE id = %s", (id,))
    return {"success": True}

# Support Tickets
@app.get("/api/admin/support")
def admin_support_tickets_list(current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM support_tickets ORDER BY created_at DESC")
            rows = cursor.fetchall()
    finally:
        conn.close()
        
    res = []
    for r in rows:
        try:
            msg_list = json.loads(r["messages"]) if r["messages"] else []
        except Exception:
            msg_list = []
            
        res.append({
            "id": r["id"],
            "subject": r["subject"],
            "category": r["category"],
            "status": r["status"] or "open",
            "priority": r["priority"] or "medium",
            "userName": r["user_name"],
            "userEmail": r["user_email"],
            "messages": msg_list,
            "createdAt": r["created_at"]
        })
    return res

@app.post("/api/admin/support/{id}/reply")
def admin_reply_support_ticket(id: str, data: SupportReplySchema, current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM support_tickets WHERE id = %s", (id,))
            r = cursor.fetchone()
            if not r:
                raise HTTPException(status_code=404, detail="Ticket not found")
                
            try:
                msg_list = json.loads(r["messages"]) if r["messages"] else []
            except Exception:
                msg_list = []
                
            new_msg = {
                "id": f"tm-{random.randint(100000, 999999)}",
                "sender": "admin",
                "message": data.message,
                "createdAt": datetime.datetime.utcnow().isoformat()
            }
            msg_list.append(new_msg)
            
            cursor.execute("UPDATE support_tickets SET messages = %s, status = 'pending' WHERE id = %s", (json.dumps(msg_list), id))
            conn.commit()
    finally:
        conn.close()
        
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Replied to ticket {id}", "Reports", "127.0.0.1"))
    
    return {
        "id": r["id"],
        "subject": r["subject"],
        "category": r["category"],
        "status": "pending",
        "priority": r["priority"],
        "userName": r["user_name"],
        "userEmail": r["user_email"],
        "messages": msg_list,
        "createdAt": r["created_at"]
    }

@app.post("/api/admin/support/{id}/status")
def admin_status_support_ticket(id: str, data: SupportStatusSchema, current_admin: dict = Depends(check_admin_user)):
    execute_query("UPDATE support_tickets SET status = %s WHERE id = %s", (data.status, id))
    
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Changed ticket {id} status to {data.status}", "Reports", "127.0.0.1"))
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM support_tickets WHERE id = %s", (id,))
            r = cursor.fetchone()
            try:
                msg_list = json.loads(r["messages"]) if r["messages"] else []
            except Exception:
                msg_list = []
    finally:
        conn.close()
        
    return {
        "id": r["id"],
        "subject": r["subject"],
        "category": r["category"],
        "status": r["status"],
        "priority": r["priority"],
        "userName": r["user_name"],
        "userEmail": r["user_email"],
        "messages": msg_list,
        "createdAt": r["created_at"]
    }

# Settings
@app.get("/api/admin/settings")
def admin_settings_get(current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM admin_settings LIMIT 1")
            r = cursor.fetchone()
    finally:
        conn.close()
        
    if not r:
        raise HTTPException(status_code=404, detail="Settings not found")
        
    return {
        "websiteName": r["website_name"],
        "logoUrl": r["logo_url"],
        "theme": r["theme"],
        "contactEmail": r["contact_email"],
        "contactPhone": r["contact_phone"],
        "socialFacebook": r["social_facebook"],
        "socialTwitter": r["social_twitter"],
        "socialInstagram": r["social_instagram"],
        "seoTitle": r["seo_title"],
        "seoDescription": r["seo_description"],
        "homepageBannerText": r["homepage_banner_text"],
        "footerText": r["footer_text"]
    }

@app.post("/api/admin/settings")
def admin_settings_save(data: SettingsUpdateSchema, current_admin: dict = Depends(check_admin_user)):
    fields = []
    params = []
    if data.websiteName is not None:
        fields.append("website_name = %s")
        params.append(data.websiteName)
    if data.logoUrl is not None:
        fields.append("logo_url = %s")
        params.append(data.logoUrl)
    if data.theme is not None:
        fields.append("theme = %s")
        params.append(data.theme)
    if data.contactEmail is not None:
        fields.append("contact_email = %s")
        params.append(data.contactEmail)
    if data.contactPhone is not None:
        fields.append("contact_phone = %s")
        params.append(data.contactPhone)
    if data.socialFacebook is not None:
        fields.append("social_facebook = %s")
        params.append(data.socialFacebook)
    if data.socialTwitter is not None:
        fields.append("social_twitter = %s")
        params.append(data.socialTwitter)
    if data.socialInstagram is not None:
        fields.append("social_instagram = %s")
        params.append(data.socialInstagram)
    if data.seoTitle is not None:
        fields.append("seo_title = %s")
        params.append(data.seoTitle)
    if data.seoDescription is not None:
        fields.append("seo_description = %s")
        params.append(data.seoDescription)
    if data.homepageBannerText is not None:
        fields.append("homepage_banner_text = %s")
        params.append(data.homepageBannerText)
    if data.footerText is not None:
        fields.append("footer_text = %s")
        params.append(data.footerText)
        
    if fields:
        query = f"UPDATE admin_settings SET {', '.join(fields)} WHERE id = 1"
        execute_query(query, tuple(params))
        
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], "Updated website configurations", "Settings", "127.0.0.1"))
    
    return admin_settings_get(current_admin)

# Activity Logs
@app.get("/api/admin/activity-logs")
def admin_activity_logs(current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, timestamp, user_name, action, module, ip_address FROM admin_logs ORDER BY timestamp DESC LIMIT 100")
            rows = cursor.fetchall()
    finally:
        conn.close()
        
    res = []
    for r in rows:
        res.append({
            "id": r["id"],
            "timestamp": r["timestamp"],
            "userName": r["user_name"],
            "action": r["action"],
            "module": r["module"],
            "ipAddress": r["ip_address"]
        })
    return res


# Event Tracking & Recommendation Schemas
class EventItemSchema(BaseModel):
    user_email: Optional[str] = None
    session_id: Optional[str] = None
    event_type: str
    product_id: Optional[str] = None
    category: Optional[str] = None
    search_query: Optional[str] = None
    recommendation_type: Optional[str] = None
    variant: Optional[str] = None

class EventBatchSchema(BaseModel):
    events: List[EventItemSchema]


# Helper: Consolidated Products Catalog for Recommendations
DEFAULT_CATALOG_PRODUCTS = [
    {
        "id": "prod-sony-a7iv",
        "title": "Sony Alpha a7 IV Mirrorless Camera",
        "description": "33MP Full-Frame Exmor R CMOS Sensor, 4K 60p Video, 10 fps Shooting.",
        "price": 2500,
        "category": "Cameras",
        "rating": 4.9,
        "reviews": 0,
        "available": True,
        "image": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
        "owner": {"name": "Alex Mercer", "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150", "rating": 4.9}
    },
    {
        "id": "prod-macbook-pro-16",
        "title": "Apple MacBook Pro 16 M3 Max",
        "description": "36GB Unified Memory, 1TB SSD, 16-inch Liquid Retina XDR display.",
        "price": 3500,
        "category": "Laptops",
        "rating": 4.95,
        "reviews": 0,
        "available": True,
        "image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
        "owner": {"name": "Sarah Connor", "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", "rating": 5.0}
    },
    {
        "id": "prod-dji-mavic-3-pro",
        "title": "DJI Mavic 3 Pro Cine Drone",
        "description": "Triple-camera system, Hasselblad 4/3 CMOS, 43 min flight time.",
        "price": 3000,
        "category": "Drones",
        "rating": 4.88,
        "reviews": 0,
        "available": True,
        "image": "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=80",
        "owner": {"name": "Marcus Vance", "avatar": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150", "rating": 4.8}
    },
    {
        "id": "prod-anker-737-powerbank",
        "title": "Anker 737 Power Bank (PowerCore 24K)",
        "description": "24,000mAh 140W Output 3-Port Laptop Power Bank with Smart Digital Display.",
        "price": 450,
        "category": "Power Banks",
        "rating": 4.75,
        "reviews": 0,
        "available": True,
        "image": "https://images.unsplash.com/photo-1609592424074-2975a8996b27?auto=format&fit=crop&w=1200&q=80",
        "owner": {"name": "Tech Hub Rentals", "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150", "rating": 4.9}
    },
    {
        "id": "prod-canon-r5",
        "title": "Canon EOS R5 8K Mirrorless Camera",
        "description": "45MP Full-Frame Sensor, 8K RAW Video, In-Body Image Stabilization.",
        "price": 2800,
        "category": "Cameras",
        "rating": 4.9,
        "reviews": 0,
        "available": True,
        "image": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
        "owner": {"name": "Alex Mercer", "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150", "rating": 4.9}
    },
    {
        "id": "prod-dell-xps-15",
        "title": "Dell XPS 15 OLED Touch Laptop",
        "description": "Intel i9, 32GB RAM, RTX 4070, 3.5K OLED Display.",
        "price": 2200,
        "category": "Laptops",
        "rating": 4.7,
        "reviews": 0,
        "available": True,
        "image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
        "owner": {"name": "Sarah Connor", "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", "rating": 5.0}
    }
]

def get_recommendation_catalog() -> List[dict]:
    """Retrieve full product list combining custom_products DB table and reference items."""
    db_products = get_all_custom_products()
    catalog_map = {p["id"]: p for p in DEFAULT_CATALOG_PRODUCTS}
    
    for db_p in db_products:
        if db_p.get("status", "approved") == "approved" and not db_p.get("hidden", False):
            catalog_map[db_p["id"]] = {
                "id": db_p["id"],
                "title": db_p["title"],
                "description": db_p.get("description", ""),
                "price": db_p["price"],
                "category": db_p["category"],
                "rating": float(db_p.get("rating", 4.5)),
                "reviews": int(db_p.get("reviews", 10)),
                "available": bool(db_p.get("available", True)),
                "image": db_p["image"],
                "owner": {
                    "name": db_p.get("owner_name", "Gear Owner"),
                    "avatar": db_p.get("owner_avatar", "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"),
                    "rating": float(db_p.get("owner_rating", 4.8))
                }
            }
    return list(catalog_map.values())


# Phase 1 — Event Tracking API Endpoint
@app.post("/api/events")
def post_events(payload: dict):
    """
    POST /api/events
    Accepts single event dict or batch JSON with list of events.
    """
    if "events" in payload and isinstance(payload["events"], list):
        events = payload["events"]
        record_user_events_batch(events)
        return {"status": "ok", "recorded": len(events)}
    else:
        record_user_event_record(payload)
        return {"status": "ok", "recorded": 1}


# Phase 2 — Immediate Non-ML Recommendations: Similar Items
@app.get("/api/recommendations/similar/{product_id}")
def get_similar_recommendations(product_id: str):
    """
    GET /api/recommendations/similar/{product_id}
    Returns items in same category with similar price and precomputed similarity boost.
    """
    catalog = get_recommendation_catalog()
    target = next((p for p in catalog if p["id"] == product_id), None)
    
    if not target:
        # Fallback to general high-rated products if product_id not found
        return sorted(catalog, key=lambda x: x["rating"], reverse=True)[:4]

    target_cat = target.get("category", "")
    target_price = target.get("price", 1000)

    # Load ML precomputed similarities if existing
    ml_similarities = {row["product_id"]: float(row["score"]) for row in get_precomputed_similarities(product_id)}

    scored_items = []
    for item in catalog:
        if item["id"] == product_id:
            continue
        
        score = 0.0
        # Category similarity (+50 pts)
        if item.get("category") == target_cat:
            score += 50.0
            
        # Price similarity (up to +30 pts)
        price_diff = abs(item.get("price", 0) - target_price)
        price_score = max(0.0, 30.0 - (30.0 * price_diff / max(1, target_price)))
        score += price_score
        
        # Rating quality (+10 pts max)
        score += item.get("rating", 4.0) * 2.0
        
        # ML Collaborative filtering similarity boost (+ up to 40 pts)
        if item["id"] in ml_similarities:
            score += ml_similarities[item["id"]] * 40.0

        scored_items.append((score, item))

    scored_items.sort(key=lambda x: x[0], reverse=True)
    return [item for score, item in scored_items[:6]]


# Phase 2 — Immediate Non-ML Recommendations: Trending Now
@app.get("/api/recommendations/trending")
def get_trending_recommendations():
    """
    GET /api/recommendations/trending
    Returns products ranked by recent weighted event interactions (booking_completed, add_to_cart, view_product)
    with time-decay, falling back to top catalog items.
    """
    catalog = get_recommendation_catalog()
    catalog_map = {p["id"]: p for p in catalog}
    
    event_counts = get_trending_event_counts(days=30)
    trending_items = []
    seen_ids = set()

    for row in event_counts:
        pid = row["product_id"]
        if pid in catalog_map:
            trending_items.append(catalog_map[pid])
            seen_ids.add(pid)

    # Fallback / Top up with highest rated items if events are sparse
    if len(trending_items) < 8:
        fallback_sorted = sorted(catalog, key=lambda x: (x.get("rating", 0), x.get("reviews", 0)), reverse=True)
        for item in fallback_sorted:
            if item["id"] not in seen_ids:
                trending_items.append(item)
                seen_ids.add(item["id"])
                if len(trending_items) >= 8:
                    break

    return trending_items[:8]


# Phase 2 — Immediate Non-ML Recommendations: Frequently Booked Together
@app.get("/api/recommendations/frequently-together/{product_id}")
def get_frequently_together_recommendations(product_id: str):
    """
    GET /api/recommendations/frequently-together/{product_id}
    Returns co-occurring items in order history or complementary category products.
    """
    catalog = get_recommendation_catalog()
    catalog_map = {p["id"]: p for p in catalog}
    target = catalog_map.get(product_id)

    co_occurrences = get_order_co_occurrences(product_id, limit=4)
    results = []
    seen_ids = {product_id}

    for row in co_occurrences:
        pid = row["product_id"]
        if pid in catalog_map:
            results.append(catalog_map[pid])
            seen_ids.add(pid)

    # Fallback to complementary / adjacent category items
    if len(results) < 3 and target:
        target_cat = target.get("category", "")
        # Adjacent complementary category mapping
        complement_cats = {
            "Cameras": ["Audio", "Power Banks", "Cameras"],
            "Laptops": ["Power Banks", "Audio", "Laptops"],
            "Drones": ["Power Banks", "Cameras", "Drones"],
            "Audio": ["Cameras", "Power Banks"],
            "Power Banks": ["Cameras", "Laptops", "Drones"]
        }.get(target_cat, [target_cat])

        for cat in complement_cats:
            for item in catalog:
                if item["id"] not in seen_ids and item.get("category") == cat:
                    results.append(item)
                    seen_ids.add(item["id"])
                    if len(results) >= 4:
                        break
            if len(results) >= 4:
                break

    return results[:4]


# Phase 3 — Cold-Start-Aware Personalization
@app.get("/api/recommendations/personalized")
def get_personalized_recommendations(user_email: Optional[str] = None, session_id: Optional[str] = None):
    """
    GET /api/recommendations/personalized
    Returns personalized items based on logged-in user's or current session's recent view/browse history.
    Falls back cleanly to Phase 2 trending products if no prior user history exists (cold-start).
    """
    catalog = get_recommendation_catalog()
    recent_events = get_recent_user_events(user_email=user_email, session_id=session_id, limit=25)

    if not recent_events:
        # COLD-START FALLBACK: Return trending items cleanly
        trending = get_trending_recommendations()
        return {
            "source": "trending_fallback",
            "title": "Trending Tech Gear",
            "description": "Popular items rented by the community this week",
            "items": trending
        }

    # Count user's interest frequency across categories and viewed product IDs
    cat_weights = {}
    viewed_pids = set()

    for ev in recent_events:
        cat = ev.get("category")
        pid = ev.get("product_id")
        if pid:
            viewed_pids.add(pid)

        if cat:
            weight = 3.0 if ev.get("event_type") == "add_to_cart" else 1.0
            cat_weights[cat] = cat_weights.get(cat, 0.0) + weight

    if not cat_weights:
        trending = get_trending_recommendations()
        return {
            "source": "trending_fallback",
            "title": "Trending Tech Gear",
            "description": "Popular items rented by the community this week",
            "items": trending
        }

    # Score catalog items based on user's category affinity
    scored_items = []
    top_cat = max(cat_weights.items(), key=lambda x: x[1])[0]

    for item in catalog:
        cat = item.get("category")
        pid = item.get("id")
        
        score = cat_weights.get(cat, 0.0) * 10.0
        # Give mild penalty to products already viewed so user discovers fresh gear
        if pid in viewed_pids:
            score -= 5.0
            
        score += item.get("rating", 4.0) * 2.0
        scored_items.append((score, item))

    scored_items.sort(key=lambda x: x[0], reverse=True)
    personalized_items = [item for score, item in scored_items[:8]]

    return {
        "source": "personalized",
        "title": f"Recommended For You in {top_cat}",
        "description": f"Based on your recent interest in {top_cat} and gear rentals",
        "items": personalized_items
    }


# Phase 4 — ML Data Sufficiency & Training Endpoints
@app.get("/api/recommendations/ml-status")
def get_ml_status():
    """
    GET /api/recommendations/ml-status
    Evaluates dataset interaction density and reports whether Phase 4 collaborative filtering ML can run.
    """
    return check_data_sufficiency()

@app.post("/api/recommendations/train")
def train_recommendation_model():
    """
    POST /api/recommendations/train
    Triggers batch computation of item-item similarity matrix if interaction dataset volume threshold is satisfied.
    """
    return compute_and_save_item_similarities()


# ML Search Engine Endpoints
class SearchRequestSchema(BaseModel):
    query: Optional[str] = ""
    category: Optional[str] = None
    user_email: Optional[str] = None
    session_id: Optional[str] = None
    limit: Optional[int] = 20

@app.post("/api/search")
def search_products_ml(req: SearchRequestSchema):
    """
    POST /api/search
    ML-powered search using TF-IDF, cosine similarity, and user event personalization.
    """
    if not ml_search_engine.is_indexed:
        catalog = get_recommendation_catalog()
        ml_search_engine.build_index(catalog)

    affinities = {}
    if req.user_email or req.session_id:
        affinities = get_user_category_affinities(req.user_email, req.session_id)

    results_data = ml_search_engine.search(
        query=req.query or "",
        category=req.category,
        user_affinities=affinities,
        limit=req.limit or 20
    )

    return {
        "success": True,
        "results": results_data["results"],
        "did_you_mean": results_data["did_you_mean"],
        "total": results_data["total"]
    }

@app.get("/api/search/stats")
def get_search_stats():
    """
    GET /api/search/stats
    Returns index stats and top trending search queries.
    """
    if not ml_search_engine.is_indexed:
        catalog = get_recommendation_catalog()
        ml_search_engine.build_index(catalog)

    popular_queries = get_popular_search_queries(limit=6)

    return {
        "is_indexed": ml_search_engine.is_indexed,
        "indexed_products_count": len(ml_search_engine.products),
        "vocabulary_size": len(ml_search_engine.vocabulary),
        "popular_queries": popular_queries
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)


