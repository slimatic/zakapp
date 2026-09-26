"""Give the smoke user a fixture, by driving the app's OWN seeder.

Why not write rows with SQL: the nisab figures are client-side encrypted (AES
with a key the browser holds). A row the client cannot decrypt is worse than no
row — the vault step throws and the route renders "Decrypting vault..." with no
error in the console, which is exactly how this looked when first investigated.
`DataSeeder` writes through the same RxDB path the UI uses, so the ciphertext is
correct by construction.

Closes the second half of #494. The Dashboard guard is already unit-tested both
ways (Dashboard.test.tsx); what was missing was fixture data:

    if (user && user.isSetupCompleted === false && !hasSkipped
        && !hasAssets && !hasActiveRecord) navigate('/onboarding');

`hasAssets` / `hasActiveRecord` are false for v1smoke, so every browser check was
measuring the onboarding page instead of the page it named.

Usage:  ZAK_SMOKE_PASS=... python3 seed-smoke-fixture.py
"""
import os
import sys
import time

from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _login import BASE, open_session  # noqa: E402

VIEWPORT = {"width": 1280, "height": 900}
SEED_LABEL = "Seed a Full Demo Dataset"


def dashboard_renders(pg):
    """The acceptance criterion: /dashboard must NOT bounce to /onboarding."""
    pg.goto(f"{BASE}/dashboard", wait_until="domcontentloaded")
    pg.wait_for_timeout(3000)
    return "/onboarding" not in pg.url and "/login" not in pg.url


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx, pg = open_session(browser, VIEWPORT, path="/seeder")
        print(f"session at {pg.url}")

        pg.wait_for_timeout(2500)  # the seeder page is lazy-loaded
        btn = pg.locator(f"button:has-text('{SEED_LABEL}')")
        if btn.count() == 0:
            body = pg.inner_text("body")[:300].replace("\n", " | ")
            raise SystemExit(f"FAIL: '{SEED_LABEL}' not found on /seeder. body: {body}")

        btn.first.click()
        print(f"clicked: {SEED_LABEL}")

        # Seeding 10 assets, 10 years of nisab history, payments and liabilities
        # is not instant. Poll the acceptance criterion rather than sleep a guess.
        deadline = time.time() + 180
        while time.time() < deadline:
            pg.wait_for_timeout(5000)
            if dashboard_renders(pg):
                print("PASS: /dashboard renders (no redirect to /onboarding)")
                ctx.close()
                browser.close()
                return 0
            print("  not yet — still redirecting, waiting for the seed to land")

        print("FAIL: /dashboard still redirects after 180s; seeding did not take")
        ctx.close()
        browser.close()
        return 1


if __name__ == "__main__":
    sys.exit(main())
