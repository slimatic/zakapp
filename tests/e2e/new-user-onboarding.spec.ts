import { test, expect } from '@playwright/test';

/**
 * E2E Test: New User Onboarding Flow
 * 
 * Scenario: First-time user logs in and completes initial setup
 * Tests the complete onboarding experience from login to first asset
 * 
 * User Journey:
 * 1. New user logs in
 * 2. Sees welcome message and 3-step onboarding guide
 * 3. Adds their first asset
 * 4. Returns to dashboard
 * 5. Sees "Create Nisab Record" prompt
 * 6. Dashboard updates with wealth summary
 * 
 * Duration: ~60 seconds
 */

test.describe('New User Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('should guide new user through onboarding process', async ({ page }) => {
    // Step 1: Login as new user
    await page.fill('input[name="username"]', 'newuser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard');

    // Step 2: Verify welcome message appears
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
    
    // Step 3: Verify 3-step onboarding guide is visible
    await expect(page.getByText(/getting started guide/i)).toBeVisible();
    await expect(page.getByText(/add your first asset/i)).toBeVisible();
    await expect(page.getByText(/create nisab record/i)).toBeVisible();
    await expect(page.getByText(/track your hawl/i)).toBeVisible();

    // Verify "0 of 3 completed" progress indicator
    await expect(page.getByText(/0 of 3 completed/i)).toBeVisible();
  });

  test('should navigate to assets page when "Add First Asset" is clicked', async ({ page }) => {
    // Login and wait for dashboard
    await page.fill('input[name="username"]', 'newuser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Click "Add First Asset" button or card
    const addAssetButton = page.getByRole('link', { name: /add.*asset/i }).first();
    await addAssetButton.click();

    // Verify navigation to assets page
    await page.waitForURL('/assets');
    await expect(page).toHaveURL(/\/assets/);
  });

  test('should show wealth summary after adding first asset', async ({ page }) => {
    // Login
    await page.fill('input[name="username"]', 'newuser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to assets and add an asset
    await page.goto('/assets');
    
    // Click "Add Asset" button
    await page.click('button:has-text("Add Asset")');

    // Fill out asset form
    await page.fill('input[name="name"]', 'Savings Account');
    await page.selectOption('select[name="category"]', 'Cash');
    await page.fill('input[name="value"]', '10000');
    await page.selectOption('select[name="currency"]', 'USD');

    // Submit form
    await page.click('button[type="submit"]:has-text("Save")');

    // Navigate back to dashboard
    await page.goto('/dashboard');

    // Verify dashboard no longer shows "Add First Asset" as primary CTA
    // Instead shows "Create Nisab Record" prompt
    await expect(page.getByText(/create.*nisab.*record/i)).toBeVisible();

    // Verify wealth summary or indication of assets
    await expect(page.getByText(/\$10,000/i)).toBeVisible();
  });

  test('should show progress in onboarding guide after completing steps', async ({ page }) => {
    // Login
    await page.fill('input[name="username"]', 'userWithAssets');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // User with assets should see "1 of 3 completed"
    await expect(page.getByText(/1 of 3 completed/i)).toBeVisible();
    
    // Completed step should have checkmark
    await expect(page.getByText(/✓ completed/i).first()).toBeVisible();
  });
});
