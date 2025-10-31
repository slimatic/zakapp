# Asset Auto-Inclusion Implementation Tasks

**Created**: 2025-10-31  
**Context**: Clarification session identified missing asset auto-inclusion functionality blocking manual testing  
**Branch**: `008-nisab-year-record`  
**Related Commits**: 
- `5dfcb9f` - Clarification session updates to spec.md
- `d95e161` - New tasks T093-T102 added to tasks.md

---

## Problem Statement

User reported: "When creating my Nisab Year Record, I was expecting to see it pull the assets I created into my record. But I don't see it reflecting my assets. Instead I am seeing that I have to manually enter that information."

**Root Cause**: The specification described wealth aggregation (FR-028 to FR-035) but did not specify how assets should be presented during record creation. The UI shows manual entry fields instead of automatic asset inclusion.

---

## Clarifications Captured

### Session 2025-10-31

1. **Q**: When creating a Nisab Year Record, what should happen with existing assets?  
   **A**: Show asset breakdown - Display a detailed list/table of all assets with their values, allow selection/deselection, then calculate totals

2. **Q**: For DRAFT records that update with live wealth tracking, should asset selection persist or recalculate?  
   **A**: Manual refresh - DRAFT stays with original selection, but user can click "Refresh assets" button to update the selection list

3. **Q**: Should the asset breakdown be stored in the database or calculated on-demand?  
   **A**: Store snapshot - Save the exact asset list with values at creation/refresh time in assetBreakdown JSON field; show historical snapshot

4. **Q**: When should automatic Hawl detection trigger record creation?  
   **A**: Background creates full record - Job automatically selects all zakatable assets, populates assetBreakdown snapshot, creates complete DRAFT record (user can edit via "Refresh Assets")

---

## New Requirements Added to spec.md

**FR-038a**: Display asset breakdown with selection capability in record creation UI  
- **Priority**: CRITICAL | **Status**: ❌ Missing Implementation  
- **Acceptance**: When creating a Nisab Year Record, show detailed list/table of all user assets with current values, allow selection/deselection of individual assets, automatically calculate totals (Total Wealth, Zakatable Wealth, Zakat Amount) based on selected assets, pre-select all zakatable assets by default

**FR-032a**: Provide manual asset refresh for DRAFT records  
- **Priority**: HIGH | **Status**: ❌ Missing Implementation  
- **Acceptance**: DRAFT records preserve originally selected assets; provide "Refresh Assets" button that reloads current asset list with updated values and allows user to adjust selection; recalculate totals based on new selection

**FR-011a**: Store asset breakdown snapshot in `assetBreakdown` JSON field  
- **Priority**: CRITICAL | **Status**: ❌ Missing Implementation  
- **Acceptance**: When creating or refreshing a Nisab Year Record, save complete snapshot of selected assets in encrypted `assetBreakdown` JSON field with structure: `{ assets: [{ id, name, category, value, isZakatable, addedAt }], capturedAt: timestamp, totalWealth: number, zakatableWealth: number }`; never recalculate historical values, always display from snapshot

**FR-014**: Automatically create DRAFT Nisab Year Record when Nisab achieved  
- **Priority**: CRITICAL | **Status**: ⚠️ Partial Implementation (updated)  
- **Acceptance**: Record includes all required Hawl fields, status set to DRAFT, user notified, **automatically selects all zakatable assets and populates assetBreakdown snapshot with current values** (user can modify via "Refresh Assets" button later)

---

## Implementation Tasks (T093-T102)

### Backend Tasks

**T093**: Update HawlTrackingService to populate assetBreakdown snapshot  
- **File**: `server/src/services/HawlTrackingService.ts`
- **Requirements**: FR-014, FR-011a
- **Description**: 
  - When creating DRAFT record via Nisab achievement detection
  - Fetch all zakatable assets for user via WealthAggregationService
  - Build assetBreakdown JSON structure
  - Encrypt assetBreakdown JSON via EncryptionService
  - Store in nisabYearRecord.assetBreakdown field
- **Estimated**: 2 hours

