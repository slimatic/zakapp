
# Implementation Plan: Nisab Year Record Workflow Fix

**Branch**: `008-nisab-year-record` | **Date**: 2025-10-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/home/lunareclipse/zakapp/specs/008-nisab-year-record/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   ✅ DONE: Spec loaded from /home/lunareclipse/zakapp/specs/008-nisab-year-record/spec.md
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   ✅ DONE: Project Type = web (frontend + backend), all technical context resolved
3. Fill the Constitution Check section
   ✅ DONE: All 5 constitutional principles verified
4. Evaluate Constitution Check section
   ✅ PASS: No violations, Islamic compliance requirements met
   ✅ Update Progress Tracking: Initial Constitution Check PASS
5. Execute Phase 0 → research.md
   ✅ DONE: Research completed for Hijri calendar, precious metals API, audit trails
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific file
   ✅ DONE: Data model, API contracts, quickstart guide, Copilot instructions updated
7. Re-evaluate Constitution Check section
   ✅ PASS: No new violations introduced
   ✅ Update Progress Tracking: Post-Design Constitution Check PASS
8. Plan Phase 2 → Task generation approach documented below
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS here. Phase 2 (/tasks) will create tasks.md based on this plan.

## Summary

**Primary Requirement**: Fix the Nisab Year Record workflow to properly align with Islamic Zakat accounting principles, including automated Hawl (lunar year) tracking, Nisab threshold monitoring from precious metals prices, live wealth aggregation for draft records, and comprehensive finalization/unlock workflows with audit trails.

**Technical Approach**:

1. **Database Migration**: Rename `yearly_snapshots` table to `nisab_year_records`, add Hawl tracking fields (hawl_start_date, hawl_completion_date, nisab_threshold_at_start, nisab_basis), and create new `audit_trail_entries` and `precious_metal_prices` tables.

2. **Nisab Calculation Service**: Integrate with precious metals price API (e.g., GoldAPI.io or metals-api.com) to fetch current gold/silver prices, cache with daily TTL, and calculate Nisab thresholds (NISAB_THRESHOLDS from `shared/src/constants/islamicConstants.ts`) in user's currency.

3. **Hawl Tracking Engine**: Background job monitors aggregate zakatable wealth continuously, detects when Nisab threshold is first reached, records Hawl start date (Hijri + Gregorian), calculates completion date (HAWL_CONSTANTS.DAYS_LUNAR from islamicConstants.ts, lunar calendar), and creates DRAFT Nisab Year Record automatically.

4. **Live Tracking**: Frontend subscribes to real-time updates via WebSocket or polling; backend recalculates aggregate wealth on any asset change and updates DRAFT records without persisting (display-only until finalization).

5. **CRUD Operations Fix**: Implement proper UPDATE endpoint with status transition validation (DRAFT→FINALIZED, FINALIZED→UNLOCKED, UNLOCKED→FINALIZED), descriptive error messages, and DELETE restrictions (only DRAFT records).

6. **Audit Trail System**: Record every unlock (reason, timestamp, user ID), edit (changes summary), and re-finalization event in append-only `audit_trail_entries` table; display complete history in record details UI.

## Technical Context

**Language/Version**:

- Backend: TypeScript 4.9.5 + Node.js 18+ (Express.js framework)
- Frontend: TypeScript 4.9.5 + React 18.1.1 (Create React App)
- Database: SQLite with Prisma ORM 5.x

**Primary Dependencies**:

- Backend: Express.js, Prisma Client, bcrypt, jsonwebtoken, node-cron (scheduler), axios (API calls)
- Frontend: React, React Query (@tanstack/react-query), Radix UI components
- Shared: TypeScript, date-fns (Gregorian), hijri-calendar library (lunar dates)
- New: Precious metals API client (GoldAPI.io or metals-api.com), moment-hijri for Hijri calculations

**Storage**:

- SQLite database (server/zakapp.db)
- AES-256 encryption for sensitive fields (existing EncryptionService)
- Schema managed via Prisma migrations

