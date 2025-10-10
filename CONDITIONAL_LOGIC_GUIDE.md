# Conditional Logic Guide - Dropdown Branching

## ✅ API Endpoints Fixed!

All API endpoints now have the correct `/api` prefix. Forms should load properly now!

---

## 🔀 Conditional Logic for Dropdown Branching

### What is Dropdown Branching?

Dropdown branching allows you to show **different follow-up questions** based on what the user selects in a dropdown field.

**Example Scenario:**
```
Question 1: Select Equipment Type
  - Machine A
  - Machine B  
  - Machine C

If "Machine A" selected → Show Machine A specific questions
If "Machine B" selected → Show Machine B specific questions
If "Machine C" selected → Show Machine C specific questions
```

---

## 📋 Step-by-Step Example

### Scenario: Equipment Inspection with 3 Different Machines

#### Step 1: Create the Main Dropdown
```
Field #1: Equipment Type
  Type: Dropdown
  Options: Machine A, Machine B, Machine C
```

#### Step 2: Create Machine A Questions
```
Field #2: Machine A - Temperature Check
  Type: Measurement
  Conditional Logic:
    - Field: Equipment Type
    - Operator: Equals
    - Value: Machine A

Field #3: Machine A - Pressure Reading
  Type: Measurement
  Conditional Logic:
    - Field: Equipment Type
    - Operator: Equals
    - Value: Machine A

Field #4: Machine A - Oil Level
  Type: Dropdown (Low, Normal, High)
  Conditional Logic:
    - Field: Equipment Type
    - Operator: Equals
    - Value: Machine A
```

#### Step 3: Create Machine B Questions
```
Field #5: Machine B - Speed Check
  Type: Measurement
  Conditional Logic:
    - Field: Equipment Type
    - Operator: Equals
    - Value: Machine B

Field #6: Machine B - Vibration Level
  Type: Dropdown (Low, Medium, High)
  Conditional Logic:
    - Field: Equipment Type
    - Operator: Equals
    - Value: Machine B

Field #7: Machine B - Belt Condition
  Type: Dropdown (Good, Worn, Replace)
  Conditional Logic:
    - Field: Equipment Type
    - Operator: Equals
    - Value: Machine B
```

#### Step 4: Create Machine C Questions
```
Field #8: Machine C - Hydraulic Pressure
  Type: Measurement
  Conditional Logic:
    - Field: Equipment Type
    - Operator: Equals
    - Value: Machine C

Field #9: Machine C - Fluid Level
  Type: Dropdown (Low, Normal, High)
  Conditional Logic:
    - Field: Equipment Type
    - Operator: Equals
    - Value: Machine C

Field #10: Machine C - Filter Status
  Type: Dropdown (Clean, Dirty, Replace)
  Conditional Logic:
    - Field: Equipment Type
    - Operator: Equals
    - Value: Machine C
```

---

## 🎯 How It Works During Inspection

### Initial State
```
[Dropdown: Equipment Type] ▼
  - Machine A
  - Machine B
  - Machine C

(All other fields are hidden)
```

### User Selects "Machine A"
```
[Dropdown: Equipment Type] Machine A ✓

--- Machine A Questions Appear ---
[Input: Machine A - Temperature Check]
[Input: Machine A - Pressure Reading]
[Dropdown: Machine A - Oil Level]

(Machine B and C questions remain hidden)
```

### User Selects "Machine B"
```
[Dropdown: Equipment Type] Machine B ✓

--- Machine B Questions Appear ---
[Input: Machine B - Speed Check]
[Dropdown: Machine B - Vibration Level]
[Dropdown: Machine B - Belt Condition]

(Machine A and C questions are now hidden)
```

---

## 💡 Advanced Use Cases

### 1. Nested Branching (Multiple Levels)

```
Level 1: Equipment Type → Machine A

Level 2: Machine A Status → Pass or Hold

Level 3 (if Hold): 
  - Show: Reason for Hold
  - Show: Corrective Action Required
  - Show: Photo of Issue
```

**Configuration:**
```
Field 1: Equipment Type (Dropdown: Machine A, Machine B, Machine C)

Field 2: Machine A Status (Dropdown: Pass, Hold)
  Condition: Equipment Type = Machine A

Field 3: Reason for Hold (Text)
  Condition 1: Equipment Type = Machine A
  Condition 2: Machine A Status = Hold

Field 4: Corrective Action (Text)
  Condition 1: Equipment Type = Machine A
  Condition 2: Machine A Status = Hold

Field 5: Photo of Issue (Photo)
  Condition 1: Equipment Type = Machine A
  Condition 2: Machine A Status = Hold
```

### 2. Multiple Dropdown Branching

```
Dropdown 1: Department (Production, Quality, Maintenance)
Dropdown 2: Shift (Day, Night)

Show different questions based on BOTH selections:
- Production + Day → Production day shift questions
- Production + Night → Production night shift questions
- Quality + Day → Quality day shift questions
- etc.
```

**Configuration:**
```
Field 1: Department (Dropdown)
Field 2: Shift (Dropdown)

Field 3: Production Day Question
  Condition 1: Department = Production
  Condition 2: Shift = Day

Field 4: Production Night Question
  Condition 1: Department = Production
  Condition 2: Shift = Night
```

### 3. Measurement-Based Branching

```
Field 1: Temperature (Measurement)

Field 2: High Temperature Actions (Text)
  Condition: Temperature > 100

Field 3: Low Temperature Actions (Text)
  Condition: Temperature < 50
```

---

