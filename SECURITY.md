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

### 2026-05-02 — Dev Environment Secrets Committed to Git

**Severity:** Medium (dev-only secrets, no production impact)

**What happened:**
- Commit `ad34d00a` accidentally included `.env.dev` containing auto-generated development secrets
- Secrets included: JWT_SECRET, JWT_REFRESH_SECRET, REFRESH_SECRET, ENCRYPTION_KEY, APP_SECRET, COUCHDB_JWT_SECRET, COUCHDB_PASSWORD

**Resolution:**
- Commit was removed from history via `git filter-repo` on 2026-05-03
- `.env.dev` added to `.gitignore` to prevent re-commit
- All secrets were rotated by running `deploy-dev-build.sh --force-regenerate`
- Pre-commit hooks updated to block `.env*` files (except examples)

**Impact:**
- No production data was at risk (secrets were auto-generated for local development)
- Any developer who cloned the repo between 22:37-23:24 UTC on May 2 should run `./deploy-dev-build.sh --force-regenerate`

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

If you discover a security vulnerability in ZakApp:

1. **DO NOT** open a public issue
2. Email `security@zakapp.dev` with details
3. Include reproduction steps if applicable
4. Allow up to 72 hours for acknowledgment
5. We will coordinate disclosure timing with you

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
