# Fix Applied: Shared Package Module System Issues

## Problem
The backend server was crashing with `ERR_REQUIRE_ESM` errors because the server (CommonJS) was trying to import from the shared package (ES modules) source files instead of the compiled dist folder.

## Root Causes
1. **Server tsconfig** pointed to `../shared/src` instead of `../shared/dist`
2. **Server imports** used `../../../shared/src/types` instead of `@zakapp/shared`
3. **Shared package exports** didn't support CommonJS (require)
4. **ES module imports** missing `.js` extensions in source files

## Fixes Applied

### 1. Updated Server tsconfig.json
```json
"paths": {
  "@/*": ["./src/*"],
  "@zakapp/shared": ["../shared/dist/index.d.ts"],
  "@zakapp/shared/*": ["../shared/dist/*"]
}
```
- Removed `"@shared/*"` alias
- Added `@zakapp/shared` pointing to compiled dist folder
- Removed `../shared/**/*` from include array

### 2. Updated All Server Imports
Changed from:
```typescript
import { ... } from '../../../shared/src/types';
import { ... } from '@shared/types/tracking';
```

To:
```typescript
import { ... } from '@zakapp/shared';
import { ... } from '@zakapp/shared/types/tracking';
```

### 3. Updated Shared package.json Exports
Added CommonJS support:
```json
"exports": {
  ".": {
    "import": "./dist/index.js",
    "require": "./dist/index.js",
    "types": "./dist/index.d.ts"
  },
  "./types/tracking": {
    "import": "./dist/types/tracking.js",
    "require": "./dist/types/tracking.js",
    "types": "./dist/types/tracking.d.ts"
  }
}
```

### 4. Fixed ES Module Imports in shared/src/index.ts
Added `.js` extensions:
```typescript
export * from './types.js';
export * from './constants.js';
export * from './schemas.js';
```

### 5. Rebuilt Shared Package
```bash
cd shared && npm run build
```

## Current Status

✅ **Client**: Compiles successfully with only TypeScript warnings (non-critical test issues)
⏳ **Server**: Starts but appears to hang during initialization

## Next Steps

The server hangs after "JWT secrets not found..." message. This suggests an issue with:
- Route imports causing a hang
- Database connection timing out
- Job scheduler blocking
- Circular dependencies

### Debugging Recommendations

1. **Test server startup without routes:**
   - Comment out route imports in `server/src/app.ts` one by one
   - Identify which route is causing the hang

2. **Check database connection:**
   - Ensure SQLite database file exists
   - Check if database connection is blocking

3. **Disable job scheduler:**
   - Comment out `initializeJobs()` call
   - See if server starts without background jobs

4. **Run with detailed logging:**
   ```bash
   cd server && NODE_OPTIONS='--trace-warnings' npm run dev
   ```

## Files Modified

### Server
- `/home/lunareclipse/zakapp/server/tsconfig.json`
- All `.ts` files in `/home/lunareclipse/zakapp/server/src/` (import statements)

### Client  
- `/home/lunareclipse/zakapp/client/tsconfig.json`
- All `.ts` and `.tsx` files in `/home/lunareclipse/zakapp/client/src/` (import statements)

### Shared
- `/home/lunareclipse/zakapp/shared/package.json`
- `/home/lunareclipse/zakapp/shared/src/index.ts`
- Rebuilt `/home/lunareclipse/zakapp/shared/dist/`
