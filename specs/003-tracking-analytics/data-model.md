# Data Model: ZakApp Tracking & Analytics

**Feature**: 003-tracking-analytics  
**Date**: 2025-10-04  
**Status**: Complete  

## Entity Definitions

### 1. YearlySnapshot

**Purpose**: Represents a complete snapshot of user's financial state and Zakat calculation at a specific point in time (typically annual).

**Fields**:
```typescript
{
  id: string;                      // UUID, primary key
  userId: string;                  // FK to User, indexed
  calculationDate: Date;           // When calculation was performed, indexed
  gregorianYear: number;           // Gregorian calendar year
  gregorianMonth: number;          // 1-12
  gregorianDay: number;            // 1-31
  hijriYear: number;               // Islamic calendar year
  hijriMonth: number;              // 1-12
  hijriDay: number;                // 1-30
  totalWealth: number;             // Encrypted, total assets value
  totalLiabilities: number;        // Encrypted, total debts
  zakatableWealth: number;         // Encrypted, wealth - liabilities
  zakatAmount: number;             // Encrypted, calculated Zakat due
  methodologyUsed: string;         // e.g., "Standard", "Hanafi", "Shafi'i"
  nisabThreshold: number;          // Encrypted, threshold at calculation time
  nisabType: "gold" | "silver";    // Which nisab was used
  status: "draft" | "finalized";   // Draft can be edited, finalized is locked
  assetBreakdown: JSON;            // Encrypted, detailed breakdown by category
  calculationDetails: JSON;        // Encrypted, step-by-step calculation
  userNotes: string;               // Encrypted, user's personal notes
  isPrimary: boolean;              // Is this the official calculation for the year?
  createdAt: Date;                 // Timestamp
  updatedAt: Date;                 // Timestamp
}
```

**Relationships**:
- belongsTo: User (userId)
- hasMany: PaymentRecord (payments for this snapshot)
- hasOne: AnnualSummary (comprehensive report)

**Indexes**:
```sql
CREATE INDEX idx_snapshots_user_date ON YearlySnapshots(userId, calculationDate DESC);
CREATE INDEX idx_snapshots_user_gyear ON YearlySnapshots(userId, gregorianYear);
CREATE INDEX idx_snapshots_user_hyear ON YearlySnapshots(userId, hijriYear);
CREATE INDEX idx_snapshots_status ON YearlySnapshots(userId, status);
```

**Validation Rules**:
- calculationDate required, cannot be future date
- totalWealth >= 0
- totalLiabilities >= 0
- zakatableWealth = totalWealth - totalLiabilities (within rounding tolerance)
- zakatAmount >= 0 and <= zakatableWealth
- methodologyUsed must match known methodologies
- Only one isPrimary = true per gregorianYear per user
- status transition: draft → finalized (one-way, immutable)

**Encryption**: All numeric financial fields and notes encrypted with AES-256-CBC

---

### 2. PaymentRecord

**Purpose**: Records individual Zakat payments made by the user to specific recipients.

**Fields**:
```typescript
{
  id: string;                      // UUID, primary key
  userId: string;                  // FK to User, indexed
  snapshotId: string;              // FK to YearlySnapshot, indexed
  amount: number;                  // Encrypted, amount paid
  paymentDate: Date;               // When payment was made, indexed
  recipientName: string;           // Encrypted, name of recipient
  recipientType: string;           // "individual" | "charity" | "mosque" | "poor" | "other"
  recipientCategory: string;       // Islamic category: "fakir" | "miskin" | "amil" | "muallaf" | "riqab" | "gharimin" | "fisabilillah" | "ibnus-sabil"
  notes: string;                   // Encrypted, additional details
  receiptReference: string;        // Encrypted, receipt number or reference
  paymentMethod: string;           // "cash" | "transfer" | "check" | "online" | "other"
  status: "recorded" | "verified"; // Status of payment
  currency: string;                // Currency code (e.g., "USD", "SAR")
  exchangeRate: number;            // If different from base currency
  createdAt: Date;                 // Timestamp
  updatedAt: Date;                 // Timestamp
}
```

**Relationships**:
- belongsTo: User (userId)
- belongsTo: YearlySnapshot (snapshotId)

**Indexes**:
```sql
CREATE INDEX idx_payments_user_date ON PaymentRecords(userId, paymentDate DESC);
CREATE INDEX idx_payments_snapshot ON PaymentRecords(snapshotId);
CREATE INDEX idx_payments_user_year ON PaymentRecords(userId, YEAR(paymentDate));
```

