# Feature: Zakat Calculation Complete - Implementation Tasks

**Feature ID:** 004-zakat-calculation-complete  
**Specification:** See [`plan.md`](plan.md) for full details  
**Status:** In Progress  
**Last Updated:** 2025-01-13

## Overview

This task list provides a comprehensive implementation plan for the Zakat Calculation Complete feature. Tasks are ordered by dependencies and include parallel execution markers `[P]` for tasks that can be executed simultaneously.

---

## Phase 0: Setup & Prerequisites

### T001: Project Setup & Dependencies
- **Files:** `server/package.json`, `client/package.json`
- **Description:**
  - Install backend dependencies: `decimal.js`, `date-fns`
  - Install frontend dependencies: Chart.js, React Query updates
  - Set up environment variables for Zakat calculation
  - Configure TypeScript paths for shared types
- **Dependencies:** None
- **Status:** ✅ Complete

### T002: Database Schema Migration [P]
- **Files:** `server/prisma/schema.prisma`, `server/prisma/migrations/`
- **Description:**
  - Add `ZakatCalculation` model with fields: id, userId, calculationDate, methodology, nisabThreshold, totalZakat, assetBreakdown, notes
  - Add `PaymentRecord` model with fields: id, userId, calculationId, amount, paymentDate, recipient, receiptUrl, notes
  - Add `Snapshot` model with fields: id, userId, snapshotDate, totalAssets, totalZakat, assetBreakdown, metadata
  - Add `MethodologyConfig` model with fields: id, userId, methodology, nisabGoldGrams, nisabSilverGrams, customSettings
  - Run migration: `npx prisma migrate dev --name add_zakat_models`
- **Dependencies:** None
- **Status:** ✅ Complete

### T003: Shared Type Definitions [P]
- **Files:** `shared/types/zakat.ts`, `shared/types/snapshot.ts`
- **Description:**
  - Define `MethodologyType` enum: 'standard', 'hanafi', 'shafii', 'maliki', 'hanbali'
  - Define `ZakatCalculation` interface with all fields from data model
  - Define `AssetBreakdown` interface: category, amount, isZakatable, appliedRate
  - Define `PaymentRecord` interface matching data model
  - Define `Snapshot` interface matching data model
  - Define `MethodologyConfig` interface matching data model
- **Dependencies:** None
- **Status:** ✅ Complete

---

## Phase 1: Test-Driven Development (TDD)

### T004: Contract Tests - Zakat Calculation [P]
- **Files:** `server/tests/contracts/zakat-calculation.contract.test.ts`
- **Description:**
  - Test POST `/api/zakat/calculate` returns 200 with valid calculation
  - Test request body: { methodology: string, includeDebts: boolean, customNisab?: number }
  - Test response matches: { success: true, calculation: ZakatCalculation }
  - Test invalid methodology returns 400
  - Test unauthorized access returns 401
  - Test calculation with zero assets
  - Test calculation below nisab threshold
  - Verify assetBreakdown includes all user assets
- **Dependencies:** T003 (types)
- **Status:** ✅ Complete

### T005: Contract Tests - Methodology Configuration [P]
- **Files:** `server/tests/contracts/methodology-config.contract.test.ts`
- **Description:**
  - Test GET `/api/zakat/methodologies` returns all available methodologies
  - Test GET `/api/zakat/methodologies/:id` returns specific config
  - Test PUT `/api/zakat/methodologies/:id` updates custom settings
  - Test validation: nisab thresholds must be positive numbers
  - Test validation: methodology must be valid enum value
  - Test unauthorized access returns 401
  - Verify response schema matches MethodologyConfig
- **Dependencies:** T003 (types)
- **Status:** ✅ Complete

### T006: Contract Tests - Payment Records [P]
- **Files:** `server/tests/contracts/payment-records.contract.test.ts`
- **Description:**
  - Test POST `/api/zakat/payments` creates new payment record
  - Test request body: { calculationId: string, amount: number, paymentDate: string, recipient?: string, notes?: string }
  - Test GET `/api/zakat/payments` returns paginated list
  - Test GET `/api/zakat/payments?year=2024` filters by year
  - Test PUT `/api/zakat/payments/:id` updates payment
  - Test DELETE `/api/zakat/payments/:id` soft deletes payment
  - Test receipt URL generation
  - Test unauthorized access returns 401
