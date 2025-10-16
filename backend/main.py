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

# Rate limiter configuration
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="InsPecPro API",
    description="Quality Assurance Inspection Management System",
    version="1.0.0"
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware - Environment-based configuration for security
# Development origins
dev_origins = [
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001"
]

# Production origins - Replace with your actual domain
prod_origins = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
    "https://inspecpro.yourdomain.com"
]

# Use environment variable to determine allowed origins
environment = os.getenv("ENVIRONMENT", "development")
allowed_origins = prod_origins if environment == "production" else dev_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # No more wildcard "*" - Security Fix
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Specific methods instead of "*"
    allow_headers=["Authorization", "Content-Type", "Accept"],  # Specific headers instead of "*"
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
    return {"message": "InsPecPro API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
