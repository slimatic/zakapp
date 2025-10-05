/**
 * E2E Test: Create Yearly Snapshot Workflow
 * Tests the complete workflow for creating, editing, and finalizing a yearly snapshot
 * 
 * Scenarios:
 * 1. Create draft snapshot with financial data
 * 2. Edit draft snapshot
 * 3. Finalize snapshot (immutable after)
 * 4. Verify snapshot appears in list
 */

import { test, expect, Page } from '@playwright/test';

// Test data
const testSnapshot = {
  gregorianYear: 2024,
  gregorianMonth: 6,
  gregorianDay: 15,
  hijriYear: 1446,
  hijriMonth: 12,
  hijriDay: 8,
  totalWealth: 150000,
  totalLiabilities: 20000,
  zakatableWealth: 130000,
  zakatAmount: 3250,
  methodologyUsed: 'Standard',
  nisabThreshold: 85000,
  nisabType: 'gold',
  assetBreakdown: {
    cash: 50000,
    gold: 30000,
    investments: 50000,
    businessAssets: 20000
  },
  userNotes: 'Test snapshot for E2E validation'
};

// Helper functions
async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'testpassword123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/);
}

async function navigateToSnapshots(page: Page) {
  await page.click('a[href="/tracking/snapshots"]');
  await expect(page).toHaveURL('/tracking/snapshots');
}

async function fillSnapshotForm(page: Page, data: typeof testSnapshot, status: 'draft' | 'finalized' = 'draft') {
  // Fill Gregorian date
  await page.fill('input[name="gregorianYear"]', data.gregorianYear.toString());
  await page.fill('input[name="gregorianMonth"]', data.gregorianMonth.toString());
  await page.fill('input[name="gregorianDay"]', data.gregorianDay.toString());

  // Fill Hijri date
  await page.fill('input[name="hijriYear"]', data.hijriYear.toString());
  await page.fill('input[name="hijriMonth"]', data.hijriMonth.toString());
  await page.fill('input[name="hijriDay"]', data.hijriDay.toString());

  // Fill financial data
  await page.fill('input[name="totalWealth"]', data.totalWealth.toString());
  await page.fill('input[name="totalLiabilities"]', data.totalLiabilities.toString());
  await page.fill('input[name="zakatAmount"]', data.zakatAmount.toString());

  // Fill Zakat details
  await page.selectOption('select[name="methodologyUsed"]', data.methodologyUsed);
  await page.fill('input[name="nisabThreshold"]', data.nisabThreshold.toString());
  await page.selectOption('select[name="nisabType"]', data.nisabType);

  // Fill asset breakdown
  await page.fill('input[name="assetBreakdown.cash"]', data.assetBreakdown.cash.toString());
  await page.fill('input[name="assetBreakdown.gold"]', data.assetBreakdown.gold.toString());
  await page.fill('input[name="assetBreakdown.investments"]', data.assetBreakdown.investments.toString());
  await page.fill('input[name="assetBreakdown.businessAssets"]', data.assetBreakdown.businessAssets.toString());

  // Fill notes
  await page.fill('textarea[name="userNotes"]', data.userNotes);

  // Select status
  await page.selectOption('select[name="status"]', status);
}

