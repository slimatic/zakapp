# ZakApp v1.0 - Phase 6: Composition & Layout Overhaul

**Branch:** `feature/v1-design-overhaul` (LOCAL ONLY - never pushed)
**Status:** PLANNED - awaiting Salim's go
**Author:** RIQ, 2026-09-24
**Trigger (Salim, verbatim):** *"what are the UI changes we can make besides the theme card
structure where things are at that would really impact the front end so that we can get to
what the mockup looks like. Right now it looks nothing like a mock. The colors and the
[theme] are close."*

He is right, and the diagnosis is specific: **Phases 1-4 migrated the token layer and the
color classes, but never migrated the composition layer.** That is why the palette reads
correct and everything else reads wrong. This document is that missing layer.

---

## 1. Why it looks like a theme swap and not a redesign

Phases 1-4 replaced `bg-gray-100` with `bg-muted` across 108 files. That changes *pigment*.
It does not change a single one of these, which is what the eye actually reads as "design":

| Layer | Migrated in Phases 1-4? |
|---|---|
| Color tokens (Nur/Qamar palette) | Yes |
| Semantic class names | Yes |
| Dark-mode correctness | Yes |
| **Navigation model** | **No** |
| **Page composition / information hierarchy** | **No** |
| **Card anatomy and density** | **No** |
| **Signature components (moon-arc)** | **No** |
| **Display typography / hero scale** | **No** |
| **Money presentation** | **No** |

Evidence: the live dashboard's own heading is still `Welcome to ZakApp` with a paragraph of
instructions, while the approved mockup's dashboard opens with `$1,218.26` at display size.
Same colors. Completely different product.

## 2. The gap, measured

Screenshots captured at 1280x900, mockup (left) vs live (right) -
`~/zakapp-compare/SIDE-{dashboard,assets,calculator,settings}.png`.

### 2.1 Navigation - the single biggest difference

| | Mockup (approved) | Live |
|---|---|---|
| Desktop | Persistent left sidebar, grouped (main / LEARN / YOU), emoji glyphs, active row tinted | Top navbar, 3 dropdown menus (`Wealth ▾ Records ▾`) |
| Mobile | Bottom tabbar, 5 items, center FAB-style Pay | `BottomNav.tsx` exists, different items/order |
| Orientation | Always know where you are | Must open a dropdown to discover pages |

This one change rewrites every page's frame and accounts for most of the "doesn't look like
the mockup" feeling.

### 2.2 Dashboard composition

Mockup order:
1. `As-salamu alaykum, Yusuf` + date (small, muted, top)
2. **`$1,218.26` - display-size hero**, with `Estimated zakat due for 1448 - Shafi'i` beneath
   and `See how this was calculated` link
3. Hawl card: **moon-arc SVG** at 58.6%, `Day 214 of 365 - 121 days until due (Mar 4, 2027)`,
   `Above nisab` chip, two buttons
4. `Quick actions` - 4 compact cards with tinted icon chips
5. `Your wealth` - summary row (`$48,730.25` / nisab `$6,145.30` / `7.9x nisab`) then asset rows

Live order:
1. `Welcome to ZakApp` (36px, the loudest thing on the page)
2. `Your Wealth & Zakat Portfolio` + two lines of instruction
3. One full-width `Add Your First Asset` banner
4. One `Understanding Zakat & Nisab` disclosure
5. Footer

The hero metric is absent entirely. The page has no focal point.

### 2.3 Component patterns present in the mockup, missing in the live app

- `.moon-arc` - the moon-phase hawl arc (signature; spec in `BUILD-BRIEF.md` lines 28-38)
- `.icon-chip` - tinted rounded-square icon per asset/category/section
- `.list-row` - dense row with leading chip, title, muted subtitle, right-aligned money
- `.chip` / `.chip-green` / `.chip-amber` - status pills (`Above nisab`, `Zakatable`)
- `.amount` / `.cur` - money with `$` set smaller than the digits, tabular numerals
- `.segmented` - segmented control (used in assets filter: All / Cash / Gold / ...)
- `.card-title` / `.page-head` - deliberate type scale for page framing
- `.sidebar`, `.sidebar-group`, `.sidebar-link`, `.mobile-tabbar` - the nav shell
- `.banner`, `.snackbar`, `.fab`, `.divider`, `.state-layer`, `.ripple-*`

The live app has `Button`, `Card`, `Input` primitives only. It has no vocabulary for the
mockup's composition.

### 2.4 Typography

Both already load **Outfit** (display) and **Inter** (body) - `tailwind.config.js:80-82`
declares `font-heading` and `font-sans`. But `font-heading` is barely used, and there is no
display scale: the hero number needs Outfit 600 at ~56-64px with tight tracking and
tabular figures. The live app tops out around 36px in Inter.

### 2.5 Density

Mockup cards use ~16-20px internal padding with tight vertical rhythm. Live cards are
markedly airier, which is why a mocked-up screen shows 5 asset rows where the live app
shows 1 empty state. Density is a design decision, not an accident, and it was never
transferred.

