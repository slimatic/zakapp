````markdown
# Implementation Plan: Milestone 5 - Tracking & Analytics Activation

**Branch**: `017-milestone-5-ensure` | **Date**: 2025-12-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/017-milestone-5-ensure/spec.md`

## Summary

This feature activates the Analytics and Payments functionality within ZakApp by:
1. Enabling frontend routes (`/analytics` and `/payments`) and navigation
2. Integrating payment recording with Nisab Year Records (terminology change from "snapshots")
3. Building Analytics dashboard with two data sources:
   - **Wealth over time**: Asset networth tracking (independent of Nisab Records)
   - **Zakat obligations**: Nisab Record data showing due/paid/outstanding per year
4. Ensuring consistent UI terminology: "Nisab Year Records" (never "snapshots")

**Technical Approach**: UI integration with existing backend services (AnalyticsService, PaymentService, YearlySnapshotModel) while enforcing terminology changes throughout user-facing elements.

## Technical Context

**Language/Version**: TypeScript 5.x (Backend: Node.js 20.x, Frontend: React 18.x)
**Primary Dependencies**: 
  - Backend: Express.js, Prisma ORM, JWT authentication
  - Frontend: React Query (data fetching), Recharts (visualizations), Tailwind CSS
  - Shared: @zakapp/shared types package
**Storage**: SQLite with Prisma (existing schema: YearlySnapshot mapped to `nisab_year_records`, PaymentRecord, Asset, AnalyticsMetric)
**Testing**: Jest + Supertest (backend), React Testing Library (frontend), >90% coverage target for calculation logic
**Target Platform**: Web application (self-hostable Docker containers)
**Project Type**: Web application (backend + frontend monorepo structure)
**Performance Goals**: <2 second page loads, real-time data updates via React Query (5min stale time)
**Constraints**: 
  - AES-256-CBC encryption for sensitive data at rest
  - Zero-trust model: no third-party data transmission
  - WCAG 2.1 AA accessibility compliance
**Scale/Scope**: 
  - 3 new UI pages (Analytics dashboard, Payments list, Payment form integration)
  - Terminology audit across existing components
  - No new backend services (leverages existing AnalyticsService, PaymentService)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **Professional & Modern User Experience**: Analytics visualizations (Recharts) with empty states, loading indicators, and accessible labels. Terminology consistency ("Nisab Year Records" vs "snapshots").

✅ **Privacy & Security First**: Existing AES-256 encryption maintained. No new third-party data transmission. Payment data encrypted at rest.

✅ **Spec-Driven & Clear Development**: Clarifications session completed (2025-12-07) with 5 architectural decisions documented. No ambiguities remain.

✅ **Quality & Performance**: Existing >90% coverage preserved. React Query caching (5min stale) for performance. Page load <2s maintained.

✅ **Foundational Islamic Guidance**: Payment linking to Nisab Year (Hawl) ensures correct Islamic calculation periods. Zakat obligation tracking per year aligns with Islamic requirements.

**Result**: All constitutional principles satisfied. No violations to justify.

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
backend/
├── server/
│   ├── src/
│   │   ├── services/
│   │   │   ├── AnalyticsService.ts        # Existing - provides wealth trend, zakat metrics
│   │   │   ├── PaymentService.ts          # Existing - CRUD for PaymentRecord
│   │   │   └── EncryptionService.ts       # Existing - AES-256 encryption
│   │   ├── models/
│   │   │   ├── YearlySnapshot.ts          # Existing - DB operations for nisab_year_records
│   │   │   ├── PaymentRecord.ts           # Existing - Payment model
│   │   │   └── Asset.ts                   # Existing - Asset model
│   │   └── routes/
│   │       ├── analytics.ts               # Existing - analytics API endpoints
│   │       └── payments.ts                # Existing - payment API endpoints
│   └── prisma/
│       └── schema.prisma                  # Existing - YearlySnapshot (@map "nisab_year_records"), PaymentRecord, Asset

frontend/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AnalyticsPage.tsx          # EXISTS - needs terminology audit
│   │   │   ├── PaymentsPage.tsx           # EXISTS - needs Nisab Record emphasis
│   │   │   └── NisabYearRecordsPage.tsx   # Existing - uses PaymentRecordForm
│   │   ├── components/
│   │   │   ├── tracking/
│   │   │   │   ├── PaymentRecordForm.tsx  # MODIFIED - added Nisab Year dropdown
│   │   │   │   └── AnalyticsCharts.tsx    # EXISTS - needs data source clarification
│   │   │   └── layout/
│   │   │       └── Layout.tsx             # MODIFIED - added Analytics/Payments nav
│   │   ├── hooks/
│   │   │   ├── useAnalytics.ts            # EXISTS - React Query hooks for analytics
│   │   │   └── usePayments.ts             # EXISTS - React Query hooks for payments
│   │   └── App.tsx                        # MODIFIED - enabled routes
│   └── tests/
│       └── components/
│           ├── AnalyticsPage.test.tsx     # TO CREATE
│           └── PaymentsPage.test.tsx      # TO CREATE

shared/
└── types/
    ├── analytics.ts                       # Existing - AnalyticsMetric types
    └── payment.ts                         # Existing - PaymentRecord types
```

