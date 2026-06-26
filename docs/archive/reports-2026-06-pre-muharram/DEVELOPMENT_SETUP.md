# Development Environment Setup

This guide covers how to configure both backend and frontend development environments, including how to change ports to avoid conflicts.

## Quick Start

1. **Set up Backend**: Copy `server/.env.example` to `server/.env` and configure ports
2. **Set up Frontend**: Copy `client/.env.example` to `client/.env.local` and match backend port
3. **Start Development**: Run `npm run dev` from root directory

## Backend Development Environment Variables

For development and testing, create a `.env` file in the `server/` directory:

```bash
# Copy the example file
cp server/.env.example server/.env

# Edit server/.env with your preferred settings
```

See `server/.env.example` for all available configuration options and detailed explanations.

## Frontend Development Environment Variables

For development, create a `.env.local` file in the `client/` directory:

```bash
# Copy the example file
cp client/.env.example client/.env.local

# Edit client/.env.local with your settings
```

**IMPORTANT**: The frontend must know where to find the backend API. Set `REACT_APP_API_BASE_URL` to match your backend port:

```env
# If backend is on port 3001 (default)
REACT_APP_API_BASE_URL=http://localhost:3001/api

# If backend is on port 3081 (custom)
REACT_APP_API_BASE_URL=http://localhost:3081/api
```

See `client/.env.example` for all available configuration options.

## Port Configuration

Both backend and frontend support flexible port configuration.

### Changing Backend Port

**Option 1: Using .env file (Recommended)**
```bash
# In server/.env
PORT=3081
```

**Option 2: Command line**
```bash
cd server
PORT=3081 npm run dev
```

**Option 3: Environment variable**
```bash
export PORT=3081
cd server && npm run dev
```

### Changing Frontend Port

**Option 1: Using .env.local file (Recommended)**
```bash
# In client/.env.local
PORT=3010
```

**Option 2: Command line**
```bash
cd client
PORT=3010 npm start
```

**Option 3: Environment variable**
```bash
export PORT=3010
cd client && npm start
```

### Connecting Frontend to Backend with Custom Ports

When you change the backend port, you **MUST** update the frontend configuration:

**Example: Backend on 3081, Frontend on 3010**

1. Configure backend (`server/.env`):
```env
PORT=3081
CLIENT_URL=http://localhost:3010
```

2. Configure frontend (`client/.env.local`):
```env
PORT=3010
REACT_APP_API_BASE_URL=http://localhost:3081/api
```

3. Start both servers:
```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend  
cd client && npm start
```

### Handling Port Conflicts

If you encounter an "EADDRINUSE" error, the backend provides helpful guidance:

```
❌ Port 3001 is already in use!

To fix this issue, you can:
• Set a different port: PORT=3002 npm run dev
• Or set PORT environment variable: export PORT=3002
• Or kill the process using port 3001:
  - Find the process: lsof -ti:3001
  - Kill the process: kill -9 $(lsof -ti:3001)
```

For frontend port conflicts, React will automatically prompt you to use a different port.

### Docker Configuration

When using Docker, update port mappings in `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - '3081:3081'  # host:container - change both if using custom port
    environment:
      - PORT=3081
      - CLIENT_URL=http://localhost:3010
  
  frontend:
    ports:
      - '3010:3010'  # host:container - change both if using custom port
    environment:
      - PORT=3010
      - REACT_APP_API_BASE_URL=http://localhost:3081/api
```

### Troubleshooting Port Issues

**"Failed to fetch" error on signup/login:**
- ✓ Check backend is running: `curl http://localhost:3001/api/health`
- ✓ Verify `REACT_APP_API_BASE_URL` in `client/.env.local` matches backend PORT
- ✓ Check browser console for the actual URL being called
- ✓ Ensure no CORS errors (backend `CLIENT_URL` should match frontend URL)

**Port already in use:**
- Backend: Change `PORT` in `server/.env`
- Frontend: Change `PORT` in `client/.env.local` or accept the alternative port React suggests

**CORS errors:**
- Ensure backend's `CLIENT_URL` in `server/.env` matches your frontend URL
- Default: `CLIENT_URL=http://localhost:3000`
- Custom: `CLIENT_URL=http://localhost:3010`

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