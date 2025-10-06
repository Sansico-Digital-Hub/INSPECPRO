import sqlite3

conn = sqlite3.connect('backend/inspecpro.db')
cursor = conn.cursor()

# Check forms
cursor.execute('SELECT COUNT(*) FROM forms')
form_count = cursor.fetchone()[0]
print(f"Total forms in database: {form_count}")

if form_count > 0:
    cursor.execute('SELECT id, form_name, created_at FROM forms ORDER BY created_at DESC LIMIT 5')
    print("\nRecent forms:")
    for row in cursor.fetchall():
        print(f"  ID: {row[0]}, Name: {row[1]}, Created: {row[2]}")
else:
    print("\n❌ NO FORMS FOUND IN DATABASE")
    print("\nThis means:")
    print("1. You haven't clicked 'Create Form' button yet")
    print("2. OR there was an error during form creation")
    print("3. OR the backend server is not running")

# Check form fields
cursor.execute('SELECT COUNT(*) FROM form_fields')
field_count = cursor.fetchone()[0]
print(f"\nTotal form fields in database: {field_count}")

conn.close()
