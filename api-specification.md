# zakapp API Specification

This document defines the RESTful API specification for the zakapp backend services.

## Base Configuration

- **Base URL**: `http://localhost:3001/api/v1` (development)
- **Content Type**: `application/json`
- **Authentication**: JWT Bearer tokens
- **Error Format**: Standard HTTP status codes with JSON error responses

## Authentication Endpoints

### POST /auth/register

Register a new user account.

**Request Body:**

```json
{
  "username": "string (3-50 chars)",
  "email": "string (valid email)",
  "password": "string (min 8 chars)",
  "confirmPassword": "string"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "string",
    "username": "string",
    "email": "string"
  }
}
```

### POST /auth/login

Authenticate user and receive access token.

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "userId": "string",
      "username": "string",
      "email": "string"
    },
    "token": "string (JWT)",
    "expiresIn": "number (seconds)"
  }
}
```

### POST /auth/refresh

Refresh authentication token.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "token": "string (JWT)",
    "expiresIn": "number (seconds)"
  }
}
```

### POST /auth/logout

Logout user and invalidate token.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## User Management Endpoints

### GET /users/profile

Get current user profile information.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "userId": "string",
    "username": "string",
    "email": "string",
    "createdAt": "string (ISO date)",
    "lastLogin": "string (ISO date)",
    "preferences": {
      "currency": "string",
      "language": "string",
      "zakatMethod": "string",
      "calendarType": "lunar|solar"
    }
  }
}
```

### PUT /users/profile

Update user profile information.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "email": "string (optional)",
  "preferences": {
    "currency": "string (optional)",
    "language": "string (optional)",
    "zakatMethod": "string (optional)",
    "calendarType": "lunar|solar (optional)"
  }
}
```

### POST /users/change-password

Change user password.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

## Asset Management Endpoints

### GET /assets

Get all user assets.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**

- `category` (optional): Filter by asset category
- `subCategory` (optional): Filter by asset subcategory
- `year` (optional): Filter by year
- `zakatEligible` (optional): Filter by zakat eligibility (true/false)
- `currency` (optional): Filter by currency code
- `search` (optional): Search in asset names and descriptions
- `minValue` (optional): Filter by minimum value
- `maxValue` (optional): Filter by maximum value
- `dateFrom` (optional): Filter by creation date from (ISO date)
- `dateTo` (optional): Filter by creation date to (ISO date)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "assets": [
      {
        "assetId": "string",
        "name": "string",
        "category": "cash|gold|silver|business|property|stocks|crypto|debts",
        "subCategory": "string",
        "value": "number",
        "currency": "string",
        "description": "string",
        "zakatEligible": "boolean",
        "createdAt": "string (ISO date)",
        "updatedAt": "string (ISO date)"
      }
    ],
    "totalValue": "number",
    "totalZakatEligible": "number"
  }
}
```

### POST /assets

Create a new asset.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "name": "string",
  "category": "cash|gold|silver|business|property|stocks|crypto|debts",
  "subCategory": "string",
  "value": "number",
  "currency": "string",
  "description": "string (optional)",
  "zakatEligible": "boolean"
}
```

### PUT /assets/:assetId

Update an existing asset.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "name": "string (optional)",
  "value": "number (optional)",
  "description": "string (optional)",
  "zakatEligible": "boolean (optional)"
}
```

### DELETE /assets/:assetId

Delete an asset.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "success": true,
  "message": "Asset deleted successfully"
}
```

### GET /assets/categories

Get available asset categories and subcategories.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "cash",
        "name": "Cash & Bank Accounts",
        "description": "Liquid cash, savings, checking accounts",
        "subCategories": [
          {
            "id": "savings",
            "name": "Savings Account",
            "zakatRate": 2.5
          }
        ]
      }
    ]
  }
}
```

### GET /assets/:assetId

Get a single asset by ID.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "asset": {
      "assetId": "string",
      "name": "string",
      "category": "cash|gold|silver|business|property|stocks|crypto|debts",
      "subCategory": "string",
      "value": "number",
      "currency": "string",
      "description": "string",
      "zakatEligible": "boolean",
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    }
  }
}
```

**Response (404):**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Asset not found"
  }
}
```

### GET /assets/history

Get history for all user assets.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "history": [
      {
        "historyId": "string",
        "assetId": "string",
        "action": "created|updated|deleted",
        "timestamp": "string (ISO date)",
        "newData": "object",
        "oldData": "object (optional)"
      }
    ]
  }
}
```

### GET /assets/:assetId/history

