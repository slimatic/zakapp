# Changelog

## [Unreleased]

_Nothing yet. The next cycle is `v0.18.0`, aimed at **1 Jumada al-Thani 1448 (2026-11-11)**.
See `docs/RELEASE-CADENCE.md` — the anchor is a preference, not a contract._

## [0.17.2] - 2026-09-26

### 15 Rabi al-Thani 1448 — full moon, 99.8% lit

The push-notification fix was merged to `main` but never reached a deployment. The published
`0.17.1` image was built 3h20m before the fix landed, and since production pins an explicit
semver rather than `:latest`, a newer image cannot arrive on its own. Shipped off-anchor under
the cadence's "a security or data-safety fix is verified and waiting" exception.

**Correctness**

- **Web-push notifications could never be displayed.** The handlers existed on disk but were in
  no branch and never in the bundle: `.gitignore`'s blanket `*.js` rule matched
  `client/public/sw.js`, and workbox's `generateSW` mode writes its own `dist/sw.js` and
  discards any hand-written one. The service worker registered twice as well. The served worker
  contained **zero** push listeners while VAPID was configured and the subscribe UI worked —
  so it failed silently. Handlers now live in `public/push-sw.js`, that path is explicitly
  un-ignored, and workbox pulls them in via `importScripts` so the tuned `navigateFallback`
  and `runtimeCaching` rules stay intact.
- **Deleted an unreachable PDF that asserted unverified fiqh claims.** It was reachable from
  nowhere but shipped in the bundle, and stated a fixed "Silver Standard" and a "Default:
  Hanafi" that would have contradicted the user's own madhab setting, plus an unattributed
  "(Majority Opinion)". A document that misdescribes its own calculation is worse than no
  document.

**Maintenance**

- Removed a dead parallel payment API: 7 routes, a controller and a service, 868 lines total,
  with no client caller. The `ZakatPayment` table is **not** removed — three live readers use it
  (user data export, backup payload, migration detection), so dropping it would have silently
  changed what a user's backup contains.

**Testing**

- 15 guard assertions across two files, each verified by mutation: removing the
  `importScripts` wiring, the `.gitignore` negation, or re-introducing the fabricated claims
  all fail the suite. The push path is additionally verified behaviourally — a real `push`
  event dispatched into the built worker in Chromium produces a notification.

## [0.17.1] - 2026-09-25

### 13 Rabi al-Thani 1448 — waxing gibbous, 98% lit

A patch release for the upgrade path itself. Shipping v0.17.0 with a backup that
silently corrupted money would have made every pre-upgrade export untrustworthy —
which is the one thing the cadence asks users to do first. Off-cadence by design,
under "a security or data-safety fix is verified and waiting".

**Export/import**

- Amounts could come back as a **wrong number rather than an error.** A parser
  stripped non-digits from a value, so ciphertext (`ZK1:…`) became a plausible
  integer. Import now rejects anything carrying the `ZK1:` marker and every
  unparseable amount, instead of falling back to `|| 0` and writing a silent zero.
- **Profile settings were exported as ciphertext**, so restoring them
  double-encrypted the values and made them permanently unreadable. Settings now
  export as plaintext like the other four collections.
- Backups are **not encrypted**, deliberately: a backup that needs the original
  vault key is a backup you cannot restore after losing it. The export screen now
  says so, and so do the export and import confirmations.
- A preflight refuses to write a backup at all if any money field still holds
  ciphertext — better to fail loudly than to emit a file that zero-fills on restore.
- Payload version `2.5 → 3.0`; `1.x` and `2.x` files still import.
- Cross-version test pins a real v0.17.0 → v1.0.0 upgrade path.

**Session**

- **Logout did nothing.** It awaited `navigator.serviceWorker.ready`, which never
  settles when no worker is registered, so the session was never cleared. Local
  tokens, cookies and storage are now cleared *first*, and network and database
  teardown are bounded by timeouts — a stalled cleanup can no longer strand a user
  in an active session.

**Asset provenance**

- **"Asset Age" reset on import.** Two separate causes: every repository stamped
  `createdAt` *after* spreading the imported payload, overwriting the preserved
  value; and the age was computed from `createdAt` (when the row was typed in)
  rather than `acquisitionDate`. Imported records now keep their original
  timestamps, age is measured from the acquisition date, and both dates are shown.
  This matters beyond tidiness — ḥawl is a lunar year of *ownership*, so a reset
  date makes an old holding look new.

**Admin & settings**

