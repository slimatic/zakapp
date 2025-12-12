# Dashboard Onboarding Fix

## Issue
Users reported two issues with the Dashboard "Getting Started" widget:
1.  **Stale State**: After creating a Nisab Record (Step 2), the widget would still show Step 2 as active until the page was refreshed.
2.  **Incorrect Link**: Step 3 ("Track Payments") linked to `/nisab-records` instead of `/payments`.

## Root Cause Analysis
1.  **Stale State**: The `useUserOnboarding` hook was using a query key `['nisab-records']` to fetch records. However, the rest of the application (including the mutation that creates records) uses `['nisab-year-records']`. When a record was created, the mutation invalidated `['nisab-year-records']`, but the onboarding hook's query `['nisab-records']` remained stale.
2.  **Incorrect Link**: The `OnboardingGuide` component had a hardcoded `href` of `/nisab-records` for Step 3.

## Fix Implementation
1.  **Updated Query Key**: Modified `client/src/hooks/useUserOnboarding.ts` to use `['nisab-year-records']` as the query key. This ensures it shares the cache with other components and responds to invalidations correctly.
2.  **Updated Link**: Modified `client/src/components/dashboard/OnboardingGuide.tsx` to point Step 3 to `/payments`.

## Verification
-   **State Update**: When a user creates a Nisab Record, the `createRecordMutation` in `NisabYearRecordsPage` invalidates `['nisab-year-records']`. Since `useUserOnboarding` now uses this key, it will automatically refetch and update the step to Step 3.
-   **Navigation**: Clicking "Record Payment" in Step 3 now correctly navigates to the Payments page.

## Files Changed
-   `client/src/hooks/useUserOnboarding.ts`
-   `client/src/components/dashboard/OnboardingGuide.tsx`
