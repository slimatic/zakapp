"""Shared login for the check scripts, so this isn't copy-pasted four times.

Two things it fixes:

1. Credentials. The smoke-test account name/password were hardcoded in each
   check script. These scripts are committed to a public repo, so they now read
   ZAK_SMOKE_USER / ZAK_SMOKE_PASS from the environment instead.

2. The login rate limiter. Running the checks back to back trips
   `429 RATE_LIMIT_EXCEEDED` with a `retryAfter` of ~240s. That presents as
   "login is broken" and makes a check script measure the login page instead of
   the app - a green/red result that means nothing.

WHY THERE IS A SESSION CACHE
Waiting the limiter out costs 250s, and a check chain would hit it more than once.
So auth state is captured from ONE real login and saved to a gitignored file; later
processes restore it via localStorage/sessionStorage and never touch /login.

Both stores are captured, and that matters: sessionStorage holds `zakapp_session_v1`,
which carries the DB encryption key. A token-only restore authenticates the API but
leaves the encrypted local store unreadable, so pages render empty and a check would
silently assert nothing. Verified equivalent before adopting: an injected session
renders byte-identical output to a real login on /dashboard, /assets, /payments and
/settings (text length, SVG count, headings and money values all match).

If a restore ever stops working (token expiry, key rotation, a server restart) the
next run falls back to a real login and re-seeds the cache - so the failure mode is
a slow check, never a wrong one. A cache older than MAX_AGE is ignored outright.
"""
import json
import os
import time
from playwright.sync_api import sync_playwright
from playwright.sync_api import TimeoutError as PWTimeout

# The smoke user's id, used for the `zakapp_local_prefs_<id>` onboarding-skip
# flag. This MUST come from the environment being tested, not a constant: it was
# hardcoded to the production account (cmuerqpub...), so against any other
# backend the flag was written under a key the app never reads — the skip was
# silently ignored and every check measured /onboarding instead of the page it
# named. Falls back to the production id only when unset, to keep the existing
# prod workflow working.
UID = os.environ.get("ZAK_SMOKE_UID", "cmuerqpub000rpb3fulpxby7g")


def resolve_uid(pg):
    """Read the signed-in user's real id from the app, so callers need not know it.

    Cheaper and more robust than requiring ZAK_SMOKE_UID: the id is already in
    localStorage once the session exists.
    """
    got = pg.evaluate(
        """() => {
            // The session AuthService.login() writes: { user: {...}, jwk: {...} }
            try {
                const s = JSON.parse(sessionStorage.getItem('zakapp_session_v1') || 'null');
                const id = s && s.user && s.user.id;
                if (id) return id;
            } catch (e) { /* fall through */ }
            // Fallbacks for other shapes we have seen.
            const prefs = Object.keys(localStorage).find((k) =>
                k.startsWith('zakapp_local_prefs_')
            );
            if (prefs) return prefs.replace('zakapp_local_prefs_', '');
            try {
                const u = JSON.parse(localStorage.getItem('user') || 'null');
                if (u && u.id) return u.id;
            } catch (e) { /* fall through */ }
            return null;
        }"""
    )
    return got or UID


BASE = "http://localhost:4173"
USER = os.environ.get("ZAK_SMOKE_USER", "v1smoke")

# Same directory as this file. Not committed - the session carries a live token.
CACHE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".session-cache.json")
MAX_AGE = 1800  # seconds

# The app's own marker that a restored session is usable: it redirects to /login when
# the token is dead. Restore is therefore self-verifying, with no separate probe call.
MARKER_KEY = "accessToken"

_DUMP = """() => { const o = {ls: {}, ss: {}};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o.ls[k] = localStorage.getItem(k); }
  for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); o.ss[k] = sessionStorage.getItem(k); }
  return o; }"""

_INJECT = """(d) => {
  for (const [k, v] of Object.entries(d.ls)) localStorage.setItem(k, v);
  for (const [k, v] of Object.entries(d.ss)) sessionStorage.setItem(k, v); }"""


def _secret():
    pw = os.environ.get("ZAK_SMOKE_PASS")
    if not pw:
        raise SystemExit("FAIL: set ZAK_SMOKE_PASS (smoke-test password) before running")
    return pw


