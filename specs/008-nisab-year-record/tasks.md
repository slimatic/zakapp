# Tasks: Nisab Year Record Workflow Fix

**Input**: Design documents from `/home/lunareclipse/zakapp/specs/008-nisab-year-record/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: TypeScript + React + Express + SQLite + Prisma stack
2. Load optional design documents:
   → data-model.md: 4 entities (NisabYearRecord, AuditTrailEntry, PreciousMetalPrice, HawlTracker)
   → contracts/: 8 endpoints in nisab-year-records.openapi.yaml
   → research.md: 5 technology decisions (Hijri calendar, metals API, audit trails, live tracking, migration)
   → quickstart.md: 7 test scenarios (~90 min)
3. Generate tasks by category:
   → Setup: Dependencies (moment-hijri, axios)
   → Tests: Contract tests, integration tests (TDD)
   → Database: Prisma migration, new tables
   → Services: 5 new services (Nisab, Hawl, Wealth, Audit, Record)
   → Background: Hawl detection job
   → API: 8 endpoints
   → Frontend: 7 new components + 3 updated pages
   → Testing: 7 quickstart scenarios
   → Documentation: API docs, user guide
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Total tasks: 68 (numbered T001-T068)
6. Dependencies: Database → Services → Jobs → API → Frontend
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Backend**: `server/src/`, `server/prisma/`, `server/tests/`
- **Frontend**: `client/src/`, `client/tests/`
- **Shared**: `shared/src/`

## Phase 3.1: Setup
- [x] T001 Install moment-hijri dependency (`npm install moment-hijri` in server/)
- [x] T002 Install moment-hijri types (`npm install --save-dev @types/moment-hijri` in server/)
- [x] T003 Configure metals-api.com client in server/src/config/preciousMetalsApi.ts
- [x] T004 Add environment variable METALS_API_KEY to .env.example and deployment docs
- [x] **🔸 COMMIT CHECKPOINT**: Commit setup milestone with dependencies and configuration

## Phase 3.2: Database Migration
- [x] T005 Create Prisma migration: Rename yearly_snapshots to nisab_year_records (server/prisma/migrations/)
- [x] T006 Create Prisma migration: Add Hawl tracking fields (hawlStartDate, hawlCompletionDate, nisabBasis, etc.)
- [x] T007 Create Prisma migration: Create audit_trail_entries table
- [x] T008 Create Prisma migration: Create precious_metal_prices table
- [x] T009 Create Prisma migration: Update status enum values (draft/finalized → DRAFT/FINALIZED/UNLOCKED)
- [x] T010 Create Prisma migration: Add indexes for hawlStartDate, hawlCompletionDate, auditTrail
- [x] T011 Write data transformation script for existing records (server/prisma/migrations/transform-nisab-records.ts)
- [x] T012 Test migration rollback capability (verify down.sql or manual rollback)
- [x] T013 Generate Prisma Client and verify schema (`npx prisma generate`)
- [ ] **🔸 COMMIT CHECKPOINT**: Commit database migration complete

## Phase 3.3: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.4
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (API Endpoints)
- [ ] T014 [P] Contract test GET /api/nisab-year-records in server/tests/contract/nisabYearRecords.get.test.ts
- [ ] T015 [P] Contract test POST /api/nisab-year-records in server/tests/contract/nisabYearRecords.post.test.ts
- [ ] T016 [P] Contract test GET /api/nisab-year-records/:id in server/tests/contract/nisabYearRecords.getById.test.ts
- [ ] T017 [P] Contract test PUT /api/nisab-year-records/:id in server/tests/contract/nisabYearRecords.put.test.ts
- [ ] T018 [P] Contract test DELETE /api/nisab-year-records/:id in server/tests/contract/nisabYearRecords.delete.test.ts
- [ ] T019 [P] Contract test POST /api/nisab-year-records/:id/finalize in server/tests/contract/nisabYearRecords.finalize.test.ts
- [ ] T020 [P] Contract test POST /api/nisab-year-records/:id/unlock in server/tests/contract/nisabYearRecords.unlock.test.ts

### Service Layer Tests
- [ ] T021 [P] Unit tests for NisabCalculationService in server/tests/unit/services/nisabCalculationService.test.ts
- [ ] T022 [P] Unit tests for HawlTrackingService in server/tests/unit/services/hawlTrackingService.test.ts
- [ ] T023 [P] Unit tests for WealthAggregationService in server/tests/unit/services/wealthAggregationService.test.ts
- [ ] T024 [P] Unit tests for AuditTrailService in server/tests/unit/services/auditTrailService.test.ts
- [ ] T025 [P] Unit tests for NisabYearRecordService in server/tests/unit/services/nisabYearRecordService.test.ts

### Integration Tests
- [ ] T026 [P] Integration test: Nisab achievement detection in server/tests/integration/hawlDetection.test.ts
- [ ] T027 [P] Integration test: Live wealth tracking in server/tests/integration/liveTracking.test.ts
- [ ] T028 [P] Integration test: Hawl interruption (wealth drop) in server/tests/integration/hawlInterruption.test.ts
- [ ] T029 [P] Integration test: Finalization workflow in server/tests/integration/finalization.test.ts
- [ ] T030 [P] Integration test: Unlock/edit/refinalize in server/tests/integration/unlockEdit.test.ts
- [ ] T031 [P] Integration test: Status transition validation in server/tests/integration/statusTransitions.test.ts
- [ ] T032 [P] Integration test: Invalid operations (error handling) in server/tests/integration/invalidOperations.test.ts

### Frontend Component Tests
- [ ] T033 [P] Component test for HawlProgressIndicator in client/tests/components/HawlProgressIndicator.test.tsx
- [ ] T034 [P] Component test for NisabComparisonWidget in client/tests/components/NisabComparisonWidget.test.tsx
- [ ] T035 [P] Component test for FinalizationModal in client/tests/components/FinalizationModal.test.tsx
- [ ] T036 [P] Component test for UnlockReasonDialog in client/tests/components/UnlockReasonDialog.test.tsx
- [ ] T037 [P] Component test for AuditTrailView in client/tests/components/AuditTrailView.test.tsx

- [ ] **🔸 COMMIT CHECKPOINT**: Commit TDD test suite (all tests must be failing)

## Phase 3.4: Core Implementation (ONLY after tests are failing)

### Shared Types Update
- [ ] T038 Update shared types: Rename YearlySnapshot → NisabYearRecord in shared/src/types/nisabYearRecord.ts
- [ ] T039 Add Hawl tracking types (HawlStatus, NisabBasis, RecordStatus) in shared/src/types/hawl.ts
- [ ] T040 Add AuditTrailEntry type in shared/src/types/auditTrail.ts

### Service Layer Implementation
- [ ] T041 [P] Implement NisabCalculationService in server/src/services/nisabCalculationService.ts
  - Fetch gold/silver prices from metals-api.com
  - Calculate Nisab thresholds (87.48g gold, 612.36g silver)
  - Cache prices in precious_metal_prices table (24-hour TTL)
  - Handle API failures with cache fallback

- [ ] T042 [P] Implement HawlTrackingService in server/src/services/hawlTrackingService.ts
  - Detect Nisab achievement from aggregate wealth
  - Calculate Hawl start/completion dates (Hijri + Gregorian)
  - Create DRAFT NisabYearRecord automatically
  - Handle Hawl interruption (wealth drops below Nisab)

- [ ] T043 [P] Implement WealthAggregationService in server/src/services/wealthAggregationService.ts
  - Sum all zakatable assets for user
  - Calculate current Zakat amount (2.5%)
  - Compare with Nisab threshold
  - Performance target: <100ms for 500 assets

- [ ] T044 [P] Implement AuditTrailService in server/src/services/auditTrailService.ts
  - Record unlock events (with reason, min 10 chars)
  - Record edit events (with changes summary)
  - Record refinalize events
  - Append-only, immutable logs
  - Encrypt sensitive fields (reason, changes, before/after state)

- [ ] T045 Update NisabYearRecordService in server/src/services/nisabYearRecordService.ts
  - Rename from SnapshotService
  - Implement status transition validation (DRAFT→FINALIZED, FINALIZED→UNLOCKED, UNLOCKED→FINALIZED)
  - Add finalize() method with Hawl completion check
  - Add unlock() method with audit trail
  - Add live tracking for DRAFT records (no persistence)

### Background Jobs
- [ ] T046 Implement hawlDetectionJob in server/src/jobs/hawlDetectionJob.ts
  - Run hourly via node-cron
  - Check all users' aggregate wealth
  - Detect Nisab achievement (create DRAFT record)
  - Detect Hawl interruptions (mark records)
  - Performance target: <30s completion

- [ ] T047 Add hawlDetectionJob to scheduler in server/src/jobs/index.ts
  - Configure cron expression (hourly: '0 * * * *')
  - Add error handling and logging
  - Add manual trigger endpoint for testing

### API Endpoints (Routes & Controllers)
- [ ] T048 Rename routes file: server/src/routes/snapshots.ts → server/src/routes/nisabYearRecords.ts
- [ ] T049 Update route registration in server/src/routes/index.ts

- [ ] T050 Implement GET /api/nisab-year-records in server/src/routes/nisabYearRecords.ts
  - List all records for user
  - Filter by status (DRAFT/FINALIZED/UNLOCKED/ALL)
  - Filter by year
  - Include live tracking for DRAFT records

- [ ] T051 Implement POST /api/nisab-year-records in server/src/routes/nisabYearRecords.ts
  - Create new DRAFT record
  - Validate hawlStartDate < hawlCompletionDate
  - Calculate Nisab threshold if not provided
  - Encrypt sensitive fields

- [ ] T052 Implement GET /api/nisab-year-records/:id in server/src/routes/nisabYearRecords.ts
  - Return record details
  - Include audit trail
  - Include live tracking for DRAFT
  - Decrypt sensitive fields

- [ ] T053 Implement PUT /api/nisab-year-records/:id in server/src/routes/nisabYearRecords.ts
  - Update record with status transition validation
  - Require unlock reason for UNLOCKED transition
  - Create audit trail entry for edits
  - Encrypt updated fields

- [ ] T054 Implement DELETE /api/nisab-year-records/:id in server/src/routes/nisabYearRecords.ts
  - Only allow DRAFT records
  - Return descriptive error for FINALIZED/UNLOCKED
  - Cascade delete audit trail entries

- [ ] T055 Implement POST /api/nisab-year-records/:id/finalize in server/src/routes/nisabYearRecords.ts
  - Validate Hawl completion (today >= hawlCompletionDate)
  - Allow override with acknowledgePremature flag
  - Set finalizedAt timestamp
  - Create FINALIZED audit trail entry

- [ ] T056 Implement POST /api/nisab-year-records/:id/unlock in server/src/routes/nisabYearRecords.ts
  - Require unlock reason (min 10 characters)
  - Validate current status is FINALIZED
  - Create UNLOCKED audit trail entry with reason
  - Return record + audit entry

- [ ] **🔸 COMMIT CHECKPOINT**: Commit backend implementation complete (tests should now pass)

## Phase 3.5: Frontend Implementation

### API Client Update
- [ ] T057 Update nisabYearRecordApi.ts in client/src/api/nisabYearRecordApi.ts
  - Rename from snapshotApi
  - Add finalize() endpoint call
  - Add unlock() endpoint call
  - Update types for Hawl fields

### Custom Hooks
- [ ] T058 [P] Create useHawlStatus hook in client/src/hooks/useHawlStatus.ts
  - Poll for live tracking updates (5-second interval)
  - Calculate daysRemaining, isHawlComplete
  - Debounce rapid updates (300ms)
  - Show "Updating..." indicator

- [ ] T059 [P] Create useNisabThreshold hook in client/src/hooks/useNisabThreshold.ts
  - Fetch current Nisab threshold from API
  - Cache with 24-hour TTL (React Query)
  - Handle stale price warnings (>7 days)

### React Components
- [ ] T060 [P] Create HawlProgressIndicator component in client/src/components/HawlProgressIndicator.tsx
  - Display countdown to Hawl completion
  - Show progress bar (days elapsed / 354)
  - Hijri + Gregorian dates
  - "Live" badge for DRAFT records

- [ ] T061 [P] Create NisabComparisonWidget component in client/src/components/NisabComparisonWidget.tsx
  - Display current wealth vs Nisab threshold
  - Percentage above/below Nisab
  - Visual bar chart
  - Color-coded (green if above, red if below)

- [ ] T062 [P] Create FinalizationModal component in client/src/components/FinalizationModal.tsx
  - Review screen with wealth summary
  - Zakat amount calculation breakdown
  - Premature finalization warning (if Hawl not complete)
  - Confirm/cancel buttons
  - Loading state during API call

- [ ] T063 [P] Create UnlockReasonDialog component in client/src/components/UnlockReasonDialog.tsx
  - Text area for unlock reason (min 10 chars)
  - Character counter
  - Validation error display
  - Submit/cancel buttons
  - Accessible (WCAG 2.1 AA)

- [ ] T064 [P] Create AuditTrailView component in client/src/components/AuditTrailView.tsx
  - Timeline visualization
  - Event type badges (UNLOCKED, EDITED, REFINALIZED)
  - Timestamp display (relative + absolute)
  - Unlock reason display
  - Changes summary with diff view
  - Collapsible details

### Page Updates
- [ ] T065 Update NisabYearRecordsPage in client/src/pages/NisabYearRecordsPage.tsx
  - Rename from SnapshotsPage
  - Integrate HawlProgressIndicator
  - Integrate NisabComparisonWidget
  - Add finalization button with modal
  - Add unlock button with dialog
  - Show audit trail for finalized records
  - Filter by status tabs (All/Draft/Finalized/Unlocked)

- [ ] T066 Update Dashboard in client/src/pages/Dashboard.tsx
  - Add "Hawl in progress: X days remaining" message
  - Add Hawl progress indicator widget
  - Add wealth comparison widget
  - Handle no active Hawl state
  - Link to Nisab Year Records page

- [ ] **🔸 COMMIT CHECKPOINT**: Commit frontend implementation complete

## Phase 3.6: Validation & Testing

### Quickstart Scenarios (Manual Testing)
- [ ] T067 Execute quickstart.md Scenario 1: First-time Nisab achievement & Hawl start (~10 min)
- [ ] T068 Execute quickstart.md Scenario 2: Live tracking during Hawl (~8 min)
- [ ] T069 Execute quickstart.md Scenario 3: Wealth falls below Nisab (interruption) (~7 min)
- [ ] T070 Execute quickstart.md Scenario 4: Hawl completion & finalization (~10 min)
- [ ] T071 Execute quickstart.md Scenario 5: Unlock & edit finalized record (~8 min)
- [ ] T072 Execute quickstart.md Scenario 6: Invalid operations (error handling) (~5 min)
- [ ] T073 Execute quickstart.md Scenario 7: Nisab threshold calculation (~7 min)

### Performance Validation
- [ ] T074 Performance test: Aggregate wealth calculation (<100ms for 500 assets)
- [ ] T075 Performance test: Precious metals API call (<2s with cache fallback)
- [ ] T076 Performance test: Dashboard page load (<2s constitutional requirement)
- [ ] T077 Performance test: Live tracking latency (<500ms perceived as instant)
- [ ] T078 Performance test: Background Hawl detection job (<30s completion)

### Accessibility Audit
- [ ] T079 WCAG 2.1 AA audit: HawlProgressIndicator (keyboard nav, screen reader, contrast)
- [ ] T080 WCAG 2.1 AA audit: NisabComparisonWidget (alt text, ARIA labels)
- [ ] T081 WCAG 2.1 AA audit: FinalizationModal (focus trap, ESC key, announcements)
- [ ] T082 WCAG 2.1 AA audit: UnlockReasonDialog (error announcements, label associations)
- [ ] T083 WCAG 2.1 AA audit: AuditTrailView (semantic HTML, color contrast)

### Islamic Compliance Verification
- [ ] T084 Verify Nisab thresholds: 87.48g gold, 612.36g silver (scholarly sources)
- [ ] T085 Verify Hawl duration: 354 days lunar year (Hijri calendar accuracy)
- [ ] T086 Verify Zakat rate: 2.5% on entire base (not excess above Nisab)
- [ ] T087 Verify educational content: In-context help aligns with Simple Zakat Guide

- [ ] **🔸 COMMIT CHECKPOINT**: Commit validation complete (all tests passing)

## Phase 3.7: Documentation

- [ ] T088 Update API documentation in docs/api.md
  - Document 8 new endpoints (GET, POST, PUT, DELETE, finalize, unlock)
  - Include request/response examples
  - Document error codes and messages
  - Document status transition rules

- [ ] T089 Add in-context educational content in client/src/content/nisabEducation.md
  - Explain Nisab concept (gold/silver thresholds)
  - Explain Hawl concept (lunar year tracking)
  - Explain why 354 days (lunar calendar)
  - Explain aggregate approach (sum all assets)
  - Reference Simple Zakat Guide

- [ ] T090 Update user guide in docs/user-guide.md
  - Add section: "Understanding Nisab and Hawl"
  - Add section: "Managing Your Nisab Year Records"
  - Add section: "Finalizing and Unlocking Records"
  - Add screenshots of new UI components

- [ ] T091 Document deployment migration steps in deployment-guide.md
  - Database migration commands
  - Environment variable setup (METALS_API_KEY)
  - Rollback procedure
  - Data backup recommendations

- [ ] **🔸 COMMIT CHECKPOINT**: Commit documentation complete

## Dependencies

### Critical Path (Sequential)
1. **Setup** (T001-T004) before everything
2. **Database** (T005-T013) before services
3. **Tests** (T014-T037) before implementation (TDD)
4. **Shared Types** (T038-T040) before services and frontend
5. **Services** (T041-T045) before API and jobs
6. **Background Jobs** (T046-T047) independent (can run after services)
7. **API** (T048-T056) requires services complete
8. **Frontend** (T057-T066) requires API complete
9. **Validation** (T067-T087) requires all implementation complete
10. **Documentation** (T088-T091) at end

### Parallel Execution Opportunities

**Contract Tests (can run together):**
- T014-T020 (7 contract tests, different files)

**Service Tests (can run together):**
- T021-T025 (5 service tests, different files)

**Integration Tests (can run together):**
- T026-T032 (7 integration tests, different files)

**Component Tests (can run together):**
- T033-T037 (5 component tests, different files)

**Service Implementations (can run together):**
- T041, T042, T043, T044 (4 services, independent modules)

**React Components (can run together):**
- T060, T061, T062, T063, T064 (5 components, independent files)

**Custom Hooks (can run together):**
- T058, T059 (2 hooks, different files)

**Quickstart Scenarios (can run together if multiple testers):**
- T067-T073 (7 scenarios, independent workflows)

**Accessibility Audits (can run together):**
- T079-T083 (5 audits, different components)

## Parallel Example
```bash
# Phase 3.3: Launch all contract tests together
Task: "Contract test GET /api/nisab-year-records in server/tests/contract/nisabYearRecords.get.test.ts"
Task: "Contract test POST /api/nisab-year-records in server/tests/contract/nisabYearRecords.post.test.ts"
Task: "Contract test GET /api/nisab-year-records/:id in server/tests/contract/nisabYearRecords.getById.test.ts"
Task: "Contract test PUT /api/nisab-year-records/:id in server/tests/contract/nisabYearRecords.put.test.ts"
Task: "Contract test DELETE /api/nisab-year-records/:id in server/tests/contract/nisabYearRecords.delete.test.ts"
Task: "Contract test POST /api/nisab-year-records/:id/finalize in server/tests/contract/nisabYearRecords.finalize.test.ts"
Task: "Contract test POST /api/nisab-year-records/:id/unlock in server/tests/contract/nisabYearRecords.unlock.test.ts"

