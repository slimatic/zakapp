# Encryption Migration Guide (v0.9.2)

## Overview

ZakApp v0.9.2 introduces a **critical security enhancement** by upgrading the encryption algorithm from AES-256-CBC to AES-256-GCM for all sensitive user data (payment records and user profiles).

**Key Features:**
- **Automatic Migration**: Encryption upgrade happens automatically on backend startup
- **Zero Downtime**: No manual intervention required for Docker Hub users
- **Backward Compatible**: Supports both CBC and GCM formats during migration
- **Safe Rollback**: Database backups created before migration

## What's Changed

### Encryption Algorithm Upgrade

| Aspect | Before (CBC) | After (GCM) |
|--------|-------------|-------------|
| **Algorithm** | AES-256-CBC | AES-256-GCM |
| **Authentication** | ❌ None | ✅ Built-in (AEAD) |
| **Security** | Encryption only | Encryption + Authentication |
| **Tag Verification** | Not applicable | Prevents tampering |

**Why GCM?**
- **Authentication**: GCM provides authenticated encryption with additional data (AEAD), preventing data tampering
- **Industry Standard**: Used by TLS 1.3, modern secure protocols
- **Performance**: Often faster than CBC on modern hardware
- **Security**: Protects against padding oracle attacks that affect CBC

### Migration Process

The migration follows this workflow:

```
Docker Compose Up
    ↓
Backend Container Starts
    ↓
Auto-Migration Script Runs
    ↓
┌─────────────────────────────┐
│ Check Encryption Status     │
│ (Look for CBC-formatted     │
│  encrypted data)            │
└──────────┬──────────────────┘
           ↓
    [CBC Detected?]
           ↓
     ┌────┴────┐
     │   YES   │              NO → Skip migration, continue startup
     └────┬────┘
          ↓
┌─────────────────────────────┐
│ 1. Create Database Backup   │
│    Location:                │
│    /app/server/prisma/data/ │
│    prod.db.backup-TIMESTAMP │
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│ 2. Re-encrypt All Payments  │
│    • Decrypt using CBC      │
│    • Encrypt using GCM      │
│    • Update database        │
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│ 3. Re-encrypt All Profiles  │
│    • Decrypt using CBC      │
│    • Encrypt using GCM      │
│    • Update database        │
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│ 4. Verify Migration         │
│    • Check for any          │
│      undecryptable records  │
│    • Log statistics         │
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│ 5. Continue Normal Startup  │
│    app.listen() called      │
└─────────────────────────────┘
```

**Expected Migration Time:**
- **Small deployments** (< 100 users): 5-15 seconds
- **Medium deployments** (100-1000 users): 15-45 seconds
- **Large deployments** (1000+ users): 45-90 seconds

## For Docker Hub Users (Automatic)

If you're running ZakApp via Docker Compose with the official `slimatic/zakapp-backend` image:

### Step 1: Pull Latest Image

```bash
docker compose pull
```

### Step 2: Restart Application

```bash
docker compose down
docker compose up -d
```

### Step 3: Monitor Migration

Check the backend logs to see migration progress:

```bash
docker compose logs -f backend
```

**Expected Log Output:**

```
[2026-02-08T14:00:00.000Z] INFO: Starting encryption migration check...
[2026-02-08T14:00:00.500Z] INFO: Detected CBC-formatted encrypted data
[2026-02-08T14:00:00.750Z] INFO: Creating database backup: prod.db.backup-20260208-140000
[2026-02-08T14:00:01.200Z] INFO: Backup created successfully
[2026-02-08T14:00:01.300Z] INFO: Migrating payment records... (127 records found)
[2026-02-08T14:00:15.400Z] INFO: Successfully migrated 127 payment records
[2026-02-08T14:00:15.500Z] INFO: Migrating user profiles... (45 profiles found)
[2026-02-08T14:00:20.300Z] INFO: Successfully migrated 45 user profiles
[2026-02-08T14:00:20.400Z] INFO: Encryption migration completed successfully
[2026-02-08T14:00:20.500Z] INFO: All encrypted data is now using GCM format
[2026-02-08T14:00:20.600Z] INFO: Server listening on port 3001
```

### Step 4: Verify Application

1. Open your ZakApp instance in a browser
2. Log in with your credentials
3. Navigate to Payment Records page
4. Verify that all payments display correctly
5. Navigate to Profile page
6. Verify that profile information displays correctly

**If everything works correctly, the migration was successful!**

## For Self-Hosted / Development (Manual)

If you're running ZakApp from source or have a custom deployment:

### Prerequisites

- Node.js 18+ or 20+
- Access to the production database file
- Write permissions to `server/prisma/data/` directory

### Step 1: Backup Database (Critical!)

Before starting, create a manual backup:

```bash
cd server/prisma/data
cp prod.db prod.db.backup-manual-$(date +%Y%m%d-%H%M%S)
```

### Step 2: Pull Latest Code

