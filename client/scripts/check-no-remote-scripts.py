#!/usr/bin/env python3
"""Fail if a page copied verbatim from public/ loads a script from another origin.

WHY THIS EXISTS
    `client/public/` is copied into the build untouched, so no bundler or linter
    ever looks at what those pages load. `public/donate.html` loaded Tailwind
    from `https://cdn.tailwindcss.com`; the production CSP allows scripts only
    from self and the Cloudflare beacon, so the browser refused it and the
    donation page rendered with no styling for months (#813). A same-origin
    stylesheet fixed the page; this check keeps the class from returning.

WHAT IT CHECKS
    No HTML file under client/public/ and no client/index.html may contain a
    <script> whose src is an absolute http(s) URL. Inline scripts are allowed:
    the CSP permits them and index.html relies on one.

Usage: python3 scripts/check-no-remote-scripts.py [file ...]
"""
from __future__ import annotations
import re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SCRIPT_SRC = re.compile(r"<script\b[^>]*\bsrc\s*=\s*[\"\x27](https?://[^\"\x27]+)", re.I)


def default_targets() -> list[Path]:
    return sorted((ROOT / "public").rglob("*.html")) + [ROOT / "index.html"]


def main() -> int:
    targets = [Path(a) for a in sys.argv[1:]] or default_targets()
    findings = []
    for path in targets:
        if not path.is_file():
            continue
        for n, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            m = SCRIPT_SRC.search(line)
            if m:
                findings.append(f"{path.relative_to(ROOT) if path.is_relative_to(ROOT) else path}:{n}: {m.group(1)}")
    if findings:
        print("FAIL remote script tags in pages served as-is:")
        for f in findings:
            print("  " + f)
        print("  Serve the script from this origin, or add a compiled stylesheet.")
        return 1
    print(f"no remote script tags in {len([t for t in targets if t.is_file()])} page(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