- **Dependencies:** T003 (types)
- **Status:** ✅ Complete

### T007: Contract Tests - Snapshots [P]
- **Files:** `server/tests/contracts/snapshots.contract.test.ts`
- **Description:**
  - Test POST `/api/snapshots` creates snapshot from current assets
  - Test GET `/api/snapshots` returns list of snapshots
  - Test GET `/api/snapshots/:id` returns specific snapshot
  - Test GET `/api/snapshots/compare?from=id1&to=id2` compares two snapshots
  - Test DELETE `/api/snapshots/:id` deletes snapshot
  - Test snapshot includes: totalAssets, totalZakat, assetBreakdown
  - Test unauthorized access returns 401
  - Verify comparison returns growth percentages
- **Dependencies:** T003 (types)
- **Status:** ✅ Complete

### T008: Unit Tests - Zakat Engine Core [P]
- **Files:** `server/tests/unit/zakat-engine.test.ts`
- **Description:**
  - Test `calculateNisabThreshold()` for gold (85g) and silver (595g)
  - Test `aggregateAssetsByCategory()` groups assets correctly
  - Test `applyZakatRate()` applies 2.5% correctly
  - Test `adjustForLunarCalendar()` converts solar to lunar year
  - Test Standard methodology: all liquid assets zakatable
  - Test Hanafi methodology: different nisab calculation
  - Test Shafi'i methodology: specific asset treatment
  - Test deductible debt handling
  - Test assets below nisab return zero zakat
  - Test edge cases: negative values, null assets, empty arrays
- **Dependencies:** T003 (types)
- **Status:** ✅ Complete

---

## Phase 2: Core Implementation

### T009: Zakat Engine Service
- **Files:** `server/src/services/zakat-engine.service.ts`
- **Description:**
  - Implement `calculateZakat(userId: string, options: CalculationOptions): Promise<ZakatCalculation>`
  - Fetch all user assets from database
  - Apply methodology-specific rules
  - Calculate nisab threshold based on methodology
  - Aggregate assets by category (cash, gold, investments, etc.)
  - Apply 2.5% rate to zakatable assets
  - Handle deductible debts if includeDebts=true
  - Generate detailed assetBreakdown
  - Save calculation to database
  - Add comprehensive error handling with custom errors
  - Add JSDoc for all public methods
  - Use Decimal.js for precise financial calculations
- **Dependencies:** T004, T008 (tests must pass)
- **Status:** ✅ Complete

### T010: Methodology Configuration Service [P]
- **Files:** `server/src/services/methodology-config.service.ts`
- **Description:**
  - Implement `getMethodologies(userId: string): Promise<MethodologyConfig[]>`
  - Implement `getMethodology(userId: string, id: string): Promise<MethodologyConfig>`
  - Implement `updateMethodology(userId: string, id: string, config: Partial<MethodologyConfig>): Promise<MethodologyConfig>`
  - Load default methodologies from seed data
  - Validate nisab thresholds are positive numbers
  - Handle user-specific overrides
  - Implement caching with 5-minute TTL
  - Add encryption for sensitive custom settings
  - Add audit logging for changes
- **Dependencies:** T005 (tests must pass)
- **Status:** ✅ Complete

### T011: Payment Record Service [P]
- **Files:** `server/src/services/payment-record.service.ts`
- **Description:**
  - Implement `createPayment(userId: string, data: CreatePaymentDto): Promise<PaymentRecord>`
  - Implement `getPayments(userId: string, filters: PaymentFilters): Promise<PaymentRecord[]>`
  - Implement `updatePayment(userId: string, id: string, data: UpdatePaymentDto): Promise<PaymentRecord>`
  - Implement `deletePayment(userId: string, id: string): Promise<void>`
  - Generate receipt URLs using signed tokens
  - Track payment history with timestamps
  - Calculate total paid vs owed for a calculation
  - Add validation: amount must be positive, date cannot be future
  - Add encryption for recipient information
  - Implement pagination for large result sets
- **Dependencies:** T006 (tests must pass)
- **Status:** ✅ Complete

