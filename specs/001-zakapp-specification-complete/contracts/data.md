# API Contract: Data Export & Utilities Endpoints

## GET /api/data/export/formats

**Purpose**: Get available export formats and their capabilities

### Response Success (200)
```json
{
  "success": true,
  "formats": [
    {
      "id": "json",
      "name": "JSON Format",
      "description": "Complete data in JSON structure",
      "mimeType": "application/json",
      "extension": ".json",
      "features": {
        "includesMetadata": true,
        "humanReadable": false,
        "programmaticallyParseable": true,
        "fileSize": "small"
      },
      "supportedScopes": ["all", "assets", "calculations", "payments", "snapshots"]
    },
    {
      "id": "csv",
      "name": "CSV Format", 
      "description": "Spreadsheet-compatible comma-separated values",
      "mimeType": "text/csv",
      "extension": ".csv",
      "features": {
        "includesMetadata": false,
        "humanReadable": true,
        "programmaticallyParseable": true,
        "fileSize": "small"
      },
      "supportedScopes": ["assets", "calculations", "payments", "snapshots"],
      "limitations": ["Flattened structure", "No nested objects"]
    },
    {
      "id": "pdf",
      "name": "PDF Report",
      "description": "Formatted document with charts and summaries",
      "mimeType": "application/pdf", 
      "extension": ".pdf",
      "features": {
        "includesMetadata": true,
        "humanReadable": true,
        "programmaticallyParseable": false,
        "fileSize": "large"
      },
      "supportedScopes": ["summary", "annual-report"],
      "limitations": ["Read-only format", "No raw data"]
    }
  ]
}
```

---

## POST /api/data/export

**Purpose**: Create data export with custom parameters

**Headers**: `Authorization: Bearer {accessToken}`

### Request
```json
{
  "format": "json" | "csv" | "pdf",
  "scope": "all" | "assets" | "calculations" | "payments" | "snapshots" | "summary" | "annual-report",
  "filters": {
    "dateRange": {
      "from": "string", // ISO date
      "to": "string" // ISO date  
    },
    "categories": ["string"], // Asset categories to include
    "includeDeleted": "boolean",
    "anonymize": "boolean" // Remove identifying information
  },
  "options": {
    "includeCharts": "boolean", // For PDF format
    "language": "string", // Report language
    "currency": "string", // Convert values to specified currency
    "timezone": "string" // Adjust timestamps
  },
  "password": "string", // Required for security verification
  "deliveryMethod": "download" | "email" // How to deliver the export
}
```

### Response Success (202)
```json
{
  "success": true,
  "exportId": "string",
  "message": "Export job created successfully",
  "estimatedDuration": "number", // seconds
  "status": "queued",
  "deliveryMethod": "download" | "email"
}
```

### Response Error (400)
```json
{
  "success": false,
  "error": "INVALID_EXPORT_REQUEST",
  "message": "Export configuration is invalid",
  "details": [
    {
      "field": "scope",
      "message": "Scope 'summary' not supported for CSV format",
      "code": "INCOMPATIBLE_FORMAT_SCOPE"
    }
  ]
}
```

---

## GET /api/data/export/:exportId

**Purpose**: Get export job status and download link

**Headers**: `Authorization: Bearer {accessToken}`

### Response Success (200)
```json
{
  "success": true,
  "export": {
    "id": "string",
    "format": "string",
    "scope": "string", 
    "status": "queued" | "processing" | "completed" | "failed",
    "progress": "number", // 0-100 percentage
    "createdAt": "string",
    "startedAt": "string", // null if not started
    "completedAt": "string", // null if not completed
    "fileSize": "number", // bytes, available when completed
    "downloadUrl": "string", // Available when completed
    "downloadExpires": "string", // Download link expiration
    "deliveryMethod": "string",
    "error": "string" // Error message if failed
  }
}
```

---

## DELETE /api/data/export/:exportId

**Purpose**: Cancel pending export or delete completed export file

**Headers**: `Authorization: Bearer {accessToken}`

### Response Success (200)
```json
{
  "success": true,
  "message": "Export cancelled/deleted successfully"
}
```

---

## GET /api/data/summary

**Purpose**: Get account data summary and statistics

**Headers**: `Authorization: Bearer {accessToken}`

### Query Parameters
- `period`: Time period for statistics (7d, 30d, 90d, 1y, all)
- `currency`: Currency for value calculations

