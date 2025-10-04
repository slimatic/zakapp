#!/bin/bash
# Production Server Initial Setup Script
# Run this on a fresh Ubuntu 22.04 server

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "    ZakApp Production Server Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (sudo)"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
echo "📦 Installing essential packages..."
apt install -y \
    build-essential \
    git \
    curl \
    wget \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw \
    fail2ban \
    htop \
    tmux \
    vim

# Install Node.js 20.x LTS
echo "📦 Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify Node.js installation
echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install PM2 globally
echo "📦 Installing PM2 process manager..."
npm install -g pm2

# Install serve for static file serving
npm install -g serve

# Create application user
echo "👤 Creating zakapp user..."
if ! id -u zakapp > /dev/null 2>&1; then
    useradd -m -s /bin/bash zakapp
    echo "✅ User 'zakapp' created"
else
    echo "ℹ️  User 'zakapp' already exists"
fi

# Create application directories
echo "📁 Creating application directories..."
mkdir -p /var/www/zakapp
mkdir -p /var/log/zakapp
mkdir -p /var/backups/zakapp

# Set permissions
chown -R zakapp:zakapp /var/www/zakapp
chown -R zakapp:zakapp /var/log/zakapp
chown -R zakapp:zakapp /var/backups/zakapp

# Configure firewall
echo "🔒 Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

echo "✅ Firewall configured and enabled"

# Configure fail2ban
echo "🔒 Configuring fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# Configure SSH security
echo "🔒 Hardening SSH configuration..."
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

echo "⚠️  SSH root login disabled"
echo "⚠️  SSH password authentication disabled (keys only)"
echo "⚠️  Make sure you have SSH key access before restarting SSH!"

read -p "Restart SSH now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    systemctl restart sshd
    echo "✅ SSH restarted"
else
    echo "⚠️  Remember to restart SSH later: sudo systemctl restart sshd"
fi

# Enable automatic security updates
echo "🔒 Enabling automatic security updates..."
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Install PostgreSQL
echo "🗄️  Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

echo "✅ PostgreSQL installed: $(sudo -u postgres psql --version)"

# Create swap file if not exists (helpful for small servers)
if [ ! -f /swapfile ]; then
    echo "💾 Creating 2GB swap file..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "✅ Swap file created and enabled"
fi

# Configure Nginx
echo "🌐 Configuring Nginx..."
systemctl enable nginx

# Remove default Nginx site
rm -f /etc/nginx/sites-enabled/default

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Server setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next steps:"
echo "  1. Run database setup: sudo ./database-setup.sh"
echo "  2. Configure environment: ./generate-secrets.sh"
echo "  3. Setup SSL: sudo ./setup-ssl.sh your-domain.com"
echo "  4. Deploy application: sudo -u zakapp ./initial-deploy.sh"
echo ""
echo "⚠️  Important reminders:"
echo "  - Ensure SSH key access is working before logging out"
echo "  - Save database passwords securely"
echo "  - Configure DNS A records before SSL setup"
echo ""
