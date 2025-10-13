# Cloudflare Tunnel - Quick Answer

**Question**: Do I have to do anything different for this to work on cloudflared proxy?

**Answer**: Yes, but only a few simple configuration changes! ✅

---

## TL;DR - What You Need to Change

### 1. **Environment Variables** (Most Important)

Add your Cloudflare domains to `server/.env`:

```bash
ALLOWED_ORIGINS=https://app.yourdomain.com,https://api.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com
BACKEND_URL=https://api.yourdomain.com
```

### 2. **Cloudflare Tunnel Config**

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/user/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: app.yourdomain.com
    service: http://localhost:3000
  
  - hostname: api.yourdomain.com
    service: http://localhost:3002
  
  - service: http_status:404
```

### 3. **That's It!** 🎉

The app is already configured to work with Cloudflare Tunnel:
- ✅ CORS handling is built-in (`SecurityMiddleware.ts`)
- ✅ Proxy headers are handled automatically
- ✅ Rate limiting works through Cloudflare
- ✅ No nginx/SSL configuration needed

---

## Complete Guide

See **[CLOUDFLARE_TUNNEL_SETUP.md](CLOUDFLARE_TUNNEL_SETUP.md)** for:
- Step-by-step installation
- Multiple deployment methods (PM2, Docker, manual)
- Troubleshooting guide
- Performance optimization
- Cost comparison ($0-50/mo vs $60-170/mo traditional)

---

## Why Cloudflare Tunnel?

✅ **No exposed ports** - More secure  
✅ **Free SSL/TLS** - Automatic HTTPS  
✅ **Free DDoS protection** - Built-in security  
✅ **Works anywhere** - Behind NAT, home server, etc.  
✅ **Easy setup** - No nginx configuration needed  
✅ **Cost effective** - Save $120/month vs traditional VPS  

---

## Quick Setup Commands

```bash
# 1. Install cloudflared
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# 2. Login and create tunnel
cloudflared tunnel login
cloudflared tunnel create zakapp

# 3. Configure DNS
cloudflared tunnel route dns zakapp app.yourdomain.com
cloudflared tunnel route dns zakapp api.yourdomain.com

# 4. Create config file (see CLOUDFLARE_TUNNEL_SETUP.md)

# 5. Run tunnel
cloudflared tunnel run zakapp
```

---

**Ready to deploy? See [CLOUDFLARE_TUNNEL_SETUP.md](CLOUDFLARE_TUNNEL_SETUP.md) for complete instructions!**
