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

app = FastAPI(
    title="Payent Backend API",
    description="Backend API for Payent Peer-to-Peer Renting Platform",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Handler
@app.on_event("startup")
def startup_event():
    init_db()
    print("MySQL database initialized successfully.")

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

# Twilio Verify API Helpers
def start_verification(phone: str) -> dict:
    """Start verification via Twilio Verify API or fall back to local mock OTP."""
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
        save_otp(data.email, data.phone, result["otp"])
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
        phone=data.phone,
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
