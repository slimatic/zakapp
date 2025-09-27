# API Contract: Zakat Calculation Endpoints

## POST /api/zakat/calculate

**Purpose**: Calculate Zakat obligation based on current assets and methodology

**Headers**: `Authorization: Bearer {accessToken}`

### Request
```json
{
  "methodology": "standard" | "hanafi" | "shafi_i" | "custom",
  "calendarType": "lunar" | "solar", 
  "calculationDate": "string", // ISO date, defaults to today
  "includeAssets": ["string"], // Asset IDs to include (optional, defaults to all active)
  "includeLiabilities": ["string"], // Liability IDs to include (optional, defaults to all active)
  "customRules": { // Optional, for custom methodology
    "zakatRate": "number", // Override default 2.5%
    "nisabSource": "gold" | "silver",
    "regionalAdjustments": "object"
  }
}
```

### Response Success (200)
```json
{
  "success": true,
  "calculation": {
    "id": "string", // Calculation ID for future reference
    "calculationDate": "string",
    "methodology": "string",
    "calendarType": "string",
    "summary": {
      "totalAssets": "number",
      "totalLiabilities": "number", 
      "netWorth": "number",
      "nisabThreshold": "number",
      "nisabSource": "gold" | "silver",
      "isZakatObligatory": "boolean",
      "zakatAmount": "number",
      "zakatRate": "number"
    },
    "breakdown": {
      "assetsByCategory": [
        {
          "category": "string",
          "totalValue": "number",
          "zakatableAmount": "number",
          "rate": "number",
          "zakatDue": "number",
          "assets": [
            {
              "id": "string",
              "name": "string", 
              "value": "number",
              "zakatableAmount": "number",
              "excludeReason": "string" // If not fully zakatable
            }
          ]
        }
      ],
      "liabilities": [
        {
          "id": "string",
          "name": "string",
          "amount": "number",
          "deductible": "boolean",
          "deductionReason": "string"
        }
      ],
      "methodologyRules": {
        "nisabCalculation": "object",
        "assetTreatment": "object", 
        "liabilityDeduction": "object"
      }
    },
    "educationalContent": {
      "nisabExplanation": "string",
      "methodologyExplanation": "string",
      "scholarlyReferences": ["string"]
    }
  }
}
```

### Response Error (400)
```json
{
  "success": false,
  "error": "CALCULATION_ERROR",
  "message": "Unable to calculate Zakat",
  "details": [
    {
      "issue": "string",
      "description": "string",
      "suggestion": "string"
    }
  ]
}
```

---

## GET /api/zakat/nisab

**Purpose**: Get current nisab thresholds and precious metal prices

### Response Success (200)
```json
{
  "success": true,
  "nisab": {
    "effectiveDate": "string",
    "goldPrice": {
      "pricePerGram": "number",
      "currency": "string",
      "nisabGrams": "number", // 87.48 grams typically
      "nisabValue": "number"
    },
    "silverPrice": {
      "pricePerGram": "number", 
      "currency": "string",
      "nisabGrams": "number", // 612.36 grams typically
      "nisabValue": "number"
    },
    "recommendation": "gold" | "silver", // Which to use (typically lower)
    "lastUpdated": "string",
    "source": "string" // Price source API or manual
  }
}
```

---

## POST /api/zakat/snapshot

**Purpose**: Create asset snapshot for yearly tracking

**Headers**: `Authorization: Bearer {accessToken}`

### Request
```json
{
  "snapshotDate": "string", // ISO date
  "snapshotType": "annual" | "custom" | "backup",
  "notes": "string" // Optional context
}
```

### Response Success (201)
```json
{
  "success": true,
  "message": "Snapshot created successfully",
  "snapshot": {
    "id": "string",
    "snapshotDate": "string",
    "snapshotType": "string",
    "totalValue": "number",
    "assetCount": "number",
    "notes": "string",
    "isLocked": "boolean",
    "createdAt": "string"
  }
}
```

---

## GET /api/zakat/snapshots

**Purpose**: List user's asset snapshots with filtering

**Headers**: `Authorization: Bearer {accessToken}`

### Query Parameters
- `type`: Filter by snapshot type (optional)
- `year`: Filter by year (optional)
- `sort`: Sort field (date, value)
- `order`: Sort order (asc, desc)

