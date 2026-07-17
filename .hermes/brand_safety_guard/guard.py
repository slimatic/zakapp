#!/usr/env python3
"""brand_safety_guard.py — CI guard against client-facing brand/secret-sauce leaks.

Boris Cherny's point #2: "If Claude writes a lint rule, CI step, or routine, that
class of issue can be fully automated forever." We used to scrub AI-agent-team /
"secret sauce" / "Slim" leaks from public sites BY HAND, one release at a time.
This turns that into a permanent gate.

Scopes:
  - secret_sauce_public  -> applies EVERYWHERE we might ship (scan all doc types)
  - slim_in_client_facing -> restricted to CLIENT-FACING paths only (site/build/src/
     public/components/static). Internal planning docs (GOAL-*, ARCHITECTURE-*,
     EVALUATION-*, etc.) are legitimately "Slim" per RST convention and are excluded.

Usage:
  python3 guard.py [--root PATH] [--patterns patterns.json] [--fail-on match|warn]

`--root` may be a directory OR a single file. Exit 0 = clean, 1 = leak found.
"""
import argparse, json, os, re, sys

DEFAULT_PATTERNS = {
    "secret_sauce_public": {
        "scopes": [],  # [] = everywhere
        "regexes": [
            "AI[- ]?agent team",
            "AI[- ]?augmented",
            "autonomous AI agents?",
            "secret sauce",
            "small (human )?team",
            "\\b3-person\\b",
            "\\b30-person\\b",
            "augmented by (our )?AI",
            "we use AI agents",
        ],
    },
    "slim_in_client_facing": {
        # only client-facing surfaces; internal planning docs are exempt
        "scopes": ["site/", "builds/", "dist/", "public/", "src/", "components/", "static/", "www/"],
        "regexes": [
            # 'Slim' as a person name; internal code idents (isSlim, slim_) excluded
            "(?i)\\bSlim\\b(?![A-Za-z_])",
        ],
    },
}

DEFAULT_GLOBS = ["*.md", "*.html", "*.tsx", "*.jsx", "*.vue", "*.svelte", "*.astro", "*.json"]
DEFAULT_SKIP_DIRS = [
    ".git", "node_modules", "build", "builds", ".next", ".svelte-kit", "__pycache__", ".hermes",
]


def load_patterns(path):
    if path and os.path.exists(path):
        with open(path) as f:
            data = json.load(f)
        return (
            data.get("patterns", DEFAULT_PATTERNS),
            data.get("skip_dirs", DEFAULT_SKIP_DIRS),
            data.get("globs", DEFAULT_GLOBS),
        )
    return DEFAULT_PATTERNS, DEFAULT_SKIP_DIRS, DEFAULT_GLOBS


def _match_glob(fn, globs):
    for g in globs:
        if g.startswith("*."):
            if fn.endswith(g[1:]):
                return True
        elif fn == g:
            return True
    return False


def _in_scope(cat_scopes, rel_path):
    if not cat_scopes:
        return True
    return any(s in rel_path for s in cat_scopes)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    ap.add_argument("--patterns")
    ap.add_argument("--fail-on", default="match", choices=["match", "warn"])
    args = ap.parse_args()

    patterns, skip_dirs, globs = load_patterns(args.patterns)
    compiled = {
        cat: {"scopes": spec.get("scopes", []), "regs": [re.compile(p) for p in spec["regexes"]]}
        for cat, spec in patterns.items()
    }
    skip = set(skip_dirs)
    root = args.root
    is_file = os.path.isfile(root)

    hits = []
    if is_file:
        targets = [(os.path.dirname(root), os.path.basename(root))]
    else:
        targets = []
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in skip]
            for fn in filenames:
                if _match_glob(fn, globs):
                    targets.append((dirpath, fn))

    for dirpath, fn in targets:
        full = os.path.join(dirpath, fn)
        if fn in ("patterns.json", "guard.py") and "brand_safety_guard" in dirpath:
            continue  # don't scan our own config/files
        rel = os.path.relpath(full, root) if not is_file else fn
        try:
            with open(full, encoding="utf-8", errors="ignore") as fh:
                for i, line in enumerate(fh, 1):
                    for cat, spec in compiled.items():
                        if not _in_scope(spec["scopes"], rel):
                            continue
                        for r in spec["regs"]:
                            if r.search(line):
                                hits.append((cat, rel, i, line.strip()[:120], r.pattern))
        except OSError:
            pass

    if hits:
        print(f"\nBRAND/SECRET-SAUCE GUARD: {len(hits)} leak(s) found\n")
        for cat, rel, i, txt, pat in hits:
            print(f"  [{cat}] {rel}:{i}  matched /{pat}/")
            print(f"      > {txt}")
        print("\nFix: remove internal/secret-sauce language from client-facing surfaces,")
        print("or tune patterns.json if the match is a false positive.\n")
        if args.fail_on == "match":
            sys.exit(1)
    else:
        print("Brand/secret-sauce guard: clean.")
        sys.exit(0)


if __name__ == "__main__":
    main()
