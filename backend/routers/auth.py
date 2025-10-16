from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import os
from slowapi import Limiter
from slowapi.util import get_remote_address

from database import get_db
from models import User, PasswordReset
from schemas import LoginRequest, Token, UserCreate, UserResponse, PasswordResetRequest, PasswordResetConfirm
from auth import verify_password, get_password_hash, create_access_token, get_current_user
from utils.logging_config import get_logger, log_auth_event, log_security_event
from utils.email_service import get_email_service, is_email_configured

router = APIRouter(tags=["authentication"])
logger = get_logger(__name__)

# Rate limiter for authentication endpoints
limiter = Limiter(key_func=get_remote_address)

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "inspecpro-secret-key-2024-development-only")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(User).filter(
        (User.username == user.username) | 
        (User.email == user.email) | 
        (User.user_id == user.user_id)
    ).first()
    
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username, email, or user ID already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        user_id=user.user_id,
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        role=user.role,
        plant=user.plant,
        line_process=user.line_process
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.post("/login", response_model=Token)
@limiter.limit("5/minute")  # Allow 5 login attempts per minute per IP
async def login(request: Request, login_data: LoginRequest, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    
    # Find user by username or email
    user = db.query(User).filter(
        (User.username == login_data.username_or_email) | 
        (User.email == login_data.username_or_email)
    ).first()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        log_auth_event("LOGIN", login_data.username_or_email, False, client_ip)
        log_security_event("failed_login_attempt", f"Invalid credentials for {login_data.username_or_email}", ip_address=client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        log_auth_event("LOGIN", login_data.username_or_email, False, client_ip)
        log_security_event("inactive_user_login_attempt", f"Inactive user {login_data.username_or_email} attempted login", user_id=user.id, ip_address=client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # Log successful login
    log_auth_event("LOGIN", user.username, True, client_ip)
    logger.info(f"User {user.username} (ID: {user.id}) logged in successfully from {client_ip}")
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/forgot-password")
@limiter.limit("3/hour")  # Allow 3 password reset requests per hour per IP
async def forgot_password(request_obj: Request, request: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Don't reveal if email exists or not
        return {"message": "If the email exists, a reset link has been sent"}
    
    # Generate reset token
    reset_token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(hours=1)
    
    # Save reset token to database
    db_reset = PasswordReset(
        email=request.email,
        token=reset_token,
        expires_at=expires_at
    )
    db.add(db_reset)
    db.commit()
    
    # Send email (simplified - in production use proper email service)
    try:
        send_reset_email(request.email, reset_token)
        log_security_event("password_reset_email_sent", {"email": request.email})
    except Exception as e:
        logger.error(f"Failed to send password reset email to {request.email}: {e}")
        log_security_event("password_reset_email_failed", {"email": request.email, "error": str(e)})
    
    return {"message": "If the email exists, a reset link has been sent"}

@router.post("/reset-password")
@limiter.limit("10/hour")  # Allow 10 password reset attempts per hour per IP
async def reset_password(request_obj: Request, request: PasswordResetConfirm, db: Session = Depends(get_db)):
    # Find valid reset token
    reset_record = db.query(PasswordReset).filter(
        PasswordReset.token == request.token,
        PasswordReset.used == False,
        PasswordReset.expires_at > datetime.utcnow()
    ).first()
    
    if not reset_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Find user and update password
    user = db.query(User).filter(User.email == reset_record.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password
    user.password_hash = get_password_hash(request.new_password)
    reset_record.used = True
    
    db.commit()
    
    return {"message": "Password reset successfully"}

def send_reset_email(email: str, token: str):
    """Send password reset email using the email service"""
    try:
        # Check if email is configured
        if not is_email_configured():
            logger.error("Email service not configured - cannot send password reset email")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Email service is not available"
            )
        
        # Get user name for personalization (optional)
        user_name = None
        try:
            from database import get_db
            db = next(get_db())
            user = db.query(User).filter(User.email == email).first()
            if user:
                user_name = user.full_name or user.username
        except Exception:
            pass  # Continue without user name if lookup fails
        
        # Send password reset email
        email_service = get_email_service()
        success = email_service.send_password_reset_email(email, token, user_name)
        
        if not success:
            logger.error(f"Failed to send password reset email to {email}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to send password reset email"
            )
        
        logger.info(f"Password reset email sent successfully to {email}")
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"Error sending password reset email to {email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to send password reset email"
        )
