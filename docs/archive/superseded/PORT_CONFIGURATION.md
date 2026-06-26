# Port Configuration Guide

## Overview

ZakApp now supports **fully configurable ports** for all services (Frontend, Backend, CouchDB) to enable flexible deployment scenarios including:

- Cloudflare Tunnel
- Custom port assignments
- Multiple instances on the same host
- Production deployments with non-standard ports

## Environment Variables

### Port Configuration Matrix

| Service | External Port Variable | Internal Port Variable | Default External | Default Internal |
|---------|----------------------|----------------------|-----------------|------------------|
| **Frontend** | `FRONTEND_PORT` | `FRONTEND_INTERNAL_PORT` | 3000 | 3000 |
| **Backend** | `BACKEND_PORT` | `BACKEND_INTERNAL_PORT` | 3001 | 3001 |
| **CouchDB** | `COUCHDB_PORT` | `COUCHDB_INTERNAL_PORT` | 5984 | 5984 |

### What's the Difference?

- **External Port**: The port exposed on your **host machine** (what you access from your browser)
- **Internal Port**: The port the service **listens on inside the container**

**Example**:
```bash
FRONTEND_PORT=8080          # Access via http://localhost:8080
FRONTEND_INTERNAL_PORT=3000 # Container listens on port 3000 internally
```

Docker maps: `8080 (host) → 3000 (container)`

## Common Use Cases

### Use Case 1: Default Configuration (No Changes Needed)

**Scenario**: Standard development setup

**Configuration**: None required (uses defaults)

```bash
# No .env needed, defaults to:
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# CouchDB: http://localhost:5984
```

### Use Case 2: Cloudflare Tunnel Deployment

**Scenario**: Deploy behind Cloudflare Tunnel with custom ports

**File**: `.env` or `.env.production`

```bash
# External ports (what Cloudflare Tunnel connects to)
FRONTEND_PORT=8080
BACKEND_PORT=8081
COUCHDB_PORT=8082

# Internal ports (keep defaults for simplicity)
# FRONTEND_INTERNAL_PORT=3000  # Optional, defaults to 3000
# BACKEND_INTERNAL_PORT=3001   # Optional, defaults to 3001
# COUCHDB_INTERNAL_PORT=5984   # Optional, defaults to 5984

# Cloudflare Tunnel config
HOST_IP=localhost
ALLOWED_ORIGINS=https://app.example.com,https://staging.example.com
```

**Cloudflare Tunnel Configuration**:
```yaml
# cloudflared-config.yml
ingress:
  - hostname: app.example.com
    service: http://localhost:8080     # Maps to FRONTEND_PORT
    
  - hostname: api.example.com
    service: http://localhost:8081     # Maps to BACKEND_PORT
    
  - hostname: db.example.com
    service: http://localhost:8082     # Maps to COUCHDB_PORT
```

### Use Case 3: Avoiding Port Conflicts

**Scenario**: Another app is using port 3000

**File**: `.env`

```bash
# Shift all ports by 10
FRONTEND_PORT=3010
BACKEND_PORT=3011
COUCHDB_PORT=5994

# Keep internal ports default (optional)
# Containers still listen on 3000, 3001, 5984 internally
```

Access:
- Frontend: http://localhost:3010
- Backend: http://localhost:3011
- CouchDB: http://localhost:5994

### Use Case 4: Running Multiple Instances

**Scenario**: Run dev and staging environments simultaneously

**File**: `.env.dev`
```bash
COMPOSE_PROJECT_NAME=zakapp-dev
FRONTEND_PORT=3000
BACKEND_PORT=3001
COUCHDB_PORT=5984
```

**File**: `.env.staging`
```bash
COMPOSE_PROJECT_NAME=zakapp-staging
FRONTEND_PORT=4000
BACKEND_PORT=4001
COUCHDB_PORT=6984
```

**Run**:
```bash
# Dev instance
docker-compose --env-file .env.dev up -d

# Staging instance (different ports, no conflicts)
docker-compose --env-file .env.staging up -d
```

### Use Case 5: Security Hardening (Non-Standard Internal Ports)

**Scenario**: Change internal ports for security obfuscation

**File**: `.env.production`

```bash
# External ports
FRONTEND_PORT=443   # Behind reverse proxy/load balancer
BACKEND_PORT=443
COUCHDB_PORT=443

# Internal ports (non-standard for security)
FRONTEND_INTERNAL_PORT=8443
BACKEND_INTERNAL_PORT=9443
COUCHDB_INTERNAL_PORT=7984

# The frontend will listen on 8443 inside its container
# The backend will listen on 9443 inside its container
# CouchDB will listen on 7984 inside its container
```

**Result**: Even if an attacker gains container access, they won't find services on standard ports.

## Configuration Validation

### Verify Port Configuration

```bash
# Check what ports Docker is actually using
docker-compose ps

# Check if ports are accessible
curl http://localhost:${FRONTEND_PORT:-3000}      # Frontend
curl http://localhost:${BACKEND_PORT:-3001}/health # Backend
curl http://localhost:${COUCHDB_PORT:-5984}       # CouchDB
```

### Common Mistakes

❌ **Mistake 1**: Setting only external port, forgetting internal apps won't listen there

