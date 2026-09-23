# ZakApp v1.0 Design Overhaul - Branch Plan

**Branch:** `feature/v1-design-overhaul` (LOCAL ONLY - never pushed to origin)
**Status:** PLANNING PHASE
**Directive (Salim, 2026-09-23):** No code from this project leaves this machine.
The pre-push hook in `.git/hooks/pre-push` blocks all pushes; override only with
Salim's explicit in-chat approval via `touch .git/allow-push-once` (then delete).
Merge to `main` also requires his approval.

## Goal
Rebuild ZakApp's frontend on the approved Nur (light) + Qamar (dark) design system
- the one prototyped and approved at `~/zakapp-ui-mockup/` - as a **modular token
overlay** that:
1. never breaks backend functionality or existing tests
2. layers cleanly over any 0.17.x patch work happening in parallel on `main`
3. can be deployed locally on the chuwi server for Salim's smoke testing at any time
4. lands as v1.0 when Salim says so - not before

## Why a token overlay works here (verified against codebase)
- `client/src/index.css` already runs the shadcn HSL variable system
  (`--background`, `--card`, `--primary`, `.dark` class strategy).
  Tailwind is `darkMode: 'class'`.
- The design system becomes: **replace variable VALUES, add missing variables,
  then sweep components off hardcoded classes.**
- Sweep cost measured: **104 files** contain hardcoded `teal-*`/`gray-*` classes.
  This is the single biggest line item - it is mechanical, parallelizable, and
  test-guarded (visual smoke + unit suite must stay green).

## Phases

### Phase 0 - Foundation (this planning phase)
- [x] Branch created locally, push-guarded
- [x] Mockup approved (Nur/Qamar + M3 mechanics)
- [ ] **DESIGN.md** - the contract: token maps Nur + Qamar, type scale, spacing,
  elevation tiers, motion curves, accent-rationing rules, moon-arc component spec
  (built with glm-5.3-flash + deepseek-v4.1-flash in parallel, Open Design skills
  as the quality gate)
- [ ] Token strategy decision: extend existing HSL vars vs new semantic layer
  ( leaning: extend - less churn, existing components keep working unchanged )

### Phase 1 - Token layer (non-breaking, first PR-worthy milestone)
- Nur values into `:root`, Qamar values into `.dark`
- Add missing semantic vars the design needs: `--success`, `--warn`, `--danger`,
  `--elev-1/2/3`, `--motion-standard/emphasized`, `--font-display/arabic`
- Fonts: self-host Outfit/Inter/Amiri (drop Google Fonts link), `font-display: swap`
- **Gate:** all existing tests green (client 500+ pass), zero visual regressions
  on pages that already use semantic vars

### Phase 2 - Component sweep (the 104 files, batched by area)
Order (each batch is a separate commit, deployable + testable alone):
1. Layout/shell: Navigation, BottomNav, MobileNav, Layout, ThemeToggle
2. Dashboard + widgets
3. Nisab/Hawl pages + RecordRulingsPanel + **moon-arc component replaces
   HawlProgressIndicator**
4. Assets + Liabilities
5. Payments + history
6. Settings + Admin + Diagnostics
7. Onboarding wizard
8. Calculator + Knowledge Hub
- Per batch: semantic-class refactor only, no logic changes, tests green
- M3 mechanics land here too (ripple/state-layer as small util components,
  elevation tokens, snackbar, FAB on create-action pages, segmented controls)

### Phase 3 - Local deploy + smoke test
- Build client locally (`npm run build` in `client/`)
- Deploy to chuwi server as a SEPARATE stack (not touching prod Umbrel):
  docker-compose on 192.168.86.240 using the existing images for
  server/db + the locally built client image, on a dedicated port
- Salim smoke tests against mock-data-seeded local DB
- Feedback loop: fix, rebuild, redeploy (scripted one-liner)

### Phase 4 - Stabilization
- a11y suite green, i18n keys intact (no hardcoded strings regression),
  RTL logical-property audit
- Performance: bundle size check, no font FOUT
- Full test suite + build green repeatedly

### Phase 5 - v1.0 (only on Salim's word)
- Merge decision, versioning, release engineering - a separate conversation

## Parallel-work safety (0.17.x patches on main)
- This branch rebases onto main weekly (or before any shared file edit)
- Shared-file conflicts likely only in: `index.css`, `tailwind.config.js`,
  layout components. Token phase touches exactly these - do it early, rebase often.
- Rule: any component we sweep, we rebase first. No long-lived divergence.

## Research workstreams (deliberate, per Salim's ask)
1. **glm-5.3-flash**: DESIGN.md authoring from the approved mockup + audit
2. **deepseek-v4.1-flash**: token-migration strategy - the 104-file sweep plan,
   batch ordering, semantic-class naming, Tailwind config changes
3. **Open Design skills**: design-taste-frontend audit of the DESIGN.md;
   web-design-guidelines checklist as the acceptance gate
4. Best-practice scan: how Linear/Vercel/Stripe structure dual-theme token layers
   in Tailwind (we follow proven patterns, not invention)

## Non-goals
- No backend changes. No API changes. No new dependencies beyond fonts.
- No push to origin, ever, without Salim's explicit approval.
- No merge to main until Phase 5.