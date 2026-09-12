# Changelog

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