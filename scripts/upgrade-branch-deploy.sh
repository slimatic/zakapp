#!/usr/bin/env bash
# scripts/upgrade-branch-deploy.sh
# Safe branch upgrade + docker-compose redeploy with backups
#
# Usage:
#   ./scripts/upgrade-branch-deploy.sh -b 001-encryption-remediation
#   ./scripts/upgrade-branch-deploy.sh -b 001-encryption-remediation --dry-run
#   ./scripts/upgrade-branch-deploy.sh -b 001-encryption-remediation --no-db-backup

set -euo pipefail
IFS=$'\n\t'

# Defaults
TARGET_BRANCH="001-encryption-remediation"
BACKUP_ROOT="backups"
DRY_RUN=false
DB_BACKUP=true
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_CMD="docker compose" # adjust to 'docker-compose' if your host uses it

# Helpers
log() { echo -e "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"; }
run_or_echo() {
  if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY] $*"
  else
    eval "$*"
  fi
}

usage() {
  cat <<EOF
Usage: $0 [-b branch] [--dry-run] [--no-db-backup] [-h]
  -b BRANCH         Target branch to deploy (default: $TARGET_BRANCH)
  --dry-run         Show steps without executing them
  --no-db-backup    Skip copying the SQLite DB files (if you prefer)
  -h                Show this help
EOF
  exit 1
}

# Parse args
while [ "$#" -gt 0 ]; do
  case "$1" in
    -b) TARGET_BRANCH="$2"; shift 2;;
    --dry-run) DRY_RUN=true; shift;;
    --no-db-backup) DB_BACKUP=false; shift;;
    -h) usage;;
    *) echo "Unknown arg: $1"; usage;;
  esac
done

cd "$REPO_ROOT"

# Preflight checks
if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker is not installed or not in PATH." >&2
  exit 1
fi

if ! $COMPOSE_CMD version >/dev/null 2>&1; then
  echo "Error: '$COMPOSE_CMD' failed (ensure docker compose is installed and in PATH)." >&2
  exit 1
fi

# Ensure working tree is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "Git working tree is not clean. Please commit or stash local changes before running this script."
  git status --porcelain
  exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
REV_BEFORE="$(git rev-parse --verify HEAD)"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="${BACKUP_ROOT}/upgrade_${TIMESTAMP}_${CURRENT_BRANCH}_to_${TARGET_BRANCH}"
mkdir -p "$BACKUP_DIR"

log "1) Backing up repository (excluding node_modules, dist, .git) to: $BACKUP_DIR"
run_or_echo "mkdir -p \"$BACKUP_DIR\""
run_or_echo "tar -czf \"$BACKUP_DIR/repo_files_${TIMESTAMP}.tar.gz\" --exclude='./node_modules' --exclude='./client/node_modules' --exclude='./server/node_modules' --exclude='./dist' --exclude='./.git' ."

# Save compose config, docker container & image lists
log "2) Snapshotting compose config and docker runtime state"
run_or_echo "$COMPOSE_CMD config > \"$BACKUP_DIR/docker-compose.config.$TIMESTAMP.yaml\" || true"
run_or_echo "docker ps --no-trunc --format '{{.ID}} {{.Image}} {{.Names}}' > \"$BACKUP_DIR/docker-containers.$TIMESTAMP.txt\" || true"
run_or_echo "docker images --format '{{.Repository}}:{{.Tag}} {{.ID}}' > \"$BACKUP_DIR/docker-images.$TIMESTAMP.txt\" || true"

# Backup .env.docker (do NOT change it)
if [ -f .env.docker ]; then
  log "3) Backing up .env.docker (unchanged by this script)"
  run_or_echo "cp -p .env.docker \"$BACKUP_DIR/.env.docker.$TIMESTAMP\" || true"
else
  log "Note: .env.docker not found in repository root - continuing"
fi

# Database backup (Prisma sqlite file(s))
if [ "$DB_BACKUP" = "true" ]; then
  log "4) Backing up Prisma DB files (server/prisma/data/*.db)"
  if ls server/prisma/data/*.db >/dev/null 2>&1; then
    run_or_echo "mkdir -p \"$BACKUP_DIR/prisma_data\""
    run_or_echo "cp -p server/prisma/data/*.db \"$BACKUP_DIR/prisma_data/\" || true"
  else
    log "No SQLite DB files found under server/prisma/data; skipping DB copy"
  fi
fi

# Save current branch to allow rollback
ROLLBACK_INFO="$BACKUP_DIR/rollback-info.txt"
run_or_echo "echo \"PREVIOUS_BRANCH=${CURRENT_BRANCH}\" > \"$ROLLBACK_INFO\""
run_or_echo "echo \"PREVIOUS_REV=${REV_BEFORE}\" >> \"$ROLLBACK_INFO\""
run_or_echo "echo \"BACKUP_DIR=${BACKUP_DIR}\" >> \"$ROLLBACK_INFO\""

log "5) Fetching remote branches"
run_or_echo "git fetch --prune origin"

# Check if branch exists remotely
if git ls-remote --heads origin "$TARGET_BRANCH" | grep -q "$TARGET_BRANCH"; then
  log "Target branch '$TARGET_BRANCH' found on origin"
else
  log "Target branch '$TARGET_BRANCH' not found on origin. Aborting."
  exit 1
fi

log "6) Checking out target branch '$TARGET_BRANCH' and resetting to origin/$TARGET_BRANCH"
run_or_echo "git checkout -B \"$TARGET_BRANCH\" \"origin/$TARGET_BRANCH\""

# Graceful container stop & rebuild
log "7) Bringing down current compose stack (will stop containers) — and building/updating images for new branch"
run_or_echo "$COMPOSE_CMD down --remove-orphans"

# Build and start with the same compose file(s) and existing env file
run_or_echo "$COMPOSE_CMD up -d --build"

log "8) Wait a little for services to initialize (sleep 6s) and then show latest logs for backend"
run_or_echo "sleep 6"
run_or_echo "$COMPOSE_CMD ps --services --filter \"status=running\" || true"
run_or_echo "$COMPOSE_CMD logs backend --tail=200 > \"$BACKUP_DIR/backend-post-deploy.log\" || true"
log "Deployment complete (logs saved to $BACKUP_DIR/backend-post-deploy.log)."

cat <<EOF
========================================
Done.
- Backup dir: $BACKUP_DIR
- To rollback to previous revision:
    cd $REPO_ROOT
    git fetch origin
    git checkout "$CURRENT_BRANCH"   # or use PREVIOUS_REV in $ROLLBACK_INFO
    $COMPOSE_CMD down
    $COMPOSE_CMD up -d --build

Notes:
- This script does NOT modify .env.docker or docker-compose.yml files.
- Migration steps: If you need to run DB migrations (Prisma), run:
    $COMPOSE_CMD exec backend npx prisma migrate deploy
  or run your usual migration command inside backend container after deploy.
- Run in a tmux/screen session to avoid lost connections during long builds.
- Use --dry-run to verify actions without executing them.
========================================
EOF
