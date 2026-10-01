# Changelog

## [1.0.0] - 2026-10-01

*20 Rabi al-Thani 1448 — waning gibbous, 78% lit.*

The first release of the fourth quarter, and the last of Rabi al-Thani. A quarter
opens while the lunar month closes — which is the shape of this release: not a
beginning, but a thing arriving where it was going.

### The design has a name

- **Nur** (light) and **Qamar** (dark) — a documented token set rather than ad-hoc
  colour, with the switch now on the sign-in screen so a new user can pick a
  comfortable mode before they have an account.
- **The moon-arc** is the release's signature element. The *ḥawl* — the lunar year a
  Muslim waits before zakat falls due — is drawn as an arc filled to the current day,
  with the moon's phase reflecting the portion completed. It renders the app's
  central metaphor literally instead of describing it in a progress bar.
- **A real app shell:** a sidebar on desktop, a bottom tab bar on a phone, a drawer
  between. The dashboard is built around the arc rather than accumulating cards.

### The numbers come from one source

- **The nisab basis is derived from the chosen school**, not held as a separate
  preference that could disagree with it. Two settings that can drift apart is one
  setting too many, so the redundant one is removed.
- **An unanswered asset no longer overrides the school.** Silence is not a ruling.
- **Analytics and payment reminders refuse to guess.** Where an amount cannot be read,
  the app says so rather than substituting a number. An invented figure in a zakat
  calculation is worse than a blank one.

### Your data, in and out

