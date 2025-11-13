# Phase 3.6: Validation & Testing - Test Plan

**Phase Status**: ⏳ IN PROGRESS  
**Execution Date**: 2025-01-20  
**Total Tests**: 27 (7 quickstart scenarios + 5 performance tests + 5 accessibility audits + 4 compliance checks + 1 checkpoint)

---

## Overview

Phase 3.6 validates that all Feature 008 implementation (Phases 3.1-3.5) works correctly end-to-end. This includes manual workflow testing, performance validation, accessibility compliance, and Islamic compliance verification.

### Prerequisites Verified
- ✅ Backend running (server on :5000)
- ✅ Frontend running (client on :3000)
- ✅ Phase 3.1-3.5 fully implemented and committed
- ✅ Database migrations applied
- ✅ Test user accounts available
- ✅ Sample assets loaded (or creatable)

---

## T067-T073: Quickstart Scenarios (Manual Testing)

**Format**: Manual end-to-end workflow tests  
**Total Time**: ~60 minutes (7 scenarios × 8-10 min each)  
**Status**: ⏳ READY TO EXECUTE

### T067: First-Time Nisab Achievement & Hawl Start (~10 min)

**Goal**: System automatically detects Nisab achievement and creates DRAFT record

**Steps**:
1. Login to `/login` as test user
2. Navigate to `/assets`
3. Add assets:
   - Cash: $2000 (Add → Cash → 2000 USD)
   - Gold: 50g (~$3500) (Add → Gold → 50g)
   - Bank: $1500 (Add → Cash → 1500 USD)
   - **Total**: $7000 (> $5000 Nisab)
