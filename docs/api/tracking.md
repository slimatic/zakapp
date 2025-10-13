# Tracking API Documentation

**Version:** 1.0  
**Base URL:** `/api/v1/tracking`  
**Authentication:** Required (JWT Bearer Token)

---

## Overview

The Tracking API provides endpoints for managing yearly Zakat snapshots, recording payments, comparing multi-year data, and accessing analytics. All endpoints require authentication and encrypt sensitive financial data.

### Core Features

- **Yearly Snapshots:** Create, retrieve, update, delete, and finalize annual Zakat snapshots
- **Payment Tracking:** Record and manage Zakat payments with recipient categorization
- **Multi-Year Comparison:** Compare snapshots across multiple years with trend analysis
- **Analytics:** Retrieve aggregated data, insights, and visualizations
- **Data Export:** Export snapshots and summaries to PDF format

---

## Authentication

All tracking endpoints require JWT authentication via the `Authorization` header:

```http
Authorization: Bearer <access_token>
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

---

## Endpoints

### 1. Create Snapshot

Create a new yearly Zakat snapshot with financial data and asset breakdown.

**Endpoint:** `POST /api/v1/tracking/snapshots`

**Request Headers:**
```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "snapshotDate": "2024-01-01T00:00:00Z",
  "snapshotDateHijri": "1446-06-19",
  "totalWealth": 150000.00,
  "totalLiabilities": 20000.00,
  "zakatableWealth": 130000.00,
  "zakatDue": 3250.00,
  "methodology": "standard",
  "nisabThreshold": 85000.00,
  "nisabType": "gold",
  "status": "draft",
  "notes": "Annual Zakat calculation for 2024",
  "assets": {
    "cash": 50000.00,
    "bankAccounts": 40000.00,
    "investments": 30000.00,
    "gold": 20000.00,
    "realEstate": 10000.00
  }
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `snapshotDate` | ISO 8601 DateTime | Yes | Gregorian date of snapshot |
| `snapshotDateHijri` | String (YYYY-MM-DD) | Yes | Hijri date of snapshot |
| `totalWealth` | Decimal | Yes | Total wealth amount (min: 0) |
| `totalLiabilities` | Decimal | Yes | Total liabilities (min: 0) |
| `zakatableWealth` | Decimal | Yes | Zakatable wealth (totalWealth - totalLiabilities) |
| `zakatDue` | Decimal | Yes | Calculated Zakat amount (min: 0) |
| `methodology` | Enum | Yes | Calculation method: `standard`, `hanafi`, `shafii`, `maliki`, `hanbali` |
| `nisabThreshold` | Decimal | Yes | Nisab threshold in user's currency |
| `nisabType` | Enum | Yes | Nisab basis: `gold`, `silver` |
| `status` | Enum | Yes | Snapshot status: `draft`, `finalized` |
| `notes` | String | No | Optional notes (max: 1000 chars) |
| `assets` | Object | No | Asset breakdown by category |

**Success Response (201 Created):**
```json
{
  "success": true,
  "snapshot": {
    "id": "snap_1234567890abcdef",
    "userId": "user_abcdef1234567890",
    "snapshotDate": "2024-01-01T00:00:00Z",
    "snapshotDateHijri": "1446-06-19",
    "totalWealth": 150000.00,
    "totalLiabilities": 20000.00,
    "zakatableWealth": 130000.00,
    "zakatDue": 3250.00,
    "methodology": "standard",
    "nisabThreshold": 85000.00,
    "nisabType": "gold",
    "status": "draft",
    "notes": "Annual Zakat calculation for 2024",
    "assets": { /* encrypted */ },
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z",
    "finalizedAt": null
  }
}
```

**Error Responses:**

