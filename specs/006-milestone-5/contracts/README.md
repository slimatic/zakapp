# API Contracts: Milestone 5

**Status**: ✅ Complete (Retrospective Documentation)  
**Date**: October 26, 2025  
**OpenAPI Version**: 3.0.3

---

## Overview

This directory contains OpenAPI 3.0 specifications for all Milestone 5 (Tracking & Analytics System) endpoints. These contracts define the API surface area, request/response schemas, validation rules, and examples.

---

## Available Contracts

### 1. **payments.openapi.yaml**
Payment record management API

**Endpoints**:
- `POST /api/payments` - Create payment record
- `GET /api/payments` - List payments with filtering
- `GET /api/payments/:id` - Get single payment
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment

**Key Features**:
- AES-256 encryption for sensitive fields (amount, recipient, notes)
- Date range filtering
- Category and payment method filtering
- Pagination support
- Full CRUD operations

**Authentication**: Required (Bearer JWT)

---

### 2. **reminders.openapi.yaml**
Reminder notification system API

**Endpoints**:
- `POST /api/reminders` - Create reminder
- `GET /api/reminders` - List reminders with filtering
- `GET /api/reminders/:id` - Get single reminder
- `PUT /api/reminders/:id` - Update reminder (acknowledge/dismiss)
- `DELETE /api/reminders/:id` - Delete reminder

**Event Types**:
- `zakat_anniversary_approaching` - Zakat due date approaching
- `calculation_overdue` - Calculation not completed
- `payment_incomplete` - Payment not fulfilled
- `yearly_comparison_available` - New year data ready
- `data_backup_reminder` - Time to backup
- `methodology_review` - Review calculation methodology

**Authentication**: Required (Bearer JWT)

---

### 3. **analytics.openapi.yaml**
Analytics and insights API

**Endpoints**:
- `GET /api/analytics/summary` - Comprehensive analytics summary
- `GET /api/analytics/metrics` - Specific metrics with custom date ranges
- `GET /api/analytics/trends` - Trend analysis for charts
- `GET /api/analytics/comparison` - Year-over-year comparison

**Metric Types**:
- `wealth_trend` - Wealth changes over time
- `zakat_trend` - Zakat obligations over time
- `payment_distribution` - Payments by category
- `asset_composition` - Asset breakdown
- `yearly_comparison` - Multi-year comparison

**Data Computation**: All metrics computed on-demand (no caching)

**Authentication**: Required (Bearer JWT)

---

### 4. **export.openapi.yaml**
Data export and portability API

**Endpoints**:
- `POST /api/export/full` - Export all user data
- `POST /api/export/assets` - Export assets only
- `POST /api/export/zakat-history` - Export Zakat calculations
- `POST /api/export/payments` - Export payment records
- `GET /api/export/templates` - Available export templates
- `POST /api/export/custom` - Custom export with field selection
- `GET /api/export/status/:exportId` - Check export status
- `GET /api/export/download/:exportId` - Download completed export
- `DELETE /api/export/:exportId` - Delete export file

**Supported Formats**:
- CSV (comma-separated values)
- PDF (professional documents)
- JSON (machine-readable)

**Export Lifecycle**:
1. Initiate export → receive `exportId`
2. Poll status endpoint → check `status` field
3. When `status === "completed"` → download file
4. Files expire after 24 hours
5. Optionally delete early to clean up

**Authentication**: Required (Bearer JWT)

---

## Usage

### 1. Viewing Contracts

Use any OpenAPI-compatible tool:

**Swagger UI** (online):
```bash
# Upload YAML files to https://editor.swagger.io/
```

**Swagger UI** (local):
```bash
npm install -g swagger-ui-express
npx swagger-ui-serve payments.openapi.yaml
```

**Redoc** (beautiful docs):
```bash
npm install -g redoc-cli
redoc-cli serve payments.openapi.yaml
```

**VS Code Extension**:
- Install "OpenAPI (Swagger) Editor" extension
- Open `.yaml` file → right-click → "Preview Swagger"

---

### 2. Generating Client SDKs

**TypeScript Client**:
```bash
npm install -g @openapitools/openapi-generator-cli

openapi-generator-cli generate \
  -i payments.openapi.yaml \
  -g typescript-fetch \
  -o ./client/generated/payments
```