**Validation Rules**:
- amount > 0
- paymentDate required, cannot be future date
- recipientName required
- recipientType must be one of allowed values
- snapshotId must reference existing snapshot
- userId must match snapshot's userId
- Sum of payments for snapshot should not exceed snapshot's zakatAmount (warning, not error)

**Encryption**: amount, recipientName, notes, receiptReference encrypted

---

### 3. AnalyticsMetric

**Purpose**: Stores calculated analytics metrics with short-term caching to optimize dashboard performance.

**Fields**:
```typescript
{
  id: string;                      // UUID, primary key
  userId: string;                  // FK to User, indexed
  metricType: string;              // Type of metric calculated
  startDate: Date;                 // Start of date range for metric
  endDate: Date;                   // End of date range for metric
  calculatedValue: JSON;           // Encrypted, metric data structure
  visualizationType: string;       // Suggested visualization type
  parameters: JSON;                // Calculation parameters used
  calculatedAt: Date;              // When metric was calculated
  expiresAt: Date;                 // Cache expiration, indexed
  version: number;                 // Metric calculation version
}
```

**Metric Types**:
- `wealth_trend`: Wealth over time with data points
- `zakat_trend`: Zakat amounts over time
- `asset_composition`: Asset category breakdown over time
- `payment_distribution`: Payment distribution by recipient type/category
- `compliance_rate`: Zakat payment consistency
- `growth_rate`: Year-over-year wealth growth
- `methodology_usage`: Historical methodology preferences

**CalculatedValue Structure** (encrypted JSON):
```typescript
// wealth_trend example
{
  dataPoints: [
    { date: "2023-01-15", value: 125000, gregorianYear: 2023, hijriYear: 1444 },
    { date: "2024-01-15", value: 138000, gregorianYear: 2024, hijriYear: 1445 }
  ],
  trend: "increasing" | "decreasing" | "stable",
  changePercent: 10.4,
  averageValue: 131500
}

// asset_composition example
{
  categories: [
    { name: "Cash & Bank", percentage: 45, amount: 62100 },
    { name: "Gold", percentage: 25, amount: 34500 },
    { name: "Investments", percentage: 20, amount: 27600 },
    { name: "Other", percentage: 10, amount: 13800 }
  ],
  totalValue: 138000,
  year: 2024
}
```

**Relationships**:
- belongsTo: User (userId)

**Indexes**:
```sql
CREATE INDEX idx_analytics_user_type_expires ON AnalyticsMetrics(userId, metricType, expiresAt);
CREATE INDEX idx_analytics_expires ON AnalyticsMetrics(expiresAt); -- For cleanup
```

**Validation Rules**:
- metricType must be recognized type
- startDate < endDate
- expiresAt > calculatedAt
- calculatedValue must be valid JSON

**Cache Behavior**:
- TTL: 5 minutes (300 seconds)
- Invalidate on relevant data changes
- Cleanup expired metrics daily via background job

**Encryption**: calculatedValue encrypted

---

### 4. AnnualSummary

**Purpose**: Comprehensive yearly report combining calculation, payment, and analysis data for a specific year.

**Fields**:
```typescript
{
  id: string;                      // UUID, primary key
  userId: string;                  // FK to User, indexed
  snapshotId: string;              // FK to YearlySnapshot (primary snapshot)
  gregorianYear: number;           // Report year (Gregorian), indexed
  hijriYear: number;               // Report year (Hijri), indexed
  startDate: Date;                 // Report period start
  endDate: Date;                   // Report period end
  totalZakatCalculated: number;    // Encrypted, total Zakat due
  totalZakatPaid: number;          // Encrypted, total paid
  outstandingZakat: number;        // Encrypted, remaining unpaid
  numberOfPayments: number;        // Count of payment records
  recipientSummary: JSON;          // Encrypted, breakdown by recipient type
  assetBreakdown: JSON;            // Encrypted, asset category details
  comparativeAnalysis: JSON;       // Encrypted, vs previous year
  methodologyUsed: string;         // Calculation methodology
  nisabInfo: JSON;                 // Encrypted, nisab details
  userNotes: string;               // Encrypted, user's annual notes
  generatedAt: Date;               // When summary was created
  version: number;                 // Summary format version
}
```

**RecipientSummary Structure** (encrypted JSON):
```typescript
{
  byType: [
    { type: "individual", count: 3, totalAmount: 1500 },
    { type: "charity", count: 2, totalAmount: 1000 }
  ],
  byCategory: [
    { category: "fakir", count: 2, totalAmount: 800 },
    { category: "fisabilillah", count: 3, totalAmount: 1700 }
  ],
  uniqueRecipients: 5,
  averagePayment: 500
}
```

