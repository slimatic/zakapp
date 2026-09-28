#!/usr/bin/env python3
"""No browser check may navigate to a server other than the one it was given.

WHY THIS EXISTS
`_login.BASE` is the single place a base URL comes from, and it reads `ZAK_BASE`.
Five checks did not use it: four shadowed it with their own
`BASE = "http://localhost:4173"`, and two of those also called
`pg.goto("http://localhost:4173" + route)` inline. `run-browser-checks.py` exported
`ZAK_BASE_URL`, a name no check reads, and passed the base as a positional argument
no check parses.

The result was not a crash but a WRONG VERDICT, which is worse. Running
`ZAK_BASE=http://localhost:4174` against a second worktree:

  · light/dark measured whatever app was on 4173, and printed it as this build's
    findings.
  · RTL failed 18/18 with "Arabic did not switch direction". `open_session()` sets no
    language, so the checker sets `zakapp_lang` itself — on the origin it is sitting
    on (4174) — then navigated to 4173, where localStorage is a DIFFERENT store with
    no `zakapp_lang`. The app came up in English. The app was correct; the checker
    looked in the wrong origin and blamed the app.

The a11y checker could not catch this itself, because a connection-refused page has
no text nodes to measure and the theme sweep reports "0 measured" as a theme-sweep
result rather than a failure — so the sweep it corrupted could not report it.

WHAT IS CHECKED
  · A navigation call (goto/urlopen/urlretrieve) built from a literal
    `http(s)://localhost:PORT` — the wrong-origin bug, directly.
  · A module-level `BASE = "http://localhost:..."` that shadows `_login.BASE`.

Docstrings, usage examples and API defaults are not navigation, so they are ignored.
This is an assertion rather than a comment because the failure mode is a
plausible-looking green.
"""
from __future__ import annotations
import ast
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent

# The files whose job IS to define a default base, so they may name a port.
# _login.py is the single source every check imports; run-browser-checks.py is the
# entrypoint and needs a fallback when neither ZAK_BASE nor ZAK_BASE_URL is set.
DEFINES_BASE = {"_login.py", "run-browser-checks.py"}

LOCALHOST_URL = re.compile(r"https?://localhost:\d+")

# Calls that load a URL into the browser or over the network.
NAVIGATING = {"goto", "goto_url", "urlopen", "urlretrieve", "urlopen_unsafe"}


def _called_name(node: ast.Call) -> str | None:
    func = node.func
    if isinstance(func, ast.Attribute):
        return func.attr
    if isinstance(func, ast.Name):
        return func.id
    return None


def _localhost_literals(node: ast.AST) -> list[tuple[int, str]]:
    """Localhost URL literals anywhere under `node`, including f-strings."""
    hits: list[tuple[int, str]] = []
    for sub in ast.walk(node):
        if isinstance(sub, ast.Constant) and isinstance(sub.value, str):
            m = LOCALHOST_URL.search(sub.value)
            if m:
                hits.append((sub.lineno, m.group(0)))
    return hits


def offenders(path: Path) -> list[tuple[int, str]]:
    """(line, reason) for each violation in one script."""
    text = path.read_text(encoding="utf-8")
    try:
        tree = ast.parse(text)
    except SyntaxError as exc:
        return [(exc.lineno or 0, f"will not parse: {exc.msg}")]

    found: list[tuple[int, str]] = []
    defines_base = path.name in DEFINES_BASE

    for node in ast.walk(tree):
        # 1. Navigation to a hardcoded origin.
        if isinstance(node, ast.Call) and _called_name(node) in NAVIGATING:
            for lineno, url in _localhost_literals(node):
                found.append((lineno, f"navigates to hardcoded {url}"))

        # 2. A module-level BASE that shadows _login.BASE.
        if not defines_base and isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == "BASE":
                    for lineno, url in _localhost_literals(node.value):
                        found.append(
                            (lineno, f"shadows _login.BASE with hardcoded {url}")
                        )

    return found


def main() -> int:
    problems = []
    for path in sorted(HERE.glob("*.py")):
        for line, reason in offenders(path):
            problems.append(f"  {path.name}:{line}  {reason}")

    if problems:
        print("FAIL: a check script hardcodes a server URL instead of using "
              "_login.BASE (ZAK_BASE).\n")
        print("\n".join(problems))
        print(
            "\nUse `from _login import BASE, open_session` and navigate to "
            'f"{BASE}{route}".\n'
            "A literal here measures a different app — or a different origin's\n"
            "localStorage — and reports the result as this build's."
        )
        return 1

    print("PASS: every check script navigates to _login.BASE.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
