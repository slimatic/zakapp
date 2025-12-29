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
