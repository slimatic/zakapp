# ZakApp Deadcode & Duplication Audit Report

**Project:** zakapp (Islamic zakat calculator, AGPL-3.0)  
**Workspace:** `/home/chuwi_agent/zakapp`  
**Audit Date:** 2026-06-26  
**Auditor Stream:** Stream B (deadcode & duplication cleanup)  
**Scope:** `server/src/middleware/`, `server/src/services/`, `server/src/routes/`, git root artifacts, git branches, and duplicate `.env` / template files.

> **Action policy:** This report lists findings only. No files were deleted.

---

## 1. Duplicate / Overlapping Middleware Files

All middleware files live under `server/src/middleware/`. There are **no exact duplicate MD5 hashes**, but there are clear naming-pair overlaps between an older lowercase wrapper/export file and a newer PascalCase implementation file.

### 1.1 `server/src/middleware/auth.ts` vs `server/src/middleware/AuthMiddleware.ts`

| File | Lines | Role |
|------|-------|------|
| `AuthMiddleware.ts` | 327 | Real implementation: JWT authentication, token validation, `requireAdmin`, user lookup, Prisma integration. |
| `auth.ts` | 53 | Thin re-export/wrapper that instantiates `AuthMiddleware` and exposes `authMiddleware`, `requireAdmin`, and `AuthenticatedRequest`. |

**Why it’s duplicate/overlapping:** Two files provide the same public interface for authentication. The class could be imported directly.

**Usage:** `auth.ts` is the one imported by route files (`routes/analytics.ts`, `routes/calculations.ts`, `routes/export.ts`, `routes/import.ts`, `routes/nisab-year-records.ts`, `routes/payments.ts`, `routes/reminders.ts`, `routes/sync.ts`, `routes/user.ts`).

**Recommendation:** **Keep both for now**, but consolidate. Route imports should migrate to `AuthMiddleware.ts` directly, then delete `auth.ts`. Mark `auth.ts` as a candidate wrapper for deletion after migration.

### 1.2 `server/src/middleware/security.ts` vs `server/src/middleware/SecurityMiddleware.ts`

| File | Lines | Role |
|------|-------|------|
| `SecurityMiddleware.ts` | 446 | Full security manager: CORS, Helmet, rate-limiting, CSP, HSTS, XSS, nonce handling, global config loader. |
| `security.ts` | 312 | Domain-specific rate limiters (`snapshotRateLimit`, `analyticsRateLimit`, `paymentRateLimit`, etc.) and ownership helpers. |

**Why it’s duplicate/overlapping:** Same conceptual domain (security). `security.ts` exports only rate-limiting utilities for tracking routes, while `SecurityMiddleware.ts` exports global security middleware.

**Usage:** `security.ts` is imported only by `routes/tracking.ts`.

**Recommendation:** **Keep both**, but rename `security.ts` to `trackingSecurity.ts` or merge its rate-limiters into `SecurityMiddleware.ts` to clarify the split. Not a simple delete.

### 1.3 `server/src/middleware/validation.ts` vs `server/src/middleware/ValidationMiddleware.ts`

| File | Lines | Role |
|------|-------|------|
| `ValidationMiddleware.ts` | 564 | Full implementation: `handleValidationErrors`, `validateSchema`, `body`/`param`/`query` validators, asset validators, pagination. |
| `validation.ts` | 26 | Re-export wrapper: `export { handleValidationErrors }` and `validationMiddleware` object. |

**Why it’s duplicate/overlapping:** `validation.ts` is a thin wrapper around `ValidationMiddleware.ts` that adds no behavior.

**Usage:** No code imports `middleware/validation` in the current tree; route files use direct imports from `ValidationMiddleware.ts`.

**Recommendation:** **Delete `validation.ts`** after confirming no imports remain (none found). It is pure dead code.

### 1.4 Summary Table: Middleware

| Pair / File | Status | Recommendation |
|-------------|--------|----------------|
| `auth.ts` | Wrapper | Delete after migrating routes to `AuthMiddleware.ts` |
| `AuthMiddleware.ts` | Active implementation | **Keep** |
| `security.ts` | Domain-specific tracking security | Rename or merge; **keep** |
| `SecurityMiddleware.ts` | Global security manager | **Keep** |
| `validation.ts` | Unused wrapper | **Delete** |
| `ValidationMiddleware.ts` | Active implementation | **Keep** |

