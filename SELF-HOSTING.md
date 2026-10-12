# Self-Hosting ZakApp 🏠

The definitive guide to running ZakApp on your own server.

## 📋 Prerequisites

- **Docker** &amp; Docker Compose installed
- **Domain name** (optional, but recommended for HTTPS)
- **10 minutes** of your time

## ⚡ Quick Start (3 Commands)

```bash
# 1. Clone
git clone https://github.com/slimatic/zakapp.git && cd zakapp

# 2. Configure (edit the file after copying)
cp .env.example .env && nano .env

# 3. Launch
docker-compose up -d
```

Visit `http://localhost:3000` — you're done! 🎉

---

## 📝 Configuration

### Required: Generate Secrets

Before editing `.env`, generate your secrets:

```bash
# Run this and copy the output to your .env file
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
echo "REFRESH_SECRET=$(openssl rand -base64 32)"
echo "ENCRYPTION_KEY=$(openssl rand -hex 16)"
echo "APP_SECRET=$(openssl rand -base64 32)"
echo "COUCHDB_PASSWORD=$(openssl rand -base64 16)"
echo "COUCHDB_JWT_SECRET=$(openssl rand -base64 32)"
```

### Essential `.env` Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | ✅ | User authentication token signing |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token signing |
| `ENCRYPTION_KEY` | ✅ | Encrypts sensitive user data (32 hex chars) |
| `COUCHDB_PASSWORD` | ✅ | CouchDB admin password |
| `COUCHDB_JWT_SECRET` | ✅ | CouchDB JWT authentication |
| `ADMIN_EMAILS` | ✅ | Comma-separated admin email addresses |
| `APP_URL` | ⚠️ | Your public URL (for email links) |

### Optional: Email Configuration

Choose ONE method:

**Option A: SMTP (Recommended)**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

**Option B: Resend API**
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### Optional: Gold/Silver Prices

For automatic Nisab calculations:
```bash
# Get free API key from https://www.goldapi.io/
GOLD_API_KEY=goldapi-xxxxx

# Or set manual fallback prices (USD per gram)
MANUAL_GOLD_PRICE_USD=65.00
MANUAL_SILVER_PRICE_USD=0.80
```

### Optional: Push Notifications (VAPID)

Web-push reminders (Zakat due dates) need a VAPID keypair on the server. Without them the
Notifications toggle reports *"Push notifications are not configured on this server."*

```bash
# Generate once, keep the pair together:
npx web-push generate-vapid-keys

VAPID_PUBLIC_KEY=<public key>
VAPID_PRIVATE_KEY=<private key>
VAPID_SUBJECT=mailto:you@yourdomain.com
```

After adding them, recreate the backend (`docker compose up -d --force-recreate backend`)
and verify:

```bash
curl https://zakapp.example.org/api/push/vapid-key
# Expect: {"publicKey":"<key>","configured":true}
```

---

## 🌐 Production Deployment

### Option 1: Cloudflare Tunnel (Recommended)

The easiest way to expose your self-hosted ZakApp securely:

```bash
# Install cloudflared
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# Login and create tunnel
cloudflared tunnel login
cloudflared tunnel create zakapp

# Route DNS
cloudflared tunnel route dns zakapp app.yourdomain.com

# Create config
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: YOUR_TUNNEL_ID
credentials-file: ~/.cloudflared/YOUR_TUNNEL_ID.json
ingress:
  - hostname: app.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
EOF

# Run tunnel
cloudflared tunnel run zakapp
```

Update your `.env`:
```bash
APP_URL=https://app.yourdomain.com
REACT_APP_API_BASE_URL=/api
ALLOWED_ORIGINS=https://app.yourdomain.com
NODE_ENV=production
```

See [docs/guides/CLOUDFLARE_TUNNEL_SETUP.md](docs/guides/CLOUDFLARE_TUNNEL_SETUP.md) for the complete guide.

### Option 2: Traditional Reverse Proxy (Nginx)

If you have a VPS with public IP:

1. Install Nginx and Certbot
2. Point your domain to your server
3. Configure Nginx (see [docs/deployment-guide.md](docs/deployment-guide.md#reverse-proxy-with-nginx))
4. Run `certbot --nginx` for SSL

---

## 🔧 Operations

### View Logs
```bash
docker-compose logs -f
```

### Update to Latest Version
```bash
git pull
docker-compose down
docker-compose up -d --build
docker-compose exec backend npx prisma migrate deploy
```

### Backup Data
```bash
# SQLite database
docker cp zakapp-backend:/app/server/prisma/data/prod.db ./backup-$(date +%F).db

# CouchDB (sync data)
docker exec zakapp-couchdb tar -czf - /opt/couchdb/data > couchdb-backup-$(date +%F).tar.gz
```

### Restore Data
```bash
docker cp ./backup.db zakapp-backend:/app/server/prisma/data/prod.db
docker-compose restart backend
```

---

## 🔒 Security Checklist

- [ ] All secrets in `.env` are randomly generated (never use defaults)
- [ ] `.env` file is NOT committed to git
- [ ] File permissions: `chmod 600 .env`
- [ ] CouchDB is not exposed to the internet (only through app)
- [ ] Admin emails are correctly configured
- [ ] Using HTTPS in production (Cloudflare Tunnel or Let's Encrypt)

---

## 📊 Resource Limits

Default limits for new users (adjustable in `.env`):

| Resource | Default | Env Variable |
|----------|---------|--------------|
| Assets | 20 | `DEFAULT_MAX_ASSETS` |
| Nisab Records | 3 | `DEFAULT_MAX_NISAB_RECORDS` |
| Payments | 25 | `DEFAULT_MAX_PAYMENTS` |
| Liabilities | 2 | `DEFAULT_MAX_LIABILITIES` |

Admins can override these per-user in the Admin Dashboard.

---

## 🆘 Troubleshooting

### "Failed to fetch" or API errors
```bash
# Check backend is running
docker-compose ps

# Check logs for errors
docker-compose logs backend | tail -50
```

### "ERR_TOO_MANY_REDIRECTS"
- Cloudflare SSL/TLS mode should be "Full" (not "Flexible")
- Check `APP_URL` matches your actual domain

### CouchDB sync not working
```bash
# Verify CouchDB is healthy
curl http://localhost:5984/_up

# Check CORS settings
docker-compose exec couchdb cat /opt/couchdb/etc/local.d/cors.ini
```

### Reset admin password
```bash
# Generate new password hash
docker-compose exec backend node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('newpassword', 12).then(h => console.log(h))"

# Update in database
docker-compose exec backend npx prisma db execute --stdin <<< "UPDATE users SET passwordHash='<hash>' WHERE email='admin@example.com';"
```

### "ZK1:..." Encrypted Text Visible
If you see `ZK1:...` instead of your name or asset details:
1. This means your local encryption key no longer matches the data (usually due to a cleared browser cache without a proper logout).
2. **Fix:** Go to **Profile** or the relevant form, delete the `ZK1...` text, and re-type the correct value. Saving it will re-encrypt it with your current key.

### Analytics API Error (400 Bad Request)
- Ensure you have rebuilt the frontend if you suspect old code: `docker-compose up -d --build frontend`
- Check `REACT_APP_ENABLE_ANALYTICS` in your `.env`.

---

## 📚 More Documentation

- **[Full Deployment Guide](docs/deployment-guide.md)** - Advanced configurations, Traefik, Kubernetes
- **[Environment Variables Reference](docs/ENVIRONMENT_VARIABLES.md)** - Complete variable list
- **[Cloudflare Tunnel Setup](docs/guides/CLOUDFLARE_TUNNEL_SETUP.md)** - Detailed tunnel configuration
- **[Troubleshooting FAQ](docs/troubleshooting-faq.md)** - Common issues and solutions
- **[Zakat FAQ](FAQs.md)** - Islamic finance questions

---

## 💬 Need Help?

- **GitHub Issues**: [github.com/slimatic/zakapp/issues](https://github.com/slimatic/zakapp/issues)
- **Discussions**: [github.com/slimatic/zakapp/discussions](https://github.com/slimatic/zakapp/discussions)

---

*Last updated: January 2026*
