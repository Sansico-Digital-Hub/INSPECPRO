# Conditional Logic - Complete Guide

## ✓ VERIFIED: System Supports Nested Conditional Logic

**Date**: October 6, 2025, 14:45 WIB  
**Status**: FULLY FUNCTIONAL ✓

---

## 🎯 What is Conditional Logic?

Conditional logic allows you to show/hide fields based on user's selection in dropdown or search dropdown fields.

### Supported Field Types
- ✓ **Dropdown**
- ✓ **Search Dropdown**

---

## 📝 How to Use Conditional Logic

### Step 1: Create a Dropdown Field

Example: Field "FRA" with options:
- Yes
- No
- N/A

### Step 2: Enable Conditional Logic

Check the box: **☑️ Enable Conditional Logic**

### Step 3: Add Conditions

For each option value, you can add conditional rules:

#### Condition 1: If user selects "Yes"
```
Enter condition value: Yes

Then show these fields:
  + Add Field: "FRA Details" (Text)
  + Add Field: "FRA Photo" (Photo)
  + Add Field: "Follow-up Required" (Dropdown)
```

#### Condition 2: If user selects "No"
```
Enter condition value: No

Then show these fields:
  + Add Field: "Reason for No FRA" (Notes)
```

#### Condition 3: If user selects "N/A"
```
Enter condition value: N/A

Then show these fields:
  (No additional fields)
```

---

## 🔄 Nested Conditional Logic

**YES! The system supports conditional logic INSIDE conditional logic!**

### Example: Multi-level Conditional

```
Field: "FRA"
Options: Yes, No, N/A

If "Yes" selected:
  ↓
  Show Field: "Follow-up Action"
  Options: Immediate, Scheduled, None
  
  If "Immediate" selected:
    ↓
    Show Field: "Immediate Action Details" (Notes)
    Show Field: "Assigned To" (Search Dropdown)
    
    If "Assigned To" = "John Doe":
      ↓
      Show Field: "John's Contact Number" (Text)
  
  If "Scheduled" selected:
    ↓
    Show Field: "Schedule Date" (DateTime)
    Show Field: "Reminder" (Dropdown)
```

### How to Create Nested Conditionals

1. **Create parent field** with conditional logic
2. **Add conditional rule** (e.g., "Yes")
3. **Add next field** that also has dropdown/search dropdown
4. **Enable conditional logic** on that nested field
5. **Add conditional rules** for the nested field
6. **Repeat** as many levels as needed!

---

## ⚠️ Important Rules

### 1. Exact Match Required
The "condition value" must **EXACTLY** match the dropdown option:

✓ **Correct**:
```
Dropdown option: "Yes"
Condition value: "Yes"
```

✗ **Wrong**:
```
Dropdown option: "Yes"
Condition value: "yes"  ← lowercase
Condition value: "YES"  ← uppercase
Condition value: " Yes" ← extra space
```

### 2. Case Sensitive
- `Yes` ≠ `yes` ≠ `YES`

### 3. Spaces Matter
- `N/A` ≠ `N / A` ≠ `N/A `

### 4. Multiple Conditions
You can add multiple conditions using **"+ Add Condition"** button

---

## 💾 How Data is Saved

### Frontend → Backend

When you create/edit a form, the conditional logic is saved in `field_options`:

```json
{
  "field_name": "FRA",
  "field_type": "dropdown",
  "field_options": {
    "options": ["Yes", "No", "N/A"],
    "has_conditional": true,
    "conditional_rules": [
      {
        "condition_value": "Yes",
        "next_fields": [
          {
            "field_name": "FRA Details",
            "field_type": "text",
            "is_required": true,
            "field_order": 1,
            "has_conditional": false
          },
          {
            "field_name": "Follow-up Action",
            "field_type": "dropdown",
            "field_options": {
              "options": ["Immediate", "Scheduled", "None"],
              "has_conditional": true,
              "conditional_rules": [
                {
                  "condition_value": "Immediate",
                  "next_fields": [
                    {
                      "field_name": "Immediate Action Details",
                      "field_type": "notes"
                    }
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "condition_value": "No",
        "next_fields": [
          {
            "field_name": "Reason for No FRA",
            "field_type": "notes"
          }
        ]
      }
    ]
  }
}
```

### Backend Storage

- **Database**: MySQL
- **Table**: `form_fields`
- **Column**: `field_options` (JSON type)
- **Supports**: Unlimited nesting depth
- **Preserved**: All structure and data

---

## ✅ Verification Tests

All tests passed:

- ✓ Conditional logic can be saved
- ✓ Nested conditional logic is supported
- ✓ Data structure is preserved
- ✓ JSON serialization works correctly
- ✓ Multiple conditional rules supported
- ✓ Deep nesting levels supported
- ✓ Complex field structures supported

---

## 🎨 User Experience

### When Creating Form:
1. Admin creates form with conditional logic
2. Saves form → All conditional rules saved to MySQL

### When Filling Inspection:
1. User opens inspection form
2. Sees initial fields
3. Selects dropdown value
4. **Conditional fields appear dynamically**
5. If nested conditional exists, more fields appear
6. User fills all visible fields
7. Submits inspection

---

## 🔧 Technical Details

### Frontend Files Updated:
- `types/index.ts` - Type definitions
- `forms/new/page.tsx` - Form builder
- `forms/[id]/edit/page.tsx` - Form editor

### Backend Files:
- `models.py` - FormField model with JSON field_options
- `schemas.py` - Pydantic validation
- `routers/forms.py` - API endpoints

### Database:
- MySQL JSON column supports nested structures
- No depth limit
- Efficient storage and retrieval

---

## 📋 Best Practices

1. **Keep it Simple**: Don't nest too deeply (max 3-4 levels recommended)
2. **Clear Labels**: Use descriptive field names
3. **Test First**: Test conditional logic before deploying
4. **Document**: Add descriptions to complex conditionals
5. **User Training**: Train users on how conditional fields work

---

## 🚀 Summary

**The InspecPro system FULLY SUPPORTS:**

✓ Conditional Logic  
✓ Nested Conditional Logic (conditional inside conditional)  
✓ Multiple levels of nesting  
✓ Complex field structures  
✓ All changes are saved correctly  
✓ Data integrity maintained  

**You can confidently create complex conditional forms with multiple levels of logic!**

---

## 📞 Support

If you encounter any issues with conditional logic:
1. Check that condition values match exactly
2. Verify dropdown options are correct
3. Test in form builder preview
4. Check browser console for errors

**Everything is working as expected!** ✓
