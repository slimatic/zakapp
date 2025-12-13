# Implementation Plan: Dynamic Asset Eligibility Checkboxes for Zakat Calculation

**Branch**: `021-experimental-feature-update` | **Date**: 2025-12-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/021-experimental-feature-update/spec.md`

## Summary

This feature extends the Asset model to support dynamic calculation modifiers based on Islamic scholarly guidance for different investment types. Implements two key business logic rules:

1. **30% Rule for Passive Investments**: Stocks, ETFs, and Mutual Funds can be marked as passive long-term investments, calculating Zakat on 30% of asset value (representing estimated liquid assets of underlying companies)

2. **Accessibility Exception for Restricted Accounts**: 401k, Traditional IRA, and Pension accounts can be marked as restricted/inaccessible, deferring Zakat (0% calculation) until withdrawal

The feature adds conditional UI checkboxes, extends the database schema with three new fields (`calculationModifier`, `isPassiveInvestment`, `isRestrictedAccount`), updates the Zakat calculation engine to apply modifiers using the formula `Total Zakat = Σ (Asset Value × Modifier × 0.025)`, and provides educational tooltips aligned with Simple Zakat Guide methodologies.

## Technical Context

**Language/Version**: TypeScript 4.9.5 (Node.js 16+ for backend, React 19.1.1 for frontend)  
**Primary Dependencies**: 
- Backend: Express.js, Prisma ORM 6.16.2, Zod 3.25.76, bcrypt, jsonwebtoken
- Frontend: React 19.1.1, React Router 6.28.1, TanStack Query 5.90.2, Tailwind CSS, Radix UI, React Hook Form 7.63.0
**Storage**: SQLite with Prisma ORM (AES-256-CBC encryption for sensitive data)  
**Testing**: Jest + Supertest (backend), React Testing Library + Jest (frontend), Playwright (E2E)  
**Target Platform**: Self-hostable Docker-native web application (Docker Compose), Linux/macOS/Windows  
**Project Type**: Full-stack web application (separate backend/frontend)  
**Performance Goals**: 
- <2s page load times (Constitutional requirement)
- Calculation engine <100ms for 50+ assets
- UI updates <200ms for modifier changes
**Constraints**: 
- >90% test coverage for calculation logic (Constitutional requirement)
- AES-256-CBC encryption for all financial data
- Zero transmission of financial data to third parties
- WCAG 2.1 AA accessibility compliance
- Islamic scholarly alignment with Simple Zakat Guide
**Scale/Scope**: 
- Multi-user application with JWT authentication
- Support for 50+ assets per user
- Historical snapshot preservation with modifiers
- Currency conversion with modifier application

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Professional & Modern User Experience
- ✅ **Guided Workflow**: Conditional checkboxes appear only for relevant asset types with clear educational tooltips
- ✅ **Data Visualization**: Assets display modifier badges/indicators in calculation summary
- ✅ **Accessibility**: WCAG 2.1 AA compliance required for checkboxes and tooltips
- ✅ **Usability Validation**: Required before release (>90% comprehension in user testing)

### Principle II: Privacy & Security First (NON-NEGOTIABLE)
- ✅ **Encryption**: Modifier data stored unencrypted (boolean/decimal, not sensitive) but associated with encrypted assets
- ✅ **Zero-Trust**: Server-side validation of all modifier values (0.0, 0.3, 1.0)
- ✅ **No Third-Party Transmission**: Calculations performed entirely server-side
- ✅ **Audit Trail**: Modifier changes logged for security monitoring

### Principle III: Spec-Driven & Clear Development
- ✅ **Written Specification**: Complete spec.md with testable acceptance criteria
- ✅ **No [NEEDS CLARIFICATION]**: All requirements are clear and unambiguous
- ✅ **Islamic Sources Referenced**: Simple Zakat Guide alignment documented
- ✅ **Measurable Requirements**: 20 functional requirements with clear validation

### Principle IV: Quality & Performance
- ✅ **Test Coverage**: >90% target for calculation engine with modifiers
- ✅ **Performance**: <2s page loads, <100ms calculations, <200ms UI updates
- ✅ **Observability**: Modifier state changes tracked and loggable
- ✅ **Regression Prevention**: Backward compatibility with existing assets (default modifier = 1.0)

### Principle V: Foundational Islamic Guidance
- ✅ **Simple Zakat Guide Alignment**: 30% rule and accessibility exception aligned with scholarly guidance
- ✅ **Educational Content**: Tooltips reference Islamic principles with scholarly basis
- ✅ **Documented Methodology**: Implementation notes include scholarly reasoning
- ✅ **Scholarly Review Required**: Before release, content must be validated

**GATE STATUS**: ✅ PASS - All constitutional principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
```text
server/                           # Backend Node.js + Express + TypeScript
├── src/
│   ├── models/                   # Prisma models and types
│   ├── services/                 # Business logic layer
│   │   └── zakatService.ts       # [MODIFY] Add modifier logic to calculation engine
│   ├── controllers/              # API endpoint handlers
│   │   └── assetController.ts    # [MODIFY] Handle modifier fields in CRUD
│   ├── middleware/               # Authentication, validation
│   ├── routes/                   # Express route definitions
│   ├── utils/                    # Helpers and utilities
│   └── types/                    # TypeScript type definitions
├── prisma/
│   ├── schema.prisma             # [MODIFY] Add calculationModifier, isPassiveInvestment, isRestrictedAccount
│   └── migrations/               # [NEW] Migration for schema changes
└── __tests__/                    # Backend tests
  ├── unit/                     # [NEW] Unit tests for modifier calculations
  ├── integration/              # [NEW] Integration tests for API endpoints
  └── services/                 # [NEW] Service layer tests

