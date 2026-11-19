# Quick Reference Card - T133 & T150 Manual Testing

## 🚀 Quick Start (5 minutes)

### 1. Start Services
```bash
# Terminal 1 - Backend
cd /home/runner/work/zakapp/zakapp/server && npm run dev

# Terminal 2 - Frontend
cd /home/runner/work/zakapp/zakapp/client && npm run dev
```

### 2. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Database Studio**: `npx prisma studio` (port 5555)

### 3. Test User
- **Email**: test@zakapp.local
- **Password**: TestPass123!

---

## 📋 T133: Methodology Switching Checklist

### Core Tests (30 minutes)
- [ ] ✅ Select Standard methodology - nisab $5,500
- [ ] ✅ Switch to Hanafi - nisab $3,000
- [ ] ✅ Switch to Shafi'i - nisab $5,500
- [ ] ✅ Switch to Custom - custom rules
- [ ] ✅ Navigate away and back - selection persists
- [ ] ✅ Refresh page - selection persists
- [ ] ✅ Logout and login - selection persists

### Edge Cases (15 minutes)
- [ ] Below nisab with Hanafi ($4,000) - should calculate Zakat
- [ ] Below nisab with Standard ($4,000) - should NOT calculate
- [ ] Large values ($1M+) - no performance issues

### Accessibility (15 minutes)
- [ ] Keyboard navigation (Tab, Enter, Space)
- [ ] Mobile responsive (375px viewport)
- [ ] Screen reader announces methodology names

**Total Time**: ~60 minutes

---

## 📊 T150: Calculation History Checklist

### Core Tests (45 minutes)
- [ ] ✅ Save calculation - success message
- [ ] ✅ View history list - all calculations shown
- [ ] ✅ Filter by methodology - only Hanafi shown
- [ ] ✅ Filter by date range - correct results
- [ ] ✅ Search by notes - finds matching calculations
- [ ] ✅ Pagination - Next/Previous buttons work
- [ ] ✅ View calculation details - all data shown
- [ ] ✅ Edit calculation - changes persist
- [ ] ✅ Delete calculation - confirmation required

### Trends & Analytics (30 minutes)
- [ ] Wealth trend chart - line graph shows growth
- [ ] Zakat trend chart - bar graph shows amounts
- [ ] Methodology distribution - pie chart shows percentages
- [ ] Period selection - Last 30 days, 1 year, All

### Export & Comparison (15 minutes)
- [ ] Export as JSON - file downloads, valid structure
- [ ] Export as CSV - opens in Excel/Sheets
- [ ] Export as PDF - print dialog, professional format
- [ ] Compare 2 calculations - side-by-side view

**Total Time**: ~90 minutes

---

## 🔍 Common Issues & Solutions

### Issue: "Port 3000 already in use"
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9
# Restart frontend
cd /home/runner/work/zakapp/zakapp/client && npm run dev
```

### Issue: "Database migration needed"
```bash
cd /home/runner/work/zakapp/zakapp/server
npx prisma migrate deploy
```

### Issue: "Cannot login - invalid credentials"
```bash
# Create test user (if doesn't exist)
cd /home/runner/work/zakapp/zakapp/server
npm run seed # or create manually via API
```

### Issue: "Methodology not persisting"
```javascript
// Check browser console
console.log(localStorage.getItem('selectedMethodology'));
// Should show: "standard", "hanafi", "shafi'i", or "custom"
```

### Issue: "Calculation not saving"
```bash
# Check server logs
cd /home/runner/work/zakapp/zakapp/server
tail -f logs/app.log | grep "calculation"
```

---

## 🎯 Critical Test Points

### Must Pass (Blockers)
1. ✅ Methodology switching works without errors
2. ✅ Methodology persists after logout/login
3. ✅ Calculations save to database
4. ✅ History page displays saved calculations
5. ✅ Authentication/authorization enforced

### Should Pass (Major)
1. ✅ Filtering and pagination functional
2. ✅ Trends charts render correctly
3. ✅ Export in all formats works
4. ✅ Edit/delete operations persist
5. ✅ Performance within targets

### Nice to Pass (Minor)
1. ✅ Smooth animations and transitions
2. ✅ Helpful tooltips and educational content
3. ✅ Responsive on all device sizes
4. ✅ Perfect accessibility compliance

---

## 📊 Quick Data Setup

### Create 5 Test Calculations (API Method)
```bash
# Save this as create-test-data.sh
TOKEN="YOUR_JWT_TOKEN"
API="http://localhost:5001/api/calculations"

# Calculation 1 - Standard, $15k wealth
curl -X POST $API \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "methodology": "standard",
    "totalWealth": 15000,
    "nisabThreshold": 5500,
    "zakatDue": 375,
    "assetBreakdown": {"cash": 10000, "gold": 5000},
    "notes": "Test calculation 1"
  }'

