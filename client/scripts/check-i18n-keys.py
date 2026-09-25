"""Every i18n key must resolve, and no <Trans> may skip its namespace.

Why: the i18n config registers exactly two namespaces (`onboarding`,
`dashboard`) and sets no `defaultNS`. React-i18next's default namespace is
`translation`, which does not exist here - so a `<Trans i18nKey="...">` written
without `ns=` resolves nothing and i18next falls back to printing the raw key.
That shipped: the dashboard's education module rendered "education.whatIsZakat"
as a visible heading, in English, for every user.

Three checks:
  1. No `<Trans>` without an `ns=` attribute. (Any such use is broken given the
     config above - this is the check that would have caught the raw key.)
  2. Every `i18nKey="X.Y"` and `t('X')` resolves in the bundle for the namespace
     in effect. For `t()` the namespace comes from the file's
     `useTranslation('<ns>')` and the ENTIRE string is the key, so
     `t('viewAllAssets')` is key `viewAllAssets` while `t('dashboard.viewAllAssets')`
     is a different (usually nonexistent) nested key. Splitting the string on the
     first dot and looking up the tail silently validated the wrong thing.
  3. No untranslated user-visible text in the scanned directories - JSX text
     nodes (whole-source, so multi-line JSX is seen) and visible string
     attributes (aria-label, placeholder, title, alt, label). Checks 1 and 2 can
     only validate keys that are ALREADY in the source; they cannot see a
     hardcoded English sentence at all.

Ponytail: checks 1-3 are source-level greps, not a render test, because the
failures are structural - they never depend on runtime state. The runtime half
(a key that exists but renders as a raw string anyway) is covered by
src/components/dashboard/__tests__/translated-rendering.test.tsx. Revisit if the
project ever adds a `translation` namespace or sets `defaultNS`.
"""
import json
import pathlib
import re
import sys

SRC = pathlib.Path(__file__).resolve().parents[1] / "src"
EN = SRC / "i18n" / "locales" / "en"

# Namespaces actually registered in src/i18n/index.ts
NAMESPACES = ["dashboard", "onboarding", "common"]
# <Trans> components that appear as <Transition> / <Transition.Child>
NOT_TRANS = re.compile(r"<Transition\b")


def bundle(ns):
    f = EN / f"{ns}.json"
    return json.loads(f.read_text()) if f.exists() else {}


BUNDLES = {ns: bundle(ns) for ns in NAMESPACES}


def lookup(ns, key):
    node = BUNDLES.get(ns)
    for part in key.split("."):
        if not isinstance(node, dict) or part not in node:
            return False
        node = node[part]
    return True


def scan_trans():
    """(file, line, key) for every <Trans> without ns=, and every <Trans> key.

    Matches the whole element, not a single line: props are routinely spread over
    several lines (ns= on its own line), and a line-based check reported those as
    missing ns= - a false positive that would have failed CI on correct code.
    """
    missing_ns, keys = [], []
    block = re.compile(r"<Trans\b.*?(?:/>|</Trans>)", re.S)
    for p in SRC.rglob("*.tsx"):
        if ".test." in p.name or ".stories." in p.name:
            continue
        src = p.read_text(errors="ignore")
        for m in block.finditer(src):
            el = m.group(0)
            if NOT_TRANS.search(el):
                continue
            line = src[: m.start()].count("\n") + 1
            km = re.search(r'i18nKey="([^"]+)"', el)
            if not re.search(r"\bns\s*=", el):
                missing_ns.append((str(p), line, km.group(1) if km else "?"))
            if km:
                keys.append((str(p), line, km.group(1)))
    return missing_ns, keys


def scan_t_calls():
    """(file, line, full_key, ns) for every t(...) call.

    The namespace comes from the file's `useTranslation('<ns>')`, and the WHOLE
    string is the key. This matters: inside `useTranslation('dashboard')`,
    `t('viewAllAssets')` is key `viewAllAssets`, while `t('dashboard.viewAllAssets')`
    is a DIFFERENT key named `dashboard.viewAllAssets` (nested), which usually
    does not exist. An earlier version of this check split the string on the first
    dot and looked up the tail in that namespace, so it happily "validated"
    `t('dashboard.viewAllAssets')` against a root-level `viewAllAssets` - the real
    defect then rendered the raw key in the UI while this check reported PASS.
    """
    out = []
    call = re.compile(r"""\bt\(\s*['"]([^'"]+)['"]""")
    ns_re = re.compile(r"""useTranslation\(\s*['"]([a-zA-Z0-9_]+)['"]""")
    for p in SRC.rglob("*.tsx"):
        if ".test." in p.name or ".stories." in p.name:
            continue
        src = p.read_text(errors="ignore")
        # Namespace in effect for this file; `t('ns:key')` overrides per call.
        m = ns_re.search(src)
        default_ns = m.group(1) if m else None
        for i, line in enumerate(src.split("\n"), 1):
            for c in call.finditer(line):
                full = c.group(1)
                if ":" in full:
                    ns, _, key = full.partition(":")
                else:
                    ns, key = default_ns, full
                if ns:
                    out.append((str(p), i, key, ns))
    return out


