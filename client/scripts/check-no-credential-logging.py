#!/usr/bin/env python3
"""Fail the build if a credential-bearing value is written to a log sink.

Bearer tokens and auth request/response bodies are credentials. A log line is a
durable copy: it lands in log files, crash captures, support bundles and CI
output. This check exists because `console.error('AuthMiddleware - Header:',
authHeader)` shipped in middleware used by every protected route, and a legacy
entry point serialised whole auth bodies and responses.

The precision rule that makes this usable
----------------------------------------
String literals are removed from each line BEFORE matching. Without that step the
check fires on `logger.warn('Password changed, closing old instance...')` - the
word is in a message, not a value - and produced 23 findings on a clean tree.
A credential is only a finding when the identifier appears as an ARGUMENT, i.e.
outside any string. So:

    console.error('AuthMiddleware - Header:', authHeader)   -> FAIL  (bare arg)
    logger.warn('Password changed, closing old instance')   -> pass  (in a string)
    logger.debug('token present:', Boolean(authHeader))     -> pass  (safe guard)

Other design notes:
  * Scans SOURCE only. `docs/archive/` records history and `dist/` is generated,
    so both are excluded - but NOT all of `docs/`, which would be a blind zone
    (the gitleaks allowlist already made that mistake).
  * `git ls-files -c -o` includes UNTRACKED files: a brand-new file is exactly
    how the earlier credential leak reached the repo.
  * Exit code is the pass/fail signal (0 = clean), verified by check-exit-codes.py
    and proven to bite by planting the original bug back in.
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]

# Identifiers that hold a credential. Only counted when they appear as an
# argument (outside a string literal) to a log sink.
CREDENTIAL_NAMES = [
    "authHeader",
    "authorizationHeader",
    "bearerToken",
    "accessToken",
    "refreshToken",
    "idToken",
    r"req\.body",
    r"request\.body",
    r"req\.headers\.authorization",
    "password",
    "otp",
    "secret",
    "token",
]

# `sink(, <credential>)` or `sink(<credential>)` - a bare identifier argument.
BARE_ARG = re.compile(
    r"(?:,|\()\s*(?:" + "|".join(CREDENTIAL_NAMES) + r")\s*(?:,|\)|:|$)",
    re.IGNORECASE,
)

# Serialising a whole request body into a log line.
SERIALISE_BODY = re.compile(
    r"JSON\.stringify\s*\(\s*(?:req\.body|request\.body|\bbody\b|\bobj\b|response)\s*\)",
    re.IGNORECASE,
)

SINK = re.compile(
    r"(?:console\.(?:log|error|warn|info|debug)"
    r"|logger\.(?:debug|info|warn|error|log)"
    r"|\bprint\s*\(|\bfmt\.Print(?:ln|f)?)"
)

# Safe despite naming a credential.
SAFE = re.compile(
    r"Boolean\s*\(|!!\s*\w|\.length\b|typeof\b|REDACTED|redacted|masked"
    r"|jwt\.decode\(",
    re.IGNORECASE,
)

# String literals: double, single, backtick (with escapes). Removed pre-match.
STRING_LITERAL = re.compile(
    r'"(?:[^"\\]|\\.)*"' r"|'(?:[^'\\]|\\.)*'" r"|`(?:[^`\\]|\\.)*`"
)

SRC_SUFFIXES = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".go"}
SKIP_DIR_PARTS = {
    "node_modules", "dist", "build", "coverage", ".git", "venv", "__pycache__",
}
SKIP_PATH_PREFIXES = ("docs/archive/", "archive/")


def tracked_files() -> list[Path]:
    out = subprocess.run(
        ["git", "-C", str(REPO), "ls-files", "-c", "-o", "--exclude-standard"],
        capture_output=True, text=True, check=True,
    ).stdout.split("\n")
    self_path = Path(__file__).resolve()
    files = []
    for rel in out:
        rel = rel.strip()
        if not rel or Path(rel).suffix not in SRC_SUFFIXES:
            continue
        if any(part in SKIP_DIR_PARTS for part in Path(rel).parts):
            continue
        if rel.startswith(SKIP_PATH_PREFIXES):
            continue
        path = REPO / rel
        # This file's own docstring quotes the bad pattern to explain it, so it
        # would always flag itself. Excluding one file is a smaller blind spot
        # than making the pattern cleverer.
        if path.resolve() == self_path:
            continue
        files.append(path)
    return files


def scan() -> list[str]:
    findings: list[str] = []
    for path in tracked_files():
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        rel = path.relative_to(REPO)
        for n, line in enumerate(text.splitlines(), 1):
            if not line.strip() or line.lstrip().startswith(("//", "*", "#")):
                continue
            # Strip strings first: a credential named inside a message is text,
            # not a leaked value. This single step removes all false positives.
            code = STRING_LITERAL.sub("''", line)
            if not SINK.search(code):
                continue
            if SAFE.search(code):
                continue
            if BARE_ARG.search(code) or SERIALISE_BODY.search(code):
                findings.append(f"{rel}:{n}: {line.strip()[:120]}")
    return findings


def main() -> int:
    findings = scan()
    if findings:
        print("FAIL: credential-bearing value written to a log sink.\n")
        for f in findings:
            print(f"  {f}")
        print(
            "\nLog the fact that a credential was present (Boolean(...)), never its value.\n"
            "Remove auth request/response body logging entirely."
        )
        return 1
    print("PASS: no credential-bearing value is written to a log sink.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
