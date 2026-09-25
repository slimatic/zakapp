#!/usr/bin/env python3
"""Fail if the app would send mail from a domain that does not resolve.

WHY THIS EXISTS
    `EmailService` defaulted its From: address to 'noreply@zakapp.io', hardcoded four times.
    `zakapp.io` is NOT REGISTERED - it publishes no nameservers and no A record - so any mail
    sent from it cannot align with an SPF record and is treated as a spoofed sender. The app
    itself lives on zakapp.org, which has working sending infrastructure:
        resend._domainkey.zakapp.org  TXT   (Resend DKIM)
        send.zakapp.org               TXT   (SPF include:amazonses.com)
    A broken default is invisible in normal operation: with SMTP_FROM set in production it
    never fires, and it only bites the self-hoster who configured nothing - exactly the person
    an open-source project cannot afford to break.

WHAT IT CHECKS
    Every email-domain literal in the server source must be a domain that actually resolves.
    Comments are ignored (the history note about zakapp.io is deliberate documentation).

CEILING
    Source-level, so it catches the literal, not a domain assembled at runtime from parts, and
    it treats a domain that resolves as acceptable without verifying its SPF/DKIM. That is the
    right depth here: the failure mode observed was a dead domain, not a misconfigured live one.
    ponytail: no DNS caching - three lookups, ~1s. Add a cache if this ever runs per-request.

Exit 0 = every sender domain resolves, 1 = at least one does not.
"""

import os
import re
import socket
import sys

# Only domains used as a mail sender. Deliberately narrow: a broad domain sweep over the whole
# server tree would flag example.com in docs and third-party URLs that are none of our business.
SENDER = re.compile(r"['\"](?:noreply|no-reply|support|hello|admin|info)@([a-z0-9.-]+\.[a-z]{2,})['\"]", re.I)

# Reserved TLDs (RFC 2606 / RFC 6761) and .local (RFC 6762). Addresses on these are legal test
# fixtures and are MEANT not to resolve - `admin@zakapp.local` is a seeded test user. Flagging
# them would be a false positive that trains people to ignore the check.
RESERVED_TLDS = (".local", ".test", ".invalid", ".example")
RESERVED_DOMAINS = ("example.com", "example.org", "example.net", "localhost")

def source_root() -> str:
    here = os.path.dirname(os.path.abspath(__file__))
    # client/scripts/ -> repo root -> server/src
    return os.path.join(os.path.dirname(os.path.dirname(here)), "server", "src")

def is_reserved(domain: str) -> bool:
    """Reserved for documentation/tests and expected NOT to resolve."""
    d = domain.lower()
    return d.endswith(RESERVED_TLDS) or d in RESERVED_DOMAINS

def resolves(domain: str) -> bool:
    try:
        socket.getaddrinfo(domain, None)
        return True
    except socket.gaierror:
        return False

def main() -> int:
    root = source_root()
    if not os.path.isdir(root):
        print(f"FAIL: cannot find server source at {root}")
        return 1

    found: dict[str, list[str]] = {}
    for dirpath, _dirnames, filenames in os.walk(root):
        for fn in filenames:
            if not fn.endswith((".ts", ".tsx", ".js")):
                continue
            path = os.path.join(dirpath, fn)
            try:
                with open(path, encoding="utf-8", errors="replace") as fh:
                    for n, line in enumerate(fh, 1):
                        stripped = line.lstrip()
                        if stripped.startswith(("*", "//", "/*")):
                            continue
                        for m in SENDER.finditer(line):
                            rel = os.path.relpath(path, os.path.dirname(root))
                            found.setdefault(m.group(1).lower(), []).append(f"{rel}:{n}")
            except OSError:
                continue

    if not found:
        print("FAIL: no sender address found at all - the check has gone stale, not the code")
        return 1

    dead = []
    for domain, where in sorted(found.items()):
        if is_reserved(domain):
            print(f"  SKIP {domain:20} (reserved test/doc domain, e.g. {where[0]})")
            continue
        ok = resolves(domain)
        print(f"  {'OK  ' if ok else 'DEAD'} {domain:20} ({len(where)} use(s), e.g. {where[0]})")
        if not ok:
            dead.append(domain)

    if dead:
        print(f"\nFAIL: {len(dead)} sender domain(s) do not resolve: {', '.join(dead)}")
        print("  Mail from an unresolvable domain fails SPF alignment and reads as spoofed.")
        return 1
    print("\nPASS: every sender domain in the server source resolves.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
