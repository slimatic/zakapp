# Upgrading ZakApp

This guide covers upgrading an existing ZakApp instance, including the
**unmigrated SQLite** case that older releases could not upgrade at all.

---

## TL;DR

```bash
cd ~/umbrel/slimatic/services/app.zakapp.org
bash upgrade.sh --dry-run    # see what will happen (no changes)
bash upgrade.sh              # backup -> pull -> deploy -> verify
```

If anything fails, your data is untouched and a backup was taken first.

---

## What "unmigrated" means

Prisma tracks applied migrations in a `_prisma_migrations` table. Instances
created **before migrations existed** (or created with `prisma db push`) have a
valid schema but **no such table**.

Running `prisma migrate deploy` against that state exits:

```
Error: P3005
The database schema is not empty.
```

Before v0.16.3 this meant an **upgrade could not complete** — the backend
refused to start, and because the backend waits on the migrations service, the
whole stack stayed down. This guide exists so that is no longer a dead end.

---

## What v0.16.3+ does automatically

On starting, the backend entrypoint (and the `migrations` service, via
`migrate-only.sh`) will:

1. Run `prisma migrate deploy`.
2. If it exits **P3005**, verify the live schema already matches
   `prisma/schema.prisma` using `prisma migrate diff`.
3. **If there is no difference** → record the existing migrations as applied
   *without re-running their SQL*, then start normally.
4. **If there is drift** → refuse to start, print the differences, and point
   you at the manual path below. It will not guess.

**Your data is never rewritten by baselining.** Step 3 records bookkeeping
only; no migration SQL is executed against your tables.

> All shipped migrations themselves were audited as data-preserving (see
> `docs/audit/migration-safety-v0.11.0.md`), so the risk is in the *bookkeeping*
> step, not in data loss.

---

## Verify before you upgrade

Check whether your instance is on the unmigrated path:

```bash
# From the deployment directory
docker run --rm -v appzakapporg_backend_data:/data:ro alpine \
  sh -c 'grep -c _prisma_migrations /data/prod.db || echo 0'
```

- `0` → unmigrated path. The auto-baseline will handle it. Read on anyway.
- `1` or more → normal upgrade path, nothing special needed.

---

## Standard upgrade

```bash
cd ~/umbrel/slimatic/services/app.zakapp.org

# 1. Dry run — reports your DB state, changes nothing
bash upgrade.sh --dry-run

# 2. Upgrade — backup, pull, deploy, verify
bash upgrade.sh
```

The script:
1. Detects fresh / migrated / unmigrated and tells you which.
2. Runs `scripts/ops/backup-before-upgrade.sh` (**aborts if the backup fails**).
3. Pulls images.
4. `docker compose up -d` (migrations complete before the backend starts).
5. Verifies the migration log for `FATAL` / `SCHEMA DRIFT`.
6. Polls `/health` until it returns 2xx/3xx.

---

## Manual upgrade (no script)

If you prefer to drive it yourself:

```bash
cd ~/umbrel/slimatic/services/app.zakapp.org

# 1. ALWAYS back up first
bash scripts/ops/backup-before-upgrade.sh

# 2. Pull and deploy
docker compose pull
docker compose up -d

# 3. Watch the migrations service
docker compose logs -f migrations

# 4. Confirm health
curl -i http://localhost/health
```

If the migrations log shows `SCHEMA DRIFT`, **stop** and use the manual
baseline below.

---

## Manual baseline (drift, or you want explicit control)

Use this when the automatic path refuses (drift detected) or when you want to
baseline by hand.

**Step 1 — back up.** Non-negotiable:

```bash
bash scripts/ops/backup-before-upgrade.sh
```

**Step 2 — inspect the drift** so you know what differs:

```bash
docker run --rm -v appzakapporg_backend_data:/data \
  -e DATABASE_URL="file:/data/prod.db" \
  --entrypoint /bin/bash slimatic/zakapp-backend:latest -c '
    cd /app/server && npx prisma migrate diff \
      --from-url "$DATABASE_URL" \
      --to-schema-datamodel prisma/schema.prisma --script
  '
```

