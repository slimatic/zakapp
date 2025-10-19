
# Implementation Plan: Zakat Calculation Complete

**Branch**: `004-zakat-calculation-complete` | **Date**: 2025-10-13 | **Spec**: [spec.md](./spec.md)  
**Status**: ✅ **IMPLEMENTATION COMPLETE** (October 19, 2025)  
**Input**: Feature specification from `/home/lunareclipse/zakapp/specs/004-zakat-calculation-complete/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Post-Implementation Reconciliation (October 19, 2025)

**Note**: Implementation is now COMPLETE. This document remains for reference. For authoritative reconciliation of task numbering and completion status, see [`ARTIFACT_RECONCILIATION.md`](./ARTIFACT_RECONCILIATION.md).

**Key Updates**:
- ✅ Task numbering unified: spec.md (T118-T158) is authoritative
- ✅ Completion status: 31/32 tasks (97%)
- ✅ API contracts: Complete specifications in `/contracts/`
- ✅ Testing: Comprehensive E2E scenarios and performance specs defined
- ⚠️ T143 Accessibility Audit: Blocked by TypeScript server errors (workaround available)

## Summary
Complete the Zakat Calculation Engine (Milestone 4 - final 15%) by implementing:
1. Calendar system integration (Hijri/Gregorian with bidirectional conversion)
2. Multi-methodology calculation UI (Standard/AAOIFI, Hanafi, Shafi'i, Custom)
3. Enhanced calculation display with visual nisab indicators and educational content
4. Calculation history with trending analysis and cross-methodology comparison
5. Methodology selection interface with regional recommendations

**Technical Approach**: Extend existing React/TypeScript frontend with new components for methodology selection and calendar management, add backend services for calendar conversion and calculation history storage using Prisma ORM with SQLite, implement hijri-converter library for Islamic calendar support.

## Technical Context
**Language/Version**: Node.js + TypeScript (backend), React 19.1.1 + TypeScript (frontend)  
**Primary Dependencies**: Express.js, Prisma ORM 6.16.2, React Query 5.90.2, hijri-converter 1.1.1, Tailwind CSS  
**Storage**: SQLite with Prisma ORM, AES-256 encryption for sensitive data  
**Testing**: Jest 29.7.0, Supertest 7.1.4, React Testing Library, Playwright 1.55.1  
**Target Platform**: Linux server (Docker-ready), modern web browsers  
**Project Type**: web (frontend + backend monorepo structure)  
**Performance Goals**: <200ms calculation time per methodology, <500ms history load for 100 records, <50ms calendar conversion  
**Constraints**: <2s page loads, WCAG 2.1 AA accessibility, >90% test coverage for calculation logic, zero sensitive data logging  
**Scale/Scope**: 4 calculation methodologies, ~15 new UI components, 6 new API endpoints, 100+ calculations in history

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Principle I: Professional & Modern User Experience**
- ✅ PASS: Feature includes guided methodology selection, visual nisab indicators, educational tooltips
- ✅ PASS: WCAG 2.1 AA compliance required in acceptance criteria
- ✅ PASS: Polished UI with methodology cards and comparison views specified

**Principle II: Privacy & Security First**
- ✅ PASS: Calculation history stored with encryption (existing infrastructure)
- ✅ PASS: No third-party data transmission for calendar/calculations
- ✅ PASS: Existing JWT authentication and encryption patterns followed
- ✅ PASS: No sensitive financial data in logs (constitutional requirement)

**Principle III: Spec-Driven & Clear Development**
- ✅ PASS: Clarifications section complete with Session 2025-10-13
- ✅ PASS: All functional requirements have clear acceptance criteria
- ✅ PASS: No [NEEDS CLARIFICATION] markers in specification
- ✅ PASS: Islamic methodologies reference authoritative sources (AAOIFI, madhabs)

**Principle IV: Quality & Performance**
- ✅ PASS: >90% test coverage required for calculation logic
- ✅ PASS: Performance metrics defined: <200ms calculation, <500ms history, <50ms calendar conversion
- ✅ PASS: Page load <2s specified in constraints
- ✅ PASS: Jest/Supertest/Playwright testing infrastructure in place

**Principle V: Foundational Islamic Guidance**
- ✅ PASS: All methodologies reference authoritative Islamic sources (AAOIFI, Hanafi/Shafi'i madhabs)
- ✅ PASS: Educational content requirement specified for each methodology
- ✅ PASS: Scholarly basis documented in Islamic Methodologies Reference section
- ✅ PASS: Simple Zakat Guide alignment maintained (standard 2.5% rate, nisab thresholds)

**Initial Gate Result**: ✅ PASS - All constitutional principles satisfied, proceed to Phase 0

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
backend (server/)
├── src/
│   ├── models/         # Prisma models (existing)
│   ├── services/       # Business logic
│   │   ├── CalendarService.ts         # NEW: Hijri/Gregorian conversion
│   │   ├── ZakatCalculationService.ts # EXTEND: Add methodology support
│   │   └── CalculationHistoryService.ts # NEW: History management
│   ├── routes/
│   │   ├── calendar.ts     # NEW: Calendar API endpoints
│   │   └── calculations.ts # EXTEND: Add history endpoints
│   └── utils/
│       └── encryption.ts   # EXISTING: For sensitive data
└── tests/
    ├── contract/           # API contract tests
    ├── integration/        # End-to-end tests
    └── unit/              # Service unit tests

frontend (client/)
├── src/
│   ├── components/
│   │   ├── zakat/
│   │   │   ├── MethodologySelector.tsx       # NEW: Methodology cards
│   │   │   ├── EnhancedZakatCalculator.tsx  # EXTEND: Add methodology UI
│   │   │   ├── CalculationHistory.tsx        # NEW: History display
│   │   │   ├── CalculationBreakdown.tsx      # NEW: Visual breakdown
│   │   │   └── NisabIndicator.tsx           # NEW: Visual nisab gauge
│   │   └── ui/
│   │       └── CalendarSelector.tsx          # NEW: Calendar toggle
│   ├── services/
│   │   ├── calendarApi.ts      # NEW: Calendar API client
│   │   └── calculationApi.ts   # EXTEND: Add history methods
│   ├── hooks/
│   │   ├── useCalendar.ts      # NEW: Calendar state management
│   │   └── useCalculationHistory.ts # NEW: History queries
│   └── pages/
│       └── ZakatCalculator.tsx # EXTEND: Integrate new components
└── tests/
    ├── components/  # Component tests
    └── integration/ # User flow tests

shared/
└── types/
    ├── calendar.ts      # NEW: Calendar types
    ├── calculation.ts   # EXTEND: Add methodology types
    └── history.ts       # NEW: History types
```

