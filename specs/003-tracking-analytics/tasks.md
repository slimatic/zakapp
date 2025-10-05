# Tasks: Tracking & Analytics

**Input**: Design documents from## Phase 3.4: Core Implementation - Services
- [x] T030 [P] SnapshotService with CRUD + finalize in server/src/services/YearlySnapshotService.ts ✅
- [x] T031 [P] PaymentService with CRUD + aggregation in server/src/services/PaymentRecordService.ts ✅
- [x] T032 [P] AnalyticsService with caching logic in server/src/services/AnalyticsService.ts ✅
- [ ] T033 [P] SummaryService with annual report generation in server/src/services/AnnualSummaryService.ts (IN PROGRESS - needs fixes)
- [ ] T034 [P] ReminderService with trigger calculation in server/src/services/ReminderService.ts
- [x] T035 [P] CalendarService with Hijri conversion in server/src/services/CalendarConversionService.ts ✅
- [ ] T036 ComparisonService with multi-snapshot analysis in server/src/services/ComparisonService.ts/003-tracking-analytics/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

## Feature Summary
- **46 Functional Requirements**: Historical tracking, payment recording, analytics dashboard, comparison, export, reminders
- **5 Entities**: YearlySnapshot, PaymentRecord, AnalyticsMetric, AnnualSummary, ReminderEvent
- **Tech Stack**: TypeScript 4.9, Node.js 18+, React 18, Express.js, Prisma ORM, SQLite
- **Frontend Libraries**: React Query, Recharts, date-fns-jalali, hijri-converter, jsPDF
- **Performance Goals**: <500ms queries, <2s dashboard load, 50+ years history support

## Path Conventions
This is a web application with the following structure:
- **Backend**: `backend/src/`, `backend/prisma/`
- **Frontend**: `frontend/src/`
- **Shared**: `shared/types/`

## Phase 3.1: Setup & Dependencies
- [x] T001 Install backend dependencies: hijri-converter, date-fns-jalali in backend/package.json
- [x] T002 [P] Install frontend dependencies: recharts, jspdf, jspdf-autotable in frontend/package.json
- [x] T003 [P] Add shared TypeScript types in shared/types/tracking.ts for all 5 entities
- [x] T004 Update Prisma schema with 5 new models in backend/prisma/schema.prisma
- [x] T005 Generate and run Prisma migration for tracking tables in backend/prisma/migrations/
- [x] **🔸 COMMIT CHECKPOINT**: feat: Add tracking & analytics dependencies and database schema

## Phase 3.2: Tests First (TDD) ⚠️ SKIPPED FOR NOW
**NOTE: Skipped per user request - will implement tests later**

### Contract Tests (API Endpoints)
- [ ] T006 [P] Contract test POST /api/tracking/snapshots in backend/src/__tests__/contract/snapshots-post.test.ts
- [ ] T007 [P] Contract test GET /api/tracking/snapshots in backend/src/__tests__/contract/snapshots-get.test.ts
- [ ] T008 [P] Contract test GET /api/tracking/snapshots/:id in backend/src/__tests__/contract/snapshots-get-id.test.ts
- [ ] T009 [P] Contract test PUT /api/tracking/snapshots/:id in backend/src/__tests__/contract/snapshots-put.test.ts
- [ ] T010 [P] Contract test DELETE /api/tracking/snapshots/:id in backend/src/__tests__/contract/snapshots-delete.test.ts
- [ ] T011 [P] Contract test POST /api/tracking/snapshots/:id/finalize in backend/src/__tests__/contract/snapshots-finalize.test.ts
- [ ] T012 [P] Contract test GET /api/tracking/comparison in backend/src/__tests__/contract/comparison-get.test.ts

### Integration Tests (User Scenarios)
- [ ] T013 [P] Integration test: Create draft snapshot → edit → finalize in backend/src/__tests__/integration/snapshot-lifecycle.test.ts
- [ ] T014 [P] Integration test: Record multiple payments for snapshot in backend/src/__tests__/integration/payment-recording.test.ts
- [ ] T015 [P] Integration test: Compare 3 years of snapshots side-by-side in backend/src/__tests__/integration/snapshot-comparison.test.ts
- [ ] T016 [P] Integration test: Generate annual summary with payments in backend/src/__tests__/integration/annual-summary.test.ts
- [ ] T017 [P] Integration test: Dashboard analytics with cache validation in backend/src/__tests__/integration/analytics-dashboard.test.ts
- [ ] T018 [P] Integration test: Export snapshot to PDF with Hijri dates in backend/src/__tests__/integration/pdf-export.test.ts
- [ ] T019 [P] Integration test: Reminder creation and acknowledgment flow in backend/src/__tests__/integration/reminder-flow.test.ts

