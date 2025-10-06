#!/usr/bin/env python3
"""
Test login functionality
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User
from auth import verify_password

def test_login():
    print("=" * 60)
    print("Testing Login Credentials")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Test credentials
        test_users = [
            ("admin", "admin123"),
            ("inspector1", "inspector123"),
            ("supervisor1", "supervisor123"),
            ("manager1", "manager123")
        ]
        
        all_passed = True
        
        for username, password in test_users:
            user = db.query(User).filter(User.username == username).first()
            
            if not user:
                print(f"✗ User not found: {username}")
                all_passed = False
                continue
            
            # Verify password
            is_valid = verify_password(password, user.password_hash)
            
            if is_valid:
                print(f"✓ {username:15} - Password: {password:15} - Role: {user.role.value}")
            else:
                print(f"✗ {username:15} - Password verification FAILED")
                all_passed = False
        
        print("\n" + "=" * 60)
        if all_passed:
            print("✓ ALL LOGIN TESTS PASSED!")
            print("=" * 60)
            print("\nYou can now login to the application with:")
            print("  Username: admin")
            print("  Password: admin123")
        else:
            print("✗ SOME TESTS FAILED")
            print("=" * 60)
        
        return all_passed
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_login()
    sys.exit(0 if success else 1)
