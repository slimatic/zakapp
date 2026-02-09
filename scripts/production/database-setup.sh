#!/bin/bash
# Database Setup Script for Production

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "    PostgreSQL Database Setup for ZakApp"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (sudo)"
    exit 1
fi

# Generate a strong random password
DB_PASSWORD=$(openssl rand -base64 32)

echo "🗄️  Creating production database..."

# Create database and user
sudo -u postgres psql << EOF
-- Create production database
CREATE DATABASE zakapp_production;

-- Create user with generated password
CREATE USER zakapp_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE zakapp_production TO zakapp_user;

-- Connect to database
\c zakapp_production

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO zakapp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO zakapp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO zakapp_user;

-- Exit
\q
EOF

echo "✅ Database created successfully"
echo ""

# Save credentials securely
CREDS_FILE="/root/.zakapp_db_credentials"
cat > $CREDS_FILE << EOF
# ZakApp Database Credentials
# Created: $(date)

Database: zakapp_production
User: zakapp_user
Password: $DB_PASSWORD

Connection String:
DATABASE_URL="postgresql://zakapp_user:$DB_PASSWORD@localhost:5432/zakapp_production"
EOF

chmod 600 $CREDS_FILE

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Database setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Database Information:"
echo "  Database: zakapp_production"
echo "  User: zakapp_user"
echo "  Password: $DB_PASSWORD"
echo ""
echo "🔒 Credentials saved to: $CREDS_FILE"
echo ""
echo "⚠️  IMPORTANT: Add this to your /var/www/zakapp/server/.env.production:"
echo "DATABASE_URL=\"postgresql://zakapp_user:$DB_PASSWORD@localhost:5432/zakapp_production\""
echo ""

# Optional: Create backup script
BACKUP_SCRIPT="/usr/local/bin/backup-zakapp-db"
cat > $BACKUP_SCRIPT << 'EOF'
#!/bin/bash
# Automated database backup script

BACKUP_DIR="/var/backups/zakapp/database"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="zakapp_production_${DATE}.sql.gz"

mkdir -p $BACKUP_DIR

# Perform backup
sudo -u postgres pg_dump zakapp_production | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "zakapp_production_*.sql.gz" -mtime +30 -delete

echo "✅ Backup completed: ${BACKUP_FILE}"

# Optional: Upload to remote storage
# aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" s3://your-bucket/backups/
EOF

chmod +x $BACKUP_SCRIPT
chown zakapp:zakapp $BACKUP_SCRIPT

echo "✅ Backup script created at: $BACKUP_SCRIPT"
echo ""
echo "📋 To set up automatic daily backups at 2 AM:"
echo "  sudo crontab -e"
echo "  Add: 0 2 * * * $BACKUP_SCRIPT"
echo ""
