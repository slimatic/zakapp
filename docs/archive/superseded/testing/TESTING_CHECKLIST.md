# T133 & T150 Testing Checklist

**Feature**: Enhanced Zakat Calculation Engine (004)  
**Tester**: _______________  
**Date**: _______________  
**Duration**: _______________

---

## 🚀 Pre-Testing Setup

- [ ] Run `./scripts/prepare-manual-testing.sh`
- [ ] Backend running on http://localhost:5001
- [ ] Frontend running on http://localhost:3000
- [ ] Test user account ready (test@zakapp.local)
- [ ] Browser DevTools accessible (F12)
- [ ] Testing guide open

---

## ✅ T133: Methodology Switching & Persistence

### Scenario 1: Initial Selection (10 min)
- [ ] Navigate to Calculator page
- [ ] All 4 methodologies displayed
- [ ] Can select Standard methodology
- [ ] Nisab threshold shows ~$5,500
- [ ] No console errors

**Status**: ☐ PASS | ☐ FAIL  
**Issues**: _______________

---

### Scenario 2: Switching (15 min)
- [ ] Switch to Hanafi (nisab ~$3,000)
- [ ] Switch to Shafi'i (nisab ~$5,500)
- [ ] Switch to Custom
- [ ] Switch back to Standard
- [ ] Each switch < 100ms
- [ ] Asset values preserved
- [ ] UI updates correctly

**Status**: ☐ PASS | ☐ FAIL  
**Issues**: _______________

---

### Scenario 3: Same-Session Persistence (10 min)
- [ ] Select Hanafi
- [ ] Navigate to Dashboard
- [ ] Return to Calculator
- [ ] Hanafi still selected
- [ ] Refresh page (F5)
- [ ] Hanafi still selected

**Status**: ☐ PASS | ☐ FAIL  
**Issues**: _______________

---

### Scenario 4: Cross-Session Persistence (15 min)
- [ ] Select Shafi'i methodology
- [ ] Logout
- [ ] Login again
- [ ] Navigate to Calculator
- [ ] Shafi'i still selected ✨ **CRITICAL**
- [ ] Change to Standard
- [ ] Logout and login
- [ ] Standard now selected

**Status**: ☐ PASS | ☐ FAIL  
**Issues**: _______________

---

### Scenario 5: Calculation Impact (20 min)
- [ ] **Test Data**: Cash $10k, Gold $5k, Silver $3k (Total $18k)
- [ ] Standard: Nisab $5,500, Zakat $450
- [ ] Hanafi: Nisab $3,000, Zakat $450
- [ ] Shafi'i: Nisab $5,500, Zakat $450
- [ ] **Edge Case**: Cash $4,000 only
  - [ ] Standard: Below nisab, $0 Zakat
  - [ ] Hanafi: Above nisab, $100 Zakat
- [ ] Explanations methodology-specific

**Status**: ☐ PASS | ☐ FAIL  
**Issues**: _______________

---

### Scenario 6: UI/UX & Accessibility (20 min)
- [ ] Tab through cards with keyboard
- [ ] Enter/Space selects methodology
- [ ] Focus indicators visible
- [ ] Mobile responsive (375px)
- [ ] Tablet responsive (768px)
- [ ] Desktop layout (1200px+)
- [ ] Hover effects work
- [ ] Color contrast good
- [ ] "Learn More" modal works

**Status**: ☐ PASS | ☐ FAIL  
**Issues**: _______________

---

## 📊 T150: Calculation History Storage & Retrieval

### Scenario 1: Save Calculation (10 min)
- [ ] Perform calculation (Cash $15k, Gold $7.5k, Crypto $5k)
- [ ] Click "Save Calculation"
- [ ] Add notes: "Test calculation 1"
- [ ] Success message appears
- [ ] Calculation ID shown (if available)
- [ ] Verify in database

**Status**: ☐ PASS | ☐ FAIL  
**Issues**: _______________

---

### Scenario 2: Retrieve & Display (15 min)
- [ ] Create 5 different calculations
- [ ] Navigate to History page
- [ ] Page loads < 2 seconds
- [ ] All 5 calculations displayed
- [ ] Listed in reverse chronological order
- [ ] Each shows: date, methodology, wealth, zakat
- [ ] Click calculation to view details
- [ ] Detail modal opens
- [ ] All data present (assets, methodology, notes)

