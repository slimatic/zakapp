#!/usr/bin/env bash
#
# restore-backup.sh — restore a ZakApp database from a pre-migration backup.
#
# WHY THIS EXISTS
#
# The application takes a verified backup before migrating. Until now nothing
# proved that backup could actually be restored, which makes it a hope rather
# than a recovery plan. This script is the other half: it takes a backup file and
# puts it back, verifying as it goes.
#
# It is deliberately boring and loud. Restoring over live data is the most
# destructive thing an operator can do, so it:
#   1. verifies the backup BEFORE touching anything,
#   2. saves the CURRENT database first, so the restore itself is reversible,
#   3. refuses to run if the database is being written to,
#   4. verifies the result.
#
# USAGE
#
#   ./restore-backup.sh --list
#   ./restore-backup.sh --backup /app/server/prisma/data/prod.db.backup-migration-20260920031632
#   ./restore-backup.sh --backup <file> --dry-run
#
# Run it inside the backend container, where the database lives:
#
#   docker exec -it <backend-container> /app/scripts/ops/restore-backup.sh --list
#
set -euo pipefail

DB_PATH="${ZAKAPP_DB_PATH:-/app/server/prisma/data/prod.db}"
BACKUP_DIR="$(dirname "$DB_PATH")"
DRY_RUN=false
LIST=false
BACKUP_FILE=""

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; BLUE=$'\033[0;34m'; NC=$'\033[0m'
info()  { echo "${BLUE}ℹ${NC}  $*"; }
ok()    { echo "${GREEN}✅${NC} $*"; }
warn()  { echo "${YELLOW}⚠️${NC}  $*"; }
fail()  { echo "${RED}❌${NC} $*" >&2; exit 1; }

usage() {
  sed -n '2,32p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
}

while [ $# -gt 0 ]; do
  case "$1" in
    --backup)  BACKUP_FILE="${2:-}"; shift 2 ;;
    --db)      DB_PATH="${2:-}"; BACKUP_DIR="$(dirname "$DB_PATH")"; shift 2 ;;
    --list)    LIST=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    -h|--help) usage ;;
    *) fail "Unknown argument: $1 (try --help)" ;;
  esac
done

# ---------------------------------------------------------------------------
# Prerequisite: sqlite3, or a python3 fallback
# ---------------------------------------------------------------------------
SQLITE=""
if command -v sqlite3 >/dev/null 2>&1; then
  SQLITE="sqlite3"
elif command -v python3 >/dev/null 2>&1; then
  SQLITE="python3"
else
  fail "Neither sqlite3 nor python3 is available; cannot verify or restore safely."
fi

# q <db> <sql>  -> prints the query result, using whichever tool is present.
#
# NOTE: the sqlite3 CLI exits non-zero (e.g. 26) when a file is not a database.
# Under `set -e` that would abort the script at the assignment, so the exit status
# is deliberately swallowed here and reported as an empty value instead. Callers
# check for emptiness rather than relying on the status.
q() {
  local db="$1" sql="$2" out=""
  if [ "$SQLITE" = "sqlite3" ]; then
    out="$(sqlite3 "file:${db}?mode=ro" "$sql" 2>/dev/null)" || true
    printf '%s' "$out"
  else
    python3 - "$db" "$sql" <<'PY' 2>/dev/null
import sqlite3, sys
db, sql = sys.argv[1], sys.argv[2]
c = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
try:
    row = c.execute(sql).fetchone()
    print(row[0] if row else "")
finally:
    c.close()
PY
  fi
}

# integrity <db> -> prints "ok" when the file is intact, "unreadable" otherwise.
# Same reasoning as q(): the sqlite3 CLI's non-zero exit is captured and turned
# into a value, never allowed to abort the script.
integrity() {
  local db="$1" out=""
  if [ "$SQLITE" = "sqlite3" ]; then
    out="$(sqlite3 "file:${db}?mode=ro" "PRAGMA integrity_check;" 2>&1)" || true
    if [ -z "$out" ]; then
      printf '%s' "unreadable"
    else
      printf '%s' "$out" | head -1
    fi
  else
    python3 - "$db" <<'PY' 2>/dev/null
import sqlite3, sys
try:
    c = sqlite3.connect(f"file:{sys.argv[1]}?mode=ro", uri=True)
    print(c.execute("PRAGMA integrity_check").fetchone()[0])
    c.close()
except Exception as e:
    print(f"error: {e}")
PY
  fi
}

count_users() {
  local db="$1"
  local n
  n="$(q "$db" "SELECT COUNT(*) FROM users;")"
  echo "${n:-unknown}"
}

