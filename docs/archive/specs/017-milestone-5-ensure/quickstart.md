# Quickstart Guide: Milestone 5 - Tracking & Analytics Activation

**Feature**: 017-milestone-5-ensure  
**For**: Developers implementing Analytics and Payments UI integration  
**Time to Complete**: 2-3 hours

---

## Prerequisites

- ✅ Backend services running: `AnalyticsService`, `PaymentService`
- ✅ Database schema includes: `nisab_year_records`, `payment_records`, `assets`
- ✅ Existing Nisab Year Records created (Feature 008)
- ✅ Existing Assets created (Feature 004)
- ✅ Frontend dependencies installed: React Query, Recharts, Tailwind CSS

---

## Quick Start (5 Minutes)

### 1. Enable Routes

**File**: `client/src/App.tsx`

```typescript
// Uncomment these lines:
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));

// In routes array, uncomment:
{
  path: '/analytics',
  element: (
    <Suspense fallback={<LoadingSpinner />}>
      <AnalyticsPage />
    </Suspense>
  )
},
{
  path: '/payments',
  element: (
    <Suspense fallback={<LoadingSpinner />}>
      <PaymentsPage />
    </Suspense>
  )
}
```

### 2. Add Navigation Links

**File**: `client/src/components/layout/Layout.tsx`

```typescript
const navItems = [
  // ... existing items
  {
    name: 'Payments',
    path: '/payments',
    icon: CurrencyDollarIcon
  },
  {
    name: 'Analytics',
    path: '/analytics',
    icon: ChartBarIcon
  }
];
```

### 3. Test Navigation

```bash
npm run dev
# Navigate to http://localhost:5173
# Click "Analytics" and "Payments" in sidebar
# Verify pages load without errors
```

---

## Step-by-Step Implementation

### Phase 1: Payment Form Enhancement (30 mins)

**Goal**: Add Nisab Year selection to payment form

**File**: `client/src/components/tracking/PaymentRecordForm.tsx`

```typescript
import { useSnapshots } from '../../hooks/useSnapshots';

export const PaymentRecordForm: React.FC<Props> = ({ 
  initialData, 
  onSubmit, 
  onCancel,
  preselectedSnapshotId // NEW: Allow pre-selection
}) => {
  // Fetch Nisab Year Records
  const { data: snapshots, isLoading: snapshotsLoading } = useSnapshots();
  
  // Add state for selected Nisab Year
  const [selectedSnapshotId, setSelectedSnapshotId] = useState(
    preselectedSnapshotId || initialData?.nisabYearRecordId || ''
  );

  // Add dropdown before existing fields
  return (
    <form onSubmit={handleSubmit}>
      {/* Nisab Year Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Nisab Year *
        </label>
        <select
          value={selectedSnapshotId}
          onChange={(e) => setSelectedSnapshotId(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300"
        >
          <option value="">Select a Nisab Year</option>
          {snapshots?.map((snapshot) => (
            <option key={snapshot.id} value={snapshot.id}>
              {formatHijriYear(snapshot.hawlStartDate)} - 
              {formatHijriYear(snapshot.hawlEndDate)} 
              (Due: {formatCurrency(snapshot.zakatDue)})
            </option>
          ))}
        </select>
        {snapshotsLoading && <LoadingSpinner size="sm" />}
      </div>

      {/* Existing fields: amount, recipient, category, etc. */}
      {/* ... */}
    </form>
  );
};
```

**Test**:
```bash
# Navigate to /nisab-years
# Click "Add Payment" on any Nisab Year
# Verify dropdown shows Nisab Years
# Submit payment and verify it's linked
```

---

### Phase 2: Terminology Audit (20 mins)

**Goal**: Replace "snapshot" with "Nisab Year Record" in UI

**Search and Replace**:
```bash
cd client/src
grep -r "snapshot" --include="*.tsx" --include="*.ts" | grep -v "useSnapshots" | grep -v "YearlySnapshot"
```

**Common Replacements**:
- Labels: "Snapshot" → "Nisab Year Record"
- Tooltips: "yearly snapshot" → "Nisab Year"
- Error messages: "snapshot not found" → "Nisab Year Record not found"
- Headings: "Snapshots" → "Nisab Year Records"

**Files to Audit**:
- `client/src/pages/AnalyticsPage.tsx`
- `client/src/pages/PaymentsPage.tsx`
- `client/src/pages/NisabYearRecordsPage.tsx`
- `client/src/components/tracking/*`