test.describe('Snapshot Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should create a draft snapshot successfully', async ({ page }) => {
    await navigateToSnapshots(page);

    // Click "Create New Snapshot" button
    await page.click('button:has-text("Create New Snapshot")');
    await expect(page).toHaveURL(/\/tracking\/snapshots\/create/);

    // Fill form
    await fillSnapshotForm(page, testSnapshot, 'draft');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('text=/Snapshot created successfully/i')).toBeVisible();

    // Verify redirected to snapshot list
    await expect(page).toHaveURL('/tracking/snapshots');

    // Verify snapshot appears in list with draft badge
    await expect(page.locator('text=/Draft/i')).toBeVisible();
    await expect(page.locator(`text=/2024/`)).toBeVisible();
  });

  test('should edit a draft snapshot', async ({ page }) => {
    await navigateToSnapshots(page);

    // Create a draft snapshot first
    await page.click('button:has-text("Create New Snapshot")');
    await fillSnapshotForm(page, testSnapshot, 'draft');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/tracking/snapshots');

    // Click on the draft snapshot to edit
    await page.click('.snapshot-card:has-text("Draft")');
    await expect(page).toHaveURL(/\/tracking\/snapshots\/[a-z0-9-]+/);

    // Click edit button
    await page.click('button:has-text("Edit")');

    // Modify wealth amount
    const newWealth = 160000;
    await page.fill('input[name="totalWealth"]', newWealth.toString());

    // Modify notes
    const newNotes = 'Updated notes after review';
    await page.fill('textarea[name="userNotes"]', newNotes);

    // Save changes
    await page.click('button:has-text("Save Changes")');

    // Verify success message
    await expect(page.locator('text=/Snapshot updated successfully/i')).toBeVisible();

    // Verify updated values are displayed
    await expect(page.locator(`text=/${newWealth.toLocaleString()}/`)).toBeVisible();
    await expect(page.locator(`text=/${newNotes}/`)).toBeVisible();
  });

  test('should finalize a draft snapshot and make it immutable', async ({ page }) => {
    await navigateToSnapshots(page);

    // Create a draft snapshot
    await page.click('button:has-text("Create New Snapshot")');
    await fillSnapshotForm(page, testSnapshot, 'draft');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/tracking/snapshots');

    // Navigate to snapshot detail
    await page.click('.snapshot-card:has-text("Draft")');
    await expect(page).toHaveURL(/\/tracking\/snapshots\/[a-z0-9-]+/);

    // Click finalize button
    await page.click('button:has-text("Finalize Snapshot")');

    // Confirm finalization in modal
    await page.click('button:has-text("Confirm")');

    // Verify success message
    await expect(page.locator('text=/Snapshot finalized successfully/i')).toBeVisible();

    // Verify status badge changed to "Finalized"
    await expect(page.locator('text=/Finalized/i')).toBeVisible();

    // Verify edit button is no longer available
    await expect(page.locator('button:has-text("Edit")')).not.toBeVisible();

    // Verify finalize button is no longer available
    await expect(page.locator('button:has-text("Finalize Snapshot")')).not.toBeVisible();
  });

  test('should not allow editing a finalized snapshot', async ({ page }) => {
    await navigateToSnapshots(page);

    // Create and finalize a snapshot
    await page.click('button:has-text("Create New Snapshot")');
    await fillSnapshotForm(page, testSnapshot, 'finalized');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/tracking/snapshots');

    // Navigate to finalized snapshot
    await page.click('.snapshot-card:has-text("Finalized")');
    await expect(page).toHaveURL(/\/tracking\/snapshots\/[a-z0-9-]+/);

    // Verify no edit button
    await expect(page.locator('button:has-text("Edit")')).not.toBeVisible();

    // Verify read-only view
    await expect(page.locator('input[name="totalWealth"]')).not.toBeVisible();
  });

  test('should display snapshot in list with correct information', async ({ page }) => {
    await navigateToSnapshots(page);

    // Create a snapshot
    await page.click('button:has-text("Create New Snapshot")');
    await fillSnapshotForm(page, testSnapshot, 'draft');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/tracking/snapshots');

    // Verify snapshot card displays key information
    const snapshotCard = page.locator('.snapshot-card').first();
    
    // Check year display
    await expect(snapshotCard.locator('text=/2024/')).toBeVisible();
    
    // Check Hijri year display
    await expect(snapshotCard.locator('text=/1446 AH/')).toBeVisible();
    
    // Check wealth amount
    await expect(snapshotCard.locator(`text=/${testSnapshot.totalWealth.toLocaleString()}/`)).toBeVisible();
    
    // Check Zakat amount
    await expect(snapshotCard.locator(`text=/${testSnapshot.zakatAmount.toLocaleString()}/`)).toBeVisible();
    
    // Check status badge
    await expect(snapshotCard.locator('text=/Draft/i')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await navigateToSnapshots(page);
    await page.click('button:has-text("Create New Snapshot")');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Verify validation errors
    await expect(page.locator('text=/required/i')).toBeVisible();
    
    // Form should not submit
    await expect(page).toHaveURL(/\/tracking\/snapshots\/create/);
  });

  test('should calculate zakatable wealth correctly', async ({ page }) => {
    await navigateToSnapshots(page);
    await page.click('button:has-text("Create New Snapshot")');

    // Fill wealth and liabilities
    await page.fill('input[name="totalWealth"]', '150000');
    await page.fill('input[name="totalLiabilities"]', '20000');

    // Zakatable wealth should auto-calculate (150000 - 20000 = 130000)
    const zakatableWealth = page.locator('input[name="zakatableWealth"]');
    await expect(zakatableWealth).toHaveValue('130000');
  });

  test('should support pagination for multiple snapshots', async ({ page }) => {
    await navigateToSnapshots(page);

    // Create multiple snapshots (if pagination is >10 items)
    for (let i = 0; i < 12; i++) {
      await page.click('button:has-text("Create New Snapshot")');
      const yearData = { ...testSnapshot, gregorianYear: 2024 - i };
      await fillSnapshotForm(page, yearData, 'draft');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/tracking/snapshots');
    }

    // Verify pagination controls appear
    await expect(page.locator('button:has-text("Next")')).toBeVisible();
    
    // Click next page
    await page.click('button:has-text("Next")');
    
    // Verify URL has page parameter
    await expect(page).toHaveURL(/page=2/);
  });

  test('should delete a draft snapshot', async ({ page }) => {
    await navigateToSnapshots(page);

    // Create a draft snapshot
    await page.click('button:has-text("Create New Snapshot")');
    await fillSnapshotForm(page, testSnapshot, 'draft');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/tracking/snapshots');

    // Navigate to snapshot detail
    await page.click('.snapshot-card:has-text("Draft")');

    // Click delete button
    await page.click('button:has-text("Delete")');

    // Confirm deletion
    await page.click('button:has-text("Confirm Delete")');

    // Verify success message
    await expect(page.locator('text=/Snapshot deleted successfully/i')).toBeVisible();

    // Verify redirected back to list
    await expect(page).toHaveURL('/tracking/snapshots');

    // Verify snapshot no longer in list
    await expect(page.locator('.snapshot-card:has-text("2024")')).not.toBeVisible();
  });
});
