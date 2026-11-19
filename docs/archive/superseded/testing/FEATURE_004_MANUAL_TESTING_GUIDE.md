# Feature 004: Manual Testing Guide - T133 & T150

**Feature**: Enhanced Zakat Calculation Engine  
**Phase**: 5 - Testing & Documentation  
**Tasks**: T133 (Methodology Switching), T150 (Calculation History)  
**Duration**: ~4 hours  
**Status**: Ready for Manual Testing

---

## 📋 Overview

This guide covers manual end-to-end testing for the final two tasks of Feature 004:

- **T133**: Test methodology switching and persistence
- **T150**: Test calculation history storage and retrieval

All implementation is complete with 0 TypeScript errors and all automated tests passing. This manual testing phase validates the user experience and integration of these critical features.

---

## ⚙️ Prerequisites

### 1. Environment Setup

**Backend Server:**
```bash
cd /home/runner/work/zakapp/zakapp/server
npm run dev
# Should start on http://localhost:5001
```

**Frontend Client:**
```bash
cd /home/runner/work/zakapp/zakapp/client
npm run dev
# Should start on http://localhost:3000
```

### 2. Database Ready

```bash
# Check database exists and migrations applied
cd /home/runner/work/zakapp/zakapp/server
npx prisma migrate status

# If needed, apply migrations
npx prisma migrate deploy
```

### 3. Test User Account

Create a test user or use existing credentials:
- **Email**: test@zakapp.local
- **Password**: TestPass123!

### 4. Clean Browser State

- Clear browser cache and cookies
- Use incognito/private mode for fresh testing
- Ensure localStorage is empty before starting

---

## 🧪 T133: Test Methodology Switching and Persistence

**Objective**: Verify that users can select, switch between, and persist methodology preferences across sessions.

**Estimated Duration**: 2 hours

### Test Scenario 1: Initial Methodology Selection

#### Steps:

1. **Navigate to Calculator Page**
   - [ ] Open http://localhost:3000 in browser
   - [ ] Log in with test credentials
   - [ ] Navigate to "Calculator" or "Zakat Calculator" page
   - [ ] Verify page loads successfully (< 3 seconds)

2. **View Methodology Selector**
   - [ ] Locate the MethodologySelector component
   - [ ] Verify all 4 methodologies are displayed:
     - Standard (AAOIFI)
     - Hanafi
     - Shafi'i
     - Custom
   - [ ] Confirm each methodology card shows:
     - Name
     - Brief description
     - Key characteristics
     - "Learn More" or info button

3. **Select Standard Methodology**
   - [ ] Click on "Standard (AAOIFI)" methodology card
   - [ ] Verify card highlights/changes appearance (selected state)
   - [ ] Check that methodology details update in calculator
   - [ ] Verify nisab threshold displays as ~$5,500 (gold-based)
   - [ ] Confirm Zakat rate shows as 2.5%

**Expected Results:**
- ✅ All methodologies visible and accessible
- ✅ Selection state clearly indicated
- ✅ Calculator updates to reflect selected methodology
- ✅ No console errors

**Pass/Fail:** ☐ PASS | ☐ FAIL

**Issues Found:**
```
Calculation results always show Methodology as standard regardless of method selected.
Asset selection only selects all or none. No option to select particular assets for calculation.
```

---

### Test Scenario 2: Switching Between Methodologies

#### Steps:

1. **Switch to Hanafi Methodology**
   - [ ] From Standard methodology, click on "Hanafi" card
   - [ ] Verify selection state changes immediately
   - [ ] Check nisab threshold updates to ~$3,000 (silver-based)
   - [ ] Confirm Zakat rate remains 2.5%
   - [ ] Verify educational content updates to explain Hanafi methodology
   - [ ] Check that any entered assets/values are preserved

2. **Switch to Shafi'i Methodology**
   - [ ] Click on "Shafi'i" methodology card
   - [ ] Verify smooth transition (no page reload)
   - [ ] Check nisab threshold updates to ~$5,500 (gold-based)
   - [ ] Confirm separate gold/silver calculation note appears
   - [ ] Verify asset values remain intact

3. **Switch to Custom Methodology**
   - [ ] Click on "Custom" methodology card
   - [ ] Verify custom options/fields appear (if applicable)
   - [ ] Check that user can input custom nisab or rules
   - [ ] Confirm calculation updates based on custom values

