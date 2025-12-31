## Phase 1 — Data Model

### New / Updated Models

1. Asset (existing) — updates

- Fields to add:
  - `calculationModifier` Decimal(3,2) NOT NULL DEFAULT 1.00 -- allowed values: 0.00, 0.30, 1.00
  - `isPassiveInvestment` Boolean NOT NULL DEFAULT false
  - `isRestrictedAccount` Boolean NOT NULL DEFAULT false

  - Persist these fields separately from encrypted asset metadata to allow indexing and fast queries.

2. NisabRecord (new)

Purpose: Replace Yearly Snapshot as the historical record preserving asset values and modifier state at a point in time.

Schema (Prisma / SQL-ish):

```
model NisabRecord {
  id            String   @id @default(cuid())
  userId        String
  createdAt     DateTime @default(now())
  assetsJson    Json     // canonicalized asset snapshots including calculationModifier and flags
  totalZakatable Decimal @default(0.0)
  totalZakat     Decimal @default(0.0)
}
```

Notes:
- `assetsJson` contains per-asset snapshot objects including `assetId`, `value`, `currency`, `calculationModifier`, `isPassiveInvestment`, `isRestrictedAccount`, `acquisitionDate` and other non-sensitive metadata. Sensitive fields remain encrypted in the primary `assets` table if present.
- Index `userId, createdAt` for efficient retrieval.

Migration
- Add the new columns to `assets` and create `NisabRecord` table. Provide a migration script to copy existing `Yearly Snapshot` records into `NisabRecord` if applicable.

Constraints & Validation
- Server side must enforce `calculationModifier` in {0.00,0.30,1.00}.
- `isPassiveInvestment` must be false when `isRestrictedAccount` is true.
# Data Model: Dynamic Asset Eligibility Checkboxes

**Phase**: 1 - Data Model Design  
**Date**: 2025-12-12  
**Feature**: 021-experimental-feature-update

## Overview

This document defines the database schema changes and data structures required to support dynamic asset calculation modifiers based on Islamic scholarly guidance.

---

## Schema Changes

### Asset Model Extension

**Existing Schema** (Relevant fields):
```prisma
model Asset {
  id              String   @id @default(cuid())
  userId          String
  category        String   // cash, gold, silver, business, property, stocks, crypto
  name            String
  value           Float
  currency        String   @default("USD")
  acquisitionDate DateTime
  metadata        String?  // Encrypted JSON for category-specific details
  isActive        Boolean  @default(true)
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  snapshotValues SnapshotAssetValue[]

  @@map("assets")
  @@index([userId])
  @@index([category])
  @@index([userId, category])
  @@index([userId, isActive])
  @@index([acquisitionDate])
}
```

**New Fields**:
```prisma
model Asset {
  // ... existing fields ...
  
  // NEW: Calculation Modifier Fields
  calculationModifier  Float   @default(1.00)  // 0.00, 0.30, or 1.00
  isPassiveInvestment  Boolean @default(false) // 30% rule flag
  isRestrictedAccount  Boolean @default(false) // Accessibility exception flag
  
  // ... existing relationships ...
  
  @@map("assets")
  // ... existing indexes ...
  @@index([userId, isPassiveInvestment])
  @@index([userId, isRestrictedAccount])
}
```

**Field Specifications**:

| Field | Type | Default | Nullable | Description |
|-------|------|---------|----------|-------------|
| `calculationModifier` | Float (DECIMAL 3,2) | 1.00 | No | Multiplier applied to asset value before Zakat calculation. Valid values: 0.00 (restricted), 0.30 (passive), 1.00 (full) |
| `isPassiveInvestment` | Boolean | false | No | Flag indicating if 30% passive investment rule applies. Only applicable for Stock, ETF, Mutual Fund, Roth IRA |
| `isRestrictedAccount` | Boolean | false | No | Flag indicating if account is inaccessible. Only applicable for 401k, Traditional IRA, Pension, Roth IRA |

**Constraints**:
```sql
-- Database constraint to ensure valid modifier values
ALTER TABLE assets ADD CONSTRAINT valid_modifier 
  CHECK (calculation_modifier IN (0.00, 0.30, 1.00));

-- Business logic constraint (enforced in application layer):
-- If isRestrictedAccount = true, then calculationModifier MUST be 0.00
-- If isPassiveInvestment = true, then calculationModifier MUST be 0.30
-- If both false, then calculationModifier MUST be 1.00
```

