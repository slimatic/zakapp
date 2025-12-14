# API Contract: Import

POST /api/import

Auth: Required (JWT)

Request: multipart/form-data (file) or JSON with `fileUrl` and options

Options (query or body):

- `dryRun`: boolean (default `true`) - validate and report without applying
- `strategy`: `skip` | `update` | `merge` | `reassign` (default `skip`)
- `reassignTo`: userId (optional; required for reassign strategy in some flows)
- `rekey`: boolean (if true, expect `previousKeys` and `targetKey` in body)

Behavior:

- On `dryRun=true`, returns an `ImportReport` with counts and suggested actions; no DB changes.
- On confirm, executes per-array atomic imports and returns a final `ImportReport`.
- If `rekey=true`, and user supplies `previousKeys` and `targetKey`, attempt re-encryption for decryptable ciphertexts; report per-entity success/failure.

Response: 200 with `ImportReport` schema

ImportReport (summary):

{
  imported: { assets: number, nisabRecords: number, payments: number },
  skipped: { assets: number, nisabRecords: number, payments: number },
  updated: { ... },
  failed: { count: number, errors: [ { itemStableId, reason } ] },
  warnings: string[],
  resumeToken?: string
}

Errors

- 400 Bad Request: invalid file, invalid JSON, or checksum mismatch
- 401 Unauthorized: missing or invalid JWT
- 409 Conflict: unrecoverable conflict without user-provided reassign
- 422 Unprocessable Entity: schema validation errors
- 500 Internal Server Error: transient failure

Notes

- Import must honor per-array atomicity: failure to import an array should not apply any partial rows for that array.
- Import must be idempotent when `stableId` values match.
