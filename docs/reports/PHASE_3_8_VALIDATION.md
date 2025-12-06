# Phase 3.8 Validation Instructions

## Overview
Phase 3.8 (E2E Testing & Performance Audit) implementation is complete. This document provides step-by-step instructions to validate all tests pass before committing.

---

## Prerequisites

1. **Install Dependencies** (if not already done):
```bash
# Install Playwright browsers
npx playwright install

# Verify Playwright installation
npx playwright --version
```

2. **Start Development Servers**:
```bash
# Terminal 1: Start backend
cd /home/lunareclipse/zakapp
npm run dev:server

# Terminal 2: Start frontend
cd /home/lunareclipse/zakapp
npm run dev:client
```

3. **Verify servers are running**:
   - Backend: http://localhost:3001
   - Frontend: http://localhost:3000

---

## Validation Steps

### Step 1: Run E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Expected output:
# ✓ 30 tests passed across 4 files
# ✓ Estimated time: ~3.5 minutes
```

**If tests fail**:
```bash
# Run with headed mode to see browser
npx playwright test --headed

# Run specific test file
npx playwright test tests/e2e/navigation.spec.ts

# Run with debug mode
npx playwright test --debug
```

### Step 2: Generate Test Report

```bash
# View HTML test report
npx playwright show-report
```

This opens a browser with:
- Pass/fail status for each test
- Execution time per test
- Screenshots and videos (if failures occurred)
- Detailed error traces

### Step 3: Run Lighthouse Audit

```bash
# Ensure frontend is running at http://localhost:3000
./scripts/lighthouse-audit.sh
```

**Expected Output**:
```
🖥️  Desktop Scores:
   Performance:     ≥90
   Accessibility:   ≥95
   Best Practices:  ≥95
   SEO:             ≥90

📱 Mobile Scores:
   Performance:     ≥90
   Accessibility:   ≥95
   Best Practices:  ≥95
   SEO:             ≥90

✅ All scores meet or exceed targets!
```

### Step 4: Review Lighthouse Reports

```bash
# Open desktop report
open client/reports/lighthouse/dashboard-desktop.report.html

# Open mobile report
open client/reports/lighthouse/dashboard-mobile.report.html
```

**Check for**:
- Core Web Vitals are in "green" zone
- No accessibility violations
- No console errors
- Performance budget is not exceeded

---

## Troubleshooting

### E2E Tests Failing

**Issue**: "Error: page.goto: net::ERR_CONNECTION_REFUSED"
- **Solution**: Ensure frontend server is running at http://localhost:3000

**Issue**: "Error: Timeout 30000ms exceeded"
- **Solution**: Check if backend API is responding at http://localhost:3001
- **Solution**: Increase timeout in test file or playwright.config.ts

**Issue**: "Selector not found"
- **Solution**: Check if component rendering is correct
- **Solution**: Run test with `--headed` to see actual page state
- **Solution**: Update selector to match current component structure

### Lighthouse Audit Failing

**Issue**: "Dev server is not running"
- **Solution**: Start frontend: `npm run dev:client`

**Issue**: "Lighthouse CLI not found"
- **Solution**: Script auto-installs, but you can manually run: `npm install -g lighthouse`

**Issue**: "Scores below targets"
- **Solution**: Not a blocker for Phase 3.8 completion
- **Solution**: Review recommendations in HTML report
- **Solution**: Address performance issues in future optimization phase

---

## Success Criteria

Phase 3.8 is validated when:

- [ ] All 30 E2E tests pass (4 test files)
- [ ] Playwright test report shows 0 failures
- [ ] Lighthouse audit script runs without errors
- [ ] Desktop audit completes successfully
- [ ] Mobile audit completes successfully
- [ ] Lighthouse reports are saved to `client/reports/lighthouse/`
- [ ] All target scores are documented (even if not met yet)

---

## Commit After Validation

Once validation passes:

```bash
# Stage all Phase 3.8 files
git add tests/e2e/
git add scripts/lighthouse-audit.sh
git add lighthouse-budget.json
git add client/reports/lighthouse/README.md
git add PHASE_3_8_COMPLETE.md

# Commit
git commit -m "feat(phase-3.8): Add E2E tests and Lighthouse performance audit

- Add 4 E2E test files with 30 test scenarios
- Implement automated Lighthouse audit script
- Create performance budget configuration
- Add comprehensive test documentation

Tests cover:
- New user onboarding flow (4 tests)
- Returning user with active records (7 tests)
- Complete navigation flows (9 tests)
- Mobile responsive navigation (10 tests)

Lighthouse audits configured for:
- Desktop and mobile presets
- Performance targets (≥90)
- Accessibility targets (≥95)
- Automated score validation

Related tasks: T039, T040, T041, T042, T043"
```

---

## Next Phase

After committing Phase 3.8, proceed to:

**Phase 3.9 - Manual Testing & Validation**
- Execute quickstart.md scenarios manually
- Test on real devices
- Validate with screen readers
- Document all findings

See `tasks.md` for Phase 3.9 details.

---

## Files Created in Phase 3.8

```
tests/e2e/
├── new-user-onboarding.spec.ts     # T039 - 4 tests
├── returning-user.spec.ts          # T040 - 7 tests
├── navigation.spec.ts              # T041 - 9 tests
└── mobile-navigation.spec.ts       # T042 - 10 tests

scripts/
└── lighthouse-audit.sh             # T043 - Audit automation

lighthouse-budget.json               # T043 - Performance budget

client/reports/lighthouse/
└── README.md                        # T043 - Documentation

PHASE_3_8_COMPLETE.md               # Phase completion report
PHASE_3_8_VALIDATION.md             # This file
```

---

## Quick Reference

```bash
# Full validation sequence
npx playwright test                          # Run E2E tests
npx playwright show-report                   # View test report
./scripts/lighthouse-audit.sh                # Run Lighthouse audit
git add . && git commit -m "..."            # Commit Phase 3.8
```

**Estimated Total Time**: 15-20 minutes
