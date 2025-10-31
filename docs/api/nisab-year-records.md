# Nisab Year Records API

**Base Path**: `/api/nisab-year-records`

**Authentication**: All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## Overview

The Nisab Year Records API manages Islamic Zakat calculations with proper Hawl (lunar year) tracking. This API implements the complete lifecycle of Nisab Year Records, from automatic Hawl detection through finalization and audit trail management.

### Key Concepts

- **Nisab**: Minimum wealth threshold for Zakat obligation (87.48g gold or 612.36g silver)
- **Hawl**: Lunar year period (~354 days) that must elapse above Nisab before Zakat is due
- **Record Status**: DRAFT (tracking), FINALIZED (calculated), UNLOCKED (corrections allowed)

---

## Endpoints

### 1. List All Records

**`GET /api/nisab-year-records`**

Retrieve all Nisab Year Records for the authenticated user with optional filtering.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: `DRAFT`, `FINALIZED`, `UNLOCKED`, or `ALL` (default) |
| `year` | integer | No | Filter by Gregorian year (e.g., 2024) |

#### Response (200 OK)

```json
{
  "success": true,
  "records": [
    {
      "id": "clxyz123abc",
      "userId": "usr_abc123",
      "status": "DRAFT",
      "hawlStartDate": "2024-01-15T00:00:00Z",
      "hawlStartDateHijri": "1445-07-03",
      "hawlCompletionDate": "2024-12-30T00:00:00Z",
      "hawlCompletionDateHijri": "1446-06-28",
      "nisabThresholdAtStart": "5000.00",
      "nisabBasis": "gold",
      "totalWealth": "12500.00",
      "totalLiabilities": "2000.00",
      "zakatableWealth": "10500.00",
      "zakatAmount": "262.50",
      "methodologyUsed": "Standard",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-10-30T12:00:00Z",
      "finalizedAt": null
    }
  ]
}
```

#### Error Responses

- **401 Unauthorized**: Missing or invalid authentication token

---

### 2. Get Single Record

**`GET /api/nisab-year-records/:id`**

Retrieve detailed information for a specific Nisab Year Record, including complete audit trail.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Record ID |

#### Response (200 OK)

```json
{
  "success": true,
  "record": {
    "id": "clxyz123abc",
    "status": "FINALIZED",
    "hawlStartDate": "2024-01-15T00:00:00Z",
    "hawlStartDateHijri": "1445-07-03",
    "hawlCompletionDate": "2024-12-30T00:00:00Z",
    "hawlCompletionDateHijri": "1446-06-28",
    "nisabThresholdAtStart": "5000.00",
    "nisabBasis": "gold",
    "totalWealth": "12500.00",
    "totalLiabilities": "2000.00",
    "zakatableWealth": "10500.00",
    "zakatAmount": "262.50",
    "methodologyUsed": "Standard",
    "userNotes": "Annual Zakat for 2024",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-12-30T14:00:00Z",
    "finalizedAt": "2024-12-30T14:00:00Z"
  },
  "auditTrail": [
    {
      "id": "audit_001",
      "eventType": "CREATED",
      "timestamp": "2024-01-15T10:30:00Z",
      "userId": "usr_abc123"
    },
    {
      "id": "audit_002",
      "eventType": "FINALIZED",
      "timestamp": "2024-12-30T14:00:00Z",
      "userId": "usr_abc123"
    }
  ]
}
```

#### Error Responses

- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Record does not exist or user lacks permission

---

### 3. Create New Record

**`POST /api/nisab-year-records`**

Create a new DRAFT Nisab Year Record. Typically called automatically by the Hawl detection job, but can be used for manual/historical record creation.

#### Request Body

