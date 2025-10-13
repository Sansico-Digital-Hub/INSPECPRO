# Conditional Fields Implementation - Complete Guide

## ✅ What Was Implemented

### Overview
The conditional logic system now supports **UNLIMITED nested fields** in the inspector pages. When admins create conditional fields with multiple levels of nesting, ALL fields will be properly displayed when their conditions are met.

## 🎯 Key Features

### 1. **Unlimited Nesting Support**
- Admins can add as many conditional fields as they want
- Each conditional field can have its own conditional fields
- Infinite depth of nesting is supported
- All fields are recursively rendered

### 2. **Dynamic Field Display**
- Fields appear/disappear based on user selections
- Real-time conditional logic evaluation
- Visual indicators showing which condition triggered the fields
- Indented display for better hierarchy visualization

### 3. **Complete Data Persistence**
- All conditional field responses are saved
- Responses are initialized for all fields (including nested ones)
- Edit mode preserves all conditional field data
- No data loss when switching between conditions

## 📝 Implementation Details

### Files Modified

#### 1. **`frontend/src/app/inspections/new/page.tsx`**

**Added `initializeFieldResponses` function:**
```typescript
const initializeFieldResponses = (
  field: FormField, 
  initialResponses: Record<string, InspectionResponse>,
  docNumber: string = ''
) => {
  // Initialize main field
  if (field.id) {
    const fieldTypes = (field.field_types && field.field_types.length > 0) 
      ? field.field_types 
      : [field.field_type];
    
    fieldTypes.forEach((fieldType) => {
      const responseKey = fieldTypes.length > 1 ? `${field.id}-${fieldType}` : `${field.id}`;
      initialResponses[responseKey] = {
        field_id: field.id!,
        response_value: isDocField && docNumber ? docNumber : '',
        measurement_value: undefined,
        pass_hold_status: undefined
      };
    });
  }
  
  // Recursively initialize conditional fields
  if (field.has_conditional && field.conditional_rules) {
    field.conditional_rules.forEach(rule => {
      if (rule.next_fields && rule.next_fields.length > 0) {
        rule.next_fields.forEach(conditionalField => {
          initializeFieldResponses(conditionalField, initialResponses, docNumber);
        });
      }
    });
  }
};
```

**Updated `MultiTypeFieldRenderer` component:**
```typescript
function MultiTypeFieldRenderer({ field, responses, updateResponse }) {
  // Get current value to check conditional logic
  const mainResponseKey = fieldTypes.length > 1 ? `${field.id}-${fieldTypes[0]}` : `${field.id}`;
  const currentValue = responses[mainResponseKey]?.response_value || '';
  
  // Find matching conditional rule
  const matchingRule = field.has_conditional && field.conditional_rules
    ? field.conditional_rules.find(rule => rule.condition_value === currentValue)
    : null;
  
  return (
    <div>
      {/* Main field rendering */}
      {/* ... */}
      
      {/* Render conditional fields recursively */}
      {matchingRule && matchingRule.next_fields && matchingRule.next_fields.length > 0 && (
        <div className="ml-6 mt-4 pl-4 border-l-2 border-blue-300 space-y-4">
          <div className="text-xs font-semibold text-blue-600 mb-2">
            ↳ Conditional Fields (when "{currentValue}"):
          </div>
          {matchingRule.next_fields.map((conditionalField, idx) => (
            <MultiTypeFieldRenderer
              key={`conditional-${field.id}-${conditionalField.field_name}-${idx}`}
              field={conditionalField}
              responses={responses}
              updateResponse={updateResponse}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

#### 2. **`frontend/src/app/inspections/[id]/edit/page.tsx`**

Same implementation as the new inspection page:
- Added `initializeFieldResponses` function
- Updated `MultiTypeFieldRenderer` component
- Supports editing existing inspections with conditional fields

## 🎨 Visual Features

### Conditional Field Display
```
Main Field: [Dropdown]
  ↳ Conditional Fields (when "Option A"):
    ├─ Nested Field 1
    ├─ Nested Field 2
    │   ↳ Conditional Fields (when "Yes"):
    │     ├─ Sub-nested Field 1
    │     └─ Sub-nested Field 2
    └─ Nested Field 3
```

### Visual Indicators
- **Blue left border**: Indicates conditional field section
- **Indentation**: Shows nesting level (6px margin-left per level)
- **Label**: Shows which condition triggered the fields
- **Recursive rendering**: Each conditional field can have its own conditionals

## 🔄 How It Works

### 1. **Form Selection/Loading**
```
User selects form
  ↓
initializeFieldResponses() called for each field
  ↓
Recursively initializes ALL fields (including nested conditionals)
  ↓
All response slots created in state
```

### 2. **User Interaction**
```
User selects value in dropdown
  ↓
currentValue updated in state
  ↓
matchingRule found based on currentValue
  ↓
Conditional fields rendered if rule matches
  ↓
Each conditional field can trigger its own conditionals
```

### 3. **Data Submission**
```
User submits form
  ↓
All responses collected (including conditional fields)
  ↓
Only filled responses sent to backend
  ↓
Backend saves all responses with field_id references
```

## 📊 Example Use Cases

### Use Case 1: Quality Inspection
```
Inspection Type: [Dropdown]
  - Visual Inspection
    ↳ Defect Found?: [Button: Yes/No]
      - Yes
        ↳ Defect Type: [Dropdown]
          - Scratch
            ↳ Scratch Length: [Measurement]
            ↳ Scratch Depth: [Measurement]
          - Dent
            ↳ Dent Size: [Measurement]
        ↳ Photo of Defect: [Photo]
        ↳ Inspector Signature: [Signature]
```

### Use Case 2: Equipment Maintenance
```
Equipment Status: [Dropdown]
  - Needs Repair
    ↳ Repair Type: [Dropdown]
      - Electrical
        ↳ Circuit Issue?: [Button: Yes/No]
          - Yes
            ↳ Circuit Number: [Text]
            ↳ Voltage Reading: [Measurement]
      - Mechanical
        ↳ Part Name: [Text]
        ↳ Part Photo: [Photo]
```

## ✅ Testing Checklist

- [x] Conditional fields appear when condition is met
- [x] Conditional fields hide when condition changes
- [x] Nested conditional fields work (unlimited depth)
- [x] All field types supported in conditional fields
- [x] Responses saved for all conditional fields
- [x] Edit mode loads conditional field data
- [x] Visual indicators show nesting levels
- [x] Multiple conditional rules per field work
- [x] Form submission includes all conditional responses

## 🚀 Benefits

1. **Unlimited Flexibility**: Admins can create complex forms with any level of nesting
2. **Better UX**: Users only see relevant fields based on their selections
3. **Data Integrity**: All responses are properly saved and loaded
4. **Visual Clarity**: Clear visual hierarchy shows field relationships
5. **Recursive Logic**: Self-referential rendering handles any complexity

## 📝 Notes

- Conditional fields are identified by `has_conditional: true` flag
- Each conditional rule has `condition_value` and `next_fields` array
- `next_fields` can contain any number of fields
- Each field in `next_fields` can have its own conditional rules
- The system recursively processes all levels automatically

---

**Implementation Date**: October 11, 2025
**Status**: ✅ Complete and Production Ready
