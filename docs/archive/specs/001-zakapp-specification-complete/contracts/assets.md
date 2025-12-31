# API Contract: Asset Management Endpoints

## GET /api/assets

**Purpose**: Retrieve all user assets with optional filtering

**Headers**: `Authorization: Bearer {accessToken}`

### Query Parameters
- `category`: Filter by asset category (optional)
- `active`: Filter by active status (optional, boolean)
- `sort`: Sort field (name, value, createdAt, updatedAt)
- `order`: Sort order (asc, desc)

### Response Success (200)
```json
{
  "success": true,
  "assets": [
    {
      "id": "string",
      "category": "cash" | "gold" | "silver" | "business" | "property" | "stocks" | "crypto",
      "name": "string",
      "value": "number",
      "currency": "string",
      "acquisitionDate": "string", // ISO date
      "metadata": "object", // Category-specific data
      "isActive": "boolean",
      "notes": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "summary": {
    "totalAssets": "number",
    "totalValue": "number",
    "baseCurrency": "string",
    "categoryCounts": "object"
  }
}
```

---

## POST /api/assets

**Purpose**: Create new asset entry

**Headers**: `Authorization: Bearer {accessToken}`

### Request
```json
{
  "category": "cash" | "gold" | "silver" | "business" | "property" | "stocks" | "crypto",
  "name": "string",
  "value": "number", // Must be positive
  "currency": "string", // ISO 4217 code
  "acquisitionDate": "string", // ISO date, not future
  "metadata": "object", // Category-specific fields
  "notes": "string" // Optional
}
```

### Category-Specific Metadata Examples

**Gold/Silver**:
```json
{
  "weight": "number", // Grams
  "purity": "number", // Karats or percentage
  "pricePerGram": "number",
  "location": "string" // Storage location
}
```

**Business**:
```json
{
  "equityPercentage": "number", // Ownership %
  "valuationMethod": "string",
  "lastValuationDate": "string",
  "businessType": "string"
}
```

**Stocks/Crypto**:
```json
{
  "symbol": "string", // Ticker symbol
  "quantity": "number",
  "currentPrice": "number",
  "exchange": "string"
}
```

### Response Success (201)
```json
{
  "success": true,
  "message": "Asset created successfully",
  "asset": {
    "id": "string",
    "category": "string",
    "name": "string",
    "value": "number",
    "currency": "string",
    "acquisitionDate": "string",
    "metadata": "object",
    "isActive": true,
    "notes": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

### Response Error (400)
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid asset data",
  "details": [
    {
      "field": "string",
      "message": "string"
    }
  ]
}
```

---

## GET /api/assets/:id

**Purpose**: Retrieve specific asset by ID

**Headers**: `Authorization: Bearer {accessToken}`

### Response Success (200)
```json
{
  "success": true,
  "asset": {
    "id": "string",
    "category": "string",
    "name": "string",
    "value": "number",
    "currency": "string",
    "acquisitionDate": "string",
    "metadata": "object",
    "isActive": "boolean",
    "notes": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

### Response Error (404)
```json
{
  "success": false,
  "error": "ASSET_NOT_FOUND",
  "message": "Asset not found"
}
```

---

## PUT /api/assets/:id

**Purpose**: Update existing asset

**Headers**: `Authorization: Bearer {accessToken}`

### Request
```json
{
  "name": "string", // Optional
  "value": "number", // Optional, must be positive
  "currency": "string", // Optional, ISO 4217
  "metadata": "object", // Optional, category-specific
  "isActive": "boolean", // Optional
  "notes": "string" // Optional
}
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Asset updated successfully",
  "asset": {
    "id": "string",
    "category": "string",
    "name": "string", 
    "value": "number",
    "currency": "string",
    "acquisitionDate": "string",
    "metadata": "object",
    "isActive": "boolean",
    "notes": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

---

## DELETE /api/assets/:id

**Purpose**: Delete asset (soft delete recommended)

**Headers**: `Authorization: Bearer {accessToken}`

### Response Success (200)
```json
{
  "success": true,
  "message": "Asset deleted successfully"
}
```

### Response Error (404)
```json
{
  "success": false,
  "error": "ASSET_NOT_FOUND", 
  "message": "Asset not found"
}
```

---

## GET /api/assets/categories

**Purpose**: Get available asset categories with validation rules

**Headers**: `Authorization: Bearer {accessToken}`

### Response Success (200)
```json
{
  "success": true,
  "categories": [
    {
      "id": "cash",
      "name": "Cash & Savings",
      "description": "Liquid cash, bank accounts, savings",
      "zakatApplicable": true,
      "requiredFields": ["value", "currency"],
      "metadataSchema": {
        "accountType": "string",
        "bankName": "string"
      }
    },
    {
      "id": "gold", 
      "name": "Gold",
      "description": "Gold jewelry, coins, bullion",
      "zakatApplicable": true,
      "nisabBasis": "gold",
      "requiredFields": ["value", "weight", "purity"],
      "metadataSchema": {
        "weight": "number",
        "purity": "number", 
        "pricePerGram": "number",
        "location": "string"
      }
    }
    // ... other categories
  ]
}
```

---

## GET /api/assets/templates

**Purpose**: Get pre-built asset entry templates

**Headers**: `Authorization: Bearer {accessToken}`

### Response Success (200)
```json
{
  "success": true,
  "templates": [
    {
      "id": "savings-account",
      "category": "cash",
      "name": "Savings Account",
      "description": "Bank savings account template",
      "defaultValues": {
        "metadata": {
          "accountType": "savings",
          "bankName": ""
        }
      },
      "guidance": "Enter current account balance and bank details"
    },
    {
      "id": "gold-jewelry",
      "category": "gold", 
      "name": "Gold Jewelry",
      "description": "Personal gold jewelry template",
      "defaultValues": {
        "metadata": {
          "purity": 18,
          "location": "personal"
        }
      },
      "guidance": "Get jewelry appraised for current market value"
    }
    // ... other templates
  ]
}
```

---

## POST /api/assets/validate

**Purpose**: Validate asset data before saving

**Headers**: `Authorization: Bearer {accessToken}`

### Request
```json
{
  "category": "string",
  "name": "string",
  "value": "number",
  "currency": "string",
  "acquisitionDate": "string",
  "metadata": "object"
}
```

### Response Success (200)
```json
{
  "success": true,
  "valid": true,
  "message": "Asset data is valid",
  "suggestions": [
    {
      "field": "string",
      "suggestion": "string",
      "reason": "string"
    }
  ]
}
```

### Response Error (400)
```json
{
  "success": true, // Note: Success true, but validation failed
  "valid": false,
  "errors": [
    {
      "field": "string",
      "message": "string",
      "severity": "error" | "warning"
    }
  ]
}
```