# Cloudflare Tunnel Setup Guide for ZakApp

**Generated**: October 4, 2025  
**Status**: 🌐 CLOUDFLARE TUNNEL READY

---

## Overview

ZakApp works seamlessly with Cloudflare Tunnel (cloudflared) with minimal configuration changes. This guide covers everything you need to deploy ZakApp through Cloudflare's secure tunnel.

## Benefits of Cloudflare Tunnel

✅ **No exposed ports** - No need to open firewall ports or configure NAT  
✅ **Free SSL/TLS** - Automatic HTTPS with Cloudflare's certificate  
✅ **DDoS protection** - Built-in Cloudflare security  
✅ **Zero Trust** - Enhanced security with Cloudflare Access (optional)  
✅ **Easy setup** - No nginx/SSL configuration needed  
✅ **Works anywhere** - Behind NAT, home internet, etc.

---

## Prerequisites

- Cloudflare account (free tier works)
- Domain added to Cloudflare
- Server with Docker or cloudflared installed
- ZakApp repository cloned

---

## Quick Start

### 1. Install Cloudflare Tunnel

```bash
# Linux/Mac
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# Or using Homebrew (Mac)
brew install cloudflared

# Verify installation
cloudflared --version
```

### 2. Authenticate with Cloudflare

```bash
cloudflared tunnel login
```

This will open a browser window. Select your domain and authorize.

### 3. Create a Tunnel

```bash
# Create tunnel (choose a name)
cloudflared tunnel create zakapp

# Note the tunnel ID from the output
# Example: Created tunnel zakapp with id: 12345678-1234-1234-1234-123456789abc
```

### 4. Configure DNS

```bash
# Create DNS records for your tunnel
cloudflared tunnel route dns zakapp app.yourdomain.com
cloudflared tunnel route dns zakapp api.yourdomain.com
```

Or manually in Cloudflare Dashboard:
- Type: `CNAME`
- Name: `app` or `api`
- Target: `<TUNNEL_ID>.cfargotunnel.com`
- Proxy status: ✅ Proxied (orange cloud)

---

## Configuration Files

### 1. Cloudflare Tunnel Config

Create `~/.cloudflared/config.yml`:

```yaml
# Tunnel configuration
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/your-user/.cloudflared/YOUR_TUNNEL_ID.json

# Ingress rules - route traffic to your apps
ingress:
  # Frontend - React app
  - hostname: app.yourdomain.com
    service: http://localhost:3000
    originRequest:
      noTLSVerify: false
      connectTimeout: 30s
      keepAliveConnections: 10
      httpHostHeader: app.yourdomain.com
  
  # Backend API
  - hostname: api.yourdomain.com
    service: http://localhost:3002
    originRequest:
      noTLSVerify: false
      connectTimeout: 30s
      keepAliveConnections: 10
      httpHostHeader: api.yourdomain.com
  
  # Health check endpoint (optional)
  - hostname: health.yourdomain.com
    service: http://localhost:3002
    path: /health
  
  # Catch-all rule (required - must be last)
  - service: http_status:404

# Optional: Log configuration
loglevel: info
```

**Important Notes**:
- Replace `YOUR_TUNNEL_ID` with your actual tunnel ID
- Replace `yourdomain.com` with your actual domain
- The catch-all rule is required by cloudflared
- Keep ports 3000 (frontend) and 3002 (backend) for local binding

### 2. Backend Environment Variables

Update `server/.env` or `server/.env.production`:

```bash
# Environment
NODE_ENV=production

# Cloudflare domains
ALLOWED_ORIGINS=https://app.yourdomain.com,https://api.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# Ports (local binding - cloudflared will proxy to these)
PORT=3002
FRONTEND_PORT=3000

# Database
DATABASE_URL=postgresql://zakapp_user:your_password@localhost:5432/zakapp_production

# Security secrets (generate with scripts/production/generate-secrets.sh)
JWT_SECRET=your_generated_jwt_secret
JWT_REFRESH_SECRET=your_generated_refresh_secret
ENCRYPTION_KEY=your_generated_encryption_key
SESSION_SECRET=your_generated_session_secret

# Optional: Rate limiting adjustments
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional: Cloudflare specific
TRUST_PROXY=true
CF_CONNECTING_IP_HEADER=CF-Connecting-IP
```

### 3. Frontend Environment Variables

Update `client/.env.production`:

```bash
# For Create React App
REACT_APP_API_URL=https://api.yourdomain.com

# Or for Vite
VITE_API_URL=https://api.yourdomain.com
```

