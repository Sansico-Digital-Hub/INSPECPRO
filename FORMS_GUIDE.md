# InspecPro Forms Guide

## ✅ Issues Fixed

### 1. Forms Not Showing in Web
**Problem:** Forms page requires ADMIN role to access.

**Solution:** Login with admin credentials:
- Username: `admin`
- Password: `admin123`

### 2. Conditional Logic Added
**Feature:** Unlimited conditional logic now available in form builder!

---

## 🔐 Accessing Forms

### Requirements
- Must be logged in as **ADMIN** role
- Other roles (inspector, supervisor, manager) cannot access forms management

### How to Access
1. Go to http://localhost:3000/login
2. Login with: `admin` / `admin123`
3. Navigate to "Forms" in the sidebar
4. You should now see your forms!

---

## 📋 Current Forms in Database

**Form ID: 3**
- Name: Grafitect - Inline Quality Report
- Description: Safety compliance inspection checklist form for production line
- Fields: 22
- Status: Active

---

## ✨ New Feature: Conditional Logic

### What is Conditional Logic?
Conditional logic allows you to show/hide fields based on the values of other fields. This creates dynamic forms that adapt to user input.

### How to Use

1. **Create or Edit a Form**
   - Go to Forms → New Form (or edit existing)
   - Add your fields

2. **Add Conditional Logic to a Field**
   - Scroll to the "Conditional Logic" section at the bottom of each field
   - Click "+ Add Condition"

3. **Configure Conditions**
   - **Select Field:** Choose which previous field to check
   - **Operator:** Choose comparison type:
     - `Equals` - Field value equals specific value
     - `Not Equals` - Field value does not equal value
     - `Contains` - Field value contains text
     - `Greater Than` - Numeric comparison
     - `Less Than` - Numeric comparison
     - `Is Empty` - Field has no value
     - `Is Not Empty` - Field has a value
   - **Value:** Enter the value to compare against

4. **Add Multiple Conditions**
   - Click "+ Add Condition" again for additional rules
   - **ALL conditions must be met** for the field to show (AND logic)

### Examples

#### Example 1: Show "Reason" field only if Status is "Hold"
```
Field 1: Status (Dropdown: Pass, Hold)
Field 2: Reason (Text)
  Conditional Logic:
    - Field: Status
    - Operator: Equals
    - Value: Hold
```

#### Example 2: Show "Temperature Details" only if Temperature > 100
```
Field 1: Temperature (Measurement)
Field 2: Temperature Details (Text)
  Conditional Logic:
    - Field: Temperature
    - Operator: Greater Than
    - Value: 100
```

#### Example 3: Multiple Conditions
```
Field 1: Equipment Type (Dropdown: Machine A, Machine B)
Field 2: Status (Dropdown: Pass, Hold)
Field 3: Machine A Hold Details (Text)
  Conditional Logic:
    - Field: Equipment Type
      Operator: Equals
      Value: Machine A
    - Field: Status
      Operator: Equals
      Value: Hold
```
This field only shows when BOTH conditions are true.

### Unlimited Conditions
- You can add as many conditions as needed
- Each field can have multiple conditional rules
- Conditions are evaluated in real-time during inspection

---

## 🎨 Form Builder Features

### Field Types Available
1. **Text** - Single line text input
2. **Dropdown** - Select from predefined options
3. **Search Dropdown** - Searchable dropdown
4. **Button (Pass/Hold)** - Quick pass/hold selection
5. **Photo** - Camera/photo upload
6. **Signature** - Digital signature capture
7. **Measurement** - Numeric with min/max validation
8. **Notes** - Instructions/guidance text
9. **Date** - Date picker
10. **Date & Time** - Date and time picker
11. **Time** - Time picker

### Field Configuration
- **Field Name** - Label for the field
- **Field Type** - Type of input
- **Required** - Make field mandatory
- **Field Order** - Reorder with up/down arrows
- **Options** - For dropdowns (comma-separated)
- **Measurement Settings** - Min/max values for measurements
- **Conditional Logic** - Show/hide based on other fields

