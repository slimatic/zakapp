#!/usr/bin/env bash
# =============================================================================
# ZakApp Database Backup Script
# Usage: ./scripts/backup-db.sh [DB_PATH]
#
# Creates a timestamped backup of the SQLite database with integrity check
# and SHA-256 checksum. Safe to run before migrations or as a cron job.
#
# Exit codes:
#   0 - Success
#   1 - Database file not found
#   2 - Integrity check failed
#   3 - Backup copy failed
# =============================================================================

set -euo pipefail

# Resolve database path
if [ -n "${1:-}" ]; then
    DB_PATH="$1"
elif [ -n "${DATABASE_URL:-}" ]; then
    DB_PATH="${DATABASE_URL#file:}"
else
    DB_PATH="./prisma/data/prod.db"
fi

if [ ! -f "$DB_PATH" ]; then
    echo "❌ ERROR: Database not found at: $DB_PATH"
    exit 1
fi

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DB_BASENAME=$(basename "$DB_PATH")
DB_DIR=$(dirname "$DB_PATH")
BACKUP_NAME="${DB_BASENAME}.backup-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"
CHECKSUM_FILE="${BACKUP_PATH}.sha256"
MANIFEST_FILE="${BACKUP_DIR}/manifest.csv"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "🗄️  ZakApp Database Backup"
echo "=========================="
echo "Source:      $DB_PATH"
echo "Destination: $BACKUP_PATH"
echo ""

# Step 1: Integrity check before backup
echo "🔍 Running integrity check..."
INTEGRITY=$(sqlite3 "$DB_PATH" "PRAGMA integrity_check;" 2>&1)
if [ "$INTEGRITY" != "ok" ]; then
    echo "❌ INTEGRITY CHECK FAILED:"
    echo "$INTEGRITY"
    exit 2
fi
echo "✅ Database integrity: OK"

# Step 2: Get row counts for key tables (for verification after restore)
echo "📊 Recording row counts..."
ROW_COUNTS=$(sqlite3 -csv -header "$DB_PATH" "
    SELECT 'users' as tbl, COUNT(*) as cnt FROM users
    UNION ALL SELECT 'assets', COUNT(*) FROM assets
    UNION ALL SELECT 'liabilities', COUNT(*) FROM liabilities
    UNION ALL SELECT 'nisab_year_records', COUNT(*) FROM nisab_year_records
    UNION ALL SELECT 'payment_records', COUNT(*) FROM payment_records
    UNION ALL SELECT 'calculation_history', COUNT(*) FROM calculation_history
    UNION ALL SELECT 'calculation_snapshots', COUNT(*) FROM calculation_snapshots
    UNION ALL SELECT 'audit_trail_entries', COUNT(*) FROM audit_trail_entries
    UNION ALL SELECT 'user_sessions', COUNT(*) FROM user_sessions
    UNION ALL SELECT 'user_security', COUNT(*) FROM user_security
;" 2>&1)
echo "$ROW_COUNTS"

# Step 3: Create backup using SQLite's safe backup API
# (not a file copy — uses sqlite3_backup API which handles concurrent writes)
echo "📦 Creating backup..."
sqlite3 "$DB_PATH" ".backup '${BACKUP_PATH}'" 2>&1

if [ ! -f "$BACKUP_PATH" ]; then
    echo "❌ Backup file was not created!"
    exit 3
fi

# Step 4: Verify backup integrity
echo "🔍 Verifying backup integrity..."
BACKUP_INTEGRITY=$(sqlite3 "$BACKUP_PATH" "PRAGMA integrity_check;" 2>&1)
if [ "$BACKUP_INTEGRITY" != "ok" ]; then
    echo "❌ BACKUP INTEGRITY CHECK FAILED — backup may be corrupt!"
    rm -f "$BACKUP_PATH"
    exit 2
fi
echo "✅ Backup integrity: OK"

# Step 5: Generate checksum
echo "🔐 Generating SHA-256 checksum..."
SHA256=$(sha256sum "$BACKUP_PATH" | awk '{print $1}')
echo "$SHA256  $BACKUP_NAME" > "$CHECKSUM_FILE"
echo "   Checksum: $SHA256"

# Step 6: Get file sizes
SRC_SIZE=$(stat -c%s "$DB_PATH" 2>/dev/null || stat -f%z "$DB_PATH" 2>/dev/null)
BKP_SIZE=$(stat -c%s "$BACKUP_PATH" 2>/dev/null || stat -f%z "$BACKUP_PATH" 2>/dev/null)
SRC_SIZE_H=$(numfmt --to=iec "$SRC_SIZE" 2>/dev/null || echo "${SRC_SIZE}B")
BKP_SIZE_H=$(numfmt --to=iec "$BKP_SIZE" 2>/dev/null || echo "${BKP_SIZE}B")

# Step 7: Append to manifest
echo "${TIMESTAMP},${DB_PATH},${BACKUP_PATH},${SHA256},${SRC_SIZE},${BKP_SIZE},ok" >> "$MANIFEST_FILE"

echo ""
echo "✅ Backup complete!"
echo "   Source:  $DB_PATH ($SRC_SIZE_H)"
echo "   Backup:  $BACKUP_PATH ($BKP_SIZE_H)"
echo "   Checksum: $CHECKSUM_FILE"
echo "   Manifest: $MANIFEST_FILE"
echo ""
echo "To restore:  sqlite3 \"$DB_PATH\" \".restore '${BACKUP_PATH}'\""
echo "To verify:   sha256sum -c '$CHECKSUM_FILE'"
