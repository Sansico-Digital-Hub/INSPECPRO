# Form Edit Save Troubleshooting Guide

## ✅ Debug Logging Added

Debug logging telah ditambahkan ke `handleSubmit` function untuk membantu troubleshoot masalah save.

---

## 🔍 How to Debug

### Step 1: Open Browser Console
1. Buka Form Edit page
2. Tekan **F12** untuk open Developer Tools
3. Pilih tab **Console**

### Step 2: Click "Update Form" Button
Ketika Anda klik tombol "Update Form", console akan menampilkan:

```
🔄 Form Submit Started
Form ID: 1
Form Name: "Daily Inspection"
Description: "..."
Fields Count: 5
Fields Data: Array(5) [ {...}, {...}, ... ]
📤 Sending update request...
```

### Step 3: Check Result

#### ✅ **Success:**
```
✅ Update successful: Object { id: 1, form_name: "...", ... }
Toast: "Form updated successfully"
Redirect to /forms
```

#### ❌ **Error:**
```
❌ Failed to update form: Error { ... }
Error response: Object { status: 400, data: {...} }
Error data: Object { detail: "..." }
Toast: "Failed to update form"
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Button Tidak Respond

**Symptoms:**
- Klik "Update Form" tidak ada reaksi
- Tidak ada log di console
- Button tidak disabled

**Possible Causes:**
1. Form validation error (field required tidak diisi)
2. JavaScript error sebelum submit
3. Event handler tidak terpasang

**Solution:**
```javascript
// Check console for errors
// Look for red error messages

// Check if form is valid
console.log('Form valid:', document.querySelector('form').checkValidity());

// Check if button is connected
console.log('Submit button:', document.querySelector('button[type="submit"]'));
```

---

### Issue 2: Submit Tapi Tidak Ada Log

**Symptoms:**
- Klik button
- Tidak ada log `🔄 Form Submit Started`
- Page tidak reload

**Possible Causes:**
1. `handleSubmit` tidak dipanggil
2. `e.preventDefault()` gagal
3. Form tidak punya `onSubmit` handler

**Solution:**
Check form element:
```tsx
<form onSubmit={handleSubmit}>
  {/* ... */}
</form>
```

---

### Issue 3: Log Muncul Tapi Request Gagal

**Symptoms:**
```
🔄 Form Submit Started
📤 Sending update request...
❌ Failed to update form
```

**Possible Causes:**
1. Backend error (500)
2. Validation error (400)
3. Authentication error (401/403)
4. Network error

**Solution:**
Check error details di console:
```
Error response: { status: 400, data: { detail: "..." } }
```

**Common Backend Errors:**

#### A. **400 Bad Request**
```json
{
  "detail": "Field validation error"
}
```
**Fix:** Check field data structure

#### B. **401 Unauthorized**
```json
{
  "detail": "Not authenticated"
}
```
**Fix:** Login ulang

#### C. **403 Forbidden**
```json
{
  "detail": "Not enough permissions"
}
```
**Fix:** Pastikan user adalah Admin

#### D. **404 Not Found**
```json
{
  "detail": "Form not found"
}
```
**Fix:** Form ID tidak valid

#### E. **500 Internal Server Error**
```json
{
  "detail": "Database error"
}
```
**Fix:** Check backend logs

---

### Issue 4: Field Data Tidak Lengkap

**Symptoms:**
```
Fields Data: Array(5) [
  { field_name: "", field_type: "text", ... },  ← Empty field_name
  ...
]
```

**Possible Causes:**
1. Field belum diisi
2. State tidak terupdate
3. Validation tidak jalan

**Solution:**
```javascript
// Check if all required fields filled
fields.forEach((field, idx) => {
  if (!field.field_name) {
    console.error(`Field ${idx} has no name`);
  }
});
```

---

### Issue 5: Conditional Logic Tidak Tersimpan

**Symptoms:**
- Conditional logic hilang setelah save
- `has_conditional: false` di database

**Possible Causes:**
1. `has_conditional` dan `conditional_rules` tidak di-include dalam `field_options`
2. Data structure salah

**Solution:**
Check field data sebelum submit:
```javascript
console.log('Field with conditional:', fields.find(f => f.has_conditional));
console.log('Field options:', field.field_options);
```

**Expected structure:**
```json
{
  "field_options": {
    "options": ["Yes", "No"],
    "has_conditional": true,
    "conditional_rules": [...]
  }
}
```

**OR:**
```json
{
  "has_conditional": true,
  "conditional_rules": [...],
  "field_options": {
    "options": ["Yes", "No"]
  }
}
```

---

## 🔧 Backend Endpoint Check

### Endpoint: `PUT /api/forms/{id}/complete`

**Request:**
```json
{
  "form_name": "Daily Inspection",
  "description": "...",
  "fields": [
    {
      "id": 1,  // Optional for existing fields
      "field_name": "Shift",
      "field_type": "dropdown",
      "field_types": ["dropdown"],
      "field_options": {
        "options": ["Shift 1", "Shift 2"],
        "has_conditional": true,
        "conditional_rules": [...]
      },
      "is_required": true,
      "field_order": 0
    }
  ]
}
```

**Response (Success):**
```json
{
  "id": 1,
  "form_name": "Daily Inspection",
  "description": "...",
  "fields": [...]
}
```

**Response (Error):**
```json
{
  "detail": "Error message"
}
```

---

## 📊 Data Flow

### 1. User Clicks "Update Form"
```
Button Click → handleSubmit() → e.preventDefault()
```

### 2. Validation
```
Check fields.length > 0
Check required fields filled
```

### 3. API Call
```
formsAPI.updateForm(formId, { form_name, description, fields })
  ↓
