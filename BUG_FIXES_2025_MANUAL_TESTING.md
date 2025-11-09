# Bug Fixes from Manual Testing Session

**Date**: 2025-01-13  
**Testing Scenario**: T071 (Unlock & Edit Finalized Record)  
**Status**: ✅ All critical bugs fixed

## Summary

During manual testing of T071 (Unlock & Edit scenario), three bugs were discovered:

1. ✅ **FIXED**: Unlock validation error (field name mismatch)
2. ✅ **FIXED**: Nisab threshold showing $0 
3. ⚠️ **NEEDS CLARIFICATION**: Asset display showing "Invalid Date" and zakatable="No"

---

## Bug #1: Unlock Validation Field Name Mismatch

### Problem
When attempting to unlock a finalized record:
- User enters a valid unlock reason (e.g., "I prematurely locked it." - 24 characters)
- Backend returns: "Validation Errors: unlockReason is required"
- Unlock fails despite valid input

### Root Cause
**Field name mismatch between frontend and backend:**
- Frontend sends: `{ reason: "user entered text" }`
- Backend expects: `{ unlockReason: "user entered text" }` (per UnlockRecordDto contract)
- Backend validation at line 479 checks `dto.unlockReason`, which is undefined when receiving `reason`

### Solution
Changed frontend to match backend API contract:

**File 1: `client/src/components/UnlockReasonDialog.tsx` (line 107)**
```typescript
// BEFORE:
const response = await apiService.unlockNisabYearRecord(record.id, {
  reason: reason.trim(),
});

// AFTER:
const response = await apiService.unlockNisabYearRecord(record.id, {
  unlockReason: reason.trim(),
});
```

**File 2: `client/src/services/api.ts` (line 661)**
```typescript
// BEFORE:
async unlockNisabYearRecord(recordId: string, data: {
  reason: string;
}): Promise<ApiResponse>

// AFTER:
async unlockNisabYearRecord(recordId: string, data: {
  unlockReason: string;
}): Promise<ApiResponse>
```

### Testing
- ✅ Unlock dialog accepts reason (10-500 characters)
- ✅ Backend receives `unlockReason` field
- ✅ Validation passes
- ✅ Record status changes to UNLOCKED
- ✅ Audit trail records unlock event with reason

---

## Bug #2: Nisab Threshold Showing $0

### Problem
After creating a Nisab Year Record:
- "Wealth vs Nisab" card displays: "Nisab Threshold: $0"
- Current wealth shows correctly (e.g., "$15,956")
- Prevents accurate Zakat eligibility determination

### Root Cause
**Two issues in Nisab calculation:**

1. **Hook ignores nisabBasis parameter**: `useNisabThreshold()` hook hardcoded `basis=GOLD` in API call, ignoring the `nisabBasis` parameter passed to the hook

2. **Component doesn't pass nisabBasis**: `NisabComparisonWidget` didn't pass `record.nisabBasis` to the hook, using default 'GOLD' for all records regardless of user selection

3. **Broken encrypted fallback**: Component tried to parse encrypted `nisabThresholdAtStart` field as number (encrypted data starts with "base64:" so `parseFloat()` returns NaN or 0)

### Solution

**File 1: `client/src/hooks/useNisabThreshold.ts` (lines 31-38)**
```typescript
// BEFORE:
async function fetchNisabThreshold(currency: string = 'USD'): Promise<NisabThresholdData> {
  const response = await fetch(`/api/zakat/nisab?currency=${currency}&basis=GOLD`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
  });
  // ...
}

// AFTER:
async function fetchNisabThreshold(
  currency: string = 'USD',
  nisabBasis: 'GOLD' | 'SILVER' = 'GOLD'
): Promise<NisabThresholdData> {
  const response = await fetch(`/api/zakat/nisab?currency=${currency}&basis=${nisabBasis}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
  });
  // ...
}
```

**File 2: `client/src/hooks/useNisabThreshold.ts` (line 112)**
```typescript
// BEFORE:
queryFn: () => fetchNisabThreshold(currency),

// AFTER:
queryFn: () => fetchNisabThreshold(currency, nisabBasis),
```

**File 3: `client/src/components/NisabComparisonWidget.tsx` (lines 68-70)**
```typescript
// BEFORE:
const { nisabAmount } = useNisabThreshold(record.currency);

// AFTER:
// Pass nisabBasis from record to hook to get correct Nisab threshold
const nisabBasis = (record.nisabBasis || 'GOLD') as 'GOLD' | 'SILVER';
const { nisabAmount } = useNisabThreshold(record.currency, nisabBasis);
```

**File 4: `client/src/components/NisabComparisonWidget.tsx` (lines 83-96)**
```typescript
// BEFORE:
// Use nisabAmount from hook (freshly fetched), fallback to record data if available
// nisabThresholdAtStart is encrypted in the record, so we prefer the live nisabAmount
let nisab = nisabAmount || 0;

// If nisabAmount is not available and we have a valid record nisabThresholdAtStart value, try to use it
// But only if it looks like a number (not encrypted - which starts with "base64:")
if (nisab === 0 && record.nisabThresholdAtStart) {
  const parsed = parseFloat(record.nisabThresholdAtStart);
  // Only use it if it's a valid number and not 0 (encrypted data often parses to 0)
  if (!isNaN(parsed) && parsed > 0) {
    nisab = parsed;
  }
}

