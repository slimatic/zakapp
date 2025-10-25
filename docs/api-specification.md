# ZakApp API Specification

**Version**: 1.0.0  
**Base URL**: `https://api.zakapp.com/v1`  
**Authentication**: Bearer Token (JWT)

## Constitutional Compliance

This API adheres to ZakApp's constitutional principles:

- **Privacy & Security First**: All endpoints implement encryption, authentication, and data protection
- **Islamic Compliance**: Calculations and methodologies follow authentic Islamic jurisprudence
- **User-Centric Design**: RESTful design with clear, intuitive endpoints
- **Quality & Reliability**: Comprehensive validation, error handling, and monitoring
- **Transparency & Trust**: Detailed documentation and clear response formats

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Authentication Flow

1. **Login**: `POST /auth/login` - Get access token
2. **Refresh**: `POST /auth/refresh` - Refresh expired token
3. **Logout**: `POST /auth/logout` - Invalidate token

## API Response Format

All API responses follow a standardized format:

### Success Response
```json
{
  "success": true,
  "data": <response_data>,
  "meta": {
    "timestamp": "2024-09-29T12:00:00Z",
    "requestId": "req_abc123",
    "version": "1.0.0",
    "pagination": { // For list endpoints
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    },
    "performance": { // Optional
      "processingTime": 156
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "validationErrors": [
        {
          "field": "email",
          "message": "Invalid email format",
          "code": "INVALID_FORMAT"
        }
      ]
    },
    "timestamp": "2024-09-29T12:00:00Z",
    "requestId": "req_abc123"
  },
  "meta": {
    "timestamp": "2024-09-29T12:00:00Z",
    "requestId": "req_abc123",
    "version": "1.0.0"
  }
}
```

## Authentication Endpoints

### Login
**POST** `/auth/login`

Authenticate user and receive access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "profile": {
        "name": "Ahmed Hassan",
        "preferredMethodology": "hanafi"
      }
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "refresh_token_here",
      "expiresIn": 3600
    }
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR` - Invalid request format
- `401 INVALID_CREDENTIALS` - Invalid email/password
- `429 RATE_LIMIT_EXCEEDED` - Too many login attempts

### Register
**POST** `/auth/register`

Create new user account.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "profile": {
    "name": "Fatima Al-Zahra",
    "location": "Dubai, UAE",
    "preferredMethodology": "shafi",
    "currency": "AED"
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_124",
      "email": "newuser@example.com",
      "profile": {
        "name": "Fatima Al-Zahra",
        "preferredMethodology": "shafi"
      }
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "refresh_token_here",
      "expiresIn": 3600
    }
  }
}
```

### Refresh Token
**POST** `/auth/refresh`

Refresh expired access token.

**Headers:**
```
Authorization: Bearer <refresh_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "new_refresh_token_here",
      "expiresIn": 3600
    }
  }
}
```

### Logout
**POST** `/auth/logout`

Invalidate current session tokens.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (204):** No content

## Asset Management Endpoints

### List Assets
**GET** `/assets`

Retrieve user's assets with optional filtering and pagination.

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 20, max: 100)
- `category` (string, optional): Filter by category (`cash`, `gold`, `silver`, `business`, `property`, `stocks`, `crypto`)
- `sortBy` (string, optional): Sort field (`name`, `value`, `category`, `createdAt`)
- `sortOrder` (string, optional): Sort direction (`asc`, `desc`)
- `search` (string, optional): Search in asset names

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "asset_123",
        "name": "Checking Account",
        "category": "cash",
        "value": 25000.50,
        "currency": "USD",
        "acquisitionDate": "2024-01-15T00:00:00Z",
        "isActive": true,
        "metadata": {
          "bankName": "First National Bank",
          "accountType": "checking"
        },
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-09-29T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### Create Asset
**POST** `/assets`

Add new asset to user's portfolio.

**Request Body:**
```json
{
  "name": "Gold Jewelry",
  "category": "gold",
  "value": 15000,
  "currency": "USD",
  "acquisitionDate": "2024-09-01T00:00:00Z",
  "metadata": {
    "weight": "85g",
    "purity": "22k",
    "type": "jewelry"
  },
  "notes": "Wedding jewelry set"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "asset_124",
    "name": "Gold Jewelry",
    "category": "gold",
    "value": 15000,
    "currency": "USD",
    "acquisitionDate": "2024-09-01T00:00:00Z",
    "isActive": true,
    "metadata": {
      "weight": "85g",
      "purity": "22k",
      "type": "jewelry"
    },
    "notes": "Wedding jewelry set",
    "createdAt": "2024-09-29T12:00:00Z",
    "updatedAt": "2024-09-29T12:00:00Z"
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR` - Invalid asset data
- `400 HARAM_ASSET_DETECTED` - Non-Shariah compliant asset
- `401 UNAUTHORIZED` - Invalid or missing token

