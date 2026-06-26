# ZakApp Moon-Cycle Release Cadence

## Purpose

ZakApp follows the **Islamic (Hijri) lunar calendar** for release cadence. Each new moon marks a new sprint; each crescent sighting window is a release window. This cadence connects the product's rhythm to the community it serves.

## Release Naming

Releases are tagged by Hijri year and month:

```
v1448.01  → Muharram 1448
v1448.02  → Safar 1448
v1448.03  → Rabi al-Awwal 1448
...
```

The **Muharram release** (Hijri New Year) is the *major* release — the one that gets the full QA pass, migration safety verification, and changelog audit. Other months are minor releases (bug fixes, small features, documentation).

## Hijri Months Reference

| # | Month | SC Release Scope |
|---|-------|-----------------|
| 1 | Muharram | **MAJOR** — Full audit, migration safety, version bump, Docker push |
| 2 | Safar | Minor — bug fixes, security patches |
| 3 | Rabi al-Awwal | Minor — small features, UX improvements |
| 4 | Rabi al-Thani | Minor — documentation, translation |
| 5 | Jumada al-Ula | Minor — infrastructure, CI/CD |
| 6 | Jumada al-Thani | Minor — performance, refactoring |
| 7 | Rajab | Stabilize — feature freeze, QA ramp |
| 8 | Sha'ban | Stabilize — release candidate, RC testing |
| 9 | Ramadan | **HOTFIX ONLY** — no new features during Ramadan |
| 10 | Shawwal | Minor — collect post-Ramadan feedback, quick wins |
| 11 | Dhu al-Qi'dah | Minor — prep for next Muharram |
| 12 | Dhu al-Hijjah | Minor — documentation, year-end cleanup |

## Sprint Timeline

```
Day 1-3:    Crescent sighting → Sprint planning (triage issues, assign tasks)
Day 4-25:   Development window (PR merges, feature work)
Day 26-28:  Code freeze → QA → RC → Release
Day 29-30:  Release + post-mortem
```

## Release Checklist (Muharram / Major)

1. **Pre-release audit** (1 week before)
   - Run full test suite (`cd server && npx vitest run`)
   - Run migration safety check (`scripts/backup-db.sh --dry-run`)
   - Run deadcode audit (check for committed artifacts, orphaned branches)
   - Run license audit (all `package.json` files have AGPL-3.0-or-later)

2. **Version bump**
   - Update `package.json` version across all workspace packages
   - Update `CHANGELOG.md` with new section
   - Update `ROADMAP.md` (mark completed items, add new ones)

3. **Build & push Docker**
   ```bash
   docker build -f docker/Dockerfile.production -t zakapp:v1448.01 .
   docker tag zakapp:v1448.01 zakapp:latest
   docker push # (if registry is configured)
   ```

4. **Git tag & push**
   ```bash
   git tag -a v1448.01 -m "Muharram 1448 release"
   git push --tags
   ```

5. **Post-release**
   - Delete merged branches (`git branch --merged main | xargs git branch -d`)
   - Archive completed roadmap items to `docs/archive/`
   - Create next month's milestone in issue tracker

## Release Checklist (Minor months)

Same structure but abbreviated:
- Run test suite
- Update `CHANGELOG.md`
- Tag as `v1448.XX`
- Push

## Bismillah Principle

Every release commit begins with `bismillah` — literally or figuratively. We start with intention, we ship with gratitude.

## Current Release: Muharram 1448

**Target:** ~June 26, 2026 (Gregorian approximation)
**Focus:** Stabilization, data retention safety, deadcode removal, license compliance

### Big-ticket items for 1448.01
- [x] Migration safety audit + backup script
- [x] Docker entrypoint hardening (remove `--accept-data-loss`)
- [x] License consistency (AGPL-3.0-or-later across all packages)
- [x] Deadcode removal (6 services, 1 middleware, committed artifacts)
- [x] Stale docs archived to `docs/archive/reports-2026-06-pre-muharram/`
- [ ] Server test suite stabilized (40 files → 0 failures)
- [ ] Client E2E baseline
- [ ] Moon-cycle release workflow automated (GitHub Actions)

### Deferred to Safar 1448
- NisabYearRecordsPage modal extraction
- Strict Decimal typing enforcement
- ESLint unused-import sweep
- Offline caching strategy
