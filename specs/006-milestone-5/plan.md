# Implementation Plan: Tracking & Analytics System

**Branch**: `006-milestone-5` | **Date**: October 23, 2025 | **Spec**: /specs/006-milestone-5/spec.md
**Input**: Feature specification from `/specs/006-milestone-5/spec.md`

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

## Summary
Users need to track Zakat payments, view historical trends, and get timely reminders. The system will provide comprehensive analytics with visualizations, secure payment recording with zero-knowledge privacy, and export capabilities. Implementation will extend the existing Node.js/Express backend with TypeScript, React frontend, and SQLite database with AES-256 encryption.

## Technical Context
**Language/Version**: TypeScript 5.x (backend), TypeScript 5.x (frontend)  
**Primary Dependencies**: Node.js + Express.js, React 19.1.1, Prisma ORM, SQLite  
**Storage**: SQLite with Prisma ORM, AES-256 encryption for sensitive data  
**Testing**: Jest + Supertest (backend), React Testing Library (frontend)  
**Target Platform**: Web application (Linux server deployment)  
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: <500ms history loads, <200ms calculation times, <2s page loads  
**Constraints**: Zero-knowledge privacy, WCAG 2.1 AA accessibility, self-hostable  
**Scale/Scope**: Single-user application with encrypted local storage

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Professional & Modern User Experience
✅ **PASS**: Analytics dashboard with multiple visualization types (timeline, comparisons, progress tracking) provides clear data insights. In-app reminders with 30-day default timing. Export functionality for official records. All features include accessibility considerations.

### II. Privacy & Security First
✅ **PASS**: Zero-knowledge architecture ensures administrators cannot access user data. AES-256 encryption for payment records. User-controlled data retention and export-only sharing. No third-party data transmission.

### III. Spec-Driven & Clear Development  
✅ **PASS**: All ambiguities resolved through clarification phase. Requirements are testable and measurable. Acceptance scenarios defined. No [NEEDS CLARIFICATION] markers remain.

### IV. Quality & Performance
✅ **PASS**: Performance goals defined (<500ms history loads, <200ms calculations). Comprehensive analytics requiring data aggregation. Testing approach specified (Jest + Supertest, React Testing Library).

### V. Foundational Islamic Guidance
✅ **PASS**: Payment tracking aligns with Islamic Zakat principles. Analytics support proper giving patterns and annual obligations. No conflicts with established Zakat methodologies.

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
server/
├── src/
│   ├── models/          # Database models (Payment, Reminder, etc.)
│   ├── services/        # Business logic (PaymentService, AnalyticsService)
│   ├── routes/          # API endpoints (payments, analytics, export)
│   ├── middleware/      # Auth, validation, encryption
│   └── utils/           # Helper functions
└── tests/
    ├── unit/            # Unit tests for services
    ├── integration/     # API endpoint tests
    └── fixtures/        # Test data

client/
├── src/
│   ├── components/      # React components (AnalyticsDashboard, PaymentForm)
│   ├── pages/           # Page components (PaymentsHistory, Analytics)
│   ├── services/        # API client functions
│   ├── hooks/           # Custom React hooks
│   └── utils/           # Frontend utilities
└── tests/
    ├── components/      # Component tests
    ├── integration/     # E2E tests
    └── fixtures/        # Test data

shared/
├── types/               # TypeScript type definitions
├── constants/           # Shared constants
└── validation/          # Zod schemas
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Phase 0: Outline & Research

**Status**: Ready for execution

1. **Extract unknowns from Technical Context** above:
   - ✅ All technical context is resolved (no NEEDS CLARIFICATION markers)
   - ✅ Project structure confirmed as web application (frontend + backend)
   - ✅ Dependencies and performance goals defined

2. **Research Required**:
   - Database schema extensions for payment tracking and analytics
   - Chart library evaluation for React (performance, accessibility)
   - PDF generation libraries for export functionality
   - Reminder scheduling implementation approach
   - Data aggregation patterns for analytics

3. **Risk Assessment**:
   - **Low Risk**: Building on existing patterns (similar to asset management)
   - **Medium Risk**: Analytics complexity (data aggregation, multiple visualizations)
   - **Low Risk**: Privacy requirements align with existing encryption approach

4. **Success Criteria**:
   - Research complete when all technical approaches documented
   - No blocking unknowns identified
   - Constitution check still passes post-research

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts

**Prerequisites**: research.md complete  
**Status**: Ready for execution after Phase 0

### Design Approach
1. **API Contracts**: Define REST endpoints for payments, analytics, and export
2. **Data Model**: Extend Prisma schema for Payment and Reminder entities
3. **Component Design**: Design React components for analytics dashboard
4. **Integration Patterns**: Define service layer for analytics calculations

### Deliverables Created
1. **contracts/**: OpenAPI specifications for all new endpoints
2. **data-model.md**: Database schema changes and relationships
3. **quickstart.md**: Development setup and testing instructions
4. **agent-instructions.md**: Implementation guidance for AI agents

### Key Design Decisions
- Payment records stored with AES-256 encryption (matching existing assets)
- Analytics calculated on-demand to ensure data freshness
- Export functionality generates files server-side for security
- Reminder system uses simple in-app notifications (no email complexity)

### Testing Strategy
- Unit tests for all service layer functions (>90% coverage)
- Integration tests for API endpoints
- Component tests for analytics visualizations
- E2E tests for complete user workflows

1. **Extract entities from feature spec** → `data-model.md`:
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

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach

**Prerequisites**: Phase 1 design complete  
**Status**: Ready for /tasks command execution

### Task Generation Strategy
1. **Functional Requirements → Tasks**: Each FR-001 through FR-010 becomes 1-3 implementation tasks
2. **Cross-cutting Concerns**: Security, testing, and documentation tasks added
3. **Dependency Ordering**: Database changes first, then backend services, then frontend

### Task Organization
**Phase 2A: Foundation** (Database & Security)
- Payment entity schema design
- Encryption implementation for payment data
- Database migration scripts

**Phase 2B: Backend Services** (APIs & Logic)  
- Payment recording endpoints
- Analytics calculation services
- Export functionality (CSV/PDF)
- Reminder system logic

**Phase 2C: Frontend Components** (UI/UX)
- Payment history interface
- Analytics dashboard with visualizations
- Export controls
- Reminder notifications

**Phase 2D: Integration & Testing** (Quality Assurance)
- API integration tests
- Component testing
- E2E workflow tests
- Performance validation

### Task Estimation Approach
- **Small tasks**: 1-2 hours (single endpoint, simple component)
- **Medium tasks**: 4-6 hours (complex service, multi-component feature)
- **Large tasks**: 8-12 hours (analytics engine, export system)

### Success Criteria
- All FRs covered by at least one task
- Tasks follow TDD approach (tests before implementation)
- Dependencies clearly mapped
- Total effort estimate realistic and tracked

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
- [x] Phase 0: Research ready (plan command - prerequisites identified)
- [ ] Phase 1: Design pending (requires Phase 0 completion)
- [x] Phase 2: Task planning approach defined (plan command)
- [x] Phase 3: Tasks generated (45 tasks created covering all FRs)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PENDING
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v0.2.0 - See `/memory/constitution.md`*
