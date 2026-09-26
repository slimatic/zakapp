# Release Cadence

ZakApp is released on the **Islamic lunar month**. This is not decoration — it fits
the software: zakat is assessed on a lunar year (ḥawl), so a project about lunar
reckoning keeps time the same way its users do.

## The rule

**One release per Hijri month, aimed at a lunar anchor. The anchor is a preference, not a
contract.**

```
1 Jumada al-Ula    1448  ->  2026-10-12   (Mon)   next release
1 Jumada al-Thani  1448  ->  2026-11-11   (Wed)
1 Rajab            1448  ->  2026-12-10   (Thu)
1 Sha'ban          1448  ->  2027-01-09   (Sat)
1 Muharram         1449  ->  2027-06-06   (Sun)   Muharram release
```

Dates use the **Umm al-Qura** calendar (the official Saudi reckoning, and the most widely
published). The tabular method can differ by a day or two.

> **Verify before relying on this table**, and re-verify it when it is more than a few
> months old. An earlier revision listed `1 Rajab 1448` as `2027-01-09` — which is
> `1 Sha'ban`, a month later. Rajab had been skipped entirely. Lunar date tables are easy
> to get subtly wrong: check them against a published calendar, not against arithmetic done
> in your head.

## Two anchors, about ten days apart

The 1st of a Hijri month **is** the hilāl — the sighting of the new crescent. So "release
on the 1st" and "release at waxing gibbous" are not the same day; they are roughly ten days
apart, and which one you pick is a real choice:

| Anchor | When | What it says |
|---|---|---|
| **New crescent** (1st of month) | day 1–2, ~2% lit | The month begins. Clean, calendar-legible, easy to schedule. |
| **First quarter** | day ~7–8, ~50% lit | Halfway to full. |
| **Waxing gibbous** | day ~9–14, 50–98% lit | Growing toward full. Pairs with "shipped and still growing". |

Both are legitimate. A waxing moon is a growing moon, which suits a release; the crescent
is the month's own boundary. Pick one and name it in the release notes.

Check the phase rather than estimating it:

```bash
python3 - <<'PY'
import math, datetime
d = datetime.datetime.now(datetime.timezone.utc)
y, m = d.year, d.month
if m <= 2: y -= 1; m += 12
A = y // 100; B = 2 - A + A // 4
jd = math.floor(365.25*(y+4716)) + math.floor(30.6001*(m+1)) + d.day + B - 1524.5
age = (jd - 2451550.1) % 29.530588853
illum = (1 - math.cos(2*math.pi*age/29.530588853)) / 2
bands = [(1.0,"new moon"),(6.4,"waxing crescent"),(8.4,"first quarter"),
         (13.8,"waxing gibbous"),(15.8,"full moon"),(21.1,"waning gibbous"),
         (23.1,"last quarter"),(29.6,"waning crescent")]
print(f"{d:%Y-%m-%d}  {[n for a,n in bands if age < a][0]}  {illum*100:.0f}% lit  day {age:.0f}")
PY
```

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

## When to deviate

The cadence exists to make releasing **regular**, not to make it **cumbersome**. Deviate
deliberately, and record why in the release log below.

Good reasons:

- **A security or data-safety fix is verified and waiting.** Do not hold it for a calendar.
  Ship a patch release; the lunar release still happens on schedule.
- **The work is finished and verified early.** Releasing at a waxing phase inside the
  current month is within the spirit of the cadence. A release that sits finished for three
  weeks is not "more disciplined".
- **A data-safety issue is found late.** Data safety outranks the date. Delay, fix, verify.

Bad reasons:

- Releasing because it is the date, with the suite red or the upgrade path untested.
- Skipping the cleanup sweep because "there is not much to clean".
- Letting the anchor slip silently, month after month, until the cadence is fiction.

The rule of thumb: **the anchor decides when you start preparing, not what you are allowed
to ship.**

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
| v0.17.1 | 2026-09-25 | 13 Rabi al-Thani 1448, waxing gibbous 98% | **No** — data-safety patch |
| v0.17.2 | 2026-09-26 | 15 Rabi al-Thani 1448, full moon 99.8% | **No** — fix merged but undeployable |

**v0.17.0 was released off-anchor, deliberately.** The work was finished and verified: the
full suite green, and the upgrade path proven against a copy of a live production database
with every row and value fingerprint intact. The next lunar anchor was three weeks away.
The cadence's own rule is that *a finished, verified release sitting for three weeks is not
more disciplined than shipping it* — so it shipped, on a waxing gibbous, and the deviation
is recorded here rather than hidden.

That is the cadence working, not bending. What would have been a deviation from the spirit
is shipping with the suite red or the upgrade path untested; neither applied.

**v0.17.1 was released off-anchor as a data-safety patch.** The cadence's own rule allows
this: *not every patch waits for a lunar boundary.* v0.17.0 shipped a backup pipeline that
could corrupt money on restore — a value containing the `ZK1:` ciphertext marker was parsed
into a plausible wrong number, and unparseable amounts became silent zeros. Since the
documented pre-upgrade step is "export first", a release that made the export untrustworthy
threatened the very safety net the next release depends on. Holding it for 2026-10-12 would
have left a second month of exports corrupted. Verified, so it shipped.

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