### T012: Snapshot Service [P]
- **Files:** `server/src/services/snapshot.service.ts`
- **Description:**
  - Implement `createSnapshot(userId: string): Promise<Snapshot>`
  - Fetch all current assets and calculate totals
  - Run Zakat calculation for snapshot
  - Store assetBreakdown with encryption
  - Implement `getSnapshots(userId: string): Promise<Snapshot[]>`
  - Implement `getSnapshot(userId: string, id: string): Promise<Snapshot>`
  - Implement `compareSnapshots(userId: string, fromId: string, toId: string): Promise<SnapshotComparison>`
  - Calculate growth percentages for assets and zakat
  - Generate year-over-year analytics
  - Implement `deleteSnapshot(userId: string, id: string): Promise<void>`
  - Add validation: cannot delete current year snapshot
- **Dependencies:** T007 (tests must pass)
- **Status:** ⏳ Pending

---

## Phase 3: API Layer

### T013: Zakat Calculation Controller
- **Files:** `server/src/controllers/zakat-calculation.controller.ts`, `server/src/routes/zakat.routes.ts`
- **Description:**
  - Implement POST `/api/zakat/calculate` endpoint
  - Add Zod validation for request body: `{ methodology: z.enum(['standard', 'hanafi', ...]), includeDebts: z.boolean(), customNisab: z.number().optional() }`
  - Call ZakatEngineService.calculateZakat()
  - Return formatted response with calculation results
  - Add error handling: ValidationError → 400, NotFoundError → 404, others → 500
  - Add request logging with user ID and timestamp
  - Add rate limiting: 10 requests per minute per user
  - Ensure user can only calculate own Zakat (auth check)
  - Register route in Express app
- **Dependencies:** T009 (engine service)
- **Status:** ✅ Complete

### T014: Methodology Controller [P]
- **Files:** `server/src/controllers/methodology.controller.ts`, `server/src/routes/zakat.routes.ts`
- **Description:**
  - Implement GET `/api/zakat/methodologies` endpoint
  - Implement GET `/api/zakat/methodologies/:id` endpoint
  - Implement PUT `/api/zakat/methodologies/:id` endpoint
  - Add Zod validation for update: `{ nisabGoldGrams: z.number().positive().optional(), nisabSilverGrams: z.number().positive().optional(), customSettings: z.record(z.any()).optional() }`
  - Add authorization: users can only access own configurations
  - Add input sanitization for customSettings
  - Add error handling for invalid methodology IDs
  - Register routes in Express app
- **Dependencies:** T010 (methodology service)
- **Status:** ⏳ Pending

### T015: Payment Records Controller [P]
- **Files:** `server/src/controllers/payment-records.controller.ts`, `server/src/routes/zakat.routes.ts`
- **Description:**
  - Implement POST `/api/zakat/payments` endpoint
  - Add Zod validation: `{ calculationId: z.string().uuid(), amount: z.number().positive(), paymentDate: z.string().datetime(), recipient: z.string().optional(), notes: z.string().optional() }`
  - Implement GET `/api/zakat/payments` with query params: `?year=2024&page=1&limit=20`
  - Implement PUT `/api/zakat/payments/:id` endpoint
  - Implement DELETE `/api/zakat/payments/:id` endpoint (soft delete)
  - Add pagination with default limit 20, max 100
  - Add filtering by year and status
  - Implement receipt generation endpoint GET `/api/zakat/payments/:id/receipt`
  - Add authorization checks for all endpoints
  - Register routes in Express app
- **Dependencies:** T011 (payment service)
- **Status:** ⏳ Pending

### T016: Snapshots Controller [P]
- **Files:** `server/src/controllers/snapshots.controller.ts`, `server/src/routes/snapshots.routes.ts`
- **Description:**
  - Implement POST `/api/snapshots` endpoint
  - Implement GET `/api/snapshots` endpoint with sorting by date
  - Implement GET `/api/snapshots/:id` endpoint
  - Implement GET `/api/snapshots/compare?from=:id1&to=:id2` endpoint
  - Implement DELETE `/api/snapshots/:id` endpoint
  - Add validation: IDs must be UUIDs
  - Add authorization: users can only access own snapshots
  - Add error handling for missing snapshots
  - Implement export endpoint GET `/api/snapshots/:id/export` (JSON format)
  - Register routes in Express app
- **Dependencies:** T012 (snapshot service)
- **Status:** ⏳ Pending

---

