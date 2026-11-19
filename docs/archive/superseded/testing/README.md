# Manual Testing Documentation

This directory contains comprehensive manual testing guides for ZakApp features.

## 📚 Available Guides

### Feature 004: Enhanced Zakat Calculation Engine

**Tasks Covered**: T133 (Methodology Switching), T150 (Calculation History)

#### Main Documents

1. **[FEATURE_004_MANUAL_TESTING_GUIDE.md](./FEATURE_004_MANUAL_TESTING_GUIDE.md)** - Complete testing guide
   - 14 comprehensive test scenarios
   - Step-by-step instructions
   - Expected results and validation criteria
   - Issue tracking templates
   - ~4 hours estimated testing time

2. **[QUICK_REFERENCE_CARD.md](./QUICK_REFERENCE_CARD.md)** - Quick reference for testers
   - Fast setup instructions
   - Checklists for each task
   - Common issues and solutions
   - Performance quick tests
   - Critical test points

## 🚀 Quick Start

### 1. Prepare Environment

Run the automated setup script:

```bash
cd /home/runner/work/zakapp/zakapp
./scripts/prepare-manual-testing.sh
```

This script will:
- ✅ Check Node.js and npm installation
- ✅ Install dependencies (if needed)
- ✅ Verify database setup
- ✅ Check port availability
- ✅ Validate environment variables
- ✅ Create helper scripts

### 2. Start Services

**Terminal 1 - Backend:**
```bash
./start-backend.sh
# or
cd server && npm run dev
```

**Terminal 2 - Frontend:**
```bash
./start-frontend.sh
# or
cd client && npm run dev
```

### 3. Verify Services Running

```bash
./check-services.sh
```

Expected output:
```
Backend (http://localhost:5001): ✅ Running
Frontend (http://localhost:3000): ✅ Running
```

### 4. Begin Testing

1. Open **[FEATURE_004_MANUAL_TESTING_GUIDE.md](./FEATURE_004_MANUAL_TESTING_GUIDE.md)** for detailed scenarios
2. Keep **[QUICK_REFERENCE_CARD.md](./QUICK_REFERENCE_CARD.md)** handy for quick lookups
3. Start with T133 Test Scenario 1
4. Document any issues found in the issue tracking section

## 📊 Testing Overview

### T133: Methodology Switching & Persistence

**Objective**: Verify methodology selection, switching, and persistence

**Scenarios**: 6 test scenarios covering:
- Initial methodology selection
- Switching between methodologies
- Within-session persistence
- Cross-session persistence (logout/login)
- Methodology impact on calculations
- UI/UX and accessibility

**Estimated Time**: 2 hours

**Critical Success Criteria**:
- ✅ All 4 methodologies selectable
- ✅ Switching is instant and error-free
- ✅ Persists across logout/login
- ✅ Affects calculations correctly

---

### T150: Calculation History Storage & Retrieval

**Objective**: Verify calculation history CRUD, filtering, pagination, and trends

**Scenarios**: 8 test scenarios covering:
- Save calculation to history
- Retrieve and display history
- Filter by methodology, date, search
- Pagination with large datasets
- Trend visualizations
- Edit and delete operations
- Export in multiple formats
- Calculation comparison

**Estimated Time**: 2 hours

**Critical Success Criteria**:
- ✅ Calculations save and retrieve correctly
- ✅ Filtering and pagination functional
- ✅ Trends visualize data accurately
- ✅ Export works in all formats

---

## 🎯 Test Execution Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Environment Setup (10 mins)                             │
│     - Run prepare-manual-testing.sh                         │
│     - Start backend and frontend                            │
│     - Verify services running                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. T133: Methodology Switching (2 hours)                   │
│     - Scenario 1: Initial selection                         │
│     - Scenario 2: Switching between methods                 │
│     - Scenario 3: Same-session persistence                  │
│     - Scenario 4: Cross-session persistence                 │
│     - Scenario 5: Calculation impact                        │
│     - Scenario 6: UI/UX and accessibility                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. T150: Calculation History (2 hours)                     │
│     - Scenario 1: Save to history                           │
│     - Scenario 2: Retrieve and display                      │
│     - Scenario 3: Filtering                                 │
│     - Scenario 4: Pagination                                │
│     - Scenario 5: Trends and charts                         │
│     - Scenario 6: Edit and delete                           │
│     - Scenario 7: Export functionality                      │
│     - Scenario 8: Comparison view                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Additional Testing (Optional, 30 mins)                  │
│     - Security validation                                   │
│     - Performance testing                                   │
│     - Cross-browser testing                                 │
│     - Responsive design testing                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Report and Sign-off (15 mins)                           │
│     - Complete test summary report                          │
│     - Document all issues found                             │
│     - Provide recommendations                               │
│     - Sign-off if all criteria met                          │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Helper Scripts

