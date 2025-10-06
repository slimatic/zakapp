# Implementation Tasks - Feature 004: Enhanced Zakat Calculation Engine

**Total Tasks**: 41  
**Estimated Effort**: 84.5 hours  
**Target Duration**: 12 working days (2-3 weeks)

---

## Setup Phase

### T118: Install hijri-converter library
**Estimate**: 30 minutes  
**Dependencies**: None  
**Files**: `server/package.json`, `client/package.json`

Install the hijri-converter library for Islamic calendar support in both backend and frontend.

```bash
cd server && npm install hijri-converter --save
cd ../client && npm install hijri-converter --save
```

**Acceptance Criteria**:
- Library installed in server package.json
- Library installed in client package.json
- No version conflicts
- Basic import test successful

---

## Tests Phase

### T151: Unit test calendar conversions
**Estimate**: 2 hours  
**Dependencies**: T119, T121  
**Files**: `server/tests/services/CalendarService.test.js`

Create comprehensive unit tests for calendar conversion accuracy using known dates.

**Test Cases**:
- Gregorian to Hijri conversion
- Hijri to Gregorian conversion
- Edge cases (month boundaries, year boundaries)
- Next Zakat date calculation
- Date formatting

**Acceptance Criteria**:
- All calendar conversion tests passing
- Known dates verified (e.g., Islamic New Year)
- Edge cases covered
- >95% code coverage for CalendarService

---

### T152: Test methodology calculations end-to-end
**Estimate**: 2 hours  
**Dependencies**: T126, T132  
**Files**: `server/tests/integration/zakat-calculations.test.js`, `client/tests/e2e/zakat-flow.spec.ts`

End-to-end testing of all four Zakat calculation methodologies.

**Test Cases**:
- Standard methodology calculation
- Hanafi methodology calculation  
- Shafi'i methodology calculation
- Custom methodology calculation
- Methodology switching
- Nisab threshold validation

**Acceptance Criteria**:
- All methodologies calculate correctly
- Calculations match expected values
- Methodology switching works smoothly
- All edge cases handled

---

### T153: Test calculation history functionality
**Estimate**: 1.5 hours  
**Dependencies**: T143, T144, T145  
**Files**: `server/tests/integration/calculation-history.test.js`

Test calculation history storage, retrieval, and trends.

**Test Cases**:
- Save calculation
- Retrieve calculation by ID
- List calculations with pagination
- Calculate trends
- Compare calculations
- Export calculations
- Delete calculation

**Acceptance Criteria**:
- CRUD operations working correctly
- Pagination functioning
- Trends calculated accurately
- Comparison working
- Export formats correct

---

### T154: Accessibility audit and fixes
**Estimate**: 2 hours  
**Dependencies**: T126, T135, T145  
**Files**: All frontend components

Comprehensive accessibility audit and fixes for WCAG 2.1 AA compliance.

**Audit Areas**:
- Keyboard navigation
- Screen reader support
- Color contrast ratios
- Focus indicators
- ARIA labels
- Form validation messages

**Tools**:
- axe DevTools
- WAVE
- Lighthouse accessibility score

**Acceptance Criteria**:
- WCAG 2.1 AA compliant
- Lighthouse accessibility score >95
- All interactive elements keyboard accessible
- Screen reader friendly
- Color contrast ratios meet standards

---

### T155: Performance testing and optimization
**Estimate**: 2 hours  
**Dependencies**: T119, T126, T143  
**Files**: Performance test suite

Performance testing and optimization for all calculation operations.

**Performance Targets**:
- Calendar conversion: <50ms
- Zakat calculation: <200ms per methodology
- History load (100 records): <500ms
- Methodology comparison: <300ms
- Trend visualization: <400ms

**Acceptance Criteria**:
- All performance targets met
- No memory leaks detected
- Optimizations implemented where needed
- Performance monitoring in place

---

## Core Phase

### T119: Create CalendarService with conversion utilities
**Estimate**: 2 hours  
**Dependencies**: T118  
**Files**: `server/services/CalendarService.js`

Create CalendarService with utilities for Hijri ↔ Gregorian date conversion.

