# InsPecPro - Quality Assurance Inspection Management System

InsPecPro is a comprehensive web-based Quality Assurance inspection management system built with Next.js frontend and FastAPI backend, designed to streamline inspection processes across different organizational roles.

## 🚀 Features

### 4 User Roles with Distinct Capabilities:

#### 1. **ADMIN**
- **Dashboard**: View total inspections, submitted, accepted, rejected statistics
- **User Management**: Add, delete, edit users across all roles
- **Dynamic Form Builder**: Create inspection forms with various field types:
  - Text input, dropdown, search dropdown, buttons
  - Photo upload, signature capture, measurement fields
  - Notes and custom validation rules
  - Pass/Hold status buttons based on input criteria
- **Review System**: Accept or reject user submissions with reason tracking
- **Full Control**: Edit or delete any inspection including photos and attachments

#### 2. **USER/INSPECTOR**
- **Personal Dashboard**: View own inspection statistics
- **Form Completion**: Fill out admin-created forms with:
  - Save as draft or submit functionality
  - Photo and signature capture
  - Measurement input with validation
- **My Inspections**: View and manage personal inspection history
- **Draft Management**: Edit and delete draft inspections

#### 3. **SUPERVISOR**
- **Dashboard**: Overview of all inspection activities
- **Review Authority**: Accept or reject submitted inspections
- **Rejection Tracking**: Must provide reasons for rejected inspections
- **Inspection Oversight**: View all inspections across the organization

#### 4. **MANAGEMENT**
- **Executive Dashboard**: High-level inspection statistics
- **Analytics**: Data visualization with graphs and charts based on real inspection data
- **Comprehensive View**: Access to all inspection records
- **Business Intelligence**: Trend analysis and performance metrics

## 🛠 Technology Stack

### Backend (FastAPI)
- **Framework**: FastAPI with Python
- **Database**: MySQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with role-based access control
- **Password Security**: Bcrypt hashing
- **Email**: SMTP integration for password reset
- **File Handling**: Support for photo and signature uploads

### Frontend (Next.js)
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React hooks and context
- **HTTP Client**: Axios with interceptors
- **UI Components**: Custom components with modern design
- **Charts**: Recharts for analytics visualization

### Database Schema
- **Users**: Role-based user management with plant/line assignments
- **Forms**: Dynamic form structure with configurable fields
- **Inspections**: Inspection records with status tracking
- **Responses**: Field responses with various data types
- **Files**: Photo and signature file management
- **Password Resets**: Secure password recovery system

## 📋 Key Features

### Authentication & Security
- **Login**: Username/email and password authentication
- **Password Reset**: Email-based password recovery
- **Role-based Access**: Granular permissions per user role
- **JWT Tokens**: Secure session management

### Dynamic Form System
- **Field Types**: Text, dropdown, search dropdown, button, photo, signature, measurement, notes
- **Validation**: Required fields, measurement ranges (between/higher/lower than)
- **Conditional Logic**: Pass/hold status based on input values
- **File Uploads**: Photo evidence and digital signatures

### Inspection Workflow
1. **Creation**: Users fill out admin-created forms
2. **Draft Management**: Save work in progress
3. **Submission**: Submit for supervisor review
4. **Review Process**: Supervisors accept/reject with reasons
5. **Status Tracking**: Real-time status updates

### Analytics & Reporting
- **Dashboard Statistics**: Real-time inspection metrics
- **Data Visualization**: Charts and graphs for management
- **Trend Analysis**: Historical data insights
- **Performance Tracking**: User and plant-level metrics

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- MySQL database
- Git

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**:
   Create `.env` file with:
   ```env
   DATABASE_URL=mysql+pymysql://username:password@localhost:3306/inspecpro
   SECRET_KEY=your-secret-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USERNAME=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=your-email@gmail.com
   ```

4. **Start the backend server**:
   ```bash
   python main.py
   ```
   Backend will run on `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:3000`

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
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

### Users (Admin only)
- `GET /api/users/` - List all users
- `POST /api/users/` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Forms (Admin only)
- `GET /api/forms/` - List all forms
- `POST /api/forms/` - Create new form
- `PUT /api/forms/{id}` - Update form
- `DELETE /api/forms/{id}` - Delete form

### Inspections
- `GET /api/inspections/` - List inspections (role-filtered)
- `POST /api/inspections/` - Create inspection
- `PUT /api/inspections/{id}` - Update inspection
- `POST /api/inspections/{id}/submit` - Submit for review
- `DELETE /api/inspections/{id}` - Delete inspection

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/analytics` - Get analytics data (Management only)
- `GET /api/dashboard/recent-inspections` - Get recent inspections
- `GET /api/dashboard/pending-reviews` - Get pending reviews

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Granular permissions per user role
- **Password Hashing**: Bcrypt encryption for password storage
- **Input Validation**: Comprehensive data validation
- **CORS Protection**: Cross-origin request security
- **SQL Injection Prevention**: Parameterized queries with SQLAlchemy

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

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Enhanced analytics and reporting
- **v1.2.0** - Mobile responsiveness improvements
- **v2.0.0** - Advanced form builder and workflow management

---

**InsPecPro** - Streamlining Quality Assurance, One Inspection at a Time! 🔍✅