## Phase 4: Frontend Implementation

### T017: Zakat Calculation Hook
- **Files:** `client/src/hooks/useZakatCalculation.ts`
- **Description:**
  - Create `useCalculateZakat()` mutation using React Query
  - Define mutation function: `(options: CalculationOptions) => Promise<ZakatCalculation>`
  - Handle loading state with isLoading flag
  - Handle error state with error message
  - Cache calculation results for 10 minutes
  - Implement retry logic: 3 attempts with exponential backoff
  - Add optimistic update for UI responsiveness
  - Invalidate related queries on success (assets, snapshots)
  - Export hook for use in components
- **Dependencies:** T013 (API endpoint)
- **Status:** ✅ Complete

### T018: Methodology Management Hooks [P]
- **Files:** `client/src/hooks/useMethodologies.ts`
- **Description:**
  - Create `useMethodologies()` query for fetching all methodologies
  - Create `useMethodology(id: string)` query for fetching one
  - Create `useUpdateMethodology()` mutation for updates
  - Set staleTime to 1 hour for methodologies (rarely change)
  - Add error handling for network failures
  - Implement optimistic updates for methodology changes
  - Add success/error toast notifications
  - Export all hooks
- **Dependencies:** T014 (API endpoint)
- **Status:** ✅ Complete

### T019: Payment Records Hooks [P]
- **Files:** `client/src/hooks/usePaymentRecords.ts`
- **Description:**
  - Create `usePaymentRecords(filters?: PaymentFilters)` query
  - Create `useCreatePayment()` mutation
  - Create `useUpdatePayment()` mutation
  - Create `useDeletePayment()` mutation
  - Implement pagination with useInfiniteQuery
  - Add filtering by year and status
  - Handle optimistic updates for create/update/delete
  - Invalidate calculations query on payment creation
  - Add loading states for each operation
  - Export all hooks
- **Dependencies:** T015 (API endpoint)
- **Status:** ✅ Complete

### T020: Snapshots Hooks [P]
- **Files:** `client/src/hooks/useSnapshots.ts`
- **Description:**
  - Create `useSnapshots()` query for listing snapshots
  - Create `useSnapshot(id: string)` query for single snapshot
  - Create `useCreateSnapshot()` mutation
  - Create `useDeleteSnapshot()` mutation
  - Create `useCompareSnapshots(from: string, to: string)` query
  - Add year filtering support
  - Handle loading states for all operations
  - Add error handling with user-friendly messages
  - Implement optimistic updates for creation/deletion
  - Export all hooks
- **Dependencies:** T016 (API endpoint)
- **Status:** ✅ Complete

### T021: Zakat Dashboard Page
- **Files:** `client/src/pages/ZakatDashboard.tsx`
- **Description:**
  - Create main dashboard layout with grid/flex
  - Display summary card: current Zakat owed (from latest calculation)
  - Display summary card: total paid this year
  - Display summary card: remaining balance
  - Show quick actions: "Calculate Zakat", "Record Payment", "Create Snapshot"
  - Display recent payment history (last 5 payments)
  - Show calculation history (last 3 calculations)
  - Add loading skeletons for async data
  - Add error boundaries for component errors
  - Implement responsive design: mobile (1 col), tablet (2 col), desktop (3 col)
  - Add navigation to detailed views
- **Dependencies:** T017, T019 (hooks)
- **Status:** ✅ Complete

### T022: Calculation Results Component
- **Files:** `client/src/components/zakat/CalculationResults.tsx`
- **Description:**
  - Display prominently: "Your Zakat for [year]: $X,XXX.XX"
  - Show methodology used with description
  - Display nisab threshold applied
  - Show detailed asset breakdown table: Category | Amount | Zakatable | Zakat Owed
  - Add expandable rows for asset details
  - Include educational tooltips for each category
  - Add "Record Payment" button
  - Add "Save as Snapshot" button
  - Implement print functionality (print-friendly CSS)
  - Add export to PDF functionality
  - Show calculation date and ID
  - Display any deductible debts if applicable
- **Dependencies:** T017 (hook)
- **Status:** ✅ Complete