# Phase 3.4: Launch all service implementations together
Task: "Implement NisabCalculationService in server/src/services/nisabCalculationService.ts"
Task: "Implement HawlTrackingService in server/src/services/hawlTrackingService.ts"
Task: "Implement WealthAggregationService in server/src/services/wealthAggregationService.ts"
Task: "Implement AuditTrailService in server/src/services/auditTrailService.ts"

# Phase 3.5: Launch all React components together
Task: "Create HawlProgressIndicator component in client/src/components/HawlProgressIndicator.tsx"
Task: "Create NisabComparisonWidget component in client/src/components/NisabComparisonWidget.tsx"
Task: "Create FinalizationModal component in client/src/components/FinalizationModal.tsx"
Task: "Create UnlockReasonDialog component in client/src/components/UnlockReasonDialog.tsx"
Task: "Create AuditTrailView component in client/src/components/AuditTrailView.tsx"
```

## Notes
- [P] tasks = different files, no dependencies, can execute in parallel
- Verify tests fail before implementing (TDD discipline)
- **🔸 COMMIT after each milestone checkpoint** (7 total: Setup, Database, Tests, Backend, Frontend, Validation, Docs)
- **Never commit sensitive data**: *.db, *.db-journal, *.enc, .env, */data/users/, node_modules/
- Use conventional commit format: feat, fix, test, docs, refactor, chore
- Islamic compliance verified at T084-T087 (Nisab, Hawl, Zakat rate)
- Performance targets: <100ms aggregation, <2s API, <2s page load, <500ms latency, <30s job
- Accessibility target: WCAG 2.1 AA for all new UI components
- Total estimated time: ~40-60 hours (with parallelization ~30-40 hours)

### Git Workflow Best Practices
```bash
# Example milestone commit workflow:
git add server/package.json server/package-lock.json server/src/config/
git commit -m "feat(008): Complete setup milestone

