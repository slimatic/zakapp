# Fix Stale JWT Token Issue

## Problem
The JWT token in your browser contains a userId (`mgmbkmxt28bvv77s3fb`) that no longer exists in the database, causing foreign key constraint errors when trying to create yearly snapshots.

## Root Cause
This happens when:
1. The database was reset/migrated but the browser still has old tokens
2. The user account was deleted but the JWT token is still valid and hasn't expired
3. You're using a token from a different environment (e.g., production token with development database)

## Current Database Users
- `mg3rn9uuj7a0y3mc7ni` - salim31@gmail.com
- `mg3rsuzb5z1hmv9wrwv` - jdoe@gmail.com  
- `mgfcc858pn6w0ptazq` - test@zakapp.local

## Solutions

### Solution 1: Log Out and Log In Again (Easiest)
1. Open the application in your browser
2. Click the logout button (if available)
3. Log in again with one of the existing users:
   - salim31@gmail.com
   - jdoe@gmail.com
   - test@zakapp.local
4. Try creating a yearly snapshot again

### Solution 2: Clear Browser Storage (If logout doesn't work)
1. Open browser Developer Tools (F12)
2. Go to the "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Find "Local Storage" or "Session Storage"
4. Clear all items related to zakapp
5. Refresh the page
6. Log in again

### Solution 3: Use Browser Console (Quick Fix)
1. Open browser Developer Tools (F12)
2. Go to the "Console" tab
3. Run this command:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```
4. Log in again

### Solution 4: Create a New User (If you don't have credentials)
If you don't have the passwords for existing users, create a new account:
1. Use the registration/signup page
2. Create a new user account
3. Log in with the new credentials

## Prevention
To prevent this issue in the future:
- Always log out before resetting the database
- Set shorter JWT expiration times during development
- Consider adding token refresh logic that validates user existence

## Technical Details
The error occurred because:
- JWT token contains: `userId: mgmbkmxt28bvv77s3fb`
- Database foreign key constraint: `yearly_snapshots.userId -> users.id`
- User `mgmbkmxt28bvv77s3fb` doesn't exist in users table
- Foreign key constraint prevents orphaned records

## Verification
After logging in again, verify the token contains a valid userId by checking:
```javascript
// In browser console
const token = localStorage.getItem('token'); // or wherever it's stored
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Current userId:', payload.userId);
```

Then check if that userId exists:
```bash
cd /home/lunareclipse/zakapp/server
sqlite3 prisma/data/dev.db "SELECT id, email FROM users WHERE id = 'YOUR_USER_ID';"
```