4. **Switch Back to Standard**
   - [ ] Click on "Standard (AAOIFI)" card again
   - [ ] Verify return to original settings
   - [ ] Check all values and calculations correct

**Performance Check:**
- [ ] Each methodology switch takes < 100ms
- [ ] No flickering or UI glitches
- [ ] Smooth animations (if present)

**Expected Results:**
- ✅ Methodology switching works instantly
- ✅ UI updates correctly for each methodology
- ✅ Nisab thresholds change appropriately
- ✅ Asset values and user input preserved
- ✅ No errors or performance issues

**Pass/Fail:** ☐ PASS | ☐ FAIL

**Issues Found:**
```
[Document any issues here]
```

---

### Test Scenario 3: Methodology Persistence - Same Session

#### Steps:

1. **Select Hanafi Methodology**
   - [ ] Choose Hanafi methodology
   - [ ] Enter some asset values (e.g., Cash: $10,000, Gold: $5,000)
   - [ ] Click "Calculate" to see Zakat results

2. **Navigate Away and Return**
   - [ ] Navigate to another page (e.g., Dashboard, Settings)
   - [ ] Wait 5 seconds
   - [ ] Navigate back to Calculator page
   - [ ] Verify Hanafi methodology is still selected
   - [ ] Check that asset values are preserved (if applicable)

3. **Refresh Page**
   - [ ] While on Calculator page with Hanafi selected
   - [ ] Press F5 or Ctrl+R to refresh the page
   - [ ] Wait for page to fully reload
   - [ ] Verify Hanafi methodology is still selected
   - [ ] Check UI state matches pre-refresh

**Expected Results:**
- ✅ Methodology selection persists within same session
- ✅ Navigation does not reset methodology
- ✅ Page refresh maintains selection
- ✅ Asset values preserved where appropriate

**Pass/Fail:** ☐ PASS | ☐ FAIL

**Issues Found:**
```
[Document any issues here]
```

---

### Test Scenario 4: Methodology Persistence - Across Sessions (Logout/Login)

#### Steps:

1. **Set Methodology and Logout**
   - [ ] Select Shafi'i methodology
   - [ ] Verify selection is active
   - [ ] Click "Logout" button
   - [ ] Confirm successful logout

2. **Clear Session (Optional)**
   - [ ] Close browser tab
   - [ ] Clear session storage (if testing isolated storage)
   - [ ] Wait 30 seconds

3. **Login and Verify Persistence**
   - [ ] Open http://localhost:3000 in browser
   - [ ] Log in with same test credentials
   - [ ] Navigate to Calculator page
   - [ ] **Critical Check**: Verify Shafi'i methodology is still selected
   - [ ] Confirm nisab threshold matches Shafi'i rules (~$5,500)
   - [ ] Check educational content matches Shafi'i

4. **Change and Re-login**
   - [ ] Change methodology to Standard
   - [ ] Logout
   - [ ] Login again
   - [ ] Verify Standard methodology is now the default

**Storage Verification:**
```javascript
// Check browser console for stored preference
console.log(localStorage.getItem('selectedMethodology'));
// Should show: "shafi'i" or "standard" etc.
```

**Expected Results:**
- ✅ Methodology preference persists after logout
- ✅ Preference loads correctly on next login
- ✅ User sees their last-selected methodology
- ✅ No data loss between sessions

**Pass/Fail:** ☐ PASS | ☐ FAIL

**Issues Found:**
```
[Document any issues here]
```

---

### Test Scenario 5: Methodology Impact on Calculations

#### Steps:

1. **Prepare Test Data**
   - Asset values to use:
     - Cash & Bank: $10,000
     - Gold (85g): $5,000
     - Silver (595g): $3,000
     - Total: $18,000

2. **Calculate with Standard Methodology**
   - [ ] Select Standard methodology
   - [ ] Enter asset values above
   - [ ] Click "Calculate Zakat"
   - [ ] Record results:
     - Nisab threshold: ~$5,500
     - Meets nisab: YES
     - Zakat due: $450 (2.5% of $18,000)

