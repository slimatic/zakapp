# Feature 004: Enhanced Zakat Calculation Engine - Implementation Plan

## Overview

Complete the Zakat Calculation Engine (Milestone 4) by implementing multi-methodology support, calendar system integration, enhanced UI, and calculation history tracking.

**Status**: 🔄 IN PROGRESS (0% complete)  
**Priority**: HIGH  
**Milestone**: 4 - Zakat Calculation Engine  
**Dependencies**: Feature 003 (Tracking & Analytics) ✅ COMPLETE

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **ORM**: Prisma 6.16.2
- **Database**: SQLite with AES-256-CBC encryption
- **Authentication**: JWT with file-based + Prisma dual system
- **New Dependencies**:
  - `hijri-converter` - Islamic calendar conversion library

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **New Dependencies**:
  - `hijri-converter` - Islamic calendar conversion (client-side)
  - `recharts` (optional) - Chart library for trend visualization

### Testing
- **Unit/Integration**: Jest + Supertest
- **E2E**: Playwright
- **Coverage Target**: 95%+

## Architecture

### Directory Structure

```
server/
├── services/
│   ├── CalendarService.js          # NEW: Calendar conversion utilities
│   └── ZakatCalculationService.js  # ENHANCE: Add multi-methodology support
├── routes/
│   ├── calendar.js                 # NEW: Calendar conversion endpoints
│   └── calculations.js             # NEW: Calculation history endpoints
└── prisma/
    └── schema.prisma               # UPDATE: Add calculation history model

client/
├── src/
│   ├── components/
│   │   ├── zakat/
│   │   │   ├── MethodologySelector.tsx      # NEW: Methodology chooser
│   │   │   ├── EnhancedZakatCalculator.tsx  # NEW: Enhanced calculator UI
│   │   │   ├── CalculationHistory.tsx       # NEW: History display
│   │   │   └── NisabIndicator.tsx           # NEW: Visual nisab indicator
│   │   └── ui/
│   │       └── CalendarSelector.tsx         # NEW: Calendar picker component
│   ├── api/
│   │   ├── calendar.ts             # NEW: Calendar API client
│   │   └── calculations.ts         # NEW: Calculations API client
│   └── types/
│       └── zakat.ts                # UPDATE: Add methodology types
```

### Data Model

#### New Models

**CalculationHistory**
```prisma
model CalculationHistory {
  id                String   @id @default(uuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  methodology       String   // 'standard', 'hanafi', 'shafi', 'custom'
  calendarType      String   // 'hijri', 'gregorian'
  calculationDate   DateTime @default(now())
  
  totalWealth       Float
  nisabThreshold    Float
  zakatDue          Float
  zakatRate         Float    @default(2.5)
  
  // Asset breakdown (encrypted JSON)
  assetBreakdown    String   // Encrypted JSON of asset categories
  
  // Metadata
  notes             String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([userId, calculationDate])
  @@map("calculation_history")
}
```

**User Settings Update**
```prisma
model User {
  // ... existing fields ...
  
  // NEW: Zakat preferences
  preferredCalendar     String? @default("gregorian") // 'hijri' or 'gregorian'
  preferredMethodology  String? @default("standard")  // 'standard', 'hanafi', 'shafi', 'custom'
  lastZakatDate         DateTime?
  
  calculationHistory    CalculationHistory[]
}
```

### API Endpoints

#### Calendar Endpoints
- `POST /api/calendar/convert` - Convert between Hijri and Gregorian
- `GET /api/calendar/next-zakat-date` - Calculate next Zakat due date
- `GET /api/calendar/current-hijri` - Get current Hijri date

#### Calculation History Endpoints
- `GET /api/calculations` - List user's calculation history (paginated)
- `GET /api/calculations/:id` - Get specific calculation details
- `POST /api/calculations` - Save a new calculation
- `POST /api/calculations/compare` - Compare multiple methodologies
- `GET /api/calculations/trends` - Get calculation trends over time
- `DELETE /api/calculations/:id` - Delete a calculation from history

#### User Settings Endpoints (Update)
- `PATCH /api/users/settings` - Update calendar/methodology preferences

## Implementation Phases

### Phase 1: Calendar System (10h / 1.5 days)
**Goal**: Implement Islamic lunar calendar support

**Services**:
- `CalendarService.js` - Date conversion utilities

**API Routes**:
- `calendar.js` - Calendar conversion endpoints

**Frontend Components**:
- `CalendarSelector.tsx` - Calendar picker component

**Database Changes**:
- Add `preferredCalendar` to User model

### Phase 2: Methodology Selection UI (21h / 3 days)
**Goal**: Create educational methodology selection interface

**Frontend Components**:
- `MethodologySelector.tsx` - Main methodology chooser
- Methodology comparison view
- Educational content modals

**Services**:
- Enhance `ZakatCalculationService.js` with multi-methodology support

**Database Changes**:
- Add `preferredMethodology` to User model

### Phase 3: Enhanced Calculation Display (19h / 2.5 days)
**Goal**: Visual calculation breakdown with educational content

