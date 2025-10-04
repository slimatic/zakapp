import { test, expect } from '@playwright/test';

// Note: This test will fail until the full application is implemented
// This is intentional as per TDD methodology

test.describe('E2E Test: Complete User Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // This will fail until the frontend is properly implemented
    await page.goto('http://localhost:3000');
  });

  test('should complete full user registration and first asset creation', async ({ page }) => {
    // Step 1: Navigate to registration page
    await page.click('[data-testid="register-link"]');
    await expect(page).toHaveURL(/.*\/register/);

    // Step 2: Fill registration form
    await page.fill('[data-testid="email-input"]', 'e2e@test.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="first-name-input"]', 'E2E');
    await page.fill('[data-testid="last-name-input"]', 'Test');

    // Step 3: Submit registration
    await page.click('[data-testid="register-button"]');

    // Step 4: Verify successful registration redirect
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Welcome, E2E');

    // Step 5: Navigate to asset creation
    await page.click('[data-testid="add-asset-button"]');
    await expect(page).toHaveURL(/.*\/assets\/new/);

    // Step 6: Create first asset
    await page.selectOption('[data-testid="asset-type-select"]', 'cash');
    await page.fill('[data-testid="asset-value-input"]', '10000');
    await page.selectOption('[data-testid="currency-select"]', 'USD');
    await page.fill('[data-testid="description-input"]', 'My first asset');

    // Step 7: Submit asset creation
    await page.click('[data-testid="create-asset-button"]');

    // Step 8: Verify asset creation success
    await expect(page).toHaveURL(/.*\/assets/);
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Asset created successfully');

    // Step 9: Verify asset appears in list
    await expect(page.locator('[data-testid="asset-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="asset-description"]')).toContainText('My first asset');
    await expect(page.locator('[data-testid="asset-value"]')).toContainText('$10,000.00');

    // Step 10: Test navigation to asset details
    await page.click('[data-testid="asset-item"]');
    await expect(page).toHaveURL(/.*\/assets\/[a-f0-9-]+/);
    await expect(page.locator('[data-testid="asset-detail-description"]')).toContainText('My first asset');
  });

  test('should handle registration form validation errors', async ({ page }) => {
    await page.click('[data-testid="register-link"]');

    // Test empty form submission
    await page.click('[data-testid="register-button"]');
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required');
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password is required');
    await expect(page.locator('[data-testid="first-name-error"]')).toContainText('First name is required');

    // Test invalid email format
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.click('[data-testid="register-button"]');
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Please enter a valid email address');

    // Test weak password
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'weak');
    await page.click('[data-testid="register-button"]');
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password must be at least 8 characters');

    // Test password mismatch
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'DifferentPass123!');
    await page.click('[data-testid="register-button"]');
    await expect(page.locator('[data-testid="confirm-password-error"]')).toContainText('Passwords do not match');
  });

  test('should handle duplicate email registration', async ({ page }) => {
    // First registration
    await page.click('[data-testid="register-link"]');
    await page.fill('[data-testid="email-input"]', 'duplicate@test.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="first-name-input"]', 'First');
    await page.fill('[data-testid="last-name-input"]', 'User');
    await page.click('[data-testid="register-button"]');

    // Verify first registration succeeds
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Attempt second registration with same email
    await page.click('[data-testid="register-link"]');
    await page.fill('[data-testid="email-input"]', 'duplicate@test.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass456!');
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePass456!');
    await page.fill('[data-testid="first-name-input"]', 'Second');
    await page.fill('[data-testid="last-name-input"]', 'User');
    await page.click('[data-testid="register-button"]');

    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Email already exists');
    await expect(page).toHaveURL(/.*\/register/);
  });

  test('should persist user session across page reloads', async ({ page }) => {
    // Register and login
    await page.click('[data-testid="register-link"]');
    await page.fill('[data-testid="email-input"]', 'session@test.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="first-name-input"]', 'Session');
    await page.fill('[data-testid="last-name-input"]', 'Test');
    await page.click('[data-testid="register-button"]');

    // Verify logged in state
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Welcome, Session');

    // Reload page
    await page.reload();

    // Verify still logged in
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Welcome, Session');
  });

  test('should handle network connectivity issues gracefully', async ({ page }) => {
    // Register successfully first
    await page.click('[data-testid="register-link"]');
    await page.fill('[data-testid="email-input"]', 'network@test.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="first-name-input"]', 'Network');
    await page.fill('[data-testid="last-name-input"]', 'Test');
    await page.click('[data-testid="register-button"]');

    await expect(page).toHaveURL(/.*\/dashboard/);

    // Simulate network failure
    await page.route('**/api/**', route => {
      route.abort('internetdisconnected');
    });

    // Try to create an asset during network failure
    await page.click('[data-testid="add-asset-button"]');
    await page.selectOption('[data-testid="asset-type-select"]', 'cash');
    await page.fill('[data-testid="asset-value-input"]', '5000');
    await page.selectOption('[data-testid="currency-select"]', 'USD');
    await page.fill('[data-testid="description-input"]', 'Network test asset');
    await page.click('[data-testid="create-asset-button"]');

    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Network error');
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

    // Restore network and retry
    await page.unroute('**/api/**');
    await page.click('[data-testid="retry-button"]');

    // Verify successful creation after retry
    await expect(page).toHaveURL(/.*\/assets/);
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Asset created successfully');
  });

  test('should handle browser back/forward navigation correctly', async ({ page }) => {
    // Register
    await page.click('[data-testid="register-link"]');
    await page.fill('[data-testid="email-input"]', 'navigation@test.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="first-name-input"]', 'Nav');
    await page.fill('[data-testid="last-name-input"]', 'Test');
    await page.click('[data-testid="register-button"]');

    // Navigate through pages
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    await page.click('[data-testid="add-asset-button"]');
    await expect(page).toHaveURL(/.*\/assets\/new/);

    // Test browser back
    await page.goBack();
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();

    // Test browser forward
    await page.goForward();
    await expect(page).toHaveURL(/.*\/assets\/new/);
    await expect(page.locator('[data-testid="asset-type-select"]')).toBeVisible();
  });

  test('should handle form data persistence during page navigation', async ({ page }) => {
    // Register and navigate to asset creation
    await page.click('[data-testid="register-link"]');
    await page.fill('[data-testid="email-input"]', 'persistence@test.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="first-name-input"]', 'Persistence');
    await page.fill('[data-testid="last-name-input"]', 'Test');
    await page.click('[data-testid="register-button"]');

    await page.click('[data-testid="add-asset-button"]');

    // Fill form partially
    await page.selectOption('[data-testid="asset-type-select"]', 'cash');
    await page.fill('[data-testid="asset-value-input"]', '7500');
    await page.fill('[data-testid="description-input"]', 'Partially filled asset');

    // Navigate away and back
    await page.click('[data-testid="dashboard-link"]');
    await page.click('[data-testid="add-asset-button"]');

    // Verify form data is preserved (if draft save is implemented)
    const value = await page.inputValue('[data-testid="asset-value-input"]');
    const description = await page.inputValue('[data-testid="description-input"]');
    
    // This test allows for either draft save or clear form behavior
    expect(value === '7500' || value === '').toBeTruthy();
    expect(description === 'Partially filled asset' || description === '').toBeTruthy();
  });

  test('should validate responsive design on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Test mobile registration flow
    await page.click('[data-testid="mobile-menu-button"]');
    await page.click('[data-testid="register-link"]');
    
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible();
    
    // Verify form is properly sized for mobile
    const formBox = await page.locator('[data-testid="register-form"]').boundingBox();
    expect(formBox?.width).toBeLessThanOrEqual(375);

    // Complete registration on mobile
    await page.fill('[data-testid="email-input"]', 'mobile@test.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="first-name-input"]', 'Mobile');
    await page.fill('[data-testid="last-name-input"]', 'User');
    await page.click('[data-testid="register-button"]');

    // Verify mobile dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    
    // Test mobile asset creation
    await page.click('[data-testid="mobile-add-asset-button"]');
    await expect(page.locator('[data-testid="mobile-asset-form"]')).toBeVisible();
  });
});