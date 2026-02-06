# ZakApp with Nginx Proxy Manager

Nginx Proxy Manager (NPM) is the easiest way to add HTTPS to ZakApp and fix the Web Crypto API issues.

## Why Use NPM?

- ✅ **Automatic HTTPS** via Let's Encrypt
- ✅ **Web-based UI** - no command line needed
- ✅ **Fixes Web Crypto API** - browsers allow crypto over HTTPS
- ✅ **Custom domains** - use your own domain or subdomain

## Prerequisites

1. Nginx Proxy Manager running on your network
2. A domain or subdomain pointing to your NPM instance
   - Option A: Own domain with DNS A record
   - Option B: Free subdomain (duckdns.org, nip.io, etc.)
   - Option C: Local DNS (Pi-hole, router DNS, etc.)

## Quick Setup

### Step 1: Configure ZakApp for NPM

Edit your `.env` file:

```bash
# Your domain (example: zakapp.yourdomain.com)
APP_URL=https://zakapp.yourdomain.com

# API URLs (NPM will proxy these)
REACT_APP_API_BASE_URL=https://zakapp.yourdomain.com/api
REACT_APP_COUCHDB_URL=https://zakapp.yourdomain.com:5984

# CORS - add your domain
ALLOWED_ORIGINS=https://zakapp.yourdomain.com,http://localhost:3000
ALLOWED_HOSTS=zakapp.yourdomain.com,localhost

# Internal URLs (Docker network)
COUCHDB_URL=http://couchdb:5984
```

Restart ZakApp:
```bash
docker compose -f docker-compose.local.yml restart
```

### Step 2: Add Proxy Host in NPM

1. Open Nginx Proxy Manager UI (usually `http://npm-server:81`)
2. Go to **Proxy Hosts** → **Add Proxy Host**

**Details Tab:**
- **Domain Names**: `zakapp.yourdomain.com`
- **Scheme**: `http`
- **Forward Hostname/IP**: `<your-server-ip>` or `host.docker.internal` (if NPM and ZakApp on same server)
- **Forward Port**: `3005` (or whatever FRONTEND_PORT you set)

**Custom Locations** (for API and CouchDB):

Add these custom locations:

**Location: `/api`**
```
proxy_pass http://<your-server-ip>:3001/api;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

**Location: `/_utils`** (CouchDB Fauxton)
```
proxy_pass http://<your-server-ip>:5984/_utils;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
```

**SSL Tab:**
- **SSL Certificate**: Request a new SSL certificate
- ☑️ Force SSL
- ☑️ HTTP/2 Support
- ☑️ HSTS Enabled

**Advanced Tab:**
Add these custom nginx config lines for WebSocket support (needed for CouchDB sync):
```nginx
# WebSocket support for CouchDB
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";

# Increase timeout for sync operations
proxy_read_timeout 86400;
```

3. **Save**

### Step 3: Test

1. Wait for SSL certificate to be issued (30-60 seconds)
2. Open: `https://zakapp.yourdomain.com`
3. Try registering - it should work now! 🎉

## Alternative: Separate Subdomains

If you prefer separate subdomains for each service:

### Frontend: `app.yourdomain.com`
- Forward to: `<your-server-ip>:3005`
- SSL: Let's Encrypt

### API: `api.yourdomain.com`  
- Forward to: `<your-server-ip>:3001`
- SSL: Let's Encrypt
- Custom nginx config:
```nginx
location / {
    proxy_pass http://<your-server-ip>:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### CouchDB: `sync.yourdomain.com`
- Forward to: `<your-server-ip>:5984`
- SSL: Let's Encrypt
- Custom nginx config for WebSockets:
```nginx
location / {
    proxy_pass http://<your-server-ip>:5984;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
}
```

Update `.env`:
```bash
APP_URL=https://app.yourdomain.com
REACT_APP_API_BASE_URL=https://api.yourdomain.com/api
REACT_APP_COUCHDB_URL=https://sync.yourdomain.com
ALLOWED_ORIGINS=https://app.yourdomain.com,https://api.yourdomain.com,https://sync.yourdomain.com
```

## Free Domain Options

Don't have a domain? Use these free options:

### Option 1: DuckDNS (Recommended)
1. Sign up at https://www.duckdns.org/
2. Create a subdomain (e.g., `yourname.duckdns.org`)
3. Point it to your public IP
4. Use in NPM: `zakapp-yourname.duckdns.org`

### Option 2: nip.io (No setup needed!)
If your IP is `192.168.86.45`:
- Use domain: `zakapp.192.168.86.45.nip.io`
- NPM will resolve this automatically
- Works for local testing only (not externally accessible)

### Option 3: Local DNS
If you have Pi-hole or AdGuard Home:
1. Add local DNS record: `zakapp.local` → `192.168.86.45`
2. Use `zakapp.local` in NPM
3. Generate self-signed certificate or use DNS challenge

## Troubleshooting

### "Bad Gateway" Error
- Check ZakApp is running: `docker compose -f docker-compose.local.yml ps`
- Verify IP address in NPM matches your ZakApp server
- Make sure ports 3005, 3001, 5984 are accessible from NPM

### SSL Certificate Issues
- Ensure port 80 is forwarded to NPM for ACME challenge
- Check domain DNS points to NPM's public IP
- Try "Use a DNS Challenge" instead of HTTP challenge

### CORS Errors Still Appear
Update `.env` with your exact domain:
```bash
ALLOWED_ORIGINS=https://zakapp.yourdomain.com
ALLOWED_HOSTS=zakapp.yourdomain.com
APP_URL=https://zakapp.yourdomain.com
```
Restart ZakApp after changes.

### CouchDB Sync Not Working
Ensure WebSocket support is enabled in NPM Advanced tab:
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

## Docker Compose with NPM Network

If NPM is running in Docker on the same host:

```yaml
# Add to docker-compose.local.yml
services:
  frontend:
    # ... existing config
    networks:
      - zakapp
      - npm-network  # Connect to NPM network

  backend:
    # ... existing config
    networks:
      - zakapp
      - npm-network

  couchdb:
    # ... existing config
    networks:
      - zakapp
      - npm-network

networks:
  zakapp:
    driver: bridge
  npm-network:
    external: true  # Use existing NPM network
```

Create the network:
```bash
docker network create npm-network
```

Then in NPM, use container names as forward hostnames:
- Forward to: `frontend` (instead of IP)
- Port: `80`

## Security Best Practices

1. **Enable HSTS** in NPM SSL settings
2. **Force SSL** - redirect HTTP to HTTPS
3. **Block common exploits** - enable in NPM Advanced tab
4. **Use strong passwords** for ZakApp admin accounts
5. **Keep NPM updated** - `docker pull jc21/nginx-proxy-manager:latest`

## Migration from HTTP to HTTPS

If you have existing data:

1. Set up NPM with HTTPS
2. Update `.env` with new HTTPS URLs
3. Restart ZakApp
4. Existing data remains intact (stored in Docker volumes)
5. Users will need to re-login (tokens are invalidated)

---

**Questions?** Open an issue at https://github.com/slimatic/zakapp/issues