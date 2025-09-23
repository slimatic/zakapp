# npm run dev Error - Solution Summary

## Problem

Users encountering `Cannot find package '@zakapp/shared'` errors when running `npm run dev` on a fresh clone of the repository.

## Root Cause

The project uses a monorepo structure with:

- A shared package (`@zakapp/shared`) that needs to be built before use
- Backend and frontend packages that depend on the shared package via `"file:../shared"`
- The shared package outputs to `dist/` directory which must exist for imports to work

When users cloned the repository and ran `npm run dev` directly without following the proper setup sequence (`npm run install:all`), the shared package wasn't built, causing module resolution failures.

## Solution

Implemented an automatic setup check system that:

1. **Detects missing dependencies** before starting development servers
2. **Automatically runs setup** if needed (installs dependencies and builds shared package)
3. **Provides clear feedback** to users about what's happening
4. **Maintains manual control** with alternative commands

## Technical Implementation

### 1. Setup Check Script (`scripts/check-setup.js`)

- Checks for existence of required directories and files
- Automatically runs `npm run install:all` if setup is incomplete
- Provides clear user feedback and error handling

### 2. Enhanced npm scripts

- `npm run dev`: Now includes automatic setup check
- `npm run dev:force`: Bypasses setup check for advanced users
- Improved shared package build process

### 3. Fixed shared package build

- Updated build script to properly clean TypeScript build cache
- Ensures consistent builds across different environments

### 4. Updated documentation

- Clear instructions for both automatic and manual setup
- Updated troubleshooting section with new behavior

## User Experience

### Before Fix

```bash
git clone https://github.com/slimatic/zakapp.git
cd zakapp
npm run dev  # ❌ FAILS with module resolution errors
```

### After Fix

```bash
git clone https://github.com/slimatic/zakapp.git
cd zakapp
npm run dev  # ✅ WORKS - automatically sets up dependencies
```

## Available Commands

- `npm run dev` - Start development (with automatic setup)
- `npm run dev:force` - Start development (skip setup check)
- `npm run install:all` - Manual complete setup
- `npm run build` - Build all packages for production

## Testing Verification

✅ Fresh clone scenario works  
✅ Missing dependencies detected and fixed automatically  
✅ Shared package builds correctly every time  
✅ Development servers start successfully  
✅ Build process works correctly  
✅ Manual override (dev:force) available  
✅ Documentation updated and accurate

## Files Modified

1. `package.json` - Enhanced dev script and added dev:force
2. `shared/package.json` - Improved build script
3. `scripts/check-setup.js` - New automatic setup detection
4. `README.md` - Updated documentation and troubleshooting

This solution maintains backward compatibility while significantly improving the developer experience for new contributors.
