# API Contract: User Management Endpoints

## GET /api/user/profile

**Purpose**: Get current user's profile information

**Headers**: `Authorization: Bearer {accessToken}`

### Response Success (200)
```json
{
  "success": true,
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "preferences": {
      "currency": "string",
      "language": "string",
      "timezone": "string",
      "theme": "light" | "dark" | "auto",
      "zakatReminders": {
        "enabled": "boolean",
        "frequency": "monthly" | "quarterly" | "annually",
        "daysBeforeHijri": "number"
      },
      "privacySettings": {
        "dataRetentionPeriod": "number", // years
        "allowDataExport": "boolean",
        "shareAnonymousUsage": "boolean"
      }
    },
    "membership": {
      "status": "active" | "inactive",
      "plan": "free" | "premium",
      "joinDate": "string",
      "lastActive": "string"
    },
    "settings": {
      "twoFactorEnabled": "boolean",
      "emailNotifications": "boolean",
      "defaultZakatMethodology": "string",
      "defaultCalendarType": "lunar" | "solar"
    }
  }
}
```

---

## PUT /api/user/profile

**Purpose**: Update user profile and preferences

**Headers**: `Authorization: Bearer {accessToken}`

### Request
```json
{
  "username": "string", // Optional
  "preferences": {
    "currency": "string",
    "language": "string", 
    "timezone": "string",
    "theme": "light" | "dark" | "auto",
    "zakatReminders": {
      "enabled": "boolean",
      "frequency": "monthly" | "quarterly" | "annually",
      "daysBeforeHijri": "number"
    },
    "privacySettings": {
      "dataRetentionPeriod": "number",
      "allowDataExport": "boolean", 
      "shareAnonymousUsage": "boolean"
    }
  },
  "settings": {
    "emailNotifications": "boolean",
    "defaultZakatMethodology": "string",
    "defaultCalendarType": "lunar" | "solar"
  }
}
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    // Updated user object (same structure as GET /profile)
  }
}
```

### Response Error (400)
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid profile data",
  "details": [
    {
      "field": "username",
      "message": "Username already taken",
      "code": "DUPLICATE_USERNAME"
    }
  ]
}
```

---

## POST /api/user/change-password

**Purpose**: Change user password (requires current password)

**Headers**: `Authorization: Bearer {accessToken}`

### Request
```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Response Error (400)
```json
{
  "success": false,
  "error": "INVALID_CURRENT_PASSWORD",
  "message": "Current password is incorrect"
}
```

---

## POST /api/user/setup-2fa

**Purpose**: Enable two-factor authentication

**Headers**: `Authorization: Bearer {accessToken}`

### Response Success (200)
```json
{
  "success": true,
  "setup": {
    "secret": "string", // TOTP secret for QR code generation
    "qrCodeUrl": "string", // Data URL for QR code image
    "backupCodes": ["string"], // One-time use backup codes
    "instructions": "string" // Setup instructions for user
  }
}
```

---

## POST /api/user/verify-2fa

**Purpose**: Complete two-factor authentication setup

**Headers**: `Authorization: Bearer {accessToken}`

### Request
```json
{
  "totpCode": "string" // 6-digit code from authenticator app
}
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Two-factor authentication enabled successfully",
  "backupCodes": ["string"] // Final backup codes (store securely)
}
```

### Response Error (400)
```json
{
  "success": false,
  "error": "INVALID_TOTP_CODE",
  "message": "Invalid verification code"
}
```

---

## POST /api/user/disable-2fa

**Purpose**: Disable two-factor authentication

**Headers**: `Authorization: Bearer {accessToken}`

### Request
```json
{
  "password": "string",
  "totpCode": "string" // Current 2FA code
}
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Two-factor authentication disabled successfully"
}
```

---

## GET /api/user/backup-codes

**Purpose**: Regenerate 2FA backup codes

**Headers**: `Authorization: Bearer {accessToken}`

### Request
```json
{
  "password": "string" // User password for security verification
}
```

### Response Success (200)
```json
{
  "success": true,
  "backupCodes": ["string"], // New one-time use codes
  "message": "Backup codes regenerated successfully"
}
```

