"""Shared login for the check scripts, so this isn't copy-pasted four times.

Two things it fixes:

1. Credentials. The smoke-test account name/password were hardcoded in each
   check script. These scripts are committed to a public repo, so they now read
   ZAK_SMOKE_USER / ZAK_SMOKE_PASS from the environment instead.

2. The login rate limiter. Running the checks back to back trips
   `429 RATE_LIMIT_EXCEEDED` with a `retryAfter` of ~240s. That presents as
   "login is broken" and makes a check script measure the login page instead of
   the app - a green/red result that means nothing. Here we wait it out once.
"""
import os
import time
from playwright.sync_api import sync_playwright
from playwright.sync_api import TimeoutError as PWTimeout

UID = "cmuerqpub000rpb3fulpxby7g"
BASE = "http://localhost:4173"
USER = os.environ.get("ZAK_SMOKE_USER", "v1smoke")


def _secret():
    pw = os.environ.get("ZAK_SMOKE_PASS")
    if not pw:
        raise SystemExit("FAIL: set ZAK_SMOKE_PASS (smoke-test password) before running")
    return pw


def _do_login(pg):
    pg.goto(f"{BASE}/login", wait_until="networkidle")
    pg.wait_for_timeout(1200)
    pg.fill('#username', USER)
    pg.fill('#password', _secret())
    pg.evaluate("document.querySelector('#password').closest('form').requestSubmit()")
    try:
        pg.wait_for_load_state("networkidle", timeout=30000)
    except PWTimeout:
        pass
    for _ in range(30):
        pg.wait_for_timeout(500)
        if pg.evaluate("!!localStorage.getItem('accessToken')"):
            return True
    text = pg.evaluate("() => document.body.innerText.toLowerCase()") or ""
    if "too many" in text:
        return False
    return False


def open_session(browser, viewport, is_mobile=False, has_touch=False, path="/dashboard"):
    """A context whose page is logged in and sitting on `path`.

    Raises if login genuinely fails, rather than returning the login page for
    the caller to measure by mistake.
    """
    ctx = browser.new_context(viewport=viewport, is_mobile=is_mobile, has_touch=has_touch)
    pg = ctx.new_page()
    ok = _do_login(pg)
    if not ok:
        # Likely the rate limiter; it reports retryAfter ~240s. Wait once.
        print("  login did not take - waiting 250s for the rate limiter to clear")
        time.sleep(250)
        ok = _do_login(pg)
    if not ok:
        raise SystemExit(f"FAIL: login failed (check ZAK_SMOKE_PASS, url={pg.url})")
    pg.evaluate(
        f"localStorage.setItem('zakapp_local_prefs_{UID}', JSON.stringify({{skipped:true}}))"
    )
    pg.goto(f"{BASE}{path}", wait_until="networkidle")
    pg.wait_for_timeout(2500)
    if "/login" in pg.url:
        raise SystemExit(f"FAIL: bounced back to /login when opening {path}")
    return ctx, pg
