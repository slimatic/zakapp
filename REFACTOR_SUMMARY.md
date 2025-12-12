# Refactor Summary: Removal of Deprecated Snapshot Code

## Overview
This refactor removes the deprecated "Snapshot" architecture and fully adopts the "Nisab Year Record" terminology and API.

## Backend Changes
### Deleted Files
- `server/src/services/SnapshotService.ts`
- `server/src/services/YearlySnapshotService.ts`
- `server/src/models/YearlySnapshot.ts`
- `server/src/controllers/SnapshotsController.ts`
- `server/src/routes/snapshots.ts`

### Modified Files
- `server/src/routes/tracking.ts`:
    - Removed `YearlySnapshotService` import and usage.
    - Imported `NisabYearRecordService`.
    - Replaced `snapshotService` with `nisabYearRecordService`.
    - Removed deprecated snapshot CRUD routes (`/snapshots`, `/snapshots/:id`, etc.).
    - Updated `/comparison` route to use `nisabYearRecordService` for validation and `ComparisonService`.
    - Updated payment routes to use `nisabYearRecordService` for ownership validation.
- `server/src/services/ComparisonService.ts`:
    - Updated to use `NisabYearRecordService` instead of `YearlySnapshotModel`.
    - Added type conversion for wealth fields (handling potential string/number differences).
    - Updated `generateInsights` to work with `NisabYearRecord` type.
- `server/src/app.ts`:
    - Verified `snapshotsRoutes` is commented out.

## Frontend Changes
### Deleted Files
- `client/src/hooks/useSnapshots.ts`
- `client/src/hooks/useZakatSnapshots.ts`

### Modified Files
- `client/src/hooks/useComparison.ts`:
    - Updated to use `NisabYearRecord` type instead of `YearlySnapshot`.
- `client/src/hooks/useNisabYearRecords.ts`:
    - Added `startDate` and `endDate` to options to support filtering by date range (needed for year-based fetching).
- `client/src/components/zakat/SnapshotComparison.tsx`:
    - Replaced `useSnapshots` with `useNisabYearRecords`.
    - Replaced `useCompareSnapshots` with `useComparison`.
- `client/src/hooks/index.ts`:
    - Removed exports from deleted files.
    - Added export for `useComparison`.

## Verification
- The application should now rely entirely on `NisabYearRecordService` and `/api/nisab-year-records`.
- The `/api/tracking/comparison` endpoint is updated to work with the new service.
- Frontend components for comparison are updated to use the new hooks.