### Get Asset
**GET** `/assets/{assetId}`

Retrieve specific asset details.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "asset_123",
    "name": "Checking Account",
    "category": "cash",
    "value": 25000.50,
    "currency": "USD",
    "acquisitionDate": "2024-01-15T00:00:00Z",
    "isActive": true,
    "metadata": {
      "bankName": "First National Bank",
      "accountType": "checking"
    },
    "notes": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-09-29T12:00:00Z"
  }
}
```

### Update Asset
**PUT** `/assets/{assetId}`

Update existing asset information.

**Request Body:**
```json
{
  "name": "Updated Asset Name",
  "value": 30000,
  "notes": "Updated notes"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "asset_123",
    "name": "Updated Asset Name",
    "category": "cash",
    "value": 30000,
    "currency": "USD",
    "acquisitionDate": "2024-01-15T00:00:00Z",
    "isActive": true,
    "metadata": {
      "bankName": "First National Bank",
      "accountType": "checking"
    },
    "notes": "Updated notes",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-09-29T12:00:00Z"
  }
}
```

### Delete Asset
**DELETE** `/assets/{assetId}`

Remove asset from user's portfolio.

**Success Response (204):** No content

**Error Responses:**
- `404 ASSET_NOT_FOUND` - Asset doesn't exist or doesn't belong to user

## Zakat Calculation Endpoints

### Calculate Zakat
**POST** `/zakat/calculate`

Calculate Zakat based on current assets and methodology.

**Request Body:**
```json
{
  "methodology": "hanafi",
  "customAssets": {
    "cash": 50000,
    "gold": 25000,
    "silver": 5000,
    "business": 30000
  },
  "calculationDate": "2024-09-29T00:00:00Z",
  "nisabBasis": "silver",
  "deductions": {
    "debts": 5000,
    "livingExpenses": 0
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "calculation": {
      "id": "calc_123",
      "methodology": "hanafi",
      "calculationDate": "2024-09-29T00:00:00Z",
      "nisabThreshold": 4948.87,
      "nisabBasis": "silver",
      "totalAssets": 110000,
      "totalDeductions": 5000,
      "zakatableAmount": 105000,
      "zakatDue": 2625.00,
      "zakatRate": 0.025,
      "belowNisab": false
    },
    "breakdown": {
      "cash": {
        "amount": 50000,
        "zakatable": true,
        "zakatDue": 1250.00
      },
      "gold": {
        "amount": 25000,
        "zakatable": true,
        "zakatDue": 625.00
      },
      "silver": {
        "amount": 5000,
        "zakatable": true,
        "zakatDue": 125.00
      },
      "business": {
        "amount": 30000,
        "zakatable": true,
        "zakatDue": 750.00
      }
    },
    "methodologyDetails": {
      "school": "Hanafi",
      "description": "Hanafi methodology emphasizes practical application and uses silver nisab for cash calculations",
      "sources": [
        "Al-Marghinani's Al-Hidayah",
        "Ibn Abidin's Radd al-Muhtar"
      ]
    }
  }
}
```

### Get Calculation History
**GET** `/zakat/history`

Retrieve user's historical Zakat calculations.

**Query Parameters:**
- `page` (integer, optional): Page number
- `limit` (integer, optional): Items per page
- `startDate` (string, optional): ISO date string
- `endDate` (string, optional): ISO date string
- `methodology` (string, optional): Filter by methodology

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "calc_123",
        "methodology": "hanafi",
        "calculationDate": "2024-09-29T00:00:00Z",
        "totalAssets": 110000,
        "zakatDue": 2625.00,
        "status": "completed",
        "createdAt": "2024-09-29T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 12,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### Get Nisab Thresholds
**GET** `/zakat/nisab`

Get current Nisab thresholds based on precious metal prices.

**Query Parameters:**
- `currency` (string, optional): Target currency (default: USD)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "currency": "USD",
    "goldNisab": {
      "weight": "85g",
      "pricePerGram": 65.50,
      "threshold": 5567.50,
      "source": "London Bullion Market"
    },
    "silverNisab": {
      "weight": "595g",
      "pricePerGram": 0.85,
      "threshold": 505.75,
      "source": "London Bullion Market"
    },
    "recommendedNisab": {
      "value": 505.75,
      "basis": "silver",
      "reasoning": "Silver nisab is lower and more favorable to the poor"
    },
    "lastUpdated": "2024-09-29T10:00:00Z"
  }
}
```