### Response Success (200)
```json
{
  "success": true,
  "summary": {
    "account": {
      "createdAt": "string",
      "daysActive": "number",
      "lastActivity": "string",
      "dataRetentionExpiry": "string" // When data will be auto-deleted
    },
    "assets": {
      "totalCount": "number",
      "totalValue": "number",
      "currency": "string",
      "byCategory": [
        {
          "category": "string",
          "count": "number",
          "totalValue": "number",
          "percentage": "number"
        }
      ],
      "growthRate": "number", // Percentage change over period
      "lastUpdated": "string"
    },
    "calculations": {
      "totalCount": "number",
      "methodologyUsage": {
        "standard": "number",
        "hanafi": "number",
        "custom": "number"
      },
      "averageZakatAmount": "number",
      "totalZakatCalculated": "number",
      "lastCalculation": "string"
    },
    "payments": {
      "totalCount": "number", 
      "totalAmount": "number",
      "currency": "string",
      "byYear": [
        {
          "year": "string", // Islamic year
          "count": "number",
          "amount": "number"
        }
      ],
      "averagePayment": "number",
      "lastPayment": "string"
    },
    "snapshots": {
      "totalCount": "number",
      "byType": {
        "annual": "number",
        "custom": "number", 
        "backup": "number"
      },
      "oldestSnapshot": "string",
      "newestSnapshot": "string"
    },
    "usage": {
      "loginCount": "number",
      "lastLogin": "string",
      "featuresUsed": ["string"],
      "deviceCount": "number",
      "exportCount": "number"
    }
  }
}
```

---

## POST /api/data/backup

**Purpose**: Create complete data backup

**Headers**: `Authorization: Bearer {accessToken}`

### Request
```json
{
  "includeDeleted": "boolean",
  "encryptBackup": "boolean", // Client-side encryption recommended
  "password": "string" // User verification
}
```

### Response Success (202)
```json
{
  "success": true,
  "backupId": "string",
  "message": "Backup creation initiated",
  "estimatedSize": "number", // bytes
  "estimatedDuration": "number" // seconds
}
```

---

## POST /api/data/restore

**Purpose**: Restore data from backup (DESTRUCTIVE - replaces current data)

**Headers**: `Authorization: Bearer {accessToken}`

### Request
```json
{
  "backupData": "string", // Base64 encoded backup data
  "restoreMode": "complete" | "merge" | "assets_only" | "calculations_only",
  "confirmationText": "I understand this will replace my current data",
  "password": "string",
  "totpCode": "string" // Required if 2FA enabled
}
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Data restore completed successfully",
  "summary": {
    "assetsRestored": "number",
    "calculationsRestored": "number", 
    "paymentsRestored": "number",
    "snapshotsRestored": "number",
    "conflictsResolved": "number"
  }
}
```

### Response Error (400)
```json
{
  "success": false,
  "error": "INVALID_BACKUP_DATA",
  "message": "Backup data is corrupted or invalid",
  "details": [
    {
      "issue": "SCHEMA_MISMATCH",
      "description": "Backup was created with an incompatible version",
      "suggestion": "Please contact support for migration assistance"
    }
  ]
}
```

---

## DELETE /api/data/cleanup

**Purpose**: Delete old or unnecessary data based on retention policies

**Headers**: `Authorization: Bearer {accessToken}`

### Request
```json
{
  "cleanupType": "expired_exports" | "old_snapshots" | "deleted_items" | "activity_logs",
  "olderThanDays": "number", // Optional age threshold
  "confirmDeletion": "boolean",
  "password": "string"
}
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Data cleanup completed",
  "summary": {
    "itemsDeleted": "number",
    "spaceFreed": "number", // bytes
    "categories": [
      {
        "type": "string",
        "count": "number",
        "size": "number"
      }
    ]
  }
}
```

---

## GET /api/system/health

**Purpose**: Get system health and status information (public endpoint)

### Response Success (200)
```json
{
  "success": true,
  "status": "healthy" | "degraded" | "maintenance",
  "version": "string",
  "uptime": "number", // seconds
  "services": {
    "database": "healthy" | "degraded" | "down",
    "authentication": "healthy" | "degraded" | "down",
    "encryption": "healthy" | "degraded" | "down",
    "exportService": "healthy" | "degraded" | "down"
  },
  "maintenance": {
    "scheduled": "boolean",
    "startTime": "string", // null if no maintenance
    "endTime": "string", // null if no maintenance
    "description": "string"
  }
}
```

---

## GET /api/system/currencies

**Purpose**: Get supported currencies and current exchange rates

### Response Success (200)
```json
{
  "success": true,
  "currencies": [
    {
      "code": "USD",
      "name": "US Dollar",
      "symbol": "$",
      "decimals": 2,
      "isBase": true
    },
    {
      "code": "EUR", 
      "name": "Euro",
      "symbol": "€", 
      "decimals": 2,
      "exchangeRate": "number", // Rate to base currency
      "lastUpdated": "string"
    }
  ],
  "ratesLastUpdated": "string",
  "rateSource": "string"
}
```

---

## GET /api/system/timezones

**Purpose**: Get supported timezones for user preferences

### Response Success (200)
```json
{
  "success": true,
  "timezones": [
    {
      "id": "America/New_York",
      "name": "Eastern Time (New York)",
      "offset": "-05:00", // Current UTC offset
      "offsetDST": "-04:00", // DST offset
      "country": "United States"
    }
  ],
  "regions": [
    {
      "name": "North America",
      "timezones": ["string"] // timezone IDs in this region
    }
  ]
}
```