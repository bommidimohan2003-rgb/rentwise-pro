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
    delete_otp
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
