# Frontend Test Implementation

**Purpose**: Test implementation for specification 002-001 (Implementation Verification)  
**Status**: Separate from production code  
**Production Code Location**: `../client/`

## Overview

This directory contains a **test implementation** of the frontend created for specification `002-001-implementation-verification`. It serves as a reference implementation and contains test suites to verify the implementation approach.

## Relationship to Production Code

- **This directory (`frontend/`)**: Test implementation and verification for spec 002
- **Production directory (`../client/`)**: Main application frontend used in development and production

The `frontend/` directory was created to:
1. Verify React component patterns for spec 002-001
2. Provide test implementations demonstrating UI best practices
3. Contain test suites specific to spec 002 verification

## Structure

```
frontend/
├── src/
│   ├── components/          # Test React components
│   │   ├── ui/             # UI component tests
│   │   └── __tests__/      # Component test suites
│   ├── pages/              # Test page components
│   ├── services/           # Test API client services
│   ├── test/               # Test utilities and setup
│   └── utils/              # Test helper utilities
├── package.json            # Dependencies for test implementation
└── vite.config.ts          # Test build configuration
```

## Usage

This directory is referenced in:
- `specs/002-001-implementation-verification/plan.md` - Specification planning
- Test suites within component directories

## Important Note

⚠️ **Do not confuse with production code**: The main application frontend is in `../client/`, not here.

For production development, always work in the `../client/` directory.

## Technology Stack

- React 18.2
- TypeScript 5.2
- Vite 4.5 (build tool)
- Vitest (testing framework)
- Tailwind CSS 3.3

## References

- [Specification 002-001](../specs/002-001-implementation-verification/spec.md)
- [Implementation Plan](../specs/002-001-implementation-verification/plan.md)
- [Production Frontend](../client/)