**Test**:
```bash
# Manual UI inspection
# Open every page with user-facing text
# Search for "snapshot" (Ctrl+F)
# Verify none found
```

---

### Phase 3: Analytics Dashboard Data Integration (40 mins)

**Goal**: Ensure Analytics page uses correct data sources

**File**: `client/src/pages/AnalyticsPage.tsx`

```typescript
import { useAnalytics } from '../hooks/useAnalytics';
import { useAssets } from '../hooks/useAssets';
import { useSnapshots } from '../hooks/useSnapshots';
import { WealthTrendChart } from '../components/analytics/WealthTrendChart';
import { ZakatObligationsChart } from '../components/analytics/ZakatObligationsChart';
import { AssetCompositionChart } from '../components/analytics/AssetCompositionChart';

export const AnalyticsPage: React.FC = () => {
  // Wealth over time: Asset-based
  const { data: wealthTrend, isLoading: wealthLoading } = useAnalytics('wealth-trend');
  
  // Zakat obligations: Nisab Record-based
  const { data: zakatObligations, isLoading: zakatLoading } = useAnalytics('zakat-obligations');
  
  // Asset distribution: Current assets
  const { data: assetComposition, isLoading: assetsLoading } = useAnalytics('asset-composition');

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

      {/* Wealth Over Time (Asset-based) */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Wealth Over Time</h2>
        <p className="text-gray-600 mb-4">
          Track your total networth across all assets over time.
        </p>
        {wealthLoading ? (
          <LoadingSpinner />
        ) : wealthTrend?.dataPoints?.length ? (
          <WealthTrendChart data={wealthTrend} />
        ) : (
          <EmptyState message="No asset data available. Add assets to see wealth trends." />
        )}
      </section>

      {/* Zakat Obligations (Nisab Record-based) */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Zakat Obligations</h2>
        <p className="text-gray-600 mb-4">
          View Zakat due, paid, and outstanding for each Nisab Year.
        </p>
        {zakatLoading ? (
          <LoadingSpinner />
        ) : zakatObligations?.nisabYearRecords?.length ? (
          <ZakatObligationsChart data={zakatObligations} />
        ) : (
          <EmptyState message="No Nisab Year Records found. Create a Nisab Year to track Zakat." />
        )}
      </section>

      {/* Asset Composition (Current state) */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Asset Distribution</h2>
        <p className="text-gray-600 mb-4">
          Current breakdown of your assets by category.
        </p>
        {assetsLoading ? (
          <LoadingSpinner />
        ) : assetComposition?.categories?.length ? (
          <AssetCompositionChart data={assetComposition} />
        ) : (
          <EmptyState message="No assets found. Add assets to see distribution." />
        )}
      </section>
    </div>
  );
};
```

**Test**:
```bash
# Navigate to /analytics
# Verify three sections display:
#   1. Wealth Over Time (if assets exist)
#   2. Zakat Obligations (if Nisab Years exist)
#   3. Asset Distribution (if assets exist)
# Check empty states show when no data
```

---

### Phase 4: Payments Page Enhancement (30 mins)

**Goal**: Emphasize Nisab Record selection and display linked Nisab Year

**File**: `client/src/pages/PaymentsPage.tsx`

```typescript
import { usePayments } from '../hooks/usePayments';
import { useSnapshots } from '../hooks/useSnapshots';
import { PaymentRecordForm } from '../components/tracking/PaymentRecordForm';

export const PaymentsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedNisabYearFilter, setSelectedNisabYearFilter] = useState<string | null>(null);
  
  const { data: payments, isLoading } = usePayments({
    nisabYearRecordId: selectedNisabYearFilter || undefined
  });
  
  const { data: snapshots } = useSnapshots();

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Zakat Payments</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          Record Payment
        </button>
      </div>

      {/* Filter by Nisab Year */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Nisab Year
        </label>
        <select
          value={selectedNisabYearFilter || ''}
          onChange={(e) => setSelectedNisabYearFilter(e.target.value || null)}
          className="w-64 rounded-md border-gray-300"
        >
          <option value="">All Payments</option>
          {snapshots?.map((snapshot) => (
            <option key={snapshot.id} value={snapshot.id}>
              {formatHijriYear(snapshot.hawlStartDate)} - 
              {formatHijriYear(snapshot.hawlEndDate)}
            </option>
          ))}
        </select>
      </div>

      {/* Payment List */}
      {isLoading ? (
        <LoadingSpinner />
      ) : payments?.length ? (
        <div className="space-y-4">
          {payments.map((payment) => (
            <PaymentCard 
              key={payment.id} 
              payment={payment}
              showNisabYear={true} // NEW: Display linked Nisab Year
            />
          ))}
        </div>
      ) : (
        <EmptyState 
          message="No payments recorded yet. Click 'Record Payment' to get started."
          action={{
            label: 'Record Payment',
            onClick: () => setShowForm(true)
          }}
        />
      )}

      {/* Payment Form Modal */}
      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <PaymentRecordForm
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}
    </div>
  );
};
```

