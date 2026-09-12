#!/usr/bin/env bash
# backup-before-upgrade.sh — pre-deploy data safety backup for ZakApp
# Run on the production host BEFORE any `docker compose up -d` with new images.
# Backs up: SQLite prod DB (backend_data volume), CouchDB data, compose + env config.
#
# Usage: run on the deployment host from the service directory, e.g.
#   cd ~/umbrel/slimatic/services/app.zakapp.org && bash backup-before-upgrade.sh
#
# Exits non-zero if the DB dump fails, so it can gate a deploy pipeline.
set -euo pipefail

STAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="${ZAKAPP_BACKUP_DIR:-$HOME/backups/zakapp-upgrades}"
mkdir -p "$BACKUP_DIR"

# Resolve docker group (Umbrel quirk: umbrel user may need sg docker)
RUN_DOCKER() {
    if docker info >/dev/null 2>&1; then "$@"; else sg docker -c "$*"; fi
}

echo "==> ZakApp pre-upgrade backup $STAMP"

# 1. Config + env
if [ -f .env ] ; then
    tar czf "$BACKUP_DIR/zakapp-config-$STAMP.tar.gz" .env docker-compose.yml 2>/dev/null || true
fi

# 2. SQLite backend DB (via temporary alpine container mounting the volume)
echo "==> Backing up backend_data (SQLite)..."
RUN_DOCKER "docker run --rm -v appzakapporg_backend_data:/data:ro -v $BACKUP_DIR:/backup alpine tar czf /backup/zakapp-sqlite-$STAMP.tar.gz -C /data ."

# 3. CouchDB data
echo "==> Backing up couchdb_data..."
RUN_DOCKER "docker run --rm -v appzakapporg_couchdb_data:/data:ro -v $BACKUP_DIR:/backup alpine tar czf /backup/zakapp-couchdb-$STAMP.tar.gz -C /data ."

# 4. Verify the SQLite backup is non-trivial in size
SIZE=$(stat -c%s "$BACKUP_DIR/zakapp-sqlite-$STAMP.tar.gz" 2>/dev/null || echo 0)
if [ "$SIZE" -lt 1000 ]; then
    echo "FATAL: SQLite backup appears empty ($SIZE bytes). Aborting — do not deploy."
    exit 1
fi

echo "✅ Backups written to $BACKUP_DIR:"
ls -lh "$BACKUP_DIR" | grep "$STAMP"
# 5. Rotation — keep ONLY the latest backup set (rollback anchor).
# Policy (Slim, 2026-09-12): one recent backup is enough for rollback; older
# sets are pruned so $BACKUP_DIR never grows unbounded. Files written by THIS
# run are kept; zakapp-* files from previous runs are removed.
keep_n=3  # newest config + sqlite + couchdb from this run
ls -t "$BACKUP_DIR"/zakapp-* 2>/dev/null | tail -n +$((keep_n + 1)) | while read -r f; do
    rm -f "$f"
    echo "   pruned old backup: $(basename "$f")"
done

echo "Deploy may proceed."