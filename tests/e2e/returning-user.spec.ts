import { test, expect } from '@playwright/test';

/**
 * E2E Test: Returning User with Active Record
 * 
 * Scenario: User with existing assets and active Nisab record returns
 * Tests the dashboard experience for established users
 * 
 * User Journey:
 * 1. User with active record logs in
 * 2. Sees Active Hawl Period widget with progress
 * 3. Views quick action cards
 * 4. Navigates to Nisab Records page
 * 5. Wealth summary displays correctly
 * 
 * Duration: ~50 seconds
 */

test.describe('Returning User with Active Record', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('should display active record status widget on dashboard', async ({ page }) => {
    // Login as user with active record
    await page.fill('input[name="username"]', 'activeuser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard');

    // Verify "Active Hawl Period" widget is visible
    await expect(page.getByRole('heading', { name: /active hawl period/i })).toBeVisible();
    
    // Verify tracking status message
    await expect(page.getByText(/zakat tracking is active/i)).toBeVisible();
  });

  test('should show Hawl progress correctly', async ({ page }) => {
    // Login
    await page.fill('input[name="username"]', 'activeuser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Verify progress indicator exists
    const progressBar = page.locator('[role="progressbar"][aria-label*="Hawl progress"]');
    await expect(progressBar).toBeVisible();

    // Verify progress text (e.g., "Day 120 of 354")
    await expect(page.getByText(/day \d+ of \d+/i)).toBeVisible();

    // Verify progress percentage is shown
    const progressValue = await progressBar.getAttribute('aria-valuenow');
    expect(Number(progressValue)).toBeGreaterThan(0);
    expect(Number(progressValue)).toBeLessThanOrEqual(100);
  });

  test('should display quick action cards', async ({ page }) => {
    // Login
    await page.fill('input[name="username"]', 'activeuser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Verify quick action cards are visible
    await expect(page.getByText(/update assets/i)).toBeVisible();
    await expect(page.getByText(/view all records/i)).toBeVisible();

    // Verify cards are clickable/navigable
    const quickActions = page.locator('[class*="QuickActionCard"], a:has-text("Update Assets"), a:has-text("View All Records")');
    await expect(quickActions.first()).toBeVisible();
  });

  test('should navigate to Nisab Records page from quick actions', async ({ page }) => {
    // Login
    await page.fill('input[name="username"]', 'activeuser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Click "View All Records" quick action
    const viewRecordsLink = page.getByRole('link', { name: /view all records/i });
    await viewRecordsLink.click();

    // Verify navigation to Nisab Records page
    await page.waitForURL(/\/nisab-records|\/nisab-year-records/);
    await expect(page).toHaveURL(/\/nisab-records|\/nisab-year-records/);
    
    // Verify page content
    await expect(page.getByRole('heading', { name: /nisab.*record/i })).toBeVisible();
  });

  test('should display wealth summary correctly', async ({ page }) => {
    // Login
    await page.fill('input[name="username"]', 'activeuser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Verify Wealth Summary card exists
    await expect(page.getByRole('heading', { name: /wealth summary/i })).toBeVisible();

    // Verify current wealth is displayed
    await expect(page.getByText(/\$\d+,?\d*/)).toBeVisible();

    // Verify Nisab threshold comparison
    await expect(page.getByText(/above nisab|below nisab|near nisab/i)).toBeVisible();
  });

  test('should show correct status indicator based on wealth vs Nisab', async ({ page }) => {
    // Login
    await page.fill('input[name="username"]', 'activeuser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Check for status indicator (color-coded: green, yellow, or red)
    const statusIndicators = page.locator('[class*="green"], [class*="yellow"], [class*="red"]').filter({
      hasText: /above|below|near/i
    });

    await expect(statusIndicators.first()).toBeVisible();
  });

  test('should allow navigation to detailed record view', async ({ page }) => {
    // Login
    await page.fill('input[name="username"]', 'activeuser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Click "View Detailed Record" link from Active Record Widget
    const detailLink = page.getByRole('link', { name: /view detailed record/i });
    
    if (await detailLink.isVisible()) {
      await detailLink.click();
      
      // Should navigate to specific record detail page
      await expect(page).toHaveURL(/\/nisab-year-records\/.+/);
    }
  });
});
