#!/usr/bin/env python3
"""
Script to fix the 'users' table structure and clear plain text passwords
"""

import sys
import os

# Add backend directory to path to import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/backend')

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def main():
    """Fix users table structure and clear plain text passwords"""
    try:
        DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:Databaseya789@localhost:3306/inspecpro")
        engine = create_engine(DATABASE_URL)
        
        print("🔧 Fixing 'users' table structure...")
        print("=" * 50)
        
        with engine.connect() as connection:
            # Step 1: Modify password column to allow NULL
            print("🔄 Step 1: Modifying password column to allow NULL...")
            try:
                connection.execute(text("""
                    ALTER TABLE users 
                    MODIFY COLUMN password VARCHAR(255) NULL
                """))
                connection.commit()
                print("✅ Password column modified to allow NULL")
            except Exception as e:
                print(f"⚠️  Error modifying password column: {e}")
            
            # Step 2: Check current state
            print("\n📊 Step 2: Checking current state...")
            result = connection.execute(text("""
                SELECT id, username, password, password_hash 
                FROM users 
                ORDER BY id
            """))
            users = result.fetchall()
            
            print(f"Found {len(users)} users:")
            for user in users:
                password_status = "EXISTS" if user[2] else "NULL"
                hash_status = "EXISTS" if user[3] else "NULL"
                print(f"   - ID: {user[0]} | Username: {user[1]} | Password: {password_status} | Hash: {hash_status}")
            
            # Step 3: Clear plain text passwords where hash exists
            print("\n🧹 Step 3: Clearing plain text passwords...")
            result = connection.execute(text("""
                UPDATE users 
                SET password = NULL 
                WHERE password_hash IS NOT NULL AND password_hash != ''
            """))
            
            affected_rows = result.rowcount
            connection.commit()
            print(f"✅ Cleared plain text passwords for {affected_rows} users")
            
            # Step 4: Verify final state
            print("\n🔍 Step 4: Verifying final state...")
            result = connection.execute(text("""
                SELECT id, username, password, password_hash 
                FROM users 
                ORDER BY id
            """))
            final_users = result.fetchall()
            
            print(f"Final state of {len(final_users)} users:")
            for user in final_users:
                password_status = "❌ STILL EXISTS" if user[2] else "✅ CLEARED"
                hash_status = "✅ EXISTS" if user[3] else "❌ MISSING"
                print(f"   - ID: {user[0]} | Username: {user[1]} | Password: {password_status} | Hash: {hash_status}")
            
            # Summary
            users_with_plain = sum(1 for user in final_users if user[2])
            users_with_hash = sum(1 for user in final_users if user[3])
            
            print(f"\n📋 Final Summary:")
            print(f"   Total users: {len(final_users)}")
            print(f"   Users with plain text passwords: {users_with_plain}")
            print(f"   Users with hashed passwords: {users_with_hash}")
            
            if users_with_plain == 0 and users_with_hash > 0:
                print("\n🎉 SUCCESS: All plain text passwords cleared! Database is now secure.")
                print("\n🔑 Login credentials (use these for testing):")
                print("   - Admin: admin / admin123")
                print("   - Inspector: inspector1 / password123")
            elif users_with_plain > 0:
                print("\n⚠️  WARNING: Some plain text passwords still exist")
            else:
                print("\n❌ ERROR: No users have hashed passwords")
        
        engine.dispose()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()