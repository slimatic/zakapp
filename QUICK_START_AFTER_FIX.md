# ✅ Quick Start Guide - Database Fix Applied

**Last Updated**: October 13, 2025  
**Status**: ✅ All services operational

---

## 🎉 What's Fixed

Your ZakApp environment is now fully functional:

- ✅ Database initialized (476KB with schema)
- ✅ All 5 Prisma migrations applied
- ✅ Secure JWT_SECRET and ENCRYPTION_KEY configured
- ✅ Registration API working
- ✅ User authentication operational
- ✅ Frontend accessible at http://localhost:3000
- ✅ Backend API at http://localhost:3001

---

## 🚀 Test Your Application Now

### Step 1: Open the Application

```bash
# Open in your default browser
xdg-open http://localhost:3000
# OR manually navigate to: http://localhost:3000
```

### Step 2: Register a New Account

1. Click **"Create one now"** or **"Register"**
2. Fill in the registration form:
   - **Email**: Use a valid email format (e.g., `your.name@example.com`)
   - **Password**: Must be at least 8 characters
   - **First Name**: Your first name
   - **Last Name**: Your last name
3. Click **"Create Account"**
4. ✅ You should be logged in automatically!

### Step 3: Explore the App

After registration, you can:

- **Dashboard**: View your Zakat calculation overview
- **Assets**: Add your assets (cash, gold, silver, crypto, etc.)
- **Calculate**: Calculate your Zakat obligation
- **Snapshots**: View yearly Zakat snapshots
- **Profile**: Manage your account settings

---

## 📊 Service Status

Check your services are running:

```bash
docker compose ps
```

**Expected Output**:
```
NAME                 STATUS              PORTS
zakapp-backend-1     Up                  0.0.0.0:3001->3001/tcp
zakapp-frontend-1    Up                  0.0.0.0:3000->3000/tcp
```

---

## 🔍 Verify Database

### Check Database File Size

```bash
docker compose exec backend ls -lh /app/server/prisma/data/dev.db
```

**Expected**: Should show ~476KB (not 0 bytes!)

### Check Migration Status

```bash
docker compose exec backend npx prisma migrate status
```

**Expected**: "Database schema is up to date!"

---

## 🧪 Quick API Tests

### Test Registration (using curl)

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "firstName": "New",
    "lastName": "User"
  }'
```

**Expected**: JSON response with `"success": true` and user data + tokens

### Test Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456"
  }'
```

**Expected**: JSON response with tokens

### Test Health Check

```bash
curl http://localhost:3001/health
```

**Expected**: 
```json
{"status":"ok","timestamp":"..."}
```

---

## 📝 View Logs

### Backend Logs

```bash
# View last 50 lines
docker compose logs backend --tail=50

# Follow logs in real-time
docker compose logs backend -f

# Search for errors
docker compose logs backend | grep -i error
```

### Frontend Logs

```bash
# View last 50 lines
docker compose logs frontend --tail=50

# Follow logs in real-time
docker compose logs frontend -f
```

---

## 🛠 Common Commands

### Restart Services

```bash
# Restart all services
docker compose restart

# Restart only backend
docker compose restart backend

# Restart only frontend
docker compose restart frontend
```

### Stop Services

```bash
docker compose down
```

### Start Services

```bash
docker compose up -d
```

### View Container Status

```bash
docker compose ps
```

---

## 🗄 Database Management

### Create Database Backup

```bash
# Copy database to host
docker compose cp backend:/app/server/prisma/data/dev.db ./backups/dev-$(date +%Y%m%d-%H%M%S).db

# Or directly on host (since it's volume-mounted)
cp server/prisma/data/dev.db backups/dev-$(date +%Y%m%d-%H%M%S).db
```

### View Database with Prisma Studio

```bash
docker compose exec backend npx prisma studio
```

Then open: http://localhost:5555

### Clean/Reset Database

#### Option 1: Delete All Users (Keep Schema)

Remove all test users but keep the database structure:

```bash
# Delete all users and their related data
docker compose exec -T backend npx prisma db execute --stdin <<'EOF'
DELETE FROM Asset;
DELETE FROM RefreshToken;
DELETE FROM YearlySnapshot;
DELETE FROM PaymentRecord;
DELETE FROM CalculationHistory;
DELETE FROM User;
EOF
```

#### Option 2: Full Database Reset (Recommended)

Drop all tables and re-run migrations (fresh start):

```bash
# This will drop all tables and re-run migrations
docker compose exec backend npx prisma migrate reset

# You'll be prompted to confirm - type 'y' to proceed
# Add --skip-seed to skip seed data
docker compose exec backend npx prisma migrate reset --skip-seed
```

#### Option 3: Delete Specific User

Use Prisma Studio for visual management:

```bash
# Open Prisma Studio
docker compose exec backend npx prisma studio
```

