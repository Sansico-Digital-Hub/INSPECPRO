# Conditional Logic Troubleshooting Guide

## ✅ Fixes Applied

### 1. **Data Extraction from Database**
- ✅ Added `normalizeField()` function to extract conditional logic from `field_options`
- ✅ Recursive extraction for nested conditional fields (unlimited depth)
- ✅ Applied to: Form Edit, Inspection New, Inspection Edit

### 2. **Debug Logging Added**
- ✅ Console logs untuk melihat data yang di-load
- ✅ Logs untuk conditional logic detection
- ✅ Logs untuk matching rules

---

## 🔍 How to Debug

### Step 1: Check if Data is Loaded from Database

**Open Browser Console** (F12) dan pilih form/inspection:

#### For Inspection New:
```
📋 Selected Form: {...}
📋 Form Fields: [...]
Field 1: {
  name: "Shift",
  has_conditional: true,
  conditional_rules: [...]
}
```

#### For Inspection Edit:
```
📋 Normalized Form: {...}
📋 Form Fields: [...]
Field 1: {
  name: "Shift",
  has_conditional: true,
  conditional_rules: [...]
}
```

**✅ If you see this:** Data berhasil di-load dari database

**❌ If `has_conditional: false` or `conditional_rules: []`:**
- Check database: `SELECT field_options FROM form_fields WHERE id = X`
- Verify `field_options` contains `has_conditional` and `conditional_rules`

---

### Step 2: Check if Conditional Logic is Detected

Ketika Anda mengisi field dengan conditional logic, console akan show:

```
🔀 Field "Shift" has conditional logic: {
  has_conditional: true,
  conditional_rules: [
    {
      condition_value: "Shift 1",
      next_fields: [...]
    }
  ],
  currentValue: "",
  matchingRule: null
}
```

**When you select a value:**
```
🔀 Field "Shift" has conditional logic: {
  has_conditional: true,
  conditional_rules: [...],
  currentValue: "Shift 1",  ← Value selected
  matchingRule: {           ← Rule matched!
    condition_value: "Shift 1",
    next_fields: [...]
  }
}
```

**✅ If you see `matchingRule`:** Conditional fields akan muncul

**❌ If `matchingRule: null`:**
- Check if `currentValue` matches `condition_value` exactly
- Case sensitive! "Shift 1" ≠ "shift 1"

---

### Step 3: Check if Conditional Fields are Rendered

Setelah rule matched, conditional fields akan muncul dengan label:

```
↳ Conditional Fields (when "Shift 1"):
```

**✅ If you see this:** Conditional fields berhasil di-render

**❌ If not showing:**
- Check `matchingRule.next_fields` is not empty
- Check `next_fields` array has valid field objects

---

## 🐛 Common Issues & Solutions

### Issue 1: Conditional Logic Tidak Muncul

**Symptoms:**
- Field dengan conditional logic tidak show next fields
- Console shows `has_conditional: false`

**Solution:**
```sql
-- Check database
SELECT id, field_name, field_options 
FROM form_fields 
WHERE JSON_EXTRACT(field_options, '$.has_conditional') = true;

-- If empty, conditional logic not saved in database
-- Re-save form in Form Edit page
```

---

### Issue 2: Nested Conditional Tidak Muncul

**Symptoms:**
- Level 1 conditional works
- Level 2+ tidak muncul

**Solution:**
Check if nested fields have `has_conditional` and `conditional_rules`:

```javascript
// In console
console.log(field.conditional_rules[0].next_fields[0]);
// Should have:
// {
//   field_name: "...",
//   has_conditional: true,
//   conditional_rules: [...]
// }
```

If missing, `normalizeField()` didn't run recursively. Check code.

---

### Issue 3: Conditional Fields Muncul Tapi Kosong

**Symptoms:**
- Conditional section muncul
- Tapi tidak ada fields di dalamnya

**Solution:**
```javascript
// Check in console
console.log(matchingRule.next_fields);
// Should be array with field objects

// If empty array:
// - Check database: next_fields should not be empty
// - Re-save form in Form Edit page
```

---

