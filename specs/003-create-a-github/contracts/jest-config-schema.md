# Jest Configuration Schema

**Purpose**: Define the required and recommended settings for Jest configuration files

## Schema Definition

```javascript
module.exports = {
  // Test Discovery
  preset: string,                     // OPTIONAL: 'ts-jest', '@shelf/jest-mongodb', etc.
  testEnvironment: string,            // REQUIRED: 'node' (backend) or 'jsdom' (frontend)
  roots: string[],                    // RECOMMENDED: ['<rootDir>/src']
  testMatch: string[],                // OPTIONAL: Test file patterns
  testPathIgnorePatterns: string[],   // OPTIONAL: Paths to ignore
  
  // Transformation
  transform: {                        // REQUIRED for TypeScript
    '^.+\\.tsx?$': string             // e.g., 'ts-jest'
  },
  
  // Coverage Configuration
  collectCoverage: boolean,           // OPTIONAL: Set via CLI flag instead
  coverageDirectory: string,          // REQUIRED: 'coverage'
  coverageReporters: string[],        // REQUIRED: ['json', 'lcov', 'text', 'clover']
  collectCoverageFrom: string[],      // RECOMMENDED: Source file patterns
  coverageThreshold: {                // OPTIONAL but recommended
    global: {
      branches: number,               // e.g., 80
      functions: number,              // e.g., 80
      lines: number,                  // e.g., 80
      statements: number              // e.g., 80
    }
  },
  
  // Setup and Teardown
  setupFilesAfterEnv: string[],       // OPTIONAL: Setup files
  globalSetup: string,                // OPTIONAL: Global setup script
  globalTeardown: string,             // OPTIONAL: Global teardown script
  
  // Module Resolution
  moduleNameMapper: {                 // OPTIONAL: Path aliases
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  moduleFileExtensions: string[],     // RECOMMENDED: ['ts', 'tsx', 'js', 'jsx', 'json']
  
  // Performance
  maxWorkers: string|number,          // RECOMMENDED for CI: '50%'
  
  // Other
  verbose: boolean,                   // OPTIONAL: Detailed test output
  bail: number,                       // OPTIONAL: Stop after N failures
  testTimeout: number                 // OPTIONAL: Default 5000ms
}
```

## Validation Rules

### REQUIRED Settings
- ✅ `testEnvironment` must be set ('node' for backend, 'jsdom' for frontend)
- ✅ `coverageDirectory` must be 'coverage' (for consistent Codecov uploads)
- ✅ `coverageReporters` must include 'json' and 'lcov' (for Codecov)
- ✅ `transform` must handle TypeScript files if using TS

### RECOMMENDED Settings
- 📝 `roots` should point to source directory
- 📝 `collectCoverageFrom` should include source files and exclude tests
- 📝 `maxWorkers` should be '50%' for CI environments
- 📝 `coverageThreshold` should enforce minimum coverage (e.g., 80%)

### ANTI-PATTERNS (Avoid)
- ❌ `setupFilesAfterEnv` should NOT mock `process.exit()`
- ❌ Should NOT use `--forceExit` CLI flag (indicates process issues)
- ❌ `testTimeout` should not be excessively high (indicates slow tests)
- ❌ Should NOT disable coverage for critical code paths

## Example: Backend Jest Config

```javascript
// backend/jest.config.cjs
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts'],
  
  // TypeScript transformation
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  
  // Coverage configuration
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/index.ts', // Entry point, tested via integration
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Setup file (if needed)
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Performance for CI
  maxWorkers: process.env.CI ? '50%' : '100%',
  
  // Other settings
  verbose: true,
  testTimeout: 10000, // 10 seconds
}
```

## Example: Frontend Jest Config

```javascript
// frontend/jest.config.cjs
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // For React components
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.tsx', '**/*.test.tsx'],
  
  // TypeScript + JSX transformation
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  
  // Coverage configuration
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/main.tsx', // Entry point
  ],
  
  // Module resolution for React
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // Setup file for React Testing Library
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  
  // Performance
  maxWorkers: process.env.CI ? '50%' : '100%',
}
```

## Example: Jest Setup File (GOOD)

```javascript
// jest.setup.cjs - Proper usage
import '@testing-library/jest-dom' // Extend matchers

// Database setup for integration tests
beforeEach(async () => {
  await resetDatabase() // Clean state before each test
})

afterEach(async () => {
  await cleanupDatabase() // Clean up after each test
})

// Global test utilities
global.testHelper = {
  createMockUser: () => ({ id: '1', email: 'test@example.com' }),
}
```

## Example: Jest Setup File (BAD)

```javascript
// jest.setup.cjs - ANTI-PATTERN
// ❌ DO NOT MOCK process.exit()
process.exit = jest.fn() // BAD: Masks real issues

// Instead, fix the root cause:
// - Remove process.exit() from application code
// - Use proper error handling
// - Let tests catch and assert on errors
```

## Validation Checklist

Before committing Jest config changes:
- [ ] `coverageDirectory` is set to 'coverage'
- [ ] `coverageReporters` includes 'json' and 'lcov'
- [ ] `testEnvironment` is appropriate (node vs jsdom)
- [ ] No `process.exit()` mocking in setup files
- [ ] `maxWorkers` is optimized for CI (50%)
- [ ] Coverage thresholds are reasonable
- [ ] Module mappings match tsconfig paths

## Testing Configuration Changes

```bash
# Verify configuration is valid
npm test -- --showConfig

# Test coverage generation locally
npm run test:coverage

# Verify coverage file exists
ls -lh coverage/coverage-final.json

# Check coverage report
open coverage/lcov-report/index.html
```

## CI/CD Integration

### package.json Script
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage --maxWorkers=50%"
  }
}
```

### GitHub Actions Step
```yaml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Verify coverage file exists
  run: |
    if [ ! -f coverage/coverage-final.json ]; then
      echo "Coverage file not generated!"
      exit 1
    fi
```

---

**Schema Version**: 1.0  
**Last Updated**: October 4, 2025  
**Applies To**: `backend/jest.config.cjs`, `frontend/jest.config.cjs`
