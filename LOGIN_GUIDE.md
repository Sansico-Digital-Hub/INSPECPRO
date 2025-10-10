# InspecPro Login Guide

## ✅ Login Issue Fixed!

The login functionality has been corrected. You can now login successfully.

---

## 🔑 Working Credentials

Use any of these credentials to login:

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin` | `admin123` |
| **Inspector** | `inspector1` | `inspector123` |
| **Supervisor** | `supervisor1` | `supervisor123` |
| **Manager** | `manager1` | `manager123` |

---

## 🌐 Login URLs

- **Frontend Login:** http://localhost:3000/login
- **Backend API:** http://localhost:8000/api/auth/login
- **API Docs:** http://localhost:8000/docs

---

## 🔧 What Was Fixed

### Issue
The frontend was sending login requests in the wrong format:
- ❌ Was using: `application/x-www-form-urlencoded`
- ✅ Now using: `application/json`

### Changes Made

1. **Updated `frontend/src/lib/api.ts`:**
   - Changed login endpoint to send JSON data
   - Fixed endpoint path to include `/api` prefix
   - Fixed `/auth/me` endpoint path

2. **Updated `frontend/src/app/login/page.tsx`:**
   - Corrected test credentials display
   - Changed from `inspector/supervisor/management` to `inspector1/supervisor1/manager1`

---

## 🧪 Testing Login

### Option 1: Use the Frontend
1. Open http://localhost:3000/login
2. Enter credentials (e.g., `admin` / `admin123`)
3. Click "Sign in"
4. You should be redirected to the dashboard

### Option 2: Test with HTML File
1. Open `test_frontend_login.html` in your browser
2. Click "Test Login" button
3. Verify the connection works

### Option 3: Test with Python Script
```bash
python test_login.py
```

### Option 4: Test with cURL
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username_or_email\":\"admin\",\"password\":\"admin123\"}"
```

---

## 📝 Login Flow

1. **User enters credentials** on login page
2. **Frontend sends POST request** to `/api/auth/login` with JSON:
   ```json
   {
     "username_or_email": "admin",
     "password": "admin123"
   }
   ```
3. **Backend validates credentials** against MySQL database
4. **Backend returns JWT token**:
   ```json
   {
     "access_token": "eyJhbGciOiJIUzI1NiIs...",
     "token_type": "bearer"
   }
   ```
5. **Frontend stores token** in localStorage
6. **Frontend fetches user info** from `/api/auth/me`
7. **User is redirected** to dashboard

---

## 🔍 Troubleshooting

### "Login failed" error
- ✅ Check backend is running: http://localhost:8000/health
- ✅ Verify credentials are correct (see table above)
- ✅ Check browser console for errors (F12)
- ✅ Ensure MySQL database is running

### "Network error" or "Connection refused"
- ✅ Backend server must be running on port 8000
- ✅ Frontend server must be running on port 3000
- ✅ Check CORS is enabled in backend
- ✅ Verify no firewall blocking connections

### "Not authenticated" after login
- ✅ Check token is stored in localStorage
- ✅ Verify token is sent in Authorization header
- ✅ Check token hasn't expired (30 min default)

### Can't access protected pages
- ✅ Make sure you're logged in
- ✅ Check AuthProvider is wrapping your app
- ✅ Verify token is valid

---

## 🔐 Security Notes

- Tokens expire after 30 minutes (configurable in backend/.env)
- Passwords are hashed using bcrypt
- JWT tokens are signed with SECRET_KEY
- HTTPS should be used in production
- Current SECRET_KEY is for development only

---

## 📊 User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all features |
| **Supervisor** | Review and approve inspections |
| **Inspector** | Create and submit inspections |
| **Manager** | View reports and analytics |

---

## 🎯 Next Steps After Login

1. **Dashboard** - View inspection statistics
2. **Forms** - Create or manage inspection forms
3. **Inspections** - Perform quality inspections
4. **Users** - Manage user accounts (admin only)

---

## ✅ Verification

Run this command to verify login is working:
```bash
python test_login.py
```

Expected output:
```
✅ Username: admin           Password: admin123
✅ Username: inspector1      Password: inspector123
✅ Username: supervisor1     Password: supervisor123
✅ Username: manager1        Password: manager123
```

---

**Status:** ✅ Login is now fully functional!

You can now access the application at http://localhost:3000/login
