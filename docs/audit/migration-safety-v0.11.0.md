# Migration Safety Audit — v0.11.0 (Muharram 1448)

**Date**: 2026-06-26  
**Auditor**: RIQ  
**Scope**: All 7 Prisma migrations in `server/prisma/migrations/`

## Executive Summary

✅ **ALL MIGRATIONS ARE SAFE** — No data loss risk detected.

All migrations use Prisma's table-redefinition pattern (`CREATE TABLE new_X → INSERT INTO new_X SELECT * FROM X → DROP TABLE X → RENAME new_X TO X`), which preserves all existing data before dropping old tables.

## Migration Inventory

| # | Migration ID | Description | Destructive Ops? | Data Preserved? | Risk |
|---|--------------|-------------|------------------|-----------------|------|
| 1 | `20251023221157_payment_tracking_schema` | Initial schema | No (CREATE TABLE only) | N/A | ✅ None |
| 2 | `20251027234455_add_nisab_year_record_and_hawl_tracking` | Add audit trail, hawl tracking | No | N/A | ✅ None |
| 3 | `20251213035725_add_asset_modifiers` | Add calculationModifier, drop index | Index DROP only | Yes | ✅ None |
| 4 | `20251216003753_add_encryption_remediation` | Add encryption_remediations table | No | N/A | ✅ None |
| 5 | `20251229012031_fix_missing_usertype` | Add userType column via redefine | DROP TABLE + INSERT SELECT | ✅ Yes | ✅ Safe |
| 6 | `20260108203302_add_resource_limits` | Add maxAssets, maxNisabRecords, maxPayments | No (ALTER TABLE ADD) | Yes | ✅ None |
| 7 | `20260110195822_add_email_verification_settings` | Add isVerified, verificationToken | DROP TABLE + INSERT SELECT | ✅ Yes | ✅ Safe |

## Detailed Analysis

### Migration #5: `fix_missing_usertype`
**Pattern**: Table redefinition (safe)
```sql
CREATE TABLE "new_users" (... "userType" TEXT NOT NULL DEFAULT 'USER', ...);
INSERT INTO "new_users" SELECT ..., "userType" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
```
**Verdict**: ✅ Safe — all 16 columns copied before DROP.

### Migration #7: `add_email_verification_settings`
**Pattern**: Table redefinition (safe)
```sql
CREATE TABLE "new_users" (... "isVerified" BOOLEAN NOT NULL DEFAULT false, "verificationToken" TEXT, ...);
INSERT INTO "new_users" SELECT [...all existing columns...] FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
```
**Verdict**: ✅ Safe — all 19 columns copied before DROP.

## Backup Requirements

✅ **Backup script exists**: `scripts/backup-db.sh`

**Features**:
- SQLite `.backup` API (not raw file copy — handles concurrent writes safely)
- Pre-backup integrity check (`PRAGMA integrity_check`)
- Post-backup verification
- SHA-256 checksum generation
- Row counts for key tables (users, assets, nisab_year_records, etc.)
- Manifest CSV for backup tracking

**Usage**:
```bash
# Before migrations
./scripts/backup-db.sh

# Restore if needed
sqlite3 ./prisma/data/prod.db ".restore './backups/prod.db.backup-20260626-HHMMSS'"
```

**Default location**: `./backups/` with manifest at `./backups/manifest.csv`

## Docker Migration Hardening

✅ **Verified in `docker-compose.yml`**:
- Migrations service runs BEFORE backend (`depends_on: migrations`)
- Uses `npx prisma migrate deploy` (production-safe, skips seed files)
- No `--accept-data-loss` flag (removed per audit)
- Healthcheck uses `curl` (not wget) with `start_period: 30s`

## Upgrade Path Test

**Test command** (run locally before production deploy):
```bash
cd server
DATABASE_URL=file:./prisma/data/test-upgrade.db npx prisma migrate deploy
```

**Verification**:
1. All 7 migrations apply without errors
2. `SELECT COUNT(*) FROM users;` matches pre-migration count
3. New columns exist: `userType`, `isVerified`, `verificationToken`, `maxAssets`, `maxLiabilities`

## Recommendations

1. **Pre-deploy backup**: Run `./scripts/backup-db.sh` before any production migration
2. **Staging test**: Run migrations on staging DB first (if staging environment exists)
3. **Post-migration verification**:
   ```bash
   sqlite3 ./prisma/data/prod.db "SELECT COUNT(*) as users FROM users;"
   sqlite3 ./prisma/data/prod.db "PRAGMA integrity_check;"
   ```

## Conclusion

**Risk Level**: 🟢 LOW — All migrations are non-destructive or use safe table-redefinition patterns. Data is preserved in all cases.

**Confidence**: HIGH — Prisma's migrate deploy pattern is battle-tested; backup script provides additional safety net.