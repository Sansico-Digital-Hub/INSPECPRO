# InsPecPro Deployment Guide

## Quick Start (Development)

### Prerequisites
- Python 3.8+ installed
- Node.js 18+ installed
- Git installed

### 1. Clone and Setup Backend
```bash
cd backend
pip install -r requirements.txt
python create_test_user.py  # Creates admin user
python main.py
```

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Access the System
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Default Admin Credentials
- Username: `admin`
- Password: `admin123`

## Production Deployment

### Backend Deployment (FastAPI)

#### Option 1: Using Uvicorn + Nginx
```bash
# Install production dependencies
pip install uvicorn[standard] gunicorn

# Run with Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Option 2: Using Docker
Create `Dockerfile` in backend directory:
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Deployment (Next.js)

#### Option 1: Static Export
```bash
npm run build
npm run export
# Deploy the 'out' folder to your web server
```

#### Option 2: Vercel Deployment
```bash
npm install -g vercel
vercel --prod
```

#### Option 3: Docker
Create `Dockerfile` in frontend directory:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Database Configuration

#### SQLite (Development)
```python
DATABASE_URL = "sqlite:///./inspecpro.db"
```

#### PostgreSQL (Production)
```python
DATABASE_URL = "postgresql://user:password@localhost/inspecpro"
```

#### MySQL (Production)
```python
DATABASE_URL = "mysql://user:password@localhost/inspecpro"
```

### Environment Variables

#### Backend (.env)
```env
SECRET_KEY=your-super-secret-key-here
DATABASE_URL=sqlite:///./inspecpro.db
CORS_ORIGINS=["http://localhost:3000", "https://yourdomain.com"]
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
# For production:
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Nginx Configuration
```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL Configuration (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

## Docker Compose Deployment

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/inspecpro
      - SECRET_KEY=your-secret-key
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=inspecpro
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

Run with:
```bash
docker-compose up -d
```

## Security Checklist

### Backend Security
- [ ] Change default SECRET_KEY
- [ ] Use HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable SQL injection protection
- [ ] Configure file upload restrictions
- [ ] Set up logging and monitoring

### Frontend Security
- [ ] Configure CSP headers
- [ ] Enable HTTPS
- [ ] Sanitize user inputs
- [ ] Implement proper error handling
- [ ] Set up authentication timeouts

### Database Security
- [ ] Use strong database passwords
- [ ] Enable database encryption
- [ ] Set up regular backups
- [ ] Configure access restrictions
- [ ] Enable audit logging

## Monitoring & Maintenance

### Health Checks
```bash
# Backend health check
curl http://localhost:8000/health

# Frontend health check
curl http://localhost:3000
```

### Log Monitoring
```bash
# Backend logs
tail -f backend/logs/app.log

# Frontend logs
npm run logs
```

### Database Backup
```bash
# SQLite backup
cp inspecpro.db inspecpro_backup_$(date +%Y%m%d).db

# PostgreSQL backup
pg_dump inspecpro > inspecpro_backup_$(date +%Y%m%d).sql
```

### Performance Monitoring
- Set up application monitoring (e.g., New Relic, DataDog)
- Configure database performance monitoring
- Set up uptime monitoring
- Implement error tracking (e.g., Sentry)

## Scaling Considerations

### Horizontal Scaling
- Use load balancers for multiple backend instances
- Implement session management with Redis
- Use CDN for static assets
- Consider microservices architecture

### Database Scaling
- Implement read replicas
- Use connection pooling
- Consider database sharding
- Implement caching strategies

### File Storage Scaling
- Use cloud storage (AWS S3, Google Cloud Storage)
- Implement CDN for file delivery
- Set up automated backups

## Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check Python version
python --version

# Check dependencies
pip list

# Check database connection
python -c "from database import engine; print(engine)"
```

#### Frontend Won't Build
```bash
# Clear cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version
```

#### Database Connection Issues
```bash
# Check database file permissions
ls -la inspecpro.db

# Test database connection
python -c "from sqlalchemy import create_engine; engine = create_engine('sqlite:///./inspecpro.db'); print(engine.execute('SELECT 1').fetchone())"
```

### Performance Issues
- Check database query performance
- Monitor memory usage
- Analyze network latency
- Review application logs

## Support & Updates

### Regular Maintenance Tasks
- [ ] Update dependencies monthly
- [ ] Review security patches
- [ ] Monitor disk space
- [ ] Check backup integrity
- [ ] Review user access permissions

### Update Procedure
1. Backup database and files
2. Test updates in staging environment
3. Schedule maintenance window
4. Deploy updates
5. Verify functionality
6. Monitor for issues

For technical support, refer to the system documentation or contact the development team.
