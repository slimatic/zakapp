# T133 & T150 Manual Testing - Ready for Execution

**Status**: ✅ **READY FOR MANUAL TESTING**  
**Feature**: 004 - Enhanced Zakat Calculation Engine  
**Phase**: 5 - Testing & Documentation  
**Date Prepared**: October 11, 2025

---

## 🎯 Executive Summary

All implementation and automated testing for Feature 004 is **100% complete** with **0 TypeScript errors**. The final two tasks (T133 and T150) require **manual end-to-end testing** to validate user experience and system integration.

### Tasks Ready for Testing

| Task | Description | Duration | Status |
|------|-------------|----------|--------|
| **T133** | Test methodology switching and persistence | 2 hours | 📋 Ready for Testing |
| **T150** | Test calculation history storage and retrieval | 2 hours | 📋 Ready for Testing |

**Total Testing Time**: ~4 hours (plus optional security/performance testing)

---

## 📚 Documentation Provided

### 1. Comprehensive Testing Guide
**Location**: `docs/manual-testing/FEATURE_004_MANUAL_TESTING_GUIDE.md`
- **13,500+ words** of detailed testing instructions
- **14 test scenarios** with step-by-step procedures
- **Checkbox-based format** for easy progress tracking
- Expected results and pass/fail criteria
- Issue tracking templates
- Security and performance validation
- Final sign-off forms

### 2. Quick Reference Card
**Location**: `docs/manual-testing/QUICK_REFERENCE_CARD.md`
- **3,000+ words** of quick reference material
- Fast 5-minute setup guide
- Essential checklists
- Common issues and solutions
- Performance quick tests
- Methodology quick reference table

### 3. Manual Testing README
**Location**: `docs/manual-testing/README.md`
- Overview of all documentation
- Quick start workflow with flowchart
- Helper scripts reference
- Troubleshooting guide
- Success criteria summary

### 4. Automated Setup Script
**Location**: `scripts/prepare-manual-testing.sh`
- Validates environment (Node.js, npm, dependencies)
- Checks database setup and migrations
- Verifies port availability
- Creates convenience helper scripts
- Provides guided next steps

---

## 🚀 Quick Start for Testers

### Step 1: Prepare Environment (10 minutes)

```bash
# Navigate to project root
cd /home/runner/work/zakapp/zakapp

# Run automated setup script
./scripts/prepare-manual-testing.sh
```

**What this does**:
- ✅ Checks Node.js and npm (v18+)
- ✅ Installs dependencies if needed
- ✅ Validates database migrations
- ✅ Checks port availability (3000, 5001)
- ✅ Creates helper scripts
- ✅ Verifies testing documentation

### Step 2: Start Services (2 minutes)

**Terminal 1 - Backend Server:**
```bash
./start-backend.sh
# Server starts on http://localhost:5001
```

**Terminal 2 - Frontend Client:**
```bash
./start-frontend.sh
# Client starts on http://localhost:3000
```

**Verify Services:**
```bash
./check-services.sh
# Should show both services running
```

### Step 3: Execute Tests (4 hours)

**Open Testing Guide**:
```bash
# View in your editor
code docs/manual-testing/FEATURE_004_MANUAL_TESTING_GUIDE.md

# Or view in browser
open docs/manual-testing/FEATURE_004_MANUAL_TESTING_GUIDE.md
```

**Test Execution Order**:
1. **T133 Test Scenarios** (2 hours)
   - Scenario 1: Initial methodology selection
   - Scenario 2: Switching between methodologies
   - Scenario 3: Same-session persistence
   - Scenario 4: Cross-session persistence (logout/login)
   - Scenario 5: Methodology impact on calculations
   - Scenario 6: UI/UX and accessibility

2. **T150 Test Scenarios** (2 hours)
   - Scenario 1: Save calculation to history
   - Scenario 2: Retrieve and display
   - Scenario 3: Filter history
   - Scenario 4: Pagination
   - Scenario 5: Trends and analytics
   - Scenario 6: Edit and delete
   - Scenario 7: Export functionality
   - Scenario 8: Calculation comparison

