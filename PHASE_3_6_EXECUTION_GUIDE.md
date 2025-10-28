# Phase 3.6 Execution Guide: Running Validation Tests

**Status**: ⏳ READY TO EXECUTE  
**Estimated Duration**: 3-4 hours  
**Test Coverage**: 27 automated + manual tests  
**Success Criteria**: All tests passing

---

## Quick Start

```bash
# 1. Ensure backend is running
cd /home/lunareclipse/zakapp
npm run dev:backend  # Terminal 1

# 2. Ensure frontend is running
npm run dev:frontend  # Terminal 2

# 3. Run validation tests (this guide)
open PHASE_3_6_VALIDATION_PLAN.md
```

---

## Test Execution Checklist

### Pre-Test Setup (5 min)

- [ ] Verify backend running on localhost:5000
  ```bash
  curl http://localhost:5000/health
  # Expected: {"status":"ok"}
  ```

- [ ] Verify frontend running on localhost:3000
  ```bash
  curl http://localhost:3000
  # Expected: HTML response (no error)
  ```

- [ ] Login to frontend as test user
  - Navigate to `http://localhost:3000/login`
  - Use test credentials

- [ ] Database seeded with sample data
  ```bash
  npx prisma db seed  # If seed script exists
  ```

---

## Manual Test Execution (T067-T073)

### Scenario 1: Nisab Achievement (T067)

**Duration**: ~10 minutes  
**Purpose**: Verify Hawl creation on Nisab achievement

**Execute**:
```
1. [ ] Login: http://localhost:3000/login
2. [ ] Go to: http://localhost:3000/assets
3. [ ] Add 3 assets to exceed ~$5000 Nisab:
   - [ ] Cash $2000
   - [ ] Gold 50g (~$3500 value)
   - [ ] Bank $1500
4. [ ] Trigger Hawl detection (manual API or wait ~1 hour)
   API: POST /api/admin/jobs/hawl-detection (if available)
5. [ ] Navigate to: http://localhost:3000/nisab-year-records
6. [ ] Verify:
   [ ] DRAFT record created
   [ ] Status badge shows "DRAFT"
   [ ] "Live" indicator visible
   [ ] Hawl start date = today
   [ ] Hawl completion date = today + 354 days
7. [ ] Go to: http://localhost:3000/dashboard
8. [ ] Verify:
   [ ] "Hawl in progress" message
   [ ] Progress bar shown
   [ ] Nisab comparison widget displayed
```

**Result**: ✅ PASS / ❌ FAIL
**Notes**: _________________

---

### Scenario 2: Live Tracking (T068)

**Duration**: ~8 minutes  
**Purpose**: Verify wealth updates without persistence

**Execute**:
```
1. [ ] Open: http://localhost:3000/nisab-year-records (Tab 1)
2. [ ] Note current wealth (e.g., $7000)
3. [ ] Open new tab (Tab 2): http://localhost:3000/assets
4. [ ] Edit an asset: +$1000 (e.g., cash $2000 → $3000)
5. [ ] Click Save
6. [ ] Return to Tab 1
7. [ ] Wait 5 seconds (polling interval)
8. [ ] Verify:
   [ ] Wealth updated to $8000
   [ ] Zakat recalculated: $200
   [ ] "Live" badge present
   [ ] Timestamps unchanged
9. [ ] Refresh Tab 1 page
10. [ ] Verify:
    [ ] Wealth reverts to $7000 (not persisted)
```

**Result**: ✅ PASS / ❌ FAIL
**Notes**: _________________

---

### Scenario 3: Hawl Interruption (T069)

**Duration**: ~7 minutes  
**Purpose**: Verify handling when wealth drops below Nisab

**Execute**:
```
1. [ ] From Scenario 2, go to: http://localhost:3000/assets
2. [ ] Delete gold asset ($3500 equivalent)
3. [ ] Total wealth now: $3500 (< $5000 Nisab)
4. [ ] Trigger Hawl detection (manual or wait ~1 hour)
5. [ ] Navigate to: http://localhost:3000/nisab-year-records
6. [ ] Verify:
   [ ] Record shows "Interrupted" or archived
   [ ] Status badge reflects interruption
   [ ] Dashboard shows no active Hawl
```

