# Data Model: Import/Export — Stable, Portable Entities

This document defines canonical entity shapes used in exports and import matching rules (stableId), including canonicalization rules and checksum expectations.

Entities
--------

1. ExportPayload (top-level)

```ts
interface ExportPayload {
  metadata: {
    appVersion: string;
    schemaVersion: number;
    exportedAt: string; // ISO8601
    encryptionFormats: string[];
  };
  profile: Record<string, any>;
  assets: Asset[];
  nisabRecords: NisabRecord[];
  payments: Payment[];
  checksums: {
    assets: string; // sha256 hex
    nisabRecords: string;
    payments: string;
    overall: string;
  };
}
```

2. Asset

```ts
interface Asset {
  id?: string; // optional DB id
  stableId: string; // deterministic
  type: string;
  name: string;
  accountReference?: string;
  encryptedFields?: Record<string,string>; // ciphertexts preserved
  plainFields?: Record<string, any>;
  metadata?: Record<string, any>;
}
```

3. NisabRecord

```ts
interface NisabRecord {
  id?: string;
  stableId: string;
  year: number;
  zakatAmount?: number | string; // numeric or ciphertext preserved
  payments?: string[]; // list of payment stableIds
  metadata?: Record<string, any>;
}
```

4. Payment

```ts
interface Payment {
  id?: string;
  stableId: string;
  amount: number | string; // numeric or ciphertext
  date: string; // ISO8601
  method?: string;
  metadata?: Record<string, any>;
}
```

StableId generation
-------------------

All exported entities MUST include a `stableId` computed deterministically to enable idempotent imports. The algorithm:

1. Canonicalize the `canonicalizedUniqueKey` depending on entity type (lowercase, trim spaces, normalize unicode using NFKC, collapse internal whitespace to single space).
2. Compute `stableId = sha256_hex(namespace + ':' + entityType + ':' + canonicalizedUniqueKey)` where `namespace` is the feature numeric `023` or application-level namespace `zakapp`.

Examples of `canonicalizedUniqueKey`:
- Asset: `lower(type) + ':' + normalize(name) + ':' + normalize(accountReference || '')`
- NisabRecord: `year + ':' + ownerFingerprint` (ownerFingerprint is the user's id hashed with salt)
- Payment: `originalPaymentId` if present; otherwise `amount|date|method|nonce` canonicalized

Notes on canonicalization
- Use UTF-8, normalize to NFKC, trim, collapse whitespace, and lowercase where noted.
- Keep stable sorting of arrays by `stableId` for reproducible checksums.

Checksums
---------

- Each top-level array must have a SHA256 hex checksum computed over the UTF-8 bytes of the stable-sorted JSON array using deterministic JSON serialization (no whitespace differences, stable key ordering).
- `overall` checksum is SHA256 of concatenated array-checksums in order: assets, nisabRecords, payments.

Encryption handling
-------------------

- Preserve ciphertext for any encrypted fields by default. Do not attempt decryption on import unless the user provides a decryption key and consents.
- If re-encryption is requested during import and the user supplies previous keys and a target key, attempt to decrypt with provided previous keys and re-encrypt using target key, recording per-entity re-encrypt results in the `ImportReport`.
