# Manual Testing Execution: Nisab Year Record (T067-T073)

**Feature**: 008-nisab-year-record  
**Test Date**: 2025-11-07  
**Tester**: [To be assigned]  
**Status**: 🔴 PENDING EXECUTION

---

## Pre-Test Setup Checklist

### Environment Verification
- [ ] Backend server running on http://localhost:5000
- [ ] Frontend server running on http://localhost:3000
- [ ] Database accessible (check `server/zakapp.db`)
- [ ] Test user account created and credentials available
- [ ] Browser DevTools ready for network/performance monitoring

### Test Data Preparation
```bash
# Navigate to project root
cd /home/lunareclipse/zakapp

# Verify servers are running
pgrep -f "node.*server"  # Should show backend PID
pgrep -f "react-scripts"  # Should show frontend PID

# Check database
sqlite3 server/zakapp.db ".tables"

# Create test user (if not exists)
# Login via frontend: http://localhost:3000/login
# Or run backend test script to seed user
```

### Required Test Assets (Setup Instructions)

For testing Nisab achievement, you'll need assets totaling >$6000:

1. **Cash Asset**: $2000 (category: CASH)
2. **Gold Asset**: 50 grams → ~$3500 at $70/gram (category: GOLD)
3. **Bank Account**: $1500 (category: BANK_ACCOUNT)
4. **Investment**: $1000 (category: INVESTMENT)

**Total**: $8000 (exceeds Nisab threshold of ~$5686)

---

## T067: Test Scenario 1 - First-Time Nisab Achievement & Hawl Start

**Duration**: ~10 minutes  
**Status**: [ ] NOT STARTED | [ ] IN PROGRESS | [ ] ✅ PASSED | [ ] ❌ FAILED

### Execution Steps

#### Step 1: Login
- [ ] Navigate to http://localhost:3000/login
- [ ] Enter test user credentials
- [ ] Verify successful login (redirects to Dashboard)

#### Step 2: Navigate to Assets
- [ ] Click "Assets" in navigation menu
- [ ] Verify Assets page loads
- [ ] Note: Should show empty or existing assets

#### Step 3: Add Assets Incrementally
- [ ] Click "Add Asset" button
- [ ] Add Cash Asset:
  - Name: "Test Cash"
  - Category: CASH
  - Value: 2000
  - Currency: USD
  - Is Zakatable: YES
- [ ] Verify asset appears in list
- [ ] Note total wealth displayed (should update)

- [ ] Add Gold Asset:
  - Name: "Test Gold"
  - Category: GOLD
  - Weight: 50 grams
  - Value: 3500 (or calculate based on current gold price)
  - Is Zakatable: YES
- [ ] Verify asset appears in list

- [ ] Add Bank Account:
  - Name: "Test Bank"
  - Category: BANK_ACCOUNT
  - Value: 1500
  - Is Zakatable: YES
- [ ] Verify asset appears in list
- [ ] **Expected Total**: $7000 (above Nisab threshold ~$5686)

#### Step 4: Trigger Hawl Detection
**Option A: Wait for Background Job (up to 1 hour)**
- [ ] Wait for hourly cron job to detect Nisab achievement
- [ ] Check backend logs for job execution

**Option B: Manual Trigger (Recommended for testing)**
```bash
# In separate terminal, trigger the Hawl detection job manually
cd /home/lunareclipse/zakapp
# If manual trigger endpoint exists:
curl -X POST http://localhost:5000/api/jobs/hawl-detection/trigger \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# OR restart the backend to run job immediately:
pkill -f "node.*server" && npm run server:dev
```

