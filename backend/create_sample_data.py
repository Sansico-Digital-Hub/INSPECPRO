#!/usr/bin/env python3
"""
Script to create sample data for InsPecPro
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, User, Form, FormField, Inspection, InspectionResponse
from auth import get_password_hash
from models import UserRole, FieldType, InspectionStatus

def create_sample_data():
    # Note: Tables already exist in MySQL, no need to create
    # Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Create sample users
        users_data = [
            {
                "user_id": "ADM001",
                "username": "admin",
                "email": "admin@inspecpro.com",
                "password": "admin123",
                "role": UserRole.admin,
                "plant": "Plant A",
                "line_process": "Line 1"
            },
            {
                "user_id": "USR001", 
                "username": "inspector1",
                "email": "inspector1@inspecpro.com",
                "password": "inspector123",
                "role": UserRole.user,
                "plant": "Plant A",
                "line_process": "Line 1"
            },
            {
                "user_id": "SUP001",
                "username": "supervisor1", 
                "email": "supervisor1@inspecpro.com",
                "password": "supervisor123",
                "role": UserRole.supervisor,
                "plant": "Plant A",
                "line_process": "Line 1"
            },
            {
                "user_id": "MGT001",
                "username": "manager1",
                "email": "manager1@inspecpro.com", 
                "password": "manager123",
                "role": UserRole.management,
                "plant": "Plant A",
                "line_process": "Line 1"
            }
        ]
        
        for user_data in users_data:
            # Check if user already exists
            existing_user = db.query(User).filter(User.username == user_data["username"]).first()
            if not existing_user:
                user = User(
                    user_id=user_data["user_id"],
                    username=user_data["username"],
                    email=user_data["email"],
                    password_hash=get_password_hash(user_data["password"]),
                    role=user_data["role"],
                    plant=user_data["plant"],
                    line_process=user_data["line_process"]
                )
                db.add(user)
                print(f"Created user: {user_data['username']}")
        
        db.commit()
        
        # Get admin user for form creation
        admin_user = db.query(User).filter(User.username == "admin").first()
        
        # Create sample forms
        forms_data = [
            {
                "form_name": "Quality Control Checklist",
                "description": "Standard quality control inspection form for production line",
                "fields": [
                    {"field_name": "Product ID", "field_type": FieldType.text, "is_required": True, "field_order": 1},
                    {"field_name": "Visual Inspection", "field_type": FieldType.dropdown, "field_options": {"options": ["Pass", "Fail"]}, "is_required": True, "field_order": 2},
                    {"field_name": "Measurement Check", "field_type": FieldType.measurement, "field_options": {"unit": "mm"}, "is_required": True, "field_order": 3},
                    {"field_name": "Photo Evidence", "field_type": FieldType.photo, "is_required": False, "field_order": 4},
                    {"field_name": "Inspector Notes", "field_type": FieldType.notes, "is_required": False, "field_order": 5}
                ]
            },
            {
                "form_name": "Safety Inspection Form", 
                "description": "Safety compliance inspection checklist",
                "fields": [
                    {"field_name": "Safety Equipment Check", "field_type": FieldType.dropdown, "field_options": {"options": ["Complete", "Incomplete"]}, "is_required": True, "field_order": 1},
                    {"field_name": "Emergency Exit Clear", "field_type": FieldType.dropdown, "field_options": {"options": ["Yes", "No"]}, "is_required": True, "field_order": 2},
                    {"field_name": "Safety Signature", "field_type": FieldType.signature, "is_required": True, "field_order": 3}
                ]
            }
        ]
        
        for form_data in forms_data:
            # Check if form already exists
            existing_form = db.query(Form).filter(Form.form_name == form_data["form_name"]).first()
            if not existing_form:
                form = Form(
                    form_name=form_data["form_name"],
                    description=form_data["description"],
                    created_by=admin_user.id
                )
                db.add(form)
                db.flush()  # Get the form ID
                
                # Add form fields
                for field_data in form_data["fields"]:
                    field = FormField(
                        form_id=form.id,
                        field_name=field_data["field_name"],
                        field_type=field_data["field_type"],
                        field_options=field_data.get("field_options"),
                        is_required=field_data["is_required"],
                        field_order=field_data["field_order"]
                    )
                    db.add(field)
                
                print(f"Created form: {form_data['form_name']}")
        
        db.commit()
        
        # Create sample inspections
        inspector = db.query(User).filter(User.username == "inspector1").first()
        forms = db.query(Form).all()
        
        if inspector and forms:
            for i, form in enumerate(forms[:2]):  # Create 2 sample inspections
                inspection = Inspection(
                    form_id=form.id,
                    inspector_id=inspector.id,
                    status=InspectionStatus.submitted if i == 0 else InspectionStatus.draft
                )
                db.add(inspection)
                db.flush()
                
                # Add sample responses
                for field in form.fields[:2]:  # Add responses for first 2 fields
                    response = InspectionResponse(
                        inspection_id=inspection.id,
                        field_id=field.id,
                        response_value="Sample response" if field.field_type == FieldType.text else "Pass"
                    )
                    db.add(response)
                
                print(f"Created sample inspection for form: {form.form_name}")
        
        db.commit()
        print("Sample data created successfully!")
        
    except Exception as e:
        print(f"Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_data()
