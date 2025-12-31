# Research & Technical Decisions: Zakat Calculation Complete

**Feature**: 004-zakat-calculation-complete  
**Date**: 2025-10-13  
**Status**: Phase 0 Complete

---

## 1. Calendar System Integration

### Decision: hijri-converter library

**Rationale**:

- Already installed in client/package.json (v1.1.1)
- Proven library with accurate Hijri-Gregorian conversion
- Zero configuration needed, pure TypeScript/JavaScript
- Works on both frontend and backend (universal)

**Alternatives Considered**:

- moment-hijri: Requires moment.js (heavy dependency, 2.8MB)
- hijri-date: Less maintained, last update 2019
- Custom implementation: High risk for calendar accuracy errors

**Implementation Notes**:

- Use for frontend calendar display and backend date storage
- Conversion formula based on Umm al-Qura calendar
- Store dates in ISO 8601 format, convert on-demand

### Decision: Store dates as Gregorian, convert on display

**Rationale**:

- SQLite DATETIME type is Gregorian-based
- Simpler querying and sorting
- Conversion only at UI layer (performance)
- No data migration needed

**Alternatives Considered**:

- Store both calendars: Data duplication, sync issues
- Store only Hijri: Complex SQL queries, poor indexing

---

## 2. Multi-Methodology Calculation

### Decision: Methodology as enum with strategy pattern

**Rationale**:

- Clean separation of calculation logic per methodology
- Easy to test each methodology independently
- Extensible for future methodologies
- Type-safe with TypeScript enums

**Implementation Pattern**:

```typescript
enum ZakatMethodology {
  STANDARD = 'STANDARD',     // AAOIFI-compliant
  HANAFI = 'HANAFI',         // Silver-based nisab
  SHAFII = 'SHAFII',        // Detailed categorization
  CUSTOM = 'CUSTOM'          // User-defined rules
}

interface MethodologyCalculator {
  calculate(assets: Asset[], methodology: ZakatMethodology): CalculationResult;
  getNisabThreshold(methodology: ZakatMethodology): number;
  getMethodologyRules(methodology: ZakatMethodology): MethodologyRules;
}

```

**Alternatives Considered**:

- Single calculation function with conditionals: Hard to maintain, poor testability
- Separate services per methodology: Code duplication, harder to compare

### Decision: Fixed rules for Standard/Hanafi/Shafi'i, configurable Custom

**Rationale**:

- Per Clarification Session 2025-10-13: "Fixed methods; custom allows overrides"
- Ensures Islamic compliance for standard methodologies
- Flexibility for regional variations via Custom
- Prevents accidental miscalculation

**Configuration Schema**:

```typescript
interface CustomMethodologyConfig {
  nisabBasis: 'GOLD' | 'SILVER' | 'CUSTOM_VALUE';
  customNisabValue?: number;
  rate: number; // Default 2.5%
  assetRules: {
    [assetCategory: string]: {
      included: boolean;
      adjustmentPercentage?: number;
    };
  };
}

```

---

## 3. Calculation History & Snapshots

### Decision: Immutable snapshots with controlled unlock

**Rationale**:

- Per Clarification Session 2025-10-13: "Immutable amounts; unlock enables edits"
- Preserves historical accuracy
- Audit trail for corrections
- Prevents accidental data loss

**Database Schema**:

```sql
CREATE TABLE zakat_calculation_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  calculation_date DATETIME NOT NULL,
  methodology TEXT NOT NULL,
  total_wealth REAL NOT NULL, -- Encrypted
  zakat_due REAL NOT NULL,    -- Encrypted
  is_locked BOOLEAN DEFAULT 1,
  locked_at DATETIME,
  unlocked_at DATETIME,
  unlocked_by TEXT,
  unlock_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE snapshot_asset_values (
  id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  captured_value REAL NOT NULL, -- Encrypted
  captured_at DATETIME NOT NULL,
  FOREIGN KEY (snapshot_id) REFERENCES zakat_calculation_snapshots(id),
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);

```

**Implementation Notes**:

- Default locked state on creation
- Unlock requires reason (audit trail)
- Re-lock after edits
- Full edit history preserved

---

## 4. UI/UX Design Patterns

### Decision: Tailwind CSS with @headlessui/react

**Rationale**:

- Already project standard (client/package.json)
- Rapid development of methodology cards
- Accessible by default (WCAG 2.1 AA)
- Consistent with existing zakapp design

**Component Architecture**:

```text
MethodologySelector
├── MethodologyCard (4 instances)
│   ├── MethodologyIcon
│   ├── MethodologyDescription
│   └── LearnMoreButton
├── ComparisonView (conditional)
└── RecommendationQuiz (conditional)

EnhancedZakatCalculator
├── CalendarSelector
├── MethodologyBadge
├── CalculationBreakdown
│   ├── NisabIndicator
│   ├── AssetCategoryBreakdown
│   └── EducationalTooltips
└── ResultSummary

```

### Decision: React Query for data fetching

**Rationale**:

- Already installed (@tanstack/react-query 5.90.2)
- Built-in caching for calculation history
- Automatic refetching on methodology change
- Optimistic updates for unlock/edit flows

