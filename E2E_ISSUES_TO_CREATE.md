# E2E Test Issues - Ready for GitHub Issue Creation

Based on E2E test execution on October 2, 2025, the following issues were identified and should be created as separate GitHub issues.

---

## Issue 1: Asset Form Validation Shows False Positive Error

**Title**: Asset form incorrectly shows "Asset name is required" validation error

**Labels**: `bug`, `frontend`, `form-validation`, `low-priority`

**Description**:
When creating a new asset, the form validation shows "Asset name is required" error message even after the Asset Name field has been filled with valid data.

**Steps to Reproduce**:
1. Navigate to `/assets/new` (Add Asset page)
2. Fill in the "Asset Name" field with text (e.g., "Test Savings Account")
3. Fill in other required fields (Value: 25000, Currency: USD)
4. Click "Add Asset" button
5. Observe validation error appears: "Asset name is required"

**Expected Behavior**:
The form should accept the filled Asset Name value and proceed with asset creation without showing a validation error.

**Actual Behavior**:
A validation error "Asset name is required" appears below the Asset Name field, even though the field contains valid text.

**Workaround**:
Click into the Asset Name field again and type the text (instead of using fill/paste). This triggers proper form state updates.

**Root Cause (Suspected)**:
Form state management issue - the controlled component's state may not be updating when the field is filled programmatically. The validation might be checking state before it's properly updated.

**Environment**:
- Browser: Chromium (via Playwright MCP Server)
- Page: `/assets/new`
- Component: AssetForm

**Suggested Fix**:
Review the form state management in the Asset creation form. Ensure:
1. Input onChange handlers properly update form state
2. Validation runs after state is updated
3. Debouncing (if any) doesn't interfere with validation

**Related Files**:
- Frontend asset form component
- Form validation logic