- Install moment-hijri ^2.30.0 for Hijri calendar calculations
- Install @types/moment-hijri for TypeScript support
- Configure metals-api.com client with 24-hour caching
- Add METALS_API_KEY environment variable"

# Never commit these:
*.db, *.db-journal, *.enc, .env, */data/users/, node_modules/, dist/
```

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - 8 endpoints in nisab-year-records.openapi.yaml → 7 contract test tasks (T014-T020)
   - 8 endpoints → 7 implementation tasks (T050-T056)
   
2. **From Data Model**:
   - 4 entities (NisabYearRecord, AuditTrailEntry, PreciousMetalPrice, HawlTracker) → 8 migration tasks (T005-T013)
   - 3 new entities → 3 type definition tasks (T038-T040)
   
3. **From Research**:
   - 5 technology decisions → 4 setup tasks (T001-T004), 4 service tasks (T041-T044), 2 job tasks (T046-T047)

4. **From Quickstart**:
   - 7 test scenarios → 7 validation tasks (T067-T073)
   - Performance section → 5 performance tasks (T074-T078)
   - Accessibility section → 5 accessibility tasks (T079-T083)
   - Islamic compliance section → 4 verification tasks (T084-T087)

5. **Ordering**:
   - Setup → Database → Tests → Shared Types → Services → Jobs → API → Frontend → Validation → Docs
   - TDD: All tests (T014-T037) before any implementation (T038-T066)
   - Dependencies: Database blocks services, services block API, API blocks frontend

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (8 endpoints → 7 contract tests T014-T020)
- [x] All entities have migration/type tasks (4 entities → 8 migrations + 3 types)
- [x] All tests come before implementation (T014-T037 before T038-T066)
- [x] Parallel tasks truly independent (marked [P], different files)
- [x] Each task specifies exact file path (server/src/..., client/src/...)
- [x] No task modifies same file as another [P] task
- [x] TDD discipline enforced (tests must fail before implementation)
- [x] Constitutional compliance: Privacy (AES-256), Performance (<100ms, <2s), Islamic (Nisab, Hawl, Zakat)
- [x] Commit checkpoints at milestone boundaries (7 total)

---

**Tasks Status**: ✅ READY FOR EXECUTION (91 tasks across 7 phases)

**Estimated Completion**: 30-40 hours with parallelization, 40-60 hours sequential

**Next Action**: Begin with Phase 3.1 (Setup) tasks T001-T004

---

*Feature 008: Nisab Year Record Workflow Fix*
*Branch: 008-nisab-year-record*
*Generated: 2025-10-27*
