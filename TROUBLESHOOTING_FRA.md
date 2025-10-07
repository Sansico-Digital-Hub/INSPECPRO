# 🔍 Troubleshooting FRA Field

## Current Issue

FRA field hanya muncul sebagai dropdown biasa, tidak ada:
- ❌ Multiple field types (Search Dropdown, Notes)
- ❌ Conditional fields saat pilih "Yes"

---

## 🔍 Debug Steps

### Step 1: Check Browser Console

1. **Open Browser Console**: Press `F12`
2. **Go to Console tab**
3. **Refresh page**
4. **Look for log**: `Field: FRA Types: [...] Has Conditional: ... Rules: ...`

**Expected Output**:
```
Field: FRA 
Types: ["dropdown", "search_dropdown", "notes"]
Has Conditional: true
Rules: [{condition_value: "Yes", next_fields: [...]}]
```

**If you see**:
```
Field: FRA 
Types: ["dropdown"]
Has Conditional: false
Rules: []
```
→ **Problem**: Data tidak tersimpan di database!

---

### Step 2: Check Database

**Query**:
```sql
SELECT id, field_name, field_type, field_options 
FROM form_fields 
WHERE field_name LIKE '%FRA%';
```

**Expected**:
```json
{
  "id": 23,
  "field_name": "FRA",
  "field_type": "dropdown",
  "field_options": {
    "options": ["Yes", "No", "N/A"],
    "field_types": ["dropdown", "search_dropdown", "notes"],
    "has_conditional": true,
    "conditional_rules": [
      {
        "condition_value": "Yes",
        "next_fields": [...]
      }
    ]
  }
}
```

**If `field_options` is empty or missing keys**:
→ **Problem**: Form tidak tersimpan dengan benar!

---

### Step 3: Verify Form Save

1. **Go to Admin** → Forms → Edit Grafitect
2. **Find FRA field**
3. **Verify checkboxes**:
   - ☑️ Dropdown
   - ☑️ Search Dropdown
   - ☑️ Notes
4. **Verify Conditional Logic**:
   - ☑️ Enable Conditional Logic
   - Condition: "Yes"
   - Fields added
5. **Click "Update Form"**
6. **Check browser console** for save response
7. **Verify no errors**

---

## 🐛 Common Problems

### Problem 1: Hard Refresh Needed

**Solution**: 
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### Problem 2: Field Types Not Saving

**Check**:
- Admin page: Are checkboxes checked?
- Save button: Did you click it?
- Console: Any errors during save?

**Fix**: Re-check boxes and save again

### Problem 3: Conditional Logic Not Saving

**Check**:
- Is "Enable Conditional Logic" checked?
- Are conditional rules added?
- Are fields added to rules?

**Fix**: Add conditional rules again and save

### Problem 4: Database Not Updated

**Check**:
```sql
SELECT field_options FROM form_fields WHERE field_name LIKE '%FRA%';
```

**If empty**: Backend not saving correctly

**Fix**: Check backend logs for errors

---

## ✅ Quick Fix Checklist

- [ ] Hard refresh browser (Ctrl + Shift + R)
- [ ] Check browser console for field data
- [ ] Verify admin page checkboxes are checked
- [ ] Verify conditional logic is enabled
- [ ] Click "Update Form" button
- [ ] Check for save errors in console
- [ ] Query database to verify data
- [ ] Refresh inspection page
- [ ] Check console log again

---

## 🎯 Expected Behavior

### Admin Page:
```
FRA Field:
☑️ Dropdown
☑️ Search Dropdown
☑️ Notes

☑️ Enable Conditional Logic
If "Yes" → Show fields: [...]
```

### Inspector Page:
```
FRA *

Dropdown:
[Select ▼] Yes

Search dropdown:
[Search ▼] Yes

Notes:
ℹ️ Instructions...

(When "Yes" selected)
    ┃ Conditional Field 1
    ┃ Conditional Field 2
```

---

## 🔧 Manual Database Fix

If admin save doesn't work, manually update database:

```sql
UPDATE form_fields 
SET field_options = JSON_SET(
  field_options,
  '$.field_types', JSON_ARRAY('dropdown', 'search_dropdown', 'notes'),
  '$.has_conditional', true,
  '$.conditional_rules', JSON_ARRAY(
    JSON_OBJECT(
      'condition_value', 'Yes',
      'next_fields', JSON_ARRAY(
        JSON_OBJECT('field_name', 'FRA Details', 'field_type', 'text', 'is_required', true)
      )
    )
  )
)
WHERE field_name LIKE '%FRA%';
```

---

## 📝 Next Steps

1. **Open browser console** (F12)
2. **Refresh inspection page**
3. **Look for log**: `Field: FRA Types: ...`
4. **Share console output** untuk diagnosis lebih lanjut

**Console log akan menunjukkan exactly apa yang salah!**