**Step 3 — if (and only if) the difference is empty or understood**, mark each
migration as applied:

```bash
docker run --rm -v appzakapporg_backend_data:/data \
  -e DATABASE_URL="file:/data/prod.db" \
  --entrypoint /bin/bash slimatic/zakapp-backend:latest -c '
    cd /app/server
    for m in prisma/migrations/*/; do
      n=$(basename "$m"); [ "$n" = "migration_lock.toml" ] && continue
      npx prisma migrate resolve --applied "$n"
    done
    npx prisma migrate deploy
  '
```

**Step 4 — start and verify:**

```bash
docker compose up -d
docker compose logs -f backend
curl -i http://localhost/health
```

> If the drift is *real* schema difference (not just missing bookkeeping), do
> **not** baseline. Restore from backup and open an issue — the schema needs a
> proper migration, not a workaround.

---

## Rollback

Backups are written by `backup-before-upgrade.sh` to
`${ZAKAPP_BACKUP_DIR:-$HOME/backups/zakapp-upgrades}` as a timestamped set
(`zakapp-config-*`, `zakapp-sqlite-*`, `zakapp-couchdb-*`). Only the most
recent set is retained.

```bash
cd ~/umbrel/slimatic/services/app.zakapp.org
BACKUP_DIR="${ZAKAPP_BACKUP_DIR:-$HOME/backups/zakapp-upgrades}"
STAMP=$(ls -t "$BACKUP_DIR"/zakapp-sqlite-*.tar.gz | head -1 | grep -oE '[0-9]{8}-[0-9]{6}')

# 1. Stop the stack
docker compose down

# 2. Restore the SQLite volume
docker run --rm -v appzakapporg_backend_data:/data -v "$BACKUP_DIR":/backup alpine \
  sh -c "rm -f /data/*.db && tar xzf /backup/zakapp-sqlite-$STAMP.tar.gz -C /data"

# 3. Restore CouchDB (optional, if sync data is affected)
docker run --rm -v appzakapporg_couchdb_data:/data -v "$BACKUP_DIR":/backup alpine \
  sh -c "rm -rf /data/* && tar xzf /backup/zakapp-couchdb-$STAMP.tar.gz -C /data"

# 4. Pin the previous image tag and bring it back up
#    (edit docker-compose.yml to the prior tag, e.g. slimatic/zakapp-backend:0.16.2)
docker compose up -d
curl -i http://localhost/health
```

---

## Troubleshooting

| Symptom | Meaning | Action |
|---|---|---|
| `Error: P3005` then `SCHEMA DRIFT` | Live schema differs from the expected schema | Restore backup; do **not** baseline. Open an issue. |
| `Error: P3005` then baselined, then healthy | Expected unmigrated-upgrade path | None — this is the success case. |
| `FATAL: Missing required security environment variable` | `JWT_SECRET` or `ENCRYPTION_KEY` unset | Set both in `.env`. The app requires them regardless of version. |
| `WARNING: JWT_REFRESH_SECRET ... not set` | Sessions will not survive restarts | Set `JWT_REFRESH_SECRET` in `.env` to stop the logout loop (#267). |
| Migrations service exited non-zero, backend never starts | Backend waits on `service_completed_successfully` | `docker compose logs migrations`; resolve per above, then `docker compose up -d`. |

---

## Note on `JWT_REFRESH_SECRET` (#267)

If this is unset, the backend generates a **random** refresh secret at every
boot. Every restart therefore invalidates all refresh tokens — users are
silently logged out. This is the session-expiry loop reported in #267.

Check your `.env`:

```bash
grep -E '^JWT_REFRESH_SECRET=' .env
```

If empty, set it (and keep it stable across upgrades):

```bash
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)" >> .env
```

Changing it logs everyone out **once**; after that, sessions persist.
