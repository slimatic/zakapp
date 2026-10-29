#!/usr/bin/env python3
"""Fail if the runtime config the app cannot start without is broken or absent.

WHY THIS EXISTS
    `getApiBaseUrl()` (src/config.ts) reads window.APP_CONFIG and otherwise falls
    back to `http://localhost:3001/api`. On any device that is not the dev
    machine, `localhost` is the device itself, so every API call fails and the
    login screen reports "Unable to reach the server" while the backend is
    perfectly healthy. On an HTTPS page the mixed-content rule blocks it too.

    That is not hypothetical: `client/public/config.js` was ABSENT from the repo.
    The root .gitignore carries a blanket `*.js` rule for build artifacts, and
    `client/public/` is source, so the file that injects APP_CONFIG at runtime
    was silently ignored — exactly the same failure as `push-sw.js` before it
    (#383), which is why that one already has a negation and a guard.

    Three separate things have to hold, and each is cheap to break again:

      1. The file exists.
      2. It is actually COMMITTED, not merely present on one machine. A config
         that exists locally and not in git ships a broken build to everyone
         else, which is the whole `*.js` failure mode.
      3. index.html loads it and getApiBaseUrl() prefers it.

WHAT IT CHECKS
    1. client/public/config.js exists and assigns window.APP_CONFIG.
    2. Its API_BASE_URL is not an absolute localhost URL (the fallback it exists
       to override).
    3. It is not gitignored — `git check-ignore` must return non-zero.
    4. index.html references /config.js.
    5. getApiBaseUrl() reads APP_CONFIG.API_BASE_URL before its fallback,
       bounded to that function's own body so the check cannot pass on its
       neighbour's text.
    6. RECONCILE_ENABLED is present in the tracked source config, defaults
       to 'false' there, and its getter prefers the runtime value before
       the build-time fallback.
    7. Both shipped entrypoint heredocs carry the flag, defaulted off.
    8. The compose file exposes the flag for operators, defaulted off.
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

CLIENT = Path(__file__).resolve().parent.parent
PUBLIC_CONFIG = CLIENT / "public" / "config.js"
INDEX_HTML = CLIENT / "index.html"
CONFIG_TS = CLIENT / "src" / "config.ts"

failures: list[str] = []


def check(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)
    print(f"  {'ok  ' if condition else 'FAIL'}  {message}")


def main() -> int:
    print("check-runtime-config:")

    # 1. Exists and assigns APP_CONFIG.
    if not PUBLIC_CONFIG.is_file():
        check(False, "client/public/config.js exists")
    else:
        check(True, "client/public/config.js exists")
        src = PUBLIC_CONFIG.read_text()

        check(
            "APP_CONFIG" in src,
            "config.js assigns window.APP_CONFIG",
        )

        # 2. Not an absolute localhost URL.
        m = re.search(r"API_BASE_URL\s*:\s*['\"]([^'\"]+)['\"]", src)
        if not m:
            check(False, "config.js defines API_BASE_URL")
        else:
            url = m.group(1)
            check(not url.startswith("http://localhost"),
                  f"API_BASE_URL is not a localhost URL ({url!r})")

    # 3. Committed — a file present locally but untracked reproduces the bug for
    #    every other clone. Order matters in .gitignore: the negation must come
    #    after the `*.js` rule it overrides.
    #
    #    NOTE on `git check-ignore`: plain `check-ignore` exits 0 when the path IS
    #    ignored and 1 when it is not — that is the question we are asking, so the
    #    exit code is the answer. Do NOT add `-v`: with a verbosity flag git prints
    #    the LAST matching pattern even when that pattern is a NEGATION, and exits
    #    0, so a correctly un-ignored file reads as ignored. Verified both ways.
    r = subprocess.run(
        ["git", "check-ignore", str(PUBLIC_CONFIG)],
        cwd=CLIENT, capture_output=True, text=True,
    )
    check(r.returncode != 0,
          f"config.js is not gitignored{f' (matched: {r.stdout.strip()})' if r.stdout.strip() else ''}")

    # 4. index.html loads it.
    if INDEX_HTML.is_file():
        check("config.js" in INDEX_HTML.read_text(),
              "index.html loads /config.js")
    else:
        check(False, "index.html found")

    # 5. The resolver prefers it. The body is bounded to the function's own
    #    lines: an unbounded window reads the NEXT getter after it and both
    #    substrings pass vacuously - measured (the runtime branch deleted ->
    #    still "ok" with a fixed 600-char slice).
    if CONFIG_TS.is_file():
        ts = CONFIG_TS.read_text()
    else:
        ts = ""
        check(False, "src/config.ts found")

    def getter_body(name: str) -> str:
        i = ts.find(f"export const {name}")
        if i == -1:
            return ""
        j = ts.find("\n};", i)
        return ts[i:j + 2] if j != -1 else ts[i:i + 400]

    body = getter_body("getApiBaseUrl")
    check(
        "window.APP_CONFIG?.API_BASE_URL" in body and "VITE_API_BASE_URL" in body,
        "getApiBaseUrl() prefers window.APP_CONFIG.API_BASE_URL",
    )

    # 6. The reconciliation feature flag: present in the tracked source config
    #    and exposed by a getter that prefers the runtime value before its
    #    build-time fallback. A flag absent from config.js reads "undefined"
    #    wherever the feature is wanted, and a getter that ignores the runtime
    #    value makes the flag un-flippable without a rebuild - the same failure
    #    class as checks 4 and 5.
    if PUBLIC_CONFIG.is_file():
        src = PUBLIC_CONFIG.read_text()
        check("RECONCILE_ENABLED" in src,
              "config.js carries RECONCILE_ENABLED (runtime-flag surface)")
        m2 = re.search(r"RECONCILE_ENABLED\s*:\s*['\"]([^'\"]*)['\"]", src)
        check(bool(m2) and m2.group(1) == "false",
              "config.js defaults RECONCILE_ENABLED to 'false'")
    if ts:
        body = getter_body("getReconcileEnabled")
        check(
            "window.APP_CONFIG?.RECONCILE_ENABLED" in body
            and "window.APP_CONFIG.RECONCILE_ENABLED === 'true'" in body
            and "VITE_RECONCILE_ENABLED" in body,
            "getReconcileEnabled() prefers the runtime config, then the env var",
        )

    # 7. The instance flag reaches BOTH shipped entrypoint heredocs, defaulted
    #    off - deleting it from the compose file alone would otherwise leave
    #    every check green while the runtime channel is gone.
    for rel in ("docker/nginx-entrypoint.sh", "docker/frontend-entrypoint.sh"):
        p = CLIENT.parent / rel
        if p.is_file():
            check("${REACT_APP_RECONCILE_ENABLED:-false}" in p.read_text(),
                  f"{rel} carries the flag, default off")
        else:
            check(False, f"{rel} exists (flag channel check)")

    # 8. The compose file documents the flag for operators.
    compose = CLIENT.parent / "docker-compose.yml"
    if compose.is_file():
        c = compose.read_text()
        check("REACT_APP_RECONCILE_ENABLED" in c
              and "${REACT_APP_RECONCILE_ENABLED:-false}" in c,
              "docker-compose.yml exposes the flag, default off")
    else:
        check(False, "docker-compose.yml exists (flag channel check)")

    if failures:
        print(f"\nFAIL: {len(failures)} runtime-config problem(s).")
        return 1
    print("\nPASS: runtime config is present, committed, loaded and preferred.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