### T023: Methodology Selector Component [P]
- **Files:** `client/src/components/zakat/MethodologySelector.tsx`
- **Description:**
  - Create dropdown/select for methodology selection
  - Display methodology name and brief description
  - Show current nisab thresholds (gold/silver in grams and local currency)
  - Add "Learn More" button that opens modal with detailed explanation
  - Highlight user's current/default methodology
  - Add option to customize nisab thresholds
  - Show warning when using custom thresholds
  - Handle loading state while fetching methodologies
  - Add tooltips for Islamic terminology
  - Save user's preference to backend
- **Dependencies:** T018 (hook)
- **Status:** ✅ Complete

### T024: Payment Tracking Component [P]
- **Files:** `client/src/components/zakat/PaymentTracking.tsx`
- **Description:**
  - Display payments table with columns: Date | Amount | Recipient | Calculation ID | Actions
  - Add sortable columns (by date, amount)
  - Show total paid for selected year
  - Display remaining balance vs latest calculation
  - Add "Record Payment" button that opens modal form
  - Implement payment form with fields: amount, date, recipient (optional), notes (optional)
  - Add form validation: amount must be positive, date cannot be future
  - Implement "Edit" action for each payment
  - Implement "Delete" action with confirmation dialog
  - Add "Download Receipt" button for each payment
  - Add filtering controls: year selector, recipient filter
  - Implement pagination for large datasets
  - Show empty state when no payments
- **Dependencies:** T019 (hook)
- **Status:** ✅ Complete

### T025: Snapshot Comparison Component [P]
- **Files:** `client/src/components/zakat/SnapshotComparison.tsx`
- **Description:**
  - Create two-panel layout for comparing snapshots
  - Add year selectors for "from" and "to" snapshots
  - Display side-by-side comparison: Total Assets | Total Zakat | Asset Breakdown
  - Show growth percentages with color coding (green=growth, red=decrease)
  - Implement Chart.js line chart for asset trends over time
  - Implement Chart.js bar chart for category-wise comparison
  - Add pie chart for asset distribution
  - Show Zakat payment trends over years
  - Add export to PDF button
  - Add export to Excel button (CSV format)
  - Display metadata: snapshot dates, methodologies used
  - Add loading states for data fetching
  - Show helpful message when insufficient snapshots exist
- **Dependencies:** T020 (hook)
- **Status:** ✅ Complete

### T026: Educational Content Components [P]
- **Files:** `client/src/components/zakat/EducationalContent.tsx`, `client/src/components/zakat/MethodologyExplainer.tsx`, `client/src/components/zakat/NisabExplainer.tsx`
- **Description:**
  - Create MethodologyExplainer component with detailed descriptions of each methodology
  - Include Islamic source references (Quran, Hadith)
  - Create NisabExplainer component explaining gold/silver thresholds
  - Add visual graphics for nisab thresholds
  - Implement FAQ accordion component with common questions
  - Add Q&A: "What is Zakat?", "Who must pay?", "What is nisab?", "What assets are zakatable?"
  - Include links to authoritative Islamic sources (simple-zakat-guide.com)
  - Embed video explanations (YouTube embeds)
  - Add glossary of Islamic terms with tooltips
  - Implement search functionality for FAQ
  - Ensure all content is accessible (screen reader friendly)
  - Add "Share" buttons for social media
- **Dependencies:** None (static content)
- **Status:** ✅ Complete

---

## Phase 5: Integration & Polish

### T027: Integration Tests - Full Calculation Flow
- **Files:** `server/tests/integration/zakat-calculation-flow.test.ts`
- **Description:**
  - Test complete user journey: register → add assets → calculate zakat → record payment → create snapshot
  - Test methodology changes affecting calculations
  - Test snapshot creation includes correct data
  - Test snapshot comparison returns accurate growth metrics
  - Test data encryption end-to-end: verify data stored encrypted, decrypted on retrieval
  - Verify audit logging captures all important events
  - Test concurrent calculations don't interfere
  - Test calculation with assets below nisab
  - Test calculation with mixed zakatable/non-zakatable assets
  - Test payment tracking affects "remaining balance"
  - Verify all database constraints are enforced
- **Dependencies:** T009-T016 (all services and controllers)
- **Status:** ✅ Complete

