# API Documentation: Calculations

## Overview

The Calculations API provides endpoints for managing Zakat calculation history, including saving calculations, retrieving past calculations, and performing analysis operations.

**Base URL**: `/api/calculations`  
**Authentication**: Required (JWT Bearer token)  
**Content-Type**: `application/json`

---

## Endpoints

### POST /api/calculations

Save a new Zakat calculation to history.

**Authentication**: Required  
**Rate Limiting**: 10 requests per minute per user

#### Request Body

```json
{
  "methodology": "standard",
  "calendarType": "gregorian", 
  "totalWealth": 15000.00,
  "nisabThreshold": 4340.00,
  "zakatDue": 375.00,
  "zakatRate": 2.5,
  "assetBreakdown": {
    "cash": 5000.00,
    "gold": 8000.00,
    "silver": 2000.00
  },
  "notes": "Annual calculation for 2024",
  "metadata": {
    "goldPrice": 1950.00,
    "silverPrice": 24.50
  }
}
```

#### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `methodology` | `enum` | ✅ | Calculation methodology: `standard`, `hanafi`, `shafi`, `custom` |
| `calendarType` | `enum` | ✅ | Calendar system: `hijri`, `gregorian` |
| `totalWealth` | `number` | ✅ | Total wealth amount (≥ 0) |
| `nisabThreshold` | `number` | ✅ | Nisab threshold amount (≥ 0) |
| `zakatDue` | `number` | ✅ | Calculated Zakat amount (≥ 0) |
| `zakatRate` | `number` | ❌ | Zakat rate percentage (0-100, default: 2.5) |
| `assetBreakdown` | `object` | ✅ | Asset breakdown by category |
| `notes` | `string` | ❌ | Optional calculation notes |
| `metadata` | `object` | ❌ | Additional metadata (prices, rates, etc.) |

#### Response

**Success (201 Created)**
```json
{
  "success": true,
  "calculation": {
    "id": "calc_abc123",
    "methodology": "standard",
    "calendarType": "gregorian",
    "calculationDate": "2024-12-14T10:30:00Z",
    "totalWealth": 15000.00,
    "nisabThreshold": 4340.00,
    "zakatDue": 375.00,
    "zakatRate": 2.5,
    "assetBreakdown": {
      "cash": 5000.00,
      "gold": 8000.00,
      "silver": 2000.00
    },
    "notes": "Annual calculation for 2024",
    "metadata": {
      "goldPrice": 1950.00,
      "silverPrice": 24.50
    },
    "createdAt": "2024-12-14T10:30:00Z",
    "updatedAt": "2024-12-14T10:30:00Z"
  }
}
```