### Issue 4: Wrong Conditional Fields Muncul

**Symptoms:**
- Select "Shift 1" tapi muncul fields untuk "Shift 2"

**Solution:**
```javascript
// Check condition_value matching
console.log({
  selected: currentValue,
  rules: field.conditional_rules.map(r => r.condition_value)
});

// Make sure:
// 1. Exact match (case sensitive)
// 2. No extra spaces
// 3. Correct dropdown options
```

---

## 📊 Data Flow Verification

### 1. Database → Backend
```sql
SELECT 
  id,
  field_name,
  JSON_EXTRACT(field_options, '$.has_conditional') as has_conditional,
  JSON_EXTRACT(field_options, '$.conditional_rules') as rules
FROM form_fields
WHERE form_id = YOUR_FORM_ID;
```

**Expected:**
- `has_conditional`: 1 (true)
- `rules`: JSON array with objects

---

### 2. Backend → Frontend
```javascript
// API Response
GET /api/forms/{id}
{
  fields: [
    {
      field_options: {
        has_conditional: true,
        conditional_rules: [...]
      }
    }
  ]
}
```

---

### 3. Frontend Normalization
```javascript
// normalizeField() extracts:
{
  has_conditional: true,  // from field_options
  conditional_rules: [...] // from field_options
}
```

---

### 4. Rendering
```javascript
// MultiTypeFieldRenderer checks:
if (field.has_conditional && currentValue) {
  const matchingRule = field.conditional_rules.find(
    rule => rule.condition_value === currentValue
  );
  
  if (matchingRule) {
    // Render next_fields
  }
}
```

---

## 🧪 Testing Checklist

### Inspection New Page:
- [ ] Open browser console
- [ ] Select a form
- [ ] Check console logs for form data
- [ ] Verify `has_conditional: true` for conditional fields
- [ ] Fill a field with conditional logic
- [ ] Select a value that triggers conditional
- [ ] Check console for `matchingRule`
- [ ] Verify conditional fields appear
- [ ] Test nested conditional (level 2, 3+)

### Inspection Edit Page:
- [ ] Open browser console
- [ ] Open an existing inspection
- [ ] Check console logs for normalized form
- [ ] Verify conditional fields with existing data
- [ ] Change value to trigger different conditional
- [ ] Verify conditional fields update

---

## 🔧 Quick Fixes

### If conditional logic not working at all:

1. **Clear browser cache** and refresh
2. **Check backend is running** and returning data
3. **Verify database** has conditional logic saved
4. **Check console** for any errors
5. **Re-save form** in Form Edit page

### If only some conditional fields work:

1. **Check condition_value** matches exactly
2. **Verify next_fields** array is not empty
3. **Check nested fields** have proper structure
4. **Test with simple conditional** first

---

## 📝 Debug Commands

### In Browser Console:

```javascript
// Check selected form
console.log('Form:', selectedForm);

// Check specific field
const field = selectedForm.fields[0];
console.log('Field:', field);
console.log('Has conditional:', field.has_conditional);
console.log('Rules:', field.conditional_rules);

// Check responses
console.log('Responses:', responses);

// Check current value
const responseKey = `${field.id}`;
console.log('Current value:', responses[responseKey]?.response_value);
```

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Console shows `has_conditional: true`
2. ✅ Console shows `conditional_rules` array
3. ✅ When you select a value, console shows `matchingRule`
4. ✅ Conditional fields section appears with label
5. ✅ Nested conditional fields work recursively
6. ✅ Can submit inspection with conditional responses

---

## 🆘 Still Not Working?

1. **Export form data** from database
2. **Share console logs** (screenshot)
3. **Check network tab** for API responses
4. **Verify normalizeField()** is being called
5. **Test with fresh form** (create new form with conditional)

---

## 📞 Support

If conditional logic still not showing after all fixes:

1. Check this file for troubleshooting steps
2. Review console logs for errors
3. Verify database structure
4. Test with simple conditional first
5. Check if `normalizeField()` is running

**Remember:** Conditional logic is stored in `field_options` JSON column, so backend must return it and frontend must extract it!
