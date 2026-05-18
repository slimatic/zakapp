# Asset History Ledger - Research Learnings

## Current Zakapp Structure (As-Is)

### Asset Model (schema.prisma lines 76-107)
```
Asset {
  id, userId, category, name, value (Float), currency
  acquisitionDate, createdAt, updatedAt
  calculationModifier (Float, default 1.0)
  isPassiveInvestment, isRestrictedAccount
  isActive, metadata (encrypted JSON)
}
```

**Key Issue**: `Asset.value` stores ONLY current value. No historical tracking.

### Existing History Mechanisms
1. **YearlySnapshot** (NisabYearRecord): Yearly aggregates, encrypted amounts
2. **CalculationSnapshot**: Point-in-time calculation states
3. **AuditTrailEntry**: Immutable changes to finalized records
4. **CalculationHistory**: Historical calculation snapshots

**Gap**: No automatic daily asset value history. Values only captured when:
- User creates a calculation
- Nisab Year Record is created
- Manual snapshot is taken

### How Amounts Are Updated
```
AssetService.updateAsset() → updates Asset.value
→ triggers HawlTrackingService.handleWealthChange()
→ recalculates wealth, checks nisab threshold
```

**Problem for Backporting**: Cannot enter historical asset values for past dates.

---

## Ghostfolio Approach (Reference)

### Data Model
```prisma
model AccountBalance {
  accountId, userId, date (DateTime @default(now()))
  value Float
  @@unique([accountId, date])  // One record per day
  @@index([date])
}
```

### Key Design Decisions
1. **Daily snapshots**: One balance per account per day
2. **Upsert pattern**: Same-day updates replace previous value
3. **Forward-fill**: Charts carry last known balance forward
4. **Event-driven**: Emits PortfolioChangedEvent for cache invalidation

### Strengths
- Simple, performant
- Easy to query historical values
- Natural time-series data

### Weaknesses
- No intra-day granularity
- No immutable audit trail (overwrites same-day)
- No transaction context

---

## Accounting Patterns Evaluated

### Pattern 1: Pure Event Sourcing
**Concept**: Store every change as immutable event
```
AssetEvent { assetId, eventType, amount, timestamp, userId, description }
```

**Pros**: Complete audit trail, temporal queries, rebuild any state
**Cons**: Complex, requires snapshot strategy for performance

### Pattern 2: Time-Series Snapshots (Ghostfolio-style)
**Concept**: Daily snapshots with upsert
```
AssetAmount { assetId, date, amount, @@unique([assetId, date]) }
```

**Pros**: Simple, performant, natural charts
**Cons**: Loses intra-day changes, no immutable audit

### Pattern 3: Hybrid (Recommended)
**Concept**: Event log + periodic snapshots
```
AssetEvent { assetId, eventType, amount, timestamp, userId, description }
AssetSnapshot { assetId, date, amount, version }
```

**Pros**: Audit trail + performance, rebuild capability
**Cons**: More complex implementation

### Pattern 4: Double-Entry Bookkeeping
**Concept**: Every transaction affects two accounts
```
JournalEntry { id, date, description }
LedgerEntry { journalEntryId, accountId, debitAmount, creditAmount }
```

**Pros**: Self-balancing, industry standard
**Cons**: Overkill for personal finance, complex

---

## Recommended Approach for Zakapp

### Hybrid Pattern: Event Log + Snapshots

**Why Hybrid?**
1. **Audit requirement**: Need immutable record of all changes
2. **Backporting need**: Must support historical entries for past dates
3. **Performance**: Need fast queries for current values
4. **Non-breaking**: Cannot modify existing Asset table

### Schema Design
```prisma
// NEW: Immutable event log
model AssetAmountEvent {
  id String @id @default(uuid())
  assetId String
  eventType String  // 'CREATED', 'UPDATED', 'CORRECTION', 'BACKPORT'
  amount Decimal
  currency String @default("USD")
  effectiveDate DateTime  // When the amount is effective
  recordedAt DateTime @default(now())  // When entered into system
  userId String
  description String?
  source String?  // 'manual', 'import', 'api'
  metadata Json?  // Additional context
  isReversed Boolean @default(false)  // For corrections
  originalEventId String?  // If this reverses a previous event
  
  asset Asset @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  @@index([assetId, effectiveDate])
  @@index([assetId, recordedAt])
  @@index([userId, effectiveDate])
  @@index([eventType])
}

// NEW: Computed snapshots (for performance)
model AssetAmountSnapshot {
  id String @id @default(uuid())
  assetId String
  date DateTime  // Daily snapshot at midnight
  amount Decimal
  eventCount Int  // Number of events since last snapshot
  createdAt DateTime @default(now())
  
  asset Asset @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  @@unique([assetId, date])
  @@index([assetId])
  @@index([date])
}
```

### Key Design Decisions

1. **Two tables, not one**:
   - `AssetAmountEvent`: Immutable, append-only, full audit trail
   - `AssetAmountSnapshot`: Computed, updatable, for fast queries

2. **Two dates**:
   - `effectiveDate`: When the amount is effective (can be past)
   - `recordedAt`: When entered into system (always now())