3. **Optional Testing** (30 minutes)
   - Security validation
   - Performance testing
   - Cross-browser compatibility
   - Responsive design

### Step 4: Report Results (15 minutes)

Complete the test summary report in the testing guide:
- Document pass/fail for each scenario
- Record any issues found (Critical/Major/Minor)
- Calculate pass rates
- Provide recommendations
- Sign-off if criteria met

---

## ✅ Success Criteria

### T133 Must Pass:
- ✅ All 4 methodologies selectable without errors
- ✅ Methodology switching instant (< 100ms)
- ✅ Persists within session (navigation, refresh)
- ✅ Persists across sessions (logout/login)
- ✅ Affects calculations correctly (nisab thresholds)
- ✅ UI/UX intuitive and accessible

### T150 Must Pass:
- ✅ Calculations save to database successfully
- ✅ History displays all saved calculations
- ✅ Filtering works (methodology, date, search)
- ✅ Pagination handles large datasets
- ✅ Trends visualize data accurately
- ✅ Edit and delete operations persist
- ✅ Export works in all formats (JSON, CSV, PDF)
- ✅ Comparison view displays correctly
- ✅ Security enforced (auth, encryption)
- ✅ Performance targets met

### Overall Success:
- ✅ No critical or blocking issues
- ✅ All test scenarios pass
- ✅ Islamic compliance maintained
- ✅ User experience smooth and intuitive

---

## 🎯 Test Coverage Matrix

| Category | T133 Coverage | T150 Coverage |
|----------|---------------|---------------|
| **Functionality** | ✅ Selection, switching, persistence | ✅ CRUD, filtering, pagination, trends |
| **UI/UX** | ✅ Visual feedback, accessibility | ✅ List views, detail views, charts |
| **Data** | ✅ Methodology preferences | ✅ Calculation history, encryption |
| **Integration** | ✅ Calculator integration | ✅ Backend API, database storage |
| **Performance** | ✅ Switch time < 100ms | ✅ Page load < 2s, operations < 500ms |
| **Security** | ✅ Preference validation | ✅ Authentication, authorization, encryption |
| **Edge Cases** | ✅ Below nisab scenarios | ✅ Large datasets, empty states |
| **Responsive** | ✅ Mobile, tablet, desktop | ✅ Mobile, tablet, desktop |
| **Accessibility** | ✅ Keyboard nav, screen reader | ✅ Keyboard nav, screen reader |

---

## 📊 Testing Resources

