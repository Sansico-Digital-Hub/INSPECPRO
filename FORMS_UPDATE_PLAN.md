# Forms System Major Update Plan

## 7 Major Updates to Implement

### 1. ✅ Measurement Logic Update
**Current:** Shows both Min and Max value fields regardless of measurement type
**New:** 
- `LOWER THAN` → Show only MAX VALUE field (no min value needed)
- `HIGHER THAN` → Show only MIN VALUE field (no max value needed)
- `BETWEEN` → Show both MIN and MAX VALUE fields

**Implementation:**
- Update `frontend/src/app/forms/new/page.tsx`
- Update `frontend/src/app/forms/[id]/edit/page.tsx`
- Add conditional rendering based on `measurement_type`

---

### 2. ✅ Conditional Logic - Only for Dropdown Fields
**Current:** Conditional logic shows for all field types
**New:** Conditional logic section only appears when field type is DROPDOWN or SEARCH_DROPDOWN

**Purpose:** This works like IF-ELSE in coding
- Dropdown with options: YES, NO, N/A
- YES → Show specific following forms
- NO → Show different following forms
- N/A → Show different following forms

**Features:**
- Multiple conditional logic rules per field
- Nested conditional logic support (conditional fields can have their own conditions)
- Complex form branching

**Implementation:**
- Wrap conditional logic section in condition: `{(field.field_type === FieldType.DROPDOWN || field.field_type === FieldType.SEARCH_DROPDOWN) && (...)}` 

---

### 3. ✅ Add SUBFORM Field Type
**New Field Type:** SUBFORM
**Purpose:** Allow inspectors to dynamically add multiple instances of a subform

**How it works:**
1. Admin creates a SUBFORM field with template fields
2. Inspector sees ONE instance initially
3. Inspector can click "+ Add Another" to add more instances
4. Each instance is independent but follows the same template

**Example Use Case:**
```
Subform: "Defect Details"
  - Defect Type (Dropdown)
  - Defect Location (Text)
  - Defect Photo (Photo)
  - Severity (Dropdown)

Inspector can add multiple defects, each with its own details
```

**Implementation:**
- Add `SUBFORM` to FieldType enum ✅
- Add subform configuration UI in form builder
- Store subform template in `field_options.subform_fields`
- Create subform renderer for inspection page

---

### 4. ✅ Add Field Buttons Between Fields
**Current:** Only one "+ Add Field" button at the top
**New:** "+ Add Field" buttons:
- Between every field
- At the bottom of the field list

**Purpose:** Easy to insert forgotten fields in the middle without reordering

**Implementation:**
- Add button component between each field in the map
- Add button at the end of fields list
- `addFieldAt(index)` function to insert at specific position

---

### 5. ✅ Photo Field Settings
**Current:** No configuration for photo fields
**New Settings:**
- **Max File Size (MB):** Admin can set max upload size (default: 5MB)
- **Image Quality:** Admin can set compression quality (Low/Medium/High/Original)
  - Low: 50% quality, smaller file
  - Medium: 70% quality
  - High: 90% quality
  - Original: No compression

**Implementation:**
- Add to `field_options`:
  ```json
  {
    "max_size_mb": 5,
    "quality": "medium"
  }
  ```
- Add UI controls in form builder
- Implement compression on upload

---

### 6. ✅ Settings for Other Field Types
**Current:** No configuration for Button, Signature, Date fields
**New Settings:**

#### Button Field
- **Button Labels:** Customize button text (default: Pass/Hold)
- **Button Colors:** Choose colors for each option
- **Options:** Can add more than 2 options
  ```json
  {
    "options": [
      {"label": "Pass", "color": "green"},
      {"label": "Hold", "color": "yellow"},
      {"label": "Reject", "color": "red"}
    ]
  }
  ```

#### Signature Field
- **Required Name:** Require name input with signature
- **Required Date:** Auto-add date/time to signature
- **Signature Type:** Touch/Mouse/Both
  ```json
  {
    "require_name": true,
    "require_date": true,
    "input_type": "both"
  }
  ```

#### Date/DateTime/Time Fields
- **Min Date:** Earliest selectable date
- **Max Date:** Latest selectable date
- **Default Value:** Today/Custom/None
- **Format:** Date format display
  ```json
  {
    "min_date": "2024-01-01",
    "max_date": "2025-12-31",
    "default_value": "today",
    "format": "DD/MM/YYYY"
  }
  ```

---

### 7. ✅ Database Save Verification
**Ensure:** When clicking Save/Create, data is properly saved to database

**Checks:**
1. Form metadata saved to `forms` table
2. All fields saved to `form_fields` table with correct `field_options` JSON
3. Field order preserved
4. Conditional logic stored correctly
5. All new field settings stored in `field_options`

**Database Schema Update Needed:**
- `form_fields.field_options` (JSON) should store:
  - Dropdown options
  - Conditional logic
  - Measurement settings
  - Photo settings
  - Button settings
  - Signature settings
  - Date settings
  - Subform template

---

## Implementation Order

### Phase 1: Core Updates (High Priority)
1. ✅ Measurement logic (conditional min/max)
2. ✅ Conditional logic only for dropdowns
3. ✅ Add field buttons between fields

### Phase 2: New Features (Medium Priority)
4. ✅ Photo field settings
5. ✅ Button/Signature/Date field settings

### Phase 3: Advanced Features (Complex)
6. ✅ Subform field type
7. ✅ Database save verification

---

## Files to Update

### Frontend
1. `frontend/src/types/index.ts` - Add SUBFORM enum ✅
2. `frontend/src/app/forms/new/page.tsx` - Main form builder
3. `frontend/src/app/forms/[id]/edit/page.tsx` - Form editor
4. `frontend/src/app/inspections/new/page.tsx` - Inspection form renderer (for subforms)

### Backend
1. `backend/models.py` - Verify field_options can store all new data
2. `backend/schemas.py` - Update validation if needed
3. `backend/routers/forms.py` - Verify save logic

---

## Testing Checklist

- [ ] Measurement: Lower than shows only max
- [ ] Measurement: Higher than shows only min
- [ ] Measurement: Between shows both
- [ ] Conditional logic only shows for dropdown fields
- [ ] Can add field between existing fields
- [ ] Can add field at bottom
- [ ] Photo settings save and load correctly
- [ ] Button custom options work
- [ ] Signature settings work
- [ ] Date min/max work
- [ ] Subform can be added dynamically
- [ ] All settings save to database
- [ ] All settings load from database on edit

---

## Next Steps

1. Start with Phase 1 updates (simpler changes)
2. Test each update individually
3. Move to Phase 2 once Phase 1 is stable
4. Implement Phase 3 (subform) last as it's most complex
5. Full integration testing
6. Database migration if needed

---

**Status:** Planning Complete - Ready for Implementation
**Estimated Time:** 2-3 hours for full implementation
**Priority:** High - User requested all features
