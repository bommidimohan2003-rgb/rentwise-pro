import datetime
import random
from typing import Optional
from dotenv import load_dotenv

# Load env variables at application startup
load_dotenv()

from fastapi import FastAPI, HTTPException, Header, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

from database import (
    init_db,
    get_user,
    create_user,
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
    mark_notifications_read,
    execute_query,
    get_db_connection,
    delete_custom_product,
    toggle_custom_product_availability
)
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)
from config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Handler
    init_db()
    print("MySQL database initialized successfully.")
    yield

app = FastAPI(
    title="Payent Backend API",
    description="Backend API for Payent Peer-to-Peer Renting Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
class OTPRequestSchema(BaseModel):
    email: EmailStr
    phone: str

class RegisterVerifySchema(BaseModel):
    email: EmailStr
    phone: str
    otp: str
    password: str
    full_name: Optional[str] = None

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

# Twilio Verify API Helpers
def start_verification(phone: str) -> dict:
    """Start verification via Twilio Verify API or fall back to local mock OTP."""
    phone = normalize_phone(phone)
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_VERIFY_SERVICE_SID:
        # Fallback to local mock OTP
        mock_otp = f"{random.randint(100000, 999999)}"
        print(f"\n[Twilio Simulator] Credentials not configured. Simulated SMS to {phone}: 'Your code is: {mock_otp}'\n")
        return {"mode": "mock", "otp": mock_otp}
    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        verification = client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID) \
            .verifications \
            .create(to=phone, channel='sms')
        print(f"Twilio Verify SMS initiated to {phone}, status: {verification.status}")
        return {"mode": "twilio"}
    except Exception as e:
        print(f"Failed to initiate Twilio Verify: {e}. Falling back to mock.")
        mock_otp = f"{random.randint(100000, 999999)}"
        return {"mode": "mock", "otp": mock_otp}

def check_verification(phone: str, code: str, email: str) -> bool:
    """Check verification code against Twilio Verify or local mock database."""
    phone = normalize_phone(phone)
    # First check if there is a local mock OTP in the database
    record = get_otp(email)
    if record:
        return record["otp"] == code

    # If no local mock OTP, query the Twilio Verify API
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_VERIFY_SERVICE_SID:
        return False
    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        verification_check = client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID) \
            .verification_checks \
            .create(to=phone, code=code)
        print(f"Twilio Verify Check for {phone}: {verification_check.status}")
        return verification_check.status == "approved"
    except Exception as e:
        print(f"Twilio Verify Check failed: {e}")
        return False

# Security Dependency
def get_current_user_email(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header. Must start with 'Bearer '"
        )
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials / Token expired"
        )
    return payload["sub"]

# Endpoints
@app.post("/api/register/request")
def register_request(data: OTPRequestSchema):
    # Check if user already exists
    existing = get_user(data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered."
        )
    
    # Start Twilio Verify / Mock flow
    result = start_verification(data.phone)
    if result["mode"] == "mock":
        save_otp(data.email, normalize_phone(data.phone), result["otp"])
        return {"success": True, "otp": result["otp"], "message": "Verification code generated (Mock Mode)."}
    else:
        # Delete any leftover mock OTP for this email
        delete_otp(data.email)
        return {"success": True, "message": "Verification code sent via SMS."}

@app.post("/api/register/verify")
def register_verify(data: RegisterVerifySchema):
    # Verify the code
    is_valid = check_verification(data.phone, data.otp, data.email)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code."
        )
    
    # Check if user already exists (double-check)
    existing = get_user(data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered."
        )
    
    # Register the user
    hashed = hash_password(data.password)
    display_name = data.full_name or data.email.split("@")[0]
    create_user(
        email=data.email,
        phone=normalize_phone(data.phone),
        password_hash=hashed,
        full_name=display_name,
        role="user"
    )
    
    # Clean up local OTP database entry
    delete_otp(data.email)
    
    return {"success": True, "message": "Account created successfully."}

@app.post("/api/login")
def login(data: LoginRequestSchema):
    user = get_user(data.email)
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    
    # Generate token
    token = create_access_token({"sub": user["email"], "role": user["role"]})
    return {
        "success": True,
        "token": token,
        "role": user["role"],
        "message": "Login successful."
    }

@app.post("/api/forgot-password/request")
def forgot_password_request(data: ForgotPasswordRequestSchema):
    # Validate that user exists
    user = get_user(data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account associated with this email address."
        )
    
    phone = user["phone"] or ""
    result = start_verification(phone)
    if result["mode"] == "mock":
        save_otp(data.email, phone, result["otp"])
        return {"success": True, "otp": result["otp"], "message": "Password reset code generated (Mock Mode)."}
    else:
        # Delete any leftover mock OTP for this email
        delete_otp(data.email)
        return {"success": True, "message": "Password reset code sent via SMS."}

