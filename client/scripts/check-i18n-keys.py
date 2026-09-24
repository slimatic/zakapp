"""Every i18n key must resolve, and no <Trans> may skip its namespace.

Why: the i18n config registers exactly two namespaces (`onboarding`,
`dashboard`) and sets no `defaultNS`. React-i18next's default namespace is
`translation`, which does not exist here - so a `<Trans i18nKey="...">` written
without `ns=` resolves nothing and i18next falls back to printing the raw key.
That shipped: the dashboard's education module rendered "education.whatIsZakat"
as a visible heading, in English, for every user.

Two checks:
  1. No `<Trans>` without an `ns=` attribute. (Any such use is broken given the
     config above - this is the check that would have caught the raw key.)
  2. Every `i18nKey="X.Y"` and `t('X.Y')` resolves in the English bundle.

Ponytail: checks (1) and (2) are source-level greps, not a render test, because
the failure is structural - it can never depend on runtime state. Revisit if the
project ever adds a `translation` namespace or sets `defaultNS`.
"""
import json
import pathlib
import re
import sys

SRC = pathlib.Path(__file__).resolve().parents[1] / "src"
EN = SRC / "i18n" / "locales" / "en"

# Namespaces actually registered in src/i18n/index.ts
NAMESPACES = ["dashboard", "onboarding"]
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
    """(file, line, key) for every <Trans> without ns=, and every <Trans> key."""
    missing_ns, keys = [], []
    for p in SRC.rglob("*.tsx"):
        if ".test." in p.name or ".stories." in p.name:
            continue
        for i, line in enumerate(p.read_text(errors="ignore").split("\n"), 1):
            if "<Trans" not in line or NOT_TRANS.search(line):
                continue
            m = re.search(r'i18nKey="([^"]+)"', line)
            if "ns=" not in line:
                missing_ns.append((str(p), i, m.group(1) if m else "?"))
            if m:
                keys.append((str(p), i, m.group(1)))
    return missing_ns, keys


def scan_t_calls():
    """t('namespace.key') / t("namespace.key") calls."""
    out = []
    pat = re.compile(r"""\bt\(\s*['"]([a-zA-Z0-9_]+\.[a-zA-Z0-9_.]+)['"]""")
    for p in SRC.rglob("*.tsx"):
        if ".test." in p.name or ".stories." in p.name:
            continue
        for i, line in enumerate(p.read_text(errors="ignore").split("\n"), 1):
            for m in pat.finditer(line):
                out.append((str(p), i, m.group(1)))
    return out


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

    for f, line, full in scan_t_calls():
        ns, _, key = full.partition(".")
        if ns not in NAMESPACES:
            continue  # a different helper's argument, not our bundle
        if not lookup(ns, key):
            problems.append(f"{f}:{line} t('{full}') not found in {ns}.json")

    # Unused keys are reported, not failed - they're dead weight, not a bug.
    used = {k for _, _, k in trans_keys}
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
