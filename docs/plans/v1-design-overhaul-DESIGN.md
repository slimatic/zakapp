# ZakApp v1.0 Design Contract — Nur + Qamar

**Source of truth:** `~/zakapp-ui-mockup/` (approved 2026-09-23). Every value below is
converted from the mockup's `styles/tokens.css` / `styles/ui.css` / `index.html` /
`hawl.html`. No invented colors. Where the codebase and mockup name the same role
differently, the mapping is stated explicitly.

**Theme strategy:** keep the existing shadcn HSL-variable system and `.dark` class
(`darkMode: 'class'`). The mockup's `[data-theme="dark"]` selector maps 1:1 to the
codebase's `.dark`. Values are replaced in place; new semantic variables are added
alongside. Existing components that already use `bg-card`/`text-muted-foreground`
etc. keep working unchanged.

---

## 1. Token maps

### Format

Same format as the existing `client/src/index.css`: bare `H S% L%` triples consumed
via `hsl(var(--x))`. Shadows/motion/fonts are raw CSS values (not HSL).

### 1.1 Nur (light) → `:root`

| Role (mockup) | Mockup hex | Var (codebase) | HSL value |
|---|---|---|---|
| bg "bone paper" | `#FAF9F5` | `--background` | `48 33% 97.1%` |
| text | `#1F2937` | `--foreground` | `215 28% 16.9%` |
| surface | `#FFFFFF` | `--card` | `0 0% 100%` |
| — | — | `--card-foreground` | `215 28% 16.9%` |
| surface | `#FFFFFF` | `--popover` | `0 0% 100%` |
| — | — | `--popover-foreground` | `215 28% 16.9%` |
| accent (amber CTA) | `#B45309` | `--primary` | `26 90% 37.1%` |
| — | — | `--primary-foreground` | `0 0% 100%` |
| brand (deep forest) | `#1B3A2F` | `--secondary` | `159 36% 16.7%` |
| — | — | `--secondary-foreground` | `0 0% 100%` |
| surface-2 (recessed) | `#F3F0E9` | `--muted` | `42 29% 93.3%` |
| text-2 | `#6B7280` | `--muted-foreground` | `220 9% 46.1%` |
| brand-soft | `#EAF0EC` | `--accent` | `140 17% 92.9%` |
| brand | `#1B3A2F` | `--accent-foreground` | `159 36% 16.7%` |
| destructive | `#B3372B` | `--destructive` | `5 61% 43.5%` |
| — | — | `--destructive-foreground` | `0 0% 100%` |
| border | `#E5E0D5` | `--border` | `41 24% 86.7%` |
| border-strong (inputs) | `#D6CFC0` | `--input` | `41 21% 79.6%` |
| accent (amber ring) | `#B45309` | `--ring` | `26 90% 37.1%` |

New semantic variables (Nur):

| Var | Mockup hex | HSL value |
|---|---|---|
| `--success` | `#1B7A4A` | `150 64% 29.2%` |
| `--success-soft` | `#E8F5EC` | `138 39% 93.5%` |
| `--warn` | `#B45309` | `26 90% 37.1%` |
| `--warn-soft` | `#FDF3E3` | `37 87% 94.1%` |
| `--warn-strong` | `#92400E` (mockup accent-strong, used as warn chip text) | `23 82% 31.4%` |
| `--danger` | `#B3372B` | `5 61% 43.5%` |
| `--danger-soft` | `#FBEAE8` | `6 70% 94.7%` |
| `--text-3` | `#9CA3AF` | `218 11% 64.9%` | — **usage gate (WCAG):** tertiary is below 4.5:1 for normal text in both themes; sweep may only apply it to disabled, decorative, or duplicated-elsewhere help text (never sole-label informational text)
| `--border-strong` | `#D6CFC0` | `41 21% 79.6%` |
| `--elev-1` | — | `0 1px 2px rgba(27,58,47,.08), 0 1px 3px rgba(27,58,47,.06)` |
| `--elev-2` | — | `0 1px 2px rgba(27,58,47,.10), 0 2px 6px rgba(27,58,47,.08)` |
| `--elev-3` | — | `0 2px 4px rgba(27,58,47,.10), 0 8px 20px rgba(27,58,47,.10)` |
| `--shadow-card` | — | `0 1px 3px rgba(27,58,47,.06), 0 4px 14px rgba(27,58,47,.05)` |
| `--glow` | — | `none` |
| `--motion-standard` | — | `cubic-bezier(.2, 0, 0, 1)` |
| `--motion-emphasized` | — | `cubic-bezier(.2, 0, 0, 1)` |
| `--font-display` | — | `'Outfit', system-ui, sans-serif` |
| `--font-body` | — | `'Inter', system-ui, sans-serif` |
| `--font-arabic` | — | `'Amiri', serif` |
| `--radius` | 14px | `0.875rem` |

