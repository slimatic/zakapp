# ZakApp Muharram 1448 Audit & v0.16.0 "Rabiʿ al-Awwal 1448" Release Plan

> **For Hermes:** Use subagent-driven-development to implement this plan task-by-task. Main is protected — every change is a PR. The user treats green CI as a hard gate.

**Goal:** Audit the full ZakApp estate, stabilize what is already in flight, and ship **v0.16.0** at the start of Rabiʿ al-Awwal 1448 (≈ **2026-12-10**, per `docs/release-cycle.md`), with data retention and zero breaking changes for current users as hard constraints.

**Audit date:** 2026-09-11. Everything below is verified against live `main` (de6985d9), live GitHub state, and the live dependency tree — not from memory or prior session logs.

---

## 1. Current State (verified today)

| Area | State |
|---|---|
| `main` @ de6985d9 | Clean; in sync with origin. **v0.15.2 shipped + deployed 2026-09-10** (GitHub Release + Docker Hub semver tags live). |
| Open PR | **#334** (Dependabot, sharp 0.34.5→0.35.4, client). All 9 checks green. Touches only `client/package.json`. |
| Open issues | #313 (push notifications), #321 (vitest 4), #338 (i18n), #339 (react-router v7), #340 (71 unused vars), #341 (NisabYearRecordsPage 717-line refactor). |
| Tests | Server 474/474, client 504 pass / 15 skip (baseline; re-verify locally before each merge). |
| Migrations | 11 migrations, current main migrations all additive-safe; 4 historical migrations contain `DROP TABLE` — all in the **known-safe redefine pattern** (CREATE new → INSERT SELECT → DROP old → RENAME). No new destructive migrations needed. |
| Docs | Moon-cycle cadence already adopted (`docs/release-cycle.md`); cadence table needs its **Rabiʿ al-Awwal 1448 / v0.16.0** row. |

### What "Muharram release" means now

`docs/release-cycle.md` already encodes the moon-cycle cadence the user described — this audit is operating **inside that cadence**, and the naming convention for cycles is preserved from the original Muharram 1448 audit. The release at the **start of the next Hijri month** (Rabiʿ al-Awwal 1448 ≈ 2026-12-10) is **v0.16.0**.

---

## 2. Audit Findings — the 11-layer pass

### P0 — Security (fix immediately, do not wait for the release date)

**P0-1. nodemailer 9.0.3 → ≥9.1.1 (4 high-severity advisories, prod dependency).**
- `server/package.json` pins `^9.0.3` → resolved 9.0.3. Advisories (all GHSA, all in prod dep):
  - GHSA-8m3c-c648-2xjj — resolveContent() bypasses disableFileAccess/disableUrlAccess (legacy signature)
  - GHSA-wmmp-3585-3rmp — IDN/Punycode domain allow-list bypass → email delivery to attacker-controlled domain
  - GHSA-2x7j-588g-ccc2 — quadratic complexity in addressparser → DoS via crafted address list
  - GHSA-cc9r-2j5m-2m83 — RFC 5 Two-digit RFC 5322 comment mis-parsing → recipient-domain validation bypass
- **Fix:** bump to `^9.1.1` (the advisory range is `<=9.1.0`), run server suite + tsc, PR + CI green, merge. This is the highest-priority item in the entire plan.
- This is the same playbook as v0.14.0 ("security findings ship immediately, don't hold for the cycle date") — bump PR does not wait for 2026-12-10.

**P0-2. Client deps: 2 moderate vulns (known/accepted).** `npm audit --omit=dev --legacy-peer-peer-deps` shows 2 moderates — these are the same react-router 6.x SSR-specific moderates documented and accepted in the v0.14.0 cycle; their fix is v7-only and is tracked as issue **#339**. No action beyond #339 (already on the roadmap). Verify the advisories are still the same two before re-affirming.

### P1 — Stabilization (land before the cycle's release PR)

**P1-1. Merge PR #334 (Dependabot sharp bump).** All 9 checks green, touches only `client/package.json`. Merge with `--squash --delete-branch`.

**P1-2. Close out the 15 skipped client tests (8 skip sites).**
- `core-web-vitals.test.ts` — `describe.skip` on an entire performance suite (needs a decision: implement or delete).
- `AssetList.passive.test.skip.tsx` — a file literally named `.skip` plus a placeholder `test.skip('preserved flaky')`.
- `AssetList.passive.test.tsx` / `AssetList.passive.test.tsx` — `describe.skip` "flaky test disabled".
- `AssetForm.passive.test.tsx` — `describe.skip` "Passive Investment Feature (spec)".
- `SyncService.test.ts` — `describe.skip` "SyncService Integration".
- **Decision rule (per codebase-audit skill):** fix and un-skip, or document with reason + issue reference — no silent skips. Triage each: fix (best) / document-as-issue / delete.

