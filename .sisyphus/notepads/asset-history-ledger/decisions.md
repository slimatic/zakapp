# Architectural Decisions - Asset History Ledger

## Decision 1: Hybrid Event + Snapshot Pattern

**Status**: APPROVED

**Context**: Need historical asset tracking with audit trail, performance for queries, and backporting capability.

**Options Evaluated**:
1. Pure Event Sourcing: Complete audit but complex
2. Time-Series Snapshots (Ghostfolio): Simple but no audit
3. Hybrid (Event + Snapshot): Balances both needs ✓

**Decision**: Hybrid pattern with two tables:
- `AssetAmountEvent`: Immutable, append-only for audit
- `AssetAmountSnapshot`: Computed, updatable for performance

**Rationale**:
- Audit requirement: Every change must be traceable
- Performance: Current value queries must be fast
- Backporting: Must support historical dates
- Non-breaking: Cannot modify existing Asset table

**Impact**:
- +2 new tables in schema
- Event creation on every asset value change
- Snapshot regeneration job required

---

## Decision 2: Two-Date System

**Status**: APPROVED

**Context**: Need to support backporting historical values while maintaining audit integrity.

**Options Evaluated**:
1. Single date (recordedAt): Cannot backport
2. Single date (effectiveDate): Cannot audit when entered
3. Two dates (effectiveDate + recordedAt): ✓

**Decision**: Two separate date fields:
- `effectiveDate`: When the amount is effective (can be past)
- `recordedAt`: When entered into system (always auto-set)

**Rationale**:
- Backporting: User can enter amounts for any past date
- Audit: Can distinguish historical entry from current entry
- Nisab: Can calculate wealth for any date in past

**Example**:
```
Today: March 1, 2026
User enters: $10,000 for January 15, 2023 (from spreadsheet)

AssetAmountEvent {
  effectiveDate: 2023-01-15
  recordedAt: 2026-03-01 (auto)
  amount: 10000
}
```

---

## Decision 3: Event Types Enum

**Status**: APPROVED

**Context**: Need to categorize different kinds of amount changes for audit and queries.

**Options Evaluated**:
1. Single UPDATE type: Loses context
2. Multiple types without structure: Hard to query
3. Typed events with reversal support: ✓

**Decision**: Four event types:
- `CREATED`: Initial amount entry
- `UPDATED`: Regular value update
- `CORRECTION`: Fixing an error (requires originalEventId)
- `BACKPORT`: Historical entry from migration

**Rationale**:
- `CREATED`: First entry for an asset
- `UPDATED`: Normal day-to-day changes
- `CORRECTION`: Mistakes happen, need to fix without deleting
- `BACKPORT`: Explicit type for migrations

**Reversal Pattern**:
```typescript
// User realizes they entered $1000 instead of $10000
const originalEvent = await getEvent(originalId)

// Create reversal event
await createEvent({
  eventType: 'CORRECTION',
  amount: 9000,  // The difference
  originalEventId: originalEvent.id,
  description: 'Fixed entry error: $1000 → $10000'
})

// Mark original as reversed
await updateEvent(originalEvent.id, { isReversed: true })
```

---

## Decision 4: Snapshot Strategy

**Status**: APPROVED (with review)

**Context**: Need fast queries for current values while maintaining event history.

**Options Evaluated**:
1. No snapshots: Query all events every time (slow)
2. Real-time snapshots: Update on every event (complex)
3. Batch snapshots: Nightly regeneration (simpler) ✓

**Decision**: Batch snapshots with manual regeneration trigger

**Implementation**:
- Nightly job generates daily snapshots
- Manual trigger on backport operations
- `eventCount` field tracks staleness

**Rationale**:
- Performance: Most queries need current value
- Simplicity: Batch processing is easier than real-time
- Correctness: Can regenerate from events if corrupted

**Snapshot Regeneration**:
```typescript
async function regenerateSnapshots(assetId: string, dateRange: DateRange) {
  const events = await getEventsInRange(assetId, dateRange)
  
  // Group by date
  const eventsByDate = groupBy(events, e => e.effectiveDate)
  
  for (const [date, dayEvents] of Object.entries(eventsByDate)) {
    const latestEvent = dayEvents.sort((a, b) => b.recordedAt - a.recordedAt)[0]
    
    await upsertSnapshot({
      assetId,
      date,
      amount: latestEvent.amount,
      eventCount: dayEvents.length
    })
  }
}
```

---

