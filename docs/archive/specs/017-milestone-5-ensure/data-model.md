# Data Model: Milestone 5 - Tracking & Analytics Activation

**Feature**: 017-milestone-5-ensure  
**Date**: 2025-12-07

## Overview

This feature leverages existing data models without modification. The focus is on UI integration with proper terminology and data hierarchy understanding.

## Data Hierarchy

```
User
 ├── Assets (wealth tracking - independent)
 │    └── Used for: "Wealth over time" analytics
 │
 └── YearlySnapshots (Nisab Year Records)
      ├── Contains: Hawl periods, Zakat calculations
      ├── Used for: "Zakat obligations" analytics
      │
      └── PaymentRecords (linked to specific Nisab Year)
           └── Contains: Payment details, recipient info
```

## Entity Definitions

### YearlySnapshot (Nisab Year Record)

**Table**: `nisab_year_records`  
**Purpose**: Represents a complete Hawl (Islamic year) period with Zakat calculations.

**Fields**:
```typescript
interface YearlySnapshot {
  id: string;                    // Primary key
  userId: string;                // Foreign key to User
  hawlStartDate: DateTime;       // Start of Hawl period (Nisab reached)
  hawlEndDate: DateTime;         // End of Hawl period (1 lunar year later)
  nisabThreshold: Decimal;       // Threshold value in user's currency
  totalWealth: Decimal;          // Encrypted - total zakatable wealth
  zakatDue: Decimal;            // Encrypted - calculated Zakat (2.5%)
  zakatPaid: Decimal;           // Encrypted - sum of linked payments
  outstandingBalance: Decimal;  // Encrypted - zakatDue - zakatPaid
  methodology: string;          // "standard" | "hanafi" | "shafi" | "custom"
  currency: string;             // ISO currency code
  notes: string | null;         // Encrypted - optional user notes
  isLocked: boolean;            // Cannot modify if locked
  createdAt: DateTime;
  updatedAt: DateTime;
  
  // Relations
  user: User;
  paymentRecords: PaymentRecord[];
  analyticsMetrics: AnalyticsMetric[];
  annualSummaries: AnnualSummary[];
  auditTrail: AuditTrailEntry[];
}
```

**UI Terminology**:
- **NEVER**: "Snapshot", "Yearly Snapshot"
- **ALWAYS**: "Nisab Year Record", "Nisab Year", "Hawl Period"

**Encryption**: `totalWealth`, `zakatDue`, `zakatPaid`, `outstandingBalance`, `notes`

---

### PaymentRecord

**Table**: `payment_records`  
**Purpose**: Tracks individual Zakat payments with Islamic categorization.

**Fields**:
```typescript
interface PaymentRecord {
  id: string;                    // Primary key
  userId: string;                // Foreign key to User
  nisabYearRecordId: string;    // Foreign key to YearlySnapshot (REQUIRED)
  amount: Decimal;              // Encrypted - payment amount
  currency: string;             // ISO currency code
  paymentDate: DateTime;        // When payment was made
  recipient: string;            // Encrypted - recipient name/organization
  recipientType: string;        // "individual" | "organization" | "charity"
  category: string;             // Islamic category (8 types)
  paymentMethod: string;        // "cash" | "bank_transfer" | "check" | "online"
  receiptNumber: string | null; // Optional receipt reference
  islamicYear: string;          // Hijri year (auto-calculated)
  notes: string | null;         // Encrypted - optional notes
  createdAt: DateTime;
  updatedAt: DateTime;
  
  // Relations
  user: User;
  nisabYearRecord: YearlySnapshot;
}
```

**Islamic Categories** (8 types):
1. `poor` - The poor (al-Fuqara)
2. `needy` - The needy (al-Masakin)
3. `collectors` - Zakat collectors (al-Amilin)
4. `hearts_reconciled` - Those whose hearts are to be reconciled (al-Muallafatu Qulubuhum)
5. `widows` - Widows
6. `orphans` - Orphans
7. `divorced` - Divorced women
8. `refugees` - Refugees/wayfarers (Ibn al-Sabil)