**400 Bad Request - Validation Error:**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid snapshot data",
  "details": [
    {
      "field": "totalWealth",
      "message": "Total wealth must be a positive number"
    }
  ]
}
```

**409 Conflict - Duplicate Snapshot:**
```json
{
  "success": false,
  "error": "DUPLICATE_SNAPSHOT",
  "message": "Snapshot already exists for this year"
}
```

---

### 2. Get All Snapshots

Retrieve all snapshots for the authenticated user with optional filtering and pagination.

**Endpoint:** `GET /api/v1/tracking/snapshots`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `status` | Enum | No | All | Filter by status: `draft`, `finalized`, `all` |
| `year` | Integer | No | All | Filter by Gregorian year (e.g., 2024) |
| `page` | Integer | No | 1 | Page number (min: 1) |
| `limit` | Integer | No | 10 | Items per page (min: 1, max: 100) |
| `sortBy` | String | No | `snapshotDate` | Sort field: `snapshotDate`, `createdAt`, `totalWealth` |
| `sortOrder` | Enum | No | `desc` | Sort order: `asc`, `desc` |

**Example Request:**
```http
GET /api/v1/tracking/snapshots?status=finalized&year=2024&page=1&limit=10
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "snapshots": [
    {
      "id": "snap_1234567890abcdef",
      "userId": "user_abcdef1234567890",
      "snapshotDate": "2024-01-01T00:00:00Z",
      "snapshotDateHijri": "1446-06-19",
      "totalWealth": 150000.00,
      "totalLiabilities": 20000.00,
      "zakatableWealth": 130000.00,
      "zakatDue": 3250.00,
      "methodology": "standard",
      "status": "finalized",
      "createdAt": "2024-01-01T12:00:00Z",
      "finalizedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "INVALID_QUERY_PARAMS",
  "message": "Invalid query parameters",
  "details": [
    {
      "field": "year",
      "message": "Year must be a valid 4-digit year"
    }
  ]
}
```

---

### 3. Get Snapshot by ID

Retrieve a specific snapshot by its ID.

**Endpoint:** `GET /api/v1/tracking/snapshots/:id`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String | Yes | Snapshot ID (format: `snap_<16 hex chars>`) |

**Example Request:**
```http
GET /api/v1/tracking/snapshots/snap_1234567890abcdef
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "snapshot": {
    "id": "snap_1234567890abcdef",
    "userId": "user_abcdef1234567890",
    "snapshotDate": "2024-01-01T00:00:00Z",
    "snapshotDateHijri": "1446-06-19",
    "totalWealth": 150000.00,
    "totalLiabilities": 20000.00,
    "zakatableWealth": 130000.00,
    "zakatDue": 3250.00,
    "methodology": "standard",
    "nisabThreshold": 85000.00,
    "nisabType": "gold",
    "status": "finalized",
    "notes": "Annual Zakat calculation for 2024",
    "assets": {
      "cash": 50000.00,
      "bankAccounts": 40000.00,
      "investments": 30000.00,
      "gold": 20000.00,
      "realEstate": 10000.00
    },
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "finalizedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "error": "SNAPSHOT_NOT_FOUND",
  "message": "Snapshot not found"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "FORBIDDEN",
  "message": "You do not have permission to access this snapshot"
}
```

---

### 4. Update Snapshot

Update an existing snapshot. Only draft snapshots can be updated.

**Endpoint:** `PUT /api/v1/tracking/snapshots/:id`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String | Yes | Snapshot ID |

**Request Headers:**
```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "totalWealth": 155000.00,
  "totalLiabilities": 22000.00,
  "zakatableWealth": 133000.00,
  "zakatDue": 3325.00,
  "notes": "Updated with Q4 investments"
}
```

**Note:** All fields are optional. Only provided fields will be updated.

**Success Response (200 OK):**
```json
{
  "success": true,
  "snapshot": {
    "id": "snap_1234567890abcdef",
    "totalWealth": 155000.00,
    "totalLiabilities": 22000.00,
    "zakatableWealth": 133000.00,
    "zakatDue": 3325.00,
    "notes": "Updated with Q4 investments",
    "updatedAt": "2024-01-02T14:20:00Z"
  }
}
```

**Error Responses:**

**400 Bad Request - Finalized Snapshot:**
```json
{
  "success": false,
  "error": "SNAPSHOT_FINALIZED",
  "message": "Cannot update finalized snapshot"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "SNAPSHOT_NOT_FOUND",
  "message": "Snapshot not found"
}
```

---

### 5. Finalize Snapshot

Finalize a snapshot, making it immutable and enabling payment tracking.

**Endpoint:** `POST /api/v1/tracking/snapshots/:id/finalize`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String | Yes | Snapshot ID |

**Request Headers:**
```http
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "snapshot": {
    "id": "snap_1234567890abcdef",
    "status": "finalized",
    "finalizedAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**

**400 Bad Request - Already Finalized:**
```json
{
  "success": false,
  "error": "ALREADY_FINALIZED",
  "message": "Snapshot is already finalized"
}
```

**400 Bad Request - Incomplete Data:**
```json
{
  "success": false,
  "error": "INCOMPLETE_SNAPSHOT",
  "message": "Cannot finalize incomplete snapshot",
  "details": [
    {
      "field": "totalWealth",
      "message": "Total wealth must be greater than 0"
    }
  ]
}
```

---

### 6. Delete Snapshot

Delete a snapshot. Only draft snapshots can be deleted.

**Endpoint:** `DELETE /api/v1/tracking/snapshots/:id`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String | Yes | Snapshot ID |

**Request Headers:**
```http
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Snapshot deleted successfully"
}
```

**Error Responses:**

**400 Bad Request - Finalized Snapshot:**
```json
{
  "success": false,
  "error": "CANNOT_DELETE_FINALIZED",
  "message": "Cannot delete finalized snapshot"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "SNAPSHOT_NOT_FOUND",
  "message": "Snapshot not found"
}
```

---

### 7. Record Payment

Record a Zakat payment for a finalized snapshot.

**Endpoint:** `POST /api/v1/tracking/snapshots/:snapshotId/payments`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `snapshotId` | String | Yes | Snapshot ID |

**Request Headers:**
```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "amount": 1000.00,
  "paymentDate": "2024-02-01T00:00:00Z",
  "paymentDateHijri": "1446-07-21",
  "category": "fakir",
  "recipientType": "individual",
  "recipientName": "Abdullah ibn Umar",
  "receiptReference": "RCP-2024-001",
  "notes": "Monthly Zakat distribution"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | Decimal | Yes | Payment amount (min: 0.01) |
| `paymentDate` | ISO 8601 DateTime | Yes | Gregorian payment date |
| `paymentDateHijri` | String | Yes | Hijri payment date |
| `category` | Enum | Yes | Recipient category (see below) |
| `recipientType` | Enum | Yes | `individual` or `organization` |
| `recipientName` | String | No | Recipient name (max: 255 chars) |
| `receiptReference` | String | No | Receipt/reference number (max: 100 chars) |
| `notes` | String | No | Payment notes (max: 500 chars) |

**Zakat Recipient Categories:**

| Value | Arabic Name | English Translation |
|-------|-------------|---------------------|
| `fakir` | Al-Fuqara | The poor (those with no wealth) |
| `miskin` | Al-Masakin | The needy (those with insufficient wealth) |
| `amil` | Al-Amilin | Zakat administrators |
| `muallaf` | Al-Muallafah Qulubuhum | Those whose hearts are to be reconciled |
| `riqab` | Ar-Riqab | Freeing slaves/captives |
| `gharim` | Al-Gharimin | Those in debt |
| `fisabilillah` | Fi Sabilillah | In the cause of Allah |
| `ibnsabil` | Ibn as-Sabil | Stranded travelers |

**Success Response (201 Created):**
```json
{
  "success": true,
  "payment": {
    "id": "pay_abcdef1234567890",
    "snapshotId": "snap_1234567890abcdef",
    "amount": 1000.00,
    "paymentDate": "2024-02-01T00:00:00Z",
    "paymentDateHijri": "1446-07-21",
    "category": "fakir",
    "categoryDisplay": "Al-Fuqara (The poor)",
    "recipientType": "individual",
    "recipientName": "Abdullah ibn Umar",
    "receiptReference": "RCP-2024-001",
    "notes": "Monthly Zakat distribution",
    "createdAt": "2024-02-01T10:00:00Z"
  }
}
```

**Error Responses:**

**400 Bad Request - Snapshot Not Finalized:**
```json
{
  "success": false,
  "error": "SNAPSHOT_NOT_FINALIZED",
  "message": "Payments can only be recorded for finalized snapshots"
}
```

**400 Bad Request - Payment Exceeds Zakat Due:**
```json
{
  "success": false,
  "error": "PAYMENT_EXCEEDS_ZAKAT",
  "message": "Total payments exceed Zakat due amount",
  "details": {
    "zakatDue": 3250.00,
    "totalPayments": 3000.00,
    "paymentAmount": 1000.00,
    "exceededBy": 750.00
  }
}
```

---

### 8. Get Payments for Snapshot

Retrieve all payments for a specific snapshot.

**Endpoint:** `GET /api/v1/tracking/snapshots/:snapshotId/payments`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `snapshotId` | String | Yes | Snapshot ID |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | Enum | No | All | Filter by recipient category |
| `recipientType` | Enum | No | All | Filter by recipient type |
| `startDate` | ISO 8601 Date | No | All | Filter payments from this date |
| `endDate` | ISO 8601 Date | No | All | Filter payments until this date |
| `page` | Integer | No | 1 | Page number |
| `limit` | Integer | No | 50 | Items per page (max: 100) |

**Example Request:**
```http
GET /api/v1/tracking/snapshots/snap_1234567890abcdef/payments?category=fakir&page=1
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "payments": [
    {
      "id": "pay_abcdef1234567890",
      "snapshotId": "snap_1234567890abcdef",
      "amount": 1000.00,
      "paymentDate": "2024-02-01T00:00:00Z",
      "category": "fakir",
      "categoryDisplay": "Al-Fuqara (The poor)",
      "recipientType": "individual",
      "recipientName": "Abdullah ibn Umar",
      "createdAt": "2024-02-01T10:00:00Z"
    }
  ],
  "summary": {
    "totalPayments": 3000.00,
    "zakatDue": 3250.00,
    "remaining": 250.00,
    "paymentCount": 3,
    "byCategory": {
      "fakir": 1000.00,
      "miskin": 1500.00,
      "fisabilillah": 500.00
    }
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 3,
    "itemsPerPage": 50
  }
}
```

---

### 9. Compare Snapshots

Compare multiple snapshots to analyze trends and insights.

**Endpoint:** `POST /api/v1/tracking/comparison`

**Request Headers:**
```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "snapshotIds": [
    "snap_2022_abcdef",
    "snap_2023_bcdefg",
    "snap_2024_cdefgh"
  ]
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `snapshotIds` | Array<String> | Yes | Array of snapshot IDs (2-5 snapshots) |