**Structure Decision**: Web application architecture (Option 2) - Separate backend (server/) and frontend (client/) directories with shared types. This feature extends existing services and adds new calendar/history modules following the established pattern.

## Phase 0: Outline & Research ✅ COMPLETE

**Status**: All technical decisions documented in research.md

**Key Decisions Made**:

1. **Calendar System**: hijri-converter library (v1.1.1 already installed)
   - Store dates as Gregorian, convert on display
   - Universal library works on frontend and backend
   
2. **Methodology Calculation**: Strategy pattern with enum-based methodologies
   - Fixed rules for Standard/Hanafi/Shafi'i (Islamic compliance)
   - Custom methodology allows user-defined rules
   
3. **Calculation History**: Immutable snapshots with controlled unlock
   - Audit trail for corrections
   - Encrypted amounts at rest
   
4. **UI/UX**: Tailwind CSS + @headlessui/react (existing stack)
   - React Query for data fetching and caching
   - Methodology cards with comparison view
   
5. **Testing**: TDD with contract-first approach (>95% coverage for calculations)

6. **Security**: AES-256 encryption for snapshot amounts (existing infrastructure)

7. **Dependencies**: ZERO new dependencies required

8. **Islamic Compliance**: AAOIFI + Hanafi + Shafi'i methodologies with scholarly sources

**Output**: ✅ research.md created with 10 decision sections

## Phase 1: Design & Contracts ✅ COMPLETE

**Status**: All design artifacts and API contracts created

**Artifacts Created**:

1. **data-model.md** (✅ Complete)
   - 4 entities: User (extended), CalculationSnapshot, SnapshotAssetValue, MethodologyConfig
   - Full Prisma schemas with relationships
   - Encryption requirements (5 encrypted fields)
   - Validation rules and state transitions
   - Migration SQL scripts
   - Performance considerations

2. **API Contracts** (✅ Complete - 3 files in /contracts/)
   - `calendar.yaml`: 3 endpoints (convert, zakat-year, preference)
   - `calculations.yaml`: 7 endpoints (calculate, history, unlock/lock, compare)
   - `methodology.yaml`: 3 endpoint groups (list, custom CRUD, info)
   - Total: 13 API endpoints with full OpenAPI 3.0 specs

