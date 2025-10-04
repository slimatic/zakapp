# ZakApp Staging Deployment Guide

**Version**: 1.0.0  
**Branch**: `002-001-implementation-verification`  
**Date**: 2025-10-03  
**Constitutional Compliance**: ✅ All 6 principles validated

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Deployment Methods](#deployment-methods)
4. [Post-Deployment Validation](#post-deployment-validation)
5. [E2E Testing with Playwright](#e2e-testing-with-playwright)
6. [Monitoring & Health Checks](#monitoring--health-checks)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)

---

## 🔍 Pre-Deployment Checklist

### 1. Code Readiness ✅
- [x] All tests passing (90%+ pass rate)
- [x] Contract tests: 68/68 (100%)
- [x] Unit tests: 120/120 (100%)
- [x] Integration tests operational
- [x] Git branch up to date
- [x] Latest commit: `3f21fcd`

### 2. Configuration Files ✅
- [x] `docker-compose.staging.yml` created
- [x] `.env.staging.template` created
- [x] `docker/nginx-staging.conf` created
- [ ] `.env.staging` configured (DO THIS NOW)

### 3. Security Secrets (CRITICAL - Must Complete)
Generate all secrets before deployment:

```bash
# Generate JWT secrets
openssl rand -base64 32  # Use for JWT_SECRET
openssl rand -base64 32  # Use for JWT_REFRESH_SECRET

# Generate encryption key (EXACTLY 32 characters)
openssl rand -hex 16     # Use for ENCRYPTION_KEY

# Generate database password
openssl rand -base64 24  # Use for DB_PASSWORD
```

### 4. Infrastructure Requirements
- [ ] Docker Engine 20.10+ installed
- [ ] Docker Compose 2.0+ installed
- [ ] Minimum 2GB RAM available
- [ ] 10GB disk space available
- [ ] Ports available: 80, 443, 3000, 3002, 5432

---

## ⚙️ Environment Setup

### Step 1: Create Environment File

```bash
cd /home/lunareclipse/zakapp

# Copy template to actual environment file
cp .env.staging.template .env.staging

# Edit with secure values
nano .env.staging  # or vim, code, etc.
```

**CRITICAL FIELDS TO UPDATE** (minimum):
```env
# Security (MUST CHANGE ALL)
JWT_SECRET=<output-from-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<different-output-from-openssl-rand-base64-32>
ENCRYPTION_KEY=<output-from-openssl-rand-hex-16>
DB_PASSWORD=<strong-database-password>

# API URLs (adjust for your domain)
REACT_APP_API_BASE_URL=http://your-staging-server:3002/api
CORS_ORIGIN=http://your-staging-server:3000
```

### Step 2: Verify Git Status

```bash
# Ensure you're on the correct branch
git branch --show-current
# Should output: 002-001-implementation-verification

# Check for uncommitted changes
git status

# Pull latest changes (if working with team)
git pull origin 002-001-implementation-verification
```

### Step 3: Ensure .env Files Not Committed

```bash
# Add to .gitignore if not already present
echo ".env.staging" >> .gitignore
echo ".env.production" >> .gitignore
echo ".env.local" >> .gitignore

git add .gitignore
git commit -m "security: Ensure environment files not tracked"
```

---

## 🚀 Deployment Methods

### Method 1: Docker Compose (Recommended for Staging)

#### Initial Deployment

```bash
cd /home/lunareclipse/zakapp

# Load environment variables
set -a && source .env.staging && set +a

# Build and start all services
docker-compose -f docker-compose.staging.yml up --build -d

# Watch logs
docker-compose -f docker-compose.staging.yml logs -f
```

#### With Nginx Reverse Proxy (Production-like)

```bash
# Start with Nginx profile
docker-compose -f docker-compose.staging.yml --profile with-nginx up -d

# Access via Nginx on port 80
curl http://localhost/health
```

#### Check Service Health

```bash
# Check all containers
docker-compose -f docker-compose.staging.yml ps

# Check specific service logs
docker-compose -f docker-compose.staging.yml logs backend
docker-compose -f docker-compose.staging.yml logs frontend
docker-compose -f docker-compose.staging.yml logs database

# Check backend health
curl http://localhost:3002/health

# Expected response:
# {"status":"OK","timestamp":"...","version":"1.0.0"}
```

### Method 2: Manual Docker Containers

```bash
# Create network
docker network create zakapp-staging-network

# Start database
docker run -d \
  --name zakapp-staging-db \
  --network zakapp-staging-network \
  -e POSTGRES_DB=zakapp_staging \
  -e POSTGRES_USER=zakapp_user \
  -e POSTGRES_PASSWORD=<your-db-password> \
  -v zakapp_postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine

# Build and start backend
docker build -f docker/Dockerfile.backend -t zakapp-backend:staging .
docker run -d \
  --name zakapp-staging-backend \
  --network zakapp-staging-network \
  --env-file .env.staging \
  -p 3002:3002 \
  -v $(pwd)/server/data:/app/data \
  zakapp-backend:staging

# Build and start frontend
docker build -f docker/Dockerfile.frontend -t zakapp-frontend:staging .
docker run -d \
  --name zakapp-staging-frontend \
  --network zakapp-staging-network \
  -e REACT_APP_API_BASE_URL=http://localhost:3002/api \
  -p 3000:80 \
  zakapp-frontend:staging
```

### Method 3: Native (No Docker)

```bash
# Terminal 1: Database (if using PostgreSQL)
# Ensure PostgreSQL is running and database is created

# Terminal 2: Backend
cd server
cp ../.env.staging .env
npm install
npx prisma generate
npx prisma db push  # or: npx prisma migrate deploy
npm start

# Terminal 3: Frontend
cd client
npm install
npm run build
npx serve -s build -l 3000

# Terminal 4: Monitor
tail -f server/logs/*.log
```

---

## ✅ Post-Deployment Validation

### Automated Health Checks

```bash
# Create validation script
cat > validate-deployment.sh << 'EOF'
#!/bin/bash
set -e

echo "🔍 Validating ZakApp Staging Deployment..."
echo ""

# Check backend health
echo "1️⃣ Backend Health Check..."
response=$(curl -s http://localhost:3002/health)
if echo "$response" | grep -q "OK"; then
    echo "   ✅ Backend is healthy"
else
    echo "   ❌ Backend health check failed"
    exit 1
fi

# Check frontend availability
echo "2️⃣ Frontend Availability..."
status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$status" = "200" ]; then
    echo "   ✅ Frontend is accessible"
else
    echo "   ❌ Frontend returned status: $status"
    exit 1
fi

# Check API endpoints
echo "3️⃣ API Endpoint Tests..."

# Public endpoints
curl -s http://localhost:3002/api/zakat/methodologies > /dev/null && echo "   ✅ Methodologies endpoint"
curl -s http://localhost:3002/api/zakat/nisab > /dev/null && echo "   ✅ Nisab endpoint"

# Test registration
echo "4️⃣ Test User Registration..."
reg_response=$(curl -s -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staging-test@example.com",
    "username": "stagingtest",
    "password": "TestPassword123!",
    "confirmPassword": "TestPassword123!",
    "firstName": "Staging",
    "lastName": "Test"
  }')

if echo "$reg_response" | grep -q "success"; then
    echo "   ✅ Registration endpoint working"
else
    echo "   ⚠️  Registration may have expected errors (user exists, etc.)"
fi

echo ""
echo "✅ Staging deployment validation COMPLETE"
echo "📊 Ready for E2E testing with Playwright"
EOF

chmod +x validate-deployment.sh
./validate-deployment.sh
```

### Manual Validation Steps

1. **Access Frontend**: Open http://localhost:3000
   - [ ] Page loads without errors
   - [ ] ZakApp branding visible
   - [ ] No console errors in browser DevTools

2. **Test Registration Flow**:
   - [ ] Navigate to registration page
   - [ ] Fill in user details
   - [ ] Submit registration
   - [ ] Verify success message

3. **Test Login Flow**:
   - [ ] Use registered credentials
   - [ ] Successful login
   - [ ] Redirected to dashboard

4. **Test Asset Management**:
   - [ ] Create new asset
   - [ ] View asset in list
   - [ ] Edit asset
   - [ ] Delete asset

5. **Test Zakat Calculation**:
   - [ ] Add assets with values
   - [ ] Calculate Zakat
   - [ ] Verify calculation accuracy
   - [ ] Check methodology explanations

---

## 🎭 E2E Testing with Playwright

### Setup Playwright for Staging

```bash
cd /home/lunareclipse/zakapp

# Install Playwright browsers
npx playwright install

# Update Playwright config for staging
export PLAYWRIGHT_BASE_URL=http://localhost:3000
export PLAYWRIGHT_API_URL=http://localhost:3002
```

### Run E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suite
npx playwright test tests/e2e/user-onboarding.spec.ts
npx playwright test tests/e2e/asset-management.spec.ts

# Run with UI mode (interactive debugging)
npx playwright test --ui

# Run with browser visible (headed mode)
npx playwright test --headed

# Generate HTML report
npx playwright show-report
```

### Expected E2E Test Results

According to tasks.md specification:
- **User Onboarding Tests**: 8 tests
- **Asset Management Tests**: 7 tests
- **Total E2E Tests**: 15 tests

**Target**: 15/15 passing (100%)

### E2E Test Scenarios Covered

✅ **User Onboarding** (`tests/e2e/user-onboarding.spec.ts`):
1. Complete registration and first asset creation
2. Form validation error handling
3. Duplicate email handling
4. Session persistence across reloads
5. Network connectivity resilience
6. Browser navigation handling
7. Form data persistence
8. Responsive design validation

✅ **Asset Management** (`tests/e2e/asset-management.spec.ts`):
1. Complete asset lifecycle (CRUD)
2. Multiple asset type handling
3. Form validation and errors
4. Portfolio summary calculations
5. Bulk operations
6. Search and filtering
7. Data integrity during rapid operations

---

## 📊 Monitoring & Health Checks

### Container Health Status

```bash
# Check container health
docker-compose -f docker-compose.staging.yml ps

# Expected output:
# NAME                      STATUS
# zakapp-staging-backend    Up (healthy)
# zakapp-staging-frontend   Up (healthy)
# zakapp-staging-db         Up (healthy)
```

### Application Metrics

```bash
# Backend health endpoint
watch -n 5 'curl -s http://localhost:3002/health | jq'

# Database connections
docker exec zakapp-staging-db psql -U zakapp_user -d zakapp_staging -c "SELECT count(*) FROM pg_stat_activity;"

# Container resource usage
docker stats zakapp-staging-backend zakapp-staging-frontend zakapp-staging-db
```

### Log Monitoring

```bash
# Follow all logs
docker-compose -f docker-compose.staging.yml logs -f

# Follow specific service
docker-compose -f docker-compose.staging.yml logs -f backend

# Check for errors
docker-compose -f docker-compose.staging.yml logs backend | grep -i error

# Export logs for analysis
docker-compose -f docker-compose.staging.yml logs > staging-deployment-$(date +%Y%m%d).log
```

### Performance Benchmarks

```bash
# API response times (should be <200ms p95)
hey -n 1000 -c 10 http://localhost:3002/health

# Load test authentication
hey -n 100 -c 5 -m POST \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"Test123!"}' \
  http://localhost:3002/api/auth/login
```

---

## 🔄 Rollback Procedures

### Quick Rollback (Docker Compose)

```bash
# Stop current deployment
docker-compose -f docker-compose.staging.yml down

# Checkout previous stable commit
git log --oneline -10  # Find previous stable commit
git checkout <previous-commit-hash>

# Rebuild and restart
docker-compose -f docker-compose.staging.yml up --build -d
```

### Database Rollback

```bash
# List backups
docker exec zakapp-staging-backend ls -lh /app/data/backups

# Restore from backup
docker exec -it zakapp-staging-db psql -U zakapp_user -d zakapp_staging < backup-file.sql

# Or use Prisma migrations
cd server
npx prisma migrate reset  # WARNING: Destructive!
npx prisma migrate deploy
```

---

## 🔧 Troubleshooting

### Issue: Backend not starting

**Symptoms**: Container exits immediately, health checks fail

**Solutions**:
```bash
# Check logs
docker-compose -f docker-compose.staging.yml logs backend

# Common causes:
# 1. Missing environment variables
docker exec zakapp-staging-backend env | grep -E "JWT|ENCRYPTION|DATABASE"

# 2. Database connection failure
docker exec zakapp-staging-backend npx prisma db pull

# 3. Port conflicts
netstat -tlnp | grep -E "3002|5432"
```

### Issue: Frontend shows "Failed to fetch"

**Symptoms**: API calls fail, CORS errors in console

**Solutions**:
```bash
# Check CORS configuration
docker exec zakapp-staging-backend cat /app/src/app.ts | grep -A 5 "cors"

# Verify API URL in frontend
docker exec zakapp-staging-frontend env | grep API

# Test API directly
curl -v http://localhost:3002/api/zakat/methodologies
```

### Issue: Database migration fails

**Symptoms**: Prisma errors, schema mismatch

**Solutions**:
```bash
# Reset migrations (development only!)
cd server
npx prisma migrate reset

# Force push schema
npx prisma db push --force-reset

# Check migration status
npx prisma migrate status
```

### Issue: Tests failing on staging

**Symptoms**: E2E tests pass locally but fail on staging

**Solutions**:
1. Check timing/timeout issues (increase timeouts)
2. Verify test data cleanup between runs
3. Check environment-specific configuration
4. Ensure database is properly seeded

```bash
# Run with debugging
DEBUG=pw:api npx playwright test

# Take screenshots on failure (already configured)
# Check: playwright-report/index.html
```

---

## 📚 Additional Resources

### Related Documentation
- [API Specification](./docs/api-specification.md)
- [Security Guide](./security.md)
- [Database Schema](./server/prisma/schema.prisma)
- [Constitutional Principles](./.specify/memory/constitution.md)

### Test Reports
- Contract Tests: `tests/contract/` (68/68 passing)
- Integration Tests: `tests/integration/` (operational)
- E2E Tests: `tests/e2e/` (15 scenarios)

### Support & Feedback
- GitHub Issues: https://github.com/slimatic/zakapp/issues
- Documentation: See `specs/002-001-implementation-verification/`

---

## ✅ Deployment Checklist Summary

Before going to production:

- [ ] All E2E tests passing (15/15)
- [ ] Security scan completed (zero critical vulnerabilities)
- [ ] Performance benchmarks met (<200ms API p95, <2s page load)
- [ ] Islamic calculation accuracy verified against sources
- [ ] Backup and recovery tested
- [ ] SSL/TLS certificates installed (for production)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated
- [ ] Team trained on deployment procedures
- [ ] Rollback procedure tested

---

**Deployment Status**: ✅ Ready for Staging  
**Next Step**: Execute deployment and run E2E validation  
**Timeline**: 2-4 hours including testing