**Status**: ☐ PASS | ☐ FAIL  
**Issues**: _______________

---

### Scenario 3: Filtering (20 min)
- [ ] Filter by Hanafi methodology
- [ ] Only Hanafi calculations shown
- [ ] Filter by Standard methodology
- [ ] Only Standard calculations shown
- [ ] Filter by date range (last 30 days)
- [ ] Correct calculations shown
- [ ] Search by notes: "Test"
- [ ] Matching calculations found
- [ ] Combine filters: Hanafi + Last 7 days + "calc"
- [ ] Results match all criteria
- [ ] Clear/reset filters works

**Status**: ☐ PASS | ☐ FAIL  
**Issues**: _______________

---

### Scenario 4: Pagination (15 min)
- [ ] Create 25+ calculations (or use existing)
- [ ] History shows "1-20 of 25"
- [ ] "Next" button enabled
- [ ] "Previous" button disabled (page 1)
- [ ] Click "Next" → Page 2 loads
- [ ] "Previous" now enabled
- [ ] Click "Previous" → Page 1
- [ ] Change page size to 10
- [ ] Only 10 shown
- [ ] Change to 50 → All on one page
- [ ] Navigate to last page
- [ ] "Next" disabled

**Status**: ☐ PASS | ☐ FAIL  
**Issues**: _______________

---

### Scenario 5: Trends & Analytics (25 min)
- [ ] Navigate to Trends/Analytics page
- [ ] **Wealth Trend Chart**:
  - [ ] Line/bar chart renders
  - [ ] X-axis: time periods
  - [ ] Y-axis: wealth amounts
  - [ ] Data points accurate
  - [ ] Hover shows tooltip
- [ ] **Zakat Trend Chart**:
  - [ ] Chart renders
  - [ ] Data matches history
  - [ ] Hover shows amounts
- [ ] **Methodology Distribution**:
  - [ ] Pie/donut chart renders
  - [ ] All methodologies shown
  - [ ] Percentages add to 100%
  - [ ] Legend visible
- [ ] **Period Selection**:
  - [ ] "Last 30 days" updates charts
  - [ ] "1 year" shows full year
  - [ ] "All" shows all data
- [ ] Charts responsive

**Status**: ☐ PASS | ☐ FAIL  
**Issues**: _______________

---

### Scenario 6: Edit & Delete (15 min)
- [ ] Open calculation detail
- [ ] Click "Edit"
- [ ] Change notes to "Updated"
- [ ] Save changes
- [ ] Changes persist
- [ ] Open different calculation
- [ ] Click "Delete"
- [ ] Confirmation dialog appears
- [ ] Cancel first → calculation remains
- [ ] Delete again → Confirm
- [ ] Calculation removed from list
- [ ] Count decrements

**Status**: ☐ PASS | ☐ FAIL  
**Issues**: _______________

---

### Scenario 7: Export Functionality (20 min)
- [ ] Open calculation detail
- [ ] **Export JSON**:
  - [ ] File downloads: `zakat-calculation-YYYY-MM-DD.json`
  - [ ] Valid JSON structure
  - [ ] All data present
- [ ] **Export CSV**:
  - [ ] File downloads: `zakat-calculation-YYYY-MM-DD.csv`
  - [ ] Opens in Excel/Sheets
  - [ ] Data formatted correctly
- [ ] **Export PDF**:
  - [ ] Print dialog opens
  - [ ] Professional formatting
  - [ ] All sections visible
  - [ ] Islamic disclaimer present
- [ ] **Export All History**:
  - [ ] "Export All" button
  - [ ] File downloads
  - [ ] All calculations included
- [ ] **Export Filtered**:
  - [ ] Apply filter
  - [ ] Export filtered results
  - [ ] Only filtered data exported

**Status**: ☐ PASS | ☐ FAIL  
**Issues**: _______________

---

### Scenario 8: Comparison View (15 min)
- [ ] Select 2-3 calculations (checkboxes)
- [ ] Click "Compare Selected"
- [ ] Comparison view opens
- [ ] Side-by-side columns
- [ ] Rows: date, methodology, wealth, zakat, assets
- [ ] Difference indicators (arrows, %)
- [ ] Color coding (red/green)
- [ ] Insights section present
- [ ] Insights accurate and relevant
- [ ] Export comparison as PDF
- [ ] PDF downloads with comparison

