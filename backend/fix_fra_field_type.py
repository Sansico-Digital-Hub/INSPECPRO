#!/usr/bin/env python3
"""
Fix FRA field type from 'notes' to 'dropdown'
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import FormField
import json

def fix_fra_field():
    print("=" * 70)
    print("Fixing FRA Field Type")
    print("=" * 70)
    
    db = SessionLocal()
    
    try:
        # Find FRA field
        fra_field = db.query(FormField).filter(
            FormField.field_name.like('%FRA%')
        ).first()
        
        if not fra_field:
            print("✗ FRA field not found")
            return
        
        print(f"\n[BEFORE]")
        print(f"  Field ID: {fra_field.id}")
        print(f"  Field Name: {fra_field.field_name}")
        print(f"  Field Type: {fra_field.field_type.value}")
        print(f"  Field Options: {fra_field.field_options}")
        
        # Check if it has options (should be dropdown)
        if fra_field.field_options and 'options' in fra_field.field_options:
            print(f"\n✓ Field has options: {fra_field.field_options['options']}")
            print(f"  This should be a dropdown, not notes!")
            
            # Fix the field type
            fra_field.field_type = 'dropdown'  # or 'search_dropdown'
            
            db.commit()
            db.refresh(fra_field)
            
            print(f"\n[AFTER]")
            print(f"  Field ID: {fra_field.id}")
            print(f"  Field Name: {fra_field.field_name}")
            print(f"  Field Type: {fra_field.field_type.value}")
            print(f"  Field Options: {fra_field.field_options}")
            
            print(f"\n✓ FRA field type fixed successfully!")
            print(f"  Changed from 'notes' to 'dropdown'")
            
        else:
            print(f"\n✗ Field doesn't have options, might be correct as notes")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_fra_field()
