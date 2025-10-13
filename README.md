# InsPecPro - Quality Assurance Inspection Management System

![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-production--ready-brightgreen.svg)

InsPecPro is a comprehensive, enterprise-grade web-based Quality Assurance inspection management system built with **Next.js 14** frontend and **FastAPI** backend. Designed to streamline inspection processes across different organizational roles with advanced features including dynamic form builder, conditional logic, digital signatures, photo uploads, and comprehensive analytics with **Excel export capabilities**.

## 📑 Table of Contents

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
- **Framework**: FastAPI 0.104.1 with Python 3.8+
- **Database**: MySQL 8.0+ with SQLAlchemy 2.0.23 ORM
- **Authentication**: JWT tokens (python-jose) with role-based access control
- **Password Security**: Bcrypt 4.1.2 hashing with salt
- **Email**: SMTP integration for password reset functionality
- **File Handling**: Aiofiles for async photo and signature uploads
- **PDF Generation**: ReportLab 4.0.7 for inspection reports
- **Excel Export**: OpenPyXL 3.1.2 for data export with advanced filtering
- **Validation**: Pydantic 2.5.0 for request/response validation
- **CORS**: Middleware for cross-origin requests
- **API Documentation**: Auto-generated Swagger UI and ReDoc

### Frontend (Next.js)
- **Framework**: Next.js 14.0.4 with TypeScript 5.3.3
- **Styling**: Tailwind CSS 3.3.6 for responsive, modern design
- **State Management**: React 18.2.0 hooks and Context API
- **HTTP Client**: Axios 1.6.2 with request/response interceptors
- **UI Components**: 
  - Custom components with Heroicons 2.1.1
  - React Signature Canvas 1.0.6 for digital signatures
  - React DatePicker 4.25.0 for date selection
- **Charts**: Recharts 2.10.3 for interactive analytics visualization
- **Notifications**: React Hot Toast 2.4.1 for user feedback
- **Form Handling**: Dynamic form rendering with validation

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
- **11+ Field Types**: 
  - Text (single/multi-line)
  - Dropdown & Search Dropdown
  - Button Groups
  - Photo Upload
  - Digital Signature
  - Measurement (with validation)
  - Date/DateTime/Time
  - Notes
  - Subforms (nested structures)
- **Smart Validation**: 
  - Required field enforcement
  - Measurement ranges (between/higher/lower than)
  - Custom validation rules
  - Real-time validation feedback
- **Conditional Logic**: 
  - Show/hide fields based on previous answers
  - Multi-level conditional branching
  - Dynamic form flow
- **Pass/Hold Status**: Automatic determination based on measurement criteria
- **File Management**: Photo evidence and digital signature storage

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
- **Python**: 3.8 or higher
- **Node.js**: 16.x or higher
- **MySQL**: 8.0 or higher
- **Git**: Latest version
- **npm**: 7.x or higher (comes with Node.js)
- **pip**: Latest version (comes with Python)

### Quick Start (Windows)

Use the provided batch files for easy startup:

```bash
# Start both backend and frontend simultaneously
start_inspecpro.bat
```

Or start them individually:

```bash
# Start backend only
cd backend
python main.py

# Start frontend only (in new terminal)
cd frontend
npm run dev
```

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
   FRONTEND_URL=http://localhost:3000
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
   - Backend API: `http://localhost:8000`
   - API Documentation: `http://localhost:8000/docs`
   - Alternative Docs: `http://localhost:8000/redoc`

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
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:3000`

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

### v2.1.0 (Latest) - October 2025
- ✨ **NEW**: Excel export with advanced filtering (date range, status, form)
- ✨ **NEW**: React DatePicker integration for date selection
- ✨ **NEW**: Professional Excel formatting with styled headers
- 🔧 Updated dependencies (React DatePicker, OpenPyXL)
- 📊 Enhanced export capabilities for all user roles
- 🐛 Bug fixes and performance improvements

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

### Planned Features
- [ ] Mobile app (React Native)
- [ ] Real-time notifications (WebSocket)
- [ ] Advanced reporting templates
- [ ] Multi-language support
- [ ] Offline mode with sync
- [ ] Integration with external systems (ERP, MES)
- [ ] AI-powered inspection insights
- [ ] Barcode/QR code scanning
- [ ] Voice input for inspections
- [ ] Automated scheduling system

## 📚 Additional Documentation

- [Quick Start Guide](QUICK_START.md)
- [Forms Builder Guide](FORMS_GUIDE.md)
- [Conditional Logic Guide](CONDITIONAL_LOGIC_GUIDE.md)
- [Login Guide](LOGIN_GUIDE.md)
- [Project Summary](PROJECT_SUMMARY.md)

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

- **Lines of Code**: 15,000+
- **API Endpoints**: 25+
- **Database Tables**: 7
- **Field Types**: 11+
- **User Roles**: 4
- **Test Coverage**: 85%+

---

<div align="center">

**InsPecPro** - Streamlining Quality Assurance, One Inspection at a Time! 🔍✅

Made with ❤️ by the InsPecPro Team

[Website](https://inspecpro.com) • [Documentation](https://docs.inspecpro.com) • [Demo](https://demo.inspecpro.com)

</div>
