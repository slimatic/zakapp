import { test, expect } from '@playwright/test';

// Note: This test will fail until the full application is implemented
// This is intentional as per TDD methodology

test.describe('E2E Test: Zakat Calculation Complete Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Register and login user for each test
    await page.goto('http://localhost:3000');

    // Quick registration for zakat calculation tests
    await page.click('[data-testid="register-link"]');
    await page.fill('[data-testid="email-input"]', `zakat-test-${Date.now()}@example.com`);
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="first-name-input"]', 'Zakat');
    await page.fill('[data-testid="last-name-input"]', 'Tester');
    await page.click('[data-testid="register-button"]');

    // Verify we're logged in and have assets
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Ensure user has sufficient assets for zakat calculation
    await page.click('[data-testid="assets-nav"]');
    await page.click('[data-testid="add-asset-button"]');

    // Add cash asset above nisab threshold
    await page.selectOption('[data-testid="asset-type-select"]', 'cash');
    await page.fill('[data-testid="asset-name-input"]', 'Zakat Savings');
    await page.fill('[data-testid="asset-value-input"]', '10000'); // Above nisab
    await page.selectOption('[data-testid="currency-select"]', 'USD');
    await page.fill('[data-testid="asset-description-input"]', 'Savings for Zakat calculation');
    await page.click('[data-testid="create-asset-button"]');

    // Verify asset creation
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Asset created successfully');
  });

  test('should complete full zakat calculation workflow', async ({ page }) => {
    // Navigate to Zakat dashboard
    await page.click('[data-testid="zakat-nav"]');
    await expect(page).toHaveURL(/.*\/zakat/);

    // Step 1: Start calculation
    await page.click('[data-testid="calculate-zakat-button"]');
    await expect(page.locator('[data-testid="calculation-modal"]')).toBeVisible();

    // Step 2: Select methodology
    await page.selectOption('[data-testid="methodology-select"]', 'STANDARD');
    await page.click('[data-testid="calculate-submit-button"]');

    // Step 3: View calculation results
    await expect(page.locator('[data-testid="calculation-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="zakat-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="nisab-threshold"]')).toBeVisible();

    // Verify calculation shows positive zakat amount
    const zakatAmount = await page.locator('[data-testid="zakat-amount"]').textContent();
    expect(parseFloat(zakatAmount?.replace(/[^0-9.]/g, '') || '0')).toBeGreaterThan(0);

    // Step 4: Record payment
    await page.click('[data-testid="record-payment-button"]');
    await expect(page.locator('[data-testid="payment-modal"]')).toBeVisible();

    await page.fill('[data-testid="payment-amount-input"]', '125'); // Partial payment
    await page.fill('[data-testid="payment-date-input"]', new Date().toISOString().split('T')[0]);
    await page.fill('[data-testid="payment-recipient-input"]', 'Local Mosque');
    await page.fill('[data-testid="payment-notes-input"]', 'Ramadan Zakat payment');
    await page.click('[data-testid="payment-submit-button"]');

    // Verify payment recorded
    await expect(page.locator('[data-testid="payment-success-message"]')).toContainText('Payment recorded successfully');

    // Step 5: Create snapshot
    await page.click('[data-testid="create-snapshot-button"]');
    await expect(page.locator('[data-testid="snapshot-modal"]')).toBeVisible();

    await page.selectOption('[data-testid="snapshot-year-select"]', new Date().getFullYear().toString());
    await page.fill('[data-testid="snapshot-notes-input"]', 'End of year Zakat snapshot');
    await page.click('[data-testid="snapshot-submit-button"]');

    // Verify snapshot created
    await expect(page.locator('[data-testid="snapshot-success-message"]')).toContainText('Snapshot created successfully');
  });

  test('should handle methodology switching and recalculation', async ({ page }) => {
    await page.click('[data-testid="zakat-nav"]');

    // First calculation with Standard methodology
    await page.click('[data-testid="calculate-zakat-button"]');
    await page.selectOption('[data-testid="methodology-select"]', 'STANDARD');
    await page.click('[data-testid="calculate-submit-button"]');

    const standardZakatAmount = await page.locator('[data-testid="zakat-amount"]').textContent();
    const standardAmount = parseFloat(standardZakatAmount?.replace(/[^0-9.]/g, '') || '0');

    // Switch to Hanafi methodology
    await page.click('[data-testid="change-methodology-button"]');
    await page.selectOption('[data-testid="methodology-select"]', 'HANAFI');
    await page.click('[data-testid="recalculate-button"]');

    const hanafiZakatAmount = await page.locator('[data-testid="zakat-amount"]').textContent();
    const hanafiAmount = parseFloat(hanafiZakatAmount?.replace(/[^0-9.]/g, '') || '0');

    // Hanafi should produce different results
    expect(hanafiAmount).not.toBe(standardAmount);
  });

  test('should create and compare snapshots', async ({ page }) => {
    await page.click('[data-testid="zakat-nav"]');

    // Create first snapshot
    await page.click('[data-testid="calculate-zakat-button"]');
    await page.selectOption('[data-testid="methodology-select"]', 'STANDARD');
    await page.click('[data-testid="calculate-submit-button"]');

    await page.click('[data-testid="create-snapshot-button"]');
    await page.selectOption('[data-testid="snapshot-year-select"]', '2024');
    await page.fill('[data-testid="snapshot-notes-input"]', '2024 Zakat calculation');
    await page.click('[data-testid="snapshot-submit-button"]');

    // Modify assets to create different snapshot
    await page.click('[data-testid="assets-nav"]');
    await page.click('[data-testid="edit-asset-button"]');
    await page.fill('[data-testid="asset-value-input"]', '15000'); // Increase value
    await page.click('[data-testid="update-asset-button"]');

    // Create second snapshot
    await page.click('[data-testid="zakat-nav"]');
    await page.click('[data-testid="calculate-zakat-button"]');
    await page.selectOption('[data-testid="methodology-select"]', 'STANDARD');
    await page.click('[data-testid="calculate-submit-button"]');

    await page.click('[data-testid="create-snapshot-button"]');
    await page.selectOption('[data-testid="snapshot-year-select"]', '2025');
    await page.fill('[data-testid="snapshot-notes-input"]', '2025 Zakat calculation');
    await page.click('[data-testid="snapshot-submit-button"]');

    // Compare snapshots
    await page.click('[data-testid="snapshot-comparison-nav"]');
    await page.selectOption('[data-testid="from-year-select"]', '2024');
    await page.selectOption('[data-testid="to-year-select"]', '2025');
    await page.click('[data-testid="compare-snapshots-button"]');

    // Verify comparison results
    await expect(page.locator('[data-testid="comparison-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="asset-growth"]')).toBeVisible();
    await expect(page.locator('[data-testid="zakat-growth"]')).toBeVisible();

    // Asset growth should be positive
    const assetGrowthText = await page.locator('[data-testid="asset-growth"]').textContent();
    expect(assetGrowthText).toContain('+');
  });

  test('should handle payment tracking workflow', async ({ page }) => {
    await page.click('[data-testid="zakat-nav"]');

    // Calculate zakat first
    await page.click('[data-testid="calculate-zakat-button"]');
    await page.selectOption('[data-testid="methodology-select"]', 'STANDARD');
    await page.click('[data-testid="calculate-submit-button"]');

    // Navigate to payments
    await page.click('[data-testid="payments-nav"]');

    // Record multiple payments
    for (let i = 1; i <= 3; i++) {
      await page.click('[data-testid="record-payment-button"]');
      await page.fill('[data-testid="payment-amount-input"]', (50 * i).toString());
      await page.fill('[data-testid="payment-date-input"]', new Date().toISOString().split('T')[0]);
      await page.fill('[data-testid="payment-recipient-input"]', `Charity ${i}`);
      await page.click('[data-testid="payment-submit-button"]');

      await expect(page.locator('[data-testid="payment-success-message"]')).toBeVisible();
    }

    // Verify payments in list
    await expect(page.locator('[data-testid="payment-item"]')).toHaveCount(3);

    // Check total paid
    const totalPaidText = await page.locator('[data-testid="total-paid"]').textContent();
    const totalPaid = parseFloat(totalPaidText?.replace(/[^0-9.]/g, '') || '0');
    expect(totalPaid).toBe(50 + 100 + 150); // 300

    // Check remaining balance
    const remainingText = await page.locator('[data-testid="remaining-balance"]').textContent();
    const remaining = parseFloat(remainingText?.replace(/[^0-9.]/g, '') || '0');
    expect(remaining).toBeGreaterThan(0);
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    await page.click('[data-testid="zakat-nav"]');

    // Try to calculate without assets
    await page.click('[data-testid="assets-nav"]');
    await page.click('[data-testid="delete-asset-button"]'); // Delete the test asset
    await page.click('[data-testid="confirm-delete-button"]');

    await page.click('[data-testid="zakat-nav"]');
    await page.click('[data-testid="calculate-zakat-button"]');

    // Should show error for insufficient assets
    await expect(page.locator('[data-testid="error-message"]')).toContainText('insufficient assets');

    // Try invalid payment amount
    await page.click('[data-testid="record-payment-button"]');
    await page.fill('[data-testid="payment-amount-input"]', '-100'); // Negative amount
    await page.click('[data-testid="payment-submit-button"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText('invalid amount');
  });

  test('should be responsive across different viewports', async ({ page, browserName }) => {
    // Skip on webkit due to viewport issues
    test.skip(browserName === 'webkit', 'Viewport tests unreliable on WebKit');

    await page.click('[data-testid="zakat-nav"]');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="desktop-layout"]')).toBeVisible();
  });

  test('should be accessible with keyboard navigation', async ({ page }) => {
    await page.click('[data-testid="zakat-nav"]');

    // Test tab navigation through calculation form
    await page.keyboard.press('Tab'); // Focus first element
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'methodology-select');

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'calculate-submit-button');

    // Test enter key submission
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="calculation-results"]')).toBeVisible();

    // Test escape key to close modals
    await page.click('[data-testid="record-payment-button"]');
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="payment-modal"]')).not.toBeVisible();
  });

  test('should support screen reader accessibility', async ({ page }) => {
    await page.click('[data-testid="zakat-nav"]');

    // Check for ARIA labels
    await expect(page.locator('[aria-label="Zakat calculation methodology"]')).toBeVisible();
    await expect(page.locator('[aria-label="Zakat amount due"]')).toBeVisible();

    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    const h2Count = await page.locator('h2').count();
    expect(h1Count).toBeGreaterThan(0);
    expect(h2Count).toBeGreaterThan(0);

    // Check for alt text on images
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    expect(imagesWithoutAlt).toBe(0);

    // Check for sufficient color contrast (this would require additional tooling)
    // For now, verify that important text is not too light
    const importantText = page.locator('[data-testid="zakat-amount"]');
    const color = await importantText.evaluate(el => getComputedStyle(el).color);
    expect(color).not.toBe('rgb(255, 255, 255)'); // Not white text
  });

  test('should handle offline scenarios gracefully', async ({ page }) => {
    await page.click('[data-testid="zakat-nav"]');

    // Go offline
    await page.context().setOffline(true);

    // Try to calculate
    await page.click('[data-testid="calculate-zakat-button"]');

    // Should show offline message
    await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

    // Come back online
    await page.context().setOffline(false);
    await page.click('[data-testid="retry-button"]');

    // Should work normally now
    await expect(page.locator('[data-testid="calculation-results"]')).toBeVisible();
  });

  test('should validate form inputs properly', async ({ page }) => {
    await page.click('[data-testid="zakat-nav"]');

    // Test payment form validation
    await page.click('[data-testid="record-payment-button"]');

    // Empty amount
    await page.click('[data-testid="payment-submit-button"]');
    await expect(page.locator('[data-testid="amount-error"]')).toContainText('required');

    // Invalid amount
    await page.fill('[data-testid="payment-amount-input"]', 'abc');
    await page.click('[data-testid="payment-submit-button"]');
    await expect(page.locator('[data-testid="amount-error"]')).toContainText('invalid number');

    // Future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    await page.fill('[data-testid="payment-date-input"]', futureDate.toISOString().split('T')[0]);
    await page.click('[data-testid="payment-submit-button"]');
    await expect(page.locator('[data-testid="date-error"]')).toContainText('cannot be future');

    // Valid data should work
    await page.fill('[data-testid="payment-amount-input"]', '100');
    await page.fill('[data-testid="payment-date-input"]', new Date().toISOString().split('T')[0]);
    await page.click('[data-testid="payment-submit-button"]');
    await expect(page.locator('[data-testid="payment-success-message"]')).toBeVisible();
  });
});