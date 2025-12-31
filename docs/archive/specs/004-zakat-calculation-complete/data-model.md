# Data Model: Zakat Calculation Complete

**Feature**: 004-zakat-calculation-complete
**Date**: 2025-10-13
**Status**: Phase 1 - Design & Contracts

---

## Overview

This data model defines the database entities required for enhanced Zakat calculation with multi-methodology support, calendar system integration, and calculation history tracking.

**Key Entities**:

1. **User** (extends existing) - Calendar preference storage
2. **CalculationSnapshot** (NEW) - Immutable calculation records
3. **SnapshotAssetValue** (NEW) - Point-in-time asset values
4. **MethodologyConfig** (NEW) - Custom methodology configurations

**Design Principles**:

- Immutable history (audit trail)
- Encrypted sensitive data (AES-256)
- Additive changes (no breaking modifications)
- Backward compatible with existing system

---

## Entity Definitions

### 1. User (Extended)

**Purpose**: Store user preferences for calendar system

**Schema**:

```prisma
model User {
  id                 String   @id @default(uuid())
  username           String   @unique
  email              String   @unique
  passwordHash       String
  encryptionKey      String   // Encrypted user-specific key
  calendarType       String   @default("GREGORIAN") // NEW: "GREGORIAN" | "HIJRI"
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  
  // Relationships
  assets             Asset[]
  calculations       CalculationSnapshot[]
  methodologyConfigs MethodologyConfig[]
}
```

**New Fields**:

- `calendarType`: User's preferred calendar system for Zakat year tracking
  - **Type**: String (enum-like)
  - **Values**: "GREGORIAN" | "HIJRI"
  - **Default**: "GREGORIAN"
  - **Validation**: Must be one of the two calendar types
  - **Requirement**: FR001 (Calendar System Integration)

**Indexes**:

- Existing indexes remain unchanged
- No new indexes needed for this extension

**Migration Strategy**: ALTER TABLE users ADD COLUMN calendar_type TEXT DEFAULT 'GREGORIAN'

---

### 2. CalculationSnapshot (NEW)

**Purpose**: Immutable record of Zakat calculation with methodology used

**Schema**:

```prisma
model CalculationSnapshot {
  id                String   @id @default(uuid())
  userId            String
  calculationDate   DateTime @default(now())
  methodology       String   // "STANDARD" | "HANAFI" | "SHAFII" | "CUSTOM"
  methodologyConfigId String?  // FK to MethodologyConfig for CUSTOM
  totalWealth       String   // ENCRYPTED: Base64-encoded AES-256
  zakatDue          String   // ENCRYPTED: Base64-encoded AES-256
  nisabThreshold    String   // ENCRYPTED: Base64-encoded AES-256
  isLocked          Boolean  @default(true)
  lockedAt          DateTime?
  unlockedAt        DateTime?
  unlockedBy        String?  // User ID who unlocked
  unlockReason      String?  // Audit trail
  calendarType      String   // "GREGORIAN" | "HIJRI" (snapshot of user pref)
  zakatYearStart    DateTime // Start of Zakat year (Gregorian)
  zakatYearEnd      DateTime // End of Zakat year (Gregorian)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relationships
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  methodologyConfig MethodologyConfig? @relation(fields: [methodologyConfigId], references: [id])
  assetValues       SnapshotAssetValue[]
  
  @@index([userId, calculationDate])
  @@index([methodology])
  @@index([isLocked])
}
```

**Fields Explanation**:

- `id`: Unique identifier (UUID)
- `userId`: Foreign key to User
- `calculationDate`: When calculation was performed
- `methodology`: Methodology used ("STANDARD" | "HANAFI" | "SHAFII" | "CUSTOM")
- `methodologyConfigId`: FK to custom config (null for fixed methodologies)
- `totalWealth`: **ENCRYPTED** - Total zakatable wealth at calculation time
- `zakatDue`: **ENCRYPTED** - Calculated Zakat amount owed
- `nisabThreshold`: **ENCRYPTED** - Nisab threshold used (gold/silver value)
- `isLocked`: Immutability flag (true = cannot edit, false = editable)
- `lockedAt`: Timestamp when locked (audit trail)
- `unlockedAt`: Timestamp when unlocked for editing
- `unlockedBy`: User ID who performed unlock (audit trail)
- `unlockReason`: Required justification for unlock (audit trail)
- `calendarType`: Calendar system snapshot (Gregorian/Hijri)
- `zakatYearStart`: Start date of Zakat year (always stored as Gregorian)
- `zakatYearEnd`: End date of Zakat year (always stored as Gregorian)

**Validation Rules**:

- `methodology` MUST be one of: ["STANDARD", "HANAFI", "SHAFII", "CUSTOM"]
- `methodologyConfigId` REQUIRED if methodology = "CUSTOM", NULL otherwise
- `unlockReason` REQUIRED if isLocked = false AND unlockedAt IS NOT NULL
- `totalWealth`, `zakatDue`, `nisabThreshold` MUST be encrypted before storage
- `calculationDate` MUST be within zakatYearStart and zakatYearEnd

**State Transitions**:

```text
Created (isLocked = true, lockedAt = now())
    ↓
Unlocked (isLocked = false, unlockedAt = now(), unlockedBy = userId, unlockReason = "...")
    ↓
Re-locked (isLocked = true, lockedAt = now())
```

**Indexes**:

- `(userId, calculationDate)`: Fast history queries
- `(methodology)`: Methodology-based filtering
- `(isLocked)`: Unlock management queries

**Requirements Mapping**:

- FR003: Enhanced calculation display (methodology field)
- FR004: Calculation history and comparison (snapshot storage)
- FR006: Methodology selection persistence (methodology field)

---

### 3. SnapshotAssetValue (NEW)

**Purpose**: Point-in-time asset values captured during calculation

**Schema**:

```prisma
model SnapshotAssetValue {
  id            String   @id @default(uuid())
  snapshotId    String
  assetId       String
  assetName     String   // Denormalized for historical accuracy
  assetCategory String   // Denormalized (CASH, GOLD, CRYPTO, etc.)
  capturedValue String   // ENCRYPTED: Base64-encoded AES-256
  capturedAt    DateTime @default(now())
  isZakatable   Boolean  // Based on methodology rules
  createdAt     DateTime @default(now())
  
  // Relationships
  snapshot      CalculationSnapshot @relation(fields: [snapshotId], references: [id], onDelete: Cascade)
  asset         Asset    @relation(fields: [assetId], references: [id])
  
  @@index([snapshotId])
  @@index([assetId])
}
```

**Fields Explanation**:

- `id`: Unique identifier (UUID)
- `snapshotId`: Foreign key to CalculationSnapshot
- `assetId`: Foreign key to Asset (current asset)
- `assetName`: **Denormalized** - Asset name at capture time (historical accuracy)
- `assetCategory`: **Denormalized** - Category at capture time
- `capturedValue`: **ENCRYPTED** - Asset value at calculation time
- `capturedAt`: Timestamp of value capture
- `isZakatable`: Whether asset counted toward Zakat (methodology-dependent)

**Denormalization Rationale**:

- Asset name/category may change after calculation
- Preserves historical accuracy of calculation breakdown
- Allows asset deletion without losing history

**Validation Rules**:

- `capturedValue` MUST be encrypted before storage
- `capturedValue` MUST be > 0 for zakatable assets
- `assetCategory` MUST match Asset categories enum

**Indexes**:

- `(snapshotId)`: Fast snapshot breakdown queries
- `(assetId)`: Asset history tracking

**Requirements Mapping**:

- FR003: Enhanced calculation display (asset breakdown)
- FR004: Calculation history (point-in-time values)

---

### 4. MethodologyConfig (NEW)