Radius derivation (already correct in `tailwind.config.js` once `--radius` = 14px):
`rounded-lg` = 14px (cards), `rounded-md` = 12px (buttons, segmented), `rounded-sm` =
10px (inputs, icon buttons, banners, stat tiles).

### 1.2 Qamar (dark) → `.dark`

| Role (mockup) | Mockup hex | Var (codebase) | HSL value |
|---|---|---|---|
| bg | `#0E1524` | `--background` | `221 44% 9.8%` |
| text | `#EDF1F7` | `--foreground` | `216 38% 94.9%` |
| surface | `#18202F` | `--card` | `219 32% 13.9%` |
| — | — | `--card-foreground` | `216 38% 94.9%` |
| surface | `#18202F` | `--popover` | `219 32% 13.9%` |
| — | — | `--popover-foreground` | `216 38% 94.9%` |
| accent (manuscript gold = CTA) | `#D4A94A` | `--primary` | `41 62% 56.1%` |
| — | — | `--primary-foreground` | `221 44% 9.8%` |
| brand (gold takes the brand role in dark) | `#D4A94A` | `--secondary` | `41 62% 56.1%` |
| — | — | `--secondary-foreground` | `221 44% 9.8%` |
| surface-2 | `#111827` | `--muted` | `221 39% 11.0%` |
| text-2 | `#9BA6B5` | `--muted-foreground` | `215 15% 65.9%` |
| brand-soft | `#2A2415` | `--accent` | `43 33% 12.4%` |
| brand (gold) | `#D4A94A` | `--accent-foreground` | `41 62% 56.1%` |
| destructive | `#F28B7D` | `--destructive` | `7 82% 72.0%` |
| — | — | `--destructive-foreground` | `221 44% 9.8%` |
| border | `#2A3446` | `--border` | `219 25% 22.0%` |
| border-strong | `#3A465C` | `--input` | `219 23% 29.4%` |
| accent (gold ring) | `#D4A94A` | `--ring` | `41 62% 56.1%` |

New semantic variables (Qamar):

| Var | Mockup hex | HSL value |
|---|---|---|
| `--success` | `#4ADE97` | `151 69% 58.0%` |
| `--success-soft` | `#12301F` | `146 45% 12.9%` |
| `--warn` | `#E4BC5F` | `42 71% 63.3%` |
| `--warn-soft` | `#2E2617` | `39 33% 13.5%` |
| `--warn-strong` | `#E4BC5F` (mockup accent-strong) | `42 71% 63.3%` |
| `--danger` | `#F28B7D` | `7 82% 72.0%` |
| `--danger-soft` | `#33191A` | `358 34% 14.9%` |
| `--text-3` | `#6B7690` | `222 15% 49.2%` |
| `--border-strong` | `#3A465C` | `219 23% 29.4%` |
| `--elev-1` | — | `0 1px 2px rgba(0,0,0,.35)` |
| `--elev-2` | — | `0 2px 6px rgba(0,0,0,.40)` |
| `--elev-3` | — | `0 4px 10px rgba(0,0,0,.45), 0 10px 26px rgba(0,0,0,.35)` |
| `--shadow-card` | — | `0 1px 2px rgba(0,0,0,.4), 0 6px 18px rgba(0,0,0,.35)` |
| `--glow` | — | `0 0 40px rgba(212,169,74,.18)` (active tab Pay pill only) |

### 1.3 Role-mapping decisions (read this before sweeping)

- `--primary` = the **amber/gold accent** (mockup `--accent`). Rationale: shadcn
  `--primary` drives CTA buttons and the ring; in the approved mockup the CTA and
  focus ring are amber. Existing `bg-primary-600` buttons become amber with zero
  class changes.