---

## 2. Duplicate / Overlapping Service Files

The `server/src/services/` directory contains many files with overlapping naming patterns (PascalCase vs. hyphenated / lowerCamelCase). Some are actively used; others are unreferenced and likely dead.

### 2.1 Confirmed active service pairs (both files used; refactor candidates)

| Files | Relationship | Used by | Recommendation |
|-------|--------------|---------|----------------|
| `PaymentService.ts` vs `payment-service.ts` | Two separate payment services with different APIs | `PaymentService.ts` used once by `services/analytics-service.ts`; `payment-service.ts` used by `routes/payments.ts` and `services/analytics-service.ts` | **Keep both** until payment route consolidation is planned; document as technical debt |
| `ReminderService.ts` vs `reminder-service.ts` | Two reminder services with different models | `ReminderService.ts` used by `routes/reminders.ts` and unit tests; `reminder-service.ts` used by `services/analytics-service.ts` | **Keep both**; plan consolidation |
| `YearlySnapshotService.ts` vs `snapshot.service.ts` | Different snapshot models | `YearlySnapshotService.ts` used by `services/AnalyticsService.ts`; `snapshot.service.ts` used by `controllers/SnapshotsController.ts` | **Keep both**; these are different snapshot types |

### 2.2 Potentially dead / unreferenced service files

The following files returned **zero internal TypeScript imports** in `server/src` (excluding self). They appear to be stale implementations or abandoned experiments.

| File | Lines | What it is | Why stale/duplicate | Recommendation |
|------|-------|------------|---------------------|----------------|
| `server/src/services/SimpleEducationalContentService.ts` | ~200 | Simplified educational content service | Zero imports; superseded by `EducationalContentService.ts` | **Delete** unless it is imported by client code or tests not covered by this grep |
| `server/src/services/SimpleIslamicCalculationService.ts` | ~200 | Simplified zakat calculation service | Zero imports; superseded by `IslamicCalculationService.ts` | **Delete** |
| `server/src/services/SimpleNisabService.ts` | ~200 | Simplified nisab service | Zero imports; superseded by `NisabService.ts` | **Delete** |
| `server/src/services/BackgroundJobService.ts` | 56 | Background job scaffolding | Zero imports; `jobs/` folder has its own scheduler | **Investigate / likely delete** |
| `server/src/services/EducationalContentService.ts` | unknown | Unused full educational service | Zero imports; the "Simple" version is also unused | **Investigate** |
| `server/src/services/ImportExportService.ts` | unknown | Import/export service | Zero imports; `export-service.ts` is used instead | **Investigate / delete** |
| `server/src/services/IslamicCalculationService.ts` | unknown | Unused calculation service | Zero imports; `zakatEngine.ts` and `ZakatService.ts` handle calculation | **Investigate / delete** |
| `server/src/services/NotificationDispatcher.ts` | unknown | Notification dispatcher | Zero imports; `PushNotificationService.ts` is also unused | **Investigate / delete** |
| `server/src/services/PushNotificationService.ts` | unknown | Push notification service | Zero imports | **Investigate / delete** |
| `server/src/services/RedisCacheService.ts` | unknown | Redis cache wrapper | Zero imports | **Investigate / delete** |
| `server/src/services/ValidationService.ts` | unknown | Validation helper service | Zero imports; validation is done in middleware | **Investigate / delete** |
| `server/src/services/analytics-service.ts` | 556 | Lower-case analytics service | Zero imports; `AnalyticsService.ts` is used | **Delete** (confirmed unreferenced) |
| `server/src/services/export-service.ts` | 215 | Lower-case export service | Zero imports; `ImportExportService.ts` exists but is also unused | **Investigate / delete** |
| `server/src/services/index.ts` | 22 | Empty barrel file | Only exports `{}`; not imported anywhere | **Delete** |

### 2.3 Active, non-duplicate services (keep)

