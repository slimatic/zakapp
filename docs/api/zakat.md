# API Documentation: Zakat Calculation

## Overview

The Zakat Calculation API provides comprehensive Islamic Zakat calculation functionality with support for multiple methodologies, secure asset handling, and educational content.

**Base URL**: `/api/zakat`  
**Authentication**: Mixed (some public endpoints)  
**Content-Type**: `application/json`

---

## Endpoints

### POST /api/zakat/calculate

Calculate Zakat based on encrypted user assets using specified methodology.

**Authentication**: Required  
**Rate Limiting**: 5 calculations per minute per user

#### Request Body

```json
{
  "methodology": "standard",
  "assets": [
    {
      "id": "asset_123",
      "type": "cash",
      "encryptedValue": "encrypted_value_string",
      "currency": "USD",
      "description": "Checking account",
      "lastUpdated": "2024-12-14T10:30:00Z"
    },
    {
      "id": "asset_456", 
      "type": "gold",
      "encryptedValue": "encrypted_gold_value",
      "currency": "USD",
      "description": "22k gold jewelry",
      "lastUpdated": "2024-12-14T10:30:00Z"
    }
  ],
  "nisabSource": "gold"
}
```

#### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `methodology` | `enum` | ✅ | Calculation methodology: `standard`, `hanafi`, `shafii`, `maliki`, `hanbali` |
| `assets` | `array` | ✅ | Array of encrypted asset objects |
| `assets[].id` | `string` | ✅ | Unique asset identifier |
| `assets[].type` | `enum` | ✅ | Asset type: `cash`, `gold`, `silver`, `crypto`, `business`, `investment` |
| `assets[].encryptedValue` | `string` | ✅ | AES-256 encrypted asset value |
| `assets[].currency` | `string` | ✅ | ISO 4217 currency code (3 characters) |
| `assets[].description` | `string` | ❌ | Optional asset description |
| `assets[].lastUpdated` | `datetime` | ✅ | Last update timestamp (ISO 8601) |
| `nisabSource` | `enum` | ❌ | Nisab basis: `gold`, `silver` (default: `gold`) |

#### Response

```json
{
  "success": true,
  "data": {
    "calculation": {
      "id": "calc_abc123",
      "methodology": "standard",
      "totalWealth": 15000.00,
      "nisabThreshold": 4340.00,
      "zakatDue": 375.00,
      "zakatRate": 2.5,
      "isZakatDue": true,
      "breakdown": {
        "cash": {
          "total": 5000.00,
          "zakatable": 5000.00,
          "zakatAmount": 125.00
        },
        "gold": {
          "total": 8000.00,
          "zakatable": 8000.00,
          "zakatAmount": 200.00
        },
        "silver": {
          "total": 2000.00,
          "zakatable": 2000.00,
          "zakatAmount": 50.00
        }
      },
      "educationalContent": {
        "methodology": {
          "name": "Standard (AAOIFI)",
          "description": "International standard for Islamic finance",
          "source": "Accounting and Auditing Organization for Islamic Financial Institutions"
        },
        "guidance": [
          "This calculation follows internationally recognized Islamic finance standards",
          "Gold nisab is used as the primary threshold",
          "All modern financial instruments are included"
        ]
      }
    }
  },
  "metadata": {
    "timestamp": "2024-12-14T10:30:00Z",
    "version": "1.0.0"
  }
}
```

#### Error Responses

