# 🎯 SET FRA CONDITIONAL LOGIC - Step by Step

## Date: October 6, 2025, 16:29 WIB

---

## ✅ FRA Dropdown Sudah Muncul!

Screenshot menunjukkan FRA sudah muncul sebagai dropdown dan "Yes" sudah dipilih. ✓

**Tapi conditional fields tidak muncul karena conditional logic belum di-set!**

---

## 📋 Step-by-Step: Set Conditional Logic

### Step 1: Login as Admin

### Step 2: Go to Forms → Edit Grafitect Form

### Step 3: Find FRA Field (Field 21)

### Step 4: Enable Conditional Logic

Scroll ke bawah di FRA field settings, cari:

```
☐ Enable Conditional Logic
```

**CHECK THE BOX!** ✓

### Step 5: Add Conditional Rules

Setelah checkbox di-check, akan muncul section "Conditional Rules".

#### Rule 1: If "Yes"

1. Click **"Add Condition"**
2. **Condition Value**: `Yes`
3. Click **"Add Field"** untuk menambah fields yang muncul jika "Yes"
4. Tambahkan fields yang diinginkan, misalnya:
   - Field Name: "FRA Details"
   - Field Type: Text
   - Required: Yes
   
5. Tambahkan field lain jika perlu (Photo, Notes, dll)

#### Rule 2: If "No"

1. Click **"Add Condition"** lagi
2. **Condition Value**: `No`
3. Add fields yang muncul jika "No"

#### Rule 3: If "N/A"

1. Click **"Add Condition"** lagi
2. **Condition Value**: `N/A`
3. Add fields yang muncul jika "N/A"

### Step 6: Save Form

Click **"Update Form"** di bawah.

---

## 🎨 Visual Guide

### Admin Page Should Look Like:

```
┌─────────────────────────────────────┐
│ Field 21 - FRA                      │
├─────────────────────────────────────┤
│ Field Type: Dropdown                │
│ Options:                            │
│ • Yes                               │
│ • No                                │
│ • N/A                               │
│                                     │
│ ☑️ Enable Conditional Logic         │ ← CHECK THIS!
│                                     │
│ Conditional Rules:                  │
│                                     │
│ [Condition 1]                       │
│ If value equals: [Yes ▼]            │
│ Then show these fields:             │
│   • FRA Details (text)              │
│   • FRA Photo (photo)               │
│   [+ Add Field]                     │
│                                     │
│ [+ Add Condition]                   │
│                                     │
│ [Update Form]                       │
└─────────────────────────────────────┘
```

---

## 🔍 Verify Conditional Logic is Saved

After saving, check database:

```sql
SELECT field_name, field_options 
FROM form_fields 
WHERE field_name LIKE '%FRA%';
```

Should show:
```json
{
  "options": ["Yes", "No", "N/A"],
  "has_conditional": true,
  "conditional_rules": [
    {
      "condition_value": "Yes",
      "next_fields": [
        {
          "field_name": "FRA Details",
          "field_type": "text",
          "is_required": true
        }
      ]
    }
  ]
}
```

---

## 🎯 After Setting Conditional Logic

### Inspector Page Will Show:

**Before Selection:**
```
┌─────────────────────────────────────┐
│ FRA *                               │
│ [Select ▼]                          │
└─────────────────────────────────────┘
```

**After Selecting "Yes":**
```
┌─────────────────────────────────────┐
│ FRA *                               │
│ [Yes ▼]                             │
│                                     │
│    ┃ FRA Details *                  │ ← MUNCUL!
│    ┃ [Enter details...]            │
│    ┃                                │
│    ┃ FRA Photo                      │ ← MUNCUL!
│    ┃ [Upload photo]                 │
└─────────────────────────────────────┘
```

---

## ⚠️ Common Mistakes

### Mistake 1: Forgot to Check "Enable Conditional Logic"
**Solution**: Must check the checkbox!

### Mistake 2: No Conditional Rules Added
**Solution**: Must add at least one condition with fields

### Mistake 3: Condition Value Doesn't Match
**Solution**: Condition value must EXACTLY match dropdown option
- If option is "Yes", condition must be "Yes" (case-sensitive)

### Mistake 4: Forgot to Save
**Solution**: Click "Update Form" button!

---

## 🧪 Testing

### Test 1: Select "Yes"
1. Go to Inspector page
2. Select FRA: "Yes"
3. **Verify**: Conditional fields appear ✓

### Test 2: Change to "No"
1. Change FRA to "No"
2. **Verify**: "Yes" fields disappear, "No" fields appear ✓

### Test 3: Change to "N/A"
1. Change FRA to "N/A"
2. **Verify**: Correct fields appear ✓

---

## 📝 Current Status

✅ FRA field exists  
✅ FRA is dropdown type  
✅ FRA has options: Yes, No, N/A  
✅ FRA appears in inspector page  
✅ Can select "Yes"  
❌ Conditional fields NOT appearing  

**Reason**: Conditional logic not set in admin page!

---

## 🚀 Quick Checklist

- [ ] Login as Admin
- [ ] Edit Grafitect form
- [ ] Find FRA field
- [ ] Check "Enable Conditional Logic"
- [ ] Add condition for "Yes"
- [ ] Add fields for "Yes" condition
- [ ] Add condition for "No" (optional)
- [ ] Add condition for "N/A" (optional)
- [ ] Click "Update Form"
- [ ] Refresh inspector page
- [ ] Test: Select "Yes"
- [ ] Verify: Conditional fields appear!

---

## 💡 Example Conditional Setup

### For FRA "Yes":
```
Fields to show:
1. FRA Details (Text, Required)
   - Placeholder: "Describe the FRA findings..."
   
2. FRA Photo (Photo, Optional)
   - Max photos: 3
   
3. Follow-up Required (Dropdown, Required)
   - Options: Yes, No
```

### For FRA "No":
```
Fields to show:
1. Reason for No FRA (Notes, Required)
   - Placeholder: "Explain why FRA is not applicable..."
```

---

**Set conditional logic di admin page, lalu refresh inspector page!** ✅

**Conditional fields akan langsung muncul saat pilih "Yes"!** 🎉