## Payment Tracking Endpoints

### Record Zakat Payment
**POST** `/zakat/payments`

Record a Zakat payment for tracking purposes.

**Request Body:**
```json
{
  "calculationId": "calc_123",
  "amount": 2625.00,
  "currency": "USD",
  "paymentDate": "2024-09-29T15:00:00Z",
  "recipient": "Local Islamic Center",
  "method": "bank_transfer",
  "notes": "Annual Zakat payment for 2024",
  "receipt": {
    "referenceNumber": "TXN123456",
    "confirmationNumber": "CONF789012"
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "payment_123",
    "calculationId": "calc_123",
    "amount": 2625.00,
    "currency": "USD",
    "paymentDate": "2024-09-29T15:00:00Z",
    "recipient": "Local Islamic Center",
    "method": "bank_transfer",
    "status": "completed",
    "notes": "Annual Zakat payment for 2024",
    "receipt": {
      "referenceNumber": "TXN123456",
      "confirmationNumber": "CONF789012"
    },
    "createdAt": "2024-09-29T15:30:00Z"
  }
}
```

### List Payments
**GET** `/zakat/payments`

Retrieve payment history with filtering options.

**Query Parameters:**
- `page`, `limit`: Pagination
- `startDate`, `endDate`: Date range filter
- `status`: Payment status filter

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "payment_123",
        "amount": 2625.00,
        "currency": "USD",
        "paymentDate": "2024-09-29T15:00:00Z",
        "recipient": "Local Islamic Center",
        "method": "bank_transfer",
        "status": "completed",
        "createdAt": "2024-09-29T15:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

## User Profile Endpoints

### Get Profile
**GET** `/user/profile`

Retrieve user profile information.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "profile": {
      "name": "Ahmed Hassan",
      "location": "Dubai, UAE",
      "preferredMethodology": "hanafi",
      "currency": "AED",
      "language": "en",
      "timezone": "Asia/Dubai"
    },
    "settings": {
      "notifications": {
        "zakatReminders": true,
        "emailAlerts": true,
        "pushNotifications": false
      },
      "privacy": {
        "profileVisibility": "private",
        "dataSharing": false
      }
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "lastLoginAt": "2024-09-29T12:00:00Z"
  }
}
```

### Update Profile
**PUT** `/user/profile`

Update user profile information.

**Request Body:**
```json
{
  "profile": {
    "name": "Ahmed Hassan Al-Mahmood",
    "preferredMethodology": "maliki",
    "currency": "USD"
  },
  "settings": {
    "notifications": {
      "zakatReminders": false
    }
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "profile": {
      "name": "Ahmed Hassan Al-Mahmood",
      "location": "Dubai, UAE",
      "preferredMethodology": "maliki",
      "currency": "USD",
      "language": "en",
      "timezone": "Asia/Dubai"
    },
    "settings": {
      "notifications": {
        "zakatReminders": false,
        "emailAlerts": true,
        "pushNotifications": false
      },
      "privacy": {
        "profileVisibility": "private",
        "dataSharing": false
      }
    },
    "updatedAt": "2024-09-29T12:00:00Z"
  }
}
```

## Data Management Endpoints

### Export Data
**GET** `/user/export`

Export user's data in JSON format for backup or migration.

**Query Parameters:**
- `format` (string, optional): Export format (`json`, `csv`) (default: json)
- `includeCalculations` (boolean, optional): Include calculation history (default: true)
- `includePayments` (boolean, optional): Include payment records (default: true)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "exportId": "export_123",
    "downloadUrl": "https://api.zakapp.com/downloads/export_123.json",
    "expiresAt": "2024-09-30T12:00:00Z",
    "fileSize": 2048576,
    "includedData": {
      "assets": 25,
      "calculations": 12,
      "payments": 8,
      "profile": true
    }
  }
}
```

### Import Data
**POST** `/user/import`

Import data from JSON export or external sources.