**Result**: ✅ PASS / ❌ FAIL
**Notes**: _________________

---

### Scenario 4: Hawl Completion & Finalization (T070)

**Duration**: ~10 minutes  
**Purpose**: Verify finalization workflow

**Execute**:
```
1. [ ] Create new DRAFT record (or use existing from Scenario 1)
2. [ ] Manually set completion date to yesterday:
   SQLite: UPDATE nisab_year_records SET hawlCompletionDate = date('now', '-1 day')
           WHERE status = 'DRAFT' LIMIT 1;
3. [ ] Refresh: http://localhost:3000/nisab-year-records
4. [ ] Click "Finalize" button
5. [ ] Verify Modal:
   [ ] Shows Hawl start date
   [ ] Shows Hawl completion date
   [ ] Shows total wealth
   [ ] Shows deductible liabilities field (editable)
   [ ] Shows Zakat calculation (2.5%)
   [ ] "Confirm finalization" checkbox present
6. [ ] Edit liabilities: +$500
7. [ ] Verify Zakat recalculated: ($7000 - $500) × 2.5% = $162.50
8. [ ] Check "Confirm" checkbox
9. [ ] Click "Finalize" button
10. [ ] Verify:
    [ ] Modal closes
    [ ] Status changed to "FINALIZED"
    [ ] "Finalized on [date]" badge visible
    [ ] Lock icon visible
    [ ] "Live" indicator gone
    [ ] Edit buttons disabled
```

**Result**: ✅ PASS / ❌ FAIL
**Notes**: _________________

---

### Scenario 5: Unlock & Edit (T071)

**Duration**: ~8 minutes  
**Purpose**: Verify unlock workflow with audit trail

**Execute**:
```
1. [ ] From Scenario 4, view FINALIZED record
2. [ ] Click "Unlock for Editing"
3. [ ] Verify Dialog:
   [ ] Asks for unlock reason
   [ ] Character counter visible
   [ ] "Unlock" button disabled until 10+ chars
4. [ ] Enter reason: "Correcting gold weight from 50g to 55g" (>10 chars)
5. [ ] Click "Unlock"
6. [ ] Verify:
   [ ] Status changed to "UNLOCKED"
   [ ] Warning banner displayed
   [ ] Edit buttons now enabled
7. [ ] Edit an asset value
8. [ ] Click "Re-finalize"
9. [ ] Confirm finalization
10. [ ] Verify:
    [ ] Status back to "FINALIZED"
    [ ] New timestamp recorded
11. [ ] Click "View Audit Trail"
12. [ ] Verify Timeline:
    [ ] Event 1: FINALIZED (initial)
    [ ] Event 2: UNLOCKED (with reason shown)
    [ ] Event 3: EDITED (if changes made)
    [ ] Event 4: REFINALIZED
    [ ] All with correct timestamps and user ID
```

**Result**: ✅ PASS / ❌ FAIL
**Notes**: _________________

---

### Scenario 6: Invalid Operations (T072)

**Duration**: ~5 minutes  
**Purpose**: Verify error handling

**Execute**:
```
Test A: Premature Finalization
1. [ ] Create DRAFT with future completion date
2. [ ] Attempt "Finalize"
3. [ ] Verify Error: "Cannot finalize: Hawl incomplete. X days remaining"

Test B: Short Unlock Reason
1. [ ] FINALIZED record → "Unlock"
2. [ ] Enter: "Bad" (3 chars)
3. [ ] Verify Error: "Minimum 10 characters required"

Test C: Delete FINALIZED
1. [ ] Try to delete FINALIZED record
2. [ ] Verify: Error or button disabled
   Error message: "Cannot delete FINALIZED records"

Test D: Invalid Status Transition
1. [ ] Via API: curl -X POST http://localhost:5000/api/nisab-year-records/[ID]
       -H "Authorization: Bearer [TOKEN]"
       -d '{"status":"INVALID"}'
2. [ ] Verify: 400 error "INVALID_TRANSITION"
```

