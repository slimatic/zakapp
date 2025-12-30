# Security Scan Instructions

Before pushing any changes or opening the repository to the public, you **MUST** run a security scan to detect any secrets (API keys, passwords, tokens) attempting to hide in the git history.

## 1. Using Gitleaks (Recommended)

Gitleaks is a fast, lightweight, and open-source secret detector for git repositories.

### Installation
```bash
# MacOS (Homebrew)
brew install gitleaks

# Linux / WSL (Docker)
docker pull zricethezav/gitleaks:latest
```

### Running the Scan
Run this command from the root of the repository:

```bash
# If installed locally
gitleaks detect --source=. -v --redact

# If using Docker
docker run -v $(pwd):/path zricethezav/gitleaks:latest detect --source="/path" -v --redact
```

**What to look for:**
- Any "FAIL" messages indicate a secret was found.
- Note the `Commit` hash and `File` path.
- These must be scrubbed using `git-filter-repo` (see Implementation Plan).

## 2. TruffleHog (Deep Scan)

TruffleHog digs deeper into commit history.

### Running with Docker
```bash
docker run -it -v "$PWD:/pwd" trufflesecurity/trufflehog:latest git file:///pwd --only-verified
```

## 3. Manual Verification (Quick Check)
Run these grep commands to catch obvious slips:

```bash
grep -rEi "api_key|secret|password|token" . --exclude-dir=node_modules --exclude-dir=.git
```
