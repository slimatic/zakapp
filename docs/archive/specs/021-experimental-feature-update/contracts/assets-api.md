# API Contracts: Asset Endpoints with Modifiers

**Phase**: 1 - API Contract Definition  
**Date**: 2025-12-12  
**Feature**: 021-experimental-feature-update

## Overview

This document defines the HTTP API contracts for asset management endpoints that support calculation modifiers. All endpoints require JWT authentication.

---

## Base URL

```
Production: https://zakapp.example.com/api
Development: http://localhost:5000/api
```

---

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <JWT_TOKEN>
```

**Error Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Authentication token required"
}
```

---

## POST /api/assets

Create a new asset with optional calculation modifiers.

### Request

**Headers**:
```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

**Body**:
```json
{
  "category": "Stock",
  "name": "Apple Inc. (AAPL)",
  "value": 10000.00,
  "currency": "USD",
  "acquisitionDate": "2024-01-15",
  "notes": "Long-term investment portfolio",
  "isPassiveInvestment": true,
  "isRestrictedAccount": false
}
```

**Field Specifications**:

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `category` | string | Yes | Min 1 char | Asset type (Stock, ETF, 401k, etc.) |
| `name` | string | Yes | 1-255 chars | Asset name/description |
| `value` | number | Yes | >= 0 | Asset value in specified currency |
| `currency` | string | No | 3 chars | ISO currency code (default: USD) |
| `acquisitionDate` | string | Yes | ISO date | Date asset was acquired |
| `notes` | string | No | Max 1000 chars | Optional notes |
| `metadata` | string | No | Valid JSON | Encrypted category-specific data |
| `isPassiveInvestment` | boolean | No | - | Apply 30% rule (default: false) |
| `isRestrictedAccount` | boolean | No | - | Mark as inaccessible (default: false) |

### Response

**Success** (201 Created):
```json
{
  "success": true,
  "asset": {
    "id": "clx123456789",
    "userId": "user_abc123",
    "category": "Stock",
    "name": "Apple Inc. (AAPL)",
    "value": 10000.00,
    "currency": "USD",
    "acquisitionDate": "2024-01-15T00:00:00.000Z",
    "notes": "Long-term investment portfolio",
    "metadata": null,
    "isActive": true,
    "calculationModifier": 0.30,
    "isPassiveInvestment": true,
    "isRestrictedAccount": false,
    "createdAt": "2025-12-12T10:30:00.000Z",
    "updatedAt": "2025-12-12T10:30:00.000Z"
  },
  "zakatInfo": {
    "zakatableAmount": 3000.00,
    "zakatOwed": 75.00,
    "modifierApplied": "passive"
  }
}
```

**Error** (400 Bad Request - Invalid modifier for asset type):
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Passive investment flag can only be set for Stock, ETF, Mutual Fund, or Roth IRA",
  "details": [
    {
      "field": "isPassiveInvestment",
      "issue": "Invalid for this asset type"
    }
  ]
}
```

**Error** (400 Bad Request - Conflicting modifiers):
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Asset cannot be both passive investment and restricted account",
  "details": [
    {
      "field": "isPassiveInvestment",
      "issue": "Cannot be true when isRestrictedAccount is true"
    }
  ]
}
```

---

## GET /api/assets

Retrieve all assets for the authenticated user.

### Request

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `includeInactive` | boolean | No | false | Include inactive assets |
| `category` | string | No | - | Filter by category |
| `modifierType` | string | No | - | Filter by modifier: 'passive', 'restricted', 'full' |

**Example**:
```http
GET /api/assets?modifierType=passive
```

### Response

**Success** (200 OK):
```json
{
  "success": true,
  "assets": [
    {
      "id": "clx123456789",
      "userId": "user_abc123",
      "category": "Stock",
      "name": "Apple Inc. (AAPL)",
      "value": 10000.00,
      "currency": "USD",
      "acquisitionDate": "2024-01-15T00:00:00.000Z",
      "notes": "Long-term investment portfolio",
      "metadata": null,
      "isActive": true,
      "calculationModifier": 0.30,
      "isPassiveInvestment": true,
      "isRestrictedAccount": false,
      "createdAt": "2025-12-12T10:30:00.000Z",
      "updatedAt": "2025-12-12T10:30:00.000Z"
    },
    {
      "id": "clx987654321",
      "userId": "user_abc123",
      "category": "401k",
      "name": "Employer 401k Plan",
      "value": 150000.00,
      "currency": "USD",
      "acquisitionDate": "2020-03-01T00:00:00.000Z",
      "notes": "Retirement account",
      "metadata": null,
      "isActive": true,
      "calculationModifier": 0.00,
      "isPassiveInvestment": false,
      "isRestrictedAccount": true,
      "createdAt": "2025-12-12T10:35:00.000Z",
      "updatedAt": "2025-12-12T10:35:00.000Z"
    }
  ],
  "count": 2
}
```

---

## GET /api/assets/:id

Retrieve a specific asset by ID.

### Request

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters**:
- `:id` - Asset ID (string)

**Example**:
```http
GET /api/assets/clx123456789
```

### Response

**Success** (200 OK):
```json
{
  "success": true,
  "asset": {
    "id": "clx123456789",
    "userId": "user_abc123",
    "category": "Stock",
    "name": "Apple Inc. (AAPL)",
    "value": 10000.00,
    "currency": "USD",
    "acquisitionDate": "2024-01-15T00:00:00.000Z",
    "notes": "Long-term investment portfolio",
    "metadata": null,
    "isActive": true,
    "calculationModifier": 0.30,
    "isPassiveInvestment": true,
    "isRestrictedAccount": false,
    "createdAt": "2025-12-12T10:30:00.000Z",
    "updatedAt": "2025-12-12T10:30:00.000Z"
  },
  "zakatInfo": {
    "zakatableAmount": 3000.00,
    "zakatOwed": 75.00,
    "modifierApplied": "passive"
  }
}
```

**Error** (404 Not Found):
```json
{
  "success": false,
  "error": "ASSET_NOT_FOUND",
  "message": "Asset not found or you don't have permission to access it"
}
```

---

## PUT /api/assets/:id

Update an existing asset, including modifier flags.

### Request

**Headers**:
```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters**:
- `:id` - Asset ID (string)

