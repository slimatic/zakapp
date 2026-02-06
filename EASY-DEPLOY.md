# 🚀 ZakApp Easy Deployment - Quick Start

## What's New?

The new **Easy Deployment** system eliminates all friction points:

✅ **Prebuilt Docker Images** - No more 10+ minute builds  
✅ **Automatic HTTPS** - Works with IP addresses (self-signed certs)  
✅ **Port Auto-Detection** - Finds available ports automatically  
✅ **Auto-Generated Secrets** - No manual openssl commands  
✅ **Auto-Migrations** - Database setup happens automatically  
✅ **One Command** - `./deploy-easy.sh` and you're done  

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
# View logs
docker compose logs -f

# Stop
docker compose down

# Restart
docker compose restart

# Update to latest version
docker compose pull
docker compose up -d
```

## Troubleshooting

### "Permission denied" on deploy-easy.sh
```bash
chmod +x deploy-easy.sh
```

### Port already in use
The script automatically detects this and uses alternative ports. You'll see:
```
⚠️  Port 3000 is already in use
ℹ️  Using alternative port: 3005
```

### Browser shows "Not Secure" warning
This is **expected and normal** when accessing via IP address. The connection is still encrypted, but the certificate is self-signed. Click "Advanced" → "Proceed" to continue.

To eliminate the warning, use:
- localhost access, OR
- a custom domain with Let's Encrypt

### Database migration errors
These are handled automatically, but if you see issues:
```bash
docker compose run --rm migrations
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

If you're using the old `docker-compose.local.yml`:

```bash
# 1. Stop old deployment
docker compose -f docker-compose.local.yml down

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