**Purpose**: User-defined custom methodology configurations

**Schema**:

```prisma
model MethodologyConfig {
  id                 String   @id @default(uuid())
  userId             String
  name               String   // User-friendly name (e.g., "My Regional Method")
  nisabBasis         String   // "GOLD" | "SILVER" | "CUSTOM_VALUE"
  customNisabValue   String?  // ENCRYPTED: Only for CUSTOM_VALUE
  rate               Float    @default(2.5) // Percentage (2.5 = 2.5%)
  assetRules         Json     // Category-specific rules
  isActive           Boolean  @default(true)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  
  // Relationships
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  calculations       CalculationSnapshot[]
  
  @@index([userId, isActive])
}
```

**Fields Explanation**:

- `id`: Unique identifier (UUID)
- `userId`: Foreign key to User (owns this config)
- `name`: User-friendly name for custom methodology
- `nisabBasis`: Nisab calculation method
  - "GOLD": Current gold price × 85 grams
  - "SILVER": Current silver price × 595 grams
  - "CUSTOM_VALUE": User-defined fixed amount
- `customNisabValue`: **ENCRYPTED** - Fixed nisab amount (only if basis = CUSTOM_VALUE)
- `rate`: Zakat rate percentage (default 2.5%, can be adjusted)
- `assetRules`: JSON object defining per-category rules
- `isActive`: Whether config is available for selection

**Asset Rules JSON Schema**:

```typescript
interface AssetRules {
  [category: string]: {
    included: boolean;           // Whether category is zakatable
    adjustmentPercentage?: number; // Optional adjustment (e.g., 0.8 = 80% of value)
    notes?: string;              // Optional user notes
  };
}
```

**Example Asset Rules**:

```json
{
  "CASH": { "included": true },
  "GOLD": { "included": true, "adjustmentPercentage": 1.0 },
  "CRYPTO": { "included": true },
  "REAL_ESTATE": { "included": false, "notes": "Personal residence exempt" },
  "BUSINESS_ASSETS": { "included": true, "adjustmentPercentage": 0.9 }
}
```

**Validation Rules**:

- `name` MUST be unique per user
- `nisabBasis` MUST be one of: ["GOLD", "SILVER", "CUSTOM_VALUE"]
- `customNisabValue` REQUIRED if nisabBasis = "CUSTOM_VALUE"
- `rate` MUST be between 0 and 100
- `assetRules` MUST be valid JSON matching schema

**Indexes**:

- `(userId, isActive)`: Fast config selection queries

**Requirements Mapping**:

- FR002: Multi-methodology calculations (custom methodology)
- FR006: Methodology selection (user-defined methods)

---

## Entity Relationships

```text
User (1) ─────── (N) CalculationSnapshot
  │                        │
  │                        └── (N) SnapshotAssetValue
  │                                    │
  │                                    └── (1) Asset
  │
  └── (N) MethodologyConfig ──── (N) CalculationSnapshot
```

**Relationship Types**:

1. **User → CalculationSnapshot**: One-to-Many
   - User owns multiple calculations
   - Cascade delete snapshots when user deleted

2. **CalculationSnapshot → SnapshotAssetValue**: One-to-Many
   - Each snapshot has multiple asset values
   - Cascade delete values when snapshot deleted

3. **Asset → SnapshotAssetValue**: One-to-Many
   - Asset referenced in multiple snapshots
   - Do NOT cascade delete (preserve history)

4. **User → MethodologyConfig**: One-to-Many
   - User creates multiple custom configs
   - Cascade delete configs when user deleted

5. **MethodologyConfig → CalculationSnapshot**: One-to-Many
   - Config used in multiple calculations
   - Do NOT cascade delete (preserve history)

---

## Security & Encryption

**Encrypted Fields** (AES-256-CBC):

