# Changelog

## [Unreleased]

_Nothing yet — the next cycle is `v0.18.0`, tagged 1 Jumada al-Thani 1448 (2026-11-10).
See `docs/RELEASE-CADENCE.md`._

## [0.17.0] - 2026-10-12

### Jumada al-Ula 1448 — data safety, money correctness, and a clean container

The first release on the lunar cadence. The theme is **trust in the numbers and the
data**: every zakat figure this release displays is one it can actually justify, and
every upgrade path was tested against a real copy of a production database before
being tagged.

**Upgrades are verified to lose nothing**

- **Backups are validated by content, not size.** The auto-migration path accepted a
  backup as good if the *file size* looked plausible, which an empty SQLite database
  with live WAL sidecars satisfies. A migration could therefore proceed with a useless
  backup sitting behind it. Backups now checkpoint the WAL first, compare a SHA-256
  digest, and run `PRAGMA integrity_check`.
- **Re-encryption cannot silently corrupt.** The startup migration rewrites legacy
  CBC ciphertext to AES-GCM in place. It now decrypts each newly written value and
  compares it to the original before committing the row, and it detects the
  fail-open case where a wrong key causes `decrypt` to return its own input —
  which would otherwise double-encrypt a record and still pass a round-trip check.
- **The migration no longer skips a column it claims to migrate.** It selected
  `payment_records.amount` but only ever wrote `recipientName` back, and its
  "migration needed?" probe looked at the name alone. A database with a migrated name
  and an unmigrated amount reported *"No CBC-formatted encrypted data found"* while
  the amounts remained on the legacy scheme. Both are now covered; values are
  preserved (verified 10/10 on a production copy).
- `scripts/ops/restore-backup.sh` — an interactive restore with row-count checks
  before it overwrites anything.

> Tested by applying this release's migrations to a copy of a live production
> database: all 35 tables preserved, `integrity_check` ok, row counts and value
> fingerprints byte-identical, and every encrypted value still decrypting.

**Money correctness**

- **Live exchange rates.** Rates were hardcoded to 2023 values and fed directly into
  the zakat engine, understating non-USD wealth by 42% (EGP) and 77% (TRY) — enough to
  tell a user they were below the nisab threshold when they were above it. Rates now
  come from a live provider with a one-hour cache, and conversions without a direct
  pair are solved through USD rather than falling back to 1:1.
- **Saved calculations record the rate they used** (`fxRateUsed`, `fxRateSource`), and
  `/rate-staleness` flags a saved calculation that current rates have moved ≥1% away
  from, so the user can recalculate. Historical records are never silently rewritten.
- **Payment amounts below 1,000,000 read back as `NaN`.** A base64 group-length check
  rejected short ciphertexts, and the fallback coerced them to `NaN`. Amounts now
  parse raw first and defer to authenticated decryption, with an explicit error rather
  than a silent `NaN`.
- **Ciphertext was being parsed as a number in six places.** `parseFloat` on an
  encrypted column does not usually throw — and in roughly **1 sample in 6 the
  ciphertext begins with a digit**, so it returns a small, plausible, *wrong* number
  instead of `NaN`. That silently understated totals in the year-over-year comparison,
  the live Hawl panel, the Hawl interruption check, the 4 AM summary job, payment
  aggregations and one model helper. All six now decrypt through a shared
  `encryptedNumbers` reader before any arithmetic.
- **Every amount now displays in the currency it was recorded in.** An asset held in
  IDR showed its retirement preview, and a payment list its totals, with a hardcoded
  `$`. Eleven further call sites built their own formatter with `en-US` conventions,
  rendering IDR as `IDR 50,000,000.00` instead of `Rp 50.000.000` on every onboarding
  screen. The client now has exactly one currency formatter; `useDisplayCurrency`
  delegates to it, and the SAR/EGP Arabic-Indic digit bug (an English-UI user seeing
  `١٬٢٣٤٫٥٦ ر.س.‏`) is fixed by pinning `numberingSystem: 'latn'`.

