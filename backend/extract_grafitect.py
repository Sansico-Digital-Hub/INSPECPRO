#!/usr/bin/env python3
"""
Extract Grafitect form data from MySQL database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import json
from database import SessionLocal
from models import Form, FormField

def extract_grafitect_forms():
    """Extract Grafitect forms from MySQL database"""
    db = SessionLocal()
    
    try:
        # Get Grafitect forms
        forms = db.query(Form).filter(
            (Form.form_name.like('%Grafitect%')) | 
            (Form.form_name.like('%Inline%'))
        ).all()
        
        result = []
        for form in forms:
            form_dict = {
                'id': form.id,
                'form_name': form.form_name,
                'description': form.description,
                'created_by': form.created_by,
                'created_at': form.created_at.isoformat() if form.created_at else None,
                'updated_at': form.updated_at.isoformat() if form.updated_at else None
            }
            
            # Get form fields
            fields = db.query(FormField).filter(
                FormField.form_id == form.id
            ).order_by(FormField.field_order).all()
            
            form_dict['fields'] = [
                {
                    'id': field.id,
                    'form_id': field.form_id,
                    'field_name': field.field_name,
                    'field_type': field.field_type.value if hasattr(field.field_type, 'value') else field.field_type,
                    'field_options': field.field_options,
                    'is_required': field.is_required,
                    'field_order': field.field_order,
                    'conditional_logic': field.conditional_logic
                }
                for field in fields
            ]
            result.append(form_dict)
        
        print(json.dumps(result, indent=2))
        return result
        
    except Exception as e:
        print(f"Error extracting forms: {e}")
        return []
    finally:
        db.close()

if __name__ == "__main__":
    extract_grafitect_forms()
