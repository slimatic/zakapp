#!/usr/bin/env bash
# Safe Docker Compose migration + data-migration helper runner
# Usage:
#   ./scripts/ops/docker-compose-migrate.sh            # dry-run migrations + data-migration
#   ./scripts/ops/docker-compose-migrate.sh --apply   # apply migrations + data migration (destructive step)
#   COMPOSE_FILE=docker-compose.staging.yml ./scripts/... --apply
#
# Safety: The script creates on-host backups first. Data-migration helper is run in dry-run by default.
set -euo pipefail

# Defaults
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
BACKUP_DIR="${BACKUP_DIR:-backups/migrations-$(date +%F_%H%M%S)}"
APPLY=false
FORCE_PUSH=false
NONINTERACTIVE=false
HEALTH_PORT="${HEALTH_PORT:-3001}"

# Helpers
info() { printf "\e[34m[INFO]\e[0m %s\n" "$*"; }
warn() { printf "\e[33m[WARN]\e[0m %s\n" "$*"; }
err()  { printf "\e[31m[ERROR]\e[0m %s\n" "$*" >&2; }

usage() {
  cat <<EOF
Usage: $0 [--apply] [--force-push] [--non-interactive]
  --apply            Run the data-migration helper after successful schema migrations (destructive)
  --force-push       If migrate deploy fails, fallback to 'prisma db push --accept-data-loss' (dangerous)
  --non-interactive  Don't prompt for confirmation (use with care)
Environment:
  COMPOSE_FILE       Use alternate compose file (default: $COMPOSE_FILE)
  BACKUP_DIR         Where backups are stored (default: ${BACKUP_DIR})
  HEALTH_PORT        Host port to use for backend health check (default: ${HEALTH_PORT})
EOF
  exit 1
}

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply) APPLY=true; shift;;
    --force-push) FORCE_PUSH=true; shift;;
    --non-interactive) NONINTERACTIVE=true; shift;;
    -h|--help) usage;;
    *) err "Unknown arg: $1"; usage;;
  esac
done

# Confirm interactive intent when applying
if $APPLY && ! $NONINTERACTIVE; then
  printf "\n*** You are about to APPLY the data migration and potentially modify production data. ***\n"
  read -r -p "Proceed with APPLY? Type 'yes' to continue: " resp
  if [[ "$resp" != "yes" ]]; then
    err "Aborted by user."
    exit 2
  fi
fi

mkdir -p "$BACKUP_DIR"
info "Using compose file: $COMPOSE_FILE"
info "Backups will be placed in: $BACKUP_DIR"

info "Bringing up services (detached)..."
docker compose -f "$COMPOSE_FILE" up -d

# Determine backend & db containers
BACKEND_CONTAINER="$(docker compose -f "$COMPOSE_FILE" ps -q backend || true)"
DB_CONTAINER="$(docker compose -f "$COMPOSE_FILE" ps -q db || true)"

# Backup DB: prefer Postgres if db container exists, else attempt SQLite file from backend
if [[ -n "$DB_CONTAINER" ]]; then
  info "Found DB container (assumed Postgres): $DB_CONTAINER"
  POSTGRES_USER="${POSTGRES_USER:-postgres}"
  POSTGRES_DB="${POSTGRES_DB:-postgres}"

  info "Creating Postgres logical dump inside container..."
  docker compose -f "$COMPOSE_FILE" exec -T db sh -c "pg_dump -U \"${POSTGRES_USER}\" -F c \"${POSTGRES_DB}\" -f /tmp/zakapp_pre_migration.dump"
  docker cp "$DB_CONTAINER":/tmp/zakapp_pre_migration.dump "$BACKUP_DIR"/zakapp_pre_migration_$(date +%F_%H%M%S).dump
  docker compose -f "$COMPOSE_FILE" exec -T db sh -c "rm -f /tmp/zakapp_pre_migration.dump"
  info "Postgres dump saved to $BACKUP_DIR"
