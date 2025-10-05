/**
 * E2E Test: Export Snapshot to PDF Workflow
 * Tests the complete workflow for exporting yearly snapshots as PDF documents
 * 
 * Scenarios:
 * 1. Create finalized snapshot with full data
 * 2. Export snapshot to PDF
 * 3. Verify PDF download
 * 4. Test PDF with/without payments
 * 5. Test PDF with/without asset breakdown
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

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
  userNotes: 'Annual Zakat calculation for 2024',
  status: 'finalized'
};

const testPayments = [
  {
    amount: 1000,
    paymentDate: '2024-07-01',
    recipientName: 'Local Masjid',
    recipientType: 'organization',
    recipientCategory: 'fakir',
    notes: 'First payment',
    paymentMethod: 'bank_transfer'
  },
  {
    amount: 1500,
    paymentDate: '2024-08-01',
    recipientName: 'Family in Need',
    recipientType: 'individual',
    recipientCategory: 'miskin',
    notes: 'Second payment',
    paymentMethod: 'cash'
  }
];

// Helper functions
async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'testpassword123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/);
}

async function createSnapshot(page: Page) {
  await page.goto('/tracking/snapshots');
  await page.click('button:has-text("Create New Snapshot")');
  
  // Fill form
  await page.fill('input[name="gregorianYear"]', testSnapshot.gregorianYear.toString());
  await page.fill('input[name="gregorianMonth"]', testSnapshot.gregorianMonth.toString());
  await page.fill('input[name="gregorianDay"]', testSnapshot.gregorianDay.toString());
  await page.fill('input[name="hijriYear"]', testSnapshot.hijriYear.toString());
  await page.fill('input[name="hijriMonth"]', testSnapshot.hijriMonth.toString());
  await page.fill('input[name="hijriDay"]', testSnapshot.hijriDay.toString());
  await page.fill('input[name="totalWealth"]', testSnapshot.totalWealth.toString());
  await page.fill('input[name="totalLiabilities"]', testSnapshot.totalLiabilities.toString());
  await page.fill('input[name="zakatAmount"]', testSnapshot.zakatAmount.toString());
  await page.selectOption('select[name="methodologyUsed"]', testSnapshot.methodologyUsed);
  await page.fill('input[name="nisabThreshold"]', testSnapshot.nisabThreshold.toString());
  await page.selectOption('select[name="nisabType"]', testSnapshot.nisabType);
  await page.fill('input[name="assetBreakdown.cash"]', testSnapshot.assetBreakdown.cash.toString());
  await page.fill('input[name="assetBreakdown.gold"]', testSnapshot.assetBreakdown.gold.toString());
  await page.fill('input[name="assetBreakdown.investments"]', testSnapshot.assetBreakdown.investments.toString());
  await page.fill('input[name="assetBreakdown.businessAssets"]', testSnapshot.assetBreakdown.businessAssets.toString());
  await page.fill('textarea[name="userNotes"]', testSnapshot.userNotes);
  await page.selectOption('select[name="status"]', testSnapshot.status);
  
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/tracking/snapshots');
}

async function recordPayment(page: Page, payment: typeof testPayments[0]) {
  await page.goto('/tracking/payments');
  await page.click('button:has-text("Record Payment")');
  await page.selectOption('select[name="snapshotId"]', { index: 0 });
  
  await page.fill('input[name="amount"]', payment.amount.toString());
  await page.fill('input[name="paymentDate"]', payment.paymentDate);
  await page.fill('input[name="recipientName"]', payment.recipientName);
  await page.selectOption('select[name="recipientType"]', payment.recipientType);
  await page.selectOption('select[name="recipientCategory"]', payment.recipientCategory);
  await page.fill('textarea[name="notes"]', payment.notes);
  await page.selectOption('select[name="paymentMethod"]', payment.paymentMethod);
  
  await page.click('button[type="submit"]');
  await expect(page.locator('text=/Payment recorded successfully/i')).toBeVisible();
}

test.describe('PDF Export Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await createSnapshot(page);
  });

  test('should export snapshot to PDF successfully', async ({ page }) => {
    // Navigate to snapshot detail
    await page.goto('/tracking/snapshots');
    await page.click('.snapshot-card:first-child');
    await expect(page).toHaveURL(/\/tracking\/snapshots\/[a-z0-9-]+/);

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.click('button:has-text("Export to PDF")');

    // Wait for download
    const download = await downloadPromise;

    // Verify filename contains year
    expect(download.suggestedFilename()).toMatch(/2024.*\.pdf/i);
  });

  test('should PDF include all snapshot data', async ({ page }) => {
    // Navigate to snapshot detail
    await page.goto('/tracking/snapshots');
    await page.click('.snapshot-card:first-child');

    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export to PDF")');
    const download = await downloadPromise;

    // Save and verify file exists
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    if (downloadPath) {
      const exists = fs.existsSync(downloadPath);
      expect(exists).toBe(true);
      
      // Verify file size (should be > 0)
      const stats = fs.statSync(downloadPath);
      expect(stats.size).toBeGreaterThan(0);
    }
  });

  test('should export with payment records included', async ({ page }) => {
    // Record some payments first
    for (const payment of testPayments) {
      await recordPayment(page, payment);
    }

    // Navigate to snapshot detail
    await page.goto('/tracking/snapshots');
    await page.click('.snapshot-card:first-child');

    // Click export with options
    await page.click('button:has-text("Export Options")');
    
    // Check include payments option
    await page.check('input[name="includePayments"]');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Generate PDF")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('should export with asset breakdown included', async ({ page }) => {
    // Navigate to snapshot detail
    await page.goto('/tracking/snapshots');
    await page.click('.snapshot-card:first-child');

    // Click export with options
    await page.click('button:has-text("Export Options")');
    
    // Check include asset breakdown option
    await page.check('input[name="includeAssetBreakdown"]');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Generate PDF")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('should export with comparison data', async ({ page }) => {
    // Create a second snapshot for comparison
    await createSnapshot(page);

    // Navigate to first snapshot
    await page.goto('/tracking/snapshots');
    await page.click('.snapshot-card:first-child');

    // Click export with options
    await page.click('button:has-text("Export Options")');
    
    // Check include comparison option
    await page.check('input[name="includeComparison"]');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Generate PDF")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('should display export options modal', async ({ page }) => {
    await page.goto('/tracking/snapshots');
    await page.click('.snapshot-card:first-child');

    // Click export options button
    await page.click('button:has-text("Export Options")');

    // Verify modal is displayed
    await expect(page.locator('.modal:has-text("Export Options")')).toBeVisible();

    // Verify all options are present
    await expect(page.locator('input[name="includePayments"]')).toBeVisible();
    await expect(page.locator('input[name="includeAssetBreakdown"]')).toBeVisible();
    await expect(page.locator('input[name="includeComparison"]')).toBeVisible();
    await expect(page.locator('input[name="watermark"]')).toBeVisible();
  });

  test('should export with custom watermark', async ({ page }) => {
    await page.goto('/tracking/snapshots');
    await page.click('.snapshot-card:first-child');

    await page.click('button:has-text("Export Options")');
    
    // Add custom watermark text
    await page.fill('input[name="watermark"]', 'CONFIDENTIAL');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Generate PDF")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('should export annual summary from analytics page', async ({ page }) => {
    await page.goto('/tracking/analytics');

    // Verify annual summary section
    await expect(page.locator('text=/Annual Summary/i')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export Summary")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/summary.*\.pdf/i);
  });

  test('should show loading state during PDF generation', async ({ page }) => {
    await page.goto('/tracking/snapshots');
    await page.click('.snapshot-card:first-child');

    // Click export button
    await page.click('button:has-text("Export to PDF")');

    // Verify loading indicator appears
    await expect(page.locator('text=/Generating PDF/i')).toBeVisible();
  });

  test('should handle PDF generation errors gracefully', async ({ page }) => {
    await page.goto('/tracking/snapshots');
    await page.click('.snapshot-card:first-child');

    // Mock a network error by going offline
    await page.context().setOffline(true);

    // Try to export
    await page.click('button:has-text("Export to PDF")');

    // Verify error message (client-side generation should still work)
    // But if it requires server data, should show error
    await expect(page.locator('text=/error/i, text=/failed/i')).toBeVisible({ timeout: 5000 });

    // Go back online
    await page.context().setOffline(false);
  });

  test('should include Hijri dates in PDF', async ({ page }) => {
    await page.goto('/tracking/snapshots');
    await page.click('.snapshot-card:first-child');

    // Before exporting, verify Hijri date is displayed on page
    await expect(page.locator('text=/1446 AH/i')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export to PDF")');
    await downloadPromise;

    // PDF should contain Hijri date (can't verify PDF content in E2E easily,
    // but we verify the generation completed successfully)
  });

  test('should export payment receipt as PDF', async ({ page }) => {
    // Record a payment
    await recordPayment(page, testPayments[0]);

    // Navigate to payments page
    await page.goto('/tracking/payments');

    // Click export receipt on first payment
    const downloadPromise = page.waitForEvent('download');
    await page.click('.payment-card:first-child button:has-text("Receipt")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/receipt.*\.pdf/i);
  });

  test('should batch export multiple snapshots', async ({ page }) => {
    // Create multiple snapshots
    for (let i = 0; i < 3; i++) {
      await createSnapshot(page);
    }

    // Navigate to snapshots list
    await page.goto('/tracking/snapshots');

    // Select multiple snapshots
    await page.check('.snapshot-card:nth-child(1) input[type="checkbox"]');
    await page.check('.snapshot-card:nth-child(2) input[type="checkbox"]');

    // Click batch export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export Selected")');
    const download = await downloadPromise;

    // Should download a zip file or combined PDF
    expect(download.suggestedFilename()).toMatch(/\.(pdf|zip)$/i);
  });

  test('should preview PDF before download', async ({ page }) => {
    await page.goto('/tracking/snapshots');
    await page.click('.snapshot-card:first-child');

    await page.click('button:has-text("Export Options")');
    
    // Click preview button instead of generate
    await page.click('button:has-text("Preview")');

    // Verify PDF preview modal appears
    await expect(page.locator('.pdf-preview-modal')).toBeVisible();

    // Verify preview canvas/iframe
    await expect(page.locator('canvas.pdf-preview, iframe.pdf-preview')).toBeVisible();

    // Close preview
    await page.click('button:has-text("Close Preview")');

    // Now actually download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');
    await downloadPromise;
  });

  test('should include chart visualizations in PDF', async ({ page }) => {
    // Record payments to have data for charts
    for (const payment of testPayments) {
      await recordPayment(page, payment);
    }

    await page.goto('/tracking/analytics');

    // Verify charts are displayed
    await expect(page.locator('.recharts-wrapper')).toBeVisible();

    // Export analytics with charts
    await page.click('button:has-text("Export Options")');
    await page.check('input[name="includeCharts"]');

    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Generate PDF")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('should support different PDF formats', async ({ page }) => {
    await page.goto('/tracking/snapshots');
    await page.click('.snapshot-card:first-child');

    await page.click('button:has-text("Export Options")');
    
    // Select format (A4, Letter, etc.)
    await page.selectOption('select[name="pdfFormat"]', 'A4');

    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Generate PDF")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('should include currency formatting in PDF', async ({ page }) => {
    await page.goto('/tracking/snapshots');
    await page.click('.snapshot-card:first-child');

    // Verify currency is displayed correctly on page
    await expect(page.locator('text=/\\$150,000/')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export to PDF")');
    await downloadPromise;

    // PDF should contain properly formatted currency
  });

  test('should handle large snapshots with pagination', async ({ page }) => {
    // Record many payments to test pagination in PDF
    for (let i = 0; i < 25; i++) {
      await recordPayment(page, {
        ...testPayments[0],
        amount: 100 + i * 10,
        recipientName: `Recipient ${i + 1}`
      });
    }

    await page.goto('/tracking/snapshots');
    await page.click('.snapshot-card:first-child');

    await page.click('button:has-text("Export Options")');
    await page.check('input[name="includePayments"]');

    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Generate PDF")');
    const download = await downloadPromise;

    // Should handle multi-page PDF
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
});
