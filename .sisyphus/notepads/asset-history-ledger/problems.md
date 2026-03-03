# Unresolved Issues & Technical Debt

## High Priority

### 1. Data Consistency Between Asset.value and Events

**Problem**: Asset.value is updated directly, but events are created separately. If one fails, data becomes inconsistent.

**Scenario**:
```typescript
// If update succeeds but event creation fails:
await prisma.asset.update({ ... })  // Success
await createAssetAmountEvent(...)   // Fails (network error)

// Result: Asset.value = $1000, but no event exists
```

**Impact**: Historical data incomplete, audit trail broken

**Potential Solutions**:
1. **Transaction**: Wrap both in single transaction
   ```typescript
   await prisma.$transaction([
     prisma.asset.update(...),
     prisma.assetAmountEvent.create(...)
   ])
   ```
   - Pro: Atomic operation
   - Con: Longer transactions, potential deadlocks

2. **Event-First**: Create event first, then update Asset.value from event
   ```typescript
   const event = await createEvent(...)
   await updateAssetFromEvent(event.assetId, event.amount)
   ```
   - Pro: Events are source of truth
   - Con: Requires refactoring update flow

3. **Reconciliation Job**: Periodic job to detect and fix inconsistencies
   ```typescript
   async function reconcile() {
     const assets = await prisma.asset.findMany()
     for (const asset of assets) {
       const latestEvent = await getLatestEvent(asset.id)
       if (latestEvent.amount !== asset.value) {
         await logDiscrepancy(asset.id)
       }
     }
   }
   ```
   - Pro: Detects issues
   - Con: Doesn't prevent them

**Recommended**: Option 1 (Transaction) for initial implementation, consider Option 2 (Event-First) for v2.

---

### 2. Snapshot Staleness

**Problem**: Snapshots may become stale if regeneration fails or is delayed.

**Scenario**:
- User backports 10 years of data
- Snapshot regeneration fails partway through
- Some dates have no snapshots
- Queries return incomplete data

**Impact**: Charts incomplete, historical queries slow

**Potential Solutions**:
1. **Eventual Consistency**: Accept stale snapshots, rebuild on query if needed
   ```typescript
   async function getAssetAmountAtDate(assetId, targetDate) {
     const snapshot = await getSnapshot(assetId, targetDate)
     if (snapshot && isFresh(snapshot)) {
       return snapshot.amount
     }
     // Fall back to events
     return calculateFromEvents(assetId, targetDate)
   }
   ```
   - Pro: Always returns data
   - Con: Query performance unpredictable

2. **Immediate Regeneration**: Trigger sync regeneration on backport
   ```typescript
   async function backport(data) {
     await createEvents(data)
     await regenerateSnapshotsSync(data.assetId, data.dateRange)
   }
   ```
   - Pro: Snapshots always fresh
   - Con: Long-running backport operations

3. **Versioned Snapshots**: Track snapshot version, async regeneration
   ```typescript
   model AssetAmountSnapshot {
     version Int
     isStale Boolean @default(false)
   }
   ```
   - Pro: Clear staleness state
   - Con: Complex invalidation logic

**Recommended**: Option 2 (Immediate) for critical paths, Option 1 (Fallback) for resilience.

---

### 3. Performance at Scale

**Problem**: Querying historical values across many assets and dates may be slow.

**Scenario**:
- User has 100 assets
- 10 years of daily data = 365,000 events
- Query: "Show my wealth over 10 years"
- Must aggregate 365,000 rows

**Impact**: Poor user experience, timeouts

**Potential Solutions**:
1. **Pre-aggregated Views**: Materialized views for common queries
   ```sql
   CREATE MATERIALIZED VIEW daily_wealth AS
   SELECT
     date,
     SUM(amount) as total_wealth
   FROM asset_amount_events
   GROUP BY date
   ```
   - Pro: Fast queries
   - Con: Storage cost, maintenance complexity

2. **Time-Series Database**: Use TimescaleDB or InfluxDB for events
   - Pro: Optimized for time-series
   - Con: Additional infrastructure

3. **Caching Layer**: Redis cache for common queries
   ```typescript
   async function getWealthTimeSeries(userId, dateRange) {
     const cacheKey = `wealth:${userId}:${dateRange}`
     const cached = await redis.get(cacheKey)
     if (cached) return cached
     
     const result = await calculateWealth(userId, dateRange)
     await redis.set(cacheKey, result, '1h')
     return result
   }
   ```
   - Pro: Fast for repeated queries
   - Con: Cache invalidation complexity

4. **Query Optimization**: Proper indexes, query limits
   ```typescript
   // Use covering indexes
   @@index([assetId, effectiveDate, amount])
   
   // Limit date range
   @@index([userId, effectiveDate])
   ```
   - Pro: Low implementation cost
   - Con: Limited scalability

**Recommended**: Start with Option 4 (Optimization), add Option 3 (Caching) if needed.

---

### 4. Backport Data Validation

**Problem**: Backported data may contain errors, duplicates, or inconsistencies.

**Scenario**:
- User imports spreadsheet with:
  - Duplicate entries for same date
  - Typos in amounts
  - Missing data
  - Out-of-order entries

**Impact**: Incorrect historical records, audit trail polluted

