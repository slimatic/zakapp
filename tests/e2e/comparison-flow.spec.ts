/**
 * E2E Test: Compare Multiple Years Workflow
 * Tests the complete workflow for comparing snapshots across multiple years
 * 
 * Scenarios:
 * 1. Create snapshots for 3 different years
 * 2. Navigate to comparison page
 * 3. Select multiple snapshots for comparison
 * 4. View side-by-side comparison
 * 5. Analyze trends and insights
 */

import { test, expect, Page } from '@playwright/test';

// Test data for 3 years of snapshots
const snapshotData = [
  {
    gregorianYear: 2022,
    gregorianMonth: 6,
    gregorianDay: 15,
    hijriYear: 1444,
    hijriMonth: 11,
    hijriDay: 15,
    totalWealth: 100000,
    totalLiabilities: 10000,
    zakatableWealth: 90000,
    zakatAmount: 2250,
    methodologyUsed: 'Standard',
    nisabThreshold: 85000,
    nisabType: 'gold',
    status: 'finalized'
  },
  {
    gregorianYear: 2023,
    gregorianMonth: 6,
    gregorianDay: 15,
    hijriYear: 1445,
    hijriMonth: 11,
    hijriDay: 25,
    totalWealth: 125000,
    totalLiabilities: 15000,
    zakatableWealth: 110000,
    zakatAmount: 2750,
    methodologyUsed: 'Standard',
    nisabThreshold: 85000,
    nisabType: 'gold',
    status: 'finalized'
  },
  {
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
    status: 'finalized'
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

async function createSnapshot(page: Page, data: typeof snapshotData[0]) {
  await page.goto('/tracking/snapshots');
  await page.click('button:has-text("Create New Snapshot")');
  
  // Fill form
  await page.fill('input[name="gregorianYear"]', data.gregorianYear.toString());
  await page.fill('input[name="gregorianMonth"]', data.gregorianMonth.toString());
  await page.fill('input[name="gregorianDay"]', data.gregorianDay.toString());
  await page.fill('input[name="hijriYear"]', data.hijriYear.toString());
  await page.fill('input[name="hijriMonth"]', data.hijriMonth.toString());
  await page.fill('input[name="hijriDay"]', data.hijriDay.toString());
  await page.fill('input[name="totalWealth"]', data.totalWealth.toString());
  await page.fill('input[name="totalLiabilities"]', data.totalLiabilities.toString());
  await page.fill('input[name="zakatAmount"]', data.zakatAmount.toString());
  await page.selectOption('select[name="methodologyUsed"]', data.methodologyUsed);
  await page.fill('input[name="nisabThreshold"]', data.nisabThreshold.toString());
  await page.selectOption('select[name="nisabType"]', data.nisabType);
  await page.selectOption('select[name="status"]', data.status);
  
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/tracking/snapshots');
}

async function navigateToComparison(page: Page) {
  await page.click('a[href="/tracking/comparison"]');
  await expect(page).toHaveURL('/tracking/comparison');
}

test.describe('Multi-Year Comparison Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    
    // Create snapshots for all years
    for (const data of snapshotData) {
      await createSnapshot(page, data);
    }
  });

  test('should display snapshot selection interface', async ({ page }) => {
    await navigateToComparison(page);

    // Verify page title
    await expect(page.locator('h1:has-text("Compare Snapshots")')).toBeVisible();

    // Verify snapshot selector is present
    await expect(page.locator('select[name="snapshot1"]')).toBeVisible();
    await expect(page.locator('select[name="snapshot2"]')).toBeVisible();
    await expect(page.locator('select[name="snapshot3"]')).toBeVisible();

    // Verify all years appear in dropdowns
    for (const data of snapshotData) {
      await expect(page.locator(`option:has-text("${data.gregorianYear}")`)).toBeVisible();
    }
  });

  test('should compare two snapshots side-by-side', async ({ page }) => {
    await navigateToComparison(page);

    // Select 2022 and 2024 for comparison
    await page.selectOption('select[name="snapshot1"]', { index: 0 }); // 2022
    await page.selectOption('select[name="snapshot2"]', { index: 2 }); // 2024

    // Click compare button
    await page.click('button:has-text("Compare")');

    // Verify comparison table is displayed
    await expect(page.locator('.comparison-table')).toBeVisible();

    // Verify year headers
    await expect(page.locator('th:has-text("2022")')).toBeVisible();
    await expect(page.locator('th:has-text("2024")')).toBeVisible();

    // Verify wealth values
    await expect(page.locator('td:has-text("$100,000")')).toBeVisible(); // 2022 wealth
    await expect(page.locator('td:has-text("$150,000")')).toBeVisible(); // 2024 wealth

    // Verify Zakat amounts
    await expect(page.locator('td:has-text("$2,250")')).toBeVisible(); // 2022 Zakat
    await expect(page.locator('td:has-text("$3,250")')).toBeVisible(); // 2024 Zakat
  });

  test('should compare three snapshots simultaneously', async ({ page }) => {
    await navigateToComparison(page);

    // Select all three years
    await page.selectOption('select[name="snapshot1"]', { index: 0 });
    await page.selectOption('select[name="snapshot2"]', { index: 1 });
    await page.selectOption('select[name="snapshot3"]', { index: 2 });

    await page.click('button:has-text("Compare")');

    // Verify all three columns are displayed
    await expect(page.locator('th:has-text("2022")')).toBeVisible();
    await expect(page.locator('th:has-text("2023")')).toBeVisible();
    await expect(page.locator('th:has-text("2024")')).toBeVisible();

    // Verify wealth progression
    const wealthRow = page.locator('tr:has-text("Total Wealth")');
    await expect(wealthRow.locator('td:has-text("$100,000")')).toBeVisible();
    await expect(wealthRow.locator('td:has-text("$125,000")')).toBeVisible();
    await expect(wealthRow.locator('td:has-text("$150,000")')).toBeVisible();
  });

  test('should display wealth trend with percentage changes', async ({ page }) => {
    await navigateToComparison(page);

    // Select consecutive years
    await page.selectOption('select[name="snapshot1"]', { index: 0 });
    await page.selectOption('select[name="snapshot2"]', { index: 1 });
    await page.selectOption('select[name="snapshot3"]', { index: 2 });

    await page.click('button:has-text("Compare")');

    // Verify percentage change indicators
    // 2022 → 2023: (125000 - 100000) / 100000 = 25% increase
    await expect(page.locator('text=/\\+25%/i')).toBeVisible();
    
    // 2023 → 2024: (150000 - 125000) / 125000 = 20% increase
    await expect(page.locator('text=/\\+20%/i')).toBeVisible();

    // Verify trend indicators (up arrows)
    const trendIndicators = page.locator('.trend-up');
    await expect(trendIndicators).toHaveCount(2); // Two increases
  });

  test('should display Zakat trend analysis', async ({ page }) => {
    await navigateToComparison(page);

    await page.selectOption('select[name="snapshot1"]', { index: 0 });
    await page.selectOption('select[name="snapshot2"]', { index: 1 });
    await page.selectOption('select[name="snapshot3"]', { index: 2 });

    await page.click('button:has-text("Compare")');

    // Verify Zakat trend section
    await expect(page.locator('text=/Zakat Trend/i')).toBeVisible();

    // Verify Zakat amounts
    const zakatRow = page.locator('tr:has-text("Zakat Amount")');
    await expect(zakatRow.locator('td:has-text("$2,250")')).toBeVisible();
    await expect(zakatRow.locator('td:has-text("$2,750")')).toBeVisible();
    await expect(zakatRow.locator('td:has-text("$3,250")')).toBeVisible();

    // Verify percentage changes
    // 2022 → 2023: (2750 - 2250) / 2250 ≈ 22.2%
    await expect(page.locator('text=/\\+22/i')).toBeVisible();
  });

  test('should display liability comparison', async ({ page }) => {
    await navigateToComparison(page);

    await page.selectOption('select[name="snapshot1"]', { index: 0 });
    await page.selectOption('select[name="snapshot2"]', { index: 2 });

    await page.click('button:has-text("Compare")');

    // Verify liabilities row
    const liabilitiesRow = page.locator('tr:has-text("Total Liabilities")');
    await expect(liabilitiesRow.locator('td:has-text("$10,000")')).toBeVisible();
    await expect(liabilitiesRow.locator('td:has-text("$20,000")')).toBeVisible();

    // Verify percentage change
    // (20000 - 10000) / 10000 = 100% increase
    await expect(page.locator('text=/\\+100%/i')).toBeVisible();
  });

  test('should display zakatable wealth comparison', async ({ page }) => {
    await navigateToComparison(page);

    await page.selectOption('select[name="snapshot1"]', { index: 0 });
    await page.selectOption('select[name="snapshot2"]', { index: 1 });
    await page.selectOption('select[name="snapshot3"]', { index: 2 });

    await page.click('button:has-text("Compare")');

    // Verify zakatable wealth row
    const zakatableRow = page.locator('tr:has-text("Zakatable Wealth")');
    await expect(zakatableRow.locator('td:has-text("$90,000")')).toBeVisible();
    await expect(zakatableRow.locator('td:has-text("$110,000")')).toBeVisible();
    await expect(zakatableRow.locator('td:has-text("$130,000")')).toBeVisible();
  });

  test('should display Hijri dates in comparison', async ({ page }) => {
    await navigateToComparison(page);

    await page.selectOption('select[name="snapshot1"]', { index: 0 });
    await page.selectOption('select[name="snapshot2"]', { index: 2 });

    await page.click('button:has-text("Compare")');

    // Verify Hijri dates are displayed
    await expect(page.locator('text=/1444 AH/i')).toBeVisible();
    await expect(page.locator('text=/1446 AH/i')).toBeVisible();

    // Verify dual calendar display
    const dateRow = page.locator('tr:has-text("Calculation Date")');
    await expect(dateRow).toBeVisible();
  });

  test('should show insights based on comparison', async ({ page }) => {
    await navigateToComparison(page);

    await page.selectOption('select[name="snapshot1"]', { index: 0 });
    await page.selectOption('select[name="snapshot2"]', { index: 2 });

    await page.click('button:has-text("Compare")');

    // Verify insights section
    await expect(page.locator('text=/Insights/i')).toBeVisible();

    // Verify positive wealth growth insight
    await expect(page.locator('text=/wealth.*increased/i')).toBeVisible();

    // Verify Zakat growth insight
    await expect(page.locator('text=/Zakat.*increased/i')).toBeVisible();
  });

  test('should visualize trends with charts', async ({ page }) => {
    await navigateToComparison(page);

    await page.selectOption('select[name="snapshot1"]', { index: 0 });
    await page.selectOption('select[name="snapshot2"]', { index: 1 });
    await page.selectOption('select[name="snapshot3"]', { index: 2 });

    await page.click('button:has-text("Compare")');

    // Verify chart section exists
    await expect(page.locator('.comparison-chart')).toBeVisible();

    // Verify chart legend
    await expect(page.locator('text=/Total Wealth/i')).toBeVisible();
    await expect(page.locator('text=/Zakat Amount/i')).toBeVisible();
  });

  test('should handle comparison with only one snapshot', async ({ page }) => {
    await navigateToComparison(page);

    // Select only one snapshot
    await page.selectOption('select[name="snapshot1"]', { index: 0 });

    await page.click('button:has-text("Compare")');

    // Should show warning or single snapshot view
    await expect(page.locator('text=/select.*least.*two/i')).toBeVisible();
  });

  test('should export comparison to PDF', async ({ page }) => {
    await navigateToComparison(page);

    await page.selectOption('select[name="snapshot1"]', { index: 0 });
    await page.selectOption('select[name="snapshot2"]', { index: 2 });

    await page.click('button:has-text("Compare")');

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.click('button:has-text("Export to PDF")');

    // Wait for download
    const download = await downloadPromise;

    // Verify filename
    expect(download.suggestedFilename()).toMatch(/comparison.*\.pdf/i);
  });

  test('should display methodology information', async ({ page }) => {
    await navigateToComparison(page);

    await page.selectOption('select[name="snapshot1"]', { index: 0 });
    await page.selectOption('select[name="snapshot2"]', { index: 2 });

    await page.click('button:has-text("Compare")');

    // Verify methodology row
    const methodologyRow = page.locator('tr:has-text("Methodology")');
    await expect(methodologyRow.locator('td:has-text("Standard")')).toHaveCount(2);
  });

  test('should display nisab threshold comparison', async ({ page }) => {
    await navigateToComparison(page);

    await page.selectOption('select[name="snapshot1"]', { index: 0 });
    await page.selectOption('select[name="snapshot2"]', { index: 2 });

    await page.click('button:has-text("Compare")');

    // Verify nisab row
    const nisabRow = page.locator('tr:has-text("Nisab Threshold")');
    await expect(nisabRow.locator('td:has-text("$85,000")')).toHaveCount(2);
    
    // Verify nisab type
    await expect(page.locator('text=/Gold/i')).toBeVisible();
  });

  test('should switch between table and chart views', async ({ page }) => {
    await navigateToComparison(page);

    await page.selectOption('select[name="snapshot1"]', { index: 0 });
    await page.selectOption('select[name="snapshot2"]', { index: 1 });
    await page.selectOption('select[name="snapshot3"]', { index: 2 });

    await page.click('button:has-text("Compare")');

    // Default should show table
    await expect(page.locator('.comparison-table')).toBeVisible();

    // Click chart view button
    await page.click('button:has-text("Chart View")');

    // Verify chart is displayed
    await expect(page.locator('.comparison-chart')).toBeVisible();

    // Click table view button
    await page.click('button:has-text("Table View")');

    // Verify table is displayed again
    await expect(page.locator('.comparison-table')).toBeVisible();
  });

  test('should highlight significant changes', async ({ page }) => {
    await navigateToComparison(page);

    await page.selectOption('select[name="snapshot1"]', { index: 0 });
    await page.selectOption('select[name="snapshot2"]', { index: 2 });

    await page.click('button:has-text("Compare")');

    // Verify significant change indicators (>20% change)
    // Wealth: (150000 - 100000) / 100000 = 50% - significant
    const significantChanges = page.locator('.significant-change');
    await expect(significantChanges.count()).resolves.toBeGreaterThan(0);
  });

  test('should display year-over-year growth rate', async ({ page }) => {
    await navigateToComparison(page);

    await page.selectOption('select[name="snapshot1"]', { index: 0 });
    await page.selectOption('select[name="snapshot2"]', { index: 1 });
    await page.selectOption('select[name="snapshot3"]', { index: 2 });

    await page.click('button:has-text("Compare")');

    // Verify average growth rate is displayed
    await expect(page.locator('text=/Average.*Growth/i')).toBeVisible();
    
    // Average of 25% (2022→2023) and 20% (2023→2024) = 22.5%
    await expect(page.locator('text=/22.*%/i')).toBeVisible();
  });
});
