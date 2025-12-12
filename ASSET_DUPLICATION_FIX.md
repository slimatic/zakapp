# Asset Duplication Fix

## Issue Description
Users reported duplicate assets appearing on the `/assets` page. This was likely caused by:
1.  **Double Submission**: The "Add Asset" button could be clicked multiple times before the request completed, creating multiple entries in the database.
2.  **Display Duplication**: Potential race conditions or state updates causing the list to render duplicates temporarily.

## Fix Implementation

### 1. Prevent Double Submission in `AssetForm.tsx`
- Added a local `isSubmitting` state to the `AssetForm` component.
- Updated `handleSubmit` to check if `isSubmitting` or `mutation.isPending` is true before proceeding.
- Set `isSubmitting` to `true` immediately upon form submission.
- Disabled the submit button while `isSubmitting` or `mutation.isPending` is true.
- Reset `isSubmitting` to `false` only on error (on success, the component typically unmounts or navigates away).

### 2. Client-Side Deduplication in `AssetList.tsx`
- Added a defensive deduplication step in the `AssetList` component.
- Used `React.useMemo` to filter the assets list by unique `assetId`.
- This ensures that even if the backend returns duplicates or the cache is in an inconsistent state, the UI will display each asset only once.

## Verification
- **Manual Verification**:
    - Open the "Add Asset" modal/page.
    - Fill in the form.
    - Click "Add Asset" multiple times rapidly.
    - Verify that only one request is sent and only one asset is created.
    - Verify that the button shows a loading state immediately.
- **Code Review**:
    - Checked `client/src/components/assets/AssetForm.tsx` for proper state management.
    - Checked `client/src/components/assets/AssetList.tsx` for correct deduplication logic.

## Files Modified
- `client/src/components/assets/AssetForm.tsx`
- `client/src/components/assets/AssetList.tsx`
