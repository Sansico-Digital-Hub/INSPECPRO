#!/usr/bin/env python3
"""
Script to update user table in InsPecPro database
This script will:
1. Connect to MySQL database using SQLAlchemy (same as backend)
2. Examine current user table structure
3. Update table structure to match frontend add user form (without dropping)
4. Hash passwords properly using passlib (same as backend)
5. Insert sample users for testing
"""

import sys
import os

# Add backend directory to path to import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/backend')

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from datetime import datetime
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
        # Use same DATABASE_URL as backend
        DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:Databaseya789@localhost:3306/inspecpro")
        
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
            result = connection.execute(text("SELECT 1"))
            print("✅ Successfully connected to MySQL database")
        
        return engine
        
    except Exception as e:
        print(f"❌ Error connecting to MySQL: {e}")
        return None

def examine_current_table(engine):
    """Examine current user table structure"""
    try:
        inspector = inspect(engine)
        
        # Check if table exists
        tables = inspector.get_table_names()
        table_exists = 'inspecpro_users' in tables
        
        if table_exists:
            print("📋 Current user table structure:")
            columns = inspector.get_columns('inspecpro_users')
            column_names = [col['name'] for col in columns]
            for column in columns:
                print(f"  - {column['name']}: {column['type']} {'NOT NULL' if not column['nullable'] else 'NULL'} {'DEFAULT ' + str(column['default']) if column['default'] else ''}")
            
            # Check current data
            with engine.connect() as connection:
                result = connection.execute(text("SELECT COUNT(*) FROM inspecpro_users"))
                count = result.scalar()
                print(f"📊 Current user count: {count}")
                
                if count > 0:
                    # Check which columns exist to avoid errors
                    available_columns = []
                    for col in ['user_id', 'username', 'email', 'role', 'plant', 'line_process', 'is_active']:
                        if col in column_names:
                            available_columns.append(col)
                    
                    if available_columns:
                        query = f"SELECT {', '.join(available_columns)} FROM inspecpro_users LIMIT 5"
                        result = connection.execute(text(query))
                        users = result.fetchall()
                        print("👥 Sample users:")
                        for user in users:
                            print(f"  - {' | '.join(str(val) for val in user)}")
        else:
            print("⚠️  User table 'inspecpro_users' does not exist")
            
        return table_exists, column_names if table_exists else []
        
    except Exception as e:
        print(f"❌ Error examining table: {e}")
        return False, []

def update_user_table_structure(engine, existing_columns):
    """Update user table structure to match frontend without dropping table"""
    try:
        # Required columns for frontend add user form
        required_columns = {
            'id': 'INT PRIMARY KEY AUTO_INCREMENT',
            'user_id': 'VARCHAR(50) UNIQUE NOT NULL',
            'username': 'VARCHAR(100) UNIQUE NOT NULL', 
            'email': 'VARCHAR(255) UNIQUE NOT NULL',
            'password_hash': 'VARCHAR(255) NOT NULL',
            'role': "ENUM('admin', 'user', 'supervisor', 'management') NOT NULL DEFAULT 'user'",
            'plant': 'VARCHAR(100) NULL',
            'line_process': 'VARCHAR(100) NULL',
            'created_at': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'is_active': 'BOOLEAN DEFAULT TRUE'
        }
        
        with engine.connect() as connection:
            print("🔄 Updating table structure...")
            
            # Add missing columns
            for column_name, column_def in required_columns.items():
                if column_name not in existing_columns:
                    try:
                        # Special handling for different column types
                        if column_name == 'id' and 'id' not in existing_columns:
                            # Add auto increment primary key
                            connection.execute(text(f"ALTER TABLE inspecpro_users ADD COLUMN {column_name} {column_def} FIRST"))
                        elif column_name == 'password_hash':
                            # Add password_hash column
                            connection.execute(text(f"ALTER TABLE inspecpro_users ADD COLUMN {column_name} {column_def}"))
                        elif column_name == 'role':
                            # Add role column with ENUM
                            connection.execute(text(f"ALTER TABLE inspecpro_users ADD COLUMN {column_name} {column_def}"))
                        else:
                            # Add other columns
                            connection.execute(text(f"ALTER TABLE inspecpro_users ADD COLUMN {column_name} {column_def}"))
                        
                        print(f"  ✅ Added column: {column_name}")
                    except Exception as e:
                        print(f"  ⚠️  Column {column_name} might already exist or error: {e}")
            
            # Add indexes if they don't exist
            indexes_to_add = [
                ('idx_user_id', 'user_id'),
                ('idx_username', 'username'),
                ('idx_email', 'email'),
                ('idx_role', 'role'),
                ('idx_active', 'is_active')
            ]
            
            for index_name, column_name in indexes_to_add:
                try:
                    connection.execute(text(f"CREATE INDEX {index_name} ON inspecpro_users ({column_name})"))
                    print(f"  ✅ Added index: {index_name}")
                except Exception as e:
                    print(f"  ⚠️  Index {index_name} might already exist: {e}")
            
            connection.commit()
            print("✅ Table structure updated successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Error updating table structure: {e}")
        return False