**Request Body:**
```json
{
  "source": "zakapp_export",
  "data": {
    "assets": [...],
    "calculations": [...],
    "payments": [...]
  },
  "options": {
    "validateIntegrity": true,
    "skipDuplicates": true,
    "createBackup": true
  }
}
```

**Success Response (202):**
```json
{
  "success": true,
  "data": {
    "importId": "import_123",
    "status": "processing",
    "estimatedCompletion": "2024-09-29T12:05:00Z",
    "statusUrl": "/user/import/import_123/status"
  }
}
```

## Educational Content Endpoints

### Get Methodologies
**GET** `/education/methodologies`

Retrieve information about Islamic jurisprudence schools and their Zakat methodologies.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "methodologies": [
      {
        "id": "hanafi",
        "name": "Hanafi",
        "description": "The Hanafi school emphasizes practical application and uses silver nisab for cash calculations",
        "characteristics": [
          "Uses silver nisab for cash and equivalents",
          "Practical approach to business asset valuation",
          "Consideration of current market conditions"
        ],
        "sources": [
          "Al-Marghinani's Al-Hidayah",
          "Ibn Abidin's Radd al-Muhtar"
        ],
        "prevalence": {
          "regions": ["Turkey", "Central Asia", "South Asia", "Parts of Middle East"],
          "percentage": 45
        }
      }
    ]
  }
}
```

### Get Zakat Guide
**GET** `/education/guide`

Comprehensive Zakat calculation guide with examples.

**Query Parameters:**
- `methodology` (string, optional): Filter guide for specific methodology
- `language` (string, optional): Language preference (en, ar)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "guide": {
      "title": "Complete Guide to Zakat Calculation",
      "sections": [
        {
          "title": "Understanding Nisab",
          "content": "Nisab is the minimum amount of wealth a Muslim must have before they are required to pay Zakat...",
          "examples": [
            {
              "scenario": "Cash savings calculation",
              "assets": { "cash": 10000 },
              "nisab": 595,
              "zakatDue": 250,
              "explanation": "Since cash holdings exceed nisab threshold..."
            }
          ]
        }
      ],
      "methodology": "general",
      "lastUpdated": "2024-09-29T00:00:00Z"
    }
  }
}
```

## System Status Endpoints

### Health Check
**GET** `/health`

Check API system health and status.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-09-29T12:00:00Z",
    "version": "1.0.0",
    "uptime": 86400,
    "services": {
      "database": "healthy",
      "encryption": "healthy",
      "nisabService": "healthy"
    },
    "metrics": {
      "activeUsers": 1250,
      "totalCalculations": 15647,
      "averageResponseTime": 156
    }
  }
}
```

### API Status
**GET** `/status`

Detailed API status including performance metrics.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "api": {
      "version": "1.0.0",
      "environment": "production",
      "region": "us-east-1"
    },
    "performance": {
      "averageResponseTime": 156,
      "requestsPerMinute": 450,
      "errorRate": 0.02
    },
    "constitutional": {
      "privacyCompliance": "enforced",
      "islamicCompliance": "verified",
      "securityStatus": "active"
    }
  }
}
```

## Error Codes Reference

### Authentication Errors
- `UNAUTHORIZED` (401): Missing or invalid authentication token
- `TOKEN_EXPIRED` (401): Access token has expired
- `INVALID_CREDENTIALS` (401): Invalid email/password combination
- `FORBIDDEN` (403): User lacks permission for requested resource

### Validation Errors
- `VALIDATION_ERROR` (400): General validation failure
- `INVALID_INPUT` (400): Invalid input format or type
- `MISSING_REQUIRED_FIELD` (400): Required field missing from request
- `INVALID_EMAIL_FORMAT` (400): Email address format invalid
- `WEAK_PASSWORD` (400): Password doesn't meet security requirements

### Business Logic Errors
- `ASSET_NOT_FOUND` (404): Requested asset doesn't exist
- `CALCULATION_ERROR` (400): Error in Zakat calculation
- `INSUFFICIENT_ASSETS` (400): Assets below nisab threshold
- `HARAM_ASSET_DETECTED` (400): Non-Shariah compliant asset
- `METHODOLOGY_ERROR` (400): Invalid or unsupported methodology

### System Errors
- `INTERNAL_ERROR` (500): Unexpected server error
- `SERVICE_UNAVAILABLE` (503): Service temporarily unavailable
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `DATABASE_ERROR` (500): Database operation failed

