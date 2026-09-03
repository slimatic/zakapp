# ZakApp Release Cycle — Hijri Moon-Cycle Cadence

> Adopted 1448-08 (Sha'ban 1448). Releases are cut at the **start of each Hijri month**, aligning the release rhythm with the lunar calendar.

## Cadence

- **One release per Hijri month**, tagged on (or within a day or two of) **1st of the Hijri month**, subject to local moon sighting (+/-1 day tolerance).
- PRs merge into `main` continuously throughout the month (CI-gated as always).
- At month start: version bump → CHANGELOG → tag `vX.Y.Z` → Docker Hub build (automated) → deploy to production (Umbrel, with pre-deploy backup).

## Upcoming Cycle Starts

Tabular Islamic calendar (hijridate Umm al-Qura approximation); actual dates may shift ±1 day with moon sighting:

| Hijri month | Approx. Gregorian start | Planned version |
|---|---|---|
| Jumada al-Ula 1448 | 2026-10-12 | v0.13.0 — Muharram-cycle stabilization release ✅ shipped |
| **Jumada al-Thani 1448** | **2026-11-11** | **v0.15.0** (v0.14.0 shipped early as an interim release on 2026-09-03 — see below) |
| Rajab 1448 | 2026-12-10 | v0.16.0 |
| Sha'ban 1448 | 2027-01-09 | v0.17.0 |

> v0.13.0 was originally targeted to coincide with 1 Muharram 1448 (June 2026); it slipped and is now releasing in the Jumada al-Ula cycle. Naming convention preserved from the Muharram 1448 audit that started this stabilization effort.
> **v0.14.0 — Ikhlas Night & Security Sweep** shipped 2026-09-03 as an interim release outside the lunar cycle: P1 security findings (server prod deps 7→0 vulns) were judged worth shipping immediately rather than holding until 2026-11-11. Includes dark mode (#336), Hawl countdown (#337), #320 closure (#335), a11y suite revival (#333). Next planned tag remains v0.15.0 at the Jumada al-Thani cycle.

## Per-Cycle Workflow

1. **During the month** — open PRs per workstream; keep `main` green; squash-merge.
2. **Release PR (last week of the cycle)** — version parity across all 5 `package.json` files, CHANGELOG entry with compare link, ROADMAP check-off.
3. **Day of release (1st of Hijri month)**:
   - Merge release PR (CI green gate).
   - Tag: `git tag -a vX.Y.Z -m "..." && git push origin vX.Y.Z`
   - Docker Hub workflow builds + pushes on tag.
   - Deploy: `scripts/ops/backup-before-upgrade.sh` on the server first, then pull new images and `docker compose up -d`.
   - Verify: 200 on `app.zakapp.org`, `api.zakapp.org/health`, `syncdb.zakapp.org`; migrations container ran `prisma migrate deploy` cleanly.
4. **Post-release**: close the cycle's milestone, open next cycle's tracking issue.

## Release Naming

Releases are named after the Hijri month they ship in (e.g., "v0.13.0 — Jumada al-Ula 1448")

## Automation

- Docker Hub build/push: `.github/workflows/docker-hub.yml` (on tag `v*` and main pushes)
- Tests + security scans gate every PR (test.yml, security-scan.yml)
- A future enhancement: GitHub Action that opens the release PR automatically on the 25th of each Gregorian month (the Hijri month's end varies; lunar math handled by a small script using the tabular calendar)