### Response Success (200)
```json
{
  "success": true,
  "snapshots": [
    {
      "id": "string",
      "snapshotDate": "string", 
      "snapshotType": "string",
      "totalValue": "number",
      "assetCount": "number",
      "notes": "string",
      "isLocked": "boolean",
      "createdAt": "string"
    }
  ],
  "summary": {
    "totalSnapshots": "number",
    "yearlyGrowth": "number", // Percentage
    "averageValue": "number"
  }
}
```

---

## GET /api/zakat/snapshot/:id

**Purpose**: Get detailed snapshot with complete asset/liability data

**Headers**: `Authorization: Bearer {accessToken}`

### Response Success (200)
```json
{
  "success": true,
  "snapshot": {
    "id": "string",
    "snapshotDate": "string",
    "snapshotType": "string", 
    "totalValue": "number",
    "assetCount": "number",
    "notes": "string",
    "isLocked": "boolean",
    "assetsData": [
      {
        "id": "string",
        "category": "string",
        "name": "string",
        "value": "number",
        "currency": "string",
        "metadata": "object"
      }
    ],
    "liabilitiesData": [
      {
        "id": "string",
        "type": "string", 
        "name": "string",
        "amount": "number",
        "currency": "string"
      }
    ],
    "exchangeRates": "object",
    "createdAt": "string"
  }
}
```

---

## POST /api/zakat/payment

**Purpose**: Record Zakat payment/disbursement

**Headers**: `Authorization: Bearer {accessToken}`

### Request
```json
{
  "calculationId": "string", // Reference to calculation that motivated payment
  "paymentDate": "string", // ISO date
  "amount": "number",
  "currency": "string",
  "recipients": [
    {
      "name": "string",
      "category": "poor" | "needy" | "collector" | "convert" | "slave" | "debtor" | "cause" | "traveler",
      "amount": "number",
      "notes": "string" // Optional
    }
  ],
  "paymentMethod": "cash" | "bank_transfer" | "check" | "crypto" | "other",
  "receiptNumber": "string", // Optional transaction reference
  "notes": "string" // Optional additional context
}
```

### Response Success (201)
```json
{
  "success": true,
  "message": "Zakat payment recorded successfully",
  "payment": {
    "id": "string",
    "calculationId": "string",
    "paymentDate": "string", 
    "amount": "number",
    "currency": "string",
    "recipients": "array",
    "paymentMethod": "string",
    "receiptNumber": "string",
    "islamicYear": "string", // Calculated Hijri year
    "status": "completed",
    "createdAt": "string"
  }
}
```

---

## GET /api/zakat/payments

**Purpose**: List user's Zakat payment history

**Headers**: `Authorization: Bearer {accessToken}`

### Query Parameters
- `year`: Filter by Islamic year (optional)
- `status`: Filter by payment status (optional)
- `sort`: Sort field (date, amount)
- `order`: Sort order (asc, desc)

### Response Success (200)
```json
{
  "success": true,
  "payments": [
    {
      "id": "string",
      "calculationId": "string",
      "paymentDate": "string",
      "amount": "number", 
      "currency": "string",
      "recipientCount": "number",
      "paymentMethod": "string",
      "islamicYear": "string",
      "status": "string",
      "createdAt": "string"
    }
  ],
  "summary": {
    "totalPayments": "number",
    "totalAmount": "number",
    "currentYearTotal": "number",
    "averagePayment": "number"
  }
}
```

---

## GET /api/zakat/methodologies

**Purpose**: Get available Zakat calculation methodologies

### Response Success (200)
```json
{
  "success": true,
  "methodologies": [
    {
      "id": "standard",
      "name": "Standard Methodology", 
      "description": "Commonly accepted calculation approach",
      "scholarlySource": "Multiple classical and contemporary scholars",
      "features": {
        "nisabBasis": "Lower of gold/silver",
        "zakatRate": "2.5%",
        "liabilityDeduction": "All current debts",
        "calendarSupport": ["lunar", "solar"]
      },
      "isDefault": true
    },
    {
      "id": "hanafi",
      "name": "Hanafi School",
      "description": "Hanafi madhab approach to Zakat calculation",
      "scholarlySource": "Hanafi fiqh authorities",
      "features": {
        "nisabBasis": "Silver-based threshold",
        "zakatRate": "2.5%", 
        "liabilityDeduction": "Immediate debts only",
        "calendarSupport": ["lunar"]
      },
      "isDefault": false
    }
    // ... other methodologies
  ]
}
```