### Islamic Compliance Errors
- `NISAB_CALCULATION_ERROR` (400): Error calculating nisab threshold
- `METHODOLOGY_CONFLICT` (400): Conflicting methodology requirements
- `CALENDAR_CONVERSION_ERROR` (400): Lunar calendar calculation error

## Rate Limiting

API requests are rate-limited to ensure fair usage:

- **General endpoints**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **Calculation endpoints**: 50 requests per 15 minutes per user
- **Export endpoints**: 3 requests per hour per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Webhooks (Future Feature)

Webhook endpoints for real-time notifications:

- `zakat.calculation.completed` - Zakat calculation finished
- `payment.recorded` - Zakat payment recorded
- `nisab.threshold.updated` - Nisab threshold changed
- `user.profile.updated` - User profile modified

## SDK and Libraries

Official SDKs available for:
- JavaScript/TypeScript
- Python
- Java
- Swift (iOS)
- Kotlin (Android)

## Support and Resources

- **API Documentation**: https://docs.zakapp.com/api
- **Islamic Jurisprudence Sources**: https://docs.zakapp.com/islamic-sources
- **Support Email**: api-support@zakapp.com
- **Community Forum**: https://community.zakapp.com
- **GitHub Repository**: https://github.com/zakapp/api-examples

---

*This API documentation follows ZakApp's constitutional principles of Privacy & Security First, Islamic Compliance, User-Centric Design, Quality & Reliability, and Transparency & Trust.*

## Analytics Endpoints

### Get Analytics Summary
**GET** `/analytics/summary`

Get comprehensive Zakat analytics summary for the authenticated user.

**Query Parameters:**
- `startDate` (string, optional): Start date for analysis period (ISO 8601)
- `endDate` (string, optional): End date for analysis period (ISO 8601)
- `methodology` (string, optional): Filter by Zakat methodology
- `includeTrends` (boolean, optional): Include trend analysis (default: true)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalPayments": 12500.00,
      "totalRecipients": 45,
      "averagePayment": 277.78,
      "paymentFrequency": "quarterly",
      "mostUsedCategory": "poor",
      "preferredMethodology": "hanafi",
      "complianceRate": 95.2
    },
    "trends": {
      "paymentGrowth": 12.5,
      "recipientDiversity": 8.3,
      "methodologyConsistency": 98.1
    },
    "period": {
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-12-31T23:59:59Z",
      "totalMonths": 12
    }
  }
}
```

### Get Analytics Metrics
**GET** `/analytics/metrics`

Retrieve detailed analytics metrics with customizable groupings.

**Query Parameters:**
- `startDate` (string, optional): Start date for analysis
- `endDate` (string, optional): End date for analysis
- `groupBy` (string, optional): Group results by (`month`, `quarter`, `year`, `category`, `methodology`)
- `metrics` (string[], optional): Specific metrics to include
- `limit` (integer, optional): Maximum results to return

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "period": "2024-Q1",
        "totalPayments": 3200.00,
        "paymentCount": 12,
        "averagePayment": 266.67,
        "topCategory": "education",
        "recipientCount": 8
      },
      {
        "period": "2024-Q2",
        "totalPayments": 3800.00,
        "paymentCount": 15,
        "averagePayment": 253.33,
        "topCategory": "poor",
        "recipientCount": 12
      }
    ],
    "aggregates": {
      "totalPayments": 7000.00,
      "totalCount": 27,
      "averagePayment": 259.26,
      "growthRate": 18.75
    }
  }
}
```

### Get Payment Trends
**GET** `/analytics/trends`

Analyze payment trends and patterns over time.

