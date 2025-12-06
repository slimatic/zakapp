# zakapp Deployment Guide

This guide provides comprehensive instructions for deploying zakapp in various environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Deployment](#development-deployment)
3. [Production Deployment](#production-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Security Considerations](#security-considerations)
6. [Backup and Recovery](#backup-and-recovery)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+ recommended), macOS, or Windows with WSL2
- **Docker**: Version 20.10+ with Docker Compose
- **Memory**: Minimum 2GB RAM, recommended 4GB+
- **Storage**: Minimum 10GB free space
- **Network**: Internet access for initial setup and updates

### Software Dependencies

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git (for source code management)
- OpenSSL (for certificate generation)

### Installation Commands

**Ubuntu/Debian:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Git
sudo apt install git
```

**CentOS/RHEL:**

```bash
# Install Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
```

## Development Deployment

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/slimatic/zakapp.git
   cd zakapp
   ```

2. **Set up environment variables**

   ```bash
   # Backend configuration
   cp server/.env.example server/.env
   # Edit server/.env with your backend settings (PORT, JWT_SECRET, etc.)
   
   # Frontend configuration
   cp client/.env.example client/.env.local
   # Edit client/.env.local - ensure REACT_APP_API_BASE_URL matches backend PORT
   ```

   **Important**: If you change the backend `PORT` in `server/.env`, you must update `REACT_APP_API_BASE_URL` in `client/.env.local` to match.

3. **Install dependencies and start development**

   ```bash
   # From root directory
   npm install
   npm run dev
   
   # Or manually start each service:
   # Terminal 1: cd server && npm install && npm run dev
   # Terminal 2: cd client && npm install && npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000 (or your configured PORT)
   - Backend API: http://localhost:3001 (or your configured PORT)
   - API Health Check: http://localhost:3001/api/health

### Development Configuration

**docker-compose.yml** (already configured):

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/Dockerfile.frontend
    ports:
      - '3000:3000'
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - REACT_APP_API_URL=http://localhost:3001

  backend:
    build:
      context: ./backend
      dockerfile: ../docker/Dockerfile.backend
    ports:
      - '3001:3001'
    volumes:
      - ./backend:/app
      - /app/node_modules
      - ./backend/data:/app/data
    environment:
      - NODE_ENV=development
      - PORT=3001
      - JWT_SECRET=your-jwt-secret-change-in-production
```

## Production Deployment

### Single Server Deployment

1. **Prepare the server**

   ```bash
   # Create application directory
   sudo mkdir -p /opt/zakapp
   sudo chown $USER:$USER /opt/zakapp
   cd /opt/zakapp

   # Clone the repository
   git clone https://github.com/slimatic/zakapp.git .
   ```

2. **Create production configuration**

   ```bash
   # Copy production compose file
   cp docker-compose.prod.yml.example docker-compose.prod.yml

   # Create environment file
   cp .env.prod.example .env.prod
   ```

3. **Configure environment variables**

   ```bash
   # Edit production environment file
   nano .env.prod
   ```

   Required production variables:

   ```env
   NODE_ENV=production
   JWT_SECRET=your-very-secure-jwt-secret-here
   ENCRYPTION_KEY=your-32-character-encryption-key
   DATA_DIR=/app/data
   BACKUP_DIR=/app/backups

   # Database settings (if using database in future)
   # DATABASE_URL=your-database-connection-string

   # Email settings (for notifications)
   SMTP_HOST=your-smtp-host
   SMTP_PORT=587
   SMTP_USER=your-smtp-username
   SMTP_PASS=your-smtp-password

   # Security settings
   CORS_ORIGIN=https://your-domain.com
   RATE_LIMIT_MAX=100
   RATE_LIMIT_WINDOW=15

   # SSL/TLS settings
   SSL_CERT_PATH=/app/ssl/cert.pem
   SSL_KEY_PATH=/app/ssl/key.pem
   ```

4. **Generate SSL certificates**

   ```bash
   # Create SSL directory
   mkdir -p ssl

   # Option 1: Self-signed certificate (for testing)
   openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes

   # Option 2: Let's Encrypt (recommended for production)
   # Install certbot first
   sudo apt install certbot
   sudo certbot certonly --standalone -d your-domain.com
   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
   sudo chown $USER:$USER ssl/*
   ```

5. **Build and deploy**

   ```bash
   # Build production images
   docker-compose -f docker-compose.prod.yml build

   # Start production services
   docker-compose -f docker-compose.prod.yml up -d

   # Verify deployment
   docker-compose -f docker-compose.prod.yml ps
   docker-compose -f docker-compose.prod.yml logs
   ```

### Production Docker Compose Configuration

**docker-compose.prod.yml:**

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/Dockerfile.production
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.zakapp-frontend.rule=Host(`your-domain.com`)'
      - 'traefik.http.routers.zakapp-frontend.tls=true'

  backend:
    build:
      context: ./backend
      dockerfile: ../docker/Dockerfile.production
    restart: unless-stopped
    volumes:
      - ./data:/app/data
      - ./backups:/app/backups
      - ./ssl:/app/ssl:ro
    environment:
      - NODE_ENV=production
    env_file:
      - .env.prod
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.zakapp-backend.rule=Host(`api.your-domain.com`)'
      - 'traefik.http.routers.zakapp-backend.tls=true'

  traefik:
    image: traefik:v2.10
    command:
      - '--api.dashboard=true'
      - '--providers.docker=true'
      - '--entrypoints.web.address=:80'
      - '--entrypoints.websecure.address=:443'
      - '--certificatesresolvers.letsencrypt.acme.tlschallenge=true'
      - '--certificatesresolvers.letsencrypt.acme.email=admin@your-domain.com'
      - '--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json'
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - '/var/run/docker.sock:/var/run/docker.sock:ro'
      - './letsencrypt:/letsencrypt'
    restart: unless-stopped

volumes:
  letsencrypt:
```

### Reverse Proxy with Nginx

If using Nginx instead of Traefik:

**nginx.conf:**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Environment Configuration

### Environment Variables

**Development (.env):**

```env
NODE_ENV=development
JWT_SECRET=dev-jwt-secret
ENCRYPTION_KEY=dev-encryption-key-32-characters
DATA_DIR=./data
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
```

**Production (.env.prod):**

```env
NODE_ENV=production
JWT_SECRET=your-production-jwt-secret-very-long-and-secure
ENCRYPTION_KEY=your-32-character-production-encryption-key
DATA_DIR=/app/data
BACKUP_DIR=/app/backups
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com
SSL_CERT_PATH=/app/ssl/cert.pem
SSL_KEY_PATH=/app/ssl/key.pem

# Precious Metals API (for Nisab calculations)
METALS_API_KEY=your-metals-api-production-key
```

**Required for Nisab Year Record Feature:**

The `METALS_API_KEY` environment variable is required for the Nisab Year Record feature to function properly. This API key is used to fetch current gold and silver spot prices for calculating Islamic Zakat Nisab thresholds.

```env
# Precious Metals API Configuration
# Sign up at: https://metals-api.com/signup
# Free tier: 50 requests/month (sufficient with 24-hour caching)
METALS_API_KEY=your-metals-api-key-here
```

**Setup Instructions:**

1. Sign up for a free account at [metals-api.com](https://metals-api.com/signup)
2. Copy your API key from the dashboard
3. Add the key to your `.env` file (development) or `.env.prod` (production)
4. Restart the backend server to apply changes

**Note:** The application caches precious metal prices for 24 hours to minimize API calls and stay within the free tier limit (50 requests/month).

### Port Configuration

The application supports flexible port configuration to prevent "EADDRINUSE" errors and enable multiple instances:

**Backend Port Configuration:**

```bash
# Method 1: Environment variable in .env file
PORT=3002

# Method 2: Command line
PORT=3002 npm run dev

# Method 3: Docker environment
services:
  backend:
    environment:
      - PORT=3002
    ports:
      - '3002:3002'  # Update port mapping accordingly
```

**Frontend Port Configuration:**

The React frontend (client/) runs on port 3000 by default. To change it:

```bash
# Method 1: Environment variable in client/.env.local
PORT=3010

# Method 2: Command line
PORT=3010 npm start

# Method 3: Create React App will prompt for alternative if 3000 is busy
```

**CRITICAL**: When changing backend port, update frontend's API URL:

```bash
# In client/.env.local
REACT_APP_API_BASE_URL=http://localhost:3002/api  # Match backend PORT
```

**Handling Port Conflicts:**

If you encounter port conflicts, the backend server provides helpful error messages:

```
❌ Port 3001 is already in use!

To fix this issue, you can:
• Set a different port: PORT=3002 npm run dev
• Or kill the process using port 3001:
  - Find the process: lsof -ti:3001
  - Kill the process: kill -9 $(lsof -ti:3001)
```

**Production Considerations:**

- Use reverse proxy (Nginx/Traefik) to handle external ports (80/443)
- Internal application ports can be any available port
- Update load balancer/proxy configuration when changing internal ports

### Security Configuration

1. **Generate secure secrets**

   ```bash
   # Generate JWT secret (64 characters)
   openssl rand -hex 32

   # Generate encryption key (32 characters)
   openssl rand -hex 16
   ```

2. **Set proper file permissions**

   ```bash
   # Secure environment files
   chmod 600 .env.prod

   # Secure SSL certificates
   chmod 600 ssl/key.pem
   chmod 644 ssl/cert.pem

   # Secure data directory
   chmod 700 data/
   ```

## Backup and Recovery

### Automated Backup Script

**scripts/backup.sh:**

```bash
#!/bin/bash

BACKUP_DIR="/opt/zakapp/backups"
DATA_DIR="/opt/zakapp/data"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="zakapp_backup_$DATE"

# Create backup directory
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

# Stop application
docker-compose -f docker-compose.prod.yml stop

# Create backup
tar -czf "$BACKUP_DIR/$BACKUP_NAME/data.tar.gz" -C "$DATA_DIR" .
cp .env.prod "$BACKUP_DIR/$BACKUP_NAME/"
cp docker-compose.prod.yml "$BACKUP_DIR/$BACKUP_NAME/"

# Start application
docker-compose -f docker-compose.prod.yml start

# Clean old backups (keep last 30 days)
find "$BACKUP_DIR" -type d -name "zakapp_backup_*" -mtime +30 -exec rm -rf {} \;

echo "Backup completed: $BACKUP_NAME"
```

### Backup Automation with Cron

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /opt/zakapp/scripts/backup.sh >> /var/log/zakapp-backup.log 2>&1

# Weekly backup cleanup
0 3 * * 0 find /opt/zakapp/backups -type f -name "*.tar.gz" -mtime +7 -delete
```

### Recovery Procedure

1. **Stop the application**

   ```bash
   docker-compose -f docker-compose.prod.yml down
   ```

2. **Restore data**

   ```bash
   # Extract backup
   cd /opt/zakapp
   tar -xzf backups/zakapp_backup_YYYYMMDD_HHMMSS/data.tar.gz -C data/

   # Restore configuration
   cp backups/zakapp_backup_YYYYMMDD_HHMMSS/.env.prod .
   cp backups/zakapp_backup_YYYYMMDD_HHMMSS/docker-compose.prod.yml .
   ```

3. **Restart the application**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Monitoring and Maintenance

### Health Checks

**Health check script:**

```bash
#!/bin/bash

# Check if containers are running
if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "ERROR: Some containers are not running"
    exit 1
fi

# Check frontend accessibility
if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "ERROR: Frontend not accessible"
    exit 1
fi

# Check backend API
if ! curl -f http://localhost:3001/api/v1/health > /dev/null 2>&1; then
    echo "ERROR: Backend API not accessible"
    exit 1
fi

echo "All services are healthy"
```

### Log Management

```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Set up log rotation
sudo nano /etc/logrotate.d/zakapp
```

**Log rotation configuration:**

```
/var/log/zakapp/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 644 root root
    postrotate
        docker-compose -f /opt/zakapp/docker-compose.prod.yml restart >> /var/log/zakapp/restart.log 2>&1 || true
    endscript
}
```

### Update Procedure

1. **Backup current version**

   ```bash
   ./scripts/backup.sh
   ```

2. **Pull latest changes**

   ```bash
   git pull origin main
   ```

3. **Rebuild and deploy**

   ```bash
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Verify deployment**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ./scripts/health-check.sh
   ```

## Feature 008: Nisab Year Record Migration

### Overview

Feature 008 introduces the Nisab Year Record workflow for automatic Hawl (lunar year) tracking with finalization and unlocking capabilities. This section covers the deployment and migration requirements.

### Database Migration

**Required**: This feature includes database schema changes that must be migrated.

#### Production Migration Steps

1. **Backup your database**

   ```bash
   # SQLite backup
   sqlite3 /path/to/database.db ".backup '/path/to/backup-$(date +%F).db'"
   
   # Verify backup
   sqlite3 /path/to/backup-$(date +%F).db "SELECT name FROM sqlite_master WHERE type='table';"
   ```

2. **Run Prisma migration**

   ```bash
   # Navigate to server directory
   cd server
   
   # Run migration in production mode
   npx prisma migrate deploy
   
   # Verify migration
   npx prisma migrate status
   ```

   **Expected output**:
   ```
   ✓ Migration 20240130000000_add_nisab_year_records applied
   Database schema is up to date!
   ```

3. **Verify schema changes**

   ```bash
   # Check new tables
   npx prisma db execute --stdin <<SQL
   SELECT name FROM sqlite_master WHERE type='table' AND name='NisabYearRecord';
   SQL
   
   # Should return: NisabYearRecord
   ```

#### Development Migration

```bash
# From server directory
npm run migrate:dev

# This will:
# 1. Create migration files
# 2. Apply to development database
# 3. Regenerate Prisma Client
```

### Environment Variables

**New requirement**: Feature 008 requires the Metals API for live gold/silver pricing.

#### Required Environment Variable

Add to your `server/.env` file:

```env
# Metals API Configuration
METALS_API_KEY=your_metals_api_key_here
```

#### Obtaining API Key

1. **Sign up**: Visit [https://metals-api.com/](https://metals-api.com/)
2. **Free tier**: 50 API calls/month (sufficient for most users)
3. **Paid tier**: Required for high-volume usage (>50 nisab checks/month)
4. **Copy key**: Dashboard → API Key → Copy to clipboard
5. **Set variable**: Add to `server/.env`

#### Verify API Configuration

```bash
# Test API connection
curl -X GET "https://metals-api.com/api/latest?access_key=YOUR_KEY&base=USD&symbols=XAU,XAG"

# Expected response:
# {
#   "success": true,
#   "timestamp": 1706630400,
#   "base": "USD",
#   "rates": {
#     "XAU": 0.0004876,
#     "XAG": 0.0423729
#   }
# }
```

#### Fallback Configuration

If API is unavailable, ZakApp uses cached values:

```typescript
// server/src/config/nisab.ts
export const FALLBACK_NISAB = {
  goldPricePerGram: 65.00,    // USD per gram
  silverPricePerGram: 0.80,   // USD per gram
  lastUpdated: '2024-01-30'
};
```

**Warning**: Fallback values may be outdated. Always configure `METALS_API_KEY` for production.

### Background Jobs

Feature 008 introduces an hourly background job for Hawl detection.

#### Job Configuration

The job runs automatically every hour:

```typescript
// server/src/jobs/hawlDetection.ts
cron.schedule('0 * * * *', async () => {
  await detectHawlThresholdCrossing();
});
```

#### Verifying Job Execution

1. **Check logs**

   ```bash
   # Docker environment
   docker-compose -f docker-compose.prod.yml logs -f backend | grep "Hawl detection"
   
   # PM2 environment
   pm2 logs zakapp-backend | grep "Hawl detection"
   ```

2. **Expected log output**

   ```
   [2024-01-30 14:00:00] INFO: Hawl detection job started
   [2024-01-30 14:00:05] INFO: Checked 47 users, 3 new Hawl periods detected
   [2024-01-30 14:00:05] INFO: Hawl detection job completed successfully
   ```

3. **Manual trigger** (testing only)

   ```bash
   # Execute from server directory
   node -e "require('./dist/jobs/hawlDetection').detectHawlThresholdCrossing()"
   ```

### Rollback Procedures

If you need to rollback Feature 008:

#### Database Rollback

```bash
# From server directory
cd server

# Identify migration to rollback to
npx prisma migrate status

# Rollback to previous migration
npx prisma migrate resolve --rolled-back 20240130000000_add_nisab_year_records

# Apply previous schema (if backup available)
sqlite3 data/zakapp.db < backup-2024-01-29.sql
```

#### Application Rollback

```bash
# Git rollback
git log --oneline  # Find commit before Feature 008
git revert <commit-hash>

# Docker rollback
docker-compose -f docker-compose.prod.yml down
git checkout <previous-version-tag>
docker-compose -f docker-compose.prod.yml up -d --build

# PM2 rollback
pm2 stop zakapp-backend
git checkout <previous-version-tag>
npm install
npm run build
pm2 restart zakapp-backend
```

#### Environment Variable Cleanup

```bash
# Remove METALS_API_KEY from server/.env
sed -i '/METALS_API_KEY/d' server/.env

# Restart services
docker-compose -f docker-compose.prod.yml restart backend
# OR
pm2 restart zakapp-backend
```

### Post-Deployment Verification

After deploying Feature 008, verify all components:

#### 1. Database Schema

```bash
# Check tables exist
npx prisma db execute --stdin <<SQL
SELECT name FROM sqlite_master WHERE type='table' WHERE name LIKE 'Nisab%';
SQL

# Expected: NisabYearRecord
```

#### 2. API Endpoints

```bash
# Get nisab year records (requires authentication)
curl -X GET http://localhost:3000/api/nisab-year-records \
  -H "Authorization: Bearer <your-jwt-token>"

# Expected: 200 OK with JSON array
```

#### 3. Background Job

```bash
# Wait 5 minutes, then check logs
docker-compose -f docker-compose.prod.yml logs -f backend | grep "Hawl detection"

# Should see hourly execution logs
```

#### 4. Metals API Integration

```bash
# Check API connectivity from backend
docker-compose -f docker-compose.prod.yml exec backend \
  curl -X GET "https://metals-api.com/api/latest?access_key=${METALS_API_KEY}&base=USD&symbols=XAU,XAG"

# Expected: JSON response with gold/silver rates
```

#### 5. Frontend UI

1. Navigate to **http://your-domain.com** (or localhost:3001 for dev)
2. Login with test user
3. Navigate to **Nisab Year Records** page
4. Verify:
   - Records list loads
   - Status badges display correctly
   - Finalize/Unlock buttons work
   - Audit trail shows events

### Monitoring Recommendations

#### Application Logs

```bash
# Docker
docker-compose -f docker-compose.prod.yml logs -f --tail=100 backend

# PM2
pm2 logs zakapp-backend --lines 100
```

#### Database Growth

```bash
# Monitor database size
watch -n 60 'du -h data/zakapp.db'

# Check record counts
sqlite3 data/zakapp.db "SELECT COUNT(*) FROM NisabYearRecord;"
```

#### API Rate Limits

Monitor Metals API usage:

```bash
# Log API calls
grep "Fetching nisab threshold" /var/log/zakapp/backend.log | wc -l

# Alert if approaching limit (50/month on free tier)
```

#### Cron Job Health

```bash
# Verify hourly execution
grep "Hawl detection job" /var/log/zakapp/backend.log | tail -24

# Should show 24 entries in last 24 hours
```

### Backup Recommendations

#### Pre-Migration Backup

```bash
# Before running Prisma migrate
cp data/zakapp.db data/zakapp-pre-feature-008-$(date +%F).db
```

#### Automated Backups

Add to cron:

```bash
# Daily backup at 2 AM
0 2 * * * sqlite3 /path/to/zakapp.db ".backup '/backups/zakapp-$(date +\%F).db'" && find /backups -name "zakapp-*.db" -mtime +30 -delete
```

#### Backup Verification

```bash
# Test restore
sqlite3 /tmp/test-restore.db < backup-2024-01-30.db
sqlite3 /tmp/test-restore.db "SELECT COUNT(*) FROM NisabYearRecord;"
rm /tmp/test-restore.db
```

### Troubleshooting Feature 008

#### Issue: "METALS_API_KEY not configured"

**Symptoms**: Backend logs show warning messages about missing API key

**Solution**:

```bash
# Add to server/.env
echo "METALS_API_KEY=your_actual_key_here" >> server/.env

# Restart backend
docker-compose -f docker-compose.prod.yml restart backend
# OR
pm2 restart zakapp-backend
```

#### Issue: Migration fails with "table already exists"

**Symptoms**: `npx prisma migrate deploy` fails

**Solution**:

```bash
# Mark migration as resolved
npx prisma migrate resolve --applied 20240130000000_add_nisab_year_records

# Verify status
npx prisma migrate status
```

#### Issue: Hawl detection job not running

**Symptoms**: No log entries for hourly job execution

**Solution**:

```bash
# Check backend is running
docker-compose -f docker-compose.prod.yml ps backend
# OR
pm2 list

# Manually trigger job
node -e "require('./dist/jobs/hawlDetection').detectHawlThresholdCrossing()"

# Check for errors in logs
docker-compose -f docker-compose.prod.yml logs backend | grep -i error
```

#### Issue: API endpoints return 404

**Symptoms**: GET /api/nisab-year-records returns 404 Not Found

**Solution**:

```bash
# Verify route registration
grep "nisab-year-records" server/src/app.ts

# Check build output
ls -la server/dist/routes/nisabYearRecords.js

# Rebuild and restart
npm run build
docker-compose -f docker-compose.prod.yml restart backend
```

### Performance Considerations

#### Expected Resource Usage

- **Database growth**: ~1KB per Nisab Year Record
- **API calls**: 1 hourly call to Metals API
- **CPU**: Negligible impact (Hawl detection < 1% CPU spike)
- **Memory**: +10MB for cron job overhead

#### Optimization Tips

1. **Indexes**: Prisma automatically creates indexes on foreign keys
2. **Caching**: Nisab thresholds cached for 1 hour
3. **Batch processing**: Hawl detection processes users in batches of 100

### Security Considerations

#### API Key Protection

```bash
# Ensure .env is not committed
git ls-files | grep "\.env$"
# Should return nothing

# Verify .gitignore
grep "\.env" .gitignore
```

#### Encryption at Rest

All sensitive fields encrypted:

- `totalWealthAtCompletion` (AES-256-CBC)
- `notes` (AES-256-CBC)
- `unlockReason` (AES-256-CBC)

**Verify**:

```bash
# Check encrypted data in database
sqlite3 data/zakapp.db "SELECT totalWealthAtCompletion FROM NisabYearRecord LIMIT 1;"
# Should show encrypted string, not plaintext number
```

#### Access Control

- All endpoints require JWT authentication
- Users can only access their own records
- Finalized records require unlock with reason (audit trail)

### Compliance and Auditing

#### Audit Trail

All state transitions logged:

```typescript
// Example audit log
{
  eventType: 'FINALIZED',
  timestamp: '2024-01-30T10:30:00Z',
  userId: 'user-123',
  recordId: 'record-456',
  changes: {
    status: { from: 'DRAFT', to: 'FINALIZED' }
  }
}
```

**Query audit logs**:

```bash
sqlite3 data/zakapp.db "SELECT * FROM AuditLog WHERE tableName='NisabYearRecord' ORDER BY timestamp DESC LIMIT 10;"
```

#### Islamic Compliance

- Hawl period: 354 days (lunar year)
- Nisab thresholds: 87.48g gold, 612.36g silver
- Zakat rate: 2.5%
- Locked thresholds prevent manipulation

**Verify constants**:

```bash
grep -r "354\|87\.48\|612\.36\|0\.025" server/src/services/nisabYearRecordService.ts
```

---

## Troubleshooting

### Common Issues

**1. Container fails to start**

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs service-name

# Check container status
docker-compose -f docker-compose.prod.yml ps

# Restart specific service
docker-compose -f docker-compose.prod.yml restart service-name
```

**2. Permission issues with data directory**

```bash
# Fix ownership
sudo chown -R 1000:1000 data/

# Fix permissions
chmod -R 755 data/
```

**3. SSL certificate issues**

```bash
# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew
```

**4. Memory issues**

```bash
# Check memory usage
docker stats

# Increase swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Performance Optimization

1. **Enable Docker BuildKit**

   ```bash
   export DOCKER_BUILDKIT=1
   ```

2. **Optimize images**

   ```bash
   # Prune unused images
   docker image prune -a

   # Prune unused volumes
   docker volume prune
   ```

3. **Monitor resource usage**

   ```bash
   # Real-time monitoring
   docker stats

   # System monitoring
   htop
   iotop
   ```

### Security Hardening

1. **Regular updates**

   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade

   # Update Docker images
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Firewall configuration**

   ```bash
   # Enable UFW
   sudo ufw enable

   # Allow SSH
   sudo ufw allow ssh

   # Allow HTTP/HTTPS
   sudo ufw allow 80
   sudo ufw allow 443

   # Block direct access to application ports
   sudo ufw deny 3000
   sudo ufw deny 3001
   ```

3. **Fail2ban for additional protection**
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

This deployment guide provides comprehensive instructions for setting up zakapp in various environments with proper security, monitoring, and maintenance procedures.
