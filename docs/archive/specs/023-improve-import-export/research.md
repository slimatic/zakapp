# Research: Import/Export — Reliable Backup & Restore

Source: `specs/023-improve-import-export/spec.md`

Summary
-------
This research consolidates requirements and technical tradeoffs for a portable, idempotent import/export feature for ZakApp. Primary goals are:

- Allow users to export their full account data (assets, nisabRecords, payments, profile) as a single JSON file (`.zakapp.json`) via the UI download flow.
- Ensure imports are idempotent across branches and installs using deterministic `stableId` values to detect duplicates.
- Preserve ciphertext for legacy encrypted fields by default; allow plaintext export only when user provides decryption key and consents.
- Support opt-in re-encryption during import if the user supplies previous/new key material in the UI.
- Default conflict strategy: `skip`. Allow `update`, `merge`, `reassign` via UI/CLI.
- Perform imports atomically at `per-array` granularity (assets/payments/nisabRecords).

Key constraints and assumptions
-------------------------------

- Tech stack: Node.js + TypeScript backend (Express), React + TypeScript frontend (Vite). Storage uses SQLite/Prisma in dev; production may be Postgres.
- Encryption: AES-256-CBC by project standard. Legacy ciphertext shapes exist and must be preserved on export unless user opts in to decrypt.
- No external services required for MVP; server-side exports can be streamed for download and optionally stored temporarily under `server/tmp/exports` when using background jobs.
- File format: JSON only (`.zakapp.json`). All arrays are stable-sorted to produce reproducible checksums.

Open questions resolved in clarifications
---------------------------------------

- Export delivery: UI download, JSON only.
- Re-encrypt policy: try re-encrypt with provided key during import (opt-in, UI-provided key).
- Default conflict strategy: `skip`; `reassign` allowed in UI with explicit consent.
- Atomicity: per-array (assets, payments, nisabRecords).
- Decrypt-on-export allowed if user supplies key and consents.

Security considerations
-----------------------

- Exports may contain ciphertext; do not include plaintext unless user explicitly provides a decryption key and consents. The export UI must show a clear consent and warning.
- Never log plaintext values in server logs. Export files stored temporarily must have strict filesystem permissions and be purged after a TTL (default 1 hour).
- Re-encryption requires explicit user consent; key material must not be stored persistently. If provided, perform re-encryption in-memory or via ephemeral worker with secure memory handling.

Operational considerations
-------------------------

- For large accounts, export & import should be performed as background jobs with progress reporting. CLI mode can be synchronous with `--dry-run` support.
- Provide resume tokens for partial failures at per-array level so interrupted imports can be resumed without duplicating successful arrays.

References
----------

- Feature spec: `specs/023-improve-import-export/spec.md`
- ZakApp Constitution: `.specify/memory/constitution.md` (privacy & security constraints)