---

### AssetSnapshot Model Extension

To preserve historical accuracy, snapshots must capture modifier values at the time of snapshot creation.

**Existing Schema** (Relevant fields):
```prisma
model AssetSnapshot {
  id              String   @id @default(cuid())
  snapshotId      String
  assetId         String
  category        String
  name            String
  value           Float
  currency        String
  metadata        String?
  createdAt       DateTime @default(now())

  snapshot Snapshot @relation(fields: [snapshotId], references: [id], onDelete: Cascade)

  @@map("asset_snapshots")
  @@index([snapshotId])
  @@index([assetId])
}
```

**New Fields**:
```prisma
model AssetSnapshot {
  // ... existing fields ...
  
  // NEW: Preserve modifier state at snapshot time
  calculationModifier  Float?   // NULL for pre-modifier snapshots
  isPassiveInvestment  Boolean? // NULL for pre-modifier snapshots
  isRestrictedAccount  Boolean? // NULL for pre-modifier snapshots
  
  // ... existing relationships ...
  
  @@map("asset_snapshots")
  // ... existing indexes ...
}
```

**Backward Compatibility**:
- Fields are nullable to support historical snapshots created before this feature
- NULL values treated as default: `calculationModifier = 1.00`, booleans = `false`
- New snapshots always populate these fields from current Asset state

---

## Migration Script

```sql
-- Migration: Add calculation modifier fields to Asset model
-- Generated: 2025-12-12

-- Step 1: Add new fields to assets table
ALTER TABLE assets ADD COLUMN calculation_modifier DECIMAL(3,2) DEFAULT 1.00 NOT NULL;
ALTER TABLE assets ADD COLUMN is_passive_investment BOOLEAN DEFAULT 0 NOT NULL;
ALTER TABLE assets ADD COLUMN is_restricted_account BOOLEAN DEFAULT 0 NOT NULL;

-- Step 2: Add constraint for valid modifier values
ALTER TABLE assets ADD CONSTRAINT valid_modifier 
  CHECK (calculation_modifier IN (0.00, 0.30, 1.00));

-- Step 3: Add indexes for efficient querying
CREATE INDEX idx_assets_user_passive ON assets(user_id, is_passive_investment);
CREATE INDEX idx_assets_user_restricted ON assets(user_id, is_restricted_account);

-- Step 4: Add corresponding fields to asset_snapshots table
ALTER TABLE asset_snapshots ADD COLUMN calculation_modifier DECIMAL(3,2) NULL;
ALTER TABLE asset_snapshots ADD COLUMN is_passive_investment BOOLEAN NULL;
ALTER TABLE asset_snapshots ADD COLUMN is_restricted_account BOOLEAN NULL;

-- Step 5: Verify migration
SELECT COUNT(*) FROM assets WHERE calculation_modifier = 1.00; -- Should match total asset count
SELECT COUNT(*) FROM assets WHERE is_passive_investment = 0;    -- Should match total asset count
SELECT COUNT(*) FROM assets WHERE is_restricted_account = 0;    -- Should match total asset count
```

**Rollback Script**:
```sql
-- Rollback: Remove calculation modifier fields

-- Remove indexes
DROP INDEX IF EXISTS idx_assets_user_passive;
DROP INDEX IF EXISTS idx_assets_user_restricted;

-- Remove constraint
ALTER TABLE assets DROP CONSTRAINT IF EXISTS valid_modifier;

-- Remove columns from asset_snapshots
ALTER TABLE asset_snapshots DROP COLUMN IF EXISTS calculation_modifier;
ALTER TABLE asset_snapshots DROP COLUMN IF EXISTS is_passive_investment;
ALTER TABLE asset_snapshots DROP COLUMN IF EXISTS is_restricted_account;

-- Remove columns from assets
ALTER TABLE assets DROP COLUMN IF EXISTS calculation_modifier;
ALTER TABLE assets DROP COLUMN IF EXISTS is_passive_investment;
ALTER TABLE assets DROP COLUMN IF EXISTS is_restricted_account;
```

---

## TypeScript Type Definitions

### Shared Types (shared/src/types/asset.ts)

