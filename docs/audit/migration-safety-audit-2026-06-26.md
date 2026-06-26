# Migration Safety Audit — zakapp Muharram 1448

**Date:** 2026-06-26  
**Auditor:** RIQ  
**Scope:** All 8 Prisma migrations + entrypoint.sh + docker-compose.yml

---

## Executive Summary

**3 P0 risks found. 2 P1 risks. Overall: migration path is functional but NOT safe for zero-downtime or zero-data-loss upgrades.**

The biggest danger: `entrypoint.sh` falls back to `prisma db push --accept-data-loss` which **silently drops columns/tables** that don't match the current schema. This has likely already caused data loss in development.

---

## Migration-by-Migration Analysis

### M1: `20251023221157_payment_tracking_schema` (Initial)
- **Risk: NONE** — Pure `CREATE TABLE` + `CREATE INDEX`. Additive only.
- 21 tables created. No data loss possible.

### M2: `20251027234455_add_nisab_year_record_and_hawl_tracking`
- **Risk: P1** — Contains `ALTER TABLE yearly_snapshots RENAME TO nisab_year_records` (Step 6)
- **Data safety:** ✅ Data preserved (SQLite RENAME preserves all rows)
- **Risk:** FK references in `payment_records` still point to `yearly_snapshots` in the DB metadata. The migration comments: *"SQLite doesn't support direct FK updates"* — meaning the FK constraint text is stale but functionally the DB works because SQLite FK enforcement is per-session.
- **Concern:** If any code still references `yearly_snapshots` table name, it will break. The `INSERT INTO ... SELECT` in M3's RedefineTables pattern handles the data correctly.
- **Verdict:** Safe for data, but FK metadata drift.

### M3: `20251213035725_add_asset_modifiers`
- **Risk: P0** — Uses **RedefineTables pattern** (`CREATE TABLE new_X → INSERT INTO → DROP TABLE X → RENAME`)
- This is Prisma's standard SQLite migration pattern and is **safe** — it copies all existing rows.
- **BUT:** The `INSERT INTO new_assets SELECT ... FROM assets` explicitly lists columns. If a future migration adds a column to `assets` that isn't listed here, the INSERT will silently drop it.
- **Current state:** ✅ Column list matches — no data loss in this specific migration.
- **Verdict:** Safe now, but fragile pattern for future migrations.

### M4: `20251216003753_add_encryption_remediation`
- **Risk: NONE** — Pure `CREATE TABLE`. Additive only.

### M5: `20251229012031_fix_missing_usertype`
- **Risk: P1** — RedefineTables pattern for `users` table.
- `INSERT INTO new_users SELECT ... FROM users` — column list matches.
- **Adds:** `userType` column with `DEFAULT 'USER'`. This is safe — existing rows get the default.
- **Verdict:** Safe but fragile (same RedefineTables concern).

### M6: `20260108203302_add_resource_limits`
- **Risk: NONE** — `ALTER TABLE users ADD COLUMN`. Pure additive. Safe.

### M7: `20260109155002_add_max_liabilities`
- **Risk: NONE** — `ALTER TABLE users ADD COLUMN`. Pure additive. Safe.

### M8: `20260110195822_add_email_verification_settings`
- **Risk: P1** — RedefineTables pattern for `users` table (again).
- Column list in `INSERT INTO new_users SELECT ... FROM users` includes columns from M6+M7 (`maxAssets`, `maxLiabilities`, `maxNisabRecords`, `maxPayments`). ✅ Correct.
- Adds `isVerified`, `verificationToken`, `verificationTokenExpires` — all nullable or have defaults. ✅ Safe.
- **Also:** Creates `system_settings` table. Additive. ✅ Safe.

---

## P0 Risks (Must Fix Before Release)

### P0-1: `entrypoint.sh` uses `--accept-data-loss` fallback
```sh
npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss
```
If `prisma migrate deploy` fails for ANY reason (locked DB, corrupt migration table, wrong migration name), the fallback **silently reshapes the database** to match the current schema, potentially DROPPING columns and tables that aren't in the Prisma schema anymore.

**This is the single most dangerous line in the entire project.**

**Fix:** Remove the fallback. If migrate deploy fails, the container should fail and a human should investigate. The `|| ... accept-data-loss` pattern was probably added during early development to avoid interactive prompts — it has no place in production.