3. **quickstart.md** (✅ Complete)
   - 5 validation scenarios with curl examples
   - Frontend UI validation checklist (15 components)
   - Error handling validation
   - Performance targets (<200ms calculations)
   - Security validation (encryption checks)
   - Completion checklist

**Design Summary**:

- **Total Entities**: 4 (1 extended, 3 new)
- **Total API Endpoints**: 13
- **Total UI Components**: 15
- **Encrypted Fields**: 5 (AES-256-CBC)
- **Test Coverage Target**: >95% for calculation logic
- **Performance Targets**: <200ms calculations, <500ms history

**Next Steps**: Generate contract tests (see below)

1. **Extract entities from feature spec** → `data-model.md` (DONE):
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
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

**Output**: ✅ data-model.md, /contracts/* (3 files), quickstart.md, .github/copilot-instructions.md updated

## Phase 2: Task Planning Approach

**Status**: PLANNED (not executed during /plan - will be executed by /tasks command)

*This section describes what the /tasks command will do when invoked*

### Task Generation Strategy

The `/tasks` command will:

1. **Load Base Template**: `.specify/templates/tasks-template.md`
2. **Extract from Design Artifacts**:
   - `data-model.md` → Database migration tasks, model creation tasks
   - `contracts/*.yaml` → Contract test tasks (13 endpoints)
   - `spec.md` user stories → Integration test tasks (5 stories)
   - `quickstart.md` scenarios → Validation tasks

3. **Generate Task Categories**:
   - **Database Tasks** (Priority 1): Prisma schema updates, migrations
   - **Contract Test Tasks** (Priority 2): Failing tests for each endpoint [P]
   - **Service Layer Tasks** (Priority 3): Calendar, Calculation, History services
   - **API Endpoint Tasks** (Priority 4): Controllers for 13 endpoints
   - **UI Component Tasks** (Priority 5): 15 React components
   - **Integration Test Tasks** (Priority 6): End-to-end scenarios
   - **Documentation Tasks** (Priority 7): README updates, deployment guide

### Task Ordering Strategy

1. **TDD Approach**: Tests before implementation
   - Contract tests first (fail initially)
   - Implementation tasks to make tests pass
   - Integration tests last (validate complete flows)

2. **Dependency Order**:
   - Database schema → Models → Services → Controllers → UI
   - CalendarService before ZakatCalculationService (dependency)
   - Backend complete before frontend integration

3. **Parallel Execution Markers**:
   - Mark independent tasks with [P] for parallel execution
   - Examples: Contract tests [P], UI components [P], separate services [P]

### Estimated Task Breakdown

- **Database/Models**: 4 tasks (schema, migrations, relationships)
- **Contract Tests**: 13 tasks (1 per endpoint) [P]
- **Backend Services**: 6 tasks (Calendar, Calculation extend, History, Methodology)
- **API Controllers**: 13 tasks (1 per endpoint)
- **Frontend Components**: 15 tasks (1 per component) [P]
- **Integration Tests**: 5 tasks (1 per user story)
- **Documentation/Polish**: 4 tasks (README, deployment, final validation)

**Total Estimated Tasks**: ~60 tasks organized in 7 priority groups

### Task Template Format

Each task will follow this structure:

```markdown
### Task N: [Task Title]

**Type**: [Database|Test|Service|Controller|Component|Integration|Documentation]
**Priority**: [1-7]
**Estimated Time**: [hours]
**Parallel**: [Yes|No]
**Dependencies**: [List of task numbers]

**Description**: Clear description of what to implement

**Acceptance Criteria**:
- [ ] Criterion 1
- [ ] Criterion 2

**Files to Modify/Create**:
- `path/to/file.ts`

**Testing**:
- Unit test: `path/to/test.ts`
- Integration test: [if applicable]
```

**Output**: tasks.md will be generated by `/tasks` command (NOT during /plan)

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

- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning complete (/plan command - describe approach only) ✅
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS ✅
- [x] Post-Design Constitution Check: PASS ✅
- [x] All NEEDS CLARIFICATION resolved ✅
- [x] Complexity deviations documented: N/A (no violations) ✅

---
*Based on Constitution v0.2.0 - See `/memory/constitution.md`*