**Methods**:
- `gregorianToHijri(date)` - Convert Gregorian to Hijri date
- `hijriToGregorian(year, month, day)` - Convert Hijri to Gregorian
- `calculateNextZakatDate(calendarType, lastDate)` - Calculate next Zakat due date
- `formatHijriDate(year, month, day)` - Format Hijri date for display
- `getCurrentHijriDate()` - Get current Hijri date

**Acceptance Criteria**:
- All methods implemented with JSDoc comments
- Accurate conversion using hijri-converter library
- Error handling for invalid dates
- Edge cases handled (month/year boundaries)

---

### T120: Add calendar preference to user settings
**Estimate**: 1 hour  
**Dependencies**: None  
**Files**: `server/prisma/schema.prisma`, `server/services/UserService.js`

Add calendar preference field to User model and update user settings.

**Database Changes**:
```prisma
model User {
  // ... existing fields ...
  preferredCalendar     String? @default("gregorian")
  preferredMethodology  String? @default("standard")
  lastZakatDate         DateTime?
}
```

**Acceptance Criteria**:
- Schema updated with new fields
- Migration created and applied
- User settings service updated
- Default values set correctly

---

### T121: Implement date conversion API endpoints
**Estimate**: 1.5 hours  
**Dependencies**: T119  
**Files**: `server/routes/calendar.js`

Create API endpoints for calendar conversion operations.

**Endpoints**:
- `POST /api/calendar/convert` - Convert between Hijri and Gregorian
- `GET /api/calendar/next-zakat-date` - Calculate next Zakat due date
- `GET /api/calendar/current-hijri` - Get current Hijri date

**Acceptance Criteria**:
- All endpoints implemented and tested
- Request validation in place
- Error handling proper
- API documentation updated

---

### T122: Create CalendarSelector component
**Estimate**: 2 hours  
**Dependencies**: T121  
**Files**: `client/src/components/ui/CalendarSelector.tsx`

Create CalendarSelector component with Hijri/Gregorian toggle and date picker.

**Features**:
- Calendar type toggle (Hijri/Gregorian)
- Date picker for both calendars
- Visual calendar display
- Real-time conversion display

**Acceptance Criteria**:
- Component responsive and accessible
- Both calendars working correctly
- Date conversion displayed
- User preference saved

---

### T123: Add calendar toggle to user profile
**Estimate**: 1 hour  
**Dependencies**: T120, T122  
**Files**: `client/src/pages/ProfilePage.tsx`, `client/src/api/users.ts`

Integrate calendar preference into user profile settings.

**Acceptance Criteria**:
- Calendar toggle in profile settings
- Preference persists after save
- UI updates reflect preference
- Validation working

---

### T124: Test calendar conversions and edge cases
**Estimate**: 2 hours  
**Dependencies**: T119, T121, T122  
**Files**: Manual test suite

Manual and automated testing of calendar functionality with edge cases.

**Test Scenarios**:
- Convert known dates (Islamic New Year, Ramadan)
- Month boundaries
- Year boundaries
- Leap years
- Invalid dates
- User preference persistence

**Acceptance Criteria**:
- All known dates convert correctly
- Edge cases handled gracefully
- No crashes or errors
- User experience smooth

---

### T125: Design methodology card components
**Estimate**: 3 hours  
**Dependencies**: None  
**Files**: `client/src/components/zakat/MethodologyCard.tsx`

Design and implement beautiful methodology card components.

**Card Features**:
- Methodology name and icon
- Brief description
- Key characteristics
- "Learn More" button
- Selection state indication

**Acceptance Criteria**:
- Cards responsive and beautiful
- Accessible with keyboard
- Hover/focus states working
- Selection clearly indicated

---

### T126: Create MethodologySelector component
**Estimate**: 4 hours  
**Dependencies**: T125  
**Files**: `client/src/components/zakat/MethodologySelector.tsx`

Create main methodology selector with educational content.