else
  if [[ -n "$BACKEND_CONTAINER" ]]; then
    info "DB container not found; attempting SQLite backup from backend container: $BACKEND_CONTAINER"
    SQLITE_PATHS=(
      "/app/prisma/data/dev.db"
      "/usr/src/app/prisma/data/dev.db"
      "/app/prisma/dev.db"
    )
    SQLITE_FOUND=false
    for p in "${SQLITE_PATHS[@]}"; do
      if docker compose -f "$COMPOSE_FILE" exec -T backend sh -c "[ -f '$p' ] && echo exists || true" | grep -q 'exists'; then
        docker cp "$BACKEND_CONTAINER":"$p" "$BACKUP_DIR"/dev.db.bak
        info "Copied SQLite DB $p to $BACKUP_DIR/dev.db.bak"
        SQLITE_FOUND=true
        break
      fi
    done
    if ! $SQLITE_FOUND; then
      warn "Could not find a known SQLite DB path inside backend. Skipping file backup. Ensure you have backups for your DB."
    fi
  else
    warn "Neither db nor backend containers found. Ensure your compose services include 'db' or 'backend'."
  fi
fi

# Verify backup existence
if [[ -z "$(ls -A "$BACKUP_DIR")" ]]; then
  err "No backup files were created in $BACKUP_DIR. Aborting."
  exit 3
fi
info "Backups created. Proceeding with migration steps."

# Generate Prisma client
info "Generating Prisma client inside backend..."
docker compose -f "$COMPOSE_FILE" exec -T backend npx prisma generate

# Apply recorded migrations (preferred)
info "Applying Prisma migrations with 'npx prisma migrate deploy'..."
set +e
docker compose -f "$COMPOSE_FILE" exec -T backend npx prisma migrate deploy
MIGRATE_RC=$?
set -e

if [[ $MIGRATE_RC -ne 0 ]]; then
  warn "'prisma migrate deploy' failed (rc=$MIGRATE_RC)."
  if $FORCE_PUSH; then
    warn "FORCE_PUSH enabled: attempting 'npx prisma db push --accept-data-loss' (DANGEROUS)"
    docker compose -f "$COMPOSE_FILE" exec -T backend npx prisma db push --accept-data-loss
  else
    err "Migrations did not apply. Rerun with --force-push to fallback to db push (not recommended). Aborting."
    exit 4
  fi
fi

# Dry-run data-migration helper
info "Running data-migration helper in dry-run mode (output will be inside backend container or mounted volumes)."
docker compose -f "$COMPOSE_FILE" exec -T backend npx ts-node --transpile-only prisma/migrations/migrate-snapshots-to-nisab.ts --dry-run || warn "Dry-run returned non-zero (check logs)."

# Copy dry-run outputs (if any) from container to host backups dir (best-effort)
if [[ -n "$BACKEND_CONTAINER" ]]; then
  POSSIBLE_OUTPUT_DIRS=(/app/prisma/migrations/output /usr/src/app/prisma/migrations/output /app/prisma/migrations/output)
  for od in "${POSSIBLE_OUTPUT_DIRS[@]}"; do
    if docker compose -f "$COMPOSE_FILE" exec -T backend sh -c "[ -d '$od' ] && echo dir || true" | grep -q 'dir'; then
      docker cp "$BACKEND_CONTAINER":"$od" "$BACKUP_DIR"/migration_helper_output || true
      info "Copied migration helper output from $od to $BACKUP_DIR/migration_helper_output"
      break
    fi
  done
fi

# If user requested apply, run the helper without --dry-run
if $APPLY; then
  info "Applying data migrations (helper) inside backend..."
  docker compose -f "$COMPOSE_FILE" exec -T backend npx ts-node --transpile-only prisma/migrations/migrate-snapshots-to-nisab.ts || {
    err "Data migration helper failed. Restore from backup if necessary."
    exit 5
  }
  info "Data migration helper completed."
else
  info "Dry-run complete. No data changes applied. Re-run with --apply when ready (after verifying backups and dry-run output)."
fi

# Post-check: attempt simple health check via host if backend exposes port
info "Attempting health check (host). If backend isn't exposed on localhost, run your own checks."
if curl -sSf "http://localhost:${HEALTH_PORT}/health" >/dev/null 2>&1; then
  info "Health check OK at http://localhost:${HEALTH_PORT}/health"
else
  warn "Health check failed or backend not exposed at http://localhost:${HEALTH_PORT}/health. Verify service manually."
fi

info "Migration process finished. Backups and outputs are in: $BACKUP_DIR"
