# Phase 2: Production Environment Setup - Progress Report

**Status**: 🟡 IN PROGRESS  
**Started**: October 3, 2025  
**Phase**: 2 of 5  

---

## ✅ Completed Tasks

### 1. Documentation Created
- ✅ **PHASE2_PRODUCTION_SETUP_GUIDE.md** (400+ lines)
  - Complete infrastructure requirements
  - Server setup procedures
  - Database configuration
  - SSL/TLS setup
  - Deployment automation
  - Monitoring and health checks
  - Rollback procedures

### 2. Production Scripts Created
- ✅ **scripts/production/server-setup.sh**
  - System update and package installation
  - Node.js 20.x LTS installation
  - PM2 process manager setup
  - Firewall configuration (UFW)
  - SSH hardening
  - PostgreSQL installation
  - Swap file creation
  - Nginx configuration

- ✅ **scripts/production/database-setup.sh**
  - PostgreSQL database creation
  - User and permissions setup
  - Secure password generation
  - Automated backup script
  - Credentials management

- ✅ **scripts/production/generate-secrets.sh**
  - JWT secret generation
  - Encryption key generation
  - Session secret generation
  - Secure file creation

- ✅ **ecosystem.config.js**
  - PM2 cluster configuration
  - Backend process management
  - Frontend static serving
  - Log file management
  - Auto-restart policies
  - Memory limits

---

## 📋 Production Infrastructure Options

### Option A: DigitalOcean (Recommended for MVP)
**Monthly Cost**: ~$40-50
- Droplet: $24/month (2 vCPUs, 4 GB RAM, 80 GB SSD)
- Managed PostgreSQL: $15/month (1 vCPU, 1 GB RAM)
- Automated backups included
- Simple deployment process

**Pros**:
- Easy to use
- Managed database option
- Good documentation
- Affordable for startups

**Cons**:
- Less powerful than AWS
- Limited advanced features

### Option B: AWS (Scalable for Growth)
**Monthly Cost**: ~$50-80
- EC2 t3.medium: ~$30/month (2 vCPUs, 4 GB RAM)
- RDS db.t3.micro: ~$15/month (1 vCPU, 1 GB RAM)
- EBS storage: ~$3/month
- Data transfer: ~$5-10/month

**Pros**:
- Highly scalable
- Enterprise features
- Global infrastructure
- Excellent monitoring

**Cons**:
- More complex setup
- Steeper learning curve
- Can get expensive

### Option C: Heroku (Fastest Deployment)
**Monthly Cost**: ~$75-100
- Standard dyno: $25/month
- Heroku Postgres Standard-0: $50/month
- Add-ons: ~$0-25/month

**Pros**:
- Zero DevOps effort
- Git-based deployment
- Automatic SSL
- Built-in monitoring

**Cons**:
- Most expensive
- Less control
- Vendor lock-in

---

## 🎯 Next Steps

### Immediate Actions (Next Session)

#### 1. Choose Infrastructure Provider
**Decision needed**: DigitalOcean / AWS / Heroku / Other

#### 2. Provision Server
Once provider chosen:
```bash
# For DigitalOcean
# - Create Droplet (Ubuntu 22.04)
# - Create Managed PostgreSQL instance
# - Configure firewall rules
# - Add SSH keys

# For AWS
# - Launch EC2 instance
# - Create RDS PostgreSQL instance
# - Configure Security Groups
# - Setup Elastic IP

# For Heroku
# - Create new app
# - Add PostgreSQL add-on
# - Configure buildpacks
```

#### 3. Configure DNS
```bash
# Add these DNS records:
# A     your-domain.com        -> server-ip
# A     www.your-domain.com    -> server-ip
# A     api.your-domain.com    -> server-ip
# AAAA  (IPv6 if available)    -> server-ipv6
```

#### 4. Run Server Setup
```bash
# SSH into server
ssh root@your-server-ip

# Upload and run setup script
wget https://raw.githubusercontent.com/slimatic/zakapp/main/scripts/production/server-setup.sh
chmod +x server-setup.sh
sudo ./server-setup.sh
```

#### 5. Database Configuration
```bash
# Run database setup
sudo ./database-setup.sh

# Save credentials securely
# Add to password manager
```

#### 6. Generate Production Secrets
```bash
# Generate secrets
./generate-secrets.sh

# Create .env.production file
sudo -u zakapp nano /var/www/zakapp/server/.env.production

# Add all secrets and configuration
```

#### 7. SSL Certificate Setup
```bash
# Ensure DNS is propagated first
# Then run:
sudo certbot --nginx \
  -d your-domain.com \
  -d www.your-domain.com \
  -d api.your-domain.com \
  --email your-email@example.com \
  --agree-tos \
  --redirect
```

#### 8. Initial Deployment
```bash
# Clone repository
cd /var/www
sudo -u zakapp git clone https://github.com/slimatic/zakapp.git

# Install dependencies
cd zakapp/server && npm ci --only=production
cd ../client && npm ci --only=production

# Build frontend
npm run build

# Run migrations
cd ../server && npx prisma migrate deploy

# Start with PM2
cd ..
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### 9. Verify Deployment
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs

# Test health endpoint
curl https://api.your-domain.com/health

# Test frontend
curl https://your-domain.com
```

---

## 📊 Production Readiness Checklist