client/                           # Frontend React + TypeScript
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── assets/               # Asset-related components
│   │   │   ├── AssetForm.tsx     # [MODIFY] Add conditional checkboxes
│   │   │   └── AssetCard.tsx     # [MODIFY] Display modifier badges
│   │   └── common/               # Shared components
│   │       └── InfoTooltip.tsx   # [NEW/REUSE] Educational tooltip component
│   ├── pages/                    # Page-level components
│   │   └── Assets.tsx            # [MODIFY] Update asset management page
│   ├── hooks/                    # Custom React hooks
│   │   └── useAssets.ts          # [MODIFY] Handle modifier fields in queries
│   ├── services/                 # API client services
│   │   └── assetApi.ts           # [MODIFY] Include modifier fields in API calls
│   ├── types/                    # TypeScript type definitions
│   │   └── asset.types.ts        # [MODIFY] Add modifier fields to Asset type
│   ├── utils/                    # Helper functions
│   │   └── assetModifiers.ts     # [NEW] Utility functions for modifier logic
│   └── content/                  # Educational content
│       └── zakatGuidance.ts      # [NEW] Islamic guidance text for tooltips
└── __tests__/                    # Frontend tests
  ├── components/               # [NEW] Component tests for checkboxes
  └── integration/              # [NEW] Integration tests for asset workflows

shared/                           # Shared TypeScript types between backend/frontend
├── src/
│   └── types/
│       └── asset.ts              # [MODIFY] Add modifier fields to shared types

tests/                            # E2E tests (Playwright)
└── e2e/
  └── asset-modifiers.spec.ts   # [NEW] E2E tests for modifier workflows
