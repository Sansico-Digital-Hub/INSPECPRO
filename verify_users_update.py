#!/usr/bin/env python3
"""
Script to verify that the 'users' table has been properly updated with hashed passwords
"""

import sys
import os

# Add backend directory to path to import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/backend')

from sqlalchemy import create_engine, text
from passlib.context import CryptContext
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

# Use same password context as backend
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def main():
    """Verify users table update"""
    try:
        DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:Databaseya789@localhost:3306/inspecpro")
        engine = create_engine(DATABASE_URL)
        
        print("🔍 Verifying 'users' table update...")
        print("=" * 50)
        
        with engine.connect() as connection:
            # Check current state
            result = connection.execute(text("""
                SELECT id, username, password, password_hash, role 
                FROM users 
                ORDER BY id
            """))
            users = result.fetchall()
            
            print(f"📊 Found {len(users)} users in 'users' table:")
            print()
            
            for user in users:
                user_id, username, password, password_hash, role = user
                
                print(f"👤 User ID: {user_id}")
                print(f"   Username: {username}")
                print(f"   Role: {role}")
                print(f"   Plain Password: {'❌ STILL EXISTS' if password else '✅ CLEARED'}")
                print(f"   Password Hash: {'✅ EXISTS' if password_hash else '❌ MISSING'}")
                
                # Test password verification if hash exists
                if password_hash:
                    # Try common passwords for testing
                    test_passwords = ['admin123', 'password123', 'user123']
                    verified = False
                    
                    for test_pass in test_passwords:
                        if verify_password(test_pass, password_hash):
                            print(f"   🔐 Password Verification: ✅ PASS (password: {test_pass})")
                            verified = True
                            break
                    
                    if not verified:
                        print(f"   🔐 Password Verification: ❓ UNKNOWN (hash exists but test passwords failed)")
                else:
                    print(f"   🔐 Password Verification: ❌ NO HASH")
                
                print()
            
            # Summary
            users_with_hash = sum(1 for user in users if user[3])  # password_hash column
            users_with_plain = sum(1 for user in users if user[2])  # password column
            
            print("📋 Summary:")
            print(f"   Total users: {len(users)}")
            print(f"   Users with hashed passwords: {users_with_hash}")
            print(f"   Users with plain text passwords: {users_with_plain}")
            
            if users_with_hash == len(users) and users_with_plain == 0:
                print("\n🎉 SUCCESS: All users have hashed passwords and no plain text passwords remain!")
            elif users_with_hash > 0 and users_with_plain == 0:
                print("\n✅ GOOD: All users have hashed passwords, no plain text passwords")
            elif users_with_hash > 0 and users_with_plain > 0:
                print("\n⚠️  WARNING: Some users still have plain text passwords")
            else:
                print("\n❌ ERROR: No users have hashed passwords")
        
        engine.dispose()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()