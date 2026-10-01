"""Self-check: no logical horizontal inset paired with an unconditioned translate-x.

The bug class: `start-1/2` flips under RTL but `-translate-x-1/2` does not, so a
centred element is pushed half its width past the inline-end edge. In RTL that
made the app overflow 87-228px on every desktop route while LTR stayed clean.

Axis matters, and getting it wrong produces false alarms:
  - `start-`/`end-` are LOGICAL and flip in RTL. They conflict with `translate-x-*`,
    which is PHYSICAL and does not flip.
  - `top-`/`bottom-` do NOT flip, so `top-1/2 -translate-y-1/2` is fine. (An
    earlier version of this check flagged exactly that - a vertical centring pair
    is orthogonal to a horizontal inset.)

Rule: a class string using `start-*`/`end-*` and `translate-x-*` must carry an
`rtl:translate-x-*` override in the same string.

Run: python3 client/scripts/check-logical-inset-translate.py [root]
"""
import pathlib
import re
import sys

# Resolve the default root from THIS file's location, not the cwd. CI invokes
# this from client/ (via run-source-checks.py), where a cwd-relative default of
# "client/src" resolves to client/client/src, scans zero files, and reports a
# clean pass - a check that cannot fail. A scan of nothing is a broken check,
# not a passing one, so that is an error below.
HERE = pathlib.Path(__file__).resolve().parent
DEFAULT_ROOT = HERE.parent / "src"
ROOT = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_ROOT

LOGICAL_X = re.compile(r"(?<![\w:.-])(start|end)-[\w./\[\]%-]+")
TRANSLATE_X = re.compile(r"(?<![\w:.-])(-?translate-x)-[\w./\[\]%-]+")
RTL_GUARD = re.compile(r"rtl:translate-x-[\w./\[\]%-]+")

CLASS_ATTR = re.compile(r"className=(?:\"([^\"]*)\"|\{`([^`]*)`\}|'([^']*)')")


def offenders(text):
    out = []
    for m in CLASS_ATTR.finditer(text):
        cls = next(g for g in m.groups() if g is not None)
        if not LOGICAL_X.search(cls) or not TRANSLATE_X.search(cls):
            continue
        if RTL_GUARD.search(cls):          # guarded in this very class string
            continue
        line = text[: m.start()].count("\n") + 1
        tok = TRANSLATE_X.search(cls).group(0)
        out.append((line, tok, cls.strip()[:90]))
    return out


bad = 0
files_scanned = 0
for f in sorted(ROOT.rglob("*.tsx")):
    files_scanned += 1
    for line, tok, cls in offenders(f.read_text(encoding="utf-8", errors="replace")):
        print(f"FAIL {f}:{line} logical inset + physical {tok}\n     {cls}")
        bad += 1

# A scan that finds no files is a broken check, not a passing one. This is the
# failure mode it already had once: run from the wrong directory it scanned
# nothing and reported success.
if files_scanned == 0:
    print(f"FAIL: no .tsx files found under {ROOT} - check is not scanning anything")
    sys.exit(1)

# Regression guard: the three fixed sites must keep their rtl: override.
for rel, needle in (
    ("components/ui/Tooltip.tsx", "rtl:translate-x-1/2"),
    ("components/SyncIndicator.tsx", "rtl:translate-x-1/2"),
    ("components/pwa/UpdateNotification.tsx", "md:rtl:translate-x-1/2"),
):
    p = ROOT / rel
    if p.exists():
        s = p.read_text(encoding="utf-8")
        assert needle in s, f"{rel} lost its {needle} guard"
        print(f"ok   {rel} carries {needle}")

print(f"\n{bad} unguarded logical-inset + physical-translate-x occurrence(s)")
sys.exit(1 if bad else 0)
