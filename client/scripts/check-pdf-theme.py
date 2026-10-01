"""Generated PDFs must draw their colours from the shared theme, not literals.

Why this exists: the two generators had drifted apart AND from the app. One used a
four-colour rainbow of Tailwind-500 tables (green, blue, violet, teal), the other a
teal-700 brand, and neither derived from the Nur tokens the app is built on. Table
heads are the easy place for a literal to reappear, because a new table gets copied
from the table above it.

Worse, every one of those literals failed WCAG AA for body text on white:
  green-500 2.28:1 | blue-500 3.68:1 | violet-500 4.23:1 | teal-500 2.49:1
  setTextColor(128) 3.95:1
They looked acceptable only because the saturated ones sat behind white bold text.

Source-level by design: a literal colour is a structural fault, and a PDF cannot be
inspected by the test suite. The palette values themselves are asserted in
src/utils/__tests__/pdfTheme.test.ts.
"""
import re
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent / "src" / "utils"
GENERATORS = ["pdfGenerator.ts", "ReportGenerator.ts"]

# jspdf colour literals: fillColor arrays, numeric grayscale/ink, brand hexes.
PATTERNS = [
    (r"fillColor\s*:\s*\[\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\]", "table head/body colour literal"),
    (r"setTextColor\s*\(\s*\d+\s*[,)]", "grayscale text colour literal"),
    (r"setDrawColor\s*\(\s*\d+\s*[,)]", "grayscale draw colour literal"),
    (r"#[0-9a-fA-F]{3,6}\b", "brand hex literal"),
    (r"\[\s*2[0-9]{2}\s*,\s*2[0-9]{2}\s*,\s*2[0-9]{2}\s*\]", "zebra fill literal"),
]


def strip_comments(text: str) -> str:
    """Drop // and /* */ comments so docs naming an old colour are not flagged."""
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    return re.sub(r"//[^\n]*", "", text)


def main() -> int:
    problems = []
    for name in GENERATORS:
        path = SRC / name
        if not path.exists():
            problems.append(f"{name}: missing")
            continue
        body = strip_comments(path.read_text(encoding="utf-8"))
        for i, line in enumerate(body.splitlines(), 1):
            for pattern, label in PATTERNS:
                m = re.search(pattern, line)
                if m:
                    problems.append(f"{name}:{i} {label}: {m.group(0)}")

    if problems:
        for p in problems:
            print(f"FAIL {p}")
        print()
        print("PDF colours must come from src/utils/pdfTheme.ts "
              "(PDF_THEME / TABLE_STYLES), which derives from the Nur tokens.")
        return 1

    print(f"PASS: no colour literals in {', '.join(GENERATORS)}; "
          "both draw from the shared PDF theme.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