Get history for a specific asset.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "history": [
      {
        "historyId": "string",
        "assetId": "string",
        "action": "created|updated|deleted",
        "timestamp": "string (ISO date)",
        "newData": "object",
        "oldData": "object (optional)"
      }
    ]
  }
}
```

**Response (404):**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Asset not found"
  }
}
```

### GET /assets/statistics

Get comprehensive asset statistics including category and currency breakdown.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalAssets": "number",
      "totalValue": "number",
      "totalZakatEligible": "number",
      "assetsByCategory": {
        "cash": {
          "count": "number",
          "totalValue": "number",
          "zakatEligibleValue": "number"
        }
      },
      "assetsByCurrency": {
        "USD": {
          "count": "number",
          "totalValue": "number"
        }
      }
    }
  }
}
```

### GET /assets/grouped

Get assets grouped by category.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "groupedAssets": {
      "cash": [
        {
          "assetId": "string",
          "name": "string",
          "category": "cash",
          "subCategory": "string",
          "value": "number",
          "currency": "string",
          "description": "string",
          "zakatEligible": "boolean",
          "createdAt": "string (ISO date)",
          "updatedAt": "string (ISO date)"
        }
      ]
    }
  }
}
```

### GET /assets/categories/:category/subcategories

Get available subcategories for a specific asset category.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "subcategories": [
      {
        "id": "string",
        "name": "string",
        "zakatRate": "number"
      }
    ]
  }
}
```

## Zakat Calculation Endpoints

### POST /zakat/calculate

Calculate Zakat for current assets.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "calculationDate": "string (ISO date)",
  "calendarType": "lunar|solar",
  "method": "standard|hanafi|other",
  "customNisab": "number (optional)",
  "includeAssets": ["string"] // array of asset IDs
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "calculationId": "string",
    "calculationDate": "string (ISO date)",
    "calendarType": "lunar|solar",
    "method": "string",
    "nisab": {
      "goldNisab": "number",
      "silverNisab": "number",
      "effectiveNisab": "number"
    },
    "assets": [
      {
        "assetId": "string",
        "name": "string",
        "value": "number",
        "zakatableAmount": "number",
        "zakatDue": "number"
      }
    ],
    "totals": {
      "totalAssets": "number",
      "totalZakatableAssets": "number",
      "totalZakatDue": "number"
    },
    "meetsNisab": "boolean"
  }
}
```

### GET /zakat/history

Get Zakat calculation history.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**

- `year` (optional): Filter by specific year
- `limit` (optional): Number of records to return
- `offset` (optional): Pagination offset

**Response (200):**

```json
{
  "success": true,
  "data": {
    "calculations": [
      {
        "calculationId": "string",
        "calculationDate": "string (ISO date)",
        "totalZakatDue": "number",
        "paidAmount": "number",
        "remainingAmount": "number",
        "status": "pending|partial|paid",
        "createdAt": "string (ISO date)"
      }
    ],
    "pagination": {
      "total": "number",
      "limit": "number",
      "offset": "number"
    }
  }
}
```

### GET /zakat/calculation/:calculationId

Get detailed Zakat calculation.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "calculationId": "string",
    "calculationDate": "string (ISO date)",
    "calendarType": "lunar|solar",
    "method": "string",
    "nisab": {
      "goldNisab": "number",
      "silverNisab": "number",
      "effectiveNisab": "number"
    },
    "assets": [
      {
        "assetId": "string",
        "name": "string",
        "category": "string",
        "value": "number",
        "zakatableAmount": "number",
        "zakatDue": "number"
      }
    ],
    "totals": {
      "totalAssets": "number",
      "totalZakatableAssets": "number",
      "totalZakatDue": "number"
    },
    "payments": [
      {
        "paymentId": "string",
        "amount": "number",
        "date": "string (ISO date)",
        "recipient": "string",
        "notes": "string"
      }
    ],
    "meetsNisab": "boolean",
    "status": "pending|partial|paid"
  }
}
```

### POST /zakat/payment

Record a Zakat payment.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "calculationId": "string",
  "amount": "number",
  "date": "string (ISO date)",
  "recipient": "string",
  "notes": "string (optional)"
}
```

## Data Management Endpoints

### GET /data/export

Export all user data.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "exportDate": "string (ISO date)",
    "userData": {
      "profile": {},
      "assets": [],
      "zakatCalculations": [],
      "payments": []
    }
  }
}
```

### POST /data/import

Import user data.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "userData": {
    "assets": [],
    "zakatCalculations": [],
    "payments": []
  },
  "mergeStrategy": "replace|merge"
}
```

### POST /data/backup

