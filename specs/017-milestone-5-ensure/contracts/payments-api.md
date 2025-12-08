# API Contract: Payments Endpoints

**Feature**: 017-milestone-5-ensure  
**Base URL**: `/api/v1/payments`  
**Authentication**: Required (JWT Bearer token)

---

## POST /payments

Creates a new payment record linked to a Nisab Year Record.

### Request

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body**:
```json
{
  "nisabYearRecordId": "clx123abc",
  "amount": 100.00,
  "currency": "USD",
  "paymentDate": "2024-09-15T10:30:00Z",
  "recipient": "Local Mosque Charity Fund",
  "recipientType": "charity",
  "category": "poor",
  "paymentMethod": "bank_transfer",
  "receiptNumber": "RCP-2024-09-001",
  "notes": "Monthly Zakat payment"
}
```

**Field Descriptions**:
- `nisabYearRecordId` (required): ID of the Nisab Year Record to link payment to
- `amount` (required): Payment amount (positive decimal)
- `currency` (optional): ISO currency code (default: user's preferred currency)
- `paymentDate` (required): ISO 8601 datetime of payment
- `recipient` (required): Name of recipient (individual/organization)
- `recipientType` (required): `individual` | `organization` | `charity`
- `category` (required): One of 8 Islamic categories (see below)
- `paymentMethod` (required): `cash` | `bank_transfer` | `check` | `online` | `other`
- `receiptNumber` (optional): Reference number for receipt
- `notes` (optional): Additional notes (encrypted)

**Valid Categories**:
- `poor` - The poor (al-Fuqara)
- `needy` - The needy (al-Masakin)
- `collectors` - Zakat collectors
- `hearts_reconciled` - Those whose hearts are to be reconciled
- `widows` - Widows
- `orphans` - Orphans
- `divorced` - Divorced women
- `refugees` - Refugees/wayfarers

### Response

**Status**: `201 Created`

**Body**:
```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "data": {
    "id": "pay789xyz",
    "userId": "user456",
    "nisabYearRecordId": "clx123abc",
    "amount": 100.00,
    "currency": "USD",
    "paymentDate": "2024-09-15T10:30:00Z",
    "recipient": "Local Mosque Charity Fund",
    "recipientType": "charity",
    "category": "poor",
    "paymentMethod": "bank_transfer",
    "receiptNumber": "RCP-2024-09-001",
    "islamicYear": "1446",
    "notes": "Monthly Zakat payment",
    "createdAt": "2024-09-15T10:35:00Z",
    "updatedAt": "2024-09-15T10:35:00Z",
    "nisabYearRecord": {
      "id": "clx123abc",
      "hawlStartDate": "2024-06-15T00:00:00Z",
      "hawlEndDate": "2025-06-14T23:59:59Z",
      "zakatDue": 375.00,
      "zakatPaid": 200.00,
      "outstandingBalance": 75.00
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation errors
  ```json
  {
    "success": false,
    "error": "VALIDATION_ERROR",
    "message": "Invalid payment data",
    "details": [
      {
        "field": "amount",
        "message": "Amount must be positive"
      },
      {
        "field": "category",
        "message": "Invalid category. Must be one of: poor, needy, ..."
      }
    ]
  }
  ```
- `401 Unauthorized`: Missing or invalid JWT token
- `404 Not Found`: Nisab Year Record not found or doesn't belong to user
  ```json
  {
    "success": false,
    "error": "NOT_FOUND",
    "message": "Nisab Year Record not found"
  }
  ```
- `409 Conflict`: Nisab Year Record is locked
  ```json
  {
    "success": false,
    "error": "LOCKED_RECORD",
    "message": "Cannot add payment to locked Nisab Year Record"
  }
  ```
- `500 Internal Server Error`: Server error

---

## GET /payments

Gets list of all payment records with optional filtering.

### Request

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `nisabYearRecordId` (optional): Filter by specific Nisab Year Record
- `startDate` (optional, ISO 8601): Filter payments after this date
- `endDate` (optional, ISO 8601): Filter payments before this date
- `category` (optional): Filter by Islamic category
- `paymentMethod` (optional): Filter by payment method
- `page` (optional, number): Page number (default: 1)
- `limit` (optional, number): Records per page (default: 50, max: 100)
- `sortBy` (optional): `paymentDate` | `amount` | `createdAt` (default: `paymentDate`)
- `sortOrder` (optional): `asc` | `desc` (default: `desc`)

**Example**:
```
GET /api/v1/payments?nisabYearRecordId=clx123abc&page=1&limit=20
```

### Response

**Status**: `200 OK`

**Body**:
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "pay789xyz",
        "amount": 100.00,
        "currency": "USD",
        "paymentDate": "2024-09-15T10:30:00Z",
        "recipient": "Local Mosque Charity Fund",
        "recipientType": "charity",
        "category": "poor",
        "paymentMethod": "bank_transfer",
        "receiptNumber": "RCP-2024-09-001",
        "islamicYear": "1446",
        "notes": "Monthly Zakat payment",
        "createdAt": "2024-09-15T10:35:00Z",
        "nisabYearRecord": {
          "id": "clx123abc",
          "hawlStartDate": "2024-06-15T00:00:00Z",
          "hawlEndDate": "2025-06-14T23:59:59Z",
          "islamicYear": "1446"
        }
      }
      // ... more payments
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 87,
      "limit": 20,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "summary": {
      "totalAmount": 8700.00,
      "currency": "USD",
      "paymentCount": 87
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `400 Bad Request`: Invalid query parameters
- `500 Internal Server Error`: Server error

---

## GET /payments/:id

Gets a single payment record by ID.

### Request

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Path Parameters**:
- `id`: Payment record ID

**Example**:
```
GET /api/v1/payments/pay789xyz
```

### Response

**Status**: `200 OK`

**Body**:
```json
{
  "success": true,
  "data": {
    "id": "pay789xyz",
    "userId": "user456",
    "nisabYearRecordId": "clx123abc",
    "amount": 100.00,
    "currency": "USD",
    "paymentDate": "2024-09-15T10:30:00Z",
    "recipient": "Local Mosque Charity Fund",
    "recipientType": "charity",
    "category": "poor",
    "paymentMethod": "bank_transfer",
    "receiptNumber": "RCP-2024-09-001",
    "islamicYear": "1446",
    "notes": "Monthly Zakat payment",
    "createdAt": "2024-09-15T10:35:00Z",
    "updatedAt": "2024-09-15T10:35:00Z",
    "nisabYearRecord": {
      "id": "clx123abc",
      "hawlStartDate": "2024-06-15T00:00:00Z",
      "hawlEndDate": "2025-06-14T23:59:59Z",
      "zakatDue": 375.00,
      "zakatPaid": 200.00,
      "outstandingBalance": 75.00,
      "islamicYear": "1446"
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `404 Not Found`: Payment not found or doesn't belong to user
- `500 Internal Server Error`: Server error

---

## PUT /payments/:id

Updates an existing payment record.

### Request

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Path Parameters**:
- `id`: Payment record ID

**Body** (all fields optional):
```json
{
  "amount": 150.00,
  "paymentDate": "2024-09-15T11:00:00Z",
  "recipient": "Updated Recipient Name",
  "recipientType": "individual",
  "category": "needy",
  "paymentMethod": "cash",
  "receiptNumber": "RCP-2024-09-002",
  "notes": "Updated notes"
}
```

**Note**: Cannot change `nisabYearRecordId` after creation. To move payment to different Nisab Year, delete and recreate.

### Response

**Status**: `200 OK`

**Body**:
```json
{
  "success": true,
  "message": "Payment updated successfully",
  "data": {
    // Updated payment object (same structure as POST response)
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Missing or invalid JWT token
- `404 Not Found`: Payment not found or doesn't belong to user
- `409 Conflict`: Nisab Year Record is locked
- `500 Internal Server Error`: Server error

---

## DELETE /payments/:id

Deletes a payment record.

### Request

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Path Parameters**:
- `id`: Payment record ID

**Example**:
```
DELETE /api/v1/payments/pay789xyz
```

### Response

**Status**: `200 OK`

**Body**:
```json
{
  "success": true,
  "message": "Payment deleted successfully",
  "data": {
    "id": "pay789xyz",
    "deletedAt": "2024-12-07T10:30:00Z",
    "nisabYearRecordUpdated": {
      "id": "clx123abc",
      "zakatPaid": 100.00,
      "outstandingBalance": 275.00
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `404 Not Found`: Payment not found or doesn't belong to user
- `409 Conflict`: Nisab Year Record is locked
- `500 Internal Server Error`: Server error

---

## GET /payments/categories

Gets list of valid Islamic categories for payments.

### Request

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Example**:
```
GET /api/v1/payments/categories
```

### Response

**Status**: `200 OK`

**Body**:
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "value": "poor",
        "label": "The Poor (al-Fuqara)",
        "description": "Those who have little to no wealth",
        "islamicReference": "Quran 9:60"
      },
      {
        "value": "needy",
        "label": "The Needy (al-Masakin)",
        "description": "Those in difficult circumstances",
        "islamicReference": "Quran 9:60"
      },
      {
        "value": "collectors",
        "label": "Zakat Collectors (al-Amilin)",
        "description": "Those employed to collect Zakat",
        "islamicReference": "Quran 9:60"
      },
      {
        "value": "hearts_reconciled",
        "label": "Those Whose Hearts Are to Be Reconciled",
        "description": "New Muslims or those close to Islam",
        "islamicReference": "Quran 9:60"
      },
      {
        "value": "widows",
        "label": "Widows",
        "description": "Women who have lost their husbands",
        "islamicReference": "Islamic jurisprudence"
      },
      {
        "value": "orphans",
        "label": "Orphans",
        "description": "Children who have lost parents",
        "islamicReference": "Islamic jurisprudence"
      },
      {
        "value": "divorced",
        "label": "Divorced Women",
        "description": "Women in need after divorce",
        "islamicReference": "Islamic jurisprudence"
      },
      {
        "value": "refugees",
        "label": "Refugees/Wayfarers (Ibn al-Sabil)",
        "description": "Travelers or displaced people in need",
        "islamicReference": "Quran 9:60"
      }
    ]
  }
}
```

---

## GET /payments/summary

Gets payment summary statistics.

### Request

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `startDate` (optional, ISO 8601): Start of period (default: all time)
- `endDate` (optional, ISO 8601): End of period (default: now)
- `nisabYearRecordId` (optional): Filter by specific Nisab Year

**Example**:
```
GET /api/v1/payments/summary?startDate=2024-01-01
```

### Response

**Status**: `200 OK`

**Body**:
```json
{
  "success": true,
  "data": {
    "periodStart": "2024-01-01T00:00:00Z",
    "periodEnd": "2024-12-31T23:59:59Z",
    "totalAmount": 1500.00,
    "currency": "USD",
    "paymentCount": 15,
    "averagePayment": 100.00,
    "byCategory": {
      "poor": { "amount": 750.00, "count": 8 },
      "orphans": { "amount": 500.00, "count": 5 },
      "refugees": { "amount": 250.00, "count": 2 }
    },
    "byMethod": {
      "bank_transfer": { "amount": 1000.00, "count": 10 },
      "cash": { "amount": 500.00, "count": 5 }
    },
    "byRecipientType": {
      "charity": { "amount": 1200.00, "count": 12 },
      "individual": { "amount": 300.00, "count": 3 }
    },
    "byIslamicYear": {
      "1445": { "amount": 700.00, "count": 7 },
      "1446": { "amount": 800.00, "count": 8 }
    },
    "recentPayments": [
      // Last 5 payments (same structure as list endpoint)
    ]
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `400 Bad Request`: Invalid query parameters
- `500 Internal Server Error`: Server error

---

## Notes

### Data Integrity
- On payment creation: Nisab Year's `zakatPaid` and `outstandingBalance` automatically updated
- On payment update (amount change): Nisab Year recalculated
- On payment deletion: Nisab Year's `zakatPaid` decreased, `outstandingBalance` increased

### Encryption
All sensitive fields encrypted at rest:
- `amount`
- `recipient`
- `notes`

Decryption happens server-side before API response.

### Validation Rules
1. `amount` must be positive
2. `nisabYearRecordId` must exist and belong to user
3. `paymentDate` should be within reasonable range (warning if outside Hawl period)
4. `category` must be one of 8 valid categories
5. If payment causes overpayment (zakatPaid > zakatDue), allow but return warning

### Audit Trail
All payment modifications logged in Feature 008 audit trail system (if extended to payments).

### Cache Invalidation
Payment CRUD operations invalidate:
- Analytics metrics cache
- Nisab Year Record summary cache
- Payment summary cache

### Terminology
All API responses use "Nisab Year Record" terminology. Backend `YearlySnapshot` model never exposed.

### Islamic Year Calculation
`islamicYear` automatically calculated from `paymentDate` using Hijri calendar conversion. Cannot be manually set.
