# API Contract: Authentication Endpoints

## POST /api/auth/register

**Purpose**: Create new user account with encrypted storage initialization

### Request
```json
{
  "email": "string", // Valid email format, unique
  "password": "string", // Min 8 chars, mixed case, numbers, symbols  
  "name": "string", // Full name for Islamic personalization
  "preferredMethodology": "standard" | "hanafi" | "shafi_i" | "custom",
  "currency": "string", // ISO 4217 code (default: "USD")
  "language": "string" // Language preference (default: "en")
}
```

### Response Success (201)
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "string", // UUID
    "email": "string",
    "name": "string",
    "settings": {
      "preferredMethodology": "string",
      "currency": "string",
      "language": "string"
    }
  },
  "tokens": {
    "accessToken": "string", // JWT, 15min expiry
    "refreshToken": "string", // JWT, 7day expiry
    "expiresIn": "number" // Seconds until access token expires
  }
}
```

### Response Error (400)
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "details": [
    {
      "field": "string", // Field name with error
      "message": "string" // Specific validation error
    }
  ]
}
```

### Response Error (409)
```json
{
  "success": false,
  "error": "EMAIL_EXISTS",
  "message": "Email address is already registered"
}
```

---

## POST /api/auth/login

**Purpose**: Authenticate user and return JWT tokens

### Request
```json
{
  "email": "string",
  "password": "string"
}
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "string",
    "email": "string", 
    "name": "string",
    "lastLoginAt": "string" // ISO timestamp
  },
  "tokens": {
    "accessToken": "string",
    "refreshToken": "string", 
    "expiresIn": "number"
  }
}
```

### Response Error (401)
```json
{
  "success": false,
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email or password"
}
```

### Response Error (429)
```json
{
  "success": false,
  "error": "RATE_LIMITED", 
  "message": "Too many login attempts. Try again later.",
  "retryAfter": "number" // Seconds until retry allowed
}
```

---

## POST /api/auth/refresh

**Purpose**: Refresh access token using valid refresh token

### Request
```json
{
  "refreshToken": "string"
}
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "tokens": {
    "accessToken": "string",
    "refreshToken": "string", // New refresh token
    "expiresIn": "number"
  }
}
```

### Response Error (401)
```json
{
  "success": false,
  "error": "INVALID_REFRESH_TOKEN",
  "message": "Refresh token is invalid or expired"
}
```

---

## POST /api/auth/logout

**Purpose**: Terminate user session and invalidate tokens

**Headers**: `Authorization: Bearer {accessToken}`

### Request
```json
{
  "refreshToken": "string" // Optional, for complete logout
}
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## GET /api/auth/me

**Purpose**: Get current authenticated user information

**Headers**: `Authorization: Bearer {accessToken}`

### Response Success (200)
```json
{
  "success": true,
  "user": {
    "id": "string",
    "email": "string",
    "name": "string", 
    "settings": {
      "preferredMethodology": "string",
      "currency": "string",
      "language": "string",
      "reminders": "boolean",
      "calendarType": "lunar" | "solar"
    },
    "createdAt": "string",
    "lastLoginAt": "string"
  }
}
```

### Response Error (401)
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Valid access token required"
}
```

---

## POST /api/auth/reset-password

**Purpose**: Initiate password reset process

### Request
```json
{
  "email": "string"
}
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Password reset instructions sent to email"
}
```

**Note**: Always returns success to prevent email enumeration attacks

---

## POST /api/auth/confirm-reset

**Purpose**: Complete password reset with token

### Request
```json
{
  "resetToken": "string",
  "newPassword": "string" // Must meet strength requirements
}
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

### Response Error (400)
```json
{
  "success": false,
  "error": "INVALID_TOKEN",
  "message": "Reset token is invalid or expired"
}
```