1. `CalculationSnapshot.totalWealth`
2. `CalculationSnapshot.zakatDue`
3. `CalculationSnapshot.nisabThreshold`
4. `SnapshotAssetValue.capturedValue`
5. `MethodologyConfig.customNisabValue`

**Encryption Process**:

```typescript
// Before storage
const encrypted = encryptData(plaintext, user.encryptionKey);
await prisma.calculationSnapshot.create({
  data: { totalWealth: encrypted, ... }
});

// On retrieval
const decrypted = decryptData(snapshot.totalWealth, user.encryptionKey);
```

**Key Management**:

- User-specific encryption keys stored in `User.encryptionKey` (itself encrypted with master key)
- Master key stored in environment variable (not in database)
- No sensitive data logged or transmitted unencrypted

---

## Migration Plan

### Step 1: Add User.calendarType

```sql
ALTER TABLE users ADD COLUMN calendar_type TEXT DEFAULT 'GREGORIAN';
```

### Step 2: Create New Tables

```sql
-- CalculationSnapshot table
CREATE TABLE calculation_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  calculation_date DATETIME NOT NULL,
  methodology TEXT NOT NULL,
  methodology_config_id TEXT,
  total_wealth TEXT NOT NULL,
  zakat_due TEXT NOT NULL,
  nisab_threshold TEXT NOT NULL,
  is_locked BOOLEAN DEFAULT 1,
  locked_at DATETIME,
  unlocked_at DATETIME,
  unlocked_by TEXT,
  unlock_reason TEXT,
  calendar_type TEXT NOT NULL,
  zakat_year_start DATETIME NOT NULL,
  zakat_year_end DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (methodology_config_id) REFERENCES methodology_configs(id)
);

CREATE INDEX idx_snapshots_user_date ON calculation_snapshots(user_id, calculation_date);
CREATE INDEX idx_snapshots_methodology ON calculation_snapshots(methodology);
CREATE INDEX idx_snapshots_locked ON calculation_snapshots(is_locked);

-- SnapshotAssetValue table
CREATE TABLE snapshot_asset_values (
  id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  asset_category TEXT NOT NULL,
  captured_value TEXT NOT NULL,
  captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_zakatable BOOLEAN NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (snapshot_id) REFERENCES calculation_snapshots(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);

CREATE INDEX idx_asset_values_snapshot ON snapshot_asset_values(snapshot_id);
CREATE INDEX idx_asset_values_asset ON snapshot_asset_values(asset_id);

-- MethodologyConfig table
CREATE TABLE methodology_configs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  nisab_basis TEXT NOT NULL,
  custom_nisab_value TEXT,
  rate REAL DEFAULT 2.5,
  asset_rules TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_configs_user_active ON methodology_configs(user_id, is_active);
```

### Step 3: Update Asset Model (Add Relationship)

```prisma
model Asset {
  // ... existing fields ...
  snapshotValues SnapshotAssetValue[] // NEW relationship
}
```

No schema migration needed for Asset table (relationship is virtual).

---

## Performance Considerations

**Query Optimization**:

1. **History Queries** (most frequent):
   - Index on `(userId, calculationDate)` enables fast pagination
   - Limit to last 100 snapshots by default
   - Use cursor-based pagination for large histories

2. **Unlock Management**:
   - Index on `isLocked` enables fast filtering
   - Typically <1% of snapshots unlocked

3. **Methodology Filtering**:
   - Index on `methodology` enables comparison views
   - Group by methodology for multi-year analysis

**Data Volume Estimates**:

- Average user: 1-2 calculations per year = ~10 snapshots over 5 years
- Each snapshot: ~10-20 asset values
- Total rows per user: ~200-400 over 5 years
- Database size: Negligible (<1MB per user with encryption overhead)

**Caching Strategy**:

- Cache latest calculation per user (React Query: 5 min stale time)
- Cache methodology configs per user (rarely change)
- No caching for history (infrequent queries, small data)

---

## Validation & Business Rules

### Calculation Snapshot Rules