# Calculation 2 - Hanafi, $20k wealth
curl -X POST $API \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "methodology": "hanafi",
    "totalWealth": 20000,
    "nisabThreshold": 3000,
    "zakatDue": 500,
    "assetBreakdown": {"cash": 15000, "gold": 5000},
    "notes": "Test calculation 2"
  }'

# Add 3 more calculations...
```

### Create Test Data (Manual Method)
1. Login to app
2. Navigate to Calculator
3. Enter values and click Calculate
4. Click "Save Calculation"
5. Add notes and save
6. Repeat 5 times with different values

---

## 🔒 Security Test Quick Checks

### Authentication
```bash
# Should return 401
curl http://localhost:5001/api/calculations

# Should return 200 with data
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/calculations
```

### Data Encryption
```bash
# Check database - should see encrypted values
cd /home/runner/work/zakapp/zakapp/server
sqlite3 data/zakapp.db "SELECT totalWealth FROM CalculationHistory LIMIT 1"
# Output should be: encrypted:ABC123... (not plain number)
```

### Input Validation
```javascript
// Try in browser console (should be rejected)
fetch('http://localhost:5001/api/calculations', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    methodology: 'standard',
    totalWealth: -1000, // Negative value - should fail
    zakatDue: 0
  })
})
```

---

## ⚡ Performance Quick Tests

### Measure Page Load
```javascript
// Run in browser console
performance.mark('start');
// Navigate to history page
performance.mark('end');
performance.measure('pageLoad', 'start', 'end');
console.log(performance.getEntriesByName('pageLoad')[0].duration);
// Should be < 2000ms
```

### Measure API Response
```bash
time curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/calculations
# Should be < 0.5 seconds
```

---

## 📸 Screenshots Needed

For documentation, capture screenshots of:
1. [ ] Methodology selector showing all 4 options
2. [ ] Selected methodology with highlighted card
3. [ ] Calculation history list view
4. [ ] Calculation detail modal
5. [ ] Trends page with charts
6. [ ] Filter UI in action
7. [ ] Export options menu
8. [ ] Comparison view side-by-side
9. [ ] Mobile responsive view
10. [ ] Error state (if any found)

---

## ✅ Quick Pass/Fail Criteria

### T133 Passes If:
- ✅ Can select all 4 methodologies
- ✅ Switching is instant (< 100ms)
- ✅ Persists after logout/login
- ✅ Affects calculations correctly
- ✅ No console errors

### T133 Fails If:
- ❌ Methodology doesn't persist
- ❌ Switching causes errors
- ❌ Calculations incorrect
- ❌ UI freezes or crashes

### T150 Passes If:
- ✅ Can save calculations
- ✅ History displays correctly
- ✅ Filtering works
- ✅ Pagination functional
- ✅ Export works in all formats

### T150 Fails If:
- ❌ Can't save calculations
- ❌ History doesn't load
- ❌ Data loss occurs
- ❌ Security vulnerabilities

---

## 🎓 Methodology Quick Reference

| Methodology | Nisab Basis | Threshold | Use Case |
|-------------|-------------|-----------|----------|
| Standard (AAOIFI) | Gold (85g) | ~$5,500 | International standard |
| Hanafi | Silver (595g) | ~$3,000 | South Asia, more charitable |
| Shafi'i | Gold (85g), separate silver | ~$5,500 | Southeast Asia, detailed |
| Custom | User-defined | Variable | Special circumstances |

---

## 📝 Test Report Template

```markdown
## Test Execution Report

**Tester**: [Your Name]
**Date**: [Date]
**Duration**: [Time]

### T133 Results
- Scenarios Passed: __/6
- Issues Found: [List]
- Status: ☐ PASS | ☐ FAIL

### T150 Results
- Scenarios Passed: __/8
- Issues Found: [List]
- Status: ☐ PASS | ☐ FAIL

### Recommendation
☐ Ready for production
☐ Needs minor fixes
☐ Requires significant work
```

---

## 🆘 Emergency Contacts

**If you encounter blocking issues:**

1. Check this guide's troubleshooting section
2. Check server logs: `tail -f server/logs/app.log`
3. Check browser console (F12)
4. Document issue with steps to reproduce
5. Create GitHub issue with [BUG] tag

---

## 🔗 Useful Links

- **Full Testing Guide**: `docs/manual-testing/FEATURE_004_MANUAL_TESTING_GUIDE.md`
- **API Specification**: `api-specification.md`
- **Feature Spec**: `specs/004-zakat-calculation-complete/spec.md`
- **Implementation Report**: `FEATURE_004_IMPLEMENTATION_COMPLETE.md`

---

**Remember**: Focus on user experience! Does it feel natural? Is it intuitive? Does it work as expected?