**Potential Solutions**:
1. **Validation Pipeline**: Validate before import
   ```typescript
   async function validateBackportData(data: BackportData) {
     const errors: ValidationError[] = []
     
     // Check for duplicates
     const byDate = groupBy(data.entries, e => e.date)
     for (const [date, entries] of Object.entries(byDate)) {
       if (entries.length > 1) {
         errors.push({ date, message: 'Duplicate entries' })
       }
     }
     
     // Check for reasonable amounts
     for (const entry of data.entries) {
       if (entry.amount < 0) {
         errors.push({ date: entry.date, message: 'Negative amount' })
       }
       if (entry.amount > MAX_REASONABLE_AMOUNT) {
         errors.push({ date: entry.date, message: 'Unreasonably large amount' })
       }
     }
     
     return errors
   }
   ```
   - Pro: Catches errors early
   - Con: May block legitimate data

2. **Dry Run Mode**: Preview import without committing
   ```typescript
   async function dryRunBackport(data: BackportData) {
     const preview = await simulateImport(data)
     return {
       events: preview.length,
       totalAmount: preview.reduce((s, e) => s + e.amount, 0),
       warnings: detectAnomalies(preview)
     }
   }
   ```
   - Pro: User can review before committing
   - Con: Additional UI complexity

3. **Quarantine Area**: Import to staging, review before production
   ```typescript
   async function importToQuarantine(data: BackportData) {
     const quarantineId = await createQuarantine(data)
     return { quarantineId, preview: await getQuarantinePreview(quarantineId) }
   }
   ```
   - Pro: Safe, reviewable
   - Con: Complex workflow

**Recommended**: Option 1 (Validation) + Option 2 (Dry Run) for UX.

---

## Medium Priority

### 5. Encryption Key Management

**Problem**: Encrypted event data needs key management strategy.

**Questions**:
- Where to store encryption keys?
- How to rotate keys?
- What happens if key is lost?
- How to handle multiple users?

**Current State**: Zakapp uses envelope encryption for sensitive data.

**Implications**:
- Events with encrypted amounts need key per user or global key
- Key rotation requires re-encryption of all events
- Backport import needs access to encryption keys

**Recommended**: Follow existing encryption pattern in Zakapp.

---

### 6. Access Control

**Problem**: Asset amount events contain sensitive financial data.

**Requirements**:
- User can only see their own events
- Admin access for support/debugging
- Audit logs for access

**Current State**: Zakapp has user-based access control.

**Implications**:
- Events table needs userId foreign key
- All queries must filter by userId
- Audit trail must log access

**Recommended**: Extend existing access control patterns.

---

### 7. Event Versioning

**Problem**: Event schema may need to change over time.

**Scenarios**:
- Add new field to events
- Change encryption format
- Split event types

**Current State**: No event versioning in Zakapp.

**Implications**:
- Old events must remain readable
- Migration strategy needed
- Backward compatibility required

**Recommended**: Use Prisma migrations with backward compatibility.

---

### 8. Testing Strategy

**Problem**: Historical data requires complex test scenarios.

**Test Cases**:
- Backport 10 years of data
- Query historical values at any date
- Verify audit trail completeness
- Test performance at scale

**Current State**: Zakapp has unit and integration tests.

**Implications**:
- Need test data generation for historical events
- Need performance benchmarks
- Need integration tests for backport flow

**Recommended**: Create test utilities for historical data generation.

---

## Low Priority

### 9. Data Export

**Problem**: Users may want to export their historical data.

**Requirements**:
- Export to CSV/Excel
- Export for tax purposes
- Migration to other systems

**Implications**:
- Need export functionality
- Need to handle encrypted data
- Need to format for readability

---

### 10. Data Cleanup

**Problem**: Old events may accumulate indefinitely.

**Requirements**:
- Archive old events
- Compress historical data
- Handle storage limits

**Implications**:
- Need retention policy
- Need archival strategy
- Need to preserve audit trail

---

### 11. Multi-Currency Support

**Problem**: Historical amounts in different currencies.

**Current State**: Asset.value has currency field.

**Implications**:
- Events need currency field
- Historical queries need conversion
- Nisab calculation needs consistent currency

---

### 12. Bulk Operations

**Problem**: Backporting many assets at once.

**Requirements**:
- Batch import
- Progress tracking
- Error handling

**Implications**:
- Need bulk API endpoints
- Need progress UI
- Need rollback capability

---

## Technical Debt Items

### A. Missing Indexes

**Current**: No indexes on event queries.

**Needed**:
```prisma
@@index([assetId, effectiveDate])
@@index([userId, effectiveDate])
@@index([eventType, recordedAt])
```

### B. Missing Tests

**Current**: No tests for historical queries.

**Needed**:
- Event creation tests
- Snapshot generation tests
- Historical query tests
- Backport flow tests

### C. Missing Documentation

**Current**: No documentation for historical tracking.

**Needed**:
- API documentation
- Backport guide
- Troubleshooting guide

---

## Questions for Stakeholders

1. **Retention Policy**: How long to keep historical data?
2. **Encryption**: Should all event data be encrypted?
3. **Performance**: What are acceptable query times?
4. **UX**: What backport interface is preferred?
5. **Scope**: Is this only for assets, or also for other entities?