**Features**:
- Display all 4 methodologies (Standard, Hanafi, Shafi'i, Custom)
- Educational content for each
- Comparison view
- Recommendation quiz
- Selection persistence

**Acceptance Criteria**:
- All methodologies displayed
- Educational content clear
- Comparison view working
- Selection saves correctly
- Accessible and responsive

---

### T127: Add methodology comparison view
**Estimate**: 3 hours  
**Dependencies**: T126  
**Files**: `client/src/components/zakat/MethodologyComparison.tsx`

Create side-by-side methodology comparison view.

**Comparison Features**:
- Nisab threshold comparison
- Rate comparison
- Asset treatment comparison
- Use case recommendations
- Visual highlighting of differences

**Acceptance Criteria**:
- Clear visual comparison
- All methodologies comparable
- Educational and informative
- Responsive design

---

### T128: Write educational content for each methodology
**Estimate**: 2 hours  
**Dependencies**: None  
**Files**: `client/src/data/methodologies.ts`

Write comprehensive educational content for all methodologies.

**Content for Each**:
- Overview and historical context
- Nisab calculation method
- Asset treatment rules
- When to use this methodology
- Practical example
- Sources and references

**Acceptance Criteria**:
- Content accurate and clear
- Islamic compliance verified
- Educational and accessible
- Sources cited where appropriate
- Disclaimer about consulting scholars

---

### T129: Implement methodology recommendation engine
**Estimate**: 2 hours  
**Dependencies**: T126  
**Files**: `client/src/utils/methodologyRecommendation.ts`

Create recommendation engine to suggest appropriate methodology.

**Factors**:
- User location/region
- Asset types owned
- User preference (conservative vs standard)
- Educational level

**Acceptance Criteria**:
- Recommendations logical and helpful
- Quiz-based approach
- Clear reasoning provided
- Easy to override recommendation

---

### T130: Add regional methodology mapping
**Estimate**: 1.5 hours  
**Dependencies**: T129  
**Files**: `client/src/data/regionalMethodologies.ts`

Map common methodologies to geographical regions.

**Regions**:
- Middle East
- South Asia
- Southeast Asia
- North Africa
- Europe/Americas

**Acceptance Criteria**:
- Accurate regional mapping
- Default recommendations by region
- User can override
- Educational context provided

---

### T131: Create methodology info modal/tooltip system
**Estimate**: 2 hours  
**Dependencies**: T126  
**Files**: `client/src/components/zakat/MethodologyInfoModal.tsx`

Create informational modal system for detailed methodology explanations.

**Features**:
- Detailed methodology explanation
- Visual examples
- Calculation walkthrough
- FAQ section
- Sources and references

**Acceptance Criteria**:
- Modals accessible and responsive
- Content comprehensive
- Easy to navigate
- Shareable links to specific sections

---

### T132: Integrate methodology selector into calculator
**Estimate**: 1.5 hours  
**Dependencies**: T126  
**Files**: `client/src/components/zakat/ZakatCalculator.tsx`

Integrate methodology selector into existing Zakat calculator.

**Integration Points**:
- Methodology selection before calculation
- Methodology display during calculation
- Method-specific validation
- Calculation adjusts based on methodology

**Acceptance Criteria**:
- Smooth integration with existing calculator
- No breaking changes
- Methodology affects calculation correctly
- User experience intuitive

---

### T133: Test methodology switching and persistence
**Estimate**: 2 hours  
**Dependencies**: T132  
**Files**: E2E test suite

Test methodology selection, switching, and persistence.

**Test Scenarios**:
- Select each methodology
- Switch between methodologies
- Persistence after logout/login
- Calculation accuracy per methodology
- UI updates correctly

**Acceptance Criteria**:
- All switching scenarios working
- Persistence reliable
- No data loss
- Smooth transitions

---

### T134: Design calculation breakdown UI
**Estimate**: 2 hours  
**Dependencies**: None  
**Files**: `client/src/components/zakat/CalculationBreakdown.tsx`

Design visual calculation breakdown UI component.

**Features**:
- Asset category breakdown
- Visual progress bars
- Color-coded categories
- Zakat amount per category
- Total calculation display

**Acceptance Criteria**:
- Clear and informative display
- Responsive design
- Accessible
- Print-friendly

---

### T135: Create NisabIndicator component
**Estimate**: 2 hours  
**Dependencies**: None  
**Files**: `client/src/components/zakat/NisabIndicator.tsx`

Create visual nisab threshold indicator component.

**Features**:
- Progress bar showing wealth vs nisab
- Percentage above/below nisab
- Visual threshold marker
- Zakat obligation status
- Educational tooltip

**Acceptance Criteria**:
- Clear visual representation
- Accurate calculation
- Responsive and accessible
- Educational and helpful

---

### T136: Add method-specific calculation explanations
**Estimate**: 3 hours  
**Dependencies**: T132  
**Files**: `client/src/components/zakat/CalculationExplanation.tsx`

Add method-specific explanations for calculations.

**Explanations**:
- Why this nisab threshold
- How this methodology calculates
- Asset treatment reasoning
- References to Islamic sources

**Acceptance Criteria**:
- Explanations accurate and clear
- Method-specific content
- Educational tooltips
- Sources cited

---

### T137: Implement visual calculation breakdown
**Estimate**: 3 hours  
**Dependencies**: T134, T136  
**Files**: `client/src/components/zakat/EnhancedZakatCalculator.tsx`

Implement visual breakdown of Zakat calculation with animations.

**Features**:
- Animated calculation process
- Step-by-step breakdown
- Visual asset categorization
- Real-time updates
- Smooth transitions

**Acceptance Criteria**:
- Animations smooth and informative
- Breakdown clear and educational
- Performance optimized
- Accessible (can disable animations)

---

### T138: Add educational tooltips to calculation fields
**Estimate**: 2 hours  
**Dependencies**: T137  
**Files**: All calculator components

Add comprehensive educational tooltips throughout calculator.

**Tooltip Content**:
- Field explanations
- Islamic terminology
- Calculation methodology
- Examples
- Common questions

**Acceptance Criteria**:
- Tooltips accessible and helpful
- Content accurate
- Non-intrusive
- Keyboard accessible

---

### T139: Create comparison calculator view
**Estimate**: 3 hours  
**Dependencies**: T137  
**Files**: `client/src/components/zakat/ComparisonCalculator.tsx`

Create view to compare Zakat calculation across methodologies.

**Features**:
- Side-by-side methodology comparison
- Same assets, different calculations
- Highlight differences
- Explanation of variations
- Export comparison

**Acceptance Criteria**:
- Clear comparison display
- All methodologies comparable
- Differences explained
- Educational and informative

---

### T140: Add print/export calculation result
**Estimate**: 2 hours  
**Dependencies**: T137  
**Files**: `client/src/utils/calculationExport.ts`

Add functionality to print or export calculation results.

**Export Formats**:
- PDF (print-friendly)
- CSV (for records)
- JSON (for backup)

**Export Content**:
- Calculation details
- Methodology used
- Asset breakdown
- Date and time
- User notes (optional)

**Acceptance Criteria**:
- All export formats working
- Print layout optimized
- Data complete and accurate
- Privacy maintained

---

### T141: Test calculation display across methodologies
**Estimate**: 2 hours  
**Dependencies**: T137, T139  
**Files**: Manual test suite

Test calculation display for all methodologies and edge cases.

**Test Scenarios**:
- Each methodology display
- Edge cases (zero wealth, exact nisab, etc.)
- Large numbers
- Multiple assets
- Comparison view

**Acceptance Criteria**:
- All methodologies display correctly
- Edge cases handled gracefully
- No visual bugs
- Performance acceptable

---

### T142: Design calculation history data model
**Estimate**: 1 hour  
**Dependencies**: None  
**Files**: `server/prisma/schema.prisma`

Design and implement CalculationHistory database model.

**Model Schema**:
```prisma
model CalculationHistory {
  id                String   @id @default(uuid())
  userId            String
  methodology       String
  calendarType      String
  calculationDate   DateTime @default(now())
  totalWealth       Float
  nisabThreshold    Float
  zakatDue          Float
  zakatRate         Float    @default(2.5)
  assetBreakdown    String   // Encrypted JSON
  notes             String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

**Acceptance Criteria**:
- Schema defined correctly
- Indexes optimized
- Migration created
- Encryption for sensitive data

---

### T143: Create calculation history API endpoints
**Estimate**: 3 hours  
**Dependencies**: T142  
**Files**: `server/routes/calculations.js`

Create CRUD API endpoints for calculation history.

**Endpoints**:
- `GET /api/calculations` - List calculations (paginated)
- `GET /api/calculations/:id` - Get specific calculation
- `POST /api/calculations` - Save new calculation
- `POST /api/calculations/compare` - Compare methodologies
- `GET /api/calculations/trends` - Get calculation trends
- `DELETE /api/calculations/:id` - Delete calculation

**Acceptance Criteria**:
- All endpoints implemented
- Pagination working
- Authentication/authorization enforced
- Data encrypted
- Error handling proper

---

### T144: Implement calculation storage in service layer
**Estimate**: 2 hours  
**Dependencies**: T142, T143  
**Files**: `server/services/ZakatCalculationService.js`

Implement calculation storage logic in service layer.

**Storage Features**:
- Auto-save calculations
- Encrypt sensitive data
- Validate before storage
- Update existing calculations
- Soft delete option

**Acceptance Criteria**:
- Calculations stored correctly
- Data encrypted
- Validation working
- Error handling robust
- Performance optimized

---

### T145: Create CalculationHistory component
**Estimate**: 3 hours  
**Dependencies**: T143  
**Files**: `client/src/components/zakat/CalculationHistory.tsx`

Create calculation history display component.

**Features**:
- List of past calculations
- Pagination
- Filter by methodology
- Filter by date range
- Sort options
- Detail view
- Delete option

**Acceptance Criteria**:
- History displays correctly
- Pagination working
- Filters functional
- Detail view comprehensive
- Responsive design

---

### T146: Add calculation trend visualization
**Estimate**: 3 hours  
**Dependencies**: T145  
**Files**: `client/src/components/zakat/CalculationTrends.tsx`

Add trend visualization for calculation history.

**Visualization Features**:
- Line chart of Zakat amounts over time
- Wealth trend
- Methodology distribution
- Year-over-year comparison
- Interactive chart

**Acceptance Criteria**:
- Charts render correctly
- Data accurate
- Interactive and informative
- Responsive
- Accessible (data table alternative)

---

### T147: Implement calculation comparison view
**Estimate**: 2.5 hours  
**Dependencies**: T145  
**Files**: `client/src/components/zakat/CalculationComparison.tsx`

Implement view to compare multiple historical calculations.

**Comparison Features**:
- Select multiple calculations
- Side-by-side comparison
- Highlight differences
- Methodology impact analysis
- Export comparison

**Acceptance Criteria**:
- Comparison clear and informative
- Multiple calculations selectable
- Differences highlighted
- Export working

---

### T148: Add calculation export functionality
**Estimate**: 2 hours  
**Dependencies**: T145  
**Files**: `client/src/utils/historyExport.ts`

Add export functionality for calculation history.

**Export Options**:
- Export single calculation
- Export all history
- Export filtered results
- PDF, CSV, JSON formats

**Acceptance Criteria**:
- All export formats working
- Data complete and accurate
- Privacy maintained
- Performance acceptable

---

### T149: Create calculation detail modal
**Estimate**: 2 hours  
**Dependencies**: T145  
**Files**: `client/src/components/zakat/CalculationDetailModal.tsx`

Create detailed view modal for individual calculations.

**Detail View**:
- Full calculation breakdown
- Methodology details
- Asset breakdown
- Notes
- Edit/delete options
- Export option

**Acceptance Criteria**:
- Modal accessible and responsive
- All details displayed
- Actions working
- User experience smooth

---

### T150: Test calculation history storage and retrieval
**Estimate**: 2 hours  
**Dependencies**: T144, T145  
**Files**: Integration test suite

Test calculation history CRUD operations end-to-end.

**Test Scenarios**:
- Save calculation
- Retrieve calculation
- List calculations
- Filter and pagination
- Update calculation
- Delete calculation
- Trends calculation

**Acceptance Criteria**:
- All operations working
- Data integrity maintained
- Performance acceptable
- No data loss

---

## Integration Phase

### T156: Write user documentation for methodologies
**Estimate**: 2 hours  
**Dependencies**: T128  
**Files**: `docs/user-guide/methodology-selection.md`

Write comprehensive user documentation for methodology selection.

**Documentation Sections**:
- Overview of methodologies
- How to choose
- Comparison guide
- FAQs
- Examples
- When to consult a scholar

**Acceptance Criteria**:
- Documentation clear and comprehensive
- Examples helpful
- Accessible to all users
- Accurate Islamic content

---

### T157: Update API documentation
**Estimate**: 1.5 hours  
**Dependencies**: T121, T143  
**Files**: `docs/api/calendar.md`, `docs/api/calculations.md`

Update API documentation for new endpoints.

**Documentation Updates**:
- Calendar endpoints
- Calculation history endpoints
- Request/response schemas
- Authentication requirements
- Examples

**Acceptance Criteria**:
- All endpoints documented
- Examples working
- Schemas accurate
- Clear and comprehensive

---

### T158: Create methodology selection guide
**Estimate**: 1 hour  
**Dependencies**: T156  
**Files**: `docs/user-guide/choosing-methodology.md`

Create step-by-step guide for choosing methodology.

**Guide Content**:
- Decision tree
- Regional recommendations
- Asset type considerations
- Quiz/questionnaire
- Additional resources

**Acceptance Criteria**:
- Guide clear and helpful
- Decision process logical
- Accessible to beginners
- Encourages scholar consultation

---

## Execution Order

### Sequential Dependencies

**Week 1: Calendar & Methodology (Days 1-5)**
1. T118 → T119 → T120 → T121 → T122 → T123 → T124 (Calendar System - Sequential)
2. T125 → T126 (Methodology cards first, then selector)
3. T128 [P] (Can be done in parallel with T125-T126)
4. T127 → T129 → T130 → T131 (Build on methodology selector)
5. T132 → T133 (Integration and testing)

**Week 2: Enhanced Display & History (Days 6-10)**
6. T134 → T135 [P] (Design work can be parallel)
7. T136 → T137 → T138 (Sequential enhancement)
8. T139 → T140 → T141 (Comparison and export)
9. T142 → T143 → T144 (Data model, API, service)
10. T145 → T146 [P] and T147 [P] (History component, then parallel viz)
11. T148 → T149 → T150 (Export, modal, testing)

**Week 2-3: Testing & Documentation (Days 11-12)**
12. T151 → T152 → T153 (Tests can run in order)
13. T154 [P] and T155 [P] (Accessibility and performance parallel)
14. T156 → T157 → T158 (Documentation sequential)

### Parallel Execution Markers [P]

These tasks can run in parallel with their adjacent tasks:
- **T128** [P] - Content writing while building UI
- **T135** [P] - Component can be built alongside T134
- **T146** [P] - Visualization can be built while T145 is in progress
- **T147** [P] - Comparison view parallel with trend visualization
- **T154** [P] - Accessibility audit parallel with performance testing
- **T155** [P] - Performance testing parallel with accessibility

---

## Progress Tracking

Mark tasks as complete using [X]:
- [X] T118: Install hijri-converter library
- [X] T119: Create CalendarService
- [X] T120: Add calendar preference to user settings
- [ ] T121: Implement date conversion API endpoints
- [ ] T122: Create CalendarSelector component
- [ ] T123: Add calendar toggle to user profile
- [ ] T124: Test calendar conversions and edge cases
- [ ] T125: Design methodology card components
- [ ] T126: Create MethodologySelector component
- [ ] T127: Add methodology comparison view
- [ ] T128: Write educational content for each methodology
- [ ] T129: Implement methodology recommendation engine
- [ ] T130: Add regional methodology mapping
- [ ] T131: Create methodology info modal/tooltip system
- [ ] T132: Integrate methodology selector into calculator
- [ ] T133: Test methodology switching and persistence
- [ ] T134: Design calculation breakdown UI
- [ ] T135: Create NisabIndicator component
- [ ] T136: Add method-specific calculation explanations
- [ ] T137: Implement visual calculation breakdown
- [ ] T138: Add educational tooltips to calculation fields
- [ ] T139: Create comparison calculator view
- [ ] T140: Add print/export calculation result
- [ ] T141: Test calculation display across methodologies
- [ ] T142: Design calculation history data model
- [ ] T143: Create calculation history API endpoints
- [ ] T144: Implement calculation storage in service layer
- [ ] T145: Create CalculationHistory component
- [ ] T146: Add calculation trend visualization
- [ ] T147: Implement calculation comparison view
- [ ] T148: Add calculation export functionality
- [ ] T149: Create calculation detail modal
- [ ] T150: Test calculation history storage and retrieval
- [ ] T151: Unit test calendar conversions
- [ ] T152: Test methodology calculations end-to-end
- [ ] T153: Test calculation history functionality
- [ ] T154: Accessibility audit and fixes
- [ ] T155: Performance testing and optimization
- [ ] T156: Write user documentation for methodologies
- [ ] T157: Update API documentation
- [ ] T158: Create methodology selection guide
