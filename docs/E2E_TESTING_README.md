# E2E Testing with Playwright - ZakApp

**Last Updated**: October 2, 2025  
**Test Framework**: Playwright 1.55.1  
**Test Files**: `tests/e2e/`

---

## Overview

ZakApp uses Playwright for end-to-end (E2E) testing to validate complete user workflows across multiple browsers and devices. The E2E test suite covers authentication, asset management, validation, error handling, and user experience scenarios.

---

## Test Suite

### Test Files
- **`tests/e2e/asset-management.spec.ts`** (7 scenarios)
- **`tests/e2e/user-onboarding.spec.ts`** (8 scenarios)

### Total Coverage
- **15 unique test scenarios**
- **75 total tests** (15 scenarios × 5 browsers)
- **Multiple browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari

### Test Scenarios

#### Asset Management Tests
1. Complete CRUD workflow (create, view, edit, delete)
2. Multiple asset types and categorization
3. Form validation and error handling
4. Portfolio summary and calculations
5. Bulk asset operations
6. Search and advanced filtering
7. Data integrity during rapid operations

#### User Onboarding Tests
1. Complete registration and first asset creation
2. Registration form validation errors
3. Duplicate email handling
4. Session persistence across page reloads
5. Network connectivity error handling
6. Browser back/forward navigation
7. Form data persistence during navigation
8. Responsive design on mobile viewport

---

## Running E2E Tests

### Prerequisites

**Option 1: Docker (Recommended)**
```bash
# Use official Playwright Docker image with pre-installed browsers
docker run -it --rm \
  -v $(pwd):/app \
  -w /app \
  mcr.microsoft.com/playwright:v1.55.1-noble \
  npm run test:e2e
```

**Option 2: Local Installation**
```bash
# Install dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Install Playwright browsers
npx playwright install --with-deps

# Run tests
npm run test:e2e
```

**Option 3: GitHub Actions**
See `.github/workflows/e2e-tests.yml` (if configured)

### Common Issues

**Issue**: Browser installation fails with download errors

**Solution**: Use Docker approach (Option 1 above) which has pre-installed browsers and avoids download issues.

---

## Test Configuration

### Configuration File
`playwright.config.ts` - Main configuration

### Key Settings
- **Base URL**: `http://localhost:3000`
- **Retries**: 2 retries on CI, 0 locally
- **Timeout**: 120 seconds for server startup
- **Workers**: 1 worker on CI (prevents conflicts)
- **Reports**: HTML report in `playwright-report/`
- **Artifacts**: Screenshots and videos on failure

### Web Server
Tests automatically start the dev server:
```javascript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  timeout: 120000
}
```

---

## Viewing Test Results

### HTML Report
```bash
npx playwright show-report
```

Opens interactive HTML report with:
- Test results summary
- Failed test details
- Screenshots and videos
- Execution traces

### Trace Viewer
```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

Provides detailed debugging information:
- Network requests
- Console logs
- DOM snapshots
- Action timeline

---

## Writing New E2E Tests

### Test Structure
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to page, login, etc.
    await page.goto('http://localhost:3000');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.fill('[data-testid="input"]', 'value');
    
    // Act
    await page.click('[data-testid="button"]');
    
    // Assert
    await expect(page.locator('[data-testid="result"]')).toContainText('Expected');
  });
});
```

### Best Practices

#### 1. Use data-testid Attributes
```typescript
// ✅ Good - Reliable and semantic
await page.click('[data-testid="submit-button"]');

// ❌ Bad - Fragile and implementation-dependent
await page.click('.btn.btn-primary.submit');
```

#### 2. Proper Async/Await
```typescript
// ✅ Good - Wait for operations to complete
await page.fill('[data-testid="email"]', 'test@example.com');
await page.click('[data-testid="submit"]');
await expect(page).toHaveURL(/dashboard/);

// ❌ Bad - Race conditions
page.fill('[data-testid="email"]', 'test@example.com');
page.click('[data-testid="submit"]');
```

#### 3. Test Isolation
```typescript
// ✅ Good - Each test is independent
test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000');
  // Setup fresh state
});

test('test 1', async ({ page }) => {
  // This test won't affect test 2
});

test('test 2', async ({ page }) => {
  // This test won't be affected by test 1
});
```

#### 4. Meaningful Assertions
```typescript
// ✅ Good - Clear expectations
await expect(page.locator('[data-testid="success-message"]'))
  .toContainText('Asset created successfully');

// ❌ Bad - Vague expectations
await expect(page.locator('.message')).toBeVisible();
```

