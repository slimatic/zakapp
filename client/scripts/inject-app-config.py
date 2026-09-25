#!/usr/bin/env python3
"""Re-inject window.APP_CONFIG into the built index.html.

WHY THIS EXISTS
    `vite build` rewrites dist/index.html from a template that has no APP_CONFIG,
    so every rebuild silently deletes it. The client then falls back to
    VITE_API_BASE_URL or http://localhost:3001/api instead of the value the
    deployment expects, and the symptom is a login that just fails - with no
    build error and nothing obviously wrong in the bundle.

    This happened: a rebuild during v1.0 work wiped APP_CONFIG and broke login on
    the local preview. The dev server had been relying on a manual paste.

    Run it after every `vite build` (or use `npm run build:local`, which does both).

Usage:
    python3 scripts/inject-app-config.py [--api URL] [--couchdb URL]
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
INDEX = HERE.parent / "dist" / "index.html"

MARKER = "window.APP_CONFIG"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--api", default="/api", help="API_BASE_URL (default: /api, proxied)")
    ap.add_argument("--couchdb", default="/couchdb", help="COUCHDB_URL")
    args = ap.parse_args()

    if not INDEX.exists():
        print(f"FAIL: {INDEX} not found - run `npm run build` first.")
        return 1

    html = INDEX.read_text(encoding="utf-8")

    if MARKER in html:
        # Already present: leave it alone rather than stacking a second block.
        print("PASS: APP_CONFIG already present in dist/index.html.")
        return 0

    config = (
        "<script>\n"
        "    window.APP_CONFIG = {\n"
        f"      API_BASE_URL: '{args.api}',\n"
        f"      COUCHDB_URL: '{args.couchdb}'\n"
        "    };\n"
        "  </script>\n  "
    )

    # Must run BEFORE the module bundle, so inject just ahead of the first script.
    idx = html.find("<script")
    if idx == -1:
        print("FAIL: no <script> tag in dist/index.html to inject ahead of.")
        return 1

    INDEX.write_text(html[:idx] + config + html[idx:], encoding="utf-8")
    print(f"PASS: injected APP_CONFIG (API_BASE_URL={args.api}) into dist/index.html.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
