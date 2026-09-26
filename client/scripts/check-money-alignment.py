"""Money renders with tabular figures, on every page that shows amounts.

Why: a column of amounts in proportional figures does not line up, and in a
zakat app that reads as misaligned - or misadded - arithmetic. 33 components
rendered money without tabular-nums while Money.tsx and the mockup's .num both
specify it.

Fixed on `body` rather than at 33 call sites. This check asserts the COMPUTED
style, so it still holds if someone later overrides the base and forgets a
component.

Ponytail: samples rendered numerals via getComputedStyle instead of walking all
33 files, because the regression that matters is what the user sees.
"""
import os
import sys
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _login import open_session, BASE  # noqa: E402

# Pages whose content is predominantly money.
ROUTES = [
    "/dashboard", "/assets", "/liabilities", "/nisab-records",
    "/payments", "/analytics",
]
# /calculator is deliberately absent: it opens on step 1 (methodology), so it
# renders no amounts until the user advances. Its step-3 review does show money,
# but driving the wizard from here would duplicate the existing
# check-nisab-rows.py, which reaches the amount-bearing state and measures the
# figures directly.

# Any element whose text is mostly a formatted amount.
FIND_AMOUNTS = r"""() => {
  const AMOUNT = /^[\s$\-+()]*[\d,]+(?:\.\d{1,2})?\s*(?:USD|EUR|GBP|SAR|AED|%|$)?$/;
  const out = [];
  document.querySelectorAll('#main-content *').forEach(el => {
    if (el.children.length) return;
    const t = (el.textContent || '').trim();
    if (t.length < 2 || t.length > 24) return;
    if (!AMOUNT.test(t)) return;
    if (!/\d/.test(t)) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    out.push({ text: t, variant: cs.fontVariantNumeric,
               family: cs.fontFamily.split(',')[0],
               tabular: /tabular-nums/.test(cs.fontVariantNumeric) ||
                        /tnum/.test(cs.fontFeatureSettings) });
  });
  // keep distinct (text) samples
  const seen = new Set();
  return out.filter(o => { if (seen.has(o.text)) return false; seen.add(o.text); return true; });
}"""


def main():
    problems = []
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        ctx, pg = open_session(b, {"width": 1280, "height": 900})
        # Seed a dataset first. Without it the list pages are empty, the check
        # finds no amounts, and it passes for the wrong reason.
        pg.goto(f"{BASE}/seeder", wait_until="networkidle")
        pg.wait_for_timeout(1500)
        try:
            pg.click("text=Seed a Full Demo Dataset", timeout=8000)
            pg.wait_for_timeout(18000)
        except Exception:
            pass  # already seeded, or a build without the seeder

        for route in ROUTES:
            pg.goto(f"http://localhost:4173{route}", wait_until="networkidle")
            pg.wait_for_timeout(2200)
            items = pg.evaluate(FIND_AMOUNTS)
            if not items:
                # A money page with no amounts means the page is empty or broken,
                # not that it is correctly aligned. Do not pass silently.
                problems.append(f"{route}: no rendered amounts - page empty or broken?")
                print(f"  FAIL {route:16} no rendered amounts")
                continue
            bad = [i for i in items if not i["tabular"]]
            print(f"  {'ok' if not bad else 'FAIL'} {route:16} {len(items)} amount(s), "
                  f"{len(bad)} proportional")
            for i in bad[:3]:
                print(f"        \"{i['text']}\"  variant={i['variant']}  {i['family']}")
            if bad:
                problems.append(f"{route}: {len(bad)} amount(s) without tabular figures")
        ctx.close()
        b.close()

    print()
    if problems:
        for x in problems:
            print(f"FAIL {x}")
        sys.exit(1)
    print("PASS: every rendered amount uses tabular figures.")


if __name__ == "__main__":
    main()