```typescript
/**
 * Asset calculation modifier values
 */
export enum CalculationModifier {
  RESTRICTED = 0.0,  // Account is inaccessible, Zakat deferred
  PASSIVE = 0.3,     // Passive investment, 30% rule applies
  FULL = 1.0,        // Standard calculation, 100% of value
}

/**
 * Asset type categories that support passive investment checkbox
 */
export const PASSIVE_INVESTMENT_TYPES = [
  'Stock',
  'ETF',
  'Mutual Fund',
  'Roth IRA',
] as const;

/**
 * Asset type categories that support restricted account checkbox
 */
export const RESTRICTED_ACCOUNT_TYPES = [
  '401k',
  'Traditional IRA',
  'Pension',
  'Roth IRA',
] as const;

/**
 * Base Asset interface (extended from existing)
 */
export interface Asset {
  id: string;
  userId: string;
  category: string;
  name: string;
  value: number;
  currency: string;
  acquisitionDate: Date;
  metadata?: string;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // NEW: Modifier fields
  calculationModifier: number;
  isPassiveInvestment: boolean;
  isRestrictedAccount: boolean;
}

/**
 * Asset creation DTO (Data Transfer Object)
 */
export interface CreateAssetDto {
  category: string;
  name: string;
  value: number;
  currency?: string;
  acquisitionDate: Date;
  metadata?: string;
  notes?: string;
  
  // NEW: Modifier fields (optional, will be computed if not provided)
  isPassiveInvestment?: boolean;
  isRestrictedAccount?: boolean;
}

/**
 * Asset update DTO
 */
export interface UpdateAssetDto {
  category?: string;
  name?: string;
  value?: number;
  currency?: string;
  acquisitionDate?: Date;
  metadata?: string;
  notes?: string;
  isActive?: boolean;
  
  // NEW: Modifier fields
  isPassiveInvestment?: boolean;
  isRestrictedAccount?: boolean;
}

/**
 * Asset with computed Zakat information
 */
export interface AssetWithZakat extends Asset {
  zakatableAmount: number;  // Asset value × modifier
  zakatOwed: number;         // zakatableAmount × 0.025
  modifierApplied: 'restricted' | 'passive' | 'full'; // For UI display
}

/**
 * Snapshot of asset at a specific point in time
 */
export interface AssetSnapshot {
  id: string;
  snapshotId: string;
  assetId: string;
  category: string;
  name: string;
  value: number;
  currency: string;
  metadata?: string;
  createdAt: Date;
  
  // NEW: Preserved modifier state (nullable for historical snapshots)
  calculationModifier?: number | null;
  isPassiveInvestment?: boolean | null;
  isRestrictedAccount?: boolean | null;
}
```

---

## Validation Schemas

### Backend (Zod)

```typescript
import { z } from 'zod';
import { PASSIVE_INVESTMENT_TYPES, RESTRICTED_ACCOUNT_TYPES } from '@zakapp/shared';

/**
 * Valid calculation modifier values
 */
const validModifiers = [0.0, 0.3, 1.0] as const;

/**
 * Asset creation validation schema
 */
export const createAssetSchema = z.object({
  category: z.string().min(1),
  name: z.string().min(1).max(255),
  value: z.number().min(0),
  currency: z.string().length(3).default('USD'),
  acquisitionDate: z.coerce.date(),
  metadata: z.string().optional(),
  notes: z.string().max(1000).optional(),
  isPassiveInvestment: z.boolean().default(false),
  isRestrictedAccount: z.boolean().default(false),
}).refine(
  (data) => {
    // Validation: Passive investment checkbox only for applicable types
    if (data.isPassiveInvestment && !PASSIVE_INVESTMENT_TYPES.includes(data.category as any)) {
      return false;
    }
    return true;
  },
  {
    message: 'Passive investment flag can only be set for Stock, ETF, Mutual Fund, or Roth IRA',
  }
).refine(
  (data) => {
    // Validation: Restricted account checkbox only for applicable types
    if (data.isRestrictedAccount && !RESTRICTED_ACCOUNT_TYPES.includes(data.category as any)) {
      return false;
    }
    return true;
  },
  {
    message: 'Restricted account flag can only be set for 401k, Traditional IRA, Pension, or Roth IRA',
  }
).refine(
  (data) => {
    // Validation: Cannot be both passive and restricted
    if (data.isPassiveInvestment && data.isRestrictedAccount) {
      return false;
    }
    return true;
  },
  {
    message: 'Asset cannot be both passive investment and restricted account',
  }
);

/**
 * Asset update validation schema
 */
export const updateAssetSchema = createAssetSchema.partial();

/**
 * Calculation modifier validation
 */
export const modifierSchema = z.number().refine(
  (val) => validModifiers.includes(val as any),
  {
    message: 'Calculation modifier must be 0.0, 0.3, or 1.0',
  }
);
```

