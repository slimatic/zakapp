"""Every check script must be able to FAIL a pipeline, not just print 'FAIL'.

WHY THIS EXISTS
`check-theme-a11y-rtl.py` printed `FAIL <finding>` and an issue count, then exited 0 -
for its whole life. Anything running it (a CI step, a shell chain, a reviewer reading
`$?`) saw success. Its verdict was cosmetic, which is the same defect class as a probe
that passes on a blank page: the check reports on the app without being able to
contradict it.

A probe's value is entirely in its exit code. So assert the property at the source
level, where it cannot depend on a render or on which assertions happened to fire.

THE RULE
A script in this directory that can report problems must exit non-zero when it finds
them. Either shape is accepted:

  if __name__ == "__main__":        # preferred - the exit code IS the verdict
      sys.exit(main())

  if problems:                      # or an explicit failure arm
      sys.exit(1)

`_login.py` is exempt: it is a helper, and it exits non-zero by raising SystemExit when
a login genuinely fails.

USAGE
  cd client && python3 scripts/check-exit-codes.py
Source-level, so no build and no running server are needed.
"""
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent

# Helpers, not checks.
EXEMPT = {"_login.py"}

# A script that mentions any of these can report a problem, so it needs a failure exit.
REPORTS_PROBLEMS = re.compile(r"\b(FAIL|problems|findings|violations)\b")


def exits_nonzero(text: str) -> bool:
    return bool(
        re.search(r"sys\.exit\(\s*main\(\)\s*\)", text)          # preferred shape
        or re.search(r"sys\.exit\(\s*[1-9]", text)                # explicit failure arm
        or re.search(r"raise\s+SystemExit", text)                # raise-based failure
    )


def main() -> int:
    checked = 0
    bad = []
    for path in sorted(HERE.glob("check-*.py")):
        if path.name in EXEMPT:
            continue
        text = path.read_text(encoding="utf-8")
        checked += 1
        # Skip the check that only greps for strings, and this file's own docstring
        # examples: their mentions of FAIL are prose, not a verdict.
        body = re.sub(r'""".*?"""', "", text, flags=re.S)
        if not REPORTS_PROBLEMS.search(body):
            continue
        if not exits_nonzero(text):
            bad.append(path.name)

    if bad:
        for name in bad:
            print(f"FAIL {name} can report problems but never exits non-zero")
        print()
        print("A check whose verdict cannot be seen by $? is not a check. End the")
        print('script with `if __name__ == "__main__": sys.exit(main())` and make')
        print("main() return 1 on a finding.")
        return 1

    print(f"PASS: all {checked} check script(s) exit non-zero when they report a problem.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
