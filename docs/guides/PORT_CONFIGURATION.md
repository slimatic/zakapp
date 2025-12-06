# Port Configuration Guide

## Overview

ZakApp uses two main ports:
- **Frontend**: Default `3000`
- **Backend**: Default `3001`

Both ports are fully configurable and can be changed without breaking the application.

## Quick Port Change

### Method 1: Edit `.env.docker` (Recommended)

1. Open `.env.docker` in the root directory
2. Change the port values:
   ```bash
   FRONTEND_PORT=3010
   BACKEND_PORT=3011
   ```
3. Restart Docker services:
   ```bash
   docker compose down
   docker compose up -d
   ```

### Method 2: Environment Variables

Set the ports when starting:
```bash
FRONTEND_PORT=3010 BACKEND_PORT=3011 docker compose up -d
```

## Port Configuration Files

### `.env.docker`
The main configuration file for Docker deployments:
```bash
# Port Configuration
FRONTEND_PORT=3000
BACKEND_PORT=3001
```

### `docker-compose.yml`
Automatically reads ports from `.env.docker`:
```yaml
services:
  frontend:
    ports:
      - '${FRONTEND_PORT:-3000}:3000'
  backend:
    ports:
      - '${BACKEND_PORT:-3001}:3001'
```

## How It Works

1. **Port Mapping**: Docker maps host ports to container ports
   - `${FRONTEND_PORT:-3000}:3000` means "map host's FRONTEND_PORT (default 3000) to container's 3000"
   - `${BACKEND_PORT:-3001}:3001` means "map host's BACKEND_PORT (default 3001) to container's 3001"

2. **API URL Configuration**: Frontend automatically connects to backend
   - Configured in `docker-compose.yml`: `REACT_APP_API_BASE_URL=http://${HOST_IP:-localhost}:${BACKEND_PORT:-3001}/api`
   - Updates automatically when `BACKEND_PORT` changes

3. **CORS Configuration**: Backend automatically allows frontend's port
   - Configured in `docker-compose.yml`: `ALLOWED_ORIGINS=http://localhost:${FRONTEND_PORT:-3000},...`
   - Updates automatically when `FRONTEND_PORT` changes

## Troubleshooting

### "Port already in use" Error

If you see this error:
```
Error response from daemon: Ports are not available: exposing port TCP 0.0.0.0:3000 -> 0.0.0.0:0: listen tcp 0.0.0.0:3000: bind: address already in use
```

**Solution:**

1. Find what's using the port:
   ```bash
   # On Linux/Mac:
   lsof -i :3000
   
   # On Windows:
   netstat -ano | findstr :3000
   ```

2. Either:
   - Stop the conflicting process, OR
   - Change ZakApp's port in `.env.docker`

### Frontend Can't Connect to Backend

If the frontend shows "Failed to fetch" errors:

1. **Check backend port in `.env.docker`**:
   ```bash
   BACKEND_PORT=3001
   ```

2. **Verify docker-compose generated the correct URL**:
   ```bash
   docker compose config | grep REACT_APP_API_BASE_URL
   ```
   Should show: `REACT_APP_API_BASE_URL=http://localhost:3001/api`

3. **Restart services**:
   ```bash
   docker compose down
   docker compose up -d
   ```

### Check Current Configuration

View the active port configuration:
```bash
# See all environment variables
docker compose config

# See specific ports
grep -E "(FRONTEND_PORT|BACKEND_PORT)" .env.docker
```

## Examples

### Example 1: Change Both Ports

```bash
# Edit .env.docker
FRONTEND_PORT=8080
BACKEND_PORT=8081

# Restart
docker compose down && docker compose up -d

# Access:
# - Frontend: http://localhost:8080
# - Backend: http://localhost:8081
```

### Example 2: Only Change Frontend Port

```bash
# Edit .env.docker
FRONTEND_PORT=3010
BACKEND_PORT=3001  # Keep default

# Restart
docker compose down && docker compose up -d

# Access:
# - Frontend: http://localhost:3010
# - Backend: http://localhost:3001
```

### Example 3: Use High Ports (>1024)

```bash
# Edit .env.docker
FRONTEND_PORT=8000
BACKEND_PORT=8001

# Restart
docker compose down && docker compose up -d

# Access:
# - Frontend: http://localhost:8000
# - Backend: http://localhost:8001
```

## Network Access (Mobile/Other Devices)

To access from other devices on your network:

1. Get your IP address:
   ```bash
   # Linux/Mac:
   ip addr show | grep "inet "
   
   # Windows:
   ipconfig
   ```

2. Access using your IP:
   ```
   http://192.168.1.100:3000  # Replace with your IP and port
   ```

The application automatically configures CORS for your local IP.

## Production Deployment

For production, use a reverse proxy (nginx, Caddy) to:
- Use standard ports (80/443)
- Handle SSL/TLS termination
- Route traffic to your configured ports

Example nginx configuration:
```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://localhost:3000;  # Your FRONTEND_PORT
    }

    location /api {
        proxy_pass http://localhost:3001;  # Your BACKEND_PORT
    }
}
```

## Advanced: Per-Environment Ports

For multiple environments (dev, staging, prod), create separate env files:

```bash
# .env.docker.dev
FRONTEND_PORT=3000
BACKEND_PORT=3001

# .env.docker.staging
FRONTEND_PORT=4000
BACKEND_PORT=4001

# .env.docker.prod
FRONTEND_PORT=5000
BACKEND_PORT=5001
```

Switch between them:
```bash
cp .env.docker.staging .env.docker
docker compose down && docker compose up -d
```

## Summary

✅ **Fully Configurable**: Change ports in one place (`.env.docker`)
✅ **No Code Changes**: Everything updates automatically
✅ **Default Values**: Falls back to 3000/3001 if not configured
✅ **CORS Handled**: Backend automatically allows the configured frontend port
✅ **API URL Automatic**: Frontend automatically connects to configured backend port

For questions or issues, see: `docs/guides/PORT_CONFIGURATION_GUIDE.md`
