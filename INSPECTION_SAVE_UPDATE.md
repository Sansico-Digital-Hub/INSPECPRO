# Inspection Save Update - Handle Conditional Fields

## ✅ Updates Made

### **Problem:**
Conditional fields dengan `field_id: null` tidak bisa disimpan ke database karena backend mengharuskan `field_id`.

### **Solution:**
1. ✅ Updated frontend to separate regular and conditional responses
2. ✅ Updated backend schema to allow `field_id: null`
3. ✅ Updated backend to skip conditional responses (for now)
4. ✅ Added comprehensive logging

---

## 🔧 Frontend Changes

### **File:** `frontend/src/app/inspections/new/page.tsx`

#### **Enhanced handleSubmit:**

```typescript
const handleSubmit = async (asDraft: boolean = false) => {
  console.log('🔄 Inspection Submit Started');
  console.log('All Responses:', responses);

  // Separate regular and conditional responses
  const validResponses = Object.entries(responses)
    .filter(([key, response]) => {
      const hasValue = response.response_value || response.measurement_value !== undefined;
      const hasFieldId = response.field_id !== null;
      return hasValue && hasFieldId;
    })
    .map(([key, response]) => response);

  const conditionalResponses = Object.entries(responses)
    .filter(([key, response]) => {
      const hasValue = response.response_value || response.measurement_value !== undefined;
      const noFieldId = response.field_id === null;
      return hasValue && noFieldId;
    })
    .map(([key, response]) => ({
      field_key: key,  // Store unique key
      ...response
    }));

  console.log('Valid Responses (with field_id):', validResponses);
  console.log('Conditional Responses (without field_id):', conditionalResponses);

  const inspectionData = {
    form_id: selectedForm.id,
    responses: validResponses,
    // conditional_responses: conditionalResponses  // For future backend support
  };

  const inspection = await inspectionsAPI.createInspection(inspectionData);

  if (conditionalResponses.length > 0) {
    console.warn('⚠️ Conditional responses not saved:', conditionalResponses.length);
  }
};
```

---

## 🔧 Backend Changes

### **1. Schema Update**

**File:** `backend/schemas.py`

```python
# BEFORE
class InspectionResponseBase(BaseModel):
    field_id: int  # Required
    response_value: Optional[str] = None
    ...

# AFTER
class InspectionResponseBase(BaseModel):
    field_id: Optional[int] = None  # Allow null for conditional fields
    response_value: Optional[str] = None
    ...
```

### **2. Router Update**

**File:** `backend/routers/inspections.py`

```python
# Create responses
for response_data in inspection.responses:
    # Skip responses without field_id (conditional fields)
    if response_data.field_id is None:
        print(f"⚠️ Skipping response without field_id: {response_data.response_value}")
        continue
        
    # Create response for regular fields
    db_response = InspectionResponse(
        inspection_id=db_inspection.id,
        field_id=response_data.field_id,
        response_value=response_data.response_value,
        ...
    )
    db.add(db_response)
```

---

## 📊 Data Flow

### **1. User Fills Form**
```
Regular Field (Approved Sample):
  field_id: 5
  response_value: "Non-Compliant"

Conditional Field (Keterangan):
  field_id: null  ← No database ID
  response_value: "QBK 132"
```

### **2. Frontend Separates Responses**
```javascript
validResponses = [
  { field_id: 5, response_value: "Non-Compliant" }
]

conditionalResponses = [
  { field_id: null, field_key: "5-rule0-field0-Keterangan", response_value: "QBK 132" }
]
```

### **3. Frontend Sends to Backend**
```javascript
POST /api/inspections/
{
  form_id: 1,
  responses: [
    { field_id: 5, response_value: "Non-Compliant" }
  ]
  // conditionalResponses not sent (yet)
}
```

### **4. Backend Saves**
```python
# Save regular responses
for response in responses:
    if response.field_id is None:
        continue  # Skip conditional
    
    db_response = InspectionResponse(...)
    db.add(db_response)
```

---

## ⚠️ Current Limitations

### **Conditional Responses Not Saved**

**Status:** Conditional fields are NOT saved to database yet.

**Why:**
- Conditional fields don't have `field_id` from database
- Current database schema requires `field_id` for `inspection_responses` table
- Need new approach to store conditional responses

**Console Warning:**
```
⚠️ Conditional responses not saved: 3 responses
⚠️ Backend needs to support field_id: null or conditional_responses field
```

---

## 🔮 Future Solutions

### **Option 1: Store as JSON Metadata** (Recommended)

Add `metadata` column to `inspections` table:

```python
# models.py
class Inspection(Base):
    ...
    metadata = Column(JSON, nullable=True)  # Store conditional responses here
```