**Testing**:

- Backend: Jest + Supertest (API integration tests)
- Frontend: Jest + React Testing Library + @testing-library/user-event 13.5.0
- E2E: Playwright (critical workflows)
- Contract: OpenAPI schema validation tests

**Target Platform**:

- Web application (desktop/mobile browsers)
- Self-hostable (Linux server, Docker deployment)
- Offline-capable PWA features (existing)

**Project Type**: **web** (frontend + backend monorepo structure)

**Performance Goals**:

- Aggregate wealth calculation: <100ms for 500 assets
- Nisab threshold API call: <2s with cache fallback
- Dashboard page load: <2s (constitutional requirement)
- Live tracking updates: <500ms latency (perceived as instant)
- Background Hawl detection job: Run hourly, complete in <30s

**Constraints**:

- Islamic compliance: Hawl must use lunar calendar (HAWL_CONSTANTS.DAYS_LUNAR from `shared/src/constants/islamicConstants.ts`), Nisab thresholds must match scholarly standards (NISAB_THRESHOLDS in islamicConstants.ts)
- Privacy-first: No financial data transmitted to third parties (metals API returns only public commodity prices)
- Zero-trust: Encrypt sensitive fields (wealth amounts, Nisab values, user notes) at rest
- Accessibility: WCAG 2.1 AA compliance for all new UI components
- Data integrity: Audit trails must be append-only and immutable

**Scale/Scope**:

- Single-user focused (household Zakat tracking)
- Expected: 50-200 assets per user, 1-2 active Hawl cycles at a time
- 10-20 Nisab Year Records per user over lifetime
- Audit trail: 20-50 entries per record (unlock/edit events)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Professional & Modern User Experience ✅ PASS

- **Guided Workflows**: Finalization workflow includes summary review screen with clear explanation of Hawl completion (FR-034)
- **Clear Visualizations**: Dashboard displays Hawl countdown, wealth vs Nisab comparison, progress indicators (FR-054-FR-057)
- **Contextual Education**: In-context help for Nisab, Hawl, standard selection, deductible liabilities (FR-059-FR-063)
- **Accessibility**: All new UI components follow existing WCAG 2.1 AA patterns (Radix UI primitives)
- **Validation**: Usability testing scenarios to be defined in tasks.md

### II. Privacy & Security First ✅ PASS (NON-NEGOTIABLE)

- **Zero-Trust Model**: All sensitive fields encrypted at rest with existing AES-256 EncryptionService
- **Self-Hostable**: No changes to deployment model; remains fully self-hostable
- **Third-Party Data**: Precious metals API returns only public commodity prices (no user financial data transmitted)
- **Audit Trails**: Append-only, immutable log of all unlock/edit operations (FR-033, FR-041, FR-047)
- **JWT Security**: No changes to existing authentication; inherits current JWT + refresh token model

### III. Spec-Driven & Clear Development ✅ PASS

- **Written Specification**: Complete spec.md with 63 functional requirements before implementation
- **Islamic Sources**: Requirements aligned with Simple Zakat Guide and Islamic accounting principles (Nisab, Hawl)
- **Measurable Requirements**: Every FR is testable with clear acceptance criteria
- **No Ambiguity**: Two clarification sessions resolved all [NEEDS CLARIFICATION] markers
- **Traceability**: Each requirement maps to acceptance scenario or edge case

### IV. Quality & Performance ✅ PASS

- **Test Coverage**: >90% coverage target for new calculation logic (Nisab calculation, Hawl tracking, aggregate wealth)
- **Page Load**: Dashboard enhancements designed to maintain <2s load time (existing optimizations preserved)
- **Observability**: Background jobs (Hawl detection) include logging and error monitoring hooks
- **Regression Budget**: Database migration tested with rollback capability; API contracts define backward compatibility
- **Performance Goals**: Explicit targets defined (aggregate calc <100ms, API calls <2s with cache)

### V. Foundational Islamic Guidance ✅ PASS

