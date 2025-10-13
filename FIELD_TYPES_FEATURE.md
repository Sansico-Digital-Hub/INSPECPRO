# Field Types Feature Documentation

## Overview
Fitur **Field Types** memungkinkan satu field dalam form memiliki **multiple input types** sekaligus. Ini sangat berguna ketika Anda ingin mengumpulkan berbagai jenis data dalam satu field.

## Contoh Use Case

### 1. **Quality Check dengan Multiple Inputs**
Field: "Product Inspection"
- **Text**: Deskripsi produk
- **Photo**: Foto produk
- **Measurement**: Dimensi produk
- **Button**: Pass/Hold status

### 2. **Documentation Field**
Field: "Equipment Check"
- **Text**: Catatan kondisi
- **Signature**: Tanda tangan inspector
- **Date**: Tanggal pemeriksaan
- **Photo**: Foto equipment

### 3. **Compliance Verification**
Field: "Safety Compliance"
- **Dropdown**: Pilih standar compliance
- **Measurement**: Nilai measurement
- **Photo**: Bukti foto
- **Signature**: Approval signature

## Cara Menggunakan

### 1. **Membuat Form dengan Multiple Field Types**

#### Di Form Builder (Admin):
1. Buka **Forms** → **Edit Form**
2. Pilih atau tambah field baru
3. Pilih **Primary Field Type** (tipe utama)
4. Di bagian **"Additional Field Types"**, centang tipe-tipe tambahan yang diinginkan
5. Konfigurasi opsi untuk setiap tipe yang dipilih
6. Save form

#### Contoh Konfigurasi:
```
Field Name: "Product Quality Check"
Primary Type: TEXT
Additional Types: ☑ Photo, ☑ Measurement, ☑ Button

Options:
- Text: Placeholder untuk deskripsi
- Photo: Max size 5MB
- Measurement: Between 10-20 cm
- Button: Pass/Hold
```

### 2. **Mengisi Inspection dengan Multiple Field Types**

Ketika user mengisi inspection:
1. Field dengan multiple types akan menampilkan **semua input types** secara berurutan
2. Setiap tipe akan memiliki label yang jelas (contoh: "📝 Text:", "📷 Photo:")
3. User mengisi semua input yang required
4. Semua data disimpan terpisah per field type

#### Tampilan di Inspection Form:
```
┌─────────────────────────────────────────┐
│ Product Quality Check *                 │
├─────────────────────────────────────────┤
│ 📝 Text:                                │
│ [Input text field]                      │
├─────────────────────────────────────────┤
│ 📷 Photo:                               │
│ [Upload photo button]                   │
├─────────────────────────────────────────┤
│ 📏 Measurement:                         │
│ [Number input] cm                       │
│ Must be between 10 and 20               │
├─────────────────────────────────────────┤
│ ✓ Status:                               │
│ [Pass] [Hold]                           │
└─────────────────────────────────────────┘
```

## Technical Implementation

### Database Schema
```sql
-- form_fields table
field_type VARCHAR(50) NOT NULL,      -- Primary field type
field_types JSON,                      -- Array of additional field types
```

### Backend (Python)
```python
# models.py
class FormField(Base):
    field_type = Column(Enum(FieldType), nullable=False)  # Primary type
    field_types = Column(JSON)  # Multiple types support: ["text", "photo", "measurement"]

# Creating field with multiple types
field = FormField(
    field_name="Product Check",
    field_type=FieldType.TEXT,
    field_types=["text", "photo", "measurement", "button"],
    field_options={...}
)
```

### Frontend (TypeScript/React)
```typescript
// types/index.ts
export interface FormField {
  field_type: FieldType;           // Primary type
  field_types?: FieldType[];       // Additional types
}

// Rendering multiple field types
const fieldTypes = field.field_types?.length > 0 
  ? field.field_types 
  : [field.field_type];

fieldTypes.map(type => (
  <FieldInput type={type} ... />
))
```

