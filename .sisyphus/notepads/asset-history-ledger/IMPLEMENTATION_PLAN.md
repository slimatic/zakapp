# Asset History Ledger - Implementation Plan

## Executive Summary

This plan outlines how to add historical asset tracking with audit trails to zakapp, enabling:
- Record asset amounts for any date (past or present)
- Complete audit trail of all changes
- Backport 10+ years of nisab records from spreadsheets
- Non-breaking changes to existing asset structure

**Timeline**: 4-6 weeks for core functionality
**Risk**: Low (non-breaking, incremental implementation)

---

## Problem Statement

### Current State
- `Asset.value` stores only current value
- No historical tracking of asset amounts
- Cannot enter values for past dates
- Nisab calculations only work from current data

### Desired State
- Every asset amount change is recorded with date
- Historical values can be queried for any date
- Complete audit trail of all changes
- Easy backport of historical data from spreadsheets

### Key Requirements
1. **Historical Tracking**: Record amounts for any date
2. **Audit Trail**: Immutable record of all changes
3. **Backporting**: Import 10+ years of historical data
4. **Non-Breaking**: Existing functionality unchanged
5. **Performance**: Fast queries for current values

---

## Solution Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Asset View  │  │ Backport    │  │ History Timeline        │  │
│  │ (current)   │  │ Interface   │  │ (historical)            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐   │
│  │ AssetService    │  │ AssetAmountEventService (NEW)       │   │
│  │ (unchanged)     │  │ - createEvent()                     │   │
│  │                 │  │ - getHistory()                      │   │
│  │                 │  │ - backport()                        │   │
│  └─────────────────┘  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                                │
│  ┌─────────────┐  ┌─────────────────────┐  ┌─────────────────┐  │
│  │ Asset       │  │ AssetAmountEvent    │  │ AssetAmount     │  │
│  │ (existing)  │  │ (NEW - immutable)   │  │ Snapshot (NEW)  │  │
│  │             │  │                     │  │                 │  │
│  │ - value     │  │ - assetId           │  │ - assetId       │  │
│  │ - updatedAt │  │ - amount (encrypted)│  │ - date          │  │
│  └─────────────┘  │ - effectiveDate     │  │ - amount        │  │
│                   │ - eventType         │  │ - eventCount    │  │
│                   │ - recordedAt        │  └─────────────────┘  │
│                   │ - userId            │                       │
│                   │ - audit trail       │                       │
│                   └─────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Two-Table Pattern**:
   - `AssetAmountEvent`: Immutable, append-only for audit
   - `AssetAmountSnapshot`: Computed, updatable for performance

2. **Two-Date System**:
   - `effectiveDate`: When amount is effective (can be past)
   - `recordedAt`: When entered (always now)

3. **Event Types**:
   - `CREATED`: Initial entry
   - `UPDATED`: Regular update
   - `CORRECTION`: Error fix
   - `BACKPORT`: Historical import

4. **Backward Compatibility**:
   - `Asset.value` continues to work
   - Events created on value changes
   - No data migration required

---

## Implementation Phases

### Phase 1: Database Schema (Week 1)

#### 1.1 Add New Tables

**File**: `server/prisma/schema.prisma`

```prisma
// Immutable event log for audit trail
model AssetAmountEvent {
  id String @id @default(uuid())
  assetId String
  eventType String  // CREATED, UPDATED, CORRECTION, BACKPORT
  amount Decimal
  currency String @default("USD")
  effectiveDate DateTime  // When amount is effective (can be past)
  recordedAt DateTime @default(now())  // When entered (always now)
  userId String
  description String?
  source String?  // manual, import, api
  metadata Json?
  isReversed Boolean @default(false)
  originalEventId String?
  
  asset Asset @relation(fields: [assetId], references: [id], onDelete: Cascade)
  originalEvent AssetAmountEvent? @relation("EventCorrections", fields: [originalEventId], references: [id])
  corrections AssetAmountEvent[] @relation("EventCorrections")
  
  @@index([assetId, effectiveDate])
  @@index([assetId, recordedAt])
  @@index([userId, effectiveDate])
  @@index([eventType])
  @@index([isReversed])
}

// Computed snapshots for fast queries
model AssetAmountSnapshot {
  id String @id @default(uuid())
  assetId String
  date DateTime  // Daily snapshot at midnight
  amount Decimal
  eventCount Int  // Events since last snapshot
  createdAt DateTime @default(now())
  
  asset Asset @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  @@unique([assetId, date])
  @@index([assetId])
  @@index([date])
}
```

