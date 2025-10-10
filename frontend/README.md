# InsPecPro Frontend

Next.js 14 frontend application for InsPecPro Inspection Management System with 4 user roles.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx         # Root layout with AuthProvider
│   │   ├── page.tsx           # Home page (redirects to dashboard/login)
│   │   ├── globals.css        # Global styles
│   │   ├── login/             # Login page
│   │   ├── dashboard/         # Dashboard (all roles)
│   │   ├── forms/             # Forms management (Admin only)
│   │   │   ├── page.tsx       # ✅ Forms list
│   │   │   ├── new/           # ⚠️ TODO: Create form page
│   │   │   └── [id]/          # ⚠️ TODO: View/Edit form pages
│   │   ├── users/             # ⚠️ TODO: Users management (Admin only)
│   │   ├── inspections/       # ⚠️ TODO: Inspections (all roles)
│   │   └── analytics/         # ⚠️ TODO: Analytics (Management/Admin)
│   │
│   ├── components/            # Reusable components
│   │   ├── Sidebar.tsx        # ✅ Navigation sidebar
│   │   └── LayoutWrapper.tsx  # ✅ Auth wrapper
│   │
│   ├── contexts/              # React contexts
│   │   └── SidebarContext.tsx # ✅ Sidebar state management
│   │
│   ├── hooks/                 # Custom React hooks
│   │   └── useAuth.tsx        # ✅ Authentication hook
│   │
│   ├── lib/                   # Utility libraries
│   │   └── api.ts             # ✅ API client with axios
│   │
│   └── types/                 # TypeScript type definitions
│       └── index.ts           # ✅ All interfaces matching backend models
│
├── public/                    # Static assets
├── package.json               # ✅ Dependencies
├── tsconfig.json              # ✅ TypeScript config
├── tailwind.config.ts         # ✅ Tailwind CSS config
├── next.config.js             # ✅ Next.js config
└── postcss.config.js          # ✅ PostCSS config
```

## ✅ Completed Files

- ✅ Core configuration (package.json, tsconfig, tailwind, etc.)
- ✅ Types & Interfaces (matching backend models)
- ✅ API Client Library (axios with interceptors)
- ✅ Authentication (useAuth hook, AuthProvider)
- ✅ Shared Components (Sidebar, LayoutWrapper)
- ✅ Login Page
- ✅ Dashboard Page (universal for all 4 roles)
- ✅ Forms List Page (Admin)

## ⚠️ TODO: Files Still Needed

### Forms Management (Admin)
- `/forms/new/page.tsx` - Create new form with field builder
- `/forms/[id]/page.tsx` - View form details
- `/forms/[id]/edit/page.tsx` - Edit form with multiple field types support

### Users Management (Admin)
- `/users/page.tsx` - Users list
- `/users/new/page.tsx` - Create new user
- `/users/[id]/edit/page.tsx` - Edit user

### Inspections (All Roles)
- `/inspections/page.tsx` - Inspections list with filters
- `/inspections/new/page.tsx` - Create inspection (Inspector/Admin)
- `/inspections/[id]/page.tsx` - View inspection details
- `/inspections/[id]/edit/page.tsx` - Edit inspection

### Analytics (Management/Admin)
- `/analytics/page.tsx` - Charts and statistics

## 🔑 User Roles & Permissions

### 1. Admin
- Full access to all features
- Can create/edit/delete forms
- Can manage users
- Can create/edit/delete inspections
- Can view analytics

### 2. User (Inspector)
- Can create new inspections
- Can edit own draft inspections
- Can view own inspections
- Cannot manage forms or users

### 3. Supervisor
- Can view all inspections
- Can accept/reject submitted inspections
- Cannot create inspections
- Cannot manage forms or users

### 4. Management
- Can view all inspections
- Can accept/reject submitted inspections
- Can view analytics
- Cannot create inspections
- Cannot manage forms or users

## 🔐 Authentication

The app uses JWT token authentication:

1. Login with username/password
2. Token stored in localStorage
3. Token sent in Authorization header for all API requests
4. Auto-redirect to login if token expires

**Test Accounts:**
- Admin: `admin` / `admin123`
- Inspector: `inspector` / `inspector123`
- Supervisor: `supervisor` / `supervisor123`
- Management: `management` / `management123`

## 🎨 UI Components

Built with:
- **Tailwind CSS** - Utility-first CSS framework
- **Heroicons** - Beautiful hand-crafted SVG icons
- **react-hot-toast** - Toast notifications
- **react-signature-canvas** - Signature capture
- **recharts** - Charts for analytics

## 📡 API Endpoints

Base URL: `http://localhost:8000`

