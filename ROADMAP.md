# Project Ikhlas Renovation Roadmap

This roadmap prioritizes the transformation of ZakApp into a pro-grade, privacy-first, open-source Islamic financial platform.

## Phase 1: Security & Compliance (CRITICAL)
*Goal: Plug security holes and ensuring Fiqh basics are correct.*

- [x] **Secret Purge**: Remove hardcoded `JWT_SECRET` and `ENCRYPTION_KEY` from codebase.
- [x] **History Scrub**: Use `git filter-repo` to remove secrets from commit history.
- [x] **Fiqh Fix**: Implement proper 401k "Net Withdrawable" logic.
- [x] **Fiqh Fix**: Replace approximate Hijri formula with precise calendar library.

## Phase 2: Architecture Flip (The "Local-First" Migration)
*Goal: Move the "Source of Truth" from Server to Client.*

- [x] **Client DB**: Initialize `RxDB` with `sqlite-wasm` adapter in the React app.
- [x] **Logic Port**: Refactor `ZakatCalculationService.ts` (Node.js) into pure TypeScript functions (`src/core/calculations/`).
- [x] **Auth Switch**: Replace JWT auth with Local-First encryption (User Password calculates Key, no server auth required).

## Phase 3: UI/UX & Trust
*Goal: Professionalize the visual language and accessibility.*

- [x] **Semantic Audit**: Replace `div` soup with `<article>`, `<section>`, `<form>`.
- [x] **Accessibility Audit**: Ensure all forms have proper ARIA labels.
- [x] **Dashboard Visualization**: Implement donut charts for Asset Breakdown.
- [x] **Trust Signals**: Add "Encrypted locally" badges near sensitive inputs.
- [x] **Trust Redesign**: Implement "Project Ikhlas" visual identity (Typography, Spacing).

## Phase 3.5: Analytics Restoration (The "Insight" Engine)
*Goal: Restore and enhance historical visualizations using Local-First data.*

- [x] **Wealth Trend**: Implement `Recharts` Area Chart for Net Worth over time (using Snapshot history).
- [x] **Zakat Obligations**: Implement Bar Chart comparing Due vs. Paid per Nisab Year.
- [x] **Payment Distribution**: Implement Donut Chart for `RecipientCategory` breakdown.
- [x] **Asset Composition**:  Integrate existing `AssetsBreakdownChart` (Donut) into Analytics Dashboard.
- [x] **Mobile Responsiveness**: Optimize chart legends and tooltips for small screens.

## Phase 3.6: Reporting & Documentation (The "Proof" Engine)
*Goal: Generate privacy-first, printable reports for spiritual and financial auditing.*

- [x] **PDF Engine**: Integrate client-side PDF generation (e.g., `react-pdf`) ensures data never leaves device.
- [x] **Hawl Statement**: Generate official "Zakat Year Record" showing Assets, Liabilities, and Net Math.
- [x] **Payment Summary**: Exportable list of payments for tax/charity verification.
- [x] **Methodology Report**: "Why this amount?" report citing specific Fiqh rules applied (e.g., "Silver Standard used", "401k Net Rule").

## Phase 4: Open Source Polish
*Goal: Prepare for public scrutiny.*

- [x] **License**: Add AGPL-3.0 headers to all files.
- [x] **Code Cleanup**: Remove dead files (e.g., `ZakatCalculationService.ts` server-side file).
- [x] **Contributors**: Update `CONTRIBUTING.md` with local-first guidelines.
- [x] **Docs**: Create `architecture.md` explaining the privacy model.

## Phase 5: Cloud Connectivity (Multi-Device Sync)
*Goal: Enable seamless access across devices without compromising privacy.*

- [x] **Replication Plugin**: Enable RxDB Replication to a secure CouchDB/GraphQL endpoint.
- [x] **E2E Encryption Layer**: Ensure all replicated data is encrypted on-device (Host-Proof Hosting).
- [x] **Conflict Resolution**: "Last-Write-Wins" merging handled by RxDB; passwords auto-heal.

## Phase 6: Performance & Privacy (The "Responsiveness" Engine)
*Goal: Ensure the app feels instant and handles data lifecycle responsibly.*

- [x] **Realtime "Live" Sync**: Replace polling-based sync with RxDB Live Replication to ensure instant data availability and reduce network overhead on navigation.
- [x] **Secure Remote Purge**: Implement authoritative deletion where "Clear Data" ensures removal from Cloud/CouchDB immediately.
- [x] **Offline Caching Strategy**: Optimize standard browser caching to prevent re-fetching static assets.

