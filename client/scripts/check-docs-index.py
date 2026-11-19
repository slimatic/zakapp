#!/usr/bin/env python3
"""Docs index gate: one index, no broken links, no phantom paths, no doc sprawl.

WHY THIS EXISTS
    The documentation set had grown to 63 live files, a third of them describing
    work that shipped months earlier, and the index linked to some of them as if
    they were current. Nothing failed when a document was orphaned, because
    nothing checked. This does, inside the existing `verify:source` run — no new
    workflow.

RULES
    1. Live doc budget. Adding a document means editing this number, which is the
       moment a reviewer asks whether the document should exist at all.
    2. Every live doc under docs/ must be reachable from README.md or
       docs/README.md by following links (a page nobody links to is a page nobody
       reads).
    3. No relative link may point at a file that does not exist.
    4. A `docs/…` or `scripts/…` path written in backticks must exist.

    docs/archive/ is exempt: it is provenance, deliberately not maintained.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SKIP_DIRS = {"node_modules", ".git", "dist", "coverage", "build-report", "archive", ".venv"}
LINK = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")
PATHY = re.compile(r"`((?:docs|scripts)/[\w./-]+)`")
# Live docs under docs/ (excluding archive). Raise only in the PR that adds a doc.
LIMIT = 38


def live_docs():
    out = []
    for path in ROOT.rglob("*.md"):
        rel = path.relative_to(ROOT)
        if set(rel.parts) & SKIP_DIRS or rel.parts[0] == ".github":
            continue
        if rel.name == "CHANGELOG.md" or str(rel).startswith("docs/archive/"):
            continue
        if str(rel).startswith("docker/README-"):
            continue
        out.append(rel)
    return sorted(out)


def main() -> int:
    errors = []
    docs = live_docs()
    docs_under_docs = [d for d in docs if d.parts[0] == "docs"]
    if len(docs_under_docs) > LIMIT:
        errors.append(
            f"docs/: {len(docs_under_docs)} live documents, budget is {LIMIT}. "
            f"Archive one, or raise LIMIT in this check in the same PR."
        )

    # Reachability, breadth-first from the two entry points.
    seen, queue = set(), [Path("README.md"), Path("docs/README.md")]
    while queue:
        src = queue.pop()
        if src in seen or not (ROOT / src).exists():
            continue
        seen.add(src)
        text = (ROOT / src).read_text(encoding="utf-8", errors="replace")
        for match in LINK.finditer(text):
            target = match.group(1).split("#")[0]
            if not target or target.startswith(("http://", "https://", "mailto:", "#")):
                continue
            dst = (ROOT / src.parent / target).resolve()
            line = text.count("\n", 0, match.start()) + 1
            if not dst.exists():
                errors.append(f"{src}:{line}: broken link -> {target}")
            elif dst.suffix == ".md" and dst.is_relative_to(ROOT):
                queue.append(dst.relative_to(ROOT))

    for doc in docs:
        if doc.parts[0] == "docs" and doc not in seen:
            errors.append(f"{doc}: not reachable from README.md or docs/README.md")

    # Backticked paths must exist; this is what catches `scripts/backup.sh` prose
    # that points at a file deleted two releases ago.
    for doc in docs:
        text = (ROOT / doc).read_text(encoding="utf-8", errors="replace")
        for number, line in enumerate(text.splitlines(), 1):
            for match in PATHY.finditer(line):
                if not (ROOT / match.group(1)).exists():
                    errors.append(f"{doc}:{number}: missing path {match.group(1)}")

    if errors:
        print("\n".join(errors))
        print(f"FAIL: {len(errors)} documentation problem(s)")
        return 1

    print(f"PASS: {len(docs_under_docs)} live docs, all indexed, 0 broken links.")
    return 0


sys.exit(main())
