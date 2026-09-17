#!/bin/bash
# Standalone database migrator for the ZakApp `migrations` compose service.
#
# WHY A SEPARATE SCRIPT: the production image declares
# ENTRYPOINT ["/entrypoint.sh"], so the `migrations` service cannot reuse it —
# that would run the whole backend startup (security gates, `exec "$@"`)
# instead of just migrating.
#
# WHY NOT just inline `prisma migrate deploy` in compose: that version has no
# P3005 handling. Any operator upgrading from a database that predates
# migration history would hard-fail here, the service would never reach
# `service_completed_successfully`, and the backend would never start — a
# total lockout on upgrade. This script carries the same guarded auto-baseline
# as docker/entrypoint.sh. Keep the migration logic in the two files in sync.
#
# NOTE: bash, not sh. The image's /bin/sh is dash, and `set -e` in dash makes
# `cmd || rc=$?` behave subtly differently around failing pipelines; bash is
# present in the image and is what the app container effectively relies on.
set -u

echo "Running database migrations..."

DB_PATH="${DATABASE_URL#file:}"
DB_PATH="${DB_PATH%%\?*}"
cd /app/server

run_migrate() {
    # Capture stderr so we can tell "P3005, needs baseline" apart from any
    # other migration failure. Deliberately not relying on `set -e` here.
    npx prisma migrate deploy > /tmp/migrate-out.log 2>&1
    return $?
}

if [ ! -f "$DB_PATH" ]; then
    # Fresh install — nothing to baseline.
    if run_migrate; then
        echo "✅ Migrations applied to a new database"
        exit 0
    fi
    echo "❌ FATAL: migration failed on a fresh database."
    tail -30 /tmp/migrate-out.log || true
    exit 1
fi

if run_migrate; then
    echo "✅ Database migrations completed successfully"
    exit 0
fi

if ! grep -q "P3005" /tmp/migrate-out.log; then
    echo "❌ FATAL: prisma migrate deploy failed — refusing to continue."
    echo "   Restore from backup and investigate."
    echo "   Do NOT use 'db push --accept-data-loss' in production."
    tail -30 /tmp/migrate-out.log || true
    exit 1
fi

# ---------------------------------------------------------------------------
# P3005: the database exists but has no _prisma_migrations table. This is the
# upgrade path for any instance whose schema predates migrations (or was built
# with `db push`). Baselining records existing migrations as already-applied
# WITHOUT running their SQL — safe only when the live schema already matches
# prisma/schema.prisma, so we prove that first.
#
# `migrate diff --exit-code` returns 2 (not the documented 1) when differences
# exist; verified empirically against this Prisma build. Both the exit code and
# the diff markers are checked so a Prisma change cannot silently disable the
# guard.
# ---------------------------------------------------------------------------
echo "ℹ️  Existing database has no migration history (P3005)."
echo "   Verifying the live schema already matches the expected schema..."

diff_rc=0
npx prisma migrate diff \
    --from-url "$DATABASE_URL" \
    --to-schema-datamodel prisma/schema.prisma \
    --exit-code > /tmp/migrate-diff.log 2>&1 || diff_rc=$?

if [ "$diff_rc" = "0" ] || grep -q "No difference detected" /tmp/migrate-diff.log; then
    echo "✅ Schema matches — baselining existing migrations."
    echo "   (Existing migrations are recorded as applied; no SQL is re-run,"
    echo "    so current data is untouched.)"
    for m in prisma/migrations/*/; do
        name=$(basename "$m")
        [ "$name" = "migration_lock.toml" ] && continue
        npx prisma migrate resolve --applied "$name" >/dev/null 2>&1 || true
    done
    if run_migrate; then
        echo "✅ Database migrations completed successfully (baselined)"
        exit 0
    fi
    echo "❌ FATAL: migrations still failing after baseline."
    tail -30 /tmp/migrate-out.log || true
    exit 1
fi

if [ "$diff_rc" = "2" ] || grep -qE "^\[[-+]\]" /tmp/migrate-diff.log; then
    echo "❌ FATAL: Existing database has SCHEMA DRIFT — the live schema does"
    echo "   not match prisma/schema.prisma. Refusing to auto-baseline:"
    echo "   guessing here risks data loss."
    echo "   Back up first, then baseline manually per:"
    echo "   https://pris.ly/d/migrate-baseline"
    echo "   --- detected differences ---"
    grep -E "^\[[-+]\]|^  [-+]" /tmp/migrate-diff.log | head -30 || true
    exit 1
fi

echo "❌ FATAL: could not compare the live schema with the expected schema."
echo "   Refusing to continue."
head -40 /tmp/migrate-diff.log 2>/dev/null || true
exit 1