**Frontend Components**:
- `EnhancedZakatCalculator.tsx` - Enhanced calculator UI
- `NisabIndicator.tsx` - Visual nisab threshold indicator
- Educational tooltips system

**Services**:
- Method-specific calculation logic

### Phase 4: Calculation History (20.5h / 3 days)
**Goal**: Store and display historical calculations

**Data Model**:
- `CalculationHistory` model

**API Routes**:
- `calculations.js` - History CRUD endpoints

**Frontend Components**:
- `CalculationHistory.tsx` - History list and detail view
- Trend visualization
- Export functionality

**Services**:
- Calculation storage in `ZakatCalculationService.js`

### Phase 5: Testing & Documentation (14h / 2 days)
**Goal**: Comprehensive testing and documentation

**Testing**:
- Unit tests for calendar conversions
- Integration tests for API endpoints
- E2E tests for user flows
- Accessibility audit

**Documentation**:
- User guide for methodology selection
- API documentation
- Developer integration guide

## Islamic Methodologies

### 1. Standard (AAOIFI)
- **Nisab**: 85g gold (~$5,000 USD)
- **Rate**: 2.5%
- **Assets**: All zakatable wealth
- **Source**: Modern Islamic financial standards

### 2. Hanafi
- **Nisab**: 595g silver OR 85g gold (whichever is LOWER)
- **Rate**: 2.5%
- **Assets**: Traditional categorization
- **Source**: Hanafi madhab jurisprudence

### 3. Shafi'i
- **Nisab**: 85g gold
- **Rate**: 2.5%
- **Assets**: Detailed categorization with specific business rules
- **Source**: Shafi'i madhab jurisprudence

### 4. Custom
- **Nisab**: User-defined
- **Rate**: User-defined (typically 2.5%)
- **Assets**: User-defined rules
- **Source**: Local scholar guidance

## Security Considerations

1. **Encryption**: All calculation history data encrypted using AES-256-CBC
2. **Validation**: Server-side validation of all methodology parameters
3. **Audit Trail**: All calculations logged with timestamps
4. **Privacy**: User preferences and history private and encrypted

## Performance Targets

- Calendar conversion: < 50ms
- Zakat calculation (any methodology): < 200ms
- Calculation history load (100 records): < 500ms
- Methodology comparison: < 300ms
- History trend visualization: < 400ms

## Accessibility Requirements

- WCAG 2.1 AA compliance
- Keyboard navigation for all interactive elements
- Screen reader support
- Color contrast ratios 4.5:1 minimum
- Focus indicators on all interactive elements

## Testing Strategy

### Unit Tests
- Calendar conversion accuracy
- Methodology calculation logic
- Nisab threshold calculations
- History storage and retrieval

### Integration Tests
- Calendar API endpoints
- Calculation history API endpoints
- User preference updates
- Methodology switching

### E2E Tests
- Complete calculation flow with each methodology
- Calendar preference persistence
- Calculation history viewing
- Methodology comparison

### Performance Tests
- Calendar conversion speed
- Calculation speed across methodologies
- History loading with large datasets
- Concurrent user calculations

## Success Criteria

**Functional**:
- ✅ Accurate Hijri ↔ Gregorian conversion
- ✅ All 4 methodologies implemented and accurate
- ✅ Calculation history stored and retrievable
- ✅ Methodology comparison working
- ✅ Educational content for all methods

**Technical**:
- ✅ All performance targets met
- ✅ 95%+ test coverage
- ✅ WCAG 2.1 AA compliant
- ✅ All data encrypted

**User Experience**:
- ✅ Methodology selection < 2 minutes
- ✅ Calculation understanding > 90%
- ✅ Educational content helpful > 85%
- ✅ Interface intuitive > 90%

## Documentation Deliverables

1. **User Documentation**:
   - Methodology selection guide
   - Calendar system explanation
   - How to read calculation breakdown
   - Understanding calculation history

2. **API Documentation**:
   - Calendar endpoints
   - Calculation history endpoints
   - Request/response examples

3. **Developer Documentation**:
   - CalendarService integration
   - Adding new methodologies
   - Extending calculation history
   - Testing guidelines

## Rollout Plan

1. **Development** (Week 1-2): Implement all phases
2. **Testing** (Week 2): Execute test plan
3. **Documentation** (Week 2): Complete all docs
4. **Review** (Week 2): Code review and QA
5. **Staging** (Week 3): Deploy to staging environment
6. **Production** (Week 3): Production deployment

## Risk Mitigation

**Risk**: Islamic methodology accuracy
- **Mitigation**: Cite authoritative sources, add disclaimer to consult scholars
- **Action**: Cross-reference calculations with multiple sources

**Risk**: Calendar conversion edge cases
- **Mitigation**: Use established `hijri-converter` library
- **Action**: Test month/year boundaries extensively

**Risk**: UI complexity
- **Mitigation**: Iterative design, start simple
- **Action**: Use existing UI patterns from Feature 003

**Risk**: Timeline slippage
- **Mitigation**: Built-in buffer time
- **Action**: Daily progress tracking