`AssetService`, `AnnualSummaryService`, `AuthService`, `CalculationHistoryService`, `CalendarConversionService`, `ComparisonService`, `EmailService`, `EncryptionAdminService`, `EncryptionService`, `JWTService`, `MetalPriceScraperService`, `MigrationDetectionService`, `NisabService`, `PaymentRecordService`, `SettingsService`, `SyncService`, `UserService`, `WealthAggregationService`, `ZakatService`, `zakatEngine.ts`, `nisabCalculationService.ts`, `nisabYearRecordService.ts`, `hawlTrackingService.ts`, `methodologyConfigService.ts`, `auditTrailService.ts`, `calendarService.ts`, `currencyService.ts`, `reminder-service.ts`, `payment-service.ts`, `payment-record.service.ts`, `snapshot.service.ts`, `wealthAggregationService.ts`.

### 2.4 Note on `services/__tests__/`

Test files in `server/src/services/__tests__/` are not production code; keep them unless the parent service is removed. If a parent service is deleted, its corresponding tests should also be deleted.

---

## 3. Orphaned `.js` Route Files in `server/src/routes/`

| Finding | Details |
|---------|---------|
| **No orphaned `.js` route files found** | `find server/src/routes -name '*.js'` returned 0 results. All routes are TypeScript files. |

**Recommendation:** None; routes are clean of compiled JS artifacts.

---

## 4. Committed Artifacts in Git Root That Should Not Be Committed

The following files/directories are tracked by git but are generated artifacts, test outputs, or database backups. They bloat the repository and should be removed from version control and added to `.gitignore`.

| Path | Size | What it is | Why stale | Tracked? | Recommendation |
|------|------|------------|-----------|----------|----------------|
| `auth-test-results.json` | 296K | Test run output JSON | Generated by test tooling | Yes | **Delete and gitignore** |
| `delete-test-result.json` | 296K | Test run output JSON | Generated by test tooling | Yes | **Delete and gitignore** |
| `payment-test-results.json` | 296K | Test run output JSON | Generated by test tooling | Yes | **Delete and gitignore** |
| `payment-test-results-2.json` | 292K | Test run output JSON | Generated by test tooling | Yes | **Delete and gitignore** |
| `prod.db.backup-pre-ralph-20260208-143238` | 1.6M | Production SQLite backup | Database snapshot; sensitive & large | Yes | **Delete immediately and gitignore `.db.backup*`** |
| `test-results/.last-run.json` | 4K | Playwright/test last-run metadata | Generated by test runner | Yes | **Delete and gitignore** |
| `backups/test.db.backup-20260625-231730` | 2.8M | Runtime database backup | Untracked (new) | No | Already ignored; **do not add to git** |
| `backups/manifest.csv` | small | Backup manifest | Untracked runtime artifact | No | Already ignored; **do not add to git** |

### 4.1 `.gitignore` status

Current `.gitignore` only contains `.env.backup*`. It does **not** ignore:

- `*-test-results.json`
- `*-test-result.json`
- `.db.backup*`
- `test-results/`
- `backups/`

**Recommendation:** Update `.gitignore` to include these patterns before deletion so they do not return.

### 4.2 Additional artifact directories to review

| Path | Status | Recommendation |
|------|--------|----------------|
| `.beads/` | Tool metadata (issue tracker) | Keep if project uses `bd` beads; contains runtime DB files that may need gitignoring |
| `.ralphy/` | Ralph-generated specs & task files | Keep as project documentation unless superseded |
| `archive/` | Old docker-compose files | Keep for historical reference or move to `docs/archive` |

---

## 5. Stale Local and Remote Branches

### 5.1 Local branches

| Branch | Merged into `main`? | Last commit | Verdict |
|--------|---------------------|-------------|---------|
| `feature/m5.1-hawl-reminders` | Yes | 2026-02-28 | **Delete** |
| `feature/monitoring-health-endpoint` | Yes | 2026-02-28 | **Delete** |
| `feature/zakapp-v0.12.0-multi-asset-zakat` | Yes | 2026-02-28 | **Delete** |
| `feature/t_a472e0d7-strict-decimal-typing` | No | 2026-05-24 | **Keep** (active / unmerged) |
| `feature/m7.2-monitoring-alerting` | No | 2026-05-24 | **Keep** (active / unmerged) |
| `feature/m7.1-rate-limiting` *(current)* | No | 2026-06-25 | **Keep** (current work) |
| `main` | N/A | 2026-02-28 | **Keep** |