#### 1.2 Update Audit Trail Schema

```prisma
model AuditTrailEntry {
  // ... existing fields ...
  
  // NEW: Optional link to asset amount event
  assetAmountEventId String?
  assetAmountEvent AssetAmountEvent? @relation(fields: [assetAmountEventId], references: [id])
}
```

#### 1.3 Generate Migration

```bash
cd server
npx prisma migrate dev --name add_asset_amount_history
```

**Deliverables**:
- [ ] New tables created
- [ ] Indexes optimized for common queries
- [ ] Migration script tested

---

### Phase 2: Backend Services (Week 2)

#### 2.1 AssetAmountEventService

**File**: `server/src/services/AssetAmountEventService.ts`

```typescript
interface CreateEventDto {
  assetId: string
  eventType: 'CREATED' | 'UPDATED' | 'CORRECTION' | 'BACKPORT'
  amount: number
  effectiveDate: Date
  description?: string
  source?: string
  metadata?: Record<string, unknown>
  originalEventId?: string
}

class AssetAmountEventService {
  async createEvent(userId: string, dto: CreateEventDto) {
    // Validate
    await this.validateEvent(dto)
    
    // Create event in transaction
    const event = await prisma.$transaction(async (tx) => {
      // Create the event
      const created = await tx.assetAmountEvent.create({
        data: {
          assetId: dto.assetId,
          eventType: dto.eventType,
          amount: dto.amount,
          effectiveDate: dto.effectiveDate,
          userId,
          description: dto.description,
          source: dto.source,
          metadata: dto.metadata,
          originalEventId: dto.originalEventId
        }
      })
      
      // Create audit trail entry
      await tx.auditTrailEntry.create({
        data: {
          eventType: 'ASSET_AMOUNT_EVENT_CREATED',
          timestamp: new Date(),
          userId,
          changesSummary: {
            assetId: dto.assetId,
            eventType: dto.eventType,
            amount: dto.amount,
            effectiveDate: dto.effectiveDate
          }
        }
      })
      
      return created
    })
    
    // Trigger snapshot regeneration
    await this.triggerSnapshotRegeneration(dto.assetId, dto.effectiveDate)
    
    return event
  }
  
  async getAssetHistory(assetId: string, options?: {
    startDate?: Date
    endDate?: Date
    eventType?: string
    limit?: number
  }) {
    return prisma.assetAmountEvent.findMany({
      where: {
        assetId,
        isReversed: false,
        ...(options?.startDate && { effectiveDate: { gte: options.startDate } }),
        ...(options?.endDate && { effectiveDate: { lte: options.endDate } }),
        ...(options?.eventType && { eventType: options.eventType })
      },
      orderBy: { effectiveDate: 'desc' },
      ...(options?.limit && { take: options.limit })
    })
  }
  
  async getAssetAmountAtDate(assetId: string, targetDate: Date) {
    // Get latest event effective on or before targetDate
    const event = await prisma.assetAmountEvent.findFirst({
      where: {
        assetId,
        effectiveDate: { lte: targetDate },
        isReversed: false
      },
      orderBy: { effectiveDate: 'desc' }
    })
    
    return event?.amount ?? null
  }
  
  async backportHistoricalData(userId: string, assetId: string, entries: Array<{
    amount: number
    effectiveDate: Date
    description: string
  }>) {
    const events = []
    
    for (const entry of entries) {
      const event = await this.createEvent(userId, {
        assetId,
        eventType: 'BACKPORT',
        amount: entry.amount,
        effectiveDate: entry.effectiveDate,
        description: entry.description,
        source: 'migration'
      })
      events.push(event)
    }
    
    // Regenerate snapshots for full range
    const dates = entries.map(e => e.effectiveDate)
    await this.regenerateSnapshots(assetId, {
      startDate: min(dates),
      endDate: new Date()
    })
    
    return events
  }
  
  private async triggerSnapshotRegeneration(assetId: string, date: Date) {
    // Queue async snapshot regeneration
    await snapshotJobQueue.add({
      assetId,
      date: startOfDay(date)
    })
  }
  
  private async regenerateSnapshots(assetId: string, range: DateRange) {
    // Implementation in Phase 2.2
  }
}
```

