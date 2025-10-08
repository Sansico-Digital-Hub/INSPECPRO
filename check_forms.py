#!/usr/bin/env python3
"""
Check forms in MySQL database
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from database import SessionLocal
from models import Form, FormField

def check_forms():
    """Check forms and form fields in MySQL database"""
    db = SessionLocal()
    
    try:
        # Check forms
        form_count = db.query(Form).count()
        print(f"Total forms in database: {form_count}")
        
        if form_count > 0:
            # Get recent forms
            recent_forms = db.query(Form).order_by(Form.created_at.desc()).limit(5).all()
            print("\nRecent forms:")
            for form in recent_forms:
                print(f"  ID: {form.id}, Name: {form.form_name}, Created: {form.created_at}")
        else:
            print("\n❌ NO FORMS FOUND IN DATABASE")
            print("\nThis means:")
            print("1. You haven't clicked 'Create Form' button yet")
            print("2. OR there was an error during form creation")
            print("3. OR the backend server is not running")
        
        # Check form fields
        field_count = db.query(FormField).count()
        print(f"\nTotal form fields in database: {field_count}")
        
    except Exception as e:
        print(f"\n❌ Error connecting to database: {e}")
        print("\nPlease check:")
        print("1. MySQL server is running")
        print("2. Database 'inspecpro' exists")
        print("3. Credentials in backend/.env are correct")
    finally:
        db.close()

if __name__ == "__main__":
    check_forms()
