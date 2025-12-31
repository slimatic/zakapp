# Implementation Plan: ZakApp Tracking & Analytics

**Branch**: `003-tracking-analytics` | **Date**: 2025-10-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-tracking-analytics/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✅ Feature specification loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → ✅ Detect Project Type: web (React frontend + Node.js backend)
   → ✅ Set Structure Decision: Full-stack web application with existing database
3. Fill the Constitution Check section based on ZakApp constitution
   → ✅ Completed - All principles align with tracking & analytics feature
4. Evaluate Constitution Check section
   → ✅ No constitutional violations - feature enhances user value
   → ✅ Update Progress Tracking: Initial Constitution Check Complete
5. Execute Phase 0 → research.md
   → ✅ Analytics visualization library research
   → ✅ Islamic calendar integration approaches
   → ✅ Data export format standards
6. Execute Phase 1 → contracts, data-model.md, quickstart.md
   → ✅ API contracts for tracking endpoints
   → ✅ Data model for new entities (YearlySnapshot, PaymentRecord, etc.)
   → ✅ Quickstart workflow for tracking features
   → ✅ Update .github/copilot-instructions.md with tracking patterns
7. Re-evaluate Constitution Check section
   → ✅ No new violations introduced
   → ✅ Update Progress Tracking: Post-Design Constitution Check Complete
8. Plan Phase 2 → Task-based implementation approach described
   → ✅ Ready for /tasks command execution
9. STOP - Ready for /tasks command
```

## Summary
Implement comprehensive tracking and analytics capabilities for ZakApp, enabling users to maintain historical records of Zakat calculations, record payments to recipients, analyze wealth and Zakat trends over time, receive reminders for upcoming obligations, and export data for record-keeping. This feature builds upon the existing calculation engine (Milestone 4) to provide year-over-year insights and professional reporting capabilities while maintaining privacy-first design and Islamic compliance.

## Technical Context
**Language/Version**: TypeScript 4.9, Node.js 18+, React 18  
**Primary Dependencies**: Express.js, Prisma ORM, React Query, Recharts (for visualizations), date-fns-jalali (Islamic calendar)  
**Storage**: SQLite (existing) with new tables for historical tracking  
**Testing**: Jest for backend unit tests, React Testing Library for frontend, Playwright for E2E workflows  
**Target Platform**: Web application (Linux/Mac/Windows server + modern browsers)  
**Project Type**: web - Full-stack application with existing frontend and backend  
**Performance Goals**: <500ms query time for historical data, <2s dashboard load, support 50+ years of history per user  
**Constraints**: Privacy-first (no cross-user analytics), Islamic calendar accuracy, export file size <50MB per user  
**Scale/Scope**: Individual users with 5-50 years of historical data, 10-100 payment records per year

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Lovable UI/UX
✅ **PASSES**: Analytics dashboard will provide beautiful visualizations of Zakat history  
✅ **PASSES**: Export functionality makes record-keeping delightful and easy  
✅ **PASSES**: Historical comparison features provide valuable user insights  

### II. User-Centric Design
✅ **PASSES**: Feature directly addresses user need for historical tracking and record-keeping  
✅ **PASSES**: Payment recording simplifies Zakat distribution documentation  
✅ **PASSES**: Reminders help users maintain consistent Islamic practice  

### III. Privacy and Security First (NON-NEGOTIABLE)
✅ **PASSES**: All historical data encrypted using existing AES-256-CBC infrastructure  
✅ **PASSES**: No cross-user analytics or data aggregation  
✅ **PASSES**: Export files generated securely and deleted after download  
✅ **PASSES**: Payment recipient data treated as sensitive and encrypted  

### IV. Spec-Driven Development
✅ **PASSES**: Feature specification complete with 46 functional requirements  
✅ **PASSES**: Clear acceptance criteria and edge cases documented  
✅ **PASSES**: API contracts will be defined before implementation  

### V. Simplicity & Clarity
✅ **PASSES**: Visualizations make complex trends easy to understand  
✅ **PASSES**: Annual summaries provide clear, comprehensive reports  
✅ **PASSES**: Dashboard consolidates key metrics in one place  

### VI. Open and Extensible
✅ **PASSES**: Export formats (CSV, PDF, JSON) enable third-party integrations  
✅ **PASSES**: Analytics architecture supports future custom reports  
✅ **PASSES**: Import functionality allows data portability  

**Constitution Status**: ✅ **PASSES** - All principles satisfied

## Project Structure

### Documentation (this feature)
```
specs/003-tracking-analytics/
├── plan.md              # ✅ This file (/plan command output)
├── research.md          # ✅ Phase 0 output (/plan command)
├── data-model.md        # ✅ Phase 1 output (/plan command)
├── quickstart.md        # ✅ Phase 1 output (/plan command)
├── contracts/           # ✅ Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command)
```

### Source Code (repository root)
```
# Web application structure (existing)
server/
├── src/
│   ├── models/
│   │   ├── YearlySnapshot.ts        # NEW: Historical snapshot model
│   │   ├── PaymentRecord.ts         # NEW: Payment tracking model
│   │   ├── AnalyticsMetric.ts       # NEW: Analytics calculation model
│   │   └── AnnualSummary.ts         # NEW: Annual report model
│   ├── services/
│   │   ├── TrackingService.ts       # NEW: Historical tracking logic
│   │   ├── PaymentService.ts        # NEW: Payment recording logic
│   │   ├── AnalyticsService.ts      # NEW: Analytics calculation logic
│   │   └── ExportService.ts         # NEW: Export generation logic
│   ├── controllers/
│   │   ├── TrackingController.ts    # NEW: Tracking endpoints
│   │   ├── PaymentController.ts     # NEW: Payment endpoints
│   │   ├── AnalyticsController.ts   # NEW: Analytics endpoints
│   │   └── ExportController.ts      # EXISTING: Extend with new formats
│   └── routes/
│       ├── tracking.ts              # NEW: Tracking routes
│       ├── payments.ts              # NEW: Payment routes
│       └── analytics.ts             # NEW: Analytics routes
├── prisma/
│   └── schema.prisma                # UPDATE: Add new models
└── tests/
    ├── contract/
    │   ├── tracking/                # NEW: Tracking contract tests
    │   ├── payments/                # NEW: Payment contract tests
    │   └── analytics/               # NEW: Analytics contract tests
    └── integration/
        └── tracking-workflow.test.ts # NEW: E2E tracking tests