Create a data backup.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "backupId": "string",
    "backupDate": "string (ISO date)",
    "message": "Backup created successfully"
  }
}
```

## Payment Tracking Endpoints

### POST /payments

Create a new Zakat payment record.

**Authentication:** Required (JWT Bearer token)

**Request Body:**

```json
{
  "snapshotId": "string (CUID)",
  "calculationId": "string (CUID, optional)",
  "amount": "string (decimal number, e.g., '150.50')",
  "paymentDate": "string (ISO datetime)",
  "recipientName": "string (1-200 chars)",
  "recipientType": "string (enum: individual, organization, charity, mosque, family, other)",
  "recipientCategory": "string (enum: poor, orphans, widows, education, healthcare, infrastructure, general)",
  "notes": "string (optional, max 1000 chars)",
  "receiptReference": "string (optional, max 200 chars)",
  "paymentMethod": "string (enum: cash, bank_transfer, check, crypto, other)",
  "currency": "string (3-letter code, default: USD)",
  "exchangeRate": "number (default: 1.0)"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "string",
      "userId": "string",
      "snapshotId": "string",
      "amount": 150.50,
      "paymentDate": "2025-10-26T10:00:00.000Z",
      "recipientName": "Local Mosque",
      "recipientType": "mosque",
      "recipientCategory": "general",
      "notes": "Monthly Zakat distribution",
      "receiptReference": "REC-2025-001",
      "paymentMethod": "bank_transfer",
      "status": "recorded",
      "currency": "USD",
      "exchangeRate": 1.0,
      "createdAt": "2025-10-26T10:00:00.000Z",
      "updatedAt": "2025-10-26T10:00:00.000Z"
    }
  }
}
```

### GET /payments

Retrieve user's Zakat payment records with optional filtering and pagination.

**Authentication:** Required (JWT Bearer token)

**Query Parameters:**
- `page` (number, optional): Page number (default: 1, min: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `sortBy` (string, optional): Sort field (default: paymentDate, options: paymentDate, amount, recipientName, createdAt)
- `sortOrder` (string, optional): Sort order (default: desc, options: asc, desc)
- `status` (string, optional): Filter by status (recorded, verified)
- `recipientCategory` (string, optional): Filter by recipient category
- `startDate` (string, optional): Filter payments from this date (ISO datetime)
- `endDate` (string, optional): Filter payments until this date (ISO datetime)
- `minAmount` (string, optional): Minimum payment amount
- `maxAmount` (string, optional): Maximum payment amount

**Response (200):**

```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "string",
        "userId": "string",
        "snapshotId": "string",
        "amount": 150.50,
        "paymentDate": "2025-10-26T10:00:00.000Z",
        "recipientName": "Local Mosque",
        "recipientType": "mosque",
        "recipientCategory": "general",
        "notes": "Monthly Zakat distribution",
        "receiptReference": "REC-2025-001",
        "paymentMethod": "bank_transfer",
        "status": "recorded",
        "currency": "USD",
        "exchangeRate": 1.0,
        "createdAt": "2025-10-26T10:00:00.000Z",
        "updatedAt": "2025-10-26T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

### GET /payments/:id

Retrieve a specific payment record by ID.

**Authentication:** Required (JWT Bearer token)

**Response (200):** Same as individual payment object above

### PUT /payments/:id

Update an existing payment record.

**Authentication:** Required (JWT Bearer token)

**Request Body:** Same as POST /payments but all fields optional except id

**Response (200):**

```json
{
  "success": true,
  "data": {
    "payment": {
      // Updated payment object
    }
  }
}
```

### DELETE /payments/:id

Delete a payment record.

**Authentication:** Required (JWT Bearer token)

**Response (200):**

```json
{
  "success": true
}
```

## Analytics Endpoints

### GET /analytics/summary

Get comprehensive analytics summary for a specific year.

**Authentication:** Required (JWT Bearer token)