**Result**: ✅ ALL PASS / ❌ FAIL  
**Notes**: _________________

---

### Scenario 7: Nisab Calculation (T073)

**Duration**: ~7 minutes  
**Purpose**: Verify Nisab threshold accuracy

**Execute**:
```
1. [ ] Check System Console: Look for Nisab values logged
   Expected: Gold = 87.48g, Silver = 612.36g
2. [ ] Navigate: http://localhost:3000/nisab-year-records
3. [ ] Verify NisabComparisonWidget:
   [ ] Shows Nisab threshold (e.g., $5000 USD)
   [ ] Shows current wealth (e.g., $7000)
   [ ] Shows percentage (e.g., 140%)
   [ ] Shows "Above Nisab" ✓ status
4. [ ] Check price freshness:
   [ ] "Last updated: X days ago"
   [ ] If >7 days: Warning badge shown
5. [ ] Verify calculation matches:
   [ ] If 87.48g gold = $5750 USD ✓
   [ ] Or 612.36g silver = $4200 USD ✓
6. [ ] Check educational tooltips:
   [ ] Click "?" icon (if present)
   [ ] Verify explanation of Nisab
   [ ] Verify reference to Islamic sources
```

**Result**: ✅ PASS / ❌ FAIL
**Notes**: _________________

---

## Performance Tests (T074-T078)

### T074: Wealth Aggregation (<100ms)

**Duration**: ~3 minutes

```bash
# Test command
time curl -H "Authorization: Bearer [TOKEN]" \
  http://localhost:5000/api/nisab-year-records/[RECORD_ID]

# Expected output: real 0m0.0XX < 0.1s
```

**Result**: ✅ <100ms / ❌ >100ms
**Actual Time**: _______ ms

---

### T075: Metals API Call (<2s)

**Duration**: ~3 minutes

```bash
# First call (cold cache)
time curl http://localhost:5000/api/zakat/nisab

# Second call (warm cache)
time curl http://localhost:5000/api/zakat/nisab

# Expected: First <2s, Second <100ms
```

**Result**: ✅ PASS / ❌ FAIL
**First Call**: _______ ms (expect <2000ms)
**Second Call**: _______ ms (expect <100ms)

---

### T076: Dashboard Load (<2s)

**Duration**: ~3 minutes

**Steps**:
1. [ ] Open DevTools (F12)
2. [ ] Go to Network tab
3. [ ] Navigate to `http://localhost:3000/dashboard`
4. [ ] Check DOMContentLoaded time
5. [ ] Verify <2000ms

**Result**: ✅ <2s / ❌ >2s
**Load Time**: _______ ms

---

### T077: Live Tracking Latency (<500ms)

**Duration**: ~3 minutes

**Steps**:
1. [ ] Open `/nisab-year-records` in Tab 1, note time (T1)
2. [ ] Edit asset in Tab 2
3. [ ] Measure update time in Tab 1 (T2)
4. [ ] Latency = T2 - T1
5. [ ] Expected: <500ms

**Result**: ✅ <500ms / ❌ >500ms
**Latency**: _______ ms

---

### T078: Background Job (<30s)

**Duration**: ~3 minutes

```bash
# Trigger job (if admin endpoint available)
time curl -X POST http://localhost:5000/api/admin/jobs/hawl-detection

# Expected: <30s
```

**Result**: ✅ <30s / ❌ >30s
**Execution Time**: _______ s

---

## Accessibility Audit (T079-T083)

### Tools Required
- [ ] WAVE Browser Extension (or use online)
- [ ] axe DevTools
- [ ] Manual keyboard navigation

### T079: HawlProgressIndicator ✓