**Python Client**:
```bash
openapi-generator-cli generate \
  -i payments.openapi.yaml \
  -g python \
  -o ./sdk/python/payments
```

**Other Languages**: Supports 50+ languages (Java, Go, PHP, Ruby, etc.)

---

### 3. Validation

**Validate Syntax**:
```bash
npm install -g @apidevtools/swagger-cli

swagger-cli validate payments.openapi.yaml
swagger-cli validate reminders.openapi.yaml
swagger-cli validate analytics.openapi.yaml
swagger-cli validate export.openapi.yaml
```

**Lint for Best Practices**:
```bash
npm install -g @stoplight/spectral-cli

spectral lint payments.openapi.yaml
```

---

### 4. Testing Against Contracts

**Using Postman**:
1. Import YAML file into Postman
2. Auto-generates collection with all endpoints
3. Pre-filled examples for testing

**Using Dredd** (contract testing):
```bash
npm install -g dredd

dredd payments.openapi.yaml http://localhost:3001
```

**Using Prism** (mock server):
```bash
npm install -g @stoplight/prism-cli

prism mock payments.openapi.yaml
# Mock server runs on http://localhost:4010
```

---

## Contract Standards

### Security

All endpoints require authentication:
```yaml
security:
  - BearerAuth: []
```

**BearerAuth**:
- Type: HTTP Bearer
- Format: JWT
- Obtained from: `POST /api/auth/login`

**Authorization**: Users can only access their own data (enforced server-side)

---

### Response Format

**Success Response**:
```json
{
  "success": true,
  "data": {
    // Response payload
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

**HTTP Status Codes**:
- `200` - Success (GET, PUT, DELETE)
- `201` - Created (POST)
- `202` - Accepted (async operations like exports)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found
- `500` - Internal Server Error

---

### Data Encryption

**Encrypted Fields** (PaymentRecord):
- `amount` → stored as `encryptedAmount`
- `recipient` → encrypted before storage
- `notes` → encrypted before storage

**Encryption Method**:
- Algorithm: AES-256-CBC
- Key: User-specific derived from master key
- Format: `base64(IV):base64(CipherText)`

**Contract Representation**:
- API contracts show **decrypted** values
- Encryption is transparent to API consumers
- Server handles encryption/decryption automatically

---

### Pagination

**Query Parameters**:
- `limit` - Results per page (default: 20, max: 100)
- `offset` - Number of results to skip

**Example**:
```http
GET /api/payments?limit=20&offset=40
```

**Note**: Cursor-based pagination may be implemented in future versions for better performance

---

### Date Formats

**ISO 8601 Format**:
```
2025-01-15T10:30:00Z  (UTC)
2025-01-15T10:30:00+05:00  (with timezone)
```

**Date-only fields** use same format with midnight time:
```
2025-01-15T00:00:00Z
```

---

## Implementation Status

| Contract | Status | Implementation | Tests | Notes |
|----------|--------|----------------|-------|-------|
| **payments.openapi.yaml** | ✅ Complete | ✅ T014-T016 | ✅ T005-T011 | Encryption working |
| **reminders.openapi.yaml** | ✅ Complete | ✅ T018-T020 | ✅ T005-T011 | Event types finalized |
| **analytics.openapi.yaml** | ✅ Complete | ✅ T017, T021-T023 | ✅ T005-T011 | On-demand computation |
| **export.openapi.yaml** | ✅ Complete | ✅ T024-T027 | ✅ T005-T011 | All formats supported |

---

## Versioning

**Current Version**: 1.0.0

**Versioning Strategy** (for future):
- Major version in URL: `/api/v2/payments`
- Maintain backwards compatibility for 6 months
- Deprecation warnings in response headers

**Current Approach**:
- No versioning yet (initial release)
- Breaking changes require new major version
- Additive changes OK in current version

---

## Related Documentation

- **Specification**: `../spec.md` - Feature requirements
- **Data Model**: `../data-model.md` - Database schemas
- **Implementation**: `../tasks.md` - Task breakdown
- **Research**: `../research.md` - Technical decisions

---

## Support

For questions or issues:
1. Check contract examples for usage patterns
2. Review implementation in `/server/src/routes/`
3. Consult data model documentation
4. Run mock server to test locally

---

**Last Updated**: October 26, 2025  
**Maintained By**: ZakApp Development Team  
**Version**: 1.0.0