> **Non-Latin locales:** where a currency groups with commas, the separator changes.
> `1,500,000` renders `1.500.000` for IDR. Digits are unchanged; only the grouping
> mark follows the currency's locale.

**Export/import no longer destroys amounts**

- CSV export wrote *formatted* values (`$1,234,567.89`) while importers parsed with
  `parseFloat`, which returns `NaN` on both `$` and `,`. Combined with a `|| 0`
  fallback, **every amount silently became zero on re-import.** Export writes raw
  numbers with the currency in its own column, and import accepts every formatted
  shape older releases produced — including id-ID grouping, where `1.500.000` means one
  and a half million and must not parse as `1.5`.

**Security**

- **Containers no longer run as root.** The backend ran as uid 0, so an RCE in any
  route — or a compromised dependency — held root inside the container with write
  access to the mounted database and every secret in the process environment. The
  entrypoint still starts as root to chown a bind-mounted or fresh volume (SQLite needs
  write access to the *directory* for its `-wal`/`-shm` sidecars), then hands off with
  `setpriv`; migrations and the server run as `node`. Verified by building the image and
  checking the running process uid, on both a named volume and a host-owned bind mount.
- **Public signups are gated.** `allowRegistration` was enforced only in a route file
  the application never loaded, so disabling registration did not actually disable it.
  Both the live route and the email-verification failure path now fail closed.
- **The error handler was reconnected.** A commented-out middleware had been replaced
  by a catch-all returning a flat `500 Internal server error`, collapsing 54 distinct
  `AppError` statuses (400/401/404/501/503) into one unhelpful response. Clients again
  receive real status codes and machine-readable error codes.
- **Endpoints no longer fabricate answers.** The backup, restore, device-session,
  audit-log and privacy-settings endpoints returned hardcoded payloads — `restore`
  reported success while restoring nothing. Real data is read where it exists;
  unimplemented endpoints return `501` instead of inventing a result.
- `NisabService.getHistoricalNisab()` generated "historical" prices with `Math.random()`,
  and `useCompareSnapshots()` resolved an all-zero comparison that would have rendered a
  convincing "$0.00 change" table. Both now refuse rather than present invented data as
  real. Neither is reachable from any route today; this removes a trap for the next
  developer.
- Removed personal email addresses, operator install paths, production hostnames and a
  private LAN IP from tracked documentation. Added `docs/PUBLIC-PRIVATE-BOUNDARY.md`.

**Maintainability**

- **113 unreachable files removed (28,729 lines)** — 35 on the server (11,060 lines), 78
  in the client (17,669 lines), found with `knip` rather than guesswork. Nothing
  test-covered was deleted; files that carry real coverage are deliberately kept and
  flagged.
- `server/src/routes/auth.ts` split from **1,251 lines into a 62-line facade** over six
  route modules plus a shared helpers module, with all nine routes compared byte-for-byte.
  An unimported duplicate auth
  directory was removed — it was why a security fix once landed in a file the app never
  loaded.
- A dead payment subsystem and the old root `tests/` directory were removed.
- Added `client/knip.json` and `server/knip.json` so this stays checkable.

**Tests and coverage**

- Coverage gates added to both workspaces, wired into CI. Measured honestly with `include`
  globs: client **21.6%**, server **25.6%** at the start.
- The suites grew from **507 → 753** (server) and **605 → 622** (client), and coverage
  reached **38.8%** (server) on the way.
- New tests cover the calculation engine (2.9% → 62.4%), encryption round-trips and
  integrity, currency precision across 11 currencies, the backup verifier against real
  SQLite files, and both production ciphertext formats.
- Tests that previously **mocked the code under test** were replaced with ones that run
  the real implementation against real files.

**Release cadence**

- `docs/RELEASE-CADENCE.md`: one release per Hijri month, tagged on the first day. Phase
  1–10 sweep, 11–20 harden, 21–27 prepare, 28–1 release. A month is long enough to land
  something meaningful and short enough that debt cannot pile up.