**Query Parameters:**
- `analysisType` (string, optional): Type of trend analysis (`seasonal`, `growth`, `distribution`, `predictive`)
- `period` (string, optional): Analysis period (`1y`, `2y`, `5y`)
- `confidence` (number, optional): Prediction confidence level (0-1)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "trends": {
      "seasonal": {
        "peakMonths": ["Ramadan", "Dhul-Hijjah"],
        "seasonalMultiplier": 2.3,
        "confidence": 0.89
      },
      "growth": {
        "annualGrowthRate": 12.5,
        "trendDirection": "increasing",
        "volatility": 0.15
      },
      "distribution": {
        "paymentSizeDistribution": {
          "small": 35,
          "medium": 45,
          "large": 20
        },
        "categoryDistribution": {
          "poor": 40,
          "orphans": 25,
          "widows": 20,
          "education": 15
        }
      }
    },
    "predictions": {
      "nextQuarterEstimate": 4200.00,
      "confidenceInterval": {
        "lower": 3800.00,
        "upper": 4600.00
      }
    }
  }
}
```

### Compare Analytics Periods
**GET** `/analytics/comparison`

Compare Zakat analytics between different time periods.

**Query Parameters:**
- `period1` (object): First comparison period
  - `startDate` (string): Start date
  - `endDate` (string): End date
- `period2` (object): Second comparison period
- `comparisonType` (string, optional): Type of comparison (`absolute`, `percentage`, `growth`)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "comparison": {
      "period1": {
        "label": "2023",
        "totalPayments": 12000.00,
        "paymentCount": 48,
        "averagePayment": 250.00
      },
      "period2": {
        "label": "2024",
        "totalPayments": 13500.00,
        "paymentCount": 52,
        "averagePayment": 259.62
      },
      "differences": {
        "totalPayments": {
          "absolute": 1500.00,
          "percentage": 12.5,
          "direction": "increase"
        },
        "paymentCount": {
          "absolute": 4,
          "percentage": 8.3,
          "direction": "increase"
        },
        "averagePayment": {
          "absolute": 9.62,
          "percentage": 3.8,
          "direction": "increase"
        }
      }
    },
    "insights": [
      "Payment volume increased by 12.5%",
      "Average payment size grew by 3.8%",
      "Payment frequency improved by 8.3%"
    ]
  }
}
```

### Clear Analytics Cache
**POST** `/analytics/cache/clear`

Clear cached analytics data to force fresh calculations.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Analytics cache cleared successfully",
  "data": {
    "clearedAt": "2024-09-29T15:30:00Z",
    "cacheSize": "2.3MB",
    "nextRefresh": "2024-09-29T15:30:05Z"
  }
}
```

## Reminder Management Endpoints

### Create Reminder
**POST** `/reminders`

Create a new Zakat payment reminder.

**Request Body:**
```json
{
  "title": "Quarterly Zakat Payment",
  "description": "Time to calculate and pay your quarterly Zakat",
  "reminderType": "payment",
  "frequency": "quarterly",
  "nextDueDate": "2024-12-31T23:59:59Z",
  "amount": 2500.00,
  "currency": "USD",
  "recipientCategory": "poor",
  "isActive": true,
  "notificationPreferences": {
    "email": true,
    "push": false,
    "sms": false
  },
  "metadata": {
    "calculationMethod": "hanafi",
    "nisabThreshold": 505.75
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "reminder_123",
    "title": "Quarterly Zakat Payment",
    "description": "Time to calculate and pay your quarterly Zakat",
    "reminderType": "payment",
    "frequency": "quarterly",
    "nextDueDate": "2024-12-31T23:59:59Z",
    "amount": 2500.00,
    "currency": "USD",
    "recipientCategory": "poor",
    "isActive": true,
    "notificationPreferences": {
      "email": true,
      "push": false,
      "sms": false
    },
    "metadata": {
      "calculationMethod": "hanafi",
      "nisabThreshold": 505.75
    },
    "createdAt": "2024-09-29T15:30:00Z",
    "updatedAt": "2024-09-29T15:30:00Z"
  }
}
```

### List Reminders
**GET** `/reminders`

Retrieve user's reminders with filtering options.

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: Filter by status (`active`, `inactive`, `completed`)
- `type`: Filter by reminder type (`payment`, `calculation`, `nisab_check`)
- `upcomingOnly`: Show only upcoming reminders

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "reminder_123",
        "title": "Quarterly Zakat Payment",
        "reminderType": "payment",
        "frequency": "quarterly",
        "nextDueDate": "2024-12-31T23:59:59Z",
        "amount": 2500.00,
        "isActive": true,
        "status": "active"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### Get Reminder
**GET** `/reminders/{reminderId}`

Retrieve specific reminder details.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "reminder_123",
    "title": "Quarterly Zakat Payment",
    "description": "Time to calculate and pay your quarterly Zakat",
    "reminderType": "payment",
    "frequency": "quarterly",
    "nextDueDate": "2024-12-31T23:59:59Z",
    "lastTriggered": "2024-09-29T15:30:00Z",
    "amount": 2500.00,
    "currency": "USD",
    "recipientCategory": "poor",
    "isActive": true,
    "notificationPreferences": {
      "email": true,
      "push": false,
      "sms": false
    },
    "metadata": {
      "calculationMethod": "hanafi",
      "nisabThreshold": 505.75
    },
    "createdAt": "2024-09-29T15:30:00Z",
    "updatedAt": "2024-09-29T15:30:00Z"
  }
}
```

