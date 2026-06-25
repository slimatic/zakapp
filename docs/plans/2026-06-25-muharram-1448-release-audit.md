# ZakApp Muharram 1448 Release — Comprehensive Audit & Improvement Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Ship a stabilized, cleaned-up, professionally polished ZakApp release aligned with Muharram 1448 AH (Islamic New Year), establishing a moon-cycle-based release cadence.

**Architecture:** Monorepo (client React/Vite + server Express/Prisma/SQLite + shared types + CLI). Client-side encrypted RxDB local-first storage with optional CouchDB sync. Zero-knowledge architecture with AES-256-GCM encryption.

**Tech Stack:** React 19, Vite, Express 4, Prisma 6, SQLite, RxDB, CouchDB, Vitest, Docker, Caddy, GitHub Actions

**Release Target:** v0.11.0 — "Muharram 1448 Release"
**Target Date:** July 14, 2026 (end of Muharram 1448)
**Today:** June 25, 2026 — 19 days available

---

## Executive Audit Summary

### What's Good (Keep It)
- ✅ Landing page is professional, visually polished, no AI-generated artifacts
- ✅ AGPL-3.0-or-later license in root LICENSE + package.json
- ✅ Copyright headers present on 444 of 457 TS/TSX files (97%)
- ✅ Prisma migrations are additive and non-destructive (data-preserving patterns)
- ✅ Docker setup uses prebuilt images + Caddy auto-HTTPS + health checks
- ✅ GitHub Actions CI runs client tests + build; Docker Hub multi-arch build
- ✅ 166 test files, 1,212 total tests (792 pass + 420 pass client side = good baseline)
- ✅ Context.md is well-written domain glossary
- ✅ Roadmap tracks 9 phases with clear completion status
- ✅ Zero-knowledge encryption model is architecturally sound

