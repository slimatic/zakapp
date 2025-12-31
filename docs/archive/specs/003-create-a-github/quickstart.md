# Quickstart: CI/CD Pipeline Fixes Verification

**Feature**: CI/CD Pipeline Issues Resolution  
**Purpose**: Verify that all workflow failures have been addressed and CI/CD pipeline is reliable  
**Estimated Time**: 15-20 minutes

---

## Prerequisites

- ✅ GitHub issue #180 created and assigned to Copilot
- ✅ Git repository cloned locally
- ✅ Node.js 18.x or 20.x installed
- ✅ npm 9.x+ installed
- ✅ Terminal access

---

## Step 1: Verify Local Environment

### 1.1 Check Node.js Version
```bash
node --version
# Expected: v18.x.x or v20.x.x
```

### 1.2 Check npm Version
```bash
npm --version
# Expected: 9.x.x or higher
```

### 1.3 Clone Repository (if not already)
```bash
git clone https://github.com/slimatic/zakapp.git
cd zakapp
```

### 1.4 Check Current Branch
```bash
git branch --show-current
# Expected: 003-create-a-github or feature branch with fixes
```

**✅ Success Criteria**: Node.js, npm installed; repository cloned; correct branch checked out

---

## Step 2: Clean Install Dependencies

### 2.1 Clean Previous Installation
```bash
# Remove all node_modules and generated files
rm -rf node_modules shared/node_modules shared/dist backend/node_modules backend/coverage frontend/node_modules frontend/coverage
```

### 2.2 Install Root Dependencies
```bash
npm ci
# Expected: Dependencies installed from package-lock.json
```

### 2.3 Install and Build Shared Package
```bash
cd shared
npm ci
npm run build
cd ..
# Expected: Shared package built successfully
```

### 2.4 Install Backend Dependencies
```bash
cd backend
npm ci
cd ..
# Expected: Backend dependencies installed
```

### 2.5 Install Frontend Dependencies
```bash
cd frontend
npm ci
cd ..
# Expected: Frontend dependencies installed
```

**✅ Success Criteria**: All dependencies installed without errors

---

## Step 3: Run Backend Tests

### 3.1 Execute Backend Tests with Coverage
```bash
cd backend
npm run test:coverage
```

**Expected Output**:
```
PASS  src/__tests__/auth.test.ts
PASS  src/__tests__/assets.test.ts
PASS  src/__tests__/zakat.test.ts

Test Suites: X passed, X total
Tests:       X passed, X total
Snapshots:   0 total
Time:        Xs
Ran all test suites.

----------------------|---------|----------|---------|---------|-------------------
File                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------------|---------|----------|---------|---------|-------------------
All files             |   90.00 |    85.00 |   92.00 |   90.00 |
----------------------|---------|----------|---------|---------|-------------------
```

### 3.2 Verify Coverage File Generated
```bash
ls -lh coverage/coverage-final.json
# Expected: File exists with size > 0 bytes
```

### 3.3 Check for No process.exit() Issues
```bash
# If tests complete successfully without Jest being killed, process.exit() issue is fixed
echo "✅ Backend tests passed without process.exit() issues"
```

**✅ Success Criteria**: 
- All backend tests pass
- Coverage file generated
- No "Jest did not exit" warnings
- No duplicate registration errors

---

## Step 4: Run Frontend Tests

### 4.1 Execute Frontend Tests
```bash
cd frontend
npm test -- --coverage --watchAll=false
```

**Expected Output**:
```
PASS  src/__tests__/App.test.tsx
PASS  src/__tests__/AssetList.test.tsx

Test Suites: X passed, X total
Tests:       X passed, X total
```

### 4.2 Verify Frontend Coverage
```bash
ls -lh coverage/coverage-final.json
# Expected: File exists (or graceful skip if no tests yet)
```

**✅ Success Criteria**: 
- Frontend tests pass OR clearly marked as not yet implemented
- No silent failures with continue-on-error

---

## Step 5: Verify Workflow Files

### 5.1 Check test.yml for Issues
```bash
cat .github/workflows/test.yml | grep "continue-on-error"
# Expected: ONLY on optional steps, NOT on test execution
```

### 5.2 Check build.yml for Issues
```bash
cat .github/workflows/build.yml | grep "continue-on-error"
# Expected: ONLY on optional steps, NOT on build or lint
```

### 5.3 Validate Workflow YAML Syntax
```bash
# Install yamllint if not present
pip install yamllint 2>/dev/null || echo "yamllint not installed (optional)"

# Validate all workflows
yamllint .github/workflows/*.yml || echo "Syntax validation: manual review needed"
```

**✅ Success Criteria**: 
- No continue-on-error on critical test or build steps
- YAML syntax is valid
- All required steps present

---

## Step 6: Verify Jest Configuration

### 6.1 Check Backend Jest Config
```bash
grep "coverageDirectory\|coverageReporters" backend/jest.config.cjs
```

**Expected**:
```javascript
coverageDirectory: 'coverage',
coverageReporters: ['json', 'lcov', 'text', 'clover'],
```

### 6.2 Check Jest Setup File
```bash
cat backend/jest.setup.cjs | grep "process.exit"
# Expected: NO mocking of process.exit (or file removed if empty)
```

### 6.3 Verify maxWorkers Configuration
```bash
grep "maxWorkers" backend/package.json
# Expected: test:coverage script includes --maxWorkers=50%
```

**✅ Success Criteria**: 
- Jest config includes proper coverage settings
- No process.exit() mocking
- maxWorkers configured for CI