**Query Parameters:**
- `year` (number, optional): Year to analyze (default: current year)
- `includeTrends` (boolean, optional): Include trend analysis (default: true)
- `includeProjections` (boolean, optional): Include future projections (default: false)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "year": 2025,
    "metrics": {
      "wealth_trend": {
        "id": "string",
        "userId": "string",
        "metricType": "wealth_trend",
        "startDate": "2025-01-01T00:00:00.000Z",
        "endDate": "2025-12-31T23:59:59.999Z",
        "calculatedValue": {
          "totalWealth": 50000.00,
          "monthlyBreakdown": [
            {"month": "Jan", "wealth": 45000.00},
            {"month": "Feb", "wealth": 47000.00}
          ],
          "growthRate": 5.2
        },
        "visualizationType": "line_chart",
        "parameters": {},
        "calculatedAt": "2025-10-26T10:00:00.000Z",
        "expiresAt": "2025-10-27T10:00:00.000Z",
        "version": 1
      },
      "zakat_trend": {
        // Similar structure for Zakat payments
      },
      "payment_distribution": {
        // Payment distribution by recipient category
      }
    }
  }
}
```

### GET /analytics/metrics

Get detailed analytics metrics with customizable date ranges.

**Authentication:** Required (JWT Bearer token)

**Query Parameters:**
- `startDate` (string, required): Start date for analysis (ISO datetime)
- `endDate` (string, required): End date for analysis (ISO datetime)
- `metricTypes` (array, optional): Specific metric types to include
- `includeCache` (boolean, optional): Use cached results (default: true)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "id": "string",
        "userId": "string",
        "metricType": "wealth_trend",
        "startDate": "2025-01-01T00:00:00.000Z",
        "endDate": "2025-10-26T23:59:59.999Z",
        "calculatedValue": {
          "data": [...],
          "insights": [...]
        },
        "visualizationType": "line_chart",
        "parameters": {},
        "calculatedAt": "2025-10-26T10:00:00.000Z",
        "expiresAt": "2025-10-27T10:00:00.000Z",
        "version": 1
      }
    ]
  }
}
```

### GET /analytics/trends

Get trend analysis for wealth and Zakat payments.

**Authentication:** Required (JWT Bearer token)

**Query Parameters:**
- `period` (string, optional): Analysis period (default: 12months, options: 3months, 6months, 12months, 24months)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "wealthTrends": {
      "direction": "increasing",
      "changePercent": 8.5,
      "period": "12months",
      "data": [...]
    },
    "zakatTrends": {
      "direction": "stable",
      "changePercent": 2.1,
      "period": "12months",
      "data": [...]
    }
  }
}
```

### GET /analytics/comparison

Compare current year with previous year.

**Authentication:** Required (JWT Bearer token)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "comparison": {
      "previousYear": {
        "year": 2024,
        "wealth": 45000.00,
        "zakat": 1125.00,
        "paid": 1050.00
      },
      "currentYear": {
        "year": 2025,
        "wealth": 50000.00,
        "zakat": 1250.00,
        "paid": 1200.00
      },
      "changes": {
        "wealthChange": 5000.00,
        "wealthChangePercent": 11.11,
        "zakatChange": 125.00,
        "zakatChangePercent": 11.11,
        "paymentConsistency": "improved"
      }
    }
  }
}
```

### POST /analytics/cache/clear

Clear analytics cache to force fresh calculations.

**Authentication:** Required (JWT Bearer token)

**Response (200):**

```json
{
  "success": true,
  "message": "Analytics cache cleared successfully"
}
```

## Export Endpoints

### POST /export/full

Export complete user data including assets, calculations, payments, and snapshots.

**Authentication:** Required (JWT Bearer token)

**Request Body:**

```json
{
  "format": "string (enum: csv, pdf, json)",
  "includePayments": "boolean (default: true)",
  "includeSnapshots": "boolean (default: true)",
  "includeAssets": "boolean (default: true)",
  "startDate": "string (optional, ISO datetime)",
  "endDate": "string (optional, ISO datetime)"
}
```

**Response (202):**

```json
{
  "success": true,
  "data": {
    "exportId": "export_123456",
    "status": "processing",
    "estimatedCompletion": "2025-10-26T10:05:00.000Z",
    "downloadUrl": null
  }
}
```

### POST /export/payments

Export payment records only.

**Authentication:** Required (JWT Bearer token)

**Request Body:** Same as /export/full but focused on payment-specific options

**Response (202):** Same structure as /export/full

### POST /export/analytics

Export analytics data and reports.

**Authentication:** Required (JWT Bearer token)

**Request Body:**

```json
{
  "format": "string (enum: csv, pdf)",
  "reportType": "string (enum: summary, trends, comparison)",
  "year": "number (optional)",
  "includeCharts": "boolean (default: true)"
}
```

**Response (202):** Same structure as /export/full

### GET /export/status/:exportId

Check export processing status.

