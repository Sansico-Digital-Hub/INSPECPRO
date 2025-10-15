#!/usr/bin/env python3
"""
Test script to verify inspection form submission fixes
"""
import requests
import json

# API base URL
BASE_URL = "http://localhost:8000/api"

def test_login():
    """Test login with inspector1 credentials"""
    login_data = {
        "username_or_email": "inspector1@inspecpro.com",
        "password": "inspector123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"Login Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Login successful! Token type: {result.get('token_type')}")
        return result.get('access_token')
    else:
        print(f"Login failed: {response.text}")
        return None

def test_create_inspection(token):
    """Test creating an inspection with conditional fields"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Test inspection data with conditional fields
    inspection_data = {
        "form_id": 3,  # Assuming form ID 3 exists
        "responses": [
            {
                "field_id": 1,
                "response_value": "Test response",
                "measurement_value": None,
                "pass_hold_status": "pass"
            },
            {
                "field_id": None,  # Conditional field with NULL field_id
                "response_value": "Conditional field response",
                "measurement_value": None,
                "pass_hold_status": "hold"
            }
        ]
    }
    
    response = requests.post(f"{BASE_URL}/inspections/", 
                           headers=headers, 
                           json=inspection_data)
    
    print(f"Create Inspection Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Inspection created successfully! ID: {result.get('id')}")
        return result
    else:
        print(f"Inspection creation failed: {response.text}")
        return None

def main():
    print("🧪 Testing Inspection Form Submission Fixes")
    print("=" * 50)
    
    # Test login
    print("\n1. Testing Login...")
    token = test_login()
    
    if not token:
        print("❌ Login failed, cannot proceed with inspection test")
        return
    
    # Test inspection creation
    print("\n2. Testing Inspection Creation...")
    inspection = test_create_inspection(token)
    
    if inspection:
        print("✅ All tests passed! Fixes are working correctly.")
    else:
        print("❌ Inspection creation failed")

if __name__ == "__main__":
    main()