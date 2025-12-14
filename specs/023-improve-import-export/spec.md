# Feature Specification: Import/Export — Reliable Backup & Restore

**Feature Branch**: `023-improve-import-export`
**Created**: 2025-12-14
**Status**: Draft
**Input**: User description: "Improve import/export reliability so users can export data from branch `023`/`022` and import back into `021-experimental-feature-update` without duplication or breakage. Provide idempotent imports, portable encrypted payloads, and clear validation/error reporting."

## Summary

Provide a robust, idempotent import/export facility for ZakApp that supports assets, nisab records, payments, and user metadata. Exports must be portable across branches/versions and tolerant of mixed/legacy encryption formats. Imports must validate payloads, avoid duplication, and provide clear diagnostics and a safe rollback path.

## Clarifications

### Session 2025-12-14

- Q: Export delivery method and allowed file type → A: `UI download` (JSON only)
- Q: Re-encrypt policy at import → A: `Try re-encrypt with provided key` (UI-provided key)
- Q: Default conflict strategy and reassign behavior → A: `skip` by default; `reassign` allowed via UI with explicit consent
- Q: Atomicity level for import commits → A: `per-array` (assets/payments/nisabRecords)
- Q: Allow decrypt-on-export (produce plaintext export)? → A: `yes` (user must provide decryption key and consent)

These clarifications are recorded to reduce ambiguity for implementation and testing. The spec below has been updated in-place to reflect these decisions.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Export Full Account Data (Priority: P1)

As a user, I want to export all my account data (assets, nisab records, payments, settings) into a single portable file so I can back it up or move it across branches/environments.

**Why this priority**: Users must be able to backup their financial records; this is the primary value of the feature.

**Independent Test**: Trigger export from Settings → Export, download file, and inspect structure against the schema. Verify file contains encrypted sensitive fields and clear metadata (version, export timestamp).

**Acceptance Scenarios**:

1. Given an authenticated user with data, When they request export, Then they receive a single `.zakapp.json` file containing metadata and arrays for `assets`, `nisabRecords`, `payments`, and `profile`.
2. Given a user with legacy-encrypted fields, When they export, Then exported ciphertexts are preserved as-is and metadata lists the encryption format(s) detected.

---

### User Story 2 - Idempotent Import (Priority: P1)

As a user, I want to import a previously exported file without creating duplicate records and with the option to reassign ownership or merge duplicates.

**Why this priority**: Preventing duplication is essential when importing backups across branches or after partial restores.

**Independent Test**: Import the same export file twice into a test account; verify that the second import does not create duplicate records and report skipped items.

**Acceptance Scenarios**:

1. Given an import payload, When an entity with the same stable-identity (see Identity Strategy) exists, Then the importer updates or skips according to chosen conflict strategy.
2. Given conflicting assets, When user picks `merge` strategy, Then attributes are merged and a single record remains.

---

### User Story 3 - Cross-branch Compatibility & Restore to Older Branch (Priority: P2)

As a developer/tester, I want to export data from one branch and import into another (older or newer) branch such that structural differences are handled gracefully.

**Why this priority**: Ensures users and maintainers can move data between feature branches and mainline without manual migrations.

**Independent Test**: Export from current branch, checkout `021-experimental-feature-update`, run import command, and verify data is restored or skipped with helpful warnings for incompatible fields.

**Acceptance Scenarios**:

1. Given missing fields in target schema, When importing, Then importer logs warnings and uses default values or stores unknown fields in `metadata.legacy`.

---

### User Story 4 - CLI & Server Mode Exports (Priority: P3)

As an administrator, I want a CLI/export script to produce exports from the server (for scheduled backups) and a server-side import mode for bulk restores.

**Independent Test**: Run `node server/scripts/export.js --userId=...` in CI, verify file created and checksum recorded.

---

### Edge Cases

- Import file truncated or corrupt: importer should abort and provide precise error indicating byte offset or JSON parse error.
- Mixed encryption formats: exporter must preserve ciphertexts; importer must not attempt to decrypt sensitive payloads unless provided a `key` option and explicit user consent.
- Partial failure during import (network/db crash): import must be transactional per-user or provide a rollback plan and an idempotent resume token.
- Importing to account with different userId: require explicit reassign flow or abort unless `--reassign-to` provided.

## Updates From Clarifications

