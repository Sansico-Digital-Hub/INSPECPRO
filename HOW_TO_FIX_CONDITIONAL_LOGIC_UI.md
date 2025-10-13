# How to Fix Conditional Logic UI - Add "Add Fields" Button

## Problem
The current conditional logic UI in the form builder shows field type checkboxes but doesn't allow admins to add UNLIMITED separate fields. It's treating conditional logic as "one field with multiple types" instead of "multiple separate fields per condition value".

## Current Wrong Structure
```typescript
// WRONG - Current implementation
field.field_options.conditional_logic = [
  {
    field_name: 'Field 1',
    dropdown_value: 'Option A',
    field_types: [FieldType.TEXT, FieldType.PHOTO],  // Multiple types for ONE field
    ...
  }
]
```

## Correct Structure (from types/index.ts)
```typescript
// CORRECT - Should be
field.has_conditional = true;
field.conditional_rules = [
  {
    condition_value: 'Option A',
    next_fields: [  // Array of MULTIPLE separate fields
      {
        field_name: 'Field 1',
        field_type: FieldType.TEXT,
        field_types: [],
        is_required: false,
        field_options: {},
        ...
      },
      {
        field_name: 'Field 2',
        field_type: FieldType.PHOTO,
        field_types: [],
        is_required: false,
        field_options: {},
        ...
      },
      // ... unlimited fields
    ]
  },
  {
    condition_value: 'Option B',
    next_fields: [
      // Different fields for Option B
    ]
  }
]
```

## Files to Modify

### 1. frontend/src/app/forms/new/page.tsx
### 2. frontend/src/app/forms/[id]/edit/page.tsx

## Changes Needed

### Step 1: Update "Add Condition" Button
**Location**: Around line 1165-1180

**Change FROM:**
```typescript
onClick={() => {
  const conditions = field.field_options?.conditional_logic || [];
  updateField(index, {
    field_options: {
      ...field.field_options,
      conditional_logic: [...conditions, { field_name: '', field_types: [], field_type: '' }]
    }
  });
}}
```

**Change TO:**
```typescript
onClick={() => {
  const conditionalRules = field.conditional_rules || [];
  updateField(index, {
    has_conditional: true,
    conditional_rules: [...conditionalRules, { condition_value: '', next_fields: [] }]
  });
}}
```

### Step 2: Replace Entire Conditional Logic Rendering Section
**Location**: Lines 1184-1567 (the entire conditional logic rendering block)

**Replace the entire section that starts with:**
```typescript
{field.field_options?.conditional_logic && field.field_options.conditional_logic.length > 0 && (
```