- `--secondary` = the **brand** (forest in Nur, gold in Qamar — matching the mockup,
  where gold takes the brand role in dark). Used for logo, card titles, active nav,
  tonal buttons, segmented active state.
- shadcn `--accent` = mockup **brand-soft** (the tonal/info surface), NOT the amber.
  Amber soft surface is `--warn-soft` (identical to mockup `--accent-soft` in both
  themes — verified: `#FDF3E3` / `#2E2617`).
- `--input` = mockup `--border-strong` (mockup inputs use border-strong, not border).
- `--warn-strong` is mockup `accent-strong` renamed for its actual use (warn chip /
  banner text). It is a mockup value, not a new color.

### 1.4 Tailwind config additions (contract for the migration)

Colors (all as `hsl(var(--*))`): `success`, `success-soft`, `warn`, `warn-soft`,
`warn-strong`, `danger`, `danger-soft`, `tertiary` (`--text-3`),
`border-strong`, `card`/`popover` etc. already exist.
Boxshadow: `elev-1/2/3`, `card` → `var(--elev-*)` / `var(--shadow-card)`.
Fonts already correct (`sans`=Inter, `heading`=Outfit, `arabic`=Amiri).
Keep `darkMode: 'class'`.

Fonts are **self-hosted** (Outfit 500/600/700, Inter 400/500/600/700, Amiri 400/700,
`font-display: swap`). The Google Fonts `<link>` in `index.html` is dropped
(Phase 1, per branch plan).

---

## 2. Type scale

One scale for all breakpoints — the approved mockup changes layout at 900px, not
type. Headings: Outfit 600, `letter-spacing: -0.01em` (dash figure: -0.02em).
Body: Inter. All figures: `.num` (`tabular-nums` + `"tnum"`). Arabic strings:
`.arabic` (Amiri).

| Token | Size / weight | Font | Use |
|---|---|---|---|
| `text-display-num` | 44px / 700, lh 1.1, ls -0.02em | Outfit | Dashboard zakat-due figure (the one amber number) |
| `text-figure-lg` | 28px / 700 | Outfit | Hawl page zakat-due figure |
| `text-h1` | 22px / 600 | Outfit | Page titles (`.page-head h1`) |
| `text-h3` | 17px / 600 | Outfit | Modal titles |
| `text-section` | 16px / 600 | Outfit | Section titles, stat values (stat values Inter 700) |
| `text-card-title` | 15px / 600 | Outfit | Card titles (brand color) |
| body | 15px / 400, lh 1.55 | Inter | Default |
| `text-label` | 13px / 600 | Inter | Form labels, sub-labels |
| `text-body-sm` | 14px / 500–600 | Inter | Sidebar links (500), list names (600), amounts (600) |
| `text-caption` | 12px / 400–600 | Inter | Help text, chips (600), sub text, table th (600) |
| `text-micro` | 11px / 500–600 | Inter | Arc labels, tabbar labels, sidebar group labels (600, uppercase, ls .08em) |

Rules: display font (Outfit) for headings only, never body. No all-caps eyebrows
except real sidebar-group labels. Currency sub-symbol renders at `.55em`–`.72em`
in `--muted-foreground`, raised (`vertical-align: top`).

---

## 3. Spacing + radius

Base 4px. Observed mockup scale: `2 4 6 8 10 12 14 16 18 22 24 26 28`.

| Element | Value |
|---|---|
| Card padding | 18px (`.pad-lg`: 24px) |
| Page padding | mobile `20px 16px 150px` (bottom clears tabbar) → ≥900px `28px 32px 48px` |
| Page max-width | 760px, centered |
| Card internal gaps | 8 / 10 / 12px |
| Section gap | 26px top (`margin: 26px 0 12px` on section titles) |
| List rows | 13px vertical padding, 1px `--border` divider, no divider on last |
| Form field gap | label→input 6px, field→field 16px |
| Touch targets | min 44px (buttons `min-height: 44px`, inputs 46px, icon buttons 40px + hit-slop, tabbar items 48px) |
| Topbar | min-height 56px, sticky, `--surface`, 1px bottom border |
| Sidebar | 220px, ≥900px only; mobile gets bottom tabbar instead |
| Modal | max-width 480px, padding 22px, bottom-sheet on mobile (radius `18px 18px 0 0`), centered ≥640px (radius 18px) |
| Radius | 14px cards (`--radius`), 12px buttons/segmented, 10px inputs/icon-btn/banners/stats (`--radius-sm`), 16px FAB, 18px modal, 999px chips/pill, 50% avatar, 2px wizard dots |