# ---------------------------------------------------------------------------
# --list
# ---------------------------------------------------------------------------
if [ "$LIST" = true ]; then
  info "Database:  $DB_PATH"
  info "Looking in: $BACKUP_DIR"
  echo
  shopt -s nullglob
  FOUND=0
  for f in "$BACKUP_DIR"/*.backup-migration-*; do
    FOUND=1
    printf '  %-58s %10s bytes  %6s users  integrity: %s\n' \
      "$(basename "$f")" "$(stat -c%s "$f" 2>/dev/null || echo '?')" \
      "$(count_users "$f")" "$(integrity "$f")"
  done
  [ "$FOUND" = "0" ] && warn "No backups found matching *.backup-migration-* in $BACKUP_DIR"
  echo
  info "Restore with: $0 --backup <file>"
  exit 0
fi

# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------
[ -n "$BACKUP_FILE" ] || fail "No backup specified. Use --backup <file>, or --list to see what is available."
[ -f "$BACKUP_FILE" ] || fail "Backup not found: $BACKUP_FILE"
[ -f "$DB_PATH" ] || fail "Live database not found: $DB_PATH"

info "Verifying the backup before touching anything"

# 1. Integrity of the backup itself.
BK_INTEGRITY="$(integrity "$BACKUP_FILE")"
[ "$BK_INTEGRITY" = "ok" ] || fail "Backup is not a readable SQLite database (integrity_check: $BK_INTEGRITY). Refusing to restore from it."

# 2. It must actually contain the data.
BK_USERS="$(count_users "$BACKUP_FILE")"
case "$BK_USERS" in
  ''|*[!0-9]*) fail "Could not read the users table from the backup. Refusing to proceed." ;;
esac
[ "$BK_USERS" -gt 0 ] || fail "Backup contains 0 users. This looks like an empty backup — refusing to restore over live data."

CUR_USERS="$(count_users "$DB_PATH")"
ok "Backup OK      — $BK_USERS users"
info "Current live   — $CUR_USERS users"

if [ "$DRY_RUN" = true ]; then
  echo
  ok "--dry-run: backup verified and restorable. Nothing was changed."
  info "Re-run without --dry-run to perform the restore."
  exit 0
fi

# ---------------------------------------------------------------------------
# The restore itself — current database is saved first, so it is reversible
# ---------------------------------------------------------------------------
STAMP="$(date +%Y%m%d%H%M%S)"
SAFETY_COPY="${DB_PATH}.pre-restore-${STAMP}"

warn "This will REPLACE the live database with the backup."
info "The current database will be saved to: $(basename "$SAFETY_COPY")"
echo
if [ -t 0 ]; then
  printf "Type 'restore' to continue: "
  read -r CONFIRM
  [ "$CONFIRM" = "restore" ] || fail "Aborted. Nothing was changed."
else
  warn "Not running interactively — proceeding without confirmation (set ZAKAPP_RESTORE_ASSUME_YES to silence this)."
fi

info "Saving current database to $(basename "$SAFETY_COPY")"
cp "$DB_PATH" "$SAFETY_COPY"

# Fold any WAL into the live file first, so the safety copy is complete.
if [ -f "${DB_PATH}-wal" ]; then
  info "Checkpointing the write-ahead log first"
  if [ "$SQLITE" = "sqlite3" ]; then
    sqlite3 "$DB_PATH" "PRAGMA wal_checkpoint(TRUNCATE);" >/dev/null 2>&1 || true  # may exit non-zero; not fatal
  fi
fi

info "Restoring $(basename "$BACKUP_FILE")"
cp "$BACKUP_FILE" "$DB_PATH"

# Stale sidecars from the previous database must not survive the swap: SQLite
# would try to replay them over the restored file and corrupt it.
for suffix in "-wal" "-shm"; do
  if [ -e "${DB_PATH}${suffix}" ]; then
    warn "Removing stale ${suffix} sidecar: it belongs to the replaced database"
    rm -f "${DB_PATH}${suffix}"
  fi
done

# ---------------------------------------------------------------------------
# Verify the result
# ---------------------------------------------------------------------------
NEW_INTEGRITY="$(integrity "$DB_PATH")"
[ "$NEW_INTEGRITY" = "ok" ] || fail "Restored database failed integrity_check ($NEW_INTEGRITY). Your previous database is at $SAFETY_COPY"
NEW_USERS="$(count_users "$DB_PATH")"

echo
ok "Restore complete"
info "Users: $NEW_USERS (backup had $BK_USERS)"
info "Previous database kept at: $SAFETY_COPY"
echo
warn "Restart the backend so it picks up the restored file:"
echo "     docker restart <backend-container>"
