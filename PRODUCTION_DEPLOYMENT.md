# InsPecPro Production Deployment Guide

This guide provides step-by-step instructions for deploying InsPecPro to a production environment securely.

## 🔐 Security Checklist

### Pre-Deployment Security Requirements

- [ ] **Database Security**
  - [ ] Create dedicated database user (not root)
  - [ ] Use strong, unique password for database user
  - [ ] Restrict database user permissions to minimum required
  - [ ] Enable database SSL/TLS if possible

- [ ] **Application Security**
  - [ ] Generate new SECRET_KEY for production
  - [ ] Configure proper CORS origins (no wildcards)
  - [ ] Enable rate limiting
  - [ ] Configure secure file upload validation
  - [ ] Set up proper logging system

- [ ] **Infrastructure Security**
  - [ ] Use HTTPS/SSL certificates
  - [ ] Configure firewall rules
  - [ ] Set up reverse proxy (nginx/Apache)
  - [ ] Enable fail2ban or similar intrusion prevention

## 🚀 Deployment Steps

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3 python3-pip python3-venv nginx mysql-server

# Create application user
sudo useradd -m -s /bin/bash inspecpro
sudo usermod -aG sudo inspecpro
```

### 2. Database Setup

```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

```sql
-- Create database
CREATE DATABASE inspecpro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated user
CREATE USER 'inspecpro_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';

-- Grant minimal required permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON inspecpro.* TO 'inspecpro_user'@'localhost';
GRANT CREATE, DROP, ALTER, INDEX ON inspecpro.* TO 'inspecpro_user'@'localhost';
GRANT REFERENCES ON inspecpro.* TO 'inspecpro_user'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```

### 3. Application Deployment

```bash
# Switch to application user
sudo su - inspecpro

# Clone repository
git clone https://github.com/your-org/inspecpro.git
cd inspecpro

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Copy and configure environment
cp backend/.env.production backend/.env
nano backend/.env  # Edit with your production values
```

### 4. Environment Configuration

Edit `backend/.env` with your production values:

```bash
# Generate new secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Update .env file with:
# - Generated SECRET_KEY
# - Database credentials
# - Email configuration
# - CORS origins
# - File paths
```

### 5. Database Migration

```bash
# Run database migrations
cd backend
python -c "
from database import engine, Base
from models import *
Base.metadata.create_all(bind=engine)
print('Database tables created successfully!')
"
```

### 6. SSL Certificate Setup

```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 7. Nginx Configuration

Create `/etc/nginx/sites-available/inspecpro`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File uploads
    client_max_body_size 10M;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/inspecpro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. Systemd Service Setup

Create `/etc/systemd/system/inspecpro-backend.service`:

```ini
[Unit]
Description=InsPecPro Backend API
After=network.target mysql.service

[Service]
Type=simple
User=inspecpro
Group=inspecpro
WorkingDirectory=/home/inspecpro/inspecpro/backend
Environment=PATH=/home/inspecpro/inspecpro/venv/bin
ExecStart=/home/inspecpro/inspecpro/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/inspecpro-frontend.service`:

```ini
[Unit]
Description=InsPecPro Frontend
After=network.target

[Service]
Type=simple
User=inspecpro
Group=inspecpro
WorkingDirectory=/home/inspecpro/inspecpro/frontend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Enable and start services:
```bash
sudo systemctl daemon-reload
sudo systemctl enable inspecpro-backend inspecpro-frontend
sudo systemctl start inspecpro-backend inspecpro-frontend
```

### 9. Monitoring and Logging

```bash
# Create log directories
sudo mkdir -p /var/log/inspecpro
sudo chown inspecpro:inspecpro /var/log/inspecpro

# Set up log rotation
sudo nano /etc/logrotate.d/inspecpro
```

Add to logrotate config:
```
/var/log/inspecpro/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 inspecpro inspecpro
    postrotate
        systemctl reload inspecpro-backend
    endscript
}
```

### 10. Backup Setup

Create backup script `/home/inspecpro/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/inspecpro/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u inspecpro_user -p inspecpro > $BACKUP_DIR/db_backup_$DATE.sql

# Application files backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /home/inspecpro/inspecpro

# Remove old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

Add to crontab:
```bash
crontab -e
# Add: 0 2 * * * /home/inspecpro/backup.sh
```

## 🔍 Post-Deployment Verification

### Health Checks

1. **Database Connection**
   ```bash
   mysql -u inspecpro_user -p inspecpro -e "SELECT 1;"
   ```

2. **API Health**
   ```bash
   curl -k https://yourdomain.com/api/health
   ```

3. **Frontend Access**
   ```bash
   curl -k https://yourdomain.com/
   ```

4. **SSL Certificate**
   ```bash
   openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
   ```

### Security Verification

- [ ] HTTPS redirects working
- [ ] Security headers present
- [ ] Rate limiting functional
- [ ] File upload restrictions working
- [ ] CORS properly configured
- [ ] Database user has minimal permissions

## 🚨 Security Maintenance

### Regular Tasks

1. **Weekly**
   - Review application logs
   - Check for failed login attempts
   - Monitor system resources

2. **Monthly**
   - Update system packages
   - Review user access
   - Test backup restoration
   - Check SSL certificate expiry

3. **Quarterly**
   - Security audit
   - Dependency updates
   - Performance optimization
   - Disaster recovery testing

### Incident Response

1. **Security Breach**
   - Immediately change all passwords
   - Review logs for unauthorized access
   - Update security measures
   - Notify relevant parties

2. **System Compromise**
   - Isolate affected systems
   - Restore from clean backups
   - Investigate root cause
   - Implement additional protections

## 📞 Support and Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check MySQL service status
   - Verify user credentials
   - Check network connectivity

2. **SSL Certificate Issues**
   - Verify certificate validity
   - Check nginx configuration
   - Renew certificates if needed

3. **Performance Issues**
   - Monitor system resources
   - Check database queries
   - Review application logs

### Log Locations

- Application logs: `/var/log/inspecpro/`
- Nginx logs: `/var/log/nginx/`
- System logs: `/var/log/syslog`
- Service logs: `journalctl -u inspecpro-backend`

---

**⚠️ Important**: Always test deployment procedures in a staging environment before applying to production!