- **Simple Zakat Guide Alignment**: Educational content references Simple Zakat Guide video series and site
- **Proper Terminology**: "Nisab Year Record" reflects Islamic accounting (not generic "Yearly Snapshot")
- **Hawl Tracking**: Lunar calendar (~354 days) used for Zakat year calculation (FR-016)
- **Nisab Standards**: Correct thresholds (87.48g gold, 612.36g silver) from scholarly consensus
- **Scholarly Flexibility**: Deductible liabilities allow user discretion with guidance on different opinions (FR-062)
- **Source Documentation**: Implementation notes will cite Simple Zakat Guide for methodology decisions

**Initial Constitution Check Result**: ✅ PASS - No violations, proceed to Phase 0

**Post-Design Constitution Check Result**: ✅ PASS - No new violations introduced

### Constitutional Alignment Notes

- **Hawl Tracking**: Uses HAWL_CONSTANTS.DAYS_LUNAR from `shared/src/constants/islamicConstants.ts` for lunar calendar accuracy
- **Nisab Standards**: NISAB_THRESHOLDS from islamicConstants.ts ensures consistency across application
- **Zakat Rate**: ZAKAT_RATES.STANDARD from islamicConstants.ts (2.5%) with scholarly references

## Project Structure

### Documentation (this feature)

```
specs/008-nisab-year-record/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command) - ✅ CREATED
├── data-model.md        # Phase 1 output (/plan command) - ✅ CREATED
├── quickstart.md        # Phase 1 output (/plan command) - ✅ CREATED
├── contracts/           # Phase 1 output (/plan command) - ✅ CREATED
│   ├── nisab-year-records.openapi.yaml
│   ├── hawl-tracking.openapi.yaml
│   ├── nisab-calculation.openapi.yaml
│   └── audit-trails.openapi.yaml
└── tasks.md             # Phase 2 output (/tasks command - NOT YET CREATED)
```

### Source Code (repository root)

```
server/
├── src/
│   ├── models/          # Prisma models (schema.prisma)
│   ├── services/
│   │   ├── NisabYearRecordService.ts  # Renamed from SnapshotService
│   │   ├── HawlTrackingService.ts      # NEW: Hawl lifecycle management
│   │   ├── NisabCalculationService.ts  # NEW: Precious metals API integration
│   │   ├── AuditTrailService.ts        # NEW: Unlock/edit tracking
│   │   └── WealthAggregationService.ts # NEW: Live wealth calculation
│   ├── controllers/
│   │   └── nisabYearRecordController.ts # Updated from snapshotController
│   ├── routes/
│   │   └── nisabYearRecords.ts         # Updated from snapshots.ts
│   ├── jobs/
│   │   └── hawlDetectionJob.ts         # NEW: Background Hawl monitoring
│   └── utils/
│       ├── hijriCalendar.ts            # NEW: Lunar date calculations
│       └── preciousMetalsCache.ts      # NEW: API response caching
├── prisma/
│   ├── schema.prisma                   # UPDATED: Rename tables, add fields
│   └── migrations/
│       └── YYYYMMDDHHMMSS_nisab_year_record_migration/
│           └── migration.sql
└── __tests__/
    ├── services/
    │   ├── NisabYearRecordService.test.ts
    │   ├── HawlTrackingService.test.ts
    │   └── NisabCalculationService.test.ts
    └── integration/
        └── nisabYearRecords.test.ts

client/
├── src/
│   ├── components/
│   │   ├── NisabYearRecordList.tsx     # Updated from SnapshotList
│   │   ├── NisabYearRecordCard.tsx     # Updated from SnapshotCard
│   │   ├── HawlProgressIndicator.tsx   # NEW: Countdown display
│   │   ├── NisabComparisonWidget.tsx   # NEW: Wealth vs threshold
│   │   ├── FinalizationModal.tsx       # NEW: Review screen
│   │   ├── UnlockReasonDialog.tsx      # NEW: Unlock workflow
│   │   └── AuditTrailView.tsx          # NEW: History display
│   ├── pages/
│   │   └── NisabYearRecordsPage.tsx    # Updated from SnapshotsPage
│   ├── services/
│   │   └── nisabYearRecordApi.ts       # Updated from snapshotApi
│   └── hooks/
│       ├── useNisabYearRecords.ts      # Updated from useSnapshots
│       ├── useHawlStatus.ts            # NEW: Live Hawl tracking
│       └── useNisabThreshold.ts        # NEW: Threshold data
└── __tests__/
    └── components/
        ├── NisabYearRecordList.test.tsx
        └── FinalizationModal.test.tsx

shared/
└── types/
    ├── NisabYearRecord.ts              # Updated from YearlySnapshot
    ├── HawlTracker.ts                  # NEW
    ├── AuditTrailEntry.ts              # NEW
    └── PreciousMetalPrice.ts           # NEW
```

