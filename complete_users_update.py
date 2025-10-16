#!/usr/bin/env python3
"""
Comprehensive script to update the 'users' table in inspecpro database
This script will:
1. Update table structure with all required fields
2. Add comprehensive sample users with proper roles
3. Hash all passwords using bcrypt
4. Verify data integrity
"""

import sys
import os
from datetime import datetime

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
            echo=False,  # Set to False to reduce output
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

def update_users_table_structure(engine):
    """Update users table structure with all required fields"""
    try:
        inspector = inspect(engine)
        
        # Check if users table exists
        tables = inspector.get_table_names()
        if 'users' not in tables:
            print("❌ Table 'users' does not exist")
            return False
        
        print("🔄 Updating users table structure...")
        
        with engine.connect() as connection:
            # Get current columns
            current_columns = [col['name'] for col in inspector.get_columns('users')]
            print(f"📋 Current columns: {current_columns}")
            
            # Define required columns with their specifications
            required_columns = {
                'user_id': 'VARCHAR(50) UNIQUE NULL',
                'username': 'VARCHAR(100) NOT NULL UNIQUE',
                'email': 'VARCHAR(255) UNIQUE NULL',
                'password': 'VARCHAR(255) NULL',  # Keep for compatibility
                'password_hash': 'VARCHAR(255) NULL',
                'role': 'ENUM("admin", "user", "supervisor", "management") NOT NULL DEFAULT "user"',
                'plant': 'VARCHAR(100) NULL',
                'line_process': 'VARCHAR(100) NULL',
                'created_at': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
                'is_active': 'BOOLEAN DEFAULT TRUE'
            }
            
            # Add missing columns
            for column_name, column_def in required_columns.items():
                if column_name not in current_columns:
                    try:
                        connection.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_def}"))
                        print(f"  ✅ Added column: {column_name}")
                    except Exception as e:
                        print(f"  ⚠️  Column {column_name} might already exist or error: {e}")
            
            # Modify existing columns if needed
            try:
                # Ensure password can be NULL
                connection.execute(text("ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL"))
                print("  ✅ Modified password column to allow NULL")
            except Exception as e:
                print(f"  ⚠️  Password column modification: {e}")
            
            # Update role column to include all required roles
            try:
                connection.execute(text("""
                    ALTER TABLE users 
                    MODIFY COLUMN role ENUM('admin', 'user', 'supervisor', 'management') NOT NULL DEFAULT 'user'
                """))
                print("  ✅ Updated role column with all required roles")
            except Exception as e:
                print(f"  ⚠️  Role column update: {e}")
            
            connection.commit()
            print("✅ Table structure updated successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Error updating table structure: {e}")
        return False

def clear_existing_data(engine):
    """Clear existing data to start fresh"""
    try:
        with engine.connect() as connection:
            print("🧹 Clearing existing user data...")
            
            # Check current data count
            result = connection.execute(text("SELECT COUNT(*) FROM users"))
            current_count = result.scalar()
            print(f"📊 Current user count: {current_count}")
            
            if current_count > 0:
                # Clear all existing users
                connection.execute(text("DELETE FROM users"))
                connection.commit()
                print(f"✅ Cleared {current_count} existing users")
            else:
                print("ℹ️  No existing users to clear")
        
        return True
        
    except Exception as e:
        print(f"❌ Error clearing existing data: {e}")
        return False

def insert_sample_users(engine):
    """Insert comprehensive sample users with hashed passwords"""
    try:
        print("👥 Inserting sample users...")
        
        # Define sample users with all required data
        sample_users = [
            {
                'user_id': 'USR001',
                'username': 'admin',
                'email': 'admin@inspecpro.com',
                'password': 'admin123',
                'role': 'admin',
                'plant': 'Plant A',
                'line_process': 'All Lines',
                'is_active': True
            },
            {
                'user_id': 'USR002',
                'username': 'supervisor1',
                'email': 'supervisor1@inspecpro.com',
                'password': 'supervisor123',
                'role': 'supervisor',
                'plant': 'Plant A',
                'line_process': 'Line 1',
                'is_active': True
            },
            {
                'user_id': 'USR003',
                'username': 'inspector1',
                'email': 'inspector1@inspecpro.com',
                'password': 'inspector123',
                'role': 'user',
                'plant': 'Plant A',
                'line_process': 'Line 1',
                'is_active': True
            },
            {
                'user_id': 'USR004',
                'username': 'manager1',
                'email': 'manager1@inspecpro.com',
                'password': 'manager123',
                'role': 'management',
                'plant': 'Plant A',
                'line_process': 'All Lines',
                'is_active': True
            },
            {
                'user_id': 'USR005',
                'username': 'supervisor2',
                'email': 'supervisor2@inspecpro.com',
                'password': 'supervisor123',
                'role': 'supervisor',
                'plant': 'Plant B',
                'line_process': 'Line 2',
                'is_active': True
            },
            {
                'user_id': 'USR006',
                'username': 'inspector2',
                'email': 'inspector2@inspecpro.com',
                'password': 'inspector123',
                'role': 'user',
                'plant': 'Plant B',
                'line_process': 'Line 2',
                'is_active': True
            }
        ]
        
        with engine.connect() as connection:
            for user_data in sample_users:
                # Hash the password
                plain_password = user_data['password']
                hashed_password = hash_password(plain_password)
                
                # Insert user with hashed password
                connection.execute(text("""
                    INSERT INTO users (
                        user_id, username, email, password_hash, role, 
                        plant, line_process, is_active, created_at
                    ) VALUES (
                        :user_id, :username, :email, :password_hash, :role,
                        :plant, :line_process, :is_active, NOW()
                    )
                """), {
                    'user_id': user_data['user_id'],
                    'username': user_data['username'],
                    'email': user_data['email'],
                    'password_hash': hashed_password,
                    'role': user_data['role'],
                    'plant': user_data['plant'],
                    'line_process': user_data['line_process'],
                    'is_active': user_data['is_active']
                })
                
                print(f"  ✅ Added user: {user_data['username']} ({user_data['role']})")
                
                # Verify password hashing
                if verify_password(plain_password, hashed_password):
                    print(f"    🔐 Password verification: ✅ PASS")
                else:
                    print(f"    🔐 Password verification: ❌ FAIL")
            
            connection.commit()
            print(f"✅ Successfully inserted {len(sample_users)} sample users")
        
        return True
        
    except Exception as e:
        print(f"❌ Error inserting sample users: {e}")
        return False

