# Database Management Guide

**Last Updated**: October 13, 2025  
**Environment**: Development (SQLite)

---

## 📋 Overview

This guide covers common database management tasks for ZakApp development, including cleaning test data, resetting the database, backups, and troubleshooting.

---

## 🧹 Cleaning Test Users

### Quick Clean: Delete All Users

The fastest way to remove all test users:

```bash
docker compose exec backend npx prisma migrate reset --skip-seed
```

Type `yes` when prompted. This will:
- ✅ Drop all tables
- ✅ Re-run all migrations
- ✅ Create fresh, empty database with schema
- ✅ Skip seed data (if configured)

### Option 1: Delete Users Only (Keep Other Data)

If you want to keep assets, calculations, etc., but just remove users:

```bash
docker compose exec -T backend npx prisma db execute --stdin <<'EOF'
DELETE FROM RefreshToken;
DELETE FROM User;
EOF
```

⚠️ **Note**: This may fail if there are foreign key constraints. Use Option 2 instead.

### Option 2: Delete All Data (Keep Schema)

Remove all users and all their related data:

```bash
docker compose exec -T backend npx prisma db execute --stdin <<'EOF'
DELETE FROM Asset;
DELETE FROM Liability;
DELETE FROM ZakatCalculation;
DELETE FROM ZakatPayment;
DELETE FROM AssetSnapshot;
DELETE FROM UserSession;
DELETE FROM YearlySnapshot;
DELETE FROM PaymentRecord;
DELETE FROM AnalyticsMetric;
DELETE FROM AnnualSummary;
DELETE FROM ReminderEvent;
DELETE FROM CalculationHistory;
DELETE FROM RefreshToken;
DELETE FROM User;
EOF
```

This deletes data in the correct order to respect foreign key constraints.

### Option 3: Delete Specific User by Email

```bash
# Replace 'user@example.com' with actual email
docker compose exec -T backend sh -c 'echo "DELETE FROM User WHERE email = \"user@example.com\";" | sqlite3 /app/server/prisma/data/dev.db'
```

⚠️ **Caution**: This may fail if the user has related data (assets, calculations, etc.)

### Option 4: Visual Management with Prisma Studio

Use Prisma Studio for a GUI to browse and delete data:

```bash
docker compose exec backend npx prisma studio
```

Then:
1. Open http://localhost:5555 in your browser
2. Click on "User" table
3. Browse users
4. Select user(s) to delete
5. Click the delete button
6. Confirm deletion

---

## 🔄 Database Reset Options

### Full Reset (Recommended for Development)

Complete database reset with migrations:

```bash
docker compose exec backend npx prisma migrate reset
```

You'll be prompted:
```
? Are you sure you want to reset your database? All data will be lost. › (y/N)
```

Type `y` and press Enter.

**What this does**:
- Drops all tables
- Re-runs all 5 migrations
- Creates fresh schema
- Database is ready for use

### Reset Without Confirmation (CI/CD)

For automated scripts:

```bash
docker compose exec backend npx prisma migrate reset --force
```

⚠️ **Warning**: This will not ask for confirmation!

### Reset and Skip Seed Data

If you have seed data configured but don't want to run it:

```bash
docker compose exec backend npx prisma migrate reset --skip-seed
```

### Nuclear Option: Delete Database File

Complete fresh start by deleting the database file:

```bash
# Stop containers
docker compose down

# Delete database file
rm server/prisma/data/dev.db

# Restart and re-initialize
docker compose up -d
docker compose exec backend npx prisma migrate deploy

# Verify database is created
docker compose exec backend ls -lh /app/server/prisma/data/dev.db
```

---

## 💾 Database Backups

### Create Manual Backup

```bash
# Create backups directory if it doesn't exist
mkdir -p backups

# Copy database with timestamp
cp server/prisma/data/dev.db backups/dev-$(date +%Y%m%d-%H%M%S).db

# Or from Docker container
docker compose cp backend:/app/server/prisma/data/dev.db backups/dev-$(date +%Y%m%d-%H%M%S).db
```

### Restore from Backup

```bash
# Stop containers
docker compose down

# Restore backup (replace YYYYMMDD-HHMMSS with your backup timestamp)
cp backups/dev-YYYYMMDD-HHMMSS.db server/prisma/data/dev.db

# Restart containers
docker compose up -d
```

### Automated Backup Script

Create a backup script:

```bash
#!/bin/bash
# File: scripts/backup-db.sh

BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DB_FILE="server/prisma/data/dev.db"

mkdir -p "$BACKUP_DIR"

if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$BACKUP_DIR/dev-$TIMESTAMP.db"
    echo "✅ Backup created: $BACKUP_DIR/dev-$TIMESTAMP.db"
    
    # Keep only last 10 backups
    ls -t "$BACKUP_DIR"/dev-*.db | tail -n +11 | xargs -r rm
    echo "✅ Old backups cleaned"
else
    echo "❌ Database file not found: $DB_FILE"
    exit 1
fi
```

Make it executable:

```bash
chmod +x scripts/backup-db.sh
```

Run it:

```bash
./scripts/backup-db.sh
```

---

## 🔍 Database Inspection

### Check Database File Size

```bash
# On host
ls -lh server/prisma/data/dev.db

# In container
docker compose exec backend ls -lh /app/server/prisma/data/dev.db
```

Expected: ~476KB for empty database with schema, larger with data.

### Check Migration Status

```bash
docker compose exec backend npx prisma migrate status
```

Expected output:
```
Database schema is up to date!
```

### Count Users

```bash
docker compose exec -T backend sh -c 'echo "SELECT COUNT(*) as user_count FROM User;" | sqlite3 /app/server/prisma/data/dev.db'
```

### List All Users

