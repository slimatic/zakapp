#!/usr/bin/env python3
"""Run every source-only check. One command, one exit code.

Split from the browser checks on purpose: these read the repository and need no
dev server or Playwright, so they belong in CI on every push. The browser checks
(see run-browser-checks.py) need a built app and a running preview server.

Exit code is the aggregate: 0 only if every check passes. Each check's own exit
code is already proven to be meaningful by check-exit-codes.py.
"""
from __future__ import annotations
import subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CHECKS = [
    "check-dead-classes.py",
    "check-exit-codes.py",
    "check-i18n-keys.py",
    "check-no-alerts.py",
    "check-no-committed-credentials.py",
    "check-no-credential-logging.py",
    "check-payment-vocabulary.py",
    "check-pdf-theme.py",
    "check-runtime-config.py",
    "check-sender-domain-resolves.py",
    "check-snapshot-nisab.py",
]

def main() -> int:
    failed = []
    for name in CHECKS:
        r = subprocess.run([sys.executable, str(HERE / name)], capture_output=True, text=True)
        status = "ok  " if r.returncode == 0 else "FAIL"
        print(f"  {status} {name}")
        if r.returncode != 0:
            failed.append(name)
            print((r.stdout or r.stderr).rstrip()[:600])
    if failed:
        print(f"\nFAIL: {len(failed)} of {len(CHECKS)} source checks failed: {', '.join(failed)}")
        return 1
    print(f"\nPASS: all {len(CHECKS)} source checks passed.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
