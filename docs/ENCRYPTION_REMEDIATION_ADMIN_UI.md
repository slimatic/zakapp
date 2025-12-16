# Admin Encryption Remediation UI

This page enables administrators to identify undecryptable records (user profiles, payments) and attempt remediation.

Location: `/admin/encryption` (authenticated users only)

Features:
- Scan: Run a backend scan to detect undecryptable records and create remediation entries.
- List Issues: Shows recent remediation entries with sample encrypted payload and notes.
- Actions: For each remediation you can:
  - Retry with previous key: supply a previous key (base64) and the backend will attempt to decrypt the payload and re-encrypt it with the current runtime key.
  - Mark Unrecoverable: Mark the issue as `UNRECOVERABLE` with an admin note.

Development notes:
- Access control: The route is protected via `AdminRoute` which currently supports a dev convenience flag (`localStorage.isAdmin = '1'`) for local testing. Production should rely on server roles via `/api/auth/me` and a proper `isAdmin` flag in the user record.
- API Endpoints used:
  - POST `/api/admin/encryption/scan` → Run scan
  - GET `/api/admin/encryption/issues` → List issues
  - POST `/api/admin/encryption/:id/retry` → Retry using supplied `{ key }`
  - POST `/api/admin/encryption/:id/unrecoverable` → Mark unrecoverable

Security:
- Only use the retry with key operation over secure channels and never log keys. The UI does not persist the supplied keys.
- This admin interface is intended for trusted administrators only.

Testing:
- Frontend unit tests added at `client/src/__tests__/EncryptionIssues.test.tsx`.
- Backend integration tests exist for remediation flows but require a test DB/migration setup (see `/specs` tasks for CI wiring).