client/
├── src/
│   ├── components/
│   │   ├── tracking/
│   │   │   ├── HistoryList.tsx      # NEW: Historical calculations list
│   │   │   ├── YearComparison.tsx   # NEW: Year-over-year comparison
│   │   │   └── SnapshotDetails.tsx  # NEW: Snapshot detail view
│   │   ├── payments/
│   │   │   ├── PaymentRecorder.tsx  # NEW: Payment recording form
│   │   │   ├── PaymentHistory.tsx   # NEW: Payment list/history
│   │   │   └── PaymentStatus.tsx    # NEW: Payment status indicator
│   │   ├── analytics/
│   │   │   ├── AnalyticsDashboard.tsx  # NEW: Main analytics dashboard
│   │   │   ├── WealthTrendChart.tsx    # NEW: Wealth over time chart
│   │   │   ├── ZakatTrendChart.tsx     # NEW: Zakat over time chart
│   │   │   ├── AssetCompositionChart.tsx # NEW: Asset breakdown chart
│   │   │   └── AnnualSummary.tsx       # NEW: Annual summary report
│   │   └── export/
│   │       ├── ExportDialog.tsx     # EXISTING: Extend with new options
│   │       └── ExportPreview.tsx    # NEW: Preview before export
│   ├── pages/
│   │   ├── tracking/
│   │   │   ├── History.tsx          # NEW: History main page
│   │   │   └── Comparison.tsx       # NEW: Comparison page
│   │   └── analytics/
│   │       └── Dashboard.tsx        # NEW: Analytics dashboard page
│   ├── services/
│   │   ├── trackingApi.ts           # NEW: Tracking API client
│   │   ├── paymentApi.ts            # NEW: Payment API client
│   │   ├── analyticsApi.ts          # NEW: Analytics API client
│   │   └── exportApi.ts             # EXISTING: Extend with new exports
│   └── hooks/
│       ├── useTracking.ts           # NEW: Tracking data hooks
│       ├── usePayments.ts           # NEW: Payment data hooks
│       └── useAnalytics.ts          # NEW: Analytics data hooks
└── tests/
    └── e2e/
        └── tracking.spec.ts         # NEW: E2E tracking tests