**ComparativeAnalysis Structure** (encrypted JSON):
```typescript
{
  previousYear: {
    year: 2023,
    wealth: 125000,
    zakat: 3125,
    paid: 3125
  },
  currentYear: {
    year: 2024,
    wealth: 138000,
    zakat: 3450,
    paid: 3450
  },
  changes: {
    wealthChange: 13000,
    wealthChangePercent: 10.4,
    zakatChange: 325,
    zakatChangePercent: 10.4,
    paymentConsistency: "improved" | "maintained" | "declined"
  }
}
```

**Relationships**:
- belongsTo: User (userId)
- belongsTo: YearlySnapshot (snapshotId)

**Indexes**:
```sql
CREATE INDEX idx_summary_user_gyear ON AnnualSummaries(userId, gregorianYear);
CREATE INDEX idx_summary_user_hyear ON AnnualSummaries(userId, hijriYear);
CREATE INDEX idx_summary_snapshot ON AnnualSummaries(snapshotId);
```

**Validation Rules**:
- gregorianYear matches snapshot's year
- totalZakatCalculated matches snapshot's zakatAmount
- totalZakatPaid = sum of associated payment records
- outstandingZakat = totalZakatCalculated - totalZakatPaid
- numberOfPayments = count of associated payment records

**Encryption**: All financial fields and analysis data encrypted

---

### 5. ReminderEvent

**Purpose**: Dashboard notifications about upcoming Zakat obligations and tracking milestones.

**Fields**:
```typescript
{
  id: string;                      // UUID, primary key
  userId: string;                  // FK to User, indexed
  eventType: string;               // Type of reminder
  triggerDate: Date;               // When reminder should appear, indexed
  title: string;                   // Reminder title
  message: string;                 // Reminder content
  priority: string;                // "high" | "medium" | "low"
  status: string;                  // "pending" | "shown" | "acknowledged" | "dismissed"
  relatedSnapshotId: string;       // Optional FK to YearlySnapshot
  metadata: JSON;                  // Additional event data
  acknowledgedAt: Date;            // When user acknowledged
  createdAt: Date;                 // Timestamp
}
```

**Event Types**:
- `zakat_anniversary_approaching`: 30/14/7/1 days before Zakat anniversary
- `calculation_overdue`: Zakat anniversary passed without calculation
- `payment_incomplete`: Calculation done but not fully paid
- `yearly_comparison_available`: Multiple years of data available for comparison
- `data_backup_reminder`: Suggest exporting data for backup
- `methodology_review`: Annual review of methodology choice

**Relationships**:
- belongsTo: User (userId)
- belongsTo: YearlySnapshot (relatedSnapshotId, optional)

**Indexes**:
```sql
CREATE INDEX idx_reminders_user_trigger ON ReminderEvents(userId, triggerDate);
CREATE INDEX idx_reminders_user_status ON ReminderEvents(userId, status);
```

**Validation Rules**:
- eventType must be recognized type
- triggerDate required
- priority must be "high", "medium", or "low"
- status transitions: pending → shown → (acknowledged | dismissed)

---

## Prisma Schema Updates