**Structure Decision**: Web application (Option 2) - ZakApp uses a monorepo structure with separate `server/` (Express + TypeScript backend) and `client/` (React + TypeScript frontend) directories, plus a `shared/` directory for common TypeScript types. This feature will update existing files in both frontend and backend, add new services and components, and create a database migration for the schema changes.

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]

## Phase 0: Outline & Research ✅ COMPLETE

**Status**: All unknowns resolved, research documented in [research.md](./research.md)

### Key Decisions Made

1. **Hijri Calendar Library**: moment-hijri (mature, 56k+ weekly downloads, Umm al-Qura algorithm)
2. **Precious Metals API**: metals-api.com (free tier 50 req/month, daily caching strategy)
3. **Audit Trail Pattern**: Append-only event sourcing (immutable, full history reconstruction)
4. **Live Tracking**: Backend recalculation + frontend polling (5s interval, simple & reliable)
5. **Database Migration**: Rename-in-place with transaction safety (zero downtime)

### Research Artifacts Created

- ✅ `research.md` - Complete technology decisions and rationale
- ✅ All NEEDS CLARIFICATION items resolved
- ✅ Islamic compliance verified (Nisab thresholds, Hawl duration, Zakat rate)
- ✅ Performance benchmarks documented (<100ms aggregate calc, <2s API calls)

---

## Phase 1: Design & Contracts ✅ COMPLETE

**Status**: Data model defined, API contracts generated, quickstart guide created, Copilot context updated

### Artifacts Generated

1. **data-model.md** ✅:
   - NisabYearRecord entity (renamed from YearlySnapshot)
   - AuditTrailEntry entity (new, append-only)
   - PreciousMetalPrice entity (new, caching)
   - HawlTracker virtual entity (service layer, not persisted)
   - Database migration plan with rollback strategy
   - Validation rules and state transition matrix

2. **API Contracts** ✅:
   - `contracts/nisab-year-records.openapi.yaml` - Full CRUD + finalize/unlock endpoints
   - Comprehensive request/response schemas
   - Error responses with descriptive messages
   - Status transition validation documented

3. **Quickstart Guide** ✅:
   - `quickstart.md` - 7 comprehensive test scenarios
   - Manual testing procedures (~90 minutes total)
   - Performance validation steps
   - Accessibility checks (WCAG 2.1 AA)
   - Islamic compliance verification

4. **Agent Context Update** ✅:
   - `.github/copilot-instructions.md` updated with Feature 008 context
   - Added: Nisab Year Record entities, Hawl tracking, Islamic accounting principles
   - Preserved: Existing constitutional principles and coding standards

### Design Validation

- ✅ All entities mapped to Prisma schema
- ✅ Relationships defined (User 1:M NisabYearRecord, NisabYearRecord 1:M AuditTrailEntry)
- ✅ Encrypted fields identified (totalWealth, nisabThresholdAtStart, userNotes, etc.)
- ✅ Status transitions validated (DRAFT→FINALIZED, FINALIZED→UNLOCKED, UNLOCKED→FINALIZED)
- ✅ Edge cases covered (Hawl interruption, premature finalization, invalid transitions)

