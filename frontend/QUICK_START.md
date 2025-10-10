# 🚀 Quick Start Guide - InsPecPro Frontend

## Cara Tercepat untuk Memulai

### Opsi 1: Menggunakan Script (TERMUDAH) ⭐

1. **Double-click** `install.bat`
   - Script akan otomatis install semua dependencies
   - Tunggu sampai selesai (2-5 menit)

2. **Double-click** `start.bat`
   - Server akan jalan di http://localhost:3000
   - Browser akan otomatis terbuka

3. **Login** dengan test account:
   - Admin: `admin` / `admin123`
   - Inspector: `inspector` / `inspector123`
   - Supervisor: `supervisor` / `supervisor123`
   - Management: `management` / `management123`

---

### Opsi 2: Manual via Command Line

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser
# http://localhost:3000
```

---

## 📦 Dependencies yang Akan Diinstall

### Core Framework
- **next** (14.0.4) - React framework
- **react** (18.2.0) - UI library
- **react-dom** (18.2.0) - React DOM renderer

### API & State Management
- **axios** (1.6.2) - HTTP client
- **react-hot-toast** (2.4.1) - Toast notifications

### UI Components
- **@heroicons/react** (2.1.1) - Icon library
- **react-signature-canvas** (1.0.6) - Signature capture
- **recharts** (2.10.3) - Charts library

### Styling
- **tailwindcss** (3.3.6) - CSS framework
- **autoprefixer** (10.4.16) - CSS autoprefixer
- **postcss** (8.4.32) - CSS processor

### Development Tools
- **typescript** (5.3.3) - TypeScript compiler
- **@types/node** (20.10.5) - Node.js types
- **@types/react** (18.2.45) - React types
- **@types/react-dom** (18.2.18) - React DOM types
- **eslint** (8.56.0) - Code linter
- **eslint-config-next** (14.0.4) - Next.js ESLint config

**Total**: ~15 packages + dependencies (~200MB)

---

## ⚙️ System Requirements

### Minimum Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **RAM**: 2GB minimum
- **Disk Space**: 500MB free space

### Recommended
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- **RAM**: 4GB or more
- **Disk Space**: 1GB free space

---

## 🔧 Troubleshooting

### Problem: "node is not recognized"
**Solution**: Install Node.js from https://nodejs.org/

### Problem: "npm install" fails
**Solution**: 
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

### Problem: Port 3000 already in use
**Solution**:
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### Problem: Module not found errors
**Solution**:
```bash
# Delete node_modules and reinstall
rmdir /s /q node_modules
rmdir /s /q .next
npm install
```

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/              # Pages (Next.js App Router)
│   │   ├── login/        # Login page
│   │   ├── dashboard/    # Dashboard
│   │   ├── forms/        # Forms management
│   │   ├── users/        # Users management
│   │   ├── inspections/  # Inspections
│   │   └── analytics/    # Analytics
│   │
│   ├── components/       # Reusable components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilities (API client)
│   └── types/            # TypeScript types
│
├── public/               # Static files
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── tailwind.config.ts    # Tailwind config
├── install.bat           # Installation script
└── start.bat             # Start script
```

---

## 🎯 Available Scripts

### Development
```bash
npm run dev          # Start development server (port 3000)
```

### Production
```bash
npm run build        # Build for production
npm start            # Start production server
```

### Code Quality
```bash
npm run lint         # Run ESLint
```

---

## 🔐 Test Accounts

| Role | Username | Password | Access |
|------|----------|----------|--------|
| Admin | admin | admin123 | Full access |
| Inspector | inspector | inspector123 | Create inspections |
| Supervisor | supervisor | supervisor123 | Review inspections |
| Management | management | management123 | View analytics |

---

## 🌐 Backend Connection

Frontend connects to backend at: `http://localhost:8000`

**IMPORTANT**: Make sure backend is running before starting frontend!

To start backend:
```bash
cd ../backend
python main.py
```

---

## 📝 Environment Variables

File: `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Change this if your backend runs on different port.

---

## ✅ Verification Checklist

After installation, verify:

- [ ] `npm install` completed without errors
- [ ] `node_modules` folder exists
- [ ] `.next` folder created after first run
- [ ] Server starts on http://localhost:3000
- [ ] Login page loads
- [ ] Can login with test accounts
- [ ] Dashboard shows statistics
- [ ] All menu items accessible

---

## 🆘 Need Help?

1. Check `README.md` for detailed documentation
2. Check `FRONTEND_COMPLETE.md` for feature list
3. Check browser console for errors (F12)
4. Check terminal for error messages

---

## 🎉 Success!

If you see the login page at http://localhost:3000, you're all set! 🚀

**Next**: Login and explore all features!

---

**Last Updated**: October 9, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
