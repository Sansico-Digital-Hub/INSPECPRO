#!/usr/bin/env python3
"""
Script to reset passwords for existing users to known passwords
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import SessionLocal
from models import User
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def reset_user_passwords():
    """Reset passwords for existing users to known passwords"""
    
    # Create database session
    db: Session = SessionLocal()
    
    try:
        print("🔑 Resetting passwords for existing users...")
        
        # Get all active users
        active_users = db.query(User).filter(User.is_active == True).all()
        
        if not active_users:
            print("❌ No active users found!")
            return
        
        print(f"\n📋 Found {len(active_users)} active users:")
        
        # Define new passwords for each user
        password_map = {
            "admin": "admin123",
            "inspector1": "inspector123", 
            "supervisor1": "supervisor123",
            "manager1": "manager123",
            "supervisor2": "supervisor123",
            "inspector2": "inspector123"
        }
        
        updated_count = 0
        for user in active_users:
            # Use mapped password or default password
            new_password = password_map.get(user.username, f"{user.username}123")
            
            # Hash the new password
            hashed_password = hash_password(new_password)
            
            # Update user password
            user.password_hash = hashed_password
            updated_count += 1
            
            print(f"✅ Reset password for: {user.username}")
            print(f"   New password: {new_password}")
            print(f"   Role: {user.role.value}")
            print()
        
        if updated_count > 0:
            db.commit()
            print(f"🎉 Successfully reset passwords for {updated_count} users!")
        
        # Show login credentials
        print(f"\n🔑 Login credentials:")
        print("┌─────────────────┬─────────────────┬─────────────────┐")
        print("│ Username        │ Password        │ Role            │")
        print("├─────────────────┼─────────────────┼─────────────────┤")
        for user in active_users:
            password = password_map.get(user.username, f"{user.username}123")
            print(f"│ {user.username:<15} │ {password:<15} │ {user.role.value:<15} │")
        print("└─────────────────┴─────────────────┴─────────────────┘")
        
        print(f"\n💡 You can now login using any of the above credentials!")
        
    except Exception as e:
        print(f"❌ Error resetting passwords: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    reset_user_passwords()