def hash_existing_passwords(engine):
    """Hash existing plain text passwords if any"""
    try:
        with engine.connect() as connection:
            # Check if there are users with plain text passwords (password column exists)
            inspector = inspect(engine)
            columns = [col['name'] for col in inspector.get_columns('inspecpro_users')]
            
            if 'password' in columns and 'password_hash' in columns:
                print("🔐 Checking for plain text passwords to hash...")
                
                # Get users with plain text passwords
                result = connection.execute(text("""
                    SELECT id, username, password 
                    FROM inspecpro_users 
                    WHERE password IS NOT NULL AND password != '' 
                    AND (password_hash IS NULL OR password_hash = '')
                """))
                users_to_hash = result.fetchall()
                
                if users_to_hash:
                    print(f"🔄 Found {len(users_to_hash)} users with plain text passwords")
                    
                    for user in users_to_hash:
                        user_id, username, plain_password = user
                        hashed_password = hash_password(plain_password)
                        
                        # Update with hashed password
                        connection.execute(text("""
                            UPDATE inspecpro_users 
                            SET password_hash = :password_hash 
                            WHERE id = :user_id
                        """), {
                            'password_hash': hashed_password,
                            'user_id': user_id
                        })
                        
                        print(f"  ✅ Hashed password for user: {username}")
                    
                    connection.commit()
                    print("✅ All existing passwords have been hashed")
                else:
                    print("ℹ️  No plain text passwords found to hash")
            
        return True
        
    except Exception as e:
        print(f"❌ Error hashing existing passwords: {e}")
        return False

def insert_sample_users(engine):
    """Insert sample users with properly hashed passwords"""
    try:
        # Sample users data (matching frontend add user form structure)
        sample_users = [
            {
                'user_id': 'ADMIN001',
                'username': 'admin',
                'email': 'admin@inspecpro.com',
                'password': 'admin123',  # Will be hashed
                'role': 'admin',
                'plant': 'Main Plant',
                'line_process': 'Administration'
            },
            {
                'user_id': 'SUP001',
                'username': 'supervisor1',
                'email': 'supervisor@inspecpro.com',
                'password': 'supervisor123',  # Will be hashed
                'role': 'supervisor',
                'plant': 'Plant A',
                'line_process': 'Production Line 1'
            },
            {
                'user_id': 'USER001',
                'username': 'inspector1',
                'email': 'inspector@inspecpro.com',
                'password': 'inspector123',  # Will be hashed
                'role': 'user',
                'plant': 'Plant A',
                'line_process': 'Quality Control'
            },
            {
                'user_id': 'MGT001',
                'username': 'manager1',
                'email': 'manager@inspecpro.com',
                'password': 'manager123',  # Will be hashed
                'role': 'management',
                'plant': 'Plant A',
                'line_process': 'Management'
            },
            {
                'user_id': 'USER002',
                'username': 'inspector2',
                'email': 'inspector2@inspecpro.com',
                'password': 'inspector456',  # Will be hashed
                'role': 'user',
                'plant': 'Plant B',
                'line_process': 'Assembly Line 2'
            }
        ]
        
        print("🔐 Inserting new sample users with hashed passwords...")
        
        with engine.connect() as connection:
            for user in sample_users:
                # Check if user already exists
                result = connection.execute(text("""
                    SELECT COUNT(*) FROM inspecpro_users 
                    WHERE username = :username OR email = :email OR user_id = :user_id
                """), {
                    'username': user['username'],
                    'email': user['email'],
                    'user_id': user['user_id']
                })
                
                if result.scalar() > 0:
                    print(f"  ⚠️  User {user['username']} already exists, skipping...")
                    continue
                
                # Hash the password
                hashed_password = hash_password(user['password'])
                
                # Insert user
                insert_query = text("""
                INSERT INTO inspecpro_users 
                (user_id, username, email, password_hash, role, plant, line_process, is_active) 
                VALUES (:user_id, :username, :email, :password_hash, :role, :plant, :line_process, :is_active)
                """)
                
                connection.execute(insert_query, {
                    'user_id': user['user_id'],
                    'username': user['username'],
                    'email': user['email'],
                    'password_hash': hashed_password,
                    'role': user['role'],
                    'plant': user['plant'],
                    'line_process': user['line_process'],
                    'is_active': True
                })
                
                print(f"  ✅ Added user: {user['username']} ({user['role']}) - Password hashed")
                
                # Verify password hashing works
                if verify_password(user['password'], hashed_password):
                    print(f"    🔐 Password verification: ✅ PASS")
                else:
                    print(f"    🔐 Password verification: ❌ FAIL")
            
            connection.commit()
        
        print(f"✅ Sample users processing completed")
        return True
        
    except Exception as e:
        print(f"❌ Error inserting sample users: {e}")
        return False

