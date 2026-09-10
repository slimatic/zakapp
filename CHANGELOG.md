# Changelog

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