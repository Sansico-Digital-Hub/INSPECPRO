# InsPecPro - Quality Assurance Inspection Management System

## Overview
InsPecPro is a comprehensive quality assurance inspection management system built with FastAPI backend and Next.js frontend. It provides role-based access control for different user types with specific functionalities.

## System Architecture

### Backend (FastAPI)
- **Framework**: FastAPI with SQLAlchemy ORM
- **Database**: SQLite (can be easily switched to PostgreSQL/MySQL)
- **Authentication**: JWT tokens with role-based access control
- **File Upload**: Support for photos and signatures

### Frontend (Next.js)
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks and context
- **Charts**: Recharts for analytics
- **File Handling**: React Dropzone and Signature Canvas

## User Roles & Functionalities

### 1. ADMIN
**Dashboard Features:**
- Total inspections, submitted, accepted, rejected counts
- Quick actions: Create forms, add users, manage system

**User Management:**
- Add new users with role assignment
- Edit existing user details (username, email, role, plant, line process)
- Delete/deactivate users
- View all users with filtering

**Form Management:**
- Create dynamic forms with multiple field types:
  - Text input
  - Dropdown (single/multi-select)
  - Search dropdown
  - Button (Pass/Hold)
  - Photo upload
  - Signature capture
  - Measurement with validation
  - Notes/textarea
- Edit existing forms
- Delete forms
- Add/remove form fields dynamically

**Review System:**
- Review and approve/reject submitted inspections
- Provide rejection reasons
- Edit any inspection
- Delete any inspection

### 2. USER/Inspector
**Dashboard Features:**
- Personal inspection statistics
- Quick access to create new inspections

**Form Filling:**
- Fill out forms created by admins
- Upload photos for inspection evidence
- Capture digital signatures
- Input measurements with pass/hold validation
- Save forms as drafts
- Submit completed forms for review

**My Inspections:**
- View all personal inspections
- Edit draft inspections
- Delete draft inspections
- Track inspection status (draft, submitted, accepted, rejected)

### 3. SUPERVISOR
**Dashboard Features:**
- Overview of all inspections requiring review
- Statistics for team performance

**Review System:**
- Review submitted inspections
- Accept or reject inspections with reasons
- View all inspections in the system
- Track inspection trends

### 4. MANAGEMENT
**Dashboard Features:**
- Comprehensive analytics dashboard
- High-level system overview

**Analytics:**
- Daily inspection trends (last 30 days)
- Monthly inspection trends (last 12 months)
- Inspection status distribution (pie chart)
- Plant-wise inspection breakdown
- Performance metrics:
  - Acceptance rate
  - Rejection rate
  - Active plants count
- Plant performance comparison table

## Key Features

### Dynamic Form Builder
- Drag-and-drop field ordering
- Multiple field types with validation
- Conditional logic for measurements
- Required field enforcement
- Field options configuration

### File Management
- Photo upload with preview
- Digital signature capture
- File type validation
- Secure file storage

### Real-time Dashboard
- Live statistics updates
- Role-based data filtering
- Interactive charts and graphs
- Export capabilities

### Audit Trail
- Complete inspection history
- User activity tracking
- Timestamp logging
- Review decision tracking

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/register` - Register new user
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

### Users Management
- `GET /api/users/` - Get all users (Admin only)
- `POST /api/users/` - Create user (Admin only)
- `GET /api/users/{user_id}` - Get user details
- `PUT /api/users/{user_id}` - Update user
- `DELETE /api/users/{user_id}` - Delete user (Admin only)
- `GET /api/users/by-role/{role}` - Get users by role

### Forms Management
- `GET /api/forms/` - Get all forms
- `POST /api/forms/` - Create form (Admin only)
- `GET /api/forms/{form_id}` - Get form details
- `PUT /api/forms/{form_id}` - Update form (Admin only)
- `DELETE /api/forms/{form_id}` - Delete form (Admin only)
- `POST /api/forms/{form_id}/fields` - Add form field (Admin only)
- `DELETE /api/forms/{form_id}/fields/{field_id}` - Delete form field (Admin only)

### Inspections Management
- `GET /api/inspections/` - Get inspections (filtered by role)
- `POST /api/inspections/` - Create inspection
- `GET /api/inspections/{inspection_id}` - Get inspection details
- `PUT /api/inspections/{inspection_id}` - Update inspection
- `DELETE /api/inspections/{inspection_id}` - Delete inspection
- `POST /api/inspections/{inspection_id}/submit` - Submit for review
- `POST /api/inspections/{inspection_id}/upload-file` - Upload file
- `GET /api/inspections/my-inspections` - Get user's inspections

### Dashboard & Analytics
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/analytics` - Get analytics data (Management only)
- `GET /api/dashboard/recent-inspections` - Get recent inspections
- `GET /api/dashboard/pending-reviews` - Get pending reviews
- `GET /api/dashboard/forms-summary` - Get forms usage summary

## Database Schema

### Core Tables
- **inspecpro_users**: User accounts with roles and plant assignments
- **forms**: Form templates with metadata
- **form_fields**: Individual form fields with validation rules
- **inspections**: Inspection instances with status tracking
- **inspection_responses**: User responses to form fields
- **inspection_files**: Uploaded files (photos, signatures)
- **password_resets**: Password reset tokens

### Enums
- **UserRole**: admin, user, supervisor, management
- **InspectionStatus**: draft, submitted, accepted, rejected
- **FieldType**: text, dropdown, search_dropdown, button, photo, signature, measurement, notes
- **MeasurementType**: between, higher, lower
- **PassHoldStatus**: pass, hold
- **FileType**: photo, signature

## Installation & Setup

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
Create `.env` file in backend directory:
```
SECRET_KEY=your_secret_key
DATABASE_URL=sqlite:///./inspecpro.db
```

Create `.env.local` file in frontend directory:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Security Features
- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization
- File upload restrictions

## Performance Optimizations
- Database indexing on frequently queried fields
- Lazy loading of form fields
- Image compression for uploads
- Caching of dashboard statistics
- Pagination for large datasets

## Future Enhancements
- Mobile app support
- Offline inspection capability
- Advanced reporting features
- Integration with external QA systems
- Multi-language support
- Advanced analytics with AI insights

## Support & Maintenance
- Regular database backups
- Log monitoring and alerting
- Performance monitoring
- Security updates
- User training materials
- Technical documentation updates