**Success Response (200 OK):**
```json
{
  "success": true,
  "comparison": {
    "snapshots": [
      {
        "id": "snap_2022_abcdef",
        "year": 2022,
        "hijriYear": 1444,
        "totalWealth": 100000.00,
        "zakatDue": 2500.00
      },
      {
        "id": "snap_2023_bcdefg",
        "year": 2023,
        "hijriYear": 1445,
        "totalWealth": 125000.00,
        "zakatDue": 3125.00
      },
      {
        "id": "snap_2024_cdefgh",
        "year": 2024,
        "hijriYear": 1446,
        "totalWealth": 150000.00,
        "zakatDue": 3750.00
      }
    ],
    "trends": {
      "wealthGrowth": {
        "totalChange": 50000.00,
        "percentageChange": 50.00,
        "averageYearlyGrowth": 22.47,
        "trend": "increasing"
      },
      "zakatGrowth": {
        "totalChange": 1250.00,
        "percentageChange": 50.00,
        "averageYearlyGrowth": 22.47,
        "trend": "increasing"
      },
      "liabilitiesGrowth": {
        "totalChange": 10000.00,
        "percentageChange": 100.00,
        "trend": "increasing"
      }
    },
    "insights": [
      {
        "type": "positive",
        "title": "Wealth Growth",
        "message": "Your wealth increased by 50% over 2 years"
      },
      {
        "type": "info",
        "title": "Consistent Zakat",
        "message": "Zakat increased proportionally with wealth growth"
      },
      {
        "type": "warning",
        "title": "Liabilities Increased",
        "message": "Liabilities doubled from $10,000 to $20,000"
      }
    ],
    "chartData": [
      {
        "year": "2022",
        "wealth": 100000,
        "zakat": 2500,
        "liabilities": 10000
      },
      {
        "year": "2023",
        "wealth": 125000,
        "zakat": 3125,
        "liabilities": 15000
      },
      {
        "year": "2024",
        "wealth": 150000,
        "zakat": 3750,
        "liabilities": 20000
      }
    ]
  }
}
```