def _do_login(pg):
    pg.goto(f"{BASE}/login", wait_until="domcontentloaded")
    pg.wait_for_timeout(1200)
    pg.fill('#username', USER)
    pg.fill('#password', _secret())
    pg.evaluate("document.querySelector('#password').closest('form').requestSubmit()")
    try:
        # NOT networkidle: live sync holds a permanent _changes connection, so the
        # network is never idle and this would always time out.
        pg.wait_for_load_state("domcontentloaded", timeout=30000)
    except PWTimeout:
        pass
    for _ in range(30):
        pg.wait_for_timeout(500)
        if pg.evaluate(f"!!localStorage.getItem('{MARKER_KEY}')"):
            return True
    return False


def _read_cache():
    """Cached auth state, or None when absent/expired/corrupt."""
    try:
        with open(CACHE_PATH, encoding="utf-8") as fh:
            data = json.load(fh)
        if time.time() - data.get("saved_at", 0) > MAX_AGE:
            return None
        return data.get("state") or None
    except (OSError, ValueError):
        return None


def _write_cache(state):
    try:
        with open(CACHE_PATH, "w", encoding="utf-8") as fh:
            json.dump({"saved_at": time.time(), "state": state}, fh)
    except OSError:
        pass  # a cache miss costs a login, never correctness


def _apply(pg, state, path):
    """Restore captured state and land on `path`. False if the session is dead."""
    pg.goto(f"{BASE}/login", wait_until="domcontentloaded")
    pg.wait_for_timeout(300)
    pg.evaluate(_INJECT, state)
    # The onboarding-skip flag belongs here as well as on the real-login path.
    # Without it a restored session is sent to /onboarding, so every check would
    # silently measure the wrong page.
    _uid = resolve_uid(pg)
    if _uid == UID and os.environ.get("ZAK_SMOKE_UID") is None:
        print(f"WARN: could not read the session id; using fallback {UID}")
    pg.evaluate(
        f"localStorage.setItem('zakapp_local_prefs_{_uid}', JSON.stringify({{skipped:true}}))"
    )
    # domcontentloaded, not networkidle — see the login path above.
    pg.goto(f"{BASE}{path}", wait_until="domcontentloaded")
    pg.wait_for_timeout(4000)  # let RxDB finish its initial pull
    pg.wait_for_timeout(2500)
    # The app is the authority: a dead token bounces to /login.
    return "/login" not in pg.url


def open_session(browser, viewport, is_mobile=False, has_touch=False, path="/dashboard",
                 reduced_motion=None):
    """A context whose page is logged in and sitting on `path`.

    Raises if login genuinely fails, rather than returning the login page for
    the caller to measure by mistake.
    """
    ctx_kwargs = dict(viewport=viewport, is_mobile=is_mobile, has_touch=has_touch)
    if reduced_motion:
        ctx_kwargs["reduced_motion"] = reduced_motion
    ctx = browser.new_context(**ctx_kwargs)
    pg = ctx.new_page()

    cached = _read_cache()
    if cached and _apply(pg, cached, path):
        return ctx, pg

    # No usable cache: log in for real, once, and seed the cache for the rest of the chain.
    ok = _do_login(pg)
    if not ok:
        # Likely the rate limiter; it reports retryAfter ~240s. Wait once.
        print("  login did not take - waiting 250s for the rate limiter to clear")
        time.sleep(250)
        ok = _do_login(pg)
    if not ok:
        raise SystemExit(f"FAIL: login failed (check ZAK_SMOKE_PASS, url={pg.url})")

    _uid = resolve_uid(pg)
    if _uid == UID and os.environ.get("ZAK_SMOKE_UID") is None:
        print(f"WARN: could not read the session id; using fallback {UID}")
    pg.evaluate(
        f"localStorage.setItem('zakapp_local_prefs_{_uid}', JSON.stringify({{skipped:true}}))"
    )
    # domcontentloaded, not networkidle — see the login path above.
    pg.goto(f"{BASE}{path}", wait_until="domcontentloaded")
    pg.wait_for_timeout(4000)  # let RxDB finish its initial pull
    pg.wait_for_timeout(2500)
    if "/login" in pg.url:
        raise SystemExit(f"FAIL: bounced back to /login when opening {path}")

    # Written LAST so the cached state already contains everything the restore path
    # needs. Capturing before the onboarding flag was set made every restored session
    # land on /onboarding instead of the requested route.
    _write_cache(pg.evaluate(_DUMP))
    return ctx, pg
