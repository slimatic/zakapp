# Data Model: CI/CD Pipeline Issues Resolution

**Feature**: CI/CD Pipeline Fixes  
**Date**: October 4, 2025  
**Type**: Configuration-Only Feature

---

## Overview

This feature does **not require a traditional data model** as it focuses on CI/CD configuration, workflow files, and test setup. There are no database entities, API resources, or persistent data structures to model.

Instead, this document describes the **configuration structures** and **file schemas** that will be modified or validated.

---

## Configuration Entities

### 1. GitHub Actions Workflow
**Type**: YAML Configuration File  
**Location**: `.github/workflows/*.yml`

**Structure**:
```yaml
name: string                    # Workflow display name
on:                             # Trigger configuration
  push:
    branches: string[]          # Branch patterns
  pull_request:
    branches: string[]

jobs:
  [job_id]:
    runs-on: string             # Runner type (ubuntu-latest)
    strategy:
      matrix:
        node-version: string[]  # [18.x, 20.x]
    steps:
      - name: string
        uses: string            # Action to use
        with: object            # Action parameters
        run: string             # Shell command
        continue-on-error: boolean  # AVOID USAGE
        env: object             # Environment variables
```

**Validation Rules**:
- `name` must be descriptive and unique
- `on` must include at least one trigger
- `jobs` must contain at least one job
- `runs-on` must be a valid runner type
- `continue-on-error` should only be used for truly optional steps
- Matrix `node-version` must include supported versions [18.x, 20.x]

**State Transitions**:
1. **Queued** → Workflow triggered, waiting for runner
2. **In Progress** → Workflow executing on runner
3. **Success** → All steps completed successfully
4. **Failure** → One or more steps failed
5. **Cancelled** → Manually cancelled by user

---

### 2. Jest Configuration
**Type**: JavaScript Configuration File  
**Location**: `backend/jest.config.cjs`, `frontend/jest.config.cjs`

**Structure**:
```javascript
module.exports = {
  preset: string,                  // e.g., 'ts-jest'
  testEnvironment: string,         // 'node' or 'jsdom'
  roots: string[],                 // ['<rootDir>/src']
  testMatch: string[],             // Test file patterns
  transform: object,               // File transformers
  coverageDirectory: string,       // 'coverage'
  coverageReporters: string[],     // ['json', 'lcov', 'text', 'clover']
  collectCoverageFrom: string[],   // Source files to cover
  setupFilesAfterEnv: string[],    // Setup files
  moduleNameMapper: object,        // Path aliases
  maxWorkers: string               // '50%' for CI optimization
}
```

**Validation Rules**:
- `coverageDirectory` must be set to 'coverage'
- `coverageReporters` must include 'json' and 'lcov' for Codecov
- `setupFilesAfterEnv` should not mock `process.exit()` (anti-pattern)
- `maxWorkers` should be set to '50%' for CI environments
- `testEnvironment` must match test type (node for backend, jsdom for React)

---

### 3. Coverage Report
**Type**: JSON Data File  
**Location**: `backend/coverage/coverage-final.json`, `frontend/coverage/coverage-final.json`

**Structure**:
```json
{
  "[file_path]": {
    "path": "string",
    "statementMap": {},
    "fnMap": {},
    "branchMap": {},
    "s": {},         // Statement hits
    "f": {},         // Function hits
    "b": {}          // Branch hits
  }
}
```

**Validation Rules**:
- File must exist after `npm run test:coverage`
- File must be valid JSON
- Must contain coverage data for at least one source file
- Generated before Codecov upload attempt

**Usage**:
- Consumed by Codecov for coverage visualization
- Used by Jest to display coverage summary
- Archived as CI workflow artifact (optional)

---

### 4. Package.json Test Scripts
**Type**: JSON Configuration  
**Location**: `backend/package.json`, `frontend/package.json`

**Structure**:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage --maxWorkers=50%"
  }
}
```

**Validation Rules**:
- `test:coverage` must include `--coverage` flag
- CI should use `--maxWorkers=50%` for performance
- Should not use `--forceExit` (indicates process.exit issues)

---

### 5. Jest Setup File
**Type**: JavaScript Module  
**Location**: `backend/jest.setup.cjs`

**Current Structure** (TO BE REMOVED):
```javascript
// Anti-pattern: Mocking process.exit
process.exit = jest.fn();
```

**Target Structure** (CLEAN):
```javascript
// Setup file for test environment configuration
// No process.exit mocking - proper error handling in app code instead

// Optional: Database setup for integration tests
// Optional: Test environment configuration
```

**Validation Rules**:
- Should NOT mock `process.exit()`
- Should focus on test environment setup only
- Can include database reset logic for integration tests

---

## File Relationships

```
.github/workflows/test.yml
    ├── Executes → backend/package.json scripts
    ├── Executes → frontend/package.json scripts
    └── Uploads → coverage reports to Codecov

backend/jest.config.cjs
    ├── Loads → backend/jest.setup.cjs
    ├── Generates → backend/coverage/coverage-final.json
    └── Executes → backend/src/**/*.test.ts

frontend/jest.config.cjs
    ├── Generates → frontend/coverage/coverage-final.json
    └── Executes → frontend/src/**/*.test.tsx

backend/src/index.ts
    ├── Should NOT call → process.exit()
    └── Should return → Error object on failure
```

---

## Configuration Dependencies

### GitHub Secrets
**Required for Codecov**:
- `CODECOV_TOKEN`: Authentication token for coverage upload
- Must be configured in repository settings
- Referenced in workflow: `${{ secrets.CODECOV_TOKEN }}`

### Environment Variables
**In GitHub Actions**:
- `CI=true`: Automatically set by GitHub Actions
- `NODE_ENV=test`: Set by Jest test environment
- `NODE_VERSION`: From matrix strategy

**In Test Environment**:
- Loaded from `.env.test` or test-specific configuration
- Should NOT include production secrets

---

## Validation Contracts

### Workflow Validation
**Pre-commit checks**:
- [ ] Workflow YAML syntax is valid (yamllint)
- [ ] All referenced actions exist
- [ ] Matrix versions are supported
- [ ] No `continue-on-error` on critical steps

### Test Configuration Validation
**Pre-merge checks**:
- [ ] Jest config includes coverage settings
- [ ] Coverage directory is set to 'coverage'
- [ ] Coverage reporters include 'json' and 'lcov'
- [ ] No process.exit() mocking in setup files

### Coverage Report Validation
**Post-test checks**:
- [ ] Coverage file exists at expected path
- [ ] Coverage file is valid JSON
- [ ] Coverage meets minimum thresholds (if defined)
- [ ] Coverage upload succeeds (or warnings logged)

---

## No Traditional Data Model

This feature does not include:
- ❌ Database tables or schemas
- ❌ API request/response models
- ❌ User-facing data structures
- ❌ Persistent state management
- ❌ Data migrations

All changes are to **configuration files** and **CI/CD workflows**.

---

## Configuration Ownership

| Configuration | Owner | Purpose |
|---------------|-------|---------|
| `.github/workflows/*.yml` | DevOps/CI Team | Workflow definitions |
| `jest.config.cjs` | Backend/Frontend Teams | Test configuration |
| `jest.setup.cjs` | Backend Team | Test environment setup |
| `package.json scripts` | Package Maintainers | Build and test commands |
| `.gitignore` | All Contributors | Exclude generated files |

---

**Data Model Status**: Complete (No entities required)  
**Configuration Contracts**: Defined above  
**Ready for Phase 2**: Task Generation
