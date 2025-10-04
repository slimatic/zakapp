# Phase 2: Production Environment Setup - Implementation Guide

**Generated**: October 3, 2025  
**Status**: 🚀 IN PROGRESS  
**Phase**: 2 of 5 (Performance Testing → **Production Setup** → Monitoring → Final Testing → Deployment)

---

## Table of Contents
1. [Overview](#overview)
2. [Infrastructure Requirements](#infrastructure-requirements)
3. [Server Setup](#server-setup)
4. [Database Configuration](#database-configuration)
5. [Environment Variables](#environment-variables)
6. [SSL/TLS Configuration](#ssltls-configuration)
7. [Deployment Scripts](#deployment-scripts)
8. [Health Checks](#health-checks)
9. [Rollback Plan](#rollback-plan)

---

## 1. Overview

### Objectives
- ✅ Set up production-ready server infrastructure
- ✅ Configure PostgreSQL database for production
- ✅ Implement SSL/TLS encryption
- ✅ Create deployment automation scripts
- ✅ Configure environment-specific settings
- ✅ Establish backup and recovery procedures

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Internet (HTTPS)                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Nginx Reverse Proxy (SSL)                   │
│              - SSL Termination                           │
│              - Rate Limiting                             │
│              - Static File Serving                       │
└──────────┬────────────────────────┬─────────────────────┘
           │                        │
           ▼                        ▼
┌──────────────────┐      ┌──────────────────┐
│  Frontend        │      │  Backend API     │
│  React App       │      │  Node.js/Express │
│  Port 3000       │      │  Port 3002       │
└──────────────────┘      └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │  PostgreSQL 14   │
                          │  Port 5432       │
                          │  (Internal)      │
                          └──────────────────┘
```

### Technology Stack
- **Server OS**: Ubuntu 22.04 LTS
- **Node.js**: 18.x LTS (or 20.x LTS)
- **Database**: PostgreSQL 14+
- **Reverse Proxy**: Nginx 1.18+
- **SSL**: Let's Encrypt (Certbot)
- **Process Manager**: PM2
- **Monitoring**: PM2 Plus (optional), systemd

---

## 2. Infrastructure Requirements

### Minimum Server Specifications

**Development/Staging**:
- CPU: 2 cores
- RAM: 4 GB
- Storage: 20 GB SSD
- Network: 100 Mbps

**Production**:
- CPU: 4 cores (8+ recommended)
- RAM: 8 GB (16+ recommended)
- Storage: 50 GB SSD (with auto-scaling)
- Network: 1 Gbps
- Backup: Automated daily backups

### Cloud Provider Options

#### Option A: DigitalOcean (Recommended for MVP)
```bash
# Droplet Specification
Size: Basic ($24/month)
- 2 vCPUs
- 4 GB RAM
- 80 GB SSD
- 4 TB transfer

# Database
Managed PostgreSQL: Basic ($15/month)
- 1 vCPU
- 1 GB RAM
- 10 GB SSD
- Automated backups
```

#### Option B: AWS EC2
```bash
# EC2 Instance
Instance: t3.medium
- 2 vCPUs
- 4 GB RAM
- EBS: 30 GB gp3

# RDS PostgreSQL
Instance: db.t3.micro
- 1 vCPU
- 1 GB RAM
- 20 GB storage
- Multi-AZ optional
```

#### Option C: Heroku (Fastest deployment)
```bash
# Dyno Configuration
Web Dyno: Standard-1X ($25/month)
- 512 MB RAM
- Sleeps after 30 min inactivity

# Database
Heroku Postgres: Standard-0 ($50/month)
- 64 GB storage
- 120 connections
- Automated backups
```

---

## 3. Server Setup

### 3.1 Initial Server Configuration

```bash
#!/bin/bash
# production-server-setup.sh

# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y \
  build-essential \
  git \
  curl \
  wget \
  nginx \
  certbot \
  python3-certbot-nginx \
  ufw \
  fail2ban

# Install Node.js (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v20.x
npm --version   # Should be 10.x

# Install PM2 globally
sudo npm install -g pm2

# Create application user (non-root)
sudo useradd -m -s /bin/bash zakapp
sudo usermod -aG sudo zakapp

# Create application directories
sudo mkdir -p /var/www/zakapp
sudo chown -R zakapp:zakapp /var/www/zakapp
```

### 3.2 Firewall Configuration

```bash
#!/bin/bash
# setup-firewall.sh

# Enable UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change 22 to your custom port if configured)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL (only from localhost)
sudo ufw allow from 127.0.0.1 to any port 5432

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status verbose
```

### 3.3 Security Hardening

```bash
#!/bin/bash
# security-hardening.sh

# Disable root login via SSH
sudo sed -i 's/^PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Disable password authentication (use SSH keys only)
sudo sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Enable fail2ban for SSH
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Set up automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Restart SSH
sudo systemctl restart sshd
```

---

## 4. Database Configuration

### 4.1 PostgreSQL Installation

```bash
#!/bin/bash
# install-postgresql.sh

# Install PostgreSQL 14
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo -u postgres psql --version
```

### 4.2 Database Setup

```bash
#!/bin/bash
# setup-database.sh

# Create production database and user
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE zakapp_production;

-- Create user with strong password (change this!)
CREATE USER zakapp_user WITH ENCRYPTED PASSWORD 'CHANGE_ME_STRONG_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE zakapp_production TO zakapp_user;

-- Connect to database
\c zakapp_production

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO zakapp_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO zakapp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO zakapp_user;

-- Exit
\q
EOF

echo "Database setup complete!"
echo "IMPORTANT: Change the password in this script and .env file!"
```

### 4.3 Database Configuration (`postgresql.conf`)

```ini
# /etc/postgresql/14/main/postgresql.conf

# Connection settings
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 2621kB
min_wal_size = 1GB
max_wal_size = 4GB

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_timezone = 'UTC'

# Security
ssl = on
ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'
```

### 4.4 Automated Backups

```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/var/backups/zakapp"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="zakapp_production_${DATE}.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
sudo -u postgres pg_dump zakapp_production | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "zakapp_production_*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}"

# Optional: Upload to S3/DigitalOcean Spaces
# aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" s3://your-bucket/backups/
```

Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * /var/www/zakapp/scripts/backup-database.sh
```

---

## 5. Environment Variables

### 5.1 Production `.env` File

Create `/var/www/zakapp/server/.env.production`:

```bash
# Application
NODE_ENV=production
PORT=3002

# Database
DATABASE_URL="postgresql://zakapp_user:STRONG_PASSWORD@localhost:5432/zakapp_production"

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET="YOUR_SUPER_SECRET_JWT_KEY_CHANGE_THIS"
JWT_REFRESH_SECRET="YOUR_REFRESH_TOKEN_SECRET_CHANGE_THIS"

# Encryption (generate with: openssl rand -hex 32)
ENCRYPTION_KEY="YOUR_64_CHAR_HEX_ENCRYPTION_KEY"

# Frontend URL
CLIENT_URL="https://your-domain.com"

# API Base URL
API_URL="https://api.your-domain.com"

# Session
SESSION_SECRET="YOUR_SESSION_SECRET_CHANGE_THIS"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email (if implementing notifications)
SMTP_HOST="smtp.your-provider.com"
SMTP_PORT=587
SMTP_USER="your-email@domain.com"
SMTP_PASS="your-smtp-password"

# Monitoring (optional)
SENTRY_DSN="your-sentry-dsn"

# Data directory
DATA_DIR="/var/www/zakapp/data/production"

# Logging
LOG_LEVEL="info"
LOG_DIR="/var/log/zakapp"
```

### 5.2 Generate Secrets Script

```bash
#!/bin/bash
# generate-secrets.sh

echo "Generating secure secrets for production..."
echo ""

echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"
echo "SESSION_SECRET=$(openssl rand -base64 32)"
echo ""

echo "Add these to your .env.production file"
echo "IMPORTANT: Store these securely and never commit to git!"
```

---

## 6. SSL/TLS Configuration

### 6.1 Obtain SSL Certificate (Let's Encrypt)

```bash
#!/bin/bash
# setup-ssl.sh

# Replace with your domain
DOMAIN="your-domain.com"
EMAIL="your-email@example.com"

# Obtain SSL certificate
sudo certbot --nginx \
  -d $DOMAIN \
  -d www.$DOMAIN \
  -d api.$DOMAIN \
  --non-interactive \
  --agree-tos \
  --email $EMAIL \
  --redirect

# Auto-renewal is set up by certbot
sudo systemctl status certbot.timer

echo "SSL certificate installed for $DOMAIN"
```

### 6.2 Nginx Configuration

Create `/etc/nginx/sites-available/zakapp`:

```nginx
# Upstream servers
upstream backend {
    server 127.0.0.1:3002;
    keepalive 64;
}

upstream frontend {
    server 127.0.0.1:3000;
    keepalive 64;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=50r/s;

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    
    return 301 https://$server_name$request_uri;
}

# Frontend (Main domain)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logging
    access_log /var/log/nginx/zakapp-access.log;
    error_log /var/log/nginx/zakapp-error.log;

    # Rate limiting
    limit_req zone=general_limit burst=20 nodelay;

    # Proxy to React app
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API (api subdomain)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.your-domain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logging
    access_log /var/log/nginx/zakapp-api-access.log;
    error_log /var/log/nginx/zakapp-api-error.log;

    # Rate limiting (stricter for API)
    limit_req zone=api_limit burst=10 nodelay;

    # Proxy to Node.js API
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (no rate limit)
    location /health {
        proxy_pass http://backend;
        access_log off;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/zakapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. Deployment Scripts

### 7.1 PM2 Ecosystem Configuration

Create `/var/www/zakapp/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'zakapp-backend',
      script: 'server/index.js',
      cwd: '/var/www/zakapp',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: '/var/log/zakapp/backend-error.log',
      out_file: '/var/log/zakapp/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    },
    {
      name: 'zakapp-frontend',
      script: 'serve',
      args: '-s client/build -l 3000',
      cwd: '/var/www/zakapp',
      instances: 1,
      env_production: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/zakapp/frontend-error.log',
      out_file: '/var/log/zakapp/frontend-out.log',
      autorestart: true
    }
  ]
};
```

### 7.2 Deployment Script

Create `/var/www/zakapp/scripts/deploy.sh`:

```bash
#!/bin/bash
# deploy.sh - Production deployment script

set -e  # Exit on error

# Configuration
APP_DIR="/var/www/zakapp"
REPO_URL="https://github.com/slimatic/zakapp.git"
BRANCH="main"
BACKUP_DIR="/var/backups/zakapp"

echo "🚀 Starting ZakApp deployment..."

# Create backup
echo "📦 Creating backup..."
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
tar -czf "${BACKUP_DIR}/zakapp_${DATE}.tar.gz" -C $APP_DIR .

# Navigate to app directory
cd $APP_DIR

# Pull latest code
echo "📥 Pulling latest code from $BRANCH branch..."
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# Install dependencies
echo "📦 Installing dependencies..."
cd server && npm ci --only=production
cd ../client && npm ci --only=production
cd ..

# Build frontend
echo "🏗️  Building frontend..."
cd client && npm run build
cd ..

# Run database migrations
echo "🗄️  Running database migrations..."
cd server && npx prisma migrate deploy
cd ..

# Reload PM2
echo "🔄 Reloading PM2 processes..."
pm2 reload ecosystem.config.js --env production

# Wait for health check
echo "⏳ Waiting for application to start..."
sleep 10

# Health check
echo "🏥 Running health check..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/health)

if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ Deployment successful!"
    echo "📊 Application status:"
    pm2 status
else
    echo "❌ Health check failed! Rolling back..."
    pm2 stop all
    # Restore from backup
    tar -xzf "${BACKUP_DIR}/zakapp_${DATE}.tar.gz" -C $APP_DIR
    pm2 restart all
    echo "⚠️  Rollback complete. Check logs for errors."
    exit 1
fi

echo "🎉 Deployment complete!"
```

Make it executable:
```bash
chmod +x /var/www/zakapp/scripts/deploy.sh
```

### 7.3 Initial Deployment

```bash
#!/bin/bash
# initial-deploy.sh - First time deployment

set -e

APP_DIR="/var/www/zakapp"
REPO_URL="https://github.com/slimatic/zakapp.git"

echo "🚀 Initial ZakApp deployment..."

# Clone repository
echo "📥 Cloning repository..."
git clone $REPO_URL $APP_DIR
cd $APP_DIR

# Checkout production branch
git checkout main

# Create necessary directories
mkdir -p /var/log/zakapp
mkdir -p /var/www/zakapp/data/production

# Set permissions
sudo chown -R zakapp:zakapp $APP_DIR
sudo chown -R zakapp:zakapp /var/log/zakapp

# Install dependencies
echo "📦 Installing backend dependencies..."
cd server && npm ci --only=production

echo "📦 Installing frontend dependencies..."
cd ../client && npm ci --only=production

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Setup database
echo "🗄️  Setting up database..."
cd ../server
npx prisma generate
npx prisma migrate deploy

# Start with PM2
echo "▶️  Starting application with PM2..."
cd ..
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

echo "✅ Initial deployment complete!"
echo "📊 Application status:"
pm2 status
```

---

## 8. Health Checks

### 8.1 Application Health Check

The backend already has `/health` endpoint. Enhance it:

```typescript
// server/src/routes/health.ts
app.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: require('../package.json').version,
    checks: {
      database: 'checking...',
      memory: {
        used: process.memoryUsage(),
        free: os.freemem(),
        total: os.totalmem()
      }
    }
  };

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'connected';
    res.status(200).json(health);
  } catch (error) {
    health.status = 'ERROR';
    health.checks.database = 'disconnected';
    res.status(503).json(health);
  }
});
```

### 8.2 Monitoring Script

```bash
#!/bin/bash
# monitor-health.sh

API_URL="https://api.your-domain.com/health"
ALERT_EMAIL="admin@your-domain.com"

# Check health endpoint
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ "$STATUS_CODE" != "200" ]; then
    echo "⚠️  Health check failed! Status code: $STATUS_CODE"
    
    # Send alert (requires mailutils)
    echo "ZakApp health check failed at $(date)" | mail -s "ZakApp Alert" $ALERT_EMAIL
    
    # Attempt restart
    pm2 restart zakapp-backend
    
    exit 1
fi

echo "✅ Health check passed"
```

Add to crontab:
```bash
# Health check every 5 minutes
*/5 * * * * /var/www/zakapp/scripts/monitor-health.sh
```

---

## 9. Rollback Plan

### 9.1 Quick Rollback Script

```bash
#!/bin/bash
# rollback.sh

BACKUP_DIR="/var/backups/zakapp"

echo "⚠️  Starting rollback..."

# List available backups
echo "Available backups:"
ls -lh $BACKUP_DIR/zakapp_*.tar.gz | tail -5

# Get most recent backup
LATEST_BACKUP=$(ls -t $BACKUP_DIR/zakapp_*.tar.gz | head -1)

echo "Rolling back to: $LATEST_BACKUP"
read -p "Are you sure? (yes/no) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy] ]]; then
    # Stop applications
    pm2 stop all
    
    # Restore backup
    tar -xzf $LATEST_BACKUP -C /var/www/zakapp
    
    # Restart applications
    pm2 restart all
    
    echo "✅ Rollback complete!"
else
    echo "Rollback cancelled"
    exit 1
fi
```

---

## Next Steps

1. **Choose Infrastructure Provider** (DigitalOcean/AWS/Heroku)
2. **Provision Server** (2-4 vCPUs, 4-8 GB RAM)
3. **Run Setup Scripts** (server-setup.sh, database-setup.sh)
4. **Configure DNS** (Point domain to server)
5. **Install SSL Certificate** (Let's Encrypt)
6. **Initial Deployment** (initial-deploy.sh)
7. **Verify Deployment** (health checks, smoke tests)

**Ready to begin?** Let me know which infrastructure provider you'd like to use!