### 4. Trust Proxy Configuration

Ensure your Express app trusts the Cloudflare proxy. Add to `server/index.js` or `server/src/index.ts`:

```javascript
const express = require('express');
const app = express();

// Trust Cloudflare proxy
app.set('trust proxy', true);

// OR more restrictive (trust only Cloudflare)
app.set('trust proxy', function (ip) {
  // Cloudflare IP ranges (you can get full list from Cloudflare)
  // For simplicity, trust localhost and private IPs in development
  return ip === '127.0.0.1' || ip === '::1';
});
```

**Note**: The app already handles `X-Forwarded-*` headers in `SecurityMiddleware.ts`, so you're covered!

---

## Deployment Steps

### Option A: Manual Start (Testing)

```bash
# 1. Start your backend
cd /path/to/zakapp/server
npm run dev  # or npm start for production

# 2. Start your frontend (in another terminal)
cd /path/to/zakapp/client
npm start  # or serve -s build -l 3000 for production

# 3. Start cloudflared tunnel (in another terminal)
cloudflared tunnel run zakapp
```

Visit `https://app.yourdomain.com` - should work! 🎉

### Option B: PM2 + Cloudflared Service (Production)

#### 1. Start apps with PM2

```bash
# Use the existing ecosystem config
cd /path/to/zakapp
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Enable auto-start on boot
```

#### 2. Install cloudflared as a service

```bash
sudo cloudflared service install
```

This creates a systemd service at `/etc/systemd/system/cloudflared.service`.

#### 3. Start and enable the service

```bash
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
sudo systemctl status cloudflared
```

#### 4. Verify everything is running

```bash
# Check PM2 apps
pm2 status

# Check cloudflared
sudo systemctl status cloudflared

# Check logs
pm2 logs zakapp-backend --lines 50
pm2 logs zakapp-frontend --lines 50
sudo journalctl -u cloudflared -f
```

### Option C: Docker Compose + Cloudflared

Create `docker-compose.cloudflare.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - PORT=3002
      - DATABASE_URL=postgresql://zakapp_user:password@postgres:5432/zakapp
      - ALLOWED_ORIGINS=https://app.yourdomain.com,https://api.yourdomain.com
    env_file:
      - server/.env.production
    depends_on:
      - postgres
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: docker/Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=https://api.yourdomain.com
    restart: unless-stopped

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=zakapp
      - POSTGRES_USER=zakapp_user
      - POSTGRES_PASSWORD=your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel run zakapp
    volumes:
      - ~/.cloudflared:/etc/cloudflared
    restart: unless-stopped

volumes:
  postgres_data:
```

Start everything:

```bash
docker-compose -f docker-compose.cloudflare.yml up -d
```

---

## Security Considerations

### 1. CORS is Already Configured ✅

The app's `SecurityMiddleware.ts` already handles CORS properly:
- Validates origins from `ALLOWED_ORIGINS` env var
- Supports credentials (cookies, auth headers)
- Rejects unauthorized origins

Just add your Cloudflare domains to `ALLOWED_ORIGINS`.

### 2. Rate Limiting Works Through Cloudflare ✅

The app's built-in rate limiting will still work, but you get:
- **App-level limiting**: 100 requests per 15 minutes (configurable)
- **Cloudflare DDoS protection**: Automatic at network edge
- **Optional Cloudflare Rate Limiting**: Configure in dashboard for extra protection

### 3. IP Address Handling ✅

Cloudflare adds these headers:
- `CF-Connecting-IP`: Real client IP
- `X-Forwarded-For`: Client IP chain
- `X-Forwarded-Proto`: Original protocol (https)

Your app already handles these in `SecurityMiddleware.ts` when `trust proxy` is enabled.

### 4. Zero Trust (Optional)

Add an extra security layer with Cloudflare Access:

1. Go to Cloudflare Dashboard → Zero Trust → Access
2. Create an Application
3. Add authentication rules (email, SSO, etc.)
4. Apply to `app.yourdomain.com`

Now users must authenticate with Cloudflare before accessing your app!

---

## Monitoring & Troubleshooting

### Check Tunnel Status

```bash
# List all tunnels
cloudflared tunnel list

# Check tunnel info
cloudflared tunnel info zakapp

# Test connectivity
curl https://app.yourdomain.com/health
curl https://api.yourdomain.com/health
```

### View Logs