The following helper scripts are created by `prepare-manual-testing.sh`:

| Script | Purpose |
|--------|---------|
| `start-backend.sh` | Start the backend server on port 5001 |
| `start-frontend.sh` | Start the frontend on port 3000 |
| `check-services.sh` | Check if services are running |

## 📝 Test Report Template

After completing testing, fill out the test summary report in the main testing guide:

- **Tester Name**: _________________
- **Date**: _________________
- **Duration**: _________ hours
- **T133 Pass Rate**: ___%
- **T150 Pass Rate**: ___%
- **Overall Status**: ☐ PASS | ☐ FAIL | ☐ CONDITIONAL PASS

## 🐛 Issue Reporting

If you find issues during testing:

1. **Document in the testing guide** under "Issue Tracking" section
2. **Categorize by severity**: Critical, Major, or Minor
3. **Include**:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
4. **Create GitHub issue** with [BUG] tag for critical/major issues

## 🔍 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill process on port 3000 or 5001
lsof -ti:3000 | xargs kill -9
lsof -ti:5001 | xargs kill -9
```

**Database migration needed:**
```bash
cd server
npx prisma migrate deploy
```

**Cannot login:**
- Verify test user exists
- Check server logs: `tail -f server/logs/app.log`
- Create user via registration if needed

**Methodology not persisting:**
- Check browser console: `localStorage.getItem('selectedMethodology')`
- Clear browser cache and retry
- Verify backend API returns preference

### Getting Help

1. Check the **[QUICK_REFERENCE_CARD.md](./QUICK_REFERENCE_CARD.md)** troubleshooting section
2. Review server logs: `server/logs/app.log`
3. Check browser console (F12 → Console tab)
4. Verify database state: `cd server && npx prisma studio`

## 📚 Additional Resources

- **Feature Specification**: `/specs/004-zakat-calculation-complete/spec.md`
- **API Contracts**: `/specs/004-zakat-calculation-complete/contracts/`
- **Implementation Report**: `/FEATURE_004_IMPLEMENTATION_COMPLETE.md`
- **Task List**: `/specs/004-zakat-calculation-complete/tasks.md`
- **Phase 3 Testing Checklist**: `/specs/004-zakat-calculation-complete/PHASE3_TESTING_CHECKLIST.md`

## ✅ Success Criteria

Testing is considered successful when:

### T133 Success Criteria
- ✅ All 4 methodologies are selectable without errors
- ✅ Switching between methodologies is instant (< 100ms)
- ✅ Methodology persists within same session
- ✅ Methodology persists across logout/login
- ✅ Methodology affects calculations correctly
- ✅ UI/UX is intuitive and accessible
- ✅ No console errors or performance issues

### T150 Success Criteria
- ✅ Calculations save successfully to database
- ✅ History page displays all saved calculations
- ✅ Filtering works (by methodology, date, search)
- ✅ Pagination handles large datasets (25+ calculations)
- ✅ Trends visualize data accurately with interactive charts
- ✅ Edit and delete operations work and persist
- ✅ Export works in all formats (JSON, CSV, PDF)
- ✅ Comparison view displays side-by-side data
- ✅ Security measures enforced (auth, encryption)
- ✅ Performance targets met (< 2s page loads)

### Overall Success
- ✅ No critical or major bugs found
- ✅ All test scenarios pass
- ✅ Islamic compliance maintained
- ✅ User experience is smooth and intuitive

## 🎉 After Testing

Once testing is complete and all criteria are met:

1. ✅ Complete the test summary report
2. ✅ Document any issues found (even minor ones)
3. ✅ Provide recommendations for production readiness
4. ✅ Update task status in `/specs/004-zakat-calculation-complete/tasks.md`
5. ✅ Sign-off on the testing guide
6. ✅ Notify team that T133 and T150 are complete

---

**Questions?** Review the full [FEATURE_004_MANUAL_TESTING_GUIDE.md](./FEATURE_004_MANUAL_TESTING_GUIDE.md) for detailed instructions.

**Ready to start?** Run `./scripts/prepare-manual-testing.sh` and begin with T133 Scenario 1!

🚀 Happy Testing!
