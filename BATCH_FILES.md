# InsPecPro - Batch Files Documentation

Dokumentasi lengkap untuk semua batch files yang tersedia dalam proyek InsPecPro.

## 📋 Daftar Batch Files

### 1. `start.bat` - Start Semua Service (UNIFIED)
**Fungsi**: Menjalankan backend dan frontend dalam satu terminal
**Lokasi**: Root directory proyek

**Fitur**:
- ✅ **UNIFIED STARTUP**: Backend + Frontend dalam satu terminal
- ✅ Auto-check Python dan Node.js
- ✅ Install dependencies otomatis
- ✅ Start backend (FastAPI) di port 8000
- ✅ Start frontend (Next.js) di port 3000
- ✅ Buka browser otomatis
- ✅ PowerShell background job management
- ✅ Real-time monitoring kedua service
- ✅ Fallback ke basic mode jika PowerShell tidak tersedia

**Cara Penggunaan**:
```bash
# Dari root directory
.\start.bat
```

**Output yang Diharapkan**:
```
========================================
   InsPecPro - Unified Startup
   Backend + Frontend in One Terminal
========================================

Python found: Python 3.x.x
Node.js found: v18.x.x

[1/3] Installing backend dependencies...
[2/3] Installing frontend dependencies...
[3/3] Starting services...

Starting Backend...
Backend started on http://localhost:8000
Starting Frontend...
Frontend started on http://localhost:3000

========================================
   InsPecPro Services Running!
========================================
Backend:  http://localhost:8000
Frontend: http://localhost:3000
API Docs: http://localhost:8000/docs

Services are running in background
Press Ctrl+C to stop all services
```

### 2. `stop.bat` - Stop Semua Service (UNIFIED)
**Fungsi**: Menghentikan semua service InsPecPro dengan PowerShell
**Lokasi**: Root directory proyek

**Fitur**:
- ✅ **UNIFIED STOPPING**: Stop semua service sekaligus
- ✅ PowerShell process management
- ✅ Kill processes di port 8000 dan 3000
- ✅ Terminate Node.js dan Python processes
- ✅ Verifikasi port sudah bebas
- ✅ Cleanup background processes dan jobs
- ✅ Fallback ke basic mode jika PowerShell tidak tersedia

**Cara Penggunaan**:
```bash
# Dari root directory
.\stop.bat
```

### ⚙️ `start-backend.bat` - Backend Only
**Fungsi**: Menjalankan hanya backend FastAPI
**Penggunaan**: Untuk development backend saja
```bash
start-backend.bat
```

**Yang dilakukan**:
- ✅ Install dependencies backend
- ✅ Start FastAPI di port 8000
- ✅ Menampilkan link ke API documentation

### 🎨 `start-frontend.bat` - Frontend Only
**Fungsi**: Menjalankan hanya frontend Next.js
**Penggunaan**: Untuk development frontend saja
```bash
start-frontend.bat
```

**Yang dilakukan**:
- ✅ Install dependencies frontend
- ✅ Start Next.js di port 3000
- ✅ Hot reload untuk development

## 🔧 Prerequisites

Pastikan sudah terinstall:
- **Python 3.8+** dengan pip
- **Node.js 18+** dengan npm
- **MySQL 8.0+** (untuk database)

## 📋 Quick Start Guide

### Untuk Pengguna Baru:
1. Clone repository
2. Setup database MySQL
3. Configure `.env` file di folder backend
4. Jalankan `start.bat`
5. Buka http://localhost:3000

### Untuk Development:
```bash
# Start semua services
start.bat

# Atau start individual services
start-backend.bat    # Backend saja
start-frontend.bat   # Frontend saja

# Stop semua services
stop.bat
```

## 🚨 Troubleshooting

### Error: Python not found
```bash
# Install Python dari python.org
# Atau pastikan Python ada di PATH
python --version
```

### Error: Node.js not found
```bash
# Install Node.js dari nodejs.org
# Atau pastikan Node.js ada di PATH
node --version
npm --version
```

### Error: Port already in use
```bash
# Jalankan stop.bat terlebih dahulu
stop.bat

# Atau check proses yang menggunakan port
netstat -ano | findstr :8000
netstat -ano | findstr :3000
```

### Error: Dependencies installation failed
```bash
# Backend dependencies
cd backend
pip install -r requirements.txt --upgrade

# Frontend dependencies
cd frontend
npm install --force
```

### Error: Database connection
```bash
# Pastikan MySQL service berjalan
# Check .env file di folder backend
# Pastikan database 'inspecpro' sudah dibuat
```

## 🔍 Port Information

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| Backend | 8000 | http://localhost:8000 | FastAPI REST API |
| Frontend | 3000 | http://localhost:3000 | Next.js Web App |
| API Docs | 8000 | http://localhost:8000/docs | Swagger Documentation |

## 📝 Development Tips

1. **Hot Reload**: Frontend memiliki hot reload otomatis
2. **API Testing**: Gunakan http://localhost:8000/docs untuk test API
3. **Logs**: Check terminal windows untuk error messages
4. **Database**: Pastikan MySQL service selalu berjalan
5. **Environment**: Gunakan `.env` file untuk konfigurasi

## 🆘 Support

Jika mengalami masalah:
1. Jalankan `stop.bat` terlebih dahulu
2. Check error messages di terminal
3. Pastikan semua prerequisites terinstall
4. Restart computer jika diperlukan
5. Buat issue di GitHub repository

---

**Happy Coding! 🚀**