// AFTER:
// Use nisabAmount from hook (freshly fetched based on nisabBasis)
// Note: nisabThresholdAtStart in record is encrypted, so we can't parse it directly
const nisab = nisabAmount || 0;
```

### Testing
- ✅ Create record with GOLD nisab basis → displays correct gold-based threshold
- ✅ Create record with SILVER nisab basis → displays correct silver-based threshold
- ✅ Nisab amount updates when currency changes
- ✅ Comparison calculations work correctly (wealth vs nisab)
- ✅ "Above Nisab" / "Below Nisab" status displays accurately

---

## Bug #3: Asset Display - Invalid Date & Zakatable=No ⚠️

### Problem (As Reported)
After creating a Nisab Year Record:
- Assets show "Invalid Date" for added date
- Assets show "No" for zakatable status
- After clicking "Refresh Assets" button, data displays correctly

### Investigation Findings

**Asset Data Flow:**
1. **Create Flow**: User selects assets → backend captures snapshot → encrypts assetBreakdown → stores in DB
2. **Display Flow**: Frontend fetches record with encrypted assetBreakdown → ???
3. **Refresh Flow**: Frontend fetches fresh assets from `/api/nisab-year-records/:id/assets/refresh` → displays in AssetSelectionTable

**Code Analysis:**
- ✅ Backend properly formats dates: `addedAt: asset.addedAt.toISOString()` (line 102 in nisabYearRecordService.ts)
- ✅ Refresh endpoint returns correct format: `addedAt: asset.addedAt.toISOString()` (line 360 in routes)
- ✅ AssetSelectionTable expects `addedAt: string` and formats with `formatDate()`
- ⚠️ `assetBreakdown` field in record is **encrypted** and not decrypted anywhere in the frontend
- ⚠️ No component found that displays `record.assetBreakdown.assets` directly

**Potential Scenarios:**
1. **Not a bug**: Assets aren't displayed immediately after creation (only in refresh modal), so user might be confused about when/where they see assets
2. **Live data issue**: Some computed field (`liveHawlData`?) attempts to show asset info incorrectly
3. **Stale query**: Frontend uses cached/stale data briefly before refetch completes

### Questions for User
❓ **Where exactly do you see the "Invalid Date" and zakatable="No"?**
- [ ] In the record list/card view?
- [ ] In a record details panel?
- [ ] In a specific component (which one)?
- [ ] Immediately after clicking "Create Record" button?
- [ ] After closing the create modal?

❓ **Can you provide a screenshot showing the "Invalid Date" and zakatable="No"?**

### Recommendation
**Cannot fix without clarification** - unable to reproduce or locate the problematic display logic. Need to identify:
1. Which component/view shows the incorrect data
2. What data source it's using (record.assetBreakdown? liveHawlData? other?)
3. How to reproduce the exact steps

---

## Files Changed

### Frontend Changes
1. `client/src/components/UnlockReasonDialog.tsx` - Fixed unlock field name
2. `client/src/services/api.ts` - Updated interface for unlock method
3. `client/src/hooks/useNisabThreshold.ts` - Fixed nisabBasis parameter handling
4. `client/src/components/NisabComparisonWidget.tsx` - Pass nisabBasis to hook, remove broken fallback

### Backend Changes
None required - backend was working correctly per API contract

---

## Testing Checklist

### Bug #1: Unlock Validation ✅
- [x] Verify unlock dialog opens for FINALIZED record
- [x] Enter valid unlock reason (10-500 characters)
- [x] Submit unlock request
- [x] Verify no validation error
- [x] Verify record status changes to UNLOCKED
- [x] Verify unlock reason recorded in audit trail
- [x] Verify unlock timestamp recorded

### Bug #2: Nisab Threshold ✅
- [x] Create new record with GOLD nisab basis
- [x] Verify "Wealth vs Nisab" card shows non-zero Nisab amount
- [x] Verify Nisab amount matches current gold price × 85g
- [x] Create record with SILVER nisab basis
- [x] Verify Nisab amount matches silver price × 595g
- [x] Verify comparison calculations accurate

### Bug #3: Asset Display ⏸️
- [ ] **PENDING USER CLARIFICATION** - Cannot test without knowing where issue occurs

---

## Next Steps

1. ✅ **Commit fixes** for Bug #1 and Bug #2
2. ⏸️ **Get clarification** on Bug #3 from user
3. 🔄 **Continue manual testing** T067-T073 scenarios
4. 📝 **Document test results** in MANUAL_TESTING_EXECUTION_GUIDE.md
5. ✅ **Mark T067-T073 complete** in tasks.md when all scenarios pass

---

## Commit Message Template

```
fix: resolve unlock validation and Nisab $0 bugs found in manual testing

Bug #1 - Unlock Validation:
- Fix field name mismatch (reason → unlockReason)
- Update UnlockReasonDialog and API service
- Align with backend UnlockRecordDto contract

Bug #2 - Nisab $0 Display:
- Fix useNisabThreshold to respect nisabBasis parameter
- Update NisabComparisonWidget to pass record.nisabBasis
- Remove broken encrypted field fallback logic
- Ensure correct threshold calculated for GOLD/SILVER basis

Bug #3 - Asset Display:
- Pending user clarification on exact location of issue

Tested: Manual testing scenario T071
Ref: BUG_FIXES_2025_MANUAL_TESTING.md
```

---

## Related Files
- `MANUAL_TESTING_EXECUTION_GUIDE.md` - Manual testing documentation
- `tasks.md` - Task T067-T073 (Manual Testing Scenarios)
- `specs/001-zakapp-specification-complete/contracts/nisab-year-records.md` - API contracts
- `specs/001-zakapp-specification-complete/spec.md` - Feature specifications
