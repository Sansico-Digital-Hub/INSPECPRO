import requests
import json

# Test the Excel export endpoint
def test_excel_export():
    # First login to get token
    login_url = "http://localhost:8000/api/auth/login"
    login_data = {
        "username_or_email": "admin",
        "password": "admin123"
    }
    
    print("🔐 Logging in...")
    login_response = requests.post(login_url, json=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return
    
    token = login_response.json()["access_token"]
    print("✅ Login successful")
    
    # Test Excel export
    excel_url = "http://localhost:8000/api/inspections/export-excel"
    headers = {"Authorization": f"Bearer {token}"}
    
    print("📊 Testing Excel export...")
    try:
        excel_response = requests.get(excel_url, headers=headers)
        print(f"Status Code: {excel_response.status_code}")
        
        if excel_response.status_code == 500:
            print("❌ 500 Error Response:")
            try:
                error_data = excel_response.json()
                print(json.dumps(error_data, indent=2))
            except:
                print("Raw response:", excel_response.text)
        elif excel_response.status_code == 200:
            print("✅ Excel export successful")
            print(f"Content-Type: {excel_response.headers.get('content-type')}")
            print(f"Content-Length: {len(excel_response.content)} bytes")
        else:
            print(f"❌ Unexpected status code: {excel_response.status_code}")
            print(excel_response.text)
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_excel_export()