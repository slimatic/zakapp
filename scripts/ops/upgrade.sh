#!/usr/bin/env bash
# upgrade.sh — safe ZakApp upgrade with a guaranteed path off unmigrated SQLite.
#
# WHY THIS EXISTS
# Before v0.16.3 the backend container had no working startup guard and the
# `migrations` service ran a bare `prisma migrate deploy`. On a database that
# predates migration history (`_prisma_migrations` absent), that exits P3005
# and the stack never comes up — an operator upgrading would be locked out of
# their own data.
#
# From v0.16.3 the entrypoint and /migrate-only.sh auto-baseline such databases,
# but ONLY after proving the live schema matches prisma/schema.prisma. This
# script is the operator-facing wrapper: it backs up first, reports what will
# happen, then deploys and verifies. The auto-baseline is the deploy-time
# behaviour; this script makes it visible, reviewable and recoverable.
#
# Usage (on the deployment host, from the compose directory):
#   bash upgrade.sh              # full upgrade (backup -> pull -> up -> verify)
#   bash upgrade.sh --dry-run    # report only: migration state, drift, no changes
#   bash upgrade.sh --no-pull    # use locally-present images
#
# Exit codes: 0 ok · 1 failure (investigate; backups are in $BACKUP_DIR)
set -uo pipefail

BACKUP_SCRIPT="${BACKUP_SCRIPT:-$HOME/scripts/ops/backup-before-upgrade.sh}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
HEALTH_URL="${HEALTH_URL:-http://localhost/health}"
BACKEND_VOLUME="${BACKEND_VOLUME:-appzakapporg_backend_data}"
DB_IN_VOLUME="${DB_IN_VOLUME:-prod.db}"
DRY_RUN=false
DO_PULL=true

for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=true ;;
        --no-pull) DO_PULL=false ;;
        -h|--help) sed -n '2,25p' "$0"; exit 0 ;;
        *) echo "Unknown arg: $arg"; exit 2 ;;
    esac
done

c_ok()   { printf '\033[32m%s\033[0m\n' "$*"; }
c_warn() { printf '\033[33m%s\033[0m\n' "$*"; }
c_err()  { printf '\033[31m%s\033[0m\n' "$*" >&2; }
step()   { printf '\n\033[1m==> %s\033[0m\n' "$*"; }

# Umbrel quirk: the umbrel user may need `sg docker -c` for socket access.
RUN_DOCKER() {
    if docker info >/dev/null 2>&1; then "$@"; else sg docker -c "$*"; fi
}

if [ ! -f "$COMPOSE_FILE" ]; then
    c_err "Compose file not found: $COMPOSE_FILE (run from the deployment directory)"
    exit 1
fi

# ---------------------------------------------------------------------------
step "1/6  Preflight: database state"
# ---------------------------------------------------------------------------
# Detect whether this instance is on the unmigrated path BEFORE we touch
# anything, so the operator knows what the upgrade will do.
STATE="unknown"
PROBE=$(RUN_DOCKER "docker run --rm -v ${BACKEND_VOLUME}:/data:ro alpine sh -c 'if [ -f /data/${DB_IN_VOLUME} ]; then echo HAVE_DB; else echo NO_DB; fi' 2>/dev/null" | tr -d '\r')

if echo "$PROBE" | grep -q "NO_DB"; then
    STATE="fresh"
    echo "No existing database found in ${BACKEND_VOLUME}."
    echo "This is a FRESH INSTALL — migrations will be applied normally."
elif echo "$PROBE" | grep -q "HAVE_DB"; then
    # Does the DB have Prisma's migration history table?
    HAS_TABLE=$(RUN_DOCKER "docker run --rm -v ${BACKEND_VOLUME}:/data:ro alpine sh -c \"grep -c _prisma_migrations /data/${DB_IN_VOLUME} 2>/dev/null || echo 0\"" 2>/dev/null | tr -d '\r' | tail -1)
    if [ "${HAS_TABLE:-0}" = "0" ]; then
        STATE="unmigrated"
        c_warn "EXISTING DATABASE WITHOUT MIGRATION HISTORY detected."
        echo "  This is the P3005 case. Prior releases would have failed here and"
        echo "  left you locked out. On v0.16.3+ the deploy will auto-baseline it:"
        echo "    - verify the live schema matches prisma/schema.prisma"
        echo "    - record existing migrations as applied WITHOUT re-running their SQL"
        echo "    - refuse to proceed if the schema has drifted"
        echo "  Your data is not rewritten either way. A backup is taken next."
    else
        STATE="migrated"
        echo "Existing database WITH migration history — normal upgrade path."
    fi
