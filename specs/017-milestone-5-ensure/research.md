# Research: Milestone 5 - Tracking & Analytics Activation

**Feature**: 017-milestone-5-ensure  
**Date**: 2025-12-07

## Problem Space

### User Need
Users need to:
1. Visualize their wealth and Zakat obligations over time
2. Record payments linked to specific Nisab Year Records (Hawl periods)
3. Track payment history with Islamic year context
4. Compare financial metrics across multiple years

### Current State
- Backend services exist: `AnalyticsService`, `PaymentService`, `YearlySnapshotModel`
- Database schema ready: `nisab_year_records` (YearlySnapshot), `payment_records`, `assets`
- Frontend routes commented out: `/analytics`, `/payments`
- Navigation missing links to Analytics and Payments sections
- UI uses inconsistent terminology ("snapshots" vs "Nisab Year Records")

### Gap Analysis
- ✅ Backend APIs functional and tested
- ✅ Database relationships established (Assets → Nisab Records → Payments)
- ❌ Frontend routes disabled
- ❌ Navigation menu incomplete
- ❌ Payment form lacks Nisab Year selection
- ❌ Analytics page exists but needs terminology audit
- ❌ Payments page needs Nisab Record emphasis

## Technical Research

### Existing Architecture

#### Backend Services
1. **AnalyticsService** (`server/src/services/AnalyticsService.ts`)
   - Provides wealth trend calculations from Assets
   - Calculates Zakat metrics from YearlySnapshot + PaymentRecord
   - Implements caching with dynamic TTL (15-60 min based on metric type)
   - Handles encryption/decryption of metric data

2. **PaymentService** (`server/src/services/PaymentService.ts`)
   - CRUD operations for payment records
   - Validates recipient categories (8 Islamic categories)
   - Links payments to calculations
   - Calculates Islamic year from payment date
   - Encrypts sensitive recipient data

3. **YearlySnapshotModel** (Prisma model)
   - Table: `nisab_year_records`
   - Stores Hawl period data (start date, end date, Zakat due)
   - Related to PaymentRecord, AnalyticsMetric, AnnualSummary

#### Data Model
```prisma
model YearlySnapshot {
  id                     String @id
  userId                 String
  hawlStartDate          DateTime
  hawlEndDate            DateTime
  nisabThreshold         Decimal
  zakatDue               Decimal
  zakatPaid              Decimal
  outstandingBalance     Decimal
  
  // Relations
  user                   User
  paymentRecords         PaymentRecord[]
  analyticsMetrics       AnalyticsMetric[]
  annualSummaries        AnnualSummary[]
  
  @@map("nisab_year_records")
}

model PaymentRecord {
  id                     String @id
  userId                 String
  nisabYearRecordId      String // Links to YearlySnapshot
  amount                 Decimal
  paymentDate            DateTime
  recipient              String // Encrypted
  category               String
  notes                  String? // Encrypted
  
  // Relations
  user                   User
  nisabYearRecord        YearlySnapshot
}

model Asset {
  id                     String @id
  userId                 String
  name                   String
  category               String
  currentValue           Decimal // Encrypted
  acquisitionDate        DateTime
  // ... other fields
}
```

#### Frontend Structure
- **Pages**: `AnalyticsPage.tsx`, `PaymentsPage.tsx` (exist but need audit)
- **Components**: `PaymentRecordForm.tsx` (modified), `AnalyticsCharts.tsx` (needs update)
- **Hooks**: `useAnalytics.ts`, `usePayments.ts`, `useSnapshots.ts` (React Query)
- **Routing**: Lazy-loaded routes in `App.tsx`

### Terminology Clarification

**Backend (Technical)**:
- Model name: `YearlySnapshot`
- Table name: `nisab_year_records`
- Service references: `YearlySnapshotModel`, `YearlySnapshot`

**Frontend (User-Facing)**:
- ALWAYS: "Nisab Year Record" or "Nisab Year"
- NEVER: "Snapshot", "Yearly Snapshot"
- Form labels: "Nisab Year" (dropdown)
- Page headings: "Nisab Year Records"
- Navigation: "Nisab Records"

### Data Flow

#### Analytics Dashboard
```
Assets (networth data)
    ↓
useAnalytics hook → AnalyticsService.getWealthTrend()
    ↓
Wealth Over Time Chart (Recharts)

YearlySnapshot (nisab_year_records)
    ↓
useAnalytics hook → AnalyticsService.getZakatTrend()
    ↓
Zakat Obligations Chart (due/paid/outstanding)
```

#### Payments Page
```
User clicks "Record Payment"
    ↓
PaymentRecordForm opens
    ↓
useSnapshots hook loads Nisab Year Records
    ↓
User selects Nisab Year from dropdown
    ↓
Form submission → PaymentService.createPayment()
    ↓
Payment linked to nisabYearRecordId
    ↓
PaymentRecord saved with encrypted data
```