### T028: Frontend E2E Tests [P]
- **Files:** `tests/e2e/zakat-calculation.spec.ts`
- **Description:**
  - Test calculation workflow: navigate to dashboard → click Calculate → select methodology → view results
  - Test payment recording: click Record Payment → fill form → submit → verify in payment list
  - Test snapshot creation: click Create Snapshot → verify snapshot appears in list
  - Test snapshot comparison: select two snapshots → view comparison charts
  - Test methodology switching: change methodology → recalculate → verify different results
  - Test error handling: submit invalid data → verify error messages display
  - Test responsive design: run tests on mobile, tablet, desktop viewports
  - Test accessibility: keyboard navigation, screen reader compatibility
  - Use Playwright for E2E testing
  - Run tests against staging environment
- **Dependencies:** T021-T026 (all UI components)
- **Status:** ⏳ Pending

### T029: Performance Optimization
- **Files:** Multiple (services, controllers, components)
- **Description:**
  - Add database indexes: `userId` on all Zakat tables, `calculationDate` on ZakatCalculation
  - Implement Redis caching for methodologies (rarely change)
  - Optimize calculation algorithm: memoize expensive operations
  - Add request batching for multiple asset fetches
  - Profile slow queries with `EXPLAIN ANALYZE`
  - Optimize frontend bundle size: lazy load heavy components (Chart.js)
  - Implement virtual scrolling for large payment lists
  - Add service worker for offline capability
  - Optimize images: use WebP format, lazy loading
  - Run Lighthouse audit and fix issues
  - Target metrics: < 2s page load, < 200ms calculation time, < 100ms API response
- **Dependencies:** T027 (integration tests passing)
- **Status:** ⏳ Pending

### T030: Security Audit [P]
- **Files:** `scripts/security-audit.sh`, `server/src/`, `client/src/`
- **Description:**
  - Run comprehensive security audit using existing security-audit.sh script
  - Check for dependency vulnerabilities (npm audit)
  - Verify environment variable security (.env file handling)
  - Audit database encryption implementation for sensitive fields
  - Check for sensitive data logging in application code
  - Verify authentication and authorization security
  - Test for common security vulnerabilities (SQL injection, XSS, CSRF)
  - Generate security audit report with findings and recommendations
  - Fix any critical security issues found during audit
- **Dependencies:** All previous tasks (full implementation)
- **Status:** ✅ Complete

### T031: Documentation [P]
- **Files:** `docs/`, `README.md`, `api-specification.md`
- **Description:**
  - Create comprehensive API documentation with OpenAPI/Swagger specs
  - Generate user guide with screenshots and step-by-step instructions
  - Create developer onboarding documentation
  - Document all calculation methodologies with Islamic references
  - Create deployment and configuration guides
  - Document security features and best practices
  - Create troubleshooting and FAQ sections
  - Generate automated API docs from code comments
  - Validate all documentation links and examples work
- **Dependencies:** All previous tasks (full implementation)
- **Status:** ✅ Complete

### T032: Accessibility Audit [P]
- **Files:** `client/src/`, `tests/accessibility/`
- **Description:**
  - Install and configure axe-core for accessibility testing
  - Run automated accessibility audit on all pages and components
  - Test keyboard navigation throughout the application
  - Verify screen reader compatibility
  - Check color contrast ratios meet WCAG 2.1 AA standards
  - Test form accessibility and error announcements
  - Validate ARIA labels and roles
  - Test responsive design accessibility
  - Generate accessibility audit report with violations and fixes
  - Implement fixes for any accessibility issues found
- **Dependencies:** All previous tasks (full implementation)
- **Status:** ⏳ Pending

---

## Parallel Execution Guide

### Group 1: Initial Setup (Run Simultaneously)
```bash
# These tasks have no dependencies and can run in parallel
task agent execute T002  # Database schema
task agent execute T003  # Shared types
```

### Group 2: Contract Tests (After Group 1)
```bash
# These tests can all run in parallel after types are defined
task agent execute T004  # Zakat calculation tests
task agent execute T005  # Methodology tests
task agent execute T006  # Payment tests
task agent execute T007  # Snapshot tests
task agent execute T008  # Unit tests
```

### Group 3: Services (After Group 2)
```bash
# These services can be implemented in parallel after their tests
task agent execute T010  # Methodology service
task agent execute T011  # Payment service
task agent execute T012  # Snapshot service
# Note: T009 (Zakat engine) should be done first or in parallel as it's core
task agent execute T009  # Zakat engine (prioritize)
```

