# Zero-Knowledge Encryption API Specification

**Version:** 1.0  
**Last Updated:** February 8, 2026  
**Status:** Draft for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [ZK1 Format Specification](#zk1-format-specification)
4. [API Endpoints](#api-endpoints)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [Migration Flow](#migration-flow)
7. [Security Model](#security-model)
8. [Backward Compatibility](#backward-compatibility)
9. [Error Handling](#error-handling)
10. [Implementation Checklist](#implementation-checklist)

---

## Executive Summary

ZakApp is transitioning from **server-side encryption** (where the server CAN decrypt user data) to **client-side encryption** (where the server CANNOT decrypt user data). This document defines the API contracts that enable this zero-knowledge architecture.

### Key Changes

| Aspect | Current (Legacy) | New (ZK1) |
|--------|------------------|-----------|
| **Encryption Location** | Server | Client (Browser) |
| **Key Storage** | Server (ENCRYPTION_KEY env var) | Client (In-memory, session-only) |
| **Key Derivation** | N/A | PBKDF2 from user password |
| **Server Access** | Can decrypt all data | Cannot decrypt any data |
| **Format** | `<iv>:<encrypted>:<tag>` | `ZK1:<iv>:<ciphertext>` |

### TypeScript Contracts Location

All TypeScript interfaces are defined in:  
**`shared/src/types/zk-contracts.ts`**

Import example:
```typescript
import { 
  EncryptedPaymentData, 
  MigrationStatus,
  ZK1_PREFIX 
} from '@zakapp/shared/types/zk-contracts';
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│                                                             │
│  ┌──────────────┐      ┌─────────────────┐               │
│  │ User enters  │      │ CryptoService   │               │
│  │ password     │─────>│ derives key     │               │
│  │              │      │ (PBKDF2)        │               │
│  └──────────────┘      └─────────────────┘               │
│                                │                           │
│                                ▼                           │
│                    ┌──────────────────────┐               │
│                    │ Encrypt sensitive    │               │
│                    │ data (AES-GCM)       │               │
│                    │ → ZK1 format         │               │
│                    └──────────────────────┘               │
│                                │                           │
└────────────────────────────────┼───────────────────────────┘
                                 │
                                 │ HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                         SERVER                              │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Receives ZK1 data → Stores as-is (NO decryption)    │  │
│  │ Cannot derive key (no password)                      │  │
│  │ Cannot decrypt ZK1 data                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ SQLite Database                                      │  │
│  │ - recipient: "ZK1:abc123:def456"                     │  │
│  │ - notes: "ZK1:xyz789:ghi012"                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Encryption Matrix

| Field | Encrypted? | Format | Server Can Read? |
|-------|-----------|--------|------------------|
| `amount` | ❌ No | Plaintext number | ✅ Yes (for calculations) |
| `paymentDate` | ❌ No | ISO 8601 string | ✅ Yes (for filtering) |
| `currency` | ❌ No | Plaintext string | ✅ Yes |
| `recipient` | ✅ Yes | ZK1 format | ❌ No |
| `notes` | ✅ Yes | ZK1 format | ❌ No |

**Rationale:** 
- **Amount/Date NOT encrypted**: Server needs to perform aggregations, sorting, and filtering
- **Recipient/Notes encrypted**: Personal/sensitive information with no server-side processing needs

---

## ZK1 Format Specification

### Format Definition

```
ZK1:<iv_base64>:<ciphertext_base64>
```

### Components

| Component | Description | Encoding | Length |
|-----------|-------------|----------|--------|
| **Prefix** | Version identifier | ASCII | 4 chars (`ZK1:`) |
| **IV** | Initialization Vector | Base64 | ~16 chars (12 bytes) |
| **Ciphertext** | Encrypted data + auth tag | Base64 | Variable |

### Example

```
ZK1:kZ8jH2k4mN6p:Ax7Bq3Dm9Fp2Ks5Lt8Wv1Zx4Cy7Ez0
│  │            │
│  │            └─ Ciphertext (includes auth tag)
│  └─ Initialization Vector (12 bytes → base64)
└─ Format prefix (version 1)
```

### Detailed Breakdown

```javascript
// Original plaintext
const plaintext = "Masjid Al-Noor";

// Client encrypts with user's derived key
const iv = crypto.getRandomValues(new Uint8Array(12));
const ciphertext = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  masterKey,
  new TextEncoder().encode(plaintext)
);

// Format for transmission/storage
const formatted = `ZK1:${base64(iv)}:${base64(ciphertext)}`;
// Result: "ZK1:kZ8jH2k4mN6p:Ax7Bq3Dm9Fp2Ks5Lt8Wv1Zx4Cy7Ez0"
```

### Format Detection Algorithm

```typescript
function detectFormat(data: string): EncryptionFormat {
  if (!data || typeof data !== 'string') {
    return EncryptionFormat.PLAINTEXT;
  }
  
  if (data.startsWith('ZK1:')) {
    return EncryptionFormat.ZK1;
  }
  
  // Legacy format: <iv>:<encrypted>:<tag>
  const parts = data.split(':');
  if (parts.length === 3) {
    try {
      // Validate base64 and length
      const iv = Buffer.from(parts[0], 'base64');
      if (iv.length === 12 || iv.length === 16) {
        return EncryptionFormat.LEGACY;
      }
    } catch {
      return EncryptionFormat.PLAINTEXT;
    }
  }
  
  return EncryptionFormat.PLAINTEXT;
}
```

### Encryption Specifications

| Parameter | Value |
|-----------|-------|
| **Algorithm** | AES-GCM |
| **Key Length** | 256 bits |
| **IV Length** | 96 bits (12 bytes) |
| **Auth Tag Length** | 128 bits (16 bytes) |
| **Key Derivation** | PBKDF2 |
| **KDF Hash** | SHA-256 |
| **KDF Iterations** | 600,000 |

---

## API Endpoints

### 1. GET `/api/user/encryption-status`

**Purpose:** Check user's migration status and retrieve encryption metadata

**Authentication:** Required (JWT)

**Request:**
```http
GET /api/user/encryption-status
Authorization: Bearer <jwt_token>
```

**Response:**
```typescript
{
  "status": "pending" | "in_progress" | "completed",
  "totalPayments": 42,
  "legacyPayments": 42,
  "zk1Payments": 0,
  "requiresMigration": true,
  "salt": "a3f9d8e7c6b5a4e3d2c1b0a9f8e7d6c5"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | `MigrationStatus` | User's current migration status |
| `totalPayments` | `number` | Total payment records |
| `legacyPayments` | `number` | Payments in legacy format |
| `zk1Payments` | `number` | Payments in ZK1 format |
| `requiresMigration` | `boolean` | Whether user needs to migrate |
| `salt` | `string` | User's public salt for key derivation |

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid JWT token |
| 500 | `INTERNAL_ERROR` | Server error |

---

### 2. POST `/api/user/prepare-migration`

**Purpose:** Server decrypts legacy data and returns plaintext for client re-encryption

**Authentication:** Required (JWT)

**Security Note:** This endpoint should be rate-limited and only callable once per user during migration.

**Request:**
```http
POST /api/user/prepare-migration
Authorization: Bearer <jwt_token>
Content-Type: application/json

{}
```

**Response:**
```typescript
{
  "success": true,
  "payments": [
    {
      "id": "payment_123",
      "recipient": "Masjid Al-Noor",  // Decrypted by server
      "notes": "Monthly zakat"         // Decrypted by server
    },
    {
      "id": "payment_456",
      "recipient": null,
      "notes": "Emergency relief fund"
    }
  ],
  "totalCount": 2
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Operation success indicator |
| `payments` | `Array<{id, recipient?, notes?}>` | Decrypted payment data |
| `totalCount` | `number` | Number of payments to migrate |

**Important:** 
- Server uses its `ENCRYPTION_KEY` to decrypt legacy data
- Returned data is **plaintext** (not encrypted)
- Client MUST immediately re-encrypt with ZK1 format
- This is a **one-time operation** per user

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid JWT token |
| 409 | `ALREADY_MIGRATED` | User already completed migration |
| 429 | `RATE_LIMITED` | Too many migration attempts |
| 500 | `INTERNAL_ERROR` | Server error |

---

### 3. PATCH `/api/payments/:id`

**Purpose:** Update payment record with ZK1-encrypted data

**Authentication:** Required (JWT)

**Request:**
```http
PATCH /api/payments/payment_123
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "recipient": "ZK1:kZ8jH2k4mN6p:Ax7Bq3Dm9Fp2Ks5Lt8Wv1Zx4Cy7Ez0",
  "notes": "ZK1:mP9lK3n7oQ2r:By8Ct4Ev6Gu9Hp1Iq3Jr5Ks8Lu0Mv2"
}
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recipient` | `string \| null` | No | ZK1-encrypted recipient |
| `notes` | `string \| null` | No | ZK1-encrypted notes |

**Validation Rules:**
- If provided, MUST start with `ZK1:` prefix
- Server validates format (splits on `:`, checks base64)
- Server DOES NOT decrypt or validate content

**Response:**
```typescript
{
  "id": "payment_123",
  "userId": "user_789",
  "calculationId": "calc_456",
  "amount": 250.00,
  "currency": "USD",
  "paymentDate": "2026-01-15",
  "recipient": "ZK1:kZ8jH2k4mN6p:Ax7Bq3Dm9Fp2Ks5Lt8Wv1Zx4Cy7Ez0",
  "notes": "ZK1:mP9lK3n7oQ2r:By8Ct4Ev6Gu9Hp1Iq3Jr5Ks8Lu0Mv2",
  "receiptUrl": "/api/zakat/receipts/eyJhbGc...",
  "createdAt": "2026-01-15T10:30:00Z",
  "updatedAt": "2026-02-08T15:20:00Z"
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_FORMAT` | Data not in ZK1 format |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT token |
| 403 | `FORBIDDEN` | Payment belongs to different user |
| 404 | `NOT_FOUND` | Payment ID does not exist |
| 500 | `INTERNAL_ERROR` | Server error |

---

### 4. POST `/api/user/mark-migrated`

**Purpose:** Mark user as fully migrated to ZK1 encryption

**Authentication:** Required (JWT)

**Request:**
```http
POST /api/user/mark-migrated
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "confirmed": true
}
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `confirmed` | `boolean` | Yes | Must be `true` to proceed |

**Response:**
```typescript
{
  "success": true,
  "status": "completed",
  "message": "Migration completed successfully"
}
```

**Server Actions:**
1. Update user's migration status to `completed`
2. Log migration completion timestamp
3. Optionally: disable legacy decryption endpoints for this user

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INCOMPLETE_MIGRATION` | Not all payments migrated |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT token |
| 409 | `ALREADY_MIGRATED` | User already completed migration |
| 500 | `INTERNAL_ERROR` | Server error |

---

### 5. POST `/api/payments` (Modified for ZK1)

**Purpose:** Create new payment with ZK1-encrypted fields

**Authentication:** Required (JWT)

**Request:**
```http
POST /api/payments
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "calculationId": "calc_456",
  "amount": 250.00,
  "paymentDate": "2026-01-15",
  "recipient": "ZK1:kZ8jH2k4mN6p:Ax7Bq3Dm9Fp2Ks5Lt8Wv1Zx4Cy7Ez0",
  "notes": "ZK1:mP9lK3n7oQ2r:By8Ct4Ev6Gu9Hp1Iq3Jr5Ks8Lu0Mv2"
}
```

**Changes from Legacy:**
- `recipient` and `notes` MUST be in ZK1 format if user is migrated
- Server stores as-is, no encryption/decryption

**Response:** Same as PATCH endpoint

---

### 6. GET `/api/payments` (Modified for ZK1)

**Purpose:** Retrieve user's payment records

**Authentication:** Required (JWT)

**Request:**
```http
GET /api/payments?year=2026&page=1&limit=20
Authorization: Bearer <jwt_token>
```

**Response:**
```typescript
[
  {
    "id": "payment_123",
    "userId": "user_789",
    "calculationId": "calc_456",
    "amount": 250.00,
    "currency": "USD",
    "paymentDate": "2026-01-15",
    "recipient": "ZK1:kZ8jH2k4mN6p:Ax7Bq3Dm9Fp2Ks5Lt8Wv1Zx4Cy7Ez0",
    "notes": "ZK1:mP9lK3n7oQ2r:By8Ct4Ev6Gu9Hp1Iq3Jr5Ks8Lu0Mv2",
    "receiptUrl": "/api/zakat/receipts/eyJhbGc...",
    "createdAt": "2026-01-15T10:30:00Z",
    "updatedAt": "2026-01-15T10:30:00Z"
  }
]
```

**Changes from Legacy:**
- Server returns encrypted data as-is (no decryption)
- Client MUST decrypt `recipient` and `notes` fields
- Client uses format detection to handle legacy vs ZK1

---

## Data Flow Diagrams

### Flow 1: New Payment Creation (Post-Migration User)

```
┌──────────┐                                           ┌──────────┐
│  Client  │                                           │  Server  │
└────┬─────┘                                           └────┬─────┘
     │                                                      │
     │ 1. User enters payment details                      │
     │    - Amount: 250                                    │
     │    - Recipient: "Masjid Al-Noor"                    │
     │    - Notes: "Monthly zakat"                         │
     │                                                      │
     │ 2. Derive encryption key from password              │
     │    (PBKDF2, 600k iterations)                        │
     │                                                      │
     │ 3. Encrypt sensitive fields                         │
     │    recipient → ZK1:abc123:def456                    │
     │    notes → ZK1:xyz789:ghi012                        │
     │                                                      │
     │ 4. POST /api/payments                               │
     ├────────────────────────────────────────────────────>│
     │    {                                                │
     │      "amount": 250,                                 │
     │      "paymentDate": "2026-01-15",                   │
     │      "recipient": "ZK1:abc123:def456",              │
     │      "notes": "ZK1:xyz789:ghi012"                   │
     │    }                                                │
     │                                                      │
     │                                   5. Validate format│
     │                                   6. Store as-is    │
     │                                      (no decryption)│
     │                                                      │
     │ 7. 201 Created                                      │
     │<────────────────────────────────────────────────────┤
     │    {                                                │
     │      "id": "payment_123",                           │
     │      "recipient": "ZK1:abc123:def456",              │
     │      "notes": "ZK1:xyz789:ghi012",                  │
     │      ...                                            │
     │    }                                                │
     │                                                      │
     │ 8. Store encrypted data in state                    │
     │                                                      │
```

### Flow 2: Retrieving and Decrypting Payments

```
┌──────────┐                                           ┌──────────┐
│  Client  │                                           │  Server  │
└────┬─────┘                                           └────┬─────┘
     │                                                      │
     │ 1. GET /api/payments                                │
     ├────────────────────────────────────────────────────>│
     │                                                      │
     │                                   2. Query database  │
     │                                   3. Return as-is    │
     │                                      (no decryption) │
     │                                                      │
     │ 4. 200 OK                                           │
     │<────────────────────────────────────────────────────┤
     │    [                                                │
     │      {                                              │
     │        "id": "payment_123",                         │
     │        "recipient": "ZK1:abc123:def456",            │
     │        "notes": "ZK1:xyz789:ghi012"                 │
     │      }                                              │
     │    ]                                                │
     │                                                      │
     │ 5. For each payment:                                │
     │    - Detect format (ZK1 vs legacy)                  │
     │    - Unpack ZK1: extract iv & ciphertext            │
     │    - Decrypt with user's key                        │
     │    - Replace with plaintext in UI                   │
     │                                                      │
     │ 6. Display decrypted data to user                   │
     │    Recipient: "Masjid Al-Noor"                      │
     │    Notes: "Monthly zakat"                           │
     │                                                      │
```

---

## Migration Flow

### Migration State Machine

```
┌──────────┐
│ PENDING  │ (Legacy encryption)
└────┬─────┘
     │
     │ User clicks "Migrate to Zero-Knowledge Encryption"
     │
     ▼
┌─────────────┐
│ IN_PROGRESS │ (Mixed state)
└─────┬───────┘
      │
      │ Client re-encrypts all payments
      │
      ▼
┌───────────┐
│ COMPLETED │ (ZK1 encryption)
└───────────┘
```

### Detailed Migration Flow

```
┌──────────┐                                           ┌──────────┐
│  Client  │                                           │  Server  │
└────┬─────┘                                           └────┬─────┘
     │                                                      │
     │ Step 1: Check Migration Status                      │
     ├────────────────────────────────────────────────────>│
     │ GET /api/user/encryption-status                     │
     │                                                      │
     │<────────────────────────────────────────────────────┤
     │ { "status": "pending", "legacyPayments": 42 }       │
     │                                                      │
     │ Step 2: Prompt user for password                    │
     │ "Enter password to migrate to secure encryption"    │
     │                                                      │
     │ Step 3: Derive encryption key                       │
     │ (PBKDF2 from password + salt)                       │
     │                                                      │
     │ Step 4: Request decrypted legacy data               │
     ├────────────────────────────────────────────────────>│
     │ POST /api/user/prepare-migration                    │
     │                                                      │
     │                          5. Server decrypts all     │
     │                             legacy data with its key│
     │                                                      │
     │ 6. Receive plaintext data                           │
     │<────────────────────────────────────────────────────┤
     │ {                                                   │
     │   "payments": [                                     │
     │     {                                               │
     │       "id": "payment_123",                          │
     │       "recipient": "Masjid Al-Noor",                │
     │       "notes": "Monthly zakat"                      │
     │     }                                               │
     │   ]                                                 │
     │ }                                                   │
     │                                                      │
     │ Step 7: Re-encrypt each payment with ZK1            │
     │ For each payment:                                   │
     │   - Encrypt recipient → ZK1:abc:def                 │
     │   - Encrypt notes → ZK1:xyz:ghi                     │
     │   - PATCH /api/payments/:id                         │
     ├────────────────────────────────────────────────────>│
     │   { "recipient": "ZK1:...", "notes": "ZK1:..." }    │
     │                                                      │
     │                          8. Validate ZK1 format     │
     │                          9. Store as-is             │
     │                                                      │
     │<────────────────────────────────────────────────────┤
     │ 200 OK                                              │
     │                                                      │
     │ Step 10: After all payments migrated                │
     ├────────────────────────────────────────────────────>│
     │ POST /api/user/mark-migrated                        │
     │ { "confirmed": true }                               │
     │                                                      │
     │                          11. Update user status     │
     │                              to "completed"         │
     │                                                      │
     │<────────────────────────────────────────────────────┤
     │ { "status": "completed" }                           │
     │                                                      │
     │ Step 12: Show success message                       │
     │ "Migration complete! Your data is now zero-knowledge"│
     │                                                      │
```

### Migration Progress Tracking

Client should track migration progress:

```typescript
interface MigrationProgress {
  total: number;
  completed: number;
  failed: number;
  currentPaymentId?: string;
  errors: Array<{ paymentId: string; error: string }>;
}

// Example progress indicator
"Migrating payment 15 of 42..."
```

---

## Security Model

### Threat Model

| Threat | Legacy System | ZK1 System |
|--------|---------------|------------|
| **Server Compromise** | ⚠️ All data exposed | ✅ No data exposure |
| **Database Breach** | ⚠️ All data exposed | ✅ No data exposure |
| **Malicious Admin** | ⚠️ Can decrypt all data | ✅ Cannot decrypt |
| **Password Breach** | ⚠️ Must rotate server key | ✅ Only affects one user |
| **MITM Attack** | ✅ Protected by HTTPS | ✅ Protected by HTTPS |
| **Client Malware** | ⚠️ Can intercept | ⚠️ Can intercept |

### Key Properties

#### 1. Zero-Knowledge Property

**Definition:** Server never learns the user's password or derived encryption key.

**Enforcement:**
- Key derivation happens **client-side only** (in browser)
- Key stored in memory only (never transmitted or persisted)
- Server never receives plaintext of encrypted fields

**Verification:**
```typescript
// Client-side only
const masterKey = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
  passwordKey,
  { name: 'AES-GCM', length: 256 },
  false, // NOT extractable
  ['encrypt', 'decrypt']
);
// masterKey never leaves this context
```

#### 2. Forward Secrecy

**Property:** Compromising the server key does NOT compromise ZK1-encrypted data.

**Reasoning:**
- ZK1 data encrypted with user-derived key (not server key)
- Server key only affects legacy data
- Migration to ZK1 removes server key dependency

#### 3. Data Segregation

**Plaintext Fields (Server Can Read):**
- User ID, payment ID, calculation ID
- Amount, currency, payment date
- Islamic year, payment method, status

**Encrypted Fields (Server Cannot Read):**
- Recipient information
- User notes

**Design Decision:** Balance between functionality (aggregations, filtering) and privacy.

### Authentication Flow

```
┌──────────────────────────────────────────────────┐
│ 1. User enters credentials                      │
│    - Email: user@example.com                    │
│    - Password: correct-horse-battery-staple     │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│ 2. Client sends to server (HTTPS)               │
│    POST /api/auth/login                          │
│    { "email": "...", "password": "..." }         │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│ 3. Server validates with bcrypt                  │
│    - Compare hash, not plaintext                 │
│    - Returns JWT + user salt                     │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│ 4. Client receives response                      │
│    { "token": "eyJhbG...", "salt": "a3f9..." }   │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│ 5. Client derives encryption key (client-side)   │
│    PBKDF2(password, salt, 600k) → masterKey      │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│ 6. Client stores in memory (sessionStorage)      │
│    - JWT token (for API auth)                    │
│    - Derived key (for encryption/decryption)     │
│    - NEVER send key to server                    │
└──────────────────────────────────────────────────┘
```

### Session Management

**Key Storage:**
```typescript
// CORRECT: In-memory storage
class CryptoService {
  private masterKey: CryptoKey | null = null;
  
  async deriveKey(password: string, salt: string) {
    this.masterKey = await crypto.subtle.deriveKey(/* ... */);
  }
  
  clearSession() {
    this.masterKey = null; // Cleared on logout
  }
}
```

**NEVER:**
```typescript
// WRONG: localStorage persists across sessions
localStorage.setItem('encryptionKey', key); // ❌ NEVER DO THIS

// WRONG: Sending key to server
fetch('/api/save-key', { body: { key } }); // ❌ NEVER DO THIS
```

**Session Persistence (Optional):**
```typescript
// Acceptable: Temporary session storage (deleted on browser close)
const jwk = await crypto.subtle.exportKey('jwk', masterKey);
sessionStorage.setItem('__enc_key', JSON.stringify(jwk));

// On page refresh within same session
const jwk = JSON.parse(sessionStorage.getItem('__enc_key'));
const key = await crypto.subtle.importKey('jwk', jwk, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
```

---

## Backward Compatibility

### Mixed-State Handling

During migration, users will have a mix of legacy and ZK1 encrypted data. The system MUST handle both formats transparently.

### Server-Side Format Detection

```typescript
function detectAndDecrypt(
  encryptedData: string, 
  serverKey: string,
  userId: string
): string | EncryptedString {
  
  // ZK1 format: return as-is (server cannot decrypt)
  if (encryptedData.startsWith('ZK1:')) {
    return encryptedData;
  }
  
  // Legacy format: decrypt with server key
  if (encryptedData.includes(':')) {
    const parts = encryptedData.split(':');
    if (parts.length === 3) {
      try {
        return decryptLegacy(encryptedData, serverKey);
      } catch (err) {
        logger.error(`Failed to decrypt legacy data for user ${userId}`);
        return '[Decryption Failed]';
      }
    }
  }
  
  // Plaintext: return as-is
  return encryptedData;
}
```

### Client-Side Format Detection

```typescript
async function decryptField(
  data: string,
  cryptoService: CryptoService
): Promise<string> {
  
  // Not encrypted
  if (!data || typeof data !== 'string') {
    return data;
  }
  
  // ZK1 format: decrypt with user key
  if (data.startsWith('ZK1:')) {
    const parts = data.substring(4).split(':');
    const [iv, ciphertext] = parts;
    return await cryptoService.decrypt(ciphertext, iv);
  }
  
  // Legacy format: already decrypted by server
  // (in mixed state, server may have already decrypted)
  return data;
}
```

### Migration Strategy: Phased Rollout

**Phase 1: Dual Support (Current)**
- Server supports both formats
- New users start with ZK1
- Existing users remain on legacy

**Phase 2: Migration Window**
- Prompt legacy users to migrate
- Provide migration tool in UI
- Track migration status

**Phase 3: Legacy Deprecation**
- Set deadline for migration
- Notify unmigrated users
- Eventually disable legacy encryption

**Phase 4: Full ZK1**
- Remove legacy encryption code
- Simplify codebase
- Improve security posture

---

## Error Handling

### Client-Side Errors

| Error | Cause | Handling |
|-------|-------|----------|
| `Key not derived` | User not logged in | Redirect to login |
| `Decryption failed` | Wrong password or corrupted data | Prompt password re-entry |
| `Invalid ZK1 format` | Malformed encrypted string | Show error, log to monitoring |
| `Migration incomplete` | Network error during migration | Resume from checkpoint |

**Example Error Display:**
```typescript
try {
  const decrypted = await cryptoService.decrypt(ciphertext, iv);
  return decrypted;
} catch (err) {
  if (err.message.includes('Key not derived')) {
    // User logged out in another tab
    showError('Session expired. Please log in again.');
    redirectToLogin();
  } else {
    // Data corruption or wrong key
    showError('Unable to decrypt data. Please verify your password.');
    logger.error('Decryption error', { paymentId, error: err.message });
  }
}
```

### Server-Side Errors

| Error | HTTP Status | Response |
|-------|------------|----------|
| Invalid ZK1 format | 400 | `{ "error": "Invalid encryption format" }` |
| Migration already completed | 409 | `{ "error": "User already migrated" }` |
| Payment not found | 404 | `{ "error": "Payment not found" }` |
| Unauthorized | 401 | `{ "error": "Authentication required" }` |
| Server error | 500 | `{ "error": "Internal server error" }` |

**Example Server Validation:**
```typescript
function validateZK1Format(data: string): boolean {
  if (!data.startsWith('ZK1:')) {
    return false;
  }
  
  const parts = data.substring(4).split(':');
  if (parts.length !== 2) {
    return false;
  }
  
  const [iv, ciphertext] = parts;
  
  // Validate base64
  try {
    Buffer.from(iv, 'base64');
    Buffer.from(ciphertext, 'base64');
  } catch {
    return false;
  }
  
  // Validate IV length (12 bytes = 16 chars base64)
  const ivBuffer = Buffer.from(iv, 'base64');
  if (ivBuffer.length !== 12) {
    return false;
  }
  
  return true;
}
```

### Error Recovery

**Scenario 1: Migration Interrupted**

User closes browser mid-migration.

**Solution:**
- Track migration progress in `migration_status` table
- On next login, detect incomplete migration
- Resume from last successful payment

**Scenario 2: Password Forgotten After Migration**

User cannot decrypt ZK1 data.

**Solution:**
- No recovery possible (by design)
- Warn users prominently before migration
- Consider optional "recovery key" feature (future enhancement)

**Scenario 3: Corrupted ZK1 Data**

Database contains malformed ZK1 string.

**Solution:**
- Client catches decryption error
- Display placeholder: "[Unable to decrypt]"
- Log to monitoring system
- Admin tool to mark record as corrupted

---

## Implementation Checklist

### Frontend Team

#### Phase 1: Type Definitions
- [ ] Import types from `shared/src/types/zk-contracts.ts`
- [ ] Update existing `Payment` interface to use `EncryptedPaymentData`
- [ ] Add format detection utilities

#### Phase 2: Migration UI
- [ ] Create migration wizard component
- [ ] Add migration status check on app load
- [ ] Implement progress tracking UI
- [ ] Add error handling and retry logic

#### Phase 3: Encryption Updates
- [ ] Update `CryptoService.encrypt()` to return ZK1 format
- [ ] Add format detection to `CryptoService.decrypt()`
- [ ] Update payment creation forms to use ZK1
- [ ] Update payment display to decrypt ZK1

#### Phase 4: Testing
- [ ] Test with legacy data (mock server responses)
- [ ] Test migration flow end-to-end
- [ ] Test mixed-state handling
- [ ] Test error cases (wrong password, network errors)

---

### Backend Team

#### Phase 1: Type Definitions
- [ ] Import types from `shared/src/types/zk-contracts.ts`
- [ ] Update database schema if needed (no changes expected)
- [ ] Add migration status tracking table/column

#### Phase 2: Format Detection
- [ ] Implement `detectFormat()` utility
- [ ] Update `EncryptionService` to handle ZK1 passthrough
- [ ] Add ZK1 format validation

#### Phase 3: Migration Endpoints
- [ ] Implement `GET /api/user/encryption-status`
- [ ] Implement `POST /api/user/prepare-migration`
- [ ] Implement `POST /api/user/mark-migrated`
- [ ] Add rate limiting to migration endpoints

#### Phase 4: Update Existing Endpoints
- [ ] Update `POST /api/payments` to accept ZK1
- [ ] Update `PATCH /api/payments/:id` to accept ZK1
- [ ] Update `GET /api/payments` to return mixed formats
- [ ] Remove decryption logic for ZK1 data

#### Phase 5: Testing
- [ ] Unit tests for format detection
- [ ] Integration tests for migration flow
- [ ] Test backward compatibility with legacy data
- [ ] Load testing for migration endpoints

---

### Database Schema Changes

**Minimal changes required:**

```sql
-- Add migration tracking column (if not exists)
ALTER TABLE users ADD COLUMN migration_status TEXT DEFAULT 'pending';
ALTER TABLE users ADD COLUMN migrated_at TIMESTAMP NULL;

-- Existing columns work as-is:
-- payments.recipient (TEXT) - stores ZK1:... or legacy format
-- payments.notes (TEXT) - stores ZK1:... or legacy format
```

**No breaking changes** - ZK1 format is just a different string format in existing TEXT columns.

---

## Appendix: Code Examples

### Client-Side: Encrypting a New Payment

```typescript
import { cryptoService } from '@/services/CryptoService';
import { EncryptedPaymentData } from '@zakapp/shared/types/zk-contracts';

async function createPayment(formData: {
  amount: number;
  paymentDate: string;
  recipient: string;
  notes: string;
}) {
  // Encrypt sensitive fields
  const { iv: recipientIv, cipherText: recipientCipher } = 
    await cryptoService.encrypt(formData.recipient);
  
  const { iv: notesIv, cipherText: notesCipher } = 
    await cryptoService.encrypt(formData.notes);
  
  // Pack into ZK1 format
  const encryptedRecipient = cryptoService.packEncrypted(recipientIv, recipientCipher);
  const encryptedNotes = cryptoService.packEncrypted(notesIv, notesCipher);
  
  // Send to server
  const payload: EncryptedPaymentData = {
    amount: formData.amount,
    paymentDate: formData.paymentDate,
    recipient: encryptedRecipient, // "ZK1:abc:def"
    notes: encryptedNotes            // "ZK1:xyz:ghi"
  };
  
  const response = await fetch('/api/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  return response.json();
}
```

### Client-Side: Decrypting Retrieved Payments

```typescript
import { cryptoService } from '@/services/CryptoService';
import { EncryptedPaymentData, DecryptedPaymentData } from '@zakapp/shared/types/zk-contracts';

async function decryptPayment(
  encrypted: EncryptedPaymentData
): Promise<DecryptedPaymentData> {
  
  const decrypted: DecryptedPaymentData = { ...encrypted };
  
  // Decrypt recipient if present and encrypted
  if (encrypted.recipient && cryptoService.isEncrypted(encrypted.recipient)) {
    const unpacked = cryptoService.unpackEncrypted(encrypted.recipient);
    if (unpacked) {
      decrypted.recipient = await cryptoService.decrypt(
        unpacked.ciphertext, 
        unpacked.iv
      );
    }
  }
  
  // Decrypt notes if present and encrypted
  if (encrypted.notes && cryptoService.isEncrypted(encrypted.notes)) {
    const unpacked = cryptoService.unpackEncrypted(encrypted.notes);
    if (unpacked) {
      decrypted.notes = await cryptoService.decrypt(
        unpacked.ciphertext, 
        unpacked.iv
      );
    }
  }
  
  return decrypted;
}

// Usage
const payments = await fetch('/api/payments').then(r => r.json());
const decryptedPayments = await Promise.all(
  payments.map(p => decryptPayment(p))
);
```

### Server-Side: Handling Mixed Formats

```typescript
import { EncryptionService } from '@/services/EncryptionService';
import { EncryptionFormat } from '@zakapp/shared/types/zk-contracts';

function detectFormat(data: string): EncryptionFormat {
  if (!data || typeof data !== 'string') {
    return EncryptionFormat.PLAINTEXT;
  }
  
  if (data.startsWith('ZK1:')) {
    return EncryptionFormat.ZK1;
  }
  
  // Legacy format detection
  const parts = data.split(':');
  if (parts.length === 3) {
    try {
      const iv = Buffer.from(parts[0], 'base64');
      if (iv.length === 12) {
        return EncryptionFormat.LEGACY;
      }
    } catch {}
  }
  
  return EncryptionFormat.PLAINTEXT;
}

async function handlePaymentField(
  data: string,
  serverKey: string
): Promise<string> {
  
  const format = detectFormat(data);
  
  switch (format) {
    case EncryptionFormat.ZK1:
      // Return as-is, cannot decrypt
      return data;
      
    case EncryptionFormat.LEGACY:
      // Decrypt with server key
      return await EncryptionService.decrypt(data, serverKey);
      
    case EncryptionFormat.PLAINTEXT:
    default:
      return data;
  }
}
```

### Server-Side: Migration Preparation

```typescript
import { MigrationPrepareResponse } from '@zakapp/shared/types/zk-contracts';
import { prisma } from '@/utils/prisma';
import { EncryptionService } from '@/services/EncryptionService';

async function prepareMigration(userId: string): Promise<MigrationPrepareResponse> {
  // Check if already migrated
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user.migration_status === 'completed') {
    throw new Error('User already migrated');
  }
  
  // Fetch all payments
  const payments = await prisma.zakatPayment.findMany({
    where: { userId },
    select: { id: true, verificationDetails: true, notes: true }
  });
  
  // Decrypt legacy data
  const decryptedPayments = await Promise.all(
    payments.map(async (payment) => {
      const verificationDetails = JSON.parse(payment.verificationDetails || '{}');
      const recipient = verificationDetails.recipient
        ? await EncryptionService.decrypt(verificationDetails.recipient, ENCRYPTION_KEY)
        : null;
      const notes = payment.notes
        ? await EncryptionService.decrypt(payment.notes, ENCRYPTION_KEY)
        : null;
      
      return {
        id: payment.id,
        recipient,
        notes
      };
    })
  );
  
  // Update user status
  await prisma.user.update({
    where: { id: userId },
    data: { migration_status: 'in_progress' }
  });
  
  return {
    success: true,
    payments: decryptedPayments,
    totalCount: payments.length
  };
}
```

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-08 | Initial specification |

---

## Questions & Contact

For implementation questions, contact:
- **Frontend Lead:** [Team Contact]
- **Backend Lead:** [Team Contact]
- **Security Review:** [Security Team Contact]

---

**End of Specification**
