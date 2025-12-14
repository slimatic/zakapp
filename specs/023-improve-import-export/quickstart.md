# Quickstart: Export and Import (UI + CLI)

This guide shows the minimal steps to try export/import locally for development and testing.

UI (Export)

1. Sign in to the app and open `Settings → Export`.
2. Optional: to include plaintext, check "Include plaintext export" and enter your decryption key. Confirm the consent dialog.
3. Click `Export` and the browser will download `youraccount.zakapp.json`.

UI (Import)

1. Sign in to the target account (can be same or different user).
2. Open `Settings → Import`.
3. Choose `dry-run` to preview changes (recommended). Upload the `.zakapp.json` file.
4. Review the `ImportReport`. Choose conflict strategy (default `skip`) or change to `merge/update/reassign`.
5. If re-encryption is desired, provide the previous key(s) and the target key in the UI and confirm.
6. Confirm import. Monitor progress; the UI will show per-array status (assets, nisabRecords, payments).

CLI (Export)

Run from repo root (Node environment):

```bash
node server/scripts/export.js --userId=<userId> --out=./tmp/export.zakapp.json
```

To request plaintext (requires interactive consent):

```bash
node server/scripts/export.js --userId=<userId> --out=./tmp/export.zakapp.json --decrypt --key="<your-decrypt-key>"
```

CLI (Import)

Dry-run:

```bash
node server/scripts/import.js --file=./tmp/export.zakapp.json --userId=<targetUserId> --dry-run
```

Apply import (skip strategy default):

```bash
node server/scripts/import.js --file=./tmp/export.zakapp.json --userId=<targetUserId> --strategy=skip
```

Apply import with re-encryption (interactive key input recommended):

```bash
node server/scripts/import.js --file=./tmp/export.zakapp.json --userId=<targetUserId> --strategy=skip --rekey --previous-keys='./tmp/prev-keys.json' --target-key='<new-key>'
```

Notes

- CLI scripts support `--dry-run` and produce `ImportReport` JSON to stdout.
- For large datasets prefer server background job mode; the API will return a job id and an endpoint to poll.