```bash
# Cloudflared logs (if running as service)
sudo journalctl -u cloudflared -f

# Cloudflared logs (if running manually)
cloudflared tunnel run zakapp --loglevel debug

# Application logs (PM2)
pm2 logs zakapp-backend --lines 100
pm2 logs zakapp-frontend --lines 100

# Application logs (Docker)
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Common Issues

#### Issue 1: "Origin not allowed by CORS policy"

**Solution**: Add your Cloudflare domain to `ALLOWED_ORIGINS`:

```bash
# In server/.env
ALLOWED_ORIGINS=https://app.yourdomain.com,https://api.yourdomain.com
```

Then restart the backend:

```bash
pm2 restart zakapp-backend
# or
docker-compose restart backend
```

#### Issue 2: Tunnel not connecting

**Solution**: Check credentials file exists:

```bash
ls -la ~/.cloudflared/
# Should see: config.yml and YOUR_TUNNEL_ID.json
```

Verify config:

```bash
cloudflared tunnel info zakapp
```

#### Issue 3: 502 Bad Gateway

**Solution**: Check if backend is running:

```bash
curl http://localhost:3002/health
# Should return: {"status":"ok"}

# If not running, start it:
pm2 start ecosystem.config.js --env production
# or
docker-compose up -d backend
```

#### Issue 4: Frontend 404 errors on refresh

**Solution**: Ensure your React app is built and served properly:

```bash
# Build frontend
cd client
npm run build

# Serve with correct routing
serve -s build -l 3000
# or use nginx with try_files (see PHASE2_PRODUCTION_SETUP_GUIDE.md)
```

---

## Performance Optimization

### 1. Enable Cloudflare Caching

In Cloudflare Dashboard → Caching:
- Set caching level to "Standard"
- Add Page Rules for static assets:
  - `app.yourdomain.com/static/*` → Cache Everything
  - `app.yourdomain.com/assets/*` → Cache Everything

### 2. Enable Cloudflare Argo

Speeds up tunnel routing:
- Go to Traffic → Argo
- Enable Argo Smart Routing (~$5/month for first 1GB)

### 3. Enable HTTP/3 (QUIC)

- Go to Network → HTTP/3
- Toggle ON

### 4. Optimize Cloudflared

In `config.yml`, add:

```yaml
# Performance tuning
originRequest:
  connectTimeout: 30s
  tlsTimeout: 10s
  tcpKeepAlive: 30s
  noHappyEyeballs: false
  keepAliveConnections: 100
  keepAliveTimeout: 90s
  httpHostHeader: app.yourdomain.com
  disableChunkedEncoding: false
```

---

## Cost Comparison

| Service | Traditional VPS | Cloudflare Tunnel |
|---------|----------------|-------------------|
| **Server** | $40-80/mo | $0-40/mo (home server or cheaper VPS) |
| **SSL** | $0 (Let's Encrypt) | $0 (included) |
| **DDoS Protection** | $10-50/mo | $0 (included) |
| **CDN** | $10-30/mo | $0 (included) |
| **Tunnel** | N/A | $0 (free) |
| **Optional Argo** | N/A | $5/mo + $0.10/GB |
| **Total** | $60-170/mo | $0-50/mo |

**Savings**: Up to $120/month! 💰

---

## Migration from Traditional Setup

If you're currently using nginx + Let's Encrypt:

1. **Keep everything running** while you test
2. **Set up Cloudflare Tunnel** following this guide
3. **Test both setups** side by side
4. **Update DNS** to point to Cloudflare when ready
5. **Decommission nginx/SSL** after testing

No downtime required! 🚀

---

## Additional Resources

- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Cloudflare Zero Trust](https://www.cloudflare.com/products/zero-trust/)
- [Cloudflare API](https://api.cloudflare.com/)

---

## Summary Checklist

Before going live:

- [ ] Cloudflare Tunnel created and configured
- [ ] DNS records created (app & api subdomains)
- [ ] `ALLOWED_ORIGINS` updated with Cloudflare domains
- [ ] `FRONTEND_URL` and `BACKEND_URL` set correctly
- [ ] Frontend rebuilt with production API URL
- [ ] Backend started with production environment
- [ ] `trust proxy` enabled in Express app
- [ ] Cloudflared service running and enabled
- [ ] Health checks passing (app + api)
- [ ] SSL working (https://app.yourdomain.com)
- [ ] Authentication working (login/register)
- [ ] CORS working (no console errors)
- [ ] Performance acceptable (test with hey or ab)

---

**Your ZakApp is now ready to run securely through Cloudflare Tunnel! 🌐🔒✨**

Questions? Issues? Check the troubleshooting section or open an issue on GitHub.