3. **Calculate with Hanafi Methodology**
   - [ ] Switch to Hanafi methodology (keep same assets)
   - [ ] Click "Calculate Zakat"
   - [ ] Verify different calculation:
     - Nisab threshold: ~$3,000
     - Meets nisab: YES
     - Zakat due: $450 (2.5% of $18,000)
   - [ ] Check explanation mentions silver-based nisab

4. **Calculate with Shafi'i Methodology**
   - [ ] Switch to Shafi'i methodology
   - [ ] Click "Calculate Zakat"
   - [ ] Verify separate calculation:
     - Nisab threshold: ~$5,500
     - Separate gold/silver calculation note
     - Zakat due: $450 (2.5% of $18,000)

5. **Edge Case: Below Nisab (Hanafi vs Standard)**
   - [ ] Clear assets
   - [ ] Enter only: Cash: $4,000
   - [ ] **With Standard**: Should show "Below Nisab" (threshold $5,500)
   - [ ] **With Hanafi**: Should show "Above Nisab" (threshold $3,000)
   - [ ] Verify Zakat calculated correctly for Hanafi only

**Expected Results:**
- ✅ Methodology affects nisab threshold calculation
- ✅ Explanations are methodology-specific
- ✅ Edge cases handled correctly
- ✅ Educational content matches selected methodology

**Pass/Fail:** ☐ PASS | ☐ FAIL

**Issues Found:**
```
[Document any issues here]
```

---

### Test Scenario 6: UI/UX - Methodology Selection

#### Steps:

1. **Accessibility Testing**
   - [ ] Tab through methodology cards using keyboard
   - [ ] Verify focus indicators visible
   - [ ] Press Enter/Space to select focused methodology
   - [ ] Verify screen reader announces methodology names
   - [ ] Check ARIA labels present (`aria-label`, `role`)

2. **Responsive Design**
   - [ ] Test on mobile viewport (375px wide)
     - Methodology cards stack vertically
     - Touch targets adequate (44x44px minimum)
     - Text readable without zoom
   - [ ] Test on tablet viewport (768px wide)
     - Cards display in 2-column grid
   - [ ] Test on desktop (1200px+ wide)
     - Cards display in 4-column or appropriate layout

3. **Visual Feedback**
   - [ ] Hover over methodology cards (desktop)
     - Verify hover effect (color change, shadow, etc.)
   - [ ] Click methodology card
     - Verify immediate visual feedback (selection state)
   - [ ] Check color contrast meets WCAG 2.1 AA
     - Selected state clearly distinguishable
     - Text readable on all backgrounds

4. **Educational Content**
   - [ ] Click "Learn More" button on Standard methodology
   - [ ] Verify modal/drawer opens with detailed information
   - [ ] Read through content for accuracy
   - [ ] Check Islamic sources cited
   - [ ] Close modal and verify calculator still functional
   - [ ] Repeat for other methodologies

**Expected Results:**
- ✅ Fully keyboard accessible
- ✅ Responsive across all device sizes
- ✅ Clear visual feedback for all interactions
- ✅ Educational content accurate and helpful

**Pass/Fail:** ☐ PASS | ☐ FAIL

**Issues Found:**
```
[Document any issues here]
```

---

## 📊 T150: Test Calculation History Storage and Retrieval

**Objective**: Verify that calculation history is correctly saved, retrieved, filtered, paginated, and displayed with trend analysis.

**Estimated Duration**: 2 hours

### Test Scenario 1: Save Calculation to History

#### Steps:

1. **Perform Initial Calculation**
   - [ ] Navigate to Calculator page
   - [ ] Select Standard methodology
   - [ ] Enter assets:
     - Cash: $15,000
     - Gold: $7,500
     - Cryptocurrency: $5,000
   - [ ] Click "Calculate Zakat"
   - [ ] Verify results displayed (Total: $27,500, Zakat: $687.50)

2. **Save Calculation**
   - [ ] Look for "Save Calculation" or "Save to History" button
   - [ ] Click button
   - [ ] If prompted, enter optional notes: "Test calculation 1"
   - [ ] Verify success message appears
   - [ ] Check calculation ID returned (if shown)