Then:
1. Navigate to http://localhost:5555
2. Click on "User" model
3. Select users to delete
4. Click delete button

#### Option 4: Complete Fresh Start

Delete database file and recreate:

```bash
# Stop containers
docker compose down

# Delete the database file
rm server/prisma/data/dev.db

# Start containers and run migrations
docker compose up -d
docker compose exec backend npx prisma migrate deploy
```

---

## 🐛 Troubleshooting

### Registration Still Fails?

1. **Check backend logs**:
   ```bash
   docker compose logs backend --tail=100
   ```

2. **Verify database is initialized**:
   ```bash
   docker compose exec backend ls -lh /app/server/prisma/data/dev.db
   ```
   Should be ~476KB, not 0 bytes

3. **Check migration status**:
   ```bash
   docker compose exec backend npx prisma migrate status
   ```

4. **Restart backend**:
   ```bash
   docker compose restart backend
   ```

### Frontend Not Loading?

1. **Check frontend is running**:
   ```bash
   docker compose ps frontend
   ```

2. **Check frontend logs**:
   ```bash
   docker compose logs frontend --tail=50
   ```

3. **Verify port 3000 is accessible**:
   ```bash
   curl http://localhost:3000
   ```

4. **Clear browser cache** or try incognito mode

### API Requests Failing?

1. **Verify backend is running**:
   ```bash
   curl http://localhost:3001/health
   ```

2. **Check CORS configuration** (if using different domain)

3. **Verify JWT tokens** are being sent in Authorization header

4. **Check API endpoint** matches your request

---

## 📚 Additional Resources

- **Full Specification**: See `specs/001-zakapp-specification-complete/spec.md`
- **API Contracts**: See `specs/001-zakapp-specification-complete/contracts/`
- **Database Fix Details**: See `DATABASE_INITIALIZATION_FIX.md`
- **Development Guide**: See `DEVELOPMENT.md`
- **Docker Guide**: See `DOCKER.md`
- **Manual Testing**: See `MANUAL_TESTING_GUIDE.md`

---

## ✅ Success Checklist

Before you start using the app, verify:

- [ ] Docker containers are running (`docker compose ps`)
- [ ] Database file exists and is >400KB
- [ ] Backend responds to health check
- [ ] Frontend loads in browser
- [ ] Registration creates a new user successfully
- [ ] Login works with registered credentials
- [ ] Dashboard displays after login

---

## 🎯 What to Test

### Basic Functionality

1. **Authentication Flow**:
   - ✅ Register new user
   - ✅ Login with credentials
   - ✅ Logout
   - ✅ Login again (verify session persistence)

2. **Asset Management**:
   - ✅ Add a cash asset
   - ✅ Add a gold asset
   - ✅ Edit an asset
   - ✅ Delete an asset

3. **Zakat Calculation**:
   - ✅ View Zakat calculation on dashboard
   - ✅ Change methodology (Standard, Hanafi, etc.)
   - ✅ Verify nisab threshold updates
   - ✅ Check calculation is correct (2.5% of zakatable assets)

4. **Yearly Snapshots**:
   - ✅ Create a snapshot
   - ✅ View snapshots list
   - ✅ Compare snapshots year-over-year

### Advanced Features

5. **Payment Tracking**:
   - ✅ Record a Zakat payment
   - ✅ View payment history
   - ✅ Mark payment as complete

6. **Profile Management**:
   - ✅ Update personal information
   - ✅ Change password
   - ✅ Update preferences (calendar, methodology)

7. **Data Export**:
   - ✅ Export assets as JSON
   - ✅ Export calculation report as PDF

---

## 🔐 Security Notes

### Development Environment

Current setup uses:
- ✅ Secure randomly-generated encryption keys
- ✅ JWT tokens with proper expiration
- ✅ bcrypt password hashing (12 rounds)
- ✅ Encrypted sensitive user data (AES-256-CBC)

### For Production Deployment

⚠️ **Important**: Before deploying to production:

1. **Generate new secrets**:
   ```bash
   # New encryption key
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # New JWT secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Use environment variables** - Don't commit secrets to git

3. **Enable HTTPS** - Never use HTTP in production

4. **Set up database backups** - Regular automated backups

5. **Monitor logs** - Set up error tracking and monitoring

---

## 🎉 You're All Set!

Your ZakApp development environment is ready to use.

**Next Steps**:
1. Open http://localhost:3000 in your browser
2. Register a new account
3. Start adding your assets
4. Calculate your Zakat obligation

**Need Help?**
- Check the troubleshooting section above
- Review the detailed fix documentation in `DATABASE_INITIALIZATION_FIX.md`
- Check API contracts in `specs/001-zakapp-specification-complete/contracts/`

---

**Happy Coding! 🚀**

---

**Document Version**: 1.0  
**Last Updated**: October 13, 2025  
**Maintained By**: ZakApp Development Team