### Response Storage
Setiap field type disimpan sebagai response terpisah:
```typescript
// Single type field
responses["123"] = { field_id: 123, response_value: "text" }

// Multiple types field
responses["123-text"] = { field_id: 123, response_value: "description" }
responses["123-photo"] = { field_id: 123, response_value: "photo.jpg" }
responses["123-measurement"] = { field_id: 123, measurement_value: 15.5 }
responses["123-button"] = { field_id: 123, pass_hold_status: "pass" }
```

## Export Behavior

### Excel Export
- Setiap field type akan menjadi **kolom terpisah**
- Format: `[Field Name] ([Type])`
- Contoh:
  - "Product Check (text)"
  - "Product Check (photo)"
  - "Product Check (measurement)"
  - "Product Check (button)"

### PDF Export
- Semua field types ditampilkan dalam satu section
- Setiap type memiliki label yang jelas
- Format visual yang mudah dibaca

## Best Practices

### ✅ DO:
1. **Gunakan untuk data yang saling terkait**
   - Contoh: Measurement + Photo + Status
   
2. **Kombinasi yang masuk akal**
   - Text + Photo (Deskripsi + Bukti)
   - Measurement + Button (Nilai + Pass/Hold)
   - Dropdown + Signature (Pilihan + Approval)

3. **Beri nama field yang jelas**
   - "Equipment Inspection" lebih baik dari "Field 1"

4. **Maksimal 3-4 types per field**
   - Terlalu banyak types membuat form membingungkan

### ❌ DON'T:
1. **Jangan kombinasi types yang tidak related**
   - Contoh: Date + Photo + Measurement (tidak ada hubungan logis)

2. **Jangan duplikasi primary type di field_types**
   - Jika primary type = TEXT, jangan tambahkan TEXT di field_types

3. **Jangan gunakan untuk field yang seharusnya terpisah**
   - Jika data tidak related, buat field terpisah

## Migration Guide

### Dari Single Type ke Multiple Types:
1. Field existing tetap berfungsi normal (backward compatible)
2. Untuk menambah types:
   - Edit form
   - Centang additional types
   - Save
3. Inspection lama tetap valid
4. Inspection baru akan menampilkan semua types

### Rollback:
1. Edit form
2. Uncheck additional types
3. Save
4. Field kembali ke single type

## Troubleshooting

### Issue: Field types tidak muncul di inspection form
**Solution**: 
- Pastikan `field_types` array tidak kosong
- Check bahwa frontend sudah di-refresh
- Verify data di database: `SELECT field_types FROM form_fields WHERE id = X`

### Issue: Response tidak tersimpan untuk semua types
**Solution**:
- Check initialization di `initializeFieldResponses()`
- Verify response keys: single type = `"123"`, multiple = `"123-text"`

### Issue: Export Excel menampilkan data salah
**Solution**:
- Backend sudah support field_types di export function
- Check mapping responses di `export_inspections_to_excel()`

## API Reference

### Get Form with Field Types
```http
GET /api/forms/{form_id}

Response:
{
  "id": 1,
  "form_name": "Quality Inspection",
  "fields": [
    {
      "id": 10,
      "field_name": "Product Check",
      "field_type": "text",
      "field_types": ["text", "photo", "measurement"],
      "field_options": {...}
    }
  ]
}
```

### Create Inspection with Multiple Types
```http
POST /api/inspections/

Body:
{
  "form_id": 1,
  "responses": [
    {
      "field_id": 10,
      "response_value": "Good condition"  // for text type
    },
    {
      "field_id": 10,
      "response_value": "photo123.jpg"    // for photo type
    },
    {
      "field_id": 10,
      "measurement_value": 15.5,          // for measurement type
      "pass_hold_status": "pass"          // for button type
    }
  ]
}
```

## Summary

Fitur **Field Types** memberikan fleksibilitas untuk:
- ✅ Mengumpulkan multiple jenis data dalam satu field
- ✅ Mengurangi jumlah field yang perlu dibuat
- ✅ Membuat form lebih terorganisir
- ✅ Meningkatkan user experience
- ✅ Backward compatible dengan field existing

**Status**: ✅ **FULLY IMPLEMENTED** - Ready to use!
