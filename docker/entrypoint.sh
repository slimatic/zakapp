#!/bin/sh
# Docker entrypoint script for ZakApp backend
# Handles database initialization and security setup

set -e

echo "🚀 ZakApp Backend Startup"
echo "========================="

# Check if required environment variables are set
check_env() {
    local var_name=$1
    local var_value=$(eval echo \$$var_name)
    if [ -z "$var_value" ]; then
        echo "⚠️  Warning: $var_name is not set"
        return 1
    fi
    return 0
}

# Verify security-critical environment variables
echo "🔐 Checking security configuration..."

SECURITY_OK=true

if ! check_env "JWT_SECRET"; then
    SECURITY_OK=false
fi

if ! check_env "ENCRYPTION_KEY"; then
    SECURITY_OK=false
fi

if [ "$SECURITY_OK" = false ] && [ "$NODE_ENV" = "production" ]; then
    echo "❌ FATAL: Missing required security environment variables in production!"
    echo "   Please set JWT_SECRET and ENCRYPTION_KEY"
    exit 1
fi

# Database initialization
echo "📦 Checking database..."

DB_PATH="/app/server/prisma/data/dev.db"
MIGRATIONS_NEEDED=false

if [ ! -f "$DB_PATH" ]; then
    echo "📝 Database not found. Initializing..."
    MIGRATIONS_NEEDED=true
else
    echo "✅ Database exists at $DB_PATH"
    # Check if migrations are pending
    if ! npx prisma migrate status 2>/dev/null | grep -q "Database schema is up to date"; then
        echo "📝 Pending migrations detected..."
        MIGRATIONS_NEEDED=true
    fi
fi

if [ "$MIGRATIONS_NEEDED" = true ]; then
    echo "🔄 Running database migrations..."

    # Create the database and run migrations.
    # SECURITY/DATA-SAFETY: no fallback to `prisma db push --accept-data-loss`.
    # That command can silently drop columns/tables and destroy user data.
    # A failed migration must block startup so the operator can restore from
    # backup instead of having the schema silently reshaped.
    if npx prisma migrate deploy; then
        echo "✅ Database migrations completed successfully"
    else
        echo "❌ FATAL: Database migration failed — refusing to start."
        echo "   Restore from backup and investigate. Do NOT use 'db push --accept-data-loss' in production."
        exit 1
    fi
fi

# Verify database is accessible
echo "🔍 Verifying database connection..."
if npx prisma db execute --stdin < /dev/null > /dev/null 2>&1; then
    echo "✅ Database connection verified"
else
    echo "✅ Database ready (skipped connection test)"
fi

# Display startup info
echo ""
echo "================================"
echo "🚀 Starting ZakApp Backend..."
echo "   Environment: ${NODE_ENV:-development}"
echo "   Port: ${PORT:-3001}"
echo "   Database: $DB_PATH"
echo "================================"
echo ""

# Sanity check: ensure `shared` build artifacts exist to avoid Node ESM directory import errors
if [ ! -f /app/shared/dist/constants/index.js ]; then
    echo "❌ FATAL: Missing /app/shared/dist/constants/index.js - shared package not built correctly"
    echo "Contents of /app/shared/dist:"; ls -la /app/shared/dist || true
    exit 1
fi

# Execute the main command
exec "$@"
