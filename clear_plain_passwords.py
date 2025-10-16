#!/usr/bin/env python3
"""
Script to clear remaining plain text passwords from the 'users' table
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
    """Clear plain text passwords from users table"""
    try:
        DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:Databaseya789@localhost:3306/inspecpro")
        engine = create_engine(DATABASE_URL)
        
        print("🧹 Clearing plain text passwords from 'users' table...")
        print("=" * 50)
        
        with engine.connect() as connection:
            # First, check current state
            result = connection.execute(text("""
                SELECT id, username, password, password_hash 
                FROM users 
                WHERE password IS NOT NULL AND password != ''
            """))
            users_with_plain = result.fetchall()
            
            print(f"📊 Found {len(users_with_plain)} users with plain text passwords:")
            for user in users_with_plain:
                print(f"   - ID: {user[0]} | Username: {user[1]} | Has Hash: {'Yes' if user[3] else 'No'}")
            
            if len(users_with_plain) == 0:
                print("✅ No plain text passwords found!")
                return
            
            # Clear plain text passwords where hash exists
            print("\n🔄 Clearing plain text passwords...")
            result = connection.execute(text("""
                UPDATE users 
                SET password = NULL 
                WHERE password_hash IS NOT NULL AND password_hash != ''
            """))
            
            affected_rows = result.rowcount
            connection.commit()
            
            print(f"✅ Cleared plain text passwords for {affected_rows} users")
            
            # Verify the change
            print("\n🔍 Verifying changes...")
            result = connection.execute(text("""
                SELECT id, username, password, password_hash 
                FROM users 
                ORDER BY id
            """))
            all_users = result.fetchall()
            
            print(f"📊 Final state of {len(all_users)} users:")
            for user in all_users:
                password_status = "❌ STILL EXISTS" if user[2] else "✅ CLEARED"
                hash_status = "✅ EXISTS" if user[3] else "❌ MISSING"
                print(f"   - ID: {user[0]} | Username: {user[1]} | Password: {password_status} | Hash: {hash_status}")
            
            # Summary
            users_with_plain_final = sum(1 for user in all_users if user[2])
            users_with_hash_final = sum(1 for user in all_users if user[3])
            
            print(f"\n📋 Final Summary:")
            print(f"   Users with plain text passwords: {users_with_plain_final}")
            print(f"   Users with hashed passwords: {users_with_hash_final}")
            
            if users_with_plain_final == 0 and users_with_hash_final > 0:
                print("\n🎉 SUCCESS: All plain text passwords cleared, all users have hashed passwords!")
            elif users_with_plain_final > 0:
                print("\n⚠️  WARNING: Some plain text passwords still exist")
            else:
                print("\n❌ ERROR: No users have hashed passwords")
        
        engine.dispose()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()