**Authentication:** Required (JWT Bearer token)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "exportId": "export_123456",
    "status": "completed",
    "downloadUrl": "https://api.zakapp.com/downloads/export_123456.zip",
    "expiresAt": "2025-10-27T10:00:00.000Z",
    "fileSize": 2457600
  }
}
```

### GET /export/download/:exportId

Download completed export file.

**Authentication:** Required (JWT Bearer token)

**Response:** File download (application/zip or text/csv)

### GET /export/templates

Get available export templates and formats.

**Authentication:** Required (JWT Bearer token)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "full_export",
        "name": "Complete Data Export",
        "description": "All user data in structured format",
        "formats": ["json", "csv", "pdf"],
        "estimatedSize": "2-5MB"
      },
      {
        "id": "payment_summary",
        "name": "Payment Summary",
        "description": "Zakat payment records with recipient details",
        "formats": ["csv", "pdf"],
        "estimatedSize": "100-500KB"
      }
    ]
  }
}
```

### DELETE /export/:exportId

Delete an export file and clean up storage.

**Authentication:** Required (JWT Bearer token)

**Response (200):**

```json
{
  "success": true,
  "message": "Export deleted successfully"
}
```

## Reminder Endpoints

### POST /reminders

Create a new reminder event.

**Authentication:** Required (JWT Bearer token)

**Request Body:**

```json
{
  "eventType": "string (enum: zakat_due, payment_reminder, annual_review, custom)",
  "triggerDate": "string (ISO datetime)",
  "title": "string (1-200 chars)",
  "message": "string (1-1000 chars)",
  "priority": "string (enum: high, medium, low, default: medium)",
  "relatedSnapshotId": "string (optional, CUID)",
  "metadata": "object (optional, additional data)"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "reminder": {
      "id": "string",
      "userId": "string",
      "eventType": "zakat_due",
      "triggerDate": "2025-11-01T00:00:00.000Z",
      "title": "Zakat Due Reminder",
      "message": "Your Zakat payment is due this month",
      "priority": "high",
      "status": "pending",
      "relatedSnapshotId": "snapshot_123",
      "metadata": {},
      "createdAt": "2025-10-26T10:00:00.000Z"
    }
  }
}
```

### GET /reminders

Retrieve user's reminders with filtering and pagination.

**Authentication:** Required (JWT Bearer token)

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `sortBy` (string, optional): Sort field (default: triggerDate)
- `sortOrder` (string, optional): Sort order (default: asc)
- `status` (string, optional): Filter by status
- `priority` (string, optional): Filter by priority
- `eventType` (string, optional): Filter by event type
- `startDate` (string, optional): Filter from date
- `endDate` (string, optional): Filter until date

**Response (200):**

```json
{
  "success": true,
  "data": {
    "reminders": [
      {
        "id": "string",
        "userId": "string",
        "eventType": "zakat_due",
        "triggerDate": "2025-11-01T00:00:00.000Z",
        "title": "Zakat Due Reminder",
        "message": "Your Zakat payment is due this month",
        "priority": "high",
        "status": "pending",
        "relatedSnapshotId": "snapshot_123",
        "metadata": {},
        "createdAt": "2025-10-26T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### GET /reminders/:id

Retrieve a specific reminder by ID.

**Authentication:** Required (JWT Bearer token)

**Response (200):** Same as individual reminder object above

### PUT /reminders/:id

Update an existing reminder.

**Authentication:** Required (JWT Bearer token)

**Request Body:** Same as POST /reminders but all fields optional except id

**Response (200):**

```json
{
  "success": true,
  "data": {
    "reminder": {
      // Updated reminder object
    }
  }
}
```

### DELETE /reminders/:id

Delete a reminder.

**Authentication:** Required (JWT Bearer token)

**Response (200):**

```json
{
  "success": true
}
```

### POST /reminders/:id/acknowledge

Mark a reminder as acknowledged.

**Authentication:** Required (JWT Bearer token)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "reminder": {
      // Updated reminder with acknowledged status
    }
  }
}
```

### GET /reminders/upcoming/all

Get all upcoming reminders across all users (admin endpoint).

**Authentication:** Required (JWT Bearer token, admin only)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "reminders": [
      // Array of upcoming reminders
    ]
  }
}
```

## Rate Limiting

- **Authentication endpoints**: 5 requests per minute per IP
- **General API endpoints**: 100 requests per minute per user
- **Payment endpoints**: 50 requests per minute per user
- **Analytics endpoints**: 30 requests per minute per user (cached results), 10 requests per minute for fresh calculations
- **Reminder endpoints**: 50 requests per minute per user
- **Data export**: 3 requests per hour per user
- **Export status checks**: 60 requests per minute per user
- **File upload**: 10 requests per hour per user

## Security Headers

All responses include the following security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

## Versioning

The API uses URL versioning with the format `/api/v{version}/`. Current version is `v1`.

Breaking changes will result in a new version number, while backward-compatible changes will be added to the current version.