**Error Responses:**

**400 Bad Request - Invalid Snapshot Count:**
```json
{
  "success": false,
  "error": "INVALID_SNAPSHOT_COUNT",
  "message": "Comparison requires 2-5 snapshots"
}
```

**404 Not Found - Snapshot Not Found:**
```json
{
  "success": false,
  "error": "SNAPSHOT_NOT_FOUND",
  "message": "One or more snapshots not found",
  "details": {
    "notFound": ["snap_2025_invalid"]
  }
}
```

---

## Rate Limiting

All tracking endpoints are rate-limited to prevent abuse:

**Limits:**
- **GET requests:** 100 requests per minute per user
- **POST/PUT requests:** 30 requests per minute per user
- **DELETE requests:** 10 requests per minute per user

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704124800
```

**Rate Limit Exceeded Response (429 Too Many Requests):**
```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

---

## Data Encryption

All sensitive financial data is encrypted at rest using AES-256-CBC encryption:

**Encrypted Fields:**
- `totalWealth`
- `totalLiabilities`
- `zakatableWealth`
- `zakatDue`
- `nisabThreshold`
- `assets` (entire object)
- `amount` (in payments)

**Encryption Notes:**
- Data is encrypted before database storage
- Decryption occurs automatically when retrieving data
- Encryption keys are stored securely in environment variables
- Never log encrypted data or encryption keys