### Test Credentials
- **Email**: test@zakapp.local
- **Password**: TestPass123!
- *(Create if doesn't exist via registration)*

### Application URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Database Studio**: http://localhost:5555 (run `npx prisma studio`)

### Key Pages to Test
- **/calculator** - Main zakat calculator with methodology selector
- **/history** - Calculation history with filtering and pagination
- **/trends** - Analytics and trend visualizations (if available)

### Test Data Recommendations
- Create at least **5-10 calculations** with varying:
  - Methodologies (Standard, Hanafi, Shafi'i, Custom)
  - Wealth amounts ($5k, $10k, $20k, $50k, $100k)
  - Asset types (cash, gold, crypto, business)
  - Dates (spread across multiple months)

---

## 🐛 Known Issues & Limitations

### No Known Blockers
✅ All implementation complete  
✅ 0 TypeScript errors  
✅ All automated tests passing  
✅ Database migrations applied  
✅ No critical bugs reported  

### Notes for Testers
- **Browser Compatibility**: Test primarily on Chrome, Firefox, Safari
- **Mobile Testing**: Use responsive design mode or actual mobile device
- **Data Volume**: Create 25+ calculations to test pagination fully
- **Islamic Compliance**: Verify all methodology explanations and calculations align with Islamic jurisprudence

---

## 📞 Support & Assistance

### If You Encounter Issues

1. **Check Quick Reference Card** first:
   ```bash
   cat docs/manual-testing/QUICK_REFERENCE_CARD.md
   ```

2. **Check Server Logs**:
   ```bash
   cd server
   tail -f logs/app.log
   ```

3. **Check Browser Console**:
   - Press F12 → Console tab
   - Look for errors (red messages)

4. **Restart Services**:
   ```bash
   # Kill and restart backend
   lsof -ti:5001 | xargs kill -9
   ./start-backend.sh
   
   # Kill and restart frontend
   lsof -ti:3000 | xargs kill -9
   ./start-frontend.sh
   ```

5. **Verify Database**:
   ```bash
   cd server
   npx prisma studio
   # Opens GUI at http://localhost:5555
   ```

### Documentation References
- **Feature Spec**: `specs/004-zakat-calculation-complete/spec.md`
- **API Contracts**: `specs/004-zakat-calculation-complete/contracts/`
- **Implementation Report**: `FEATURE_004_IMPLEMENTATION_COMPLETE.md`
- **Task List**: `specs/004-zakat-calculation-complete/tasks.md`

---

## 🎉 After Testing

### When All Tests Pass:

1. ✅ Complete test summary report in testing guide
2. ✅ Update task status:
   - Mark T133 as ✅ COMPLETE
   - Mark T150 as ✅ COMPLETE
3. ✅ Update `specs/004-zakat-calculation-complete/tasks.md`
4. ✅ Create completion report: `T133_T150_COMPLETE.md`
5. ✅ Notify team of testing completion
6. ✅ Celebrate! 🎊

### If Issues Found:

1. 📝 Document all issues in testing guide
2. 🏷️ Categorize by severity (Critical/Major/Minor)
3. 🐛 Create GitHub issues for critical/major bugs
4. 🔄 Fix issues and re-test affected scenarios
5. ✅ Sign-off once all critical issues resolved

---

## 🔑 Key Points to Remember

### For T133 (Methodology):
- Focus on **persistence** - logout/login is critical
- Verify **calculations change** with methodology
- Test **all 4 methodologies** (Standard, Hanafi, Shafi'i, Custom)
- Check **nisab thresholds** update correctly

### For T150 (History):
- Test with **realistic data** (multiple calculations)
- Verify **filtering combinations** work together
- Create **25+ calculations** to test pagination fully
- Check **trends** with data spanning months
- Test **export** in all formats (JSON, CSV, PDF)

### General:
- **Document everything** - even minor issues
- **Take screenshots** - especially of bugs
- **Think like a user** - is it intuitive?
- **Test edge cases** - empty states, large values
- **Verify Islamic compliance** - accuracy matters

---

## 📋 Pre-Flight Checklist

Before starting testing, verify:

- [ ] Node.js v18+ installed
- [ ] All dependencies installed
- [ ] Database migrations applied
- [ ] Ports 3000 and 5001 available
- [ ] Test user account exists or can be created
- [ ] Testing documentation reviewed
- [ ] Helper scripts created
- [ ] Services can start successfully
- [ ] Browser DevTools accessible (F12)
- [ ] Time allocated (4+ hours)

---

## 🚀 Ready to Begin?

**You have everything you need to complete T133 and T150 testing!**

### Start Now:

```bash
# 1. Run setup script
./scripts/prepare-manual-testing.sh

# 2. Start backend (Terminal 1)
./start-backend.sh

# 3. Start frontend (Terminal 2)
./start-frontend.sh

# 4. Open testing guide
open docs/manual-testing/FEATURE_004_MANUAL_TESTING_GUIDE.md

# 5. Begin with T133 Scenario 1
```

---

**Questions?** Review the comprehensive documentation in `docs/manual-testing/`

**Ready?** Let's complete Feature 004! 🎯

Good luck with testing! 🍀