---

## 4. Accent rationing (hard rule)

Amber (`--primary` in Nur) / gold (`--primary` in Qamar) appears in **exactly five
places** and nowhere else:

1. Primary CTA (`btn-primary` background + its hover = `accent-strong`: Nur
   `#92400E`, Qamar `#E4BC5F`).
2. Zakat-due figure (the 44px / 28px number).
3. Hawl moon marker + progress stroke (see §5).
4. Focus ring / `:focus-visible` outline + input focus border and 3px `--warn-soft`
   glow shadow.
5. Notification badge dot.

Everything else is forest/neutral (`--secondary`, `--foreground`, `--muted-*`) or
status tokens (success/warn/danger). In Qamar, gold additionally takes the brand
role (logo, card titles, active nav, snackbar bg) — that is the mockup's sanctioned
exception, not a license to spread amber further. Grep gate for the sweep: after
each batch, `text-amber|bg-amber|text-yellow|from-amber` must appear only inside
the five rationed slots.

CTA foreground: `#FFFFFF` in Nur, `#0E1524` in Qamar (`--primary-foreground`).

---

## 5. Moon-arc component spec (replaces HawlProgressIndicator)

Geometry extracted from `hawl.html` (math-verified at 58.6%: arc length
π·180 = 565.49 ≈ 565.5; offset 565.5 × (1 − 0.586) = 234.1 ✓).

### 5.1 Formula

Semicircle, radius `r`, center `(cx, cy)`, baseline at bottom. Path:
`M (cx−r) cy A r r 0 0 1 (cx+r) cy`.

- Arc length `L = π·r`.
- Progress fraction `f = day / 365` (clamp 0–1).
- Progress stroke: `stroke-dasharray: L`, `stroke-dashoffset: L·(1−f)`.
- Moon glyph position (leading edge of progress, on the arc):
  `angle θ = π·(1−f)`; `x = cx + r·cos(θ)`, `y = cy − r·sin(θ)`.
  Verify at f = 0.586: θ = 74.5°, large arc → (248.1, 31.6) ✓ matches mockup
  `translate(248, 31.5)`.

**Do not copy the mockup's mini-arc glyph coordinates** (`76.4, 27.4`): that point
sits at radius ≈42.4 from the center, off the 54-radius arc (mockup artifact).
Compute from the formula: f = 0.586 → (78.4, 16.0).

### 5.2 Two sizes (both from the mockup)

| | Full (hawl page) | Mini (dashboard strip) |
|---|---|---|
| viewBox | `0 0 400 224` | `0 0 128 76` |
| r / center / baseline | 180 / (200, 205) / y=205 | 54 / (64, 68) / y=68 |
| L | 565.5 | 169.6 |
| Track stroke | `--border-strong`, 3px, round cap | same |
| Progress stroke | `--primary` (amber/gold), 3px, round cap | same |
| Moon glyph | halo: circle r=16, stroke `--card`, width 5 · moon: circle r=13, fill `--primary` | halo: r=11, stroke `--card`, width 3.5 · moon: r=9, fill `--primary` |
| Glyph shadow | `filter: drop-shadow(0 2px 6px rgba(0,0,0,.25))` (`.moon-glyph`) | omit (mockup omits it) |

The halo (surface-colored ring) creates the gap where the moon overlaps the arc.

### 5.3 Labels (full size only)

`.arc-labels`: flex row, 3 equal spans, 11px, `--muted-foreground`, margin-top 6px:
`🌙 Day 1 · crescent` | **`Day {n} · today` + `{pct}% complete`** (weight 600,
`--foreground`) | `🌙 Day 365 · due {date}`. All figures `.num`.

### 5.4 Component contract

- Props: `day`, `totalDays = 365`, `dueDate`, `size: 'full' | 'mini'`.
- `aria-hidden="true"` on the SVG; the surrounding text carries the data for screen
  readers (day, percent, due date).
- Reduced motion: no dash-draw animation; snap to final offset.
- Optional draw-in: animate `stroke-dashoffset` once, ≤200ms, `--motion-emphasized`,
  only if not `prefers-reduced-motion`.

---