### 2.6 Also carried over from the live app (not design, but it will show in review)

- `Sync Error` chip in the header - CouchDB unreachable from the preview origin
- Live account has no data, so every page is an empty state; comparison is unfair until seeded
- `font-display` here means `font-display: swap` in `@font-face`, unrelated to the display type scale

## 3. Proposed work - five batches

Ordered so each batch is independently reviewable and the riskiest visual change lands last.

### Batch 1 - Money & number presentation (foundation, low risk)
Build `.amount` / `.cur` / tabular-numeral treatment and a shared `<Money>` component.
Every screen shows money; doing this first makes every later screenshot read correctly.
Also: `font-heading` applied to page titles.
**Files:** new `client/src/components/ui/Money.tsx`; `client/src/lib/format.ts`.
**Risk:** low. Pure presentation, no layout movement.

### Batch 2 - App shell: sidebar + tabbar
Replace the top navbar with the mockup's left sidebar (desktop, >=900px) grouped
main / LEARN / YOU, active-row tint, and a 5-item bottom tabbar on mobile. Keep the top
bar slim (logo, theme toggle, notifications, avatar) as in the mockup.
**Files:** `client/src/components/layout/Layout.tsx` (rewrite of the nav section),
`Navigation.tsx`, `BottomNav.tsx`, new `Sidebar.tsx`.
**Risk:** medium-high - touches every page's frame. Single commit, reviewable in isolation.
**Note:** this is the change Salim will feel most; it should land second so it can be judged
on the existing pages before any content work.

### Batch 3 - Component vocabulary
Add the missing primitives: `IconChip`, `ListRow`, `Chip`/`StatusPill`, `Segmented`,
`PageHead`, `Banner`, `Snackbar`, `Fab`, `EmptyState`. Each mirrors the mockup's `ui.css`
class so the two stay comparable.
**Files:** `client/src/components/ui/*`.
**Risk:** low - additive, nothing consumes them yet.

### Batch 4 - Dashboard rebuild + moon-arc
Rebuild the dashboard to the mockup's order and hierarchy: greeting, hero zakat figure,
hawl card with the **moon-phase arc SVG**, quick actions, wealth summary, asset rows.
The moon-arc is the signature component; spec is already written
(`BUILD-BRIEF.md` lines 28-38: semicircle, progress stroke at 58.6%, moon glyph at
position with waxing-gibbous shading, three labels).
**Files:** `client/src/pages/Dashboard.tsx`, new `MooArc.tsx` (also reusable by
`HawlProgressIndicator.tsx`), `DashboardActionCards.tsx`.
**Risk:** medium. New SVG work; must handle 0% and 100% cleanly and be labelled for a11y
(the arc is decorative, the numbers are the accessible content).

### Batch 5 - Remaining pages to the mockup's composition
Assets (summary bar + segmented filter + list rows), Calculator (stepper restyle, result
hero), Payments, Nisab/Hawl, Settings (card grid), Analytics, Knowledge Hub.
**Files:** page-by-page, in that order.
**Risk:** medium. Each page reviewed as its own commit.

## 4. Explicit non-goals

- No backend, API, schema, or routing changes. Routes stay as they are (`/nisab-records`,
  `/hawl`, `/learn` differ from the mockup's file names - we keep the live routes).
- No new dependencies. The moon-arc is inline SVG; no chart or icon library.
- No emoji icons in the sidebar. The mockup used emoji as a build shortcut; the live app
  has SVG icons and we keep SVG for a professional finish.
- No push, no merge. Local-only until Salim says otherwise.
- No redesign of any flow the mockup did not cover.

## 5. What "done" looks like

Side-by-side screenshots at 1280x900 and 390x844, both themes, of
dashboard / assets / calculator / payments / nisab / settings, where the live column is
structurally indistinguishable from the mockup column. That set is the acceptance test, and
it is produced mechanically - the same capture script that produced
`~/zakapp-compare/SIDE-*.png`.

Gate per batch: `tsc --noEmit` clean, `npx vitest run` green (622 baseline), `npm run build`
green, screenshots regenerated.

## 6. Effort

Batches 1-3 are mechanical and fast. Batch 2 (shell) and batch 4 (dashboard + moon-arc) are
where the design work is. Batches 1-4 together get the app to *"this looks like the mockup"*;
batch 5 is finishing work across the remaining pages.

## 7. Open questions for Salim

1. **Sidebar or keep the top navbar?** The mockup uses a sidebar. Moving to it is the single
   largest visual change and it touches every page. Confirm before batch 2.
2. **Emoji vs SVG in the sidebar?** Recommendation: SVG (matches the current app and reads
   more professional). The mockup only used emoji for build speed.
3. **Mockup's 5-item mobile tabbar vs the current bottom nav?** Which items matter most on
   mobile: Home / Assets / Hawl / Pay / More, or keep the current set?
4. **Density.** The mockup is denser than the live app. Confirm you want the denser rhythm -
   it fits more on a phone screen but leaves less breathing room.
