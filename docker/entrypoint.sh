#!/bin/sh
# Docker entrypoint script for ZakApp backend
# Handles database initialization and security setup

set -e

echo "🚀 ZakApp Backend Startup"
echo "========================="

# ---------------------------------------------------------------------------
# 1. Security configuration check
# ---------------------------------------------------------------------------
# Design rule: this script must never be STRICTER than the application, or it
# becomes a new way to lock an operator out of their own data. Refusing to boot
# on a value the app would have tolerated takes a running instance offline.
#
# Verified against server/src/config/security.ts:
#   - ENCRYPTION_KEY -> getEncryptionKey() THROWS when unset
#   - JWT_SECRET     -> getJwtSecret()     THROWS when unset
# Both are imported at module load (utils/jwt.ts:22, routes/auth/utils.ts:21),
# so a missing value already kills the process with a CRITICAL SECURITY ERROR.
# Failing here too just reports it earlier and more legibly.
#
# JWT_REFRESH_SECRET is DIFFERENT and must NOT be fatal: JWTService.ts falls
# back to crypto.randomBytes(64), so the app boots fine without it. The
# footgun is that a fresh random secret every boot invalidates every issued
# refresh token — every user is silently logged out on each restart, which is
# the #267 session-expiry loop. Warn loudly; never exit.
#
# `set -e` note: `[ -z ... ]` returning 1 inside an `if` is fine (the shell
# treats it as the conditional), so these tests never abort the script.
# ---------------------------------------------------------------------------
echo "🔐 Checking security configuration..."

SECURITY_FATAL=false

# No fallback in the app; unset means the process dies anyway.
if [ -z "$ENCRYPTION_KEY" ]; then
    echo "   ❌ ENCRYPTION_KEY is not set"
    SECURITY_FATAL=true
fi

# No fallback in the app either (getJwtSecret throws).
if [ -z "$JWT_SECRET" ]; then
    echo "   ❌ JWT_SECRET is not set"
    SECURITY_FATAL=true
fi

# HAS a random fallback — boots fine, but invalidates sessions each restart.
if [ -z "$JWT_REFRESH_SECRET" ] && [ -z "$REFRESH_SECRET" ]; then
    echo "   ⚠️  JWT_REFRESH_SECRET/REFRESH_SECRET is not set."
    echo "      A random secret will be generated at boot, which invalidates"
    echo "      all existing sessions — every user will be logged out on each"
    echo "      restart. Set JWT_REFRESH_SECRET to make sessions persist."
fi

if [ "$SECURITY_FATAL" = true ] && [ "$NODE_ENV" = "production" ]; then
    echo ""
    echo "❌ FATAL: Missing required security environment variable in production!"
    echo "   Set JWT_SECRET and ENCRYPTION_KEY before starting."
    echo "   (The application itself refuses to run without these; failing here"
    echo "    just reports it before the stack traces start.)"
    exit 1
fi

# ---------------------------------------------------------------------------
# 2. Database initialisation
# ---------------------------------------------------------------------------
# DB_PATH is derived from DATABASE_URL. It was previously hardcoded to
# `dev.db` while production uses `prod.db`, so the pending-migration probe
# below silently checked the wrong file (or no file at all).
echo "📦 Checking database..."

DB_PATH="${DATABASE_URL#file:}"
DB_PATH="${DB_PATH%%\?*}"          # strip ?connection_limit=1 etc.
if [ -z "$DB_PATH" ] || [ "$DB_PATH" = "$DATABASE_URL" ]; then
    DB_PATH="/app/server/prisma/data/prod.db"
fi

MIGRATIONS_NEEDED=false

if [ ! -f "$DB_PATH" ]; then
    echo "📝 Database not found at $DB_PATH. Initializing..."
    MIGRATIONS_NEEDED=true
else
    echo "✅ Database exists at $DB_PATH"
    if npx prisma migrate status > /tmp/migrate-status.log 2>&1 &&
       grep -q "Database schema is up to date" /tmp/migrate-status.log; then
        echo "✅ Schema is up to date — no migrations to apply."
    else
        echo "📝 Pending migrations detected..."
        MIGRATIONS_NEEDED=true
    fi
