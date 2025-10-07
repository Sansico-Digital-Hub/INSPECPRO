# Collapsible Field Settings - Implementation Guide

## Fitur: Tutup/Buka Settings Field

Menambahkan tombol collapse/expand untuk setiap field agar form builder tidak terlalu panjang dan tidak membingungkan.

---

## 🎯 Yang Akan Ditambahkan

1. **Toggle Button** (▶/▼) di header setiap field
2. **Collapse State** untuk menyembunyikan/menampilkan settings
3. **Field Name Preview** di header saat collapsed

---

## 📝 Implementation Steps

### Step 1: Add State Variable

Di dalam `FieldEditor` component, tambahkan state:

```tsx
function FieldEditor({...}) {
  // Add this line after the function declaration
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  
  // ... existing states
  const [dropdownOptions, setDropdownOptions] = useState<string[]>(...);
```

### Step 2: Update Header with Toggle Button

Find the header section (around line 747):

```tsx
<div className="flex justify-between items-start mb-4">
  <h4 className="text-md font-medium text-gray-900">
    {depth > 0 ? `Nested Field ${index + 1}` : `Field ${index + 1}`}
  </h4>
```

Replace with:

```tsx
<div className="flex justify-between items-start mb-4">
  <div className="flex items-center space-x-2 flex-1">
    {/* Toggle Button */}
    <button
      type="button"
      onClick={() => setIsExpanded(!isExpanded)}
      className="p-1 text-gray-600 hover:text-gray-900 transition-transform"
      title={isExpanded ? "Collapse" : "Expand"}
    >
      {isExpanded ? (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
    
    {/* Field Title with Preview */}
    <h4 className="text-md font-medium text-gray-900">
      {depth > 0 ? `Nested Field ${index + 1}` : `Field ${index + 1}`}
      {field.field_name && (
        <span className="text-sm text-gray-600 font-normal ml-2">
          - {field.field_name} ({field.field_type})
        </span>
      )}
    </h4>
  </div>
```

### Step 3: Wrap Settings in Conditional

Find the start of field settings (after the header, around line 778):

```tsx
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900">Field Name</label>
```

Add `{isExpanded && (` before the settings div:

```tsx
      </div>

      {isExpanded && (
        <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900">Field Name</label>
```

### Step 4: Close the Conditional

Find the END of all settings (before the final `</div>` of the component):

Look for the last settings section (Location Settings is usually last), find its closing:

```tsx
        </div>
      )}
    </div>  {/* This is the component's closing div */}
  );
}
```

Add closing before component div:

```tsx
        </div>
      )}
        </>
      )}
    </div>  {/* This is the component's closing div */}
  );
}
```

---

## 🎨 Visual Result

### Expanded (Default):
```
┌─────────────────────────────────────┐
│ ▼ Field 1 - Product ID (text)       │ [↑] [↓] [🗑️]
├─────────────────────────────────────┤
│ Field Name: [Product ID]            │
│ Field Type: ☑ Text ☐ Dropdown       │
│ ☑ Required Field                    │
│ ... all settings visible ...        │
└─────────────────────────────────────┘
```

### Collapsed:
```
┌─────────────────────────────────────┐
│ ▶ Field 1 - Product ID (text)       │ [↑] [↓] [🗑️]
└─────────────────────────────────────┘
```

---

## 💡 Benefits

1. **Cleaner UI**: Tidak terlalu panjang
2. **Less Confusing**: Fokus pada field yang sedang diedit
3. **Quick Overview**: Bisa lihat semua fields tanpa scroll
4. **Easy Navigation**: Expand hanya yang perlu diedit

---

## 🔧 Alternative: Simpler Approach

Jika implementasi di atas terlalu kompleks, gunakan approach ini:

### Simple CSS-only Collapse

Add to the field editor:

```tsx
const [isExpanded, setIsExpanded] = useState(true);

return (
  <div className="border border-gray-200 rounded-lg p-4">
    <div className="flex justify-between items-center mb-4 cursor-pointer" 
         onClick={() => setIsExpanded(!isExpanded)}>
      <div className="flex items-center space-x-2">
        <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
        <h4 className="text-md font-medium">
          Field {index + 1}
          {field.field_name && ` - ${field.field_name}`}
        </h4>
      </div>
      <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
        {/* Buttons */}
      </div>
    </div>
    
    {isExpanded && (
      <div>
        {/* All field settings here */}
      </div>
    )}
  </div>
);
```

---

## ✅ Testing

1. Create form with 3+ fields
2. Click arrow on Field 1 → Should collapse
3. Click again → Should expand
4. Collapsed field shows: "Field 1 - Product ID (text)"
5. All buttons (↑↓🗑️) still work when collapsed

---

## 🚀 Apply to Edit Form Too

Setelah berhasil di `forms/new/page.tsx`, apply perubahan yang sama ke:
- `forms/[id]/edit/page.tsx`

Copy exact same changes untuk consistency.

---

Karena ada kompleksitas dengan JSX structure, saya sarankan gunakan **Simple Approach** di atas yang lebih mudah diimplementasikan dan di-maintain.
