import sqlite3
import json

# Connect to SQLite database
conn = sqlite3.connect('inspecpro.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Get Grafitect form
cursor.execute("SELECT * FROM forms WHERE form_name LIKE '%Grafitect%' OR form_name LIKE '%Inline%'")
forms = cursor.fetchall()

result = []
for form in forms:
    form_dict = dict(form)
    form_id = form_dict['id']
    
    # Get form fields
    cursor.execute("SELECT * FROM form_fields WHERE form_id = ? ORDER BY field_order", (form_id,))
    fields = cursor.fetchall()
    
    form_dict['fields'] = [dict(field) for field in fields]
    result.append(form_dict)

print(json.dumps(result, indent=2))

conn.close()
