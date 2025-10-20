#!/usr/bin/env python3
"""
Sample Data Creation Script for InsPecPro
Creates default users for testing and initial setup
"""

import sys
import os
from sqlalchemy.orm import Session
from passlib.context import CryptContext

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
from models import Base, User, UserRole

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def create_sample_users():
    """Create sample users for testing"""
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create database session
    db: Session = SessionLocal()
    
    try:
        # Check if admin user already exists
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if existing_admin:
            print("✅ Admin user already exists")
            return
        
        # Sample users data
        sample_users = [
            {
                "user_id": "ADM001",
                "username": "admin",
                "email": "admin@inspecpro.com",
                "password": "admin123",
                "role": UserRole.admin,
                "plant": "Main Plant",
                "line_process": "All Lines"
            },
            {
                "user_id": "INS001",
                "username": "inspector1",
                "email": "inspector1@inspecpro.com",
                "password": "inspector123",
                "role": UserRole.user,
                "plant": "Plant A",
                "line_process": "Line 1"
            },
            {
                "user_id": "SUP001",
                "username": "supervisor1",
                "email": "supervisor1@inspecpro.com",
                "password": "supervisor123",
                "role": UserRole.supervisor,
                "plant": "Plant A",
                "line_process": "All Lines"
            },
            {
                "user_id": "MGT001",
                "username": "manager1",
                "email": "manager1@inspecpro.com",
                "password": "manager123",
                "role": UserRole.management,
                "plant": "All Plants",
                "line_process": "All Lines"
            }
        ]
        
        print("🚀 Creating sample users...")
        
        for user_data in sample_users:
            # Check if user already exists
            existing_user = db.query(User).filter(
                (User.username == user_data["username"]) | 
                (User.email == user_data["email"]) |
                (User.user_id == user_data["user_id"])
            ).first()
            
            if existing_user:
                print(f"⚠️  User {user_data['username']} already exists, skipping...")
                continue
            
            # Create new user
            new_user = User(
                user_id=user_data["user_id"],
                username=user_data["username"],
                email=user_data["email"],
                password_hash=hash_password(user_data["password"]),
                role=user_data["role"],
                plant=user_data["plant"],
                line_process=user_data["line_process"],
                is_active=True
            )
            
            db.add(new_user)
            print(f"✅ Created user: {user_data['username']} ({user_data['role'].value})")
        
        # Commit all changes
        db.commit()
        print("\n🎉 Sample data creation completed successfully!")
        print("\n📋 Default User Accounts:")
        print("┌─────────────┬─────────────────────────────┬─────────────────┬─────────────┐")
        print("│ Role        │ Email                       │ Username        │ Password    │")
        print("├─────────────┼─────────────────────────────┼─────────────────┼─────────────┤")
        print("│ Admin       │ admin@inspecpro.com         │ admin           │ admin123    │")
        print("│ Inspector   │ inspector1@inspecpro.com    │ inspector1      │ inspector123│")
        print("│ Supervisor  │ supervisor1@inspecpro.com   │ supervisor1     │ supervisor123│")
        print("│ Management  │ manager1@inspecpro.com      │ manager1        │ manager123  │")
        print("└─────────────┴─────────────────────────────┴─────────────────┴─────────────┘")
        print("\n🔐 You can now login with any of these accounts!")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🔧 InsPecPro Sample Data Creator")
    print("=" * 40)
    create_sample_users()