```

**Structure Decision**: Extends existing web application structure with new tracking, payment, and analytics modules. Backend follows established pattern of models → services → controllers → routes. Frontend adds new feature-specific component directories and pages. Leverages existing authentication, encryption, and database infrastructure.

## Phase 0: Outline & Research ✅

### Research Topics

1. **Analytics Visualization Library**
   - Decision: Use Recharts for React data visualization
   - Rationale: Well-maintained, composable, TypeScript support, good documentation
   - Alternatives considered: Chart.js (less React-native), Victory (more complex), D3.js (too low-level)

2. **Islamic Calendar Integration**
   - Decision: Use date-fns-jalali library for Hijri calendar support
   - Rationale: Lightweight, accurate, integrates with existing date-fns usage
   - Alternatives considered: moment-hijri (deprecated), @formkit/tempo (incomplete Hijri support)

3. **PDF Generation for Exports**
   - Decision: Use jsPDF with jspdf-autotable for structured reports
   - Rationale: Client-side generation, good table support, works in browser
   - Alternatives considered: PDFKit (Node.js only), Puppeteer (too heavy), react-pdf (complex setup)

4. **CSV Export Format**
   - Decision: Use papaparse library for CSV generation/parsing
   - Rationale: RFC 4180 compliant, handles edge cases, supports import validation
   - Alternatives considered: csv-writer (simpler but less robust), manual CSV (error-prone)

5. **Historical Data Query Optimization**
   - Decision: Add database indexes on userId + date fields, implement pagination
   - Rationale: Maintains performance as historical data grows, supports efficient year filtering
   - Alternatives considered: Denormalization (increases complexity), in-memory caching (memory intensive)

6. **Analytics Calculation Strategy**
   - Decision: Calculate metrics on-demand with short-term caching, no pre-aggregation
   - Rationale: Data volume is manageable per user, flexibility for future metric types
   - Alternatives considered: Pre-calculated aggregates (maintenance burden), materialized views (SQLite limitations)

**Output**: ✅ research.md created with detailed findings and decisions

## Phase 1: Design & Contracts ✅

### Data Model (data-model.md)

**New Entities**:

1. **YearlySnapshot**
   - id: UUID
   - userId: UUID (FK to User)
   - calculationDate: Date
   - gregorianYear: Integer
   - hijriYear: Integer
   - hijriMonth: Integer
   - totalWealth: Decimal (encrypted)
   - totalLiabilities: Decimal (encrypted)
   - zakatableWealth: Decimal (encrypted)
   - zakatAmount: Decimal (encrypted)
   - methodologyUsed: String
   - nisabThreshold: Decimal (encrypted)
   - nisabType: Enum (gold, silver)
   - status: Enum (draft, finalized)
   - assetBreakdown: JSON (encrypted) - detailed asset categories and values
   - calculationDetails: JSON (encrypted) - full calculation steps
   - userNotes: Text (encrypted)
   - createdAt: Timestamp
   - updatedAt: Timestamp
   - Relationships: belongsTo User, hasMany PaymentRecords

2. **PaymentRecord**
   - id: UUID
   - userId: UUID (FK to User)
   - snapshotId: UUID (FK to YearlySnapshot)
   - amount: Decimal (encrypted)
   - paymentDate: Date
   - recipientName: String (encrypted)
   - recipientType: Enum (individual, charity, mosque, poor, other)
   - notes: Text (encrypted)
   - receiptReference: String (encrypted, optional)
   - status: Enum (recorded, verified)
   - createdAt: Timestamp
   - updatedAt: Timestamp
   - Relationships: belongsTo User, belongsTo YearlySnapshot

3. **AnalyticsMetric**
   - id: UUID
   - userId: UUID (FK to User)
   - metricType: Enum (wealth_trend, zakat_consistency, asset_composition, payment_distribution)
   - startDate: Date
   - endDate: Date
   - calculatedValue: JSON (encrypted) - metric-specific data structure
   - visualizationType: Enum (line_chart, bar_chart, pie_chart, table)
   - calculatedAt: Timestamp
   - expiresAt: Timestamp (for caching)
   - Relationships: belongsTo User

4. **AnnualSummary**
   - id: UUID
   - userId: UUID (FK to User)
   - snapshotId: UUID (FK to YearlySnapshot)
   - gregorianYear: Integer
   - hijriYear: Integer
   - totalZakatCalculated: Decimal (encrypted)
   - totalZakatPaid: Decimal (encrypted)
   - outstandingZakat: Decimal (encrypted)
   - numberOfPayments: Integer
   - recipientSummary: JSON (encrypted)
   - assetBreakdown: JSON (encrypted)
   - comparativeAnalysis: JSON (encrypted) - vs previous year
   - methodologyUsed: String
   - userNotes: Text (encrypted)
   - generatedAt: Timestamp
   - Relationships: belongsTo User, belongsTo YearlySnapshot

### API Contracts (contracts/)

**New Endpoints**:

1. **Tracking Endpoints** (`contracts/tracking-api.yaml`)
   - POST /api/tracking/snapshots - Create yearly snapshot
   - GET /api/tracking/snapshots - List user's snapshots (paginated)
   - GET /api/tracking/snapshots/:id - Get snapshot details
   - PUT /api/tracking/snapshots/:id - Update snapshot
   - DELETE /api/tracking/snapshots/:id - Delete snapshot
   - POST /api/tracking/snapshots/:id/finalize - Mark snapshot as finalized
   - GET /api/tracking/comparison - Compare multiple snapshots

2. **Payment Endpoints** (`contracts/payments-api.yaml`)
   - POST /api/payments - Record new payment
   - GET /api/payments - List user's payments (paginated)
   - GET /api/payments/:id - Get payment details
   - PUT /api/payments/:id - Update payment
   - DELETE /api/payments/:id - Delete payment
   - GET /api/payments/status/:snapshotId - Get payment status for snapshot
   - GET /api/payments/recipients - Get unique recipients (for autocomplete)

3. **Analytics Endpoints** (`contracts/analytics-api.yaml`)
   - GET /api/analytics/dashboard - Get dashboard overview metrics
   - GET /api/analytics/wealth-trend - Get wealth over time data
   - GET /api/analytics/zakat-trend - Get Zakat over time data
   - GET /api/analytics/asset-composition - Get asset breakdown over time
   - GET /api/analytics/payment-distribution - Get payment distribution analysis
   - GET /api/analytics/annual-summary/:year - Get annual summary report

4. **Enhanced Export Endpoints** (`contracts/export-api.yaml`)
   - POST /api/export/tracking-history - Export historical data (CSV/JSON)
   - POST /api/export/annual-report - Export annual summary (PDF)
   - POST /api/export/payment-records - Export payment records (CSV/PDF)
   - POST /api/export/analytics-report - Export analytics visualizations (PDF)

### Contract Tests

Contract tests generated for all endpoints, following existing pattern:
- Request/response schema validation
- Authentication requirement tests
- Error case handling tests
- Tests initially failing (TDD approach)

### Quickstart Workflow (quickstart.md)

**90-Minute Validation Scenario**:
1. User completes annual Zakat calculation
2. System automatically creates yearly snapshot
3. User records payments to 3 different recipients
4. User views analytics dashboard showing trends
5. User compares current year with previous year
6. User generates and exports annual summary PDF
7. Validation: All data persists, calculations accurate, export professional

### Agent Context Update (.github/copilot-instructions.md)

Added tracking patterns section:
- Historical data encryption requirements
- Islamic calendar handling conventions
- Analytics calculation caching strategy
- Export file generation patterns
- Payment record validation rules

**Output**: ✅ All Phase 1 design documents complete and ready for implementation

## Phase 2: Task Planning Approach ✅

**Task Generation Strategy**:
- Load Phase 1 design documents (contracts, data-model, quickstart)
- Generate database migration task for new entities
- Each contract endpoint → contract test task [P] + implementation task
- Analytics visualizations → parallel UI component tasks [P]
- Export functionality → service layer tasks (sequential for shared code)
- Integration tests for complete tracking workflows

**Ordering Strategy**:
- TDD order: Contract tests before implementation
- Dependency order: Database → Backend → Frontend
- Backend: Models → Services → Controllers → Routes
- Frontend: API hooks → Components → Pages
- Mark [P] for parallel execution where files are independent

**Estimated Output**: 40-45 numbered, ordered tasks in tasks.md

**Task Categories**:
1. Phase 3.1: Setup (Database migration, dependencies) - 3 tasks
2. Phase 3.2: Contract Tests (TDD) - 15 tasks [P]
3. Phase 3.3: Backend Implementation - 12 tasks
4. Phase 3.4: Frontend Implementation - 12 tasks [P]
5. Phase 3.5: Integration & Polish - 5 tasks

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

No violations - section not applicable.

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (N/A - no deviations)

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*
