#!/usr/bin/env python3
import sys
import json
sys.path.insert(0, 'backend')

from database import SessionLocal
from models import Form, FormField

db = SessionLocal()

# Get all forms
forms = db.query(Form).all()
print(f"\n{'='*70}")
print(f"FORMS IN DATABASE: {len(forms)}")
print(f"{'='*70}\n")

for form in forms:
    print(f"Form ID: {form.id}")
    print(f"  Name: {form.form_name}")
    print(f"  Description: {form.description}")
    print(f"  Active: {form.is_active}")
    print(f"  Fields: {len(form.fields)}")
    print(f"  Created by: {form.created_by}")
    
    # Check fields with conditional logic
    conditional_fields = [f for f in form.fields if f.field_options and 'conditional_logic' in str(f.field_options)]
    print(f"  Conditional Logic Fields: {len(conditional_fields)}")
    
    if conditional_fields:
        print(f"\n  Fields with Conditional Logic:")
        for field in conditional_fields:
            print(f"    - {field.field_name}")
            if field.field_options:
                print(f"      Options: {json.dumps(field.field_options, indent=8)}")
    print()

db.close()