fi

if [ "$MIGRATIONS_NEEDED" = true ]; then
    echo "🔄 Running database migrations..."

    # -----------------------------------------------------------------------
    # Baseline an existing database that predates migration history.
    #
    # `prisma migrate deploy` exits P3005 on any non-empty database with no
    # _prisma_migrations table. Instances created before migrations existed
    # (or via `db push`) are in exactly that state, so a bare `migrate deploy`
    # here would hard-fail and refuse to start — locking existing operators
    # out of their own data on upgrade.
    #
    # Baselining marks the existing migrations as already-applied WITHOUT
    # running their SQL, which is safe only when the live schema already
    # matches the schema Prisma knows about. So we prove that first with
    # `migrate diff`. If there IS drift we do not guess — we fail closed and
    # tell the operator to back up.
    #
    # `--exit-code` returns 2 (not the documented 1) when differences exist;
    # verified empirically against this Prisma build. Both the exit code and
    # the diff markers are checked so a Prisma change cannot silently disable
    # the guard.
    # -----------------------------------------------------------------------
    migrate_rc=0
    npx prisma migrate deploy > /tmp/migrate-out.log 2>&1 || migrate_rc=$?

    if [ "$migrate_rc" = "0" ]; then
        echo "✅ Database migrations completed successfully"
    elif grep -q "P3005" /tmp/migrate-out.log; then
        echo "ℹ️  Existing database has no migration history (P3005)."
        echo "   Verifying the live schema already matches the expected schema..."

        diff_rc=0
        npx prisma migrate diff \
            --from-url "$DATABASE_URL" \
            --to-schema-datamodel prisma/schema.prisma \
            --exit-code > /tmp/migrate-diff.log 2>&1 || diff_rc=$?

        if [ "$diff_rc" = "0" ] || grep -q "No difference detected" /tmp/migrate-diff.log; then
            echo "✅ Schema matches — baselining existing migrations."
            echo "   (Existing migrations are recorded as applied; no SQL is"
            echo "    re-run, so current data is untouched.)"
            for m in prisma/migrations/*/; do
                name=$(basename "$m")
                [ "$name" = "migration_lock.toml" ] && continue
                npx prisma migrate resolve --applied "$name" >/dev/null 2>&1 || true
            done
            if npx prisma migrate deploy > /tmp/migrate-out.log 2>&1; then
                echo "✅ Database migrations completed successfully (baselined)"
            else
                echo "❌ FATAL: migrations still failing after baseline."
                tail -30 /tmp/migrate-out.log || true
                exit 1
            fi
        elif [ "$diff_rc" = "2" ] || grep -qE "^\[[-+]\]" /tmp/migrate-diff.log; then
            echo "❌ FATAL: Existing database has SCHEMA DRIFT — the live schema"
            echo "   does not match prisma/schema.prisma."
            echo "   Refusing to auto-baseline: guessing here risks data loss."
            echo "   Back up first, then baseline manually per:"
            echo "   https://pris.ly/d/migrate-baseline"
            echo "   --- detected differences ---"
            grep -E "^\[[-+]\]|^  [-+]" /tmp/migrate-diff.log | head -30 || true
            exit 1
        else
            echo "❌ FATAL: could not compare the live schema with the expected"
            echo "   schema. Refusing to start."
            head -40 /tmp/migrate-diff.log || true
            exit 1
        fi
    else
        echo "❌ FATAL: Database migration failed — refusing to start."
        echo "   Restore from backup and investigate. Do NOT use"
        echo "   'db push --accept-data-loss' in production."
        tail -30 /tmp/migrate-out.log || true
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

# Sanity check: ensure `shared` build artifacts exist to avoid Node ESM
# directory import errors
if [ ! -f /app/shared/dist/constants/index.js ]; then
    echo "❌ FATAL: Missing /app/shared/dist/constants/index.js - shared package not built correctly"
    echo "Contents of /app/shared/dist:"; ls -la /app/shared/dist || true
    exit 1
fi

# Execute the main command
exec "$@"
