# Phase 2 — Tasks

1. Backend — Data & API
  - Add `calculationModifier`, `isPassiveInvestment`, `isRestrictedAccount` columns to `assets` (Prisma + migration).
  - Add `NisabRecord` model and migration.
  - Update `AssetService.decryptAsset` to include `acquisitionDate` and `suggestedPassiveDefault` in API responses.
  - Update `AssetService.updateAsset` to accept `isPassiveInvestment` and `isRestrictedAccount` and derive `calculationModifier` server-side.
  - Add server validation: `isPassiveInvestment` cannot be true if `isRestrictedAccount` is true.
  - Add migration helper to convert `Yearly Snapshot` -> `NisabRecord` (optional).

2. Frontend — UI & UX
  - Update asset edit dialog component to render visible checkbox under asset value with label and tooltip.
  - Wire checkbox to `isPassiveInvestment` and display suggested default from `suggestedPassiveDefault`.
  - Add `Restricted/Inaccessible Account?` checkbox where applicable; disable passive when restricted.
  - Implement live recalculation preview (debounced) showing zakatable amount and Zakat owed.
  - Ensure asset save re-fetches asset and updates UI state.

3. Tests
  - Unit tests for `assetModifiers` logic (0.0, 0.3, 1.0 combinations).
  - Integration tests for GET/PUT Asset API (including validation rules).
  - E2E tests for asset dialog: visibility, toggle behavior, and persistence.
  - Migration test for `NisabRecord` creation and historical preservation.

4. Docs
  - Update spec (done), quickstart, and user docs explaining modifier UX and Nisab Records.

5. Rollout
  - Feature-flag the UI change behind `feature.modifierVisibility`.
  - Monitor crash/error rate and user behavior events for 2 weeks post-release.
