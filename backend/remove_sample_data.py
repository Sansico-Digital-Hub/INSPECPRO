#!/usr/bin/env python3
"""
Remove Sample Data Script for InsPecPro
Removes the sample users that were created by create_sample_data.py
"""

import sys
import os
from sqlalchemy.orm import Session

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User

def remove_sample_users():
    """Remove sample users created by create_sample_data.py"""
    
    # Create database session
    db: Session = SessionLocal()
    
    try:
        # Sample user IDs that were created by the script
        sample_user_ids = ["ADM001", "INS001", "SUP001", "MGT001"]
        
        print("🗑️  Removing sample users...")
        
        # First, let's see what users exist
        all_users = db.query(User).all()
        print(f"\n📋 Current users in database ({len(all_users)} users):")
        print("┌─────┬─────────────────┬─────────────────────────────┬─────────────────┬─────────────┐")
        print("│ ID  │ Username        │ Email                       │ Role            │ User ID     │")
        print("├─────┼─────────────────┼─────────────────────────────┼─────────────────┼─────────────┤")
        for user in all_users:
            print(f"│ {user.id:<3} │ {user.username:<15} │ {user.email:<27} │ {user.role.value:<15} │ {user.user_id:<11} │")
        print("└─────┴─────────────────┴─────────────────────────────┴─────────────────┴─────────────┘")
        
        # Find and remove only the sample users we created
        removed_count = 0
        for user_id in sample_user_ids:
            user = db.query(User).filter(User.user_id == user_id).first()
            if user:
                print(f"🗑️  Found sample user: {user.username} (ID: {user.id}, User ID: {user.user_id})")
                
                # Check if user has any related data that would prevent deletion
                from models import Form, Inspection
                
                # Check forms created by this user
                forms_count = db.query(Form).filter(Form.created_by == user.id).count()
                inspections_count = db.query(Inspection).filter(
                    (Inspection.inspector_id == user.id) | (Inspection.reviewed_by == user.id)
                ).count()
                
                if forms_count > 0 or inspections_count > 0:
                    print(f"⚠️  Cannot delete {user.username}: has {forms_count} forms and {inspections_count} inspections")
                    # Instead of deleting, just deactivate
                    user.is_active = False
                    print(f"✅ Deactivated user: {user.username}")
                else:
                    db.delete(user)
                    print(f"✅ Deleted user: {user.username}")
                
                removed_count += 1
        
        if removed_count == 0:
            print("ℹ️  No sample users found to remove (they may have already been removed)")
        
        # Commit all changes
        db.commit()
        print(f"\n🎉 Sample data cleanup completed! Processed {removed_count} users.")
        
        # Show remaining active users
        remaining_users = db.query(User).filter(User.is_active == True).all()
        if remaining_users:
            print(f"\n📋 Active users in database ({len(remaining_users)} users):")
            print("┌─────┬─────────────────┬─────────────────────────────┬─────────────────┬─────────────┐")
            print("│ ID  │ Username        │ Email                       │ Role            │ User ID     │")
            print("├─────┼─────────────────┼─────────────────────────────┼─────────────────┼─────────────┤")
            for user in remaining_users:
                print(f"│ {user.id:<3} │ {user.username:<15} │ {user.email:<27} │ {user.role.value:<15} │ {user.user_id:<11} │")
            print("└─────┴─────────────────┴─────────────────────────────┴─────────────────┴─────────────┘")
        else:
            print("\n⚠️  No active users remaining in database!")
        
    except Exception as e:
        print(f"❌ Error removing sample data: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🔧 InsPecPro Sample Data Remover")
    print("=" * 40)
    remove_sample_users()