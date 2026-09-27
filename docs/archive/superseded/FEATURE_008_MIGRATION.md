# Feature 008 — Nisab Year Record Migration (historical)

> **Archived deployment record.** This is the migration procedure that accompanied
> Feature 008 when it shipped. It is kept because the rollback and verification
> steps are still the correct reference if a deployment predates that schema, and
> because a few of its warnings (the Metals API dependency, the hourly Hawl job)
> still describe live behaviour.
>
> **Not needed for a current install.** `docker compose up` runs migrations
> automatically via the `migrations` service, and `server/src/startup/autoMigration.ts`
> handles it on the non-Docker path. Feature-completion notes live in
> `docs/reports/FEATURE_008_COMPLETE.md`.

#
#### Overview

Feature 008 introduces the Nisab Year Record workflow for automatic Hawl (lunar year) tracking with finalization and unlocking capabilities. This section covers the deployment and migration requirements.

#### Database Migration

**Required**: This feature includes database schema changes that must be migrated.

##### Production Migration Steps

1. **Backup your database**

   ```bash
   # SQLite backup
   sqlite3 /path/to/database.db ".backup '/path/to/backup-$(date +%F).db'"

   # Verify backup
   sqlite3 /path/to/backup-$(date +%F).db "SELECT name FROM sqlite_master WHERE type='table';"
   ```

2. **Run Prisma migration**

   ```bash
   # Navigate to server directory
   cd server

   # Run migration in production mode
   npx prisma migrate deploy

   # Verify migration
   npx prisma migrate status
   ```

   **Expected output**:
   ```
   ✓ Migration 20240130000000_add_nisab_year_records applied
   Database schema is up to date!
   ```

3. **Verify schema changes**

   ```bash
   # Check new tables
   npx prisma db execute --stdin <<SQL
   SELECT name FROM sqlite_master WHERE type='table' AND name='NisabYearRecord';
   SQL

   # Should return: NisabYearRecord
   ```

##### Development Migration

```bash
# From server directory
npm run migrate:dev

# This will:
# 1. Create migration files
# 2. Apply to development database
# 3. Regenerate Prisma Client
```

#### Environment Variables

**New requirement**: Feature 008 requires the Metals API for live gold/silver pricing.

##### Required Environment Variable

Add to your `server/.env` file:

```env
# Metals API Configuration
METALS_API_KEY=your_metals_api_key_here
```

##### Obtaining API Key

