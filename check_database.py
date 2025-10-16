#!/usr/bin/env python3
"""
Script to check database structure and identify tables with user data
"""

import sys
import os

# Add backend directory to path to import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/backend')

from sqlalchemy import create_engine, text, inspect
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def connect_to_database():
    """Connect to MySQL database using SQLAlchemy"""
    try:
        DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:Databaseya789@localhost:3306/inspecpro")
        print(f"🔗 Connecting to: {DATABASE_URL}")
        
        engine = create_engine(
            DATABASE_URL,
            echo=False,
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

def check_all_tables(engine):
    """Check all tables in the database"""
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print(f"\n📋 Found {len(tables)} tables in database:")
        for table in tables:
            print(f"  - {table}")
        
        # Check each table for user-related data
        with engine.connect() as connection:
            for table in tables:
                if 'user' in table.lower():
                    print(f"\n🔍 Examining user table: {table}")
                    
                    # Get table structure
                    columns = inspector.get_columns(table)
                    print(f"  📋 Columns:")
                    for col in columns:
                        print(f"    - {col['name']}: {col['type']}")
                    
                    # Get sample data
                    try:
                        result = connection.execute(text(f"SELECT * FROM {table} LIMIT 3"))
                        rows = result.fetchall()
                        if rows:
                            print(f"  📊 Sample data ({len(rows)} rows):")
                            column_names = [col['name'] for col in columns]
                            for i, row in enumerate(rows):
                                print(f"    Row {i+1}:")
                                for j, value in enumerate(row):
                                    if j < len(column_names):
                                        # Mask password fields
                                        if 'password' in column_names[j].lower():
                                            display_value = f"{str(value)[:10]}..." if value and len(str(value)) > 10 else str(value)
                                        else:
                                            display_value = str(value)
                                        print(f"      {column_names[j]}: {display_value}")
                        else:
                            print(f"  📊 No data found in {table}")
                    except Exception as e:
                        print(f"  ❌ Error reading data from {table}: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error checking tables: {e}")
        return False

def main():
    """Main function"""
    print("🔍 Database Structure Checker")
    print("=" * 50)
    
    # Connect to database
    engine = connect_to_database()
    if not engine:
        return
    
    try:
        # Check all tables
        check_all_tables(engine)
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    finally:
        if engine:
            engine.dispose()
            print("\n🔌 Database connection closed")

if __name__ == "__main__":
    main()