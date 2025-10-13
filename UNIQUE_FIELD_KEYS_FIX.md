# Unique Field Keys Fix - Conditional Logic Auto-Fill Issue

## ✅ Problem Fixed

### **Issue:**
Conditional fields dengan nama yang sama otomatis terisi dengan value yang sama di New Inspection dan Edit Inspection pages.

**Example:**
```
Approved Sample: "Non-Compliant"
  ↳ Keterangan: "QBK 132 - Cetakan Bergaris"

Mylar: "Non-Compliant"
  ↳ Keterangan: "QBK 132 - Cetakan Bergaris"  ← AUTO FILLED! (Wrong!)
```

### **Root Cause:**
Conditional fields tidak punya `id` dari database. Semua field dengan nama "Keterangan" menggunakan key yang sama, sehingga share state.

```typescript
// BEFORE: All "Keterangan" fields use same key
const responseKey = field.id ? `${field.id}` : undefined;
// Result: All conditional fields without ID share the same undefined key
```

---

## 🔧 Solution Implemented

### **Generate Unique Keys Using Parent Path**

```typescript
// NEW: Generate unique key for each field
const fieldKey = field.id 
  ? `${field.id}`  // Use ID if available
  : `${parentPath}-${field.field_name.replace(/\s+/g, '_')}`;  // Use parent path + name

// Example keys:
// "5"                                    ← Field with ID 5
// "5-rule0-field0-Keterangan"           ← Conditional field under field 5
// "5-rule0-field0-rule0-field0-Detail"  ← Nested conditional field
```

---

## 📊 How It Works

### **1. Initialize Responses with Unique Keys**

```typescript
const initializeFieldResponses = (
  field: FormField,
  initialResponses: Record<string, InspectionResponse>,
  docNumber: string = '',
  parentPath: string = ''  // ← Track parent path
) => {
  // Generate unique key
  const fieldKey = field.id 
    ? `${field.id}` 
    : `${parentPath}-${field.field_name.replace(/\s+/g, '_')}`;
  
  // Initialize response with unique key
  initialResponses[fieldKey] = {
    field_id: field.id || null,
    response_value: '',
    ...
  };
  
  // Recursively initialize conditional fields
  if (field.has_conditional && field.conditional_rules) {
    field.conditional_rules.forEach((rule, ruleIndex) => {
      rule.next_fields.forEach((conditionalField, fieldIndex) => {
        // Create unique parent path for nested fields
        const newParentPath = `${fieldKey}-rule${ruleIndex}-field${fieldIndex}`;
        initializeFieldResponses(conditionalField, initialResponses, docNumber, newParentPath);
      });
    });
  }
};
```

### **2. Render Fields with Same Unique Keys**

```typescript
function MultiTypeFieldRenderer({
  field,
  responses,
  updateResponse,
  parentPath = ''  // ← Track parent path
}) {
  // Generate same unique key
  const fieldKey = field.id 
    ? `${field.id}` 
    : `${parentPath}-${field.field_name.replace(/\s+/g, '_')}`;
  
  // Use unique key to get/set response
  const responseKey = fieldKey;
  const response = responses[responseKey];
  
  // Render conditional fields with unique parent path
  matchingRule.next_fields.map((conditionalField, idx) => {
    const ruleIndex = field.conditional_rules?.findIndex(r => r === matchingRule) || 0;
    const newParentPath = `${fieldKey}-rule${ruleIndex}-field${idx}`;
    
    return (
      <MultiTypeFieldRenderer
        field={conditionalField}
        responses={responses}
        updateResponse={updateResponse}
        parentPath={newParentPath}  // ← Pass parent path
      />
    );
  });
}
```

---

## 🌳 Key Structure Example

### **Form Structure:**
```
Field 5: "Approved Sample" (dropdown)
  ↳ Rule 0: If "Non-Compliant"
      ↳ Field 0: "Keterangan" (text)
      
Field 6: "Mylar" (dropdown)
  ↳ Rule 0: If "Non-Compliant"
      ↳ Field 0: "Keterangan" (text)
```

### **Generated Keys:**

#### **BEFORE (Wrong):**
```javascript
responses = {
  "5": { response_value: "Non-Compliant" },
  "6": { response_value: "Non-Compliant" },
  "undefined": { response_value: "QBK 132" },  // ← Both "Keterangan" use same key!
}
```

#### **AFTER (Correct):**
```javascript
responses = {
  "5": { response_value: "Non-Compliant" },
  "5-rule0-field0-Keterangan": { response_value: "QBK 132" },  // ← Unique key!
  
  "6": { response_value: "Non-Compliant" },
  "6-rule0-field0-Keterangan": { response_value: "QBK 135" },  // ← Different key!
}
```

---

## 🔄 Nested Conditional Example