**P1-3. `prisma db push --accept-data-loss` grep (Layer 9) — RESOLVED, data-safety is in good shape.** Verified 2026-09-11:
- Prod entrypoint `docker/entrypoint.sh` **refuses to start on failed migration** (exits 1 with "restore from backup") and explicitly never falls back to `db push --accept-data-loss` — this is exactly the fail-closed data-safety gate we want.
- The only `--accept-data-loss` uses are **test-only** (`server/test/setupDatabase.ts`, `server/test/databaseHelpers.ts` — throwaway test DBs, fine) and an **opt-in, interactive, backup-first ops script** (`scripts/ops/docker-compose-migrate.sh --force-push`, requires typed `yes` confirmation, unused by CI/entrypoint).
- Add to the release-verification script: assert this state remains (no new `--accept-data-loss` outside test dirs + opt-in ops scripts).

**P1-3b. Deploy pipeline data-safety checks (Layer 9, deploy-side):** the compose `backend_data` volume is mounted at `/app/server/prisma/data` and `DATABASE_URL` resolves to `file:/app/server/prisma/data/prod.db` — the v0.15.2 deploy already verified this. Add this to the release-verification script: assert volume mount target == DATABASE_URL path in every release verification. (Existing script: `~/.hermes/skills/software-development/zakapp-maintenance/scripts/verify-zakapp-release.sh` should get this check.)