**Body** (all fields optional):
```json
{
  "name": "Apple Inc. (AAPL) - Updated",
  "value": 12000.00,
  "notes": "Increased position",
  "isPassiveInvestment": false,
  "isRestrictedAccount": false
}
```

### Response

**Success** (200 OK):
```json
{
  "success": true,
  "asset": {
    "id": "clx123456789",
    "userId": "user_abc123",
    "category": "Stock",
    "name": "Apple Inc. (AAPL) - Updated",
    "value": 12000.00,
    "currency": "USD",
    "acquisitionDate": "2024-01-15T00:00:00.000Z",
    "notes": "Increased position",
    "metadata": null,
    "isActive": true,
    "calculationModifier": 1.00,
    "isPassiveInvestment": false,
    "isRestrictedAccount": false,
    "createdAt": "2025-12-12T10:30:00.000Z",
    "updatedAt": "2025-12-12T11:00:00.000Z"
  },
  "zakatInfo": {
    "zakatableAmount": 12000.00,
    "zakatOwed": 300.00,
    "modifierApplied": "full"
  }
}
```

**Note**: When modifier flags are updated, `calculationModifier` is automatically recalculated by the server using `determineModifier()` function.

---

## DELETE /api/assets/:id

Soft delete an asset (sets `isActive` to false).

### Request

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters**:
- `:id` - Asset ID (string)

### Response

**Success** (200 OK):
```json
{
  "success": true,
  "message": "Asset deleted successfully"
}
```

**Error** (404 Not Found):
```json
{
  "success": false,
  "error": "ASSET_NOT_FOUND",
  "message": "Asset not found or you don't have permission to delete it"
}
```

---

## GET /api/zakat/calculate

Calculate total Zakat for all active assets, applying modifiers.

### Request

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `targetDate` | string | No | Current date | Calculate as of specific date (ISO format) |
| `includeLiabilities` | boolean | No | true | Deduct liabilities from total |

**Example**:
```http
GET /api/zakat/calculate?targetDate=2025-01-01
```

### Response

**Success** (200 OK):
```json
{
  "success": true,
  "calculation": {
    "targetDate": "2025-01-01T00:00:00.000Z",
    "nisabThreshold": {
      "gold": 5234.50,
      "silver": 367.23
    },
    "assets": [
      {
        "id": "clx123456789",
        "name": "Apple Inc. (AAPL)",
        "category": "Stock",
        "value": 10000.00,
        "currency": "USD",
        "calculationModifier": 0.30,
        "modifierApplied": "passive",
        "zakatableAmount": 3000.00,
        "zakatOwed": 75.00
      },
      {
        "id": "clx987654321",
        "name": "Employer 401k Plan",
        "category": "401k",
        "value": 150000.00,
        "currency": "USD",
        "calculationModifier": 0.00,
        "modifierApplied": "restricted",
        "zakatableAmount": 0.00,
        "zakatOwed": 0.00
      },
      {
        "id": "clx555555555",
        "name": "Checking Account",
        "category": "Cash",
        "value": 5000.00,
        "currency": "USD",
        "calculationModifier": 1.00,
        "modifierApplied": "full",
        "zakatableAmount": 5000.00,
        "zakatOwed": 125.00
      }
    ],
    "totals": {
      "totalAssetValue": 165000.00,
      "totalZakatableAmount": 8000.00,
      "totalLiabilities": 2000.00,
      "netZakatableWealth": 6000.00,
      "totalZakatOwed": 150.00,
      "aboveNisab": true,
      "zakatDue": true
    },
    "breakdown": {
      "fullModifierAssets": {
        "count": 1,
        "totalValue": 5000.00,
        "zakatableAmount": 5000.00,
        "zakatOwed": 125.00
      },
      "passiveModifierAssets": {
        "count": 1,
        "totalValue": 10000.00,
        "zakatableAmount": 3000.00,
        "zakatOwed": 75.00
      },
      "restrictedModifierAssets": {
        "count": 1,
        "totalValue": 150000.00,
        "zakatableAmount": 0.00,
        "zakatOwed": 0.00
      }
    }
  }
}
```

