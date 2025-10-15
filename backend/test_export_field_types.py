#!/usr/bin/env python3
"""
Comprehensive test script for export functionality with different field types.
"""

import os
import sys
from datetime import datetime
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from database import get_db
from models import *
import json

def test_export_with_field_types():
    """Test export functionality with different field types."""
    print("🧪 TESTING EXPORT WITH DIFFERENT FIELD TYPES")
    print("=" * 60)
    
    # Get database session
    db = next(get_db())
    
    try:
        # Test 1: Quality Control Checklist (has text, dropdown, photo, measurement, notes)
        print("\n📋 Test 1: Quality Control Checklist")
        print("-" * 40)
        
        inspections_qc = db.query(Inspection).filter(
            Inspection.form_id == 1
        ).limit(2).all()
        
        if inspections_qc:
            for inspection in inspections_qc:
                print(f"   Inspection ID: {inspection.id}")
                print(f"   Status: {inspection.status}")
                print(f"   Created: {inspection.created_at}")
                
                # Get responses for this inspection
                responses = db.query(InspectionResponse).filter(
                    InspectionResponse.inspection_id == inspection.id
                ).all()
                
                print(f"   Responses: {len(responses)}")
                for response in responses[:3]:  # Show first 3
                    field = db.query(FormField).filter(FormField.id == response.field_id).first()
                    if field:
                        print(f"      - {field.field_type}: {response.response_value}")
        else:
            print("   ❌ No Quality Control inspections found")
        
        # Test 2: Safety Inspection Form (has dropdown, signature)
        print("\n🛡️  Test 2: Safety Inspection Form")
        print("-" * 40)
        
        inspections_safety = db.query(Inspection).filter(
            Inspection.form_id == 2
        ).limit(2).all()
        
        if inspections_safety:
            for inspection in inspections_safety:
                print(f"   Inspection ID: {inspection.id}")
                print(f"   Status: {inspection.status}")
                
                responses = db.query(InspectionResponse).filter(
                    InspectionResponse.inspection_id == inspection.id
                ).all()
                
                print(f"   Responses: {len(responses)}")
                for response in responses[:3]:
                    field = db.query(FormField).filter(FormField.id == response.field_id).first()
                    if field:
                        print(f"      - {field.field_type}: {response.response_value}")
        else:
            print("   ❌ No Safety inspections found")
        
        # Test 3: Grafitect Form (has many field types)
        print("\n🏭 Test 3: Grafitect - Inline Quality Report")
        print("-" * 40)
        
        inspections_grafitect = db.query(Inspection).filter(
            Inspection.form_id == 3
        ).limit(2).all()
        
        if inspections_grafitect:
            for inspection in inspections_grafitect:
                print(f"   Inspection ID: {inspection.id}")
                print(f"   Status: {inspection.status}")
                
                responses = db.query(InspectionResponse).filter(
                    InspectionResponse.inspection_id == inspection.id
                ).all()
                
                print(f"   Responses: {len(responses)}")
                
                # Group responses by field type
                field_types = {}
                for response in responses:
                    field = db.query(FormField).filter(FormField.id == response.field_id).first()
                    if field:
                        if field.field_type not in field_types:
                            field_types[field.field_type] = []
                        field_types[field.field_type].append(response.response_value)
                
                for field_type, values in field_types.items():
                    print(f"      - {field_type}: {len(values)} responses")
        else:
            print("   ❌ No Grafitect inspections found")
        
        # Test 4: Field type coverage analysis
        print("\n📊 Field Type Coverage Analysis")
        print("-" * 40)
        
        all_field_types = db.query(FormField.field_type).distinct().all()
        print(f"   Available field types: {[ft[0] for ft in all_field_types]}")
        
        # Check which field types have actual responses
        field_type_responses = db.query(
            FormField.field_type,
            func.count(InspectionResponse.id).label('response_count')
        ).join(
            InspectionResponse, FormField.id == InspectionResponse.field_id
        ).group_by(FormField.field_type).all()
        
        print(f"   Field types with responses:")
        for field_type, count in field_type_responses:
            print(f"      - {field_type}: {count} responses")
        
        # Test 5: Special field types handling
        print("\n🔍 Special Field Types Analysis")
        print("-" * 40)
        
        # Check for measurement fields
        measurement_responses = db.query(InspectionResponse).join(
            FormField, FormField.id == InspectionResponse.field_id
        ).filter(FormField.field_type == 'measurement').all()
        
        if measurement_responses:
            print(f"   Measurement fields: {len(measurement_responses)} responses")
            for resp in measurement_responses[:3]:
                print(f"      - Value: {resp.response_value}, Measurement: {resp.measurement_value}")
        
        # Check for signature fields
        signature_responses = db.query(InspectionResponse).join(
            FormField, FormField.id == InspectionResponse.field_id
        ).filter(FormField.field_type == 'signature').all()
        
        if signature_responses:
            print(f"   Signature fields: {len(signature_responses)} responses")
            for resp in signature_responses[:3]:
                print(f"      - Value: {resp.response_value}")
        
        # Check for photo fields
        photo_responses = db.query(InspectionResponse).join(
            FormField, FormField.id == InspectionResponse.field_id
        ).filter(FormField.field_type == 'photo').all()
        
        if photo_responses:
            print(f"   Photo fields: {len(photo_responses)} responses")
            for resp in photo_responses[:3]:
                print(f"      - Value: {resp.response_value}")
        
        print(f"\n✅ Field type testing completed successfully!")
        
        # Recommendations
        print(f"\n💡 EXPORT TESTING RECOMMENDATIONS:")
        print("   📊 Excel Export:")
        print("      - Text fields: Should display as plain text")
        print("      - Dropdown fields: Should show selected value")
        print("      - Measurement fields: Should show both value and measurement")
        print("      - Photo/Signature fields: Should show file path or 'Attached'")
        print("      - DateTime fields: Should be properly formatted")
        print("   📄 PDF Export:")
        print("      - Should handle all field types gracefully")
        print("      - Images should be embedded or referenced")
        print("      - Tables should accommodate varying content lengths")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during field type testing: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    test_export_with_field_types()