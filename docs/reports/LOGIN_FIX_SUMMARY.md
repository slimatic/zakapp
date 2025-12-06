# Login & Configuration Fixes - October 19, 2025

## Problems Fixed

### 1. Port Mismatch

- **Issue**: Client was trying to connect to `http://localhost:3001/api` but server runs on `5000`
- **Fix**: Updated `client/src/services/api.ts` default API_BASE_URL from `3001` to `5000`
- **Configuration**: Users can set `REACT_APP_API_BASE_URL` in `client/.env` to customize

### 2. Authentication Field Mismatch

- **Issue**: Login component sent `email` but server expected `username`
- **Fix**:
  - Updated `Login.tsx` to use `username` field
  - Updated `Register.tsx` to include `username` field
  - Modified `LoginRequest` interface to support both `email` and `username` (with fallback)

### 3. API Response Format Mismatch

- **Issue**: Client expected `{ data: { accessToken, user } }` but server returns `{ accessToken, user }`
- **Fix**: Updated `api.ts` login/register methods to handle actual server response format

### 4. ESLint Warnings

- **Issue**: Unused imports and variables causing compilation warnings
- **Fix**:
  - Removed unused `UserPreferences` import from Profile
  - Removed unused `recentCalculations` variable from Dashboard
  - Fixed JSX structure in Profile component

## Files Modified

```text
client/src/services/api.ts           - Fixed API_BASE_URL, LoginRequest, response handling
client/src/components/auth/Login.tsx - Changed from email to username
client/src/components/auth/Register.tsx - Added username field
client/src/pages/user/Profile.tsx    - Removed unused imports, fixed JSX
client/src/pages/Dashboard.tsx       - Removed unused variable
client/.env                          - Updated default API URL to 5000
```

## How to Use

### Development

```bash
# Server runs on port 5000 (automatic)
# Client runs on port 3000 (automatic)

npm run dev  # Starts both server and client
```

### Login Credentials

- **Username**: `testuser` (or your registered username)
- **Password**: (your password)

> Note: Email and username can be used interchangeably in the login form (email is converted to username internally)

### Customizing API Port

If you need to change the backend port:

1. Update `client/.env`:

```bash
REACT_APP_API_BASE_URL=http://localhost:YOUR_PORT/api
```

Or set as environment variable:

```bash
REACT_APP_API_BASE_URL=http://localhost:5001/api npm start
```

## Testing

### Frontend Build

```bash
cd client && npm run build
# ✅ Builds successfully with no errors or warnings
```

### Development Servers

```bash
npm run dev
# Backend: http://localhost:5000 ✅
# Frontend: http://localhost:3000 ✅
# API: http://localhost:5000/api ✅
```

## What Changed in User Experience

1. **Registration**:
   - Now asks for `username` instead of `firstName`/`lastName`
   - Username validates against rules (alphanumeric + underscores, 3+ chars)

2. **Login**:
   - Field labeled "Username or email" but uses username for server
   - Email inputs are converted to username automatically

## Known Limitations & Future Improvements

- [ ] Email-based login (currently only username works)
- [ ] User profile editing (FirstName/LastName fields)
- [ ] Server should support both email and username logins
- [ ] Add email verification flow

## Rollback Instructions

If you need to revert these changes:

```bash
git revert HEAD  # Reverts the latest commit
git checkout HEAD -- client/.env  # Reverts .env changes
```