**Test**:
```bash
# Navigate to /payments
# Verify filter dropdown shows Nisab Years
# Select a Nisab Year and verify payments filtered
# Click "Record Payment"
# Verify Nisab Year dropdown appears
# Submit payment and verify it appears in list with Nisab Year label
```

---

## Common Issues & Solutions

### Issue 1: "snapshot" still appears in UI
**Solution**: Run systematic grep search:
```bash
cd client/src
grep -ri "snapshot" --include="*.tsx" | grep -v "useSnapshots" | grep -v "// Backend"
# Manually review and replace each occurrence
```

### Issue 2: Charts not rendering
**Solution**: 
1. Check console for errors
2. Verify Recharts installed: `npm list recharts`
3. Check data format matches chart component expectations
4. Add empty state checks before rendering charts

### Issue 3: Payment form doesn't show Nisab Years
**Solution**:
1. Verify `useSnapshots` hook working: check Network tab
2. Check if user has created Nisab Year Records
3. Add loading state: `{snapshotsLoading && <LoadingSpinner />}`
4. Add empty state: "No Nisab Year Records found"

### Issue 4: Analytics showing wrong data
**Solution**:
1. Verify data source:
   - Wealth trend: Should fetch from `/api/v1/analytics/wealth-trend` (Asset-based)
   - Zakat obligations: Should fetch from `/api/v1/analytics/zakat-obligations` (Nisab Record-based)
2. Check API responses in Network tab
3. Verify cache invalidation on data changes

---

## Testing Checklist

### Functional Testing
- [ ] Analytics route accessible from navigation
- [ ] Payments route accessible from navigation
- [ ] Payment form shows Nisab Year dropdown
- [ ] Payment submission links to selected Nisab Year
- [ ] Payment list displays linked Nisab Year
- [ ] Analytics shows wealth trend (Asset-based)
- [ ] Analytics shows Zakat obligations (Nisab Record-based)
- [ ] Analytics shows asset distribution
- [ ] Empty states display when no data
- [ ] Loading states display during data fetch
- [ ] No "snapshot" terminology in UI

### Accessibility Testing
- [ ] Keyboard navigation works (Tab, Enter, Arrow keys)
- [ ] Screen reader announces labels correctly
- [ ] Charts have accessible labels and legends
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Focus indicators visible

### Performance Testing
- [ ] Page load <2 seconds
- [ ] React Query caching working (check Network tab)
- [ ] Charts render smoothly (no jank)
- [ ] Lazy loading routes (check bundle size)

---

## Next Steps

1. **Run Implementation**: Follow Phase 1-4 above
2. **Write Tests**: Create component tests for AnalyticsPage and PaymentsPage
3. **Performance Audit**: Run Lighthouse on `/analytics` and `/payments`
4. **User Testing**: Get feedback on terminology clarity and UX flow
5. **Documentation**: Update user guide with Analytics and Payments features

---

## Helpful Commands

```bash
# Development server
npm run dev

# Run tests
npm test

# Lint check
npm run lint

# Type check
npm run type-check

# Build production
npm run build

# Search for terminology issues
cd client/src && grep -ri "snapshot" --include="*.tsx" --include="*.ts"
```

---

## API Reference

- **Analytics API**: See `contracts/analytics-api.md`
- **Payments API**: See `contracts/payments-api.md`
- **Data Model**: See `data-model.md`

---

## Support Resources

- **Feature Spec**: `specs/017-milestone-5-ensure/spec.md`
- **Research Document**: `specs/017-milestone-5-ensure/research.md`
- **Constitution**: `.github/copilot-instructions.md`
- **Existing Features**: Feature 004 (Assets), Feature 008 (Nisab Year Records)