1. **Methodology Consistency**:
   - If `methodology = "CUSTOM"`, `methodologyConfigId` MUST NOT be NULL
   - If `methodology != "CUSTOM"`, `methodologyConfigId` MUST be NULL

2. **Unlock Audit Trail**:
   - If `isLocked = false`, then `unlockedAt`, `unlockedBy`, `unlockReason` MUST NOT be NULL
   - If `isLocked = true` AND `unlockedAt` IS NOT NULL, then snapshot was previously unlocked

3. **Calendar Consistency**:
   - `zakatYearEnd` MUST be exactly 354 days (Hijri) or 365 days (Gregorian) after `zakatYearStart`
   - `calculationDate` MUST be >= `zakatYearEnd`

4. **Encryption Validation**:
   - All encrypted fields MUST be Base64-encoded strings
   - Decryption failure = data corruption error

### Asset Value Rules

1. **Zakatable Asset Values**:
   - If `isZakatable = true`, then `capturedValue` (decrypted) MUST be > 0
   - If `isZakatable = false`, `capturedValue` MAY be 0

2. **Category Consistency**:
   - `assetCategory` MUST match one of: ["CASH", "GOLD", "SILVER", "CRYPTO", "STOCKS", "BONDS", "BUSINESS_ASSETS", "REAL_ESTATE", "OTHER"]

### Methodology Config Rules

1. **Nisab Validation**:
   - If `nisabBasis = "CUSTOM_VALUE"`, then `customNisabValue` MUST NOT be NULL
   - `customNisabValue` (decrypted) MUST be > 0

2. **Rate Validation**:
   - `rate` MUST be between 0 and 100 (percentage)
   - Default: 2.5% (standard Zakat rate)

3. **Asset Rules JSON Validation**:
   - MUST be valid JSON object
   - Each key MUST match valid asset category
   - Each value MUST have `included` boolean field

---

## Testing Strategy

### Unit Tests (Service Layer)

1. **CalendarService**:
   - Test Hijri-Gregorian conversion (100% coverage)
   - Test year start/end calculation
   - Test leap year handling

2. **ZakatCalculationService**:
   - Test each methodology independently (>95% coverage)
   - Test nisab threshold calculations
   - Test asset categorization rules
   - Test encryption/decryption

3. **CalculationHistoryService**:
   - Test snapshot creation
   - Test unlock/lock workflows
   - Test audit trail generation

### Integration Tests

1. **Snapshot Creation Flow**:
   - Create assets → Calculate Zakat → Verify snapshot
   - Verify asset values captured correctly
   - Verify encryption applied

2. **Unlock Workflow**:
   - Create locked snapshot
   - Unlock with reason
   - Edit snapshot
   - Re-lock
   - Verify audit trail

3. **Methodology Switching**:
   - Calculate with Standard methodology
   - Calculate with Hanafi methodology
   - Compare results
   - Verify methodology field correct

### Contract Tests

Contract tests defined in `/contracts/` directory (see API Contracts section).

---

## API Contracts Reference

API contracts for this data model are defined in:

- `/contracts/calendar.yaml` - Calendar conversion endpoints
- `/contracts/calculations.yaml` - Calculation and snapshot endpoints
- `/contracts/methodology.yaml` - Methodology config endpoints

See **Phase 1: API Contracts** section in plan.md for details.

---

## Conclusion

This data model provides:

- ✅ Immutable calculation history with audit trail
- ✅ Multi-methodology support (fixed + custom)
- ✅ Calendar system flexibility
- ✅ Point-in-time asset value snapshots
- ✅ Comprehensive security (AES-256 encryption)
- ✅ Backward compatibility (additive changes only)
- ✅ Performance optimization (strategic indexes)

**Next Steps**:

1. Generate Prisma migrations from schema
2. Create API contracts in `/contracts/`
3. Generate contract tests (failing)
4. Implement backend services
5. Implement frontend UI components