---

## Phase 2: Task Planning Approach

**Status**: Ready for `/tasks` command execution

### Task Generation Strategy

The `/tasks` command will generate tasks.md by processing the Phase 1 design documents:

1. **Load Task Template**:
   - Use `.specify/templates/tasks-template.md` as base
   - Extract task categories from implementation plan

2. **Generate Database Tasks** (from data-model.md):
   - T001: Create Prisma migration for table rename (yearly_snapshots → nisab_year_records) [P]
   - T002: Add new fields (hawlStartDate, hawlCompletionDate, nisabBasis, etc.) [P]
   - T003: Create audit_trail_entries table [P]
   - T004: Create precious_metal_prices table [P]
   - T005: Write migration script for existing data transformation
   - T006: Test migration rollback capability
   - T007: Generate Prisma Client and verify schema

3. **Generate Service Layer Tasks** (from research.md + data-model.md):
   - T008: Implement NisabCalculationService (precious metals API integration) [P]
   - T009: Write unit tests for NisabCalculationService [P]
   - T010: Implement HawlTrackingService (lifecycle management) [P]
   - T011: Write unit tests for HawlTrackingService [P]
   - T012: Implement WealthAggregationService (live calculations) [P]
   - T013: Write unit tests for WealthAggregationService [P]
   - T014: Implement AuditTrailService (unlock/edit tracking) [P]
   - T015: Write unit tests for AuditTrailService [P]
   - T016: Update NisabYearRecordService (rename from SnapshotService)
   - T017: Write unit tests for NisabYearRecordService

4. **Generate Background Job Tasks**:
   - T018: Implement hawlDetectionJob.ts (hourly Nisab monitoring)
   - T019: Write tests for hawlDetectionJob
   - T020: Add job to node-cron scheduler

5. **Generate API Tasks** (from contracts/nisab-year-records.openapi.yaml):
   - T021: Update routes (snapshots.ts → nisabYearRecords.ts)
   - T022: Implement GET /api/nisab-year-records endpoint
   - T023: Implement POST /api/nisab-year-records endpoint
   - T024: Implement GET /api/nisab-year-records/:id endpoint
   - T025: Implement PUT /api/nisab-year-records/:id endpoint (with status validation)
   - T026: Implement DELETE /api/nisab-year-records/:id endpoint
   - T027: Implement POST /api/nisab-year-records/:id/finalize endpoint
   - T028: Implement POST /api/nisab-year-records/:id/unlock endpoint
   - T029: Write contract tests for all endpoints
   - T030: Write integration tests for status transitions

6. **Generate Frontend Tasks** (from quickstart.md scenarios):
   - T031: Update shared types (YearlySnapshot → NisabYearRecord)
   - T032: Update nisabYearRecordApi.ts (rename from snapshotApi)
   - T033: Create useHawlStatus hook (live tracking)
   - T034: Create useNisabThreshold hook (cached prices)
   - T035: Update NisabYearRecordList component [P]
   - T036: Update NisabYearRecordCard component [P]
   - T037: Create HawlProgressIndicator component [P]
   - T038: Create NisabComparisonWidget component [P]
   - T039: Create FinalizationModal component [P]
   - T040: Create UnlockReasonDialog component [P]
   - T041: Create AuditTrailView component [P]
   - T042: Update NisabYearRecordsPage (rename from SnapshotsPage)
   - T043: Update Dashboard with Hawl status display
   - T044: Write component tests for new UI

7. **Generate Testing & Validation Tasks**:
   - T045: Execute quickstart.md Scenario 1 (Nisab achievement)
   - T046: Execute quickstart.md Scenario 2 (live tracking)
   - T047: Execute quickstart.md Scenario 3 (Hawl interruption)
   - T048: Execute quickstart.md Scenario 4 (finalization)
   - T049: Execute quickstart.md Scenario 5 (unlock/edit)
   - T050: Execute quickstart.md Scenario 6 (invalid operations)
   - T051: Execute quickstart.md Scenario 7 (Nisab calculation)
   - T052: Run performance validation (<100ms, <2s, <2s page load)
   - T053: Run accessibility audit (WCAG 2.1 AA)
   - T054: Verify Islamic compliance (Nisab, Hawl, Zakat rate)