# Tasks: Dynamic Asset Eligibility Checkboxes for Zakat Calculation

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/assets-api.md`

## Format: `[ID] [P?] [Story] Description`
- `[P]` = can run in parallel (different files, no dependencies)
- `[Story]` = US1, US2, US3, US4, or FND (foundational)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)
- [X] T001 [P] [FND] Confirm branch `021-experimental-feature-update` checked out and install deps in `shared/`, `server/`, `client/` (`npm install`) for consistent builds.

---

## Phase 2: Foundational (Blocking Prerequisites)
- [X] T010 [FND] Update Prisma schema with modifier fields in `server/prisma/schema.prisma`; generate migration `add_asset_modifiers` and run `prisma generate`.
- [X] T011 [P] [FND] Add modifier constants/types to `shared/src/types/asset.ts` (CalculationModifier enum, PASSIVE_INVESTMENT_TYPES, RESTRICTED_ACCOUNT_TYPES, DTO fields); run `shared` build.
- [X] T012 [P] [FND] Propagate shared build outputs to `server`/`client` (update imports or path aliases if needed) to ensure new types resolve.

**Checkpoint**: Foundation ready (schema + shared types) — user stories may proceed.

---

## Phase 3: User Story 1 - Passive Investment Zakat Calculation (Priority: P1)
**Goal**: Apply 30% rule for passive Stock/ETF/Mutual Fund assets and surface in calculation flows.
**Independent Test**: Stock asset with passive checkbox checked → zakatable = 30% value → Zakat owed 2.5% of that amount.

### Tests (write first)
- [X] T020 [P] [US1] Add backend unit tests for modifier utilities and 30% calculation in `server/src/__tests__/utils/assetModifiers.test.ts`.
- [X] T021 [P] [US1] Add backend integration test covering POST/PUT `/api/assets` passive flag and zakat response in `server/src/__tests__/integration/assets.passive.test.ts`.
- [X] T022 [P] [US1] Add frontend component test for passive checkbox visibility/behavior in `client/src/components/assets/__tests__/AssetForm.passive.test.tsx`.

### Implementation
- [X] T030 [US1] Create backend modifier utilities `server/src/utils/assetModifiers.ts` (determineModifier, calculateZakatableAmount, calculateAssetZakat, getModifierLabel).
- [X] T031 [US1] Update validation schema to allow passive flag only on Stock/ETF/Mutual Fund in `server/src/middleware/validators/assetValidator.ts`.
- [X] T032 [US1] Update `server/src/services/assetService.ts` to derive `calculationModifier` via determineModifier and persist on create/update.
- [X] T033 [US1] Update `server/src/services/zakatService.ts` to apply modifiers in totals and return modifierApplied metadata.
- [X] T034 [US1] Update `server/src/controllers/assetController.ts` responses to include zakatInfo with modifierApplied and zakatableAmount.
- [X] T035 [P] [US1] Add GET filter support for `modifierType=passive` in `server/src/routes/assetRoutes.ts` (or controller layer) per contracts.
- [X] T036 [P] [US1] Add shared/frontend type exports for modifiers in `client/src/types/asset.types.ts`.
- [X] T037 [P] [US1] Add frontend modifier helpers (`shouldShowPassiveCheckbox`, `getModifierBadge`) in `client/src/utils/assetModifiers.ts`.
- [X] T038 [US1] Update `client/src/components/assets/AssetForm.tsx` to render passive checkbox for Stock/ETF/Mutual Fund, default unchecked, disable when restricted.
- [X] T039 [P] [US1] Update `client/src/components/assets/AssetCard.tsx` (and calculation summary view if separate) to display modifier badge/status and zakatable amount using modifier.

**Checkpoint**: Passive investment flow works end-to-end and tests passing.

---

## Phase 4: User Story 2 - Restricted Account Accessibility Exception (Priority: P2)
**Goal**: Restricted retirement accounts (401k, Traditional IRA, Pension) default to 0% zakatable when marked inaccessible.
**Independent Test**: 401k asset with restricted checkbox checked → zakatable = 0 regardless of value.

### Tests (write first)
- [ ] T050 [P] [US2] Add backend integration test for restricted defaults and recalculation in `server/src/__tests__/integration/assets.restricted.test.ts`.
- [ ] T051 [P] [US2] Add frontend component test for restricted checkbox default/visibility in `client/src/components/assets/__tests__/AssetForm.restricted.test.tsx`.

### Implementation
- [ ] T060 [US2] Extend validation schema in `server/src/middleware/validators/assetValidator.ts` to enforce restricted flag only for 401k/Traditional IRA/Pension and mutual exclusivity with passive.
- [ ] T061 [US2] Update `server/src/services/assetService.ts` to default restricted retirement assets to `isRestrictedAccount=true` and modifier 0.0 on create.
- [ ] T062 [US2] Update `server/src/services/zakatService.ts` and controller logic to ensure restricted assets contribute $0 but remain listed.
- [ ] T063 [P] [US2] Update GET `/api/assets` filter handling for `modifierType=restricted` in routes/controller.
- [ ] T064 [US2] Update `client/src/components/assets/AssetForm.tsx` to show restricted checkbox for 401k/Traditional IRA/Pension with default checked and to clear passive flag when restricted is true.
- [ ] T065 [P] [US2] Ensure frontend API client `client/src/services/assetApi.ts` sends/receives modifier fields per contracts.

**Checkpoint**: Restricted accounts flow works independently and tests passing.

---

## Phase 5: User Story 3 - Roth IRA with Optional 30% Rule (Priority: P3)
**Goal**: Accessible Roth IRA supports both modifiers; restricted Roth IRA disables passive option.
**Independent Test**: Accessible Roth IRA → can toggle passive; restricted Roth IRA → passive disabled and zakatable 0%.

### Tests (write first)
- [ ] T080 [P] [US3] Add backend integration test for Roth IRA accessibility + passive interplay in `server/src/__tests__/integration/assets.rothira.test.ts`.
- [ ] T081 [P] [US3] Add frontend component/integration test for Roth IRA checkbox enabling/disabling in `client/src/components/assets/__tests__/AssetForm.rothira.test.tsx`.

### Implementation
- [ ] T090 [US3] Update checkbox visibility/disable logic in `client/src/components/assets/AssetForm.tsx` and `client/src/utils/assetModifiers.ts` to support dual checkboxes for Roth IRA and enforce disable when restricted.
- [ ] T091 [US3] Ensure `determineModifier` logic in `server/src/utils/assetModifiers.ts` prioritizes restricted over passive and handles Roth IRA flags; adjust service validation as needed.
- [ ] T092 [US3] Update calculation summaries/UI badges to reflect Roth IRA modifier selection in `client/src/components/assets/AssetCard.tsx` (and any summary components) using existing badge helper.

**Checkpoint**: Roth IRA flows function and tests passing.

---

## Phase 6: User Story 4 - Educational Context and Transparency (Priority: P3)
**Goal**: Tooltips/badges explain scholarly basis and modifier status.
**Independent Test**: Info icon displays text from spec for each checkbox; badges visible in summary.

### Tests (write first)
- [ ] T110 [P] [US4] Add frontend test for tooltip content and accessibility (aria/keyboard) in `client/src/components/common/__tests__/InfoTooltip.modifiers.test.tsx`.

### Implementation
- [ ] T120 [US4] Add guidance content strings to `client/src/content/zakatGuidance.ts` per spec/research (passive and restricted explanations, Simple Zakat Guide reference).
- [ ] T121 [US4] Wire `InfoTooltip` into checkbox renders in `client/src/components/assets/AssetForm.tsx` with proper aria labels and mobile-friendly trigger.
- [ ] T122 [P] [US4] Ensure modifier badges shown in Zakat summary/list views include labels (`30% Rule Applied`, `Deferred - Restricted`, `Full Value`) with accessible text.

**Checkpoint**: Educational context visible and accessible.

---

## Phase 7: Polish & Cross-Cutting
- [ ] T130 [P] [FND] Add snapshot persistence for modifier fields in `server/src/services/snapshotService.ts` (or equivalent) and Prisma queries to populate `AssetSnapshot` fields.
- [ ] T131 [P] [FND] Add migration/DB constraint verification tests or scripts in `server/prisma/migrations/*/migration.sql` if missing checks.
- [ ] T132 [P] [FND] Update API docs if auto-generated references exist in `docs/api/` or `docs/` to reflect modifier fields.
- [ ] T133 [P] [FND] Run full test suites (`server`, `client`, E2E) and fix any regressions; ensure coverage targets met for modifier logic.
- [ ] T134 [P] [FND] Accessibility audit for new checkboxes/tooltips (WCAG 2.1 AA) using `scripts/accessibility-audit.sh` or manual checklist.
- [ ] T135 [P] [FND] Performance check on Zakat calculation (<100ms for 50 assets) and UI update (<200ms) per plan; optimize if needed.

---

## Dependencies & Execution Order
- Phase 1 → Phase 2 → User stories. Foundational tasks T010–T012 block all user stories.
- US1 (P1) should complete before US2/US3 to keep modifier logic consistent.
- US2 depends on foundational work; may run in parallel with US1 UI work only once shared schema/types ready.
- US3 depends on US1 + US2 logic (shared flags and priority rules).
- US4 can start after checkbox rendering exists (US1/US2).
- Polish tasks run after user stories complete.
