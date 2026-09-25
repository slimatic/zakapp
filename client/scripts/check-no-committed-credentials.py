#!/usr/bin/env python3
"""Fail if a credential literal is committed into the source tree.

WHY THIS EXISTS
    A real password ('V1Smoke2026!') sat in three smoke-test scripts and reached the public
    remote. Neither the repo's `Secret Detection Scan` (GitGuardian) nor a full-history
    `gitleaks detect` flagged it: both match PROVIDER KEY FORMATS (AWS AKIA..., GitHub
    ghp_..., PEM blocks) and a password typed into `pg.fill('#password', '...')` matches no
    such format. The pattern is the point - credential-shaped VARIABLE NAMES with a literal
    VALUE - so it is matched here on shape rather than on any provider's format.

WHAT IT ALLOWS
    Reading from the environment is the correct form and is never flagged:
        os.environ.get("ZAK_SMOKE_PASS"), process.env.SMOKE_PASS, _secret()
    Values that are obviously placeholders are ignored, so fixtures stay writable:
        'not.a.real.token', 'changeme', 'example', 'xxxxxxxx', '<your-key>'

SCOPE / CEILING
    Scans the WORKING TREE (git-tracked files), which is what a CI checkout has and what a
    pre-push run sees - it would have stopped this leak at push time. It deliberately does
    not walk history: that needs a full clone and ~seconds per thousand commits.
    ponytail: tree-only. Add `git log -p` scanning only if a credential ever lands that the
    tree check somehow missed.

Exit 0 = clean, 1 = at least one credential literal found.
"""

import os
import re
import subprocess
import sys

# Credential-shaped NAME followed by a literal VALUE. The name list is deliberately broad;
# the placeholder allowlist below is what keeps false positives out.
PATTERN = re.compile(
    r"""(?ix)
    (?:password|passwd|pwd|secret|api[_-]?key|apikey|access[_-]?token|auth[_-]?token)
    # An optional type annotation sits between name and value: TS `const apiKey: string = "x"`,
    # Python `API_KEY: str = "x"`. Without this the annotated form slips through.
    (?:\s*:\s*[A-Za-z_][A-Za-z0-9_<>\[\]|.\ ]*)?
    \s*[:=]\s*
    (['"])(?![^'"]*\$\{)([^'"]{4,})\1
    """
)

# A password being typed into a field is the exact shape that leaked. Match the sink even
# when the variable name gives nothing away: fill('#password', 'something-literal')
# NOT compiled with (?x): the '#' in '#password' would be read as a comment and silently
# truncate the pattern (that is an unterminated-subpattern crash, not a subtle miss).
SINK = re.compile(
    r"""\.(?:fill|type|send_keys)\(\s*(['"])\#?(?:password|passwd)\1\s*,\s*(['"])([^'"]{4,})\2""",
    re.IGNORECASE,
)

# Substrings that mark a value as a placeholder rather than a credential.
ALLOW = (
    "process.env", "os.environ", "getenv", "_secret(", "${", "{{",
    "not.a.real", "example", "placeholder", "changeme", "change-me", "dummy",
    "redacted", "your-", "xxxx", "****", "<", ">", "password", "passwd", "test-",
    "fake", "sample", "todo",
)

# Exact values that are conventional TEST FIXTURES, matched in full rather than as
# substrings. `e2e/auth.spec.ts` registers a throwaway account (timestamped email,
# localhost) whose password must satisfy the app's complexity rule, so it cannot be
# 'xxx'. Matching these exactly keeps a real password that merely CONTAINS 'test'
# (e.g. 'latestthing2026') fully detectable, which a 'test' substring rule would not.
# Ceiling: if production ever used one of these literal values, this would not catch it -
# a distinct failure from the one this guard exists for.
FIXTURE_VALUES = frozenset({
    "testpass123!",
    "password123!",
    "test1234!",
    "changeme123",
})

CODE_EXT = (".py", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".sh", ".yml", ".yaml",
            ".json", ".env", ".tf", ".toml", ".cfg", ".ini")


def is_allowed(value: str) -> bool:
    low = value.lower()
    if low in FIXTURE_VALUES:
        return True
    return any(a in low for a in ALLOW)


def tracked_files():
    # -c cached (tracked) + -o others (new, not yet added) + --exclude-standard honours
    # .gitignore. Using `git ls-files` alone would MISS a brand-new file - which is exactly
    # how the original leak arrived, a fresh script committed with the password inside it.
    out = subprocess.run(
        ["git", "ls-files", "-co", "--exclude-standard"],
        capture_output=True, text=True, check=True,
    )
    for rel in out.stdout.splitlines():
        if not rel.endswith(CODE_EXT):
            continue
        if any(part in rel for part in ("node_modules/", "dist/", "build/", ".git/")):
            continue
        if os.path.isfile(rel):
            yield rel


def findings():
    found = []
    for rel in tracked_files():
        try:
            with open(rel, encoding="utf-8", errors="replace") as fh:
                for n, line in enumerate(fh, 1):
                    stripped = line.lstrip()
                    # A comment describing a credential is not a credential.
                    if stripped.startswith(("#", "//", "*", "/*")):
                        continue
                    for rx, grp in ((PATTERN, 2), (SINK, 3)):
                        m = rx.search(line)
                        if not m:
                            continue
                        value = m.group(grp)
                        # Judge ONLY the captured value. Testing the whole line would match
                        # the word 'password' in the field selector and suppress every hit -
                        # a guard that can never fire.
                        if is_allowed(value):
                            continue
                        found.append((rel, n, line.strip()[:100]))
        except OSError:
            # Unreadable file (permissions, race with a rename): skip rather than crash the
            # whole check. git ls-files already filtered to tracked, existing paths.
            continue
    return found


def main() -> int:
    hits = findings()
    if hits:
        print(f"FAIL: {len(hits)} credential literal(s) committed")
        for rel, n, text in hits:
            print(f"  {rel}:{n}: {text}")
        print("\n  Read credentials from the environment instead (see client/scripts/_login.py).")
        return 1
    print("PASS: no credential literals in tracked source; credentials come from the environment.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
