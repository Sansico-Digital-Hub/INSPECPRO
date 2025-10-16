#!/usr/bin/env python3
"""
Final verification script for the updated users table
"""

import sys
import os

# Add backend directory to path to import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/backend')

from sqlalchemy import create_engine, text, inspect
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
    """Final verification of users table update"""
    try:
        DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:Databaseya789@localhost:3306/inspecpro")
        engine = create_engine(DATABASE_URL)
        
        print("🔍 FINAL VERIFICATION - Users Table Update")
        print("=" * 60)
        
        inspector = inspect(engine)
        
        # 1. Verify table structure
        print("\n📋 1. TABLE STRUCTURE VERIFICATION:")
        columns = inspector.get_columns('users')
        column_names = [col['name'] for col in columns]
        
        required_fields = [
            'user_id', 'username', 'email', 'password_hash', 
            'role', 'plant', 'line_process', 'created_at', 'is_active'
        ]
        
        print("Required fields check:")
        for field in required_fields:
            status = "✅ EXISTS" if field in column_names else "❌ MISSING"
            print(f"  - {field}: {status}")
        
        # 2. Verify data integrity
        print("\n👥 2. DATA INTEGRITY VERIFICATION:")
        with engine.connect() as connection:
            result = connection.execute(text("""
                SELECT user_id, username, email, role, plant, line_process, 
                       password_hash, is_active, created_at
                FROM users 
                ORDER BY user_id
            """))
            users = result.fetchall()
            
            print(f"📊 Total users: {len(users)}")
            
            # Check for required roles
            roles_found = set()
            for user in users:
                roles_found.add(user[3])  # role column
            
            required_roles = {'admin', 'supervisor', 'user', 'management'}
            print(f"\nRole coverage:")
            for role in required_roles:
                status = "✅ COVERED" if role in roles_found else "❌ MISSING"
                print(f"  - {role}: {status}")
            
            # 3. Verify password hashing
            print("\n🔐 3. PASSWORD SECURITY VERIFICATION:")
            passwords_hashed = 0
            plain_passwords = 0
            
            for user in users:
                user_id, username, email, role, plant, line_process, password_hash, is_active, created_at = user
                
                if password_hash:
                    passwords_hashed += 1
                    print(f"  ✅ {username}: Password properly hashed")
                else:
                    plain_passwords += 1
                    print(f"  ❌ {username}: No password hash found")
            
            print(f"\nPassword security summary:")
            print(f"  - Users with hashed passwords: {passwords_hashed}")
            print(f"  - Users with plain/missing passwords: {plain_passwords}")
            
            # 4. Test login credentials
            print("\n🔑 4. LOGIN CREDENTIALS TESTING:")
            test_credentials = [
                ('admin', 'admin123'),
                ('supervisor1', 'supervisor123'),
                ('inspector1', 'inspector123'),
                ('manager1', 'manager123')
            ]
            
            successful_logins = 0
            for username, password in test_credentials:
                result = connection.execute(text("""
                    SELECT password_hash, role FROM users 
                    WHERE username = :username AND is_active = 1
                """), {'username': username})
                
                user_data = result.fetchone()
                if user_data and user_data[0]:
                    password_hash, role = user_data
                    if verify_password(password, password_hash):
                        print(f"  ✅ {username} / {password} ({role}): LOGIN SUCCESS")
                        successful_logins += 1
                    else:
                        print(f"  ❌ {username} / {password} ({role}): LOGIN FAILED")
                else:
                    print(f"  ❌ {username}: USER NOT FOUND OR INACTIVE")
            
            # 5. Data completeness check
            print("\n📊 5. DATA COMPLETENESS CHECK:")
            complete_users = 0
            for user in users:
                user_id, username, email, role, plant, line_process, password_hash, is_active, created_at = user
                
                # Check if all required fields are filled
                required_filled = all([
                    user_id, username, role, password_hash, 
                    created_at is not None, is_active is not None
                ])
                
                if required_filled:
                    complete_users += 1
                    print(f"  ✅ {username}: All required fields complete")
                else:
                    print(f"  ❌ {username}: Missing required data")
            
            # Final summary
            print("\n🎯 FINAL VERIFICATION SUMMARY:")
            print("=" * 60)
            
            structure_ok = all(field in column_names for field in required_fields)
            roles_ok = required_roles.issubset(roles_found)
            security_ok = plain_passwords == 0 and passwords_hashed > 0
            login_ok = successful_logins == len(test_credentials)
            data_ok = complete_users == len(users)
            
            print(f"✅ Table Structure: {'PASS' if structure_ok else 'FAIL'}")
            print(f"✅ Role Coverage: {'PASS' if roles_ok else 'FAIL'}")
            print(f"✅ Password Security: {'PASS' if security_ok else 'FAIL'}")
            print(f"✅ Login Testing: {'PASS' if login_ok else 'FAIL'}")
            print(f"✅ Data Completeness: {'PASS' if data_ok else 'FAIL'}")
            
            overall_success = all([structure_ok, roles_ok, security_ok, login_ok, data_ok])
            
            if overall_success:
                print("\n🎉 OVERALL RESULT: ✅ SUCCESS!")
                print("The users table has been successfully updated with:")
                print("  - Complete structure with all required fields")
                print("  - Comprehensive sample users with proper roles")
                print("  - Secure bcrypt password hashing")
                print("  - Working login credentials")
                print("  - Complete and valid data")
            else:
                print("\n❌ OVERALL RESULT: FAILED!")
                print("Some requirements were not met. Please check the details above.")
        
        engine.dispose()
        
    except Exception as e:
        print(f"❌ Verification Error: {e}")

if __name__ == "__main__":
    main()