---

## 🔄 Form Management

### View Forms
- Navigate to: http://localhost:3000/forms
- See all active forms with field counts
- View creation dates

### Create New Form
1. Click "New Form" button
2. Enter form name and description
3. Add fields using "+ Add Field"
4. Configure each field
5. Add conditional logic if needed
6. Click "Create Form"

### Edit Form
1. Click pencil icon on form
2. Modify fields and settings
3. Save changes

### Delete Form
1. Click trash icon on form
2. Confirm deletion
3. Form is soft-deleted (marked inactive)

---

## 🚀 Using Forms in Inspections

### Inspector Workflow
1. Login as inspector
2. Go to "New Inspection"
3. Select a form
4. Fill out fields
5. Conditional fields appear/hide automatically
6. Submit inspection

### Conditional Logic in Action
- Fields with conditions are hidden by default
- As you fill the form, fields appear dynamically
- Only relevant fields are shown
- Reduces clutter and confusion

---

## 💡 Best Practices

### Designing Forms with Conditional Logic

1. **Keep it Simple**
   - Start with basic fields
   - Add conditions gradually
   - Test as you build

2. **Logical Flow**
   - Place conditional fields after their trigger fields
   - Group related fields together
   - Use clear field names

3. **User Experience**
   - Don't hide critical information
   - Provide clear instructions
   - Test the form flow

4. **Common Patterns**
   - Status-based details (Pass → no details, Hold → require reason)
   - Equipment-specific checks
   - Measurement-based follow-ups
   - Role-based fields

### Form Organization
- Use descriptive form names
- Add clear descriptions
- Order fields logically
- Group related fields
- Use Notes fields for instructions

---

## 🔍 Troubleshooting

### Forms Not Showing
**Issue:** Can't see forms on forms page

**Solutions:**
1. ✅ Login as admin (not inspector/supervisor/manager)
2. ✅ Check backend is running: http://localhost:8000
3. ✅ Check browser console for errors (F12)
4. ✅ Verify forms exist in database

### Conditional Logic Not Working
**Issue:** Fields not showing/hiding correctly

**Solutions:**
1. ✅ Check field order (condition field must come before conditional field)
2. ✅ Verify operator and value match exactly
3. ✅ Test with simple condition first
4. ✅ Check browser console for errors

### Can't Create Forms
**Issue:** "Access Denied" or permission error

**Solutions:**
1. ✅ Must be logged in as ADMIN
2. ✅ Check token is valid (not expired)
3. ✅ Verify backend permissions

---

## 📊 Database Structure

### Forms Table
- `id` - Unique identifier
- `form_name` - Name of the form
- `description` - Form description
- `created_by` - User ID who created it
- `is_active` - Active/inactive status

### Form Fields Table
- `id` - Unique identifier
- `form_id` - Parent form
- `field_name` - Field label
- `field_type` - Type of field
- `field_options` - JSON with options and conditional_logic
- `field_order` - Display order
- `is_required` - Required flag

### Conditional Logic Structure (in field_options JSON)
```json
{
  "options": ["Option 1", "Option 2"],
  "conditional_logic": [
    {
      "field_index": 0,
      "operator": "equals",
      "value": "Hold"
    },
    {
      "field_index": 1,
      "operator": "greater_than",
      "value": "100"
    }
  ]
}
```

---

## ✅ Summary

**Forms Management:**
- ✅ Login as admin to access forms
- ✅ Create, edit, delete forms
- ✅ Add unlimited fields

**Conditional Logic:**
- ✅ Unlimited conditions per field
- ✅ Multiple operators supported
- ✅ AND logic (all conditions must match)
- ✅ Real-time field visibility

**Current Status:**
- ✅ 1 form in database (Grafitect)
- ✅ 22 fields configured
- ✅ Ready to add conditional logic
- ✅ Ready for inspections

---

**Need Help?**
- Check browser console (F12) for errors
- Verify you're logged in as admin
- Ensure backend is running
- Test with simple forms first
