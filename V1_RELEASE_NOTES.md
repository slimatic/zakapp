# ZakApp v1.0 — Release Notes and Audit Report

**Audit date:** 2026-09-29
**Base branch:** `develop` @ `7439d02d` (the v1.0 integration line)
**Production reference:** `v0.17.11` (deployed and verified)
**Audit branch:** `audit/v1-release-readiness` → PR #602

> **Status note (2026-10-01).** This is the audit as it stood on 2026-09-29. Four of the
> "remaining before v1.0" items below have since landed, and the checklist is annotated
> with their outcomes. The findings themselves are left as written — the reasoning is the
> useful part, and rewriting a record of what was believed at the time destroys it.
>
> **Further 2026-10-01 update.** #626 closed the RTL desktop overflow, which the #617
> responsive pass did not cover. Two caveats on how that pass was reported: it did not
> test RTL at all, and the a11y checker it relies on measures only 390 and 1280, so
> tablet width (768–1024) remains unmeasured. Both are noted in 4.3 and the checklist.
> The `space-x-*` mirroring gap on ~31 uses is tracked separately as cosmetic.

> **On the branch name.** The brief referred to "the road branch". No branch by that
> name exists on the remote. This audit ran against `develop`, which is where v1.0
> work integrates. Confirm if a different base was intended.

---

## 1. Headline status

