#!/bin/bash
# Generate secure secrets for production environment

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "    Generating Secure Secrets for ZakApp"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🔑 Generating cryptographically secure secrets..."
echo ""

JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -base64 32)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Generated Secrets (SAVE THESE SECURELY!):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "# JWT Secrets"
echo "JWT_SECRET=\"$JWT_SECRET\""
echo "JWT_REFRESH_SECRET=\"$JWT_REFRESH_SECRET\""
echo ""
echo "# Encryption Key (64 hex characters)"
echo "ENCRYPTION_KEY=\"$ENCRYPTION_KEY\""
echo ""
echo "# Session Secret"
echo "SESSION_SECRET=\"$SESSION_SECRET\""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Save to file
SECRETS_FILE=".env.secrets.$(date +%Y%m%d_%H%M%S)"
cat > $SECRETS_FILE << EOF
# ZakApp Production Secrets
# Generated: $(date)
# KEEP THIS FILE SECURE - DO NOT COMMIT TO GIT

JWT_SECRET="$JWT_SECRET"
JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
ENCRYPTION_KEY="$ENCRYPTION_KEY"
SESSION_SECRET="$SESSION_SECRET"
EOF

chmod 600 $SECRETS_FILE

echo "💾 Secrets saved to: $SECRETS_FILE"
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "  1. Copy these secrets to /var/www/zakapp/server/.env.production"
echo "  2. Store a backup copy in a secure password manager"
echo "  3. NEVER commit these to git or share publicly"
echo "  4. Delete this file after copying: rm $SECRETS_FILE"
echo ""
echo "📋 Next step: Create your .env.production file"
echo "  sudo -u zakapp nano /var/www/zakapp/server/.env.production"
echo ""
