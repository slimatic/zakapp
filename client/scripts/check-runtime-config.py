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
    5. getApiBaseUrl() reads APP_CONFIG.API_BASE_URL before its fallback.
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

    # 5. The resolver prefers it.
    if CONFIG_TS.is_file():
        ts = CONFIG_TS.read_text()
        i = ts.find("getApiBaseUrl")
        body = ts[i:i + 600] if i != -1 else ""
        check(
            "APP_CONFIG" in body and "API_BASE_URL" in body,
            "getApiBaseUrl() prefers window.APP_CONFIG.API_BASE_URL",
        )
    else:
        check(False, "src/config.ts found")

    if failures:
        print(f"\nFAIL: {len(failures)} runtime-config problem(s).")
        return 1
    print("\nPASS: runtime config is present, committed, loaded and preferred.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
