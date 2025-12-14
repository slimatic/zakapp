# API Contract: Export

POST /api/export

Auth: Required (JWT)

Request body (JSON):

{
  "decrypt": boolean, // optional - true only if user provided decryption key in request
  "key": string|null // optional - only used when decrypt=true (client must confirm consent)
}

Response: 200

- If `decrypt=true` and `key` provided and key is valid: returns a downloadable JSON file stream with plaintext sensitive fields (user consent required).
- Otherwise: returns downloadable JSON with ciphertext preserved.

Errors

- 400 Bad Request: invalid parameters
- 401 Unauthorized: missing or invalid JWT
- 422 Unprocessable Entity: decryption key invalid for ciphertexts found
- 500 Internal Server Error: transient failure; do not leak ciphertext or key info

Notes

- For large exports, the endpoint may return an upload URL or initiate a background job and return a job id to poll for readiness. UI behavior should default to streaming a download when possible.