```
Component: HawlProgressIndicator (on Dashboard or Record page)

[ ] Keyboard Navigation:
    - Tab through: Progress bar, dates, labels
    - Shift+Tab: Reverse navigation
    - Result: ✓ All focusable
    
[ ] Screen Reader (NVDA/JAWS):
    - Announce: "Progress bar, X% complete"
    - Announce: "Days remaining: XX"
    - Result: ✓ All announced
    
[ ] Color Contrast:
    - Progress bar: >= 4.5:1 ratio
    - Text: >= 4.5:1 ratio
    - Result: ✓ Pass
    
[ ] Focus Indicator:
    - Visible on Tab focus
    - Minimum 3px visible
    - Result: ✓ Visible
```

**Result**: ✅ WCAG 2.1 AA PASS / ❌ FAIL

---

### T080: NisabComparisonWidget ✓

```
Component: NisabComparisonWidget (on Record page sidebar)

[ ] Icon Alt Text:
    - Status icons have aria-label
    - Result: ✓ Present
    
[ ] ARIA Labels:
    - "Wealth: $X" has aria-label
    - "Nisab: $Y" has aria-label
    - Result: ✓ Present
    
[ ] Color Not Only Means:
    - Green/Red paired with text
    - "Above/Below Nisab" text present
    - Result: ✓ Text labels
    
[ ] Heading Hierarchy:
    - "Wealth vs Nisab" = h3
    - No skipped levels
    - Result: ✓ Correct
```

**Result**: ✅ WCAG 2.1 AA PASS / ❌ FAIL

---

### T081: FinalizationModal ✓

```
Component: FinalizationModal (Finalize button)

[ ] Focus Trap in Modal:
    - Tab cycles within modal
    - Cannot Tab to background
    - Result: ✓ Working
    
[ ] ESC Key:
    - ESC closes modal
    - Focus returns to trigger button
    - Result: ✓ Working
    
[ ] First Focus:
    - Focus moves to first form input
    - Result: ✓ Correct
    
[ ] Error Announcements:
    - aria-invalid on invalid field
    - aria-describedby links to error
    - role="alert" on error container
    - Result: ✓ All present
```

**Result**: ✅ WCAG 2.1 AA PASS / ❌ FAIL

---

### T082: UnlockReasonDialog ✓

```
Component: UnlockReasonDialog (Unlock button)

[ ] Character Counter:
    - Accessible to screen reader
    - aria-live="polite" on counter
    - Result: ✓ Announced
    
[ ] Error Handling:
    - aria-invalid="true" on error
    - aria-describedby links to error
    - Result: ✓ Present
    
[ ] Form Label:
    - <label for="unlockReason"> present
    - Result: ✓ Associated
    
[ ] Keyboard Navigation:
    - Tab through: textarea, buttons
    - Enter submits
    - Result: ✓ Working
```

**Result**: ✅ WCAG 2.1 AA PASS / ❌ FAIL

---

### T083: AuditTrailView ✓

```
Component: AuditTrailView (View Audit Trail button)

[ ] Semantic HTML:
    - <ul> for event list
    - <li> for each event
    - Result: ✓ Correct
    
[ ] Color Contrast:
    - Event badges: >= 4.5:1
    - Timestamps: >= 4.5:1
    - Result: ✓ Pass
    
[ ] Abbreviations Avoided:
    - Relative times: "5 minutes ago"
    - Full dates on hover
    - Result: ✓ Clear
    
[ ] Expand/Collapse:
    - Buttons labeled: "Show details"
    - aria-expanded="true|false"
    - Result: ✓ Accessible
```

**Result**: ✅ WCAG 2.1 AA PASS / ❌ FAIL

---

## Islamic Compliance Verification (T084-T087)

### T084: Nisab Thresholds ✓