### **Form Structure:**
```
Field 5: "Status" (dropdown)
  ↳ Rule 0: If "Issue"
      ↳ Field 0: "Issue Type" (dropdown)
          ↳ Rule 0: If "Critical"
              ↳ Field 0: "Action" (text)
```

### **Generated Keys:**
```javascript
responses = {
  "5": { response_value: "Issue" },
  "5-rule0-field0-Issue_Type": { response_value: "Critical" },
  "5-rule0-field0-rule0-field0-Action": { response_value: "Stop production" },
}
```

Each nested level adds to the path, ensuring uniqueness!

---

## ✅ What's Fixed

### **1. Conditional Fields Independent** ✅
```
Approved Sample → Keterangan: "QBK 132"
Mylar → Keterangan: "QBK 135"  ← Different value! ✅
```

### **2. Nested Conditional Independent** ✅
```
Field A → Conditional 1 → Nested 1: "Value A"
Field A → Conditional 2 → Nested 1: "Value B"  ← Different value! ✅
```

### **3. Deeper Nested Independent** ✅
```
Level 1 → Level 2 → Level 3 → Level 4: "Value X"
Level 1 → Level 2 → Level 3 → Level 5: "Value Y"  ← Different value! ✅
```

---

## 🧪 Testing

### **Test 1: Two Fields with Same Conditional Name**
```
1. Create form:
   - Field "Approved Sample" (dropdown: Compliant/Non-Compliant)
     - If "Non-Compliant" → "Keterangan" (text)
   - Field "Mylar" (dropdown: Compliant/Non-Compliant)
     - If "Non-Compliant" → "Keterangan" (text)

2. New Inspection:
   - Select "Approved Sample" = "Non-Compliant"
   - Fill "Keterangan" = "Issue A"
   - Select "Mylar" = "Non-Compliant"
   - Fill "Keterangan" = "Issue B"

3. Verify:
   ✅ Both "Keterangan" fields have different values
   ✅ Changing one doesn't affect the other
```

### **Test 2: Nested Conditional**
```
1. Create form with nested conditional
2. Fill parent field → conditional appears
3. Fill conditional field → nested conditional appears
4. Fill nested field
5. Change parent field value
6. Fill conditional again

7. Verify:
   ✅ Each conditional has independent value
   ✅ Nested fields don't share values
```

### **Test 3: Edit Inspection**
```
1. Create inspection with conditional fields
2. Save inspection
3. Edit inspection
4. Verify:
   ✅ All conditional field values loaded correctly
   ✅ Can edit each field independently
```

---

## 📝 Console Output

### **Before Fix:**
```javascript
🔀 Field "Keterangan" has conditional logic:
  currentValue: "QBK 132"
  
🔀 Field "Keterangan" has conditional logic:
  currentValue: "QBK 132"  ← Same value! (Wrong)
```

### **After Fix:**
```javascript
🔀 Field "Keterangan" (key: 5-rule0-field0-Keterangan) has conditional logic:
  currentValue: "QBK 132"
  
🔀 Field "Keterangan" (key: 6-rule0-field0-Keterangan) has conditional logic:
  currentValue: "QBK 135"  ← Different value! ✅
```

---

## 🎯 Key Benefits

### **1. Unique State** ✅
- Each conditional field has unique key
- No state sharing between fields
- Independent values

### **2. Unlimited Nesting** ✅
- Works for any depth level
- Each level adds to parent path
- Always unique

### **3. Same Field Names OK** ✅
- Multiple fields can have same name
- Parent path makes them unique
- No conflicts

### **4. Backward Compatible** ✅
- Fields with ID still use ID as key
- Only conditional fields use parent path
- Existing data still works

---

## 📋 Files Modified

### **1. New Inspection Page** ✅
- `frontend/src/app/inspections/new/page.tsx`
- Updated `initializeFieldResponses()` with `parentPath` parameter
- Updated `MultiTypeFieldRenderer()` with `parentPath` parameter
- Generate unique keys for conditional fields

### **2. Edit Inspection Page** ✅
- `frontend/src/app/inspections/[id]/edit/page.tsx`
- Updated `initializeFieldResponses()` with `parentPath` parameter
- Updated `MultiTypeFieldRenderer()` with `parentPath` parameter
- Generate unique keys for conditional fields

---

## ✅ Summary

**Problem:** Conditional fields dengan nama sama auto-fill dengan value yang sama

**Root Cause:** Conditional fields tanpa ID menggunakan key yang sama

**Solution:** Generate unique key menggunakan parent path + field name

**Result:**
- ✅ Setiap conditional field punya unique key
- ✅ Tidak ada auto-fill antar fields
- ✅ Works untuk unlimited nesting depth
- ✅ Backward compatible dengan existing data

**Status:** 🎉 **FIXED**