#### 2.2 AssetAmountSnapshotService

**File**: `server/src/services/AssetAmountSnapshotService.ts`

```typescript
class AssetAmountSnapshotService {
  async regenerateForDateRange(assetId: string, range: DateRange) {
    const events = await prisma.assetAmountEvent.findMany({
      where: {
        assetId,
        effectiveDate: { gte: range.startDate, lte: range.endDate },
        isReversed: false
      },
      orderBy: { effectiveDate: 'asc' }
    })
    
    // Group by date, take latest event per day
    const latestByDate = new Map<string, AssetAmountEvent>()
    for (const event of events) {
      const dateKey = startOfDay(event.effectiveDate).toISOString()
      latestByDate.set(dateKey, event)
    }
    
    // Upsert snapshots
    for (const [dateStr, event] of latestByDate) {
      await prisma.assetAmountSnapshot.upsert({
        where: {
          assetId_date: {
            assetId,
            date: new Date(dateStr)
          }
        },
        update: {
          amount: event.amount,
          eventCount: await this.countEventsForDate(assetId, new Date(dateStr))
        },
        create: {
          assetId,
          date: new Date(dateStr),
          amount: event.amount,
          eventCount: 1
        }
      })
    }
  }
  
  async getSnapshotAtDate(assetId: string, targetDate: Date) {
    const snapshot = await prisma.assetAmountSnapshot.findFirst({
      where: {
        assetId,
        date: { lte: targetDate }
      },
      orderBy: { date: 'desc' }
    })
    
    if (snapshot) return snapshot
    
    // Fall back to events if no snapshot
    const event = await prisma.assetAmountEvent.findFirst({
      where: {
        assetId,
        effectiveDate: { lte: targetDate },
        isReversed: false
      },
      orderBy: { effectiveDate: 'desc' }
    })
    
    return event ? {
      assetId,
      date: event.effectiveDate,
      amount: event.amount,
      eventCount: 1
    } : null
  }
}
```

#### 2.3 Update AssetService

**File**: `server/src/services/AssetService.ts`

```typescript
class AssetService {
  async updateAsset(userId: string, assetId: string, data: UpdateAssetDto) {
    return prisma.$transaction(async (tx) => {
      // Update asset (existing behavior)
      const asset = await tx.asset.update({
        where: { id: assetId, userId },
        data: {
          ...data,
          updatedAt: new Date()
        }
      })
      
      // NEW: Create event if value changed
      if (data.value !== undefined) {
        await tx.assetAmountEvent.create({
          data: {
            assetId,
            eventType: 'UPDATED',
            amount: data.value,
            effectiveDate: new Date(),
            userId,
            description: 'Asset value updated',
            source: 'manual'
          }
        })
      }
      
      return asset
    })
  }
}
```

#### 2.4 Add API Routes

**File**: `server/src/routes/assetAmountEvents.ts`

