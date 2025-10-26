# Environment Variables Guide

## Overview
This document explains all environment variables used in ZakApp and how to configure them correctly.

## JWT Configuration Variables

ZakApp uses **multiple JWT environment variables** to support different services and maintain backwards compatibility. Here's what each one does:

### Required Variables

#### `JWT_ACCESS_SECRET` ⭐ **MOST IMPORTANT**
- **Used by**: `JWTService` (primary authentication service)
- **Purpose**: Signs access tokens
- **Generate**: `openssl rand -base64 32`
- **Example**: `JWT_ACCESS_SECRET=S9SapiN1epoLrAAVp37Ojs1pGb3KWoZabZTXSYf8W5A=`
- **⚠️ CRITICAL**: If this is missing, you'll see the warning: "JWT secrets not found in environment variables"

#### `JWT_REFRESH_SECRET` ⭐ **REQUIRED**
- **Used by**: `JWTService` (primary authentication service)
- **Purpose**: Signs refresh tokens
- **Generate**: `openssl rand -base64 32`
- **Example**: `JWT_REFRESH_SECRET=T+jrBKMTAK8aZEKKWKRqZy66uBkDcdx6L/fTdorGL24=`

### Legacy/Compatibility Variables

#### `JWT_SECRET`
- **Used by**: Legacy services (`AuthService`, `payment-record.service.ts`, zakat routes)
- **Purpose**: Backwards compatibility
- **Recommendation**: Set to the same value as `JWT_ACCESS_SECRET`
- **Example**: `JWT_SECRET=S9SapiN1epoLrAAVp37Ojs1pGb3KWoZabZTXSYf8W5A=`

### Token Expiration Variables

ZakApp supports multiple naming conventions for token expiration:

#### Access Token Expiration
Any of these work (use one or all for maximum compatibility):
- `JWT_ACCESS_EXPIRY=15m` (preferred by JWTService)
- `JWT_ACCESS_TOKEN_EXPIRY=15m`
- `JWT_EXPIRES_IN=7d` (legacy, longer default)

#### Refresh Token Expiration
Any of these work:
- `JWT_REFRESH_EXPIRY=7d` (preferred by JWTService)
- `JWT_REFRESH_TOKEN_EXPIRY=7d`
- `JWT_REFRESH_EXPIRES_IN=30d` (alternative)

## Complete JWT Configuration Template

For **maximum compatibility** across all services, use all variables:

```bash
# JWT Secrets (Generate with: openssl rand -base64 32)
JWT_SECRET=<your-secret-here>
JWT_ACCESS_SECRET=<your-secret-here>  # Use same as JWT_SECRET
JWT_REFRESH_SECRET=<different-secret-here>

# Token Expiration (all variations for compatibility)
JWT_EXPIRES_IN=7d
JWT_ACCESS_EXPIRY=15m
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_EXPIRES_IN=30d
JWT_REFRESH_EXPIRY=7d
JWT_REFRESH_TOKEN_EXPIRY=7d
```

## Encryption Key

#### `ENCRYPTION_KEY` ⭐ **REQUIRED**
- **Purpose**: Encrypts sensitive user data (financial information)
- **Length**: Exactly 32 characters (hex)
- **Generate**: `openssl rand -hex 16`
- **Example**: `ENCRYPTION_KEY=8ec73ff457ed03b49e4a047ac0633492`

## Quick Setup Guide

### 1. Generate Secrets

```bash
# Generate JWT access secret
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_ACCESS_SECRET=$(openssl rand -base64 32)"

# Generate JWT refresh secret
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"

# Generate encryption key
echo "ENCRYPTION_KEY=$(openssl rand -hex 16)"
```

### 2. Update Your .env File

Copy the output from step 1 into your `.env` file:

```bash
# For development
cp server/.env.example server/.env
# Then paste the generated values
```

### 3. Verify Configuration

Start the server and check for warnings:

```bash
cd server && npm run dev
```

**Success**: No warnings about JWT secrets
**Failure**: You see "JWT secrets not found in environment variables"

## Common Issues

### Issue: "JWT secrets not found in environment variables"

**Cause**: Missing `JWT_ACCESS_SECRET` or `JWT_REFRESH_SECRET`

**Solution**:
1. Check your `.env` file has both variables
2. Make sure `.env` is in the correct location (`server/.env`)
3. Restart the server after adding variables

### Issue: "Invalid signature" errors

**Cause**: JWT secrets changed or don't match between environments

**Solution**:
1. Use the same secrets across restarts (don't regenerate)
2. For staging/production, keep secrets in secure storage
3. Clear tokens and re-authenticate users

### Issue: Tokens expire too quickly/slowly

**Cause**: Conflicting expiration variables

**Solution**:
1. Set `JWT_ACCESS_EXPIRY=15m` for short-lived access tokens
2. Set `JWT_REFRESH_EXPIRY=7d` for longer refresh tokens
3. Make sure all expiration variables are consistent

## Environment Files Checklist

Make sure these files have the correct JWT variables:

- ✅ `server/.env.example` - Template for developers
- ✅ `server/.env` - Your local development config
- ✅ `server/.env.staging` - Staging environment config
- ✅ `.env.staging` - Root staging config (for Docker)
- ✅ `.env.production` - Production config (create when needed)

## Security Best Practices

1. **Never commit** `.env` files with real secrets to git
2. **Use different secrets** for each environment (dev/staging/production)
3. **Rotate secrets** periodically in production
4. **Use base64 secrets** for JWT (more entropy than plain text)
5. **Keep secrets at least 32 characters** long
6. **Don't share secrets** in chat, email, or documentation
7. **Use environment variable management** tools in production (AWS Secrets Manager, HashiCorp Vault, etc.)

## References

- JWTService: `server/src/services/JWTService.ts`
- AuthService: `server/src/services/AuthService.ts`
- Environment loading: `server/src/app.ts` (uses `dotenv/config`)
- Example configuration: `server/.env.example`
