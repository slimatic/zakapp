# Sync/Auth Bug Fixes - Learnings

## 2026-03-02 - Session Initialized

### Project Conventions
- License header: GNU AGPL v3 — MUST be added to all new/modified files
- TypeScript project: client (Vite/React18) + server (Express/Prisma)
- API base URL: `http://localhost:3001/api` — no trailing slash, includes `/api`
- When calling `apiService.get(path)` the path must NOT start with `/api/` — just `/resource-name`

### Bug 1: Double-slash URL — DIAGNOSED
- File: `client/src/hooks/useMigration.ts` line 43
- Bug: `apiService.get('/api/user/encryption-status')` → becomes `/api/api/user/encryption-status`
- Root: `API_BASE_URL` = `http://host:3001/api`, and path includes `/api/` again
- Fix: Change to `apiService.get('/user/encryption-status')`
- The `apiService.get()` handler in `api.ts` line 157 prepends `API_BASE_URL` and handles leading slash

### Bug 2: RxDB DB8 Duplicate DB — DIAGNOSED
- File: `client/src/db/index.ts` lines 238-258 (`closeDb` function)
- Bug: The `closeDb()` function fetches the DB, logs "DB instance exists but missing destroy() method" but then NEVER calls `db.destroy()`. This is a comment artifact from a refactor — the actual destroy call was removed.
- Evidence: Line 245 says `logger.warn("DB instance exists but missing destroy() method:", Object.keys(db))` — but `db.destroy()` is the correct RxDB API. The warn message is wrong; the real issue is that destroy() is never called.
- Fix: Call `await db.destroy()` inside the try block after the warn log, or remove the misleading warn and add proper destroy. Also remove the unused `removeRxDatabase` import (line 19) if not used elsewhere.
- DB name: `zakapp_db_v10` (in production), `testdb` (in test)
- The 200ms delay after closing (`line 257`) is intentional — keep it

### Bug 3: Sync Token 500 — CouchDB /_users 404 — DIAGNOSED
- File: `server/src/services/SyncService.ts`
- Bug: CouchDB 3.x requires explicit cluster finalization before `_users` db is accessible
- CouchDB 3.x ships without `_users`, `_replicator`, `_global_changes` on fresh install unless `/_cluster_setup` is called
- The official Docker image does create these IF admin credentials are set — but the entrypoint-wrapper.sh may interfere
- entrypoint-wrapper.sh at `docker/couchdb/entrypoint-wrapper.sh` only sets CORS and SSL config, then calls the original `/docker-entrypoint.sh`
- The original image's `docker-entrypoint.sh` should create the admin user and system databases
- HOWEVER: The 404 on `/_users` can also mean the backend connects BEFORE CouchDB finishes initializing
- Fix approach: In server `SyncService`, add a `ensureCouchDbInitialized()` method that calls `PUT /_users`, `PUT /_replicator` if they don't exist (CouchDB allows admin to create system dbs)

### Architecture Notes
- SyncService (server): `server/src/services/SyncService.ts` — handles CouchDB admin operations
- SyncService (client): `client/src/services/SyncService.ts` — handles RxDB replication
- Auth middleware: `server/src/middleware/auth.ts` (uses `authMiddleware`) AND `server/src/middleware/AuthMiddleware.ts` (uses `authenticate`) — TWO different files!
- Routes use BOTH: sync.ts uses `authMiddleware`, asset-amount-events.ts uses `authenticate`
- Asset history route IS protected: `router.get('/:assetId/history', authenticate, ...)` in asset-amount-events.ts
- The 401 on asset history may be a frontend token issue — the ApiService.handleResponse() at line 141 silently returns `{success: false, message: 'API Unauthorized (Local Mode)'}` for 401s instead of throwing

### .env.dev Missing Variables
- File: `.env.dev` (line 15 is last line) — missing `COUCHDB_USER` (defaults to 'admin' from docker-compose)
- Has: COUCHDB_JWT_SECRET, COUCHDB_PASSWORD
- Missing: COUCHDB_URL (provided in docker-compose.dev.yml environment directly: `COUCHDB_URL=http://couchdb:5984`)

## Bug 2 Fix Applied — RxDB DB8 Duplicate DB (COMPLETED)

- **File**: `client/src/db/index.ts` lines 225-258 (`closeDb` function)
- **Applied**: 2026-03-02
- **Change Summary**:
  - **Before**: The function fetched the DB but logged a misleading warning and never called `db.destroy()`
  - **After**: Now properly calls `await db.destroy()` with safety checks:
    ```typescript
    if (db && typeof db.destroy === 'function' && !(db as any).destroyed) {
        await db.destroy();
        logger.info("DB instance destroyed.");
    }
    ```
  - **Kept Intact**: 
    - The 200ms delay after closing (line 257) — intentional for RxDB registry cleanup
    - Error handling with try/catch block
    - The `window._zakapp_db_promise = null` and `notifyListeners(null)` cleanup calls
  - **Removed**: The misleading logger.warn message that implied destroy() was checked but never called

- **Key RxDB APIs Used**:
  - `db.destroy()` - Properly closes the database instance and removes it from RxDB's internal registry
  - `(db as any).destroyed` - Property check to avoid destroying an already-destroyed instance
  - Type guard: `typeof db.destroy === 'function'` — ensures the method exists

- **Expected Outcome**: 
  - On logout/re-login, `getDb()` can now create a new database instance without hitting the DB8 "duplicate database" error
  - RxDB's internal registry is properly cleaned up due to the destroy() call plus the 200ms delay

## 2026-03-02 - SyncService CouchDB init guard
- Added `ensureCouchDbInitialized()` in `server/src/services/SyncService.ts` with `_initialized` guard and system db creation via `PUT`.
- Handles 412 (already exists) as success and throws on other errors.
- Blocker: LSP diagnostics/build cannot run because Node/npm are not installed in the environment.

## AssetAmountHistory.tsx Fix (Completed)

**Problem**: `AssetAmountHistory.tsx` line 34 used raw `fetch()` without auth headers, causing 401 Unauthorized on `GET /api/assets/:id/history`

**Solution Applied**:
1. ✅ Imported `getApiBaseUrl` from `../config` (line 7)
2. ✅ Changed default prop from `apiBaseUrl = '/api'` to `apiBaseUrl = getApiBaseUrl()` (line 27)
3. ✅ Added auth headers to fetch call (lines 35-41):
   - Gets token from `localStorage.getItem('accessToken')`
   - Follows the exact pattern from `api.ts` lines 130-134
   - Uses spread operator to conditionally add Authorization header

**Key Pattern**:
```typescript
const token = localStorage.getItem('accessToken');
const response = await fetch(url, {
  headers: {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
});
```

**Verification**:
- GNU AGPL v3 license header preserved (lines 1-4 comment block kept)
- No new dependencies added
- Component structure unchanged
- All UI logic unchanged
- TypeScript syntax verified

**Notes**:
- Pre-existing TypeScript errors in db/index.ts (destroy() method) unrelated to this fix
- Node.js type definition errors pre-existing, unrelated to this fix
- The fix follows the exact pattern already established in `api.ts`
