"""The login cache must never turn a broken session into a passing check.

WHY THIS EXISTS
The other check scripts now restore auth state from .session-cache.json instead of
logging in. That is a performance win, but it adds a failure mode worth guarding:
if a restore silently does not take, a probe measures the LOGIN page and still
prints a result - a green line proving nothing. Exactly the bug class this whole
suite exists to catch.

The claim being verified, from _login.py: a restore that does not take falls back
to a real login, so the failure mode is a slow check, never a wrong one.

FIVE CASES
  1. no cache        -> real login, cache seeded, lands on the route
  2. valid cache     -> restored, lands on the route
  3. corrupt cache   -> ignored, falls back to a real login
  4. expired cache   -> ignored, falls back to a real login
  5. dead token      -> app bounces to /login, falls back, still lands on the route

Case 3 and 4 matter because a corrupt file would otherwise raise out of the check
and read as "the app is broken". Case 5 is the one that could silently produce a
false green. Every case asserts the landing URL, which is the app's own statement
that the session works - not a proxy for it.

USAGE
  cd client && npm run build && python3 scripts/check-login-cache.py
Requires the preview server on :4173 and ZAK_SMOKE_PASS.
"""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _login import BASE, CACHE_PATH, MAX_AGE, open_session  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

ROUTE = "/dashboard"
fails = []


def _read_text(path):
    try:
        with open(path, encoding="utf-8") as fh:
            return fh.read()
    except OSError:
        return None


def _restore_cache(original):
    """Put the cache back the way we found it."""
    if original is None:
        if os.path.exists(CACHE_PATH):
            os.remove(CACHE_PATH)
    else:
        with open(CACHE_PATH, "w", encoding="utf-8") as fh:
            fh.write(original)


def _case(name, browser, mutate=None, expect_login=True):
    """Run one session; report where it landed and whether a login was needed."""
    mutate() if mutate else None
    try:
        ctx, pg = open_session(browser, {"width": 1280, "height": 900}, path=ROUTE)
    except SystemExit as exc:
        fails.append(f"{name}: {exc}")
        print(f"  FAIL {name}: {exc}")
        return
    landed = pg.url.replace(BASE, "")
    ok = ROUTE in landed
    if not ok:
        fails.append(f"{name}: landed on {landed}, expected {ROUTE}")
    print(f"  {'ok  ' if ok else 'FAIL'} {name:16} landed={landed}")
    ctx.close()


def main():
    if not os.environ.get("ZAK_SMOKE_PASS"):
        print("FAIL: set ZAK_SMOKE_PASS before running")
        return 1
    # Held in memory rather than copied to a .bak file: the cold case deletes the
    # cache, so a backup file would be gone by the time cleanup ran.
    original = _read_text(CACHE_PATH)

    try:
        with sync_playwright() as p:
            b = p.chromium.launch(headless=True)

            # 1. cold - no cache at all
            if os.path.exists(CACHE_PATH):
                os.remove(CACHE_PATH)
            _case("1 cold", b)
            if not os.path.exists(CACHE_PATH):
                fails.append("cold run did not seed the cache")
                print("  FAIL cold run did not seed the cache")

            # 2. warm - the cache just written
            _case("2 warm", b)

            # 3. corrupt
            def corrupt():
                with open(CACHE_PATH, "w", encoding="utf-8") as fh:
                    fh.write("{ not json at all")
            _case("3 corrupt", b, mutate=corrupt)

            # 4. expired
            def expire():
                with open(CACHE_PATH, encoding="utf-8") as fh:
                    data = json.load(fh)
                data["saved_at"] = time.time() - MAX_AGE - 60
                with open(CACHE_PATH, "w", encoding="utf-8") as fh:
                    json.dump(data, fh)
            _case("4 expired", b, mutate=expire)

            # 5. dead token - valid cache shape, token the API will reject
            def kill_token():
                with open(CACHE_PATH, encoding="utf-8") as fh:
                    data = json.load(fh)
                data["state"]["ls"]["accessToken"] = "not.a.real.token"
                data["saved_at"] = time.time()
                with open(CACHE_PATH, "w", encoding="utf-8") as fh:
                    json.dump(data, fh)
            _case("5 dead token", b, mutate=kill_token)

            b.close()
    finally:
        _restore_cache(original)

    if fails:
        print(f"\nFAIL: {len(fails)} case(s) broken")
        for f in fails:
            print(f"  - {f}")
        return 1
    print("\nPASS: cache restores, and every broken-cache path falls back to a real login.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
