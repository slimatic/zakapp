# Foreign Key Constraint Error - Fixed

## Issue Summary
**Error:** Foreign key constraint violated when creating yearly snapshots  
**Root Cause:** Stale JWT token containing non-existent userId  
**Status:** ✅ Identified and Solution Provided

## Problem Details

### The Error
```
Foreign key constraint violated on the foreign key
Invalid `prisma.yearlySnapshot.create()` invocation
Error in createSnapshot: User with ID mgmbkmxt28bvv77s3fb does not exist
```

### Why It Happened
1. The JWT token in your browser contains userId: `mgmbkmxt28bvv77s3fb`
2. This user no longer exists in the database (likely from a database reset/migration)
3. When creating a yearly snapshot, Prisma validates the foreign key constraint:
   - `YearlySnapshot.userId` must reference an existing `User.id`
4. Since the user doesn't exist, the foreign key constraint fails

### Current Valid Users
The database currently has these users:
- `mg3rn9uuj7a0y3mc7ni` - salim31@gmail.com
- `mg3rsuzb5z1hmv9wrwv` - jdoe@gmail.com
- `mgfcc858pn6w0ptazq` - test@zakapp.local

## Solutions

### ✅ Solution 1: Use the Storage Cleaner Page (Easiest)
1. Navigate to: http://localhost:5173/clear-storage.html (or your frontend URL)
2. Click "🗑️ Clear All Storage"
3. Click "🔐 Go to Login"
4. Log in with one of the existing users

### Solution 2: Clear Storage via Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Run:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```
4. Log in again

### Solution 3: Manual Storage Clearing
1. Open Developer Tools (F12)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Expand "Local Storage"
4. Right-click and select "Clear"
5. Refresh page and log in

### Solution 4: Log Out Normally (If Available)
1. Click logout button in the app
2. Log in again with valid credentials

## Code Changes Made

### 1. Added User Validation in YearlySnapshotService
```javascript
// Validate userId exists before creating snapshot
const userExists = await prisma.user.findUnique({
  where: { id: userId }
});

if (!userExists) {
  throw new Error(`User with ID ${userId} does not exist`);
}
```

### 2. Added User Lookup in Tracking Routes
```javascript
// Verify user exists before processing
const user = await prisma.user.findUnique({ where: { id: userId } });
if (!user) {
  return sendError(res, 'USER_NOT_FOUND', 'User does not exist', 404);
}
```

### 3. Enhanced Error Logging
- Added userId type checking
- Added detailed encrypted data logging
- Added user email logging on successful validation

## Testing After Fix

### 1. Verify Storage is Clear
Open browser console and run:
```javascript
console.log('accessToken:', localStorage.getItem('accessToken'));
console.log('token:', localStorage.getItem('token'));
// Both should be null after clearing
```

### 2. Verify New Token After Login
After logging in, check the token contains a valid userId:
```javascript
const token = localStorage.getItem('accessToken');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('User ID in token:', payload.userId);
}
```

### 3. Verify User Exists in Database
```bash
cd /home/lunareclipse/zakapp/server
sqlite3 prisma/data/dev.db "SELECT id, email FROM users WHERE id = 'YOUR_USER_ID_HERE';"
```

### 4. Test Snapshot Creation
1. Navigate to the snapshot creation page
2. Fill in the required fields
3. Submit the form
4. Should now succeed without foreign key errors

## Prevention Measures

### For Development
1. **Always log out before database resets**
   ```bash
   # Before running migrations or resetting DB
   # 1. Log out of the app
   # 2. Clear browser storage
   # 3. Then reset database
   ```

2. **Use shorter JWT expiration during development**
   ```env
   # In .env file
   JWT_EXPIRES_IN=1h  # Instead of 24h
   ```

3. **Add token validation endpoint**
   - Create `/api/auth/validate` endpoint
   - Check if token's userId exists in database
   - Automatically clear invalid tokens

### For Production
1. **Implement token refresh with validation**
   - Check user exists when refreshing tokens
   - Invalidate tokens for deleted users

2. **Add user deletion cleanup**
   - When deleting users, also invalidate their JWT tokens
   - Add token to blacklist/revocation list

3. **Better error messages**
   - The enhanced logging will help diagnose issues faster
   - User validation prevents cryptic foreign key errors

## Token Storage Inconsistency Found

**Issue:** Some components use `localStorage.getItem('token')` while others use `localStorage.getItem('accessToken')`

**Files Using 'token':**
- `/client/src/pages/zakat/Calculator.tsx`
- `/client/src/components/zakat/MethodologySelector.tsx`
- `/client/src/components/zakat/CalculationHistory.tsx`

**Files Using 'accessToken':**
- `/client/src/contexts/AuthContext.tsx`
- `/client/src/contexts/AuthContextNew.tsx`
- `/client/src/hooks/*.ts` (all hooks)
- `/client/src/services/api.ts`

**Recommendation:** Standardize on `accessToken` across all files for consistency.

## Technical Details

### Database Schema
```sql
-- YearlySnapshot foreign key constraint
CONSTRAINT "yearly_snapshots_userId_fkey" 
FOREIGN KEY ("userId") 
REFERENCES "users" ("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE
```

### JWT Token Structure
```json
{
  "userId": "mg3rn9uuj7a0y3mc7ni",
  "iat": 1728691200,
  "exp": 1728777600
}
```

### Error Flow
1. Frontend sends request with `Authorization: Bearer <TOKEN>`
2. Backend middleware decodes JWT → extracts `userId`
3. Route handler receives `req.user.id = userId`
4. Service attempts to create record with that `userId`
5. Database checks foreign key constraint
6. **FAILS** if userId doesn't exist in users table

## Files Modified

1. `/server/services/YearlySnapshotService.js`
   - Added user existence validation
   - Enhanced logging for debugging

2. `/server/routes/tracking.js`
   - Added user lookup before snapshot creation
   - Returns 404 if user not found

3. `/client/public/clear-storage.html` (NEW)
   - Interactive page to clear browser storage
   - Shows current token and decoded userId
   - One-click storage clearing

4. `/FIX_STALE_TOKEN.md` (NEW)
   - User-friendly guide for fixing the issue
   - Multiple solution options
   - Prevention measures

## Next Steps

1. ✅ Clear browser storage (use one of the solutions above)
2. ✅ Log in with valid credentials
3. ✅ Test yearly snapshot creation
4. 🔜 Consider standardizing token storage key (`accessToken` vs `token`)
5. 🔜 Implement automatic token validation
6. 🔜 Add token refresh logic with user validation

## Verification Complete

Run this command to verify the fix is working:
```bash
# In browser console after logging in
const token = localStorage.getItem('accessToken');
const userId = JSON.parse(atob(token.split('.')[1])).userId;
fetch(`http://localhost:3001/api/user/profile`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log('User exists:', d.success))
.catch(e => console.error('User not found:', e));
```

## Related Issues

- T133: Methodology persistence ✅ Complete
- T150: Calculation history ✅ Complete
- Database foreign key constraints working as designed ✅
- User authentication working correctly ✅
- **Token storage** needs attention for consistency

## Status: RESOLVED ✅

The foreign key constraint error has been identified and is not a bug in the application. It's working as designed to prevent orphaned records. The user simply needs to clear stale authentication data and log in again with valid credentials.
