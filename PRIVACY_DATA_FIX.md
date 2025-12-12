# Privacy & Data Tab Enhancements

## Changes Implemented

1.  **Fixed Data Export Functionality**:
    - Updated `exportUserData` in `client/src/pages/user/Profile.tsx` to use the dynamic `API_BASE_URL` instead of a hardcoded `http://localhost:5000` URL.
    - This ensures the export request is sent to the correct backend server address (e.g., `http://localhost:3001/api`).

2.  **Integrated Asset Import/Export**:
    - Added a new "Asset Import & Export" section to the "Privacy & Data" tab in the Profile page.
    - This section provides a direct link to the `/assets/import-export` page, leveraging the existing working functionality for bulk asset management.
    - This improves consistency and discoverability of data management tools.

## Files Modified
- `client/src/pages/user/Profile.tsx`

## Verification
- **Export Data**: Clicking "Export Data" should now correctly call the backend API and initiate a download of the user's full data (JSON).
- **Asset Import/Export**: Clicking "Manage Asset Data" should navigate the user to the `/assets/import-export` page where they can import CSVs or export assets.
