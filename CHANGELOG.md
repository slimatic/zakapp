# Changelog

## [Unreleased]

### Documentation hygiene — public/private boundary

Tracked documentation had accumulated operational detail that does not belong in a
public repository. Removed:

- **Personal email addresses** from registration walkthroughs and fix reports
  (8 files, both `docs/reports/` and its duplicate `docs/archive/reports/` tree).
  Examples now use the IANA-reserved `example.com` domain.
- **Operator-specific install paths** (`~/<app-platform-dir>/<user>/services/...`) replaced with
  the documented placeholder `<ZAKAPP_INSTALL_DIR>`, with a new preamble explaining
  that the path is wherever *you* installed ZakApp.
- **Production service hostnames** (frontend, API, sync endpoints) replaced with
  `<YOUR_APP_HOST>` / `<YOUR_API_HOST>` / `<YOUR_SYNC_HOST>`. The project's reference
  deployment is publicly linked as a demo; its internal service topology is not
  documented here.
- **A private IP on the maintainer's LAN subnet** in `IMPLEMENTATION-SUMMARY.md` and
  `docs/NGINX-PROXY-MANAGER.md`, replaced with a neutral RFC1918 example.
- **The maintainer's name** in registration examples and release-plan attributions.

Added `docs/PUBLIC-PRIVATE-BOUNDARY.md`: the rule, the never-commit table, the
synthetic-test-data convention, and grep checks to run before pushing.

> Note: this repo is the open-source software; `zakapp.org` is one deployment of it.
> They are related but distinct, and documentation must not conflate them.

## [0.17.0] - 2026-10-12

### Jumada al-Ula 1448 — currency correctness, import safety, logging hygiene

**Currency formatting consolidated**

Both currency formatters in the client were wrong, in different ways, so the same
amount could render differently depending on which screen you were on.

- **SAR and EGP rendered Arabic-Indic digits.** An English-UI user saw
  `١٬٢٣٤٫٥٦ ر.س.‏` for a Saudi riyal amount. The canonical formatter now pins
  `numberingSystem: 'latn'` while keeping each currency's own symbol, placement and
  grouping.
- **IDR showed the code instead of the symbol** (`IDR 15,750,000`), and the
  dashboard's hardcoded `$` could appear above a `Rp` figure on the same screen.
  IDR now renders `Rp 15.750.000`.
- **Decimals are now strict per currency** — USD always 2, IDR/JPY/KRW 0 — rather
  than a 0–2 range that let `$1,234.5` and `$1,500,000` appear side by side.
- `useDisplayCurrency` now delegates to the canonical `formatCurrency`, so the two
  cannot drift apart again.
- **28 duplicate `formatCurrency` definitions removed** across three passes. Eleven
  were byte-identical for USD; eleven hardcoded USD with no currency source; five
  read a record's own currency. Where a wrapper carried a guard — `privacyMode`
  masking in `AssetCard`, the `NaN` guard in `FinalizationModal` — the wrapper was
  kept as a thin delegate so no guard could be lost.

> **Non-Latin locales:** if your display currency uses comma grouping, the separator
> changes. `1,500,000` now renders `1.500.000` for IDR. The digits are unchanged;
> only the grouping mark follows the currency's locale.

**Export/import no longer destroys amounts**

- CSV export wrote *formatted* values (`$1,234,567.89`) while the importers parsed
  with `parseFloat`, which returns `NaN` on both `$` and `,`. Combined with a `|| 0`
  fallback, **every amount silently became zero on re-import.** Export now writes raw
  numbers with currency in its own column, and import accepts both raw values and
  every formatted shape older releases produced — including id-ID grouping, where
  `1.500.000` means one and a half million and must not parse as `1.5`.
- Importers now return `NaN` on unparseable input instead of silently writing `0`.

**Security**

- The `allowRegistration` gate and the verification-email handling from the 0.16.x
  maintenance line are present on `main`; a build from this tree can no longer ship
  open public signups.

**Fabricated data paths removed from Zakat and auth surfaces**

- `NisabService.getHistoricalNisab()` generated its "historical" nisab values with
  `Math.random()`. Presented as trend data these are indistinguishable from real
  prices. The method has **no callers**, so nothing shipped broken — but it was a
  loaded gun in a religious-finance codebase. It now throws until a real historical
  price source is integrated.
- `useCompareSnapshots()` resolved a hard-coded all-zero comparison (`assetGrowth: 0`,
  `differences: []`). `SnapshotComparison.tsx` binds those fields with `|| 0`
  fallbacks, so wiring that screen up would have rendered a complete
  **"$0.00 change / 0.0%"** table for any two records — visually identical to a
  genuine no-change result. It now rejects, and the component shows an explicit
  "not available" state. **Neither component is reachable from any route today**;
  this removes a trap for the next developer rather than changing current behaviour.
- `AuthMiddleware.authorize()` hard-coded `const userPermissions: string[] = []`
  ahead of an `every()` check, so any future `authorize(['x'])` call would have
  403'd for every user regardless of role. It now returns
  `501 AUTHORIZATION_NOT_IMPLEMENTED` rather than pretending. No caller passes a
  non-empty list today.

**Logging**

- The server logger's `info()` wrote straight to the container log with no
  environment gate; the client sibling already gated on `NODE_ENV` and the two had
  drifted. Now consistent.
- **58 `console.log` sites across 24 production files** now route through the
  per-workspace logger — lifecycle events to `info`, diagnostics to `debug`. Test,
  story and mock occurrences are deliberately untouched.

**Maintainability**

- `server/src/routes/auth.ts` split from **1,251 lines into a 62-line facade** over
  six focused modules. All nine Express routes were compared byte-for-byte before
  and after. An unimported duplicate auth directory was removed — it was the reason
  a security fix once landed in a file the app never loaded.
- Removed the orphaned root `tests/` directory (25 files, last touched 2026-05-18).
  It was referenced by **no CI job and no npm script** and could not run from the
  repo root.
- Added `server/tests/contract/payments.contract.test.ts` — a real contract test for
  the shipping API covering auth rejection, validation failure and ownership checks.

**Dark mode**

- Gradient stops, focus rings and `border-gray-500` were unmapped in the dark theme,
  leaving skeleton shimmers flashing bright and focus rings invisible. Mapped, with a
  static test that fails if an unmapped `gray-*` utility is introduced.

**Public/private boundary**

- Removed personal email addresses, operator install paths, production hostnames and
  a private LAN IP from tracked documentation. Examples now use `example.com` and
  RFC1918 ranges. Added `docs/PUBLIC-PRIVATE-BOUNDARY.md`, which states the rule, the
  never-commit table, and the grep checks to run before pushing.

**Suites:** server **507 pass** (53 files); client **605 pass / 1 skipped** (76 files).
TypeScript clean across all workspaces.

**Full Changelog**: https://github.com/slimatic/zakapp/compare/v0.16.3...v0.17.0

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