# Conditional Logic Display Fix

## ✅ Masalah yang Diperbaiki

### **Problem Statement:**
Data conditional logic (termasuk nested dan unlimited depth) yang ada di database **tidak ditampilkan** di:
1. Form Edit Page
2. Inspection New Page  
3. Inspection Edit Page

### **Root Cause:**
Conditional logic disimpan di database dalam kolom `field_options` (JSON), tetapi frontend tidak mengekstrak data tersebut saat load form.

**Database Structure:**
```json
{
  "field_options": {
    "options": ["Yes", "No"],
    "has_conditional": true,
    "conditional_rules": [
      {
        "condition_value": "Yes",
        "next_fields": [
          {
            "field_name": "Follow-up Question",
            "field_type": "text",
            "has_conditional": true,
            "conditional_rules": [...]  // Nested conditional
          }
        ]
      }
    ]
  }
}
```

---

## 🔧 Solusi yang Diimplementasikan

### 1. **Form Edit Page** (`/forms/[id]/edit`)

#### Perubahan:
```typescript
// BEFORE: Tidak mengekstrak conditional logic
const normalizedFields = (form.fields || []).map(field => ({
  ...field,
  field_types: field.field_types || []
}));

// AFTER: Mengekstrak conditional logic secara rekursif
const normalizeField = (field: any): any => {
  const fieldTypes = field.field_types || field.field_options?.field_types || [];
  
  // Extract conditional logic from field_options
  const hasConditional = field.has_conditional || field.field_options?.has_conditional || false;
  let conditionalRules = field.conditional_rules || field.field_options?.conditional_rules || [];
  
  // Recursively normalize nested fields in conditional rules
  if (conditionalRules && conditionalRules.length > 0) {
    conditionalRules = conditionalRules.map((rule: any) => ({
      ...rule,
      next_fields: (rule.next_fields || []).map((nestedField: any) => normalizeField(nestedField))
    }));
  }
  
  return {
    ...field,
    field_types: fieldTypes,
    has_conditional: hasConditional,
    conditional_rules: conditionalRules
  };
};

const normalizedFields = (form.fields || []).map(field => normalizeField(field));
```

#### Hasil:
✅ Conditional logic dari database sekarang ditampilkan
✅ Nested conditional logic (unlimited depth) juga ditampilkan
✅ Admin bisa edit conditional logic yang sudah ada

---

### 2. **Inspection New Page** (`/inspections/new`)

#### Perubahan:
```typescript
// BEFORE: Tidak mengekstrak conditional logic dari form
const fetchForms = async () => {
  const data = await formsAPI.getForms();
  setForms(data);
};

// AFTER: Normalize semua forms dan fields
const fetchForms = async () => {
  const data = await formsAPI.getForms();
  
  // Normalize all forms and their fields
  const normalizedForms = data.map(form => ({
    ...form,
    fields: (form.fields || []).map(field => normalizeField(field))
  }));
  
  setForms(normalizedForms);
};
```

#### Hasil:
✅ Conditional fields muncul saat user mengisi inspection
✅ Nested conditional fields muncul sesuai kondisi
✅ Unlimited depth conditional logic berfungsi

---

### 3. **Inspection Edit Page** (`/inspections/[id]/edit`)

#### Perubahan:
```typescript
// BEFORE: Tidak mengekstrak conditional logic
const fetchInspectionDetails = async () => {
  const formData = await formsAPI.getForm(inspectionData.form_id);
  setForm(formData);
};

// AFTER: Normalize form fields
const fetchInspectionDetails = async () => {
  const formData = await formsAPI.getForm(inspectionData.form_id);
  
  // Normalize form fields to extract conditional logic
  const normalizedForm = {
    ...formData,
    fields: (formData.fields || []).map(field => normalizeField(field))
  };
  
  setForm(normalizedForm);
};
```

#### Hasil:
✅ Conditional fields ditampilkan saat edit inspection
✅ Responses untuk conditional fields di-load dengan benar
✅ Nested conditional logic berfungsi

---

## 📊 Fungsi `normalizeField()` - Recursive Extraction

Fungsi ini mengekstrak conditional logic dari `field_options` secara rekursif:

