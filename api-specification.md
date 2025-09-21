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
- `year` (optional): Filter by year

**Response (200):**

```json
{
  "success": true,
  "data": {
    "assets": [
      {
        "assetId": "string",
        "name": "string",
        "category": "cash|gold|silver|business|property|stocks|crypto",
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
  "category": "cash|gold|silver|business|property|stocks|crypto",
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

## Error Responses

### Standard Error Format

```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": "string (optional)"
  }
}
```

### Common Error Codes

- `INVALID_REQUEST` (400): Malformed request data
- `UNAUTHORIZED` (401): Invalid or missing authentication
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (422): Input validation failed
- `INTERNAL_ERROR` (500): Server internal error

### Validation Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "field1": ["Error message 1"],
      "field2": ["Error message 2"]
    }
  }
}
```

## Rate Limiting

- **Authentication endpoints**: 5 requests per minute per IP
- **General API endpoints**: 100 requests per minute per user
- **Data export**: 3 requests per hour per user
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
