# Changelog

## [0.16.5] - 2026-09-20

### Patch — security: the allowRegistration gate now actually runs

**v0.16.4 did not close registration (#407)**

v0.16.4 added the gate to `server/src/routes/auth/register.ts`. Nothing imports that
module — it is dead code. The handler served at `POST /api/auth/register` lives in
`server/src/routes/auth.ts`, so the gate was never executed and registration remained
open with `allowRegistration = false`.

The gate is now in the mounted handler, before any validation or user creation,
failing closed (`503`) if the setting cannot be read.

The earlier test passed because it called the patched module directly. The replacement
drives the real express app, so it fails if the gate exists only in an unused module.

**Also**
- `test.yml` now runs on `release/**`. A pull request against a release branch was
  receiving only the secret scan, so a patch release could merge with no tests run.

> **Operators:** verify on your instance that registration is actually refused. Two
> register handlers existed, and patching the unreferenced one produced a fix that
> looked complete but changed nothing.

## [0.16.4] - 2026-09-20

### Patch — security: enforce the `allowRegistration` setting

**Public registration could not be disabled (#407)**

The `allowRegistration` system setting was stored, exposed through the admin API, and presented as a working toggle in the admin UI — but nothing read it on the registration path. Setting it to `false` had no effect: `/api/auth/register` validated the payload and created the account regardless.

For any deployment intending closed or invite-only signups, this silently defeated that intent while the UI reported otherwise.

The registration handler now consults the setting **before** any validation or user creation, so it cannot be bypassed with a malformed body. It fails closed: if the setting cannot be read, registration returns `503` rather than silently falling through to open signups.

Audited the sibling setting in the same struct: `requireEmailVerification` is genuinely enforced (`auth/login.ts`, `auth.ts`). `allowRegistration` was the only decorative one.

> **Operators on a release before 0.16.4:** with the earlier code, flipping `allowRegistration` to `false` does not close registration. Until you upgrade, restrict it at the edge.

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