## 6. M3 interaction spec

### 6.1 Elevation tiers

| Tier | Token | Where |
|---|---|---|
| 0 — flat | none | Page background, list rows, dividers, table rows, banners (soft bg, no shadow) |
| 1 — resting | `--shadow-card` (≈ elev-1/2) | Cards, stat tiles, quick-action tiles, `details.rec` |
| 2 — raised | `--elev-2` | Dropdowns, popovers, hover menus, sticky topbar |
| 3 — floating | `--elev-3` | FAB, snackbar, modal backdrop content, `.lift:hover` cards |

`.lift` (interactive cards): `transition: box-shadow .22s, transform .22s` with
`--motion-standard`; hover → `--elev-3` + `translateY(-1px)`; active → `translateY(0)`
+ `--elev-1`.

### 6.2 State layers

`.state-layer` (position relative, overflow hidden) with `::after` on `currentColor`:
opacity 0 → **.06 on hover** → **.12 on press**; `transition: opacity .15s
--motion-standard`; `pointer-events: none`.

Apply to: list rows, sidebar links, tabbar items, icon buttons, table rows, ghost
buttons, segmented buttons. Do NOT add to `btn-primary`/solid buttons (they get
ripple + background shift instead) — in the mockup the primary CTA carries both
`ripple-host` and `state-layer`; keep that exact pairing for the primary CTA only.

### 6.3 Ripple

`.ripple-host` + `.ripple-ink`: circle from press point, `currentColor` at opacity
.18, `scale(0) → scale(2.6)`, opacity → 0, `.55s --motion-emphasized`, forwards,
`pointer-events: none`, one ripple per press, host `overflow: hidden`. Ripple is
pointer-driven; keyboard activation gets the focus ring and state layer only.
Scope: primary CTAs and solid filled buttons. Implement as a small util component
(`useRipple` / `<Ripple/>`), not a global listener. Honor `prefers-reduced-motion`
(no ripple).

### 6.4 Snackbar

Fixed, `bottom: 100px`, centered (`left: 50%`, `translateX(-50%)`), max-width
`min(92vw, 480px)`, bg `--secondary` with `--background`-colored text in Nur; bg
`--primary` (gold) with `#0E1524` text in Qamar; radius 10px; `--elev-3`; font
500 13.5px; enter/exit `.25s --motion-emphasized` via `.show` (20px Y offset → 0).
Optional uppercase action button (700 13px, ls .04em). One at a time (new message
replaces). Auto-dismiss ~4s (implementation default — not specified in mockup).
Replaces ad-hoc toasts/alerts during the sweep.

### 6.5 FAB

56×56, radius 16px, bg `--primary`, foreground per theme, `--elev-3`, fixed
`bottom: 86px; inset-inline-end: 18px`, z-60, press `scale(.96)`. **Mobile only**
(`display: none` ≥900px — desktop pages carry inline primary buttons instead).

**Placement rule: a FAB appears only on a page with a single primary create action**
(hawl records, assets, liabilities, payments). Never on settings, admin,
diagnostics, knowledge hub, calculator. The FAB duplicates the page's primary CTA;
it never introduces a second intent (audit rule 8: no duplicate CTA intent).

### 6.6 Segmented control

For 2–5 mutually exclusive in-place views (nisab gold/silver toggle, calculator
mode, payment filter). Inline-flex, 1px `--border-strong` border, radius 12px,
`overflow: hidden`; buttons min-height 44px, padding `0 16px`, font 600 13px,
`--muted-foreground`; divider 1px `--border` between; active
(`aria-pressed="true"`) bg `--accent` (brand-soft) + text `--accent-foreground`
(dark: gold). Not for page navigation. State layer on buttons; no ripple.

### 6.7 Motion tokens

- Curve: `--motion-standard` = `--motion-emphasized` = `cubic-bezier(.2, 0, 0, 1)`
  (mockup uses one curve; keep one).
- Durations: state layers 150ms; shadow/transform transitions 220ms; modal and
  snackbar 250ms; existing `duration-200/300` utilities map to 220/250.
- Animate only `transform`, `opacity`, `box-shadow`. No layout-property animation.
- `prefers-reduced-motion: reduce` → ripple off, lift transform off (shadow only),
  modal/snackbar fade only (no translate), moon arc snaps.
