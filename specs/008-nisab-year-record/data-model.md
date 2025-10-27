# Phase 1: Data Model

## Entity Definitions

### 1. NisabYearRecord (formerly YearlySnapshot)

**Purpose**: Represents a complete record of user's zakatable wealth and Zakat calculation for one Hawl (lunar year) following Islamic accounting principles.

**Schema Changes from YearlySnapshot**:

```prisma
model NisabYearRecord {
  id                     String   @id @default(cuid())
  userId                 String
  
  // Hawl Tracking (NEW FIELDS)
  hawlStartDate          DateTime  // When aggregate wealth first reached Nisab
  hawlStartDateHijri     String    // Hijri equivalent (e.g., "1446-03-15")
  hawlCompletionDate     DateTime  // ~354 days after start
  hawlCompletionDateHijri String   // Hijri equivalent
  nisabThresholdAtStart  String    // Encrypted - Value locked at Hawl start
  nisabBasis             String    // "gold" or "silver"
  
  // Existing Fields (preserved)
  calculationDate        DateTime
  gregorianYear          Int
  gregorianMonth         Int
  gregorianDay           Int
  hijriYear              Int
  hijriMonth             Int
  hijriDay               Int
  totalWealth            String   // Encrypted
  totalLiabilities       String   // Encrypted
  zakatableWealth        String   // Encrypted
  zakatAmount            String   // Encrypted
  methodologyUsed        String
  nisabThreshold         String   // Encrypted (deprecated in favor of nisabThresholdAtStart)
  nisabType              String   // (deprecated in favor of nisabBasis)
  
  // Status Management (UPDATED)
  status                 String   // "DRAFT", "FINALIZED", "UNLOCKED" (was "draft" or "finalized")
  
  assetBreakdown         String   // Encrypted JSON
  calculationDetails     String   // Encrypted JSON
  userNotes              String?  // Encrypted
  isPrimary              Boolean  @default(false)
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  finalizedAt            DateTime? // NEW - Timestamp of finalization

  // Relationships
  user                   User              @relation("UserNisabYearRecords", fields: [userId], references: [id], onDelete: Cascade)
  payments               PaymentRecord[]
  summary                AnnualSummary?
  reminders              ReminderEvent[]
  auditTrail             AuditTrailEntry[] // NEW relationship

  @@map("nisab_year_records") // RENAMED from "yearly_snapshots"
  @@index([userId, calculationDate(sort: Desc)])
  @@index([userId, status])
  @@index([userId, hawlStartDate])
  @@index([userId, hawlCompletionDate])
}
```

**Validation Rules**:
- `status` must be one of: "DRAFT", "FINALIZED", "UNLOCKED"
- `nisabBasis` must be either "gold" or "silver"
- `hawlStartDate` < `hawlCompletionDate`
- `hawlCompletionDate` ≈ `hawlStartDate` + 354 days (±5 days tolerance for lunar calendar adjustments)
- `nisabThresholdAtStart` must be encrypted and > 0
- All encrypted fields must use AES-256 via EncryptionService

**State Transitions**:
- `DRAFT` → `FINALIZED`: Allowed when `hawlCompletionDate` ≤ NOW (with optional override)
- `FINALIZED` → `UNLOCKED`: Allowed with unlock reason (audit trail required)
- `UNLOCKED` → `FINALIZED`: Allowed (re-finalization with audit trail)
- `DRAFT` → `UNLOCKED`: NOT ALLOWED
- `FINALIZED` → `DRAFT`: NOT ALLOWED

### 2. AuditTrailEntry (NEW)

**Purpose**: Records every unlock, edit, and re-finalization event for Nisab Year Records, providing an immutable history.

**Schema**:

```prisma
model AuditTrailEntry {
  id                     String   @id @default(cuid())
  nisabYearRecordId      String   // Foreign key to NisabYearRecord
  userId                 String   // User who performed the action
  eventType              String   // "UNLOCKED", "EDITED", "REFINALIZED", "CREATED", "FINALIZED"
  timestamp              DateTime @default(now())
  unlockReason           String?  // Encrypted - Required for UNLOCKED events (min 10 chars)
  changesSummary         String?  // Encrypted JSON - What fields were modified
  beforeState            String?  // Encrypted JSON - Snapshot before change
  afterState             String?  // Encrypted JSON - Snapshot after change
  ipAddress              String?  // Security tracking (optional)
  userAgent              String?  // Security tracking (optional)

  // Relationships
  nisabYearRecord        NisabYearRecord @relation(fields: [nisabYearRecordId], references: [id], onDelete: Cascade)
  user                   User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("audit_trail_entries")
  @@index([nisabYearRecordId, timestamp(sort: Desc)])
  @@index([userId, timestamp(sort: Desc)])
  @@index([eventType])
}
```

**Validation Rules**:
- `eventType` must be one of: "CREATED", "FINALIZED", "UNLOCKED", "EDITED", "REFINALIZED"
- `unlockReason` is REQUIRED for eventType = "UNLOCKED" (min 10 characters)
- `changesSummary` is REQUIRED for eventType = "EDITED"
- Entries are IMMUTABLE (no UPDATE or DELETE operations allowed)
- All encrypted fields must use AES-256

### 3. PreciousMetalPrice (NEW)

**Purpose**: Caches fetched gold and silver prices for consistent Nisab calculations.

**Schema**:

```prisma
model PreciousMetalPrice {
  id                     String   @id @default(cuid())
  metalType              String   // "gold" or "silver"
  pricePerGram           Float    // In base currency (USD)
  currency               String   @default("USD")
  fetchedAt              DateTime @default(now())
  sourceApi              String   @default("metals-api.com")
  expiresAt              DateTime // fetchedAt + 24 hours

  @@map("precious_metal_prices")
  @@index([metalType, fetchedAt(sort: Desc)])
  @@unique([metalType, fetchedAt]) // Prevent duplicate fetches
}
```

**Validation Rules**:
- `metalType` must be either "gold" or "silver"
- `pricePerGram` must be > 0
- `expiresAt` = `fetchedAt` + 24 hours
- Clean up entries older than 30 days (background job)

### 4. HawlTracker (Ephemeral/Service Layer Entity - NOT DATABASE TABLE)

**Purpose**: Tracks active Hawl periods for monitoring and detection. Managed in service layer, not persisted separately.

**Virtual Entity** (derived from NisabYearRecord + User assets):

```typescript
interface HawlTracker {
  userId: string;
  hawlStartDate: Date;
  hawlStartDateHijri: string;
  hawlCompletionDate: Date;
  nisabThresholdAtStart: number;
  currentAggregateWealth: number; // Calculated live
  status: 'ACTIVE' | 'COMPLETED' | 'INTERRUPTED';
  daysRemaining: number; // Calculated
  nisabYearRecordId: string; // Associated DRAFT record
}
```

**Not Persisted** - Calculated on-demand from:
- Latest DRAFT NisabYearRecord for user
- Current aggregate wealth from assets
- Today's date vs hawlCompletionDate

## Relationships

```
User (1) ----< (M) NisabYearRecord
User (1) ----< (M) AuditTrailEntry
NisabYearRecord (1) ----< (M) AuditTrailEntry
NisabYearRecord (1) ----< (M) PaymentRecord (existing)
NisabYearRecord (1) ---< (1) AnnualSummary (existing)
NisabYearRecord (1) ----< (M) ReminderEvent (existing)
```

## Migration Plan

### Step 1: Create New Tables

```sql
-- Create audit_trail_entries table
CREATE TABLE audit_trail_entries (
  id TEXT PRIMARY KEY,
  nisab_year_record_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  unlock_reason TEXT,
  changes_summary TEXT,
  before_state TEXT,
  after_state TEXT,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (nisab_year_record_id) REFERENCES nisab_year_records(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create precious_metal_prices table
CREATE TABLE precious_metal_prices (
  id TEXT PRIMARY KEY,
  metal_type TEXT NOT NULL,
  price_per_gram REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  source_api TEXT DEFAULT 'metals-api.com',
  expires_at DATETIME NOT NULL,
  UNIQUE(metal_type, fetched_at)
);
```

### Step 2: Migrate YearlySnapshot to NisabYearRecord