**Structure Decision**: Web application (Option 2) with backend (Node.js + Express) and frontend (React) separation. This feature primarily focuses on frontend UI integration with existing backend services. Key changes:
- Routes enabled in `App.tsx`
- Navigation updated in `Layout.tsx`
- Payment form enhanced with Nisab Year selection
- Analytics/Payments pages audited for terminology consistency

## Complexity Tracking

No constitutional violations. This feature leverages existing architecture without introducing additional complexity.

---

## Progress Tracking

### Phase 0: Research (COMPLETE ✅)
- [x] Problem space analysis
- [x] Technical research (existing services, data model, frontend structure)
- [x] Risk assessment
- [x] Implementation strategy defined
- [x] **Artifact**: `research.md` created

### Phase 1: Design (COMPLETE ✅)
- [x] Data model documentation
- [x] API contracts defined (Analytics + Payments)
- [x] Quickstart guide created
- [x] Constitution re-check passed
- [x] **Artifacts**: 
  - `data-model.md` created
  - `contracts/analytics-api.md` created
  - `contracts/payments-api.md` created
  - `quickstart.md` created

### Phase 2: Task Breakdown (PENDING)
- [ ] Generate detailed tasks with `/tasks` command
- [ ] Assign priorities and dependencies
- [ ] Estimate effort per task
- [ ] **Artifact**: `tasks.md` (generated by `/tasks` command)

### Phase 3: Implementation (NOT STARTED)
- [ ] Execute tasks from `tasks.md`
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Manual testing

### Phase 4: Validation (NOT STARTED)
- [ ] Code review
- [ ] Accessibility audit
- [ ] Performance testing
- [ ] User acceptance testing

---

## Generated Artifacts

| Artifact | Status | Location | Description |
|----------|--------|----------|-------------|
| Plan | ✅ Complete | `plan.md` | This file - implementation plan overview |
| Research | ✅ Complete | `research.md` | Problem analysis, technical research, strategy |
| Data Model | ✅ Complete | `data-model.md` | Entity definitions, relationships, query patterns |
| Analytics API Contract | ✅ Complete | `contracts/analytics-api.md` | Analytics endpoints specification |
| Payments API Contract | ✅ Complete | `contracts/payments-api.md` | Payments endpoints specification |
| Quickstart Guide | ✅ Complete | `quickstart.md` | Developer implementation guide |
| Tasks | ⏳ Pending | `tasks.md` | Detailed task breakdown (run `/tasks`) |

---

## Implementation Phases

### Phase 1: Route Activation (P1) - Estimated 1 hour
**Status**: ✅ COMPLETE (implemented before plan creation)

Tasks:
- [x] Uncomment `/analytics` and `/payments` routes in `App.tsx`
- [x] Add navigation items to `Layout.tsx`
- [x] Verify lazy loading works
- [x] Test navigation flow

