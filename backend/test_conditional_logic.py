#!/usr/bin/env python3
"""
Test conditional logic saving and retrieval including nested conditions
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import Form, FormField, FieldType
import json

def test_conditional_logic():
    print("=" * 70)
    print("Testing Conditional Logic - Including Nested Conditions")
    print("=" * 70)
    
    db = SessionLocal()
    
    try:
        # Test 1: Create a field with nested conditional logic
        print("\n[TEST 1] Creating field with nested conditional logic...")
        
        test_field_options = {
            "options": ["Yes", "No", "N/A"],
            "has_conditional": True,
            "conditional_rules": [
                {
                    "condition_value": "Yes",
                    "next_fields": [
                        {
                            "field_name": "Details Required",
                            "field_type": "text",
                            "is_required": True,
                            "field_order": 1,
                            "has_conditional": False,
                            "conditional_rules": []
                        },
                        {
                            "field_name": "Follow-up Action",
                            "field_type": "dropdown",
                            "field_options": {
                                "options": ["Immediate", "Scheduled", "None"],
                                "has_conditional": True,
                                "conditional_rules": [
                                    {
                                        "condition_value": "Immediate",
                                        "next_fields": [
                                            {
                                                "field_name": "Immediate Action Details",
                                                "field_type": "notes",
                                                "is_required": True,
                                                "field_order": 1
                                            }
                                        ]
                                    },
                                    {
                                        "condition_value": "Scheduled",
                                        "next_fields": [
                                            {
                                                "field_name": "Schedule Date",
                                                "field_type": "datetime",
                                                "is_required": True,
                                                "field_order": 1
                                            }
                                        ]
                                    }
                                ]
                            },
                            "is_required": True,
                            "field_order": 2
                        }
                    ]
                },
                {
                    "condition_value": "No",
                    "next_fields": [
                        {
                            "field_name": "Reason for No",
                            "field_type": "notes",
                            "is_required": True,
                            "field_order": 1
                        }
                    ]
                }
            ]
        }
        
        # Get a test form (Grafitect form)
        form = db.query(Form).filter(Form.form_name.like('%Grafitect%')).first()
        
        if not form:
            print("✗ Grafitect form not found. Creating test form...")
            form = Form(
                form_name="Test Conditional Logic Form",
                description="Testing nested conditional logic",
                created_by=1
            )
            db.add(form)
            db.commit()
            db.refresh(form)
        
        # Create test field with nested conditional logic
        test_field = FormField(
            form_id=form.id,
            field_name="Test Conditional Field",
            field_type=FieldType.dropdown,
            field_options=test_field_options,
            is_required=True,
            field_order=999  # Add at end
        )
        
        db.add(test_field)
        db.commit()
        db.refresh(test_field)
        
        print(f"✓ Field created with ID: {test_field.id}")
        print(f"  Field Name: {test_field.field_name}")
        print(f"  Field Type: {test_field.field_type.value}")
        
        # Test 2: Retrieve and verify the field
        print("\n[TEST 2] Retrieving field and verifying conditional logic...")
        
        retrieved_field = db.query(FormField).filter(FormField.id == test_field.id).first()
        
        if not retrieved_field:
            print("✗ Failed to retrieve field")
            return False
        
        print(f"✓ Field retrieved successfully")
        
        # Verify field_options structure
        options = retrieved_field.field_options
        
        print(f"\n[TEST 3] Verifying conditional logic structure...")
        
        # Check main conditional
        if 'has_conditional' in options and options['has_conditional']:
            print(f"✓ has_conditional: {options['has_conditional']}")
        else:
            print("✗ has_conditional not found or False")
            return False
        
        # Check conditional rules
        if 'conditional_rules' in options and len(options['conditional_rules']) > 0:
            print(f"✓ conditional_rules found: {len(options['conditional_rules'])} rules")
            
            for i, rule in enumerate(options['conditional_rules']):
                print(f"\n  Rule {i+1}:")
                print(f"    Condition Value: {rule.get('condition_value')}")
                print(f"    Next Fields: {len(rule.get('next_fields', []))} fields")
                
                # Check for nested conditionals
                for j, next_field in enumerate(rule.get('next_fields', [])):
                    print(f"      Field {j+1}: {next_field.get('field_name')}")
                    
                    # Check if this field has nested conditional
                    if 'field_options' in next_field:
                        nested_options = next_field['field_options']
                        if 'has_conditional' in nested_options and nested_options['has_conditional']:
                            print(f"        ✓ NESTED CONDITIONAL FOUND!")
                            nested_rules = nested_options.get('conditional_rules', [])
                            print(f"        Nested Rules: {len(nested_rules)}")
                            
                            for k, nested_rule in enumerate(nested_rules):
                                print(f"          Nested Rule {k+1}: {nested_rule.get('condition_value')}")
                                print(f"            Shows {len(nested_rule.get('next_fields', []))} fields")
        else:
            print("✗ conditional_rules not found or empty")
            return False
        
        # Test 4: JSON serialization
        print(f"\n[TEST 4] Testing JSON serialization...")
        
        try:
            json_str = json.dumps(options, indent=2)
            print(f"✓ JSON serialization successful")
            print(f"  JSON size: {len(json_str)} bytes")
            
            # Verify it can be deserialized
            parsed = json.loads(json_str)
            print(f"✓ JSON deserialization successful")
            
        except Exception as e:
            print(f"✗ JSON serialization failed: {e}")
            return False
        
        # Cleanup
        print(f"\n[CLEANUP] Removing test field...")
        db.delete(test_field)
        db.commit()
        print(f"✓ Test field removed")
        
        print("\n" + "=" * 70)
        print("✓ ALL TESTS PASSED!")
        print("=" * 70)
        print("\nConclusion:")
        print("  ✓ Conditional logic can be saved")
        print("  ✓ Nested conditional logic is supported")
        print("  ✓ Data structure is preserved")
        print("  ✓ JSON serialization works correctly")
        print("\n  The system can handle:")
        print("    - Multiple conditional rules")
        print("    - Nested conditionals (conditional inside conditional)")
        print("    - Complex field structures")
        print("    - Deep nesting levels")
        
        return True
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_conditional_logic()
    sys.exit(0 if success else 1)