```sql
-- Rename table
ALTER TABLE yearly_snapshots RENAME TO nisab_year_records;

-- Add new columns
ALTER TABLE nisab_year_records ADD COLUMN hawl_start_date DATETIME;
ALTER TABLE nisab_year_records ADD COLUMN hawl_start_date_hijri TEXT;
ALTER TABLE nisab_year_records ADD COLUMN hawl_completion_date DATETIME;
ALTER TABLE nisab_year_records ADD COLUMN hawl_completion_date_hijri TEXT;
ALTER TABLE nisab_year_records ADD COLUMN nisab_threshold_at_start TEXT;
ALTER TABLE nisab_year_records ADD COLUMN nisab_basis TEXT;
ALTER TABLE nisab_year_records ADD COLUMN finalized_at DATETIME;

-- Update status values (draft → DRAFT, finalized → FINALIZED)
UPDATE nisab_year_records SET status = UPPER(status);

-- Set default values for new fields (for existing records)
UPDATE nisab_year_records 
SET 
  hawl_start_date = DATE(calculation_date, '-354 days'),
  hawl_completion_date = calculation_date,
  nisab_basis = nisab_type,
  nisab_threshold_at_start = nisab_threshold,
  finalized_at = CASE WHEN status = 'FINALIZED' THEN updated_at ELSE NULL END
WHERE hawl_start_date IS NULL;

-- Generate Hijri dates (application code will populate during migration)
-- This requires hijri-calendar library, done in TypeScript migration script
```

### Step 3: Update Indexes

```sql
CREATE INDEX idx_nyr_user_hawl_start ON nisab_year_records(user_id, hawl_start_date);
CREATE INDEX idx_nyr_user_hawl_completion ON nisab_year_records(user_id, hawl_completion_date);
CREATE INDEX idx_audit_record_timestamp ON audit_trail_entries(nisab_year_record_id, timestamp DESC);
CREATE INDEX idx_audit_user_timestamp ON audit_trail_entries(user_id, timestamp DESC);
CREATE INDEX idx_prices_metal_fetched ON precious_metal_prices(metal_type, fetched_at DESC);
```

### Step 4: Update Foreign Key References

```sql
-- PaymentRecord already uses snapshotId (generic name), just verify relationship
-- AnnualSummary references yearlySnapshotId, no schema change needed (Prisma handles)
```

## Calculated Fields & Virtual Properties

### NisabYearRecord

**Live Tracked Fields** (not persisted for DRAFT records):
- `currentTotalWealth`: Sum of all user assets marked as zakatable
- `currentZakatAmount`: currentTotalWealth × 0.025
- `wealthGrowth`: currentTotalWealth - totalWealthAtHawlStart
- `daysRemaining`: Math.ceil((hawlCompletionDate - today) / (1000 * 60 * 60 * 24))

**Computed Properties**:
- `isHawlComplete`: today >= hawlCompletionDate
- `canFinalize`: isHawlComplete && status === "DRAFT"
- `isAboveNisab`: currentTotalWealth >= nisabThresholdAtStart

## Security & Encryption

All sensitive financial data must be encrypted using the existing `EncryptionService`:

**Encrypted Fields**:
- `totalWealth`
- `totalLiabilities`
- `zakatableWealth`
- `zakatAmount`
- `nisabThresholdAtStart`
- `assetBreakdown`
- `calculationDetails`
- `userNotes`
- `AuditTrailEntry.unlockReason`
- `AuditTrailEntry.changesSummary`
- `AuditTrailEntry.beforeState`
- `AuditTrailEntry.afterState`

**Decryption Required For**:
- Displaying record details to user
- Live wealth comparison calculations
- Audit trail history display

## Test Data Requirements

For integration tests, seed database with:
- 2 users (one with active Hawl, one without)
- 3 NisabYearRecords per user (1 DRAFT, 1 FINALIZED, 1 UNLOCKED)
- 5 AuditTrailEntry records (unlock, edit, refinalize events)
- 2 PreciousMetalPrice records (gold and silver, current date)
- 10 assets per user (variety of categories, some above Nisab)

## Next Steps

With data model defined:
1. ✅ Generate Prisma migration file
2. ✅ Create API contracts (OpenAPI schemas)
3. ✅ Write quickstart guide (manual testing scenarios)
4. ✅ Update Copilot instructions with new entities