- The admin tab strip **scrolled the whole page sideways on a phone**: four tabs
  measure 511px inside a 358px container at 390px wide, pushing the document to
  527px. The strip now scrolls within itself. Desktop is unchanged.
- Stat card icons were emoji (inconsistent across platforms, read aloud as words);
  now decorative SVG with the label carrying the meaning.
- Help & Support reused the Profile icon, so two nav rows looked identical.
- The settings tab moved into the URL (`?tab=data`), so a section survives a
  refresh and can be linked to directly.

**Full Changelog**: https://github.com/slimatic/zakapp/compare/v0.17.0...v0.17.1

## [0.17.0] - 2026-09-21

### 10 Rabi al-Thani 1448 — waxing gibbous, 74% lit

Trust in the numbers and the data: every figure displayed is one the app can justify, and
the upgrade path was tested against a real production database before tagging.

**Data safety**

- Backups are validated by content (WAL checkpoint, SHA-256, `PRAGMA integrity_check`) instead of file size — an empty DB with live WAL sidecars passed the old check.
- Startup re-encryption decrypts each rewritten value and compares it to the original before committing, and detects the wrong-key fail-open case that would double-encrypt a row.
- Fixed the migration skipping `payment_records.amount` while reporting "no migration needed". Verified 10/10 values preserved on a production copy.
- Added `scripts/ops/restore-backup.sh`, an interactive restore with row-count checks.

**Money correctness**

- Exchange rates were hardcoded to 2023 values, understating non-USD wealth by 42% (EGP) and 77% (TRY) and misreporting nisab status. Now live, 1-hour cache, non-direct pairs solved through USD.
- Payment amounts under 1,000,000 returned `NaN` from a base64 length check; now parse raw and defer to authenticated decryption, failing loudly instead.
- `parseFloat` was run on encrypted columns in six places — ~1 ciphertext in 6 starts with a digit, so it returned a small *wrong* number rather than `NaN`. All six now decrypt first.
- Saved calculations record the rate used (`fxRateUsed`), and `/rate-staleness` flags drift ≥1% without rewriting history.
- Amounts display in their recorded currency. An IDR asset no longer shows `$` in its retirement preview, and 11 sites building their own `en-US` formatter now use the canonical one (`Rp 50.000.000`, not `IDR 50,000,000.00`). Fixed Arabic-Indic digits for SAR/EGP.

**Export/import**

- CSV export wrote formatted values (`$1,234.56`) that `parseFloat` read as `NaN`; with a `|| 0` fallback every amount became zero on re-import. Export now writes raw numbers; import accepts every legacy format.

**Security**

- **Containers no longer run as root.** The app ran as uid 0; it now starts root only to chown the data volume, then hands off with `setpriv`. Verified on a named volume and a bind mount.
- Registration was gated in a route file the app never loaded, so disabling signups didn't disable them. Both paths now fail closed.
- Reconnected the commented-out error handler that had collapsed 54 `AppError` statuses into a flat 500.
- Backup/restore/session/audit/privacy endpoints returned hardcoded payloads (`restore` reported success, restoring nothing). They now read real data or return `501`.
- Removed invented data paths (`Math.random()` "historical" nisab prices, a fabricated all-zero comparison); unreachable today, but a trap for the next developer.
- Scrubbed personal emails, operator paths, production hostnames and a LAN IP from tracked docs.

**Maintainability**

- Removed 113 unreachable files (28,729 lines) found with `knip` — 35 server, 78 client.
- Split `server/src/routes/auth.ts` from 1,251 lines to a 62-line facade over 7 modules, routes compared byte-for-byte.
- Removed a dead payment subsystem, the legacy root `tests/` directory, and an unimported duplicate auth directory.
- Added `knip.json` to both workspaces so this stays checkable.

**Tests**

- Suites: server **507 → 753**, client **605 → 622**; server coverage **25.6% → 38.8%**, with CI gates added.
- New coverage for the calculation engine (2.9% → 62.4%), encryption round-trips, 11-currency precision, the backup verifier against real SQLite files, and both ciphertext formats.
- Replaced tests that mocked the code under test with ones that run it against real files.

**Release cadence**

- `docs/RELEASE-CADENCE.md`: one release per Hijri month, aimed at a lunar anchor (crescent or waxing gibbous). Anchors are a preference, not a contract — a verified security or data-safety fix ships when it is ready.

**Note:** no breaking changes. Non-Latin currencies now group differently — IDR renders `1.500.000` where it previously showed `1,500,000`.

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