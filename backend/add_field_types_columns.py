"""
Migration script to add field_types and placeholder_text columns to form_fields table
Run this script once to update the database schema
"""

import pymysql
from database import SQLALCHEMY_DATABASE_URL

# Extract connection details from DATABASE_URL
# Format: mysql+pymysql://user:password@host:port/database
url_parts = SQLALCHEMY_DATABASE_URL.replace('mysql+pymysql://', '').split('@')
user_pass = url_parts[0].split(':')
host_db = url_parts[1].split('/')

username = user_pass[0]
password = user_pass[1]
host_port = host_db[0].split(':')
host = host_port[0]
port = int(host_port[1]) if len(host_port) > 1 else 3306
database = host_db[1]

# Connect to database
connection = pymysql.connect(
    host=host,
    port=port,
    user=username,
    password=password,
    database=database
)

try:
    with connection.cursor() as cursor:
        # Add field_types column (JSON)
        print("Adding field_types column...")
        cursor.execute("""
            ALTER TABLE form_fields 
            ADD COLUMN IF NOT EXISTS field_types JSON AFTER field_type
        """)
        
        # Add placeholder_text column (TEXT)
        print("Adding placeholder_text column...")
        cursor.execute("""
            ALTER TABLE form_fields 
            ADD COLUMN IF NOT EXISTS placeholder_text TEXT AFTER field_options
        """)
        
        connection.commit()
        print("✅ Migration completed successfully!")
        print("   - Added field_types column (JSON)")
        print("   - Added placeholder_text column (TEXT)")
        
except Exception as e:
    print(f"❌ Migration failed: {e}")
    connection.rollback()
finally:
    connection.close()
