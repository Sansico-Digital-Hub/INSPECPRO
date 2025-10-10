# Edit Form Updates - Quick Reference

Karena file edit form sangat besar, berikut adalah ringkasan perubahan yang perlu dilakukan:

## ✅ Already Done:
1. Added React import ✅
2. Added addFieldAt function ✅

## 🔄 Need to Update:

### 1. Field Type Dropdown - Add Subform Option
**Location:** Around line 250
**Add:** `<option value={FieldType.SUBFORM}>Subform (Repeatable)</option>`

### 2. Measurement Logic - Conditional Min/Max
**Location:** Around line 290-325
**Replace measurement section with:**
```tsx
{field.field_type === FieldType.MEASUREMENT && (
  <>
    <div>
      <label>Measurement Type</label>
      <select value={field.measurement_type || MeasurementType.BETWEEN}>
        <option value={MeasurementType.BETWEEN}>Between (Min-Max)</option>
        <option value={MeasurementType.HIGHER}>Higher Than (Min only)</option>
        <option value={MeasurementType.LOWER}>Lower Than (Max only)</option>
      </select>
    </div>

    {/* Show Min for BETWEEN and HIGHER */}
    {(field.measurement_type === MeasurementType.BETWEEN || 
      field.measurement_type === MeasurementType.HIGHER || 
      !field.measurement_type) && (
      <div>
        <label>Min Value {field.measurement_type === MeasurementType.HIGHER && '*'}</label>
        <input type="number" ... />
      </div>
    )}

    {/* Show Max for BETWEEN and LOWER */}
    {(field.measurement_type === MeasurementType.BETWEEN || 
      field.measurement_type === MeasurementType.LOWER || 
      !field.measurement_type) && (
      <div>
        <label>Max Value {field.measurement_type === MeasurementType.LOWER && '*'}</label>
        <input type="number" ... />
      </div>
    )}
  </>
)}
```

### 3. Add Photo/Button/Signature/Date Settings
**Location:** After NOTES field, before Conditional Logic
**Add all the settings sections from new form**

### 4. Conditional Logic - Only for Dropdown
**Location:** Around line 340
**Wrap with:** `{(field.field_type === FieldType.DROPDOWN || field.field_type === FieldType.SEARCH_DROPDOWN) && (`
**Close with:** `)}`

### 5. Add Field Buttons
**Location:** In fields.map()
**Wrap each field with:**
```tsx
<React.Fragment key={index}>
  {/* Add Field Button Above */}
  <div className="flex justify-center">
    <button onClick={() => addFieldAt(index)}>+ Add Field Here</button>
  </div>
  
  {/* Existing field div */}
  <div>...</div>
</React.Fragment>
```

**Add at bottom:**
```tsx
{/* Add Field Button at Bottom */}
<div className="flex justify-center pt-2">
  <button onClick={() => addField()}>+ Add Field at Bottom</button>
</div>
```

---

## Manual Steps Required:

Due to file size and complexity, I'll need to make these changes one by one.
Let me continue with the implementation...
