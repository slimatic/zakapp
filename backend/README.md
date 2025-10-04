# Backend Test Implementation

**Purpose**: Test implementation for specification 002-001 (Implementation Verification)  
**Status**: Separate from production code  
**Production Code Location**: `../server/`

## Overview

This directory contains a **test implementation** of the backend created for specification `002-001-implementation-verification`. It serves as a reference implementation and contains test suites to verify the implementation approach.

## Relationship to Production Code

- **This directory (`backend/`)**: Test implementation and verification for spec 002
- **Production directory (`../server/`)**: Main application backend used in development and production

The `backend/` directory was created to:
1. Verify implementation patterns for spec 002-001
2. Provide test implementations demonstrating best practices
3. Contain test suites specific to spec 002 verification

## Structure

```
backend/
├── src/
│   ├── __tests__/        # Test suites for spec 002 verification (14 test files)
│   ├── models/           # Test data models
│   ├── services/         # Test service implementations
│   ├── routes/           # Test API routes
│   ├── middleware/       # Test middleware
│   └── utils/            # Test utilities
└── package.json          # Dependencies for test implementation
```

## Usage

This directory is referenced in:
- `specs/002-001-implementation-verification/plan.md` - Specification planning
- Test suites within `src/__tests__/` directory

## Important Note

⚠️ **Do not confuse with production code**: The main application backend is in `../server/`, not here.

For production development, always work in the `../server/` directory.

## References

- [Specification 002-001](../specs/002-001-implementation-verification/spec.md)
- [Implementation Plan](../specs/002-001-implementation-verification/plan.md)
- [Production Backend](../server/)
