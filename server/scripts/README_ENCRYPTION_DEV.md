Dev workflow: generate previous encryption key and seed fixtures

This guide shows how to create reproducible dev keys and seed records that are encrypted with a "previous" key so you can test key rotation and migration.

1) Generate keys (recommended)

  npx ts-node --transpile-only ./scripts/generate-dev-keys.ts

This prints a generated PREV and CURRENT key and example commands.

2) Seed fixtures encrypted with the previous key

Use the printed PREV key to create records encrypted with it:

  SEED_PREV_KEY='<PREV_KEY>' ENCRYPTION_KEY='<PREV_KEY>' npx ts-node --transpile-only ./scripts/seed-encrypted-fixtures.ts

This creates a test user and a payment encrypted with the provided key.

3) Test migration (re-encryption to current key)

Once you have a current runtime key for your dev environment, set the runtime ENCRYPTION_KEY and add the PREV key(s) to ENCRYPTION_PREVIOUS_KEYS, then run the normalization script:

  ENCRYPTION_KEY='<CURRENT_KEY>' ENCRYPTION_PREVIOUS_KEYS='<PREV_KEY>' npx ts-node --transpile-only ./scripts/normalize-payments.ts

Notes & safety

- These scripts are intended for local development only. Do NOT use generated keys or the workflow in staging/production.
- Keep any .env files containing keys out of version control (add to .gitignore).
- If you already have real encrypted records and you do not possess previous keys, these records are effectively unrecoverable and must be manually remediated.