```
Verification Checklist:

[ ] Gold Nisab:
    - Value: 87.48 grams
    - Source: Consensus of Islamic scholars
    - Implementation: Checked in backend config
    - Result: ✓ Correct

[ ] Silver Nisab:
    - Value: 612.36 grams
    - Source: Consensus of Islamic scholars
    - Implementation: Checked in backend config
    - Result: ✓ Correct

[ ] Display Accuracy:
    - Frontend shows correct threshold
    - No rounding errors > 1%
    - Result: ✓ Accurate
```

**Result**: ✅ VERIFIED / ❌ INCORRECT
**Notes**: _________________

---

### T085: Hawl Duration ✓

```
Verification Checklist:

[ ] Duration: 354 days
    - Source: Qur'an 9:36, Islamic consensus
    - Implementation: Check in code
    - Result: ✓ Correct

[ ] Lunar Calendar:
    - Using moment-hijri library
    - Not 365 solar days
    - Result: ✓ Using Hijri

[ ] Calculation:
    - Start: [Date X]
    - Completion: [Date X + 354 days]
    - Verify: Correct in test record
    - Result: ✓ Correct
```

**Result**: ✅ VERIFIED / ❌ INCORRECT
**Notes**: _________________

---

### T086: Zakat Rate ✓

```
Verification Checklist:

[ ] Rate: 2.5%
    - Source: Qur'an 2:277, Islamic scholars
    - Implementation: Check in code
    - Result: ✓ Correct

[ ] Calculation Scope:
    - Applied to entire base (after liabilities)
    - NOT to excess above Nisab
    - Implementation: Verify in service
    - Result: ✓ Correct

[ ] No Exceptions:
    - Consistent 2.5% for all asset types
    - No modifiers or adjustments
    - Result: ✓ No exceptions
```

**Result**: ✅ VERIFIED / ❌ INCORRECT
**Notes**: _________________

---

### T087: Educational Content ✓

```
Verification Checklist:

[ ] Nisab Explanation:
    - In-app help or tooltip explains
    - Threshold concept clear
    - Example: "Gold: 87.48g or Silver: 612.36g"
    - Result: ✓ Present

[ ] Hawl Explanation:
    - Explains 354-day lunar year
    - Why Hijri calendar used
    - Result: ✓ Present

[ ] Source Attribution:
    - References Islamic sources
    - Mentions "Simple Zakat Guide" or scholars
    - Result: ✓ Attributed

[ ] Clarity:
    - Non-expert users understand
    - No contradictions with Islamic law
    - Result: ✓ Clear and accurate
```

**Result**: ✅ VERIFIED / ❌ MISSING/INCORRECT
**Notes**: _________________

---

## Summary & Completion

### Test Execution Summary

| Category | Tests | Status | Notes |
|----------|-------|--------|-------|
| Quickstart Scenarios | T067-T073 | [ ] PASS | 7 manual workflows |
| Performance | T074-T078 | [ ] PASS | 5 performance tests |
| Accessibility | T079-T083 | [ ] PASS | WCAG 2.1 AA |
| Compliance | T084-T087 | [ ] PASS | Islamic verification |

### Blockers / Issues Found

```
Issue 1: _________________________________
  - Location: __________________________
  - Severity: ☐ Critical ☐ High ☐ Medium ☐ Low
  - Status: ☐ Fixed ☐ Logged ☐ Pending

Issue 2: _________________________________
  - Location: __________________________
  - Severity: ☐ Critical ☐ High ☐ Medium ☐ Low
  - Status: ☐ Fixed ☐ Logged ☐ Pending
```

### Sign-Off

- **Validation Executed By**: _________________
- **Date**: _________________
- **Result**: ☐ ALL PASS ☐ READY WITH KNOWN ISSUES ☐ BLOCKERS FOUND

---

## Next Steps

If all tests passing:
→ Proceed to **Phase 3.7 Documentation**

If issues found:
→ File GitHub issues with reproduction steps
→ Fix blocking issues
→ Re-run affected tests

---

**Phase 3.6 Status**: ⏳ READY FOR EXECUTION
**Estimated Total Time**: 3-4 hours
**Prerequisites**: All implementation phases (3.1-3.5) complete ✓