## 🛠️ How to Configure in Form Builder

### Step 1: Add Your Dropdown Field
1. Click "+ Add Field"
2. Set Field Name (e.g., "Equipment Type")
3. Set Field Type to "Dropdown" or "Search Dropdown"
4. Add Options (e.g., "Machine A, Machine B, Machine C")

### Step 2: Add Conditional Fields
1. Click "+ Add Field" for each follow-up question
2. Configure the field (name, type, etc.)
3. Scroll to "Conditional Logic" section
4. Click "+ Add Condition"

### Step 3: Configure the Condition
1. **Select Field:** Choose the dropdown field (e.g., "Equipment Type")
2. **Operator:** Choose "Equals"
3. **Value:** Enter the exact dropdown option (e.g., "Machine A")

### Step 4: Add More Conditions (Optional)
- Click "+ Add Condition" again for multiple conditions
- All conditions must be met (AND logic)

### Step 5: Repeat for Other Branches
- Add more fields for "Machine B" questions
- Add more fields for "Machine C" questions
- Each with their own conditional logic

---

## ✨ Best Practices

### 1. Clear Naming Convention
```
✅ Good:
  - Machine A - Temperature Check
  - Machine A - Pressure Reading
  - Machine B - Speed Check

❌ Bad:
  - Temperature
  - Pressure
  - Speed
```

### 2. Exact Value Matching
```
✅ Dropdown Option: "Machine A"
✅ Condition Value: "Machine A"

❌ Dropdown Option: "Machine A"
❌ Condition Value: "machine a" (case sensitive!)
```

### 3. Logical Field Order
```
✅ Good Order:
  1. Equipment Type (Dropdown)
  2-4. Machine A questions
  5-7. Machine B questions
  8-10. Machine C questions

❌ Bad Order:
  1. Equipment Type
  2. Machine A question
  3. Machine B question
  4. Machine A question
  5. Machine C question
```

### 4. Test Your Logic
- Create the form
- Test with an inspection
- Select each dropdown option
- Verify correct fields appear

---

## 🔍 Troubleshooting

### Fields Not Showing/Hiding

**Problem:** Conditional fields don't appear when dropdown is selected

**Solutions:**
1. ✅ Check value matches exactly (case-sensitive)
2. ✅ Verify field order (condition field must come BEFORE conditional field)
3. ✅ Check operator is correct ("Equals" for exact match)
4. ✅ Ensure field is saved properly

### Wrong Fields Appearing

**Problem:** Wrong questions show for selected option

**Solutions:**
1. ✅ Double-check condition values
2. ✅ Verify you're referencing the correct field
3. ✅ Check for typos in values
4. ✅ Ensure no conflicting conditions

### Multiple Conditions Not Working

**Problem:** Field with multiple conditions doesn't show

**Solutions:**
1. ✅ Remember: ALL conditions must be met (AND logic)
2. ✅ Check each condition individually
3. ✅ Verify field references are correct
4. ✅ Test with simple conditions first

---

## 📊 Real-World Example: Grafitect Form

### Scenario
You have a quality inspection form with different checks for different machines.

### Structure
```
1. Date/Time (Always visible)
2. Shift (Dropdown: Day, Night) (Always visible)
3. Inspector (Search Dropdown) (Always visible)
4. Machine Selection (Dropdown: Grafitect A, Grafitect B, Grafitect C)

--- Grafitect A Specific ---
5. Grafitect A - Line Speed
   Condition: Machine = Grafitect A
6. Grafitect A - Temperature
   Condition: Machine = Grafitect A
7. Grafitect A - Coating Thickness
   Condition: Machine = Grafitect A

--- Grafitect B Specific ---
8. Grafitect B - Pressure Check
   Condition: Machine = Grafitect B
9. Grafitect B - Flow Rate
   Condition: Machine = Grafitect B
10. Grafitect B - Quality Grade
    Condition: Machine = Grafitect B

--- Grafitect C Specific ---
11. Grafitect C - Humidity Level
    Condition: Machine = Grafitect C
12. Grafitect C - Adhesion Test
    Condition: Machine = Grafitect C
13. Grafitect C - Visual Inspection
    Condition: Machine = Grafitect C

--- Common Fields (Always visible) ---
14. Overall Status (Dropdown: Pass, Hold)
15. Inspector Signature
16. Notes
```

---

## 🎨 Visual Example

```
┌─────────────────────────────────────┐
│ Equipment Type: [Machine A ▼]      │
└─────────────────────────────────────┘
              ↓
    ┌─────────────────────┐
    │   Machine A = Yes   │
    └─────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ ✓ Machine A - Temperature Check    │
│ ✓ Machine A - Pressure Reading     │
│ ✓ Machine A - Oil Level            │
│                                     │
│ ✗ Machine B questions (hidden)     │
│ ✗ Machine C questions (hidden)     │
└─────────────────────────────────────┘
```

---

## ✅ Summary

**Conditional Logic Features:**
- ✅ Unlimited conditions per field
- ✅ Dropdown-based branching
- ✅ Multiple condition support (AND logic)
- ✅ 7 operators available
- ✅ Real-time field visibility

**Perfect For:**
- ✅ Equipment-specific questions
- ✅ Department-specific checklists
- ✅ Status-based follow-ups
- ✅ Dynamic inspection forms

**API Fixed:**
- ✅ All endpoints now use `/api` prefix
- ✅ Forms should load correctly
- ✅ Login and fetch working

---

**Ready to use!** Create your form with conditional logic now at:
http://localhost:3000/forms/new
