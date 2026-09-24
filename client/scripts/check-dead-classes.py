"""Every Tailwind utility class in src must actually generate a CSS rule.

Why this exists - this codebase hit the SAME silent failure five separate times.
None were catchable by tsc, eslint, or any test: a class that generates no rule is
not an error to any of them, and the element still renders - just unstyled.

  border-default               22 uses   0 rules   (swept to a name that never existed)
  -ms-1                                  Tailwind 3.4 has no negative logical margin
  inline-start-* / inline-end-* ~14 uses Tailwind's utilities are start-* / end-*
  inset-inline-end-4                     the CSS property name, not the utility
  slide-in-from-inline-start-4  4 uses   tailwindcss-animate 1.0.7 has no logical variant
  animate-slide-down           1 use    no such keyframe is defined

Visual checks miss all of these, because the layout usually still "looks fine"
without the missing rule.

USAGE
  cd client && npm run build && python3 scripts/check-dead-classes.py

Escaping: Tailwind escapes '/', '.', '[', ']', '(' etc. in the emitted selector
(`bg-secondary/90` becomes `.bg-secondary\\/90`), so a plain substring search reports
false positives. tailwind_escape() below mirrors that escaping - getting it wrong is
how the first version of this check reported ~150 bogus failures.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
DIST = ROOT / "dist" / "assets"

# Only tokens with a real utility prefix are validated, so prose and one-off strings
# produce no noise. Extend when a false negative shows up.
KNOWN = (
    "border-", "rounded-", "inset-", "start-", "end-", "top-", "bottom-", "left-",
    "right-", "space-", "gap-", "text-", "bg-", "shadow-", "ring-", "animate-",
    "slide-in-", "slide-out-", "zoom-in-", "zoom-out-", "fade-in", "fade-out",
    "duration-", "transition-", "w-", "h-", "min-", "max-", "p-", "px-", "py-",
    "pt-", "pb-", "ps-", "pe-", "m-", "mx-", "my-", "mt-", "mb-", "ms-", "me-",
    "ml-", "mr-", "pl-", "pr-", "grid-", "flex-", "items-", "justify-", "overflow-",
    "opacity-", "scale-", "rotate-", "translate-", "leading-", "tracking-", "font-",
)

SPECIAL = set(r"/\.[]()#%,'\"!&*+:=<>@~")


def tailwind_escape(token: str) -> str:
    """Mirror Tailwind's class-name escaping in the emitted stylesheet."""
    return "".join(("\\" + ch) if ch in SPECIAL else ch for ch in token)


def built_css() -> str:
    files = sorted(DIST.glob("*.css"))
    if not files:
        print("FAIL no dist/assets/*.css - run `npm run build` first")
        sys.exit(1)
    return "".join(f.read_text(encoding="utf-8") for f in files)


def selector_set(css: str) -> set:
    """Every class name the stylesheet defines, unescaped, for O(1) lookup.

    Two traps, both of which produced large piles of false positives:

    1. Scan RULE BLOCKS and take class names from the selector only. A naive pass
       over the whole text mistakes decimals in declarations for class selectors -
       `hsl(var(--accent) / .5)` yielded a bogus class named "5)}.bg-accent".

    2. A class name ends at the first UNESCAPED colon (which starts the
       pseudo-class) and must tolerate backslash-escaped characters inside it:
       `.hover\\:bg-secondary\\/90:hover` defines class `hover:bg-secondary/90`.
       Variant-only classes never appear at the start of a selector, so a
       leading-dot match misses every one of them.
    """
    out = set()
    for sel, _body in re.findall(r"([^{}]+)\{([^{}]*)\}", css):
        sel = sel.strip()
        if not sel or sel.startswith("@"):
            continue
        for name in re.findall(r"\.([^\s{,>~+]*?(?:\\.[^\s{,>~+]*?)*)(?<!\\)(?=[\s{,>~+]|:(?!\\|:)|$)", sel):
            if not name:
                continue
            out.add(name.replace("\\", ""))
            # A pseudo-element is appended unescaped and swallowed into the name by the
            # pattern above: `.file\:me-4::file-selector-button` must yield the class
            # `file:me-4`, not `file:me-4::file-selector-button`. Truncate at the first
            # UNESCAPED colon.
            cut = next(
                (i for i, ch in enumerate(name) if ch == ":" and (i == 0 or name[i - 1] != "\\")),
                len(name),
            )
            if cut:
                out.add(name[:cut].replace("\\", ""))
    return out


# className="..." | className={`...`} | className={'...'}
CLASS_ATTR = re.compile(
    r"""className\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{\s*'([^']*)'\s*\}|\{\s*"([^"]*)"\s*\})"""
)


def class_tokens(text: str):
    for m in CLASS_ATTR.finditer(text):
        body = next((g for g in m.groups() if g), "")
        for tok in body.split():
            # A className value can embed a nested string (a ternary result), so quote
            # characters leak into the split token: `text-success''` -> `text-success`.
            tok = tok.strip().strip('"').strip("'").strip("`").strip()
            # skip interpolations and dynamic fragments
            if not tok or "${" in tok or "{" in tok or "}" in tok or ";" in tok:
                continue
            bare = tok.split(":")[-1]
            if bare.lstrip("-").startswith(KNOWN):
                yield tok, bare


def main() -> int:
    defined = selector_set(built_css())
    missing: dict[str, set[str]] = {}
    checked = 0
    for path in list(SRC.rglob("*.tsx")) + list(SRC.rglob("*.ts")):
        if "__tests__" in str(path) or ".test." in path.name:
            continue
        for full, bare in class_tokens(path.read_text(encoding="utf-8")):
            checked += 1
            # Compare the FULL token, variants included: `.hover\:bg-secondary\/90:hover`
            # defines `hover:bg-secondary/90`, NOT the bare `bg-secondary/90`. Most
            # classes in this codebase exist only as variants (hover:, last:, md:),
            # so matching the bare name reported a false positive for nearly all of
            # them - the first version of this check listed ~150 bogus failures.
            if full not in defined:
                missing.setdefault(full, set()).add(path.name)

    if missing:
        for tok, files in sorted(missing.items()):
            print(f"FAIL '{tok}' generates no CSS  ({len(files)} file(s): {sorted(files)[:3]})")
        print()
        print("A class with no rule fails SILENTLY - the element renders unstyled.")
        print("Real names: start-*/end-* (not inline-start-*), ms-*/me-* (no negative")
        print("form in 3.4 - use [margin-inline-start:-0.25rem]), and only the")
        print("keyframes/animation names tailwind.config.js actually defines.")
        return 1

    print(f"PASS: all {checked} utility classes in src generate a CSS rule.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
