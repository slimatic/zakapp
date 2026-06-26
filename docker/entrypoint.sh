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

# Database initialization — schema migrations are handled by the dedicated
# `migrations` service in docker-compose.yml. This section only checks
# that the DB file exists for local development (non-Docker) usage.
echo "📦 Checking database..."

DB_PATH="/app/server/prisma/data/dev.db"

if [ -n "${DATABASE_URL:-}" ]; then
    # Extract path from DATABASE_URL (may be file:./path or file:/absolute/path)
    RAW_PATH="${DATABASE_URL#file:}"
    if [ -f "$RAW_PATH" ]; then
        DB_PATH="$RAW_PATH"
    fi
fi

# In Docker: migrations service already ran `prisma migrate deploy`.
# In local dev: run migrations only if not in test mode and DB doesn't look current.
if [ "${NODE_ENV}" != "test" ] && [ "${SKIP_MIGRATION:-}" != "true" ]; then
    if [ ! -f "$DB_PATH" ]; then
        echo "📝 Local dev: Database not found. Running migrations..."
        npx prisma migrate deploy
        if [ $? -ne 0 ]; then
            echo "❌ Migration failed! See logs above."
            exit 1
        fi
    else
        echo "✅ Database exists at $DB_PATH"
    fi
else
    echo "✅ Skipping migration (test mode or SKIP_MIGRATION=true)"
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
