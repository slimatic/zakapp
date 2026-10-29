#!/usr/bin/env python3
"""Fail if internal working names or automation-tooling references appear in tracked files.

WHY THIS EXISTS
    Tracked files are public. Two tracked planning documents previously
    carried automation notes rather than contributor documentation, and
    scratch aliases inside tracked files read as private coordination
    vocabulary in a contributor-facing tree. The boundary documents keep
    such content out of this repository; this check enforces that
    mechanically.

WHAT IT CHECKS
    Every file reported by `git ls-files` (tracked only - build outputs and
    local workspaces are naturally exempt) for pattern groups, matched
    case-insensitively:

      1. The project's working alias: assembled below from fragments, so this
         guard does not itself spell the string it forbids.
      2. Internal automation tooling: the workspace/config path prefix, the
         config file name, the delegation tool and its path, and the
         instruction-shaped automation notes ("For <tool>:", "execute
         task-by-task") that read as internal memos, not contributor docs.

    If a third-party page legitimately discusses a product with a similar
    name, narrow the pattern rather than widening the ban.

FAILURE SEMANTICS
    Exits non-zero when: zero tracked files were scanned (empty tree, or
    everything skipped as binary - a scan that examined nothing must not
    pass), or any pattern matched. Every hit names its file and line.

    The scanner's own file is exempt from scanning (its docstring describes
    the class it bans), the same exemption the credential checks apply to
    their own literals - a smaller blind spot than cleverer patterns.
    Docstrings here describe classes, never the literal forbidden strings.
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

CLIENT = Path(__file__).resolve().parent.parent
REPO = CLIENT.parent

# Forbidden strings are assembled from fragments on purpose: the guard must
# be runnable against a tree that contains them without ever containing the
# banned bytes itself.
_H = "her" + "mes"
_ALIAS = "wak" + "il"
_PATTERNS = [
    ("working alias", r"\b" + _ALIAS + r"\b"),
    (
        "internal tooling reference",
        "~/" + r"\." + _H
        + "|" + r"\." + _H + r"/"
        + "|" + _H + "/" + "confi" + r"g\.ya?ml"
        + "|" + r"tools/" + "deleg" + "ate_tool"
        + "|" + "deleg" + r"ate_task\b",
    ),
    (
        "automation-instruction note",
        r"for " + _H + r"\s*:|execute task" + "-by-" + "task",
    ),
]

# Byte-coincidences inside binary artifacts are not documentation leaks.
BINARY_SUFFIXES = {
    ".db", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".woff",
    ".woff2", ".ttf", ".eot", ".gz", ".zip", ".pdf", ".mp3", ".mp4",
    ".icns", ".wasm",
}
MAX_BYTES = 10 * 1024 * 1024


def main() -> int:
    print("check-public-strings:")
    r = subprocess.run(["git", "ls-files"], cwd=REPO, capture_output=True, text=True)
    tracked = [f for f in r.stdout.splitlines() if f.strip()]
    if not tracked:
        print("  FAIL  git ls-files returned 0 tracked files - the scan examined nothing")
        return 1

    self_rel: str | None = None
    try:
        self_rel = str(Path(__file__).resolve().relative_to(REPO))
    except ValueError:
        self_rel = None

    hits: list[tuple[str, int, str, str]] = []
    scanned = 0
    for f in tracked:
        p = REPO / f
        if not p.is_file():
            continue
        if p.suffix.lower() in BINARY_SUFFIXES:
            continue
        if p.stat().st_size > MAX_BYTES:
            continue
        if f == self_rel:
            # This file is the ban-list itself; scanning it would flag its own
            # explanatory content. (Precedent: the credential-logging guard
            # skips itself for the same reason.)
            continue
        try:
            text = p.read_text(errors="ignore")
        except OSError:
            continue
        scanned += 1
        for label, pattern in _PATTERNS:
            for m in re.finditer(pattern, text, flags=re.IGNORECASE):
                line_no = text.count("\n", 0, m.start()) + 1
                line = text.splitlines()[line_no - 1].strip()[:90]
                hits.append((f, line_no, label, line))

    print(f"  scanned {scanned} tracked files for {len(_PATTERNS)} pattern groups")
    if scanned == 0:
        print("  FAIL  every candidate was skipped - the scan examined nothing")
        return 1
    for f, line_no, label, line in hits:
        print(f"  FAIL  {f}:{line_no}  [{label}]  {line}")
    if hits:
        print(f"\nFAIL: {len(hits)} public-boundary violation(s) - see above.")
        return 1
    print("\nPASS: no internal working names or automation references in tracked files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())