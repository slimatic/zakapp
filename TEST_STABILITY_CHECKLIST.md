# Test Stability Checklist

This checklist ensures the ZakApp test suite is stable and prevents regressions.

## Status: 🟡 In Progress

**Last Updated:** 2026-02-07  
**Owner:** ZakApp Team  
**Issue:** zakapp-aer.1

---

## ✅ Phase 1: Registration Fixes (COMPLETED)

- [x] Fixed dynamic email generation in tests
- [x] Updated `name` → `firstName` + `lastName`
- [x] Added `confirmPassword` field
- [x] Fixed response parsing (`body.data.user`, `body.data.tokens.accessToken`)
- [x] PR Created: https://github.com/slimatic/zakapp/pull/272

---

## 🔄 Phase 2: API Contract Validation (IN PROGRESS)

### Investigation Needed
- [ ] Document POST `/api/nisab-year-records` validation rules
- [ ] Identify all required fields
- [ ] Check business logic constraints (e.g., Hawl date validation)
- [ ] Verify Nisab calculation requirements

### Fix Implementation
- [ ] Update test payloads to match API requirements OR
- [ ] Update API validation to match test expectations
- [ ] Ensure consistency across all 6 test suites

---

## 📊 Phase 3: Full Test Suite Audit

### Run Tests
```bash
# Server integration tests
npm run test:server -- tests/integration/

# Server unit tests
npm run test:server -- tests/unit/

# All server tests
npm run test:server
```

### Document Failures
- [ ] Create spreadsheet of all failing tests
- [ ] Categorize by error type:
  - [ ] Authentication (401/403)
  - [ ] Validation (400)
  - [ ] Database constraints
  - [ ] Business logic
  - [ ] Other

---

## 🛠️ Phase 4: Systematic Fixes

### By Category
- [ ] **Auth Issues:** Fix token/session handling
- [ ] **Validation Issues:** Align test data with schema
- [ ] **Database Issues:** Fix foreign keys, constraints
- [ ] **Business Logic:** Review domain rules
- [ ] **Flaky Tests:** Identify and stabilize

### Per Test Suite
- [ ] `statusTransitions.test.ts` - 9 tests
- [ ] `liveTracking.test.ts` - 8 tests
- [ ] `hawlDetection.test.ts` - 6 tests
- [ ] `hawlInterruption.test.ts` - 6 tests
- [ ] `invalidOperations.test.ts` - 20 tests
- [ ] `finalization.test.ts` - 8 tests

---

## 🚦 Phase 5: Quality Gates

### Pre-Commit Hooks
- [ ] Run affected tests on commit
- [ ] Run linter on commit
- [ ] Block commit on test failure

### CI/CD Pipeline
- [ ] Add test job to GitHub Actions
- [ ] Fail PR checks on test failure
- [ ] Add test coverage reporting
- [ ] Set coverage threshold (70%+)

### Configuration
```yaml
# .github/workflows/tests.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run test:server
      - run: npm run test:coverage
```

---

## 📖 Phase 6: Documentation

### Test Documentation
- [ ] Add `TESTING.md` guide
- [ ] Document environment setup
- [ ] Document how to run specific tests
- [ ] Document test data requirements
- [ ] Add troubleshooting section

### Developer Onboarding
- [ ] Update CONTRIBUTING.md with test requirements
- [ ] Add test examples for common scenarios
- [ ] Document mocking patterns
- [ ] Create test templates

---

## 🎯 Success Criteria

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Integration Tests Pass Rate | 100% | ~15% | 🔴 |
| Unit Tests Pass Rate | 100% | ? | ⚪ |
| Test Coverage | >70% | ? | ⚪ |
| Build Time | <5min | ? | ⚪ |
| Flaky Tests | 0 | ? | ⚪ |

---

## 🚨 Critical Blockers

1. **API Contract Mismatch** - POST `/api/nisab-year-records` returning 400
2. **Test Data Setup** - Need valid payloads for all endpoints
3. **Environment Config** - JWT secrets, DB connection

---

## 📝 Notes

- **Priority:** P0 (blocks v0.9.2 release)
- **Related Issues:** zakapp-4os, zakapp-aer
- **Related PR:** https://github.com/slimatic/zakapp/pull/272

---

## Quick Commands

```bash
# Run failing test to debug
npm run test:server -- tests/integration/statusTransitions.test.ts

# Run with verbose output
npm run test:server -- tests/integration/statusTransitions.test.ts --reporter=verbose

# Run single test
npm run test:server -- tests/integration/statusTransitions.test.ts -t "should allow DRAFT → FINALIZED"

# Check test coverage
npm run test:coverage
```
