import { test, expect } from '@playwright/test';

/**
 * E2E Test: Navigation Flow
 * 
 * Scenario: Complete navigation testing across all routes
 * Tests navigation through all pages, active states, browser controls, and legacy routes
 * 
 * Test Coverage:
 * 1. Navigate through all 4 main pages
 * 2. Active state updates correctly
 * 3. Browser back/forward buttons work
 * 4. Direct URL access works
 * 5. Legacy routes handle correctly (/calculate, /tracking, /history)
 * 
 * Duration: ~55 seconds
 */

test.describe('Navigation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should navigate through all 4 main pages in sequence', async ({ page }) => {
    // Start at Dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');

    // Navigate to Assets
    await page.getByRole('link', { name: 'Assets' }).click();
    await page.waitForURL('/assets');
    await expect(page.getByRole('link', { name: 'Assets' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { name: /assets/i })).toBeVisible();

    // Navigate to Nisab Records
    await page.getByRole('link', { name: /Nisab Records/i }).click();
    await page.waitForURL(/\/nisab-records|\/nisab-year-records/);
    await expect(page.getByRole('link', { name: /Nisab Records/i })).toHaveAttribute('aria-current', 'page');

    // Navigate to Profile
    await page.getByRole('link', { name: 'Profile' }).click();
    await page.waitForURL('/profile');
    await expect(page.getByRole('link', { name: 'Profile' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();

    // Navigate back to Dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.waitForURL('/dashboard');
    await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
  });

  test('should update active state correctly on each navigation', async ({ page }) => {
    // Dashboard should be active initially
    const dashboardLink = page.getByRole('link', { name: 'Dashboard' });
    await expect(dashboardLink).toHaveAttribute('aria-current', 'page');

    // Navigate to Assets
    await page.getByRole('link', { name: 'Assets' }).click();
    await page.waitForURL('/assets');
    
    // Assets should be active, Dashboard should not
    const assetsLink = page.getByRole('link', { name: 'Assets' });
    await expect(assetsLink).toHaveAttribute('aria-current', 'page');
    await expect(dashboardLink).not.toHaveAttribute('aria-current', 'page');

    // Navigate to Nisab Records
    await page.getByRole('link', { name: /Nisab Records/i }).click();
    await page.waitForURL(/\/nisab-records|\/nisab-year-records/);
    
    // Nisab Records should be active, Assets should not
    const nisabLink = page.getByRole('link', { name: /Nisab Records/i });
    await expect(nisabLink).toHaveAttribute('aria-current', 'page');
    await expect(assetsLink).not.toHaveAttribute('aria-current', 'page');
  });

  test('should support browser back and forward buttons', async ({ page }) => {
    // Navigate: Dashboard → Assets → Nisab Records
    await page.getByRole('link', { name: 'Assets' }).click();
    await page.waitForURL('/assets');
    
    await page.getByRole('link', { name: /Nisab Records/i }).click();
    await page.waitForURL(/\/nisab-records|\/nisab-year-records/);

    // Use browser back button
    await page.goBack();
    await expect(page).toHaveURL('/assets');
    await expect(page.getByRole('link', { name: 'Assets' })).toHaveAttribute('aria-current', 'page');

    // Use browser back button again
    await page.goBack();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');

    // Use browser forward button
    await page.goForward();
    await expect(page).toHaveURL('/assets');
    await expect(page.getByRole('link', { name: 'Assets' })).toHaveAttribute('aria-current', 'page');

    // Use browser forward button again
    await page.goForward();
    await expect(page).toHaveURL(/\/nisab-records|\/nisab-year-records/);
  });

  test('should handle direct URL access correctly', async ({ page }) => {
    // Direct access to Assets page
    await page.goto('/assets');
    await expect(page).toHaveURL('/assets');
    await expect(page.getByRole('link', { name: 'Assets' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { name: /assets/i })).toBeVisible();

    // Direct access to Nisab Records page
    await page.goto('/nisab-records');
    await expect(page).toHaveURL(/\/nisab-records|\/nisab-year-records/);
    await expect(page.getByRole('link', { name: /Nisab Records/i })).toHaveAttribute('aria-current', 'page');

    // Direct access to Profile page
    await page.goto('/profile');
    await expect(page).toHaveURL('/profile');
    await expect(page.getByRole('link', { name: 'Profile' })).toHaveAttribute('aria-current', 'page');
  });

  test('should handle legacy route /calculate (redirect or 404)', async ({ page }) => {
    // Attempt to access old Calculate Zakat route
    await page.goto('/calculate');
    
    // Should either:
    // 1. Redirect to Dashboard or another valid page
    // 2. Show 404 page
    // 3. Redirect to login if not authenticated
    
    const currentUrl = page.url();
    const hasRedirected = !currentUrl.includes('/calculate');
    const has404 = await page.getByText(/404|not found|page not found/i).isVisible().catch(() => false);
    
    expect(hasRedirected || has404).toBeTruthy();
  });

  test('should handle legacy route /tracking (redirect or 404)', async ({ page }) => {
    // Attempt to access old Tracking Analytics route
    await page.goto('/tracking');
    
    const currentUrl = page.url();
    const hasRedirected = !currentUrl.includes('/tracking');
    const has404 = await page.getByText(/404|not found|page not found/i).isVisible().catch(() => false);
    
    expect(hasRedirected || has404).toBeTruthy();
  });

  test('should handle legacy route /history (hidden or redirect)', async ({ page }) => {
    // Attempt to access hidden History route
    await page.goto('/history');
    
    // History should be hidden/disabled until functionality is ready
    const currentUrl = page.url();
    const hasRedirected = !currentUrl.includes('/history');
    const has404 = await page.getByText(/404|not found|page not found/i).isVisible().catch(() => false);
    const hasComingSoon = await page.getByText(/coming soon|under construction/i).isVisible().catch(() => false);
    
    expect(hasRedirected || has404 || hasComingSoon).toBeTruthy();
  });

  test('should maintain navigation state across page reloads', async ({ page }) => {
    // Navigate to Assets
    await page.getByRole('link', { name: 'Assets' }).click();
    await page.waitForURL('/assets');
    
    // Reload page
    await page.reload();
    
    // Should still be on Assets page with active state
    await expect(page).toHaveURL('/assets');
    await expect(page.getByRole('link', { name: 'Assets' })).toHaveAttribute('aria-current', 'page');
  });

  test('should navigate correctly from nested routes', async ({ page }) => {
    // Navigate to a specific Nisab record detail page (if available)
    await page.goto('/nisab-year-records');
    
    // Check if there are any records to click
    const recordLinks = page.locator('a[href*="/nisab-year-records/"]');
    const recordCount = await recordLinks.count();
    
    if (recordCount > 0) {
      // Click first record to go to detail page
      await recordLinks.first().click();
      await page.waitForURL(/\/nisab-year-records\/.+/);
      
      // Navigate back to main navigation items
      await page.getByRole('link', { name: 'Dashboard' }).click();
      await page.waitForURL('/dashboard');
      await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
    }
  });
});