### 5.2 Remote branches (`origin/*`) already merged into `main`

| Branch | Last commit | Recommendation |
|--------|-------------|----------------|
| `origin/backup-main-before-cleanup` | 2026-02-09 | **Delete** |
| `origin/feature/branch-protection-setup` | 2026-02-07 | **Delete** |
| `origin/feature/client-zk-encryption` | 2026-02-08 | **Delete** |
| `origin/feature/migration-wizard-ui` | 2026-02-08 | **Delete** |
| `origin/feature/multi-currency-integration` | 2026-02-18 | **Delete** |
| `origin/feature/v0.10.0-zero-knowledge-architecture` | 2026-02-08 | **Delete** |
| `origin/feature/v0.9.2-encryption-migration-safe` | 2026-02-08 | **Delete** |
| `origin/feature/zakapp-78p-admin-emails-support` | 2026-02-09 | **Delete** |
| `origin/feature/zakapp-8ap-password-reset` | 2026-02-09 | **Delete** |
| `origin/feature/zakapp-security-fixes-v0.10.1` | 2026-02-09 | **Delete** |
| `origin/feature/zakapp-wlu-remove-exposed-secrets` | 2026-02-09 | **Delete** |
| `origin/origin` | 2026-02-09 | **Delete** (duplicate of `origin/main`) |
| `origin/ralphy/implement-hawltrackingservice-handlewealthchange-m` | 2026-02-07 | **Delete** |
| `origin/revert-281-feature/zakapp-8ap-password-reset` | 2026-02-09 | **Delete** |

### 5.3 Remote branches not merged (abandoned / stale)

| Branch | Last commit | Verdict | Recommendation |
|--------|-------------|---------|----------------|
| `origin/backup-before-cleanup` | 2026-02-09 | Unmerged | **Delete** (backup branch, likely superseded by `backup-main-before-cleanup`) |
| `origin/dependabot/npm_and_yarn/client/npm_and_yarn-2867179b1e` | 2026-04-07 | Unmerged dependabot | **Delete** or review/merge PR then delete |
| `origin/feat/three-improvements` | 2026-05-02 | Unmerged | **Review** — possibly stale / abandoned |
| `origin/feature/asset-amount-history` | 2026-05-02 | Unmerged | **Review** — possibly stale / abandoned |
| `origin/feature/frictionless-onboarding` | 2026-02-07 | Unmerged | **Delete** (5 months old) |
| `origin/feature/prebuilt-docker-images` | 2026-02-06 | Unmerged | **Delete** (5 months old) |
| `origin/feature/zakapp-4os-fix-server-tests` | 2026-02-07 | Unmerged | **Delete** (5 months old) |
| `origin/feature/zakapp-o8e-restore-test-fixes` | 2026-02-09 | Unmerged | **Delete** (5 months old) |
| `origin/fix/security-vulnerabilities` | 2026-02-06 | Unmerged | **Review carefully** — may contain important security fixes before deletion |

### 5.4 Branch cleanup command reference (do not run blindly)

```bash
# Local merged branches
git branch -d feature/m5.1-hawl-reminders
git branch -d feature/monitoring-health-endpoint
git branch -d feature/zakapp-v0.12.0-multi-asset-zakat

# Remote merged branches
git push origin --delete backup-main-before-cleanup \
  feature/branch-protection-setup \
  feature/client-zk-encryption \
  feature/migration-wizard-ui \
  feature/multi-currency-integration \
  feature/v0.10.0-zero-knowledge-architecture \
  feature/v0.9.2-encryption-migration-safe \
  feature/zakapp-78p-admin-emails-support \
  feature/zakapp-8ap-password-reset \
  feature/zakapp-security-fixes-v0.10.1 \
  feature/zakapp-wlu-remove-exposed-secrets \
  origin \
  ralphy/implement-hawltrackingservice-handlewealthchange-m \
  revert-281-feature/zakapp-8ap-password-reset
```

---

