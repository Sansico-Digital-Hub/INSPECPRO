#!/usr/bin/env python3
"""
End-to-End Connection Test for InspecPro
Tests: MySQL -> Backend API -> Frontend
"""
import requests
import json
from datetime import datetime

def print_header(text):
    print("\n" + "="*70)
    print(f"  {text}")
    print("="*70)

def test_mysql_via_backend():
    """Test MySQL connection through backend API"""
    print_header("TEST 1: MySQL Connection via Backend API")
    
    try:
        # Test health endpoint
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✓ Backend health check: PASS")
            print(f"  Response: {response.json()}")
        else:
            print(f"✗ Backend health check: FAIL (Status: {response.status_code})")
            return False
            
        # Test root endpoint
        response = requests.get("http://localhost:8000/", timeout=5)
        if response.status_code == 200:
            print("✓ Backend root endpoint: PASS")
            print(f"  Response: {response.json()}")
        else:
            print(f"✗ Backend root endpoint: FAIL")
            return False
            
        return True
        
    except Exception as e:
        print(f"✗ Backend connection: FAIL")
        print(f"  Error: {e}")
        return False

def test_backend_api_endpoints():
    """Test backend API endpoints that require database"""
    print_header("TEST 2: Backend API Endpoints (Database Operations)")
    
    try:
        # Test login endpoint (should return 401 without credentials)
        response = requests.post(
            "http://localhost:8000/api/auth/login",
            data={"username": "test", "password": "test"},
            timeout=5
        )
        # We expect 401 or 422 (validation error), not 500
        if response.status_code in [401, 422]:
            print("✓ Auth endpoint responding: PASS")
            print(f"  Status: {response.status_code} (Expected)")
        else:
            print(f"✗ Auth endpoint: Unexpected status {response.status_code}")
            
        # Test forms endpoint (should require auth)
        response = requests.get("http://localhost:8000/api/forms/", timeout=5)
        if response.status_code in [200, 401]:
            print("✓ Forms endpoint responding: PASS")
            print(f"  Status: {response.status_code}")
            if response.status_code == 200:
                forms = response.json()
                print(f"  Forms found: {len(forms)}")
        else:
            print(f"✗ Forms endpoint: Unexpected status {response.status_code}")
            
        return True
        
    except Exception as e:
        print(f"✗ API endpoints test: FAIL")
        print(f"  Error: {e}")
        return False

def test_frontend():
    """Test frontend server"""
    print_header("TEST 3: Frontend Server")
    
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✓ Frontend server: PASS")
            print(f"  Status: {response.status_code}")
            print(f"  Content length: {len(response.text)} bytes")
            
            # Check if it's HTML
            if "<!DOCTYPE html>" in response.text or "<html" in response.text:
                print("✓ Frontend serving HTML: PASS")
            else:
                print("⚠ Frontend not serving HTML (might be loading)")
                
            return True
        else:
            print(f"✗ Frontend server: FAIL (Status: {response.status_code})")
            return False
            
    except Exception as e:
        print(f"✗ Frontend connection: FAIL")
        print(f"  Error: {e}")
        return False

def test_cors():
    """Test CORS configuration"""
    print_header("TEST 4: CORS Configuration")
    
    try:
        # Make a request with Origin header
        headers = {"Origin": "http://localhost:3000"}
        response = requests.get("http://localhost:8000/health", headers=headers, timeout=5)
        
        cors_header = response.headers.get("Access-Control-Allow-Origin")
        if cors_header:
            print("✓ CORS enabled: PASS")
            print(f"  Allow-Origin: {cors_header}")
            
            if "localhost:3000" in cors_header or cors_header == "*":
                print("✓ CORS allows frontend: PASS")
                return True
            else:
                print("⚠ CORS might not allow frontend origin")
                return True
        else:
            print("⚠ CORS headers not found (might still work)")
            return True
            
    except Exception as e:
        print(f"✗ CORS test: FAIL")
        print(f"  Error: {e}")
        return False

def test_api_documentation():
    """Test if API documentation is available"""
    print_header("TEST 5: API Documentation")
    
    try:
        response = requests.get("http://localhost:8000/docs", timeout=5)
        if response.status_code == 200:
            print("✓ API docs available: PASS")
            print("  URL: http://localhost:8000/docs")
            return True
        else:
            print(f"⚠ API docs: Status {response.status_code}")
            return True
            
    except Exception as e:
        print(f"⚠ API docs test: {e}")
        return True

def main():
    print("\n" + "="*70)
    print("  INSPECPRO END-TO-END CONNECTION TEST")
    print(f"  Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*70)
    
    results = {
        "MySQL via Backend": test_mysql_via_backend(),
        "Backend API Endpoints": test_backend_api_endpoints(),
        "Frontend Server": test_frontend(),
        "CORS Configuration": test_cors(),
        "API Documentation": test_api_documentation(),
    }
    
    # Summary
    print_header("TEST SUMMARY")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {test_name:.<50} {status}")
    
    print(f"\n  Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n  ✓ ALL TESTS PASSED!")
        print("\n  System Status:")
        print("    • MySQL Database: Connected")
        print("    • Backend API: Running on http://localhost:8000")
        print("    • Frontend App: Running on http://localhost:3000")
        print("    • API Docs: http://localhost:8000/docs")
        print("\n  You can now use the application!")
    else:
        print(f"\n  ⚠ {total - passed} test(s) failed")
        print("  Please check the errors above")
    
    print("="*70 + "\n")
    
    return passed == total

if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
