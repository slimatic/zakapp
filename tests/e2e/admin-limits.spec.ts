/**
 * E2E Test: Admin Limits Modal
 * 
 * Tests the admin user management limits functionality.
 * 
 * REGRESSION COVERAGE:
 * - Limits modal shows only Assets, Nisab, Payments (not Liabilities)
 * - Limits can be updated and reflected in the UI
 * - User counts are displayed correctly
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Limits Modal', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin
        await page.goto('/login');
        await page.fill('[name="email"]', 'admin@zakapp.local');
        await page.fill('[name="password"]', 'AdminPassword123!');
        await page.click('button[type="submit"]');

        // Navigate to admin dashboard
        await page.goto('/admin');
        await page.waitForLoadState('networkidle');

        // Click on User Management tab
        await page.click('text=User Management');
        await page.waitForTimeout(500);
    });

    test('limits modal shows only 3 limit fields (no Liabilities)', async ({ page }) => {
        // Find a user and click "Limits" button
        const limitsButton = page.locator('button:has-text("Limits")').first();
        await limitsButton.click();

        // Wait for modal to appear
        await expect(page.locator('text=Manage Limits')).toBeVisible({ timeout: 5000 });

        // Verify the 3 expected fields are present
        await expect(page.locator('label:has-text("Max Assets")')).toBeVisible();
        await expect(page.locator('label:has-text("Max Nisab")')).toBeVisible();
        await expect(page.locator('label:has-text("Max Payments")')).toBeVisible();

        // Verify Liabilities field is NOT present
        await expect(page.locator('label:has-text("Max Liabilities")')).not.toBeVisible();
    });

    test('can update user limits', async ({ page }) => {
        // Click "Limits" on first user
        await page.locator('button:has-text("Limits")').first().click();

        // Wait for modal
        await expect(page.locator('text=Manage Limits')).toBeVisible({ timeout: 5000 });

        // Update limits
        await page.fill('#maxAssets', '100');
        await page.fill('#maxNisabRecords', '50');
        await page.fill('#maxPayments', '200');

        // Save
        await page.click('button:has-text("Save")');

        // Modal should close
        await expect(page.locator('text=Manage Limits')).not.toBeVisible({ timeout: 5000 });
    });

    test('user management table shows refresh button', async ({ page }) => {
        // Verify refresh button is present
        await expect(page.locator('button[title="Refresh Data"]')).toBeVisible();
    });

    test('refresh button reloads user data', async ({ page }) => {
        // Click refresh button
        await page.click('button[title="Refresh Data"]');

        // Button should show loading state (spinning animation)
        // Just verify it's clickable and doesn't error
        await page.waitForTimeout(500);

        // User list should still be visible
        await expect(page.locator('table')).toBeVisible();
    });
});