---

## Step 7: Push and Verify CI/CD

### 7.1 Commit Changes (if any fixes made)
```bash
git add .
git commit -m "fix(ci): resolve workflow failures and test configuration issues

- Remove continue-on-error from critical test steps
- Fix backend test isolation for duplicate registration errors
- Remove process.exit() mocking in jest.setup.cjs
- Update Jest configuration for reliable coverage generation
- Update CI-CD-SETUP.md documentation

Closes #180"
```

### 7.2 Push to Feature Branch
```bash
git push origin 003-create-a-github
```

### 7.3 Monitor GitHub Actions
1. Navigate to: https://github.com/slimatic/zakapp/actions
2. Find workflow run for your branch
3. Verify all jobs pass:
   - ✅ Backend tests pass (Node 18.x and 20.x)
   - ✅ Frontend tests pass (or properly skipped if not ready)
   - ✅ Coverage files uploaded to Codecov
   - ✅ Build workflow passes

### 7.4 Check Codecov Dashboard
1. Navigate to: https://codecov.io/gh/slimatic/zakapp
2. Verify coverage report uploaded successfully
3. Check coverage percentage trends

**✅ Success Criteria**: 
- All GitHub Actions workflows pass
- Coverage uploaded successfully
- No continue-on-error masking failures

---

## Step 8: Verify Documentation

### 8.1 Check CI-CD-SETUP.md Updated
```bash
git diff main...HEAD CI-CD-SETUP.md
# Expected: Documentation reflects actual workflow state
```

### 8.2 Verify Known Issues Resolved
Review CI-CD-SETUP.md "Known Issues" section:
- [ ] Duplicate registration errors - RESOLVED
- [ ] Continue-on-error flags - REMOVED
- [ ] process.exit() workaround - REMOVED
- [ ] Coverage generation - WORKING

**✅ Success Criteria**: 
- Documentation is accurate
- Known issues section updated

---

## Step 9: Create Pull Request

### 9.1 Create PR
```bash
# Using GitHub CLI (if installed)
gh pr create --title "Fix CI/CD Pipeline Issues" --body "Resolves #180

## Changes
- Removed continue-on-error from critical test steps
- Fixed backend test isolation
- Removed process.exit() workarounds
- Updated Jest configuration for coverage
- Updated CI-CD-SETUP.md documentation

## Testing
- ✅ All tests pass locally (Node 18.x and 20.x)
- ✅ Coverage files generate successfully
- ✅ GitHub Actions workflows pass
- ✅ Codecov integration working

## Verification
See quickstart.md for full verification steps."
```

Or manually create PR at: https://github.com/slimatic/zakapp/compare

### 9.2 Link to Issue #180
Ensure PR description includes:
```
Closes #180
```

**✅ Success Criteria**: 
- PR created
- Linked to issue #180
- CI checks passing

---

## Step 10: Final Validation

### 10.1 Workflow Success Rate
After PR merge, monitor workflow success rate:
```bash
# Check recent workflow runs
gh run list --limit 10
# Target: >95% success rate
```

### 10.2 Coverage Consistency
```bash
# Check recent Codecov reports
# Target: Coverage file uploaded on every run
```

### 10.3 Test Stability
```bash
# Run tests multiple times locally
for i in {1..5}; do
  echo "Run $i"
  cd backend && npm run test:coverage && cd ..
done
# Target: 100% pass rate (no flaky tests)
```

**✅ Success Criteria**: 
- Workflow reliability: >95% pass rate
- Coverage consistency: 100% upload rate
- Test stability: 0 flaky tests

---

## Troubleshooting

### Issue: Tests Fail with "Port already in use"
**Solution**: Kill existing server processes
```bash
lsof -ti:5000 | xargs kill -9
```

### Issue: Coverage file not generated
**Solution**: Check Jest config and run with --verbose
```bash
cd backend
npm test -- --coverage --verbose
```

### Issue: GitHub Actions fail but local passes
**Solution**: Check Node.js version mismatch
```bash
# Use nvm to test with different versions
nvm install 18
nvm use 18
npm run test:coverage

nvm install 20
nvm use 20
npm run test:coverage
```

### Issue: Codecov upload fails
**Solution**: Verify CODECOV_TOKEN secret is set
1. Go to: https://github.com/slimatic/zakapp/settings/secrets/actions
2. Verify CODECOV_TOKEN exists
3. Re-run workflow if token was missing

---

## Success Checklist

Final verification checklist:

- [ ] ✅ All backend tests pass locally
- [ ] ✅ All frontend tests pass or properly configured
- [ ] ✅ Coverage files generate successfully
- [ ] ✅ No continue-on-error on critical steps
- [ ] ✅ No process.exit() mocking workarounds
- [ ] ✅ GitHub Actions workflows pass (18.x and 20.x)
- [ ] ✅ Codecov integration working
- [ ] ✅ Documentation updated (CI-CD-SETUP.md)
- [ ] ✅ PR created and linked to issue #180
- [ ] ✅ Workflow reliability >95%

---

## Time Estimate

- Step 1-2 (Setup): 5 minutes
- Step 3-4 (Testing): 5 minutes
- Step 5-6 (Verification): 3 minutes
- Step 7 (CI/CD): 5 minutes
- Step 8-10 (PR & Validation): 5 minutes

**Total**: 15-20 minutes

---

**Last Updated**: October 4, 2025  
**Feature Branch**: 003-create-a-github  
**Related Issue**: #180