**Error (400 Bad Request)**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "details": [
    {
      "code": "invalid_enum_value",
      "expected": ["standard", "hanafi", "shafi", "custom"],
      "received": "invalid_method",
      "path": ["methodology"]
    }
  ]
}
```

---

### GET /api/calculations

Retrieve calculation history with filtering and pagination.

**Authentication**: Required

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `methodology` | `enum` | ❌ | Filter by methodology: `standard`, `hanafi`, `shafi`, `custom` |
| `startDate` | `datetime` | ❌ | Filter calculations from this date (ISO 8601) |
| `endDate` | `datetime` | ❌ | Filter calculations until this date (ISO 8601) |
| `page` | `number` | ❌ | Page number (default: 1) |
| `limit` | `number` | ❌ | Items per page (default: 10, max: 100) |
| `sortBy` | `enum` | ❌ | Sort field: `calculationDate`, `totalWealth`, `zakatDue` |
| `sortOrder` | `enum` | ❌ | Sort order: `asc`, `desc` (default: `desc`) |

#### Example Request

```
GET /api/calculations?methodology=standard&startDate=2024-01-01T00:00:00Z&page=1&limit=20&sortBy=calculationDate&sortOrder=desc
```

#### Response

**Success (200 OK)**
```json
{
  "success": true,
  "calculations": [
    {
      "id": "calc_abc123",
      "methodology": "standard",
      "calendarType": "gregorian",
      "calculationDate": "2024-12-14T10:30:00Z",
      "totalWealth": 15000.00,
      "nisabThreshold": 4340.00,
      "zakatDue": 375.00,
      "zakatRate": 2.5,
      "notes": "Annual calculation for 2024",
      "createdAt": "2024-12-14T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### GET /api/calculations/:id

Retrieve a specific calculation by ID.

**Authentication**: Required

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | ✅ | Calculation ID |

#### Response

**Success (200 OK)**
```json
{
  "success": true,
  "calculation": {
    "id": "calc_abc123",
    "methodology": "standard",
    "calendarType": "gregorian", 
    "calculationDate": "2024-12-14T10:30:00Z",
    "totalWealth": 15000.00,
    "nisabThreshold": 4340.00,
    "zakatDue": 375.00,
    "zakatRate": 2.5,
    "assetBreakdown": {
      "cash": 5000.00,
      "gold": 8000.00,
      "silver": 2000.00
    },
    "notes": "Annual calculation for 2024",
    "metadata": {
      "goldPrice": 1950.00,
      "silverPrice": 24.50
    },
    "createdAt": "2024-12-14T10:30:00Z",
    "updatedAt": "2024-12-14T10:30:00Z"
  }
}
```

**Error (404 Not Found)**
```json
{
  "success": false,
  "error": "CALCULATION_NOT_FOUND",
  "message": "Calculation not found"
}
```

---

### DELETE /api/calculations/:id

Delete a specific calculation.

**Authentication**: Required

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | ✅ | Calculation ID |

#### Response

**Success (200 OK)**
```json
{
  "success": true,
  "message": "Calculation deleted successfully"
}
```

---

### POST /api/calculations/compare

Compare multiple calculations.

**Authentication**: Required

#### Request Body

```json
{
  "calculationIds": ["calc_abc123", "calc_def456"],
  "comparisonType": "trend"
}
```

#### Response

**Success (200 OK)**
```json
{
  "success": true,
  "comparison": {
    "type": "trend",
    "calculations": [
      {
        "id": "calc_abc123",
        "calculationDate": "2024-01-01T00:00:00Z",
        "totalWealth": 15000.00,
        "zakatDue": 375.00
      },
      {
        "id": "calc_def456", 
        "calculationDate": "2024-12-01T00:00:00Z",
        "totalWealth": 18000.00,
        "zakatDue": 450.00
      }
    ],
    "trends": {
      "wealthGrowth": 20.0,
      "zakatIncrease": 20.0,
      "period": "11 months"
    }
  }
}
```

---

### GET /api/calculations/statistics

Get calculation statistics and trends.

**Authentication**: Required

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | `enum` | ❌ | Time period: `month`, `quarter`, `year` (default: `year`) |
| `methodology` | `enum` | ❌ | Filter by methodology |

#### Response

**Success (200 OK)**
```json
{
  "success": true,
  "statistics": {
    "totalCalculations": 24,
    "averageZakat": 425.50,
    "totalZakatPaid": 10212.00,
    "wealthTrend": "increasing",
    "methodologyDistribution": {
      "standard": 18,
      "hanafi": 4,
      "shafi": 2,
      "custom": 0
    },
    "monthlyTrends": [
      {
        "month": "2024-01",
        "calculations": 2,
        "averageWealth": 14500.00,
        "totalZakat": 362.50
      }
    ]
  }
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "details": [] // Optional array with validation details
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Authentication required |
| `CALCULATION_NOT_FOUND` | 404 | Calculation doesn't exist |
| `PERMISSION_DENIED` | 403 | User doesn't own the calculation |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Authentication

All endpoints require a valid JWT access token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

The token must be obtained through the `/api/auth/login` endpoint and refreshed using `/api/auth/refresh-token` when expired.

---

## Rate Limiting

- **General endpoints**: 100 requests per hour per user
- **Save calculation**: 10 requests per minute per user
- **Bulk operations**: 5 requests per minute per user

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

---

## Examples

### Save a Standard Methodology Calculation

```bash
curl -X POST /api/calculations \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "methodology": "standard",
    "calendarType": "gregorian",
    "totalWealth": 15000.00,
    "nisabThreshold": 4340.00,
    "zakatDue": 375.00,
    "assetBreakdown": {
      "cash": 5000.00,
      "gold": 8000.00,
      "silver": 2000.00
    }
  }'
```

### Get Recent Calculations

```bash
curl -X GET "/api/calculations?limit=10&sortBy=calculationDate&sortOrder=desc" \
  -H "Authorization: Bearer your_token"
```

### Compare Two Calculations

```bash
curl -X POST /api/calculations/compare \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "calculationIds": ["calc_abc123", "calc_def456"],
    "comparisonType": "trend"
  }'
```