# Manual Testing Preparation Complete - T067-T073

**Date**: 2025-11-07  
**Feature**: 008-nisab-year-record  
**Status**: ✅ **READY FOR EXECUTION**

---

## Summary

I've prepared comprehensive documentation and tools to help execute the manual testing scenarios (T067-T073) for the Nisab Year Record feature. These tests are **required before production deployment** according to the specification analysis report.

---

## 📋 What Was Created

### 1. **MANUAL_TESTING_EXECUTION_GUIDE.md**
**Location**: `/home/lunareclipse/zakapp/specs/008-nisab-year-record/MANUAL_TESTING_EXECUTION_GUIDE.md`

Comprehensive testing guide with:
- ✅ Pre-test setup checklist
- ✅ Detailed step-by-step instructions for all 7 scenarios (T067-T073)
- ✅ Expected outcomes and success criteria for each step
- ✅ Issue logging templates
- ✅ Performance validation procedures
- ✅ Accessibility checks (WCAG 2.1 AA)
- ✅ Islamic compliance verification steps
- ✅ Test summary report template
- ✅ Tester sign-off section

**Estimated Time**: ~90 minutes total (can be split across multiple sessions)

### 2. **manual-testing-helper.sh**
**Location**: `/home/lunareclipse/zakapp/specs/008-nisab-year-record/manual-testing-helper.sh`

Interactive bash script that automates:
- ✅ Environment checks (servers, database)
- ✅ Test user verification
- ✅ Nisab record inspection
- ✅ Precious metal price cache viewing
- ✅ Hawl completion simulation (for T070 testing)
- ✅ Hawl detection job triggering
- ✅ Backend log viewing

**Usage**:
```bash
cd /home/lunareclipse/zakapp/specs/008-nisab-year-record
./manual-testing-helper.sh
```

---

## 🚀 How to Execute Tests

### Quick Start

1. **Ensure servers are running**:
   ```bash
   cd /home/lunareclipse/zakapp
   # Terminal 1: Backend
   npm run server:dev
   
   # Terminal 2: Frontend
   npm run client:dev
   ```

2. **Run the testing helper**:
   ```bash
   cd specs/008-nisab-year-record
   ./manual-testing-helper.sh
   ```

3. **Open the testing guide**:
   - Use VS Code: Open `MANUAL_TESTING_EXECUTION_GUIDE.md`
   - Or via helper script: Select option 7 in the menu

4. **Follow the guide step-by-step**:
   - Start with Pre-Test Setup Checklist
   - Execute T067 → T073 in order
   - Mark checkboxes as you complete each step
   - Record any issues in the Issues/Notes sections

5. **Complete the test summary**:
   - Fill in the Test Summary Report section
   - Document all issues found
   - Sign off when complete

---

## 📊 Test Scenarios Overview

### T067: First-Time Nisab Achievement & Hawl Start (~10 min)
- Verify automatic Hawl detection when wealth reaches Nisab
- Confirm DRAFT record creation
- Check Dashboard displays Hawl status

### T068: Live Tracking During Hawl (~8 min)
- Verify real-time wealth updates as assets change
- Confirm live calculation (no database persistence)

### T069: Wealth Falls Below Nisab (~7 min)
- Verify Hawl interruption detection
- Confirm record archived correctly

### T070: Hawl Completion & Finalization (~10 min)
- Verify finalization workflow after 354 days
- Test liability deductions
- Confirm record becomes immutable

### T071: Unlock & Edit Finalized Record (~8 min)
- Verify unlock requires reason (min 10 chars)
- Test edit workflow
- Verify complete audit trail

### T072: Invalid Operations (~5 min)
- Test premature finalization (should fail)
- Test invalid status transitions (should fail)
- Verify descriptive error messages

### T073: Nisab Threshold Calculation (~7 min)
- Verify correct gold/silver calculations
- Test price caching (24-hour TTL)
- Verify API fallback behavior

---

## ✅ Success Criteria

All manual tests MUST pass before production deployment:

1. **Functional Requirements**:
   - [ ] All 7 scenarios execute successfully
   - [ ] No critical bugs discovered
   - [ ] Edge cases handled gracefully

2. **Performance**:
   - [ ] Aggregate wealth calculation <100ms (for 500 assets)
   - [ ] Dashboard page load <2s
   - [ ] Live tracking updates <500ms latency

3. **Accessibility**:
   - [ ] Keyboard navigation works on all components
   - [ ] WCAG 2.1 AA compliance verified
   - [ ] Color contrast ratios meet standards

4. **Islamic Compliance**:
   - [ ] Nisab thresholds correct (87.48g gold, 612.36g silver)
   - [ ] Hawl duration correct (~354 days lunar)
   - [ ] Zakat rate correct (2.5% of entire zakatable wealth)