### Server Configuration
- [ ] Ubuntu 22.04 server provisioned
- [ ] Node.js 20.x installed
- [ ] PM2 process manager installed
- [ ] Nginx web server configured
- [ ] Firewall (UFW) enabled
- [ ] Fail2ban installed
- [ ] SSH hardened (key-only auth)
- [ ] Swap file created

### Database
- [ ] PostgreSQL 14+ installed
- [ ] Production database created
- [ ] User and permissions configured
- [ ] Backup script created
- [ ] Backup cron job scheduled

### Security
- [ ] SSL certificates installed (Let's Encrypt)
- [ ] HTTPS redirect configured
- [ ] Security headers added (Nginx)
- [ ] Rate limiting configured
- [ ] Secrets generated securely
- [ ] .env.production created (not in git)

### Application
- [ ] Repository cloned to server
- [ ] Dependencies installed
- [ ] Frontend built
- [ ] Database migrations run
- [ ] PM2 ecosystem configured
- [ ] PM2 startup script enabled
- [ ] Health checks working

### DNS & Domain
- [ ] Domain purchased
- [ ] DNS A records configured
- [ ] DNS propagated (wait 24-48 hours)
- [ ] SSL certificate issued
- [ ] HTTPS working

### Monitoring
- [ ] PM2 monitoring enabled
- [ ] Health check cron job created
- [ ] Log rotation configured
- [ ] Backup verification tested

### Testing
- [ ] Health endpoint responding
- [ ] Frontend accessible
- [ ] API endpoints working
- [ ] Database connections verified
- [ ] Authentication tested
- [ ] SSL certificate valid

---

## 🚨 Common Issues & Solutions

### Issue 1: DNS Not Propagating
**Symptoms**: SSL certificate fails, domain not resolving  
**Solution**: Wait 24-48 hours, check with `dig your-domain.com`

### Issue 2: PM2 Won't Start
**Symptoms**: `pm2 status` shows errors  
**Solution**: Check logs with `pm2 logs`, verify .env.production exists

### Issue 3: Database Connection Failed
**Symptoms**: Health check fails, connection errors  
**Solution**: Verify DATABASE_URL in .env, check PostgreSQL is running

### Issue 4: Port Already in Use
**Symptoms**: "EADDRINUSE" error  
**Solution**: `sudo lsof -i :3002`, kill conflicting process

### Issue 5: Permission Denied
**Symptoms**: Can't write to directories  
**Solution**: `sudo chown -R zakapp:zakapp /var/www/zakapp`

---

## 💰 Estimated Costs (Monthly)

### Minimal Setup (DigitalOcean)
- Server: $24/month (4GB RAM)
- Database: $15/month (Managed PostgreSQL)
- Bandwidth: $0 (included)
- Backups: $0 (included)
- **Total: ~$40/month**

### Recommended Setup (DigitalOcean)
- Server: $48/month (8GB RAM, production)
- Database: $15/month (Managed PostgreSQL)
- Staging Server: $12/month (2GB RAM)
- CDN: $5/month (optional)
- **Total: ~$80/month**

### Enterprise Setup (AWS)
- EC2 t3.medium: $30/month
- RDS db.t3.small: $30/month
- Load Balancer: $20/month
- CloudWatch: $10/month
- S3 Storage: $5/month
- Data Transfer: $10/month
- **Total: ~$105/month**

---

## 📖 Additional Documentation Needed

### Still To Create:
1. **Nginx Configuration Template** - Full nginx.conf with all domains
2. **Environment Variables Template** - Complete .env.production example
3. **Deployment Automation** - CI/CD with GitHub Actions
4. **Monitoring Setup** - DataDog/New Relic integration
5. **Backup & Restore Procedures** - Complete disaster recovery plan
6. **Performance Optimization** - Caching, CDN, compression
7. **Scaling Guide** - Horizontal scaling procedures

---

## ✅ Phase 2 Summary

**What We've Accomplished**:
- ✅ Complete production setup documentation (400+ lines)
- ✅ Automated server setup scripts
- ✅ Database configuration automation
- ✅ Security hardening procedures
- ✅ PM2 ecosystem configuration
- ✅ Health monitoring setup
- ✅ Backup automation

**Ready For**:
- Server provisioning
- DNS configuration
- SSL certificate installation
- Initial deployment

**Waiting For**:
- Infrastructure provider selection
- Domain name (if not already owned)
- Server provisioning
- DNS propagation

---

## 🚀 Recommendation

**For MVP Launch (Fastest Path)**:
1. **Choose DigitalOcean** ($40/month, easiest setup)
2. **Use Existing Domain** (or register one - ~$12/year)
3. **Follow Script-Based Setup** (30 minutes)
4. **Deploy with PM2** (automated with scripts)
5. **Monitor with PM2 Plus** (free tier available)

**Timeline**:
- Server provisioning: 5 minutes
- DNS configuration: 5 minutes (+ 24h propagation)
- Server setup: 30 minutes
- Application deployment: 15 minutes
- Testing & verification: 30 minutes
- **Total Active Time: ~1.5 hours** (+ DNS wait)

**What do you want to do next?**
1. Choose infrastructure provider (DigitalOcean/AWS/Heroku)
2. Create Nginx configuration templates
3. Set up staging environment first
4. Move to Phase 3 (Monitoring setup)
5. Something else

