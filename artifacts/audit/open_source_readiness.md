# Open Source Readiness Audit

## 1. Executive Summary
The codebase is currently **NOT READY** for public release. It contains significant security risks (hardcoded secrets in commit history) and lacks the necessary documentation and community guidelines for a healthy open source project.

## 2. Blockers for Release

### 2.1 Secrets in Code (Critical)
- **Issue**: Hardcoded `JWT_SECRET` and `ENCRYPTION_KEY` fallbacks exist in `server/src`.
- **Action**: 
    1.  Remove all hardcoded secrets.
    2.  Use tools like BFG Repo-Cleaner or `git filter-repo` to scrub history before public push.
    3.  Implement `.env.example` with benign defaults for dev.

### 2.2 Intellectual Property & Licensing
- **Issue**: `package.json` lists "zakapp contributors".
- **Action**: Define the specific license (e.g., AGPL-3.0 for webapps) clearly in `LICENSE` file. Add license headers to source files.

### 2.3 Dependency Chain
- **Issue**: Reliance on proprietary or server-heavy stacks (Prisma/Redis) creates a high barrier to entry for self-hosters.
- **Action**: Moving to a Static PWA + Client DB (Local-First) significantly lowers the barrier for users to "Run their own instance" (just hosting static files).

## 3. Code Quality & Refactoring
- **Issue**: `ZakatCalculationService.ts` is a "God Class" handling data fetching, caching, and business logic.
- **Action**: Break into:
    - `src/core/zakat/nisab.ts` (Pure math)
    - `src/core/zakat/assets.ts` (Pure math)
    - `src/data/repository/` (Data access)

## 4. Documentation Gaps
- **Missing**:
    - `ARCHITECTURE.md`: Explaining the Local-First "Source of Truth" model.
    - `SECURITY.md`: Reporting vulnerability policy.
    - `CONTRIBUTING.md`: Update to forbid hardcoded secrets and enforce semantic HTML.