### Frontend Component Tests
- [ ] T020 [P] Component test: SnapshotForm with dual calendar inputs in frontend/src/__tests__/components/SnapshotForm.test.tsx
- [ ] T021 [P] Component test: PaymentRecordForm with Islamic categories in frontend/src/__tests__/components/PaymentRecordForm.test.tsx
- [ ] T022 [P] Component test: AnalyticsChart with Recharts rendering in frontend/src/__tests__/components/AnalyticsChart.test.tsx
- [ ] T023 [P] Component test: ComparisonTable with 3 snapshots in frontend/src/__tests__/components/ComparisonTable.test.tsx
- [ ] T024 [P] Component test: AnnualSummaryCard with PDF download in frontend/src/__tests__/components/AnnualSummaryCard.test.tsx
- [ ] **🔸 COMMIT CHECKPOINT**: test: Add comprehensive TDD test suite for tracking feature (all failing)

## Phase 3.3: Core Implementation - Data Models (ONLY after tests are failing)
- [x] T025 [P] YearlySnapshot Prisma model validations in backend/src/models/YearlySnapshot.ts
- [x] T026 [P] PaymentRecord Prisma model validations in backend/src/models/PaymentRecord.ts
- [x] T027 [P] AnalyticsMetric Prisma model validations in backend/src/models/AnalyticsMetric.ts
- [x] T028 [P] AnnualSummary Prisma model validations in backend/src/models/AnnualSummary.ts
- [x] T029 [P] ReminderEvent Prisma model validations in backend/src/models/ReminderEvent.ts
- [x] **🔸 COMMIT CHECKPOINT**: feat: Implement data models for tracking entities

## Phase 3.4: Core Implementation - Services
- [x] T030 [P] SnapshotService with CRUD + finalize in server/src/services/YearlySnapshotService.ts ✅
- [ ] T031 [P] PaymentService with CRUD + aggregation in server/src/services/PaymentRecordService.ts
- [ ] T032 [P] AnalyticsService with caching logic in server/src/services/AnalyticsService.ts
- [ ] T033 [P] SummaryService with annual report generation in server/src/services/AnnualSummaryService.ts
- [ ] T034 [P] ReminderService with trigger calculation in server/src/services/ReminderService.ts
- [ ] T035 [P] CalendarService with Hijri conversion in server/src/services/CalendarService.ts
- [ ] T036 ComparisonService with multi-snapshot analysis in server/src/services/ComparisonService.ts
- [ ] **🔸 COMMIT CHECKPOINT**: feat: Implement business logic services for tracking

## Phase 3.5: Core Implementation - API Routes
- [ ] T037 POST /api/tracking/snapshots route in backend/src/routes/tracking.ts
- [ ] T038 GET /api/tracking/snapshots route with pagination in backend/src/routes/tracking.ts
- [ ] T039 GET /api/tracking/snapshots/:id route in backend/src/routes/tracking.ts
- [ ] T040 PUT /api/tracking/snapshots/:id route with draft validation in backend/src/routes/tracking.ts
- [ ] T041 DELETE /api/tracking/snapshots/:id route in backend/src/routes/tracking.ts
- [ ] T042 POST /api/tracking/snapshots/:id/finalize route in backend/src/routes/tracking.ts
- [ ] T043 GET /api/tracking/comparison route in backend/src/routes/tracking.ts
- [ ] T044 Mount tracking routes in backend/src/index.ts with auth middleware
- [ ] **🔸 COMMIT CHECKPOINT**: feat: Implement tracking API endpoints with validation

