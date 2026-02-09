#!/bin/bash
# Generate secure secrets for ZakApp
# This script generates all required secrets and outputs them

set -e

echo "🔐 ZakApp Secret Generator"
echo "==========================="
echo ""

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo "❌ Error: OpenSSL is not installed"
    echo "Please install OpenSSL:"
    echo "  Ubuntu/Debian: sudo apt-get install openssl"
    echo "  macOS: brew install openssl"
    echo "  Windows: https://slproweb.com/products/Win32OpenSSL.html"
    exit 1
fi

echo "Generating secrets..."
echo ""

# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
REFRESH_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)
APP_SECRET=$(openssl rand -base64 32)
COUCHDB_PASSWORD=$(openssl rand -base64 16)
COUCHDB_JWT_SECRET=$(openssl rand -base64 32)

# Output formatted for .env file
echo "Copy and paste these into your .env file:"
echo ""
echo "# Security Secrets"
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo "REFRESH_SECRET=$REFRESH_SECRET"
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo "APP_SECRET=$APP_SECRET"
echo ""
echo "# CouchDB Configuration"
echo "COUCHDB_USER=admin"
echo "COUCHDB_PASSWORD=$COUCHDB_PASSWORD"
echo "COUCHDB_JWT_SECRET=$COUCHDB_JWT_SECRET"
echo ""

# Check if .env exists and offer to update it
if [ -f .env ]; then
    echo ""
    read -p "Would you like to update your .env file with these secrets? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Backup existing .env
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        
        # Update secrets in .env
        sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        sed -i "s/^JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" .env
        sed -i "s/^REFRESH_SECRET=.*/REFRESH_SECRET=$REFRESH_SECRET/" .env
        sed -i "s/^ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env
        sed -i "s/^APP_SECRET=.*/APP_SECRET=$APP_SECRET/" .env
        sed -i "s/^COUCHDB_PASSWORD=.*/COUCHDB_PASSWORD=$COUCHDB_PASSWORD/" .env
        sed -i "s/^COUCHDB_JWT_SECRET=.*/COUCHDB_JWT_SECRET=$COUCHDB_JWT_SECRET/" .env
        
        echo "✅ .env file updated!"
        echo "   Backup created: .env.backup.*"
    fi
fi

echo ""
echo "✅ Done!"