8. **Generate Documentation Tasks**:
   - T055: Update API documentation with new endpoints
   - T056: Add educational content (Nisab, Hawl in-context help)
   - T057: Update user guide with Nisab Year Record workflow
   - T058: Document migration steps for deployment

### Ordering Strategy

**TDD Order** (tests before implementation):

- Database migration → Service tests → Service implementation
- API contract tests → Controller implementation
- Component tests → Component implementation

**Dependency Order**:

1. Database layer (T001-T007)
2. Service layer (T008-T017) - can run in parallel [P]
3. Background jobs (T018-T020)
4. API layer (T021-T030)
5. Frontend layer (T031-T044) - components can be parallel [P]
6. Testing & validation (T045-T054)
7. Documentation (T055-T058)

**Parallelization** (marked [P]):

- Multiple services can be developed simultaneously
- Frontend components independent of each other
- Unit tests parallel with implementation

### Estimated Task Count

**Total**: ~58 tasks

- Database: 7 tasks
- Services: 10 tasks
- Background Jobs: 3 tasks
- API: 10 tasks
- Frontend: 14 tasks
- Testing: 10 tasks
- Documentation: 4 tasks

### Next Command

Run `/tasks` to generate complete tasks.md file with all 58 ordered, prioritized tasks following this strategy.

---

## Complexity Tracking

*No constitutional violations - all complexity justified*

**Complexity Assessment**: MODERATE

### New Components Added

- 1 new database table (AuditTrailEntry)
- 1 new cache table (PreciousMetalPrice)
- 4 new services (NisabCalculation, HawlTracking, WealthAggregation, AuditTrail)
- 1 new background job (hawlDetection)
- 7 new React components (Hawl progress, finalization modal, unlock dialog, audit trail, etc.)

### Justification

- **Audit trails**: Required for compliance and trust (financial data corrections must be logged)
- **Background job**: Required for automated Hawl detection (cannot rely on user-initiated checks)
- **Service separation**: Follows single responsibility principle (Nisab calc, Hawl tracking, aggregation are distinct concerns)
- **Caching table**: Required for offline resilience and API rate limiting (metals API has 50 req/month limit)

**Simpler Alternative Rejected**: Combining all logic into existing SnapshotService would violate SRP and make testing harder.

---

## Progress Tracking

### Phase Status

- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning complete (/plan command - approach documented) ✅
- [ ] Phase 3: Tasks generated (/tasks command) ⏳ NEXT STEP
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

### Gate Status

- [x] Initial Constitution Check: PASS ✅
- [x] Post-Design Constitution Check: PASS ✅
- [x] All NEEDS CLARIFICATION resolved ✅
- [x] Complexity deviations documented ✅

### Artifacts Status

- [x] research.md ✅
- [x] data-model.md ✅
- [x] contracts/nisab-year-records.openapi.yaml ✅
- [x] quickstart.md ✅
- [x] .github/copilot-instructions.md updated ✅
- [ ] tasks.md ⏳ (awaiting /tasks command)

---

**Plan Status**: ✅ COMPLETE - Ready for `/tasks` command

**Next Action**: Execute `/tasks` to generate tasks.md with 58 implementation tasks

---

*Based on Constitution v0.2.0 - See `.specify/memory/constitution.md`*
*Feature 008: Nisab Year Record Workflow Fix*
*Branch: 008-nisab-year-record*

- Each story → integration test scenario
- Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach

*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:

- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P]
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:

- TDD order: Tests before implementation
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

## Progress Tracking

*This checklist is updated during execution flow*

**Phase Status**:

- [ ] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [ ] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v0.2.0 - See `/memory/constitution.md`*
