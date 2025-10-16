#!/usr/bin/env python3
"""
Script to check the complete structure of the users table using SQLAlchemy
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def check_table_structure():
    """Check the complete structure of the users table"""
    try:
        # Database connection using SQLAlchemy
        database_url = os.getenv('DATABASE_URL', 'mysql+pymysql://root:Databaseya789@localhost:3306/inspecpro')
        engine = create_engine(database_url)
        
        print("🔍 CHECKING USERS TABLE STRUCTURE")
        print("=" * 50)
        
        # Get table structure using inspector
        inspector = inspect(engine)
        columns = inspector.get_columns('users')
        
        print("\n📋 TABLE STRUCTURE:")
        print("-" * 80)
        print(f"{'Field':<20} {'Type':<25} {'Nullable':<10} {'Default':<15}")
        print("-" * 80)
        
        for column in columns:
            field = column['name']
            type_info = str(column['type'])
            nullable = 'YES' if column['nullable'] else 'NO'
            default = str(column['default']) if column['default'] is not None else 'NULL'
            print(f"{field:<20} {type_info:<25} {nullable:<10} {default:<15}")
        
        print(f"\n📊 COLUMN COUNT: {len(columns)}")
        
        # Get all data with all columns
        with engine.connect() as connection:
            result = connection.execute(text("SELECT * FROM users"))
            users = result.fetchall()
            column_names = result.keys()
            
            print(f"\n👥 TOTAL USERS: {len(users)}")
            
            if users:
                print("\n📋 SAMPLE DATA (First 3 users):")
                print("-" * 120)
                
                # Print header
                header = " | ".join([f"{name:<15}" for name in column_names])
                print(header)
                print("-" * 120)
                
                # Print first 3 users
                for i, user in enumerate(users[:3]):
                    row = " | ".join([f"{str(value)[:15]:<15}" if value is not None else f"{'NULL':<15}" for value in user])
                    print(row)
        
        # Check for missing expected columns
        expected_columns = [
            'user_id', 'username', 'email', 'password_hash', 
            'role', 'plant', 'line_process', 'created_at', 'is_active'
        ]
        
        existing_columns = [col['name'] for col in columns]
        missing_columns = [col for col in expected_columns if col not in existing_columns]
        extra_columns = [col for col in existing_columns if col not in expected_columns and col != 'id' and col != 'password']
        
        print(f"\n✅ EXPECTED COLUMNS: {len(expected_columns)}")
        print(f"📊 EXISTING COLUMNS: {len(existing_columns)}")
        
        if missing_columns:
            print(f"\n❌ MISSING COLUMNS: {missing_columns}")
        else:
            print(f"\n✅ ALL EXPECTED COLUMNS PRESENT!")
        
        if extra_columns:
            print(f"\n📋 ADDITIONAL COLUMNS: {extra_columns}")
        
        # Check if old password column still exists
        if 'password' in existing_columns:
            print(f"\n⚠️  OLD 'password' COLUMN STILL EXISTS")
            with engine.connect() as connection:
                result = connection.execute(text("SELECT COUNT(*) FROM users WHERE password IS NOT NULL AND password != ''"))
                plain_password_count = result.scalar()
                print(f"   Users with plain passwords: {plain_password_count}")
        
        # Show all column names for reference
        print(f"\n📋 ALL COLUMNS: {existing_columns}")
        
        print("\n" + "=" * 50)
        print("✅ TABLE STRUCTURE CHECK COMPLETE")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_table_structure()