### Update Reminder
**PUT** `/reminders/{reminderId}`

Update existing reminder.

**Request Body:**
```json
{
  "title": "Updated Quarterly Zakat Payment",
  "amount": 2800.00,
  "isActive": false
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "reminder_123",
    "title": "Updated Quarterly Zakat Payment",
    "amount": 2800.00,
    "isActive": false,
    "updatedAt": "2024-09-29T16:00:00Z"
  }
}
```

### Delete Reminder
**DELETE** `/reminders/{reminderId}`

Remove a reminder.

**Success Response (204):** No content

### Acknowledge Reminder
**POST** `/reminders/{reminderId}/acknowledge`

Mark a reminder as acknowledged (snooze or complete).

**Request Body:**
```json
{
  "action": "snooze",
  "snoozeUntil": "2024-10-15T00:00:00Z",
  "notes": "Payment completed, reminder acknowledged"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "reminder_123",
    "status": "acknowledged",
    "nextDueDate": "2024-10-15T00:00:00Z",
    "acknowledgedAt": "2024-09-29T16:00:00Z"
  }
}
```

### Get All Upcoming Reminders
**GET** `/reminders/upcoming/all`

Get all upcoming reminders across all users (admin endpoint).

**Query Parameters:**
- `daysAhead` (integer, optional): Look ahead days (default: 30)
- `limit` (integer, optional): Maximum results

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "reminders": [
      {
        "id": "reminder_123",
        "userId": "user_456",
        "title": "Quarterly Zakat Payment",
        "nextDueDate": "2024-12-31T23:59:59Z",
        "amount": 2500.00,
        "daysUntilDue": 93
      }
    ],
    "total": 25,
    "urgent": 3
  }
}
```

## Enhanced Export Endpoints

### Request Data Export
**POST** `/user/export-request`

Request comprehensive data export including analytics and tracking data.

**Request Body:**
```json
{
  "format": "json",
  "includeAnalytics": true,
  "includeTracking": true,
  "includeReminders": true,
  "dateRange": {
    "startDate": "2023-01-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z"
  },
  "anonymizeSensitive": false,
  "includeMetadata": true
}
```

**Success Response (202):**
```json
{
  "success": true,
  "data": {
    "requestId": "export_req_123",
    "status": "processing",
    "estimatedCompletion": "2024-09-29T15:35:00Z",
    "statusUrl": "/user/export-status/export_req_123",
    "requestedData": {
      "assets": true,
      "calculations": true,
      "payments": true,
      "analytics": true,
      "reminders": true,
      "tracking": true
    }
  }
}
```

### Get Export Status
**GET** `/user/export-status/{requestId}`

Check the status of a data export request.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "requestId": "export_req_123",
    "status": "completed",
    "downloadUrl": "https://api.zakapp.com/downloads/export_req_123.zip",
    "expiresAt": "2024-09-30T15:30:00Z",
    "fileSize": "5.2MB",
    "recordCounts": {
      "assets": 25,
      "calculations": 48,
      "payments": 52,
      "analytics": 365,
      "reminders": 12
    },
    "completedAt": "2024-09-29T15:32:00Z"
  }
}
```

### Backup User Data
**POST** `/user/backup`

Create encrypted backup of all user data.

**Request Body:**
```json
{
  "backupType": "full",
  "encryptionEnabled": true,
  "includeAnalytics": true,
  "retentionDays": 365
}
```

**Success Response (202):**
```json
{
  "success": true,
  "data": {
    "backupId": "backup_123",
    "status": "processing",
    "estimatedCompletion": "2024-09-29T15:35:00Z",
    "backupType": "full",
    "encryptionEnabled": true
  }
}
```

### Restore User Data
**POST** `/user/restore`

Restore user data from backup.

**Request Body:**
```json
{
  "backupId": "backup_123",
  "restoreOptions": {
    "overwriteExisting": false,
    "validateIntegrity": true,
    "restoreAnalytics": true
  }
}
```

**Success Response (202):**
```json
{
  "success": true,
  "data": {
    "restoreId": "restore_123",
    "status": "processing",
    "estimatedCompletion": "2024-09-29T15:40:00Z"
  }
}
```