### Phase 2: Payment Integration (P1) - Estimated 2 hours
**Status**: ✅ COMPLETE (implemented before plan creation)

Tasks:
- [x] Add `useSnapshots` hook to `PaymentRecordForm.tsx`
- [x] Add Nisab Year dropdown to form
- [x] Update validation to require Nisab Year
- [x] Test payment creation with linking

### Phase 3: Terminology Audit (P1) - Estimated 1 hour
**Status**: ⏳ PENDING

Tasks:
- [ ] Search codebase for "snapshot" in user-facing strings
- [ ] Replace with "Nisab Year Record" or "Nisab Year"
- [ ] Update tooltips, labels, error messages
- [ ] Test all affected components

### Phase 4: Analytics Dashboard (P2) - Estimated 3 hours
**Status**: ⏳ PENDING

Tasks:
- [ ] Audit `AnalyticsPage.tsx` for data sources
- [ ] Ensure "Wealth over time" uses Asset data
- [ ] Ensure "Zakat obligations" uses Nisab Record data
- [ ] Add empty states and loading indicators
- [ ] Create chart components if missing
- [ ] Test with mock data and real data

### Phase 5: Payments Page Enhancement (P2) - Estimated 2 hours
**Status**: ⏳ PENDING

Tasks:
- [ ] Add Nisab Year filter dropdown
- [ ] Display linked Nisab Year in payment cards
- [ ] Add empty states
- [ ] Add loading indicators
- [ ] Test filtering and display

### Phase 6: Testing & Validation (P2) - Estimated 3 hours
**Status**: ⏳ PENDING

Tasks:
- [ ] Write component tests for `AnalyticsPage`
- [ ] Write component tests for `PaymentsPage`
- [ ] Test empty states
- [ ] Test error states
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance testing (page load <2s)

---

## Next Steps

1. **Generate Tasks**: Run `/tasks` to create detailed task breakdown
2. **Execute Phase 3**: Complete terminology audit
3. **Execute Phase 4-5**: Implement Analytics and Payments enhancements
4. **Execute Phase 6**: Testing and validation
5. **Code Review**: Get peer review before merge
6. **User Testing**: Validate UX with real users

---

## Success Metrics

### Must Have (P1)
- ✅ Analytics and Payments routes accessible from navigation
- ✅ Payment form allows selecting Nisab Year Record
- ✅ Payments correctly linked to Nisab Years in database
- ⏳ No "snapshot" terminology in user-facing UI
- ⏳ Analytics dashboard shows both wealth tracking and Zakat obligations

### Should Have (P2)
- ⏳ Empty states for no data scenarios
- ⏳ Loading indicators during data fetch
- ⏳ Error messages for API failures
- ⏳ Accessible charts (keyboard navigation, screen reader support)

### Nice to Have (P3)
- ⏳ Export payment history as CSV
- ⏳ Comparison slider for multi-year analytics
- ⏳ Payment receipt generation

---

## References

- **Specification**: `specs/017-milestone-5-ensure/spec.md`
- **Research**: `specs/017-milestone-5-ensure/research.md`
- **Data Model**: `specs/017-milestone-5-ensure/data-model.md`
- **API Contracts**: `specs/017-milestone-5-ensure/contracts/`
- **Quickstart**: `specs/017-milestone-5-ensure/quickstart.md`
- **Constitution**: `.github/copilot-instructions.md`
- **Feature 004**: Asset Management (dependency)
- **Feature 008**: Nisab Year Records (primary integration)

---

## Notes

### Already Implemented
Routes activation (Phase 1) and Payment integration (Phase 2) were implemented before this plan was created. These phases are marked complete.

### Remaining Work
Primary remaining work focuses on:
1. Terminology audit (search/replace "snapshot" → "Nisab Year Record")
2. Analytics dashboard data source clarification
3. Payments page enhancements (filter, display)
4. Testing and validation

### Estimated Time to Complete
- Remaining implementation: 6 hours
- Testing: 3 hours
- **Total**: ~9 hours of focused development work
