# API Contract: Analytics Endpoints

**Feature**: 017-milestone-5-ensure  
**Base URL**: `/api/v1/analytics`  
**Authentication**: Required (JWT Bearer token)

---

## GET /analytics/wealth-trend

Gets wealth trend over time based on Assets.

### Request

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `startDate` (optional, ISO 8601): Start of period (default: 1 year ago)
- `endDate` (optional, ISO 8601): End of period (default: today)
- `interval` (optional): `daily` | `weekly` | `monthly` | `yearly` (default: `monthly`)

**Example**:
```
GET /api/v1/analytics/wealth-trend?startDate=2024-01-01&endDate=2024-12-31&interval=monthly
```

### Response

**Status**: `200 OK`

**Body**:
```json
{
  "success": true,
  "data": {
    "metricType": "wealth_trend",
    "periodStart": "2024-01-01T00:00:00Z",
    "periodEnd": "2024-12-31T23:59:59Z",
    "interval": "monthly",
    "dataPoints": [
      {
        "date": "2024-01-01T00:00:00Z",
        "totalWealth": 10000.50,
        "currency": "USD"
      },
      {
        "date": "2024-02-01T00:00:00Z",
        "totalWealth": 10500.75,
        "currency": "USD"
      }
      // ... more data points
    ],
    "summary": {
      "startWealth": 10000.50,
      "endWealth": 15000.00,
      "growth": 5000.00,
      "growthPercentage": 50.0,
      "averageWealth": 12500.25
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `400 Bad Request`: Invalid date format or parameters
- `500 Internal Server Error`: Server error

---

## GET /analytics/zakat-obligations

Gets Zakat obligations (due/paid/outstanding) per Nisab Year Record.

### Request

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `startYear` (optional, number): Start Islamic year (default: earliest record)
- `endYear` (optional, number): End Islamic year (default: current year)

**Example**:
```
GET /api/v1/analytics/zakat-obligations?startYear=1445&endYear=1446
```

### Response

**Status**: `200 OK`

**Body**:
```json
{
  "success": true,
  "data": {
    "metricType": "zakat_trend",
    "nisabYearRecords": [
      {
        "id": "clx123abc",
        "islamicYear": "1445",
        "hawlStartDate": "2023-06-15T00:00:00Z",
        "hawlEndDate": "2024-06-14T23:59:59Z",
        "zakatDue": 375.00,
        "zakatPaid": 200.00,
        "outstandingBalance": 175.00,
        "currency": "USD",
        "paymentCount": 2
      },
      {
        "id": "clx456def",
        "islamicYear": "1446",
        "hawlStartDate": "2024-06-15T00:00:00Z",
        "hawlEndDate": "2025-06-14T23:59:59Z",
        "zakatDue": 450.00,
        "zakatPaid": 0.00,
        "outstandingBalance": 450.00,
        "currency": "USD",
        "paymentCount": 0
      }
    ],
    "summary": {
      "totalDue": 825.00,
      "totalPaid": 200.00,
      "totalOutstanding": 625.00,
      "averageZakatPerYear": 412.50,
      "paymentCompletionRate": 24.24
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `400 Bad Request`: Invalid year parameters
- `500 Internal Server Error`: Server error

---

## GET /analytics/asset-composition

Gets current asset distribution by category.

### Request

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `zakatable` (optional, boolean): Filter by zakatable status (default: all)

**Example**:
```
GET /api/v1/analytics/asset-composition?zakatable=true
```

### Response

**Status**: `200 OK`

**Body**:
```json
{
  "success": true,
  "data": {
    "metricType": "asset_composition",
    "asOfDate": "2024-12-07T10:30:00Z",
    "categories": [
      {
        "category": "cash",
        "totalValue": 8000.00,
        "percentage": 40.0,
        "assetCount": 3,
        "currency": "USD"
      },
      {
        "category": "gold",
        "totalValue": 5000.00,
        "percentage": 25.0,
        "assetCount": 2,
        "currency": "USD"
      },
      {
        "category": "crypto",
        "totalValue": 7000.00,
        "percentage": 35.0,
        "assetCount": 1,
        "currency": "USD"
      }
    ],
    "summary": {
      "totalValue": 20000.00,
      "totalAssets": 6,
      "currency": "USD",
      "zakatableOnly": true
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `500 Internal Server Error`: Server error

---

## GET /analytics/payment-distribution

Gets payment distribution by category and recipient type.

### Request

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `startDate` (optional, ISO 8601): Start of period (default: 1 year ago)
- `endDate` (optional, ISO 8601): End of period (default: today)

**Example**:
```
GET /api/v1/analytics/payment-distribution?startDate=2024-01-01
```

### Response

**Status**: `200 OK`

**Body**:
```json
{
  "success": true,
  "data": {
    "metricType": "payment_distribution",
    "periodStart": "2024-01-01T00:00:00Z",
    "periodEnd": "2024-12-31T23:59:59Z",
    "byCategory": [
      {
        "category": "poor",
        "amount": 150.00,
        "percentage": 50.0,
        "paymentCount": 2
      },
      {
        "category": "orphans",
        "amount": 100.00,
        "percentage": 33.33,
        "paymentCount": 1
      },
      {
        "category": "refugees",
        "amount": 50.00,
        "percentage": 16.67,
        "paymentCount": 1
      }
    ],
    "byRecipientType": [
      {
        "type": "charity",
        "amount": 200.00,
        "percentage": 66.67,
        "paymentCount": 3
      },
      {
        "type": "individual",
        "amount": 100.00,
        "percentage": 33.33,
        "paymentCount": 1
      }
    ],
    "summary": {
      "totalAmount": 300.00,
      "totalPayments": 4,
      "currency": "USD"
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `400 Bad Request`: Invalid date format
- `500 Internal Server Error`: Server error

---

## GET /analytics/dashboard

Gets comprehensive dashboard data (all metrics combined).

### Request

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Query Parameters**: None

**Example**:
```
GET /api/v1/analytics/dashboard
```

### Response

**Status**: `200 OK`

**Body**:
```json
{
  "success": true,
  "data": {
    "wealthTrend": {
      // Same structure as /wealth-trend (last 12 months)
    },
    "zakatObligations": {
      // Same structure as /zakat-obligations (last 3 years)
    },
    "assetComposition": {
      // Same structure as /asset-composition (current)
    },
    "paymentDistribution": {
      // Same structure as /payment-distribution (current year)
    },
    "summary": {
      "currentWealth": 20000.00,
      "totalZakatDue": 500.00,
      "totalZakatPaid": 300.00,
      "zakatOutstanding": 200.00,
      "recentPayments": [
        {
          "id": "pay789",
          "amount": 100.00,
          "paymentDate": "2024-11-15T00:00:00Z",
          "recipient": "Local Mosque",
          "category": "poor"
        }
        // ... last 5 payments
      ]
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `500 Internal Server Error`: Server error

---

## Notes

### Caching
All analytics endpoints use cached data with TTL:
- Wealth trend: 60 min
- Zakat obligations: 60 min
- Asset composition: 30 min
- Payment distribution: 30 min

Cache is invalidated on:
- Asset creation/update/deletion
- Payment creation/update/deletion
- Nisab Year Record update

### Data Source Clarity
- **Wealth Trend**: Calculated from `assets` table (independent of Nisab Records)
- **Zakat Obligations**: Calculated from `nisab_year_records` table + linked `payment_records`
- **Asset Composition**: Current state of `assets` table
- **Payment Distribution**: Aggregation from `payment_records` table

### Terminology
All responses use "Nisab Year Record" terminology. Backend `YearlySnapshot` model is never exposed in API responses.

### Encryption
All encrypted fields (amounts, recipient info) are decrypted server-side before sending response. Client receives plain JSON.

### Pagination
Not required for analytics endpoints (data aggregated into summaries). If raw data needed, use specific entity endpoints:
- `/api/v1/payments` (with pagination)
- `/api/v1/assets` (with pagination)
- `/api/v1/nisab-years` (with pagination)