**Suites:** server **753 pass** (69 files); client **622 pass / 1 skipped** (78 files).
TypeScript clean across all workspaces. Container image verified to build and serve.

**Full Changelog**: https://github.com/slimatic/zakapp/compare/v0.16.8...v0.17.0

## [0.16.6] - 2026-09-20

### Patch — registration gating, email verification recovery, admin transparency

- **Registration gate enforced on the live route.** `allowRegistration` was only
  checked in a file that no route imported, so the setting had no effect on the
  mounted handler. The live route now reads the setting and refuses with
  `REGISTRATION_DISABLED`, closing a public-signup bypass.
- **Registration no longer reports success when the verification email fails.**
  Signup returned `201 Created` even when delivery failed, leaving users unable to
  sign in and with no indication why. It now returns `VERIFICATION_EMAIL_FAILED`.
- **`POST /api/auth/resend-verification`** — an anonymous, non-enumerating recovery
  path for accounts whose initial email never arrived. The response is identical
  whether or not the account exists.
- **Admin system status** surfaces SMTP configuration health (no secrets) and a
  count of unverified accounts.
- **Login** offers "Resend verification email" when sign-in is blocked for an
  unverified account, and machine-readable error codes survive to the UI layer.

## [0.16.5] - 2026-09-20

### Patch — registration gate on the active handler, dark-mode liabilities

- Registration gating moved to the route the app actually mounts.
- `LiabilityList` and `LiabilityForm` replaced 34 hardcoded Tailwind `gray-*`
  classes with semantic tokens, fixing unreadable fields in dark mode.
- A static test prevents raw `gray-*` classes from returning to that subtree.

## [0.16.4] - 2026-09-20

### Patch — allowRegistration gate, public-repo boundary

- Closed the public signup bypass by checking `allowRegistration` before any
  validation work.
- Established the public/private documentation boundary: operator paths, hostnames,
  private IPs and personal emails are no longer committed. See
  `docs/PUBLIC-PRIVATE-BOUNDARY.md`.

## [0.16.3] - 2026-09-17

### Patch — upgrade safety, currency correctness, session hygiene

Ships the production defects found while triaging #267/#310 and the release-plan audit.

