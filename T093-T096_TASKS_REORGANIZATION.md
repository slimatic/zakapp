# T093-T102 Tasks Reorganization Summary

**Date**: 2025-10-31  
**Commit**: `181692f`  
**Context**: Following tasks.prompt.md instructions to properly structure asset auto-inclusion implementation tasks

---

## What Changed

### Before (Incorrect Structure)
Tasks were organized by component type (Backend → Frontend → Testing), which violated TDD principles:

```
T093: Backend - Update HawlTrackingService
T094: Backend - Add refresh endpoint
T095: Backend - Update createRecord()
T096: Frontend - Create AssetSelectionTable
T097: Frontend - Add Refresh Assets button
T098: Frontend - Integrate AssetSelectionTable
T099: Frontend - Display AssetBreakdownView
T100: Test - AssetSelectionTable test
T101: Test - Asset refresh integration test
T102: Test - Hawl detection integration test
```

**Problem**: Implementation tasks came before tests, violating TDD workflow.

### After (Correct TDD Structure)
Tasks now follow Test-First Development:

```
Phase 3.5.1: Asset Auto-Inclusion Implementation

1. Tests First (TDD) ⚠️ MUST COMPLETE BEFORE Implementation
   T093 [P] Component test for AssetSelectionTable
   T094 [P] Integration test for asset refresh workflow
   T095 [P] Integration test for automatic asset inclusion
   🔸 COMMIT CHECKPOINT: TDD test suite (all tests must FAIL)

2. Backend Implementation (ONLY after tests are failing)
   T096: Update HawlTrackingService to populate assetBreakdown
   T097: Update NisabYearRecordService.createRecord()
   T098: Add GET /api/nisab-year-records/:id/assets/refresh
   🔸 COMMIT CHECKPOINT: Backend complete (tests should pass)

3. Frontend Implementation
   T099 [P] Create AssetSelectionTable component
   T100: Update NisabYearRecordsPage integration
   T101 [P] Add "Refresh Assets" button
   T102 [P] Display AssetBreakdownView
   🔸 COMMIT CHECKPOINT: Frontend complete
```

---

## Key Improvements

### ✅ TDD Workflow Enforced
- Tests (T093-T095) **MUST** be written and **MUST FAIL** before implementation
- Each test explicitly states "Expected: FAIL (component/endpoint doesn't exist yet)"
- Implementation tasks (T096-T102) include "Verify T0XX test now passes" acceptance criteria

### ✅ Commit Checkpoints Added
- After test phase: "TDD test suite (all tests must be failing)"
- After backend implementation: "Backend complete (tests should pass)"
- After frontend implementation: "Frontend complete"

### ✅ Clear Dependencies
Updated Dependencies section shows:
```
9. Asset Auto-Inclusion Tests (T093-T095) must write and FAIL before implementation
10. Asset Auto-Inclusion Backend (T096-T098) requires services complete
11. Asset Auto-Inclusion Frontend (T099-T102) requires backend complete
12. Validation (T067-T087) requires ALL implementation including T093-T102 ⚠️ BLOCKED
```

### ✅ Parallel Execution Updated
```
Asset Auto-Inclusion TDD Tests (can run together):
- T093, T094, T095 (3 tests, different files, write FIRST)

Asset Auto-Inclusion Frontend Components (can run together):
- T099, T101, T102 (3 frontend components, independent files)
```

### ✅ Execution Flow Updated
```
5. Total tasks: 102 (numbered T001-T102)
   → Original: 91 tasks (T001-T091)
   → Asset Auto-Inclusion: 10 tasks (T093-T102) added 2025-10-31
6. Dependencies: Database → Services → Jobs → API → Frontend → Asset Auto-Inclusion → Manual Testing
```

---

## Task Details