```bash
git fetch origin
git checkout v0.9.2  # Or main branch if already merged
```

### Step 3: Install Dependencies

```bash
cd server
npm install
```

### Step 4: Start Backend

```bash
npm run dev  # Development mode
# OR
npm start     # Production mode
```

The auto-migration will run automatically on startup.

### Step 5: Monitor Logs

Watch the console output for migration progress (same log format as Docker section above).

## Rollback Procedure

If you encounter issues after migration, you can roll back to the previous encryption format:

### For Docker Deployments

```bash
# 1. Stop the application
docker compose down

# 2. Access the backend container's data volume
docker run --rm -it \
  -v zakapp_backend-data:/data \
  busybox sh

# Inside the container:
cd /data/prisma/data
ls -lah prod.db.backup-*  # Find the backup file

# 3. Restore the backup
cp prod.db.backup-20260208-140000 prod.db
exit

# 4. Downgrade to v0.9.1
# Edit docker-compose.yml and change:
#   image: slimatic/zakapp-backend:v0.9.2
# to:
#   image: slimatic/zakapp-backend:v0.9.1

# 5. Restart with old version
docker compose up -d
```

### For Self-Hosted Deployments

```bash
# 1. Stop the backend
# (Press Ctrl+C if running in foreground, or kill the process)

# 2. Restore the backup
cd server/prisma/data
cp prod.db.backup-20260208-140000 prod.db

# 3. Checkout previous version
git checkout v0.9.1

# 4. Reinstall dependencies (if needed)
cd server
npm install

# 5. Restart backend
npm start
```

## Troubleshooting

### Issue: "Undecryptable records found after migration"

**Cause**: Some records may have been encrypted with a different encryption key

**Solution**:
1. Check that `ENCRYPTION_KEY` in `.env` matches the key used to encrypt the data
2. If you rotated encryption keys, ensure `ENCRYPTION_PREVIOUS_KEYS` contains the old key(s)
3. Restore from backup and verify environment variables before retrying

### Issue: "Migration takes longer than 2 minutes"

**Cause**: Large number of encrypted records

**Solution**:
- This is expected for deployments with 2000+ users
- Wait for migration to complete (monitor logs for progress)
- Do not interrupt the migration process
- Consider scheduling the upgrade during low-traffic hours

### Issue: "Database backup failed - insufficient disk space"

**Cause**: Not enough disk space to create backup

**Solution**:
1. Check available disk space: `df -h`
2. Free up space by removing old backups or logs
3. Ensure at least 2x database size is available
4. Retry the migration

### Issue: "TypeError: Unsupported state or unable to authenticate data"

**Cause**: GCM decryption failed due to corrupted or tampered data

**Solution**:
1. Restore from the most recent backup
2. Check database file integrity: `sqlite3 prod.db "PRAGMA integrity_check;"`
3. If corruption detected, restore from an older backup
4. Report the issue on GitHub: https://github.com/slimatic/zakapp/issues

## Verification Commands

After migration, you can verify the encryption format:

### Check Encryption Status

```bash
# For Docker deployments:
docker compose exec backend npm run check-encryption

# For self-hosted:
cd server
npm run check-encryption
```

**Expected Output:**
```
✅ Encryption Check Complete
   Format: GCM
   Payment Records: 127 encrypted with GCM
   User Profiles: 45 encrypted with GCM
   Undecryptable Records: 0
   Status: ✅ All systems operational
```

### Manual Database Inspection

```bash
# Access the database
sqlite3 server/prisma/data/prod.db

# Check a payment record (should contain ':' separator for GCM)
SELECT id, encryptedAmount, encryptedRecipient 
FROM PaymentRecord 
LIMIT 1;

# GCM format: <iv>:<authTag>:<ciphertext>
# CBC format: <iv>.<ciphertext>
```

## Security Considerations

### Why This Migration is Important

1. **Data Integrity**: GCM ensures encrypted data hasn't been tampered with
2. **Attack Prevention**: GCM protects against padding oracle attacks that affect CBC
3. **Modern Standard**: Aligns with current cryptographic best practices
4. **Compliance**: Better meets security standards and audit requirements

### Post-Migration Security

- **Key Rotation**: Consider rotating encryption keys after migration
- **Backup Security**: Encrypt backups or store them securely
- **Access Control**: Limit access to production database files
- **Monitoring**: Enable audit logs for sensitive data access

## Support

If you encounter issues during migration:

1. **Check Logs**: Review backend logs for detailed error messages
2. **Verify Environment**: Ensure all environment variables are correctly set
3. **Restore Backup**: Use the rollback procedure if needed
4. **Report Issues**: Open a GitHub issue with logs and error details

**GitHub Issues**: https://github.com/slimatic/zakapp/issues

## Related Documentation

- [Deployment Guide](./deployment-guide.md)
- [Environment Configuration](./.env.example)
- [CHANGELOG](../CHANGELOG.md)
- [Security Best Practices](./guides/SECURITY.md)
