#!/usr/bin/env python3
"""
Script to check all users in database and reactivate original users
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import SessionLocal
from models import User

def check_and_fix_users():
    """Check all users and reactivate original users from inspecpro database"""
    
    # Create database session
    db: Session = SessionLocal()
    
    try:
        print("🔍 Checking all users in database...")
        
        # Get ALL users (active and inactive)
        all_users = db.query(User).all()
        
        if not all_users:
            print("❌ No users found in database!")
            return
        
        print(f"\n📋 All users in database ({len(all_users)} users):")
        print("┌─────┬─────────────────┬─────────────────────────────┬─────────────────┬─────────────┬────────┐")
        print("│ ID  │ Username        │ Email                       │ Role            │ User ID     │ Active │")
        print("├─────┼─────────────────┼─────────────────────────────┼─────────────────┼─────────────┼────────┤")
        
        original_users = []
        sample_users = []
        
        for user in all_users:
            active_status = "✅" if user.is_active else "❌"
            print(f"│ {user.id:<3} │ {user.username:<15} │ {user.email:<27} │ {user.role.value:<15} │ {user.user_id:<11} │ {active_status:<6} │")
            
            # Identify original users (those with USR prefix in user_id)
            if user.user_id and user.user_id.startswith("USR"):
                original_users.append(user)
            else:
                sample_users.append(user)
        
        print("└─────┴─────────────────┴─────────────────────────────┴─────────────────┴─────────────┴────────┘")
        
        print(f"\n📊 Analysis:")
        print(f"   • Original users (USR prefix): {len(original_users)}")
        print(f"   • Sample users: {len(sample_users)}")
        
        # Reactivate original users
        if original_users:
            print(f"\n🔄 Reactivating original users...")
            reactivated_count = 0
            
            for user in original_users:
                if not user.is_active:
                    user.is_active = True
                    reactivated_count += 1
                    print(f"✅ Reactivated: {user.username} (ID: {user.user_id})")
                else:
                    print(f"ℹ️  Already active: {user.username} (ID: {user.user_id})")
            
            if reactivated_count > 0:
                db.commit()
                print(f"\n🎉 Successfully reactivated {reactivated_count} original users!")
            else:
                print(f"\n✅ All original users were already active!")
        else:
            print(f"\n⚠️  No original users found with USR prefix!")
        
        # Show final active users
        active_users = db.query(User).filter(User.is_active == True).all()
        if active_users:
            print(f"\n📋 Active users after fix ({len(active_users)} users):")
            print("┌─────┬─────────────────┬─────────────────────────────┬─────────────────┬─────────────┐")
            print("│ ID  │ Username        │ Email                       │ Role            │ User ID     │")
            print("├─────┼─────────────────┼─────────────────────────────┼─────────────────┼─────────────┤")
            for user in active_users:
                print(f"│ {user.id:<3} │ {user.username:<15} │ {user.email:<27} │ {user.role.value:<15} │ {user.user_id:<11} │")
            print("└─────┴─────────────────┴─────────────────────────────┴─────────────────┴─────────────┘")
            
            print(f"\n🔑 Login credentials for testing:")
            for user in active_users:
                # Note: We can't show actual passwords since they're hashed
                print(f"   • Username: {user.username} | Role: {user.role.value}")
                print(f"     (Use original password from inspecpro database)")
        else:
            print(f"\n❌ No active users found!")
        
    except Exception as e:
        print(f"❌ Error checking users: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    check_and_fix_users()