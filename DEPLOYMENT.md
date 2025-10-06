# InsPecPro Deployment Guide

## 🚀 Quick Start (Development)

### Prerequisites
- Python 3.8+ installed
- Node.js 16+ installed
- MySQL database (optional - SQLite used by default)

### 1. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the backend server
python main.py
```

Backend will be available at: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

### 2. Frontend Setup (Next.js)

```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start the development server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

### 3. Test the Application

```bash
# Test API endpoints
cd backend
python test_api.py
```

## 🔧 Configuration

### Backend Environment Variables (.env)

```env
# Database Configuration
DATABASE_URL=sqlite:///./inspecpro.db
# For MySQL: DATABASE_URL=mysql+pymysql://username:password@localhost:3306/inspecpro

# JWT Configuration
SECRET_KEY=inspecpro-secret-key-2024-development-only
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email Configuration (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

### Frontend Environment Variables

Create `.env.local` in frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🗄️ Database Setup

### Option 1: SQLite (Default - No setup required)
The application uses SQLite by default for development. Database file will be created automatically.

### Option 2: MySQL Setup

1. **Create Database:**
   ```sql
   CREATE DATABASE inspecpro;
   ```

2. **Update Backend .env:**
   ```env
   DATABASE_URL=mysql+pymysql://username:password@localhost:3306/inspecpro
   ```

3. **Tables will be created automatically** when you start the backend.

## 👥 Sample User Accounts

Create these test accounts for different roles:

| Role | Username | Email | Password | Description |
|------|----------|-------|----------|-------------|
| Admin | admin | admin@inspecpro.com | admin123 | Full system access |
| Inspector | inspector1 | inspector1@inspecpro.com | inspector123 | Form completion |
| Supervisor | supervisor1 | supervisor1@inspecpro.com | supervisor123 | Review authority |
| Management | manager1 | manager1@inspecpro.com | manager123 | Analytics access |

## 🌐 Production Deployment

### Backend (FastAPI) Production

1. **Use Production WSGI Server:**
   ```bash
   pip install gunicorn
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

2. **Environment Configuration:**
   - Use strong SECRET_KEY
   - Configure production database
   - Set up email service
   - Enable HTTPS

3. **Docker Deployment:**
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY . .
   CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
   ```

### Frontend (Next.js) Production

1. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

2. **Static Export (Optional):**
   ```bash
   npm run build
   npm run export
   ```

3. **Deploy to Vercel/Netlify:**
   - Connect GitHub repository
   - Set environment variables
   - Deploy automatically

### Database Production

1. **MySQL Production Setup:**
   - Use managed MySQL service (AWS RDS, Google Cloud SQL)
   - Configure backup strategies
   - Set up monitoring

2. **Connection Pooling:**
   ```python
   # In database.py
   engine = create_engine(
       DATABASE_URL,
       pool_size=20,
       max_overflow=0,
       pool_pre_ping=True
   )
   ```

## 🔒 Security Checklist

### Backend Security
- [ ] Use strong SECRET_KEY in production
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Use environment variables for sensitive data
- [ ] Set up rate limiting
- [ ] Enable logging and monitoring

### Frontend Security
- [ ] Use HTTPS
- [ ] Secure API endpoints
- [ ] Validate user inputs
- [ ] Implement CSP headers
- [ ] Use secure cookies

### Database Security
- [ ] Use strong database passwords
- [ ] Enable SSL connections
- [ ] Regular backups
- [ ] Access control and monitoring

## 📊 Monitoring & Logging

### Backend Monitoring
```python
# Add to main.py
import logging
logging.basicConfig(level=logging.INFO)

# Add middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"{request.method} {request.url} - {response.status_code} - {process_time:.2f}s")
    return response
```

### Database Monitoring
- Monitor connection pool usage
- Track slow queries
- Set up automated backups
- Monitor disk usage

## 🚨 Troubleshooting

### Common Issues

1. **Backend won't start:**
   - Check Python version (3.8+)
   - Verify all dependencies installed
   - Check database connection
   - Review .env file configuration

2. **Frontend won't start:**
   - Check Node.js version (16+)
   - Run `npm install` again
   - Clear node_modules and reinstall
   - Check for port conflicts

3. **Database connection errors:**
   - Verify database credentials
   - Check database server is running
   - Test connection string
   - Review firewall settings

4. **Authentication issues:**
   - Check SECRET_KEY configuration
   - Verify JWT token expiration
   - Review CORS settings
   - Check API endpoint URLs

### Debug Mode

Enable debug logging:
```python
# In main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Health Checks

Test API health:
```bash
curl http://localhost:8000/health
curl http://localhost:8000/
```

## 📈 Performance Optimization

### Backend Optimization
- Use connection pooling
- Implement caching (Redis)
- Optimize database queries
- Use async/await properly
- Enable gzip compression

### Frontend Optimization
- Implement code splitting
- Use Next.js Image optimization
- Enable caching strategies
- Minimize bundle size
- Use CDN for static assets

### Database Optimization
- Add proper indexes
- Optimize queries
- Use read replicas
- Implement query caching
- Monitor performance metrics

## 🔄 Backup & Recovery

### Database Backup
```bash
# MySQL backup
mysqldump -u username -p inspecpro > backup.sql

# SQLite backup
cp inspecpro.db backup_inspecpro.db
```

### File Backup
- Backup uploaded files (photos, signatures)
- Store backups in cloud storage
- Implement automated backup schedules

## 📞 Support

For deployment issues:
1. Check logs for error messages
2. Review configuration files
3. Test individual components
4. Consult documentation
5. Contact development team

---

**Happy Deploying! 🚀**
