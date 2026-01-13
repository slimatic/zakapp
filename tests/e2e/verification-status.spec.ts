/**
 * E2E Test: Verification Status Flow
 * 
 * Tests the isVerified status propagation from admin action to user view.
 * 
 * REGRESSION COVERAGE:
 * - Backend AuthController returning isVerified in /auth/me, /auth/login
 * - Admin Dashboard verify user action
 * - ProfileForm displaying correct verification badge
 */

import { test, expect } from '@playwright/test';

test.describe('Verification Status Flow', () => {
    const testUser = {
        email: `test-verify-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        username: 'testverifyuser'
    };

    test.beforeEach(async ({ page }) => {
        // Clear any existing session
        await page.context().clearCookies();
    });

    test('newly registered user shows as unverified', async ({ page }) => {
        // Register a new user
        await page.goto('/register');
        await page.fill('[name="email"]', testUser.email);
        await page.fill('[name="password"]', testUser.password);
        await page.fill('[name="confirmPassword"]', testUser.password);
        await page.fill('[name="username"]', testUser.username);
        await page.click('button[type="submit"]');

        // Wait for redirect to onboarding or dashboard
        await page.waitForURL(/\/(onboarding|dashboard)/);

        // Navigate to settings
        await page.goto('/settings');

        // Verify unverified badge is shown
        await expect(page.locator('text=Unverified')).toBeVisible();
    });

    test('admin can verify a user', async ({ page }) => {
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

        // Find the test user and verify them
        const userRow = page.locator(`tr:has-text("${testUser.email}")`);
        await userRow.locator('button:has-text("Verify")').click();

        // Confirm success
        await expect(page.locator('text=User verified')).toBeVisible({ timeout: 5000 });
    });

    test('verified user sees Verified badge in profile', async ({ page }) => {
        // Login as the verified user
        await page.goto('/login');
        await page.fill('[name="email"]', testUser.email);
        await page.fill('[name="password"]', testUser.password);
        await page.click('button[type="submit"]');

        // Wait for successful login
        await page.waitForURL(/\/(dashboard|onboarding)/);

        // Navigate to settings
        await page.goto('/settings');

        // Verify the "Verified" badge is shown
        await expect(page.locator('text=✅ Verified')).toBeVisible();
    });

    test('API /auth/me returns isVerified field', async ({ request }) => {
        // Login via API
        const loginResponse = await request.post('/api/auth/login', {
            data: {
                email: testUser.email,
                password: testUser.password
            }
        });

        expect(loginResponse.ok()).toBeTruthy();
        const loginData = await loginResponse.json();

        // Check that isVerified is present in response
        expect(loginData.user).toHaveProperty('isVerified');
        expect(typeof loginData.user.isVerified).toBe('boolean');

        // Store access token
        const accessToken = loginData.accessToken;

        // Call /auth/me
        const meResponse = await request.get('/api/auth/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        expect(meResponse.ok()).toBeTruthy();
        const meData = await meResponse.json();

        // Verify isVerified is present in /me response
        expect(meData.user).toHaveProperty('isVerified');
    });
});
