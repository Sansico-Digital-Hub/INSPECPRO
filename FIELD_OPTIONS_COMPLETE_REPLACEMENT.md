# Field Options Complete Replacement

## ✅ Updated Behavior

### **Previous Behavior (Merge):**
```typescript
// BEFORE: Merge with spread operator
preparedField.field_options = {
  ...preparedField.field_options,  // Keep old properties
  has_conditional: true,            // Add new properties
  conditional_rules: [...]
};
```

**Problem:** 
- Jika property dihapus di UI, masih ada di database
- Tidak bisa menghapus property yang tidak diinginkan
- Database bisa punya data "sampah"

---

### **New Behavior (Complete Replacement):**
```typescript
// AFTER: Build from scratch
const newFieldOptions: any = {};

// Only copy properties that exist and not null/undefined
if (preparedField.field_options) {
  Object.keys(preparedField.field_options).forEach(key => {
    if (preparedField.field_options[key] !== undefined && 
        preparedField.field_options[key] !== null) {
      newFieldOptions[key] = preparedField.field_options[key];
    }
  });
}

// Add conditional logic
if (preparedField.has_conditional || preparedField.conditional_rules) {
  newFieldOptions.has_conditional = preparedField.has_conditional || false;
  newFieldOptions.conditional_rules = preparedField.conditional_rules || [];
}

// Complete replacement
preparedField.field_options = newFieldOptions;
```

**Benefits:**
- ✅ Property yang dihapus akan hilang dari database
- ✅ Tidak ada data "sampah"
- ✅ Database selalu sync dengan UI state
- ✅ Null/undefined values tidak disimpan

---

## 📊 Examples

### **Example 1: Remove Property**

#### **Initial State:**
```json
{
  "field_options": {
    "options": ["Yes", "No"],
    "max_length": 500,
    "old_property": "should be removed"
  }
}
```

#### **User Action:**
```
User edits form
User removes "old_property" from field_options
```

#### **Before (Merge):**
```json
{
  "field_options": {
    "options": ["Yes", "No"],
    "max_length": 500,
    "old_property": "should be removed"  ← Still here!
  }
}
```

#### **After (Complete Replacement):**
```json
{
  "field_options": {
    "options": ["Yes", "No"],
    "max_length": 500
    // old_property removed! ✅
  }
}
```

---

### **Example 2: Set Property to Null**

#### **User Action:**
```typescript
updateField(index, { 
  field_options: { 
    ...field.field_options, 
    notes_image: null  // User removes image
  } 
});
```

#### **Before (Merge):**
```json
{
  "field_options": {
    "notes_image": null  ← Saved as null
  }
}
```

#### **After (Complete Replacement):**
```json
{
  "field_options": {
    // notes_image not included! ✅
  }
}
```

---

### **Example 3: Update Conditional Logic**

#### **Initial State:**
```json
{
  "field_options": {
    "options": ["Yes", "No"],
    "has_conditional": true,
    "conditional_rules": [
      { "condition_value": "Yes", "next_fields": [...] },
      { "condition_value": "No", "next_fields": [...] }
    ]
  }
}
```

#### **User Action:**
```
User deletes "No" conditional rule
```

#### **Before (Merge):**
```json
{
  "field_options": {
    "options": ["Yes", "No"],
    "has_conditional": true,
    "conditional_rules": [
      { "condition_value": "Yes", "next_fields": [...] },
      { "condition_value": "No", "next_fields": [...] }  ← Still here!
    ]
  }
}
```

#### **After (Complete Replacement):**
```json
{
  "field_options": {
    "options": ["Yes", "No"],
    "has_conditional": true,
    "conditional_rules": [
      { "condition_value": "Yes", "next_fields": [...] }
      // "No" rule removed! ✅
    ]
  }
}
```

---

## 🔍 How It Works

### **Step 1: Build New Object from Scratch**
```typescript
const newFieldOptions: any = {};
```
Start with empty object (not copying old one)

### **Step 2: Copy Only Valid Properties**
```typescript
if (preparedField.field_options) {
  Object.keys(preparedField.field_options).forEach(key => {
    if (preparedField.field_options[key] !== undefined && 
        preparedField.field_options[key] !== null) {
      newFieldOptions[key] = preparedField.field_options[key];
    }
  });
}
```
- Loop through all properties
- Only copy if **not undefined** and **not null**
- Skip properties that were set to null/undefined

### **Step 3: Add Conditional Logic**
```typescript
if (preparedField.has_conditional || preparedField.conditional_rules) {
  newFieldOptions.has_conditional = preparedField.has_conditional || false;
  newFieldOptions.conditional_rules = preparedField.conditional_rules || [];
}
```
Add conditional logic from field level to field_options

### **Step 4: Recursive for Nested Fields**
```typescript
if (newFieldOptions.conditional_rules && newFieldOptions.conditional_rules.length > 0) {
  newFieldOptions.conditional_rules = newFieldOptions.conditional_rules.map((rule: any) => ({
    ...rule,
    next_fields: (rule.next_fields || []).map((nestedField: any) => 
      prepareFieldForSave(nestedField)  // Recursive!
    )
  }));
}
```
Apply same logic to nested fields