---

## Islamic Compliance

All tracking endpoints adhere to Islamic jurisprudence:

### Zakat Calculation Methodologies

**Standard (2.5%):**
- Most commonly used method
- 2.5% of zakatable wealth
- Applicable to cash, gold, silver, trade goods

**Hanafi:**
- Similar to standard but with different nisab calculations
- Silver nisab often used (lower threshold)

**Shafi'i, Maliki, Hanbali:**
- Gold nisab typically used (higher threshold)
- Specific rulings for different asset types

### Nisab Thresholds

**Gold-based:** ~85 grams of gold (~$6,000-$8,000 USD depending on gold price)  
**Silver-based:** ~595 grams of silver (~$500-$700 USD depending on silver price)

The API allows users to select their preferred nisab type and updates thresholds based on current market prices.

### Recipient Categories

All 8 Quranic categories are supported with proper Arabic names and English translations. The API validates that payments are categorized according to Islamic guidelines.

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {} // Optional additional context
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | User lacks permission for resource |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `SNAPSHOT_NOT_FOUND` | 404 | Snapshot does not exist |
| `SNAPSHOT_FINALIZED` | 400 | Cannot modify finalized snapshot |
| `DUPLICATE_SNAPSHOT` | 409 | Snapshot already exists for year |
| `PAYMENT_EXCEEDS_ZAKAT` | 400 | Payment exceeds remaining Zakat |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error (logged for investigation) |

---

## Examples

### Complete Workflow Example

**1. Create Draft Snapshot:**
```bash
curl -X POST http://localhost:3000/api/v1/tracking/snapshots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "snapshotDate": "2024-01-01T00:00:00Z",
    "snapshotDateHijri": "1446-06-19",
    "totalWealth": 150000.00,
    "totalLiabilities": 20000.00,
    "zakatableWealth": 130000.00,
    "zakatDue": 3250.00,
    "methodology": "standard",
    "nisabThreshold": 85000.00,
    "nisabType": "gold",
    "status": "draft"
  }'
```

**2. Update Draft Snapshot:**
```bash
curl -X PUT http://localhost:3000/api/v1/tracking/snapshots/snap_1234567890abcdef \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "totalWealth": 155000.00,
    "zakatableWealth": 133000.00,
    "zakatDue": 3325.00
  }'
```

**3. Finalize Snapshot:**
```bash
curl -X POST http://localhost:3000/api/v1/tracking/snapshots/snap_1234567890abcdef/finalize \
  -H "Authorization: Bearer <token>"
```

**4. Record Payment:**
```bash
curl -X POST http://localhost:3000/api/v1/tracking/snapshots/snap_1234567890abcdef/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "amount": 1000.00,
    "paymentDate": "2024-02-01T00:00:00Z",
    "paymentDateHijri": "1446-07-21",
    "category": "fakir",
    "recipientType": "individual"
  }'
```

**5. Get All Snapshots:**
```bash
curl -X GET "http://localhost:3000/api/v1/tracking/snapshots?status=finalized&year=2024" \
  -H "Authorization: Bearer <token>"
```

**6. Compare Multiple Years:**
```bash
curl -X POST http://localhost:3000/api/v1/tracking/comparison \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "snapshotIds": ["snap_2022_abcdef", "snap_2023_bcdefg", "snap_2024_cdefgh"]
  }'
```

---

## Changelog

**Version 1.0 (October 2025):**
- Initial release with core tracking functionality
- Snapshot CRUD operations
- Payment recording and tracking
- Multi-year comparison
- Islamic compliance features
- Data encryption

---

## Support

For API issues or questions:
- **GitHub Issues:** [zakapp/issues](https://github.com/zakapp/zakapp/issues)
- **Email:** support@zakapp.com
- **Documentation:** [docs.zakapp.com](https://docs.zakapp.com)

---

**Last Updated:** October 2025  
**API Version:** 1.0
