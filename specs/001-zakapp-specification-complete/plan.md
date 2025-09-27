
# Implementation Plan: ZakApp - Complete Self-Hosted Zakat Calculator

**Branch**: `001-zakapp-specification-complete` | **Date**: 2025-09-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-zakapp-specification-complete/spec.md`

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
ZakApp is a privacy-first, self-hosted Islamic Zakat calculator requiring comprehensive asset management, multiple calculation methodologies (Standard, Hanafi, Shafi'i, Custom), yearly tracking capabilities, and security-first architecture. The application prioritizes user privacy, data security, Islamic compliance, and delightful user experience through modern web technologies with full-stack TypeScript implementation.

## Technical Context
**Language/Version**: TypeScript 5.0+, Node.js 18+  
**Primary Dependencies**: Express.js, React 18, Prisma ORM, JWT authentication, crypto-js  
**Storage**: SQLite with AES-256-CBC encryption for sensitive data  
**Testing**: Jest + Supertest (backend), React Testing Library (frontend)  
**Target Platform**: Linux server (self-hosted), modern web browsers  
**Project Type**: web - Full-stack web application with separate backend/frontend  
**Performance Goals**: <2s page load times, >90% test coverage, secure session management  
**Constraints**: Self-hosted deployment, AES-256 encryption mandatory, WCAG 2.1 AA compliance  
**Scale/Scope**: Individual users, comprehensive asset management, multi-methodology calculations

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Lovable UI/UX**: ✅ PASS - Feature spec emphasizes "lovable UI/UX", responsive design, and WCAG 2.1 AA accessibility compliance
**II. User-Centric Design**: ✅ PASS - All decisions prioritize user needs, guided workflows for new users, and simplified Zakat calculation presentation
**III. Privacy and Security First (NON-NEGOTIABLE)**: ✅ PASS - Mandatory AES-256-CBC encryption, self-hosting capabilities, JWT authentication, no third-party data sharing
**IV. Spec-Driven Development**: ✅ PASS - Complete feature specification with clear acceptance criteria drives all development decisions
**V. Simplicity & Clarity**: ✅ PASS - Complex Zakat calculations presented with educational context, methodology references, and clear explanations
**VI. Open and Extensible**: ✅ PASS - RESTful API design, modular architecture supporting multiple methodologies and future integrations

**Quality Standards**: ✅ PASS - >90% test coverage required, <2s page load times, WCAG 2.1 AA compliance, accurate Islamic calculations
**Security Framework**: ✅ PASS - JWT authentication, AES-256 encryption, rate limiting, input validation, comprehensive security measures

**Initial Constitution Check**: PASS - No violations detected

**Post-Design Constitution Check**: ✅ PASS
- Design artifacts (data-model.md, contracts/, quickstart.md, copilot-instructions.md) reviewed
- All constitutional principles maintained in technical design
- Security-first architecture preserved with encryption specifications
- Islamic compliance ensured through methodology support and educational content
- Lovable UI/UX supported through comprehensive quickstart and agent instructions
- Spec-driven approach validated through complete API contracts and data modeling

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
# Web application structure (backend + frontend)
server/
├── src/
│   ├── controllers/     # API endpoint handlers
│   ├── services/        # Business logic layer
│   ├── models/          # Prisma database models
│   ├── middleware/      # Authentication, validation, security
│   ├── utils/           # Encryption, helpers, calculations
│   ├── routes/          # Express route definitions  
│   └── types/           # TypeScript definitions
├── prisma/              # Database schema and migrations
├── tests/               # Backend test suites
└── data/                # SQLite database storage

client/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Route page components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API client layer
│   ├── contexts/        # React context providers
│   ├── utils/           # Client-side utilities
│   └── types/           # Shared TypeScript types
├── public/              # Static assets
└── tests/               # Frontend test suites

shared/                  # Shared types and utilities
├── types/               # Common TypeScript definitions
└── utils/               # Shared business logic
```

**Structure Decision**: Web application structure selected based on full-stack TypeScript requirements with separate backend/frontend for clear separation of concerns, security boundaries, and independent deployment capabilities.

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
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

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
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base structure
- Generate tasks from completed Phase 1 design artifacts:
  - Each API contract (auth.md, assets.md, zakat.md, user.md, data.md) → contract test tasks [P]
  - Each entity (User, Asset, Liability, ZakatCalculation, etc.) → model creation tasks [P]
  - Each user story from spec.md → integration test task
  - Implementation tasks to make all tests pass
- Follow TDD approach: test tasks before corresponding implementation tasks

**Ordering Strategy**:
- **Setup Phase**: Project initialization, dependencies, environment configuration
- **Test Phase**: Contract tests, entity tests, integration scenario tests (run before implementation)
- **Core Phase**: Models → Services → Controllers → Routes (dependency order)
- **Integration Phase**: Database setup → Middleware → Authentication → API endpoints
- **Polish Phase**: Error handling → Logging → Performance optimization → Documentation
- Mark [P] for parallel execution when tasks operate on independent files

**Estimated Task Breakdown**:
1. **Setup Tasks (5)**: Environment, dependencies, database schema, project structure
2. **Test Tasks (15)**: API contract tests, entity validation tests, integration scenarios  
3. **Core Implementation (20)**: Models, services, controllers, UI components
4. **Integration Tasks (10)**: Middleware, authentication, database connections, API routing
5. **Polish Tasks (8)**: Error handling, logging, performance, security validation

**Total Estimated Tasks**: 58 numbered, ordered tasks in tasks.md

**Dependencies Mapped**:
- Database models before services before controllers
- Authentication middleware before protected endpoints
- Asset management before Zakat calculation features
- Core functionality before UI polish and optimization

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
- [x] Phase 0: Research complete (/plan command) - research.md contains all technical decisions
- [x] Phase 1: Design complete (/plan command) - data-model.md, contracts/, quickstart.md, .github/copilot-instructions.md all exist
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete  
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS (re-validated after design artifacts)
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented (none required)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
