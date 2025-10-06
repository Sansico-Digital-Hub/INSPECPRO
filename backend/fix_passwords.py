#!/usr/bin/env python3
"""
Fix user passwords in MySQL database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User
from auth import get_password_hash

def fix_passwords():
    print("=" * 60)
    print("Fixing User Passwords in MySQL")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Define users with their correct passwords
        users_passwords = {
            "admin": "admin123",
            "inspector1": "inspector123",
            "supervisor1": "supervisor123",
            "manager1": "manager123"
        }
        
        for username, password in users_passwords.items():
            user = db.query(User).filter(User.username == username).first()
            if user:
                # Generate new password hash
                new_hash = get_password_hash(password)
                user.password_hash = new_hash
                print(f"✓ Updated password for: {username}")
                print(f"  Password: {password}")
            else:
                print(f"✗ User not found: {username}")
        
        db.commit()
        print("\n" + "=" * 60)
        print("✓ All passwords updated successfully!")
        print("=" * 60)
        print("\nYou can now login with:")
        print("  Username: admin")
        print("  Password: admin123")
        print("\nOr:")
        print("  Username: inspector1")
        print("  Password: inspector123")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()
    
    return True

if __name__ == "__main__":
    success = fix_passwords()
    sys.exit(0 if success else 1)