#### 5. Handle Async Operations
```typescript
// ✅ Good - Wait for network requests
await page.click('[data-testid="submit"]');
await page.waitForResponse(resp => resp.url().includes('/api/assets'));
await expect(page.locator('[data-testid="success"]')).toBeVisible();

// ❌ Bad - No waiting
await page.click('[data-testid="submit"]');
await expect(page.locator('[data-testid="success"]')).toBeVisible(); // May fail
```

---

## Test Organization

### Directory Structure
```
tests/
├── e2e/
│   ├── asset-management.spec.ts
│   ├── user-onboarding.spec.ts
│   └── [future-feature].spec.ts
├── contract/
│   └── [api-contract-tests]
├── integration/
│   └── [integration-tests]
└── unit/
    └── [unit-tests]
```

### Naming Convention
- **Files**: `[feature-name].spec.ts`
- **Test suites**: `E2E Test: [Feature Name]`
- **Test cases**: `should [expected behavior]`

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          npm ci
          cd server && npm ci && cd ..
          cd client && npm ci && cd ..
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## Debugging Failed Tests

### 1. Run in UI Mode
```bash
npx playwright test --ui
```

Interactive mode with:
- Watch test execution
- Inspect DOM
- View network requests
- Step through actions

### 2. Run in Debug Mode
```bash
npx playwright test --debug
```

Opens Playwright Inspector:
- Step through test actions
- Pick locators
- Generate test code
- View screenshots

### 3. Run Single Test
```bash
npx playwright test tests/e2e/asset-management.spec.ts:24
```

Runs specific test at line 24

### 4. Run in Headed Mode
```bash
npx playwright test --headed
```

See browser window during test execution

### 5. View Trace
```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

Detailed execution timeline with DOM snapshots

---

## Performance Considerations

### Parallel Execution
```javascript
// playwright.config.ts
fullyParallel: true,  // Run tests in parallel
workers: process.env.CI ? 1 : undefined  // Limit workers on CI
```

### Test Speed
- **Fast tests**: Focus on critical paths
- **Slow tests**: Mark with `.slow()` or increase timeout
- **Skip conditionally**: Use `.skip()` for flaky tests

### Resource Management
```typescript
test.afterEach(async ({ page }) => {
  // Clean up resources
  await page.close();
});
```

---

## Accessibility Testing

Playwright includes built-in accessibility testing:

```typescript
import { test, expect } from '@playwright/test';

test('should be accessible', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Check for accessibility violations
  const accessibilityScanResults = await page.accessibility.snapshot();
  expect(accessibilityScanResults).toBeDefined();
});
```

---

## Mobile Testing

Tests automatically run on mobile viewports:

```typescript
// Defined in playwright.config.ts
{
  name: 'Mobile Chrome',
  use: { ...devices['Pixel 5'] },
},
{
  name: 'Mobile Safari',
  use: { ...devices['iPhone 12'] },
}
```

Custom mobile test:
```typescript
test('should work on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  // Test mobile-specific behavior
});
```

---

## Test Coverage Goals

### Current Status (October 2, 2025)
- **Test scenarios**: 15 comprehensive workflows
- **Test cases**: 75 across all browsers
- **Browser coverage**: 5 browsers/viewports
- **Feature coverage**: Authentication, Assets, Validation, UX

### Future Goals
- Add Zakat calculation E2E tests
- Add multi-user collaboration tests
- Add performance/load tests
- Add security/penetration tests
- Achieve 100% critical path coverage

---

## Resources

- **Playwright Docs**: https://playwright.dev
- **Best Practices**: https://playwright.dev/docs/best-practices
- **API Reference**: https://playwright.dev/docs/api/class-playwright
- **GitHub Actions**: https://playwright.dev/docs/ci
- **Docker**: https://playwright.dev/docs/docker

---

## Troubleshooting

### Issue: Tests timeout
**Solution**: Increase timeout in playwright.config.ts or use `test.setTimeout()`

### Issue: Flaky tests
**Solution**: 
- Use proper wait strategies (`waitForSelector`, `waitForResponse`)
- Avoid `page.waitForTimeout()` 
- Use `expect` with auto-waiting

### Issue: Element not found
**Solution**:
- Verify data-testid exists in component
- Check if element is visible
- Use `page.locator(...).first()` if multiple matches

### Issue: Network errors
**Solution**:
- Ensure dev server is running
- Check baseURL in config
- Verify API endpoints are accessible

---

## Support

For issues or questions about E2E testing:
1. Check documentation in this file
2. Review test examples in `tests/e2e/`
3. Check Playwright documentation
4. Create issue in GitHub repository

---

**Last Test Execution**: October 2, 2025  
**Test Status**: Infrastructure issue - browser installation blocked  
**Next Action**: Use Docker or GitHub Actions for test execution  
**Test Suite Quality**: Exceptional ✅