### Auth
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user

### Users
- `GET /users/` - List users
- `POST /users/` - Create user
- `GET /users/{id}` - Get user
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

### Forms
- `GET /forms/` - List forms
- `POST /forms/` - Create form
- `GET /forms/{id}` - Get form
- `PUT /forms/{id}` - Update form
- `DELETE /forms/{id}` - Delete form

### Inspections
- `GET /inspections/` - List inspections
- `POST /inspections/` - Create inspection
- `GET /inspections/{id}` - Get inspection
- `PUT /inspections/{id}` - Update inspection
- `POST /inspections/{id}/submit` - Submit inspection
- `DELETE /inspections/{id}` - Delete inspection
- `GET /inspections/{id}/export/pdf` - Export to PDF

### Dashboard & Analytics
- `GET /dashboard/stats` - Get dashboard statistics
- `GET /analytics/` - Get analytics data

## 🔧 Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📝 Field Types Supported

1. **Text** - Single line text input
2. **Dropdown** - Select from options
3. **Search Dropdown** - Searchable dropdown
4. **Button** - Pass/Hold buttons
5. **Photo** - Image upload
6. **Signature** - Digital signature
7. **Measurement** - Numeric with auto pass/hold
8. **Notes** - Read-only instructions with reference photo
9. **Date** - Date picker
10. **DateTime** - Date and time picker
11. **Time** - Time picker

### Multiple Field Types Support
A single field can have multiple types (e.g., TEXT + PHOTO), allowing inspectors to enter text AND upload a photo for the same field.

## 🚨 Important Notes

### Multiple Field Types Implementation
When implementing forms/inspections pages, remember:

1. **Field Storage**: Use `field_types` array instead of single `field_type`
2. **Response Keys**: For multiple types, use `${field.id}-${fieldType}` as key
3. **Conditional Logic**: Check dropdown values for conditional field rendering
4. **Nested Conditionals**: Support recursive conditional fields

### Example Code Pattern:
```typescript
const fieldTypes = (field.field_types && field.field_types.length > 0) 
  ? field.field_types 
  : [field.field_type];

fieldTypes.forEach((fieldType, index) => {
  const responseKey = fieldTypes.length > 1 
    ? `${field.id}-${fieldType}` 
    : field.id;
  // Render field...
});
```

## 🔄 Recovery Instructions

If you need to recover the full frontend from GitHub:

```bash
# Clone from GitHub
git clone -b development https://github.com/SANSICO-AI-DIGITALIZATION/INSPECPRO.git temp_recovery

# Copy frontend folder
cp -r temp_recovery/frontend/* frontend/

# Clean up
rm -rf temp_recovery

# Install and run
cd frontend
npm install
npm run dev
```

## 📚 Next Steps

1. **Install dependencies**: `npm install`
2. **Start dev server**: `npm run dev`
3. **Test login** with test accounts
4. **Implement remaining pages** (see TODO list above)
5. **Test with backend** running on port 8000

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
npx kill-port 3000
```

### Module not found errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### API connection errors
- Ensure backend is running on `http://localhost:8000`
- Check CORS settings in backend
- Verify API_BASE_URL in api.ts

## 📞 Support

For issues or questions, refer to:
- Backend models: `backend/models.py`
- API schemas: `backend/schemas.py`
- Test files: `backend/test_*.py`

---

**Status**: Core infrastructure complete ✅ | Pages in progress ⚠️

**Last Updated**: October 9, 2025