**Validation Error (400)**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "methodology",
        "issue": "Invalid methodology type",
        "received": "invalid_method",
        "expected": ["standard", "hanafi", "shafii", "maliki", "hanbali"]
      }
    ]
  }
}
```

**Decryption Error (400)**
```json
{
  "success": false,
  "error": {
    "code": "DECRYPTION_ERROR", 
    "message": "Failed to decrypt asset values",
    "details": ["Invalid encryption format for asset_123"]
  }
}
```

---

### GET /api/zakat/nisab

Get current nisab thresholds for different methodologies.

**Authentication**: Not required (public endpoint)  
**Rate Limiting**: 60 requests per hour per IP

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `methodology` | `enum` | ❌ | Methodology: `standard`, `hanafi`, `shafii`, `maliki`, `hanbali` (default: `standard`) |
| `source` | `enum` | ❌ | Nisab source: `gold`, `silver` (default: `gold`) |

#### Example Request

```
GET /api/zakat/nisab?methodology=hanafi&source=silver
```

#### Response

```json
{
  "success": true,
  "data": {
    "nisab": {
      "methodology": "hanafi",
      "source": "silver",
      "threshold": {
        "amount": 2860.00,
        "currency": "USD",
        "basis": {
          "metal": "silver",
          "weight": "595 grams",
          "pricePerOunce": 24.50,
          "lastUpdated": "2024-12-14T09:00:00Z"
        }
      },
      "goldEquivalent": {
        "amount": 4340.00,
        "weight": "85 grams",
        "pricePerOunce": 1950.00
      },
      "comparison": {
        "isLowerThreshold": true,
        "difference": 1480.00,
        "recommendation": "Use silver nisab for wider Zakat obligation coverage"
      }
    },
    "educational": {
      "purpose": "Nisab is the minimum wealth threshold for Zakat obligation",
      "history": "Based on Prophetic traditions specifying gold and silver amounts",
      "modernApplication": "Contemporary scholars adapt nisab to current precious metal prices",
      "methodologySpecific": {
        "hanafi": "Traditionally emphasizes silver nisab for lower threshold",
        "standard": "Uses gold nisab following contemporary Islamic finance standards"
      }
    }
  },
  "metadata": {
    "timestamp": "2024-12-14T10:30:00Z",
    "version": "1.0.0"
  }
}
```

---

### GET /api/zakat/methodologies

Get available Zakat calculation methodologies with descriptions.

**Authentication**: Not required (public endpoint)  
**Rate Limiting**: 60 requests per hour per IP

#### Response

```json
{
  "success": true,
  "data": {
    "methodologies": [
      {
        "id": "standard",
        "name": "Standard (AAOIFI)",
        "description": "International standard following AAOIFI guidelines",
        "characteristics": {
          "nisabBasis": "gold",
          "zakatRate": 2.5,
          "calendarSystem": "flexible",
          "assetCoverage": "comprehensive",
          "modernInstruments": true
        },
        "recommendations": {
          "bestFor": ["international users", "modern portfolios", "contemporary guidance"],
          "jurisdiction": "global",
          "complexity": "moderate"
        }
      },
      {
        "id": "hanafi",
        "name": "Hanafi School",
        "description": "Traditional Hanafi jurisprudential approach",
        "characteristics": {
          "nisabBasis": "silver",
          "zakatRate": 2.5,
          "calendarSystem": "hijri",
          "assetCoverage": "traditional",
          "modernInstruments": false
        },
        "recommendations": {
          "bestFor": ["Hanafi followers", "traditional assets", "lower wealth thresholds"],
          "jurisdiction": "South Asia, Central Asia, Turkey",
          "complexity": "simple"
        }
      },
      {
        "id": "shafii",
        "name": "Shafi'i School", 
        "description": "Shafi'i school interpretations with market emphasis",
        "characteristics": {
          "nisabBasis": "gold",
          "zakatRate": 2.5,
          "calendarSystem": "flexible",
          "assetCoverage": "market-based",
          "modernInstruments": true
        },
        "recommendations": {
          "bestFor": ["Shafi'i followers", "investment portfolios", "market valuations"],
          "jurisdiction": "Southeast Asia, East Africa",
          "complexity": "moderate"
        }
      }
    ],
    "educational": {
      "level": "beginner",
      "content": [
        {
          "topic": "Choosing a Methodology",
          "explanation": "Select based on your Islamic school of thought and asset types",
          "guidance": [
            "Follow your traditional school if known",
            "Use Standard for international compliance",
            "Consider Hanafi for broader Zakat coverage"
          ]
        },
        {
          "topic": "Methodology Differences",
          "explanation": "Main differences are in nisab thresholds and asset treatment",
          "keyPoints": [
            "Nisab basis (gold vs silver) affects threshold amount",
            "Calendar system impacts calculation timing",
            "Asset coverage determines what wealth is included"
          ]
        }
      ]
    }
  },
  "metadata": {
    "timestamp": "2024-12-14T10:30:00Z",
    "version": "1.0.0"
  }
}
```

---

## Methodology Details

### Supported Methodologies

1. **Standard (AAOIFI)** (`standard`)
   - **Nisab**: Gold-based (85 grams = ~$4,340 USD)
   - **Assets**: Comprehensive modern coverage
   - **Calendar**: Flexible (Gregorian/Hijri)
   - **Best For**: International users, modern portfolios

2. **Hanafi School** (`hanafi`)
   - **Nisab**: Silver-based (595 grams = ~$2,860 USD)
   - **Assets**: Traditional categories
   - **Calendar**: Hijri preferred
   - **Best For**: Traditional assets, lower thresholds

3. **Shafi'i School** (`shafii`)
   - **Nisab**: Gold-based with market emphasis
   - **Assets**: Market value focus
   - **Calendar**: Flexible
   - **Best For**: Investment portfolios

4. **Maliki School** (`maliki`)
   - **Nisab**: Traditional with regional adaptations
   - **Assets**: Community-focused
   - **Calendar**: Hijri traditional
   - **Best For**: North African contexts

5. **Hanbali School** (`hanbali`)
   - **Nisab**: Conservative traditional approach
   - **Assets**: Strict traditional categories
   - **Calendar**: Hijri
   - **Best For**: Conservative interpretations

---

## Asset Type Handling

### Supported Asset Types

| Type | Description | Encryption | Calculation Method |
|------|-------------|------------|-------------------|
| `cash` | Cash, bank deposits, liquid funds | ✅ | Direct market value |
| `gold` | Gold jewelry, coins, bars | ✅ | Weight × current gold price |
| `silver` | Silver items, coins, bars | ✅ | Weight × current silver price |
| `crypto` | Cryptocurrency holdings | ✅ | Current market value |
| `business` | Business inventory, assets | ✅ | Market value assessment |
| `investment` | Stocks, bonds, mutual funds | ✅ | Current market value |

### Asset Value Encryption

All asset values are encrypted using AES-256-CBC:

1. **Key Derivation**: User-specific keys derived from user ID + salt
2. **Encryption**: Asset values encrypted before storage
3. **Calculation**: Values decrypted temporarily for Zakat calculation
4. **Security**: Decrypted values never logged or stored

---

## Educational Content

### Methodology Guidance

Each calculation response includes educational content explaining:

- **Methodology Source**: Historical and scholarly basis
- **Calculation Logic**: Why specific rules apply
- **Islamic Compliance**: Jurisprudential validation
- **Contemporary Application**: Modern interpretation

### User Learning

The API provides progressive educational content:

- **Beginner**: Basic concepts and simple guidance
- **Intermediate**: Methodology comparisons and edge cases
- **Advanced**: Complex scenarios and scholarly discussions

---

## Rate Limiting

| Endpoint | Limit | Window | Notes |
|----------|-------|--------|-------|
| `/calculate` | 5 requests | 1 minute | Calculation intensive |
| `/nisab` | 60 requests | 1 hour | Public data |
| `/methodologies` | 60 requests | 1 hour | Public data |

Rate limit headers included in responses:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

---

## Security Features

### Data Protection

1. **Asset Encryption**: All financial data encrypted at rest
2. **Key Management**: User-specific encryption keys
3. **Secure Transmission**: HTTPS/TLS for all communications
4. **No Logging**: Sensitive data excluded from logs

### Authentication

1. **JWT Tokens**: Secure authentication for user endpoints
2. **Token Expiration**: Regular token refresh required
3. **Public Endpoints**: Methodology info available without auth

### Validation

1. **Input Validation**: Comprehensive request validation
2. **Type Safety**: Strong typing for all data structures
3. **Range Checks**: Asset values and parameters validated
4. **Islamic Compliance**: Calculations verified against Islamic law

---

## Error Handling

### Common Errors

| Code | Status | Description | Resolution |
|------|--------|-------------|------------|
| `VALIDATION_ERROR` | 400 | Invalid request format | Check request schema |
| `DECRYPTION_ERROR` | 400 | Cannot decrypt asset | Verify encryption format |
| `UNAUTHORIZED` | 401 | Authentication required | Provide valid JWT token |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Wait and retry |
| `ZAKAT_CALCULATION_ERROR` | 500 | Calculation failed | Contact support |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable description",
    "details": ["Additional error information"]
  },
  "metadata": {
    "timestamp": "2024-12-14T10:30:00Z",
    "version": "1.0.0"
  }
}
```

---

## Usage Examples

### Basic Calculation

```bash
curl -X POST /api/zakat/calculate \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "methodology": "standard",
    "assets": [
      {
        "id": "asset_1",
        "type": "cash",
        "encryptedValue": "encrypted_5000_00",
        "currency": "USD",
        "lastUpdated": "2024-12-14T10:30:00Z"
      }
    ],
    "nisabSource": "gold"
  }'
```

### Get Nisab Information

```bash
curl -X GET "/api/zakat/nisab?methodology=hanafi&source=silver"
```

### List Methodologies

```bash
curl -X GET /api/zakat/methodologies
```