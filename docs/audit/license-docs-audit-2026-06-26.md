# License and Documentation Audit — zakapp Stream C

**Date**: 2026-06-26
**Auditor**: Hermes Agent (subagent)
**Scope**: license consistency in `package.json` files, AGPL-3.0 copyright headers in `server/src/**/*.ts`, documentation hygiene, and ROADMAP/CHANGELOG currency for version `0.10.1`.

---

## 1. License Consistency in package.json

| File | License Found | Status |
|------|---------------|--------|
| `package.json` | `AGPL-3.0-or-later` | ✅ OK |
| `server/package.json` | `ISC` (originally) | ✅ **Fixed to `AGPL-3.0-or-later`** |
| `client/package.json` | no `license` field | ⚠️ Missing license field |
| `shared/package.json` | no `license` field | ⚠️ Missing license field |
| `cli/package.json` | no `license` field | ⚠️ Missing license field |

**Action taken**: Updated `server/package.json` to use `"license": "AGPL-3.0-or-later"` and set `"author": "zakapp contributors"` to match root conventions.

**Recommendation**: Add `"license": "AGPL-3.0-or-later"` to `client/package.json`, `shared/package.json`, and `cli/package.json` so all workspace packages are consistent with the root and the `LICENSE` file (AGPL-3).

---

## 2. AGPL-3.0 Copyright Headers in `server/src/**/*.ts`

**Method**: Scanned all `.ts` files under `server/src/` and checked whether the first few lines contained `AGPL` / `GNU Affero General Public License`.

**Total `.ts` files scanned**: 181
**Files with header**: 137
**Files missing header**: **44**

### Sample of 12 files missing headers
1. `server/src/__tests__/MetalPriceScraperService.test.ts`
2. `server/src/__tests__/SyncService.test.ts`
3. `server/src/__tests__/authController.isVerified.test.ts`
4. `server/src/__tests__/calculation-history-basic.test.ts`
5. `server/src/__tests__/calculation-history.test.ts`
6. `server/src/__tests__/calendarService.test.ts`
7. `server/src/__tests__/integration/admin-system.test.ts`
8. `server/src/__tests__/integration/analytics-api.test.ts`
9. `server/src/__tests__/integration/assets.api.test.ts`
10. `server/src/__tests__/integration/assets.eligibility.test.ts`
11. `server/src/__tests__/integration/assets.passive.test.ts`
12. `server/src/__tests__/integration/encryption-admin.test.ts`

**Observation**: Nearly all missing headers are in `__tests__/` and `services/__tests__/` test files. A few other source files may also be missing headers (full list saved at `/tmp/missing_headers.txt` during audit). Per instructions, headers were **not** added — only counted and sampled.

**Recommendation**: Apply the standard AGPL header to the remaining test and source files to satisfy the `ROADMAP.md` Phase 4 item “Add AGPL-3.0 headers to all files.”

---

## 3. Outdated / Deprecated Documentation

### Confirmed archive directory
- `docs/archive/` is the official historical archive containing 124+ files.
- `docs/archive/ARCHIVE_INDEX.md` documents the archive structure and rationale.

### Files flagged for archiving attention
| File / Pattern | Why flagged |
|----------------|-------------|
| `docs/archive/specs/008-nisab-year-record/SPECIFICATION_ANALYSIS_REPORT_OLD.md` | Explicitly named `OLD`; already in archive but duplicates archived report. |
| `docs/reports/NISAB_THRESHOLD_FIX.md` | Duplicates `docs/archive/reports/NISAB_THRESHOLD_FIX.md`; likely should be moved into archive or removed. |
| `docs/tracking-user-guide.md` vs `docs/user-guide/tracking.md` | Potential content overlap — verify which is canonical. |

### Root-level files that may need review
- `BACKLOG_ISSUES.md`
- `DEPLOYMENT_ISSUES.md`
- `IMPLEMENTATION-SUMMARY.md`
- `TEST_STABILITY_CHECKLIST.md`
- `auth-test-results.json`, `delete-test-result.json`, `payment-test-results*.json`

These are not necessarily deprecated, but they are stale artifacts from earlier milestones. They should be reviewed for archival.

**Recommendation**: Move `docs/reports/NISAB_THRESHOLD_FIX.md` into `docs/archive/reports/` (or delete if redundant) and reconcile duplicate user-guide/tracking docs.

---

## 4. ROADMAP.md and CHANGELOG.md Status

### CHANGELOG.md
- **Exists**: ✅ yes (`/home/chuwi_agent/zakapp/CHANGELOG.md`)
- **Current version**: `0.10.1` is present with entry dated `2026-02-16`.
- **Issue**: The bottom of the file still states:
  > “This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.”
  This contradicts the root `package.json` and the `LICENSE` file (AGPL-3). It appears to be a stale line left from an older template.
- **Missing**: No `0.10.2` or later unreleased section; no entry for the Muharram 1448 / June 2026 audit work.

### docs/roadmap.md
- **Exists**: ✅ yes
- **Last updated**: “September 22, 2025”
- **Project status**: “🟡 75% Complete — Zakat Calculation Phase In Progress”
- **Issue**: Out of date with current version `0.10.1` and the Phase 8/9 work already completed per `ROADMAP.md`. Milestone 4 also contains a duplicated/unchecked line:
  > `- [ ] Standard Method (AAOIFI-compliant) implementation`
  which appears immediately after the checked version of the same item.

### ROADMAP.md (root)
- **Exists**: ✅ yes (`/home/chuwi_agent/zakapp/ROADMAP.md`)
- **Status**: Mostly up-to-date through Phase 8 with remaining unchecked Phase 8/9 items:
  - Phase 8: Extract modals from `NisabYearRecordsPage.tsx`, remove unused imports.
  - Phase 9: Unified testing migration, strict financial typing, CI/CD build permissions.
- **Issue**: Phase 4 marks “Add AGPL-3.0 headers to all files” as complete, but this audit found 44 files still missing headers.

**Recommendation**:
1. Fix CHANGELOG.md MIT reference to AGPL-3.0-or-later.
2. Update `docs/roadmap.md` to reflect current version `0.10.1` and completed phases.
3. Add an “Unreleased” section to CHANGELOG.md for ongoing work.
4. Reconcile `ROADMAP.md` Phase 4 header status with the actual 44 missing headers.

---

## 5. Summary of Actions

| Action | Status |
|--------|--------|
| Fix `server/package.json` license to `AGPL-3.0-or-later` | ✅ Done |
| Verify root, client, shared, cli package.json licenses | ✅ Done (3 missing fields noted) |
| Count and sample missing AGPL headers in `server/src/**/*.ts` | ✅ Done — 44 files missing |
| Identify outdated docs / duplicates | ✅ Done |
| Review ROADMAP.md and CHANGELOG.md currency for `0.10.1` | ✅ Done |
| Save audit report to `docs/audit/license-docs-audit-2026-06-26.md` | ✅ Done |

---

## 6. Outstanding Items for Follow-up

1. Add `license` field to `client/package.json`, `shared/package.json`, and `cli/package.json`.
2. Add AGPL-3.0 headers to the 44 missing `.ts` files under `server/src/`.
3. Correct `CHANGELOG.md` MIT reference to AGPL-3.0-or-later and add an unreleased section.
4. Update `docs/roadmap.md` last-updated date, status, and milestone progress for `0.10.1`.
5. Move or delete duplicate `docs/reports/NISAB_THRESHOLD_FIX.md`.
6. Review root stale JSON/checklist files for archival.