- Export delivery: Exports initiated from the UI will be delivered as a direct download; the allowed file type is JSON (`.zakapp.json`). The UI export flow must show a clear consent prompt if the user opts to include plaintext by supplying a decryption key.
- Re-encrypt policy: During import (UI or CLI), if the user provides a re-encryption key or previous key material through the UI, the importer SHOULD attempt to re-encrypt legacy ciphertexts using the provided key(s). This behavior is opt-in and requires explicit user consent on the import confirmation screen.
- Conflict strategy default: The system default for conflict handling is `skip` (do not import duplicate entities detected by `stableId`). The UI/CLI must allow changing strategy to `update`, `merge`, or `reassign`. If `reassign` is chosen in the UI, require explicit confirmation and show the list of entities being reassigned.
- Atomicity: Import commits must be performed at `per-array` granularity (assets, payments, nisabRecords). Each array import must be atomic: either all items in that array are applied or none are, and partial failures must be reported with resume tokens.
- Decrypt-on-export: Exporters may produce plaintext exports only if the user provides a decryption key and consents in the UI. By default, exported sensitive fields remain ciphertext in the `.zakapp.json` file.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-IMP-001**: System MUST allow authenticated users to export their full account data as a single JSON file (`.zakapp.json`).
- **FR-IMP-002**: Export payload MUST include `metadata` with `appVersion`, `exportedAt`, `schemaVersion`, and `encryptionFormats` encountered.
- **FR-IMP-003**: System MUST allow importing exported files via UI and CLI.
- **FR-IMP-004**: Importer MUST support conflict strategies: `skip`, `update`, `merge`, and `reassign`.
- **FR-IMP-005**: Importer MUST be idempotent — repeated imports of same file with same options MUST not create duplicates.
- **FR-IMP-006**: Importer MUST not attempt to decrypt ciphertexts unless a `--key` (or user-provided key) is supplied explicitly; by default, import stores ciphertexts verbatim.
- **FR-IMP-007**: Exported files MUST contain a `checksums` section for each top-level array and an overall SHA256 checksum for integrity verification.
- **FR-IMP-008**: CLI export/import scripts MUST run in dry-run mode and produce a detailed report before committing changes.
- **FR-IMP-009**: Import process MUST provide atomicity at user-level (all-or-nothing) or provide clear resume tokens with partial-commit awareness.

### Non-Functional Requirements

- **NFR-IMP-001**: Exports MUST complete for accounts up to 10,000 records within 2 minutes on typical developer hardware.
- **NFR-IMP-002**: Import operations MUST provide progress feedback and not block server event loop (use background worker/job queue).
- **NFR-IMP-003**: All export/import operations MUST be logged with minimal sensitive data (never log plaintext values).

### Security Requirements

- Export files contain ciphertexts for encrypted fields; do NOT include plaintext unless user explicitly provides a decryption key for export and consents.
- Provide optional `export --encrypt-with-public-key` mode to enable recipient-side decryption via asymmetric keys.
- Sanitize and validate all JSON input on import to avoid injection or schema-smuggling.

## Key Entities

- **ExportPayload**: { metadata, profile, assets[], nisabRecords[], payments[], checksums }
- **Asset**: id, stableId, type, encryptedFields, plainFields, metadata
- **NisabRecord**: id, stableId, year, zakatAmount (encrypted or numeric), payments[]
- **Payment**: id, stableId, amount (encrypted or numeric), date, method, metadata
- **ImportReport**: summary counts (imported, skipped, updated, failed), warnings[], errors[]

## Identity Strategy

To enable idempotent imports across branches and installs, use a `stableId` for each entity in the export that is derived from a deterministic stable-hash:

- `stableId = sha256(namespace + ':' + entityType + ':' + canonicalizedUniqueKey)`

Where `canonicalizedUniqueKey` is one of:

- Asset: lowercased type + ':' + normalized-name + ':' + normalized-accountReference
- NisabRecord: year + ':' + ownerFingerprint
- Payment: originalPaymentId if present else composite(amount+date+method+nonce)

Importer uses `stableId` to detect duplicates across imports and perform merge/update/skip.

## Export Format (Top-level sketch)

{
  "metadata": { "appVersion": "x.y.z", "schemaVersion": 1, "exportedAt": "ISO8601", "encryptionFormats": ["aes-256-cbc-base64:iv:ciphertext", "legacy-hex-object"] },
  "profile": { /* encrypted fields preserved or plaintext if user opted-in */ },
  "assets": [ ... ],
  "nisabRecords": [ ... ],
  "payments": [ ... ],
  "checksums": { "assets": "sha256...", "payments": "sha256...", "overall": "sha256..." }
}