```typescript
import { Router } from 'express'
import { AssetAmountEventService } from '../services/AssetAmountEventService'

const router = Router()
const eventService = new AssetAmountEventService()

// Get asset history
router.get('/assets/:assetId/history', async (req, res) => {
  const { assetId } = req.params
  const { startDate, endDate, eventType, limit } = req.query
  
  const history = await eventService.getAssetHistory(assetId, {
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    eventType: eventType as string,
    limit: limit ? parseInt(limit as string) : undefined
  })
  
  res.json(history)
})

// Get amount at specific date
router.get('/assets/:assetId/amount-at', async (req, res) => {
  const { assetId } = req.params
  const { date } = req.query
  
  const amount = await eventService.getAssetAmountAtDate(
    assetId,
    new Date(date as string)
  )
  
  res.json({ amount })
})

// Backport historical data
router.post('/assets/:assetId/backport', async (req, res) => {
  const { assetId } = req.params
  const { entries } = req.body
  const userId = req.user.id
  
  const events = await eventService.backportHistoricalData(userId, assetId, entries)
  
  res.json({ events, count: events.length })
})

export default router
```

**Deliverables**:
- [ ] AssetAmountEventService with full CRUD
- [ ] AssetAmountSnapshotService with regeneration
- [ ] AssetService updated to create events
- [ ] API routes for history queries
- [ ] Unit tests for all services

---

### Phase 3: Historical Nisab Calculations (Week 3)

#### 3.1 Extend WealthAggregationService

**File**: `server/src/services/wealthAggregationService.ts`

```typescript
class WealthAggregationService {
  async calculateTotalWealthAtDate(userId: string, targetDate: Date) {
    const assets = await prisma.asset.findMany({
      where: { userId, isActive: true }
    })
    
    const assetAmounts = await Promise.all(
      assets.map(async (asset) => {
        const amount = await this.getAssetAmountAtDate(asset.id, targetDate)
        return {
          ...asset,
          amount,
          calculationModifier: asset.calculationModifier ?? 1.0
        }
      })
    )
    
    // Calculate totals
    const totalWealth = assetAmounts.reduce((sum, a) => sum + (a.amount || 0), 0)
    const totalLiabilities = 0 // TODO: Add liability tracking
    
    return {
      date: targetDate,
      totalWealth,
      totalLiabilities,
      assetBreakdown: assetAmounts,
      calculatedAt: new Date()
    }
  }
  
  private async getAssetAmountAtDate(assetId: string, targetDate: Date) {
    const snapshot = await prisma.assetAmountSnapshot.findFirst({
      where: {
        assetId,
        date: { lte: targetDate }
      },
      orderBy: { date: 'desc' }
    })
    
    if (snapshot) return snapshot.amount.toNumber()
    
    // Fall back to current asset value
    const asset = await prisma.asset.findUnique({ where: { id: assetId } })
    return asset?.value ?? 0
  }
}
```

#### 3.2 Extend NisabYearRecordService

**File**: `server/src/services/nisabYearRecordService.ts`

```typescript
class NisabYearRecordService {
  async createFromHistoricalData(userId: string, data: {
    year: number
    assetEntries: Array<{
      assetId: string
      amount: number
      date: Date
    }>
  }) {
    // Backport all asset amounts first
    const eventService = new AssetAmountEventService()
    
    for (const entry of data.assetEntries) {
      await eventService.backportHistoricalData(userId, entry.assetId, [{
        amount: entry.amount,
        effectiveDate: entry.date,
        description: `Historical entry for ${data.year}`
      }])
    }
    
    // Create nisab year record for that date
    const targetDate = new Date(data.year, 0, 1) // January 1st of year
    
    return this.createNisabYearRecord(userId, {
      calculationDate: targetDate,
      // ... other fields
    })
  }
  
  async calculateNisabForDate(userId: string, targetDate: Date) {
    const wealth = await this.wealthAggregation.calculateTotalWealthAtDate(userId, targetDate)
    const nisabThreshold = await this.nisabCalculation.calculateNisabAtDate(targetDate)
    
    return {
      date: targetDate,
      totalWealth: wealth.totalWealth,
      nisabThreshold,
      isAboveNisab: wealth.totalWealth >= nisabThreshold,
      assetBreakdown: wealth.assetBreakdown
    }
  }
}
```

**Deliverables**:
- [ ] WealthAggregationService supports historical dates
- [ ] NisabYearRecordService can create from historical data
- [ ] API endpoint for historical nisab calculation
- [ ] Unit tests for historical calculations

