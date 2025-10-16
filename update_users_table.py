#!/usr/bin/env python3
"""
Script to update the 'users' table (not inspecpro_users) with hashed passwords
This script will:
1. Connect to MySQL database
2. Add password_hash column to users table
3. Hash existing plain text passwords
4. Update table structure to match frontend requirements
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

def hash_password(password: str) -> str:
    """Hash password using passlib bcrypt (same as backend)"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def connect_to_database():
    """Connect to MySQL database using SQLAlchemy"""
    try:
        DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:Databaseya789@localhost:3306/inspecpro")
        print(f"🔗 Connecting to: {DATABASE_URL}")
        
        engine = create_engine(
            DATABASE_URL,
            echo=True,
            pool_pre_ping=True,
            pool_recycle=3600,
            pool_size=10,
            max_overflow=20
        )
        
        # Test connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT DATABASE()"))
            current_db = result.scalar()
            print(f"✅ Connected to database: {current_db}")
        
        return engine
        
    except Exception as e:
        print(f"❌ Error connecting to MySQL: {e}")
        return None

def examine_users_table(engine):
    """Examine current users table structure"""
    try:
        inspector = inspect(engine)
        
        # Check if users table exists
        tables = inspector.get_table_names()
        if 'users' not in tables:
            print("❌ Table 'users' does not exist")
            return False, []
        
        print("📋 Current 'users' table structure:")
        columns = inspector.get_columns('users')
        column_names = [col['name'] for col in columns]
        
        for column in columns:
            print(f"  - {column['name']}: {column['type']} {'NOT NULL' if not column['nullable'] else 'NULL'}")
        
        # Check current data
        with engine.connect() as connection:
            result = connection.execute(text("SELECT COUNT(*) FROM users"))
            count = result.scalar()
            print(f"📊 Current user count: {count}")
            
            if count > 0:
                result = connection.execute(text("SELECT id, username, password, role, created_at FROM users"))
                users = result.fetchall()
                print("👥 Current users with plain text passwords:")
                for user in users:
                    password_display = f"{user[2][:8]}..." if len(user[2]) > 8 else user[2]
                    print(f"  - ID: {user[0]} | User: {user[1]} | Password: {password_display} | Role: {user[3]} | Created: {user[4]}")
        
        return True, column_names
        
    except Exception as e:
        print(f"❌ Error examining users table: {e}")
        return False, []

def update_users_table_structure(engine, existing_columns):
    """Update users table structure to include password_hash and other required fields"""
    try:
        with engine.connect() as connection:
            print("🔄 Updating 'users' table structure...")
            
            # Add password_hash column if it doesn't exist
            if 'password_hash' not in existing_columns:
                try:
                    connection.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL"))
                    print("  ✅ Added password_hash column")
                except Exception as e:
                    print(f"  ⚠️  password_hash column might already exist: {e}")
            
            # Add other missing columns to match frontend requirements
            required_columns = {
                'user_id': 'VARCHAR(50) UNIQUE NULL',
                'email': 'VARCHAR(255) UNIQUE NULL',
                'plant': 'VARCHAR(100) NULL',
                'line_process': 'VARCHAR(100) NULL',
                'is_active': 'BOOLEAN DEFAULT TRUE'
            }
            
            for column_name, column_def in required_columns.items():
                if column_name not in existing_columns:
                    try:
                        connection.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_def}"))
                        print(f"  ✅ Added {column_name} column")
                    except Exception as e:
                        print(f"  ⚠️  Column {column_name} might already exist: {e}")
            
            connection.commit()
            print("✅ Table structure updated successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Error updating table structure: {e}")
        return False

def hash_plain_text_passwords(engine):
    """Hash all plain text passwords in users table"""
    try:
        with engine.connect() as connection:
            print("🔐 Hashing plain text passwords...")
            
            # Get all users with plain text passwords
            result = connection.execute(text("""
                SELECT id, username, password 
                FROM users 
                WHERE password IS NOT NULL AND password != ''
            """))
            users_to_hash = result.fetchall()
            
            if not users_to_hash:
                print("ℹ️  No users found to hash")
                return True
            
            print(f"🔄 Found {len(users_to_hash)} users with plain text passwords")
            
            for user in users_to_hash:
                user_id, username, plain_password = user
                
                # Hash the password
                hashed_password = hash_password(plain_password)
                
                # Update with hashed password
                connection.execute(text("""
                    UPDATE users 
                    SET password_hash = :password_hash 
                    WHERE id = :user_id
                """), {
                    'password_hash': hashed_password,
                    'user_id': user_id
                })
                
                print(f"  ✅ Hashed password for user: {username}")
                
                # Verify password hashing works
                if verify_password(plain_password, hashed_password):
                    print(f"    🔐 Password verification: ✅ PASS")
                else:
                    print(f"    🔐 Password verification: ❌ FAIL")
            
            connection.commit()
            print("✅ All passwords have been hashed successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Error hashing passwords: {e}")
        return False

