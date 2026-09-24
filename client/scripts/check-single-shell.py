"""Assert each page renders exactly ONE app shell (sidebar + top bar + footer).

The defect: /diagnostics and /seeder were wrapped in <Layout> by App.tsx AND
again inside the page component, so they rendered a second sidebar, a second top
bar and a doubled footer nested inside the real shell - visible as a duplicated
topbar mid-page and two footers.

Counting shells catches this class of bug for every route at once, instead of
eyeballing screenshots for the two pages someone happened to open.
"""
import sys
from playwright.sync_api import sync_playwright

UID = "cmuerqpub000rpb3fulpxby7g"
BASE = "http://localhost:4173"

ROUTES = [
    "/dashboard", "/assets", "/liabilities", "/nisab-records", "/payments",
    "/analytics", "/calculator", "/settings", "/learn", "/diagnostics", "/seeder",
]

# A shell is recognisable by its chrome. Count navigations, headers and footers.
COUNT = """() => ({
  navs: document.querySelectorAll('nav').length,
  headers: document.querySelectorAll('header, [role="banner"]').length,
  footers: document.querySelectorAll('footer, [role="contentinfo"]').length,
  sidebars: document.querySelectorAll('aside').length,
  copyright: (document.body.innerText.match(/All rights reserved/g) || []).length,
})"""

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context(viewport={"width": 1280, "height": 900})
    pg = ctx.new_page()
    pg.goto(f"{BASE}/login", wait_until="networkidle")
    pg.wait_for_timeout(1200)
    pg.fill('#username', 'v1smoke')
    pg.fill('#password', 'V1Smoke2026!')
    pg.press('#password', 'Enter')
    pg.wait_for_url("**/onboarding", timeout=25000)
    pg.evaluate(
        f"localStorage.setItem('zakapp_local_prefs_{UID}', JSON.stringify({{skipped:true}}))"
    )

    bad = []
    for route in ROUTES:
        pg.goto(f"{BASE}{route}", wait_until="networkidle")
        pg.wait_for_timeout(2500)
        c = pg.evaluate(COUNT)
        # One shell. The reliable signature of a nested shell is duplicated
        # CHROME - a second header, footer, or copyright line. Counting `nav`
        # alone is not enough: pages legitimately add their own tab navs
        # (Knowledge Hub's FAQs/Guides/Glossary, Settings' section nav), so a
        # higher nav count is normal and must not fail this check.
        problems = []
        if c["copyright"] > 1:
            problems.append(f'{c["copyright"]}x "All rights reserved"')
        if c["headers"] > 1:
            problems.append(f'{c["headers"]}x header')
        if c["footers"] > 1:
            problems.append(f'{c["footers"]}x footer')
        status = "FAIL" if problems else "ok"
        print(f"  {status:4} {route:16} nav={c['navs']} header={c['headers']} "
              f"footer={c['footers']} aside={c['sidebars']} copyright={c['copyright']}")
        if problems:
            bad.append((route, problems))
    b.close()

print()
if bad:
    for route, problems in bad:
        print(f"FAIL {route}: {', '.join(problems)}")
    sys.exit(1)
print("PASS: every route renders a single app shell.")