#### Step 5: Verify Hawl Start
- [ ] Navigate to "Nisab Year Records" page (http://localhost:3000/nisab-year-records)
- [ ] **Expected**: New record appears in list
- [ ] **Expected**: Status badge shows "DRAFT" (blue badge)
- [ ] **Expected**: "Live" indicator visible (blinking or animated badge)
- [ ] Click on the record to open details sidebar
- [ ] Verify Hawl Start Date displayed (today's date in Gregorian)
- [ ] Verify Hawl Start Date (Hijri) displayed (today in Hijri calendar)
- [ ] Verify Hawl Completion Date = Start Date + 354 days
- [ ] Verify Total Wealth shows ~$7000
- [ ] Verify Zakatable Wealth shows ~$7000
- [ ] Verify Zakat Amount shows ~$175 (2.5% of $7000)

#### Step 6: Check Dashboard
- [ ] Navigate to Dashboard (http://localhost:3000/dashboard)
- [ ] **Expected**: Message displayed: "Hawl in progress: 354 days remaining" (or similar)
- [ ] **Expected**: Progress indicator shows 0% or near 0% (just started)
- [ ] **Expected**: Wealth comparison widget shows "$7000 (123% of Nisab)" or similar
- [ ] Verify Nisab threshold displayed (e.g., "$5686 based on gold")

### Success Criteria Checklist
- [ ] ✅ DRAFT Nisab Year Record created automatically
- [ ] ✅ Hawl dates calculated correctly (lunar calendar ~354 days)
- [ ] ✅ Nisab threshold locked at Hawl start value
- [ ] ✅ Dashboard displays Hawl status with countdown

### Issues/Notes
```
[Record any issues, unexpected behavior, or notes here]




```

---

## T068: Test Scenario 2 - Live Tracking During Hawl

**Duration**: ~8 minutes  
**Status**: [ ] NOT STARTED | [ ] IN PROGRESS | [ ] ✅ PASSED | [ ] ❌ FAILED

### Execution Steps

#### Step 1: Open Nisab Year Records Page
- [ ] Navigate to http://localhost:3000/nisab-year-records
- [ ] Verify active DRAFT record is visible
- [ ] Note current Total Wealth value (e.g., $7000)
- [ ] Note current Zakat Amount (e.g., $175)

#### Step 2: Open Assets in New Tab
- [ ] Open new browser tab (Ctrl+T)
- [ ] Navigate to http://localhost:3000/assets
- [ ] Keep Nisab Year Records tab visible

#### Step 3: Edit Asset Value
- [ ] In Assets tab, find one of the test assets (e.g., "Test Cash")
- [ ] Click "Edit" button
- [ ] Increase value by $1000 (e.g., $2000 → $3000)
- [ ] Click "Save"
- [ ] Verify success message appears

#### Step 4: Observe Live Update
- [ ] Switch back to Nisab Year Records tab
- [ ] **Wait 5 seconds** (polling interval)
- [ ] **Expected**: Total Wealth updates to $8000
- [ ] **Expected**: Zakat Amount recalculates to $200 (2.5% of $8000)
- [ ] **Expected**: "Live" badge still visible
- [ ] **Expected**: "Updating..." indicator may flash briefly during update

#### Step 5: Verify No Database Persistence
**For technical users:**
```bash
# Check that the DRAFT record wasn't persisted
cd /home/lunareclipse/zakapp
sqlite3 server/zakapp.db "SELECT totalWealth, zakatAmount FROM nisab_year_records WHERE status='DRAFT';"
# Expected: Should still show original values OR NULL (live tracking doesn't persist)
```

**For non-technical users:**
- [ ] Refresh the page (F5)
- [ ] **Expected**: Values may reset to last finalized state OR remain live (depending on implementation)
- [ ] This confirms live tracking is display-only

### Success Criteria Checklist
- [ ] ✅ Wealth updates within 5 seconds of asset change
- [ ] ✅ Zakat amount recalculates correctly (2.5% of new total)
- [ ] ✅ Live tracking indicator persists
- [ ] ✅ Values not persisted to database until finalization

### Issues/Notes
```
[Record any issues, unexpected behavior, or notes here]




```

---

## T069: Test Scenario 3 - Wealth Falls Below Nisab (Hawl Interruption)

**Duration**: ~7 minutes  
**Status**: [ ] NOT STARTED | [ ] IN PROGRESS | [ ] ✅ PASSED | [ ] ❌ FAILED

### Execution Steps

#### Step 1: Verify Active Hawl
- [ ] Navigate to http://localhost:3000/nisab-year-records
- [ ] Confirm active DRAFT record exists
- [ ] Note current Total Wealth (should be above Nisab, e.g., $8000)

#### Step 2: Delete High-Value Asset
- [ ] Navigate to Assets page (http://localhost:3000/assets)
- [ ] Find the Gold asset ($3500)
- [ ] Click "Delete" button
- [ ] Confirm deletion
- [ ] Verify asset removed from list
- [ ] **Expected**: Total wealth now ~$4500 (below Nisab ~$5686)

#### Step 3: Trigger Hawl Interruption Detection
**Option A: Wait for Background Job**
- [ ] Wait up to 1 hour for background job to detect interruption

**Option B: Manual Trigger**
```bash
# Trigger Hawl detection job
curl -X POST http://localhost:5000/api/jobs/hawl-detection/trigger \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Step 4: Verify Hawl Interruption
- [ ] Navigate to Nisab Year Records page
- [ ] **Expected**: DRAFT record now shows badge "Hawl Interrupted" or status "INTERRUPTED"
- [ ] **Expected**: Record may be archived or moved to "Incomplete" section
- [ ] **Expected**: Warning message displayed explaining Hawl interruption
- [ ] Click on interrupted record to view details
- [ ] Verify interruption reason shown (e.g., "Wealth dropped below Nisab on [date]")

#### Step 5: Verify Dashboard Update
- [ ] Navigate to Dashboard
- [ ] **Expected**: Message changes to "No active Hawl (wealth below Nisab)"
- [ ] **Expected**: Hawl progress widget hidden or shows "Not Active"
- [ ] **Expected**: Educational content suggests increasing wealth to restart Hawl

### Success Criteria Checklist
- [ ] ✅ Hawl interruption detected when wealth < Nisab
- [ ] ✅ Record archived with clear status
- [ ] ✅ Dashboard reflects no active Hawl
- [ ] ✅ User can restart Hawl by increasing wealth

### Issues/Notes
```
[Record any issues, unexpected behavior, or notes here]




```

---

## T070: Test Scenario 4 - Hawl Completion & Finalization

**Duration**: ~10 minutes  
**Status**: [ ] NOT STARTED | [ ] IN PROGRESS | [ ] ✅ PASSED | [ ] ❌ FAILED

### Pre-Test Setup: Simulate Completed Hawl

**Manual Database Edit Required:**
```bash
cd /home/lunareclipse/zakapp

# Find the DRAFT record ID
sqlite3 server/zakapp.db "SELECT id, hawlStartDate, hawlCompletionDate FROM nisab_year_records WHERE status='DRAFT';"

# Set hawlCompletionDate to yesterday (simulate completed Hawl)
sqlite3 server/zakapp.db "UPDATE nisab_year_records SET hawlCompletionDate='2025-11-06' WHERE status='DRAFT';"

# Verify update
sqlite3 server/zakapp.db "SELECT id, hawlCompletionDate FROM nisab_year_records WHERE status='DRAFT';"
```

### Execution Steps

#### Step 1: Login and Check Notification
- [ ] Navigate to http://localhost:3000/login (or refresh if already logged in)
- [ ] **Expected**: Prominent notification appears on Dashboard or as toast message
- [ ] **Expected**: Message: "Your Hawl has completed. Review and finalize your Nisab Year Record." (or similar)
- [ ] Verify notification is visually distinct (e.g., green banner, icon)

#### Step 2: Navigate to Nisab Year Records
- [ ] Click notification link OR manually navigate to http://localhost:3000/nisab-year-records
- [ ] Verify DRAFT record shows completion badge (e.g., "Hawl Complete - Ready to Finalize")
- [ ] Verify "Finalize" button is enabled (not grayed out)

#### Step 3: Open Finalization Modal
- [ ] Click "Finalize" button on the DRAFT record
- [ ] **Expected**: Summary review screen appears (modal or full-page)
- [ ] Verify modal contains all sections:
  - [ ] Hawl Start Date (Gregorian + Hijri)
  - [ ] Hawl Completion Date (Gregorian + Hijri)
  - [ ] Total Zakatable Wealth (e.g., $7000)
  - [ ] Deductible Liabilities section (editable field)
  - [ ] Net Zakat Base (calculated: Wealth - Liabilities)
  - [ ] Zakat Amount (2.5% of Net Base)
  - [ ] Asset Breakdown (list of included assets)

#### Step 4: Edit Deductible Liabilities
- [ ] Find "Deductible Liabilities" input field
- [ ] Enter value: 500 (representing $500 credit card debt)
- [ ] **Expected**: Zakat calculation updates in real-time
- [ ] **Expected**: Net Zakat Base = $7000 - $500 = $6500
- [ ] **Expected**: Zakat Amount = $6500 × 2.5% = $162.50
- [ ] Verify calculation accuracy

#### Step 5: Confirm Finalization
- [ ] Review all displayed information for accuracy
- [ ] Click "Confirm Finalization" button
- [ ] **Expected**: Confirmation dialog appears: "This will lock the record and make it immutable. Continue?"
- [ ] Click "Yes, Finalize" button
- [ ] **Expected**: Loading indicator appears briefly
- [ ] **Expected**: Success message appears (e.g., "Record finalized successfully")

#### Step 6: Verify Finalization
- [ ] Record should automatically reload or redirect to details view
- [ ] **Expected**: Status badge changes to "FINALIZED" (green badge)
- [ ] **Expected**: "Finalized on [date]" timestamp displayed
- [ ] **Expected**: Lock icon visible next to status
- [ ] **Expected**: "Live" indicator no longer visible
- [ ] **Expected**: Edit buttons disabled or hidden
- [ ] Try clicking on asset values or liabilities
- [ ] **Expected**: Fields are read-only (cannot edit)

### Success Criteria Checklist
- [ ] ✅ Finalization only allowed after Hawl completion
- [ ] ✅ Review screen shows all required details
- [ ] ✅ Liabilities editable before finalization
- [ ] ✅ Record becomes immutable after finalization
- [ ] ✅ Finalization timestamp recorded and displayed

### Issues/Notes
```
[Record any issues, unexpected behavior, or notes here]




```

---

## T071: Test Scenario 5 - Unlock & Edit Finalized Record

**Duration**: ~8 minutes  
**Status**: [ ] NOT STARTED | [ ] IN PROGRESS | [ ] ✅ PASSED | [ ] ❌ FAILED

### Execution Steps

#### Step 1: Navigate to Finalized Record
- [ ] Go to http://localhost:3000/nisab-year-records
- [ ] Find the FINALIZED record (from T070)
- [ ] Click on record to open details sidebar or full view
- [ ] Verify status shows "FINALIZED" with lock icon

#### Step 2: Initiate Unlock
- [ ] Find "Unlock for Editing" button
- [ ] Click the button
- [ ] **Expected**: Dialog/modal appears prompting for unlock reason

#### Step 3: Enter Unlock Reason
- [ ] Dialog shows:
  - Title: "Unlock Record"
  - Text area labeled "Reason for unlocking (minimum 10 characters)"
  - Character counter (e.g., "0/10")
  - Cancel and Unlock buttons
- [ ] Enter SHORT reason first: "Fix error" (9 characters)
- [ ] Click "Unlock" button
- [ ] **Expected**: Validation error appears: "Unlock reason must be at least 10 characters"
- [ ] **Expected**: Character counter shows "9/10" in red

- [ ] Enter VALID reason: "Need to correct gold weight (was 50g, should be 55g)"
- [ ] Verify character counter shows "54/10" or similar
- [ ] Click "Unlock" button

#### Step 4: Verify Unlocked State
- [ ] **Expected**: Dialog closes
- [ ] **Expected**: Success message appears (e.g., "Record unlocked for editing")
- [ ] **Expected**: Status badge changes to "UNLOCKED" (orange/yellow badge)
- [ ] **Expected**: Warning banner appears at top:
  - "⚠️ This record has been unlocked for editing. Re-finalize when corrections are complete."
- [ ] **Expected**: Edit buttons now enabled
- [ ] **Expected**: Lock icon may change to "unlocked" icon

#### Step 5: Make Edits
- [ ] Click "Edit" on one of the asset values or liabilities field
- [ ] Change the value (e.g., increase liability from $500 to $600)
- [ ] Save the change
- [ ] **Expected**: Success message appears
- [ ] Verify new value displayed

#### Step 6: Re-finalize Record
- [ ] Click "Re-finalize" button
- [ ] **Expected**: Same summary review screen appears (similar to T070)
- [ ] **Expected**: Screen shows updated values (liability now $600)
- [ ] **Expected**: Zakat calculation updated: ($7000 - $600) × 2.5% = $160
- [ ] Review all values
- [ ] Click "Confirm Finalization"
- [ ] **Expected**: Confirmation dialog appears
- [ ] Click "Yes, Finalize"
- [ ] **Expected**: Status changes back to "FINALIZED"
- [ ] **Expected**: Warning banner disappears
- [ ] **Expected**: Edit buttons disabled again

#### Step 7: View Audit Trail
- [ ] Find "View Audit Trail" or "History" button
- [ ] Click to expand audit trail section
- [ ] **Expected**: Audit trail shows 4 events (minimum):
  1. **Event 1**: "FINALIZED" at [original timestamp from T070]
  2. **Event 2**: "UNLOCKED" at [unlock timestamp] with reason: "Need to correct gold weight..."
  3. **Event 3**: "EDITED" at [edit timestamp] with changes summary (e.g., "Liability changed from $500 to $600")
  4. **Event 4**: "REFINALIZED" at [new timestamp]
- [ ] Verify each event shows:
  - Timestamp (date + time)
  - Event type (badge or icon)
  - Description or reason
  - User who performed action

### Success Criteria Checklist
- [ ] ✅ Unlock requires reason (min 10 characters)
- [ ] ✅ Unlock reason captured in audit trail
- [ ] ✅ Edit buttons enabled only when UNLOCKED
- [ ] ✅ Re-finalization creates new audit entry
- [ ] ✅ Complete audit history visible with all events

### Issues/Notes
```
[Record any issues, unexpected behavior, or notes here]




```

---

## T072: Test Scenario 6 - Invalid Operations

**Duration**: ~5 minutes  
**Status**: [ ] NOT STARTED | [ ] IN PROGRESS | [ ] ✅ PASSED | [ ] ❌ FAILED

### Execution Steps

#### Test 6.1: Premature Finalization
- [ ] Create a NEW DRAFT record (with future hawlCompletionDate)
  - Either trigger Hawl detection again by increasing wealth
  - OR manually create a DRAFT record via API
- [ ] Navigate to Nisab Year Records page
- [ ] Find the DRAFT record with hawlCompletionDate in future
- [ ] Click "Finalize" button
- [ ] **Expected**: Error message appears: "Cannot finalize record: Hawl has not completed yet. 354 days remaining." (or similar)
- [ ] **Expected**: Modal does NOT open
- [ ] **Expected**: Button may be disabled or shows tooltip with reason

#### Test 6.2: Invalid Status Transition (API Level)
**For technical users:**
```bash
# Get DRAFT record ID
RECORD_ID="[paste-record-id-here]"
JWT_TOKEN="[paste-jwt-token-here]"

# Attempt to change DRAFT to UNLOCKED directly (invalid)
curl -X PUT http://localhost:5000/api/nisab-year-records/$RECORD_ID \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "UNLOCKED"}'
```

- [ ] Execute API call above
- [ ] **Expected**: HTTP 400 Bad Request response
- [ ] **Expected**: Error body contains:
  ```json
  {
    "success": false,
    "error": "INVALID_TRANSITION",
    "message": "Cannot transition from DRAFT to UNLOCKED. Valid transitions: DRAFT → FINALIZED"
  }
  ```

#### Test 6.3: Delete FINALIZED Record
- [ ] Navigate to Nisab Year Records page
- [ ] Find a FINALIZED record
- [ ] Hover over or click "..." menu to find "Delete" option
- [ ] **Expected**: "Delete" button is disabled OR hidden for FINALIZED records
- [ ] If visible, click "Delete" button
- [ ] **Expected**: Error message appears: "Cannot delete FINALIZED records. Unlock first if corrections are needed."
- [ ] **Expected**: Confirmation dialog does NOT appear
- [ ] **Expected**: Record NOT deleted

#### Test 6.4: Short Unlock Reason
- [ ] Navigate to a FINALIZED record
- [ ] Click "Unlock for Editing"
- [ ] Enter SHORT reason: "Fix error" (9 characters)
- [ ] Click "Unlock"
- [ ] **Expected**: Validation error displayed
- [ ] **Expected**: Error message: "Unlock reason must be at least 10 characters"
- [ ] **Expected**: Character counter shows "9/10" in red
- [ ] **Expected**: Dialog does NOT close
- [ ] **Expected**: Record status remains FINALIZED

#### Test 6.5: Edit FINALIZED Record Without Unlock
- [ ] Navigate to a FINALIZED record (not unlocked)
- [ ] Attempt to click on editable fields (liabilities, notes, etc.)
- [ ] **Expected**: Fields are read-only (cannot type)
- [ ] **Expected**: Edit buttons are disabled (grayed out)
- [ ] Try clicking "Edit" button if visible
- [ ] **Expected**: Button does nothing OR shows tooltip: "Unlock record first to make edits"
- [ ] **Expected**: No API calls made (verify in Network tab)

### Success Criteria Checklist
- [ ] ✅ All invalid operations blocked at UI level
- [ ] ✅ Descriptive error messages provided for each invalid operation
- [ ] ✅ UI prevents impossible actions (disabled buttons, read-only fields)
- [ ] ✅ API validates all state transitions and returns clear errors

### Issues/Notes
```
[Record any issues, unexpected behavior, or notes here]




```

---

## T073: Test Scenario 7 - Nisab Threshold Calculation

**Duration**: ~7 minutes  
**Status**: [ ] NOT STARTED | [ ] IN PROGRESS | [ ] ✅ PASSED | [ ] ❌ FAILED

### Execution Steps

#### Step 1: Navigate to Settings
- [ ] Navigate to http://localhost:3000/settings (or wherever Nisab standard selection is)
- [ ] Find "Nisab Standard" or "Zakat Calculation Method" section
- [ ] Verify current selection (e.g., "Gold (87.48g)" or "Silver (612.36g)")

#### Step 2: Select Gold Standard
- [ ] Select "Gold (87.48g)" option
- [ ] **Expected**: Threshold calculation displayed or updated
- [ ] Check displayed information:
  - Current gold price per gram (e.g., "$65.00/g")
  - Calculation breakdown: "87.48g × $65.00 = $5,686.20"
  - Final threshold: "$5,686.20"
- [ ] **Optional**: Open Network tab in DevTools to verify API call
- [ ] **Expected**: API call to http://localhost:5000/api/nisab/threshold?standard=gold
- [ ] **Expected**: Response includes price and calculation

#### Step 3: Select Silver Standard
- [ ] Select "Silver (612.36g)" option
- [ ] **Expected**: Page updates with new calculation
- [ ] Check displayed information:
  - Current silver price per gram (e.g., "$0.80/g")
  - Calculation breakdown: "612.36g × $0.80 = $489.89"
  - Final threshold: "$489.89"
- [ ] Verify API call in Network tab
- [ ] **Expected**: API call to http://localhost:5000/api/nisab/threshold?standard=silver

#### Step 4: Verify Database Cache
**For technical users:**
```bash
cd /home/lunareclipse/zakapp

# Check precious_metal_prices table
sqlite3 server/zakapp.db "SELECT * FROM precious_metal_prices ORDER BY fetchedAt DESC LIMIT 5;"

# Expected output (example):
# id|metal|pricePerGram|currency|fetchedAt|expiresAt
# 1|gold|65.00|USD|2025-11-07 10:00:00|2025-11-08 10:00:00
# 2|silver|0.80|USD|2025-11-07 10:00:00|2025-11-08 10:00:00
```

- [ ] Execute query above
- [ ] Verify two entries exist (one for gold, one for silver)
- [ ] Verify `expiresAt` = `fetchedAt` + 24 hours
- [ ] Note the `fetchedAt` timestamp

#### Step 5: Test Cache Behavior
- [ ] Switch back to Gold standard
- [ ] Refresh the page (F5)
- [ ] Check Network tab
- [ ] **Expected**: If cache is valid (<24 hours old), NO new API call to metals-api.com
- [ ] **Expected**: API returns cached price instantly (<50ms response time)

#### Step 6: Simulate Cache Expiry (Optional)
**For technical users:**
```bash
# Manually expire the cache by setting expiresAt to past
sqlite3 server/zakapp.db "UPDATE precious_metal_prices SET expiresAt='2025-11-06 10:00:00' WHERE metal='gold';"

# Refresh the page
# Expected: New API call made to metals-api.com
# Expected: Database cache updated with new fetchedAt and expiresAt
```

- [ ] Execute cache expiry query
- [ ] Refresh settings page
- [ ] Check Network tab
- [ ] **Expected**: New API call to metals-api.com (external API)
- [ ] **Expected**: Cache updated in database (re-run SELECT query to verify)

#### Step 7: Test API Fallback (Optional, requires disconnecting internet)
- [ ] Expire cache as in Step 6
- [ ] Disconnect from internet OR block metals-api.com in browser
- [ ] Refresh settings page
- [ ] **Expected**: Warning message appears: "Using cached Nisab prices (may be outdated). Last updated: [timestamp]"
- [ ] **Expected**: Last successful cached price used as fallback
- [ ] **Expected**: Page still displays threshold (not broken)

### Success Criteria Checklist
- [ ] ✅ Gold Nisab = 87.48g × current gold price
- [ ] ✅ Silver Nisab = 612.36g × current silver price
- [ ] ✅ Prices cached in database for 24 hours
- [ ] ✅ Cache refreshes automatically when expired
- [ ] ✅ Fallback to last successful fetch if API unavailable

### Issues/Notes
```
[Record any issues, unexpected behavior, or notes here]




```

---

## Performance Validation (Optional, but Recommended)

### Aggregate Wealth Calculation (<100ms for 500 assets)

**Status**: [ ] NOT STARTED | [ ] ✅ PASSED | [ ] ❌ FAILED

**Setup:**
```bash
# Seed 500 assets for test user (script required)
cd /home/lunareclipse/zakapp
npm run seed:assets -- --count=500 --userId=[test-user-id]
```

**Test:**
- [ ] Trigger aggregate wealth calculation (create DRAFT record or refresh)
- [ ] Open DevTools → Network tab
- [ ] Measure response time for wealth aggregation API call
- [ ] **Expected**: <100ms response time
- [ ] Record actual time: _______ ms

### Dashboard Page Load (<2s)

**Status**: [ ] NOT STARTED | [ ] ✅ PASSED | [ ] ❌ FAILED

**Test:**
- [ ] Open DevTools → Performance tab
- [ ] Click "Record" button
- [ ] Navigate to http://localhost:3000/dashboard
- [ ] Stop recording when page fully renders
- [ ] Check "Load" event time in Performance timeline
- [ ] **Expected**: <2s from navigation to fully rendered
- [ ] Record actual time: _______ ms

---

## Accessibility Checks (WCAG 2.1 AA)

### Keyboard Navigation

**Status**: [ ] NOT STARTED | [ ] ✅ PASSED | [ ] ❌ FAILED

- [ ] Tab through Nisab Year Records list
- [ ] **Expected**: Focus visible on each record card (blue outline or similar)
- [ ] Press Enter key on focused record
- [ ] **Expected**: Record details open
- [ ] Tab through finalization modal
- [ ] **Expected**: All interactive elements reachable via Tab
- [ ] **Expected**: Modal can be closed with Escape key

### Screen Reader (Optional, requires NVDA/VoiceOver/JAWS)

**Status**: [ ] NOT STARTED | [ ] ✅ PASSED | [ ] ❌ FAILED

- [ ] Enable screen reader
- [ ] Navigate to finalization modal
- [ ] **Expected**: Announces "Hawl completion summary. Press Escape to cancel, Enter to finalize." or similar
- [ ] Navigate through form fields
- [ ] **Expected**: All labels announced correctly

### Color Contrast

**Status**: [ ] NOT STARTED | [ ] ✅ PASSED | [ ] ❌ FAILED

- [ ] Open DevTools → Inspect "DRAFT" status badge
- [ ] Check text color and background color
- [ ] Use contrast checker tool (e.g., WebAIM Contrast Checker)
- [ ] **Expected**: Contrast ratio ≥ 4.5:1
- [ ] Repeat for "FINALIZED" badge
- [ ] Repeat for "UNLOCKED" badge

---

## Islamic Compliance Verification

### Nisab Thresholds

**Status**: [ ] NOT STARTED | [ ] ✅ PASSED | [ ] ❌ FAILED

```bash
cd /home/lunareclipse/zakapp
# Check shared constants
grep -A 5 "NISAB_THRESHOLDS" shared/src/constants/islamicConstants.ts
```

- [ ] Verify Gold: 87.48 grams (20 mithqal)
- [ ] Verify Silver: 612.36 grams (200 dirham)
- [ ] Check scholarly references in code comments

### Hawl Duration

**Status**: [ ] NOT STARTED | [ ] ✅ PASSED | [ ] ❌ FAILED

```bash
# Check Hawl constants
grep -A 3 "HAWL_CONSTANTS" shared/src/constants/islamicConstants.ts
```

- [ ] Verify Lunar year: 354 days
- [ ] Check Hijri calendar library used (moment-hijri or similar)

### Zakat Rate

**Status**: [ ] NOT STARTED | [ ] ✅ PASSED | [ ] ❌ FAILED

```bash
# Check Zakat rate
grep -A 3 "ZAKAT_RATES" shared/src/constants/islamicConstants.ts
```

- [ ] Verify Rate: 2.5% (0.025 or 1/40)
- [ ] Verify applied to entire zakatable wealth (not just excess above Nisab)

### Educational Content

**Status**: [ ] NOT STARTED | [ ] ✅ PASSED | [ ] ❌ FAILED

- [ ] Navigate to in-context help or educational modal
- [ ] Verify content explains Nisab concept
- [ ] Verify references to Simple Zakat Guide
- [ ] Check for links to https://simplezakatguide.com or video series

---

## Post-Test Cleanup

- [ ] Delete test Nisab Year Records (if desired)
- [ ] Reset user assets to normal state (delete test assets)
- [ ] Clear precious metal price cache (if needed for fresh testing)
- [ ] Review backend logs for any errors
- [ ] Take screenshots of key screens for documentation

---

## Test Summary Report

**Total Scenarios Executed**: _____ / 7  
**Scenarios Passed**: _____  
**Scenarios Failed**: _____  
**Critical Issues Found**: _____  
**Medium Issues Found**: _____  
**Minor Issues Found**: _____  

**Overall Assessment**: [ ] ✅ READY FOR PRODUCTION | [ ] ⚠️ NEEDS FIXES | [ ] ❌ MAJOR ISSUES

### Issues Log

| Issue # | Scenario | Severity | Description | Status |
|---------|----------|----------|-------------|--------|
| 1 | | CRITICAL/MEDIUM/LOW | | OPEN/FIXED |
| 2 | | | | |
| 3 | | | | |

### Recommendations

```
[Provide recommendations for production readiness, additional testing needs, or follow-up actions]




```

---

## Tester Sign-Off

**Tester Name**: ___________________________  
**Date Completed**: ___________________________  
**Total Time Spent**: ___________________________  
**Signature**: ___________________________  

---

**Document Generated**: 2025-11-07  
**Feature**: 008-nisab-year-record  
**Based on**: quickstart.md manual testing guide  
**Tasks**: T067-T073