- **Import replaces or merges, and carries the encryption key with it.** Previously a
  bulk import could add assets instead of replacing them, doubling net worth silently
  (#610), and per-row limits were enforced on single adds but ignored on bulk paths
  (#609). Importing after a clear could also leave payment recipients unreadable
  (#611).
- **Asset values have history.** An amount records the date it was true, so a portfolio
  reflects what you held rather than only what you hold now.
- **Clearing your data requires a backup first.**

### Arabic and Urdu, properly

RTL is not an edge case for this app, so it is not treated as one. Desktop pages in
Arabic no longer scroll sideways — 228px of horizontal overflow is now 0 — and the
source check that verifies it runs in the suite rather than being something someone
remembered to do once (#626).

### The onboarding prompt stops returning

The dashboard decided "no assets" before RxDB's first pull had finished, which is
indistinguishable from an empty account. A fully populated vault could therefore be
bounced to the setup wizard on every login — and because the redirect tore down the
repositories that would have loaded the data, the emptiness was self-confirming. The
gate now waits for the repositories to settle (#627, #522).

### Verified

- RTL overflow: 228px → 0px across 9 routes, independently replicated, with a source
  check wired into `run-source-checks.py` so it can fail.
- Import behaviour (#609, #610, #611) covered by tests that fail if it regresses.
- CI green at merge: `test (20.x)`, static analysis, secret detection, GitGuardian.

### Known gaps, stated plainly

- **Tablet widths (768–1024px) are not covered by the automated layout checks,** which
  measure phone and desktop only.
- **One fiqh question is open:** whether the default nisab convention should be the gold
  or the silver basis. Both are available and the default preserves existing behaviour,
  so nothing changes for users meanwhile. It is going to qualified teachers, not being
  settled in a changelog.

## [0.17.11] - 2026-10-01

### Runtime dependency advisories cleared in the published backend image

Three open advisories were in `server/package-lock.json` — the lockfile of the
only artifact users run:

- **`morgan` 1.12.0 -> 1.12.1** — log injection via an unescaped double quote in
  a quoted log field.
- **`nodemailer` 9.1.1 -> 10.0.13** — the process-global DNS cache reused the TLS
  `servername` across transports, allowing cross-tenant SMTP credential
  disclosure. This is a major bump; its only breaking requirement is
  `engines.node >= 20`, and the published image runs 20.20.2. The single call
  site is `EmailService.ts:124`.
- **`undici` 7.29.0 -> 7.30.0** — transitive via `cheerio`. `cheerio` still
  declares `undici: ^7.19.0`, so the fix is pinned through `overrides`.

Also in this release: the lockfile advertised `version: 0.17.2` while the
manifest said `0.17.10`, so it had drifted out of sync with
`server/package.json`; regenerating reconciles it. That drift is why the
vulnerability scan had been failing on dependency PRs.

Verified: `tsc --noEmit` clean, server suite 768/768. The `morgan` fix was
confirmed against the installed code — a URL containing `","` now logs escaped
instead of breaking the field.

## [0.17.10] - 2026-09-29

### A missing build file now returns 404 instead of a blank page

**Frontend**

- **A missing build asset was served as the application shell.** nginx answered any
  unknown path with `index.html` and a `200`, which is right for a client-side route
  and wrong for a build artefact. A request for a hashed bundle that no longer exists
  therefore returned HTML where JavaScript was expected; the browser failed to parse
  it and the page rendered **blank, with no error shown to the user**.

  This is what a returning visitor sees after a release. The service worker still
  holds the previous build's file list, asks for those filenames, and the server
  answers with the shell. The whole app appears to be down while the server is
  healthy and reports no error — the failure is visible only in the browser console.

  Build files are now matched by extension and answered with a real `404`. Requests
  that are not build files, including the app's own `/assets/<name>` pages, still
  reach the shell as before.

- **Hashed assets are now cached for a year** instead of being revalidated on every
  load. Their filenames contain a content hash, so the bytes at a given URL never
  change. This removes a round trip per asset on every page load.

**Operations**

- The reverse-proxy configuration no longer hardcodes its upstream addresses, so the
  same file serves a compose deployment and a host running nginx directly. Defaults
  are unchanged, so no deployment behaviour differs.

## [0.17.8] - 2026-09-28

### A backend image that could not start

**v0.17.7's backend image failed at startup** — `Cannot find module '/app/server/dist/server/src/app.js'`. Production was rolled back to 0.17.6. If you pulled `slimatic/zakapp-backend:0.17.7`, it does not run; use `0.17.8`.

The cause was not in the build configuration, which did not change. `server/tsconfig.json` leaves `rootDir` unset, so TypeScript derives the output layout from the longest common path of the compiled sources:

- Through v0.17.6, `server/src/routes/zakat.ts` imported `../../../shared/src/constants`. A shared **directory** entered the program, making the repo root the common root, so output landed at `dist/server/src/app.js` and `dist/shared/src/...` — where `npm start` expects it.
- The API-honesty fix pointed that import at the `@zakapp/shared` package instead. The shared directory left the program, the common root became `server/src`, and output silently moved to `dist/src/app.js`.

A one-line import correction therefore relocated a build artifact. `rootDir: ".."` now pins what was emergent, reproducing the v0.17.6 layout. The build asserts the entry point was emitted, so a moved path fails the build instead of producing an image that cannot boot.

The user-facing changes from 0.17.7 are unchanged and included in this release.

_Nothing yet. The next cycle is `v0.18.0`, aimed at **1 Jumada al-Thani 1448 (2026-11-11)**.
See `docs/RELEASE-CADENCE.md` — the anchor is a preference, not a contract._

## [0.17.7] - 2026-09-28

### A patch release, not a cycle — export, API validation, and session honesty

**Data**

- **Data export no longer drops every asset value.** `POST /api/user/export-request` read
  field names that do not exist on the models, so `JSON.stringify` omitted each asset's
  `value`, each calculation's `zakatAmount`, and each payment's `recipients`. The file was
  valid JSON and parsed cleanly — the money was simply absent. Asset `value` was omitted for
  every user, on every export, since the field was renamed. Exported fields are now read from
  the schema.
- **A failed export no longer reports success.** The handler answered
  `200 {success: true, status: 'processing'}` in place of every error, including a real
  database failure, and no endpoint serves that status — so a user whose export threw waited
  for a file that was never coming. Failures now surface as errors.
- **`format=csv` no longer silently returns JSON.** An unsupported format is refused with 400.

**Calculation correctness**

- **Negative and zero asset values are rejected.** `POST`/`PUT /api/assets` accepted
  `value: -500` and `value: 0`, which persisted and silently reduced zakatable wealth for
  every other consumer. Values must now be positive, with a sane upper bound.
- **One asset-category vocabulary instead of two.** The shared constants carried a lowercase
  list (`cash`, `gold`, ...) alongside the canonical fifteen UPPERCASE values, so a category
  could pass one validation layer and be rejected by the next. Both layers now accept the same
  values.

**Sessions and errors**

- **Logout now invalidates the access token.** Revocation was recorded but never read, so a
  logged-out token stayed usable for its full 15-minute lifetime — on a shared device that is
  the window that matters.
- **`GET /api/zakat/methodologies` returns 200 instead of 500.** It imported a source path that
  does not exist in the built image.
- **Error responses no longer disclose server file paths.** A module-resolution failure
  included a "Require stack" listing absolute paths, revealing the deployment's layout to any
  caller.
- **Malformed JSON returns 400, not 500.**

**Restore**

- **A restore no longer rejects the whole payload over one stray field.** `zakatEligible` is not
  in `AssetSchema`, which is `additionalProperties: false`, and it was written on every asset —
  so Ajv refused the entire restore. The legacy value is preserved in `metadata`.

## [0.17.6] - 2026-09-27

### Third release of the day, and the shortest

**Fixes**

- **The admin dashboard loads again.** `/admin` was showing "Unexpected Error" while
  the rest of the app was perfectly healthy — you could log in, log out, view assets, and
  change your password. The stats request was even returning HTTP 200, so nothing looked
  wrong from the outside.

  The cause was a response shape that had drifted. `/admin/stats` was the only admin
  endpoint that returned its payload at the top level rather than under `data`:

  ```
  /admin/stats          -> { success, stats }      <- the odd one out
  /admin/settings       -> { success, data }
  /admin/system/status  -> { success, data }
  /admin/users          -> { success, data }
  ```

  The app reads one convention, so a payload outside `data` simply vanished, and the page
  fell back to its error state. Fixed on the server — three of the four endpoints already
  used `data`, so conforming the outlier keeps one convention working everywhere rather
  than teaching the app to special-case it.

  Nothing else in the admin area was affected; the other tabs read both shapes and were
  working correctly.

## [0.17.5] - 2026-09-27

### 16 Rabi al-Thani 1448 — same day as v0.17.4

The other half of the vault story. v0.17.3 stopped the password change from orphaning your
data; this makes a wrong key *say so* instead of showing you a broken app.

**Diagnostics**

- **A vault key that does not match your data is now reported, not silent.** The app has
  stored a `verifier` — a SHA-256 of your derived key, beside the salt — since the vault was
  first built, and never once read it. So when a key did not match the stored rows, every
  screen swallowed its own decryption failure and kept the encrypted text: amounts became
  `NaN`, rows rendered blank, and nothing reached you or the network to say why. The closest
  thing to an error was a console message no one opens. A mismatch now raises a visible
  warning naming the cause.

  Deliberately a warning, not a refusal: the verifier is written by the browser and was not
  updated on password change before this release, so a stored value can legitimately be out
  of date. Blocking a login on it would lock out whoever holds the correct password — turning
  a display problem into a lost account.

- **The verifier now moves with the key.** Re-keying your vault refreshes it. Without this,
  the next login would derive the new, correct key, compare it against the old verifier, and
  wrongly tell you your data was unreachable. Refreshing is best-effort: if it fails you get a
  warning on a later login rather than a failed password change.

- **Vaults without a verifier are repaired rather than flagged.** Older vaults get one
  written on first login, so the check becomes meaningful instead of raising a false alarm.

## [0.17.4] - 2026-09-27

### 16 Rabi al-Thani 1448 — released hours after v0.17.3

A hotfix, not a cycle release. Three defects found in production within hours of
v0.17.3 going live.

**Reliability**

- **After a deploy, the app can now recover itself instead of showing "Something went
  wrong".** A deploy replaces the hashed chunk filenames; a browser still holding the
  previous document asks for the old ones, so every lazily-loaded route — `/admin`,
  `/assets`, the dashboard — threw and the error boundary took over. The recovery was
  dead code in production: it looked for webpack's wording (`Loading chunk`,
  `ChunkLoadError`) but this client is built with Vite, which reports *"Failed to fetch
  dynamically imported module"*. Nothing matched, so no recovery was ever attempted.

  A plain reload would not have fixed it either. The service worker answers navigation
  from its own precached `index.html`, so reloading re-served the same stale document
  with the same dead chunk names — the retry failed, cleared its flag, and gave up.
  Recovery now drops the service worker and its caches **before** reloading, so the
  document comes from the network. The reload is in a `finally`: a failed cleanup still
  recovers the user.

**Data safety**

- **A failed password change can no longer be a lie.** Changing the password wrote the
  new hash, then invalidated sessions, as two separate writes. When the second failed the
  API returned 500 while the new password was **already committed** — so the user was told
  the change failed and retried against a password that had in fact already moved. Since
  the vault key is derived from the password, that is how someone gets locked out of their
  own encrypted data with no reason to suspect the password change caused it. Both writes
  now run in one transaction: a 500 means nothing changed.

**Interface**

- **The unreleased two-factor row is gone from Settings → Security.** It advertised an
  authenticator-app capability with no planned work behind it; a disabled "Coming Soon"
  control in a security panel reads as "this is planned".

## [0.17.3] - 2026-09-27

### 16 Rabi al-Thani 1448 — full moon, 99.7% lit

Released under the cadence's data-safety exception: changing your password made your
data unreadable, and the fix was verified. Holding it until 2026-10-12 would have left
anyone who changed their password locked out of their own vault for another two weeks.

**Data safety**

- **Changing your password no longer orphans your vault.** The vault key is
  `PBKDF2(password, salt)`, so changing the password changed the key that every
  encrypted field was written with — and nothing re-encrypted the existing rows. The
  password rotated, the ciphertext stayed, and the vault became unreadable by anything,
  while the UI reported success. The data was never lost: the ciphertext was intact and
  the salt is server-side. Re-encryption now happens in the browser **before** the API
  call that retires the old password, because the old key is only derivable while the
  old password is still valid. If it fails, the password is not changed — a failed
  rotation leaves a working account rather than a locked one.

  Encrypted field paths are read from each collection's own schema rather than a
  hardcoded list, so a field added later cannot be silently skipped. Rows that cannot be
  decrypted are **left untouched** rather than rewritten: a record under some third key
  is still recoverable by whoever holds that key, and overwriting it destroys the only
  copy.

- **Recovery now covers every encrypted collection.** The old recovery loop covered
  three of five collections and **skipped `liabilities` and `nisab_year_records`**, both
  of which carry encrypted fields — so recovery appeared to succeed while leaving those
  two locked.

- **The server refuses a password change it cannot make safe.** It returns 409 unless
  the client reports the vault was re-encrypted. The server cannot perform that rewrite
  itself: the key is derived in the browser and never sent, which is exactly why the
  guard belongs there.

- **The re-key is all-or-nothing.** Nothing is written until every value has been read
  successfully; otherwise the change is refused. A half-re-keyed vault reported as a
  clean success is the same failure mode this release exists to fix.

**Correctness**

- **Asset creation was impossible.** The category check compared a lowercased value
  against a list of `UPPERCASE` constants — it could never match, so every category was
  rejected and `POST /api/assets` was unusable.

- **The legacy-encryption migration never ran.** It forced pre-encryption (cleartext)
  records through the encryption hook on every login, but wrote via a method RxDB does
  not have, so every call threw and the loop aborted at the first cleartext record. It
  was wrapped in a `try/catch` that logged and gave up, so plaintext-at-rest persisted
  with only a debug line to show for it.

**Testing**

- Added a check that reads the write methods the client calls and asserts each one
  exists in the installed RxDB. A mocked document can never catch this class of bug — it
  defines whatever the test wishes existed, which is how a nonexistent method shipped in
  two places.

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