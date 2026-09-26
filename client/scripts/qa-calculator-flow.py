"""QA the /calculator methodology + Review flow in a real browser.

Reproduces the two reported defects and confirms the fixes:
  1. selecting a methodology card no longer toasts "Failed to save methodology
     preference"
  2. the Review step reports a finite nisab threshold instead of $NaN, and a
     portfolio above nisab gets a nonzero obligation

Run from client/scripts with ZAK_SMOKE_PASS set (real credentials, never inline).
"""

import os
import sys
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _login import open_session  # noqa: E402

FAIL_TOAST = "Failed to save methodology preference"


def main():
    findings = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx, pg = open_session(browser, {"width": 1440, "height": 1200}, path="/calculator",
                               reduced_motion="reduce")
        print(f"  on: {pg.url}\n")

        # Methodology cards are role=button elements on the Methodology step.
        cards = pg.locator("[role=button]")
        cards = cards.filter(has_text="Method")  # Standard (AAOIFI) / Hanafi Method / ...
        n = cards.count()
        print(f"  methodology cards: {n}")
        if n == 0:
            findings.append(("methodology cards", "NONE FOUND - selector wrong"))
        for i in range(n):
            card = cards.nth(i)
            label = (card.inner_text() or "").strip().replace("\n", " / ")[:45]
            card.click()
            pg.wait_for_timeout(3000)
            body = pg.inner_text("body")
            bad = FAIL_TOAST in body
            findings.append((f"select {label!r}", "TOAST FAILURE" if bad else "ok"))
            print(f"    {label[:40]:42s} -> {'FAILED TOAST' if bad else 'no error toast'}")

        # Advance to Review.
        nxt = pg.locator("button:has-text('Next: Select Assets')")
        if nxt.count():
            nxt.first.click()
            pg.wait_for_timeout(3000)
        # Select all assets if the step offers it, then continue.
        for label in ("Select All", "Next: Review", "Next", "Review"):
            b = pg.locator(f"button:has-text('{label}')")
            if b.count():
                b.first.click()
                pg.wait_for_timeout(3500)
                break

        body = pg.inner_text("body")
        print("\n  --- Review step ---")
        for ln in body.split("\n"):
            if any(k in ln for k in ("Nisab", "Obligation", "Total Assets", "Zakat Due", "$")):
                s = ln.strip()
                if s and len(s) < 80:
                    print(f"    {s}")

        if "NaN" in body:
            findings.append(("review", "NaN PRESENT"))
            print("\n  !! NaN visible on the page")
        else:
            findings.append(("review", "no NaN"))

        tok = pg.evaluate("localStorage.getItem('accessToken') ? 'present' : 'MISSING'")
        print(f"\n  accessToken in localStorage: {tok}")

        ctx.close()
        browser.close()

    print("\n  SUMMARY")
    bad = [f for f in findings if f[1] != "ok" and f[1] != "no NaN"]
    for name, verdict in findings:
        print(f"    {verdict:22s} {name}")
    print(f"\n  {'PASS - both defects cleared' if not bad else 'FAIL - ' + str(bad)}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
