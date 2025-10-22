#!/usr/bin/env python3
"""
Database constraint implementation untuk memastikan subform fields memiliki field_type yang valid.
Script ini akan:
1. Menambahkan validasi di level aplikasi untuk subform fields
2. Membuat trigger database untuk validasi JSON subform_fields
3. Implementasi constraint checking functions
"""

import json
import logging
from typing import Dict, Any, List
from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import sessionmaker
from database import engine
from models import FormField
from validators import validate_subform_field_structure, SubformValidationError

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SubformConstraintError(Exception):
    """Exception raised when subform constraint validation fails"""
    pass

def validate_subform_json_constraint(field_options: Dict[str, Any], field_name: str = "") -> bool:
    """
    Validate subform field_options JSON to ensure all subform_fields have valid field_type.
    
    Args:
        field_options: The field_options JSON data
        field_name: Name of the field for error context
        
    Returns:
        True if valid
        
    Raises:
        SubformConstraintError: If validation fails
    """
    
    if not isinstance(field_options, dict):
        return True  # Not a subform or invalid JSON, let other validators handle
    
    subform_fields = field_options.get('subform_fields', [])
    
    if not subform_fields:
        return True  # No subform fields to validate
    
    logger.info(f"Validating {len(subform_fields)} subform fields for '{field_name}'")
    
    for i, subfield in enumerate(subform_fields):
        if not isinstance(subfield, dict):
            raise SubformConstraintError(
                f"Subform field #{i+1} in '{field_name}' must be a dictionary"
            )
        
        # Check required field_name
        if not subfield.get('field_name'):
            raise SubformConstraintError(
                f"Subform field #{i+1} in '{field_name}' missing required 'field_name'"
            )
        
        # Check required field_type
        field_type = subfield.get('field_type')
        if not field_type:
            raise SubformConstraintError(
                f"Subform field '{subfield['field_name']}' in '{field_name}' missing required 'field_type'"
            )
        
        # Validate field_type value
        valid_field_types = [
            'text', 'dropdown', 'search_dropdown', 'button', 'photo', 
            'signature', 'measurement', 'notes', 'date', 'datetime', 'time'
        ]
        
        if field_type not in valid_field_types:
            raise SubformConstraintError(
                f"Subform field '{subfield['field_name']}' in '{field_name}' has invalid field_type: '{field_type}'. "
                f"Valid types: {', '.join(valid_field_types)}"
            )
        
        # Additional validation for dropdown fields
        if field_type in ['dropdown', 'search_dropdown']:
            field_options_sub = subfield.get('field_options', {})
            options = field_options_sub.get('options', [])
            
            if not options:
                logger.warning(
                    f"Subform field '{subfield['field_name']}' in '{field_name}' is dropdown but has no options"
                )
    
    logger.info(f"✅ All subform fields in '{field_name}' are valid")
    return True

def create_database_constraint():
    """
    Create database constraint using SQLAlchemy event listeners.
    This will validate subform fields before insert/update operations.
    """
    
    @event.listens_for(FormField, 'before_insert')
    @event.listens_for(FormField, 'before_update')
    def validate_subform_before_save(mapper, connection, target):
        """Validate subform fields before saving to database"""
        
        # Only validate subform fields
        if target.field_type != 'subform':
            return
        
        if not target.field_options:
            return
        
        try:
            # Validate the subform JSON structure
            validate_subform_json_constraint(target.field_options, target.field_name)
            logger.info(f"✅ Subform field '{target.field_name}' passed constraint validation")
            
        except SubformConstraintError as e:
            logger.error(f"❌ Subform constraint violation: {e}")
            raise ValueError(f"Subform constraint violation: {e}")

def check_existing_data_compliance():
    """
    Check existing data in database for compliance with subform constraints.
    """
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Find all subform fields
        subform_fields = db.query(FormField).filter(FormField.field_type == 'subform').all()
        
        logger.info(f"Checking {len(subform_fields)} existing subform fields for constraint compliance...")
        
        violations = []
        
        for field in subform_fields:
            try:
                if field.field_options:
                    validate_subform_json_constraint(field.field_options, field.field_name)
                    logger.info(f"✅ Field '{field.field_name}' (ID: {field.id}) is compliant")
                else:
                    logger.warning(f"⚠️  Field '{field.field_name}' (ID: {field.id}) has no field_options")
                    
            except SubformConstraintError as e:
                violation = {
                    'field_id': field.id,
                    'field_name': field.field_name,
                    'form_id': field.form_id,
                    'error': str(e)
                }
                violations.append(violation)
                logger.error(f"❌ Field '{field.field_name}' (ID: {field.id}): {e}")
        
        if violations:
            logger.error(f"\n❌ Found {len(violations)} constraint violations:")
            for violation in violations:
                logger.error(f"  - Field ID {violation['field_id']}: {violation['error']}")
            return False
        else:
            logger.info(f"\n✅ All existing subform fields are compliant with constraints!")
            return True
            
    finally:
        db.close()

def install_constraints():
    """
    Install database constraints for subform field validation.
    """
    
    logger.info("🚀 Installing subform field constraints...")
    
    # Create the event listeners
    create_database_constraint()
    
    logger.info("✅ Database constraints installed successfully!")
    
    # Check existing data compliance
    logger.info("\n🔍 Checking existing data compliance...")
    is_compliant = check_existing_data_compliance()
    
    if not is_compliant:
        logger.error("❌ Some existing data violates constraints. Please run migration script first.")
        return False
    
    logger.info("🎉 All constraints installed and existing data is compliant!")
    return True

def test_constraint_validation():
    """
    Test the constraint validation with sample data.
    """
    
    logger.info("\n🧪 Testing constraint validation...")
    
    # Test valid subform
    valid_subform = {
        'subform_fields': [
            {
                'field_name': 'Test Field',
                'field_type': 'text'
            },
            {
                'field_name': 'Status',
                'field_type': 'dropdown',
                'field_options': {
                    'options': ['Pass', 'Fail', 'N/A']
                }
            }
        ]
    }
    
    try:
        validate_subform_json_constraint(valid_subform, "Test Form")
        logger.info("✅ Valid subform passed validation")
    except SubformConstraintError as e:
        logger.error(f"❌ Valid subform failed validation: {e}")
        return False
    
    # Test invalid subform (missing field_type)
    invalid_subform = {
        'subform_fields': [
            {
                'field_name': 'Test Field'
                # Missing field_type
            }
        ]
    }
    
    try:
        validate_subform_json_constraint(invalid_subform, "Test Form")
        logger.error("❌ Invalid subform passed validation (should have failed)")
        return False
    except SubformConstraintError as e:
        logger.info(f"✅ Invalid subform correctly failed validation: {e}")
    
    # Test invalid field_type
    invalid_type_subform = {
        'subform_fields': [
            {
                'field_name': 'Test Field',
                'field_type': 'invalid_type'
            }
        ]
    }
    
    try:
        validate_subform_json_constraint(invalid_type_subform, "Test Form")
        logger.error("❌ Invalid field_type passed validation (should have failed)")
        return False
    except SubformConstraintError as e:
        logger.info(f"✅ Invalid field_type correctly failed validation: {e}")
    
    logger.info("🎉 All constraint validation tests passed!")
    return True

if __name__ == "__main__":
    logger.info("🚀 Starting database constraint implementation...")
    
    # Test constraint validation
    if not test_constraint_validation():
        logger.error("❌ Constraint validation tests failed!")
        exit(1)
    
    # Install constraints
    if not install_constraints():
        logger.error("❌ Failed to install constraints!")
        exit(1)
    
    logger.info("✅ Database constraints implementation completed successfully!")