```bash
# WRONG - Frontend container listens on 3000, but you expose 8080
FRONTEND_PORT=8080
# Missing: FRONTEND_INTERNAL_PORT=8080
```

**Fix**:
```bash
FRONTEND_PORT=8080
FRONTEND_INTERNAL_PORT=8080  # Now Vite listens on 8080 inside container
```

❌ **Mistake 2**: Port conflicts between services

```bash
# WRONG - Backend and Frontend both try to use 8080
FRONTEND_PORT=8080
BACKEND_PORT=8080  # Conflict!
```

**Fix**: Use unique ports for each service

❌ **Mistake 3**: Forgetting to update ALLOWED_ORIGINS for CORS

```bash
# WRONG - CORS will block requests
FRONTEND_PORT=8080
# Missing: ALLOWED_ORIGINS needs http://localhost:8080
```

**Fix**:
```bash
FRONTEND_PORT=8080
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

## Environment Variable Priority

The system resolves configuration in this order:

1. **`.env.local`** (highest priority, gitignored)
2. **`.env.production`** / `.env.staging` (if specified via `--env-file`)
3. **`.env`** (checked into git, defaults)
4. **Hardcoded defaults in docker-compose.yml** (lowest priority)

## Advanced: Dynamic Port Allocation

For CI/CD pipelines that need dynamic ports:

```bash
# Generate random available ports
export FRONTEND_PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("", 0)); print(s.getsockname()[1]); s.close()')
export BACKEND_PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("", 0)); print(s.getsockname()[1]); s.close()')
export COUCHDB_PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("", 0)); print(s.getsockname()[1]); s.close()')

docker-compose up -d
echo "Frontend: http://localhost:$FRONTEND_PORT"
echo "Backend: http://localhost:$BACKEND_PORT"
echo "CouchDB: http://localhost:$COUCHDB_PORT"
```

## Troubleshooting

### "Port already in use" error

**Error**:
```
Error starting userland proxy: listen tcp4 0.0.0.0:3000: bind: address already in use
```

**Solution**:
1. Find what's using the port: `lsof -i :3000`
2. Either stop that process or change your `FRONTEND_PORT`

### "Connection refused" when accessing app

**Check**:
```bash
# Verify container is listening on the internal port
docker exec zakapp-frontend-1 netstat -tuln | grep 3000

# If not, check logs
docker logs zakapp-frontend-1
```

**Common Cause**: `VITE_PORT` or `PORT` environment variable not set correctly

### CORS errors after changing ports

**Solution**: Update `ALLOWED_ORIGINS` to include new port

```bash
# In .env
FRONTEND_PORT=8080
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080,http://192.168.1.x:8080
```

## Complete Example: Production Cloudflare Setup

**File**: `.env.production`

```bash
# ========================================
# ZakApp Production Configuration
# Cloudflare Tunnel Deployment
# ========================================

# Project
COMPOSE_PROJECT_NAME=zakapp-production
NODE_ENV=production

# Port Configuration
# External ports (Cloudflare Tunnel connects here)
FRONTEND_PORT=8080
BACKEND_PORT=8081
COUCHDB_PORT=8082

# Internal ports (keep defaults for consistency)
FRONTEND_INTERNAL_PORT=3000
BACKEND_INTERNAL_PORT=3001
COUCHDB_INTERNAL_PORT=5984

# Network Configuration
HOST_IP=localhost  # Stays localhost since Tunnel is local

# CORS Configuration
ALLOWED_ORIGINS=https://app.zakapp.com,https://api.zakapp.com,https://db.zakapp.com

# CouchDB
COUCHDB_USER=admin
COUCHDB_PASSWORD=<strong-password>
COUCHDB_JWT_SECRET=<jwt-secret-base64>
REACT_APP_COUCHDB_URL=https://db.zakapp.com

# API
REACT_APP_API_BASE_URL=https://api.zakapp.com/api

# Features
REACT_APP_FEEDBACK_ENABLED=true
REACT_APP_FEEDBACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
```

**Run**:
```bash
docker-compose --env-file .env.production up -d
```

**Cloudflare Tunnel**:
```yaml
# ~/.cloudflared/config.yml
tunnel: your-tunnel-uuid
credentials-file: ~/.cloudflared/credentials.json

ingress:
  - hostname: app.zakapp.com
    service: http://localhost:8080
  - hostname: api.zakapp.com
    service: http://localhost:8081
  - hostname: db.zakapp.com
    service: http://localhost:8082
  - service: http_status:404
```

## Architecture Notes

**Why Two Port Variables?**

Docker port mapping syntax is `HOST_PORT:CONTAINER_PORT`. We need to control **both**:

- **Container Port** (`INTERNAL_PORT`): What the app listens on inside Docker
- **Host Port** (`PORT`): What's exposed on your machine

This allows scenarios like:
- Container listens on 3000, exposed as 8080 on host
- Run multiple containers of the same app (different external ports, same internal)
- Security: Obscure internal ports from default values

**When to Change Internal Ports?**

✅ **Change**: Production deployments with hardening requirements  
✅ **Change**: Running apps that conflict on standard internal ports  
❌ **Keep Default**: Development (simplicity)  
❌ **Keep Default**: Cloudflare Tunnel (tunnel doesn't care about internal)

---

**Security Reminder**: Never commit `.env.production` or `.env.local` with real credentials to git. These files are in `.gitignore` by default.
