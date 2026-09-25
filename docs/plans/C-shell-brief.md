# Brief: v1.0 App Shell (Item C)

**For:** kimi-k2.6. **Tree:** `/home/chuwi_agent/zakapp-shell` (branch `feature/v1-shell-sidebar`).
**Do not work in `~/zakapp`** — that tree belongs to other agents.

---

## Goal

Replace the top-navbar shell with the approved persistent-left-sidebar layout.

Today `client/src/components/layout/Navigation.tsx` is an 85-line navbar with dropdowns and
there is **no `Sidebar.tsx`**. The sidebar exists only in the static mockup. Build the React
equivalent.

## Reference (read these, do not copy blindly)

- `~/zakapp-ui-mockup/_shared-snippet.html` — exact sidebar / topbar / tabbar markup.
- `~/zakapp-ui-mockup/styles/ui.css` — 198 lines, the shared component CSS. The sidebar,
  topbar and tabbar rules are the spec.
- `~/zakapp-ui-mockup/BUILD-BRIEF.md` — UX rules.

## Structure (from the mockup, grouped main / LEARN / YOU)

```
main:  Dashboard, Assets, Liabilities, Hawl, Calculator, Payments, Analytics
LEARN: Knowledge Hub
YOU:   Settings, Diagnostics, Admin
```

## THE ICON RULE — read carefully

The mockup uses unicode emoji (`&#127968;` etc.) as icons. **Do not do that.** Those were
shorthand for static HTML with no icon library.

The design doc forbids emoji in the app: *"No emoji icons (SVG only, for a professional
finish)."*

**Use `lucide-react`.** It is already a dependency and already used in `Layout.tsx`:
```tsx
import { Home, Wallet, ... } from 'lucide-react';
```
No new dependency. No inline hand-rolled SVG path soup — lucide covers all of these.

## Hard constraints

- **RTL-safe:** logical properties only (`ps-`/`pe-`/`ms-`/`me-`, `start-`/`end-`). This repo
  already had a full RTL sweep (commit `564aabca`) — do not reintroduce physical
  `left`/`right`/`ml-`/`mr-` in the shell. Arabic is a supported locale.
- **WCAG 2.1 AA**, and `npx vitest run tests/accessibility/a11y.test.tsx` must stay green.
- **Tokens only.** No raw hex, no `text-gray-*`. Semantic tokens (`bg-surface`, `text-muted-foreground`,
  `border-border`) — this repo migrated 108 files off raw grays and a checker enforces it.
- **No new dependencies.**
- Mobile: single column, sidebar hidden below 900px, 5-item bottom tabbar visible
  (`BottomNav.tsx` already exists — extend it, do not duplicate it).
- Money stays tabular-nums; amber/gold is rationed (primary CTA, zakat figure, hawl marker only).

## Deliverables

1. `client/src/components/layout/Sidebar.tsx` — grouped nav, active-row tint, collapsible on
   narrow desktop is optional.
2. Rewire `Layout.tsx` to the shell (sidebar + slim topbar + content).
3. Update `BottomNav.tsx` for the 5-item mobile tabbar.
4. Delete the dropdown navbar in `Navigation.tsx` **if nothing else imports it** — grep all
   callers first. Deletion over leaving dead markup.
5. Any new string goes through i18n (`useTranslation`), both `en` and `ar`. The repo has
   `client/scripts/check-i18n-keys.py` and `bundleIntegrity.test.ts` enforcing key parity —
   run them.

## Verification you MUST run before reporting done

```bash
cd client
npx tsc --noEmit                                  # must be clean
npx vitest run tests/accessibility/a11y.test.tsx  # must stay green
npx vitest run                                    # full suite must stay green
python3 scripts/check-i18n-keys.py                # must PASS
python3 scripts/check-dead-classes.py             # must PASS
```

Baseline before you start: **711 client tests pass, 1 skipped.** If that number drops, you
broke something.

## What NOT to do

- Do not touch `client/src/core/calculations/**` — another agent owns that.
- Do not "improve" unrelated pages.
- Do not add a UI kit, a CSS-in-JS lib, or a state library.
- Do not hand-roll the moon arc — that is item E, not C.

## Report format

Keep the summary short:
1. Files added / changed / deleted.
2. The exact commands you ran and their real output (test counts, tsc result).
3. Anything you could NOT verify, stated plainly. Uncertainty named is acceptable;
   an unverified "done" is not.
