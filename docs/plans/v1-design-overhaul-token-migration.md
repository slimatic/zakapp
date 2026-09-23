# v1.0 Token Migration Strategy — the 104-file sweep

**Branch:** `feature/v1-design-overhaul` (local-only, push-guarded)
**Inputs:** `docs/plans/v1-design-overhaul-branch-plan.md`, `~/zakapp-ui-mockup/styles/tokens.css`, `client/src/index.css`, `client/tailwind.config.js`
**Verified counts (grep, 2026-09-23):** 108 `.ts/.tsx` files match `teal-|gray-` (104 was the plan's `.tsx`-only figure; the extra 4 are `.ts` test/util files — swept with their owning batch). Only 5 files use raw `teal-*`; gray dominates (~1,300 usages, `text-gray-900` alone 263). 20 files use `primary-N`/`secondary-N` (~101 usages).

---

## (a) Decision: extend the existing HSL var system — REPLACE nothing

**Decision:** extend. **Why:** the codebase already runs the shadcn pattern — `:root`/`.dark` HSL triplets, `darkMode: 'class'`, Tailwind colors wrapped as `hsl(var(--x))`. Extending means every component that already uses `bg-card`, `text-muted-foreground`, `bg-background` flips to Nur/Qamar **the moment the var values change, with zero component edits**. Replacing (new `--nur-*` namespace + new Tailwind color layer, old vars deprecated) doubles the token surface, forces every existing semantic-class call site to migrate eventually, and adds a second deprecation cycle on top of the 104-file sweep. Extension gets the theme switch as a value-only diff in one file.

**Mechanics of the extend path** — `client/src/index.css`, one commit:

1. **`:root` (Nur) — change existing values, keep every var name:**

| var | old value | Nur value | note |
|---|---|---|---|
| `--background` | `210 40% 98%` | `48 33% 97%` | bone paper #FAF9F5 |
| `--foreground` | `222.2 84% 4.9%` | `215 28% 17%` | #1F2937 |
| `--card` | `0 0% 100%` | `0 0% 100%` | unchanged (white surface) |
| `--card-foreground` | `222.2 84% 4.9%` | `215 28% 17%` | |
| `--popover` / `--popover-foreground` | as card | same as card | |
| `--primary` | `159 81% 40%` (emerald) | `26 90% 37%` | amber accent #B45309 — CTA/ring role (DESIGN.md §1.3) |
| `--primary-foreground` | `210 40% 98%` | `0 0% 100%` | white on amber |
| `--secondary` | `44 93% 53%` (gold) | `159 36% 17%` | deep forest #1B3A2F — brand role |
| `--secondary-foreground` | `210 40% 98%` | `140 17% 93%` | #EAF0EC |
| `--muted` | `210 40% 96.1%` | `42 29% 93%` | #F3F0E9 recessed |
| `--muted-foreground` | `215.4 16.3% 46.9%` | `220 9% 46%` | #6B7280 |
| `--accent` | `210 40% 96.1%` | `140 17% 93%` | #EAF0EC brand-soft tonal surface (per DESIGN.md §1.3) |
| `--accent-foreground` | `222.2 47.4% 11.2%` | `159 36% 17%` | forest on brand-soft |
| `--destructive` | `0 84.2% 60.2%` | `5 61% 44%` | #B3372B |
| `--destructive-foreground` | `210 40% 98%` | `6 70% 95%` | |
| `--border` | `214.3 31.8% 91.4%` | `41 24% 87%` | warm #E5E0D5 |
| `--input` | same as border | `41 24% 87%` | |
| `--ring` | `159 81% 40%` | `26 90% 37%` | focus ring = amber (accent-rationing rule) |
| `--radius` | `0.75rem` | `14px`→`0.875rem` | mockup radius |

   ⚠️ **Role flip to know:** in the old system `primary`=teal (action) and `secondary`=gold. In Nur, `primary` becomes the rationed **amber accent** and `secondary` the forest **brand**. Effect on unswept code: `bg-primary-600` action buttons turn amber (desired CTA color — safe), but `text-primary-700`/`primary-900` headings and brand links also turn amber (they must become `text-secondary` in the sweep — brand headings are forest, amber is rationed). This is why batch 1 (shell) + batch 2 (ui primitives) sweep before any page: nav/heading roles must move to `--secondary`-based classes immediately.

2. **`.dark` (Qamar) — same var names, new values:**
   `--background: 221 44% 10%` (#0E1524) · `--foreground: 216 38% 95%` · `--card/--popover: 219 32% 14%` (#18202F) · `--primary: 41 62% 56%` (**gold #D4A94A - CTA/ring role in dark**) · `--primary-foreground: 221 44% 10%` · `--secondary: 41 62% 56%` (gold also takes the brand role in dark) · `--secondary-foreground: 221 44% 10%` · `--accent: 43 33% 12%` (#2A2415 brand-soft) · `--accent-foreground: 41 62% 56%` (gold) · `--muted/--accent: 221 39% 11%` (#111827) · `--muted-foreground: 215 15% 66%` · `--accent-foreground: 42 71% 63%` · `--destructive: 7 82% 72%` (#F28B7D) · `--border/--input: 219 25% 22%` (#2A3446) · `--ring: 42 71% 63%`.

3. **Add the missing semantic vars** (present in mockup tokens, absent in index.css) — appended to both `:root` and `.dark`:

```css
:root {
  --surface-2: 42 29% 93%;      /* F3F0E9 recessed panel */
  --border-strong: 41 21% 80%;  /* D6CFC0 */
  --success: 150 64% 29%;  --success-soft: 138 39% 94%;
  --warn: 26 90% 37%;      --warn-soft: 37 87% 94%;
  --danger: 5 61% 44%;     --danger-soft: 6 70% 95%;
  --elev-1: 0 1px 2px rgba(27,58,47,.08), 0 1px 3px rgba(27,58,47,.06);
  --elev-2: 0 1px 2px rgba(27,58,47,.10), 0 2px 6px rgba(27,58,47,.08);
  --elev-3: 0 2px 4px rgba(27,58,47,.10), 0 8px 20px rgba(27,58,47,.10);
  --motion-standard: cubic-bezier(.2, 0, 0, 1);
  --glow: none;
}
.dark {
  --surface-2: 221 39% 11%;  --border-strong: 219 23% 29%;
  --success: 151 69% 58%;  --success-soft: 146 45% 13%; /* #12301F - deep green, NOT orange */
  --warn: 42 71% 63%;      --warn-soft: 39 33% 14%;
  --danger: 7 82% 72%;     --danger-soft: 358 34% 15%; /* #33191A - deep red, NOT magenta */
  --elev-1: 0 1px 2px rgba(0,0,0,.35);
  --elev-2: 0 2px 6px rgba(0,0,0,.40);
  --elev-3: 0 4px 10px rgba(0,0,0,.45), 0 10px 26px rgba(0,0,0,.35);
  --glow: 0 0 40px rgba(212,169,74,.18);
}
```

**Peer-review correction (RIQ, Phase 1):** the first draft of this block had two
wrong dark conversions (`--success-soft` as `19 33% 12%` orange, `--danger-soft`
as `331 91% 15%` magenta) from a botched hex-to-HSL pass. Values above are the
correct conversions of the mockup hexes and match DESIGN.md §1.2.

**Role-map alignment (peer-review correction):** this doc's first draft mapped
`--primary` = forest and `--secondary` = amber, contradicting DESIGN.md §1.1/§1.3.
**DESIGN.md wins** (it is the contract): `--primary` = the rationed accent
(amber in Nur, gold in Qamar — drives CTAs + ring via shadcn semantics, matching
the mockup exactly), `--secondary` = the brand (forest in Nur, gold in Qamar),
shadcn `--accent` = brand-soft tonal surface. The role-flip hazard in the old
system still holds but inverts: components using `bg-primary-600` as "the action
button" were emerald; under Nur they become amber — which is the DESIRED CTA
color, so the flip is actually safe for CTAs. Batch 1 (shell) + batch 2 (ui
primitives) still sweep first to align nav/heading roles.

4. **`.dark` mapping already exists** — index.css carries ~170 lines of `.dark .bg-gray-*` retrofit overrides. On sweep day these become dead weight; **delete each retrofit rule in the same commit as the batch that sweeps those classes** (rule: a `.dark .bg-gray-N` line may be removed only when `grep` confirms zero remaining usages of that class in `client/src`). The `.dark body`, form-control, and `glass-panel` rules stay until their owning batch lands.

5. **Theme switch:** `useTheme.ts` already toggles `.dark` on the root class and persists to localStorage — the `.dark` selector keeps working as-is. No `data-theme` migration needed; mockup's `[data-theme="dark"]` is deviced away as an implementation detail.

**Gate:** after this commit, `npx vitest run` in client stays green (no component edited), and every semantic-class page already renders Nur. Hardcoded-teal/gray pages still look like the old app — that's fine; they get swept next.

---

## (b) tailwind.config.js — keep primary/secondary as legacy alias, deprecate gradually

Current state: `primary` = full teal scale (hex values, NOT var-backed), `secondary` = full bronze/gold scale, `surface` = slate hexes. 20 files / ~101 usages use these.

**Recommendation: convert to var-backed aliases, do not delete.**

```js
primary: {
  DEFAULT: "hsl(var(--primary))",
  // teal hexes DELETED; the numbered ramp below re-expresses the
  // SAME HSL var family the sweep targets — during migration
  // primary-N call sites keep a sensible color; after the sweep the
  // ramp is deleted (see deprecation gate).
  foreground: "hsl(var(--primary-foreground))",
},
```

**Why alias, not keep-hex, not delete-now:**
- **Keep hex as-is:** Nur/Qamar never reach these components — buttons stay teal in both themes. Breaks the design at its most visible points.
- **Delete now:** ~101 usages across 20 files (Button, Card, Input, Badge, nav, auth, charts) all break in one diff. Violates "each batch deployable alone."
- **Var-backed alias:** call sites immediately retheme; each sweep batch migrates the call sites to semantic classes; a final commit drops the scale keys once `grep -rE '(primary|secondary)-[0-9]' client/src` returns 0 files.

**Concrete config change (Phase 1 commit):**

```js
colors: {
  // legacy aliases — delete keys when the last primary-N/secondary-N class is swept
  primary:   { DEFAULT: "hsl(var(--primary))",   foreground: "hsl(var(--primary-foreground))" },
  secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
  surface:   { DEFAULT: "hsl(var(--card))" },
  // NEW semantic layer (the sweep target vocabulary)
  accent:   { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
  success:  { DEFAULT: "hsl(var(--success))", soft: "hsl(var(--success-soft))" },
  warn:     { DEFAULT: "hsl(var(--warn))",    soft: "hsl(var(--warn-soft))" },
  danger:   { DEFAULT: "hsl(var(--danger))",  soft: "hsl(var(--danger-soft))" },
  elev:     { 1: "var(--elev-1)", 2: "var(--elev-2)", 3: "var(--elev-3)" },
  // existing var-backed colors (background/card/muted/…) unchanged
}
```

Note the collision: `accent` currently exists as a shadcn neutral hover-tint. In the new system `accent` = the rationed amber/gold. Resolve by folding: `accent` gets the amber values (per (a) table) and the old "hover tint" call sites move to `bg-muted` in the sweep — the count of `bg-accent`-as-hover usages is small and they're all in batch 1-2 files.

**Family-scale nuance:** `bg-primary-50` (tinted surface) → `bg-accent-soft` when the source hue was amber, `bg-brand-soft`-style when forest; the naming convention in (c) makes this mechanical. `ring-primary-500` (16 usages) → `ring-accent` — focus rings are amber per the accent-rationing rule.

---

## (c) The 108-file sweep — batches, naming, before/after

### Naming convention

Hardcoded scale steps map to semantics, not to other hues:

| pattern | replacement | note |
|---|---|---|
| `text-gray-900/800` | `text-foreground` | primary text |
| `text-gray-700/600` | `text-foreground/80` | body text |
| `text-gray-500/400` | `text-muted-foreground` | secondary text |
| `text-gray-300/200` (on colored bg) | `text-muted-foreground/70` | tertiary |
| `bg-white` | `bg-card` | |
| `bg-gray-50`, `bg-gray-100` | `bg-muted` | recessed surface |
| `bg-gray-200` | `bg-surface-2` | stronger recess |
| `border-gray-100/200`, `divide-gray-*` | `border-border`, `divide-border` | |
| `border-gray-300` | `border-border-strong` | |
| `bg-primary-N`, `text-primary-N`, `ring-primary-N` | `bg-accent`, `text-accent`, `ring-accent` when action/accent role; `text-primary` when brand/heading role | decide per call site using the accent-rationing rule: amber ONLY for CTA, zakat-due figure, hawl moon marker, logo Arabic mark, focus rings |
| `bg-secondary-N` / `text-secondary-N` | `bg-accent-soft` / `text-accent` | gold chips |
| `bg-{hue}-50/100` + `text-{hue}-800/900` status cards | `bg-success-soft text-success` / `bg-warn-soft text-warn` / `bg-danger-soft text-danger` | hue decides which of the three |
| `bg-teal-*` (5 files) | same mapping as primary-N above | |

No new utility families beyond the tokens above — every replacement is either a Tailwind class over an existing/var-backed color or a `soft` variant added in (b).

### Batch order (each = one commit, one deployable unit; rebase immediately before each)

1. **Shell/layout** — `components/layout/*` (5 files incl. Navigation, BottomNav, Layout), ThemeToggle, `index.css` component classes (`glass-panel`, `glass-card`, `btn-primary`, `btn-secondary`). *Why first:* every page renders through it; it also fixes the primary→forest role flip at the nav level so later batches inherit correct chrome. Files: `BottomNav.tsx`, `MobileNav`, `Navigation`, `Layout.tsx`.
2. **UI primitives** — `components/ui/*` (7 files: Button, Card, Badge, Input, Progress, …). Highest-leverage per line: most pages consume these.
3. **Dashboard** — `pages/Dashboard.tsx`, `components/dashboard/*` (10 files).
4. **Nisab/Hawl** — `pages/NisabYearRecordsPage.tsx` (8 recent main-side edits — rebase hot spot), `components/nisab/*`, moon-arc replacing `HawlProgressIndicator`.
5. **Assets** — `components/assets/*` (10 files incl. form-sections).
6. **Payments/tracking** — `components/tracking/*` (12 files, biggest dir).
7. **Settings + Admin + Diagnostics** — `pages/settings/*` (6), `components/admin/*` (3), `pages/admin/*` (2).
8. **Onboarding** — `pages/onboarding/steps/*` (8 files).
9. **Calculator + Knowledge + remaining pages** — `components/zakat/*` (5), `pages/knowledge/*`, leftovers, the 4 `.ts` files.

After every batch: delete that batch's now-dead `.dark` retrofit rules from index.css.

### Concrete before/after (real lines, grep-verified)

**Batch 1 — `client/src/components/layout/BottomNav.tsx`:**
```diff
-      className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-lg z-40 block md:hidden"
+      className="fixed bottom-0 inset-x-0 bg-card border-t border-border z-40 block md:hidden [box-shadow:var(--elev-2)]"
-                className="flex flex-col items-center justify-center min-w-[60px] h-12 px-1 py-1 rounded-lg text-gray-500 hover:text-gray-900 transition-all active:scale-95"
+                className="flex flex-col items-center justify-center min-w-[60px] h-12 px-1 py-1 rounded-lg text-muted-foreground hover:text-foreground transition-all active:scale-95"
-                  ? 'text-primary-600 bg-primary-50/50'
+                  ? 'text-secondary font-bold'          // nav-active = BRAND, no tint (DESIGN.md §4: amber is NOT for persistent nav states; peer-review correction - the original 'text-accent bg-accent/10' here violated the accent-rationing contract)
```

**Batch 3 — `client/src/pages/Dashboard.tsx`** (the education banner, teal → accent family):
```diff
-    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border-2 border-teal-200 p-4 sm:p-6">
+    <div className="bg-muted rounded-lg border border-border p-4 sm:p-6">
-          <div className="p-2 bg-teal-100 rounded-lg">
+          <div className="p-2 bg-accent-soft rounded-lg">
-              className="w-6 h-6 text-teal-600"
+              className="w-6 h-6 text-accent"
-          className="p-2 rounded-md text-gray-600 hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-600 …"
+          className="p-2 rounded-md text-muted-foreground hover:bg-accent-soft focus:outline-none focus:ring-2 focus:ring-accent …"
-          <div className="pt-4 border-t border-teal-200">
+          <div className="pt-4 border-t border-border">
```
(The banner loses its gradient deliberately — flat muted surface is the mockup look; the accent-rationing rule bars teal-family decoration.)

**Batch 6 — `client/src/components/tracking/PaymentCard.tsx`:**
```diff
-    <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3 hover:shadow-md transition-shadow">
+    <div className="bg-card border border-border rounded-lg p-2 sm:p-3 hover:shadow-md transition-shadow [box-shadow:var(--elev-1)]">
-            <h4 className="font-semibold text-gray-900 text-sm truncate">
+            <h4 className="font-semibold text-foreground text-sm truncate">
-            <p className="text-xs text-gray-600">
+            <p className="text-xs text-foreground/80">
-            <div className="text-xs text-gray-500">
+            <div className="text-xs text-muted-foreground">
-            <span className="px-2 py-0.5 bg-gray-100 rounded">
+            <span className="px-2 py-0.5 bg-muted rounded">
-          <div className="bg-gray-50 rounded-md p-2">
+          <div className="bg-muted rounded-md p-2">
```

---

## (d) Verification per batch

**Stay-green floor (every batch):**
```bash
cd client && npx vitest run --reporter=dot && npx tsc --noEmit && npm run build
```
Current baseline ~509 pass / 1 documented skip — any drop blocks the batch commit. Visual smoke: build + the Phase-3 local chuwi stack, screenshot the batch's pages in Nur and Qamar (`.dark` on root) before/after.

**New gate: the grep-gate CI step.** Add to `.github/workflows/test.yml` (and run locally before every batch commit):

```bash
# scripts/token-gate.sh — fails if a swept directory reintroduces hardcoded classes.
# Usage: bash scripts/token-gate.sh            # gates the SWEPT_DIRS list
SWEPT_DIRS=(
  client/src/components/layout
  client/src/components/ui
  client/src/pages
  client/src/components/dashboard
  client/src/components/nisab
  client/src/components/assets
  client/src/components/tracking
  client/src/pages/settings
  client/src/components/admin
  client/src/pages/onboarding
  client/src/components/zakat
)
EXIT=0
for d in "${SWEPT_DIRS[@]}"; do
  [ -d "$d" ] || continue
  # teal/gray/legacy-scale classes, excluding dark: prefixed variants (allowed) and .stories/.test files (not shipped)
  MATCHES=$(grep -rnE "(^|[^:-])(bg|text|border|from|via|to|ring|divide|hover:(bg|text|border))-?(teal|gray|primary|secondary)-[0-9]+" "$d" \
    --include='*.tsx' | grep -vE '\.stories\.|\.test\.')
  if [ -n "$MATCHES" ]; then
    echo "TOKEN GATE FAIL — hardcoded classes in $d:"
    echo "$MATCHES"
    EXIT=1
  fi
done
exit $EXIT
```

CI wiring: one step in test.yml after client tests:
```yaml
- name: Token gate (no hardcoded teal/gray in swept dirs)
  run: bash scripts/token-gate.sh
```

The regex allows `dark:bg-*` variants (legitimate where a semantic class can't express it) and excludes stories/tests so fixture colors don't block. A directory enters `SWEPT_DIRS` in the same commit that sweeps it — enforcement is per-batch, so a batch can't pass with stragglers. Raw `bg-white`/`text-gray` in `index.css` retrofit rules are exempt (the file is swept by deletion, not by the gate).

Also add one vitest assertion per batch (cheap, in the batch's own test file) pinning the count: `expect(tokenGate(dir)).toBe(0)` — redundant with CI but catches drift before push.

---

## (e) Rebase cadence against main (0.17.x patches landing in parallel)

**Cadence:** rebase onto `main` **at minimum weekly**, and immediately before starting each batch. The skill log shows main's hot files: `NisabYearRecordsPage.tsx` (8 touches), `LiabilitiesPage.tsx` (7), `AssetList.tsx` (7), `Dashboard.tsx` (5), `index.css` (5), `ZakatCalculator.tsx` (5), `Layout.tsx` (4) — every one of those is inside a sweep batch, so "rebase before each batch" is the real rule, not advice.

**Likely conflict files, by cause:**
- `client/src/index.css` — main keeps adding `.dark` retrofit rules (e.g. #427 added gradient/ring/border-gray-500 mappings). **Resolution rule:** main's new retrofit rules win the rebase verbatim (they fix real dark-mode bugs on unswept files); delete any retrofit line only when our sweep of that class has already landed in a later batch. Never "rebase away" a main fix.
- `client/tailwind.config.js` — main rarely touches it; conflicts only on the alias block. Resolution: our var-backed aliases win; re-add any main-added key.
- `Layout.tsx`, `BottomNav.tsx`, `Navigation` — class-string edits collide with main's structural edits (router v7, nav changes). Resolution: take main's structure, reapply our class substitutions (the token mapping is a lookup, not prose — reapplying is mechanical).
- Page files main is actively touching (`NisabYearRecordsPage`, `Dashboard`) — if main landed a feature change there mid-batch, take main's version wholesale and redo the batch's class edits on top. Never merge half-swept classes with half-new markup.

**Hard rules:** never carry a batch across a rebase untested — after every rebase re-run the batch's gate script + vitest. No long-lived divergence: if a batch would conflict on a file main changed this week, sweep that file first.

---

## (f) Self-hosted fonts (Outfit / Inter / Amiri)

Current state: Google Fonts `<link>` in `client/index.html` (Inter 400–700, Outfit 500–700, `display=swap` already), no `client/public/fonts/` dir, `tailwind.config.js` already has the `sans`/`heading`/`arabic` families wired, and `index.css` body/headings already reference them by name. So the Tailwind config needs **no change** — the family names stay; only the file source changes.

Plan (Phase 1, same commit as the token values):
1. Download the woff2 subsets (latin + arabic where offered; Outfit variable, Inter variable, Amiri regular+700) into `client/public/fonts/`. Variable-font woff2 keeps it to ~3 files per family.
2. In `index.css` top, before `@layer base`:
```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2');
  font-weight: 100 900; font-style: normal; font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+2000-206F;  /* latin subset */
}
/* same shape for inter-var-arabic.woff2, outfit-var.woff2, amiri-400.woff2, amiri-700.woff2 */
```
3. Delete the Google Fonts `<link>`/`preconnect`/`dns-prefetch` lines from `client/index.html` (and the same from the offline shell if present).
4. `font-display: swap` on every face — matches the current `display=swap` behavior; fallback stacks in Tailwind (`system-ui`, `serif`) cover the swap window.
5. Optional perf niceties: `<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/inter-var.woff2">` for body + display fonts only (preload everything = worse). `unicode-range` keeps Amiri off every page until an Arabic string actually renders.
6. **Verify:** build, check the dist has no `fonts.googleapis` reference (`grep -r googleapis client/dist | wc -l` → 0), check precache manifest includes the fonts (PWA offline fonts), and check network tab shows only local font fetches on first load.

No new dependency — plain `@font-face`. The fonts are the only asset addition, which matches the branch plan's "no new dependencies beyond fonts."

---

## (g) Risk register — top 5

| # | Risk | Likelihood | Mitigation |
|---|---|---|---|
| 1 | **The `primary` role flip (teal→forest/gold) changes button/CTA colors on unswept pages**, producing a half-old half-new look mid-migration and confusing smoke tests | near-certain | Convert `primary`/`secondary` scales to var-backed aliases in the SAME Phase 1 commit that changes var values, so even unswept `bg-primary-600` buttons pick up a coherent color; batch 1 (shell) + batch 2 (ui primitives) land before any user-facing page sweep. Accept that mid-migration pages look transitional; Salim is told. |
| 2 | **Rebase conflicts with 0.17.x patches on main** (index.css retrofits, NisabYearRecordsPage, Dashboard — all sweep targets) | high | Rebase before every batch (cadence in (e)); main's retrofit rules win verbatim until the class is swept; never carry a batch across a rebase without re-running gate + tests. |
| 3 | **Sweep breaks behavior via class-name side effects** — e.g. tests or a11y selectors keyed on `text-gray-*` strings, or the `.dark select:not([class*="bg-"])` attribute-selector logic which matches on class substrings | medium | Vitest + a11y suite are the per-batch floor; before swapping a class, grep for it in `client/src/tests/` and in index.css's attribute selectors (`grep -n 'class\*=' client/src/index.css`) — keep a `bg-` class on inputs/selects or update the selector rule in the same commit. |
| 4 | **Grep-gate regex drift / false confidence** — gate misses a variant (e.g. `dark:hover:bg-teal-100`, gradient stops on unswept dirs) and hardcoded colors leak into swept files unnoticed | medium | Gate regex covers the 9 prefix families incl. hover/dark variants; quarterly manual check: `grep -rE '(teal|gray)-[0-9]' client/src --include='*.tsx'` outside `SWEPT_DIRS` to see what's left and expand the list; gate failure output prints the offending lines (not just a count). |
| 5 | **Dark-mode regressions from deleting `.dark` retrofit rules too early** — a retrofit line removed while some other file still uses that class → light-on-dark text in Qamar | medium | Retrofit deletion is per-class, gated by grep: remove `.dark .bg-gray-100` only when `grep -r 'bg-gray-100' client/src --include='*.tsx'` (excluding swept dirs is not enough — exclude nothing) returns zero; the final Phase-4 audit is a screenshot pass of every page in Qamar with zero retrofit lines left in index.css. |

**Honest residue:** visual parity is judged by screenshots, not assertions — the test suite can stay green while colors look wrong. The real gate is the Phase-3 chuwi-stack smoke pass with Salim's eyes; this doc's automated checks exist to make that pass boring, not to replace it.