def verify_final_data(engine):
    """Verify the updated table structure and data"""
    try:
        inspector = inspect(engine)
        
        print("\n📋 Final table structure verification:")
        columns = inspector.get_columns('inspecpro_users')
        for column in columns:
            print(f"  - {column['name']}: {column['type']} {'NOT NULL' if not column['nullable'] else 'NULL'} {'DEFAULT ' + str(column['default']) if column['default'] else ''}")
        
        print("\n👥 Final user data:")
        with engine.connect() as connection:
            result = connection.execute(text("""
                SELECT user_id, username, email, role, plant, line_process, 
                       created_at, is_active 
                FROM inspecpro_users 
                ORDER BY created_at
            """))
            users = result.fetchall()
            
            for user in users:
                print(f"  - ID: {user[0]} | User: {user[1]} | Email: {user[2]} | Role: {user[3]}")
                print(f"    Plant: {user[4]} | Line: {user[5]} | Created: {user[6]} | Active: {user[7]}")
            
            print(f"\n📊 Total users: {len(users)}")
            
            # Test password verification for admin user
            result = connection.execute(text("SELECT password_hash FROM inspecpro_users WHERE username = 'admin' LIMIT 1"))
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
    """Main function to update user table"""
    print("🚀 Starting InsPecPro User Table Update")
    print("=" * 50)
    
    # Connect to database
    engine = connect_to_database()
    if not engine:
        return
    
    try:
        # Step 1: Examine current table
        print("\n📋 Step 1: Examining current table structure...")
        table_exists, existing_columns = examine_current_table(engine)
        
        if not table_exists:
            print("❌ User table does not exist. Please create it first.")
            return
        
        # Step 2: Update table structure (without dropping)
        print("\n🔄 Step 2: Updating table structure...")
        if update_user_table_structure(engine, existing_columns):
            print("✅ Table structure updated successfully")
        else:
            print("❌ Failed to update table structure")
            return
        
        # Step 3: Hash existing passwords
        print("\n🔐 Step 3: Hashing existing passwords...")
        if hash_existing_passwords(engine):
            print("✅ Existing passwords processed successfully")
        else:
            print("❌ Failed to process existing passwords")
        
        # Step 4: Insert sample users
        print("\n👥 Step 4: Inserting sample users...")
        if insert_sample_users(engine):
            print("✅ Sample users processed successfully")
        else:
            print("❌ Failed to process sample users")
        
        # Step 5: Verify final data
        print("\n✅ Step 5: Verifying final data...")
        if verify_final_data(engine):
            print("✅ Data verification completed successfully")
        else:
            print("❌ Data verification failed")
            return
        
        print("\n🎉 User table update completed successfully!")
        print("=" * 50)
        print("📝 Summary:")
        print("  - Table structure matches frontend add user form")
        print("  - Passwords are properly hashed using bcrypt (same as backend)")
        print("  - Sample users created for testing")
        print("  - All user roles available: admin, user, supervisor, management")
        print("\n🔑 Test Login Credentials:")
        print("  - Admin: admin / admin123")
        print("  - Supervisor: supervisor1 / supervisor123")
        print("  - Inspector: inspector1 / inspector123")
        print("  - Manager: manager1 / manager123")
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    finally:
        if engine:
            engine.dispose()
            print("\n🔌 Database connection closed")

if __name__ == "__main__":
    main()