```

**Structure Decision**: Web application with separate backend (Node.js/Express/TypeScript) and frontend (React/TypeScript). This feature touches both layers:

- **Backend Changes**: Database schema (Prisma), calculation engine (zakatService), API endpoints (assetController)
- **Frontend Changes**: Asset form UI (conditional checkboxes), asset display (modifier badges), educational tooltips
- **Shared Types**: Updated Asset type definition for type safety across stack
- **Testing**: Comprehensive coverage at unit, integration, and E2E levels

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations detected.** This feature aligns with all constitutional principles and introduces no unnecessary complexity.

**Justifications for Implementation Approach**:

1. **Database Schema Extension**: Adding three fields (`calculationModifier`, `isPassiveInvestment`, `isRestrictedAccount`) to existing Asset model is the simplest approach. Alternative of creating separate tables for modifiers would add unnecessary complexity without benefit.

2. **Conditional UI Rendering**: Using conditional logic based on asset type is standard React pattern and maintains simplicity. Alternative of creating separate forms per asset type would violate DRY principle.

3. **Modifier Validation**: Enforcing valid values (0.0, 0.3, 1.0) via database constraint and Zod validation is essential for data integrity and Islamic compliance.

## Progress Tracking

### Phase 0: Research ✅ COMPLETE
**Status**: COMPLETE  
**Output**: `research.md`  
**Completed**: 2025-12-12

**Deliverables**:
- ✅ Islamic scholarly research on 30% rule for passive investments
- ✅ Islamic scholarly research on restricted account accessibility exception
- ✅ Technical approach evaluation (database schema, calculation engine, UI/UX)
- ✅ Performance analysis and security considerations
- ✅ Testing strategy defined
- ✅ Risk assessment completed

**Key Findings**:
- 30% rule supported by AAOIFI Sharia Standard No. 35 and contemporary scholars
- Accessibility exception based on Islamic principle of complete ownership (milk tāmm)
- Simple schema extension (3 fields) preferred over complex alternatives
- Minimal performance impact (<5ms per calculation)
- No new dependencies required

---

### Phase 1: Design ✅ COMPLETE
**Status**: COMPLETE  
**Outputs**: `data-model.md`, `contracts/assets-api.md`, `quickstart.md`  
**Completed**: 2025-12-12

**Deliverables**:
- ✅ Database schema changes defined (Prisma migration script)
- ✅ TypeScript type definitions for shared types
- ✅ Business logic functions specified (determineModifier, calculateZakat)
- ✅ Validation schemas defined (Zod)
- ✅ API contracts documented (all endpoints)
- ✅ Data flow diagrams created
- ✅ Query patterns and indexes defined
- ✅ Quickstart implementation guide written

**Key Artifacts**:
- `data-model.md`: Complete schema design with migration scripts
- `contracts/assets-api.md`: Full API specification with request/response examples
- `quickstart.md`: Step-by-step implementation guide with code examples

---

### Phase 2: Tasks (Not Started)
**Status**: PENDING  
**Output**: `tasks.md`  
**Command**: `/speckit.tasks` or equivalent

**Next Steps**:
1. Run task generation command to create detailed implementation tasks
2. Break down implementation into atomic, testable work items
3. Assign priorities and dependencies
4. Create task tracking for execution

**Note**: This phase is intentionally NOT completed by `/speckit.plan`. Run the tasks command separately.

---

### Implementation Phases (Not Started)

These will be tracked in `tasks.md` once Phase 2 is complete:

- ⏳ **Milestone 1**: Database Migration & Shared Types
- ⏳ **Milestone 2**: Backend Services & Validation
- ⏳ **Milestone 3**: Backend API Endpoints
- ⏳ **Milestone 4**: Frontend Utilities & Components
- ⏳ **Milestone 5**: Frontend Asset Form & Display
- ⏳ **Milestone 6**: Testing (Unit, Integration, E2E)
- ⏳ **Milestone 7**: Documentation & Deployment

---

## Execution Summary

**Plan Generation**: ✅ COMPLETE  
**Date Completed**: 2025-12-12  
**Branch**: `021-experimental-feature-update`

**Artifacts Generated**:
1. ✅ `plan.md` - This implementation plan
2. ✅ `research.md` - Phase 0 research and analysis
3. ✅ `data-model.md` - Phase 1 database and type design
4. ✅ `contracts/assets-api.md` - Phase 1 API contract definitions
5. ✅ `quickstart.md` - Phase 1 implementation guide

**Ready for Implementation**: ✅ YES

All planning and design phases are complete. The feature is ready for:
- Task breakdown (Phase 2)
- Implementation execution
- Testing and validation
- Deployment

**Next Command**: Run task generation to create `tasks.md` and begin implementation.