---

## Business Logic Functions

### Modifier Determination

```typescript
/**
 * Determines the calculation modifier based on asset flags
 * 
 * @param asset - Asset with modifier flags
 * @returns Numeric modifier (0.0, 0.3, or 1.0)
 */
export function determineModifier(asset: Pick<Asset, 'isRestrictedAccount' | 'isPassiveInvestment'>): number {
  // Priority order (most restrictive first):
  // 1. Restricted account → 0% (deferred)
  // 2. Passive investment → 30%
  // 3. Default → 100%
  
  if (asset.isRestrictedAccount) {
    return 0.0; // CalculationModifier.RESTRICTED
  }
  
  if (asset.isPassiveInvestment) {
    return 0.3; // CalculationModifier.PASSIVE
  }
  
  return 1.0; // CalculationModifier.FULL
}

/**
 * Calculates zakatable amount for a single asset
 * 
 * @param asset - Asset to calculate
 * @param exchangeRate - Currency exchange rate to base currency (default 1.0)
 * @returns Zakatable amount in base currency
 */
export function calculateZakatableAmount(
  asset: Pick<Asset, 'value' | 'calculationModifier'>,
  exchangeRate: number = 1.0
): number {
  const valueInBaseCurrency = asset.value * exchangeRate;
  return valueInBaseCurrency * asset.calculationModifier;
}

/**
 * Calculates Zakat owed for a single asset
 * 
 * @param asset - Asset to calculate
 * @param exchangeRate - Currency exchange rate to base currency (default 1.0)
 * @returns Zakat owed (2.5% of zakatable amount)
 */
export function calculateAssetZakat(
  asset: Pick<Asset, 'value' | 'calculationModifier'>,
  exchangeRate: number = 1.0
): number {
  const ZAKAT_RATE = 0.025; // 2.5%
  const zakatableAmount = calculateZakatableAmount(asset, exchangeRate);
  return zakatableAmount * ZAKAT_RATE;
}

/**
 * Determines modifier display label for UI
 * 
 * @param modifier - Numeric modifier value
 * @returns Human-readable label
 */
export function getModifierLabel(modifier: number): string {
  switch (modifier) {
    case 0.0:
      return 'Deferred - Restricted';
    case 0.3:
      return '30% Rule Applied';
    case 1.0:
      return 'Full Value';
    default:
      return 'Unknown';
  }
}
```

---

## Data Flow Diagram

```
User Input (UI)
    ↓
Asset Form (React)
├── Asset Type Selection → Determines which checkboxes to show
├── [ ] Passive Investment? (conditional)
└── [ ] Restricted Account? (conditional)
    ↓
Form Submission
    ↓
API Request (POST /api/assets)
{
  category: "Stock",
  value: 10000,
  isPassiveInvestment: true,
  isRestrictedAccount: false
}
    ↓
Server Validation (Zod)
├── Validate asset type allows checkbox
├── Validate modifier flags don't conflict
└── Calculate modifier: determineModifier()
    ↓
Database Write (Prisma)
{
  ...assetData,
  calculationModifier: 0.3,  // Computed from flags
  isPassiveInvestment: true,
  isRestrictedAccount: false
}
    ↓
Zakat Calculation (zakatService)
├── Retrieve all assets
├── For each: zakatableAmount = value × calculationModifier
└── Total Zakat = Σ (zakatableAmount × 0.025)
    ↓
Response to Client
{
  asset: {...},
  zakatableAmount: 3000,  // 10000 × 0.3
  zakatOwed: 75           // 3000 × 0.025
}
    ↓
UI Display
├── Asset card shows "30% Rule Applied" badge
└── Zakat summary includes correct calculation
```

---

## Query Patterns

### Get All Assets with Modifiers
```typescript
const assets = await prisma.asset.findMany({
  where: { userId, isActive: true },
  select: {
    id: true,
    category: true,
    name: true,
    value: true,
    currency: true,
    calculationModifier: true,
    isPassiveInvestment: true,
    isRestrictedAccount: true,
  },
});
```

