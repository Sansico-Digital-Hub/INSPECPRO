#!/usr/bin/env python3

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
INSPECTIONS_URL = f"{BASE_URL}/api/inspections"

# Test credentials
login_data = {
    "username_or_email": "admin",
    "password": "admin123"
}

def test_pdf_export():
    print("🔐 Logging in...")
    
    # Login to get token
    login_response = requests.post(LOGIN_URL, json=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        return
    
    print("✅ Login successful")
    
    # Get token
    token_data = login_response.json()
    token = token_data.get("access_token")
    
    if not token:
        print("❌ No access token received")
        return
    
    # Get available inspections
    print("📋 Getting available inspections...")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    inspections_response = requests.get(INSPECTIONS_URL, headers=headers)
    
    if inspections_response.status_code != 200:
        print(f"❌ Failed to get inspections: {inspections_response.status_code}")
        print(f"Response: {inspections_response.text}")
        return
    
    inspections = inspections_response.json()
    if not inspections:
        print("❌ No inspections found")
        return
    
    # Use the first inspection for testing
    inspection_id = inspections[0]["id"]
    print(f"📄 Testing PDF export for inspection ID: {inspection_id}")
    
    # Test PDF export
    pdf_export_url = f"{INSPECTIONS_URL}/{inspection_id}/export-pdf"
    export_response = requests.get(pdf_export_url, headers=headers)
    
    print(f"Status Code: {export_response.status_code}")
    
    if export_response.status_code == 200:
        print("✅ PDF export successful")
        print(f"Content-Type: {export_response.headers.get('content-type', 'N/A')}")
        print(f"Content-Length: {len(export_response.content)} bytes")
    else:
        print("❌ PDF export failed")
        print(f"Response: {export_response.text}")

if __name__ == "__main__":
    test_pdf_export()