```prisma
model YearlySnapshot {
  id                  String          @id @default(uuid())
  userId              String
  calculationDate     DateTime
  gregorianYear       Int
  gregorianMonth      Int
  gregorianDay        Int
  hijriYear           Int
  hijriMonth          Int
  hijriDay            Int
  totalWealth         String          // Encrypted
  totalLiabilities    String          // Encrypted
  zakatableWealth     String          // Encrypted
  zakatAmount         String          // Encrypted
  methodologyUsed     String
  nisabThreshold      String          // Encrypted
  nisabType           String          // "gold" or "silver"
  status              String          // "draft" or "finalized"
  assetBreakdown      String          // Encrypted JSON
  calculationDetails  String          // Encrypted JSON
  userNotes           String?         // Encrypted
  isPrimary           Boolean         @default(false)
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  
  user                User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  payments            PaymentRecord[]
  summary             AnnualSummary?
  reminders           ReminderEvent[]
  
  @@index([userId, calculationDate(sort: Desc)])
  @@index([userId, gregorianYear])
  @@index([userId, hijriYear])
  @@index([userId, status])
}

model PaymentRecord {
  id                  String          @id @default(uuid())
  userId              String
  snapshotId          String
  amount              String          // Encrypted
  paymentDate         DateTime
  recipientName       String          // Encrypted
  recipientType       String
  recipientCategory   String
  notes               String?         // Encrypted
  receiptReference    String?         // Encrypted
  paymentMethod       String
  status              String          // "recorded" or "verified"
  currency            String
  exchangeRate        Float           @default(1.0)
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  
  user                User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  snapshot            YearlySnapshot  @relation(fields: [snapshotId], references: [id], onDelete: Cascade)
  
  @@index([userId, paymentDate(sort: Desc)])
  @@index([snapshotId])
}

model AnalyticsMetric {
  id                  String          @id @default(uuid())
  userId              String
  metricType          String
  startDate           DateTime
  endDate             DateTime
  calculatedValue     String          // Encrypted JSON
  visualizationType   String
  parameters          String          // JSON
  calculatedAt        DateTime        @default(now())
  expiresAt           DateTime
  version             Int             @default(1)
  
  user                User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, metricType, expiresAt])
  @@index([expiresAt])
}

model AnnualSummary {
  id                     String          @id @default(uuid())
  userId                 String
  snapshotId             String          @unique
  gregorianYear          Int
  hijriYear              Int
  startDate              DateTime
  endDate                DateTime
  totalZakatCalculated   String          // Encrypted
  totalZakatPaid         String          // Encrypted
  outstandingZakat       String          // Encrypted
  numberOfPayments       Int
  recipientSummary       String          // Encrypted JSON
  assetBreakdown         String          // Encrypted JSON
  comparativeAnalysis    String          // Encrypted JSON
  methodologyUsed        String
  nisabInfo              String          // Encrypted JSON
  userNotes              String?         // Encrypted
  generatedAt            DateTime        @default(now())
  version                Int             @default(1)
  
  user                   User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  snapshot               YearlySnapshot  @relation(fields: [snapshotId], references: [id], onDelete: Cascade)
  
  @@index([userId, gregorianYear])
  @@index([userId, hijriYear])
  @@index([snapshotId])
}

model ReminderEvent {
  id                  String          @id @default(uuid())
  userId              String
  eventType           String
  triggerDate         DateTime
  title               String
  message             String
  priority            String          // "high", "medium", "low"
  status              String          // "pending", "shown", "acknowledged", "dismissed"
  relatedSnapshotId   String?
  metadata            String?         // JSON
  acknowledgedAt      DateTime?
  createdAt           DateTime        @default(now())
  
  user                User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  snapshot            YearlySnapshot? @relation(fields: [relatedSnapshotId], references: [id], onDelete: SetNull)
  
  @@index([userId, triggerDate])
  @@index([userId, status])
}

// Update existing User model
model User {
  // ... existing fields ...
  snapshots           YearlySnapshot[]
  payments            PaymentRecord[]
  analytics           AnalyticsMetric[]
  summaries           AnnualSummary[]
  reminders           ReminderEvent[]
}
```

---

## Data Flow

### Creating a Yearly Snapshot
1. User completes Zakat calculation
2. System creates YearlySnapshot with status="draft"
3. Encrypted asset breakdown and calculation details stored
4. Both Gregorian and Hijri dates recorded
5. User can finalize (status="finalized", becomes immutable)

### Recording a Payment
1. User enters payment details
2. System validates snapshotId exists and belongs to user
3. PaymentRecord created with encrypted recipient info
4. System calculates remaining outstanding Zakat
5. If total paid >= calculated, snapshot status indicator updated

### Generating Analytics
1. User opens analytics dashboard
2. System checks AnalyticsMetric cache for recent calculations
3. If cache miss or expired, calculate from YearlySnapshots and PaymentRecords
4. Store result in AnalyticsMetric with 5-minute expiration
5. Return calculated metrics to frontend

### Creating Annual Summary
1. User requests annual summary for specific year
2. System finds primary YearlySnapshot for that year
3. Aggregates all PaymentRecords for that snapshot
4. Compares with previous year's summary (if exists)
5. Creates AnnualSummary with comprehensive analysis
6. Summary can be regenerated if underlying data changes

### Reminder System
1. Background job runs daily to check ReminderEvents
2. For pending reminders with triggerDate <= today, set status="shown"
3. Dashboard displays shown reminders to user
4. User can acknowledge or dismiss reminders
5. System creates new reminders based on calculated triggers

---

**Status**: ✅ Complete  
**Next**: Create API contracts in contracts/ directory
