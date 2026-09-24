"""Does the mobile check context actually match the app's (pointer: coarse) rule?

accessibility.css has had a `@media (pointer: coarse) { a, button, ... { min-width:
44px; min-height: 44px } }` block all along. If the Playwright context does not
report a coarse pointer, that rule never applies during the audit, every target
measures its natural size, and the "undersized target" findings are false
positives - a check testing a device the app is not styling for.
"""
import sys
sys.path.insert(0, "/home/chuwi_agent/zakapp/client/scripts")
from playwright.sync_api import sync_playwright

PROBE = 'matchMedia("(pointer: coarse)").matches'
PROBE2 = 'matchMedia("(any-pointer: coarse)").matches'

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    for tag, kw in [
        ("is_mobile=True          ", dict(is_mobile=True)),
        ("is_mobile+has_touch     ", dict(is_mobile=True, has_touch=True)),
        ("has_touch only          ", dict(has_touch=True)),
        ("plain desktop ctx       ", dict()),
    ]:
        ctx = b.new_context(viewport={"width": 390, "height": 844}, **kw)
        pg = ctx.new_page()
        pg.goto("http://localhost:4173/login", wait_until="domcontentloaded")
        pg.wait_for_timeout(600)
        coarse = pg.evaluate(PROBE)
        anycoarse = pg.evaluate(PROBE2)
        # measure a real button under each
        pg.fill('#username', 'x')
        pg.fill('#password', 'y')
        btn = pg.evaluate("""() => {
          const b = document.querySelector('button[type=submit]');
          if (!b) return null;
          const r = b.getBoundingClientRect();
          return {w: Math.round(r.width), h: Math.round(r.height)};
        }""")
        print(f"{tag} pointer:coarse={str(coarse):5} any-pointer:coarse={str(anycoarse):5} "
              f"submit button={btn}")
        ctx.close()
    b.close()