## Phase 3.6: Frontend - Shared Utilities
- [ ] T045 [P] CalendarConverter utility with date-fns-jalali in frontend/src/utils/calendarConverter.ts
- [ ] T046 [P] ChartDataFormatter utility for Recharts in frontend/src/utils/chartFormatter.ts
- [ ] T047 [P] PDFGenerator utility with jsPDF in frontend/src/utils/pdfGenerator.ts
- [ ] T048 [P] Currency formatter with multiple currencies in frontend/src/utils/formatters.ts
- [ ] **🔸 COMMIT CHECKPOINT**: feat: Add frontend utility functions for tracking

## Phase 3.7: Frontend - React Query Hooks
- [ ] T049 [P] useSnapshots hook with pagination in frontend/src/hooks/useSnapshots.ts
- [ ] T050 [P] useCreateSnapshot mutation hook in frontend/src/hooks/useCreateSnapshot.ts
- [ ] T051 [P] useUpdateSnapshot mutation hook in frontend/src/hooks/useUpdateSnapshot.ts
- [ ] T052 [P] useFinalizeSnapshot mutation hook in frontend/src/hooks/useFinalizeSnapshot.ts
- [ ] T053 [P] useDeleteSnapshot mutation hook in frontend/src/hooks/useDeleteSnapshot.ts
- [ ] T054 [P] usePayments hook with filtering in frontend/src/hooks/usePayments.ts
- [ ] T055 [P] useAnalytics hook with caching in frontend/src/hooks/useAnalytics.ts
- [ ] T056 [P] useComparison hook in frontend/src/hooks/useComparison.ts
- [ ] T057 [P] useReminders hook in frontend/src/hooks/useReminders.ts
- [ ] **🔸 COMMIT CHECKPOINT**: feat: Add React Query hooks for tracking data management

## Phase 3.8: Frontend - Core Components
- [ ] T058 [P] SnapshotForm component with dual calendar in frontend/src/components/tracking/SnapshotForm.tsx
- [ ] T059 [P] SnapshotCard component with status badge in frontend/src/components/tracking/SnapshotCard.tsx
- [ ] T060 [P] SnapshotList component with pagination in frontend/src/components/tracking/SnapshotList.tsx
- [ ] T061 [P] PaymentRecordForm with Islamic categories in frontend/src/components/tracking/PaymentRecordForm.tsx
- [ ] T062 [P] PaymentList component with filtering in frontend/src/components/tracking/PaymentList.tsx
- [ ] T063 [P] ComparisonTable component with side-by-side view in frontend/src/components/tracking/ComparisonTable.tsx
- [ ] T064 [P] AnalyticsChart component with Recharts in frontend/src/components/tracking/AnalyticsChart.tsx
- [ ] T065 [P] AnnualSummaryCard with PDF export in frontend/src/components/tracking/AnnualSummaryCard.tsx
- [ ] T066 [P] ReminderBanner component with dismiss action in frontend/src/components/tracking/ReminderBanner.tsx
- [ ] **🔸 COMMIT CHECKPOINT**: feat: Implement tracking UI components

## Phase 3.9: Frontend - Pages & Navigation
- [ ] T067 TrackingDashboard page with overview in frontend/src/pages/TrackingDashboard.tsx
- [ ] T068 SnapshotsPage with list and create in frontend/src/pages/SnapshotsPage.tsx
- [ ] T069 SnapshotDetailPage with edit/finalize in frontend/src/pages/SnapshotDetailPage.tsx
- [ ] T070 PaymentsPage with recording form in frontend/src/pages/PaymentsPage.tsx
- [ ] T071 AnalyticsPage with charts and metrics in frontend/src/pages/AnalyticsPage.tsx
- [ ] T072 ComparisonPage with multi-select in frontend/src/pages/ComparisonPage.tsx
- [ ] T073 Add tracking routes to frontend/src/App.tsx
- [ ] T074 Add tracking menu items to frontend/src/components/Navigation.tsx
- [ ] **🔸 COMMIT CHECKPOINT**: feat: Implement tracking pages and navigation

## Phase 3.10: Integration - Background Jobs
- [ ] T075 [P] Cache cleanup job for expired AnalyticsMetrics in backend/src/jobs/cleanupCache.ts
- [ ] T076 [P] Reminder generation job for anniversaries in backend/src/jobs/generateReminders.ts
- [ ] T077 [P] Summary regeneration job for updated data in backend/src/jobs/regenerateSummaries.ts
- [ ] T078 Job scheduler configuration in backend/src/jobs/scheduler.ts
- [ ] T079 Add job initialization to backend/src/index.ts
- [ ] **🔸 COMMIT CHECKPOINT**: feat: Add background jobs for tracking maintenance

