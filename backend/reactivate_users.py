#!/usr/bin/env python3
"""
Script to reactivate existing users so we can use them for login
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import SessionLocal
from models import User

def reactivate_users():
    """Reactivate all existing users"""
    
    # Create database session
    db: Session = SessionLocal()
    
    try:
        print("🔄 Reactivating all existing users...")
        
        # Get ALL users (active and inactive)
        all_users = db.query(User).all()
        
        if not all_users:
            print("❌ No users found in database!")
            return
        
        print(f"\n📋 Found {len(all_users)} users in database:")
        
        reactivated_count = 0
        for user in all_users:
            if not user.is_active:
                user.is_active = True
                reactivated_count += 1
                print(f"✅ Reactivated: {user.username} (Role: {user.role.value})")
            else:
                print(f"ℹ️  Already active: {user.username} (Role: {user.role.value})")
        
        if reactivated_count > 0:
            db.commit()
            print(f"\n🎉 Successfully reactivated {reactivated_count} users!")
        else:
            print(f"\n✅ All users were already active!")
        
        # Show all active users
        active_users = db.query(User).filter(User.is_active == True).all()
        if active_users:
            print(f"\n📋 Active users ({len(active_users)} users):")
            print("┌─────┬─────────────────┬─────────────────────────────┬─────────────────┬─────────────┐")
            print("│ ID  │ Username        │ Email                       │ Role            │ User ID     │")
            print("├─────┼─────────────────┼─────────────────────────────┼─────────────────┼─────────────┤")
            for user in active_users:
                print(f"│ {user.id:<3} │ {user.username:<15} │ {user.email:<27} │ {user.role.value:<15} │ {user.user_id:<11} │")
            print("└─────┴─────────────────┴─────────────────────────────┴─────────────────┴─────────────┘")
            
            print(f"\n🔑 Available users for login:")
            print(f"   Note: These users have the original passwords from the inspecpro database")
            for user in active_users:
                print(f"   • Username: {user.username}")
                print(f"     Role: {user.role.value}")
                print(f"     Email: {user.email}")
                print()
        else:
            print(f"\n❌ No active users found!")
        
    except Exception as e:
        print(f"❌ Error reactivating users: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    reactivate_users()