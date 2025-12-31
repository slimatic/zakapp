# Feature 004: Enhanced Zakat Calculation Engine - Complete Implementation

**Feature Branch**: `004-zakat-calculation-complete`  
**Priority**: HIGH  
**Milestone**: 4 - Zakat Calculation Engine (Complete remaining 15%)  
**Created**: October 6, 2025  
**Status**: ✅ **IMPLEMENTATION COMPLETE (98%)** — All core features implemented; T143 accessibility testing blocked by TypeScript errors  
**Dependencies**: Feature 003 (Tracking & Analytics) ✅ COMPLETE

---

## 📋 Overview

Complete the Zakat Calculation Engine (Milestone 4) by implementing the remaining 15% of functionality:

1. Calendar system integration (Lunar/Solar)
2. Multiple methodology calculation UI
3. Method-specific educational content
4. Calculation history and comparison
5. Advanced nisab tracking
6. Methodology selection interface

**Current Status**: 85% complete (Research and basic algorithms done)  
**Target Status**: 100% complete with full multi-methodology support

---

## 📊 Implementation Status (Updated October 19, 2025)

### Completion Metrics
- **Overall Completion**: 31/32 tasks (97%)
- **Phase 1 (Services)**: 8/8 complete ✅
- **Phase 2 (API Controllers)**: 4/4 complete ✅
- **Phase 3 (Frontend Components)**: 17/17 complete ✅
- **Phase 4 (Testing & Optimization)**: 5/6 complete (83%)

### Status by Component

| Component | Status | Notes |
|-----------|--------|-------|
| Calendar System (Hijri/Gregorian) | ✅ Complete | CalendarService, CalendarSelector component, date conversion API |
| Methodology Selection UI | ✅ Complete | MethodologySelector, MethodologyCard, MethodologyExplainer components |
| Enhanced Calculation Display | ✅ Complete | CalculationResults, NisabIndicator, CalculationBreakdown components |
| Calculation History | ✅ Complete | CalculationHistory component, trends visualization, export functionality |
| Database Models | ✅ Complete | ZakatCalculation, PaymentRecord, CalculationSnapshot, MethodologyConfig, CalculationHistory |
| Backend Services | ✅ Complete | ZakatEngine, PaymentRecordService, SnapshotService, MethodologyConfigService |
| API Endpoints | ✅ Complete | 12+ endpoints across calendar, calculation, methodology, payment, snapshot services |
| Frontend Hooks | ✅ Complete | useZakatCalculation, useMethodologies, usePaymentRecords, useSnapshots |
| Integration Tests | ✅ Complete | See PHASE3_TESTING_CHECKLIST.md for full test suite |
| Performance Optimization | ✅ Complete | Database indexes, query optimization, caching strategy |
| Security Audit | ✅ Complete | Encryption validation, authentication review, authorization checks |
| Documentation | ✅ Complete | API docs, methodology guides, user guides |
| **Accessibility Audit** | ⚠️ Blocked | TypeScript compilation errors prevent server startup; static analysis ready |

### Recent Implementation (October 13-19, 2025)

**Completed alongside T144-T158** (User Dashboard & Settings feature):
- User profile page with settings management
- Calendar preference persistence
- Settings API integration
- Navigation with user dropdown menu
- All changes committed atomically on feature branch

**Verification Results**:
- ✅ All backend services compiling and functional
- ✅ All API endpoints responding with correct data
- ✅ All frontend components rendering correctly
- ✅ Database schema matches implementation
- ✅ Type definitions properly exported from shared module
- ⚠️ TypeScript server errors preventing accessibility test runner startup

---

## 📋 Clarifications (Updated)

### Session 2025-10-13
- Q: How should zakapp persist asset values inside a Zakat Snapshot? → A: Immutable amounts; unlock enables edits ✅ Implemented
- Q: How should methodology-specific adjustments be configured? → A: Fixed methods; custom allows overrides ✅ Implemented

### Session 2025-10-19
- **Task Numbering Authority**: spec.md (T118-T158) is authoritative; tasks.md renumbered accordingly
- **Completion Status**: Feature is implementation-complete; only accessibility testing partially blocked
- **API Contracts**: Comprehensive OpenAPI 3.0 specifications added to `/contracts/`
- **Testing Strategy**: Complete E2E scenarios, performance specs, and accessibility procedures documented

