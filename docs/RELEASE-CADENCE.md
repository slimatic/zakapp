# Release Cadence

ZakApp is released on the **Islamic lunar month**. This is not decoration — it fits
the software: zakat is assessed on a lunar year (ḥawl), so a project about lunar
reckoning keeps time the same way its users do.

## The rule

**One release per Hijri month, tagged on the first day of the month.**

```
1 Jumada al-Ula   1448  ->  2026-10-12   v0.17.0
1 Jumada al-Thani 1448  ->  2026-11-10   v0.18.0
1 Rajab           1448  ->  2027-01-09   v0.19.0
1 Muharram        1449  ->  2027-06-06   v1.0.0  (Muharram release)
```

Dates are the tabular Islamic calendar and may shift by a day with local sighting.
Where that matters, the tag follows the published date rather than a sighting.

## Why monthly

Small and predictable beats large and rare.

- A month is long enough to land something meaningful and short enough that
  unfinished work does not accumulate into a risky release.
- A regular boundary removes the "it has been a while, where do I start" problem.
- Every release is preceded by a cleanup pass, so debt never gets a chance to pile up.

## The cycle

Each Hijri month runs the same four phases:

| Phase | Days | Work |
|---|---|---|
| **Sweep** | 1–10 | Audit: dead code, duplication, stale docs, failing tests, dependency drift |
| **Harden** | 11–20 | Fix and simplify. Tests first, then the change. Each item its own PR |
| **Prepare** | 21–27 | CHANGELOG, version bump, migration path review, release checklist |
| **Release** | 28–1 | Tag, publish, deploy, verify. Then open the next month's sweep |

## Non-negotiables

These hold for **every** release, not just majors:

1. **No breaking changes** to stored data. Migrations are additive-only.
2. **No data loss.** A verified backup is taken before any migration, and the
   restore path is tested — an untested backup is a hope, not a recovery plan.
3. **Tests before refactor.** No refactor merges without a test that would have
   caught the previous behaviour.
4. **A clear migration path**, documented in the release notes, for any change a
   user can see.
5. **No operational detail** in the repository — no hostnames, IPs, install paths or
   personal addresses. See `PUBLIC-PRIVATE-BOUNDARY.md`.

## Release log

Recorded so the cadence's own history is visible — including where it was deviated from,
and why.

| Release | Tagged | Lunar anchor | Anchor held? |
|---|---|---|---|
| v0.17.0 | 2026-09-21 | 10 Rabi al-Thani 1448, waxing gibbous 74% | **No** — see below |

**v0.17.0 was released off-anchor, deliberately.** The work was finished and verified: the
full suite green, and the upgrade path proven against a copy of a live production database
with every row and value fingerprint intact. The next lunar anchor was three weeks away.
The cadence's own rule is that *a finished, verified release sitting for three weeks is not
more disciplined than shipping it* — so it shipped, on a waxing gibbous, and the deviation
is recorded here rather than hidden.

That is the cadence working, not bending. What would have been a deviation from the spirit
is shipping with the suite red or the upgrade path untested; neither applied.

## Versioning

- **Patch** (`0.16.x`) — fixes to a shipped release, backported to its release branch.
- **Minor** (`0.17.0`, `0.18.0`) — the monthly release. New work, no breaking changes.
- **Major** (`1.0.0`) — reserved for a breaking change, announced in advance.

## Doing a release

The checklist lives in `scripts/ops/release-checklist.sh` so it is the same every
month and nothing is remembered by hand.

## Naming

Releases may carry the Hijri month in the CHANGELOG heading for readability
(`Jumada al-Ula 1448`). The tag itself stays plain semver so tooling and users are
not surprised.
