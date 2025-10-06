#!/usr/bin/env python3
"""
Test MySQL connection and verify database setup
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from database import engine, SessionLocal
from models import User, Form, FormField

def test_connection():
    print("=" * 60)
    print("Testing MySQL Connection for InspecPro")
    print("=" * 60)
    
    try:
        # Test basic connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT VERSION()"))
            version = result.fetchone()[0]
            print(f"✓ MySQL Connection Successful!")
            print(f"  MySQL Version: {version}")
            
            # Test database
            result = conn.execute(text("SELECT DATABASE()"))
            db_name = result.fetchone()[0]
            print(f"  Database: {db_name}")
            
            # List tables
            result = conn.execute(text("SHOW TABLES"))
            tables = [row[0] for row in result.fetchall()]
            print(f"\n✓ Found {len(tables)} tables:")
            for table in tables:
                print(f"  - {table}")
        
        # Test ORM queries
        print("\n" + "=" * 60)
        print("Testing ORM Queries")
        print("=" * 60)
        
        db = SessionLocal()
        try:
            # Count users
            user_count = db.query(User).count()
            print(f"✓ Users: {user_count}")
            
            # Count forms
            form_count = db.query(Form).count()
            print(f"✓ Forms: {form_count}")
            
            # Count form fields
            field_count = db.query(FormField).count()
            print(f"✓ Form Fields: {field_count}")
            
            # List all forms
            forms = db.query(Form).all()
            print(f"\n✓ Available Forms:")
            for form in forms:
                field_count = db.query(FormField).filter(FormField.form_id == form.id).count()
                print(f"  - {form.form_name} ({field_count} fields)")
            
            print("\n" + "=" * 60)
            print("✓ All Tests Passed! MySQL is working correctly.")
            print("=" * 60)
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"\n✗ Error: {e}")
        print("\nPlease check:")
        print("  1. MySQL server is running")
        print("  2. Database 'inspecpro' exists")
        print("  3. Credentials in .env are correct")
        print("  4. Tables have been created")
        return False
    
    return True

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