## Phase 7: V1.0 Launch Readiness (The "Onboarding" Engine)
*Goal: Remove friction for non-expert users and ensure rock-solid privacy.*

- [x] **Knowledge Hub**: "Zakat Encyclopedia" (Static & Offline-ready) accessible via Settings/Sidebar.
- [x] **Onboarding Wizard**: Interactive first-run tutorial covering Assets, Liabilities, Nisab Records, and Payments.
- [x] **Terminology Trust**: Add rich tooltips for 'Hawl', 'Nisab' with Arabic script and simple definitions.
- [x] **Dashboard Action Cards**: Replace "Smart Navigation" with simple "Next Best Action" cards (e.g., "Add Assets" if empty).
- [x] **Date Localization**: Dual display (Gregorian/Hijri) with +/- 1 day moon adjustment settings.
- [x] **Critical Hotfix**: Resolve Profile Update issue where updating the user information like Name username and email address does not persist (User Details Persistence). Improve this.

## Phase 8: Code Cleanup (Pre-Launch Polish)
*Goal: Ensure codebase is production-ready, maintainable, and open-source quality.*

- [x] **Console Cleanup**: Replace debug `console.log` statements with structured logging (20+ files identified).
- [x] **Financial Precision**: Replace `parseFloat`/`parseInt` with Decimal.js in financial calculations.
- [x] **Large File Refactors**:
  - [x] Split `AssetForm.tsx` (850 lines) into smaller components.
  - [ ] Extract modals from `NisabYearRecordsPage.tsx` (717 lines). *(tracked in #341)*
  - [x] Extract crypto/sync logic from `AuthContext.tsx` (669 lines) to `AuthService.ts`.
- [x] **Unused Imports**: Run ESLint auto-fix to remove unused imports across all files. *(completed in v0.14.0 — AST-safe via `eslint-plugin-unused-imports`, PR #335; unused-variable triage tracked in #340)*
- [x] **TODO Resolution**: Address remaining `TODO-HASH-OF-KEY` placeholders in AuthContext.

## Phase 8.5: v0.13.0 Stability Cycle (Muharram 1448 — Oct 2026)
*Goal: Ship a stability release with zero data-loss risk on upgrade.*

- [x] **Data Safety**: Remove `db push --accept-data-loss` fallback; migration-safety regression test gates every PR (#326).
- [x] **Password Reset**: Real token flow (crypto-random, persisted, emailed) + confirm-reset endpoint (#311, #327).
- [x] **Session Invalidation**: Durable `UserSession` persistence; restart-surviving refresh rejection; real logout (#312, #328).
- [x] **Release Cadence**: Hijri moon-cycle release process documented (`docs/release-cycle.md`).

## Phase 8.6: v0.14.0 Cycle — Security Sweep, Dark Mode & Blue-Ocean Start (Sep 2026)
*Goal: zero known prod-dependency vulnerabilities, dark mode, and the first competitive-research quick win.*

- [x] **Security deps**: server prod 7→0 vulns, client prod 10→2 (residual = react-router v7-only, #339) (#332)
- [x] **Dark mode "Ikhlas Night"**: additive class-strategy theme + header toggle, zero light-mode change (#336)
- [x] **Hawl countdown milestones**: due-soon / hawl-complete urgency on the dashboard (#337)
- [x] **#320 unused imports**: AST-safe removal, eslint configs established (#335)
- [x] **A11y suite revived**: WCAG 2.1 AA jest-axe tests + heading-order fixes (#333)
- [ ] **Blue-ocean follow-ons**: multi-madhab transparency engine, retirement-account method options, family pooling *(spec needed — see zakapp-competitive-research.md)*
- [ ] **i18n foundation** (#338)

## Phase 9: Technical Debt & Stability (Post-Launch)
*Goal: Harden the development environment and ensure long-term maintainability.*

- [ ] **Unified Testing**: Migrate Server tests to `vitest` (matching Client) to remove fragile Jest/JSDOM polyfills.
- [ ] **Strict Financial Typing**: Enforce `Decimal` type across all shared interfaces to prevent `number` regression.
- [ ] **CI/CD Reliability**: Resolve `npm run build` permission issues permanently in deployment scripts.