**Docker: the startup guard now actually runs, and is safe to upgrade into (#395, #267)**
- The published image never copied `docker/entrypoint.sh` and used the base Node `ENTRYPOINT`, so the secret-validation guard was dead code in every production container. It is now installed and wired up (`docker/Dockerfile.production`).
- **P3005 upgrade lockout fixed.** Instances whose schema predates migration history would have hard-failed on `prisma migrate deploy` and never started. The entrypoint and the new `docker/migrate-only.sh` now auto-baseline such databases — but only after `prisma migrate diff` proves the live schema already matches, recording migrations as applied **without re-running their SQL**. On genuine schema drift both fail closed rather than guess.
- Severity now matches the application: `ENCRYPTION_KEY` / `JWT_SECRET` are fatal (the app throws on them anyway); missing `JWT_REFRESH_SECRET` warns only, since the app boots with a random fallback.
- `DB_PATH` is derived from `DATABASE_URL` (it was hardcoded to `dev.db` while production uses `prod.db`, so the pending-migration probe checked the wrong file).
- Raw `JWT_SECRET` was being printed to the container log (`server/src/utils/jwt.ts`, `JWTService.ts`) — removed.
- Added `.dockerignore` (build context ~1.64 GB → 27 MB, and prevents a local `dev.db` from being baked into images).

**New: operator upgrade path**
- `scripts/ops/upgrade.sh` — backup-gated upgrade with a preflight that classifies the instance as fresh / migrated / unmigrated before changing anything.
- `docs/UPGRADING.md` — what P3005 means, the automatic path, manual baseline, rollback, and troubleshooting. Includes the `JWT_REFRESH_SECRET` logout loop (#267).

**Currency: dashboard no longer hardcodes USD (#310)**
- `ActiveRecordWidget` resolved the user's currency but still rendered six hardcoded `$` amounts, so an IDR user saw `$42,000,000.00` above `Rp 42.000.000` on one screen. `DashboardActionCards` and `ZakatDashboard` had the same flaw.
- All three now format through the canonical `useDisplayCurrency` hook. Note: USD renders `$6,500` rather than `$6,500.00` — matching the app-wide formatter.

**Push notifications (#383)**
- Logging out now detaches the device: `logout()` clears the session but previously left the PushManager subscription registered, so logged-out devices kept receiving push.
- The unsubscribe runs **before** the token is cleared (it is an authenticated request). If the server call fails, the browser subscription is still torn down and logout proceeds.

**Release process**
- `docs/release-cycle.md` corrected: every row was one Hijri month behind reality (2026-09-12 is 1 Rabi' al-Thani, not Rabiʿ al-Awwal). v0.17.0 retargeted to 1 Jumada al-Ula 1448 (2026-10-12).
- Version parity repaired: `cli` and `shared` were stranded at 0.15.2 while the rest were at 0.16.1.

**Full Changelog**: https://github.com/slimatic/zakapp/compare/v0.16.2...v0.16.3

## [0.16.2] - 2026-09-14

### Patch — push notification delivery

Retroactively recorded: this release shipped without a CHANGELOG entry.

- Push notification subscription + delivery work landed on top of 0.16.1 (PR #392, #386, #387).
- Added the `push_subscriptions` migration and VAPID key handling.

**Full Changelog**: https://github.com/slimatic/zakapp/compare/v0.16.1...v0.16.2

## [0.16.1] - 2026-09-12

### Patch — PushSubscription migration fix (#313)

Production-deploy verification caught that PR #382 added the `PushSubscription` Prisma model without a migration — `prisma migrate deploy` never created the `push_subscriptions` table in production (unit tests passed because the test setup falls back to `db push`).

- **Fixed**: additive-only migration `20260912160000_add_push_subscriptions` (CREATE TABLE + unique endpoint index + userId index + cascade FK to users). No drops, renames, or data changes. Verified on a scratch DB and applied cleanly in production; all user data intact.

No other changes. Version bump only so the release tag matches the deployed images exactly.

**Full Changelog**: https://github.com/slimatic/zakapp/compare/v0.16.0...v0.16.1

## [0.16.0] - 2026-09-12 — Moon Phase Release

User-facing summary: **Push notifications for Zakat due reminders. App now speaks Arabic (with full right-to-left support) and lays the groundwork for 7 more languages. Broken links show a friendly 404 instead of a blank page. Local installs without sync no longer throw errors. Security dependencies fully clean.**

#### Projects completed (all five from the v0.16.0 plan)

- **#339 React Router v7** (PR #378): `react-router-dom` 6.30.6 → 7.18.3 across the client. SPA surface needed zero import changes; the `future={{...}}` router flags became defaults. **Clears both remaining production advisories — `npm audit --omit=dev` is now 0 vulnerabilities.**
- **#313 Push notifications — server core** (PR #382): additive `PushSubscription` Prisma model (endpoint/p256dh/auth, cascade to user), idempotent subscribe/unsubscribe API (`/api/push/*`, zod-validated), `sendPushToUser` with automatic pruning of expired subscriptions, and a Zakat-reminder job that scans non-finalized Hawl windows ending within 30 days and fires on day 30/7/1 markers (deduped via `ReminderEvent`). Client subscription UI tracked in #383.
- **#338 i18n foundation** (PR #384): `react-i18next` wired with browser-language detection and sticky persistence (`zakapp_lang`); 8 locales declared (en, ar, ms, ur, fr, tr, id, bn) with clean English fallback; **full RTL support** (document direction flips for Arabic/Urdu); complete English + Arabic bundles for the onboarding wizard (all 8 steps) and dashboard education/assets/privacy panels; language switcher in Settings.
- **#321 Vitest 4 migration** (PR #374, closed with the suite green).
- **#340 code hygiene** (PR #372).

#### Fixed

- **Liabilities page crash** (#310, PRs #373/#375): legacy string-typed amounts no longer crash reduction functions, and the fix's own early-return no longer violates React hook order.
- **Dashboard currency format** (#310, PR #376): dashboard now uses the shared locale-aware `formatCurrency` — IDR displays `Rp 42.000.000` consistently across dashboard and analytics.
- **Blank page on unknown URLs** (#377, PR #379): a catch-all `NotFoundPage` renders a friendly 404 with links to Dashboard / Nisab Records / Calculator instead of a silent empty page.
- **Dark-mode date inputs** (#370, PR #380): native date/datetime/time/month pickers declare `color-scheme: dark` so UA chrome matches the dark surface.
- **ZK account pill overflow** (#370, PR #380): the long zero-knowledge identifier in the header truncates with ellipsis (capped at 12rem) instead of overflowing narrow viewports.
- **Local dev sync errors** (#371, PR #381): `POST /api/sync/token` returns a typed `503 SYNC_DISABLED` (honest disabled-state) instead of a raw 500 when CouchDB isn't configured; the client warns once and continues in local vault-only mode without error-chip spam; `.env.example` documents the optional CouchDB section.

#### Tests
- Server suite: **482 passing** (up from 474: +8 push-notification tests — subscription CRUD, expired-sub pruning, reminder day-marker firing, dedupe, no-subscriber no-op)
- Client suite: **546 passing / 1 skipped** (up from 540: +6 i18n foundation tests — namespace loading, Arabic translation output, skeleton-locale fallback, persistence, RTL direction mapping, language list)
- Both `tsc --noEmit` clean; production builds green; every fix verified live on the staged production build per the standing QA doctrine

#### Dependencies
- `react-router-dom` ^7.18.3 — clears GHSA open-redirect + SSR advisories
- `web-push` added as a direct dependency (push notification delivery), with graceful no-config fallback
- `npm audit --omit=dev`: **0 vulnerabilities**

#### Known follow-ups (filed)
- #383: client push subscription UI (service worker + settings toggle)
- i18n: remaining string extraction (settings tabs, admin, learn hub) + community translation bundles
- #360/#361 dark-mode/semantic-token sweeps → v0.17

**Full Changelog**: https://github.com/slimatic/zakapp/compare/v0.15.2...v0.16.0

## [0.15.2] - 2026-09-10

### 💱 Currency Consistency — Final Round of Issue #310

User-facing summary: **Currency setting now sticks everywhere. Totals no longer mix currencies. App recovers instead of showing "You're Offline." Reloading on `/assets/` paths works again.**

#### Fixed
- **Currency setting now persists** (#350): changing currency in Settings used to silently revert on page reload. ProfileForm now writes both the profile blob *and* `settings.currency` via `PUT /api/user/settings`, reading current settings first so nothing in the encrypted blob is clobbered.
- **Mixed-currency sums eliminated** (#350): Dashboard, AssetList, and NisabYearRecordsPage previously summed USD + IDR amounts directly (e.g. $500 + Rp 50M displayed as $50,000,500). A new `currencyNormalization.ts` util converts every amount to the display currency before summing, with a `converted` flag so a missing-FX state never silently displays apples+oranges. New server endpoint `GET /api/zakat/fx-rates` (USD base, optional auth) + `useFxRates` hook power the conversion.
- **Nisab endpoint fallback for pre-fix users** (#350): `/api/zakat/nisab` now falls back to the profile store's currency for users whose `settings.currency` was never populated by the earlier fix.
- **Client nisab cache keyed by currency** (#350): `getNisab(currency?)` now always sends `?currency=`; the query cache is keyed by currency. ZakatCalculator passes the user's currency, re-fetches on change, and its hardcoded `currency="USD"` payment modal is gone.
- **"You're Offline" dead-end fixed** (#350): Workbox `navigateFallback` pointed to `/offline.html` which wasn't precached on all routes, leaving users stranded. Now points to `/index.html` so the SPA boots and routes correctly. `offline.html` remains precached for genuine offline use.
- **nginx trailing-slash 403 fixed** (#350): `try_files` was probing `$uri/` for `/assets/` reloads, hitting autoindex-off 403 instead of falling through to the SPA. No longer probes the directory.

#### API changes
- New endpoint: `GET /api/zakat/fx-rates` — returns USD-base exchange rates for all supported currencies. Optional auth (authenticated callers get fresh rates; unauthenticated get cached).
- `GET /api/zakat/nisab` now has a profile-store currency fallback.

#### Honest caveat
Mixed-currency totals convert at FX fetch time, so for the first second after a cold load the Dashboard may show "Updating exchange rates…" instead of a number — deliberate (wrong number replaced by honest placeholder).

#### Tests
- Server suite: **474 passing** (up from 472: +2 contract tests pinning the profile fallback + fx-rates endpoint)
- Client suite: **504 passing / 15 skipped** (up from 480: +24 regression tests in `currencyRound4.test.ts` + `currencyNormalization.test.ts`)
- Client `tsc --noEmit` clean; client build green; regenerated `sw.js` inspected and confirmed

**Full Changelog**: https://github.com/slimatic/zakapp/compare/v0.15.1...v0.15.2

## [0.15.1] - 2026-09-10

### 💱 Currency Consistency — Server-Side Completion of Issue #310

#### Fixed
- **`POST /api/zakat/calculate` now returns results in the user's currency** (#348):
  the engine still computes in USD internally, but every displayed money field is
  converted before the response is sent — `totalAssets`, `totalLiabilities`,
  `netWorth`, `nisabThreshold`, `zakatDue`. An IDR user now sees IDR totals and an
  IDR nisab instead of USD-scale numbers.
- **Breakdown converted too**: `assetsByCategory` totals, per-asset
  `value`/`zakatableValue`/`zakatAmount`, liability amounts, and the
  `methodologyRules.nisabCalculation.effectiveNisab` are all scaled by the same
  `fxRateFromUSD`, so the Detailed Breakdown tab matches the summary
  (independent-review fix B2).
- **Currency resolution chain** (#348): explicit `?currency=`/body `currency` param →
  authenticated user's saved currency preference (decrypted settings blob) → USD
  fallback. Unknown/unsupported currency codes are whitelisted back to USD.
- **`GET /api/zakat/nisab`** now resolves currency from the query param → user
  settings → USD, and returns the resolved `currency` in the response (#348).
- **FX failure path is safe**: if the exchange-rate lookup fails, the response
  falls back to USD and is *labeled* USD — never silently mislabeled (#348).
- **Client call-sites**: `ActiveRecordWidget`, `Dashboard`, `ZakatSetupStep`,
  `MetalsStep`, `AssetList`, `ZakatResults` all pass the user's currency; no
  remaining live call-site hardcodes `'USD'` (`IdentityStep` stays USD by design) (#348).
- **`/api/zakat/nisab` uses optional auth** (review fix B3): pre-auth onboarding
  (`IdentityStep`) and the `/calculator` page keep working; only authenticated
  callers get a preference lookup (#348).
- **Summary arithmetic consistency** (review fix B1): `summary.totalLiabilities` is
  converted with the rest of the summary, so
  `netWorth = totalAssets − totalLiabilities` holds in every currency (#348).

#### API changes
- `summary.zirconYearAmount` removed (renamed `zakatDue`); `zirconYearRate` →
  `zakatRate`. `summary.currency` and `summary.fxRateFromUSD` added.
  Verified: zero remaining consumers of the removed fields repo-wide.

#### Tests
- Server suite: **472 passing** (up from 461: +11 in
  `currencyConsistency310.test.ts` pinning the fix contract — resolution chain,
  FX direction, failure fallback, client call-sites)
- Client suite: unchanged (471 pass / 15 skip) — display-side fixes were already
  in place from the #318/#323 rounds
- Client `tsc --noEmit` clean

**Full Changelog**: https://github.com/slimatic/zakapp/compare/v0.15.0...v0.15.1

## [0.15.0] - 2026-09-04