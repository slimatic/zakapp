# Development Environment Setup

## Backend Development Environment Variables

For development and testing, create a `.env` file in the `backend/` directory with the following content:

```env
# Backend Environment Configuration

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# JWT Configuration
# IMPORTANT: Change JWT_SECRET in production to a secure random string!
JWT_SECRET=your-super-secure-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Data Storage Configuration
DATA_DIR=./data

# Security Settings
# Password hashing rounds (higher = more secure but slower)
BCRYPT_ROUNDS=12
```

## Development Authentication

When `NODE_ENV=development`, the backend accepts mock tokens for testing:

- `mock-dev-token-user1` - Maps to a development user
- `demo-token` - Maps to a demo user

These tokens allow you to test the API without going through the full authentication flow.

## Testing the API

You can test asset creation directly:

```bash
curl -X POST http://localhost:3001/api/v1/assets \
  -H "Authorization: Bearer mock-dev-token-user1" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test Asset",
    "category":"cash",
    "subCategory":"savings",
    "value":1000,
    "currency":"USD",
    "description":"Test asset",
    "zakatEligible":true
  }'
```

Note: The `category` field must be lowercase (e.g., `"cash"`, `"gold"`, `"stocks"`) as defined in the shared validation schemas.