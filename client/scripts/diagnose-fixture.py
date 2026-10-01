"""Diagnose why /dashboard still redirects after seeding.

Checks, in order:
  1. did the seed click actually insert into RxDB (browser-local), and
  2. what does the asset repository see when Dashboard asks it.
"""
import sys, os
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _login import BASE, open_session

VP = {"width": 1280, "height": 900}

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx, pg = open_session(b, VP, path="/seeder")
    pg.wait_for_timeout(3000)

    # 1. What does the page show, and what did the seeder report?
    txt = pg.inner_text("body")
    print("=== /seeder page text (first 500) ===")
    print(txt[:500])

    # 2. Counts as shown by the page itself
    print("\n=== any numbers on the page (asset/payment/nisab counters) ===")
    for line in txt.split("\n"):
        if line.strip().isdigit():
            print("  count:", line.strip())

    # 3. Click the full seed and capture console errors
    errs = []
    pg.on("console", lambda m: errs.append(f"{m.type}: {m.text[:160]}") if m.type in ("error", "warning") else None)
    btn = pg.locator("button:has-text('Seed a Full Demo Dataset')")
    print(f"\nseed button count: {btn.count()}")
    if btn.count():
        btn.first.click()
        pg.wait_for_timeout(20000)
    print("\n=== console errors/warnings during seed ===")
    for e in errs[:15]:
        print("  ", e)

    # 4. What do the RxDB collections hold now?
    print("\n=== RxDB collection counts ===")
    out = pg.evaluate("""async () => {
        const res = {};
        try {
            const keys = Object.keys(window).filter(k => /db|rxdb/i.test(k));
            res.globals = keys;
        } catch (e) { res.err = String(e); }
        return res;
    }""")
    print("  window globals mentioning db:", out)

    # 5. The decisive check: does /dashboard redirect, and what does it render?
    pg.goto(f"{BASE}/dashboard", wait_until="networkidle")
    pg.wait_for_timeout(4000)
    print(f"\n=== after seed, /dashboard url = {pg.url}")
    body = pg.inner_text("body")[:300].replace("\n", " | ")
    print("   body:", body)

    ctx.close(); b.close()