**With the new structure:**
```typescript
{field.has_conditional && field.conditional_rules && field.conditional_rules.length > 0 && (
  <div className="space-y-4">
    {field.conditional_rules.map((rule: any, ruleIndex: number) => (
      <div key={ruleIndex} className="bg-gray-50 p-4 rounded border border-gray-300">
        {/* Condition Header */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-1">When Value Equals</label>
            <select
              className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
              value={rule.condition_value || ''}
              onChange={(e) => {
                const rules = [...(field.conditional_rules || [])];
                rules[ruleIndex] = { ...rules[ruleIndex], condition_value: e.target.value };
                updateField(index, { conditional_rules: rules });
              }}
            >
              <option value="">Select value...</option>
              {(field.field_options?.options || []).map((opt: string, optIdx: number) => (
                <option key={optIdx} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                const rules = (field.conditional_rules || []).filter((_: any, i: number) => i !== ruleIndex);
                updateField(index, { 
                  conditional_rules: rules,
                  has_conditional: rules.length > 0
                });
              }}
              className="w-full px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-300"
            >
              🗑️ Delete
            </button>
          </div>
        </div>

        {/* Fields List with "Add Field" Button */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-blue-900">
              📋 Fields to show (when "{rule.condition_value || 'this value'}"):
            </label>
            <button
              type="button"
              onClick={() => {
                const rules = [...(field.conditional_rules || [])];
                const nextFields = rules[ruleIndex].next_fields || [];
                rules[ruleIndex] = {
                  ...rules[ruleIndex],
                  next_fields: [...nextFields, {
                    field_name: '',
                    field_type: FieldType.TEXT,
                    field_types: [],
                    field_options: {},
                    is_required: false,
                    field_order: nextFields.length
                  }]
                };
                updateField(index, { conditional_rules: rules });
              }}
              className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Add Field
            </button>
          </div>

          {rule.next_fields && rule.next_fields.length > 0 ? (
            <div className="space-y-3 pl-4 border-l-2 border-blue-300">
              {rule.next_fields.map((nextField: any, fieldIndex: number) => (
                <div key={fieldIndex} className="bg-white p-3 rounded border border-gray-200">
                  {/* Field Name Input */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1">Field Name</label>
                      <input
                        type="text"
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                        placeholder="Enter field name"
                        value={nextField.field_name || ''}
                        onChange={(e) => {
                          const rules = [...(field.conditional_rules || [])];
                          const fields = [...rules[ruleIndex].next_fields];
                          fields[fieldIndex] = { ...fields[fieldIndex], field_name: e.target.value };
                          rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                          updateField(index, { conditional_rules: rules });
                        }}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => {
                          const rules = [...(field.conditional_rules || [])];
                          const fields = rules[ruleIndex].next_fields.filter((_: any, i: number) => i !== fieldIndex);
                          rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                          updateField(index, { conditional_rules: rules });
                        }}
                        className="w-full px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-300"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  {/* Field Types Checkboxes */}
                  <div>
                    <label className="block text-xs font-medium text-gray-900 mb-1">Field Types</label>
                    <div className="grid grid-cols-4 gap-2 p-2 border border-gray-300 rounded bg-gray-50">
                      {[
                        { value: FieldType.TEXT, label: 'Text' },
                        { value: FieldType.DROPDOWN, label: 'Dropdown' },
                        { value: FieldType.SEARCH_DROPDOWN, label: 'Search Dropdown' },
                        { value: FieldType.BUTTON, label: 'Button' },
                        { value: FieldType.PHOTO, label: 'Photo' },
                        { value: FieldType.SIGNATURE, label: 'Signature' },
                        { value: FieldType.MEASUREMENT, label: 'Measurement' },
                        { value: FieldType.NOTES, label: 'Notes' },
                        { value: FieldType.DATE, label: 'Date' },
                        { value: FieldType.DATETIME, label: 'Date & Time' },
                        { value: FieldType.TIME, label: 'Time' },
                      ].map((type) => (
                        <label key={type.value} className="flex items-center space-x-1 text-xs text-gray-900">
                          <input
                            type="checkbox"
                            className="h-3 w-3 text-blue-600 border-gray-300 rounded"
                            checked={(nextField.field_types || []).includes(type.value)}
                            onChange={(e) => {
                              const rules = [...(field.conditional_rules || [])];
                              const fields = [...rules[ruleIndex].next_fields];
                              const current = fields[fieldIndex].field_types || [];
                              const next = e.target.checked
                                ? [...current, type.value]
                                : current.filter((t: any) => t !== type.value);
                              fields[fieldIndex] = { 
                                ...fields[fieldIndex], 
                                field_types: next, 
                                field_type: next[0] || FieldType.TEXT 
                              };
                              rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                              updateField(index, { conditional_rules: rules });
                            }}
                          />
                          <span className="text-[10px]">{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Required Checkbox */}
                  <div className="mt-2">
                    <label className="flex items-center space-x-2 text-xs text-gray-900">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        checked={nextField.is_required || false}
                        onChange={(e) => {
                          const rules = [...(field.conditional_rules || [])];
                          const fields = [...rules[ruleIndex].next_fields];
                          fields[fieldIndex] = { ...fields[fieldIndex], is_required: e.target.checked };
                          rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                          updateField(index, { conditional_rules: rules });
                        }}
                      />
                      <span>Required field</span>
                    </label>
                  </div>

                  {/* Dropdown Options (if dropdown selected) */}
                  {((nextField.field_types || []).includes(FieldType.DROPDOWN) || 
                    (nextField.field_types || []).includes(FieldType.SEARCH_DROPDOWN)) && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-gray-900 mb-1">
                        Dropdown Options (comma-separated)
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                        placeholder="Option 1, Option 2, Option 3"
                        value={((nextField.field_options?.options || []) as string[]).join(', ')}
                        onChange={(e) => {
                          const rules = [...(field.conditional_rules || [])];
                          const fields = [...rules[ruleIndex].next_fields];
                          const options = e.target.value.split(',').map(o => o.trim()).filter(Boolean);
                          fields[fieldIndex] = { 
                            ...fields[fieldIndex], 
                            field_options: { ...fields[fieldIndex].field_options, options } 
                          };
                          rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                          updateField(index, { conditional_rules: rules });
                        }}
                      />
                    </div>
                  )}

                  {/* Placeholder Text */}
                  <div className="mt-2">
                    <label className="block text-xs font-medium text-gray-900 mb-1">
                      Placeholder/Instructions
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                      placeholder="Enter placeholder text or instructions"
                      value={nextField.placeholder_text || ''}
                      onChange={(e) => {
                        const rules = [...(field.conditional_rules || [])];
                        const fields = [...rules[ruleIndex].next_fields];
                        fields[fieldIndex] = { ...fields[fieldIndex], placeholder_text: e.target.value };
                        rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                        updateField(index, { conditional_rules: rules });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic pl-4">
              No fields added yet. Click "+ Add Field" to add fields that will show when this condition is met.
            </p>
          )}
        </div>

        <p className="text-xs text-gray-700 mt-3 italic">
          💡 This field will only show when conditions are met
        </p>
      </div>
    ))}
  </div>
)}
```

## Key Features of New UI

1. **"+ Add Field" Button**: Green button that adds unlimited fields to each condition
2. **Field List**: Shows all fields added for that condition value
3. **Delete Field**: Each field has its own delete button
4. **Field Types**: Checkboxes to select multiple types per field
5. **Required Toggle**: Checkbox to make field required
6. **Dropdown Options**: Input for dropdown options (appears when dropdown type selected)
7. **Placeholder**: Input for placeholder/instructions text
8. **Visual Hierarchy**: Blue left border shows conditional fields clearly

## Testing

After implementing:
1. Create a form with a dropdown field
2. Add dropdown options (Option A, Option B, etc.)
3. Enable conditional logic
4. Click "+ Add Condition"
5. Select "When Value Equals" = "Option A"
6. Click "+ Add Field" button (THIS IS THE NEW BUTTON!)
7. Add multiple fields
8. Each field can have its own name, types, and settings
9. Save the form
10. Test in inspector page - all fields should appear when condition is met

## Backend Compatibility

The backend already supports this structure! Check `backend/models.py`:
- `FormField` has `has_conditional` and `conditional_rules` columns
- `conditional_rules` is stored as JSON with the correct structure
- No backend changes needed!

## Summary

The fix changes the UI from:
- ❌ "One conditional field with multiple types"
- ✅ "Multiple separate conditional fields per condition value"

This matches the TypeScript interface `ConditionalRule` which has `next_fields: FormField[]` - an array of complete field objects, not just types!
