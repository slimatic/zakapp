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
