from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
import uvicorn
import os
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from database import get_db, engine, Base
from routers import auth, users, forms, inspections, dashboard, doc_number
from models import User
from utils.logging_config import setup_logging, get_logger

# Initialize logging system
setup_logging()
logger = get_logger()

# Create tables
Base.metadata.create_all(bind=engine)
logger.info("Database tables created/verified")

# Initialize database constraints for subform validation
try:
    from database_constraints import create_database_constraint
    create_database_constraint()
    logger.info("Database constraints for subform validation initialized")
except Exception as e:
    logger.warning(f"Failed to initialize database constraints: {e}")
    logger.warning("Subform validation constraints will not be enforced")

# Rate limiter configuration
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Sanalyze API",
    description="Quality Assurance Inspection Management System",
    version="1.0.0"
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware - Environment-based configuration for security
# Get CORS origins from environment variables
environment = os.getenv("ENVIRONMENT", "development")

if environment == "production":
    cors_origins_str = os.getenv("CORS_PROD_ORIGINS")
else:
    cors_origins_str = os.getenv("CORS_DEV_ORIGINS")

# Check if CORS origins are configured
if not cors_origins_str:
    logger.error(f"CORS origins not configured for environment: {environment}")
    logger.error("Please set CORS_PROD_ORIGINS or CORS_DEV_ORIGINS in your .env file")
    allowed_origins = []
else:
    # Convert comma-separated string to list and filter out empty strings
    allowed_origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # No more wildcard "*" - Security Fix
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # Added PATCH method
    allow_headers=["*"],  # Allow all headers for development
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(forms.router, prefix="/api/forms", tags=["Forms"])
app.include_router(inspections.router, prefix="/api/inspections", tags=["Inspections"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(doc_number.router, prefix="/api/doc-numbers", tags=["Document Numbers"])

@app.get("/")
async def root():
    return {"message": "Sanalyze API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8004, reload=True)