---

## 🔧 Troubleshooting

### Servers Not Running
```bash
# Check server status
pgrep -f "node.*server"    # Backend
pgrep -f "react-scripts"    # Frontend

# Start servers
cd /home/lunareclipse/zakapp
npm run server:dev   # Terminal 1
npm run client:dev   # Terminal 2
```

### Database Issues
```bash
# Check database exists
ls -lh /home/lunareclipse/zakapp/server/zakapp.db

# Verify tables
sqlite3 server/zakapp.db ".tables"
```

### No Test User
1. Navigate to http://localhost:3000/register
2. Create account with test credentials
3. Login and proceed with testing

### Hawl Not Starting (T067)
- Ensure total assets > Nisab threshold (~$6000)
- Trigger background job manually using helper script
- Or restart backend server to run job immediately

### Can't Finalize Record (T070)
- Check `hawlCompletionDate` is in the past
- Use helper script to simulate Hawl completion
- Or manually update database: `UPDATE nisab_year_records SET hawlCompletionDate='2025-11-06' WHERE status='DRAFT';`

---

## 📝 Next Steps After Testing

### If All Tests Pass ✅
1. Fill in Test Summary Report in the guide
2. Update `tasks.md` to mark T067-T073 as complete
3. Create commit:
   ```bash
   git add specs/008-nisab-year-record/MANUAL_TESTING_EXECUTION_GUIDE.md
   git commit -m "test(008): Complete manual testing scenarios T067-T073

   - All 7 scenarios executed and passed
   - Performance validated (aggregate calc, page load, live tracking)
   - Accessibility verified (WCAG 2.1 AA)
   - Islamic compliance confirmed (Nisab, Hawl, Zakat rate)
   
   Test duration: ~90 minutes
   Critical issues: 0
   Medium issues: 0
   Minor issues: [list any found]
   
   Ready for production deployment."
   ```
4. Update SPECIFICATION_ANALYSIS_REPORT.md to mark M2 as complete

### If Tests Fail ❌
1. Document all issues in the guide's Issues Log
2. Classify severity: CRITICAL / MEDIUM / LOW
3. Create GitHub issues for each bug
4. Fix critical and medium issues before production
5. Re-run failed scenarios after fixes
6. Update Test Summary Report with final results

---

## 📚 Related Documents

- **Feature Specification**: `/home/lunareclipse/zakapp/specs/008-nisab-year-record/spec.md`
- **Implementation Plan**: `/home/lunareclipse/zakapp/specs/008-nisab-year-record/plan.md`
- **Tasks List**: `/home/lunareclipse/zakapp/specs/008-nisab-year-record/tasks.md`
- **Quickstart Guide**: `/home/lunareclipse/zakapp/specs/008-nisab-year-record/quickstart.md`
- **Analysis Report**: `/home/lunareclipse/zakapp/specs/008-nisab-year-record/SPECIFICATION_ANALYSIS_REPORT.md`

---

## 📞 Support

If you encounter issues during testing:

1. **Check backend logs**:
   ```bash
   tail -f /tmp/zakapp-backend.log
   # Or use helper script option 8
   ```

2. **Check browser console**:
   - Open DevTools (F12)
   - Check Console tab for JavaScript errors
   - Check Network tab for failed API calls

3. **Use the helper script**:
   ```bash
   ./manual-testing-helper.sh
   # Interactive menu with diagnostics
   ```

4. **Review specification**:
   - Check `spec.md` for expected behavior
   - Check `quickstart.md` for additional context

---

## 🎯 Testing Checklist

Before you begin:
- [ ] Read the entire MANUAL_TESTING_EXECUTION_GUIDE.md
- [ ] Ensure 90 minutes of uninterrupted time available
- [ ] Backend and frontend servers running
- [ ] Test user account ready
- [ ] Browser DevTools open for monitoring

During testing:
- [ ] Follow each step in order
- [ ] Mark checkboxes as you complete steps
- [ ] Record actual values vs expected values
- [ ] Take screenshots of key screens
- [ ] Document any issues immediately

After testing:
- [ ] Complete Test Summary Report
- [ ] Fill in Issues Log (if applicable)
- [ ] Sign off in Tester Sign-Off section
- [ ] Update tasks.md (mark T067-T073 complete)
- [ ] Commit testing results

---

**Preparation Date**: 2025-11-07  
**Prepared By**: GitHub Copilot  
**Feature**: 008-nisab-year-record  
**Status**: ✅ Ready for execution

**Estimated Effort**:
- Test execution: ~90 minutes
- Documentation: ~15 minutes
- Total: ~105 minutes

---

*Good luck with the testing! Remember to take breaks between scenarios to maintain focus. Quality assurance is critical for production readiness.* 🚀