**T094**: Add asset refresh endpoint  
- **File**: `server/src/routes/nisabYearRecords.ts`
- **Endpoint**: `GET /api/nisab-year-records/:id/assets/refresh`
- **Requirements**: FR-032a
- **Description**:
  - Validate record is DRAFT status (return 400 if FINALIZED/UNLOCKED)
  - Fetch current zakatable assets for user
  - Return asset list with current values (don't persist yet)
  - Allow frontend to display for user review/selection
- **Estimated**: 1.5 hours

**T095**: Update NisabYearRecordService.createRecord() to accept asset selection  
- **File**: `server/src/services/NisabYearRecordService.ts`
- **Requirements**: FR-038a, FR-011a
- **Description**:
  - Add optional `selectedAssetIds?: string[]` parameter
  - If provided, filter assets to only selected ones
  - Build assetBreakdown snapshot from selected assets
  - Encrypt and store in record
  - If not provided, auto-select all zakatable assets (background job behavior)
- **Estimated**: 2 hours

### Frontend Tasks

**T096**: Create AssetSelectionTable component [P]  
- **File**: `client/src/components/tracking/AssetSelectionTable.tsx`
- **Requirements**: FR-038a
- **Description**:
  - Display table with columns: [Checkbox, Name, Category, Value, Zakatable Status, Added Date]
  - Pre-select all zakatable assets by default
  - Allow selection/deselection via checkboxes
  - Show calculated totals: Total Wealth, Zakatable Wealth, Zakat Amount (2.5%)
  - Update totals in real-time as selection changes
  - Accessibility: WCAG 2.1 AA (keyboard nav, ARIA labels, screen reader support)
- **Estimated**: 3 hours

**T097**: Add "Refresh Assets" button to NisabYearRecordCard [P]  
- **File**: `client/src/components/tracking/NisabYearRecordCard.tsx`
- **Requirements**: FR-032a
- **Description**:
  - Show button only for DRAFT status records
  - On click, call GET /api/nisab-year-records/:id/assets/refresh
  - Open AssetSelectionTable modal with current assets
  - Allow user to update selection
  - On confirm, call PUT /api/nisab-year-records/:id with new assetBreakdown
  - Show loading state during API calls
- **Estimated**: 2 hours

**T098**: Update NisabYearRecordsPage to integrate AssetSelectionTable  
- **File**: `client/src/pages/NisabYearRecordsPage.tsx`
- **Requirements**: FR-038a
- **Description**:
  - When creating new record, fetch user's current assets
  - Display AssetSelectionTable before showing financial input fields
  - Auto-populate Total Wealth, Zakatable Wealth, Zakat Amount from selection
  - Make financial fields read-only (calculated from assets)
  - Pass selectedAssetIds to API when creating record
- **Estimated**: 2 hours

**T099**: Display asset breakdown snapshot (read-only) for FINALIZED records [P]  
- **File**: `client/src/components/tracking/AssetBreakdownView.tsx` (NEW)
- **Requirements**: FR-011a
- **Description**:
  - NEW component to display historical asset snapshot
  - Show table of assets from assetBreakdown JSON (decrypted)
  - Display capturedAt timestamp
  - Show totals: Total Wealth, Zakatable Wealth
  - Indicate this is historical snapshot (not current values)
  - Link to current asset page if user wants to compare
- **Estimated**: 2 hours

### Testing Tasks

**T100**: Component test for AssetSelectionTable [P]  
- **File**: `client/tests/components/AssetSelectionTable.test.tsx`
- **Description**:
  - Test selection/deselection functionality
  - Test total calculations update correctly
  - Test pre-selection of zakatable assets
  - Test accessibility (keyboard nav, ARIA)
- **Estimated**: 1 hour

**T101**: Integration test for asset refresh workflow [P]  
- **File**: `server/tests/integration/assetRefresh.test.ts`
- **Requirements**: FR-032a
- **Description**:
  - Create DRAFT record with initial asset snapshot
  - Add new asset to user
  - Call refresh endpoint
  - Verify new asset appears in response
  - Update record with new selection
  - Verify assetBreakdown updated correctly
- **Estimated**: 1.5 hours

**T102**: Integration test for automatic asset inclusion in background job [P]  
- **File**: `server/tests/integration/hawlDetectionAssets.test.ts`
- **Requirements**: FR-014, FR-011a
- **Description**:
  - Create assets for user that exceed Nisab
  - Run Hawl detection job
  - Verify DRAFT record created with assetBreakdown populated
  - Verify all zakatable assets included in snapshot
  - Verify totals match aggregate wealth calculation
- **Estimated**: 1.5 hours

---

## Execution Strategy

### Phase 3.5.1: Asset Auto-Inclusion Implementation

**Dependencies**:
- Requires Phase 3.4 (Services) complete: T041-T045 ✅
- Requires Phase 3.5 (Frontend) base complete: T057-T066 ✅
- Must complete BEFORE Phase 3.6 (Validation): T067-T073 ❌ BLOCKED

**Parallelization Opportunities**:
- Backend tasks T093-T095 can run sequentially (modify related services)
- Frontend components T096, T097, T099 can run in parallel [P] (independent files)
- Testing tasks T100, T101, T102 can run in parallel [P] (independent files)

**Suggested Order**:
1. **Backend First** (T093-T095): 5.5 hours
   - T093: HawlTrackingService asset snapshot
   - T095: NisabYearRecordService asset selection
   - T094: Asset refresh API endpoint

2. **Frontend Parallel** (T096-T099): 9 hours (or 3 hours with 3 developers)
   - T096, T097, T099 in parallel [P]
   - T098 after T096 complete (depends on AssetSelectionTable)

3. **Testing Parallel** (T100-T102): 4 hours (or 1.5 hours with 3 testers)
   - All 3 can run in parallel [P]

**Total Estimated Time**:
- Sequential: 18.5 hours
- With parallelization: 10.5 hours (3 developers + 3 testers)
- Solo developer: 18.5 hours

---

## Asset Breakdown JSON Structure

```typescript
interface AssetBreakdown {
  assets: Array<{
    id: string;              // Asset ID from assets table
    name: string;            // Asset name (e.g., "BTC", "Savings Account")
    category: string;        // Asset category (e.g., "crypto", "cash")
    value: number;           // Asset value at snapshot time
    isZakatable: boolean;    // Whether asset is zakatable
    addedAt: string;         // ISO date when asset was added to user's portfolio
  }>;
  capturedAt: string;        // ISO date when snapshot was taken
  totalWealth: number;       // Sum of all selected asset values
  zakatableWealth: number;   // Sum of zakatable asset values only
}
```

**Storage**: Encrypted as JSON string in `nisab_year_records.assetBreakdown` field

---

## Impact on Manual Testing (T067-T073)

### Before Implementation:
❌ **BLOCKED** - Manual testing scenarios cannot be executed reliably because:
- Creating a Nisab Year Record requires manual entry of financial data
- No way to verify asset aggregation is working correctly
- Cannot test "Refresh Assets" functionality (doesn't exist)
- Historical records don't show which assets were included

### After Implementation:
✅ **UNBLOCKED** - Manual testing scenarios can proceed:
- T067: Can verify automatic Nisab achievement detection creates record with assets
- T068: Can verify live tracking updates DRAFT record calculations
- T069: Can verify Hawl interruption detection with asset changes
- T070: Can verify finalization locks asset snapshot
- T071: Can verify unlock/edit preserves asset breakdown history
- T072: Can verify invalid operations (e.g., refresh finalized record returns error)
- T073: Can verify Nisab threshold calculation matches asset values

---

## Acceptance Criteria

**Definition of Done for Phase 3.5.1**:
- [ ] All 10 tasks (T093-T102) marked complete
- [ ] AssetSelectionTable component renders with mock data
- [ ] "Refresh Assets" button appears on DRAFT records only
- [ ] Manual record creation shows asset selection UI
- [ ] Background Hawl detection creates records with asset snapshots
- [ ] Asset breakdown JSON structure matches specification
- [ ] All data encrypted properly (assetBreakdown field)
- [ ] All 3 integration tests pass
- [ ] Component test for AssetSelectionTable passes
- [ ] Accessibility verified (keyboard nav, screen readers)
- [ ] Manual smoke test: Create record, select assets, verify totals calculate

---

## Next Steps

1. **Review & Prioritize**: Confirm these 10 tasks are the correct approach
2. **Backend Implementation**: Start with T093-T095 (backend foundation)
3. **Frontend Implementation**: Implement T096-T099 (UI components)
4. **Testing**: Execute T100-T102 (verify functionality)
5. **Manual Testing**: Proceed to T067-T073 after Phase 3.5.1 complete
6. **Commit**: Use checkpoint: "feat(008): Complete Phase 3.5.1 asset auto-inclusion"

---

**Status**: ✅ Tasks defined and ready for implementation  
**Blocking**: T067-T073 manual testing scenarios  
**Estimated**: 8-10 hours additional development time  
**Commit**: Tasks added in commit `d95e161`