3. **Event types**:
   - `CREATED`: Initial amount entry
   - `UPDATED`: Regular update (current value)
   - `CORRECTION`: Fixing an error (with originalEventId link)
   - `BACKPORT`: Historical entry for past dates

4. **Reversal support**:
   - `isReversed`: Marks event as cancelled
   - `originalEventId`: Links to event being corrected

---

## Backporting Strategy for Nisab Records

### Problem Statement
User has 10 years of nisab records in spreadsheet. Wants to migrate to zakapp.

### Solution: Backport Events

```typescript
interface BackportRequest {
  assetId: string
  entries: Array<{
    amount: number
    effectiveDate: Date  // Can be years ago
    description: string
  }>
}

async function backportHistoricalAmounts(request: BackportRequest) {
  // Create BACKPORT events for each historical entry
  for (const entry of request.entries) {
    await prisma.assetAmountEvent.create({
      data: {
        assetId: request.assetId,
        eventType: 'BACKPORT',
        amount: entry.amount,
        effectiveDate: entry.effectiveDate,
        recordedAt: new Date(),
        userId: currentUser.id,
        description: `Backported: ${entry.description}`,
        source: 'migration'
      }
    })
  }
  
  // Regenerate snapshots for affected date range
  await regenerateSnapshots(request.assetId, {
    startDate: min(request.entries.map(e => e.effectiveDate)),
    endDate: new Date()
  })
}
```

### Nisab Calculation with Historical Data

```typescript
async function calculateNisabForDate(targetDate: Date) {
  // Get all assets with their amounts effective on targetDate
  const assets = await prisma.asset.findMany({
    where: { userId, isActive: true }
  })
  
  const assetAmounts = await Promise.all(
    assets.map(async (asset) => {
      const amount = await getAssetAmountAtDate(asset.id, targetDate)
      return { ...asset, amount }
    })
  )
  
  // Calculate nisab threshold for that date
  const nisabThreshold = await calculateNisabAtDate(targetDate)
  
  // Check which assets are above nisab
  const aboveNisab = assetAmounts.filter(a => a.amount >= nisabThreshold)
  
  return {
    date: targetDate,
    assets: assetAmounts,
    nisabThreshold,
    totalWealth: sum(assetAmounts.amount),
    aboveNisabCount: aboveNisab.length
  }
}
```

---

## Migration Path (Non-Breaking)

### Phase 1: Add Tables (No Code Changes)
1. Create `AssetAmountEvent` table
2. Create `AssetAmountSnapshot` table
3. No changes to existing Asset table
4. Existing code continues to work

### Phase 2: Populate Historical Data
1. Create migration script for backporting
2. Import from spreadsheet (CSV/Excel)
3. Generate initial snapshots

### Phase 3: Update Services
1. Modify AssetService to create events on value changes
2. Update snapshot generation
3. Add query methods for historical values

### Phase 4: Frontend Integration
1. Add historical value view to asset details
2. Add backport interface for historical entries
3. Add timeline/chart visualization

---

## Audit Trail Integration

### Extend Existing AuditTrailEntry

Current: Only tracks changes to finalized NisabYearRecords
New: Also track all AssetAmountEvents

```typescript
// When creating AssetAmountEvent
async function createAssetAmountEvent(data: CreateEventDto) {
  const event = await prisma.assetAmountEvent.create({ data })
  
  // Create audit trail entry
  await prisma.auditTrailEntry.create({
    data: {
      nisabYearRecordId: null,  // Not tied to a year record
      eventType: 'ASSET_AMOUNT_CREATED',
      timestamp: new Date(),
      userId: data.userId,
      changesSummary: {
        assetId: data.assetId,
        eventType: data.eventType,
        amount: data.amount,
        effectiveDate: data.effectiveDate
      }
    }
  })
  
  return event
}
```

---

## Files to Modify

### Database Schema
- `server/prisma/schema.prisma`: Add AssetAmountEvent, AssetAmountSnapshot

### Backend Services
- `server/src/services/AssetAmountEventService.ts` (NEW)
- `server/src/services/AssetAmountSnapshotService.ts` (NEW)
- `server/src/services/AssetService.ts`: Modify update to create events
- `server/src/services/wealthAggregationService.ts`: Support historical queries

### Backend Routes
- `server/src/routes/assetAmountEvents.ts` (NEW)
- `server/src/routes/assets.ts`: Add historical endpoints

### Frontend
- `client/src/components/AssetAmountHistory.tsx` (NEW)
- `client/src/pages/AssetDetails.tsx`: Add history tab
- `client/src/pages/BackportData.tsx` (NEW): Migration interface

### Shared Types
- `shared/src/types/assetAmountEvent.ts` (NEW)
- `shared/src/types/assetAmountSnapshot.ts` (NEW)

---

## Verification Strategy

### Unit Tests
- Event creation with all event types
- Snapshot generation and regeneration
- Historical value queries
- Backport functionality
- Nisab calculation with historical data

### Integration Tests
- End-to-end backport flow
- Audit trail verification
- Performance with large datasets

### Manual Testing
- Backport 10 years of data
- Verify nisab calculations match spreadsheet
- Test audit trail completeness