**Encryption**: `amount`, `recipient`, `notes`

**Validation Rules**:
- `nisabYearRecordId` MUST exist and belong to user
- `amount` MUST be positive
- `category` MUST be one of 8 valid categories
- `paymentDate` should be within reasonable range
- If `outstandingBalance` of linked Nisab Year becomes negative, warn user

---

### Asset

**Table**: `assets`  
**Purpose**: Tracks user's wealth items for networth calculation.

**Fields** (relevant to this feature):
```typescript
interface Asset {
  id: string;
  userId: string;
  name: string;                 // Encrypted
  category: string;             // "cash" | "gold" | "silver" | "crypto" | etc.
  currentValue: Decimal;        // Encrypted - current market value
  currency: string;
  acquisitionDate: DateTime;
  isZakatable: boolean;         // Whether included in Zakat calculation
  // ... other fields
  
  // Relations
  user: User;
  valuationHistory: AssetValuation[];
}
```

**Usage in Analytics**:
- **Wealth Over Time**: Sum of all `currentValue` (or historical valuations) grouped by date
- **Asset Distribution**: Pie chart showing breakdown by `category`
- **Independent of Nisab Records**: Asset tracking continues regardless of Nisab Year status

---

### AnalyticsMetric

**Table**: `analytics_metrics`  
**Purpose**: Cached calculation results for dashboard performance.

**Fields**:
```typescript
interface AnalyticsMetric {
  id: string;
  userId: string;
  snapshotId: string | null;    // Optional link to YearlySnapshot
  metricType: AnalyticsMetricType;
  periodStart: DateTime;
  periodEnd: DateTime;
  calculatedValue: any;         // Encrypted JSON - metric result
  parameters: any;              // Encrypted JSON - calculation inputs
  lastCalculated: DateTime;
  cacheExpiresAt: DateTime;     // Dynamic TTL based on metric type
  createdAt: DateTime;
  updatedAt: DateTime;
  
  // Relations
  user: User;
  snapshot: YearlySnapshot | null;
}

enum AnalyticsMetricType {
  WEALTH_TREND = "wealth_trend",           // Asset-based
  ZAKAT_TREND = "zakat_trend",            // Nisab Record-based
  ASSET_COMPOSITION = "asset_composition", // Asset-based
  PAYMENT_DISTRIBUTION = "payment_distribution", // Payment-based
  GROWTH_RATE = "growth_rate"             // Asset-based
}
```

**Caching Strategy**:
- `WEALTH_TREND`, `ZAKAT_TREND`, `GROWTH_RATE`: 60 min TTL (historical data)
- `ASSET_COMPOSITION`, `PAYMENT_DISTRIBUTION`: 30 min TTL (moderate frequency)
- Default: 15 min TTL (conservative)

---

## Data Relationships

### Primary Relationships

```
User (1) ──< (N) Asset
  └─ For: Wealth tracking

User (1) ──< (N) YearlySnapshot (Nisab Year Record)
  └─ For: Zakat obligation tracking

YearlySnapshot (1) ──< (N) PaymentRecord
  └─ For: Payment linkage to specific Hawl

YearlySnapshot (1) ──< (N) AnalyticsMetric
  └─ For: Cached Zakat metrics

User (1) ──< (N) AnalyticsMetric
  └─ For: Cached wealth metrics (snapshotId = null)
```

### Cascade Rules

**On User Deletion**:
- DELETE all Assets
- DELETE all YearlySnapshots (cascades to PaymentRecords, AnalyticsMetrics)
- DELETE all PaymentRecords

**On YearlySnapshot Deletion**:
- **CASCADE DELETE** PaymentRecords (preferred: prevents orphaned payments)
- Alternative: **SET NULL** (if payment history should be preserved separately)
- Current implementation: **CASCADE DELETE** (cleaner, enforces data integrity)