**Query Keys Structure**:

```typescript
queryKeys = {
  calculations: ['calculations'],
  calculationHistory: (userId) => ['calculations', 'history', userId],
  calculationById: (id) => ['calculations', id],
  methodologies: ['methodologies'],
  calendar: (date) => ['calendar', date],
}

```

---

## 5. Testing Strategy

### Decision: TDD with contract-first approach

**Rationale**:

- Constitutional requirement (Principle IV)
- Catch calculation errors early
- Ensure Islamic accuracy
- Prevent regressions

**Test Coverage Targets**:

- Calculation logic: >95% (critical path)
- Calendar conversion: 100% (accuracy critical)
- UI components: >80%
- API endpoints: 100% contract coverage

**Test Organization**:

```text
tests/
├── contract/
│   ├── calendar.contract.test.ts
│   └── calculations.contract.test.ts
├── integration/
│   ├── methodology-switching.test.ts
│   └── calculation-history.test.ts
└── unit/
    ├── CalendarService.test.ts
    ├── MethodologyCalculators.test.ts
    └── CalculationHistoryService.test.ts

```

---

## 6. Performance Optimization

### Decision: Memoization and lazy loading

**Rationale**:

- Calculation history can be large (100+ records)
- Methodology comparison is CPU-intensive
- Calendar conversions are pure functions

**Optimizations**:

```typescript
// Memoize calendar conversions
const useHijriDate = (gregorianDate: Date) => 
  useMemo(() => hijri.toHijri(gregorianDate), [gregorianDate]);

// Lazy load calculation history
const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ['calculations', 'history'],
  queryFn: ({ pageParam = 0 }) => fetchHistory(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

// Debounce methodology comparison
const debouncedCompare = useMemo(
  () => debounce(compareMethodologies, 300),
  []
);

```

---

## 7. Security Considerations

### Decision: Encrypt snapshot amounts with existing infrastructure

**Rationale**:

- Calculation amounts are sensitive financial data
- Existing AES-256 encryption utilities (server/src/utils/encryption.ts)
- Constitutional requirement (Principle II: Privacy & Security First)
- Zero-trust model

**Encryption Points**:

- Snapshot total wealth (encrypt before storage)
- Snapshot zakat due (encrypt before storage)
- Snapshot asset values (encrypt before storage)
- Decrypt only for display/comparison

**Security Checklist**:

- ✅ No financial data in logs
- ✅ JWT authentication for all endpoints
- ✅ User authorization checks (own data only)
- ✅ Input validation on methodology configs
- ✅ SQL injection prevention (Prisma parameterization)

---

## 8. Dependencies Analysis

### New Dependencies: NONE

**Rationale**:

- hijri-converter already installed (1.1.1)
- All UI libraries already in place
- Testing infrastructure complete
- No additional packages needed

### Dependency Verification

- ✅ hijri-converter: 1.1.1 (client/package.json)
- ✅ React Query: 5.90.2 (client/package.json)
- ✅ Prisma ORM: 6.16.2 (root package.json)
- ✅ Tailwind CSS: Configured
- ✅ Jest: 29.7.0 (root package.json)

---

## 9. Islamic Compliance Research

### Methodology Sources

1. **Standard (AAOIFI)**:
   - Accounting and Auditing Organization for Islamic Financial Institutions
   - Gold-based nisab (85 grams)
   - 2.5% rate on all zakatable wealth
   
2. **Hanafi Method**:
   - Silver-based nisab (595 grams) OR gold (85 grams), whichever lower
   - More inclusive approach (benefits more recipients)
   - 2.5% rate
   
3. **Shafi'i Method**:
   - Gold-based nisab (85 grams)
   - Detailed asset categorization rules
   - 2.5% rate with specific treatment per category

### Educational Content Requirements

Per Constitutional Principle V, all content must align with Simple Zakat Guide:

- ✅ Standard 2.5% rate maintained
- ✅ Nisab thresholds correctly defined
- ✅ Asset categories properly explained
- ✅ Scholarly references documented

---

## 10. Migration & Rollout Strategy

### Decision: Non-breaking additive changes

**Rationale**:

- Existing calculation service remains functional
- New methodology parameter is optional (defaults to STANDARD)
- Calendar system adds new fields, doesn't modify existing
- History tracking is new feature, doesn't affect current flows

**Migration Steps**:

1. Add methodology enum to database schema
2. Add calendar preference to user settings
3. Create new snapshot tables
4. Migrate existing calculations to snapshots (optional)
5. Deploy backend with backward compatibility
6. Deploy frontend with feature flags
7. Gradual rollout to users

### Rollback Plan

- Feature flags allow instant disable
- Old calculation endpoint remains active
- No destructive database changes
- User data always preserved

---

## Research Phase Complete ✅

All technical decisions documented, no unknowns remaining. Ready to proceed to Phase 1: Design & Contracts.

**Next Steps**:

1. Generate data-model.md from entity analysis
2. Create API contracts in /contracts/
3. Generate contract tests (failing)
4. Create quickstart.md
5. Update agent context file