```bash
docker compose exec -T backend sh -c 'echo "SELECT id, email, createdAt FROM User;" | sqlite3 /app/server/prisma/data/dev.db'
```

### View Database Schema

```bash
docker compose exec -T backend sh -c 'echo ".schema User" | sqlite3 /app/server/prisma/data/dev.db'
```

### Check Table Sizes

```bash
docker compose exec -T backend sh -c 'sqlite3 /app/server/prisma/data/dev.db <<EOF
SELECT name, COUNT(*) as count FROM sqlite_master
WHERE type="table"
GROUP BY name;
EOF'
```

---

## 🛠 Common Tasks

### Task 1: Start Fresh for Testing

```bash
# Complete reset
docker compose exec backend npx prisma migrate reset --skip-seed

# Register test user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456",
    "confirmPassword": "Test@123456",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Task 2: Clean Test Data Between Runs

```bash
# Delete all users and data
docker compose exec backend npx prisma migrate reset --skip-seed --force
```

### Task 3: Export Database for Debugging

```bash
# Export all tables to SQL
docker compose exec -T backend sh -c 'sqlite3 /app/server/prisma/data/dev.db .dump' > database-dump.sql

# Or export just User table
docker compose exec -T backend sh -c 'sqlite3 /app/server/prisma/data/dev.db "SELECT * FROM User;"' > users.csv
```

### Task 4: Import Test Data

```bash
# Import from SQL dump
docker compose exec -T backend sh -c 'sqlite3 /app/server/prisma/data/dev.db' < database-dump.sql
```

---

## 🎯 Decision Guide

**Choose the right approach based on your needs:**

| Scenario | Command | Time | Data Loss |
|----------|---------|------|-----------|
| Just remove test users | `prisma migrate reset --skip-seed` | 5s | All data |
| Keep some data, remove users | SQL DELETE commands | 1s | Users only |
| Fresh start for testing | `prisma migrate reset --skip-seed` | 5s | All data |
| Fix corrupted database | Delete file + migrate | 10s | All data |
| Production-like testing | Restore from backup | 5s | None |
| Remove specific user | Prisma Studio | 30s | One user |

---

## ⚠️ Important Warnings

### Do NOT Run in Production

These commands are for **development only**:
- ❌ `prisma migrate reset`
- ❌ `rm dev.db`
- ❌ `DELETE FROM User`

For production, use proper migration strategies:
- ✅ `prisma migrate deploy` (only applies new migrations)
- ✅ Backup before migrations
- ✅ Test migrations on staging first

### Foreign Key Constraints

SQLite enforces foreign key constraints. When deleting data:
1. Delete child records first (Assets, Calculations, etc.)
2. Then delete parent records (Users)

Or use `prisma migrate reset` which handles this automatically.

### Volume Mounts

The database file is volume-mounted:
```yaml
volumes:
  - ./server/prisma/data:/app/server/prisma/data
```

This means:
- ✅ Data persists when containers restart
- ✅ You can access/backup from host
- ✅ Changes are immediate (no container rebuild needed)
- ⚠️ Deleting on host = deleting in container

---

## 🔧 Troubleshooting

### Problem: "Database locked"

**Cause**: Multiple processes accessing database simultaneously

**Solution**:
```bash
# Stop all containers
docker compose down

# Wait 5 seconds
sleep 5

# Start again
docker compose up -d
```

### Problem: "Migration failed"

**Cause**: Database schema out of sync

**Solution**:
```bash
# Check migration status
docker compose exec backend npx prisma migrate status

# If needed, reset and re-apply
docker compose exec backend npx prisma migrate reset
```

### Problem: Database file is 0 bytes

**Cause**: Migrations never ran

**Solution**:
```bash
# Run migrations
docker compose exec backend npx prisma migrate deploy

# Verify size
docker compose exec backend ls -lh /app/server/prisma/data/dev.db
```

### Problem: "User not found" after reset

**Cause**: Database was reset, but frontend still has old tokens

**Solution**:
```bash
# Clear browser local storage
# In browser console:
localStorage.clear()

# Or logout and login again
```

---

## 📚 Related Documentation

- **Database Schema**: `server/prisma/schema.prisma`
- **Migrations**: `server/prisma/migrations/`
- **Setup Guide**: `DATABASE_INITIALIZATION_FIX.md`
- **Quick Start**: `QUICK_START_AFTER_FIX.md`
- **Portability**: `DATABASE_PORTABILITY_GUIDE.md`

---

## 🎓 Learning Resources

### Prisma CLI Commands

```bash
# Show help
docker compose exec backend npx prisma --help

# Show migrate help
docker compose exec backend npx prisma migrate --help

# Show db help
docker compose exec backend npx prisma db --help
```

### SQLite Commands

```bash
# Interactive SQLite shell
docker compose exec -it backend sh -c 'sqlite3 /app/server/prisma/data/dev.db'

# Common commands in SQLite shell:
# .tables          - List all tables
# .schema TABLE    - Show table schema
# .quit            - Exit
# SELECT * FROM User; - Query data
```

---

## ✅ Quick Reference

### Most Common Commands

```bash
# Clean database (recommended)
docker compose exec backend npx prisma migrate reset --skip-seed

# Backup database
cp server/prisma/data/dev.db backups/dev-$(date +%Y%m%d-%H%M%S).db

# Open Prisma Studio
docker compose exec backend npx prisma studio

# Check migration status
docker compose exec backend npx prisma migrate status

# Count users
docker compose exec -T backend sh -c 'echo "SELECT COUNT(*) FROM User;" | sqlite3 /app/server/prisma/data/dev.db'
```

---

**Last Updated**: October 13, 2025  
**Applies To**: ZakApp Development Environment  
**Database**: SQLite (dev.db)  
**Version**: 1.0
