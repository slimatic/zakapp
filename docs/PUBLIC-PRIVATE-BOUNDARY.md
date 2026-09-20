# Public vs. Private Boundary

> This repository is **public**. Anything committed here is world-readable, indexed,
> and effectively permanent — removing it later requires a history rewrite and does
> not un-publish what was already scraped.
>
> This document defines what may and may not be written into this repo, its issues,
> its pull requests, and its commit messages.

---

## The core distinction

**This repo is the open-source software. `zakapp.org` is one deployment of it.**

They are related but not the same thing, and they must not be documented as if they
were. A user who clones this repo is building *their own* instance. They do not have
our infrastructure, our hostnames, our paths, or our schedule. Documentation that
assumes otherwise is both a privacy problem and a usability problem — it tells every
self-hoster to `cd` into a directory that only exists on our server.

The project's own reference deployment is public knowledge (`zakapp.org` is the
[homepage](https://zakapp.org)) and may be named in a **"try it" / demo** context.
What must never appear is our **operational detail**: where the files live, what the
infrastructure is, what the API/sync hostnames are, or what our release timetable is.

---

## Never commit

| Category | Examples | Why |
|---|---|---|
| **Personal email** | any individual's real address | PII; harvestable; identifies the maintainer personally in a public repo |
| **Operator filesystem paths** | `~/<app-platform-dir>/<user>/services/...`, `/home/<user>/...`, NAS / app-platform app-data paths | Discloses our host layout and the maintainer's username |
| **Production infrastructure hostnames** | `api.<domain>`, `syncdb.<domain>` (internal service subdomains) | Reveals our service topology and gives attackers targets |
| **Production secrets** | `.env` contents, JWT/encryption keys, DB credentials, API keys | Direct compromise |
| **Internal cost / budget / strategy** | budgets, cost allocations, pricing, roadmaps, revenue | Commercially sensitive; not the community's business |
| **Internal agent tooling** | agent SOUL/AGENTS rules, internal CI guards, internal linting, brand-safety tooling | [Brand-safety rule]: internal RST infrastructure never goes into a public repo |
| **Named individuals in decisions** | "X confirmed…", "X decided…" | Prefer "the maintainer" / "the project"; a public project should not narrate one person's private decisions |
| **Third-party PII** | user names, emails, addresses, case details | Legal exposure |

## Safe to include

- The **project name and public domains** (`zakapp.org`, `github.com/slimatic/zakapp`)
- The **GitHub org/namespace** (`slimatic`) — public by definition
- **Generic placeholders** for anything environment-specific: `<ZAKAPP_INSTALL_DIR>`, `<YOUR_APP_HOST>`, `user@example.com`
- **Upstream documentation** for self-hosters, written path-agnostically
- **Changelog / release notes** describing the software's behaviour

---

## Test-data convention

Registration examples, screenshots, and walkthroughs are the most common accidental
leak — they look like innocuous demo output but are usually a real person's real
signup. Always use reserved/synthetic values:

| Field | Use |
|---|---|
| Email | `user@example.com`, `user+test@example.com` (`example.com` is IANA-reserved) |
| First name | `YourFirst` / `Test` |
| Username | `testuser` |

**Never** paste real output from a live registration, login, or password reset.

---

## Before you push

Run these against your diff and fix anything they surface:

```bash
# 1. Personal email / PII
git diff main...HEAD | grep -inE 'gmail|yahoo|hotmail|outlook|@[a-z0-9.-]+\.(com|net|org)' \
  | grep -vE 'example\.com|noreply|no-reply|CONTRIBUTING|LICENSE'

# 2. Secrets
git diff main...HEAD | grep -iE 'password|secret|api[_-]?key|token|private[_-]?key' \
  | grep -vE 'test|ci-|TODO|\.gitignore'

# 3. Operator paths / production hosts
git diff main...HEAD | grep -inE '/home/|~/|nas/|app-data|syncdb|api\.' \
  | grep -vE 'localhost|example\.com|YOUR_|placeholder'

# 4. Private IP ranges
git diff main...HEAD | grep -nE '192\.168\.[0-9]+\.[0-9]+|10\.[0-9]+\.[0-9]+\.[0-9]+'
```

CI additionally runs **GitGuardian** and **gitleaks** (see `.github/workflows/security-scan.yml`),
which catch credential-shaped strings. They do **not** catch PII, hostnames, or
strategy — those are on the author.

---

## For agents working in this repo

Automated contributors must apply this rule to **every surface a human will read**,
including:

- committed files (docs, scripts, config, comments)
- **pull-request titles and descriptions** — these are public pages
- **issue text and comments** — also public
- **commit messages** — permanent in history

Do not paste internal working notes, budgets, iteration counts, agent directives,
or infrastructure detail into any of them. When referencing the maintainer, write
"the maintainer". When referring to a deployment, write `<YOUR_APP_HOST>` or
"our reference deployment" — never the real internal hostname.

---

*Last reviewed: 2026-09-20 — after a sweep found and removed personal email
addresses, operator install paths, and production service hostnames that had
accumulated in tracked documentation.*