### P0-2: `migrations` service depends on `backend` (not just CouchDB)
```yaml
  migrations:
    depends_on:
      - backend
    command: >
      sh -c "... prisma migrate deploy || (echo 'Migration failed...' && exit 0)"
```
Two problems:
1. `migrations` depends on `backend` — but the backend does its OWN migrations in `entrypoint.sh` (line: `initAutoMigration()`). This creates a race condition where both the backend and the migration container try to run `prisma migrate deploy` simultaneously on the same SQLite file. SQLite only allows one writer at a time.
2. The migration container's command has `|| (echo 'Migration failed...' && exit 0)` — it **swallows migration failures** and exits 0, so Docker Compose thinks it succeeded.

**Fix:** Remove `initAutoMigration()` from the backend and run migrations ONLY from the `migrations` service. Make the `migrations` service `depends_on: couchdb` (not `backend`). Remove the `|| exit 0` fallback.

### P0-3: No pre-migration backup mechanism
There is no backup step before running migrations. If a migration corrupts data, there's no way to rollback.
- The `prod.db.backup-pre-ralph-*` file in the repo root is from a manual ad-hoc backup.
- Volume `backend_data` is a Docker volume — no backup cron exists.

**Fix:** Create `scripts/backup-db.sh` that the migrations service runs BEFORE `prisma migrate deploy`.

---

## P1 Risks (Should Fix)

### P1-1: Health endpoint doesn't check DB/CouchDB connectivity
```ts
app.get('/health', healthRateLimit, (req, res) => {
  res.status(200).json({ success: true, status: 'OK', timestamp: new Date().toISOString() });
});
```
This only checks if the Express process is alive. It doesn't verify that Prisma can query the DB or that CouchDB is reachable. Docker healthcheck uses `wget` against this endpoint, so Docker thinks the backend is healthy even if the DB is down.

### P1-2: RedefineTables pattern is column-list-dependent
M3, M5, M8 use `INSERT INTO new_X (...) SELECT ... FROM X` with explicit column lists. If you add a column in a future migration and forget to update these, data gets silently dropped. This is inherent to Prisma's SQLite migration pattern and can't be "fixed" retroactively, but it should be documented as a project-level risk.

### P1-3: Docker healthcheck uses `wget` (not installed in production image)
The `backend-production` Dockerfile installs `wget` specifically for the healthcheck, but the image is `node:20-slim` — if the `wget` install is removed or fails, healthchecks break silently.

---

## Data Loss Scenarios We Must Prevent

| Scenario | Current Protection | Required Protection |
|---|---|---|
| Migration adds a new NOT NULL column without default | ❌ Will fail on existing rows | Prisma generates `ALTER TABLE ADD COLUMN ... DEFAULT` — safe |
| Migration drops a column | ❌ RedefineTables drops data | Backup before migrate + test |
| `prisma db push --accept-data-loss` fires in prod | ❌ Loses data silently | Remove fallback |
| Race condition: 2 processes migrate simultaneously | ❌ SQLite lock error → fallback to `--accept-data-loss` | Single migration runner |
| Volume corruption | ❌ No backup | Backup cron + offsite |

---

## Recommendations (Priority Order)

1. **Remove `--accept-data-loss` fallback** from entrypoint.sh → hard fail instead
2. **Create `scripts/backup-db.sh`** — SQLite backup + checksum
3. **Consolidate migration runner** — only migrations service, not also backend
4. **Fix migrations service** — remove `|| exit 0`, change depends_on
5. **Add DB/CouchDB connectivity check** to `/health` endpoint
6. **Add pre-migration backup** step in docker-compose.yml migrations service
7. **Document RedefineTables risk** in CONTRIBUTING.md

---

## Schema vs. Migration Drift Check

Current `schema.prisma` maps to table `nisab_year_records` via `@@map`. All migrations have been applied. No orphaned tables detected in schema that aren't in migrations (beyond the `test_results`, `implementation_gaps`, `quality_metrics` meta-tables which are in M1 and in the schema).

**Schema tables (from schema.prisma):** 26 models  
**Migration-created tables:** 26 tables  
**Drift:** ✅ None detected
