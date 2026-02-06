# ZakApp Quick Start Guide

Deploy ZakApp in 3 simple commands - no technical knowledge required!

## Prerequisites

- **Docker** installed on your computer
  - [Install Docker for Windows/Mac](https://docs.docker.com/get-docker/)
  - [Install Docker for Linux](https://docs.docker.com/engine/install/)

## Quick Deploy (3 Commands)

```bash
# 1. Clone the repository
git clone https://github.com/slimatic/zakapp.git && cd zakapp

# 2. Run the deployment script
./deploy.sh

# 3. Open your browser to:
http://localhost:3000
```

That's it! 🎉

## What the Script Does

The `deploy.sh` script automatically:
1. ✅ Checks that Docker is installed
2. ✅ Generates secure random secrets
3. ✅ Creates the configuration file (.env)
4. ✅ Builds and starts all services
5. ✅ Waits for everything to be ready

## Manual Deploy (If You Prefer)

If you prefer to do it manually:

```bash
# 1. Clone and enter directory
git clone https://github.com/slimatic/zakapp.git && cd zakapp

# 2. Copy and edit the configuration
cp .env.docker.example .env
# Edit .env and replace all REPLACE_* values with generated secrets

# 3. Deploy
docker compose -f docker-compose.local.yml up -d

# 4. Open http://localhost:3000
```

### Generating Secrets Manually

If editing .env manually, generate secrets with:

```bash
# Run this for each secret in .env:
openssl rand -base64 32

# For ENCRYPTION_KEY, use hex format:
openssl rand -hex 32
```

## Managing Your Deployment

### Start/Stop

```bash
# Start
docker compose -f docker-compose.local.yml up -d

# Stop
docker compose -f docker-compose.local.yml down

# Restart
docker compose -f docker-compose.local.yml restart
```

### View Logs

```bash
# All services
docker compose -f docker-compose.local.yml logs -f

# Just the backend
docker compose -f docker-compose.local.yml logs -f backend

# Just the frontend
docker compose -f docker-compose.local.yml logs -f frontend
```

### Update to Latest Version

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose -f docker-compose.local.yml down
docker compose -f docker-compose.local.yml up -d --build
```

## Troubleshooting

### "Cannot read properties of undefined (reading 'importKey')" Error

**Problem**: You see this error when trying to register or login via the UI.

**Cause**: Your browser is blocking the Web Crypto API because you're accessing the app via an IP address (like `192.168.x.x`) over HTTP instead of HTTPS.

Browsers require a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) for cryptographic operations:
- ✅ `http://localhost` - Secure (explicitly allowed)
- ✅ `http://127.0.0.1` - Secure (explicitly allowed)  
- ❌ `http://192.168.x.x` - **NOT secure** (blocked by browsers)
- ✅ `https://anything` - Secure (with valid certificate)

**Solutions** (choose one):

1. **Use localhost** (Easiest - same machine only):
   ```bash
   # Access via localhost instead of IP
   http://localhost:3005
   ```

2. **Set up HTTPS** with a reverse proxy:
   ```bash
   # Option A: Use Caddy (automatic HTTPS)
   docker run -d -p 80:80 -p 443:443 \
     -v /path/to/Caddyfile:/etc/caddy/Caddyfile \
     caddy:2
   
   # Option B: Use Cloudflare Tunnel (free, no open ports needed)
   # See: docs/guides/CLOUDFLARE_TUNNEL_SETUP.md
   ```

3. **Test the issue** with our diagnostic tool:
   ```bash
   # Run headless browser test
   ./test-crypto.sh http://your-ip:3005
   
   # Or open the test page in your browser:
   # http://your-ip:3005/crypto-test.html
   ```

### "CORS Error" or "Not allowed by CORS"

**Problem**: Browser blocks API requests with CORS errors.

**Fix**: Update your `.env` file with your actual IP/domain:
```bash
# Replace with your actual IP or domain
APP_URL=http://192.168.1.100:3005
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://192.168.1.100:3005
ALLOWED_HOSTS=localhost,192.168.1.100
```

Then restart: `docker compose -f docker-compose.local.yml restart`

### "Port already in use" Error

If you see an error like `port 3000 is already allocated`:

1. Edit your `.env` file
2. Change the ports:
   ```
   FRONTEND_PORT=3010
   BACKEND_PORT=3011
   ```
3. Restart: `docker compose -f docker-compose.local.yml up -d`

### "Permission denied" Error on deploy.sh

Run: `chmod +x deploy.sh`

### Can't Access the Website

1. Check if containers are running:
   ```bash
   docker compose -f docker-compose.local.yml ps
   ```

2. Check logs for errors:
   ```bash
   docker compose -f docker-compose.local.yml logs
   ```

3. Make sure ports 3000, 3001, and 5984 are not blocked by your firewall

### Forgot Admin Password

If you need to reset the admin password:

```bash
# Access the backend container
docker compose -f docker-compose.local.yml exec backend bash

# Generate new password hash (replace 'newpassword' with your password)
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('newpassword', 12).then(h => console.log(h))"

# Exit container and update database
docker compose -f docker-compose.local.yml exec backend npx prisma db execute --stdin <<< "UPDATE users SET passwordHash='<hash>' WHERE email='admin@example.com';"
```

## Next Steps

- **Configure Email**: Edit `.env` and add SMTP settings for password reset emails
- **Enable HTTPS**: For production, use a reverse proxy (nginx, Traefik) or Cloudflare Tunnel
- **Backup Data**: Regularly backup your data (see SELF-HOSTING.md)
- **Customize**: Change admin email, configure gold/silver price API, etc.

## Getting Help

- 📖 **Full Documentation**: See [SELF-HOSTING.md](SELF-HOSTING.md)
- 🐛 **Issues**: [github.com/slimatic/zakapp/issues](https://github.com/slimatic/zakapp/issues)
- 💬 **Discussions**: [github.com/slimatic/zakapp/discussions](https://github.com/slimatic/zakapp/discussions)

## Data Location

Your data is stored in Docker volumes:
- **Backend data**: SQLite database with user accounts
- **CouchDB data**: Sync data for multi-device support

To backup:
```bash
# Backup SQLite database
docker cp zakapp-backend-1:/app/server/prisma/data/prod.db ./backup-$(date +%F).db

# Backup CouchDB
docker exec zakapp-couchdb-1 tar -czf - /opt/couchdb/data > couchdb-backup-$(date +%F).tar.gz
```

---

**Happy Zakat calculating!** 🧮✨