## Phase 3.11: Integration - Encryption & Security
- [ ] T080 Encrypt financial fields in YearlySnapshot in backend/src/services/SnapshotService.ts
- [ ] T081 Encrypt recipient info in PaymentRecord in backend/src/services/PaymentService.ts
- [ ] T082 Encrypt analytics data in AnalyticsMetric in backend/src/services/AnalyticsService.ts
- [ ] T083 Encrypt summary data in AnnualSummary in backend/src/services/SummaryService.ts
- [ ] T084 Add user ownership validation to all routes in backend/src/routes/tracking.ts
- [ ] T085 Rate limiting for tracking endpoints in backend/src/middleware/security.ts
- [ ] **🔸 COMMIT CHECKPOINT**: feat: Add encryption and security for tracking data

## Phase 3.12: Integration - Performance Optimization
- [ ] T086 [P] Database indexes for snapshot queries in backend/prisma/schema.prisma
- [ ] T087 [P] Analytics cache TTL optimization in backend/src/services/AnalyticsService.ts
- [ ] T088 [P] Pagination optimization for large datasets in backend/src/services/SnapshotService.ts
- [ ] T089 [P] Chart data memoization in frontend/src/hooks/useAnalytics.ts
- [ ] T090 [P] Component lazy loading for pages in frontend/src/App.tsx
- [ ] T091 Generate Prisma migration for indexes in backend/prisma/migrations/
- [ ] **🔸 COMMIT CHECKPOINT**: perf: Optimize tracking feature performance

## Phase 3.13: Polish - Unit Tests
- [ ] T092 [P] Unit tests for CalendarService in backend/src/__tests__/unit/CalendarService.test.ts
- [ ] T093 [P] Unit tests for ComparisonService in backend/src/__tests__/unit/ComparisonService.test.ts
- [ ] T094 [P] Unit tests for AnalyticsService cache logic in backend/src/__tests__/unit/AnalyticsService.test.ts
- [ ] T095 [P] Unit tests for SummaryService calculations in backend/src/__tests__/unit/SummaryService.test.ts
- [ ] T096 [P] Unit tests for ReminderService triggers in backend/src/__tests__/unit/ReminderService.test.ts
- [ ] T097 [P] Unit tests for CalendarConverter utility in frontend/src/__tests__/unit/calendarConverter.test.ts
- [ ] T098 [P] Unit tests for PDFGenerator in frontend/src/__tests__/unit/pdfGenerator.test.ts
- [ ] T099 [P] Unit tests for ChartDataFormatter in frontend/src/__tests__/unit/chartFormatter.test.ts
- [ ] **🔸 COMMIT CHECKPOINT**: test: Add comprehensive unit test coverage

## Phase 3.14: Polish - E2E Tests
- [ ] T100 [P] E2E test: Create yearly snapshot workflow in backend/src/__tests__/e2e/snapshot-creation.spec.ts
- [ ] T101 [P] E2E test: Record payments and view summary in backend/src/__tests__/e2e/payment-flow.spec.ts
- [ ] T102 [P] E2E test: Compare multiple years in backend/src/__tests__/e2e/comparison-flow.spec.ts
- [ ] T103 [P] E2E test: Export snapshot to PDF in backend/src/__tests__/e2e/export-flow.spec.ts
- [ ] T104 [P] E2E test: Reminder acknowledgment in backend/src/__tests__/e2e/reminder-flow.spec.ts
- [ ] **🔸 COMMIT CHECKPOINT**: test: Add end-to-end test coverage