**Field Explanations**:

- `zakatableAmount`: Asset value × calculationModifier
- `zakatOwed`: zakatableAmount × 0.025 (2.5%)
- `modifierApplied`: 'full' (1.0), 'passive' (0.3), or 'restricted' (0.0)
- `breakdown`: Summary grouped by modifier type

---

## POST /api/snapshots

Create a yearly snapshot, preserving current asset modifiers.

### Request

**Headers**:
```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

**Body**:
```json
{
  "snapshotDate": "2025-01-01",
  "notes": "Yearly Zakat snapshot 2025"
}
```

### Response

**Success** (201 Created):
```json
{
  "success": true,
  "snapshot": {
    "id": "snap_123456",
    "userId": "user_abc123",
    "snapshotDate": "2025-01-01T00:00:00.000Z",
    "notes": "Yearly Zakat snapshot 2025",
    "totalZakat": 150.00,
    "createdAt": "2025-12-12T12:00:00.000Z",
    "assetSnapshots": [
      {
        "id": "snapasset_111",
        "assetId": "clx123456789",
        "category": "Stock",
        "name": "Apple Inc. (AAPL)",
        "value": 10000.00,
        "currency": "USD",
        "calculationModifier": 0.30,
        "isPassiveInvestment": true,
        "isRestrictedAccount": false
      },
      {
        "id": "snapasset_222",
        "assetId": "clx987654321",
        "category": "401k",
        "name": "Employer 401k Plan",
        "value": 150000.00,
        "currency": "USD",
        "calculationModifier": 0.00,
        "isPassiveInvestment": false,
        "isRestrictedAccount": true
      }
    ],
    "assetCount": 2
  }
}
```

**Note**: Snapshots capture modifier values as they exist at snapshot creation time, ensuring historical accuracy.

---

## Error Responses

### Standard Error Format

All error responses follow this structure:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": [
    {
      "field": "fieldName",
      "issue": "Specific validation issue"
    }
  ]
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token |
| `FORBIDDEN` | 403 | User doesn't own this resource |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `ASSET_NOT_FOUND` | 404 | Asset doesn't exist or user doesn't have access |
| `INVALID_MODIFIER` | 400 | Invalid modifier configuration for asset type |
| `CONFLICTING_MODIFIERS` | 400 | Cannot be both passive and restricted |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Rate Limiting

All endpoints are rate-limited to prevent abuse:

- **Authenticated requests**: 100 requests per minute per user
- **Create/Update operations**: 20 requests per minute per user

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1702389600
```

**Error Response** (429 Too Many Requests):
```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

---

## Versioning

API version is included in the base URL path (future-proofing):

```
Current: /api/assets (v1, implicit)
Future: /api/v2/assets
```

Breaking changes will be introduced in new versions. V1 will be maintained for backward compatibility.

---

## Testing Scenarios

### Happy Path
1. Create Stock with `isPassiveInvestment: true` → Get 0.30 modifier
2. Create 401k with `isRestrictedAccount: true` → Get 0.00 modifier
3. Create Cash (no modifiers) → Get 1.00 modifier
4. Calculate Zakat → Verify correct totals with modifiers applied

### Error Cases
1. Create Cash with `isPassiveInvestment: true` → 400 error
2. Create Stock with both modifiers true → 400 error
3. Update asset to invalid modifier combination → 400 error
4. Request asset belonging to different user → 404 error

### Edge Cases
1. Update Stock from passive to full → Modifier recalculates to 1.0
2. Create snapshot → Verify modifiers preserved in snapshot
3. Query assets with `modifierType=passive` → Only passive assets returned
4. Historical snapshot with NULL modifiers → Treated as defaults

---

## Changelog

### Version 1.1.0 (This Feature)
- Added `calculationModifier`, `isPassiveInvestment`, `isRestrictedAccount` to Asset model
- Added modifier information to Zakat calculation response
- Added `modifierType` query parameter to GET /api/assets
- Added modifier breakdown to GET /api/zakat/calculate response
- Added modifier preservation to POST /api/snapshots

### Version 1.0.0 (Existing)
- Base asset CRUD operations
- Zakat calculation
- Snapshot creation

---

## Security Considerations

1. **Authorization**: All endpoints verify asset ownership before operations
2. **Validation**: Server-side validation of all modifier combinations
3. **Audit Trail**: Asset updates logged with modifier changes
4. **Input Sanitization**: All inputs validated and sanitized
5. **Rate Limiting**: Prevents abuse and brute-force attacks

**Sensitive Data Handling**:
- Asset values encrypted at rest (existing mechanism)
- Modifier flags stored unencrypted (not sensitive, needed for calculations)
- JWT tokens required for all operations
- No modifier data exposed in logs
