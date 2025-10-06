#!/usr/bin/env python3
"""
Create a test admin user for InsPecPro
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, User, UserRole
from auth import get_password_hash

def create_admin_user():
    """Create a test admin user"""
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if admin user already exists
        existing_admin = db.query(User).filter(User.username == "admin").first()
        
        if existing_admin:
            print("✅ Admin user already exists!")
            print(f"   Username: admin")
            print(f"   Email: {existing_admin.email}")
            print(f"   Role: {existing_admin.role.value}")
            return
        
        # Create admin user
        admin_user = User(
            user_id="ADM001",
            username="admin",
            email="admin@inspecpro.com",
            password_hash=get_password_hash("admin123"),
            role=UserRole.admin,
            plant="Plant A",
            line_process="Line 1"
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("🎉 Admin user created successfully!")
        print(f"   Username: admin")
        print(f"   Password: admin123")
        print(f"   Email: admin@inspecpro.com")
        print(f"   Role: {admin_user.role.value}")
        print(f"   User ID: {admin_user.user_id}")
        print("\n🔗 You can now login at: http://localhost:3000/login")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
