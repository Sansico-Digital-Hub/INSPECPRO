#!/usr/bin/env python3
"""
Test forms access and display
"""
import requests
import json

API_URL = "http://localhost:8000"

def test_forms_access():
    print("="*70)
    print("TESTING FORMS ACCESS")
    print("="*70)
    
    # Step 1: Login as admin
    print("\n[1/3] Logging in as admin...")
    login_response = requests.post(
        f"{API_URL}/api/auth/login",
        json={"username_or_email": "admin", "password": "admin123"}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return False
    
    token = login_response.json()["access_token"]
    print(f"✅ Login successful!")
    print(f"   Token: {token[:50]}...")
    
    # Step 2: Get forms
    print("\n[2/3] Fetching forms...")
    headers = {"Authorization": f"Bearer {token}"}
    forms_response = requests.get(f"{API_URL}/api/forms/", headers=headers)
    
    if forms_response.status_code != 200:
        print(f"❌ Failed to fetch forms: {forms_response.status_code}")
        print(f"   Error: {forms_response.text}")
        return False
    
    forms = forms_response.json()
    print(f"✅ Forms fetched successfully!")
    print(f"   Total forms: {len(forms)}")
    
    # Step 3: Display form details
    print("\n[3/3] Form Details:")
    print("-"*70)
    
    if len(forms) == 0:
        print("⚠️  No forms found in database")
        print("\nPossible reasons:")
        print("  1. No forms created yet")
        print("  2. All forms are inactive")
        return True
    
    for form in forms:
        print(f"\n📋 Form ID: {form['id']}")
        print(f"   Name: {form['form_name']}")
        print(f"   Description: {form['description']}")
        print(f"   Fields: {len(form.get('fields', []))}")
        print(f"   Created: {form['created_at']}")
        print(f"   Active: {form.get('is_active', True)}")
        
        # Check for conditional logic
        conditional_count = 0
        for field in form.get('fields', []):
            if field.get('field_options') and 'conditional_logic' in field.get('field_options', {}):
                conditional_count += 1
        
        if conditional_count > 0:
            print(f"   ✨ Conditional Logic: {conditional_count} fields")
        
        # Show first 5 fields
        if form.get('fields'):
            print(f"\n   First 5 Fields:")
            for i, field in enumerate(form['fields'][:5]):
                print(f"      {i+1}. {field['field_name']} ({field['field_type']})")
            
            if len(form['fields']) > 5:
                print(f"      ... and {len(form['fields']) - 5} more fields")
    
    print("\n" + "="*70)
    print("✅ FORMS ARE ACCESSIBLE!")
    print("="*70)
    print("\n📱 Access in browser:")
    print("   1. Go to: http://localhost:3000/login")
    print("   2. Login: admin / admin123")
    print("   3. Click 'Forms' in sidebar")
    print("   4. You should see the forms listed above!")
    print("\n" + "="*70)
    
    return True

if __name__ == "__main__":
    import sys
    success = test_forms_access()
    sys.exit(0 if success else 1)