## Phase 3.15: Polish - Documentation
- [ ] T105 [P] API documentation for tracking endpoints in docs/api/tracking.md
- [ ] T106 [P] User guide for tracking features in docs/user-guide/tracking.md
- [ ] T107 [P] Developer guide for calendar system in docs/dev/calendar-system.md
- [ ] T108 [P] Component documentation with Storybook in frontend/src/components/tracking/*.stories.tsx
- [ ] T109 [P] Update main README.md with tracking features
- [ ] T110 Update CHANGELOG.md with tracking feature details
- [ ] **🔸 COMMIT CHECKPOINT**: docs: Add comprehensive documentation for tracking feature

## Phase 3.16: Polish - Manual Testing & Validation
- [ ] T111 Execute quickstart.md Phase 1: Yearly snapshot creation (15 min)
- [ ] T112 Execute quickstart.md Phase 2: Payment recording (20 min)
- [ ] T113 Execute quickstart.md Phase 3: Analytics dashboard (15 min)
- [ ] T114 Execute quickstart.md Phase 4: Yearly comparison (15 min)
- [ ] T115 Execute quickstart.md Phase 5: Data export (15 min)
- [ ] T116 Execute quickstart.md Phase 6: Reminders (10 min)
- [ ] T117 Validate all success criteria from quickstart.md
- [ ] **🔸 COMMIT CHECKPOINT**: chore: Complete manual testing validation

## Dependencies Graph

### Sequential Dependencies
- T004 (Prisma schema) → T005 (migrations) → T025-T029 (models)
- T025-T029 (models) → T030-T036 (services)
- T030-T036 (services) → T037-T044 (API routes)
- T044 (route mounting) → T080-T085 (security)
- T086-T087 (indexes) → T091 (migration)
- T006-T024 (tests) → T025-T091 (implementation)
- T001-T002 (dependencies) → all other tasks

### Phase Dependencies
- Phase 3.1 (Setup) → all other phases
- Phase 3.2 (Tests) → Phases 3.3-3.16
- Phases 3.3-3.5 (Backend Core) → Phase 3.10-3.12 (Integration)
- Phases 3.6-3.9 (Frontend) → Phase 3.12 (Performance)
- All implementation → Phase 3.13-3.14 (Polish Tests)
- All code complete → Phase 3.15-3.16 (Docs & Validation)

## Parallel Execution Examples

### Phase 3.2 - All Contract Tests (After T005)
```
Task: "Contract test POST /api/tracking/snapshots in backend/src/__tests__/contract/snapshots-post.test.ts"
Task: "Contract test GET /api/tracking/snapshots in backend/src/__tests__/contract/snapshots-get.test.ts"
Task: "Contract test GET /api/tracking/snapshots/:id in backend/src/__tests__/contract/snapshots-get-id.test.ts"
Task: "Contract test PUT /api/tracking/snapshots/:id in backend/src/__tests__/contract/snapshots-put.test.ts"
Task: "Contract test DELETE /api/tracking/snapshots/:id in backend/src/__tests__/contract/snapshots-delete.test.ts"
Task: "Contract test POST /api/tracking/snapshots/:id/finalize in backend/src/__tests__/contract/snapshots-finalize.test.ts"
Task: "Contract test GET /api/tracking/comparison in backend/src/__tests__/contract/comparison-get.test.ts"
```

### Phase 3.3 - All Data Models (After T024)
```
Task: "YearlySnapshot Prisma model validations in backend/src/models/YearlySnapshot.ts"
Task: "PaymentRecord Prisma model validations in backend/src/models/PaymentRecord.ts"
Task: "AnalyticsMetric Prisma model validations in backend/src/models/AnalyticsMetric.ts"
Task: "AnnualSummary Prisma model validations in backend/src/models/AnnualSummary.ts"
Task: "ReminderEvent Prisma model validations in backend/src/models/ReminderEvent.ts"
```

### Phase 3.4 - Most Service Layers (After T029)
```
Task: "SnapshotService with CRUD + finalize in backend/src/services/SnapshotService.ts"
Task: "PaymentService with CRUD + aggregation in backend/src/services/PaymentService.ts"
Task: "AnalyticsService with caching logic in backend/src/services/AnalyticsService.ts"
Task: "SummaryService with annual report generation in backend/src/services/SummaryService.ts"
Task: "ReminderService with trigger calculation in backend/src/services/ReminderService.ts"
Task: "CalendarService with Hijri conversion in backend/src/services/CalendarService.ts"
```

### Phase 3.7 - All React Query Hooks (After T048)
```
Task: "useSnapshots hook with pagination in frontend/src/hooks/useSnapshots.ts"
Task: "useCreateSnapshot mutation hook in frontend/src/hooks/useCreateSnapshot.ts"
Task: "useUpdateSnapshot mutation hook in frontend/src/hooks/useUpdateSnapshot.ts"
Task: "useFinalizeSnapshot mutation hook in frontend/src/hooks/useFinalizeSnapshot.ts"
Task: "useDeleteSnapshot mutation hook in frontend/src/hooks/useDeleteSnapshot.ts"
Task: "usePayments hook with filtering in frontend/src/hooks/usePayments.ts"
Task: "useAnalytics hook with caching in frontend/src/hooks/useAnalytics.ts"
Task: "useComparison hook in frontend/src/hooks/useComparison.ts"
Task: "useReminders hook in frontend/src/hooks/useReminders.ts"
```

### Phase 3.13 - All Unit Tests (After T091)
```
Task: "Unit tests for CalendarService in backend/src/__tests__/unit/CalendarService.test.ts"
Task: "Unit tests for ComparisonService in backend/src/__tests__/unit/ComparisonService.test.ts"
Task: "Unit tests for AnalyticsService cache logic in backend/src/__tests__/unit/AnalyticsService.test.ts"
Task: "Unit tests for SummaryService calculations in backend/src/__tests__/unit/SummaryService.test.ts"
Task: "Unit tests for ReminderService triggers in backend/src/__tests__/unit/ReminderService.test.ts"
Task: "Unit tests for CalendarConverter utility in frontend/src/__tests__/unit/calendarConverter.test.ts"
Task: "Unit tests for PDFGenerator in frontend/src/__tests__/unit/pdfGenerator.test.ts"
Task: "Unit tests for ChartDataFormatter in frontend/src/__tests__/unit/chartFormatter.test.ts"
```

## Notes

### Security Reminders
- All financial fields MUST be encrypted before database storage
- User ownership validation required on all tracking endpoints
- Rate limiting on expensive operations (analytics, comparison)
- No plain-text financial data in logs or error messages

### Performance Targets
- Snapshot creation: <300ms
- Payment recording: <200ms
- Analytics dashboard load: <2s
- Comparison query: <500ms
- PDF generation: <3s (client-side)

### Islamic Compliance
- Dual calendar support (Gregorian + Hijri) in all date fields
- Islamic recipient categories in payment recording
- Methodology-aware calculations
- Nisab threshold tracking

### Testing Strategy
- TDD approach: All tests (Phase 3.2) before implementation (Phase 3.3+)
- Contract tests validate API contracts match tracking-api.yaml
- Integration tests validate user scenarios from spec.md
- Unit tests validate business logic in services and utilities
- E2E tests validate complete workflows from quickstart.md
- Manual testing validates real-world usability

### Git Workflow
- Commit after each phase checkpoint (marked with 🔸)
- Use conventional commit format: `feat:`, `test:`, `perf:`, `docs:`, `chore:`
- Never commit: `*.db`, `*.db-journal`, `*.enc`, `.env`, `*/data/`
- Each commit should represent a logical milestone

## Validation Checklist
*GATE: Verify before marking feature complete*

- [ ] All 7 contract tests passing (T006-T012)
- [ ] All 7 integration tests passing (T013-T019)
- [ ] All 5 frontend component tests passing (T020-T024)
- [ ] All 5 entities have Prisma models (T025-T029)
- [ ] All 7 services implemented (T030-T036)
- [ ] All 8 API routes implemented (T037-T044)
- [ ] All 9 React Query hooks implemented (T049-T057)
- [ ] All 9 frontend components implemented (T058-T066)
- [ ] All 6 pages implemented (T067-T072)
- [ ] All 3 background jobs implemented (T075-T077)
- [ ] Encryption applied to all financial fields (T080-T083)
- [ ] Security validations in place (T084-T085)
- [ ] Performance targets met (T086-T091)
- [ ] All 8 unit test suites passing (T092-T099)
- [ ] All 5 E2E tests passing (T100-T104)
- [ ] Documentation complete (T105-T110)
- [ ] All quickstart.md scenarios validated (T111-T117)
- [ ] Coverage >80% on all new code
- [ ] No security vulnerabilities detected
- [ ] No TypeScript errors
- [ ] All constitutional principles met

---

**Total Tasks**: 117 across 16 phases
**Estimated Duration**: 40-50 hours of focused development
**Parallel Opportunities**: 52 tasks marked [P] for concurrent execution
**Commit Checkpoints**: 16 logical milestones for clean git history
