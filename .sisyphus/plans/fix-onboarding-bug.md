# Fix Onboarding Step 8 - Empty Assets Bug

## TL;DR

> **Quick Summary**: Fix bug where onboarding gets stuck on "Loading your assets..." when users skip entering data. The issue is in ZakatSetupStep's useEffect requiring `dbAssets.length > 0` to set estimates.
> 
> **Deliverables**: 
> - Modified ZakatSetupStep.tsx to handle empty assets case
> - Default zero estimates when no assets exist
> 
> **Estimated Effort**: Quick (1-2 file changes)
> **Parallel Execution**: NO - single task
> **Critical Path**: Fix useEffect condition → Test flow

---

## Context

### Original Request
User reported: "If I go through the onboarding without entering any data and keep hitting next, I end up on step 8 of 8 with just a message that says 'Loading your assets...' and nothing actually happens."

### Bug Analysis

**Root Cause Chain:**
1. Users skip all asset entry (all assets disabled in OnboardingContext)
2. ReviewStep correctly skips saving when no assets enabled
3. ZakatSetupStep loads from database → `dbAssets.length === 0`
4. useEffect condition `dbAssets.length > 0` is NEVER met
5. `estimates` stays `null`
6. Render logic `if (isLoadingAssets || !estimates)` keeps showing loading

**Additional Blocker:**
- Line 72 in handleFinish: `if (!estimates) throw new Error("Please wait...")`
- Even if loading screen was fixed, users couldn't proceed because estimates is null

**Nisab Record with Zero Assets:**
- When no assets exist, nisab record should be created with:
  - totalWealth: 0
  - zakatalWealth: 0
  - totalLiabilities: 0
  - zakatAmount: 0
- This is correct behavior - users can have a nisab record with zero wealth and add assets later

---

## Work Objectives

### Core Objective
Allow users to complete onboarding even when they skip entering any asset data

### Concrete Deliverables
- Modified `ZakatSetupStep.tsx` with proper empty asset handling

### Definition of Done
- [ ] User can complete onboarding with zero assets
- [ ] ZakatSetupStep displays zero wealth/zakat when no assets
- [ ] Nisab record is created with zero values
- [ ] User can proceed to dashboard after completing with no assets

### Must Have
- Fix useEffect condition to handle empty assets
- Set default zero estimates when no assets exist

### Must NOT Have (Guardrails)
- Don't modify ReviewStep saving logic (working correctly)
- Don't change onboarding flow structure
- Don't add unnecessary validation for minimum assets

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (bun test, React Testing Library)
- **Automated tests**: NO (simple fix, will use manual QA)
- **Framework**: N/A

### QA Policy
Every task MUST include agent-executed QA scenarios.

**Testing Approach:**
- Manual browser testing via Playwright to verify the flow
- Verify loading state exits properly
- Verify zero values display correctly
- Verify can proceed to dashboard

---

## Execution Strategy

### Single Task - No Parallelization Required
This is a simple bug fix with minimal scope - no need for parallel execution waves.

---

## TODOs

- [ ] 1. Fix empty assets handling in ZakatSetupStep useEffect

  **What to do**:
  - Modify the useEffect in ZakatSetupStep.tsx (lines 33-58) to handle empty assets case
  - Change condition from `dbAssets.length > 0` to allow zero assets
  - Set default zero estimates when `dbAssets.length === 0`
  - This fixes BOTH the loading screen AND allows handleFinish to proceed

  **Must NOT do**:
  - Don't change ReviewStep saving logic
  - Don't add validation requiring minimum assets

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple fix, single file, localized change
  - **Skills**: []
    - No additional skills needed

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Single task
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `client/src/pages/onboarding/steps/ZakatSetupStep.tsx:33-58` - The problematic useEffect
  - `client/src/pages/onboarding/context/OnboardingContext.tsx:71-85` - INITIAL_DATA structure for defaults

  **Acceptance Criteria**:
  - [ ] Code compiles without errors
  - [ ] useEffect handles dbAssets.length === 0 case
  - [ ] estimates is set to zero values when no assets exist

  **QA Scenarios**:

  Scenario: Complete onboarding with zero assets
    Tool: Manual verification (playwright or manual)
    Preconditions: User has completed steps 1-7 without entering any asset data
    Steps:
      1. Navigate to step 8 (ZakatSetupStep)
      2. Verify "Loading your assets..." does NOT appear
      3. Verify page shows zero wealth summary
      4. Click "Finish & Go to Dashboard"
    Expected Result: Successfully navigates to dashboard with nisab record showing 0 wealth
    Failure Indicators: Stuck on loading, or error on finish click
    Evidence: Screenshot of step 8 with zero values

  Scenario: Complete onboarding WITH assets (regression check)
    Tool: Manual verification
    Preconditions: User has entered at least one asset with value
    Steps:
      1. Navigate to step 8
      2. Verify asset values display correctly
      3. Verify calculations are correct
    Expected Result: Displays correct wealth/zakat values
    Failure Indicators: Shows zero when should show values
    Evidence: Screenshot of step 8 with actual values

  **Commit**: YES
  - Message: `fix(onboarding): handle empty assets in ZakatSetupStep`
  - Files: `client/src/pages/onboarding/steps/ZakatSetupStep.tsx`

---

## Final Verification Wave

- [ ] F1. **Code Review** — Verify fix addresses root cause
- [ ] F2. **Manual QA** — Test onboarding flow with zero assets

---

## Commit Strategy

- **1**: `fix(onboarding): handle empty assets in ZakatSetupStep`
  - Files: `client/src/pages/onboarding/steps/ZakatSetupStep.tsx`

---

## Success Criteria

### Verification Commands
```bash
# Build check
cd client && npm run build
```

### Final Checklist
- [ ] Loading screen no longer stuck when no assets
- [ ] Zero wealth displays correctly in summary
- [ ] User can complete onboarding to dashboard
- [ ] Nisab record created with zero values