```json
{
  "hawlStartDate": "2024-01-15T00:00:00Z",
  "nisabBasis": "gold",
  "nisabThresholdAtStart": 5000.00,
  "userNotes": "Manual entry for past Hawl"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `hawlStartDate` | datetime | Yes | When aggregate wealth first reached Nisab |
| `nisabBasis` | string | Yes | `gold` or `silver` |
| `nisabThresholdAtStart` | number | No | Locked Nisab value (auto-calculated if omitted) |
| `userNotes` | string | No | Optional notes (encrypted) |

#### Response (201 Created)

```json
{
  "success": true,
  "record": {
    "id": "clxyz456def",
    "status": "DRAFT",
    "hawlStartDate": "2024-01-15T00:00:00Z",
    "hawlStartDateHijri": "1445-07-03",
    "hawlCompletionDate": "2024-12-30T00:00:00Z",
    "nisabThresholdAtStart": "5000.00",
    "nisabBasis": "gold",
    "createdAt": "2024-10-30T15:00:00Z"
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid input (missing required fields, invalid dates, etc.)
  ```json
  {
    "success": false,
    "error": "VALIDATION_ERROR",
    "message": "hawlStartDate is required",
    "details": ["Field 'hawlStartDate' must be a valid ISO 8601 datetime"]
  }
  ```
- **401 Unauthorized**: Missing or invalid authentication token

---

### 4. Update Record

**`PUT /api/nisab-year-records/:id`**

Update an existing Nisab Year Record with status transition validation.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Record ID |

#### Request Body

```json
{
  "status": "UNLOCKED",
  "unlockReason": "Correcting asset valuation error from January",
  "totalLiabilities": 2500.00,
  "userNotes": "Updated after discovering missed mortgage payment"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | No | Target status: `DRAFT`, `FINALIZED`, or `UNLOCKED` |
| `unlockReason` | string | Conditional | **Required** when transitioning to `UNLOCKED` (min 10 characters) |
| `totalLiabilities` | number | No | Updated deductible liabilities |
| `userNotes` | string | No | Updated notes |

#### Response (200 OK)

```json
{
  "success": true,
  "record": {
    "id": "clxyz123abc",
    "status": "UNLOCKED",
    "updatedAt": "2024-10-30T16:00:00Z"
  },
  "auditEntry": {
    "id": "audit_003",
    "eventType": "UNLOCKED",
    "timestamp": "2024-10-30T16:00:00Z",
    "unlockReason": "Correcting asset valuation error from January"
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid status transition or validation error
  ```json
  {
    "success": false,
    "error": "INVALID_TRANSITION",
    "message": "Cannot transition from DRAFT to UNLOCKED. Valid transitions: DRAFT → FINALIZED"
  }
  ```
  
  ```json
  {
    "success": false,
    "error": "VALIDATION_ERROR",
    "message": "Unlock reason must be at least 10 characters",
    "details": ["unlockReason: minimum length is 10 characters"]
  }
  ```

- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Record does not exist or user lacks permission

---

### 5. Delete Record

**`DELETE /api/nisab-year-records/:id`**

Delete a Nisab Year Record. **Only DRAFT records can be deleted.** Finalized or unlocked records cannot be deleted to maintain audit integrity.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Record ID |

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Record deleted successfully"
}
```

#### Error Responses

- **400 Bad Request**: Cannot delete non-DRAFT record
  ```json
  {
    "success": false,
    "error": "DELETE_NOT_ALLOWED",
    "message": "Cannot delete FINALIZED record. Unlock the record first if corrections are needed."
  }
  ```

- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Record does not exist or user lacks permission

---

### 6. Finalize Record

**`POST /api/nisab-year-records/:id/finalize`**

Finalize a DRAFT record, locking it for Zakat payment. Validates that the Hawl period has completed (~354 days).

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Record ID |

#### Request Body

```json
{
  "acknowledgePremature": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `acknowledgePremature` | boolean | No | Set to `true` to bypass Hawl completion check (use with caution) |

#### Response (200 OK)

```json
{
  "success": true,
  "record": {
    "id": "clxyz123abc",
    "status": "FINALIZED",
    "finalizedAt": "2024-12-30T14:00:00Z"
  },
  "auditEntry": {
    "id": "audit_002",
    "eventType": "FINALIZED",
    "timestamp": "2024-12-30T14:00:00Z"
  }
}
```

#### Error Responses

- **400 Bad Request**: Hawl not complete or invalid state
  ```json
  {
    "success": false,
    "error": "HAWL_NOT_COMPLETE",
    "message": "Cannot finalize: Hawl completion date is 2024-12-30 (45 days remaining). Set acknowledgePremature=true to override.",
    "details": {
      "hawlCompletionDate": "2024-12-30T00:00:00Z",
      "daysRemaining": 45
    }
  }
  ```

- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Record does not exist or user lacks permission

---

### 7. Unlock Record

**`POST /api/nisab-year-records/:id/unlock`**

Unlock a FINALIZED record to allow corrections. Requires a descriptive reason for audit trail.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Record ID |

#### Request Body

```json
{
  "reason": "Discovered unreported gold holdings that should be included in calculation"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | Yes | Unlock justification (min 10 characters, encrypted) |

#### Response (200 OK)

```json
{
  "success": true,
  "record": {
    "id": "clxyz123abc",
    "status": "UNLOCKED",
    "updatedAt": "2024-10-30T16:00:00Z"
  },
  "auditEntry": {
    "id": "audit_003",
    "eventType": "UNLOCKED",
    "timestamp": "2024-10-30T16:00:00Z",
    "unlockReason": "Discovered unreported gold holdings that should be included in calculation"
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid state or insufficient reason
  ```json
  {
    "success": false,
    "error": "INVALID_STATUS",
    "message": "Record must be FINALIZED to unlock. Current status: DRAFT"
  }
  ```
  
  ```json
  {
    "success": false,
    "error": "VALIDATION_ERROR",
    "message": "Unlock reason must be at least 10 characters"
  }
  ```

- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Record does not exist or user lacks permission

---

## Status Transition Rules

Valid status transitions enforced by the API:

```
DRAFT ──────────────────────> FINALIZED
                                   │
                                   │ (unlock with reason)
                                   ▼
                              UNLOCKED
                                   │
                                   │ (re-finalize)
                                   ▼
                              FINALIZED
```

### Allowed Transitions

- **DRAFT → FINALIZED**: Requires `hawlCompletionDate` ≤ current date (can override)
- **FINALIZED → UNLOCKED**: Always allowed with unlock reason (min 10 chars)
- **UNLOCKED → FINALIZED**: Always allowed (re-finalization)

### Invalid Transitions

- **DRAFT → UNLOCKED**: Not allowed (must finalize first)
- **FINALIZED → DRAFT**: Not allowed (use unlock instead)
- **UNLOCKED → DRAFT**: Not allowed (must re-finalize)

---

## Error Codes Reference

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed (missing fields, invalid format) |
| `INVALID_TRANSITION` | 400 | Status transition not allowed |
| `HAWL_NOT_COMPLETE` | 400 | Cannot finalize before Hawl completion date |
| `DELETE_NOT_ALLOWED` | 400 | Cannot delete non-DRAFT record |
| `INVALID_STATUS` | 400 | Operation not allowed for current record status |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | User does not own the requested record |
| `NOT_FOUND` | 404 | Record does not exist |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Best Practices

### 1. Status Transition Handling

Always check the current `status` before attempting operations:

```javascript
// Good: Check status before delete
const record = await getRecord(id);
if (record.status !== 'DRAFT') {
  showError('Only DRAFT records can be deleted. Use unlock for corrections.');
  return;
}
await deleteRecord(id);
```

### 2. Unlock Reason Guidelines

Provide clear, descriptive reasons for unlocking:

```javascript
// Good: Specific reason
unlockReason: "Correcting asset valuation: discovered $2,000 worth of gold jewelry not included in original calculation"

// Bad: Vague reason
unlockReason: "Fix mistake"
```

### 3. Hawl Completion Validation

Handle premature finalization gracefully:

```javascript
try {
  await finalizeRecord(id);
} catch (error) {
  if (error.code === 'HAWL_NOT_COMPLETE') {
    const confirm = await showConfirmDialog(
      `Hawl completes in ${error.details.daysRemaining} days. Finalize anyway?`
    );
    if (confirm) {
      await finalizeRecord(id, { acknowledgePremature: true });
    }
  }
}
```

### 4. Audit Trail Display

Always display audit trail for FINALIZED and UNLOCKED records to maintain transparency:

```javascript
const { record, auditTrail } = await getRecord(id);
if (record.status === 'FINALIZED' || record.status === 'UNLOCKED') {
  renderAuditTrail(auditTrail); // Show complete history
}
```

---

## Security Considerations

1. **Encryption**: All sensitive fields are encrypted at rest:
   - `totalWealth`, `totalLiabilities`, `zakatableWealth`, `zakatAmount`
   - `nisabThresholdAtStart`, `userNotes`, `unlockReason`

2. **Ownership**: Users can only access their own records. API validates JWT user ID matches record `userId`.

3. **Audit Trail**: All state changes are logged immutably in `audit_trail_entries` table.

4. **Rate Limiting**: Standard rate limits apply (100 requests/minute per user).

---

## Related Documentation

- [Zakat Calculation Methodologies](./zakat.md)
- [Calendar API (Hijri Conversions)](./calendar.md)
- [User Guide: Managing Nisab Year Records](../user-guide/nisab-year-records.md)
- [OpenAPI Specification](../specs/008-nisab-year-record/contracts/nisab-year-records.openapi.yaml)

---

**Last Updated**: 2025-10-30  
**API Version**: 1.0.0  
**Feature**: 008-nisab-year-record