**P1-4. Migrations dir contains non-migration artifacts** (Layer 6/9): `dry_run_migrate_snapshots_to_nisab.py`, `migrate-snapshots-to-nisab-*.csv`, `marchive-snapshots-to-nisab.ts`, `transform-nisab-5` files in `server/prisma/migrations/` — one-off data-migration helpers committed **inside** the migrations directory, where Prisma walks and could mis-order/mis-read them. **Fix:** move to `server/scripts/data-migrations/` (archive, don't delete — Layer 9 discipline), update any references, verify `prisma migrate deploy` still clean. Low risk, high hygiene.

- Historical `DROP TABLE` migrations are all the safe redefine pattern (CREATE→INSERT SELECT→DROP→RENAME) — no new destructive migrations planned for v0.16.0. **v0.16.0 will be additive-only** as the data-safety constraint.

**P1-5. Route-reachability gate (feature-reachability lesson from v0.15.0):** the route-reachability test added in #347 must stay in CI and extend its page list as pages are added. Any new page must appear in the test's required-pages list in the same PR.

### P2 — Code quality / cleanup (during the cycle, all safe & additive)

**P2-1. TODO/FIXME inventory: only 13 TODO/FIXME in shipped source** (server: services×4, routes×1, middleware×1, controllers×1, config×1; client: hooks×1, + a few). This is very clean — triage each of the 13: implement / issue / delete. Likely one small PR.

- The 71 unused variables (issue **#340**, deferred from #320) and the NisabYearRecordsPage 717-line refactor (issue **#341**) remain **deferred, not in v0.16.0 scope** — both were explicitly deferred to a later cycle with "do not bulk-delete" guidance, and #341 is a big refactor with test churn risk. Keep as roadmap items.

#340/#341 stay open as roadmap items for a later cycle.

### P2-2. Dead-code sweep
- Legacy commented-out imports in `App.tsx` (Settings legacy line 68, TrackingDashboard line 91) — safe to delete (git history preserves them).
- `docs/archive/specs/018-milestone-6-ui/lighthouse-report.json` (504KB committed artifact) — per skill guidance, archive or delete from git; it regenerates on demand.
- Check `client/dist/` not tracked; `git ls-files client/dist` must be empty.

### P2-3. Duplicate docs
- `docs/MIGRATION.md` (v0.9.2 encryption guide) vs `docs/MIGRATION_GUIDE.md` (v0.10.0 ZK guide) — both are **user-facing migration guides for past versions** (encryption migration and ZK migration), not duplicates in content but stale. Per skill: archive to `docs/archive/` (not delete — users may need them for upgrading from very old versions) and add a README line pointing to current docs.

### P2-4. .beads issue tracker state file
- `.beads/issues.jsonl` (72KB) is committed — that's the tracker's own state file. Per AGENTS.md workflow, run `bd sync` as part of the release PR to keep issue state current. Not repo bloat in the same class as test artifacts; leave, but confirm `.beads/daemon-error` is NOT committed (verify `git ls-files .beads/` — only issues.jsonl should be tracked).

- `docs/archive/superseded/api-specification.md` — already archived (fine as-is).

### P2-5. Feature/quality opportunity shortlist (research-backed; spec before build)

**Quality bar rule:** v0.16.0 is a **stabilization + quality release**: additive features only, additive-only migrations, no breaking changes to existing user data.

- **Deferred features (roadmap, not v0.16.0):** multi-madhab compare-all-5 view, PDF ruling integration, family pooling, 401k/retirement-method options, i18n (#338), push notifications (#3 stretch). These are roadmap items, not cycle commitments.

- **Best in-cycle quality opportunities:**
  1. **Un-skip + fix the 15 skipped tests** (P1-2 above) — directly raises the quality bar. The passive-investment spec tests, SyncService integration suite, and Core Web Vitals suite are real coverage that exists but is dormant.
  15. **#341-lite: extract 1–2 modals from NisabYearRecordsPage (717 lines)** — pick the top-2 highest-churn modals, extract to their own files with tests (not full #341, which is deferred; a light extraction keeps the file below the readability threshold without a big-bang refactor).
  16. **Dark-mode token migration (small pass)** — migrate ~1–2 components from hardcoded `slate-*`/`bg-white` to semantic tokens (`bg-card`, `v0.15.0`-era token map in `tailwind.config.js`) as pilot; full migration stays roadmap. Pilot validates the migration path for a future cycle.
  17. 15. **UI/UX polish: form validation + loading/empty states** — audit the main flows (onboarding, add-asset, nisab record create) for missing loading/empty/error states; fix gaps. (gstack-rst-cso/gstack-rst-design-html standards: honest states, no demo content, no dead anchors, a11y form-label checks.
  18. **Docs refresh** — update `docs/release-cycle.md` cadence table (add Rabiʿ items in the table rows 15–16 are numbering artifacts of the plan itself — keep the 4 numbered items above as the quality shortlist.

### P2-5 corrected numbering: the four quality opportunities for v0.16.0 are:
1. Un-skip + fix the 15 skipped tests (P1-2).
2. #341-lite: extract top-2 modals from NisabYearRecordsPage.
3. Dark-mode token pilot (1–2 components) + UI/UX polish pass (loading/empty/error states on main flows).
4. Docs refresh: release-cycle table row + MIGRATION.md/MIGRATION_GUIDE.md archival + App.tsx legacy-comment cleanup.

### P3 — Release cadence hardening

**P3-1. Cadence table update:** add Rabiʿ al-Awwal 1448 / 2026-12-10 / v0. Jumada al-Thani... — fix the table in `docs/release-cycle.md` to add the v0.16.0 row.

**P3-2. Automated release-PR workflow (documented future enhancement in release-cycle.md):** a GitHub Action that opens the release PR automatically at month-end. This was already documented as "a future enhancement" in the doc — keep it roadmap, don't build it this cycle.

**P3-3. Moon-cycle delivery target:** releases are tagged at the start of each Hijri month (±1 day, moon sighting tolerance). v0.15.2 shipped 2026-Sha'ban-cycle, v0.16.0 targets the start of Rabiʿ al-awwal 1448 (≈2026-12-3 to 2026-12-10 window per tabular calendar).

---

## 3. Workstreams & Execution Order (stabilization flow)

Per the codebase-audit stabilization flow, in order:

- **Stream A — Security & infra (immediately, no date wait):**
  1. nodemailer → ^9.1.1 PR (P0-1) — highest priority.
   npm audit fix is NOT used (established repo rule: deliberate bumps + tests, no blind audit fix). Deliberate bump + both test suites + tsc + build.
  2. Merge PR #334 (P1-1).
  Stream A items are NOT held for the release date — security ships immediately (v0.4.0 precedent).

- **Stream B — Data safety (before any schema change)**: P1-3/P1-3b verifications + verify-zakapp-release.sh hardening. v0.16.0 migrations additive-only, and the deploy procedure (pull explicit version tag → backups → up --force-recreate → image-ID parity → external 200s + auth smoke + live-bundle greps) already exists and is proven across v0.13.0→v0.15.2. No new deploy-path changes needed — just keep following the proven sequence with the volume/DATABASE_URL assertion.

- **Stream C — Docs & hygiene (low-risk, early)**: P2-2/P2-3/P2-4 cleanup PR (App.tsx legacy comments, lighthouse artifact, MIGRATION docs archival, .beads check, cadence-table row for v0.1.0 row.
  1. Archive stale migration helpers out of `server/prisma/migrations/` (P1-4).
   Stream C items ship via one "docs + repo hygiene" PR.

- **Stream D — Test-health sprint (during cycle)**: P1-2 skip-epidemic triage (fix/document/delete per test, no silent skips) — biggest quality win of the cycle.
- **Stream E — Code quality (during cycle)**: #341-lite modal extraction (P2-5 items 2), dark-mode token pilot, UI/UX state-polish pass.
- **Stream F — Docker/CI**: current CI is in good shape (test.yml + security-scan.yml split is correct; do not re-add security scans to test.yml). No changes planned.

- **Stream G — Release (start of Rabiʿ al-Awwal ≈ 2026-12-10)**: version bump all 5 packages → CHANGELOG → tag → GitHub Release → docker-hub build → Umbrel deploy with pre-deploy config+DB backups → live verification (external 200s, auth 401 smoke, live-bundle greps, DB row counts pre/post).

---

## 4. Verification checklist (v0.16.0 hard gate)

- [ ] nodemailer ≥9.1.1, server npm audit prod = 0 high/critical
- PR #334 merged
- 0 silent skipped tests — every skip has a documented reason + issue ref (or is fixed)
- Zero `accept-data-loss` in any prod entrypoint
- verify-zakapp-release.sh asserts volume mount == DATABASE_URL path
- v0.16.0 migrations additive-only (no DROP TABLE/COLUMN, no DELETE FROM in new migrations)
- All 5 package.json at 0.16.0; CHANGELOG + compare link
- Both test suites green (baseline server 474, client 504+15 skip → target: fewer skips than baseline)
- Client build green with `navigateFallback` = `/index.html` in generated `dist/sw.js`
- Umbrel deploy verified: image-ID parity, external 200s, auth 401 smoke, live-bundle greps for any UI change, DB row counts stable across deploy (data retention proof)
- Route-reachability test extended for any new pages

## 5. Risk assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---| always |
| nodemailer bump breaks email flows | Low | High | Bump is a patch-range bump (9.0.3→9.1.1) in semver-compatible range; run full server suite; email tests exist. |
| Un-skipping tests surfaces real bugs | Medium | Medium | Budget: fix or document; the point is to surface them **now**, not hide them. |
| #341-lite extraction breaks a11y mock factories (barrel exports) | Medium | extraction | Follow the established pattern: update the a11y test's `vi.mock` factory to export every new barrel symbol. |
 #341-lite extraction trips the a11y-suite mock-factory rule (new barrel symbols must be added to the mock factory) — known pattern, documented in the maintenance skill. |
| UI polish touches a component with hardcoded USD/formatCurrency | Low | Medium | Currency rules are documented: `useAuth` mock pattern + currency consistency tests will catch it. |
| Deploy-day issues (CouchDB healthcheck deadlock, zombie containers) | Medium | High | Deploy sequence from the maintenance skill is proven (v0.15.2 recovery); backups before deploy; rollback by re-tagging the old image ID. |
| Data loss on deploy | Low | Critical | Prod entrypoint already fail-closed (migrate deploy or exit 1), volume mount == DATABASE_URL assertion, pre-deploy config+DB backups, DB row-count check post-deploy. |
| Open-source/license drift | Low | Medium | Layer 5 spot-check in the release verification script (license field parity across 5 packages). license field parity across the 5 package.json files is in the checklist. |

## 6. Big-ticket items for the Rabiʿ al-Awwal (v0.16.0) release

1. **Security:** nodemailer ≥9.1.1 (P0) + merged #334 → **0 high/critical prod vulns**
2. **Test health:** 15 skipped tests triaged (fix/document/delete)
3. **Data safety:** additive-only migrations, deploy-verification script asserts volume==DATABASE_URL, backup→deploy→row-count verification as standing procedure
4. **Quality:** #341-lite modal extraction, dark-mode token pilot, UX state polish (loading/empty/error on main flows)
5. **Repo hygiene:** artifacts archived, duplicate docs archived, App.tsx legacy comments removed, migrations dir cleaned of one-off scripts
6. **Docs:** release-cycle table updated, CHANGELOG user-friendly
7. **Cadence:** v0.16.0 tagged ≈2026-12-10 (start of Rabiʿ al-Awwal 1448), then v0.17.0 ≈2027-01-09 (Sha'ban 1448)

## 7. Deferred to later cycles (explicitly out of scope for v0.16.0)

- #339 react-router v7 (clears the last 2 client moderates) — dedicated migration task
- #338 i18n — big; needs its own cycle
- #313 push notifications — needs PushSubscription model + API + scheduler
- #321 vitest 4 — dedicated migration task, never bundled with other dep bumps
- #340 71 unused variables — triage-only, "do not bulk-delete" rule
- #341 full refactor — #341-lite is the in-cycle slice
- Multi-madhab compare-all-5 view, PDF ruling integration — need spec path
- Family pooling, 401k/retirement-method options — need research + spec
- Auto-release-PR GitHub Action — documented future enhancement

---

*Audit method: 11-layer pass against live repo state 2026-09-11; findings verified against live GitHub (PRs/issues/workflow runs), Docker Hub, and the live dependency tree via npm audit. No findings taken from prior session logs without live re-verification.*