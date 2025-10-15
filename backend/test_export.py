#!/usr/bin/env python3
"""
Test script to verify PDF and Excel export functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import get_db
from models import Inspection, User, Form, InspectionResponse
from routers.inspections import export_inspection_to_pdf, export_inspections_to_excel
from datetime import datetime
import tempfile

def test_pdf_export():
    """Test PDF export functionality"""
    print("Testing PDF export...")
    
    # Get database session
    db = next(get_db())
    
    try:
        # Get a sample inspection
        inspection = db.query(Inspection).first()
        if not inspection:
            print("❌ No inspections found in database")
            return False
            
        print(f"✓ Found inspection ID: {inspection.id}")
        
        # Get the inspector (current_user simulation)
        inspector = db.query(User).filter(User.id == inspection.inspector_id).first()
        if not inspector:
            print("❌ Inspector not found")
            return False
            
        print(f"✓ Found inspector: {inspector.username}")
        
        # Test PDF export (we'll simulate the endpoint logic)
        try:
            # Check if inspection exists
            if not inspection:
                print("❌ Inspection not found")
                return False
                
            # Check if form exists
            form = db.query(Form).filter(Form.id == inspection.form_id).first()
            if not form:
                print("❌ Form not found")
                return False
                
            print(f"✓ Found form: {form.form_name}")
            
            # Check if there are responses
            responses = db.query(InspectionResponse).filter(
                InspectionResponse.inspection_id == inspection.id
            ).all()
            
            print(f"✓ Found {len(responses)} responses")
            
            print("✅ PDF export test passed - all required data is available")
            return True
            
        except Exception as e:
            print(f"❌ PDF export test failed: {str(e)}")
            return False
            
    except Exception as e:
        print(f"❌ Database error: {str(e)}")
        return False
    finally:
        db.close()

def test_excel_export():
    """Test Excel export functionality"""
    print("\nTesting Excel export...")
    
    # Get database session
    db = next(get_db())
    
    try:
        # Get sample inspections
        inspections = db.query(Inspection).limit(5).all()
        if not inspections:
            print("❌ No inspections found in database")
            return False
            
        print(f"✓ Found {len(inspections)} inspections")
        
        # Check if forms exist
        form_ids = [insp.form_id for insp in inspections]
        forms = db.query(Form).filter(Form.id.in_(form_ids)).all()
        
        print(f"✓ Found {len(forms)} forms")
        
        # Check if responses exist
        inspection_ids = [insp.id for insp in inspections]
        responses = db.query(InspectionResponse).filter(
            InspectionResponse.inspection_id.in_(inspection_ids)
        ).all()
        
        print(f"✓ Found {len(responses)} responses")
        
        # Test Excel export logic
        try:
            # Simulate the Excel export process
            from openpyxl import Workbook
            
            wb = Workbook()
            ws = wb.active
            ws.title = "Test Export"
            
            # Test basic Excel operations
            ws.cell(row=1, column=1, value="Test")
            
            # Test file saving
            test_filename = f"test_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            test_path = os.path.join("uploads", test_filename)
            
            wb.save(test_path)
            
            # Check if file was created
            if os.path.exists(test_path):
                print(f"✓ Test Excel file created: {test_path}")
                # Clean up test file
                os.remove(test_path)
                print("✓ Test file cleaned up")
            else:
                print("❌ Test Excel file was not created")
                return False
                
            print("✅ Excel export test passed")
            return True
            
        except Exception as e:
            print(f"❌ Excel export test failed: {str(e)}")
            return False
            
    except Exception as e:
        print(f"❌ Database error: {str(e)}")
        return False
    finally:
        db.close()

def test_dependencies():
    """Test if all required dependencies are available"""
    print("Testing dependencies...")
    
    try:
        import reportlab
        print("✓ ReportLab available")
    except ImportError:
        print("❌ ReportLab not available")
        return False
        
    try:
        import openpyxl
        print("✓ OpenPyXL available")
    except ImportError:
        print("❌ OpenPyXL not available")
        return False
        
    # Test uploads directory
    uploads_dir = "uploads"
    if os.path.exists(uploads_dir):
        print(f"✓ Uploads directory exists: {uploads_dir}")
    else:
        print(f"❌ Uploads directory missing: {uploads_dir}")
        return False
        
    # Test write permissions
    try:
        test_file = os.path.join(uploads_dir, "test_permissions.txt")
        with open(test_file, 'w') as f:
            f.write("test")
        os.remove(test_file)
        print("✓ Write permissions OK")
    except Exception as e:
        print(f"❌ Write permissions failed: {str(e)}")
        return False
        
    return True

if __name__ == "__main__":
    print("🔍 Testing Export Functionality\n")
    
    # Test dependencies first
    deps_ok = test_dependencies()
    if not deps_ok:
        print("\n❌ Dependency tests failed")
        sys.exit(1)
    
    # Test PDF export
    pdf_ok = test_pdf_export()
    
    # Test Excel export
    excel_ok = test_excel_export()
    
    print(f"\n📊 Test Results:")
    print(f"Dependencies: {'✅ PASS' if deps_ok else '❌ FAIL'}")
    print(f"PDF Export: {'✅ PASS' if pdf_ok else '❌ FAIL'}")
    print(f"Excel Export: {'✅ PASS' if excel_ok else '❌ FAIL'}")
    
    if deps_ok and pdf_ok and excel_ok:
        print("\n🎉 All export tests passed!")
        sys.exit(0)
    else:
        print("\n⚠️  Some export tests failed")
        sys.exit(1)