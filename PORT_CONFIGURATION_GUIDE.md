# Port Configuration Guide

This guide demonstrates how to configure custom ports for both frontend and backend to resolve the "Failed to fetch" issue.

## Problem

When users set custom ports in `.env` but don't update all required configuration files, the frontend cannot connect to the backend, resulting in "Failed to fetch" errors during signup/login.

## Solution

The application now supports flexible port configuration through environment variables. Both frontend and backend can be configured independently, and clear documentation helps users keep them synchronized.

## Quick Setup

### 1. Backend Configuration

Edit `server/.env`:

```env
# Change backend port
PORT=3081

# Update CORS to allow frontend
CLIENT_URL=http://localhost:3000
```

### 2. Frontend Configuration

Edit `client/.env.local`:

```env
# MUST match backend PORT
REACT_APP_API_BASE_URL=http://localhost:3081/api
```

### 3. Start Services

```bash
# Terminal 1: Start backend
cd server
npm install
npm run dev

# Terminal 2: Start frontend
cd client  
npm install
npm start
```

## Example Configurations

### Configuration 1: Default Ports

**Backend (`server/.env`):**
```env
PORT=3001
CLIENT_URL=http://localhost:3000
```

**Frontend (`client/.env.local`):**
```env
REACT_APP_API_BASE_URL=http://localhost:3001/api
PORT=3000
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001/api

---

### Configuration 2: Custom Ports (Avoid Conflicts)

**Backend (`server/.env`):**
```env
PORT=3081
CLIENT_URL=http://localhost:3010
```

**Frontend (`client/.env.local`):**
```env
REACT_APP_API_BASE_URL=http://localhost:3081/api
PORT=3010
```

**Access:**
- Frontend: http://localhost:3010
- Backend: http://localhost:3081/api

---

### Configuration 3: Production with Reverse Proxy

**Backend (`server/.env`):**
```env
PORT=3001
CLIENT_URL=https://zakapp.yourdomain.com
```

**Frontend (`client/.env.local`):**
```env
REACT_APP_API_BASE_URL=https://zakapp.yourdomain.com/api
```

**Nginx Configuration:**
```nginx
server {
    listen 443 ssl;
    server_name zakapp.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/api/;
    }
}
```

## Testing Your Configuration

### 1. Test Backend

```bash
# Check backend health
curl http://localhost:3081/api/health

# Expected response:
# {
#   "status": "OK",
#   "timestamp": "2025-10-04T15:30:00.000Z",
#   "version": "1.0.0"
# }
```

### 2. Test Frontend

1. Open browser to http://localhost:3010 (or your configured port)
2. Open Developer Console (F12)
3. Look for: "🔧 API Configuration: { baseUrl: 'http://localhost:3081/api', source: 'environment' }"
4. Try to register/login - should work without "Failed to fetch" errors

## Troubleshooting

### "Failed to fetch" Error

**Symptom:** Registration or login fails with "Failed to fetch" error

**Causes and Solutions:**

1. **Backend not running**
   ```bash
   # Check if backend is running
   curl http://localhost:3081/api/health
   
   # If no response, start backend:
   cd server && npm run dev
   ```

2. **Wrong API URL in frontend**
   ```bash
   # Check client/.env.local
   cat client/.env.local
   
   # REACT_APP_API_BASE_URL must match backend PORT:
   # If backend PORT=3081, use:
   REACT_APP_API_BASE_URL=http://localhost:3081/api
   ```

3. **CORS Error**
   ```bash
   # Check server/.env
   cat server/.env
   
   # CLIENT_URL must match frontend URL:
   # If frontend runs on 3010, use:
   CLIENT_URL=http://localhost:3010
   ```

4. **Environment variables not loaded**
   ```bash
   # Restart both services after changing .env files
   # Backend: Ctrl+C and npm run dev
   # Frontend: Ctrl+C and npm start
   ```

### Port Already in Use

**Backend:**
```bash
# Error: "Port 3001 is already in use"
# Solution: Change PORT in server/.env to a different number
PORT=3081
```

**Frontend:**
```bash
# React will automatically offer an alternative port
# Or set custom port in client/.env.local:
PORT=3010
```

### Browser Console Shows Wrong URL

If browser console shows API calls to wrong port:

1. Verify `client/.env.local` has correct `REACT_APP_API_BASE_URL`
2. Restart frontend (environment variables are read on startup)
3. Clear browser cache and reload

## Environment Files Reference

### `server/.env.example`
- Contains all backend configuration options
- Copy to `server/.env` and customize

### `client/.env.example`
- Contains all frontend configuration options
- Copy to `client/.env.local` and customize

### Important Notes

1. **Frontend uses `.env.local`** not `.env` (to avoid committing local settings)
2. **Backend uses `.env`** (gitignored)
3. **Always restart services** after changing environment files
4. **Environment variables are read at startup** - changes require restart

## Testing Checklist

Use this checklist to verify your configuration:

- [ ] Backend `.env` file exists with `PORT` set
- [ ] Frontend `.env.local` file exists with `REACT_APP_API_BASE_URL` set
- [ ] `REACT_APP_API_BASE_URL` matches backend `PORT`
- [ ] Backend `CLIENT_URL` matches frontend URL
- [ ] Backend starts successfully: `cd server && npm run dev`
- [ ] Backend health check responds: `curl http://localhost:PORT/api/health`
- [ ] Frontend starts successfully: `cd client && npm start`
- [ ] Browser console shows correct API configuration
- [ ] Registration/login works without "Failed to fetch" errors

## Additional Resources

- [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md) - Complete development setup guide
- [deployment-guide.md](./deployment-guide.md) - Production deployment instructions
- [client/.env.example](./client/.env.example) - Frontend configuration template
- [server/.env.example](./server/.env.example) - Backend configuration template

## Support

If you continue to experience issues:

1. Check that both services are running
2. Verify environment files are in correct locations
3. Check browser console for detailed error messages
4. Verify backend logs for CORS or connection errors
5. Open an issue on GitHub with:
   - Your `server/.env` (remove secrets)
   - Your `client/.env.local` (remove secrets)
   - Browser console errors
   - Backend console output
