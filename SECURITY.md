# Security Policy

This document outlines ZakApp's security practices, incident response procedures, and guidelines for responsible disclosure.

## 🔒 Secret Management Policy

### NEVER commit the following to git:

- Any `.env*` file **except** `.env.example` and `.env.*.example` files
- Cryptographic keys (`*.pem`, `*.key`, `*.p12`, `*.pfx`)
- AWS/cloud credentials (`.aws/`, `.gcp/`, `.azure/`)
- SSH keys (`.ssh/`, `id_rsa*`, `id_ed25519*`)
- Credentials files (`credentials.json`, `secrets.yml`, `token.json`)
- SQLite database files (`*.db`, `*.sqlite`)

### ✅ ALLOWED in git:

- `.env.example` — template with placeholder values only
- `.env.*.example` — environment-specific templates
- `.env.dev.example` — dev environment template

## 🚨 Secret Rotation Procedure

If secrets are ever exposed (committed to git, leaked in logs, etc.), follow this procedure **immediately**:

### Step 1: Assess Exposure
- Identify which secrets were exposed
- Determine if any production/staging instances used the leaked secrets
- Check if the commit is in git history (use `git log --all -- .env.dev`)

### Step 2: Rotate All Affected Secrets

```bash
# 1. Regenerate all secrets using the deploy script
./deploy-dev-build.sh --force-regenerate

# 2. Or manually regenerate each secret:
export JWT_SECRET=$(openssl rand -base64 32)
export JWT_REFRESH_SECRET=$(openssl rand -base64 32)
export REFRESH_SECRET=$(openssl rand -base64 32)
export ENCRYPTION_KEY=$(openssl rand -hex 32)
export APP_SECRET=$(openssl rand -base64 32)
export COUCHDB_JWT_SECRET=$(openssl rand -base64 32)
export COUCHDB_PASSWORD=$(openssl rand -base64 32)
```

### Step 3: Update All Instances
- Update `.env` files on all developer machines
- Update environment variables in CI/CD pipelines
- Update Docker secrets if running in containers
- Update deployment configurations

### Step 4: Verify No Old Secrets Remain
```bash
# Search for old secrets in git history
git log --all --oneline --source -- .env.dev

# Search for any secret patterns in the codebase
grep -r "ENCRYPTION_KEY=" . --include="*.ts" --include="*.js" --include="*.json" | grep -v "example\|node_modules"
```

### Step 5: Document the Incident
- Add an entry to this file under "Security Incidents"
- Notify all team members via your secure communication channel
- Update any affected user credentials if user data was at risk

## 📜 Security Incidents

> **On disclosure in this file.** Incident records are kept because the rotation
> procedure and the lessons are genuinely useful to self-hosters. They are written
> **without** the specifics an attacker could act on — no commit SHAs, no exact
> timestamps, no environment names, no URLs. If a future incident cannot be described
> usefully without those details, it does not belong here.

### 2026-05-02 — Development secrets committed to version control

**Severity:** Medium (development-only secrets; no production impact)

**What happened:**
- A development environment file containing auto-generated secrets was committed
- Affected secrets: JWT secret, JWT refresh secret, refresh secret, encryption key,
  application secret, CouchDB JWT secret, CouchDB password
- All were auto-generated for local development and were never used in production

**Resolution:**
- The commit was purged from history with `git filter-repo`
- The file was added to `.gitignore` to prevent recurrence
- All secrets were rotated via the deploy script
- Pre-commit hooks were updated to block environment files

**Impact:**
- No production data was at risk
- Any developer who cloned the repository during the exposure window should
  regenerate their local secrets

> **Why the specifics are omitted:** an exact commit SHA, timestamp window, or
> environment name is a map for anyone attempting to recover the old values from a
> fork or an archive. The lesson and the remediation are what matter; the coordinates
> are not.

## 🛡️ Pre-Commit Security Checks

Our pre-commit hook runs the following checks:

1. **Secret scanning** — Blocks commits containing secret patterns or `.env*` files
2. **Lint-staged** — Runs ESLint on staged files

### Bypassing (emergencies only):
```bash
git commit --no-verify  # Skips ALL pre-commit checks — use only in emergencies
```

## 🔍 CI/CD Security Scans

Our GitHub Actions run:

- **Dependency audit** — `npm audit` on every PR
- **Secret scanning** — gitleaks on every push/PR
- **Static analysis** — Semgrep, ESLint Security, CodeQL
- **Container scanning** — Trivy on Docker images (when container builds are enabled)

## 📞 Reporting Security Issues

**Please do not open a public issue for a security vulnerability.** A public report
tells everyone about the weakness before a fix exists — including people who would
use it.

Use GitHub's **private vulnerability reporting** instead:

1. Go to the **Security** tab of this repository
2. Click **Report a vulnerability**
3. Describe the issue, with reproduction steps if you have them

This opens a private advisory visible only to the maintainers. We will coordinate
disclosure timing with you and credit you in the advisory unless you prefer otherwise.

If you cannot use private reporting, open a **minimal** public issue asking for a
private channel — with **no technical detail about the vulnerability itself**.

## 🔍 What we ask of reports

- **Reproduction steps** — the minimum needed to confirm the issue
- **Affected version** — the tag or commit you tested
- **Impact** — what an attacker gains

Please **do not** test against instances you do not own or operate. If you want to
verify a finding, run ZakApp locally: the repository is self-hostable by design and
that is the appropriate environment for security research.

## 🧭 Security-relevant bug reports in public issues

Some defects are security-relevant without being vulnerabilities — for example, an
access-control setting that is not enforced, or authentication behaviour that
diverges from its configuration.

If you are unsure, **report privately**. We would rather triage a non-issue in private
than disclose a real weakness in public. Maintainers may move a public issue to a
private advisory if it turns out to have security impact.

## 🔄 Secret Rotation Schedule

| Secret | Rotation Trigger | Rotation Method |
|---|---|---|
| JWT_SECRET | Every 90 days or on exposure | `openssl rand -base64 32` |
| ENCRYPTION_KEY | On exposure only (requires data re-encryption) | `openssl rand -hex 32` |
| COUCHDB_PASSWORD | Every 90 days or on exposure | `openssl rand -base64 32` |
| APP_SECRET | Every 90 days or on exposure | `openssl rand -base64 32` |

---
*Last updated: 2026-05-03*
*Policy version: 1.0*