**On Asset Deletion**:
- No cascade (Assets independent of other entities)
- Recalculate networth on deletion

---

## Query Patterns

### Analytics Dashboard

#### Wealth Over Time
```typescript
// Goal: Show networth trend (Asset-based)
const wealthData = await prisma.asset.groupBy({
  by: ['acquisitionDate', 'category'],
  where: {
    userId,
    isZakatable: true
  },
  _sum: {
    currentValue: true
  },
  orderBy: {
    acquisitionDate: 'asc'
  }
});

// Or use cached metric:
const cachedMetric = await prisma.analyticsMetric.findFirst({
  where: {
    userId,
    metricType: 'wealth_trend',
    cacheExpiresAt: { gt: new Date() }
  }
});
```

#### Zakat Obligations
```typescript
// Goal: Show due/paid/outstanding per Nisab Year
const zakatData = await prisma.yearlySnapshot.findMany({
  where: { userId },
  select: {
    id: true,
    hawlStartDate: true,
    hawlEndDate: true,
    zakatDue: true,      // Decrypt after fetch
    zakatPaid: true,     // Decrypt after fetch
    outstandingBalance: true, // Decrypt after fetch
    paymentRecords: {
      select: {
        id: true,
        amount: true,    // Decrypt after fetch
        paymentDate: true
      }
    }
  },
  orderBy: {
    hawlStartDate: 'desc'
  }
});
```

### Payments Page

#### List All Payments with Nisab Year
```typescript
const payments = await prisma.paymentRecord.findMany({
  where: { userId },
  include: {
    nisabYearRecord: {
      select: {
        id: true,
        hawlStartDate: true,
        hawlEndDate: true,
        zakatDue: true
      }
    }
  },
  orderBy: {
    paymentDate: 'desc'
  }
});
```

#### Create Payment with Nisab Year Link
```typescript
const newPayment = await prisma.paymentRecord.create({
  data: {
    userId,
    nisabYearRecordId, // Required - selected from dropdown
    amount: encryptedAmount,
    currency: 'USD',
    paymentDate: new Date(),
    recipient: encryptedRecipient,
    recipientType: 'charity',
    category: 'poor',
    paymentMethod: 'bank_transfer',
    islamicYear: calculateIslamicYear(new Date()),
    notes: encryptedNotes
  }
});

// Update Nisab Year Record's zakatPaid
await prisma.yearlySnapshot.update({
  where: { id: nisabYearRecordId },
  data: {
    zakatPaid: { increment: amount },
    outstandingBalance: { decrement: amount }
  }
});
```

---

## Encryption Strategy

### Encrypted Fields

**YearlySnapshot**:
- `totalWealth`, `zakatDue`, `zakatPaid`, `outstandingBalance`, `notes`

**PaymentRecord**:
- `amount`, `recipient`, `notes`

**Asset**:
- `name`, `currentValue`

**AnalyticsMetric**:
- `calculatedValue`, `parameters`

### Encryption Flow

```typescript
// Before save:
const encryptedValue = await EncryptionService.encrypt(
  JSON.stringify(value),
  process.env.ENCRYPTION_KEY
);

// After fetch:
const decryptedValue = JSON.parse(
  await EncryptionService.decrypt(
    encryptedValue,
    process.env.ENCRYPTION_KEY
  )
);
```

### Key Management
- Encryption key stored in environment variable: `ENCRYPTION_KEY`
- AES-256-CBC algorithm
- Never log encrypted data or keys
- Rotate keys periodically (manual process with re-encryption)

---

## Data Integrity Rules

### Business Rules

1. **Payment Total ≤ Zakat Due**:
   ```typescript
   if (nisabYear.zakatPaid + newPayment.amount > nisabYear.zakatDue) {
     // Warning: Overpayment detected
     // Allow but notify user
   }
   ```

2. **Nisab Year Locking**:
   ```typescript
   if (nisabYear.isLocked) {
     throw new Error('Cannot modify locked Nisab Year Record');
   }
   ```