```typescript
const normalizeField = (field: any): any => {
  // 1. Extract field_types
  const fieldTypes = field.field_types || field.field_options?.field_types || [];
  
  // 2. Extract conditional logic
  const hasConditional = field.has_conditional || field.field_options?.has_conditional || false;
  let conditionalRules = field.conditional_rules || field.field_options?.conditional_rules || [];
  
  // 3. Recursively normalize nested fields
  if (conditionalRules && conditionalRules.length > 0) {
    conditionalRules = conditionalRules.map((rule: any) => ({
      ...rule,
      next_fields: (rule.next_fields || []).map((nestedField: any) => 
        normalizeField(nestedField)  // ← RECURSIVE CALL
      )
    }));
  }
  
  // 4. Return normalized field
  return {
    ...field,
    field_types: fieldTypes,
    has_conditional: hasConditional,
    conditional_rules: conditionalRules
  };
};
```

### Kenapa Rekursif?
Karena conditional logic bisa nested unlimited depth:
```
Field A (dropdown)
  └─ If "Yes" → Field B (text)
      └─ If "Problem" → Field C (photo)
          └─ If uploaded → Field D (signature)
              └─ If signed → Field E (notes)
                  └─ ... (unlimited depth)
```

---

## 🎯 Testing Checklist

### Form Edit Page:
- [x] Load form dengan conditional logic dari database
- [x] Tampilkan conditional rules yang sudah ada
- [x] Tampilkan nested conditional rules (level 2, 3, 4+)
- [x] Bisa edit conditional logic existing
- [x] Bisa tambah conditional rules baru

### Inspection New Page:
- [x] Load form dengan conditional logic
- [x] Tampilkan conditional fields saat kondisi terpenuhi
- [x] Nested conditional fields muncul
- [x] Initialize responses untuk semua conditional fields
- [x] Submit inspection dengan conditional responses

### Inspection Edit Page:
- [x] Load inspection dengan conditional responses
- [x] Tampilkan conditional fields yang sudah diisi
- [x] Nested conditional fields muncul dengan data
- [x] Bisa edit responses di conditional fields
- [x] Update inspection dengan conditional responses

---

## 📝 Data Flow

### 1. **Database → Backend**
```
form_fields table:
- field_options (JSON) contains:
  - has_conditional: true/false
  - conditional_rules: [...]
```

### 2. **Backend → Frontend**
```typescript
GET /api/forms/{id}
Response: {
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

### 3. **Frontend Normalization**
```typescript
// Extract from field_options
field.has_conditional = field.field_options?.has_conditional
field.conditional_rules = field.field_options?.conditional_rules

// Recursively for nested fields
```

### 4. **Display**
```typescript
// Form Edit: Show in UI for editing
// Inspection New/Edit: Show based on conditions
```

---

## 🔍 Debugging Tips

### Check if conditional logic exists in database:
```sql
SELECT id, field_name, field_options 
FROM form_fields 
WHERE JSON_EXTRACT(field_options, '$.has_conditional') = true;
```

### Check if frontend receives the data:
```javascript
// In browser console
console.log('Form fields:', form.fields);
console.log('Has conditional:', form.fields[0].has_conditional);
console.log('Conditional rules:', form.fields[0].conditional_rules);
```

### Check if normalization works:
```javascript
// Add breakpoint in normalizeField()
console.log('Before normalize:', field);
console.log('After normalize:', normalizedField);
```

---

## ✅ Summary

**Status**: 🎉 **FULLY FIXED**

Semua conditional logic (termasuk nested dan unlimited depth) sekarang:
- ✅ Ditampilkan di Form Edit Page
- ✅ Ditampilkan di Inspection New Page
- ✅ Ditampilkan di Inspection Edit Page
- ✅ Berfungsi dengan benar untuk semua depth levels
- ✅ Responses disimpan dan di-load dengan benar

**Files Modified:**
1. `frontend/src/app/forms/[id]/edit/page.tsx`
2. `frontend/src/app/inspections/new/page.tsx`
3. `frontend/src/app/inspections/[id]/edit/page.tsx`

**Key Function Added:**
- `normalizeField()` - Recursive extraction of conditional logic from field_options
