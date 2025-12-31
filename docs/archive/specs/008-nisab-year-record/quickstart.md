# Quickstart Guide: Nisab Year Record Workflow

## Purpose

Manual testing guide for verifying Nisab Year Record functionality including Hawl tracking, live wealth aggregation, finalization workflows, and audit trails.

## Prerequisites

- Local development environment running (backend + frontend)
- Test database seeded with sample data
- At least one test user account created
- User has 5-10 assets with total value above Nisab threshold (~$6000 USD equivalent)

## Test Scenario 1: First-Time Nisab Achievement & Hawl Start

**Goal**: Verify that the system automatically detects when aggregate wealth reaches Nisab and starts Hawl tracking.

### Steps:

1. **Login** as test user (no existing Hawl)
2. **Navigate** to Assets page
3. **Add assets** incrementally until total > Nisab threshold:
   - Add cash asset: $2000
   - Add gold asset: 50 grams ($3500)
   - Add bank account: $1500
   - **Expected**: Background job detects Nisab achievement within 1 hour (or manually trigger job)

4. **Verify Hawl Start**:
   - Navigate to Nisab Year Records page
   - **Expected**: New DRAFT record appears
   - **Expected**: Hawl start date = today (Gregorian + Hijri)
   - **Expected**: Hawl completion date = today + 354 days
   - **Expected**: Status badge shows "DRAFT"
   - **Expected**: "Live" indicator visible

5. **Check Dashboard**:
   - Navigate to Dashboard
   - **Expected**: "Hawl in progress: X days remaining" message
   - **Expected**: Progress indicator shows 0% (just started)
   - **Expected**: Wealth comparison shows "$7000 (150% of Nisab)"

**Success Criteria**:
- ✅ DRAFT Nisab Year Record created automatically
- ✅ Hawl dates calculated correctly (lunar calendar)
- ✅ Nisab threshold locked at Hawl start value
- ✅ Dashboard displays Hawl status

---

## Test Scenario 2: Live Tracking During Hawl

**Goal**: Verify that DRAFT records update immediately when assets change (live tracking).

### Steps:

1. **Open** Nisab Year Records page (with active DRAFT record)
2. **Note** current total wealth displayed: e.g., $7000
3. **Open new tab** → Navigate to Assets page
4. **Edit** an existing asset (increase value by $1000)
5. **Return** to Nisab Year Records tab (wait 5 seconds for polling)
6. **Expected**: Total wealth updated to $8000
7. **Expected**: Zakat amount recalculated automatically ($8000 × 2.5% = $200)
8. **Expected**: "Live" badge still visible
9. **Expected**: No database persistence (check via API that record wasn't saved)

**Success Criteria**:
- ✅ Wealth updates within 5 seconds of asset change
- ✅ Zakat amount recalculates correctly
- ✅ Live tracking indicator persists
- ✅ Values not persisted to database until finalization

---

## Test Scenario 3: Wealth Falls Below Nisab (Hawl Interruption)

**Goal**: Verify that Hawl is marked as interrupted if wealth drops below Nisab.

### Steps:

1. **Ensure** active DRAFT record exists
2. **Navigate** to Assets page
3. **Delete** enough assets to bring total below Nisab (e.g., delete the $3500 gold asset)
4. **Expected**: Total wealth now $3500 (below ~$5000 Nisab)
5. **Wait** for background job or manually trigger
6. **Navigate** to Nisab Year Records page
7. **Expected**: DRAFT record now shows status "Hawl Interrupted"
8. **Expected**: Record archived (moved to "Incomplete" section)
9. **Expected**: Dashboard shows "No active Hawl (wealth below Nisab)"

**Success Criteria**:
- ✅ Hawl interruption detected when wealth < Nisab
- ✅ Record archived with clear status
- ✅ Dashboard reflects no active Hawl
- ✅ User can restart Hawl by increasing wealth

---

## Test Scenario 4: Hawl Completion & Finalization

**Goal**: Verify finalization workflow when Hawl completes (after 354 days).

### Steps:

1. **Setup**: Manually set `hawlCompletionDate` to yesterday in database (simulate completed Hawl)
2. **Login** and navigate to Dashboard
3. **Expected**: Prominent notification: "Your Hawl has completed. Review and finalize your Nisab Year Record."
4. **Click** notification or navigate to Nisab Year Records
5. **Click** "Finalize" button on DRAFT record
6. **Expected**: Summary review screen appears with:
   - Hawl start and completion dates (Hijri + Gregorian)
   - Total zakatable wealth
   - Deductible liabilities (editable)
   - Net Zakat base
   - Zakat amount (2.5%)
   - Asset breakdown
7. **Edit** deductible liabilities (e.g., mark $500 credit card debt as deductible)
8. **Expected**: Zakat amount recalculates: ($7000 - $500) × 2.5% = $162.50
9. **Click** "Confirm Finalization"
10. **Expected**: Confirmation dialog: "This will lock the record and make it immutable"
11. **Click** "Yes, Finalize"
12. **Expected**: Record status changes to "FINALIZED"
13. **Expected**: "Finalized on [date]" badge appears
14. **Expected**: Lock icon visible
15. **Expected**: "Live" indicator disappears
16. **Expected**: Edit buttons disabled

**Success Criteria**:
- ✅ Finalization only allowed after Hawl completion
- ✅ Review screen shows all details
- ✅ Liabilities editable before finalization
- ✅ Record becomes immutable after finalization
- ✅ Finalization timestamp recorded

---

## Test Scenario 5: Unlock & Edit Finalized Record

**Goal**: Verify unlock workflow with reason capture and audit trail.

### Steps:

1. **Navigate** to FINALIZED Nisab Year Record
2. **Click** "Unlock for Editing" button
3. **Expected**: Dialog prompts for unlock reason
4. **Enter** reason: "Need to correct gold weight (was 50g, should be 55g)"
5. **Click** "Unlock"
6. **Expected**: Record status changes to "UNLOCKED"
7. **Expected**: Warning banner appears: "This record has been unlocked for editing. Re-finalize when corrections are complete."
8. **Expected**: Edit buttons now enabled
9. **Edit** asset values or liabilities
10. **Click** "Re-finalize"
11. **Expected**: Same review screen as initial finalization
12. **Confirm** re-finalization
13. **Expected**: Record status changes back to "FINALIZED"
14. **Click** "View Audit Trail"
15. **Expected**: Audit trail shows:
    - Event 1: "FINALIZED" at [original timestamp]
    - Event 2: "UNLOCKED" at [unlock timestamp] with reason
    - Event 3: "EDITED" at [edit timestamp] with changes summary
    - Event 4: "REFINALIZED" at [new timestamp]

**Success Criteria**:
- ✅ Unlock requires reason (min 10 characters)
- ✅ Unlock reason captured in audit trail
- ✅ Edit buttons enabled only when UNLOCKED
- ✅ Re-finalization creates new audit entry
- ✅ Complete audit history visible

---

## Test Scenario 6: Invalid Operations

**Goal**: Verify that invalid operations are prevented with descriptive errors.

### Steps:

1. **Test: Premature Finalization**
   - DRAFT record with Hawl completion date in future
   - Click "Finalize"
   - **Expected**: Error: "Cannot finalize record: Hawl has not completed yet. X days remaining."

2. **Test: Invalid Status Transition**
   - DRAFT record
   - Attempt API call to change status to "UNLOCKED"
   - **Expected**: Error: "INVALID_TRANSITION: Cannot transition from DRAFT to UNLOCKED"

3. **Test: Delete FINALIZED Record**
   - FINALIZED record
   - Click "Delete"
   - **Expected**: Error: "Cannot delete FINALIZED records. Unlock first if corrections are needed."

4. **Test: Short Unlock Reason**
   - FINALIZED record
   - Click "Unlock"
   - Enter reason: "Fix error" (9 chars)
   - **Expected**: Error: "Unlock reason must be at least 10 characters"

5. **Test: Edit FINALIZED Record Without Unlock**
   - FINALIZED record
   - Attempt to edit directly
   - **Expected**: Edit buttons disabled, no API call made

**Success Criteria**:
- ✅ All invalid operations blocked
- ✅ Descriptive error messages provided
- ✅ UI prevents impossible actions (disabled buttons)
- ✅ API validates all state transitions

---

## Test Scenario 7: Nisab Threshold Calculation

**Goal**: Verify that Nisab calculation uses correct gold/silver prices.

### Steps:

1. **Navigate** to Settings page
2. **Select** Nisab standard: "Gold (87.48g)"
3. **Check** displayed threshold calculation:
   - **Expected**: API calls metals-api.com for gold price
   - **Expected**: Calculation: 87.48g × $65/g = $5686.20
   - **Expected**: Threshold displayed: "$5686.20"
4. **Switch** to "Silver (612.36g)"
5. **Expected**: API calls for silver price
6. **Expected**: Calculation: 612.36g × $0.80/g = $489.89
7. **Expected**: Threshold displayed: "$489.89"
8. **Check** database for cached prices
9. **Expected**: Two entries in `precious_metal_prices` table
10. **Expected**: `expiresAt` = `fetchedAt` + 24 hours
11. **Wait** 24 hours (or manually expire cache)
12. **Refresh** page
13. **Expected**: New API call made, cache updated

**Success Criteria**:
- ✅ Gold Nisab = 87.48g × current price
- ✅ Silver Nisab = 612.36g × current price
- ✅ Prices cached for 24 hours
- ✅ Cache refreshes automatically when expired
- ✅ Fallback to last successful fetch if API unavailable

---

## Performance Validation

### Aggregate Wealth Calculation (<100ms for 500 assets)

1. **Seed** database with 500 assets for test user
2. **Trigger** aggregate wealth calculation (create DRAFT record)
3. **Measure** response time
4. **Expected**: <100ms

### Live Tracking Polling Overhead

1. **Open** Nisab Year Records page with DRAFT record
2. **Monitor** network tab for 1 minute
3. **Expected**: 12 polling requests (5-second interval)
4. **Expected**: Each request <200ms response time

### Dashboard Page Load (<2s)

1. **Navigate** to Dashboard with active Hawl
2. **Measure** page load time (DevTools Performance tab)
3. **Expected**: <2s from navigation to fully rendered

---

## Accessibility Checks (WCAG 2.1 AA)

1. **Keyboard Navigation**:
   - Tab through Nisab Year Records list
   - **Expected**: Focus visible on each record card
   - **Expected**: Enter key opens record details

2. **Screen Reader** (test with NVDA or VoiceOver):
   - Navigate to finalization modal
   - **Expected**: "Hawl completion summary. Press Escape to cancel, Enter to finalize."

3. **Color Contrast**:
   - Check "DRAFT", "FINALIZED", "UNLOCKED" status badges
   - **Expected**: All text meets 4.5:1 contrast ratio

---

## Islamic Compliance Verification

1. **Nisab Thresholds**:
   - ✅ Gold: 87.48 grams
   - ✅ Silver: 612.36 grams

2. **Hawl Duration**:
   - ✅ Lunar year: ~354 days (verify using hijri-calendar library)

3. **Zakat Rate**:
   - ✅ 2.5% on entire zakatable wealth (not just excess above Nisab)

4. **Educational Content**:
   - Check in-context help for Nisab explanation
   - **Expected**: References Simple Zakat Guide

---

## Cleanup

After testing:
1. Delete test Nisab Year Records
2. Reset user assets to normal state
3. Clear precious metal price cache if needed
4. Review audit trail for completeness

---

## Expected Test Duration

- Scenario 1-7: ~45 minutes
- Performance validation: ~15 minutes
- Accessibility checks: ~20 minutes
- Islamic compliance: ~10 minutes

**Total**: ~90 minutes for comprehensive manual testing