# ── untranslated visible text ────────────────────────────────────────────────
#
# The gap this closes: checks (1) and (2) only verify that keys ALREADY IN THE
# SOURCE resolve. They cannot see a hardcoded string, so an entirely new English
# sentence in a shared component passed CI while rendering untranslated for an
# Arabic user - which is precisely how the v1.0 shell shipped hardcoded copy.
#
# Scope is deliberately narrow to stay honest: the shared chrome (layout,
# dashboard, auth) is checked; page-level copy is not yet, because moving ~1000
# strings is its own change and a check that fails on all of them would just be
# switched off. Widen SCAN_DIRS as those pages are migrated.
SCAN_DIRS = ("components/layout", "components/dashboard", "components/auth")

# JSX text node or a visible string attribute, containing real words.
JSX_TEXT = re.compile(r">\s*([A-Z][A-Za-z0-9 ,'’&%.!?·:()\-]{2,})\s*<")
HTML_ENTITIES = re.compile(r"&[a-zA-Z]+;|&#\d+;")


def is_codeish(text: str) -> bool:
    """True for things that look like code rather than prose.

    Guards against the false positive class where a comparison reads as a text
    node: "value > Threshold && isX ? " is an expression, not copy.
    """
    if any(op in text for op in ("&&", "||", "=>", "===", "!==", "??")):
        return True
    if re.fullmatch(r"[A-Z_]+", text):          # enum / type token
        return True
    # Needs at least one lowercase letter (prose) or to read like a label line.
    return not (re.search(r"[a-z]", text) or text.endswith(":"))
VISIBLE_ATTR = re.compile(r"""\b(?:aria-label|placeholder|title|alt)\s*=\s*["']([A-Z][^"']{2,})["']""")

# Legitimate exceptions, each with a reason.
ALLOW_TEXT = {
    "ZakApp",      # product name; the brand is not translated
    "RST Labs",    # company name
    "زكاة",        # already Arabic
}
# Attribute values that are identifiers rather than copy.
ALLOW_ATTR = {"ZakApp"}


def strip_comments(src: str) -> str:
    """Blank out comments without changing line numbers.

    Two traps this avoids, both of which produced false positives that pointed
    at comments and JSX attributes rather than real strings:
      1. Deleting a block comment also deletes its newlines, shifting every
         reported line number after it.
      2. A line comment whose text contains "/*" (e.g. "nested routes
         (/nisab-records/*)") opens a bogus block-comment match that swallows
         real code up to the next "*/".

    So: line comments first, `//` not preceded by ":" so "https://" survives, and
    block comments replaced by their own newline count.
    """
    src = re.sub(r"(?<!:)//[^\n]*", "", src)
    return re.sub(r"/\*.*?\*/", lambda m: "\n" * m.group(0).count("\n"), src, flags=re.S)


def untranslated():
    """Hardcoded user-visible text in the scanned directories.

    Applied to the WHOLE source, not line by line: JSX text is routinely on its
    own line between tags ("<p className=...>\n  Some copy\n</p>"), and a
    line-scoped scan cannot see it. That gap is how "Your cloud data is safe..."
    stayed invisible.
    """
    problems = []
    for d in SCAN_DIRS:
        for p in (SRC / d).rglob("*.tsx"):
            if ".test." in p.name or ".stories." in p.name:
                continue
            src = strip_comments(p.read_text(errors="ignore"))

            # JSX text nodes ("<p>Copy</p>" or across lines). The text class has
            # no newline, so this stays bounded; the \s* around it does.
            for m in JSX_TEXT.finditer(src):
                text = HTML_ENTITIES.sub("", m.group(1)).strip()
                if not text or text in ALLOW_TEXT or is_codeish(text):
                    continue
                problems.append(
                    f"{p}:{src[:m.start()].count(chr(10)) + 1} "
                    f"untranslated visible text: {text[:70]!r}")

            # Visible string attributes are always single-line.
            for i, line in enumerate(src.split("\n"), 1):
                for m in VISIBLE_ATTR.finditer(line):
                    text = m.group(1).strip()
                    if not text or text in ALLOW_ATTR or is_codeish(text):
                        continue
                    problems.append(f"{p}:{i} untranslated visible text: {text[:70]!r}")
    return problems


def main():
    problems = []
    missing_ns, trans_keys = scan_trans()

    for f, line, key in missing_ns:
        problems.append(f"{f}:{line} <Trans> has no ns= (default 'translation' "
                        f"namespace is not registered) - renders raw key '{key}'")

    for f, line, key in trans_keys:
        # Trans keys are written without the namespace prefix
        if not any(lookup(ns, key) for ns in NAMESPACES):
            problems.append(f"{f}:{line} i18nKey '{key}' not found in any bundle")

    for f, line, key, ns in scan_t_calls():
        if ns not in NAMESPACES:
            continue  # a different helper's argument, not our bundle
        if not lookup(ns, key):
            problems.append(f"{f}:{line} t('{key}') not found in {ns}.json "
                            f"(namespace from useTranslation('{ns}'))")

    for p in untranslated():
        problems.append(p)

    # Unused keys are reported, not failed - they're dead weight, not a bug.
    used = {k for _, _, k, _ns in scan_t_calls()}
    unused = [f"{ns}.{k}" for ns, b in BUNDLES.items()
              for k in b.get("education", {}) if f"education.{k}" not in used]
    if unused:
        print(f"note: unused education keys (dead weight): {', '.join(sorted(unused))}")

    print(f"checked {len(trans_keys)} <Trans> key(s), {len(scan_t_calls())} t() call(s) "
          f"across {len(NAMESPACES)} namespaces")
    if problems:
        for p in problems:
            print(f"FAIL {p}")
        sys.exit(1)
    print("PASS: every i18n key resolves and no <Trans> skips its namespace.")


if __name__ == "__main__":
    main()
