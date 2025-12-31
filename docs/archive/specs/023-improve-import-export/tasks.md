# Implementation Tasks: Import/Export (Phase 2)

This tasks list is organized into discrete, executable tasks that an LLM or engineer can pick up and complete. Each task includes the target file paths, a short description, dependencies, and the expected test or acceptance check.

Feature: Import/Export — Reliable Backup & Restore
Spec: `/home/agentx/github-repos/zakapp/specs/023-improve-import-export/spec.md`

Priority legend: [P] = Parallelizable groups; tasks marked `[P]` can run concurrently where noted.

Setup (run first)
-----------------

T001 — Project: Install dev dependencies and ensure scripts
- Files: `package.json` (root)
- Description: Verify `server/scripts` can run (node + ts-node). Add any missing dev deps: `commander`, `fast-json-stable-stringify`, `crypto-js` or use `node:crypto` shim. Add npm scripts `export:cli` and `import:cli`.
- Dependency: none
- Acceptance: `npm run export:cli -- --help` prints usage.

Tests (TDD-first where possible)
--------------------------------

T002 [P] — Contract tests: Export API (contract)
- Files to add: `tests/contract/export.contract.test.ts`
- Description: Write a contract test that calls `POST /api/export` with and without `decrypt` flag using an authenticated test user. Validate status codes and that response headers indicate attachment or job id.
- Dependency: T001
- Acceptance: Test passes in dry environment using test DB.

T003 [P] — Contract tests: Import API (contract)
- Files to add: `tests/contract/import.contract.test.ts`
- Description: Upload a small valid `.zakapp.json` payload in `dryRun=true` and assert `ImportReport` schema is returned and `dryRun` produced no DB changes.
- Dependency: T001
- Acceptance: Test passes locally.

Core model & utilities
-----------------------

T004 [X] [P] — Model: `stableId` utility (completed)
- Files: `shared/src/utils/stableId.ts`, `tests/unit/stableId.test.ts`, `scripts/verify-stableid.js`
- Description: Implement deterministic `stableId` generator per data-model rules (NFKC, lowercase where required, whitespace collapse) and unit tests demonstrating collisions avoided for canonical inputs.
- Dependency: none
- Acceptance: Unit tests assert generated stableId matches expected sample values. Verification script `scripts/verify-stableid.js` passes.

T005 [X] [P] — Utility: deterministic JSON serializer & checksum (completed)
- Files: `shared/src/utils/deterministicJson.ts`, `shared/src/utils/checksum.ts`, `scripts/verify-checksum.js`, `tests/unit/checksum.test.ts`
- Description: Implement stable JSON stringifier (stable key order) and SHA256 checksum helper. Verification script validates reproducible checksums for stable-sorted arrays.
- Dependency: T004
- Acceptance: Verification script `scripts/verify-checksum.js` passes.

Server CLI & services
----------------------

T006 [X] — Server: `server/scripts/export.js` (CLI) (scaffolded)
- Files: `server/scripts/export.js`
- Description: Export CLI supports `--userId`, `--out`, `--decrypt` (flag) and writes `.zakapp.json` with checksums. Queries Prisma where available; otherwise produces empty arrays. File written with secure permissions.
- Dependency: T004, T005
- Acceptance: Script runs and writes a file; basic checksum fields present.

T007 [X] — Server: `server/scripts/import.js` (CLI) (scaffolded)
- Files: `server/scripts/import.js`
- Description: Import CLI supports `--file`, `--userId`, `--dry-run`/`--apply`, `--strategy`, `--rekey`. Performs checksum validation and returns a dry-run `ImportReport`.
- Dependency: T004, T005, T006
- Acceptance: Dry-run prints `ImportReport` and warns on checksum mismatches.

Server API endpoints
--------------------

T008 — Server: `POST /api/export` endpoint
- Files: `server/src/controllers/exportController.ts`, `server/src/routes/export.ts`, `server/src/services/exportService.ts`, `tests/integration/export.integration.test.ts`
- Description: Implement authenticated export endpoint that streams download for small exports, or queues a background job for large exports. Support `decrypt` param only if user provides key and consents.
- Dependency: T004, T005, T006
- Acceptance: Integration test validates response stream and correct metadata when `decrypt=false`.