| Pillar | Status | Evidence |
|---|---|---|
| **Strict data privacy** | ✅ Holds | Client reaches only its own API. No third-party endpoint, no analytics, no telemetry. |
| **Financial precision** | ✅ Holds, with caveats | `decimal.js` used throughout `zakat.ts`. Sourcing defects found and fixed; one fiqh question open. |
| **Lightweight container** | ⚠️ Improved | Multi-stage; privileges dropped via `setpriv`. Image shipped devDependencies — now pruned (129 MB), see 5.1. |
| **Clean, fast UI** | ✅ Holds, with a gap | Precache and lazy-loading fixed. Responsive pass landed (#617) and the RTL desktop overflow is fixed and guarded (#626). Tablet width (768–1024) remains unmeasured — see 4.3. |

---

## 2. Phase 1 — Security, privacy, dependency audit

### 2.1 Privacy — PASS

The client's only outbound requests go to its own `API_BASE_URL`. The sole external
URLs in `client/src` are GNU GPL licence headers. No analytics, no error reporting,
no CDN, no fonts from a third party at runtime (self-hosted `.woff2`).

**Architectural finding:** the UI does **not** use the server calculator.
`calculateZakat` is imported from `client/src/core/calculations/zakat` in
`Dashboard.tsx`, `ZakatCalculator.tsx` and `SnapshotForm.tsx`. The server-side
`apiService.calculateZakat` is referenced only in `apiHooks.ts` and is never called
by a page. Calculation is genuinely local — strong for the privacy pillar, and it
means the server calculation route, engine, and a *second* madhhab rule-set are
**unexercised surface**. Reported rather than deleted; removing it is a product call.

### 2.2 Storage — PASS (no change needed)

`useDataCleanup.ts` and `settings/components/DangerZone.tsx` provide purge. Export
exists. No change made; nothing found to fix.

### 2.3 Dependencies — resolved, no code change

The **shipped backend has no high or critical advisories**, and none of the ones it
does carry are reachable from user input. The root workspace does carry several
high and critical findings, but they are all **transitive through the build
toolchain** and are dev-time only — the published runtime images are `nginx:alpine`
and `node:20-slim` with the server's dev dependencies pruned, so they do not ship.

**Deliberately not force-bumped.** A blanket `npm audit fix` at the root would move
the Prisma major (6→7). AGENTS.md lists new dependencies and breaking changes as
ask-first, and the open dependabot PRs already target these packages individually.
Recommendation: let those land rather than doing a manual sweep.

**Not enumerated here on purpose.** The specific package names, versions and
severities are withheld from this document, which is published in a public
repository. Naming each unpatched advisory and its fix status produces a targeting
list for anyone reading the repo — the "which dependency is currently weak, and is
anyone on it yet" map. The inventory is tracked privately instead; what belongs in
the open repo is that the shipped surface is clean and that a patch path exists.

That is also what `SECURITY.md` asks for: vulnerabilities are reported and
coordinated privately, not published.

Verified: root's advisories are non-runtime · server's are low-severity and not
user-reachable · published images carry neither.

### 2.4 Environment isolation — PASS

`GOLD_API_KEY` is read from `process.env` only; **no literal key in the repository**
(the apparent `apiKey: ***` in `server/src/config/preciousMetalsApi.ts` is a
redaction artefact of tool output — line 74 is the *type annotation* `apiKey: string`).

Fallbacks exist at three levels: `MANUAL_GOLD_PRICE_USD` / `MANUAL_SILVER_PRICE_USD`
env overrides, a scraper path, and a static constant. See 3.3 — the static constant
is a *finding*, not a safety net.

---

## 3. Phase 2 — Financial accuracy and logic integrity

### 3.1 Arithmetic precision — PASS

`client/src/core/calculations/zakat.ts` uses `decimal.js` throughout:
`new Decimal(asset.value || 0)`, `Decimal.max`, `.times(factor)`, `.greaterThanOrEqualTo`.
No float accumulation in the core path. **The precision pillar holds where it matters.**

### 3.2 Nisab gram values — FIXED (sourcing), OPEN (which value is correct)

**The defect:** the engine computed with **87.48 g gold / 612.36 g silver** while
several screens told the user **85 g / 595 g**. `Dashboard.tsx` did both — line 134
quoted 85 grams, line 356 multiplied by 87.48.

**Fixed:** `nisab.ts` already declares `DEFAULT_NISAB_DATA` as the single source, and
its own docblock records removing a second switch for precisely this reason. Callers
now use it:

- `ZakatCalculator.tsx` carried its own copy of both weights — **twice**
- `Dashboard.tsx`, `SnapshotForm.tsx`, `AssetCategories.tsx` each held another
  literal or label
- `SnapshotForm`'s labels now interpolate the constant, so they cannot drift again

**NOT fixed, and this is deliberate:**

> 87.48/612.36 (7.5 / 52.5 tola, Hanafi, cited to Simple Zakat Guide) and 85/595 (the
> widely-quoted round figures) are **different thresholds**. The app's gold figure is
> *lower*, so it begins charging zakat slightly earlier than the prose described.
> Choosing between them changes **when a user becomes liable** — a fiqh decision.
> The prose was corrected to quote the engine; the engine was not changed.
>
> **Action required: a scholar's ruling.** Until then the divergence is documented at
> the constant with an explicit warning not to tidy one side to the other.

A second rule-set divergence is known and unchanged: the client `methodology.ts` and
the server `islamicConstants.ts` `ZAKAT_METHODS` disagree on nisab basis and
debt-deduction scope, and the server set carries citations the client set lacks.
Unifying them is likewise a scholar decision, not a refactor.

### 3.3 Offline rate handling — partly addressed

`DEFAULT_NISAB_DATA`'s fallback *prices* (`goldPrice: 65`, `silverPrice: 0.8`) are
static, so they are stale by construction whenever used. Silver also disagreed with
the server's own logged fallback (0.8 vs 0.75).

The correct fix is to **refuse to calculate and say so** rather than silently using a
years-old price. That is a product decision, so instead: the two values now live in
one place with the staleness warned at the constant.

Separately, `useNisabThreshold` throws when `/api/zakat/nisab` fails and does not
fall back locally, while `DEFAULT_NISAB_DATA` sits unused — so offline the client
cannot compute nisab at all. **Open.**

### 3.4 Test coverage on financial math

| Suite | Result |
|---|---|
| client | **846 passed**, 1 skipped |
| server | **786 passed** |

Existing coverage includes a property-based suite
(`client/src/tests/property/zakat-property.test.ts`) and `zakat.test.ts`. Other
other in-flight work covers additional cases which are not duplicated here. **Gap:** no test asserts the gram constants and the user-facing prose agree,
which is how 3.2 arose. Recommended follow-up.

---

## 4. Phase 3 — UI/UX and performance

### 4.1 Precache — FIXED

Build output was **6.33 MB across 96 precache entries**, most of it content no
visitor requests:

- **A 2.17 MB build report** produced by the bundle visualiser — an artefact
  containing the whole module graph. **34% of the entire precache**, and no user ever
  requests it. (Not named here: the file is currently served from the deployed site,
  so naming it in a public document would be a pointer to it. Removing it from the
  image is tracked separately.)
- **Every lazy route chunk**, undoing the code-splitting: `ReportGenerator` 426 kB,
  `AssetsBreakdownChart` 329 kB, `html2canvas` 202 kB.

Now **2.23 MB across 67 entries** (a **65% reduction**), retaining `index.html`, the
CSS and the entry chunk so offline still boots.

> **A near-miss worth recording.** The first attempt reached ~1 MB by *also*
> excluding `assets/index-*.js`. The number was better and the change was wrong: it
> removed the entry chunk, leaving no JavaScript precached, so the app could not
> start in airplane mode. It was caught by reading the generated manifest rather than
> trusting the headline figure. A smaller precache is only a win while offline works.

Excluded routes are not left uncached: a new CacheFirst rule holds hashed
`/assets/*.js` after first use, so any visited page still works offline. CacheFirst is
safe **only** because those filenames contain a content hash.

### 4.2 Bundle shape — acceptable, one warning

Every heavy library is already behind `lazy()`: `ReportGenerator` 426 kB,
`AssetsBreakdownChart` 329 kB, `html2canvas` 202 kB, `AnalyticsPage` 75 kB. The entry
chunk is 1.13 MB (364 kB gzip), containing app shell + vendor + `framer-motion`.

Rollup warns that one chunk exceeds 500 kB. **Accepted, not silenced**: the fix would
be finer `manualChunks` tuning with no measured user benefit at this size.

### 4.3 Responsiveness, touch targets, visual cleanliness — DONE, one gap

**Outcome (2026-10-01).** The pass landed in #617: the admin user table renders labelled
cards below `md` with the table kept for desktop; the tab strip gets `scroll-px-4` so a
partially scrolled strip no longer clips the leading label mid-glyph; the Settings nav is
a horizontal strip on a phone. `check-responsive.py` also had `/admin` missing from its
route list and an inline-target exemption keyed on the tag name rather than the spec's
computed `display` — both fixed.

**The RTL half was not covered by that pass and is now closed in #626.** RTL is the
primary-language case, not an edge: `i18n/index.ts` detection order is
`['localStorage','navigator']` and both `ar` and `ur` are `dir:'rtl'`, so an
Arabic-locale browser lands in RTL on first visit with no opt-in, and `ar` is a real
bundle (265 keys), not a skeleton.

Measured on a real build at 1280px, nine routes, both directions:

```
RTL  /dashboard /assets /liabilities /nisab-records /payments
     /calculator /analytics /settings /learn        0px   (was up to 228px)
LTR  same nine routes                               0px
```

Cause was a logical inset paired with a physical transform (`start-1/2` flips under
`[dir=rtl]`, `-translate-x-1/2` does not). Fixed at six sites in three components; a
static guard (`check-logical-inset-translate.py`) is wired into the source-check suite.

**Still outstanding, and the reason this section is not simply "done":** the tooling only
measures **390 and 1280**. Tablet width (768–1024) is unmeasured in both directions. Dark
mode is now verified clean (0 contrast and 0 touch-target failures across 632 text nodes).

**Deliberately out of scope, tracked separately:** `space-x-*` compiles to physical
`margin-left`/`margin-right` with no `[dir=rtl]` rule, so ~31 uses do not mirror. The
effect is a wrong-side gap — cosmetic, no overflow.

---

## 5. Phase 4 — Open source and release readiness

Already present; **verified rather than recreated**:

| Item | Status |
|---|---|
| `SECURITY.md` | ✅ 6.7 KB — secret-management policy, 5-step rotation procedure, incident log, CI scan notes, **explicit responsible-disclosure protocol** ("do not open a public issue…") |
| `LICENSE` | ✅ GNU AGPL v3 |
| `README.md` | ✅ Privacy section, features, 3 quick-start paths incl. `docker compose up -d` |
| Dockerfile | ⚠️ Multi-stage (5 `FROM` stages) and privileges **are** dropped — but see 5.1, it starts as root and shipped devDependencies |
| CI workflows | ✅ 3 — `test.yml`, `security-scan.yml`, `docker-hub.yml` |

### 5.1 Non-root execution and image weight — partly fixed

**Privilege drop IS implemented, and the brief's question had a false premise.**
There is no `USER` directive in `docker/Dockerfile.production`, which reads as root
execution — but `docker/entrypoint.sh` does:

```sh
if [ "$(id -u)" = "0" ] && command -v setpriv > /dev/null 2>&1; then
    exec setpriv --reuid=node --regid=node --init-groups "$@"
```

with `chown -R node:node /app/server /app/shared` at build time. Migrations and the
server run as `node`, uid 1000. The container does not use the `USER` directive
because the entrypoint must chown an operator's bind-mounted data volume first — a
documented, deliberate trade-off, not an oversight. **The brief's "non-root" item is
already satisfied**, though it will read as a finding to anyone grepping for `USER`.

**DevDependencies were shipping to users.** The published `slimatic/zakapp-backend`
is **1.68 GB**, and `/app/server/node_modules` contains `typescript`, `vitest`,
`ts-node` and `eslint`. `npm start` is `node dist/server/src/app.js`, so none of them
are used at runtime.

**The trap that made this non-trivial:** `prisma` was a **devDependency**, but the
entrypoint calls `npx prisma migrate status/deploy/diff/resolve` and `prisma db
execute` at container start. Pruning without first correcting that classification
would have **broken every migration, silently, at container start**. `prisma` was
moved to `dependencies` (one line) *before* adding the prune.

Measured in `node:20-slim` against the real manifest: **451 MB → 322 MB** (129 MB,
29%), with `prisma`, `@prisma/client`, `express`, `zod` and `dotenv` retained and the
`prisma` CLI verified running after the prune. `typescript` is retained anyway —
something in the production tree still pulls it — so the prune is a real but partial
win, and 129 MB is the figure that counts, not the whole 417 MB.

### 5.2 Gaps found

1. **No client or root lint gate in CI.** `security-scan.yml` runs ESLint in a
   security-only config; `test.yml` runs tests but no lint. `server` and `shared`
   have `lint` scripts, `client` and root have **none**, and only `server/.eslintrc.js`
   exists. Adding a client lint gate is a real improvement but needs an ESLint config
   and a clean baseline first — **deferred, not skipped.** Doing it blind would either
   fail CI on thousands of pre-existing issues or need rules disabled to pass, which
   is worse than no gate.

   **Now measured, so the scope is a number rather than a worry.** A trial config was
   run against `client/src` using only packages already in `client/devDependencies`
   (`eslint` 9, `@typescript-eslint/*`, `eslint-plugin-react`, `eslint-plugin-react-hooks`,
   `globals`) — no new dependency is needed for this:

   - **2052 errors with a naive config**, which is the number that makes the task look
     impossible. It is wrong: 1354 of them are `no-undef`.
   - `no-undef` is the documented typescript-eslint false positive — it cannot see
     type-only references (`NisabRecord`, `JsonWebKey`) or the vitest globals, so it
     reports correct code as undefined. With it off (as typescript-eslint advises, since
     `tsc` is authoritative) and browser/node/test globals declared:
   - **698 errors across 168 files.** Of those, **497 are in source, 201 in tests.**
   - The distribution is the important part: **503 are `no-explicit-any`** (352 source,
     151 test) — a style rule, and turning it off is a legitimate config choice rather
     than a silent weakening. The remainder is mostly mechanical: 73 unused vars, 61
     `react/no-unescaped-entities`, 25 `ban-ts-comment`.
   - **Only ~30 are bug-class**, and a spot check shows even those are not all defects:
     the sole `use-isnan` is `expect(153950.33 >= NaN).toBe(false)` in
     `nisabPayloadShape.test.ts` — a test that deliberately documents why the NaN bug
     produced `$0.00` instead of an error. The genuine findings are 13
     `set-state-in-effect`, 2 `no-case-declarations`, and one each of
     `rules-of-hooks`, `no-empty`, `no-extra-boolean-cast`, `no-useless-escape`.

   So the gate is tractable but is not a one-line CI addition: it needs a config, a
   decision on `no-explicit-any`, and a burn-down of the mechanical remainder. The
   ~30 bug-class findings are worth fixing on their own merits, independently of
   whether the gate lands.
2. **23 open dependabot PRs.** Triage and land them before the v1.0 tag.
   **Resolved (#619, #623) — triaged to zero open.** Left standing rather than deleted
   because the reason for the failing scan (a `server/package-lock.json` out of sync
   with its manifest, which also suppressed alerts) is the reusable part. See the
   checklist entry below.

### Remaining before v1.0

- [x] **`useNisabThreshold` local fallback** (3.3) — falls back to `DEFAULT_NISAB_DATA`
      when the API cannot be reached, flagged by `isFallback` + `isStale` so the figure
      is never presented as a live rate. `retryDelay` also drops 5000 → 1500 ms: an
      offline user previously waited 2 x 5 s before the fallback appeared.
- [x] **Bundle report and dev diagnostic pages removed from the deployment** — see 5.3.
- [x] **Responsive / touch-target pass** (4.3) — **done** (#617). Admin user table
      renders labelled cards below `md` with the table kept for desktop; the tab strip
      gets `scroll-px-4` so a partially scrolled strip no longer clips the leading label
      mid-glyph; the Settings nav is a horizontal strip on a phone. `check-responsive.py`
      also had `/admin` missing from its route list and an inline-target exemption keyed
      on the tag name rather than the spec's computed `display` — both fixed.
      **Addendum (#626): this pass did not cover RTL, which #617 never tested.** Arabic
      and Urdu desktop pages still scrolled horizontally by up to 228px, from a logical
      inset paired with a physical transform; fixed and guarded. RTL matters here because
      the language detector puts an Arabic-locale browser in RTL on first visit.
      **Remaining gap:** the checker measures 390 and 1280 only, so tablet width
      (768–1024) is still unmeasured. See 4.3.
- [x] **Dependabot PRs** — **triaged to zero open** (#619, #623). 48 advisories were
      dev-toolchain transitive and never shipped; the three in the backend runtime tree
      are cleared. The root cause of the failing dependency scan was a
      `server/package-lock.json` that had drifted out of sync with its manifest
      (it advertised `version: 0.17.2` while the manifest said `0.17.10`), which also
      meant Dependabot could not parse the lockfile and was raising **no alerts** for
      those packages.
- [x] **Unused server calculation path** (2.1) — **resolved: not dead code, not removed.**
      `POST /api/zakat/calculate` is a *documented public API* — it appears in
      `docs/api/openapi.yaml` (a published contract), `docs/api/api-specification.md` and
      `docs/api/zakat.md` with a worked `curl` example — it has its own suite at
      `server/tests/unit/zakatEngine.test.ts`, and it carries the **only cited rule-set in
      the repository** (`ZAKAT_METHODS` with `scholarlyBasis`). The accurate statement of
      the finding is narrower: the *client* rule-set is the live one, so the two can
      diverge on nisab basis and debt-deduction scope with no test comparing them.
- [ ] **Confirm the default nisab convention** (3.2) — still open, and still a scholar
      question. Both conventions ship and the default preserves existing behaviour, so it
      is not a precondition for the tag. Put it to the teachers when convenient.

### 5.3 Deployment surface — FIXED

The Dockerfile copies all of `client/dist` to the nginx web root, and nginx serves it
with `try_files $uri /index.html` over a catch-all `location /`. Anything present in
`dist` is therefore publicly fetchable at `app.zakapp.org/<name>`, whether or not a page
links to it. Three such files were confirmed live (HTTP 200):

| Path | Why it should not ship |
|---|---|
| `stats.html` | `rollup-plugin-visualizer` report, 2.11 MB, the complete module graph |
| `crypto-test.html` | POSTs to `/api/auth/register` with a fixed password and prints the response; a public account-creation endpoint when served from production |
| `clear-storage.html` | Decodes and displays the `localStorage` `accessToken` in plain text |

All three are removed from the build: the report now writes to `client/build-report/`
outside `dist`, and the two dev pages are deleted (the crypto diagnostic is covered by
`test-crypto.sh` from a local checkout).

Worth noting for anyone auditing this next: the comment above the workbox config
claimed `stats.html` was "excluded from the deployment", but no such exclusion existed.
`globIgnores` affects only the precache manifest, not what the Dockerfile copies. A
comment asserting a control is not the control.

---

## 6. Changes in this audit

| Commit | Scope |
|---|---|
| `refactor(nisab)` | One source for the gram weights; prose corrected to match the engine |
| `perf(pwa)` | Precache 6.33 MB → 2.23 MB; stop precaching the build report and lazy routes |
| `fix(docker)` | `prisma` moved to runtime dependencies; devDependencies pruned from the image |

**No fiqh values changed. No dependencies added or upgraded. No API, schema, auth, or
encryption change.** The one manifest edit moves an existing dependency between two
lists without changing its version.

**Verification:** client `tsc --noEmit` clean (0 errors) · 846 client tests pass ·
production build succeeds · precache manifest inspected directly · PR #602.

---

## 7. Traps encountered

Recorded because each one looks like the obvious move and is wrong:

- **A `***` in a scan is not always a secret.** A dependency report rendered the
  *type annotation* `apiKey: string` as `apiKey: ***`, which reads as a hardcoded
  credential. It is a redaction artefact in the reporting tool, not a leak. Confirm
  by reading the source line, not the scan output.
- **A smaller precache is not automatically a safer one.** Excluding
  `assets/index-*.js` removed the entry chunk and cut the manifest sharply — and left
  no JavaScript precached at all, so the app could not boot offline. Check the
  generated manifest for the entry chunk before accepting a size win.
- **Read the Dockerfile before describing it.** Three properties that are easy to
  assume from its shape are all false here: it has 5 `FROM` stages (not 6), there is
  no `USER` directive (privileges are dropped by `setpriv` in `entrypoint.sh`, see
  5.1), and the build runs plain `npm install` with no pruning.
- **`npm prune` on the server tree breaks migrations unless `prisma` moves first.**
  `prisma` is a devDependency, but `entrypoint.sh` runs `npx prisma migrate deploy`
  at container start. Pruning before reclassifying it removes the CLI from the
  runtime image, and the failure surfaces on the next deploy rather than in CI.
- **A grep for a number is not a check of what computes it.** The nisab drift was
  invisible to every test because each side produced a *valid* threshold — see §3.