## Decision 5: Encryption Strategy

**Status**: PENDING REVIEW

**Context**: Sensitive financial data should be encrypted at rest.

**Options Evaluated**:
1. No encryption: Simpler but less secure
2. Full encryption: More secure but complex
3. Selective encryption: Balance security and complexity ✓

**Decision**: Encrypt sensitive fields in events

**Fields to Encrypt**:
- `amount`: Always encrypt
- `description`: Encrypt if contains sensitive info
- `metadata`: Always encrypt

**Fields to Keep Plaintext**:
- `assetId`: Needed for queries
- `effectiveDate`: Needed for time-series queries
- `eventType`: Needed for filtering
- `userId`: Needed for access control

**Implementation**:
```typescript
async function createEvent(data: CreateEventDto) {
  const encrypted = encrypt({
    amount: data.amount,
    description: data.description,
    metadata: data.metadata
  })
  
  return prisma.assetAmountEvent.create({
    data: {
      ...data,
      amount: encrypted.amount,
      description: encrypted.description,
      metadata: encrypted.metadata
    }
  })
}
```

**Open Question**: Should snapshots also be encrypted?

---

## Decision 6: Backward Compatibility

**Status**: APPROVED

**Context**: Existing Asset table must continue working without changes.

**Options Evaluated**:
1. Modify Asset.value: Breaking change
2. Duplicate data: Data inconsistency risk
3. Event-driven sync: ✓

**Decision**: Keep Asset.value as "current value" with event-driven sync

**Implementation**:
```typescript
async function updateAssetValue(assetId: string, newValue: number) {
  // Update current value (for backward compatibility)
  await prisma.asset.update({
    where: { id: assetId },
    data: { value: newValue }
  })
  
  // Create event (for historical tracking)
  await createAssetAmountEvent({
    assetId,
    eventType: 'UPDATED',
    amount: newValue,
    effectiveDate: new Date()
  })
}
```

**Rationale**:
- Existing queries continue to work
- New features get historical data
- No data migration required
- Can eventually deprecate Asset.value if desired

---

## Decision 7: Nisab Integration

**Status**: APPROVED

**Context**: Historical asset values must work with nisab calculations.

**Options Evaluated**:
1. Separate historical nisab: Complex, duplicated logic
2. Recalculate from events: Single source of truth ✓
3. Snapshot-based: Faster but potentially stale

**Decision**: Calculate nisab from events on-demand

**Implementation**:
```typescript
async function calculateNisabAtDate(targetDate: Date) {
  // Get all asset amounts effective on targetDate
  const assetAmounts = await getAssetAmountsAtDate(targetDate)
  
  // Calculate total wealth
  const totalWealth = assetAmounts.reduce((sum, a) => sum + a.amount, 0)
  
  // Get nisab threshold for that date
  const nisabThreshold = await getNisabThresholdAtDate(targetDate)
  
  return {
    totalWealth,
    nisabThreshold,
    isAboveNisab: totalWealth >= nisabThreshold,
    calculationDate: targetDate
  }
}
```

**Rationale**:
- Single source of truth (events)
- Always accurate (no stale snapshots)
- Supports any date in past or future

---

## Decision 8: Audit Trail Integration

**Status**: APPROVED

**Context**: Asset amount changes must be auditable alongside existing nisab audits.

**Options Evaluated**:
1. Separate audit table: Duplication
2. Extend existing AuditTrailEntry: ✓
3. No audit for assets: Security gap

**Decision**: Extend AuditTrailEntry with optional asset reference

**Schema Addition**:
```prisma
model AuditTrailEntry {
  // ... existing fields ...
  
  // NEW: Optional link to asset amount event
  assetAmountEventId String?
  assetAmountEvent AssetAmountEvent? @relation(fields: [assetAmountEventId], references: [id])
}
```

**Rationale**:
- Unified audit trail
- Can query all changes by user, date, or type
- Existing functionality preserved

---

## Open Decisions (Needs Discussion)

### 1. Snapshot Retention Policy
- Keep all snapshots? Storage cost
- Keep last N years? Data loss
- Keep daily/monthly/yearly? Complexity

### 2. Event Retention Policy
- Keep all events? Storage growth
- Archive old events? Complexity
- Compress events? Implementation cost

### 3. Performance Thresholds
- When to regenerate snapshots?
- Batch size for backport?
- Index optimization?

### 4. Frontend UX
- How to display historical values?
- Backport interface design?
- Chart visualization?