### T093: Component Test for AssetSelectionTable [P]
**File**: `client/tests/components/AssetSelectionTable.test.tsx`  
**Requirements**: FR-038a  
**What to Test**:
- Selection/deselection functionality
- Total calculations update correctly
- Pre-selection of zakatable assets
- Accessibility (keyboard nav, ARIA)
- **Expected**: FAIL (component doesn't exist yet)

### T094: Integration Test for Asset Refresh Workflow [P]
**File**: `server/tests/integration/assetRefresh.test.ts`  
**Requirements**: FR-032a  
**What to Test**:
- Create DRAFT record with initial asset snapshot
- Add new asset to user
- Call GET /api/nisab-year-records/:id/assets/refresh endpoint
- Verify new asset appears in response
- Update record with new selection
- Verify assetBreakdown updated correctly
- **Expected**: FAIL (endpoint doesn't exist yet)

### T095: Integration Test for Automatic Asset Inclusion [P]
**File**: `server/tests/integration/hawlDetectionAssets.test.ts`  
**Requirements**: FR-014, FR-011a  
**What to Test**:
- Create assets for user that exceed Nisab
- Run Hawl detection job
- Verify DRAFT record created with assetBreakdown populated
- Verify all zakatable assets included in snapshot
- Verify JSON structure: `{ assets: [...], capturedAt, totalWealth, zakatableWealth }`
- **Expected**: FAIL (asset snapshot logic doesn't exist yet)

### T096: Update HawlTrackingService
**File**: `server/src/services/HawlTrackingService.ts`  
**Requirements**: FR-014, FR-011a  
**Implementation**:
- When creating DRAFT record via Nisab achievement detection
- Fetch all zakatable assets via `WealthAggregationService.getZakatableAssets()`
- Build assetBreakdown JSON structure
- Encrypt via `EncryptionService.encrypt()`
- Store in `nisabYearRecord.assetBreakdown` field
- **Verify**: T095 integration test now passes

### T097: Update NisabYearRecordService.createRecord()
**File**: `server/src/services/NisabYearRecordService.ts`  
**Requirements**: FR-038a, FR-011a  
**Implementation**:
- Add optional `selectedAssetIds?: string[]` parameter
- If provided, fetch only selected assets via `AssetService.getByIds()`
- Build assetBreakdown snapshot from selected assets
- Encrypt and store in record
- If not provided (background job), auto-select all zakatable assets
- **Verify**: T095 integration test passes (background job path)

### T098: Add Asset Refresh Endpoint
**File**: `server/src/routes/nisabYearRecords.ts`  
**Requirements**: FR-032a  
**Implementation**:
- Add route handler for `GET /api/nisab-year-records/:id/assets/refresh`
- Validate record is DRAFT status (return 400 if FINALIZED/UNLOCKED)
- Call `WealthAggregationService.getZakatableAssets(userId)`
- Return asset list with current values (don't persist)
- Format: `{ assets: [{ id, name, category, value, isZakatable, addedAt }] }`
- **Verify**: T094 integration test now passes

### T099: Create AssetSelectionTable Component [P]
**File**: `client/src/components/tracking/AssetSelectionTable.tsx`  
**Requirements**: FR-038a  
**Implementation**:
- Display table with columns: [Checkbox, Name, Category, Value, Zakatable Status, Added Date]
- Pre-select all zakatable assets by default
- Allow selection/deselection via checkboxes
- Show calculated totals footer: Total Wealth, Zakatable Wealth, Zakat Amount (2.5%)
- Update totals in real-time as selection changes (React state)
- Accessibility: WCAG 2.1 AA (keyboard nav, ARIA labels, screen reader)
- Props: `assets`, `onSelectionChange`, `initialSelection`
- **Verify**: T093 component test now passes

### T100: Update NisabYearRecordsPage
**File**: `client/src/pages/NisabYearRecordsPage.tsx`  
**Requirements**: FR-038a  
**Implementation**:
- When "Create Record" clicked, fetch user's current assets
- Display AssetSelectionTable in creation modal before financial fields
- Auto-populate totals from AssetSelectionTable selection
- Make financial fields read-only (calculated from assets)
- Pass selectedAssetIds to API: `nisabYearRecordsApi.create({ ...data, selectedAssetIds })`
- Handle loading state while fetching assets

### T101: Add "Refresh Assets" Button [P]
**File**: `client/src/components/tracking/NisabYearRecordCard.tsx`  
**Requirements**: FR-032a  
**Implementation**:
- Show "Refresh Assets" button only for `status === "DRAFT"`
- On click, call `nisabYearRecordsApi.refreshAssets(recordId)`
- Open modal with AssetSelectionTable showing current assets
- Pre-populate selection from existing assetBreakdown
- On confirm, call `nisabYearRecordsApi.update(recordId, { assetBreakdown: newSnapshot })`
- Show loading state (button disabled, spinner)
- **Verify**: T094 workflow can be executed end-to-end

### T102: Display AssetBreakdownView [P]
**File**: `client/src/components/tracking/AssetBreakdownView.tsx`  
**Requirements**: FR-011a  
**Implementation**:
- NEW component to display historical asset snapshot
- Props: `assetBreakdown: AssetBreakdown` (decrypted by API)
- Show read-only table of assets from `assetBreakdown.assets` array
- Display capturedAt timestamp (formatted: "Snapshot taken on MM/DD/YYYY at HH:MM")
- Show totals footer: Total Wealth, Zakatable Wealth
- Visual indicator: "Historical Snapshot (not current values)"
- Link to current asset page: "View current assets →"
- Integrate into NisabYearRecordCard for FINALIZED/UNLOCKED status

---

## Alignment with tasks.prompt.md

### ✅ Task Generation Rules Applied
```
4. Task generation rules:
   - Each contract file → contract test task marked [P]
   - Each entity in data-model → model creation task marked [P]
   - Each endpoint → implementation task (not parallel if shared files)
   - Each user story → integration test marked [P]
   - Different files = can be parallel [P]
   - Same file = sequential (no [P])
```

**Applied**:
- T093, T094, T095: Different test files → marked [P]
- T096, T097, T098: Same service files → sequential (no [P])
- T099, T101, T102: Different component files → marked [P]
- T100: Updates existing page → sequential (no [P])

### ✅ Ordering by Dependencies
```
5. Order tasks by dependencies:
   - Setup before everything
   - Tests before implementation (TDD)
   - Models before services
   - Services before endpoints
   - Core before integration
   - Everything before polish
```

**Applied**:
- Tests (T093-T095) come before implementation
- Backend services (T096-T097) before API endpoint (T098)
- Backend (T096-T098) before frontend (T099-T102)
- All implementation before validation (T067-T087)

### ✅ TDD Discipline Enforced
From template:
```
## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
```

**Applied**:
```
### Tests First (TDD) ⚠️ MUST COMPLETE BEFORE Implementation
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [ ] T093 [P] Component test for AssetSelectionTable
      Expected: FAIL (component doesn't exist yet)
- [ ] T094 [P] Integration test for asset refresh workflow
      Expected: FAIL (endpoint doesn't exist yet)
- [ ] T095 [P] Integration test for automatic asset inclusion
      Expected: FAIL (asset snapshot logic doesn't exist yet)
```

---

## Impact on Manual Testing

### Before Reorganization
Manual testing (T067-T073) was blocked because:
- No way to verify asset auto-inclusion was working
- Tests could only validate what existed
- Implementation could proceed without verification

### After Reorganization
Manual testing is properly gated:
```
12. Validation (T067-T087) requires ALL implementation including T093-T102 ⚠️ BLOCKED
```

**Why This Matters**:
- T093-T095 tests verify asset auto-inclusion works correctly
- If tests pass, manual testing scenarios (T067-T073) can proceed confidently
- If tests fail, issue is caught before manual testing wastes time

---

## Next Steps

### 1. Write Tests (T093-T095) [CURRENT]
- [ ] T093: Write component test for AssetSelectionTable
- [ ] T094: Write integration test for asset refresh workflow
- [ ] T095: Write integration test for automatic asset inclusion
- [ ] Commit: "test(008): Add TDD tests for asset auto-inclusion (all failing)"

### 2. Implement Backend (T096-T098)
- [ ] T096: Update HawlTrackingService
- [ ] T097: Update NisabYearRecordService.createRecord()
- [ ] T098: Add refresh endpoint
- [ ] Verify: T094 and T095 integration tests pass
- [ ] Commit: "feat(008): Implement asset auto-inclusion backend"

### 3. Implement Frontend (T099-T102)
- [ ] T099: Create AssetSelectionTable component
- [ ] T100: Update NisabYearRecordsPage
- [ ] T101: Add "Refresh Assets" button
- [ ] T102: Display AssetBreakdownView
- [ ] Verify: T093 component test passes
- [ ] Commit: "feat(008): Implement asset auto-inclusion frontend"

### 4. Execute Manual Testing (T067-T073)
- Now unblocked - all asset auto-inclusion functionality verified by automated tests
- Can confidently test complete workflows end-to-end
- Estimated: 55 minutes for 7 scenarios

---

## Constitutional Compliance

### Principle III: Spec-Driven & Clear Development
✅ **PASS**: Tasks now follow "written, testable specification grounded in authoritative sources"
- Each task has clear acceptance criteria
- Tests written before implementation (verifiable)
- Explicit failure expectations documented

### Principle IV: Quality & Performance
✅ **PASS**: Testing approach ensures quality
- TDD ensures functionality works before declaring complete
- Integration tests verify end-to-end workflows
- Component tests verify UI behavior and accessibility

### Principle II: Professional & Modern UX
✅ **PASS**: Asset auto-inclusion improves UX
- Users see their assets automatically (no manual entry)
- Selection table provides transparency and control
- Historical snapshots preserve context

---

**Summary**: Tasks T093-T102 reorganized to follow Test-Driven Development workflow per tasks.prompt.md instructions. Tests must be written and fail before implementation proceeds. Proper commit checkpoints added. Dependencies clarified. Manual testing properly gated behind automated test verification.