3. **Payment Date Validation**:
   ```typescript
   if (payment.paymentDate < nisabYear.hawlStartDate ||
       payment.paymentDate > nisabYear.hawlEndDate) {
     // Warning: Payment date outside Hawl period
     // Allow but flag for review
   }
   ```

4. **Asset Networth Calculation**:
   ```typescript
   // Exclude non-zakatable assets
   const totalWealth = assets
     .filter(a => a.isZakatable)
     .reduce((sum, a) => sum + a.currentValue, 0);
   ```

### Database Constraints

```prisma
model PaymentRecord {
  // ... fields ...
  
  @@index([userId])
  @@index([nisabYearRecordId])
  @@index([paymentDate])
}

model YearlySnapshot {
  // ... fields ...
  
  @@index([userId])
  @@index([hawlStartDate])
  @@index([hawlEndDate])
}

model Asset {
  // ... fields ...
  
  @@index([userId])
  @@index([category])
  @@index([isZakatable])
}
```

---

## Migration Notes

No database migrations required for this feature. All schema already in place from previous features:
- Feature 004: Asset model
- Feature 008: YearlySnapshot, PaymentRecord models
- Feature 009: AnalyticsMetric model (cancelled but schema remains)

---

## Testing Data

### Sample Nisab Year Record
```json
{
  "id": "clx123abc",
  "userId": "user456",
  "hawlStartDate": "2024-06-15T00:00:00Z",
  "hawlEndDate": "2025-06-14T23:59:59Z",
  "nisabThreshold": 5000.00,
  "totalWealth": 15000.00,
  "zakatDue": 375.00,
  "zakatPaid": 200.00,
  "outstandingBalance": 175.00,
  "methodology": "standard",
  "currency": "USD",
  "isLocked": false
}
```

### Sample Payment Record
```json
{
  "id": "pay789xyz",
  "userId": "user456",
  "nisabYearRecordId": "clx123abc",
  "amount": 100.00,
  "currency": "USD",
  "paymentDate": "2024-09-15T10:30:00Z",
  "recipient": "Local Mosque Charity Fund",
  "recipientType": "charity",
  "category": "poor",
  "paymentMethod": "bank_transfer",
  "receiptNumber": "RCP-2024-09-001",
  "islamicYear": "1446"
}
```

### Sample Asset
```json
{
  "id": "asset101",
  "userId": "user456",
  "name": "Savings Account",
  "category": "cash",
  "currentValue": 8000.00,
  "currency": "USD",
  "acquisitionDate": "2023-01-01T00:00:00Z",
  "isZakatable": true
}
```

---

## Performance Considerations

### Indexes
- **Critical**: `userId` on all tables (most queries filtered by user)
- **Important**: `nisabYearRecordId` on PaymentRecord (join optimization)
- **Useful**: Date fields for time-range queries

### Caching
- React Query: 5 min stale time for dashboard data
- AnalyticsService: 15-60 min TTL for calculated metrics
- Invalidate cache on: payment creation, asset update, Nisab Year change

### Query Optimization
- Use `select` to fetch only needed fields (reduce decryption overhead)
- Paginate payment lists (50 records per page)
- Limit chart data points (max 100 points for line charts)

---

## Security Considerations

### Data Access
- All queries MUST filter by `userId`
- Verify user owns Nisab Year before linking payment
- JWT token required for all API endpoints

### Encryption
- Client receives decrypted data (server-side decryption)
- Never expose encryption keys in API responses
- Log encryption failures but not encrypted values

### Audit Trail
- Feature 008 provides audit trail for Nisab Year changes
- Consider extending to payment modifications (future enhancement)

---

## References

- Prisma Schema: `server/prisma/schema.prisma`
- AnalyticsService: `server/src/services/AnalyticsService.ts`
- PaymentService: `server/src/services/PaymentService.ts`
- Feature 008 Spec: Nisab Year Records (table structure)
- Feature 004 Spec: Asset Management
