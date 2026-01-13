/**
 * E2E Test: Onboarding V2 Flow (8-Step Wizard)
 * 
 * Tests the new onboarding flow with the separated Review & Save + Zakat Setup steps.
 * 
 * REGRESSION COVERAGE:
 * - Assets saved correctly before ZakatSetupStep
 * - isSetupCompleted persisted via updateLocalProfile
 * - No looping back to onboarding after completion
 * - Correct redirect to dashboard
 */

import { test, expect } from '@playwright/test';

test.describe('Onboarding V2 - 8 Step Wizard', () => {
    const testUser = {
        email: `test-onboarding-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        username: 'testonboardinguser'
    };

    test.beforeEach(async ({ page }) => {
        await page.context().clearCookies();

        // Register fresh user for each test
        await page.goto('/register');
        await page.fill('[name="email"]', testUser.email);
        await page.fill('[name="password"]', testUser.password);
        await page.fill('[name="confirmPassword"]', testUser.password);
        await page.fill('[name="username"]', testUser.username);
        await page.click('button[type="submit"]');

        // Wait for redirect to onboarding
        await page.waitForURL(/\/onboarding/, { timeout: 10000 });
    });

    test('completes full 8-step onboarding without looping', async ({ page }) => {
        // Step 1: Welcome
        await expect(page.locator('h1, h2').first()).toContainText(/welcome|get started/i);
        await page.click('button:has-text("Continue"), button:has-text("Next"), button:has-text("Get Started")');

        // Step 2: Identity (Skip or fill)
        await page.waitForTimeout(500);
        if (await page.locator('button:has-text("Skip")').isVisible()) {
            await page.click('button:has-text("Skip")');
        } else {
            await page.click('button:has-text("Continue"), button:has-text("Next")');
        }

        // Step 3: Precious Metals
        await page.waitForTimeout(500);
        await page.click('button:has-text("Continue"), button:has-text("Next"), button:has-text("Skip")');

        // Step 4: Cash & Bank
        await page.waitForTimeout(500);
        await page.click('button:has-text("Continue"), button:has-text("Next"), button:has-text("Skip")');

        // Step 5: Investments
        await page.waitForTimeout(500);
        await page.click('button:has-text("Continue"), button:has-text("Next"), button:has-text("Skip")');

        // Step 6: Liabilities
        await page.waitForTimeout(500);
        await page.click('button:has-text("Continue"), button:has-text("Next"), button:has-text("Skip")');

        // Step 7: Review & Save
        await page.waitForTimeout(500);
        await expect(page.locator('text=/review|summary/i')).toBeVisible({ timeout: 5000 });
        await page.click('button:has-text("Save"), button:has-text("Continue")');

        // Step 8: Zakat Setup
        await page.waitForTimeout(1000);
        await expect(page.locator('text=/zakat setup|initialize|hawl/i')).toBeVisible({ timeout: 5000 });
        await page.click('button:has-text("Finish"), button:has-text("Complete"), button:has-text("Done")');

        // Verify redirect to dashboard (NOT back to onboarding)
        await page.waitForURL(/\/dashboard/, { timeout: 10000 });

        // Verify we're actually on dashboard
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test('does not loop back to onboarding after completion', async ({ page }) => {
        // Complete onboarding quickly (skip all)
        for (let i = 0; i < 8; i++) {
            await page.waitForTimeout(300);
            const skipButton = page.locator('button:has-text("Skip")');
            const continueButton = page.locator('button:has-text("Continue"), button:has-text("Next"), button:has-text("Save"), button:has-text("Finish"), button:has-text("Done"), button:has-text("Get Started")');

            if (await skipButton.isVisible()) {
                await skipButton.click();
            } else if (await continueButton.isVisible()) {
                await continueButton.first().click();
            }
        }

        // Should be on dashboard
        await page.waitForURL(/\/dashboard/, { timeout: 10000 });

        // Logout and login again
        await page.goto('/logout');
        await page.waitForTimeout(500);

        await page.goto('/login');
        await page.fill('[name="email"]', testUser.email);
        await page.fill('[name="password"]', testUser.password);
        await page.click('button[type="submit"]');

        // Should go directly to dashboard, NOT onboarding
        await page.waitForURL(/\/(dashboard|settings|assets)/, { timeout: 10000 });

        // Explicitly check we're NOT on onboarding
        expect(page.url()).not.toContain('/onboarding');
    });

    test('assets are saved before ZakatSetupStep', async ({ page }) => {
        // Navigate through steps and add an asset
        for (let i = 0; i < 3; i++) {
            await page.waitForTimeout(300);
            await page.click('button:has-text("Continue"), button:has-text("Next"), button:has-text("Skip"), button:has-text("Get Started")');
        }

        // Step 4: Cash - Add an asset
        await page.waitForTimeout(500);
        const cashInput = page.locator('input[type="number"]').first();
        if (await cashInput.isVisible()) {
            await cashInput.fill('10000');
        }
        await page.click('button:has-text("Continue"), button:has-text("Next")');

        // Skip remaining steps to review
        for (let i = 0; i < 2; i++) {
            await page.waitForTimeout(300);
            await page.click('button:has-text("Continue"), button:has-text("Next"), button:has-text("Skip")');
        }

        // Step 7: Review - Should show the asset
        await page.waitForTimeout(500);
        await expect(page.locator('text=/10,000|10000/i')).toBeVisible({ timeout: 5000 });

        // Save
        await page.click('button:has-text("Save"), button:has-text("Continue")');

        // Step 8: Zakat Setup - Should also show saved assets
        await page.waitForTimeout(1000);
        // The zakat calculation should reflect the saved asset
        await expect(page.locator('text=/10,000|10000|zakat/i')).toBeVisible({ timeout: 5000 });
    });
});
