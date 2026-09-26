# 🚀 ZakApp Easy Deployment - Quick Start

## What's New?

The new **Easy Deployment** system eliminates all friction points:

✅ **Prebuilt Docker Images** - No more 10+ minute builds  
✅ **Automatic HTTPS** - Works with IP addresses (self-signed certs)  
✅ **Port Auto-Detection** - Finds available ports automatically  
✅ **Auto-Generated Secrets** - No manual openssl commands  
✅ **Auto-Migrations** - Database setup happens automatically  
✅ **One Command** - `./deploy-easy.sh` and you're done  

## Prerequisites

Before running the deployment script, ensure you have:

### Required
- **Docker** (version 20.10 or higher)
- **Docker Compose** (V2 plugin)
- A server with at least 1GB RAM

### Installation Commands

**Ubuntu/Debian:**
```bash
# Install Docker
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin

# Start Docker daemon
sudo systemctl start docker

# Add user to docker group (optional, avoids sudo)
sudo usermod -aG docker $USER
```

**macOS:**
- Download and install [Docker Desktop](https://docs.docker.com/get-docker/)
- Start Docker Desktop from Applications

**Windows:**
- Download and install [Docker Desktop](https://docs.docker.com/get-docker/)
- Start Docker Desktop

### Verify Docker is Running
```bash
docker info
# Should show Docker version and active context

# If you get "permission denied", either:
# 1. Use sudo: sudo docker ps
# 2. Add your user to docker group: sudo usermod -aG docker $USER
```  

## Quick Start (3 Commands)

```bash
# 1. Clone the repository
git clone https://github.com/slimatic/zakapp.git && cd zakapp

# 2. Run the easy deployment script
./deploy-easy.sh

# 3. Access your application
# The script will show you the exact URL
```

That's it! 🎉

## After Deployment

### First Login

1. **Access ZakApp** using the URL shown by the script:
   - Localhost: `http://localhost:3000`
   - Network: `https://your-ip:3443`

2. **Accept the certificate warning** (if accessing via IP):
   - Click "Advanced" → "Proceed to [IP]" (Chrome/Edge)
   - Click "Show Details" → "Visit Website" (Safari)
   - Click "Accept the Risk" (Firefox)

3. **Create an account**:
   - Click "Create Account" or "Register"
   - Enter your email and password
   - The server stores credentials securely

### Verifying Your Deployment

```bash
# Check all services are running
docker compose ps

# EXPECTED OUTPUT:
# NAME                STATUS
# zakapp-backend-1   Up (healthy)
# zakapp-couchdb-1   Up (healthy)  
# zakapp-caddy-1     Up
# zakapp-frontend-1  Up

# All services should show "Up" status
# Backend and CouchDB should show "(healthy)"
```

### Testing the API

```bash
# Test API health endpoint
curl http://localhost:3000/api/auth/test

# Or test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","confirmPassword":"Test123!","firstName":"Test","lastName":"User"}'
```

## What the Script Does

1. ✅ Checks Docker is installed
2. ✅ Detects your server IP address
3. ✅ Asks how you want to access it (localhost/IP/domain)
4. ✅ Finds available ports (auto-fixes conflicts)
5. ✅ Generates all security secrets
6. ✅ Creates the configuration file
7. ✅ Pulls prebuilt images from Docker Hub
8. ✅ Starts all services
9. ✅ Runs database migrations automatically
10. ✅ Shows you the access URLs

## Access Methods

### Option 1: Localhost (Easiest)
```bash
./deploy-easy.sh
# Select option 1 (localhost)
# Access: http://localhost:3000
```
✅ No browser warnings  
✅ Fastest setup  
❌ Only works on this machine

### Option 2: IP Address (Network Access)
```bash
./deploy-easy.sh
# Select option 2 (IP address)
# Access: https://192.168.1.100:3443
```
✅ Access from any device on your network  
✅ Web Crypto API works (password encryption)  
⚠️ Browser shows "Not Secure" warning (expected with self-signed cert)  
👉 Click "Advanced" → "Proceed" to continue

### Option 3: Custom Domain
```bash
./deploy-easy.sh
# Select option 3 (domain)
# Enter: yourdomain.com
# Access: https://yourdomain.com
```
✅ Full HTTPS with Let's Encrypt  
✅ No browser warnings  
⚠️ Requires DNS configuration

## Managing Your Deployment

```bash
# View real-time logs (all services)
docker compose logs -f

# View logs for specific service
docker compose logs -f backend     # API logs
docker compose logs -f frontend     # Frontend logs
docker compose logs -f couchdb      # Database logs

# Stop all services (data preserved)
docker compose down

# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend

# Update to latest version
docker compose pull
docker compose up -d

# Full reset (DELETES ALL DATA - be careful!)
docker compose down -v
docker compose up -d
```

## Resetting Your Deployment

### Option 1: Quick Reset (Keeps Configuration)
```bash
docker compose down
docker compose up -d
```

### Option 2: Full Reset (Deletes All Data)
```bash
# WARNING: This will delete all users, assets, and transactions!
docker compose down -v
docker compose up -d
```

### Option 3: Fresh Start (New Configuration)
```bash
# Backup your .env file first!
cp .env .env.backup

# Remove and re-run deployment
rm .env
./deploy-easy.sh
```

## Troubleshooting

### Common Issues

#### "Docker daemon is not running"
```
❌ Docker daemon is not running
```
**Solution:**
```bash
# Ubuntu/Debian
sudo systemctl start docker

# macOS/Windows
# Start Docker Desktop from Applications
```

#### "Permission denied" errors
```
permission denied while trying to connect to the Docker daemon
```
**Solution:**
```bash
# Option 1: Use sudo (temporary)
sudo docker compose ps

# Option 2: Add user to docker group (permanent)
sudo usermod -aG docker $USER
# Then log out and log back in
```

#### "Port already in use"
The script automatically detects this and uses alternative ports. You'll see:
```
⚠️  Port 3000 is already in use
ℹ️  Using alternative port: 3005
```

#### Browser shows "Not Secure" warning
This is **expected and normal** when accessing via IP address. The connection is still encrypted, but the certificate is self-signed.

**Solution:** Click "Advanced" → "Proceed" to continue

**To eliminate the warning:**
- Use localhost access, OR
- Use a custom domain with Let's Encrypt

#### 500 Errors / CORS Issues
If you see 500 errors or CORS warnings in the browser console:

```bash
# Check backend logs
docker compose logs backend

# Restart backend with correct CORS settings
docker compose restart backend
```

#### Database migration errors
These are handled automatically, but if you see issues:
```bash
# Run migrations manually
docker compose run --rm migrations

# Check migration logs
docker compose logs migrations
```

#### Services not starting
```bash
# Check all logs
docker compose logs

# Check specific service
docker compose logs backend
docker compose logs couchdb

# Common issues:
# - Port conflicts: Check if other services use port 3000/3443/5984
# - Disk space: df -h
# - Memory: free -m
```

#### Frontend returns 404
The frontend is a SPA (Single Page Application). If you get 404 on direct routes:
```bash
# This is normal for SPA routing
# Access http://localhost:3000 instead
# The router handles navigation internally
```

### Getting Help

```bash
# Collect debug information
echo "=== Docker Version ===" && docker --version
echo "=== Docker Compose Version ===" && docker compose version
echo "=== Running Services ===" && docker compose ps
echo "=== Recent Logs ===" && docker compose logs --tail=20
```

## Comparison: Easy vs Traditional

| Feature | Easy Deployment | Traditional |
|---------|----------------|-------------|
| Setup Time | 2 minutes | 30+ minutes |
| Build Time | 0 (prebuilt images) | 10-15 minutes |
| HTTPS Setup | Automatic | Manual (NPM/Caddy) |
| Port Conflicts | Auto-resolved | Manual editing |
| Secret Generation | Automatic | Manual openssl |
| Migrations | Automatic | Manual command |
| Configuration | Interactive wizard | Edit .env file |

## Migration from Traditional Setup

If you're using the old `docker-compose.yml`:

```bash
# 1. Stop old deployment
docker compose -f docker-compose.yml down

# 2. Run easy deployment
./deploy-easy.sh

# 3. Your data is preserved in Docker volumes
#    and will be picked up automatically
```

## Advanced Configuration

The script creates a `.env` file. You can edit it later for advanced options:

```bash
# Edit configuration
nano .env

# Restart to apply changes
docker compose -f docker-compose.yml restart
```

See `.env.easy.example` for all available options.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  User Access                                            │
│  - http://localhost:3000 (HTTP)                        │
│  - https://192.168.x.x:3443 (HTTPS, self-signed)       │
│  - https://yourdomain.com (HTTPS, Let's Encrypt)       │
└─────────────────────────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │    Caddy    │  ← Reverse Proxy + Auto HTTPS
                    │   (Port 80  │
                    │    & 443)   │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼─────┐     ┌──────▼──────┐   ┌──────▼──────┐
   │ Frontend │     │   Backend   │   │   CouchDB   │
   │  (UI)    │     │    (API)    │   │   (Sync)    │
   └──────────┘     └─────────────┘   └─────────────┘
```

## Next Steps

- 📖 Read the full documentation: [SELF-HOSTING.md](SELF-HOSTING.md)
- 🐛 Report issues: https://github.com/slimatic/zakapp/issues
- 💬 Get help: https://github.com/slimatic/zakapp/discussions

## Feedback

Is this easier than the old setup? Let us know!

---

**Happy Zakat calculating!** 🧮✨