---

### Phase 4: Frontend (Week 4)

#### 4.1 Asset History Component

**File**: `client/src/components/AssetAmountHistory.tsx`

```typescript
interface AssetAmountHistoryProps {
  assetId: string
}

export function AssetAmountHistory({ assetId }: AssetAmountHistoryProps) {
  const [history, setHistory] = useState<AssetAmountEvent[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function loadHistory() {
      const response = await fetch(`/api/assets/${assetId}/history`)
      const data = await response.json()
      setHistory(data)
      setLoading(false)
    }
    loadHistory()
  }, [assetId])
  
  if (loading) return <LoadingSpinner />
  
  return (
    <div className="asset-history">
      <h3>Amount History</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {history.map((event) => (
            <tr key={event.id}>
              <td>{formatDate(event.effectiveDate)}</td>
              <td>{formatCurrency(event.amount)}</td>
              <td><EventTypeBadge type={event.eventType} /></td>
              <td>{event.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

#### 4.2 Backport Interface

**File**: `client/src/pages/BackportData.tsx`

```typescript
interface BackportEntry {
  date: string
  amount: number
  description: string
}

export function BackportData() {
  const [entries, setEntries] = useState<BackportEntry[]>([])
  const [assetId, setAssetId] = useState('')
  const [importing, setImporting] = useState(false)
  
  const handleImport = async () => {
    setImporting(true)
    
    const response = await fetch(`/api/assets/${assetId}/backport`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries })
    })
    
    const result = await response.json()
    setImporting(false)
    
    if (result.count > 0) {
      toast.success(`Imported ${result.count} historical entries`)
      setEntries([])
    }
  }
  
  return (
    <div className="backport-page">
      <h2>Backport Historical Data</h2>
      
      <div className="form-group">
        <label>Asset</label>
        <AssetSelect value={assetId} onChange={setAssetId} />
      </div>
      
      <div className="form-group">
        <label>CSV Import</label>
        <CSVUpload
          onUpload={(data) => setEntries(data)}
          template={['date', 'amount', 'description']}
        />
      </div>
      
      {entries.length > 0 && (
        <div className="preview">
          <h4>Preview ({entries.length} entries)</h4>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(0, 10).map((entry, i) => (
                <tr key={i}>
                  <td>{entry.date}</td>
                  <td>{entry.amount}</td>
                  <td>{entry.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length > 10 && (
            <p>...and {entries.length - 10} more</p>
          )}
        </div>
      )}
      
      <button
        onClick={handleImport}
        disabled={!assetId || entries.length === 0 || importing}
      >
        {importing ? 'Importing...' : 'Import Data'}
      </button>
    </div>
  )
}
```

#### 4.3 Historical Nisab Chart

**File**: `client/src/components/HistoricalNisabChart.tsx`

```typescript
interface HistoricalNisabChartProps {
  startDate: Date
  endDate: Date
}

export function HistoricalNisabChart({ startDate, endDate }: HistoricalNisabChartProps) {
  const [data, setData] = useState<Array<{
    date: Date
    wealth: number
    nisabThreshold: number
  }>>([])
  
  useEffect(() => {
    async function loadData() {
      const response = await fetch(
        `/api/nisab/historical?start=${startDate}&end=${endDate}`
      )
      const result = await response.json()
      setData(result.data)
    }
    loadData()
  }, [startDate, endDate])
  
  return (
    <div className="nisab-chart">
      <LineChart
        data={data}
        xKey="date"
        lines={[
          { key: 'wealth', color: 'blue', label: 'Total Wealth' },
          { key: 'nisabThreshold', color: 'red', label: 'Nisab Threshold' }
        ]}
      />
    </div>
  )
}
```

**Deliverables**:
- [ ] AssetAmountHistory component
- [ ] BackportData page with CSV import
- [ ] HistoricalNisabChart component
- [ ] Integration tests

---

### Phase 5: Testing & Polish (Week 5-6)

#### 5.1 Test Strategy

**Unit Tests**:
- AssetAmountEventService: 20+ tests
- AssetAmountSnapshotService: 15+ tests
- Historical nisab calculations: 15+ tests

**Integration Tests**:
- Backport flow: End-to-end test
- Historical queries: API integration test
- Audit trail verification: Data integrity test

**Performance Tests**:
- 100 assets × 10 years = 365,000 events
- Query performance benchmarks
- Backport performance benchmarks

#### 5.2 Documentation

**API Documentation**:
- OpenAPI spec for all endpoints
- Example requests/responses

**User Guide**:
- How to backport historical data
- How to view asset history
- How to calculate historical nisab

**Developer Guide**:
- Architecture overview
- Event schema documentation
- Snapshot regeneration logic

---

## Migration Strategy

### For Existing Users

1. **No Automatic Migration**: Existing Asset.value remains as-is
2. **Event Creation**: First value update creates initial event
3. **Gradual History**: History builds up over time

### For New Users

1. **Normal Flow**: Asset creation creates initial event
2. **Full History**: All updates tracked from day one

### Backport Process

1. User exports data from spreadsheet (CSV format)
2. User navigates to Backport page
3. User selects asset and uploads CSV
4. System validates and previews data
5. User confirms import
6. System creates events and snapshots
7. User can now query historical values

---

## Rollout Plan

### Week 1-2: Backend Only
- Deploy to staging
- Internal testing by team
- Fix bugs

### Week 3-4: Beta Users
- Deploy to production
- Select beta users (5-10)
- Gather feedback

### Week 5-6: General Availability
- Full rollout
- Documentation published
- Support ready

---

## Success Metrics

### Functional
- [ ] Backport 10 years of data successfully
- [ ] Historical nisab calculations match spreadsheet
- [ ] Audit trail complete and queryable

### Performance
- [ ] Asset history query < 100ms
- [ ] Backport 1000 entries < 30 seconds
- [ ] Snapshot regeneration < 1 minute

### Quality
- [ ] 90% test coverage
- [ ] Zero critical bugs
- [ ] Documentation complete

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Performance at scale | High | Medium | Index optimization, caching |
| Data inconsistency | High | Low | Transactional writes, reconciliation |
| User errors in backport | Medium | Medium | Validation, dry-run preview |
| Encryption key loss | High | Low | Follow existing key management |

---

## Dependencies

### External
- None (uses existing infrastructure)

### Internal
- Prisma (existing)
- Encryption utilities (existing)
- Authentication (existing)

---

## Open Questions

1. **Retention Policy**: How long to keep historical events?
2. **Encryption**: Should events be encrypted at rest?
3. **Bulk Operations**: Support batch backport of multiple assets?
4. **Export**: Need CSV/Excel export of historical data?

---

## Appendix

### A. Event Schema Reference

```typescript
interface AssetAmountEvent {
  id: string
  assetId: string
  eventType: 'CREATED' | 'UPDATED' | 'CORRECTION' | 'BACKPORT'
  amount: number
  currency: string
  effectiveDate: Date
  recordedAt: Date
  userId: string
  description?: string
  source?: string
  metadata?: Record<string, unknown>
  isReversed: boolean
  originalEventId?: string
}
```

### B. CSV Import Format

```csv
date,amount,description
2023-01-15,10000,Initial investment
2023-06-30,12500,Mid-year update
2024-01-15,15000,Annual review
```

### C. API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/assets/:id/history | Get asset amount history |
| GET | /api/assets/:id/amount-at?date= | Get amount at specific date |
| POST | /api/assets/:id/backport | Backport historical data |
| GET | /api/nisab/historical | Get historical nisab calculations |

### D. Related Files

- `server/prisma/schema.prisma`
- `server/src/services/AssetAmountEventService.ts`
- `server/src/services/AssetAmountSnapshotService.ts`
- `server/src/routes/assetAmountEvents.ts`
- `client/src/components/AssetAmountHistory.tsx`
- `client/src/pages/BackportData.tsx`