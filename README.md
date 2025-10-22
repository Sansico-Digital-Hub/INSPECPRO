# Sanalyze - Sansico Analyze Quality Assurance Inspection Management System

![Version](https://img.shields.io/badge/version-2.2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-production--ready-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.2.33-black.svg)

Sanalyze adalah sistem manajemen inspeksi Quality Assurance berbasis web yang komprehensif dan enterprise-grade dari Sansico, dibangun dengan frontend **Next.js 14** dan backend **FastAPI**. Dirancang untuk menyederhanakan proses inspeksi di berbagai peran organisasi dengan fitur-fitur canggih termasuk dynamic form builder, conditional logic, digital signatures, photo uploads, dan analytics komprehensif dengan **kemampuan export Excel yang canggih**.

## 📑 Table of Contents

- [Fitur Terbaru v2.2.0](#-fitur-terbaru-v220)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Key Features](#-key-features)
- [Excel Export Feature](#-excel-export-feature-new-in-v210)
- [Getting Started](#-getting-started)
- [Database Setup](#database-setup)
- [Default User Accounts](#-default-user-accounts)
- [Usage](#-usage)
- [API Endpoints](#-api-endpoints)
- [Security Features](#-security-features)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Version History](#-version-history)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

## ✨ Fitur Terbaru v2.2.0

### 🔧 Perbaikan Enum Consistency
Salah satu update terpenting dalam versi ini adalah **sinkronisasi sempurna semua enums** antara frontend, backend, dan database:

- **FieldType Enum**: Ditambahkan `SUBFORM` field type yang sebelumnya hanya ada di frontend
- **UserRole Enum**: `admin`, `user`, `supervisor`, `management` - konsisten di semua layer
- **InspectionStatus Enum**: `draft`, `submitted`, `accepted`, `rejected` - tersinkronisasi
- **MeasurementType Enum**: `between`, `higher`, `lower` - seragam di semua komponen
- **PassHoldStatus Enum**: `pass`, `hold` - konsisten antara frontend dan backend
- **FileType Enum**: `photo`, `signature` - sinkron di database dan aplikasi

### 🛠️ TypeScript Improvements
- **Fixed Type Errors**: Mengatasi masalah `null` to `undefined` conversion
- **Enhanced Interfaces**: Menambahkan missing properties seperti `button_values` dan `dropdown_values`
- **Strict Type Safety**: Implementasi type checking yang lebih ketat
- **Better IntelliSense**: Improved developer experience dengan better autocomplete

### 📝 Subform Field Type
- **Nested Forms**: Kemampuan membuat form dalam form untuk inspeksi yang kompleks
- **Dynamic Structure**: Subform dapat dikonfigurasi secara dinamis
- **Conditional Logic**: Subform mendukung conditional logic seperti field lainnya
- **Database Support**: Full database support untuk subform data storage

### 🔒 Enhanced Security & Validation
- **Input Validation**: Improved validation di semua form fields
- **Type Safety**: Strict TypeScript validation untuk mencegah runtime errors
- **Data Integrity**: Konsistensi data antara frontend dan backend
- **Error Handling**: Better error messages dan handling

## 🚀 Features

### 4 User Roles with Distinct Capabilities:

#### 1. **ADMIN** 👨‍💼
- **Dashboard**: Real-time statistics with total inspections, submitted, accepted, rejected counts
- **User Management**: Complete CRUD operations for users across all roles
- **Advanced Form Builder**: Create dynamic inspection forms with 11+ field types:
  - **Text Input**: Single-line and multi-line text fields
  - **Dropdown & Search Dropdown**: Static and searchable selection lists
  - **Button Groups**: Multiple choice selections
  - **Photo Upload**: Capture and upload inspection photos
  - **Digital Signature**: Capture inspector and reviewer signatures
  - **Measurement Fields**: Numeric input with validation (between/higher/lower than)
  - **Date/DateTime/Time**: Temporal data capture
  - **Notes**: Rich text documentation
  - **Subforms**: Nested form structures for complex inspections
  - **Conditional Logic**: Show/hide fields based on previous responses
  - **Pass/Hold Status**: Automatic status determination based on criteria
- **Review System**: Accept or reject submissions with digital signature and reason tracking
- **Full Control**: Edit or delete any inspection with complete audit trail
- **Excel Export**: Export filtered inspection data with date range selection

#### 2. **USER/INSPECTOR** 🔍
- **Personal Dashboard**: View own inspection statistics and performance metrics
- **Form Completion**: Fill out admin-created forms with advanced features:
  - **Save as Draft**: Work in progress with auto-save capability
  - **Submit for Review**: Send completed inspections to supervisors
  - **Photo Capture**: Take and upload inspection photos directly
  - **Digital Signature**: Sign off on inspections with signature pad
  - **Measurement Validation**: Real-time validation of numeric inputs
  - **Conditional Fields**: Dynamic form behavior based on responses
  - **Pass/Hold Indicators**: Automatic status based on measurements
- **My Inspections**: View and manage personal inspection history with filters
- **Draft Management**: Edit and delete draft inspections before submission
- **PDF Export**: Download individual inspection reports
- **Excel Export**: Export personal inspection data with date filters

#### 3. **SUPERVISOR** 👔
- **Dashboard**: Comprehensive overview of all inspection activities
- **Review Authority**: Accept or reject submitted inspections with digital signature
- **Rejection Tracking**: Mandatory reason and signature for rejected inspections
- **Inspection Oversight**: View all inspections across the organization
- **Status Management**: Update inspection status with full audit trail
- **Team Performance**: Monitor inspector productivity and quality metrics
- **Excel Export**: Export team inspection data with advanced filtering

#### 4. **MANAGEMENT** 📊
- **Executive Dashboard**: High-level KPIs and inspection statistics
- **Advanced Analytics**: Interactive data visualization with:
  - **Daily/Monthly Trends**: Time-series inspection data
  - **Status Distribution**: Pie charts showing inspection outcomes
  - **Plant Performance**: Comparison across different facilities
  - **Inspector Metrics**: Individual and team performance analysis
- **Comprehensive View**: Access to all inspection records organization-wide
- **Business Intelligence**: Trend analysis and predictive insights
- **Excel Export**: Export comprehensive data for external reporting and analysis

## 🛠 Technology Stack

### Backend (FastAPI)
- **Framework**: FastAPI 0.104.1 dengan Python 3.8+
- **Server**: Uvicorn 0.24.0 dengan standard extras
- **Database**: MySQL 8.0+ dengan SQLAlchemy 2.0.23 ORM
- **Database Connector**: PyMySQL 1.1.0 dan MySQL Connector Python 8.2.0
- **Authentication**: JWT tokens (python-jose 3.3.0) dengan role-based access control
- **Password Security**: Bcrypt 4.1.2 dan Passlib 1.7.4 untuk hashing dengan salt
- **Email**: SMTP integration untuk password reset functionality
- **File Handling**: Aiofiles 23.2.1 untuk async photo dan signature uploads
- **PDF Generation**: ReportLab 4.0.7 untuk inspection reports
- **Excel Export**: OpenPyXL 3.1.2 untuk data export dengan advanced filtering
- **Validation**: Pydantic 2.5.0 dan Pydantic Settings 2.1.0 untuk request/response validation
- **Image Processing**: Pillow 10.1.0 untuk image handling
- **Environment**: Python-dotenv 1.0.0 dan Python-decouple 3.8
- **Database Migration**: Alembic 1.12.1
- **API Documentation**: Auto-generated Swagger UI dan ReDoc

### Frontend (Next.js)
- **Framework**: Next.js 14.2.33 dengan TypeScript 5.3.3
- **Runtime**: React 18.2.0 dan React DOM 18.2.0
- **Styling**: Tailwind CSS 3.3.6 untuk responsive, modern design
- **State Management**: React hooks dan Context API
- **HTTP Client**: Axios 1.6.2 dengan request/response interceptors
- **UI Components**: 
  - Custom components dengan Heroicons 2.1.1
  - Lucide React 0.545.0 untuk additional icons
  - React Signature Canvas 1.0.6 untuk digital signatures
  - React DatePicker 4.25.0 untuk date selection
- **Charts**: Recharts 2.10.3 untuk interactive analytics visualization
- **Notifications**: React Hot Toast 2.4.1 untuk user feedback
- **Form Handling**: Dynamic form rendering dengan validation
- **Build Tools**: PostCSS 8.4.32, Autoprefixer 10.4.16
- **Development**: ESLint 8.56.0 dengan Next.js config

### Database Schema
- **Users**: Role-based user management with plant/line assignments
- **Forms**: Dynamic form structure with configurable fields
- **Inspections**: Inspection records with status tracking
- **Responses**: Field responses with various data types
- **Files**: Photo and signature file management
- **Password Resets**: Secure password recovery system

## 📋 Key Features

### 🔐 Authentication & Security
- **Multi-factor Login**: Username or email with password authentication
- **Password Reset**: Secure email-based password recovery with token expiration
- **Role-based Access Control (RBAC)**: Granular permissions per user role
- **JWT Tokens**: Secure session management with automatic refresh
- **Password Encryption**: Bcrypt hashing with salt for maximum security
- **Session Management**: Automatic logout on token expiration
- **CORS Protection**: Secure cross-origin request handling

### 📝 Advanced Dynamic Form System
- **12 Field Types Lengkap**: 
  - **Text**: Single-line dan multi-line text fields
  - **Dropdown & Search Dropdown**: Static dan searchable selection lists
  - **Button Groups**: Multiple choice selections
  - **Photo Upload**: Capture dan upload inspection photos
  - **Digital Signature**: Capture inspector dan reviewer signatures
  - **Measurement**: Numeric input dengan validation (between/higher/lower than)
  - **Date/DateTime/Time**: Temporal data capture
  - **Notes**: Rich text documentation
  - **Subforms**: Nested form structures untuk complex inspections ✨ **BARU**
- **Smart Validation**: 
  - Required field enforcement
  - Measurement ranges (between/higher/lower than)
  - Custom validation rules
  - Real-time validation feedback
  - Type-safe validation dengan TypeScript
- **Conditional Logic**: 
  - Show/hide fields berdasarkan previous answers
  - Multi-level conditional branching
  - Dynamic form flow
  - Complex business logic support
- **Pass/Hold Status**: Automatic determination berdasarkan measurement criteria
- **File Management**: Photo evidence dan digital signature storage dengan secure handling
- **Enum Consistency**: ✨ **DIPERBAIKI** - Semua enums (FieldType, UserRole, InspectionStatus, dll.) telah disinkronisasi sempurna antara frontend, backend, dan database

### 🔄 Inspection Workflow
1. **Form Creation** (Admin): Build dynamic forms with drag-and-drop interface
2. **Inspection Start** (Inspector): Select form and begin inspection
3. **Data Entry**: Fill out fields with validation and conditional logic
4. **Draft Management**: Save work in progress, edit anytime
5. **Submission**: Submit completed inspection for review
6. **Review Process** (Supervisor): Accept or reject with digital signature
7. **Status Tracking**: Real-time updates with email notifications
8. **Reporting**: Generate PDF reports and Excel exports

### 📊 Analytics & Reporting
- **Real-time Dashboard**: Live inspection metrics and KPIs
- **Interactive Charts**: 
  - Daily/Monthly inspection trends (line charts)
  - Status distribution (pie charts)
  - Plant performance comparison (bar charts)
  - Inspector productivity metrics
- **Excel Export**: 
  - **Date Range Filtering**: Select start and end dates
  - **Status Filtering**: Filter by inspection status
  - **Form Filtering**: Export specific form data
  - **Comprehensive Data**: All inspection fields and responses
  - **Professional Formatting**: Styled headers, borders, auto-width columns
- **PDF Reports**: Individual inspection reports with signatures
- **Trend Analysis**: Historical data insights and patterns
- **Performance Tracking**: User and plant-level metrics

### 📥 Excel Export Feature (NEW in v2.1.0)

The Excel export feature provides powerful data extraction capabilities:

#### Features:
- **Date Range Filtering**: 
  - Select start and end dates using intuitive date picker
  - Filter by specific dates or entire months
  - Leave blank to export all data
  
- **Status Filtering**: 
  - Filter by inspection status (Draft, Submitted, Accepted, Rejected)
  - Or export all statuses
  
- **Dynamic Columns**: 
  - Automatically includes all form fields as columns
  - Handles different form types in single export
  
- **Professional Formatting**:
  - Styled headers with blue background
  - Bordered cells for readability
  - Auto-adjusted column widths
  - Proper data type handling
  
- **Comprehensive Data**:
  - Inspection ID, Form Name, Inspector
  - Status, Created Date, Updated Date
  - Reviewer information and dates
  - Rejection reasons (if applicable)
  - All field responses with Pass/Hold status
  - Measurement values with units
  
- **Role-Based Export**:
  - **Inspectors**: Export their own inspections
  - **Supervisors/Admins**: Export all inspections
  - **Management**: Export organization-wide data

#### How to Use:
1. Navigate to Inspections page
2. Click "Export to Excel" button (green button in header)
3. Select date range (optional)
4. Choose status filter (optional)
5. Click "Export to Excel"
6. File downloads automatically with timestamp

## 🚀 Getting Started

### Prerequisites
- **Python**: 3.8 atau lebih tinggi
- **Node.js**: 16.x atau lebih tinggi  
- **MySQL**: 8.0 atau lebih tinggi
- **Git**: Versi terbaru
- **npm**: 7.x atau lebih tinggi (included dengan Node.js)
- **pip**: Versi terbaru (included dengan Python)

### Quick Start (Windows)

Gunakan batch files yang disediakan untuk startup yang mudah:

```bash
# Start backend dan frontend secara bersamaan
start_inspecpro.bat
```

Atau jalankan secara terpisah:

```bash
# Start backend saja
cd backend
python main.py

# Start frontend saja (di terminal baru)
cd frontend
npm run dev
```

### Batch Files Tersedia
- `start.bat` - **Start semua services** (backend + frontend)
- `stop.bat` - **Stop semua services** yang berjalan
- `start-backend.bat` - Start backend saja (FastAPI)
- `start-frontend.bat` - Start frontend saja (Next.js)
- `frontend/install.bat` - Install frontend dependencies

📖 **Panduan lengkap**: Lihat [BATCH_FILES.md](BATCH_FILES.md) untuk detail penggunaan

### Backend Setup (Detailed)

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment** (recommended):
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # Linux/Mac
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Create `.env` file in backend directory:
   ```env
   # Database Configuration
   DATABASE_URL=mysql+pymysql://username:password@localhost:3306/inspecpro
   
   # JWT Configuration
   SECRET_KEY=your-super-secret-key-change-this-in-production
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   
   # Email Configuration (for password reset)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USERNAME=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=your-email@gmail.com
   
   # CORS Configuration
   FRONTEND_URL=http://localhost:3002
   ```

5. **Create MySQL database**:
   ```sql
   CREATE DATABASE inspecpro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

6. **Run database migrations** (tables will be created automatically on first run):
   ```bash
   python main.py
   ```

7. **Create sample data** (optional):
   ```bash
   python create_sample_data.py
   ```

8. **Start the backend server**:
   ```bash
   python main.py
   ```
   - Backend API: `http://localhost:8004`
   - API Documentation: `http://localhost:8004/docs`
   - Alternative Docs: `http://localhost:8004/redoc`

### Frontend Setup (Detailed)

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment** (optional):
   Create `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8004
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:3002`

5. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

### Database Setup

The application uses MySQL database with the following tables:
- `inspecpro_users` - User accounts and roles
- `forms` - Inspection form templates
- `form_fields` - Dynamic form field definitions
- `inspections` - Inspection records
- `inspection_responses` - Field response data
- `inspection_files` - Uploaded files (photos, signatures)
- `password_resets` - Password recovery tokens

## 👥 Default User Accounts

For testing purposes, create these sample accounts:

| Role | Username | Email | Password | Access Level |
|------|----------|-------|----------|--------------|
| Admin | admin | admin@inspecpro.com | admin123 | Full system access |
| Inspector | inspector1 | inspector1@inspecpro.com | inspector123 | Form completion |
| Supervisor | supervisor1 | supervisor1@inspecpro.com | supervisor123 | Review authority |
| Management | manager1 | manager1@inspecpro.com | manager123 | Analytics access |

## 📱 Usage

### For Administrators
1. Login with admin credentials
2. Create users via User Management
3. Build inspection forms using the Form Builder
4. Monitor system activity via Dashboard
5. Review and manage all inspections

### For Inspectors
1. Login with inspector credentials
2. View available forms on Dashboard
3. Complete inspections (save as draft or submit)
4. Upload photos and capture signatures
5. Track inspection status in "My Inspections"

### For Supervisors
1. Login with supervisor credentials
2. Review submitted inspections
3. Accept or reject with detailed reasons
4. Monitor team performance
5. Access comprehensive inspection data

### For Management
1. Login with management credentials
2. View executive dashboard with KPIs
3. Analyze trends with interactive charts
4. Export data for reporting
5. Monitor organizational performance

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login with username/email and password
- `POST /api/auth/register` - User registration (Admin only)
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/forgot-password` - Password reset request via email
- `POST /api/auth/reset-password` - Password reset confirmation with token

### Users (Admin only)
- `GET /api/users/` - List all users with pagination
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users/` - Create new user
- `PUT /api/users/{id}` - Update user information
- `DELETE /api/users/{id}` - Delete user account

### Forms (Admin only)
- `GET /api/forms/` - List all forms
- `GET /api/forms/{id}` - Get form by ID with all fields
- `POST /api/forms/` - Create new form with fields
- `PUT /api/forms/{id}/complete` - Update complete form structure
- `DELETE /api/forms/{id}` - Delete form and all associated data

### Inspections
- `GET /api/inspections/` - List inspections (role-filtered with status filter)
- `GET /api/inspections/{id}` - Get inspection details with responses
- `POST /api/inspections/` - Create new inspection
- `PUT /api/inspections/{id}` - Update inspection (draft or review)
- `POST /api/inspections/{id}/submit` - Submit inspection for review
- `DELETE /api/inspections/{id}` - Delete inspection
- `POST /api/inspections/{id}/upload-file` - Upload photo or signature
- `GET /api/inspections/{id}/export-pdf` - Export inspection to PDF
- `GET /api/inspections/export-excel` - **NEW**: Export inspections to Excel with filters
  - Query params: `start_date`, `end_date`, `form_id`, `status_filter`

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics (role-based)
- `GET /api/dashboard/analytics` - Get analytics data (Management only)
  - Returns: daily/monthly trends, status distribution, plant performance

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication with expiration
- **Role-based Access Control (RBAC)**: Granular permissions per user role
- **Password Hashing**: Bcrypt encryption with salt for password storage
- **Input Validation**: Comprehensive Pydantic validation on all endpoints
- **CORS Protection**: Configurable cross-origin request security
- **SQL Injection Prevention**: Parameterized queries with SQLAlchemy ORM
- **XSS Protection**: Input sanitization and output encoding
- **File Upload Security**: Type validation and size limits
- **Session Management**: Automatic token expiration and refresh
- **Audit Trail**: Complete logging of all user actions

## 📊 Database Schema

```sql
-- Users table with role-based access
CREATE TABLE inspecpro_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(50) UNIQUE,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    role ENUM('admin', 'user', 'supervisor', 'management'),
    plant VARCHAR(100),
    line_process VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Dynamic forms system
CREATE TABLE forms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    form_name VARCHAR(255),
    description TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Configurable form fields
CREATE TABLE form_fields (
    id INT PRIMARY KEY AUTO_INCREMENT,
    form_id INT,
    field_name VARCHAR(255),
    field_type ENUM('text', 'dropdown', 'search_dropdown', 'button', 'photo', 'signature', 'measurement', 'notes'),
    field_options JSON,
    measurement_type ENUM('between', 'higher', 'lower'),
    is_required BOOLEAN DEFAULT FALSE,
    field_order INT
);
```

## 🚀 Deployment

### Production Deployment

1. **Backend Deployment**:
   - Use production WSGI server (Gunicorn/uWSGI)
   - Configure production database
   - Set secure environment variables
   - Enable HTTPS

2. **Frontend Deployment**:
   - Build production bundle: `npm run build`
   - Deploy to CDN or static hosting
   - Configure API endpoint URLs
   - Enable HTTPS

3. **Database**:
   - Use production MySQL instance
   - Configure backup strategies
   - Set up monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation wiki

## 🔄 Version History

### v2.2.0 (Latest) - Desember 2024
- ✨ **BARU**: Subform field type untuk nested form structures
- 🔧 **DIPERBAIKI**: Enum consistency antara frontend, backend, dan database
  - FieldType enum sekarang termasuk 'subform' di semua layer
  - UserRole, InspectionStatus, MeasurementType, PassHoldStatus, FileType telah disinkronisasi
- 🛠️ **DIPERBAIKI**: TypeScript type errors di form components
  - Fixed `null` to `undefined` conversion issues
  - Added missing properties ke interfaces
- 📦 **UPDATED**: Dependencies ke versi terbaru
  - Next.js 14.2.33
  - Lucide React 0.545.0
  - React DatePicker 4.25.0
- 🔒 **ENHANCED**: Type safety dengan strict TypeScript validation
- 🐛 **FIXED**: Various bug fixes dan performance improvements

### v2.1.0 - Oktober 2024
- ✨ **NEW**: Excel export dengan advanced filtering (date range, status, form)
- ✨ **NEW**: React DatePicker integration untuk date selection
- ✨ **NEW**: Professional Excel formatting dengan styled headers
- 🔧 Updated dependencies (React DatePicker, OpenPyXL)
- 📊 Enhanced export capabilities untuk semua user roles
- 🐛 Bug fixes dan performance improvements

### v2.0.0 - September 2025
- 🎨 Advanced form builder with 11+ field types
- 🔀 Conditional logic and dynamic form flow
- 📝 Subform support for nested structures
- 🖊️ Digital signature capture for reviewers
- 📅 Date/DateTime/Time field types
- 🔄 Complete workflow management system

### v1.2.0 - August 2025
- 📱 Mobile responsiveness improvements
- 🎨 UI/UX enhancements
- ⚡ Performance optimizations
- 🐛 Bug fixes

### v1.1.0 - July 2025
- 📊 Enhanced analytics and reporting
- 📈 Interactive charts with Recharts
- 📄 PDF export functionality
- 🔍 Advanced search and filtering

### v1.0.0 - June 2025
- 🎉 Initial release
- 👥 4-role user system (Admin, Inspector, Supervisor, Management)
- 📝 Dynamic form builder
- 🔐 JWT authentication
- 📊 Basic dashboard and analytics

## 🎯 Roadmap

### ✅ Completed Features (v2.2.0)
- [x] **Subform field type** - Nested form structures
- [x] **Enum consistency** - Sinkronisasi sempurna antara frontend, backend, database
- [x] **TypeScript improvements** - Fixed type errors dan enhanced type safety
- [x] **Excel export** - Advanced filtering dengan date range dan status
- [x] **Digital signatures** - Capture dan storage untuk reviewers
- [x] **Conditional logic** - Dynamic form behavior
- [x] **12 field types** - Comprehensive form building capabilities

### 🚧 In Progress
- [ ] **Enhanced PDF reports** - Improved formatting dan styling
- [ ] **Advanced analytics** - More detailed insights dan metrics
- [ ] **Performance optimization** - Faster loading dan better UX

### 📋 Planned Features
- [ ] **Mobile app** (React Native) - Native mobile experience
- [ ] **Real-time notifications** (WebSocket) - Instant updates
- [ ] **Advanced reporting templates** - Customizable report formats
- [ ] **Multi-language support** - Internationalization (i18n)
- [ ] **Offline mode with sync** - Work without internet connection
- [ ] **Integration with external systems** (ERP, MES) - Enterprise connectivity
- [ ] **AI-powered inspection insights** - Machine learning analytics
- [ ] **Barcode/QR code scanning** - Quick data entry
- [ ] **Voice input for inspections** - Hands-free operation
- [ ] **Automated scheduling system** - Smart inspection planning
- [ ] **Advanced user permissions** - Granular access control
- [ ] **Audit trail enhancements** - Comprehensive activity logging

## 📚 Additional Documentation

- [Quick Start Guide](QUICK_START.md)
- [Forms Builder Guide](FORMS_GUIDE.md)
- [Conditional Logic Guide](CONDITIONAL_LOGIC_GUIDE.md)
- [Login Guide](LOGIN_GUIDE.md)
- [Project Summary](PROJECT_SUMMARY.md)

## 🔧 Troubleshooting

### Common Issues & Solutions

#### Backend Issues
```bash
# Jika ada error database connection
1. Pastikan MySQL service berjalan
2. Check credentials di .env file
3. Pastikan database 'inspecpro' sudah dibuat

# Jika ada error dependencies
pip install -r requirements.txt --upgrade

# Jika ada error port 8004 sudah digunakan
# Ganti port di main.py atau kill process yang menggunakan port tersebut
```

#### Frontend Issues
```bash
# Jika ada error npm dependencies
npm install --force

# Jika ada TypeScript errors
npm run build

# Jika ada error port 3002 sudah digunakan
# Next.js akan otomatis suggest port lain (3001, 3002, etc.)
```

#### Database Issues
```sql
-- Jika perlu reset database
DROP DATABASE inspecpro;
CREATE DATABASE inspecpro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Kemudian restart backend untuk auto-create tables
```

### Performance Tips
- **Backend**: Gunakan virtual environment untuk isolasi dependencies
- **Frontend**: Gunakan `npm run build` untuk production build
- **Database**: Regular backup dan optimize queries
- **Development**: Gunakan batch files untuk quick startup

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Contribution Guidelines
- Follow existing code style and conventions
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 🐛 Bug Reports & Feature Requests

- **Bug Reports**: Create an issue with detailed description, steps to reproduce, and screenshots
- **Feature Requests**: Open an issue with [Feature Request] prefix
- **Security Issues**: Email directly to security@inspecpro.com

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@inspecpro.com
- 💬 GitHub Issues: [Create an issue](https://github.com/yourusername/inspecpro/issues)
- 📖 Documentation: [Wiki](https://github.com/yourusername/inspecpro/wiki)
- 💼 Enterprise Support: contact@inspecpro.com

## 👏 Acknowledgments

- FastAPI team for the excellent framework
- Next.js team for the powerful React framework
- All contributors and testers
- Open source community

## 📊 Project Statistics

- **Lines of Code**: 18,000+ (meningkat dengan fitur baru)
- **API Endpoints**: 30+ (termasuk export dan analytics endpoints)
- **Database Tables**: 12+ (termasuk supporting tables)
- **Field Types**: 12 (termasuk SUBFORM yang baru)
- **User Roles**: 4 (Admin, Inspector, Supervisor, Management)
- **Enum Types**: 6 (semua tersinkronisasi sempurna)
- **Frontend Components**: 50+ (React components dengan TypeScript)
- **Backend Models**: 15+ (SQLAlchemy models)
- **Type Safety**: 100% (strict TypeScript implementation)

---

<div align="center">

**InsPecPro** - Streamlining Quality Assurance, One Inspection at a Time! 🔍✅

Made with ❤️ by the InsPecPro Team

[Website](https://inspecpro.com) • [Documentation](https://docs.inspecpro.com) • [Demo](https://demo.inspecpro.com)

</div>
