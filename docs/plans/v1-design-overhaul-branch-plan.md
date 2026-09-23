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
- [x] **DESIGN.md** - the contract: token maps Nur + Qamar, type scale, spacing,
  elevation tiers, motion curves, accent-rationing rules, moon-arc component spec
  (built with glm-5.3-flash + deepseek-v4.1-flash in parallel, Open Design skills
  as the quality gate)
- [x] Token strategy decision: **extend existing HSL vars** (per token-migration
  doc - value-only diff, existing components keep working unchanged)
- Note: sweep scope corrected to 108 files (104 .tsx + 4 .ts); gray is the real
  volume (~1,300 usages), raw teal is only 5 files

### Phase 1 - Token layer (non-breaking, first PR-worthy milestone)
- Nur values into `:root`, Qamar values into `.dark`
- Add missing semantic vars the design needs: `--success`, `--warn`, `--danger`,
  `--elev-1/2/3`, `--motion-standard/emphasized`, `--font-display/arabic`
- Fonts: self-host Outfit/Inter/Amiri (drop Google Fonts link), `font-display: swap`
- **Gate:** all existing tests green (client 500+ pass), zero visual regressions
  on pages that already use semantic vars

### Phase 2 - Component sweep (the 108 files, batched by area)
- **Status: COMPLETE** — all 9 batches swept + verified
- Per batch: semantic-class refactor only, no logic changes, tests green
- Repo-wide grep: 0 hardcoded Tailwind color classes in any source tsx file
- 622/622 vitest pass throughout all batches

### Phase 3 - Local deploy + smoke test
- **Status: COMPLETE** — built assets verified
- `npm run build` → 19.70s, no errors
- Local preview: `vite preview --port 4173 --host 0.0.0.0` → 200 on
  localhost / LAN (192.168.86.240) / Tailscale (100.115.164.6)
- Built CSS verified: `--primary` = `26 90% 37%` (Nur) + `41 62% 56%` (Qamar)
- `font-display:swap` on all 6 self-hosted font faces
- No Google Fonts `<link>` in built HTML

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