1. **Sign up**: Visit [https://metals-api.com/](https://metals-api.com/)
2. **Free tier**: 50 API calls/month (sufficient for most users)
3. **Paid tier**: Required for high-volume usage (>50 nisab checks/month)
4. **Copy key**: Dashboard → API Key → Copy to clipboard
5. **Set variable**: Add to `server/.env`

##### Verify API Configuration

```bash
# Test API connection
curl -X GET "https://metals-api.com/api/latest?access_key=YOUR_KEY&base=USD&symbols=XAU,XAG"

# Expected response:
# {
#   "success": true,
#   "timestamp": 1706630400,
#   "base": "USD",
#   "rates": {
#     "XAU": 0.0004876,
#     "XAG": 0.0423729
#   }
# }
```

##### Fallback Configuration

If API is unavailable, ZakApp uses cached values:

```typescript
// server/src/config/nisab.ts
export const FALLBACK_NISAB = {
  goldPricePerGram: 65.00,    // USD per gram
  silverPricePerGram: 0.80,   // USD per gram
  lastUpdated: '2024-01-30'
};
```

**Warning**: Fallback values may be outdated. Always configure `METALS_API_KEY` for production.

#### Background Jobs

Feature 008 introduces an hourly background job for Hawl detection.

##### Job Configuration

The job runs automatically every hour:

```typescript
// server/src/jobs/hawlDetection.ts
cron.schedule('0 * * * *', async () => {
  await detectHawlThresholdCrossing();
});
```

##### Verifying Job Execution

1. **Check logs**

   ```bash
   # Docker environment
   docker-compose -f docker-compose.yml logs -f backend | grep "Hawl detection"

   # PM2 environment
   pm2 logs zakapp-backend | grep "Hawl detection"
   ```

2. **Expected log output**

   ```
   [2024-01-30 14:00:00] INFO: Hawl detection job started
   [2024-01-30 14:00:05] INFO: Checked 47 users, 3 new Hawl periods detected
   [2024-01-30 14:00:05] INFO: Hawl detection job completed successfully
   ```

3. **Manual trigger** (testing only)

   ```bash
   # Execute from server directory
   node -e "require('./dist/jobs/hawlDetection').detectHawlThresholdCrossing()"
   ```

#### Rollback Procedures

If you need to rollback Feature 008:

##### Database Rollback

```bash
# From server directory
cd server

# Identify migration to rollback to
npx prisma migrate status

# Rollback to previous migration
npx prisma migrate resolve --rolled-back 20240130000000_add_nisab_year_records

# Apply previous schema (if backup available)
sqlite3 data/zakapp.db < backup-2024-01-29.sql
```

##### Application Rollback

```bash
# Git rollback
git log --oneline  # Find commit before Feature 008
git revert <commit-hash>

# Docker rollback
docker-compose -f docker-compose.yml down
git checkout <previous-version-tag>
docker-compose -f docker-compose.yml up -d --build

# PM2 rollback
pm2 stop zakapp-backend
git checkout <previous-version-tag>
npm install
npm run build
pm2 restart zakapp-backend
```

##### Environment Variable Cleanup

```bash
# Remove METALS_API_KEY from server/.env
sed -i '/METALS_API_KEY/d' server/.env

# Restart services
docker-compose -f docker-compose.yml restart backend
# OR
pm2 restart zakapp-backend
```

#### Post-Deployment Verification

After deploying Feature 008, verify all components:

##### 1. Database Schema

```bash
# Check tables exist
npx prisma db execute --stdin <<SQL
SELECT name FROM sqlite_master WHERE type='table' WHERE name LIKE 'Nisab%';
SQL

# Expected: NisabYearRecord
```

##### 2. API Endpoints

```bash
# Get nisab year records (requires authentication)
curl -X GET http://localhost:3000/api/nisab-year-records \
  -H "Authorization: Bearer <your-jwt-token>"

# Expected: 200 OK with JSON array
```

##### 3. Background Job

```bash
# Wait 5 minutes, then check logs
docker-compose -f docker-compose.yml logs -f backend | grep "Hawl detection"

# Should see hourly execution logs
```

##### 4. Metals API Integration

```bash
# Check API connectivity from backend
docker-compose -f docker-compose.yml exec backend \
  curl -X GET "https://metals-api.com/api/latest?access_key=${METALS_API_KEY}&base=USD&symbols=XAU,XAG"

# Expected: JSON response with gold/silver rates
```

##### 5. Frontend UI

1. Navigate to **http://your-domain.com** (or localhost:3001 for dev)
2. Login with test user
3. Navigate to **Nisab Year Records** page
4. Verify:
   - Records list loads
   - Status badges display correctly
   - Finalize/Unlock buttons work
   - Audit trail shows events

#### Monitoring Recommendations

##### Application Logs

```bash
# Docker
docker-compose -f docker-compose.yml logs -f --tail=100 backend

# PM2
pm2 logs zakapp-backend --lines 100
```

##### Database Growth

```bash
# Monitor database size
watch -n 60 'du -h data/zakapp.db'

# Check record counts
sqlite3 data/zakapp.db "SELECT COUNT(*) FROM NisabYearRecord;"
```

##### API Rate Limits

Monitor Metals API usage:

```bash
# Log API calls
grep "Fetching nisab threshold" /var/log/zakapp/backend.log | wc -l

# Alert if approaching limit (50/month on free tier)
```

##### Cron Job Health

```bash
# Verify hourly execution
grep "Hawl detection job" /var/log/zakapp/backend.log | tail -24

# Should show 24 entries in last 24 hours
```

#### Backup Recommendations

##### Pre-Migration Backup

```bash
# Before running Prisma migrate
cp data/zakapp.db data/zakapp-pre-feature-008-$(date +%F).db
```

##### Automated Backups

Add to cron:

```bash
# Daily backup at 2 AM
0 2 * * * sqlite3 /path/to/zakapp.db ".backup '/backups/zakapp-$(date +\%F).db'" && find /backups -name "zakapp-*.db" -mtime +30 -delete
```

##### Backup Verification

```bash
# Test restore
sqlite3 /tmp/test-restore.db < backup-2024-01-30.db
sqlite3 /tmp/test-restore.db "SELECT COUNT(*) FROM NisabYearRecord;"
rm /tmp/test-restore.db
```

#### Troubleshooting Feature 008

##### Issue: "METALS_API_KEY not configured"

**Symptoms**: Backend logs show warning messages about missing API key

**Solution**:

```bash
# Add to server/.env
echo "METALS_API_KEY=your_actual_key_here" >> server/.env

# Restart backend
docker-compose -f docker-compose.yml restart backend
# OR
pm2 restart zakapp-backend
```

##### Issue: Migration fails with "table already exists"

**Symptoms**: `npx prisma migrate deploy` fails

**Solution**:

```bash
# Mark migration as resolved
npx prisma migrate resolve --applied 20240130000000_add_nisab_year_records

# Verify status
npx prisma migrate status
```

##### Issue: Hawl detection job not running

**Symptoms**: No log entries for hourly job execution

**Solution**:

```bash
# Check backend is running
docker-compose -f docker-compose.yml ps backend
# OR
pm2 list

# Manually trigger job
node -e "require('./dist/jobs/hawlDetection').detectHawlThresholdCrossing()"

# Check for errors in logs
docker-compose -f docker-compose.yml logs backend | grep -i error
```

##### Issue: API endpoints return 404

**Symptoms**: GET /api/nisab-year-records returns 404 Not Found

**Solution**:

```bash
# Verify route registration
grep "nisab-year-records" server/src/app.ts

# Check build output
ls -la server/dist/routes/nisabYearRecords.js

# Rebuild and restart
npm run build
docker-compose -f docker-compose.yml restart backend
```

#### Performance Considerations

##### Expected Resource Usage

- **Database growth**: ~1KB per Nisab Year Record
- **API calls**: 1 hourly call to Metals API
- **CPU**: Negligible impact (Hawl detection < 1% CPU spike)
- **Memory**: +10MB for cron job overhead

##### Optimization Tips

1. **Indexes**: Prisma automatically creates indexes on foreign keys
2. **Caching**: Nisab thresholds cached for 1 hour
3. **Batch processing**: Hawl detection processes users in batches of 100

#### Security Considerations

##### API Key Protection

```bash
# Ensure .env is not committed
git ls-files | grep "\.env$"
# Should return nothing

# Verify .gitignore
grep "\.env" .gitignore
```

##### Encryption at Rest

All sensitive fields encrypted:

- `totalWealthAtCompletion` (AES-256-CBC)
- `notes` (AES-256-CBC)
- `unlockReason` (AES-256-CBC)

**Verify**:

```bash
# Check encrypted data in database
sqlite3 data/zakapp.db "SELECT totalWealthAtCompletion FROM NisabYearRecord LIMIT 1;"
# Should show encrypted string, not plaintext number
```

##### Access Control

- All endpoints require JWT authentication
- Users can only access their own records
- Finalized records require unlock with reason (audit trail)

#### Compliance and Auditing

##### Audit Trail

All state transitions logged:

```typescript
// Example audit log
{
  eventType: 'FINALIZED',
  timestamp: '2024-01-30T10:30:00Z',
  userId: 'user-123',
  recordId: 'record-456',
  changes: {
    status: { from: 'DRAFT', to: 'FINALIZED' }
  }
}
```

**Query audit logs**:

```bash
sqlite3 data/zakapp.db "SELECT * FROM AuditLog WHERE tableName='NisabYearRecord' ORDER BY timestamp DESC LIMIT 10;"
```

##### Islamic Compliance

- Hawl period: 354 days (lunar year)
- Nisab thresholds: 87.48g gold, 612.36g silver
- Zakat rate: 2.5%
- Locked thresholds prevent manipulation

**Verify constants**:

```bash
grep -r "354\|87\.48\|612\.36\|0\.025" server/src/services/nisabYearRecordService.ts
```

---