## 6. Duplicate `.env` Files / Template Files

### 6.1 Exact duplicates

| Files | MD5 match | Verdict |
|-------|-----------|---------|
| `.env.docker.template` and `config/env/.env.docker.template` | Identical | **Delete one** — keep `config/env/.env.docker.template` as canonical and remove the root copy |
| `.env.staging.template` and `config/env/.env.staging.template` | Identical | **Delete one** — keep `config/env/.env.staging.template` as canonical and remove the root copy |

### 6.2 Near-duplicate templates with overlapping purpose

| Files | Purpose | Recommendation |
|-------|---------|----------------|
| `.env.dev.example` | Dev environment (ports, local URLs) | **Keep** but consider merging with `.env.example` dev section |
| `.env.easy.example` | Easy/zero-friction deployment | **Keep** — distinct audience |
| `.env.docker.example` | Minimal Docker config | **Keep** but could be consolidated with `.env.easy.example` |
| `.env.example` | Full reference configuration | **Keep** |
| `.env.staging.template` | Staging template | **Keep** |
| `server/.env.example` | Backend-specific subset | **Keep**, but is a subset of root `.env.example`; could be removed if root `.env.example` is maintained |
| `client/.env.example` | Frontend environment template | **Keep** |

### 6.3 Recommendation summary for env files

1. Remove exact root duplicates: `.env.docker.template` and `.env.staging.template` (root copies).
2. Audit usage of `server/.env.example` vs `.env.example`; if redundant, delete `server/.env.example`.
3. Rename/merge `.env.dev.example`, `.env.easy.example`, and `.env.docker.example` to reduce confusion, or document when to use each.

---

## 7. Quick Reference: Recommended Deletions

| # | Path | Category | Reason |
|---|------|----------|--------|
| 1 | `server/src/middleware/validation.ts` | Dead middleware | Unused wrapper |
| 2 | `server/src/services/SimpleEducationalContentService.ts` | Dead service | Zero imports |
| 3 | `server/src/services/SimpleIslamicCalculationService.ts` | Dead service | Zero imports |
| 4 | `server/src/services/SimpleNisabService.ts` | Dead service | Zero imports |
| 5 | `server/src/services/analytics-service.ts` | Dead service | Zero imports; `AnalyticsService.ts` is active |
| 6 | `server/src/services/index.ts` | Dead barrel | Empty / unused |
| 7 | `server/src/services/BackgroundJobService.ts` | Likely dead service | Zero imports; verify before delete |
| 8 | `server/src/services/ValidationService.ts` | Likely dead service | Zero imports |
| 9 | `server/src/services/RedisCacheService.ts` | Likely dead service | Zero imports |
| 10 | `server/src/services/PushNotificationService.ts` | Likely dead service | Zero imports |
| 11 | `server/src/services/NotificationDispatcher.ts` | Likely dead service | Zero imports |
| 12 | `auth-test-results.json` | Tracked artifact | Test output |
| 13 | `delete-test-result.json` | Tracked artifact | Test output |
| 14 | `payment-test-results.json` | Tracked artifact | Test output |
| 15 | `payment-test-results-2.json` | Tracked artifact | Test output |
| 16 | `prod.db.backup-pre-ralph-20260208-143238` | Tracked artifact | Database backup |
| 17 | `test-results/.last-run.json` | Tracked artifact | Test runner metadata |
| 18 | Root `.env.docker.template` | Duplicate env | Identical to `config/env/.env.docker.template` |
| 19 | Root `.env.staging.template` | Duplicate env | Identical to `config/env/.env.staging.template` |
| 20 | Multiple merged branches | Stale branches | Already merged or abandoned |

---

## 8. Methodology Notes

- Searched `server/src/middleware/`, `server/src/services/`, and `server/src/routes/` with `find`, `md5sum`, `grep`, and `diff`.
- Determined branch staleness with `git branch --merged main` and per-branch `git merge-base --is-ancestor` checks.
- Determined file usage with `grep -rl "from '.../services/<name>"` over `server/src/**/*.ts`.
- Identified tracked artifacts with `git ls-files` and compared against `.gitignore`.
- Verified no compiled `.js` route artifacts exist.

---

*End of report.*