### Performance Considerations
1. **Caching**: React Query with 5min stale time for dashboard data
2. **Lazy Loading**: Routes loaded on demand (code splitting)
3. **Chart Optimization**: Recharts with responsive design, limit data points
4. **Backend Caching**: AnalyticsService implements dynamic TTL (15-60min)

### Security Considerations
1. **Encryption**: All sensitive payment data (recipient, notes, amounts) encrypted with AES-256
2. **Validation**: Payment amounts validated against recipient totals
3. **Authorization**: User ID checked on all API requests
4. **Data Isolation**: User can only view/modify their own records

## Integration Points

### Existing Features
- **Feature 008 (Nisab Year Records)**: Primary integration point. Payments link to Nisab Years.
- **Feature 004 (Assets)**: Provides networth data for "Wealth over time"
- **Authentication**: JWT tokens required for all API calls

### New Integrations
- **Navigation**: Add Analytics and Payments menu items in `Layout.tsx`
- **Routes**: Enable `/analytics` and `/payments` in `App.tsx`
- **Form Enhancement**: Add Nisab Year dropdown to `PaymentRecordForm.tsx`
- **Terminology Audit**: Replace "snapshot" references in UI components

## Risk Assessment

### High Risk
- None identified (backend services proven stable)

### Medium Risk
- **Terminology Consistency**: Risk of missing "snapshot" references in UI
  - Mitigation: Systematic grep search for "snapshot" in client/ directory
  - Mitigation: Test coverage for all user-facing text

### Low Risk
- **Chart Performance**: Large datasets could slow rendering
  - Mitigation: Limit data points, use React Query caching
  - Mitigation: Implement pagination for payment lists

## Implementation Strategy

### Phase 1: Route Activation (P1)
1. Uncomment routes in `App.tsx`
2. Add navigation items to `Layout.tsx`
3. Verify lazy loading works correctly
4. Test navigation flow

### Phase 2: Payment Integration (P1)
1. Enhance `PaymentRecordForm.tsx` with Nisab Year dropdown
2. Update form validation to require Nisab Year selection
3. Test payment creation with Nisab Year linking
4. Verify payment list displays correct Nisab Year

### Phase 3: Terminology Audit (P1)
1. Search codebase for "snapshot" in user-facing strings
2. Replace with "Nisab Year Record" or "Nisab Year"
3. Update tooltips, labels, error messages
4. Test all affected components

### Phase 4: Analytics Dashboard (P2)
1. Audit `AnalyticsPage.tsx` for data sources
2. Ensure "Wealth over time" uses Asset data
3. Ensure "Zakat obligations" uses Nisab Record data
4. Add empty states and loading indicators
5. Test with mock data and real data

### Phase 5: Testing & Validation (P2)
1. Write component tests for Analytics and Payments pages
2. Test empty states (no data scenarios)
3. Test error states (API failures)
4. Verify accessibility (WCAG 2.1 AA)
5. Performance testing (page load <2s)

## Success Criteria

### Must Have (P1)
- ✅ Analytics and Payments routes accessible from navigation
- ✅ Payment form allows selecting Nisab Year Record
- ✅ Payments correctly linked to Nisab Years in database
- ✅ No "snapshot" terminology in user-facing UI
- ✅ Analytics dashboard shows both wealth tracking and Zakat obligations

### Should Have (P2)
- ✅ Empty states for no data scenarios
- ✅ Loading indicators during data fetch
- ✅ Error messages for API failures
- ✅ Accessible charts (keyboard navigation, screen reader support)

### Nice to Have (P3)
- Export payment history as CSV
- Comparison slider for multi-year analytics
- Payment receipt generation

## Dependencies

### External
- Recharts library (existing)
- React Query (existing)
- Prisma ORM (existing)

### Internal
- AnalyticsService (existing)
- PaymentService (existing)
- YearlySnapshotModel (existing)
- Asset model (existing)

### Blocking
None - all dependencies already in place and tested.

## Open Questions

1. **Chart Color Scheme**: Should wealth/Zakat charts use specific Islamic colors?
   - Recommendation: Use existing Tailwind theme for consistency
   
2. **Payment Deletion**: Should users be able to delete payment records?
   - Recommendation: Yes, but log in audit trail (Feature 008 audit system)
   
3. **Multi-Currency**: How should analytics handle different currencies?
   - Recommendation: Convert to user's preferred currency for aggregation
   
4. **Date Range Selection**: Should analytics allow custom date ranges?
   - Recommendation: Phase 2 enhancement - start with "All time" and "Current year"

## References

- Feature 008 Spec: Nisab Year Records functionality
- Feature 004 Spec: Asset Management
- AnalyticsService: `server/src/services/AnalyticsService.ts`
- PaymentService: `server/src/services/PaymentService.ts`
- Schema: `server/prisma/schema.prisma`
- Constitutional Principles: `.github/copilot-instructions.md`
