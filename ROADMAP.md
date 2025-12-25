# Project Ikhlas Renovation Roadmap

This roadmap prioritizes the transformation of ZakApp into a pro-grade, privacy-first, open-source Islamic financial platform.

## Phase 1: Security & Compliance (CRITICAL)
*Goal: Plug security holes and ensuring Fiqh basics are correct.*

- [ ] **Secret Purge**: Remove hardcoded `JWT_SECRET` and `ENCRYPTION_KEY` from codebase.
- [ ] **History Scrub**: Use `git filter-repo` to remove secrets from commit history.
- [ ] **Fiqh Fix**: Implement proper 401k "Net Withdrawable" logic.
- [ ] **Fiqh Fix**: Replace approximate Hijri formula with precise calendar library.

## Phase 2: Architecture Flip (The "Local-First" Migration)
*Goal: Move the "Source of Truth" from Server to Client.*

- [ ] **Client DB**: Initialize `RxDB` with `sqlite-wasm` adapter in the React app.
- [ ] **Schema Migration**: Port Prisma schema (Asset, Liability) to RxDB schemas.
- [ ] **Logic Port**: Refactor `ZakatCalculationService.ts` (Node.js) into pure TypeScript functions (`src/core/calculations/`).
- [ ] **Auth Switch**: Replace JWT auth with Local-First encryption (User Password calculates Key, no server auth required).

## Phase 3: UI/UX & Trust
*Goal: Professionalize the visual language and accessibility.*

- [ ] **Semantic Audit**: Replace `div` soup with `<article>`, `<section>`, `<form>`.
- [ ] **Accessibility**: Ensure all inputs have associated labels and error states are announced (ARIA).
- [ ] **Trust Redesign**: Implement "Project Ikhlas" visual identity (Typography, Spacing, Privacy Indicators).

## Phase 4: Open Source Polish
*Goal: Prepare for public scrutiny.*

- [ ] **License**: Add AGPL-3.0 headers to all files.
- [ ] **Contributors**: Update `CONTRIBUTING.md` with local-first guidelines.
- [ ] **Docs**: Create `architecture.md` explaining the privacy model.