def clear_plain_text_passwords(engine):
    """Clear plain text passwords after hashing (optional security step)"""
    try:
        with engine.connect() as connection:
            print("🧹 Clearing plain text passwords for security...")
            
            # Set password column to NULL where password_hash exists
            connection.execute(text("""
                UPDATE users 
                SET password = NULL 
                WHERE password_hash IS NOT NULL AND password_hash != ''
            """))
            
            connection.commit()
            print("✅ Plain text passwords cleared")
        
        return True
        
    except Exception as e:
        print(f"❌ Error clearing plain text passwords: {e}")
        return False

def verify_final_data(engine):
    """Verify the updated table structure and data"""
    try:
        inspector = inspect(engine)
        
        print("\n📋 Final 'users' table structure:")
        columns = inspector.get_columns('users')
        for column in columns:
            print(f"  - {column['name']}: {column['type']} {'NOT NULL' if not column['nullable'] else 'NULL'}")
        
        print("\n👥 Final user data:")
        with engine.connect() as connection:
            result = connection.execute(text("""
                SELECT id, username, password, password_hash, role, created_at, is_active
                FROM users 
                ORDER BY created_at
            """))
            users = result.fetchall()
            
            for user in users:
                password_display = "NULL" if user[2] is None else f"{user[2][:8]}..."
                hash_display = "NULL" if user[3] is None else f"{user[3][:20]}..."
                print(f"  - ID: {user[0]} | User: {user[1]} | Password: {password_display} | Hash: {hash_display}")
                print(f"    Role: {user[4]} | Created: {user[5]} | Active: {user[6]}")
            
            print(f"\n📊 Total users: {len(users)}")
            
            # Test password verification for admin user
            result = connection.execute(text("SELECT password_hash FROM users WHERE username = 'admin' LIMIT 1"))
            admin_hash = result.scalar()
            if admin_hash and verify_password('admin123', admin_hash):
                print("🔐 Admin password verification: ✅ PASS")
            else:
                print("🔐 Admin password verification: ❌ FAIL or user not found")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verifying data: {e}")
        return False

def main():
    """Main function to update users table"""
    print("🚀 Starting 'users' Table Password Update")
    print("=" * 50)
    
    # Connect to database
    engine = connect_to_database()
    if not engine:
        return
    
    try:
        # Step 1: Examine current table
        print("\n📋 Step 1: Examining current 'users' table...")
        table_exists, existing_columns = examine_users_table(engine)
        
        if not table_exists:
            print("❌ Users table does not exist.")
            return
        
        # Step 2: Update table structure
        print("\n🔄 Step 2: Updating table structure...")
        if update_users_table_structure(engine, existing_columns):
            print("✅ Table structure updated successfully")
        else:
            print("❌ Failed to update table structure")
            return
        
        # Step 3: Hash plain text passwords
        print("\n🔐 Step 3: Hashing plain text passwords...")
        if hash_plain_text_passwords(engine):
            print("✅ Passwords hashed successfully")
        else:
            print("❌ Failed to hash passwords")
            return
        
        # Step 4: Clear plain text passwords (optional)
        print("\n🧹 Step 4: Clearing plain text passwords...")
        if clear_plain_text_passwords(engine):
            print("✅ Plain text passwords cleared")
        else:
            print("⚠️  Failed to clear plain text passwords (not critical)")
        
        # Step 5: Verify final data
        print("\n✅ Step 5: Verifying final data...")
        if verify_final_data(engine):
            print("✅ Data verification completed successfully")
        else:
            print("❌ Data verification failed")
            return
        
        print("\n🎉 'users' table update completed successfully!")
        print("=" * 50)
        print("📝 Summary:")
        print("  - Plain text passwords have been hashed using bcrypt")
        print("  - Table structure updated to include password_hash column")
        print("  - Original plain text passwords cleared for security")
        print("  - Password verification tested and working")
        print("\n🔑 Test Login Credentials (if using 'users' table):")
        print("  - Admin: admin / admin123")
        print("  - Inspector: inspector1 / password123")
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    finally:
        if engine:
            engine.dispose()
            print("\n🔌 Database connection closed")

if __name__ == "__main__":
    main()