#!/usr/bin/env python3
"""Fail if the snapshot nisab threshold regresses to an invented number.

WHY THIS EXISTS
    `server/src/services/snapshot.service.ts` contained:

        const nisabThreshold = 7500; // Placeholder - should be calculated based on methodology

    and then persisted a `zakatDue` computed from that number. An invented nisab
    presented as a calculation is the fabrication the v1.0 plan forbids, and it is
    worse here than elsewhere: the result is written to a stored, encrypted,
    IMMUTABLE snapshot, so a wrong obligation is baked into the user's history.

    The fix routes the threshold through `NisabService.calculateNisab()` and
    REFUSES the snapshot when no threshold can be determined. That refusal is the
    point - a snapshot built on an assumed threshold is worse than no snapshot.

WHAT IT CHECKS
    1. No bare numeric nisab threshold is assigned in that file, whatever the value.
    2. The threshold is actually derived from `nisabService.calculateNisab(...)`.
    3. The refusal guard survives, so an unresolved threshold can never become a
       stored `zakatDue`.
    4. The field read off the result is the one the service returns. This matters
       because `NisabInfo` is aliased to `any` in `server/src/shared_local.ts`, so
       TypeScript CANNOT catch a wrong field name here. `calculateNisab` returns
       `effectiveNisab`; `nisabAmount` does not exist on it, and reading that name
       would silently yield `undefined` with no compile error.

CEILING
    Source-level: it catches a reintroduced literal and a wrong field name, not a
    threshold computed incorrectly at runtime. That is the right depth here - the
    observed defect was a literal plus a wrong-but-unchecked field name. The
    arithmetic itself belongs in NisabService's own tests.

Exit 0 = the threshold is derived, guarded, and read from the right field.
Exit 1 = at least one of those is false.
"""

from __future__ import annotations
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent  # client/scripts -> client -> repo root
SNAPSHOT = ROOT / "server" / "src" / "services" / "snapshot.service.ts"
NISAB = ROOT / "server" / "src" / "services" / "NisabService.ts"


def strip_comments(src: str) -> str:
    """Remove // and /* */ comments so a literal inside prose is not flagged.

    The replacement comment in snapshot.service.ts quotes the old
    `const nisabThreshold = 7500;` deliberately, as the history of why the code
    is shaped this way. Flagging that would be a false positive, and a check that
    cries wolf is one people learn to ignore.
    """
    src = re.sub(r"/\*.*?\*/", "", src, flags=re.S)
    src = re.sub(r"//[^\n]*", "", src)
    return src


def main() -> int:
    problems: list[str] = []

    if not SNAPSHOT.exists():
        print(f"FAIL: {SNAPSHOT} not found (moved or renamed?)")
        return 1
    code = strip_comments(SNAPSHOT.read_text(encoding="utf-8"))

    # 1. No hardcoded threshold. Any bare numeric assignment to a nisab local is
    #    the defect, whatever the number - the number is not the point, the
    #    inventing is.
    hardcoded = re.findall(r"\b(?:nisabThreshold|nisabAmount)\s*=\s*[\d_]+", code)
    if hardcoded:
        problems.append(
            f"hardcoded nisab threshold reintroduced: {', '.join(hardcoded)} "
            f"- the threshold must come from NisabService"
        )

    # 2. It must actually be derived.
    if not re.search(r"nisabService\.calculateNisab\(", code):
        problems.append("no longer calls nisabService.calculateNisab(...)")

    # 3. The refusal guard must survive.
    if not re.search(r"if\s*\(\s*!\s*nisabThreshold\s*\|\|\s*nisabThreshold\s*<=\s*0\s*\)", code):
        problems.append(
            "the guard refusing a snapshot on an unresolved threshold is gone "
            "- without it an unknown threshold silently becomes a stored zakatDue"
        )

    # 4. The field read must be one the service actually returns. `NisabInfo` is
    #    `any` via shared_local.ts, so tsc cannot help; this is the only guard.
    if NISAB.exists():
        service = NISAB.read_text(encoding="utf-8")
        start = service.find("async calculateNisab(")
        end = service.find("private async getCurrentGoldPrice")
        block = service[start:end] if start != -1 and end > start else ""
        returned = re.findall(r"return\s*\{([^}]*)\}", block)
        returned_fields = " ".join(returned)
        if "effectiveNisab" in returned_fields:
            if re.search(r"nisabInfo\.nisabAmount\b", code):
                problems.append(
                    "reads nisabInfo.nisabAmount, but calculateNisab returns "
                    "effectiveNisab - undefined at runtime, and tsc cannot see it "
                    "because NisabInfo is aliased to `any`"
                )
        else:
            problems.append(
                "could not confirm calculateNisab still returns effectiveNisab "
                "- re-check this guard against the service"
            )

    if problems:
        print("FAIL: snapshot nisab threshold is not derived and guarded")
        for p in problems:
            print(f"  - {p}")
        return 1

    print("ok   check-snapshot-nisab.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