```python
# routers/inspections.py
db_inspection.metadata = {
    "conditional_responses": [
        {
            "field_key": "5-rule0-field0-Keterangan",
            "response_value": "QBK 132"
        }
    ]
}
```

### **Option 2: Create Separate Table**

```sql
CREATE TABLE conditional_responses (
    id SERIAL PRIMARY KEY,
    inspection_id INTEGER REFERENCES inspections(id),
    field_key VARCHAR(255),  -- Unique key like "5-rule0-field0-Keterangan"
    response_value TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **Option 3: Store in inspection_responses with field_id NULL**

Allow `field_id` to be nullable in database:

```sql
ALTER TABLE inspection_responses
ALTER COLUMN field_id DROP NOT NULL;

-- Add field_key column
ALTER TABLE inspection_responses
ADD COLUMN field_key VARCHAR(255);
```

Then update backend:

```python
db_response = InspectionResponse(
    inspection_id=db_inspection.id,
    field_id=response_data.field_id,  # Can be None
    field_key=response_data.field_key if response_data.field_id is None else None,
    response_value=response_data.response_value,
    ...
)
```

---

## 🧪 Testing

### **Test 1: Regular Fields Only**
```
1. Fill form with only regular fields
2. Submit inspection
3. Check console: "Valid Responses: 5"
4. Check console: "Conditional Responses: 0"
5. Verify: Inspection saved ✅
```

### **Test 2: With Conditional Fields**
```
1. Fill form with conditional fields
2. Submit inspection
3. Check console: "Valid Responses: 3"
4. Check console: "Conditional Responses: 2"
5. Check console: "⚠️ Conditional responses not saved: 2"
6. Verify: Regular fields saved ✅
7. Verify: Conditional fields NOT saved ⚠️
```

### **Test 3: Console Logging**
```
Expected console output:
🔄 Inspection Submit Started
Form ID: 1
Total Responses: 5
All Responses: {...}
Valid Responses (with field_id): [...]
Conditional Responses (without field_id): [...]
📤 Sending inspection data: {...}
✅ Inspection created: {...}
⚠️ Conditional responses not saved: 2 responses
```

---

## 📝 Console Output Examples

### **Success (No Conditional Fields):**
```
🔄 Inspection Submit Started
Form ID: 1
Total Responses: 3
Valid Responses (with field_id): Array(3) [...]
Conditional Responses (without field_id): Array(0) []
📤 Sending inspection data: {...}
✅ Inspection created: { id: 123, ... }
Toast: "Inspection submitted successfully"
```

### **Partial Success (With Conditional Fields):**
```
🔄 Inspection Submit Started
Form ID: 1
Total Responses: 5
Valid Responses (with field_id): Array(3) [...]
Conditional Responses (without field_id): Array(2) [
  { field_key: "5-rule0-field0-Keterangan", response_value: "QBK 132" },
  { field_key: "6-rule0-field0-Keterangan", response_value: "QBK 135" }
]
📤 Sending inspection data: {...}
✅ Inspection created: { id: 123, ... }
⚠️ Conditional responses not saved: 2 responses
⚠️ Backend needs to support field_id: null or conditional_responses field
Toast: "Inspection submitted successfully"
```

---

## 📋 Files Modified

### **Frontend:**
1. ✅ `frontend/src/app/inspections/new/page.tsx`
   - Enhanced `handleSubmit()` with response separation
   - Added comprehensive logging
   - Added warning for unsaved conditional responses

2. ✅ `frontend/src/types/index.ts`
   - Changed `field_id: number` to `field_id: number | null`

### **Backend:**
1. ✅ `backend/schemas.py`
   - Changed `field_id: int` to `field_id: Optional[int] = None`

2. ✅ `backend/routers/inspections.py`
   - Added check to skip `field_id: null` responses
   - Added warning log for skipped responses

---

## ✅ Summary

**Status:** 🟡 **PARTIAL IMPLEMENTATION**

**What Works:**
- ✅ Regular fields (with field_id) save correctly
- ✅ Frontend separates regular and conditional responses
- ✅ Backend accepts `field_id: null` in schema
- ✅ Comprehensive logging for debugging

**What Doesn't Work Yet:**
- ⚠️ Conditional fields (without field_id) are NOT saved
- ⚠️ Need database schema update or new table
- ⚠️ Need backend implementation to store conditional responses

**Next Steps:**
1. Choose storage solution (Option 1, 2, or 3)
2. Update database schema
3. Update backend to save conditional responses
4. Update frontend to send conditional responses
5. Update edit inspection to load conditional responses

**For Now:**
- Regular fields work perfectly ✅
- Conditional fields are logged but not saved ⚠️
- User can still submit inspections ✅
- Console shows what's missing ✅