@app.post("/api/forgot-password/reset")
def forgot_password_reset(data: ForgotPasswordResetSchema):
    # Get user to verify their phone number
    user = get_user(data.email)
    phone = user["phone"] if user else ""
    
    is_valid = check_verification(phone, data.otp, data.email)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code."
        )
    
    # Hash new password and update
    hashed = hash_password(data.new_password)
    update_user_password(data.email, hashed)
    
    # Delete verification token
    delete_otp(data.email)
    
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
        "fullName": user["full_name"],
        "role": user["role"]
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
    name: str
    avatar: str
    rating: Optional[float] = 5.0

class CustomProductSchema(BaseModel):
    id: str
    title: str
    description: str
    price: int
    image: str
    category: str
    rating: Optional[float] = 5.0
    reviews: Optional[int] = 0
    available: Optional[bool] = True
    owner: ProductOwnerSchema

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
    return {"success": True}

@app.post("/api/orders/{id}/cancel")
def cancel_user_order(id: str, email: str = Depends(get_current_user_email)):
    cancel_order(id)
    return {"success": True}

@app.get("/api/products/custom")
def fetch_user_listings(email: str = Depends(get_current_user_email)):
    listings = get_custom_products(email)
    result = []
    for p in listings:
        result.append({
            "id": p["id"],
            "title": p["title"],
            "description": p["description"],
            "price": p["price"],
            "image": p["image"],
            "category": p["category"],
            "rating": float(p["rating"]),
            "reviews": p["reviews"],
            "available": bool(p["available"]),
            "owner": {
                "name": p["owner_name"],
                "avatar": p["owner_avatar"],
                "rating": float(p["owner_rating"])
            }
        })
    return result

@app.get("/api/products/custom/public")
def fetch_public_listings():
    listings = get_all_custom_products()
    result = []
    for p in listings:
        result.append({
            "id": p["id"],
            "title": p["title"],
            "description": p["description"],
            "price": p["price"],
            "image": p["image"],
            "category": p["category"],
            "rating": float(p["rating"]),
            "reviews": p["reviews"],
            "available": bool(p["available"]),
            "owner": {
                "name": p["owner_name"],
                "avatar": p["owner_avatar"],
                "rating": float(p["owner_rating"])
            }
        })
    return result

@app.post("/api/products/custom")
def add_custom_listing(data: CustomProductSchema, email: str = Depends(get_current_user_email)):
    create_custom_product(email, data.dict())
    return {"success": True}

@app.delete("/api/products/custom/{id}")
def remove_custom_listing(id: str, email: str = Depends(get_current_user_email)):
    delete_custom_product(id, email)
    return {"success": True}

@app.post("/api/products/custom/{id}/toggle-availability")
def toggle_listing_availability(id: str, email: str = Depends(get_current_user_email)):
    new_status = toggle_custom_product_availability(id, email)
    if new_status is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found or you are not the owner."
        )
    return {"success": True, "available": new_status}

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

# Admin check dependency
def check_admin_user(current_user_email: str = Depends(get_current_user_email)) -> dict:
    user = get_user(current_user_email)
    if not user or user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. Admin access required."
        )
    return user

@app.post("/api/admin/auth/login")
def admin_login(data: LoginRequestSchema):
    user = get_user(data.email)
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    if user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. Only admin users can log in to the admin portal."
        )
    
    token = create_access_token({"sub": user["email"], "role": user["role"]})
    return {
        "success": True,
        "token": token,
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
def admin_logout():
    return {"success": True}

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
            
            # Stats today
            cursor.execute("SELECT COUNT(*) as count FROM orders WHERE created_at LIKE '2026-07-18%' OR created_at LIKE '2026-07-17%'")
            bookings_today = cursor.fetchone()["count"]
            
            cursor.execute("SELECT IFNULL(SUM(total), 0) as total FROM orders WHERE created_at LIKE '2026-07-18%' OR created_at LIKE '2026-07-17%'")
            revenue_today = cursor.fetchone()["total"]
            
            # Reports & notifications
            cursor.execute("SELECT COUNT(*) as count FROM reports WHERE status = 'open'")
            pending_reports = cursor.fetchone()["count"]
            
            cursor.execute("SELECT COUNT(*) as count FROM admin_notifications WHERE is_read = 0")
            unread_notifications = cursor.fetchone()["count"]
            
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
        "revenueToday": revenue_today,
        "monthlyRevenue": monthly_revenue,
        "pendingReports": pending_reports,
        "unreadNotifications": unread_notifications,
        "websiteVisitors": 15420
    }

