#!/usr/bin/env python3
"""
Test login credentials for InspecPro
"""
import requests
import json

API_URL = "http://localhost:8000"

def test_login(username, password):
    """Test login with given credentials"""
    print(f"\nTesting login: {username}")
    print("-" * 50)
    
    try:
        # Prepare login data
        data = {
            "username_or_email": username,
            "password": password
        }
        
        # Make login request
        response = requests.post(
            f"{API_URL}/api/auth/login",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ SUCCESS!")
            print(f"   Token: {result['access_token'][:50]}...")
            print(f"   Type: {result['token_type']}")
            
            # Test getting user info
            headers = {"Authorization": f"Bearer {result['access_token']}"}
            me_response = requests.get(f"{API_URL}/api/auth/me", headers=headers)
            
            if me_response.status_code == 200:
                user_info = me_response.json()
                print(f"   User: {user_info['username']}")
                print(f"   Email: {user_info['email']}")
                print(f"   Role: {user_info['role']}")
            
            return True
        else:
            print(f"❌ FAILED!")
            print(f"   Status: {response.status_code}")
            print(f"   Error: {response.json()}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def main():
    print("="*60)
    print("INSPECPRO LOGIN TEST")
    print("="*60)
    
    # Test credentials based on actual database users
    test_accounts = [
        ("admin", "admin123"),
        ("inspector1", "inspector123"),
        ("supervisor1", "supervisor123"),
        ("manager1", "manager123"),
    ]
    
    results = []
    for username, password in test_accounts:
        success = test_login(username, password)
        results.append((username, password, success))
    
    # Summary
    print("\n" + "="*60)
    print("LOGIN TEST SUMMARY")
    print("="*60)
    
    successful = sum(1 for _, _, success in results if success)
    
    print(f"\nWorking Credentials ({successful}/{len(results)}):")
    print("-" * 60)
    for username, password, success in results:
        if success:
            print(f"  ✅ Username: {username:15} Password: {password}")
    
    if successful < len(results):
        print(f"\nFailed Credentials ({len(results) - successful}/{len(results)}):")
        print("-" * 60)
        for username, password, success in results:
            if not success:
                print(f"  ❌ Username: {username:15} Password: {password}")
    
    print("\n" + "="*60)
    
    if successful > 0:
        print("\n✅ You can use any of the working credentials above to login!")
        print(f"\n   Frontend: http://localhost:3000/login")
    else:
        print("\n❌ No credentials worked! Check if:")
        print("   1. Backend server is running")
        print("   2. Database has users")
        print("   3. Passwords are correct")
    
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