3. **Verify in Database (Backend Check)**
   ```bash
   # Run in server directory
   cd /home/runner/work/zakapp/zakapp/server
   npx ts-node -e "
   import { PrismaClient } from '@prisma/client';
   const prisma = new PrismaClient();
   prisma.calculationHistory.findMany({
     orderBy: { createdAt: 'desc' },
     take: 1
   }).then(console.log).finally(() => prisma.\$disconnect());
   "
   ```
   - [ ] Verify calculation exists in database
   - [ ] Check sensitive data is encrypted

**Expected Results:**
- ✅ Calculation saves successfully
- ✅ Success feedback provided to user
- ✅ Data persisted in database
- ✅ Sensitive fields encrypted

**Pass/Fail:** ☐ PASS | ☐ FAIL

**Issues Found:**
```
[Document any issues here]
```

---

### Test Scenario 2: Retrieve and Display Calculation History

#### Steps:

1. **Create Multiple Calculations**
   - [ ] Save at least 5 different calculations with varying:
     - Methodologies (Standard, Hanafi, Shafi'i)
     - Dates (if date selection available)
     - Asset amounts
     - Notes (optional)

2. **Navigate to History Page**
   - [ ] Click "History" or "Calculation History" in navigation
   - [ ] Verify history page loads (< 2 seconds)
   - [ ] Check page title and heading

3. **View Calculation List**
   - [ ] Verify all saved calculations are displayed
   - [ ] Check each calculation shows:
     - Calculation date
     - Methodology used
     - Total wealth amount
     - Zakat amount
     - Status indicator (if applicable)
   - [ ] Confirm calculations listed in reverse chronological order (newest first)

4. **View Calculation Details**
   - [ ] Click on a calculation to view details
   - [ ] Verify detail view/modal opens
   - [ ] Check all information displayed:
     - Full asset breakdown
     - Methodology details
     - Nisab threshold
     - Calculation explanation
     - Notes (if any)
     - Timestamps (created, updated)

**Expected Results:**
- ✅ All saved calculations appear in history
- ✅ Data displayed accurately and completely
- ✅ List ordered chronologically
- ✅ Detail view comprehensive

**Pass/Fail:** ☐ PASS | ☐ FAIL

**Issues Found:**
```
[Document any issues here]
```

---

### Test Scenario 3: Filter Calculation History

#### Steps:

1. **Filter by Methodology**
   - [ ] Locate methodology filter dropdown/buttons
   - [ ] Select "Hanafi" filter
   - [ ] Verify only Hanafi calculations displayed
   - [ ] Check count matches expectation
   - [ ] Select "Standard" filter
   - [ ] Verify list updates to Standard calculations only
   - [ ] Select "All Methodologies"
   - [ ] Verify all calculations return

2. **Filter by Date Range**
   - [ ] Locate date range filter
   - [ ] Set "From" date to 30 days ago
   - [ ] Set "To" date to today
   - [ ] Click "Apply" or auto-filter triggers
   - [ ] Verify only calculations within range shown
   - [ ] Try edge case: date range with no calculations
   - [ ] Verify "No results" message appears

3. **Search Functionality**
   - [ ] Locate search input field
   - [ ] Enter search term from notes: "Test calculation"
   - [ ] Verify matching calculations appear
   - [ ] Clear search
   - [ ] Verify all calculations return

4. **Combined Filters**
   - [ ] Apply methodology filter: Hanafi
   - [ ] Apply date range: Last 7 days
   - [ ] Enter search term: "calculation"
   - [ ] Verify results match all filter criteria
   - [ ] Check filter badge/chip count

**Expected Results:**
- ✅ Methodology filter works correctly
- ✅ Date range filter accurate
- ✅ Search finds relevant calculations
- ✅ Combined filters work together
- ✅ Clear/reset filters functional

**Pass/Fail:** ☐ PASS | ☐ FAIL

**Issues Found:**
```
[Document any issues here]
```

---

### Test Scenario 4: Pagination

#### Steps:

1. **Setup: Create 25+ Calculations**
   - [ ] If fewer than 25 calculations exist, create more
   - [ ] Use API or repeated manual saves
   - [ ] Verify total count > page size (typically 10 or 20)

2. **Test Pagination Controls**
   - [ ] Navigate to History page
   - [ ] Check pagination info displays: "Showing 1-20 of 25"
   - [ ] Verify "Next" button enabled
   - [ ] Verify "Previous" button disabled (on first page)
   - [ ] Click "Next" button
   - [ ] Verify page 2 loads with next 5 calculations
   - [ ] Check "Previous" button now enabled
   - [ ] Click "Previous" to return to page 1

3. **Test Page Size Selection**
   - [ ] Locate page size dropdown (e.g., 10, 20, 50, 100)
   - [ ] Select "10 per page"
   - [ ] Verify only 10 calculations shown
   - [ ] Check pagination updates: "Showing 1-10 of 25"
   - [ ] Select "50 per page"
   - [ ] Verify all calculations now on one page (if total < 50)

4. **Direct Page Navigation**
   - [ ] If page numbers shown (1, 2, 3...)
   - [ ] Click on page "3" directly
   - [ ] Verify page 3 calculations load
   - [ ] Check URL updates with page number (if applicable)

5. **Edge Cases**
   - [ ] Navigate to last page
   - [ ] Verify "Next" button disabled
   - [ ] Delete a calculation (reducing total count)
   - [ ] Verify pagination updates correctly

**Expected Results:**
- ✅ Pagination controls work correctly
- ✅ Page size selection functional
- ✅ Direct page navigation works
- ✅ Edge cases handled gracefully
- ✅ Performance acceptable (< 1 second per page load)

**Pass/Fail:** ☐ PASS | ☐ FAIL

**Issues Found:**
```
[Document any issues here]
```

---

### Test Scenario 5: Calculation History Trends

#### Steps:

1. **Create Trend Data**
   - [ ] Ensure calculations exist spanning multiple months
   - [ ] Include varying wealth amounts (e.g., $10k, $20k, $30k)
   - [ ] Mix of different methodologies

2. **Navigate to Trends View**
   - [ ] Look for "Trends" or "Analytics" tab/page
   - [ ] Click to view trend analysis
   - [ ] Verify page loads with visualizations

3. **Wealth Trend Chart**
   - [ ] Locate wealth trend line/bar chart
   - [ ] Verify X-axis shows time periods (months/years)
   - [ ] Verify Y-axis shows wealth amounts
   - [ ] Check data points are plotted correctly
   - [ ] Hover over data point
     - Tooltip appears with exact values
     - Date and wealth amount shown
   - [ ] Verify trend line/bars indicate increase/decrease

4. **Zakat Trend Chart**
   - [ ] Locate Zakat amount trend chart
   - [ ] Verify data plotted over time
   - [ ] Check calculations match saved history
   - [ ] Hover to see exact Zakat amounts per period
   - [ ] Verify chart responsive to window resize

5. **Methodology Distribution**
   - [ ] Locate methodology distribution chart (pie/donut/bar)
   - [ ] Verify all used methodologies represented
   - [ ] Check percentages add up to 100%
   - [ ] Verify legend shows methodology names
   - [ ] Click on chart segment (if interactive)
     - Optionally filters calculations by methodology

6. **Trend Period Selection**
   - [ ] Locate period selector: "Last 30 days", "3 months", "1 year", "All"
   - [ ] Select "Last 30 days"
   - [ ] Verify charts update to show only recent data
   - [ ] Select "1 year"
   - [ ] Verify full year data displayed
   - [ ] Select "All"
   - [ ] Verify all historical data shown

**Expected Results:**
- ✅ Trend charts render correctly
- ✅ Data accurate and matches history
- ✅ Interactive features functional
- ✅ Period selection works
- ✅ Charts responsive and performant

**Pass/Fail:** ☐ PASS | ☐ FAIL

**Issues Found:**
```
[Document any issues here]
```

---

### Test Scenario 6: Edit and Delete Calculations

#### Steps:

1. **Edit Existing Calculation**
   - [ ] Open a saved calculation detail view
   - [ ] Look for "Edit" button
   - [ ] Click "Edit"
   - [ ] Verify calculation details become editable
   - [ ] Change notes field: "Updated test notes"
   - [ ] Optionally update asset value
   - [ ] Click "Save Changes"
   - [ ] Verify success message
   - [ ] Check updated data persists

2. **Delete Single Calculation**
   - [ ] Open a calculation detail view
   - [ ] Click "Delete" button
   - [ ] Verify confirmation dialog appears
     - "Are you sure you want to delete this calculation?"
   - [ ] Click "Cancel" first
     - Verify calculation remains
   - [ ] Click "Delete" again
   - [ ] Click "Confirm" in dialog
   - [ ] Verify success message
   - [ ] Check calculation removed from history list
   - [ ] Verify calculation count decrements

3. **Bulk Delete (if available)**
   - [ ] Return to history list
   - [ ] Select multiple calculations using checkboxes
   - [ ] Click "Delete Selected" button
   - [ ] Verify confirmation dialog shows count
   - [ ] Confirm deletion
   - [ ] Verify all selected calculations removed

4. **Edge Cases**
   - [ ] Try to delete last remaining calculation
   - [ ] Verify system allows deletion (or provides appropriate message)
   - [ ] Delete then immediately try to view deleted calculation
   - [ ] Verify proper "Not Found" or redirect behavior

**Expected Results:**
- ✅ Edit functionality works correctly
- ✅ Delete requires confirmation
- ✅ Deletions persist
- ✅ Bulk delete functional (if available)
- ✅ Edge cases handled gracefully

**Pass/Fail:** ☐ PASS | ☐ FAIL

**Issues Found:**
```
[Document any issues here]
```

---

### Test Scenario 7: Export Calculation History

#### Steps:

1. **Export Single Calculation**
   - [ ] Open a calculation detail view
   - [ ] Click "Export" or "Download" button
   - [ ] Select format: **JSON**
     - [ ] File downloads successfully
     - [ ] File name format: `zakat-calculation-YYYY-MM-DD.json`
     - [ ] Open file and verify JSON structure valid
     - [ ] Check all data present (assets, methodology, totals)
   - [ ] Select format: **CSV**
     - [ ] File downloads successfully
     - [ ] File name format: `zakat-calculation-YYYY-MM-DD.csv`
     - [ ] Open in Excel/Google Sheets
     - [ ] Verify data formatted correctly in rows/columns
   - [ ] Select format: **PDF**
     - [ ] File downloads or print dialog opens
     - [ ] Verify PDF includes:
       - Calculation details
       - Asset breakdown table
       - Methodology information
       - Professional formatting
       - Islamic disclaimer/footer

2. **Export All History**
   - [ ] Navigate to main history list
   - [ ] Look for "Export All" or "Download History" button
   - [ ] Select export format (JSON/CSV)
   - [ ] Click "Export"
   - [ ] Verify file downloads
   - [ ] Open file and check:
     - All calculations included
     - Data complete and accurate
     - File size reasonable

3. **Export Filtered Results**
   - [ ] Apply filters: Methodology = Hanafi, Last 30 days
   - [ ] Click "Export Filtered Results"
   - [ ] Verify export contains only filtered calculations
   - [ ] Check file name indicates filtered export

**Expected Results:**
- ✅ All export formats work correctly
- ✅ Exported data complete and accurate
- ✅ File naming consistent
- ✅ PDF professionally formatted
- ✅ Filtered exports respect filters

**Pass/Fail:** ☐ PASS | ☐ FAIL

**Issues Found:**
```
[Document any issues here]
```

---

### Test Scenario 8: Calculation Comparison

#### Steps:

1. **Select Calculations to Compare**
   - [ ] Navigate to history list
   - [ ] Use checkboxes to select 2-3 calculations
   - [ ] Click "Compare Selected" button
   - [ ] Verify comparison view opens

2. **View Side-by-Side Comparison**
   - [ ] Check comparison table displays
   - [ ] Verify columns for each selected calculation
   - [ ] Check rows include:
     - Calculation date
     - Methodology used
     - Total wealth
     - Nisab threshold
     - Zakat amount
     - Asset breakdown
   - [ ] Look for difference indicators
     - Increase/decrease arrows
     - Percentage change
     - Color coding (red/green)

3. **Comparison Insights**
   - [ ] Look for insights section
   - [ ] Verify insights generated:
     - "Your wealth increased by 20% from Jan to Feb"
     - "Switching from Hanafi to Standard increased nisab threshold"
   - [ ] Check insights are relevant and accurate

4. **Export Comparison**
   - [ ] Click "Export Comparison"
   - [ ] Select format (PDF recommended)
   - [ ] Verify comparison report downloads
   - [ ] Open and verify:
     - Side-by-side comparison table
     - Visual charts (if included)
     - Summary insights

**Expected Results:**
- ✅ Comparison view clear and informative
- ✅ Data accurate across comparisons
- ✅ Differences highlighted appropriately
- ✅ Insights helpful and relevant
- ✅ Export captures full comparison

**Pass/Fail:** ☐ PASS | ☐ FAIL

**Issues Found:**
```
[Document any issues here]
```

---

## 🔒 Security & Data Validation

### Security Checks

1. **Authentication**
   - [ ] Attempt to access history page without login
   - [ ] Verify redirect to login page
   - [ ] Attempt API call without JWT token
   - [ ] Verify 401 Unauthorized response

2. **Authorization**
   - [ ] User A creates calculations
   - [ ] User B logs in
   - [ ] Verify User B cannot see User A's calculations
   - [ ] Attempt to access User A's calculation ID directly
   - [ ] Verify 403 Forbidden or 404 Not Found

3. **Data Encryption**
   - [ ] Check database directly:
     ```bash
     sqlite3 server/data/zakapp.db "SELECT totalWealth, notes FROM CalculationHistory LIMIT 1"
     ```
   - [ ] Verify sensitive fields are encrypted (not plain text)
   - [ ] Check encryption prefix: "encrypted:..."

4. **Input Validation**
   - [ ] Try to save calculation with negative values
   - [ ] Verify validation error
   - [ ] Try to inject SQL in notes field: `' OR '1'='1`
   - [ ] Verify safely handled (no SQL injection)
   - [ ] Try XSS in notes: `<script>alert('XSS')</script>`
   - [ ] Verify sanitized (script not executed)

**Expected Results:**
- ✅ Authentication enforced on all endpoints
- ✅ User isolation maintained (authorization)
- ✅ Sensitive data encrypted in database
- ✅ Input validation prevents malicious input
- ✅ No security vulnerabilities found

**Pass/Fail:** ☐ PASS | ☐ FAIL

**Issues Found:**
```
[Document any issues here]
```

---

## ⚡ Performance Testing

### Performance Metrics

1. **Page Load Times**
   - [ ] Calculator page initial load: **< 3 seconds**
   - [ ] History page load: **< 2 seconds**
   - [ ] Trend visualization render: **< 1 second**

2. **Operation Times**
   - [ ] Save calculation: **< 300ms**
   - [ ] Retrieve single calculation: **< 200ms**
   - [ ] List 20 calculations: **< 500ms**
   - [ ] Apply filters: **< 200ms**
   - [ ] Generate trend chart: **< 400ms**

3. **Large Dataset Handling**
   - [ ] Create 100+ calculations (use script if needed)
   - [ ] Load history page
   - [ ] Verify pagination handles large dataset
   - [ ] Check performance still acceptable
   - [ ] Generate trends for 100+ calculations
   - [ ] Verify rendering time < 2 seconds

**Performance Testing Script:**
```bash
# Measure API response time
time curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/calculations

# Expected: < 0.5 seconds for 20 calculations
```

**Expected Results:**
- ✅ All operations meet performance targets
- ✅ No noticeable lag or delays
- ✅ Large datasets handled gracefully
- ✅ Charts render smoothly

**Pass/Fail:** ☐ PASS | ☐ FAIL

**Issues Found:**
```
[Document any issues here]
```

---

## 📱 Cross-Browser & Responsive Testing

### Browser Compatibility

Test on each browser:

1. **Chrome (latest)**
   - [ ] All T133 scenarios pass
   - [ ] All T150 scenarios pass
   - [ ] No console errors

2. **Firefox (latest)**
   - [ ] All T133 scenarios pass
   - [ ] All T150 scenarios pass
   - [ ] No console errors

3. **Safari (latest - macOS/iOS)**
   - [ ] All T133 scenarios pass
   - [ ] All T150 scenarios pass
   - [ ] No console errors

4. **Edge (latest)**
   - [ ] All T133 scenarios pass
   - [ ] All T150 scenarios pass
   - [ ] No console errors

### Responsive Design

Test on each viewport:

1. **Mobile (375px x 667px)**
   - [ ] Methodology cards stack vertically
   - [ ] History list readable
   - [ ] Trends charts responsive
   - [ ] Touch targets adequate (44x44px)
   - [ ] No horizontal scroll

2. **Tablet (768px x 1024px)**
   - [ ] 2-column layouts work
   - [ ] All features accessible
   - [ ] Charts render appropriately

3. **Desktop (1920px x 1080px)**
   - [ ] Full layouts displayed
   - [ ] Multi-column grids working
   - [ ] No excessive white space

**Expected Results:**
- ✅ Works across all major browsers
- ✅ Responsive across all device sizes
- ✅ No browser-specific issues
- ✅ Touch and mouse interactions work

**Pass/Fail:** ☐ PASS | ☐ FAIL

**Issues Found:**
```
[Document any issues here]
```

---

## 🐛 Issue Tracking

### Critical Issues (Blockers)

| ID | Description | Steps to Reproduce | Severity | Status |
|----|-------------|-------------------|----------|--------|
| C1 | | | Critical | |

### Major Issues (Should Fix)

| ID | Description | Steps to Reproduce | Severity | Status |
|----|-------------|-------------------|----------|--------|
| M1 | | | Major | |

### Minor Issues (Nice to Fix)

| ID | Description | Steps to Reproduce | Severity | Status |
|----|-------------|-------------------|----------|--------|
| N1 | | | Minor | |

---

## ✅ Final Validation Checklist

### T133: Methodology Switching

- [ ] All 4 methodologies selectable
- [ ] Switching between methodologies works instantly
- [ ] Methodology persists within session
- [ ] Methodology persists across logout/login
- [ ] Methodology affects calculations correctly
- [ ] UI/UX is intuitive and accessible
- [ ] No errors or performance issues

### T150: Calculation History

- [ ] Calculations save successfully
- [ ] History displays all saved calculations
- [ ] Filtering works (methodology, date, search)
- [ ] Pagination handles large datasets
- [ ] Trends visualize data accurately
- [ ] Edit and delete operations work
- [ ] Export in all formats functional
- [ ] Comparison view helpful
- [ ] Security measures enforced
- [ ] Performance targets met

### Overall Integration

- [ ] Features work together seamlessly
- [ ] No regressions in existing functionality
- [ ] Islamic compliance maintained
- [ ] User experience smooth and intuitive
- [ ] Documentation accurate

---

## 📊 Test Summary Report

**Tested By**: _________________  
**Date**: _________________  
**Duration**: _________ hours  

### Results

| Task | Test Scenarios | Pass | Fail | Blocked | Pass Rate |
|------|----------------|------|------|---------|-----------|
| T133 | 6 | | | | % |
| T150 | 8 | | | | % |
| **Total** | **14** | | | | **%** |

### Overall Assessment

☐ **PASS** - All tests passed, ready for production  
☐ **CONDITIONAL PASS** - Minor issues found, can deploy with known limitations  
☐ **FAIL** - Critical issues found, requires fixes before deployment

### Recommendations

```
[Provide recommendations for next steps]
```

### Sign-off

**Tester Signature**: _________________  
**Date**: _________________  

**Reviewer Signature**: _________________  
**Date**: _________________

---

## 📞 Support & Resources

### Documentation

- **Feature 004 Spec**: `/specs/004-zakat-calculation-complete/spec.md`
- **API Contracts**: `/specs/004-zakat-calculation-complete/contracts/`
- **Implementation Report**: `/FEATURE_004_IMPLEMENTATION_COMPLETE.md`

### Troubleshooting

**If tests fail:**

1. **Check logs**:
   ```bash
   # Backend logs
   cd /home/runner/work/zakapp/zakapp/server
   tail -f logs/app.log
   
   # Browser console (F12)
   ```

2. **Restart services**:
   ```bash
   # Backend
   cd /home/runner/work/zakapp/zakapp/server
   npm run dev
   
   # Frontend
   cd /home/runner/work/zakapp/zakapp/client
   npm run dev
   ```

3. **Check database**:
   ```bash
   cd /home/runner/work/zakapp/zakapp/server
   npx prisma studio
   # Opens at http://localhost:5555
   ```

4. **Report issues**:
   - Document in Issue Tracking section above
   - Create GitHub issue with [BUG] tag
   - Include steps to reproduce, expected vs actual behavior

---

**Ready to begin? Start with T133 Test Scenario 1 and work through each scenario sequentially!**

Good luck! 🚀
