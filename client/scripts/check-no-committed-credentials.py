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
    "redacted", "your-", "your_", "xxxx", "****", "<", ">", "password", "passwd", "test-",
    "fake", "sample", "todo",
    # ALL-CAPS placeholder idiom in setup guides: YOUR_SUPER_SECRET_CHANGE_THIS
    "change_this", "replace_me", "changeme", "insert_your", "add_your",
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

# Exact (path, value) pairs that are known test fixtures.
#
# WHY A REGISTRY AND NOT A DIRECTORY RULE
#   "Skip everything under tests/" is a broad bypass, and the leak this guard
#   exists for WAS a fresh script - the shape a directory rule would blind us to.
#   Each entry names ONE file and ONE exact value, so:
#     * any different value in the same file still FAILS (a live password pasted
#       into a test file is caught),
#     * the registry is auditable - every entry is a decision someone made.
#   Values are compared lowercased.
FIXTURES = frozenset({
    ("cli/tests/setup-keys.test.ts", "existing-jwt-secret"),
    ("server/src/__tests__/integration/assets.api.test.ts", "testpass123$"),
    ("server/src/__tests__/integration/assets.eligibility.test.ts", "testpass123$"),
    ("server/test/setupEnv.ts", "supersecret"),
    ("server/test/setupEnv.ts", "supersecret-refresh"),
    ("server/tests/integration/passwordReset.test.ts", "newstrong456!"),
    ("server/tests/integration/passwordReset.test.ts", "oldpass123!"),
    ("server/tests/integration/passwordReset.test.ts", "whatever123!"),
    ("server/tests/integration/passwordReset.test.ts", "whatever19!"),
    ("server/tests/integration/passwordReset.test.ts", "reuseblock1!"),
    ("server/tests/integration/passwordReset.test.ts", "anotherpass78!"),
    ("server/tests/integration/passwordReset.test.ts", "weak"),
    ("server/tests/integration/userControllerHonesty.test.ts", "honesty!test123"),
    ("server/tests/unit/encryptionContract.test.ts", "sensitive balance 98765"),
    ("server/tests/unit/encryptionContract.test.ts", "super-secret-value-98765"),
    ("server/tests/unit/encryptionContract.test.ts", "leak-check-abcdef"),
})


def is_reference(value: str, after: str) -> bool:
    """True when the literal is not a secret at all, but a reference or a prefix.

    Two shapes, both of which are CORRECT code that a naive name-match flags:

    shell expansion   JWT_SECRET="$JWT_SECRET"     - refers to an existing shell
                                                     variable; the secret itself
                                                     was generated elsewhere
                                                     (`openssl rand -base64 32`).
    concatenation     authToken = 'Bearer ' + mint()  - the literal is a scheme
                                                     prefix, the credential is on
                                                     the right of the '+'.
    """
    if "$" in value or value.startswith("$"):
        return True
    # `after` is the remainder of the line after the closing quote.
    return after.lstrip().startswith("+")

CODE_EXT = (".py", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".sh", ".yml", ".yaml",
            ".json", ".env", ".tf", ".toml", ".cfg", ".ini",
            # Markdown is scanned because the gitleaks allowlist excludes ALL .md and
            # ALL of docs/, which is a blind zone: setup guides are exactly where
            # someone pastes a real value while "just showing an example".
            ".md", ".mdx")

# History, not guidance. docs/archive/ intentionally preserves old instructions,
# including a fixture password from a superseded test plan. Excluding the archive
# is a narrow exemption, unlike gitleaks' `docs/` catch-all.
SKIP_PATHS = ("docs/archive/", "archive/", "CHANGELOG.md")


def is_allowed(value: str, rel: str = "", after: str = "") -> bool:
    low = value.lower()
    if low in FIXTURE_VALUES:
        return True
    if (rel, low) in FIXTURES:
        return True
    if is_reference(value, after):
        return True
    return any(a in low for a in ALLOW)


def repo_root() -> str:
    """Absolute path to the work-tree root.

    REQUIRED for correctness, not tidiness. `git ls-files` prints paths relative
    to the CURRENT DIRECTORY, so running this script from a subdirectory made
    every `os.path.isfile()` check fail against a doubled path and the scan
    silently examined NOTHING - exiting 0. Proved: with a planted credential it
    still printed PASS when invoked from client/scripts, and FAIL from the root.
    A guard whose result depends on the shell's cwd is worse than no guard.
    """
    return subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True, text=True, check=True,
    ).stdout.strip()


def tracked_files(root: str):
    # -c cached (tracked) + -o others (new, not yet added) + --exclude-standard honours
    # .gitignore. Using `git ls-files` alone would MISS a brand-new file - which is exactly
    # how the original leak arrived, a fresh script committed with the password inside it.
    out = subprocess.run(
        ["git", "-C", root, "ls-files", "-co", "--exclude-standard"],
        capture_output=True, text=True, check=True,
    )
    for rel in out.stdout.splitlines():
        if not rel.endswith(CODE_EXT):
            continue
        if any(part in rel for part in ("node_modules/", "dist/", "build/", ".git/")):
            continue
        if rel.startswith(SKIP_PATHS):
            continue
        abs_path = os.path.join(root, rel)
        if os.path.isfile(abs_path):
            yield rel, abs_path


def findings():
    found = []
    root = repo_root()
    for rel, abs_path in tracked_files(root):
        try:
            with open(abs_path, encoding="utf-8", errors="replace") as fh:
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
                        # Remainder of the line after the literal, so `is_reference` can
                        # see a concatenation operator.
                        after = line[m.end():]
                        # Judge ONLY the captured value. Testing the whole line would match
                        # the word 'password' in the field selector and suppress every hit -
                        # a guard that can never fire.
                        if is_allowed(value, rel, after):
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
