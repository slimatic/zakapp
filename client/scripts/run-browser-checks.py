#!/usr/bin/env python3
"""Run every browser-backed check against a running preview server.

These need the built app served locally, so they are separate from
run-source-checks.py. Each check drives a real browser (Playwright/Chromium) and
fails on measured values - overflow, contrast, touch targets, unstyled elements -
rather than on assertions about intent.

Prerequisites:
    cd client && npm run build
    npx vite preview --port 4173        # or the dev server
    ZAK_SMOKE_USER / ZAK_SMOKE_PASS     # credentials, never committed

Usage:
    python3 scripts/run-browser-checks.py [base_url]
"""
from __future__ import annotations

import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
DEFAULT_BASE = os.environ.get("ZAK_BASE_URL", "http://localhost:4173")

CHECKS = [
    "check-mobile-integrity.py",
    "check-single-shell.py",
    "check-footer.py",
    "check-nisab-rows.py",
    "check-money-alignment.py",
    "check-reduced-motion.py",
    "check-theme-a11y-rtl.py",
]


def server_up(base: str) -> bool:
    try:
        urllib.request.urlopen(base, timeout=5)
        return True
    except (urllib.error.URLError, OSError):
        return False


def main() -> int:
    base = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_BASE
    if not server_up(base):
        # Not a pass: an unrunnable check is UNKNOWN, never green. The audit's
        # point about soft-failing scanners applies here too.
        print(f"FAIL: no preview server at {base} - browser checks NOT RUN.")
        print("  Build and serve first: npm run build && npx vite preview --port 4173")
        return 1

    failed, skipped = [], []
    for name in CHECKS:
        if not (HERE / name).exists():
            skipped.append(name)
            continue
        r = subprocess.run(
            [sys.executable, str(HERE / name), base],
            capture_output=True, text=True, env={**os.environ, "ZAK_BASE_URL": base},
        )
        print(f"  {'ok  ' if r.returncode == 0 else 'FAIL'} {name}")
        if r.returncode != 0:
            failed.append(name)
            print((r.stdout or r.stderr).rstrip()[:800])

    print()
    if skipped:
        print(f"not present, skipped: {', '.join(skipped)}")
    if failed:
        print(f"FAIL: {len(failed)} of {len(CHECKS)} browser checks failed: {', '.join(failed)}")
        return 1
    print(f"PASS: all {len(CHECKS) - len(skipped)} browser checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
