#!/usr/bin/env python3
"""Fail if the client offers a payment value the server will reject.

WHY THIS EXISTS
    The client and the server each kept their own list of zakat recipient
    categories, and they disagreed badly:

      server (canonical, 8):  fakir miskin amil muallaf riqab gharimin
                              fisabilillah ibnus_sabil
      client form (7):        poor orphans widows education healthcare
                              infrastructure general

    NOT ONE of the client's values was in the server's list. The server rejects
    an unknown category by throwing, and the route turns that throw into a 500 —
    so every payment recorded through that form was written locally and then lost
    when it synced. Onboarding had the same defect with 'general'.

    This is the same failure shape as the two asset-category vocabularies (#502):
    an enum duplicated in two places, drifting, with the disagreement surfacing
    only as a runtime error on the path that matters.

WHAT IT CHECKS
    The canonical list is read from the SERVER (the authority), then every
    recipient-category and payment-method enum literal in the client must be a
    subset of it. Reported as the exact offending values, because "invalid enum"
    is not actionable and "poor is not a server category" is.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SERVER = ROOT / "server" / "src" / "models" / "PaymentRecord.ts"
CLIENT = ROOT / "client" / "src"


def server_enum(source: str, var_name: str) -> set[str]:
    """Read a `const <var>: T[] = [ 'a', 'b' ]` array literal from the server."""
    m = re.search(rf"const {var_name}\s*:[^=]*=\s*\[(.*?)\]", source, re.S)
    if not m:
        return set()
    return set(re.findall(r"'([^']+)'", m.group(1)))


def client_enums(path: Path, field: str) -> list[tuple[int, list[str]]]:
    """Every z.enum([...]) literal assigned to `field`, with its line number."""
    out: list[tuple[int, list[str]]] = []
    for i, line in enumerate(path.read_text().splitlines(), 1):
        if field in line and "z.enum" in line:
            vals = re.findall(r"'([^']+)'", line)
            if vals:
                out.append((i, vals))
    return out


def main() -> int:
    if not SERVER.is_file():
        print(f"  FAIL  server model not found: {SERVER}")
        return 1

    src = SERVER.read_text()
    canonical_cat = server_enum(src, "validCategories")
    canonical_method = server_enum(src, "validPaymentMethods")

    print("check-payment-vocabulary:")
    if not canonical_cat:
        print("  FAIL  could not read validCategories from the server")
        return 1
    print(f"  ok    server canonical categories: {len(canonical_cat)}")
    print(f"  ok    server canonical methods:    {len(canonical_method)}")

    failures: list[str] = []

    for path in sorted(CLIENT.rglob("*.ts")) + sorted(CLIENT.rglob("*.tsx")):
        if "__tests__" in path.parts or ".test." in path.name or ".stories." in path.name:
            continue

        for lineno, vals in client_enums(path, "recipientCategory"):
            extra = [v for v in vals if v not in canonical_cat]
            rel = path.relative_to(ROOT)
            if extra:
                failures.append(
                    f"{rel}:{lineno} offers {len(extra)} category value(s) the server "
                    f"rejects: {', '.join(extra)}"
                )
            else:
                print(f"  ok    {rel}:{lineno} {len(vals)} categories all canonical")

        for lineno, vals in client_enums(path, "paymentMethod"):
            extra = [v for v in vals if v not in canonical_method]
            rel = path.relative_to(ROOT)
            if extra:
                failures.append(
                    f"{rel}:{lineno} offers {len(extra)} payment method(s) the server "
                    f"rejects: {', '.join(extra)}"
                )
            else:
                print(f"  ok    {rel}:{lineno} {len(vals)} methods all canonical")

    if failures:
        print(f"\nFAIL: {len(failures)} client/server vocabulary mismatch(es).")
        for f in failures:
            print(f"  - {f}")
        print("\n  A payment saved with these values is written locally, then")
        print("  rejected with a 500 on sync and lost. Use the server's list.")
        return 1

    print("\nPASS: every client payment enum is a subset of the server's.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