else
    c_warn "Could not determine database state (volume missing, or docker access denied)."
    echo "Continuing — the backup step will still run."
fi

if $DRY_RUN; then
    step "Dry run: stopping here (no changes made)"
    echo "Re-run without --dry-run to upgrade."
    exit 0
fi

# ---------------------------------------------------------------------------
step "2/6  Backup (rollback anchor)"
# ---------------------------------------------------------------------------
if [ -x "$BACKUP_SCRIPT" ] || [ -f "$BACKUP_SCRIPT" ]; then
    if ! bash "$BACKUP_SCRIPT"; then
        c_err "Backup FAILED — refusing to upgrade. Fix backup first."
        exit 1
    fi
    c_ok "Backup complete."
else
    c_warn "Backup script not found at $BACKUP_SCRIPT — skipping."
    c_warn "Set BACKUP_SCRIPT=... to point at scripts/ops/backup-before-upgrade.sh."
    if [ "${ALLOW_NO_BACKUP:-0}" != "1" ]; then
        c_err "Refusing to upgrade without a backup. Set ALLOW_NO_BACKUP=1 to override."
        exit 1
    fi
fi

# ---------------------------------------------------------------------------
step "3/6  Fetch images"
# ---------------------------------------------------------------------------
if $DO_PULL; then
    RUN_DOCKER "docker compose -f ${COMPOSE_FILE} pull" || c_warn "pull reported an issue (continuing)"
else
    echo "Skipped (--no-pull)."
fi

# ---------------------------------------------------------------------------
step "4/6  Deploy (migrations run first, then backend)"
# ---------------------------------------------------------------------------
# `migrations` must reach service_completed_successfully before `backend`
# starts — that ordering is in the compose file.
if ! RUN_DOCKER "docker compose -f ${COMPOSE_FILE} up -d"; then
    c_err "compose up failed."
    echo "Inspect: docker compose -f ${COMPOSE_FILE} logs migrations backend"
    echo "Rollback: restore the newest set in \$ZAKAPP_BACKUP_DIR (see docs/UPGRADING.md)."
    exit 1
fi

# ---------------------------------------------------------------------------
step "5/6  Verify migration service"
# ---------------------------------------------------------------------------
sleep 8
MIG_LOG=$(RUN_DOCKER "docker compose -f ${COMPOSE_FILE} logs --no-color migrations 2>&1" | tail -40)
echo "$MIG_LOG"

if echo "$MIG_LOG" | grep -q "SCHEMA DRIFT"; then
    c_err "Schema drift detected — the deploy refused to baseline, by design."
    echo "Your data is untouched and the backup from step 2 is intact."
    echo "See docs/UPGRADING.md -> 'Manual baseline' for the explicit path."
    exit 1
fi
if echo "$MIG_LOG" | grep -qiE "FATAL"; then
    c_err "Migrations reported FATAL. Data is untouched; backup is in place."
    echo "See docs/UPGRADING.md."
    exit 1
fi
c_ok "Migration service completed."

# ---------------------------------------------------------------------------
step "6/6  Verify health"
# ---------------------------------------------------------------------------
for i in $(seq 1 12); do
    CODE=$(curl -s -o /dev/null -w '%{http_code}' "$HEALTH_URL" 2>/dev/null || echo 000)
    case "$CODE" in
        2*|3*) c_ok "Health OK ($HEALTH_URL -> $CODE)"; break ;;
        *) echo "  waiting... ($CODE)"; sleep 5 ;;
    esac
    if [ "$i" = "12" ]; then
        c_err "Health check did not pass after 60s."
        echo "Inspect: docker compose -f ${COMPOSE_FILE} logs backend"
        echo "Rollback: see docs/UPGRADING.md"
        exit 1
    fi
done

printf '\n'
c_ok "Upgrade complete. Database state was: ${STATE}"
echo "Rollback anchor: \$ZAKAPP_BACKUP_DIR (see backup script output above)."