**Status**: ☐ PASS | ☐ FAIL  
**Issues**: _______________

---

## 🔒 Security Validation (Optional, 15 min)

- [ ] **Authentication**:
  - [ ] Access history without login → Redirect to login
  - [ ] API call without token → 401 error
- [ ] **Authorization**:
  - [ ] User A cannot see User B's calculations
  - [ ] Direct URL access blocked
- [ ] **Data Encryption**:
  - [ ] Check database: `SELECT totalWealth FROM CalculationHistory LIMIT 1`
  - [ ] Shows encrypted: "encrypted:..." not plain number
- [ ] **Input Validation**:
  - [ ] Negative values rejected
  - [ ] SQL injection prevented
  - [ ] XSS attempts sanitized

**Status**: ☐ PASS | ☐ FAIL  
**Issues**: _______________

---

## ⚡ Performance Validation (Optional, 10 min)

- [ ] Calculator page load < 3 seconds
- [ ] History page load < 2 seconds
- [ ] Save calculation < 300ms
- [ ] Retrieve calculation < 200ms
- [ ] List 20 calculations < 500ms
- [ ] Apply filters < 200ms
- [ ] Generate trends < 400ms
- [ ] Methodology switch < 100ms
- [ ] No memory leaks
- [ ] Smooth animations (60fps)

**Status**: ☐ PASS | ☐ FAIL  
**Issues**: _______________

---

## 📱 Cross-Browser Testing (Optional, 20 min)

### Chrome (latest)
- [ ] T133 scenarios pass
- [ ] T150 scenarios pass
- [ ] No console errors

### Firefox (latest)
- [ ] T133 scenarios pass
- [ ] T150 scenarios pass
- [ ] No console errors

### Safari (latest)
- [ ] T133 scenarios pass
- [ ] T150 scenarios pass
- [ ] No console errors

### Edge (latest)
- [ ] T133 scenarios pass
- [ ] T150 scenarios pass
- [ ] No console errors

**Status**: ☐ PASS | ☐ FAIL  
**Issues**: _______________

---

## 📊 Test Results Summary

### T133: Methodology Switching
- **Scenarios Tested**: 6
- **Passed**: ___ / 6
- **Failed**: ___ / 6
- **Pass Rate**: ____%
- **Status**: ☐ PASS | ☐ FAIL

### T150: Calculation History
- **Scenarios Tested**: 8
- **Passed**: ___ / 8
- **Failed**: ___ / 8
- **Pass Rate**: ____%
- **Status**: ☐ PASS | ☐ FAIL

### Overall
- **Total Scenarios**: 14 (+ optional)
- **Total Passed**: ___ / 14
- **Total Failed**: ___ / 14
- **Overall Pass Rate**: ____%
- **Overall Status**: ☐ PASS | ☐ FAIL | ☐ CONDITIONAL PASS

---

## 🐛 Issues Found

### Critical Issues (Blockers)
| ID | Description | Scenario |
|----|-------------|----------|
| C1 | | |

### Major Issues (Should Fix)
| ID | Description | Scenario |
|----|-------------|----------|
| M1 | | |

### Minor Issues (Nice to Fix)
| ID | Description | Scenario |
|----|-------------|----------|
| N1 | | |

---

## 📝 Overall Assessment

### Recommendation:
☐ **READY FOR PRODUCTION** - All tests passed, no critical issues  
☐ **CONDITIONAL APPROVAL** - Minor issues found, can deploy with known limitations  
☐ **NEEDS WORK** - Major or critical issues require fixes

### Comments:
```
[Add any additional observations or recommendations]
```

---

## ✍️ Sign-Off

**Tester Name**: _______________  
**Signature**: _______________  
**Date**: _______________  
**Total Duration**: _______________ hours

**Reviewer Name**: _______________  
**Signature**: _______________  
**Date**: _______________

---

## 📎 Attachments

- [ ] Screenshots of any issues
- [ ] Server logs (if errors occurred)
- [ ] Browser console logs (if errors occurred)
- [ ] Performance metrics (if collected)

---

**Testing Complete!** 🎉

**Next Steps:**
1. Update task status in `specs/004-zakat-calculation-complete/tasks.md`
2. Create completion report if all passed
3. Create GitHub issues for any bugs found
4. Notify team of test results