@app.get("/api/admin/dashboard/charts")
def admin_charts(current_admin: dict = Depends(check_admin_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT IFNULL(SUM(total), 0) as total FROM orders")
            total_rev = cursor.fetchone()["total"]
            cursor.execute("SELECT COUNT(*) as count FROM orders")
            total_bookings = cursor.fetchone()["count"]
            cursor.execute("SELECT COUNT(*) as count FROM users")
            total_users = cursor.fetchone()["count"]
            cursor.execute("SELECT COUNT(*) as count FROM custom_products")
            total_products = cursor.fetchone()["count"]
            
            # Top products
            cursor.execute("""
                SELECT product_title, COUNT(*) as rentals, SUM(total) as revenue
                FROM orders
                GROUP BY product_title
                ORDER BY rentals DESC
                LIMIT 4
            """)
            rows = cursor.fetchall()
            top_products = []
            for r in rows:
                top_products.append({
                    "name": r["product_title"],
                    "rentals": r["rentals"],
                    "revenue": r["revenue"]
                })
                
            # If empty, default values
            if not top_products:
                top_products = [
                    { "name": "Sony FX3 Cinema Camera", "rentals": 42, "revenue": 5040 },
                    { "name": "DJI Inspire 3 Drone", "rentals": 28, "revenue": 9800 },
                    { "name": "MacBook Pro 16\" M3 Max", "rentals": 19, "revenue": 1805 },
                ]
    finally:
        conn.close()
        
    return {
        "revenueChart": [
            { "name": "Jan", "revenue": 4200 },
            { "name": "Feb", "revenue": 5800 },
            { "name": "Mar", "revenue": 6100 },
            { "name": "Apr", "revenue": 8400 },
            { "name": "May", "revenue": 9900 },
            { "name": "Jun", "revenue": 12500 },
            { "name": "Jul", "revenue": 14000 + int(total_rev) },
        ],
        "bookingChart": [
            { "name": "Jan", "bookings": 18 },
            { "name": "Feb", "bookings": 25 },
            { "name": "Mar", "bookings": 29 },
            { "name": "Apr", "bookings": 42 },
            { "name": "May", "bookings": 51 },
            { "name": "Jun", "bookings": 68 },
            { "name": "Jul", "bookings": 70 + int(total_bookings) },
        ],
        "userGrowth": [
            { "name": "Jan", "users": 120 },
            { "name": "Feb", "users": 160 },
            { "name": "Mar", "users": 210 },
            { "name": "Apr", "users": 320 },
            { "name": "May", "users": 440 },
            { "name": "Jun", "users": 510 },
            { "name": "Jul", "users": 640 + int(total_users) },
        ],
        "productGrowth": [
            { "name": "Jan", "products": 45 },
            { "name": "Feb", "products": 60 },
            { "name": "Mar", "products": 80 },
            { "name": "Apr", "products": 120 },
            { "name": "May", "products": 170 },
            { "name": "Jun", "products": 220 },
            { "name": "Jul", "products": 270 + int(total_products) },
        ],
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
            cursor.execute("SELECT email, phone, full_name, role, status, verified, avatar, created_at FROM users ORDER BY created_at DESC")
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
    return {
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
    return {
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
    return {
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
                o_data = cursor.fetchone()
                
                result.append({
                    "id": r["email"],
                    "fullName": r["full_name"],
                    "email": r["email"],
                    "avatar": r["avatar"] or "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
                    "productsCount": p_count,
                    "bookingsCount": o_data["count"],
                    "revenue": o_data["revenue"],
                    "rating": 4.8,
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
    
    return admin_get_product(id, current_admin)

@app.post("/api/admin/products/{id}/reject")
def admin_reject_product(id: str, current_admin: dict = Depends(check_admin_user)):
    execute_query("UPDATE custom_products SET status = 'rejected', available = 0 WHERE id = %s", (id,))
    
    # Log action
    now_str = datetime.datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO admin_logs (id, timestamp, user_name, action, module, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (f"l-{random.randint(100000, 999999)}", now_str, current_admin["full_name"], f"Rejected product {id}", "Inventory", "127.0.0.1"))
    
    return admin_get_product(id, current_admin)

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
    
    return {
        "id": cat_id,
        "name": data.name,
        "icon": data.icon or "Laptop",
        "count": 0,
        "color": data.color or "bg-gray-500/10 text-gray-500",
        "enabled": data.enabled
    }

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
    
    return {
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