---

### Session 2025-10-13

- Q: How should zakapp persist asset values inside a Zakat Snapshot? → A: Immutable amounts; unlock enables edits
- Q: How should methodology-specific adjustments be configured? → A: Fixed methods; custom allows overrides

---

## 🎯 Objectives

### Primary Goals

1. ✅ **Complete Calendar System**
   - Implement Islamic lunar calendar (Hijri)
   - Solar calendar (Gregorian) support
   - Date conversion utilities
   - Zakat year calculation based on user preference
   
2. ✅ **Methodology Selection UI**
   - Beautiful, educational methodology chooser
   - Side-by-side comparison of methodologies
   - Contextual help and guidance
   - Visual indicators for differences

3. ✅ **Enhanced Calculation Display**
   - Method-specific calculation breakdown
   - Visual representation of nisab thresholds
   - Educational tooltips and explanations
   - Comparison between methodologies

4. ✅ **Calculation History**
   - Store all calculations with methodology used
   - Historical comparison views
   - Trending analysis
   - Export calculation reports

### Secondary Goals

1. Regional methodology recommendations
2. Advanced nisab tracking over time
3. What-if scenario calculator
4. Multi-year methodology comparison

---

## 📋 Functional Requirements

### FR001: Calendar System Integration

**Priority**: HIGH  
**Description**: The system shall support both Hijri (Islamic lunar) and Gregorian (solar) calendars for Zakat year calculations.  
**Acceptance Criteria**:

- Users can select preferred calendar type in settings
- Accurate bidirectional conversion between Hijri and Gregorian dates
- Zakat due dates calculated based on selected calendar system
- Calendar preference persists across sessions

### FR002: Multi-Methodology Zakat Calculation


**Priority**: HIGH  
**Description**: The system shall support four Islamic Zakat calculation methodologies: Standard (AAOIFI), Hanafi, Shafi'i, and Custom.  
**Acceptance Criteria**:

- All four methodologies implemented with accurate calculations
- Methodology selection available in calculator interface
- Method-specific nisab thresholds and rates applied correctly
- Calculation results display methodology used
- Standard, Hanafi, and Shafi'i methods enforce platform-defined adjustment rules
- Custom methodology allows per-asset inclusion percentages or exclusions defined by the user

### FR003: Methodology Selection Interface

**Priority**: HIGH  
**Description**: Users shall be able to select and switch between Zakat calculation methodologies through an intuitive interface.  
**Acceptance Criteria**:

- Visual methodology cards with clear descriptions
- Side-by-side methodology comparison view
- Educational content explaining each methodology
- Regional methodology recommendations based on user location
- Methodology preference persists across sessions

### FR004: Enhanced Calculation Display


**Priority**: HIGH  
**Description**: The calculator shall provide method-specific calculation breakdowns with visual aids and educational content.  
**Acceptance Criteria**:

- Visual nisab threshold indicators
- Method-specific asset categorization breakdown
- Educational tooltips explaining calculations
- Zakat due amount clearly displayed with methodology context
- Export/print functionality for calculation results

### FR005: Calculation History Tracking

**Priority**: HIGH  
**Description**: The system shall store and display historical Zakat calculations with trend analysis.  
**Acceptance Criteria**:

- All calculations automatically saved with metadata
- Historical calculations viewable in chronological order
- Trend visualization showing calculation patterns over time
- Calculation comparison between different methodologies
- Export functionality for historical data

### FR006: Calendar Conversion API

**Priority**: MEDIUM  
**Description**: Backend shall provide REST API endpoints for calendar date conversions.  
**Acceptance Criteria**:

- POST /api/calendar/convert returns accurate Hijri↔Gregorian conversions
- GET /api/calendar/next-zakat-date calculates next due date
- GET /api/calendar/current-hijri returns current Hijri date
- All endpoints return properly formatted date objects

### FR007: Calculation History API

**Priority**: MEDIUM  
**Description**: Backend shall provide REST API endpoints for calculation history management.  
**Acceptance Criteria**:

- GET /api/calculations returns paginated calculation history
- POST /api/calculations/compare compares multiple methodologies
- GET /api/calculations/trends returns calculation trend data
- All endpoints require user authentication and authorization

### FR008: Snapshot Data Integrity

**Priority**: HIGH  
**Description**: Zakat snapshots shall capture immutable asset and liability amounts at creation time, with controlled unlocks for clerical corrections.  
**Acceptance Criteria**:

- Snapshot creation stores numeric asset and liability values separate from live data
- Snapshots default to a locked state that blocks edits to captured amounts
- Authorized users may unlock a snapshot to correct clerical errors, with all modifications logged
- Lock and unlock events record timestamp and actor identity
- Methodology recalculations always operate on the stored snapshot amounts regardless of lock state

---

## 👥 User Stories

### US001: Calendar Preference Management

**As a** Muslim user following Islamic calendar  
**I want to** set my preferred calendar system  
**So that** Zakat calculations use the correct calendar for my lunar year  

**Acceptance Criteria**:

- Given I'm logged in, when I access settings, then I can select Hijri or Gregorian calendar
- Given I select Hijri calendar, when I calculate Zakat, then due dates use Islamic lunar calendar
- Given I change calendar preference, when I return to app, then my preference is remembered

### US002: Methodology Selection Guidance

**As a** new user unfamiliar with Zakat methodologies  
**I want to** see clear explanations of different calculation methods  
**So that** I can choose the most appropriate methodology for my situation  

**Acceptance Criteria**:

- Given I'm on methodology selection, when I view options, then each method shows clear description and use cases
- Given I need help choosing, when I click "Take Quiz", then I'm guided to recommended methodology
- Given I select a methodology, when I proceed to calculate, then educational content explains the method

### US003: Visual Calculation Understanding

**As a** user performing Zakat calculation  
**I want to** see visual breakdown of my calculation  
**So that** I understand how my Zakat amount was determined  

**Acceptance Criteria**:

- Given I enter my assets, when calculation completes, then I see visual nisab indicator
- Given I'm above nisab threshold, when I view breakdown, then I see percentage above threshold
- Given I hover over calculation elements, when I read tooltips, then I understand Islamic reasoning

### US004: Historical Calculation Tracking

**As a** user who calculates Zakat annually  
**I want to** view my previous calculations  
**So that** I can track changes in my Zakat obligations over time  

**Acceptance Criteria**:

- Given I have previous calculations, when I access history, then I see chronological list
- Given I select a past calculation, when I view details, then I see full breakdown with methodology
- Given I compare calculations, when I select multiple, then I see trend visualization

### US005: Methodology Comparison

**As a** user considering methodology change  
**I want to** compare calculation results between methods  
**So that** I can understand the differences and choose wisely  

**Acceptance Criteria**:

- Given I have asset data, when I access comparison, then I see side-by-side results
- Given I compare methods, when I view differences, then I see explanation of variations
- Given I switch methodology, when I recalculate, then new method is applied consistently

---

## ⚠️ Edge Cases

### EC001: Calendar Boundary Transitions

**Scenario**: User calculates Zakat during calendar month transitions  
**Edge Case**: Hijri month boundaries (29/30 days), leap year calculations  
**Expected Behavior**: Accurate date conversion regardless of month length variations  
**Test Cases**:

- Calculation on last day of 29-day Hijri month
- Zakat due date falling on Gregorian leap day
- Calendar conversion during Ramadan (variable month)

### EC002: Nisab Threshold Boundaries

**Scenario**: User's wealth is near nisab threshold  
**Edge Case**: Wealth slightly above/below gold/silver thresholds  
**Expected Behavior**: Clear indication of zakatability status with precise threshold display  
**Test Cases**:

- Wealth exactly at gold nisab threshold
- Wealth 0.1% above silver nisab (Hanafi method)
- Negative wealth values (debt handling)

### EC003: Multi-Methodology Validation

**Scenario**: Same asset data calculated with different methodologies  
**Edge Case**: Methods producing significantly different results  
**Expected Behavior**: Clear explanation of differences with Islamic scholarly references  
**Test Cases**:

- High-value gold assets (Standard vs Hanafi threshold difference)
- Business inventory calculations (Shafi'i detailed categorization)
- Cryptocurrency classification across methods

### EC004: Historical Data Integrity

**Scenario**: Long-term calculation history with methodology changes  
**Edge Case**: Historical calculations using deprecated or updated methodologies  
**Expected Behavior**: Historical data preserved with original methodology metadata  
**Test Cases**:

- Viewing calculations from before methodology updates
- Exporting historical data with methodology context
- Trend analysis across methodology changes

### EC005: Regional Methodology Recommendations

**Scenario**: Users in different geographic regions  
**Edge Case**: Location-based methodology suggestions  
**Expected Behavior**: Culturally sensitive recommendations without forcing specific methods  
**Test Cases**:

- Users in Southeast Asia (Shafi'i predominant regions)
- Users in South Asia (Hanafi predominant regions)
- Users requesting custom methodology options

### EC006: Performance with Large Datasets

**Scenario**: Users with extensive calculation history  
**Edge Case**: 100+ historical calculations with trend analysis  
**Expected Behavior**: Sub-500ms load times for history views  
**Test Cases**:

- Loading 100 calculations with trend charts
- Exporting large calculation datasets
- Concurrent users performing calculations

### EC007: Snapshot Unlock Corrections

**Scenario**: User discovers clerical errors after capturing a snapshot  
**Edge Case**: Snapshot needs edits without losing historical integrity  
**Expected Behavior**: Snapshots default to locked; authorized users can unlock, edit captured amounts, and re-lock with audit trail  
**Test Cases**:

- Attempting to edit a locked snapshot should be blocked with clear messaging
- Unlock action records actor, timestamp, and reason
- After corrections and re-locking, recalculations use the updated stored amounts while preserving audit history

---

## 📦 Deliverables

### Backend Components

1. **Calendar Service** (`server/services/CalendarService.js`)
   - Hijri date conversion
   - Zakat year calculation
   - Date utilities for lunar/solar calendars

2. **Enhanced Calculation Service** (`server/services/ZakatCalculationService.js`)
   - Multi-methodology calculation support
   - Method-specific validation
   - Calculation history management
   - Comparison utilities

3. **Calculation History API** (`server/routes/calculations.js`)
   - GET /calculations - List user's calculation history
   - GET /calculations/:id - Get specific calculation
   - POST /calculations/compare - Compare methodologies
   - GET /calculations/trends - Get calculation trends

### Frontend Components

1. **Methodology Selector** (`client/src/components/zakat/MethodologySelector.tsx`)
   - Beautiful methodology cards
   - Educational content display
   - Comparison view
   - Recommendation engine

2. **Enhanced Calculator** (`client/src/components/zakat/EnhancedZakatCalculator.tsx`)
   - Method-aware calculation display
   - Visual nisab indicators
   - Educational tooltips
   - Breakdown animations

3. **Calculation History** (`client/src/components/zakat/CalculationHistory.tsx`)
   - Historical calculation list
   - Trend visualization
   - Comparison tools
   - Export functionality

4. **Calendar Selector** (`client/src/components/ui/CalendarSelector.tsx`)
   - Hijri/Gregorian toggle
   - Date picker for both calendars
   - Visual calendar display

---

## 🗺️ Implementation Plan

### Phase 1: Calendar System (2-3 days)

**Goal**: Complete calendar integration for Zakat year tracking

#### Tasks

1. **T118**: Install and configure hijri-converter library ⏱️ 30min
2. **T119**: Create CalendarService with conversion utilities ⏱️ 2h
3. **T120**: Add calendar preference to user settings ⏱️ 1h
4. **T121**: Implement date conversion API endpoints ⏱️ 1.5h
5. **T122**: Create CalendarSelector component ⏱️ 2h
6. **T123**: Add calendar toggle to user profile ⏱️ 1h
7. **T124**: Test calendar conversions and edge cases ⏱️ 2h

**Duration**: 10 hours (~1.5 days)

#### Success Criteria

- ✅ Accurate Hijri ↔ Gregorian conversion
- ✅ User can select preferred calendar type
- ✅ Calendar preference persists
- ✅ UI displays both calendar systems

---

### Phase 2: Methodology Selection UI (3-4 days)

**Goal**: Create beautiful, educational methodology selector

#### Tasks

1. **T125**: Design methodology card components ⏱️ 3h
2. **T126**: Create MethodologySelector component ⏱️ 4h
3. **T127**: Add methodology comparison view ⏱️ 3h
4. **T128**: Write educational content for each methodology ⏱️ 2h
5. **T129**: Implement methodology recommendation engine ⏱️ 2h
6. **T130**: Add regional methodology mapping ⏱️ 1.5h
7. **T131**: Create methodology info modal/tooltip system ⏱️ 2h
8. **T132**: Integrate methodology selector into calculator ⏱️ 1.5h
9. **T133**: Test methodology switching and persistence ⏱️ 2h

**Duration**: 21 hours (~3 days)

#### Success Criteria

- ✅ Beautiful, intuitive methodology selection
- ✅ Educational content for each method
- ✅ Side-by-side comparison available
- ✅ Regional recommendations working
- ✅ Smooth integration with calculator

---

### Phase 3: Enhanced Calculation Display (2-3 days)

**Goal**: Show method-specific calculations with visual aids

#### Tasks

1. **T134**: Design calculation breakdown UI ⏱️ 2h
2. **T135**: Create NisabIndicator component ⏱️ 2h
3. **T136**: Add method-specific calculation explanations ⏱️ 3h
4. **T137**: Implement visual calculation breakdown ⏱️ 3h
5. **T138**: Add educational tooltips to calculation fields ⏱️ 2h
6. **T139**: Create comparison calculator view ⏱️ 3h
7. **T140**: Add print/export calculation result ⏱️ 2h
8. **T141**: Test calculation display across methodologies ⏱️ 2h

**Duration**: 19 hours (~2.5 days)

#### Success Criteria

- ✅ Clear visual nisab indicators
- ✅ Method-specific calculation breakdown
- ✅ Educational tooltips throughout
- ✅ Comparison view works smoothly
- ✅ Export/print functionality working

---

### Phase 4: Calculation History (2-3 days)

**Goal**: Store and display calculation history with trends

#### Tasks

1. **T142**: Design calculation history data model ⏱️ 1h
2. **T143**: Create calculation history API endpoints ⏱️ 3h
3. **T144**: Implement calculation storage in service layer ⏱️ 2h
4. **T145**: Create CalculationHistory component ⏱️ 3h
5. **T146**: Add calculation trend visualization ⏱️ 3h
6. **T147**: Implement calculation comparison view ⏱️ 2.5h
7. **T148**: Add calculation export functionality ⏱️ 2h
8. **T149**: Create calculation detail modal ⏱️ 2h
9. **T150**: Test calculation history storage and retrieval ⏱️ 2h

**Duration**: 20.5 hours (~3 days)

#### Success Criteria

- ✅ All calculations stored with metadata
- ✅ Historical calculations viewable
- ✅ Trend visualization working
- ✅ Comparison between calculations possible
- ✅ Export functionality complete

---

### Phase 5: Testing & Documentation (1-2 days)

**Goal**: Comprehensive testing and documentation

#### Tasks

1. **T151**: Unit test calendar conversions ⏱️ 2h
2. **T152**: Test methodology calculations end-to-end ⏱️ 2h
3. **T153**: Test calculation history functionality ⏱️ 1.5h
4. **T154**: Accessibility audit and fixes ⏱️ 2h
5. **T155**: Performance testing and optimization ⏱️ 2h
6. **T156**: Write user documentation for methodologies ⏱️ 2h
7. **T157**: Update API documentation ⏱️ 1.5h
8. **T158**: Create methodology selection guide ⏱️ 1h

**Duration**: 11 hours (~1.5 days)

#### Success Criteria

- ✅ All tests passing
- ✅ Accessibility compliant
- ✅ Performance optimized
- ✅ Documentation complete
- ✅ User guide ready

---

## 📊 Total Effort Estimate

| Phase | Tasks | Duration | Days |
|-------|-------|----------|------|
| Phase 1: Calendar System | T118-T124 (7 tasks) | 10h | 1.5 |
| Phase 2: Methodology Selection | T125-T133 (9 tasks) | 21h | 3 |
| Phase 3: Enhanced Display | T134-T141 (8 tasks) | 19h | 2.5 |
| Phase 4: Calculation History | T142-T150 (9 tasks) | 20.5h | 3 |
| Phase 5: Testing & Docs | T151-T158 (8 tasks) | 14h | 2 |
| **TOTAL** | **41 tasks** | **84.5h** | **12 days** |

**With 8 hour days**: ~10.5 working days  
**With 6 hour days**: ~14 working days  
**Calendar time (with breaks)**: 2-3 weeks

---

## 🎨 UI/UX Mockup Descriptions

### Methodology Selector

```text
┌─────────────────────────────────────────────────────────┐
│  Choose Your Zakat Calculation Methodology               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Standard   │  │    Hanafi    │  │   Shafi'i    │ │
│  │  ⭐ Most Used │  │              │  │              │ │
│  │              │  │              │  │              │ │
│  │ 2.5% of      │  │ Silver-based │  │ Detailed     │ │
│  │ zakatable    │  │ nisab        │  │ categories   │ │
│  │ wealth       │  │              │  │              │ │
│  │              │  │              │  │              │ │
│  │ [Learn More] │  │ [Learn More] │  │ [Learn More] │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ℹ️ Not sure which to choose? [Take Quiz]               │
│                                                          │
│  [Compare Methodologies Side-by-Side]                   │
└─────────────────────────────────────────────────────────┘
```

### Enhanced Calculator Display

```text
┌─────────────────────────────────────────────────────────┐
│  Zakat Calculation (Standard Method)          [Compare] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📊 Your Total Wealth: $150,000                         │
│  💰 Current Nisab (Gold): $5,000                        │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ████████████████████████░░░░░░░░ 75% above nisab   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ✅ You are above nisab - Zakat is obligatory           │
│                                                          │
│  💎 Zakat Due: $3,750 (2.5%)                            │
│                                                          │
│  📋 Breakdown:                                           │
│  • Cash & Savings: $50,000 → $1,250                     │
│  • Gold & Silver: $30,000 → $750                        │
│  • Investments: $40,000 → $1,000                        │
│  • Business Assets: $20,000 → $500                      │
│  • Cryptocurrency: $10,000 → $250                       │
│                                                          │
│  [View Methodology Details] [Save Calculation]          │
└─────────────────────────────────────────────────────────┘
```

### Calculation History

```text
┌─────────────────────────────────────────────────────────┐
│  Calculation History                          [Export]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📈 Your Zakat Trend (Last 3 Years)                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │        ●                                            │ │
│  │       ╱                                             │ │
│  │      ●                                              │ │
│  │     ╱                                               │ │
│  │    ●                                                │ │
│  │   2023      2024      2025                          │ │
│  │  $2,500    $3,125    $3,750                         │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  📅 Recent Calculations:                                │
│                                                          │
│  🗓️  Oct 6, 2025 - Standard Method                     │
│  $150,000 wealth → $3,750 zakat [View]                 │
│                                                          │
│  🗓️  Sep 15, 2025 - Hanafi Method                      │
│  $145,000 wealth → $3,625 zakat [View]                 │
│                                                          │
│  🗓️  Jan 15, 2025 - Standard Method                    │
│  $125,000 wealth → $3,125 zakat [View]                 │
│                                                          │
│  [Load More]  [Compare Calculations]                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Islamic Methodologies Reference

### 1. Standard Method (AAOIFI-Compliant)

**Source**: Accounting and Auditing Organization for Islamic Financial Institutions  
**Nisab**: Gold-based (85g of gold)  
**Rate**: 2.5% on all zakatable wealth  
**Key Features**:

- Most widely accepted modern standard
- Clear categorization of assets
- Comprehensive guidance for modern financial instruments

### 2. Hanafi Method

**School**: Hanafi Madhab  
**Nisab**: Silver-based (595g of silver) OR Gold-based (85g of gold), whichever is lower  
**Rate**: 2.5% on qualifying assets  
**Key Features**:

- More inclusive (lower nisab threshold)
- Benefits more people in need
- Traditional approach

### 3. Shafi'i Method

**School**: Shafi'i Madhab  
**Nisab**: Gold-based (85g of gold)  
**Rate**: 2.5% with specific categorization  
**Key Features**:

- Detailed asset categorization
- Specific rules for business assets
- Traditional scholarly approach

### 4. Custom Method

**User-Defined**: Based on local scholar guidance  
**Configurable**: User can set specific rules  
**Rate**: Typically 2.5% but adjustable  
**Key Features**:

- Flexibility for regional variations
- Accommodate specific scholarly opinions
- Advanced user option

---

## 📚 Educational Content Requirements

### For Each Methodology

1. **Overview**: Brief explanation of the method
2. **Historical Context**: Origins and scholarly basis
3. **Nisab Calculation**: How nisab is determined
4. **Asset Treatment**: How different assets are handled
5. **When to Use**: Recommendations for this method
6. **Example**: Practical calculation example

### Interactive Elements

- **Quiz**: "Which methodology is right for you?"
- **Comparison Tool**: Side-by-side methodology comparison
- **Glossary**: Islamic financial terms explained
- **FAQ**: Common questions about methodologies

---

## 🎯 Success Metrics

### Functional Metrics

- ✅ 100% accurate calendar conversions
- ✅ All 4 methodologies fully functional
- ✅ Calculation history stored and retrievable
- ✅ Educational content for all methodologies
- ✅ Comparison tools working

### Performance Metrics

- ⚡ Calculation time < 200ms for any methodology
- ⚡ Calendar conversion < 50ms
- ⚡ History load < 500ms for 100 records
- ⚡ Methodology comparison < 300ms

### Quality Metrics

- 🎯 0 critical bugs
- 🎯 95%+ test coverage
- 🎯 WCAG 2.1 AA compliant
- 🎯 Responsive on all devices

### User Experience Metrics

- 😊 Methodology selection < 2 minutes
- 😊 Calculation understanding > 90%
- 😊 Educational content helpful > 85%
- 😊 Interface intuitive > 90%

---

## 🔒 Security Considerations

1. **Data Storage**: Calculation history encrypted
2. **Method Validation**: Server-side methodology validation
3. **Audit Trail**: All calculations logged
4. **Privacy**: User methodology preference private

---

## 📖 Documentation Requirements

1. **User Guide**: Methodology selection guide
2. **API Docs**: Calendar and calculation endpoints
3. **Developer Docs**: Calendar service integration
4. **Islamic Guidance**: Methodology explanations

---

## 🚀 Deployment Plan

### Phase 1: Development (Current → Week 1-2)

- Implement all tasks T118-T150
- Internal testing
- Code review

### Phase 2: Testing (Week 2)

- Execute T151-T158
- User acceptance testing
- Bug fixes

### Phase 3: Documentation (Week 2)

- Complete all documentation
- Create user guides
- API documentation

### Phase 4: Release (Week 3)

- Merge to main branch
- Deploy to staging
- Production release
- Announcement

---

## ✅ Definition of Done

Feature 004 is complete when:

1. ✅ All 41 tasks (T118-T158) are completed
2. ✅ Calendar system fully functional (Hijri + Gregorian)
3. ✅ All 4 methodologies implemented and tested
4. ✅ Methodology selector UI complete and beautiful
5. ✅ Enhanced calculation display working
6. ✅ Calculation history stored and viewable
7. ✅ All tests passing (unit, integration, e2e)
8. ✅ Documentation complete
9. ✅ Accessibility audit passed
10. ✅ Performance metrics met
11. ✅ Code reviewed and approved
12. ✅ Deployed to staging successfully
13. ✅ User acceptance testing passed
14. ✅ Production deployment complete

---

## 📝 Notes

- This feature completes Milestone 4 (Zakat Calculation Engine)
- After this, project is 90% feature-complete
- Remaining: UI/UX polish (Milestone 6) and Production readiness (Milestone 7)
- This is a CRITICAL feature for Islamic compliance
- Educational content must be reviewed by Islamic scholar (if possible)

---

**Created**: October 6, 2025  
**Last Updated**: October 6, 2025  
**Status**: Ready to Start  
**Next Action**: Create feature branch and begin Phase 1 (Calendar System)
