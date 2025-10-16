# InsPecPro Batch Files Guide

File batch ini dibuat untuk mempermudah pengelolaan aplikasi InsPecPro.

## File yang Tersedia

### 1. `install-dependencies.bat`
**Fungsi**: Menginstall semua dependencies untuk frontend dan backend
**Cara Pakai**: 
- Double-click file atau jalankan dari command prompt
- File ini akan menginstall:
  - Python dependencies dari `backend/requirements.txt`
  - Node.js dependencies dari `frontend/package.json`

### 2. `start-all.bat`
**Fungsi**: Menjalankan frontend dan backend secara bersamaan
**Cara Pakai**:
- Double-click file atau jalankan dari command prompt
- File ini akan:
  - Mengecek apakah dependencies sudah terinstall
  - Menjalankan backend server (Python) di terminal terpisah
  - Menjalankan frontend server (Node.js) di terminal terpisah
- Server akan berjalan di:
  - Backend: http://localhost:8000
  - Frontend: http://localhost:3000

### 3. `stop-all.bat`
**Fungsi**: Menghentikan semua server yang berjalan
**Cara Pakai**:
- Double-click file atau jalankan dari command prompt
- File ini akan menghentikan:
  - Semua proses Python (backend)
  - Semua proses Node.js (frontend)
  - Terminal windows yang terkait

## Urutan Penggunaan

1. **Pertama kali setup**: Jalankan `install-dependencies.bat`
2. **Untuk menjalankan aplikasi**: Jalankan `start-all.bat`
3. **Untuk menghentikan aplikasi**: Jalankan `stop-all.bat`

## Catatan Penting

- Pastikan Python dan Node.js sudah terinstall di sistem
- Jika ada error, cek apakah semua dependencies sudah terinstall dengan benar
- File batch ini dirancang untuk Windows
- Jika server tidak berhenti dengan stop-all.bat, tutup terminal windows secara manual