---

## POST /api/user/export-data

**Purpose**: Request data export (GDPR compliance)

**Headers**: `Authorization: Bearer {accessToken}`

### Request
```json
{
  "format": "json" | "csv" | "pdf",
  "includeDeleted": "boolean", // Include soft-deleted records
  "anonymize": "boolean", // Remove PII where possible
  "password": "string" // Confirm user identity
}
```

### Response Success (202)
```json
{
  "success": true,
  "exportId": "string",
  "message": "Data export initiated",
  "estimatedCompletionTime": "string", // ISO timestamp
  "notificationMethod": "email" | "download"
}
```

---

## GET /api/user/export-data/:exportId/status

**Purpose**: Check data export status

**Headers**: `Authorization: Bearer {accessToken}`

### Response Success (200)
```json
{
  "success": true,
  "export": {
    "id": "string",
    "status": "pending" | "processing" | "completed" | "failed",
    "progress": "number", // 0-100 percentage
    "format": "string",
    "requestedAt": "string",
    "completedAt": "string", // null if not completed
    "downloadUrl": "string", // Available when completed
    "expiresAt": "string" // Download link expiration
  }
}
```

---

## DELETE /api/user/account

**Purpose**: Delete user account and all associated data

**Headers**: `Authorization: Bearer {accessToken}`

### Request
```json
{
  "password": "string",
  "confirmDeletion": "I understand this action cannot be undone",
  "reason": "string", // Optional feedback
  "totpCode": "string" // Required if 2FA is enabled
}
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Account deletion scheduled",
  "deletionDate": "string", // Actual deletion date (after grace period)
  "gracePeriodDays": "number" // Days to cancel deletion
}
```

---

## POST /api/user/cancel-deletion

**Purpose**: Cancel pending account deletion during grace period

**Headers**: `Authorization: Bearer {accessToken}`

### Request
```json
{
  "password": "string",
  "totpCode": "string" // Required if 2FA enabled
}
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Account deletion cancelled successfully"
}
```

---

## GET /api/user/activity

**Purpose**: Get user activity log and security events

**Headers**: `Authorization: Bearer {accessToken}`

### Query Parameters
- `limit`: Number of records (default 20, max 100)
- `offset`: Pagination offset
- `type`: Filter by activity type (optional)
- `from`: Start date filter (ISO string)
- `to`: End date filter (ISO string)

### Response Success (200)
```json
{
  "success": true,
  "activities": [
    {
      "id": "string",
      "type": "login" | "logout" | "password_change" | "profile_update" | "asset_created" | "zakat_calculated" | "data_exported" | "security_event",
      "description": "string",
      "ipAddress": "string",
      "userAgent": "string",
      "location": {
        "city": "string",
        "country": "string"
      },
      "metadata": "object", // Additional context data
      "timestamp": "string",
      "riskLevel": "low" | "medium" | "high" // Security assessment
    }
  ],
  "pagination": {
    "total": "number",
    "limit": "number",
    "offset": "number",
    "hasMore": "boolean"
  }
}
```

---

## GET /api/user/sessions

**Purpose**: Get active login sessions

**Headers**: `Authorization: Bearer {accessToken}`

### Response Success (200)
```json
{
  "success": true,
  "sessions": [
    {
      "id": "string",
      "device": "string", // Parsed user agent
      "browser": "string",
      "os": "string", 
      "ipAddress": "string",
      "location": {
        "city": "string",
        "country": "string"
      },
      "isCurrent": "boolean",
      "lastActive": "string",
      "createdAt": "string",
      "expiresAt": "string"
    }
  ]
}
```

---

## DELETE /api/user/sessions/:sessionId

**Purpose**: Terminate a specific session

**Headers**: `Authorization: Bearer {accessToken}`

### Response Success (200)
```json
{
  "success": true,
  "message": "Session terminated successfully"
}
```

---

## DELETE /api/user/sessions

**Purpose**: Terminate all sessions except current

**Headers**: `Authorization: Bearer {accessToken}`

### Response Success (200)
```json
{
  "success": true,
  "message": "All other sessions terminated",
  "terminatedCount": "number"
}
```