axios.put(`/api/forms/${formId}/complete`, data)
  ↓
Backend: PUT /api/forms/{id}/complete
```

### 4. Backend Processing
```
1. Find form by ID
2. Update form metadata (name, description)
3. For each field:
   - If has ID → Update existing
   - If no ID → Create new
4. Delete removed fields (if no responses)
5. Commit to database
6. Return updated form
```

### 5. Frontend Response
```
Success → Toast message → Redirect to /forms
Error → Toast error → Stay on page
```

---

## 🧪 Testing Steps

### Test 1: Simple Update
1. Edit form name
2. Click "Update Form"
3. Check console logs
4. Verify success message
5. Check database

### Test 2: Add New Field
1. Click "Add Field"
2. Fill field details
3. Click "Update Form"
4. Check console logs
5. Verify field saved

### Test 3: Update Existing Field
1. Edit existing field name
2. Click "Update Form"
3. Check console logs
4. Verify changes saved

### Test 4: Delete Field
1. Click delete on a field
2. Click "Update Form"
3. Check console logs
4. Verify field deleted (if no responses)

### Test 5: Conditional Logic
1. Add conditional logic to field
2. Click "Update Form"
3. Check console logs
4. Verify conditional logic saved
5. Check database `field_options`

---

## 🆘 Quick Fixes

### Fix 1: Clear Browser Cache
```
Ctrl + Shift + Delete → Clear cache → Refresh
```

### Fix 2: Check Backend Running
```bash
# Check if backend is running
curl http://localhost:8000/api/forms/

# Check specific form
curl http://localhost:8000/api/forms/1
```

### Fix 3: Check Authentication
```javascript
// In console
console.log('Token:', localStorage.getItem('token'));
console.log('User:', JSON.parse(localStorage.getItem('user') || '{}'));
```

### Fix 4: Re-login
```
Logout → Login → Try again
```

### Fix 5: Check Network Tab
```
F12 → Network tab → Click "Update Form" → Check request/response
```

---

## 📝 Debug Checklist

- [ ] Console logs appear when clicking "Update Form"
- [ ] `🔄 Form Submit Started` shows in console
- [ ] Form ID is correct
- [ ] Form name is not empty
- [ ] Fields count > 0
- [ ] Fields data looks correct
- [ ] `📤 Sending update request...` appears
- [ ] No red errors in console
- [ ] Network request shows in Network tab
- [ ] Response status is 200
- [ ] Success toast appears
- [ ] Redirects to /forms page

---

## 🔍 Advanced Debugging

### Check Request in Network Tab
1. Open F12 → Network tab
2. Click "Update Form"
3. Find request to `/api/forms/{id}/complete`
4. Check:
   - Request Method: PUT
   - Status Code: 200 (success) or 4xx/5xx (error)
   - Request Payload: Your form data
   - Response: Updated form or error message

### Check Backend Logs
```bash
# In backend terminal
# Look for:
# - PUT /api/forms/1/complete
# - Status code
# - Any error messages
```

### Check Database
```sql
-- Check form
SELECT * FROM forms WHERE id = 1;

-- Check fields
SELECT id, field_name, field_type, field_options 
FROM form_fields 
WHERE form_id = 1;

-- Check conditional logic
SELECT 
  id, 
  field_name,
  JSON_EXTRACT(field_options, '$.has_conditional') as has_conditional,
  JSON_EXTRACT(field_options, '$.conditional_rules') as rules
FROM form_fields
WHERE form_id = 1;
```

---

## ✅ Success Indicators

Save berhasil jika:
1. ✅ Console shows `✅ Update successful`
2. ✅ Toast message "Form updated successfully"
3. ✅ Redirects to /forms page
4. ✅ Changes visible in form list
5. ✅ Database updated correctly

---

## 📞 Still Not Working?

If save still not working after all checks:

1. **Share console logs** (screenshot)
2. **Share Network tab** (request/response)
3. **Share backend logs** (terminal output)
4. **Check database** (SQL query results)
5. **Try with simple form** (no conditional logic)

**Remember:** Debug logs will show exactly where the problem is!