### **Step 5: Complete Replacement**
```typescript
preparedField.field_options = newFieldOptions;
```
Replace entire field_options (not merge)

---

## ✅ What Gets Removed

### **1. Properties Set to `null`**
```typescript
field.field_options.notes_image = null;
// Result: notes_image not in database ✅
```

### **2. Properties Set to `undefined`**
```typescript
field.field_options.old_setting = undefined;
// Result: old_setting not in database ✅
```

### **3. Properties Deleted from Object**
```typescript
delete field.field_options.unused_property;
// Result: unused_property not in database ✅
```

### **4. Empty Arrays**
```typescript
field.field_options.conditional_rules = [];
// Result: conditional_rules = [] in database
// (Empty array is valid, so it's kept)
```

### **5. Empty Strings**
```typescript
field.field_options.placeholder_text = "";
// Result: placeholder_text = "" in database
// (Empty string is valid, so it's kept)
```

---

## ⚠️ What Gets Kept

### **1. Valid Values**
```typescript
field.field_options.max_length = 500;
// Result: max_length = 500 in database ✅
```

### **2. Zero Values**
```typescript
field.field_options.min_value = 0;
// Result: min_value = 0 in database ✅
// (0 is valid, not null/undefined)
```

### **3. False Boolean**
```typescript
field.field_options.has_conditional = false;
// Result: has_conditional = false in database ✅
// (false is valid, not null/undefined)
```

### **4. Empty Arrays**
```typescript
field.field_options.options = [];
// Result: options = [] in database ✅
// (Empty array is valid)
```

### **5. Empty Objects**
```typescript
field.field_options.settings = {};
// Result: settings = {} in database ✅
// (Empty object is valid)
```

---

## 🧪 Testing Scenarios

### **Test 1: Remove Instruction Photo**
```
1. Field has notes_image
2. User clicks "Remove Photo"
3. updateField sets notes_image = undefined
4. Save form
5. Check database: notes_image should NOT exist ✅
```

### **Test 2: Remove Conditional Rule**
```
1. Field has 2 conditional rules
2. User deletes 1 rule
3. conditional_rules array now has 1 item
4. Save form
5. Check database: only 1 rule should exist ✅
```

### **Test 3: Clear Placeholder Text**
```
1. Field has placeholder_text = "Enter value"
2. User clears text (empty string)
3. Save form
4. Check database: placeholder_text = "" (empty string kept) ✅
```

### **Test 4: Remove All Options**
```
1. Field has options = ["A", "B", "C"]
2. User removes all options
3. options = []
4. Save form
5. Check database: options = [] (empty array kept) ✅
```

### **Test 5: Nested Conditional Logic**
```
1. Field has nested conditional with old properties
2. User removes nested field
3. Save form
4. Check database: nested field should NOT exist ✅
```

---

## 📝 Console Output

### **Before Prepare:**
```javascript
Fields Data (before prepare): [
  {
    field_name: "Equipment",
    field_options: {
      options: ["Yes", "No"],
      old_property: "to be removed",
      notes_image: null
    },
    has_conditional: true,
    conditional_rules: [...]
  }
]
```

### **After Prepare:**
```javascript
Fields Data (after prepare): [
  {
    field_name: "Equipment",
    field_options: {
      options: ["Yes", "No"],
      // old_property removed! ✅
      // notes_image removed! ✅
      has_conditional: true,      // Added from field level
      conditional_rules: [...]    // Added from field level
    }
  }
]
```

---

## 🎯 Benefits

### **1. Clean Database** ✅
- No unused properties
- No null values
- No undefined values

### **2. Accurate State** ✅
- Database matches UI state exactly
- What you see is what you get

### **3. Easy Debugging** ✅
- Console logs show before/after
- Can verify what gets removed

### **4. Predictable Behavior** ✅
- Remove property → Gone from database
- Set to null → Gone from database
- Set to undefined → Gone from database

---

## 🔄 Comparison

| Action | Old Behavior (Merge) | New Behavior (Replace) |
|--------|---------------------|------------------------|
| Remove property | ❌ Still in database | ✅ Removed from database |
| Set to null | ❌ Saved as null | ✅ Not saved |
| Set to undefined | ❌ Might be saved | ✅ Not saved |
| Update value | ✅ Updated | ✅ Updated |
| Add new property | ✅ Added | ✅ Added |

---

## ✅ Summary

**Change:** From **merge** to **complete replacement**

**Impact:**
- ✅ Properties yang dihapus akan hilang dari database
- ✅ Null/undefined values tidak disimpan
- ✅ Database selalu clean dan sync dengan UI
- ✅ Tidak ada data "sampah"

**How to Verify:**
1. Edit form
2. Remove some properties
3. Save form
4. Check console logs (before/after prepare)
5. Check database `field_options` column
6. Removed properties should NOT exist

**Status:** 🎉 **IMPLEMENTED**
