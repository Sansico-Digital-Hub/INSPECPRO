#!/usr/bin/env python3
"""
Simple API test script for InsPecPro
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_api():
    print("🧪 Testing InsPecPro API Endpoints...")
    
    # Test 1: Health check
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check: PASSED")
        else:
            print("❌ Health check: FAILED")
    except Exception as e:
        print(f"❌ Health check: ERROR - {e}")
    
    # Test 2: Root endpoint
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("✅ Root endpoint: PASSED")
        else:
            print("❌ Root endpoint: FAILED")
    except Exception as e:
        print(f"❌ Root endpoint: ERROR - {e}")
    
    # Test 3: API documentation
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ API Documentation: PASSED")
        else:
            print("❌ API Documentation: FAILED")
    except Exception as e:
        print(f"❌ API Documentation: ERROR - {e}")
    
    # Test 4: Try to access protected endpoint (should fail without auth)
    try:
        response = requests.get(f"{BASE_URL}/api/auth/me")
        if response.status_code == 401:
            print("✅ Protected endpoint security: PASSED")
        else:
            print("❌ Protected endpoint security: FAILED")
    except Exception as e:
        print(f"❌ Protected endpoint security: ERROR - {e}")
    
    print("\n🎉 API Testing Complete!")
    print(f"📖 View API documentation at: {BASE_URL}/docs")
    print(f"🔍 Interactive API explorer at: {BASE_URL}/redoc")

if __name__ == "__main__":
    test_api()
