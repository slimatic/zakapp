"""Mobile integrity check: no horizontal overflow, exactly one skip link.

Two real defects this catches:
  1. The header packed logo + 2 icon buttons + the Sync Error chip + a mobile
     menu slot + avatar into 390px, totalling 435px. A 45px horizontal overflow
     shifts every page on a phone.
  2. App.tsx and Layout.tsx each rendered <SkipLink>, so keyboard users got two
     "Skip to main content" links to the same target.

Run at a real phone width (390px), because desktop widths hide both problems.
"""
import sys
from playwright.sync_api import sync_playwright
from _login import open_session

UID = "cmuerqpub000rpb3fulpxby7g"
BASE = "http://localhost:4173"
ROUTES = ["/dashboard", "/assets", "/liabilities", "/nisab-records", "/payments",
          "/analytics", "/calculator", "/settings", "/learn",
          # the 404: it rendered outside the shell, so it had a skip link pointing at
          # a #main-content that did not exist. Only a bogus URL reaches it.
          "/no-such-route"]

PROBE = """() => ({
  hOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  skipLinks: document.querySelectorAll('a[href="#main-content"], .skip-link').length,
  mainContent: document.querySelectorAll('#main-content').length,
  mainText: (document.querySelector('#main-content')?.textContent || '').length
})"""

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx, pg = open_session(b, {"width": 390, "height": 844}, is_mobile=True)

    bad = []
    for route in ROUTES:
        pg.goto(f"{BASE}{route}", wait_until="networkidle")
        pg.wait_for_timeout(2500)
        r = pg.evaluate(PROBE)
        problems = []
        if r["hOverflow"] > 1:
            problems.append(f'{r["hOverflow"]}px horizontal overflow')
        if r["skipLinks"] > 1:
            problems.append(f'{r["skipLinks"]}x skip link')
        if r["mainContent"] > 1:
            problems.append(f'{r["mainContent"]}x #main-content')
        if r["mainContent"] == 0:
            problems.append("no #main-content landmark (skip link target missing)")
        # The skip target must lead somewhere real, or the link is decorative.
        if r["mainContent"] == 1 and r["mainText"] == 0:
            problems.append("#main-content is empty")
        status = "FAIL" if problems else "ok"
        print(f'  {status:4} {route:16} overflow={r["hOverflow"]}px '
              f'skip={r["skipLinks"]} main={r["mainContent"]} text={r["mainText"]}')
        if problems:
            bad.append((route, problems))
    b.close()

print()
if bad:
    for route, problems in bad:
        print(f"FAIL {route}: {', '.join(problems)}")
    sys.exit(1)
print("PASS: no horizontal overflow, one skip link, one populated main landmark.")