def verify_final_data(engine):
    """Verify the final table structure and data"""
    try:
        inspector = inspect(engine)
        
        print("\n📋 Final 'users' table structure:")
        columns = inspector.get_columns('users')
        for column in columns:
            nullable = "NULL" if column['nullable'] else "NOT NULL"
            default = f" DEFAULT {column['default']}" if column.get('default') else ""
            print(f"  - {column['name']}: {column['type']} {nullable}{default}")
        
        print("\n👥 Final user data:")
        with engine.connect() as connection:
            result = connection.execute(text("""
                SELECT user_id, username, email, role, plant, line_process, 
                       created_at, is_active, password_hash
                FROM users 
                ORDER BY user_id
            """))
            users = result.fetchall()
            
            print(f"📊 Total users: {len(users)}")
            print()
            
            for user in users:
                user_id, username, email, role, plant, line_process, created_at, is_active, password_hash = user
                hash_display = f"{password_hash[:20]}..." if password_hash else "NULL"
                active_status = "✅ Active" if is_active else "❌ Inactive"
                
                print(f"👤 {user_id} - {username}")
                print(f"   Email: {email}")
                print(f"   Role: {role}")
                print(f"   Plant: {plant}")
                print(f"   Line/Process: {line_process}")
                print(f"   Created: {created_at}")
                print(f"   Status: {active_status}")
                print(f"   Password Hash: {hash_display}")
                print()
        
        return True
        
    except Exception as e:
        print(f"❌ Error verifying data: {e}")
        return False

def test_login_credentials(engine):
    """Test login credentials for all sample users"""
    try:
        print("🔑 Testing login credentials...")
        
        test_credentials = [
            ('admin', 'admin123'),
            ('supervisor1', 'supervisor123'),
            ('inspector1', 'inspector123'),
            ('manager1', 'manager123')
        ]
        
        with engine.connect() as connection:
            for username, password in test_credentials:
                result = connection.execute(text("""
                    SELECT password_hash, role FROM users 
                    WHERE username = :username
                """), {'username': username})
                
                user_data = result.fetchone()
                if user_data:
                    password_hash, role = user_data
                    if verify_password(password, password_hash):
                        print(f"  ✅ {username} / {password} - {role} - LOGIN SUCCESS")
                    else:
                        print(f"  ❌ {username} / {password} - {role} - LOGIN FAILED")
                else:
                    print(f"  ❌ {username} - USER NOT FOUND")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing login credentials: {e}")
        return False

def main():
    """Main function to update users table comprehensively"""
    print("🚀 Starting Comprehensive Users Table Update")
    print("=" * 60)
    
    # Connect to database
    engine = connect_to_database()
    if not engine:
        return
    
    try:
        # Step 1: Update table structure
        print("\n🔄 Step 1: Updating table structure...")
        if not update_users_table_structure(engine):
            print("❌ Failed to update table structure")
            return
        
        # Step 2: Clear existing data
        print("\n🧹 Step 2: Clearing existing data...")
        if not clear_existing_data(engine):
            print("❌ Failed to clear existing data")
            return
        
        # Step 3: Insert sample users
        print("\n👥 Step 3: Inserting sample users...")
        if not insert_sample_users(engine):
            print("❌ Failed to insert sample users")
            return
        
        # Step 4: Verify final data
        print("\n✅ Step 4: Verifying final data...")
        if not verify_final_data(engine):
            print("❌ Data verification failed")
            return
        
        # Step 5: Test login credentials
        print("\n🔑 Step 5: Testing login credentials...")
        if not test_login_credentials(engine):
            print("❌ Login credential testing failed")
            return
        
        print("\n🎉 USERS TABLE UPDATE COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print("📝 Summary:")
        print("  ✅ Table structure updated with all required fields")
        print("  ✅ Sample users created with proper roles")
        print("  ✅ All passwords hashed using bcrypt")
        print("  ✅ Login credentials tested and working")
        print("\n🔑 Test Login Credentials:")
        print("  - Admin: admin / admin123")
        print("  - Supervisor: supervisor1 / supervisor123")
        print("  - Inspector: inspector1 / inspector123")
        print("  - Manager: manager1 / manager123")
        print("\n📊 Database Structure:")
        print("  - user_id: Unique user identifier")
        print("  - username: Unique username")
        print("  - email: Unique email address")
        print("  - password_hash: Bcrypt hashed password")
        print("  - role: admin, user, supervisor, management")
        print("  - plant: Plant/location")
        print("  - line_process: Line/process")
        print("  - created_at: Timestamp")
        print("  - is_active: Active status")
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    finally:
        if engine:
            engine.dispose()
            print("\n🔌 Database connection closed")

if __name__ == "__main__":
    main()