**Priority**: Low (workaround available, doesn't block functionality)

---

## Issue 2: Asset Selection Counter Shows Incorrect Count

**Title**: Calculate Zakat page shows "2 of 1" when one asset is selected

**Labels**: `bug`, `frontend`, `calculation`, `ui`, `low-priority`

**Description**:
On the Calculate Zakat page, when selecting one asset for calculation, the counter incorrectly displays "Selected Assets: 2 of 1" instead of "1 of 1".

**Steps to Reproduce**:
1. Create at least one asset
2. Navigate to `/calculate` (Calculate Zakat page)
3. Check the checkbox next to an asset
4. Look at the "Selected Assets" counter

**Expected Behavior**:
Counter should show "Selected Assets: 1 of 1"

**Actual Behavior**:
Counter shows "Selected Assets: 2 of 1"

**Visual Evidence**:
The counter appears in the asset selection summary section showing an incorrect count that's off by one.

**Impact**:
- Visual bug only, doesn't affect calculation
- Confusing to users
- Makes it look like more assets are selected than actually are

**Root Cause (Suspected)**:
Off-by-one error in the asset selection counter logic. Likely:
- Double-counting (initial state + selected state)
- Array index vs length confusion
- Incorrect reduce/filter logic

**Environment**:
- Browser: Chromium (via Playwright MCP Server)
- Page: `/calculate`
- Component: Calculate Zakat - Asset Selection section

**Suggested Fix**:
Review the asset selection state management:
1. Check how selected assets are counted
2. Verify the counter logic (selectedAssets.length vs assets.length)
3. Ensure counter updates correctly on checkbox toggle

**Related Files**:
- Calculate Zakat page component
- Asset selection state management

**Priority**: Low (cosmetic issue, doesn't affect functionality)

---

## Issue 3: Calculation Date Displays as "Invalid Date"

**Title**: Zakat calculation results show "Calculated on Invalid Date" instead of actual date

**Labels**: `bug`, `frontend`, `calculation`, `date-formatting`, `low-priority`

**Description**:
After successfully calculating Zakat, the results section displays "Calculated on Invalid Date" instead of showing the actual calculation date.

**Steps to Reproduce**:
1. Navigate to `/calculate`
2. Select an asset
3. Click "Calculate Zakat"
4. View the calculation results
5. Look at the date display at the bottom of results

**Expected Behavior**:
Display should show: "Calculated on October 2, 2025" (or whatever the current date is)

**Actual Behavior**:
Display shows: "Calculated on Invalid Date"

**API Response**:
The console logs show successful calculation:
```javascript
API Response: {success: true, calculation: Object}
```

The calculation object likely contains a date field that's not being parsed correctly.

**Root Cause (Suspected)**:
Date formatting/parsing issue. Possible causes:
1. API returns date in unexpected format (ISO string, timestamp, etc.)
2. Frontend not parsing the date correctly
3. Date object creation failing
4. Missing or null date field in response

**Environment**:
- Browser: Chromium (via Playwright MCP Server)
- Page: `/calculate`
- Component: Calculation Results display

**Suggested Fix**:
1. Inspect the actual date format from API response
2. Add proper date parsing (e.g., `new Date(dateString)`)
3. Format the date for display (e.g., using `toLocaleDateString()`)
4. Add validation to handle missing/invalid dates gracefully

**Code Example** (suggested fix):
```javascript
// Instead of:
{calculationDate}

// Use:
{calculationDate ? new Date(calculationDate).toLocaleDateString() : 'Date unavailable'}
```

**Related Files**:
- Calculate Zakat results component
- Date formatting utility

**Priority**: Low (doesn't affect calculation accuracy, only display)

---

## Issue 4: React Warning - Missing Key Props in List

**Title**: Console warning: Each child in a list should have a unique "key" prop

**Labels**: `code-quality`, `frontend`, `react`, `developer-experience`, `very-low-priority`

**Description**:
React console warning appears when rendering the Calculate Zakat page, indicating that list items are missing unique `key` props.

**Console Warning**:
```
Each child in a list should have a unique "key" prop.
See https://react.dev/link/warning-keys
```

**Location**:
`/calculate` page (Calculate Zakat)

**Impact**:
- No functional impact
- No user-visible impact
- Affects developer experience
- May cause performance issues with large lists
- May cause incorrect list updates in some edge cases

**Root Cause**:
Lists rendered without unique `key` props. Likely locations:
1. Islamic Guidelines list (5 bullet points)
2. Asset selection list
3. Methodology options list

**Suggested Fix**:
Add unique `key` props to all list items. Example:

```javascript
// Before:
{guidelines.map(guideline => (
  <p>{guideline}</p>
))}

// After:
{guidelines.map((guideline, index) => (
  <p key={`guideline-${index}`}>{guideline}</p>
))}

// Or better (if items have IDs):
{assets.map(asset => (
  <AssetItem key={asset.id} asset={asset} />
))}
```

**Related Files**:
- Calculate Zakat page component
- Any component rendering lists

**Priority**: Very Low (no functional impact, code quality only)

---

## Summary

| Issue | Severity | Priority | Component | Fix Complexity |
|-------|----------|----------|-----------|----------------|
| #1 Form Validation | Low | Low | Asset Form | Medium |
| #2 Counter Display | Low | Low | Calculate | Easy |
| #3 Invalid Date | Low | Low | Calculate | Easy |
| #4 Missing Keys | Very Low | Very Low | Calculate | Easy |

**Total Issues**: 4  
**Critical**: 0  
**High**: 0  
**Medium**: 0  
**Low**: 3  
**Very Low**: 1

**Estimated Fix Time**: 2-4 hours total

---

## Testing After Fixes

After implementing fixes, retest:
1. Asset creation flow (Issue #1)
2. Asset selection counter (Issue #2)
3. Date display in calculation results (Issue #3)
4. Console warnings (Issue #4)

Use the MCP Server approach documented in `E2E_MCP_TEST_RESULTS.md` for efficient retesting.

---

**Document Created**: October 2, 2025  
**Based On**: E2E test execution with Playwright MCP Server  
**Next Action**: Create GitHub issues for each identified bug