### Get Assets by Modifier Type
```typescript
// Get all passive investments
const passiveAssets = await prisma.asset.findMany({
  where: {
    userId,
    isActive: true,
    isPassiveInvestment: true,
  },
});

// Get all restricted accounts
const restrictedAssets = await prisma.asset.findMany({
  where: {
    userId,
    isActive: true,
    isRestrictedAccount: true,
  },
});
```

### Create Snapshot with Modifiers
```typescript
const snapshot = await prisma.snapshot.create({
  data: {
    userId,
    snapshotDate: new Date(),
    assetSnapshots: {
      create: assets.map(asset => ({
        assetId: asset.id,
        category: asset.category,
        name: asset.name,
        value: asset.value,
        currency: asset.currency,
        metadata: asset.metadata,
        // Preserve modifier state
        calculationModifier: asset.calculationModifier,
        isPassiveInvestment: asset.isPassiveInvestment,
        isRestrictedAccount: asset.isRestrictedAccount,
      })),
    },
  },
});
```

---

## Index Strategy

**Existing Indexes** (Maintained):
- `userId` - Primary user-asset queries
- `category` - Filter by asset type
- `userId, category` - Combined filter
- `userId, isActive` - Active assets per user
- `acquisitionDate` - Date-based queries

**New Indexes** (Added):
- `userId, isPassiveInvestment` - Filter user's passive investments
- `userId, isRestrictedAccount` - Filter user's restricted accounts

**Query Performance**:
- Most queries use `userId` as primary filter (existing index)
- New composite indexes optimize modifier-specific filtering
- No full table scans expected
- Estimated query time: <10ms for typical user (50 assets)

---

## Data Integrity Rules

### Application-Level Constraints

1. **Modifier Consistency**: 
   - `calculationModifier` MUST match the combination of boolean flags
   - Enforced by `determineModifier()` function called before save

2. **Asset Type Validation**:
   - `isPassiveInvestment` can only be true for: Stock, ETF, Mutual Fund, Roth IRA
   - `isRestrictedAccount` can only be true for: 401k, Traditional IRA, Pension, Roth IRA
   - Enforced by Zod validation schema

3. **Mutual Exclusivity**:
   - An asset cannot be both `isPassiveInvestment` AND `isRestrictedAccount`
   - Restricted always takes precedence (modifier = 0.0)
   - Enforced by validation and UI logic

4. **Historical Preservation**:
   - Snapshots must capture modifier values at time of snapshot
   - Historical snapshots with NULL modifiers treated as defaults
   - Never retroactively modify snapshot data

### Database-Level Constraints

1. **Valid Modifier Values**:
   ```sql
   CHECK (calculation_modifier IN (0.00, 0.30, 1.00))
   ```

2. **Non-Null Defaults**:
   - All new assets have default values
   - No NULL modifiers in Asset table (nullable only in AssetSnapshot)

---

## Backward Compatibility

### Existing Assets
- All existing assets get default values during migration
- `calculationModifier = 1.00` (100%, no change in calculation)
- `isPassiveInvestment = false`
- `isRestrictedAccount = false`

### Existing Snapshots
- Historical snapshots remain unchanged
- NULL modifier fields in old snapshots
- NULL treated as defaults when displaying historical data

### API Compatibility
- New fields optional in API requests
- Omitted fields use defaults
- No breaking changes to existing endpoints

---

## Testing Scenarios

### Unit Tests
1. `determineModifier()` with various flag combinations
2. `calculateZakatableAmount()` with different modifiers
3. Zod validation for invalid combinations
4. Database constraint enforcement

### Integration Tests
1. Create asset with passive investment flag
2. Create asset with restricted account flag
3. Create Roth IRA with both flags (should fail)
4. Update asset modifier flags
5. Create snapshot with modifiers
6. Query assets by modifier type

### Edge Cases
1. Asset with NULL modifier (should use default 1.0)
2. Snapshot with NULL modifier (should use default)
3. Currency conversion with modifier
4. Historical snapshot display with NULL modifiers

---

## Conclusion

This data model design provides:

✅ **Simple schema extension** - 3 new fields, minimal complexity  
✅ **Type safety** - Strict TypeScript types and Zod validation  
✅ **Data integrity** - Database constraints and application-level rules  
✅ **Backward compatibility** - Existing data unaffected  
✅ **Performance** - Efficient indexes, minimal query overhead  
✅ **Historical accuracy** - Snapshot preservation of modifier state  

**Ready for Phase 2: API Contract Definition**
