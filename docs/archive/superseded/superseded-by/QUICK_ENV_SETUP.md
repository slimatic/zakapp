# Quick Setup: Environment Variables

## ⚡ Fast Setup (Copy & Paste)

Run these commands to generate all required secrets:

```bash
# Navigate to server directory
cd server

# Generate all secrets at once
echo ""
echo "# Copy these to your .env file:"
echo ""
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_ACCESS_SECRET=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
echo "ENCRYPTION_KEY=$(openssl rand -hex 16)"
echo ""
```

## 📋 Minimum Required Variables

Your `server/.env` file **MUST** have these:

```bash
# Copy server/.env.example to server/.env first
cp server/.env.example server/.env

# Then add these (with your generated values):
JWT_SECRET=<generated-value>
JWT_ACCESS_SECRET=<generated-value>
JWT_REFRESH_SECRET=<generated-value>
ENCRYPTION_KEY=<generated-value>
```

## ✅ Verify Setup

```bash
# Start the server
cd server && npm run dev

# Look for this message (success):
🚀 ZakApp Server running on port 3001

# If you see this (FAILURE):
⚠️  JWT secrets not found in environment variables
# Then JWT_ACCESS_SECRET or JWT_REFRESH_SECRET is missing!
```

## 🔍 Troubleshooting

### Problem: Server says "JWT secrets not found"

**Fix**: Add `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to `.env`

```bash
# Check what's in your .env
grep "JWT" server/.env

# You should see:
# JWT_SECRET=...
# JWT_ACCESS_SECRET=...  ← Must be present!
# JWT_REFRESH_SECRET=... ← Must be present!
```

### Problem: Can't find .env file

**Fix**: Create it from the example

```bash
cd server
cp .env.example .env
# Then edit .env and add your secrets
```

### Problem: Secrets keep changing

**Fix**: Don't regenerate secrets every time!

```bash
# Generate ONCE and save the output
openssl rand -base64 32

# Paste the SAME value into .env
# Don't run the command again
```

## 📚 More Info

For detailed explanation of all variables, see:
- `docs/ENVIRONMENT_VARIABLES.md` - Complete guide
- `server/.env.example` - All available options
- `DEVELOPMENT_SETUP.md` - Full setup instructions