### Critical Issues (Must Fix)

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| C1 | **92 server tests failing** (47 test files) | P0 | Release blocker — broken core logic |
| C2 | **13 client tests failing** in zakat calculation engine | P0 | Zakat math is wrong for crops + cross-asset |
| C3 | **7 TypeScript compile errors** in server | P0 | Build will fail in production |
| C4 | **Duplicate middleware files** (auth.ts/AuthMiddleware.ts, security.ts/SecurityMiddleware.ts, validation.ts/ValidationMiddleware.ts) | P1 | Confusion, dead code, import ambiguity |
| C5 | **Duplicate service files** (6 pairs: analytics, calendar, payment, reminder, snapshot) | P1 | Same issue — old lowercase + new PascalCase |
| C6 | **Old JS routes orphaned** (server/routes/*.js) while app.ts imports TS versions | P1 | Dead code, confusion about entry point |
| C7 | **server/package.json license is "ISC"** — should be AGPL-3.0-or-later | P1 | License inconsistency |
| C8 | **1.5MB prod.db backup committed to git root** | P1 | Repo bloat, potential data exposure |
| C9 | **~1.2MB of test result JSON committed to root** (auth, delete, payment results) | P1 | Repo bloat, not .gitignored |

### Important Issues (Should Fix)

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| I1 | **15+ skipped/describe.skip tests** across client and server | P1 | False green — hiding failures |
| I2 | **20+ TODOs in server code** — unimplemented session invalidation, email service, unique recipient counting | P2 | Incomplete features |
| I3 | **NisabYearRecordsPage.tsx is 754 lines** — ROADMAP Phase 8 says "extract modals" still open | P2 | Maintainability |
| I4 | **20 stale remote branches** (some 4 months old) | P2 | Branch hygiene |
| I5 | **6 .env example/template files** at root — overlapping, confusing | P2 | Onboarding friction |
| I6 | **CI doesn't run server tests** (commented out in workflow) | P1 | Server regressions ship silently |
| I7 | **client/dist/ committed to repo** — build artifacts in version control | P2 | Repo bloat |
| I8 | **Roadmap Phase 9 items still open**: unified testing, strict Decimal typing, CI/CD reliability | P2 | Tech debt |
| I9 | **No LICENSE header on 13 files** (3% gap) | P3 | License compliance |
| I10 | **Accessibility test files exist but are skipped** | P2 | a11y regression risk |

### Nice-to-Have (Defer)

| # | Issue |
|---|-------|
| N1 | Moon-cycle release automation (cron + Islamic calendar) |
| N2 | Merge 2 open Dependabot PRs |
| N3 | Lighthouse CI budget enforcement |
| N4 | PWA offline caching strategy (ROADMAP Phase 6 last item) |
| N5 | Dashboard Action Cards (ROADMAP Phase 7 last item) |

---

## Release Workstreams

### Stream A: Stabilization & Test Repair (P0 — Days 1-5)

**Goal:** Zero failing tests, zero TypeScript errors, green CI.

#### Task A1: Fix TypeScript compile errors in server

**Files:**
- Modify: `server/src/jobs/hawlReminderJob.ts`
- Modify: `server/src/services/NotificationDispatcher.ts`
- Modify: `server/src/services/zakatEngine.ts`
- Modify: `shared/src/types/tracking.ts` (add `hawl_due` to ReminderEventType)

**Errors:**
1. `hawlReminderJob.ts:16` — Cannot find module './EncryptionService' (wrong import path)
2. `hawlReminderJob.ts:237` — 'hawl_due' not assignable to ReminderEventType
3. `NotificationDispatcher.ts:54` — EmailService used as type, should be typeof
4. `NotificationDispatcher.ts:92` — 'hawl_due' not assignable to ReminderEventType
5. `zakatEngine.ts:577` — calculatePropertyZakatableAmount doesn't exist
6. `zakatEngine.ts:586` — calculateAgriculturalZakatableAmount doesn't exist
7. `zakatEngine.ts:615` — parseVestingPercent doesn't exist

**Steps:**
1. Fix import path in hawlReminderJob.ts: change `./EncryptionService` to `../services/EncryptionService`
2. Add `'hawl_due'` to `ReminderEventType` union in `shared/src/types/tracking.ts`
3. Fix EmailService type usage in NotificationDispatcher.ts
4. Fix missing methods in zakatEngine.ts — either implement or rename to existing `calculateZakatableAmount`
5. Run: `cd server && npx tsc --noEmit` — expect 0 errors
6. Commit: `fix: resolve 7 TypeScript compile errors in server`

#### Task A2: Fix client zakat calculation test failures

**Files:**
- Modify: `client/src/core/calculations/zakatEngine.ts` (or wherever calculateZakat lives)
- Test: `client/src/core/calculations/__tests__/zakat.test.ts`

**Failures (13 tests):**
- Agriculture zakat returning 0 instead of 5000 (10% rate for mixed irrigation)
- Cross-asset calculation returning 375 instead of 5375 (missing crop zakat)
- Other calculation errors in the zakat engine

**Steps:**
1. Read `client/src/core/calculations/__tests__/zakat.test.ts` to understand expected behavior
2. Read the calculateZakat implementation
3. Fix agriculture zakat rate logic (10% for mixed irrigation, 5% for rain-fed, 10% for irrigated)
4. Fix cross-asset summation to include all asset type zakat amounts
5. Run: `cd client && npm test -- --run src/core/calculations/__tests__/zakat.test.ts`
6. Expected: All 13 tests pass
7. Commit: `fix: correct zakat calculation for agriculture and cross-asset scenarios`

#### Task A3: Fix server test failures (92 tests, 47 files)

**Strategy:** Group by category, fix in order:

1. **Contract tests** (nisabYearRecords, assets) — response format mismatches
2. **Integration tests** (hawl, finalization, asset management) — workflow logic
3. **Unit tests** (encryption, data-migration, zakat-engine) — service implementations
4. **Performance/accessibility tests** — environment issues

**Steps:**
1. Run: `cd server && npm test 2>&1 | grep "FAIL" | sort` to get exact failing list
2. Triage: which tests are wrong test expectations vs broken code
3. Fix in batches of 5-10 tests, commit after each batch
4. Re-run full suite after each batch to catch regressions
5. Target: 0 failures, 0 errors

**Commit pattern:** `fix(tests): resolve N failing tests in [category]`

#### Task A4: Enable server tests in CI

**Files:**
- Modify: `.github/workflows/test.yml` (uncomment server test block)

**Steps:**
1. Uncomment the server test block in the test workflow
2. Add database setup step (Prisma migrate + generate) before server tests
3. Set `DATABASE_URL=file:./server/prisma/data/test.db?connection_limit=1`
4. Push and verify CI runs both client + server tests
5. Commit: `ci: enable server tests in GitHub Actions`

#### Task A5: Un-skip legitimately needed tests

**Files:**
- Modify: 15+ files with `.skip` / `describe.skip` / `it.skip`

**Strategy:**
- Tests skipped due to flakiness → fix the flakiness, un-skip
- Tests skipped due to unimplemented features → either implement or leave skipped with clear `// SKIP: Requires [feature] — tracked in #issue`
- Tests skipped due to environment issues → fix environment setup

**Commit:** `test: un-skip and fix N previously skipped tests`

---

### Stream B: Dead Code Purge & Repo Cleanup (P1 — Days 3-7)

**Goal:** Remove all dead code, duplicate files, committed artifacts, and stale branches.

#### Task B1: Remove duplicate middleware files

**Files to delete:**
- `server/src/middleware/auth.ts` (1.6KB — use AuthMiddleware.ts instead)
- `server/src/middleware/security.ts` (7.9KB — use SecurityMiddleware.ts instead)
- `server/src/middleware/validation.ts` (980B — use ValidationMiddleware.ts instead)

**Steps:**
1. Verify no active imports reference the old lowercase files: `grep -rn "middleware/auth\|middleware/security\|middleware/validation" server/src --include="*.ts" | grep -v "AuthMiddleware\|SecurityMiddleware\|ValidationMiddleware"`
2. If found, update imports to use PascalCase versions
3. Delete the old files
4. Run tests to confirm nothing breaks
5. Commit: `refactor: remove duplicate lowercase middleware files`

#### Task B2: Remove duplicate service files

**Duplicate pairs to audit:**
- `AnalyticsService.ts` (20KB) vs `analytics-service.ts` (17KB)
- `CalendarConversionService.ts` (7KB) vs `calendarService.ts` (8KB)
- `PaymentService.ts` (18KB) vs `payment-service.ts` (8KB)
- `ReminderService.ts` (13KB) vs `reminder-service.ts` (16KB)

**Steps:**
1. For each pair: check which is actively imported in `app.ts` / route files
2. Diff the two files to see if the "old" one has unique logic
3. Merge unique logic into the active file if needed
4. Delete the inactive file
5. Run tests
6. Commit: `refactor: remove N duplicate service files`

#### Task B3: Remove orphaned JS route files

**Files to delete:**
- `server/routes/assets.js` (284 lines)
- `server/routes/auth.js`
- `server/routes/user.js`
- `server/routes/zakat.js`
- `server/index.js` (old CommonJS entry point — app.ts is the real entry)

**Steps:**
1. Verify `server/src/app.ts` is the actual entry point (check `server/package.json` start script)
2. Verify no references to old JS files: `grep -rn "routes/assets.js\|routes/auth.js\|routes/user.js\|routes/zakat.js\|server/index.js" --include="*.ts" --include="*.js" --include="*.json" --include="*.yml" --include="*.yaml" . | grep -v node_modules`
3. Delete old JS files
4. Run tests + build
5. Commit: `refactor: remove orphaned CommonJS route files and old entry point`

#### Task B4: Remove committed artifacts from git root

**Files to remove (and .gitignore):**
- `auth-test-results.json` (296KB)
- `delete-test-result.json` (296KB)
- `payment-test-results.json` (296KB)
- `payment-test-results-2.json` (292KB)
- `prod.db.backup-pre-ralph-20260208-143238` (1.5MB)
- `client/dist/` (build artifacts — should not be in repo)
- `server/test-results.json` (446KB)

**Steps:**
1. Add to `.gitignore`: `*.json` test results, `*.db*` backups, `client/dist/`
2. `git rm --cached` all artifact files
3. Commit: `chore: remove committed test artifacts and DB backup from repo`
4. Verify: `git log --oneline -1` and check repo size improvement

#### Task B5: Consolidate .env example files

**Current state:** 6 env files at root
- `.env.example` (6.2KB — most complete)
- `.env.dev.example` (1.8KB)
- `.env.docker.example` (3.8KB)
- `.env.docker.template` (1.3KB)
- `.env.easy.example` (2.9KB)
- `.env.staging.template` (6.3KB)

**Target:**
- `.env.example` — full reference with all variables and comments
- `.env.docker.example` — minimal Docker-only subset
- Delete: `.env.dev.example`, `.env.docker.template`, `.env.easy.example`, `.env.staging.template`
- Move content to docs/ if needed

**Commit:** `chore: consolidate .env example files from 6 to 2`

#### Task B6: Delete stale remote branches

**Branches to delete (20 total):**
- `backup-before-cleanup`, `backup-main-before-cleanup`
- `feature/M5.1-hawl-reminder-system` (4 months old)
- `feature/branch-protection-setup`
- `feature/client-zk-encryption`
- `feature/frictionless-onboarding`
- `feature/m7p3-vitest-migration`
- `feature/migration-wizard-ui`
- `feature/multi-currency-integration`
- `feature/prebuilt-docker-images`
- `feature/v0.9.2-encryption-migration-safe`
- `feature/v0.10.0-zero-knowledge-architecture`
- `feature/zakapp-4os-fix-server-tests`
- `feature/zakapp-8ap-password-reset`
- `feature/zakapp-78p-admin-emails-support`
- `feature/zakapp-o8e-restore-test-fixes`
- `feature/zakapp-security-fixes-v0.10.1`
- `feature/zakapp-wlu-remove-exposed-secrets`
- `fix/security-vulnerabilities`
- `ralphy/implement-hawltrackingservice-handlewealthchange-m`
- `revert-281-feature/zakapp-8ap-password-reset`

**Steps:**
```bash
for branch in [list above]; do
  git push origin --delete "$branch"
done
```
Keep: `main`, `feature/m7.1-rate-limiting` (current WIP), and any active feature branches

---

### Stream C: License & Documentation Alignment (P1 — Days 5-8)

#### Task C1: Fix server license to AGPL

**Files:**
- Modify: `server/package.json` — change `"license": "ISC"` to `"license": "AGPL-3.0-or-later"`

**Commit:** `fix(license): correct server package.json from ISC to AGPL-3.0-or-later`

#### Task C2: Add AGPL headers to remaining 13 files

**Steps:**
1. Find files without headers: `find server/src client/src shared/src -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v '.test.' | xargs head -3 | grep -L "AGPL\|GNU Affero"`
2. Add the standard AGPL copyright header to each
3. Commit: `chore: add AGPL license headers to remaining 13 source files`

#### Task C3: Archive outdated documentation

**Files to review and archive:**
- `IMPLEMENTATION-SUMMARY.md` → move to `docs/archive/`
- `DEPLOYMENT_ISSUES.md` → resolve or archive (most issues already addressed)
- `TEST_STABILITY_CHECKLIST.md` → move to `docs/archive/` (superseded by CI)
- `BACKLOG_ISSUES.md` → convert to GitHub Issues, archive file
- `prd.json` → move to `docs/archive/`
- `.ralphy/` → archive or delete (Ralph AI session artifacts)
- `.beads/` → evaluate if beads issue tracker is still used
- `accessibility-failures/` → archive (old a11y test results)
- `ralph/` → archive
- `tasks/` → archive
- `test-results/` → archive or delete
- `performance-tests/` → consolidate into `tests/performance/` if still needed
- `logs/` → add to .gitignore

**Commit:** `docs: archive outdated documentation and session artifacts`

#### Task C4: Update ROADMAP.md

- Mark Phase 8 remaining items (extract NisabYearRecordsPage modals, unused imports) as done or move to this release
- Mark Phase 9 items (unified testing, strict Decimal, CI/CD) as in-progress for this release
- Add Phase 10: Moon-Cycle Release Cadence

#### Task C5: Update CHANGELOG.md for v0.11.0

Add Muharram 1448 release section with all changes from this plan.

---

### Stream D: Data Safety & Migration Hardening (P0 — Days 4-8)

**Goal:** Guarantee zero data loss on upgrade. Existing users must not lose data.

#### Task D1: Audit Prisma migration safety

**Files:**
- Review: `server/prisma/migrations/*/migration.sql`
- Review: `server/prisma/schema.prisma`

**Checks:**
1. Every migration must be additive (CREATE TABLE, ALTER TABLE ADD COLUMN) or use the safe redefine pattern (CREATE new_ → INSERT INTO new_ → DROP old_ → RENAME)
2. No destructive DROP TABLE without data preservation
3. Verify `migration_lock.toml` is present
4. Run `npx prisma migrate status` to verify all migrations are applied

**Steps:**
1. Audit each migration SQL file
2. Document any risky migrations
3. Create a migration test that: creates a DB with v0.10.1 schema → inserts test data → runs all migrations → verifies data preserved
4. Commit: `test: add migration safety test for data preservation`

#### Task D2: Create pre-deployment backup script

**File:** `scripts/backup-before-deploy.sh`

**Steps:**
1. Script that: stops containers → backs up SQLite DB + CouchDB data → records version → starts containers
2. Test the backup script
3. Add to docker-compose.yml as a one-shot migration-backup service
4. Commit: `feat: add pre-deployment backup script`

#### Task D3: Test upgrade path from v0.10.1 → v0.11.0

**Steps:**
1. Pull v0.10.1 Docker images
2. Start stack, create user, add assets/liabilities/payments
3. Run backup
4. Pull v0.11.0 images (or build from source)
5. Start with `migrations` service
6. Verify: all data intact, encryption still works, sync still works
7. Document the upgrade path in `docs/upgrading.md`
8. Commit: `docs: document upgrade path from v0.10.1 to v0.11.0`

---

### Stream E: Code Quality & Architecture (P2 — Days 6-12)

#### Task E1: Extract modals from NisabYearRecordsPage.tsx

**File:** `client/src/pages/NisabYearRecordsPage.tsx` (754 lines)

**Steps:**
1. Read the file, identify modal components embedded inline
2. Extract each modal to `client/src/components/nisab-records/` directory
3. Import and use extracted components
4. Run tests to verify no regression
5. Commit: `refactor: extract modals from NisabYearRecordsPage (754 → ~400 lines)`

#### Task E2: Resolve server TODOs

**TODOs to implement:**
- `AuthController.ts:334,576` — invalidateUserSession (security-critical)
- `AuthController.ts:345` — invalidateToken
- `AuthController.ts:468` — email service for password reset
- `AnnualSummaryService.ts:154-230` — unique recipient counting, average payment, paid amounts
- `hawlTrackingService.ts:394,432` — track interruptions in audit trail

**TODOs to document as issues (defer):**
- `AdminController.ts:139` — CouchDB cleanup (low priority)
- `PushNotificationService.ts:112,199` — push subscriptions (feature not in scope)
- `NisabService.ts:438` — historical price data (enhancement)

**Commit:** `feat: implement session invalidation and annual summary calculations`

#### Task E3: Enforce Decimal.js in all financial paths

**Current state:** ROADMAP says "Replace parseFloat/parseInt with Decimal.js" is done, but strict typing enforcement is Phase 9 (open).

**Steps:**
1. Search for remaining `parseFloat` / `parseInt` in financial code: `grep -rn "parseFloat\|parseInt" client/src --include="*.ts" --include="*.tsx" | grep -v test | grep -v node_modules`
2. Replace with `Decimal` from decimal.js
3. Enforce via shared type: `type Money = Decimal` (or branded type)
4. Add ESLint rule to prevent parseFloat in financial files
5. Commit: `refactor: enforce Decimal.js typing across all financial code paths`

---

### Stream F: Docker & Deployment (P2 — Days 8-12)

#### Task F1: Fix Docker health checks

**Issue:** Backend healthcheck uses `wget` which isn't in `node:20-slim`.

**Files:**
- Modify: `docker/Dockerfile.production` (add wget or switch to node-based healthcheck)
- Modify: `docker-compose.yml` (healthcheck command)

**Steps:**
1. Change healthcheck to `node -e "require('http').get('http://localhost:3001/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"` (no external dep needed)
2. Or add `wget` to Dockerfile.production
3. Test: `docker compose up --build` and verify healthy status
4. Commit: `fix(docker): use node-based healthcheck for backend container`

#### Task F2: Clean up deploy scripts

**Files:**
- `deploy.sh` (6.6KB)
- `deploy-dev-build.sh` (21KB)
- `deploy-easy.sh` (20KB)

**Consolidate into:**
- `deploy.sh` — single script with modes: `./deploy.sh docker`, `./deploy.sh dev`, `./deploy.sh easy`
- Archive the old scripts

**Commit:** `refactor: consolidate 3 deploy scripts into one with mode flags`

---

### Stream G: Moon-Cycle Release Cadence (P3 — Days 10-15)

#### Task G1: Create Islamic calendar release schedule

**File:** `docs/release-cycle.md`

**Content:**
- Document the moon-cycle release process
- Each release begins at 1st of the Islamic month (target: Muharram for major, Rajab for minor)
- PRs merged throughout the month, release tag at new moon
- Use `hijri-converter` library (already a dependency) to calculate dates
- Provide table of upcoming release windows for 1448-1449 AH

#### Task G2: Add release workflow to GitHub Actions

**File:** `.github/workflows/release.yml`

**Steps:**
1. Triggered by tag push `v*.*.*`
2. Build Docker images with semver tags
3. Generate release notes from CHANGELOG.md
4. Create GitHub Release with notes
5. Commit: `ci: add automated release workflow triggered by version tags`

---

## Execution Order (Critical Path)

```
Day 1-2:  A1 (TS errors) → A2 (client zakat tests) → A3 (server tests begin)
Day 3-5:  A3 (server tests complete) → A4 (CI enable) → A5 (un-skip tests)
Day 3-7:  B1-B6 (dead code, duplicates, branches) — parallel with A
Day 5-8:  C1-C5 (license, docs) + D1-D3 (migration safety)
Day 6-12: E1-E3 (code quality) + F1-F2 (Docker)
Day 10-15: G1-G2 (release cadence)
Day 16-18: Final QA, CHANGELOG, release tag
Day 19:   Ship v0.11.0
```

## Verification Checklist (Before Release)

- [ ] `cd server && npx tsc --noEmit` — 0 errors
- [ ] `cd server && npm test` — 0 failures
- [ ] `cd client && npm test -- --run` — 0 failures
- [ ] `cd client && npm run build` — success
- [ ] `cd server && npm run build` — success
- [ ] `docker compose up --build` — all services healthy
- [ ] Upgrade test: v0.10.1 data → v0.11.0 → data intact
- [ ] All AGPL headers present
- [ ] server/package.json license = AGPL-3.0-or-later
- [ ] No artifacts committed to git
- [ ] No stale branches on remote
- [ ] CHANGELOG.md updated for v0.11.0
- [ ] GitHub Release created with tag v0.11.0
- [ ] Docker images pushed to Docker Hub with v0.11.0 + latest tags

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Server test fixes reveal deeper bugs | Medium | High | Time-box 3 days; if >30 tests still failing, scope to known-broken and document rest |
| Migration breaks existing user data | Low | Critical | D1-D3 tasks are explicitly designed to test this; backup script (D2) is safety net |
| 19 days insufficient for all streams | Medium | Medium | Streams A-D are must-have; E-G are nice-to-have and can defer to next cycle |
| Un-skipping tests reveals broken features | High | Medium | Fix what's quick, document rest as GitHub Issues with priority labels |
| Docker build fails after cleanup | Low | Medium | F1 task includes `docker compose up --build` verification |

## Post-Release: Next Cycle (Safar 1448, ~July 15 - Aug 13)

Defer to next moon cycle:
- PWA offline caching strategy (ROADMAP Phase 6)
- Dashboard Action Cards (ROADMAP Phase 7)
- Push notification implementation
- Historical price data integration
- Lighthouse CI budget enforcement
- Strict financial typing enforcement (ESLint rules)