All arrays MUST be stable-sorted (e.g., by stableId) to make diffs readable and checksums reproducible.

## Import Behavior & Strategies

- Default: `dry-run` that validates schema, computes checksums, and reports conflicts.
- On user confirmation: perform import with chosen conflict strategy.
- Conflict handling:
  - `skip`: Skip entities with matching `stableId`.
  - `update`: Overwrite non-idempotent fields (timestamps can be preserved) and keep original IDs unless `--reassign` used.
  - `merge`: Combine metadata fields and prefer non-empty fields from import.
  - `reassign`: Force imported entities to new IDs attached to target account; useful when importing into a different user.

- Import must be transactional per top-level array (assets/payments/nisabRecords) or per-user depending on configuration.

## CLI & API Endpoints

- `POST /api/export` (authenticated) — returns file URL or downloadable stream; supports `?decrypt=true` with user-provided key (opt-in).
- `POST /api/import` (authenticated) — accepts multipart upload or file URL; supports `?strategy=skip|update|merge|reassign` and `dryRun=true`.
- `server/scripts/export.js --userId=... [--decrypt-key=...] [--out=path]` — CLI export.
- `server/scripts/import.js --file=... --userId=... [--strategy=...] [--dry-run]` — CLI import.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-IMP-001**: Users can export and download a valid `.zakapp.json` for 95% of accounts without errors.
- **SC-IMP-002**: Re-importing the same file with default `skip` strategy results in zero new records created (idempotency). Test coverage: automated unit/integration tests.
- **SC-IMP-003**: Import into `021-experimental-feature-update` from `023-improve-import-export` succeeds or provides explicit compatibility warnings in >98% of test cases.
- **SC-IMP-004**: CLI `--dry-run` reports issues with accurate counts and completes within 30 seconds for 1000-record payloads.

## Testing Plan

- Unit tests for stableId generation and identity collision handling.
- Integration tests that:
  - export a seeded DB, import into fresh DB, and assert counts and checksums match.
  - import with `skip`, `update`, and `merge` strategies and verify outcomes.
  - simulate legacy encrypted fields in exports and verify importer preserves ciphertexts.

- Manual QA:
  - Export from branch `023`, checkout `021-experimental-feature-update`, run import, and log any compatibility warnings.

## Rollout & Migration

- Backwards compatible: exporter must not change existing DB records; importer tolerates missing fields and records warnings in `ImportReport`.
- No automatic re-encrypt of legacy ciphertexts during import unless `--rekey` option is explicitly invoked with previous key(s).

## Open Questions / TODOs

- Decide canonical `canonicalizedUniqueKey` rules for each entity type (exact normalization functions).
- Determine storage location and retention policy for server-side export files (S3 or local disk).
- Decide UX flow for `reassign` (confirmation, notifications).

## Implementation Tasks (high-level)

1. Add `stableId` generator utility to `shared/` and unit tests.
2. Implement `server/scripts/export.js` and `server/scripts/import.js` with dry-run reporting.
3. Add `POST /api/export` and `POST /api/import` endpoints (auth + rate limit).
4. Build frontend UI in Settings → Export/Import with progress and preview for dry-run.
5. Add background job worker support for large imports (BullMQ or lightweight queue).
6. Add automated tests for idempotency and cross-branch compatibility.

---

Prepared by: GitHub Copilot (GPT-5 mini)
# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`  
**Created**: [DATE]  
**Status**: Draft  
**Input**: User description: "$ARGUMENTS"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST [specific capability, e.g., "allow users to create accounts"]
- **FR-002**: System MUST [specific capability, e.g., "validate email addresses"]  
- **FR-003**: Users MUST be able to [key interaction, e.g., "reset their password"]
- **FR-004**: System MUST [data requirement, e.g., "persist user preferences"]
- **FR-005**: System MUST [behavior, e.g., "log all security events"]

*Example of marking unclear requirements:*

- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-007**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Users can complete account creation in under 2 minutes"]
- **SC-002**: [Measurable metric, e.g., "System handles 1000 concurrent users without degradation"]
- **SC-003**: [User satisfaction metric, e.g., "90% of users successfully complete primary task on first attempt"]
- **SC-004**: [Business metric, e.g., "Reduce support tickets related to [X] by 50%"]