4. Trigger Hawl detection (wait ~1 hour or manually via API endpoint if available)
5. Navigate to `/nisab-year-records`
6. **Verify**:
   - ✅ New DRAFT record appears
   - ✅ Status badge shows "DRAFT"
   - ✅ "Live" indicator visible
   - ✅ Hawl start date displays (today's date, Hijri + Gregorian)
   - ✅ Hawl completion date = today + 354 days
7. Navigate to `/dashboard`
8. **Verify**:
   - ✅ "Hawl in progress: 354 days remaining" message
   - ✅ HawlProgressIndicator shows progress (0%)
   - ✅ NisabComparisonWidget shows "$7000 (140% of Nisab)"

**Success Criteria**: ✅ All verifications pass

---

### T068: Live Tracking During Hawl (~8 min)

**Goal**: Verify live wealth updates without persisting to database

**Steps**:
1. Open `/nisab-year-records` with active DRAFT record
2. Note current wealth: e.g., "$7000"
3. Open new browser tab → Navigate to `/assets`
4. Click edit on a cash asset → Increase by $1000 → Save
5. Return to Nisab Year Records tab
6. Wait 5 seconds (polling interval)
7. **Verify**:
   - ✅ Wealth updated to "$8000"
   - ✅ Zakat recalculated: "$8000 × 2.5% = $200"
   - ✅ "Live" badge still visible
   - ✅ Edit timestamps NOT changed
8. Refresh page → **Verify**:
   - ✅ Wealth reverts to "$7000" (live data, not persisted)

**Success Criteria**: ✅ All verifications pass

---

### T069: Wealth Falls Below Nisab (Interruption) (~7 min)

**Goal**: Verify Hawl interruption when wealth drops

**Steps**:
1. From previous scenario, with $7000 wealth
2. Navigate to `/assets`
3. Delete gold asset ($3500 equivalent)
4. **Total wealth**: $3500 (< $5000 Nisab)
5. Trigger Hawl detection (wait or manual trigger)
6. Navigate to `/nisab-year-records`
7. **Verify**:
   - ✅ DRAFT record shows "Hawl Interrupted" or moves to archived
   - ✅ Warning message visible
   - ✅ Dashboard shows "No active Hawl"

**Success Criteria**: ✅ All verifications pass

---

### T070: Hawl Completion & Finalization (~10 min)

**Goal**: Verify finalization workflow when Hawl completes

**Steps**:
1. Create new DRAFT record (or use existing)
2. Manually update database:
   ```sql
   UPDATE nisab_year_records 
   SET hawlCompletionDate = NOW() - INTERVAL '1 day'
   WHERE status = 'DRAFT' LIMIT 1;
   ```
3. Refresh page → Navigate to `/nisab-year-records`
4. **Verify**: Record shows "Can be finalized" or "Ready for finalization"
5. Click "Finalize" button
6. **Verify Modal displays**:
   - ✅ Hawl dates (start + completion)
   - ✅ Total zakatable wealth
   - ✅ Liabilities field (editable)
   - ✅ Zakat calculation (2.5%)
   - ✅ "Confirm finalization?" checkbox
7. Edit liabilities: Add $500
8. **Verify**: Zakat recalculated: ($7000 - $500) × 2.5% = $162.50
9. Check confirmation box
10. Click "Finalize"
11. **Verify**:
    - ✅ Modal closes
    - ✅ Record status changed to "FINALIZED"
    - ✅ "Finalized on [date]" badge shows
    - ✅ Lock icon visible
    - ✅ "Live" indicator gone
    - ✅ Edit buttons disabled

**Success Criteria**: ✅ All verifications pass

---

### T071: Unlock & Edit Finalized Record (~8 min)

**Goal**: Verify unlock workflow with reason capture

**Steps**:
1. From previous scenario, with FINALIZED record
2. Click "Unlock for Editing" button
3. **Verify Dialog**:
   - ✅ Asks for unlock reason
   - ✅ Character counter visible
   - ✅ Minimum 10 characters enforced
4. Enter reason: "Correcting gold weight from 50g to 55g"
5. Click "Unlock"
6. **Verify**:
   - ✅ Status changed to "UNLOCKED"
   - ✅ Warning banner shows
   - ✅ Edit buttons enabled
7. Edit assets (increase gold value)
8. Click "Re-finalize"
9. Confirm
10. **Verify**:
    - ✅ Status back to "FINALIZED"
    - ✅ New "Finalized on" timestamp
11. Click "View Audit Trail"
12. **Verify Audit Events**:
    - ✅ FINALIZED (initial)
    - ✅ UNLOCKED (with reason)
    - ✅ EDITED (if changes made)
    - ✅ REFINALIZED (new finalization)

**Success Criteria**: ✅ All verifications pass

---

### T072: Invalid Operations (Error Handling) (~5 min)

**Goal**: Verify error handling for invalid operations

**Steps**:

**Test 1: Premature Finalization**
1. Create/navigate to DRAFT with future completion date
2. Click "Finalize"
3. **Verify**: Error message: "Cannot finalize: Hawl incomplete. X days remaining."

**Test 2: Short Unlock Reason**
1. Navigate to FINALIZED record
2. Click "Unlock"
3. Enter: "Error" (5 chars)
4. **Verify**: Error: "Minimum 10 characters required"

**Test 3: Invalid Status Transition**
1. Via API: POST `/api/nisab-year-records/[id]` with invalid status
2. **Verify**: 400 error: "INVALID_TRANSITION"

**Test 4: Delete FINALIZED**
1. FINALIZED record
2. Attempt delete (if button available)
3. **Verify**: Error or button disabled

**Success Criteria**: ✅ All error messages appropriate and helpful

---

### T073: Nisab Threshold Calculation (~7 min)

**Goal**: Verify Nisab threshold fetching and calculation

**Steps**:
1. Open `/nisab-year-records` (create new if needed)
2. **Verify** displayed Nisab threshold:
   - Check system logs or API for: 87.48g gold = $[X] USD
   - Or: 612.36g silver = $[Y] USD
3. Add assets totaling > Nisab
4. **Verify**:
   - ✅ NisabComparisonWidget shows correct threshold
   - ✅ Percentage calculation correct
   - ✅ "Above/Below Nisab" indicator correct
5. Check Nisab price update:
   - Navigate to `/nisab-year-records`
   - **Verify**: "Last updated: X days ago" message
   - If >7 days: "⚠ Prices may be stale"

**Success Criteria**: ✅ Nisab calculations match scholarly sources

---

## T074-T078: Performance Validation

**Acceptance Criteria**: All tests must pass without errors

### T074: Wealth Aggregation (<100ms for 500 assets)

```bash
# Test: Fetch NisabYearRecord with 500 assets
curl -H "Authorization: Bearer [TOKEN]" \
  http://localhost:5000/api/nisab-year-records/[RECORD_ID]

# Measure response time
# Expected: <100ms
```

**Status**: ⏳ Ready to test

---

### T075: Precious Metals API Call (<2s with cache)

```bash
# First call (cache miss)
time curl http://localhost:5000/api/zakat/nisab

# Second call (cache hit)
time curl http://localhost:5000/api/zakat/nisab

# Expected: First <2s, Second <50ms
```

**Status**: ⏳ Ready to test

---

### T076: Dashboard Page Load (<2s)

Open DevTools → Network tab → Navigate to `/dashboard`

- **Expected**: Page load <2s
- **Expected**: All components render <3s
- **Measure**: DOMContentLoaded event

**Status**: ⏳ Ready to test

---

### T077: Live Tracking Latency (<500ms perceived as instant)

1. Open `/nisab-year-records` in DevTools console
2. Note time
3. Edit asset value in other tab
4. Measure when value updates in first tab
5. **Expected**: <500ms

**Status**: ⏳ Ready to test

---

### T078: Background Hawl Detection Job (<30s completion)

```bash
# Manually trigger job if available
curl -X POST http://localhost:5000/api/admin/jobs/hawl-detection

# Measure execution time
# Expected: <30s
```

**Status**: ⏳ Ready to test

---

## T079-T083: Accessibility Audit (WCAG 2.1 AA)

**Tool**: WAVE, axe DevTools, or manual testing  
**Target**: WCAG 2.1 AA compliance on all new components

### T079: HawlProgressIndicator

**Checks**:
- ✅ Keyboard navigation: Tab through all elements
- ✅ Screen reader: Progress bar labeled correctly
- ✅ Color contrast: Progress bar meets 4.5:1 ratio
- ✅ Focus indicator: Visible on all interactive elements
- ✅ ARIA labels: Progress percentage announced

**Status**: ⏳ Ready to audit

---

### T080: NisabComparisonWidget

**Checks**:
- ✅ Alt text on status icons
- ✅ ARIA labels on wealth/Nisab amounts
- ✅ Color not only means (green/red paired with text)
- ✅ Proper heading hierarchy
- ✅ Data table (if applicable) properly marked up

**Status**: ⏳ Ready to audit

---

### T081: FinalizationModal

**Checks**:
- ✅ Focus trap in modal
- ✅ ESC key closes modal
- ✅ Focus moves to first form field
- ✅ Error messages announced to screen readers
- ✅ Proper label associations (for="id")

**Status**: ⏳ Ready to audit

---

### T082: UnlockReasonDialog

**Checks**:
- ✅ Character counter accessible
- ✅ Error messages with aria-invalid
- ✅ aria-describedby links to error text
- ✅ role="alert" on error messages
- ✅ Keyboard navigable

**Status**: ⏳ Ready to audit

---

### T083: AuditTrailView

**Checks**:
- ✅ Semantic HTML structure
- ✅ List markup for audit events
- ✅ Color contrast on event badges
- ✅ Timestamps readable (no abbreviations)
- ✅ Expand/collapse buttons accessible

**Status**: ⏳ Ready to audit

---

## T084-T087: Islamic Compliance Verification

### T084: Nisab Thresholds

**Verify**:
- ✅ Gold: 87.48 grams (scholarly sources)
- ✅ Silver: 612.36 grams (scholarly sources)
- ✅ Correctly configured in backend
- ✅ Display matches configured values

**Reference**: Islamic scholars (Ibn Qudama, Al-Nawawi, etc.)

**Status**: ⏳ Ready to verify

---

### T085: Hawl Duration

**Verify**:
- ✅ 354 days lunar year (not 365 solar)
- ✅ Hijri calendar calculations correct
- ✅ moment-hijri library used correctly
- ✅ Completion date = start + 354 days

**Reference**: Qur'an 9:36, hadith collections

**Status**: ⏳ Ready to verify

---

### T086: Zakat Rate

**Verify**:
- ✅ 2.5% rate applied correctly
- ✅ Rate applied to entire base (not excess above Nisab)
- ✅ Calculation: Zakat = Total × 0.025
- ✅ No exceptions or modifiers

**Reference**: Qur'an 2:277, hadith on Zakat rate

**Status**: ⏳ Ready to verify

---

### T087: Educational Content Alignment

**Verify**:
- ✅ In-context help explains Nisab
- ✅ In-context help explains Hawl
- ✅ References "Simple Zakat Guide" or scholarly sources
- ✅ No contradictions with Islamic principles
- ✅ Clear language for non-experts

**Reference**: "Simple Zakat Guide" video series + Simple Islam

**Status**: ⏳ Ready to verify

---

## Checkpoint: Validation Complete

**All tests passing**: Mark as ✅ READY FOR PHASE 3.7

**Blockers identified**: Document in GitHub issues

---

## Next Phase: Phase 3.7 Documentation

Once validation complete, proceed to:
- T088: API documentation
- T089: Educational content
- T090: User guide
- T091: Deployment guide

---

**Phase 3.6 Status**: ⏳ PENDING EXECUTION  
**Estimated Completion**: ~3-4 hours (1 hour scenarios, 1 hour performance, 1 hour accessibility, 30 min compliance)  
**Ready**: YES - All prerequisites met, all implementation phases complete