- z-index scale (fixed values only): topbar 40, tabbar 50, FAB 60, modal 100,
  snackbar 200. No arbitrary z utilities in the sweep.

---

## 7. Class migration mapping (the 104-file sweep)

Mechanical replacements. Order matters within a file: replace structural surfaces
first, then tints, then text.

### 7.1 Surfaces & structure

| Old (hardcoded) | New (semantic) |
|---|---|
| `bg-white` (cards/panels) | `bg-card` |
| `bg-slate-50`, `bg-gray-50` (page/panel bg) | `bg-background` (page) / `bg-muted` (recessed panel) |
| `bg-slate-100`, `bg-gray-100` | `bg-muted` |
| `bg-gray-200` (chips, wells) | `bg-muted` |
| `border-slate-200`, `border-gray-200`, `border-gray-100` | `border-border` |
| `border-slate-300`, `border-gray-300` | `border-border-strong` |
| `divide-gray-100`, `divide-gray-200` | `divide-border` |
| `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg shadow-primary-500/20` on cards | `shadow-card` (resting) or `shadow-elev-2` |
| `shadow-xl` (modals/floating) | `shadow-elev-3` |
| `rounded-xl` on cards | `rounded-lg` (14px via `--radius`) |
| `rounded-lg` on inputs | `rounded-sm` (10px) |
| `glass-panel`, `glass-card`, `bg-white/80 backdrop-blur-*` | `bg-card border border-border` (+ `shadow-card`); solid surfaces, glass is retired |
| `hover:bg-gray-50/100`, `hover:bg-slate-50/100` | `hover:bg-muted` |
| `bg-gray-900`, `bg-gray-800`, `bg-slate-900` (dark chips/headers in light mode) | redesign to `bg-secondary text-secondary-foreground` or `bg-foreground text-background`; do not preserve raw dark chips |

### 7.2 Text

| Old | New |
|---|---|
| `text-gray-900`, `text-slate-900`, `text-gray-800` | `text-foreground` |
| `text-gray-700`, `text-gray-600`, `text-gray-500`, `text-slate-600`, `text-slate-500` | `text-muted-foreground` |
| `text-gray-400`, `text-gray-300`, `text-gray-200` | `text-tertiary` (faint/help/disabled) |
| `text-teal-700`, `text-teal-800`, `text-teal-900` (brand headings/titles) | `text-secondary` (brand role: card titles, logo, active nav) |
| `text-teal-600` (action/links) | `text-primary` only if it is a rationed accent slot; otherwise `text-foreground` / `text-secondary` by role |
| `text-emerald-600`, `text-green-600`, `text-green-700` | `text-success` |
| `text-red-600`, `text-red-700`, `text-rose-*` | `text-danger` |
| `text-amber-600`, `text-amber-700`, `text-yellow-600` | `text-warn` (or `text-primary` ONLY in the five rationed slots) |
| `text-orange-*`, `text-blue-*`, `text-indigo-*`, `text-purple-*`, `text-sky-*`, `text-cyan-*`, `text-violet-*` | map to the nearest semantic role (info→`text-foreground`/`text-secondary`, never keep the hue — one accent per page) |

### 7.3 Tints (pastel action/status cards)

| Old | New |
|---|---|
| `bg-gradient-to-r from-teal-50 to-teal-50` (+ `from-emerald-50`, `from-green-50`, `from-primary-50` hero banners) | solid `bg-accent text-accent-foreground` (brand-soft info banner); gradients are retired |
| `from-blue-50`, `from-indigo-50` (+ matching `to-*`) | `bg-accent text-accent-foreground` |
| `from-amber-50`, `from-yellow-50` | `bg-warn-soft text-warn-strong` |
| `from-red-50` | `bg-danger-soft text-danger` |
| `bg-green-50/100 text-green-800` (success cards) | `bg-success-soft text-success` |
| `bg-red-50/100 text-red-800` | `bg-danger-soft text-danger` |
| `bg-amber-50/100 text-amber-800` | `bg-warn-soft text-warn-strong` |
| `bg-teal-50`, `bg-teal-100` | `bg-accent text-accent-foreground` |
| icon chips `bg-emerald-100 text-emerald-600` / `bg-amber-100 text-amber-600` / `bg-red-100 text-red-600` / `bg-blue-100 text-blue-600` | `bg-success-soft text-success` / `bg-warn-soft text-warn` / `bg-danger-soft text-danger` / `bg-accent text-accent-foreground` |
| `chip`/`badge` pastel pills | `.chip.ok/.warn/.danger/.muted` pattern: `bg-{status}-soft text-{status}` |

