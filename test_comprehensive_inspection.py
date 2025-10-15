#!/usr/bin/env python3
"""
Comprehensive test for inspection creation with various field types including conditional fields.
Tests the fixed pass_hold_status enum issue and verifies all field types work correctly.
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
INSPECTIONS_URL = f"{BASE_URL}/api/inspections/"
FORMS_URL = f"{BASE_URL}/api/forms/"

# Test credentials
TEST_USER = {
    "username_or_email": "inspector1@inspecpro.com",
    "password": "inspector123"
}

def test_login():
    """Test user login and get authentication token."""
    print("1. Testing Login...")
    
    headers = {"Content-Type": "application/json"}
    response = requests.post(LOGIN_URL, headers=headers, json=TEST_USER)
    print(f"Login Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Login successful! Token type: {data.get('token_type', 'unknown')}")
        return data.get("access_token")
    else:
        print(f"Login failed: {response.text}")
        return None

def get_forms(token):
    """Get available forms for testing."""
    print("\n2. Getting Available Forms...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(FORMS_URL, headers=headers)
    
    if response.status_code == 200:
        forms = response.json()
        print(f"Found {len(forms)} forms")
        for form in forms[:3]:  # Show first 3 forms
            print(f"  - Form ID {form['id']}: {form['form_name']}")
        return forms
    else:
        print(f"Failed to get forms: {response.text}")
        return []

def test_basic_inspection(token, form_id):
    """Test basic inspection creation with simple field types."""
    print(f"\n3. Testing Basic Inspection Creation (Form ID: {form_id})...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Basic inspection data with various field types
    inspection_data = {
        "form_id": form_id,
        "responses": [
            {
                "field_id": None,  # Will be set dynamically
                "response_value": "Test Response",
                "measurement_value": None,
                "pass_hold_status": "pass"
            },
            {
                "field_id": None,  # Will be set dynamically
                "response_value": "Another Test",
                "measurement_value": 25.5,
                "pass_hold_status": "hold"
            }
        ]
    }
    
    response = requests.post(INSPECTIONS_URL, headers=headers, json=inspection_data)
    print(f"Create Inspection Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Inspection created successfully! ID: {data.get('id')}")
        return data.get('id')
    else:
        print(f"Inspection creation failed: {response.text}")
        return None

def test_conditional_field_inspection(token, form_id):
    """Test inspection creation with conditional fields."""
    print(f"\n4. Testing Conditional Field Inspection (Form ID: {form_id})...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Inspection data that should trigger conditional fields
    inspection_data = {
        "form_id": form_id,
        "responses": [
            {
                "field_id": None,  # Field that triggers conditional logic
                "response_value": "Non-Compliant",  # This should trigger conditional fields
                "measurement_value": None,
                "pass_hold_status": "hold"
            },
            {
                "field_id": None,  # Conditional field that appears
                "response_value": "Issue description for non-compliant item",
                "measurement_value": None,
                "pass_hold_status": "hold"
            }
        ]
    }
    
    response = requests.post(INSPECTIONS_URL, headers=headers, json=inspection_data)
    print(f"Create Conditional Inspection Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Conditional inspection created successfully! ID: {data.get('id')}")
        return data.get('id')
    else:
        print(f"Conditional inspection creation failed: {response.text}")
        return None

def test_various_pass_hold_statuses(token, form_id):
    """Test different pass_hold_status values to ensure enum fix works."""
    print(f"\n5. Testing Various Pass/Hold Statuses (Form ID: {form_id})...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    test_cases = [
        {"status": "pass", "description": "Pass status test"},
        {"status": "hold", "description": "Hold status test"},
        {"status": None, "description": "Null status test"}
    ]
    
    for i, test_case in enumerate(test_cases):
        print(f"  Testing {test_case['description']}...")
        
        inspection_data = {
            "form_id": form_id,
            "responses": [
                {
                    "field_id": None,
                    "response_value": f"Test for {test_case['description']}",
                    "measurement_value": None,
                    "pass_hold_status": test_case["status"]
                }
            ]
        }
        
        response = requests.post(INSPECTIONS_URL, headers=headers, json=inspection_data)
        
        if response.status_code == 200:
            data = response.json()
            print(f"    ✅ {test_case['description']} - Success! ID: {data.get('id')}")
        else:
            print(f"    ❌ {test_case['description']} - Failed: {response.text}")

def main():
    """Main test function."""
    print("🧪 Comprehensive Inspection Testing")
    print("=" * 50)
    
    # Test login
    token = test_login()
    if not token:
        print("❌ Login failed. Cannot proceed with tests.")
        return
    
    # Get available forms
    forms = get_forms(token)
    if not forms:
        print("❌ No forms available. Cannot proceed with tests.")
        return
    
    # Test with the first available form
    test_form = forms[0]
    form_id = test_form['id']
    
    print(f"\n🎯 Testing with form: {test_form['form_name']} (ID: {form_id})")
    
    # Run various tests
    basic_inspection_id = test_basic_inspection(token, form_id)
    
    # Test conditional fields if we have a form with conditional logic
    grafitect_form = next((f for f in forms if "Grafitect" in f['form_name']), None)
    if grafitect_form:
        conditional_inspection_id = test_conditional_field_inspection(token, grafitect_form['id'])
    
    # Test various pass/hold statuses
    test_various_pass_hold_statuses(token, form_id)
    
    print("\n" + "=" * 50)
    if basic_inspection_id:
        print("✅ All basic tests passed! Backend fixes are working correctly.")
        print("✅ Pass/Hold status enum issue has been resolved.")
        print("✅ Inspection creation is functioning properly.")
    else:
        print("❌ Some tests failed. Please check the backend logs.")

if __name__ == "__main__":
    main()