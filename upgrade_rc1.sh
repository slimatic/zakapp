#!/usr/bin/env bash
set -euo pipefail

# upgrade_rc1.sh
# Safe upgrade script for rc-1 release candidate.
# Actions:
#  - create timestamped backup (db file + env files)
#  - pull & build docker images
#  - run migrations
#  - restart using ./scripts/docker-start.sh
#  - optionally run re-encrypt migration script (requires ENCRYPTION_OLD_KEYS and ENCRYPTION_KEY_NEW)

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
TS=$(date -u +%Y%m%dT%H%M%SZ)
BACKUP_DIR="$ROOT_DIR/backups/upgrade_rc1_$TS"
mkdir -p "$BACKUP_DIR"

echo "Upgrade RC1 starting: backup -> $BACKUP_DIR"

# Backup .env files
for f in .env .env.docker .env.production .env.staging; do
  if [ -f "$ROOT_DIR/$f" ]; then
    cp "$ROOT_DIR/$f" "$BACKUP_DIR/$(basename $f).bak"
    echo "Backed up $f"
  fi
done

# Backup SQLite DB if present (common in dev)
if [ -f "$ROOT_DIR/server/prisma/dev.db" ]; then
  cp "$ROOT_DIR/server/prisma/dev.db" "$BACKUP_DIR/dev.db.bak"
  echo "Backed up SQLite dev.db"
fi

echo "Creating Prisma dump if possible..."
if command -v npx >/dev/null 2>&1; then
  # Try to run prisma db pull/dump inside project if configured
  if [ -f "$ROOT_DIR/server/prisma/schema.prisma" ]; then
    echo "Running prisma db pull (no-op if not applicable)"
    (cd "$ROOT_DIR/server" && npx prisma db pull) || true
  fi
fi

echo "Pulling and building docker images"
docker compose pull --quiet || true
docker compose build --no-cache

echo "Running migrations inside container"
# Prefer running prisma migrate deploy inside the server container if defined
if docker compose ps -q server >/dev/null 2>&1; then
  docker compose run --rm server sh -c "npm run migrate || npx prisma migrate deploy || true"
else
  # Fall back to running migrations locally (best effort)
  if [ -f "$ROOT_DIR/server/package.json" ]; then
    (cd "$ROOT_DIR/server" && npm ci --silent && npm run migrate) || true
  fi
fi

echo "Restarting services using scripts/docker-start.sh"
if [ -x "$ROOT_DIR/scripts/docker-start.sh" ]; then
  "$ROOT_DIR/scripts/docker-start.sh"
else
  echo "scripts/docker-start.sh not executable; attempting docker compose up -d"
  docker compose up -d
fi

RE_ENCRYPT=0
if [ "${1:-}" = "--reencrypt-apply" ]; then
  RE_ENCRYPT=1
fi

if [ "$RE_ENCRYPT" -eq 1 ]; then
  echo "Running re-encrypt migration (apply mode). Ensure ENCRYPTION_OLD_KEYS and ENCRYPTION_KEY_NEW are set in the environment."
  if [ -z "${ENCRYPTION_OLD_KEYS:-}" ] || [ -z "${ENCRYPTION_KEY_NEW:-}" ]; then
    echo "ERROR: ENCRYPTION_OLD_KEYS or ENCRYPTION_KEY_NEW not set. Aborting re-encrypt." >&2
    exit 4
  fi
  echo "Starting re-encrypt (apply)"
  node "$ROOT_DIR/server/scripts/migrate-reencrypt-payments.js" --apply
else
  echo "Skipping re-encrypt. To run, re-run with --reencrypt-apply and set ENCRYPTION_OLD_KEYS and ENCRYPTION_KEY_NEW."
  echo "You can run a dry-run locally via: ENCRYPTION_OLD_KEYS=old1,old2 ENCRYPTION_KEY_NEW=new node server/scripts/migrate-reencrypt-payments.js"
fi

echo "Upgrade RC1 complete. Backups at: $BACKUP_DIR"
