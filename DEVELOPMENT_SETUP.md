# Development Environment Setup

## Backend Development Environment Variables

For development and testing, create a `.env` file in the `backend/` directory with the following content:

```env
# Backend Environment Configuration

# Server Configuration
# The port the server will listen on. If not set, defaults to 3001.
# Change this if you get "EADDRINUSE" errors or need to run multiple instances.
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

## Port Configuration

The backend server supports flexible port configuration to avoid common "address already in use" errors:

### Setting the Port

You can configure the server port in several ways:

1. **Environment Variable**: Set `PORT=3002` in your `.env` file
2. **Command Line**: `PORT=3002 npm run dev`
3. **Export**: `export PORT=3002 && npm run dev`

### Handling Port Conflicts

If you encounter an "EADDRINUSE" error, the server will provide helpful guidance:

```
❌ Port 3001 is already in use!

To fix this issue, you can:
• Set a different port: PORT=3002 npm run dev
• Or set PORT environment variable: export PORT=3002
• Or kill the process using port 3001:
  - Find the process: lsof -ti:3001
  - Kill the process: kill -9 $(lsof -ti:3001)
```

### Docker Configuration

When using Docker, make sure to update your `docker-compose.yml` if you change the port:

```yaml
backend:
  ports:
    - '3002:3002'  # Change both port numbers if using a different port
  environment:
    - PORT=3002
```

## Development Authentication

For development, you will need to register and login to get a valid JWT token for testing. The application uses proper JWT authentication even in development mode.

## Testing the API

To test the API, first register a user and login to get a valid token:

```bash
# Register a test user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!"
  }'

# Login to get a JWT token
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPass123!"
  }'
```

Use the returned JWT token to test asset creation:

```bash
curl -X POST http://localhost:3001/api/v1/assets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
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