### 7.4 Buttons & controls

| Old | New |
|---|---|
| `.btn-primary` (`bg-primary-600 text-white hover:bg-primary-700 shadow-primary-500/20`) | `.btn-primary`: `bg-primary text-primary-foreground hover:bg-[accent-strong] rounded-md shadow-elev-2 active:scale-[.98]` + ripple/state-layer |
| `.btn-secondary` (white + teal border) | `.btn-secondary`: `bg-card text-foreground border-border-strong hover:bg-muted` (neutral); use `.btn-tonal` (`bg-accent text-accent-foreground`) where the old button carried brand tint |
| `.btn-ghost` | `text-primary bg-transparent hover:bg-warn-soft` — mockup ghost text is `--accent` (amber); ghost buttons are a rationed CTA-adjacent slot, allowed |
| `active:scale-95 transition-all duration-200` | keep; standardize to `active:scale-[.98] duration-200` |
| inputs `border-gray-300 rounded-lg` | `border-input rounded-sm focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--warn-soft))]` |

### 7.5 Sweep mechanics

- Target grep: `teal-|emerald-|gray-|slate-|from-|via-|to-|shadow-(sm|md|lg|xl)|glass-`
  across `client/src` (104 files). Sweep in the Phase-2 batch order from the branch
  plan; each batch: rebase first, semantic classes only, no logic changes, tests
  green.
- **Deletion bonus:** once a batch's files are swept, the matching `.dark .bg-gray-*`
  / `.dark .text-*` / `.dark .from-*` retrofit rules in `index.css` (lines ~76–289)
  become dead and are deleted in the same commit. Full sweep ⇒ the whole retrofit
  block goes. Gate: grep `\.dark \.(bg|text|border|from|ring)-[a-z]` returns 0.
- Never introduce a raw hex or a non-token Tailwind color in swept files. If a
  needed value is missing from §1, stop and add the token to this contract first.

---

## 8. Do / Don't (carried from AUDIT-CHECKLIST.md into the codebase standard)

Every swept page must pass all of these. Fail = fix before the batch lands.

1. **Dash ban:** zero em/en dashes anywhere visible. Hyphen `-` only.
2. **Copy:** every string reads like a human product designer wrote it. No filler
   verbs (seamless, elevate, unlock, empower), no fake precision, no lorem, no Acme.
3. **No emoji in functional UI:** emoji only in nav/quick-action icon chips
   (deliberate style), never inside buttons, badges, or form labels.
4. **Grids:** no 3-equal-identical-cards rows. Break symmetry where content allows.
5. **Accent rationing:** amber/gold only on the five slots in §4. Grep every batch.
6. **Color consistency:** one accent per page; no stray hues outside the token set.
7. **Typography:** Outfit headings only, Inter body; no orphaned all-caps eyebrows
   except real sidebar-group labels; no letter-spacing abuse.
8. **Real states:** every list page shows empty/loading affordances, not just the
   happy path.
9. **A11y:** labels on all inputs, alt/aria on icon buttons, `:focus-visible` works
   (2px `--ring` outline, offset 2px), 44px minimum targets.
10. **Dark parity:** every batch is screenshot-checked in Qamar; contrast holds; no
    broken shadows (`--glow` only on the Pay tab pill).
11. **Honest copy:** "Estimated" not "You owe"; sample-data labels present on
    analytics.
12. **No fake data drift:** figures match shared mock data exactly (grep anchors:
    48,730.25 / 1,218.26 / 6,145.30 / 214 / 121 / Mar 4, 2027).

Additional codebase-standard rules (from the design-taste gate):

- **No `window.addEventListener('scroll')`** in swept components; use
  IntersectionObserver or CSS transitions.
- **No duplicate CTA intent** on a page; the FAB never adds a second intent.
- **No placeholder-as-label**; label above input, error below, help optional.
- **Reduced motion** honored for ripple, lift, modal/snackbar, moon-arc draw.
- **Theme lock:** `.dark` is set once at the root (existing ThemeToggle); no
  per-section theme flips; `color-scheme: dark` stays.