T009 — Server: `POST /api/import` endpoint
- Files: `server/src/controllers/importController.ts`, `server/src/routes/import.ts`, `server/src/services/importService.ts`, `tests/integration/import.integration.test.ts`
- Description: Implement authenticated import endpoint supporting multipart upload and `dryRun`, `strategy`, `rekey` options. Import must apply per-array atomicity and return `ImportReport` with resumeToken on partial failures.
- Dependency: T004, T005, T007
- Acceptance: Integration tests validate dry-run and actual import behaviors; per-array atomicity verified by simulating failure in one array.

Security & re-encryption
------------------------

T010 [P] — Service: secure re-encryption helper
- Files: `server/src/services/reencryptService.ts`, `tests/unit/reencrypt.test.ts`
- Description: Implement in-memory re-encryption flow that accepts `previousKeys[]` and `targetKey`, attempts decryption, and returns per-entity results. Ensure keys not persisted and logs sanitized.
- Dependency: T005
- Acceptance: Unit tests cover successful re-encrypt and failure cases.

Frontend UI
-----------

T011 — Frontend: `Settings → Export` page
- Files: `client/src/pages/Settings/ExportPage.tsx`, `client/src/components/ExportForm.tsx`, `client/src/services/exportApi.ts`, `tests/frontend/exportPage.test.tsx`
- Description: Add UI to trigger export, choose `Include plaintext` (with consent modal), and download returned file. Show `encryptionFormats` metadata.
- Dependency: T008
- Acceptance: Frontend tests verify UI flow and the download link is present.

T012 — Frontend: `Settings → Import` page
- Files: `client/src/pages/Settings/ImportPage.tsx`, `client/src/components/ImportForm.tsx`, `client/src/services/importApi.ts`, `tests/frontend/importPage.test.tsx`
- Description: Add UI to upload `.zakapp.json`, run dry-run and show `ImportReport`. Provide conflict strategy dropdown (default `skip`) and re-encryption key inputs (hidden unless user opts in). Implement per-array progress view.
- Dependency: T009, T010
- Acceptance: Frontend integration test verifies dry-run and final import UX with mocked API.

Background Jobs & Scalability
----------------------------

T013 — Job: import/export worker and job queue integration
- Files: `server/src/jobs/importJob.ts`, `server/src/jobs/exportJob.ts`, `server/src/lib/queue.ts`
- Description: Implement lightweight job queue (e.g., in-process with BullMQ later) to process large exports/imports and emit progress events. Provide API to poll job status.
- Dependency: T008, T009
- Acceptance: Worker processes a queued job and test verifies progress updates.

Tests & QA
---------

T014 [P] — Integration: full roundtrip test
- Files: `tests/integration/import-export.roundtrip.test.ts`
- Description: Seed DB with representative data (including legacy ciphertexts), run export (CLI or API), import into a fresh DB using `skip` strategy, assert counts and checksums, then run import again to assert idempotency.
- Dependency: T006, T007, T008, T009
- Acceptance: Roundtrip test passes on CI.

Docs & rollout
--------------

T015 — Docs: admin playbook & migration steps
- Files: `docs/import-export.md`, `specs/023-improve-import-export/quickstart.md` (update)
- Description: Document export file retention, purge policy, re-encrypt playbook, and manual recovery steps for legacy keys.
- Dependency: T010
- Acceptance: Docs reviewed and added to repo.

Parallel execution examples
---------------------------

- Group A (can run in parallel): T004, T005, T010 (utilities & re-encryption unit tests) — command to run locally:

```bash
npm run test -- tests/unit/stableId.test.ts tests/unit/checksum.test.ts tests/unit/reencrypt.test.ts
```

- Group B (can run in parallel after Group A): T006, T007 (CLI scripts)

Sequential notes
----------------

- T004/T005 should be implemented before T006/T007/T008/T009.
- Contract tests (T002/T003) can be created and run in parallel with utility implementation but expect failing until endpoints are implemented (T008/T009).

Agent commands (examples for each task)
-------------------------------------

- Implement stableId (T004):
  - Create `shared/utils/stableId.ts` with exported `generateStableId(entityType, canonicalKey, namespace='zakapp')`.
  - Add unit test at `tests/unit/stableId.test.ts` and run `npm test tests/unit/stableId.test.ts`.

- Scaffold export endpoint (T008):
  - Add route `server/src/routes/export.ts` and controller skeleton `server/src/controllers/exportController.ts`.
  - Run `npm run dev` and execute `curl -X POST -H "Authorization: Bearer $TEST_JWT" http://localhost:3000/api/export` to smoke test.

File created: `/home/agentx/github-repos/zakapp/specs/023-improve-import-export/tasks.md`

