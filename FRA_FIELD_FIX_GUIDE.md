# 🐛 FRA Field Not Showing Conditional Logic - FIX GUIDE

## Date: October 6, 2025, 16:27 WIB

---

## 🐛 Problem Found!

**FRA field tidak menampilkan conditional logic karena field type SALAH!**

### Current State (WRONG):
```json
{
  "id": 23,
  "field_name": "FRA ",
  "field_type": "notes",  ← ❌ WRONG!
  "field_options": {
    "options": ["Yes", "No", "N/A"]  ← Has options but type is notes!
  }
}
```

### Expected State (CORRECT):
```json
{
  "id": 23,
  "field_name": "FRA ",
  "field_type": "dropdown",  ← ✅ CORRECT!
  "field_options": {
    "options": ["Yes", "No", "N/A"],
    "has_conditional": true,
    "conditional_rules": [...]
  }
}
```

---

## 🔍 Root Cause

Field "FRA" di database memiliki:
- **field_type**: `notes` ❌
- **field_options**: `{"options": ["Yes", "No", "N/A"]}` ✓

**Masalah**: Field dengan options seharusnya `dropdown` atau `search_dropdown`, bukan `notes`!

**Akibat**: 
- Inspector page render sebagai Notes (read-only)
- Tidak ada dropdown untuk select
- Conditional logic tidak muncul

---

## ✅ Solution Options

### Option 1: Fix via Admin UI (RECOMMENDED)

1. **Login as Admin**
2. **Go to Forms** → Edit "Grafitect - Inline Quality Report"
3. **Find FRA field**
4. **Change Field Type**:
   - Uncheck "Notes"
   - Check "Dropdown" or "Search Dropdown"
5. **Verify Options**: Yes, No, N/A
6. **Enable Conditional Logic**
7. **Add Conditional Rules**
8. **Save Form**

---

### Option 2: Fix via Database (FAST)

**SQL Query**:
```sql
UPDATE form_fields 
SET field_type = 'dropdown'
WHERE field_name LIKE '%FRA%' 
AND field_type = 'notes';
```

**Steps**:
1. Open MySQL client
2. Connect to database
3. Run query above
4. Verify: `SELECT * FROM form_fields WHERE field_name LIKE '%FRA%';`
5. Refresh admin page

---

### Option 3: Fix via Python Script

**Run**:
```bash
cd backend
python fix_fra_field_type.py
```

**Script will**:
1. Find FRA field
2. Check if it has options
3. Change type from 'notes' to 'dropdown'
4. Commit changes

---

## 🎯 After Fix

### Admin Page Will Show:
```
┌─────────────────────────────────────┐
│ Field 21 - FRA                      │
├─────────────────────────────────────┤
│ Field Type(s):                      │
│ ☑️ Dropdown                         │ ← CHECKED!
│                                     │
│ Options:                            │
│ • Yes                               │
│ • No                                │
│ • N/A                               │
│                                     │
│ ☑️ Enable Conditional Logic         │
│                                     │
│ Conditional Rules:                  │
│ If "Yes" → Show fields...           │
└─────────────────────────────────────┘
```

### Inspector Page Will Show:
```
┌─────────────────────────────────────┐
│ FRA *                               │
│ [Select an option ▼]                │ ← DROPDOWN!
│   • Yes                             │
│   • No                              │
│   • N/A                             │
└─────────────────────────────────────┘

(When "Yes" selected)
┌─────────────────────────────────────┐
│ FRA *                               │
│ [Yes ▼]                             │
│                                     │
│    ┃ FRA Details                    │ ← CONDITIONAL FIELDS!
│    ┃ FRA Photo                      │
└─────────────────────────────────────┘
```

---

## 🔧 Why This Happened

**Possible causes**:
1. Form was created with wrong field type
2. Field type was changed manually in database
3. Import/migration issue
4. Admin accidentally selected "Notes" instead of "Dropdown"

---

## ✅ Verification Steps

After fixing:

1. **Check Database**:
   ```sql
   SELECT id, field_name, field_type, field_options 
   FROM form_fields 
   WHERE field_name LIKE '%FRA%';
   ```
   Should show: `field_type = 'dropdown'`

2. **Check Admin Page**:
   - Edit form
   - Find FRA field
   - Verify "Dropdown" is checked
   - Verify options are visible

3. **Check Inspector Page**:
   - Create new inspection
   - Find FRA field
   - Should show dropdown (not notes)
   - Select option
   - Conditional fields should appear

---

## 📝 Summary

**Problem**: FRA field type is 'notes' but has dropdown options  
**Solution**: Change field type to 'dropdown'  
**Method**: Admin UI, SQL query, or Python script  
**Result**: Conditional logic will work!  

---

## 🚀 Quick Fix (FASTEST)

**If you have database access**:

```sql
-- Fix FRA field type
UPDATE form_fields 
SET field_type = 'dropdown'
WHERE id = 23;

-- Verify
SELECT * FROM form_fields WHERE id = 23;
```

**Then refresh admin page and inspector page!**

---

**After fix, FRA conditional logic will work perfectly!** ✅
