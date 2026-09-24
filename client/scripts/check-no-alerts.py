"""No window.alert in the app, and no hardcoded colours in the toast layer.

A native alert() blocks the whole page, cannot be styled or themed, cannot be
dismissed by anything but its own button, and is invisible to a screen reader's
live region. react-hot-toast is already installed and mounted app-wide, so the
alerts were pure debt.

The toast styling was also the last place with hardcoded colours (#363636 bg,
#fff text, #10b981 / #ef4444 icons), so toasts looked identical in Nur and
Qamar.

Source-level check: both defects are structural, so a grep is the right tool.
"""
import pathlib
import re
import sys

SRC = pathlib.Path(__file__).resolve().parents[1] / "src"

# alert( as a statement, not in a comment or a word like "alerted"
ALERT = re.compile(r"(?<![\w.])alert\s*\(")
HEX = re.compile(r"#[0-9a-fA-F]{3,8}\b")
ALLOWED_HEX = {
    # #NNN in this codebase are issue references in comments, not colours
    "310", "341", "322", "361", "338", "348", "363", "377", "383",
    "1586", "1603",
}
TOAST_FILE = SRC / "components/ui/ToastProvider.tsx"


def main():
    problems = []

    for p in SRC.rglob("*.tsx"):
        if ".test." in p.name or ".stories." in p.name:
            continue
        for i, line in enumerate(p.read_text(errors="ignore").split("\n"), 1):
            stripped = line.strip()
            if stripped.startswith("//") or stripped.startswith("*"):
                continue
            if ALERT.search(line):
                problems.append(f"{p}:{i} window.alert() - use toast instead")
            if "window.alert" in line:
                problems.append(f"{p}:{i} window.alert()")

    if TOAST_FILE.exists():
        text = TOAST_FILE.read_text()
        for i, line in enumerate(text.split("\n"), 1):
            # Skip comments - a comment explaining which hex was removed is not
            # a hardcoded colour. (This check flagged its own note when first run.)
            stripped = line.strip()
            if stripped.startswith("//") or stripped.startswith("*"):
                continue
            for m in HEX.finditer(line):
                if m.group(0)[1:] not in ALLOWED_HEX:
                    problems.append(f"{TOAST_FILE}:{i} hardcoded colour {m.group(0)} "
                                    f"- toasts must use theme tokens")

    if problems:
        for x in problems:
            print(f"FAIL {x}")
        sys.exit(1)
    print("PASS: no window.alert in src, and the toast layer uses theme tokens.")


if __name__ == "__main__":
    main()