### Group 4: Controllers (After Group 3)
```bash
# Controllers can be implemented in parallel after their services
task agent execute T013  # Zakat calculation controller (after T009)
task agent execute T014  # Methodology controller (after T010)
task agent execute T015  # Payment controller (after T011)
task agent execute T016  # Snapshots controller (after T012)
```

### Group 5: Frontend Hooks (After Group 4)
```bash
# All hooks can be created in parallel after API endpoints exist
task agent execute T017  # Calculation hook (after T013)
task agent execute T018  # Methodology hooks (after T014)
task agent execute T019  # Payment hooks (after T015)
task agent execute T020  # Snapshot hooks (after T016)
```

### Group 6: UI Components (After Group 5)
```bash
# Independent components can be built in parallel
task agent execute T023  # Methodology selector (after T018)
task agent execute T024  # Payment tracking (after T019)
task agent execute T025  # Snapshot comparison (after T020)
task agent execute T026  # Educational content (no dependencies)
# Core pages after their hooks
task agent execute T021  # Dashboard (after T017, T019)
task agent execute T022  # Calculation results (after T017)
```

### Group 7: Final Polish (After Everything)
```bash
# These can run in parallel after core implementation
task agent execute T027  # Integration tests (must pass first)
task agent execute T029  # Performance (after T027)
# These can run truly in parallel
task agent execute T028  # E2E tests
task agent execute T030  # Security audit
task agent execute T031  # Documentation
task agent execute T032  # Accessibility audit
```

---

## Progress Tracking

**Total Tasks:** 32  
**Completed:** 5  
**In Progress:** 0  
**Pending:** 27  

**Completion:** 15.6%

### By Phase:
- **Phase 0 (Setup):** 3/3 complete (100%)
- **Phase 1 (TDD):** 4/5 complete (80%)
- **Phase 2 (Core):** 0/4 complete (0%)
- **Phase 3 (API):** 1/4 complete (25%)
- **Phase 4 (Frontend):** 0/10 complete (0%)
- **Phase 5 (Polish):** 1/6 complete (16.7%)
- **Phase 6 (Final):** 0/3 pending (0%)

---

## Critical Path

The critical path (tasks that block the most other tasks):

1. T003 (Types) → blocks all tests
2. T004-T008 (Tests) → block all services
3. T009 (Zakat Engine) → blocks T013 → blocks T017 → blocks T021, T022
4. T027 (Integration Tests) → blocks T029 (Performance)

Focus on completing these tasks first to unblock parallel work.

---

## Notes

- **Test-First Approach:** All tests (T004-T008) must pass before implementing services (T009-T012)
- **Encryption Required:** All sensitive data must be encrypted at rest (verify in T030)
- **Islamic Compliance:** Calculations must be validated by subject matter expert before production
- **Performance Targets:** < 2s page load, < 200ms calculation time (verify in T029)
- **Accessibility:** WCAG 2.1 AA compliance mandatory (verify in T032)
- **i18n Ready:** All user-facing text should use translation keys for future localization
- **Audit Logging:** All financial operations must be logged for audit purposes

---

## Dependencies Graph

```
T001 ────┐
T002 ────┼─→ T004, T005, T006, T007, T008 ─→ T009, T010, T011, T012
T003 ────┘                                      ↓         ↓      ↓      ↓
                                               T013 ────→ T014, T015, T016
                                                ↓         ↓      ↓      ↓
                                               T017 ────→ T018, T019, T020
                                                ↓         ↓      ↓      ↓
                                             T021,T022 → T023, T024, T025, T026
                                                          ↓
                                                        T027 ─→ T028, T029, T030, T031, T032
```

---

## Getting Started

To begin implementation:

1. Verify T001-T003 are complete (setup and types)
2. Start with T008 (unit tests for Zakat engine)
3. Once tests are defined, implement T009 (Zakat engine service)
4. Follow the critical path to unblock maximum parallel work
5. Use the parallel execution guide to run independent tasks simultaneously

For questions or clarification, refer to:
- [`plan.md`](plan.md) - Complete feature specification
- [`data-model.md`](data-model.md) - Database schema details
- `contracts/` directory - API endpoint specifications
- [`quickstart.md`](quickstart.md) - Test scenarios and examples
