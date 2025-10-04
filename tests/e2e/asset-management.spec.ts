import { test, expect } from '@playwright/test';

// Note: This test will fail until the full application is implemented
// This is intentional as per TDD methodology

test.describe('E2E Test: Asset Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Register and login user for each test
    await page.goto('http://localhost:3000');
    
    // Quick registration for asset management tests
    await page.click('[data-testid="register-link"]');
    await page.fill('[data-testid="email-input"]', `asset-test-${Date.now()}@example.com`);
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="first-name-input"]', 'Asset');
    await page.fill('[data-testid="last-name-input"]', 'Tester');
    await page.click('[data-testid="register-button"]');
    
    // Verify we're logged in
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('should create, view, edit, and delete assets through complete workflow', async ({ page }) => {
    // Step 1: Create a new cash asset
    await page.click('[data-testid="add-asset-button"]');
    await expect(page).toHaveURL(/.*\/assets\/new/);

    await page.selectOption('[data-testid="asset-type-select"]', 'cash');
    await page.fill('[data-testid="asset-value-input"]', '25000');
    await page.selectOption('[data-testid="currency-select"]', 'USD');
    await page.fill('[data-testid="description-input"]', 'Primary savings account');
    await page.fill('[data-testid="notes-input"]', 'Main bank account for daily expenses');
    await page.click('[data-testid="create-asset-button"]');

    // Verify creation success
    await expect(page).toHaveURL(/.*\/assets/);
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Asset created successfully');

    // Step 2: Verify asset appears in list
    await expect(page.locator('[data-testid="asset-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="asset-description"]').first()).toContainText('Primary savings account');
    await expect(page.locator('[data-testid="asset-value"]').first()).toContainText('$25,000.00');

    // Step 3: View asset details
    await page.click('[data-testid="asset-item"]');
    await expect(page).toHaveURL(/.*\/assets\/[a-f0-9-]+/);
    
    await expect(page.locator('[data-testid="asset-detail-type"]')).toContainText('Cash');
    await expect(page.locator('[data-testid="asset-detail-value"]')).toContainText('$25,000.00');
    await expect(page.locator('[data-testid="asset-detail-description"]')).toContainText('Primary savings account');
    await expect(page.locator('[data-testid="asset-detail-notes"]')).toContainText('Main bank account for daily expenses');

    // Step 4: Edit the asset
    await page.click('[data-testid="edit-asset-button"]');
    await expect(page).toHaveURL(/.*\/assets\/[a-f0-9-]+\/edit/);

    // Update values
    await page.fill('[data-testid="asset-value-input"]', '30000');
    await page.fill('[data-testid="description-input"]', 'Updated primary savings account');
    await page.fill('[data-testid="notes-input"]', 'Updated: Main bank account with recent bonus');
    await page.click('[data-testid="save-asset-button"]');

    // Verify update success
    await expect(page).toHaveURL(/.*\/assets\/[a-f0-9-]+/);
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Asset updated successfully');
    await expect(page.locator('[data-testid="asset-detail-value"]')).toContainText('$30,000.00');
    await expect(page.locator('[data-testid="asset-detail-description"]')).toContainText('Updated primary savings account');

    // Step 5: Delete the asset
    await page.click('[data-testid="delete-asset-button"]');
    
    // Confirm deletion in modal
    await expect(page.locator('[data-testid="delete-confirmation-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="delete-confirmation-text"]')).toContainText('Updated primary savings account');
    await page.click('[data-testid="confirm-delete-button"]');

    // Verify deletion success
    await expect(page).toHaveURL(/.*\/assets/);
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Asset deleted successfully');
    await expect(page.locator('[data-testid="asset-item"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="empty-assets-message"]')).toContainText('No assets found');
  });

  test('should handle multiple asset types with proper categorization', async ({ page }) => {
    const assets = [
      { type: 'cash', value: '15000', currency: 'USD', description: 'Checking account' },
      { type: 'gold', value: '5000', currency: 'USD', description: '2 oz gold coins' },
      { type: 'silver', value: '2000', currency: 'USD', description: '50 oz silver bars' },
      { type: 'crypto', value: '8000', currency: 'BTC', description: 'Bitcoin investment' },
      { type: 'business', value: '50000', currency: 'USD', description: 'Small business equity' },
      { type: 'investment', value: '25000', currency: 'USD', description: 'Stock portfolio' }
    ];

    // Create multiple assets of different types
    for (const asset of assets) {
      await page.click('[data-testid="add-asset-button"]');
      
      await page.selectOption('[data-testid="asset-type-select"]', asset.type);
      await page.fill('[data-testid="asset-value-input"]', asset.value);
      await page.selectOption('[data-testid="currency-select"]', asset.currency);
      await page.fill('[data-testid="description-input"]', asset.description);
      await page.click('[data-testid="create-asset-button"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Asset created successfully');
    }

    // Verify all assets are listed
    await expect(page.locator('[data-testid="asset-item"]')).toHaveCount(assets.length);

    // Test filtering by asset type
    await page.selectOption('[data-testid="asset-type-filter"]', 'cash');
    await expect(page.locator('[data-testid="asset-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="asset-description"]')).toContainText('Checking account');

    await page.selectOption('[data-testid="asset-type-filter"]', 'crypto');
    await expect(page.locator('[data-testid="asset-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="asset-description"]')).toContainText('Bitcoin investment');

    // Reset filter to show all
    await page.selectOption('[data-testid="asset-type-filter"]', 'all');
    await expect(page.locator('[data-testid="asset-item"]')).toHaveCount(assets.length);

    // Test sorting by value
    await page.selectOption('[data-testid="sort-by-select"]', 'value-desc');
    const firstAssetValue = await page.locator('[data-testid="asset-value"]').first().textContent();
    expect(firstAssetValue).toContain('50,000'); // Business asset should be first

    await page.selectOption('[data-testid="sort-by-select"]', 'value-asc');
    const firstAssetValueAsc = await page.locator('[data-testid="asset-value"]').first().textContent();
    expect(firstAssetValueAsc).toContain('2,000'); // Silver asset should be first
  });

  test('should validate asset form inputs and show appropriate errors', async ({ page }) => {
    await page.click('[data-testid="add-asset-button"]');

    // Test empty form submission
    await page.click('[data-testid="create-asset-button"]');
    await expect(page.locator('[data-testid="type-error"]')).toContainText('Asset type is required');
    await expect(page.locator('[data-testid="value-error"]')).toContainText('Asset value is required');
    await expect(page.locator('[data-testid="currency-error"]')).toContainText('Currency is required');

    // Test invalid value inputs
    await page.selectOption('[data-testid="asset-type-select"]', 'cash');
    await page.selectOption('[data-testid="currency-select"]', 'USD');

    // Test negative value
    await page.fill('[data-testid="asset-value-input"]', '-1000');
    await page.click('[data-testid="create-asset-button"]');
    await expect(page.locator('[data-testid="value-error"]')).toContainText('Asset value must be positive');

    // Test zero value
    await page.fill('[data-testid="asset-value-input"]', '0');
    await page.click('[data-testid="create-asset-button"]');
    await expect(page.locator('[data-testid="value-error"]')).toContainText('Asset value must be greater than 0');

    // Test non-numeric value
    await page.fill('[data-testid="asset-value-input"]', 'invalid');
    await page.click('[data-testid="create-asset-button"]');
    await expect(page.locator('[data-testid="value-error"]')).toContainText('Please enter a valid number');

    // Test description length limit
    await page.fill('[data-testid="asset-value-input"]', '1000');
    await page.fill('[data-testid="description-input"]', 'A'.repeat(501)); // Exceeds limit
    await page.click('[data-testid="create-asset-button"]');
    await expect(page.locator('[data-testid="description-error"]')).toContainText('Description must be 500 characters or less');

    // Test notes length limit
    await page.fill('[data-testid="description-input"]', 'Valid description');
    await page.fill('[data-testid="notes-input"]', 'A'.repeat(1001)); // Exceeds limit
    await page.click('[data-testid="create-asset-button"]');
    await expect(page.locator('[data-testid="notes-error"]')).toContainText('Notes must be 1000 characters or less');

    // Test successful creation with valid data
    await page.fill('[data-testid="notes-input"]', 'Valid notes');
    await page.click('[data-testid="create-asset-button"]');
    await expect(page).toHaveURL(/.*\/assets/);
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Asset created successfully');
  });

  test('should handle asset portfolio summary and calculations', async ({ page }) => {
    // Create a diverse portfolio
    const portfolio = [
      { type: 'cash', value: '10000', currency: 'USD', description: 'Savings' },
      { type: 'cash', value: '5000', currency: 'EUR', description: 'Euro account' },
      { type: 'gold', value: '15000', currency: 'USD', description: 'Gold holdings' },
      { type: 'crypto', value: '8000', currency: 'USD', description: 'Crypto portfolio' }
    ];

    for (const asset of portfolio) {
      await page.click('[data-testid="add-asset-button"]');
      await page.selectOption('[data-testid="asset-type-select"]', asset.type);
      await page.fill('[data-testid="asset-value-input"]', asset.value);
      await page.selectOption('[data-testid="currency-select"]', asset.currency);
      await page.fill('[data-testid="description-input"]', asset.description);
      await page.click('[data-testid="create-asset-button"]');
    }

    // Navigate to portfolio summary
    await page.click('[data-testid="portfolio-summary-link"]');
    await expect(page).toHaveURL(/.*\/portfolio/);

    // Verify summary calculations
    await expect(page.locator('[data-testid="total-assets-count"]')).toContainText('4');
    
    // Check asset type breakdown
    await expect(page.locator('[data-testid="cash-assets-count"]')).toContainText('2');
    await expect(page.locator('[data-testid="gold-assets-count"]')).toContainText('1');
    await expect(page.locator('[data-testid="crypto-assets-count"]')).toContainText('1');

    // Verify currency breakdown shows multiple currencies
    await expect(page.locator('[data-testid="currency-breakdown"]')).toContainText('USD');
    await expect(page.locator('[data-testid="currency-breakdown"]')).toContainText('EUR');

    // Test export functionality
    await page.click('[data-testid="export-portfolio-button"]');
    await expect(page.locator('[data-testid="export-options-modal"]')).toBeVisible();
    
    await page.click('[data-testid="export-csv-button"]');
    // Note: File download testing would require additional setup
    await expect(page.locator('[data-testid="export-success-message"]')).toContainText('Portfolio exported successfully');
  });

  test('should handle bulk asset operations', async ({ page }) => {
    // Create multiple assets for bulk operations
    for (let i = 1; i <= 5; i++) {
      await page.click('[data-testid="add-asset-button"]');
      await page.selectOption('[data-testid="asset-type-select"]', 'cash');
      await page.fill('[data-testid="asset-value-input"]', `${i * 1000}`);
      await page.selectOption('[data-testid="currency-select"]', 'USD');
      await page.fill('[data-testid="description-input"]', `Test asset ${i}`);
      await page.click('[data-testid="create-asset-button"]');
    }

    // Test bulk selection
    await page.click('[data-testid="bulk-actions-toggle"]');
    await expect(page.locator('[data-testid="bulk-actions-panel"]')).toBeVisible();

    // Select multiple assets
    await page.check('[data-testid="asset-checkbox-1"]');
    await page.check('[data-testid="asset-checkbox-2"]');
    await page.check('[data-testid="asset-checkbox-3"]');

    await expect(page.locator('[data-testid="selected-count"]')).toContainText('3 selected');

    // Test bulk currency update
    await page.click('[data-testid="bulk-update-currency-button"]');
    await page.selectOption('[data-testid="bulk-currency-select"]', 'EUR');
    await page.click('[data-testid="apply-bulk-update-button"]');

    await expect(page.locator('[data-testid="success-message"]')).toContainText('3 assets updated successfully');

    // Test bulk delete
    await page.check('[data-testid="asset-checkbox-4"]');
    await page.check('[data-testid="asset-checkbox-5"]');
    await page.click('[data-testid="bulk-delete-button"]');

    await expect(page.locator('[data-testid="bulk-delete-confirmation-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="delete-confirmation-text"]')).toContainText('2 assets');
    await page.click('[data-testid="confirm-bulk-delete-button"]');

    await expect(page.locator('[data-testid="success-message"]')).toContainText('2 assets deleted successfully');
    await expect(page.locator('[data-testid="asset-item"]')).toHaveCount(3);
  });

  test('should handle search and advanced filtering', async ({ page }) => {
    // Create assets with various attributes for testing search
    const searchAssets = [
      { type: 'cash', value: '10000', currency: 'USD', description: 'Primary checking account' },
      { type: 'cash', value: '5000', currency: 'USD', description: 'Emergency savings fund' },
      { type: 'gold', value: '15000', currency: 'USD', description: 'Gold coin collection' },
      { type: 'crypto', value: '8000', currency: 'BTC', description: 'Bitcoin long-term hold' },
      { type: 'business', value: '50000', currency: 'USD', description: 'Restaurant business stake' }
    ];

    for (const asset of searchAssets) {
      await page.click('[data-testid="add-asset-button"]');
      await page.selectOption('[data-testid="asset-type-select"]', asset.type);
      await page.fill('[data-testid="asset-value-input"]', asset.value);
      await page.selectOption('[data-testid="currency-select"]', asset.currency);
      await page.fill('[data-testid="description-input"]', asset.description);
      await page.click('[data-testid="create-asset-button"]');
    }

    // Test basic search
    await page.fill('[data-testid="search-input"]', 'checking');
    await expect(page.locator('[data-testid="asset-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="asset-description"]')).toContainText('Primary checking account');

    // Test search with multiple results
    await page.fill('[data-testid="search-input"]', 'fund');
    await expect(page.locator('[data-testid="asset-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="asset-description"]')).toContainText('Emergency savings fund');

    // Test search with no results
    await page.fill('[data-testid="search-input"]', 'nonexistent');
    await expect(page.locator('[data-testid="asset-item"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="no-search-results"]')).toContainText('No assets found matching your search');

    // Clear search
    await page.fill('[data-testid="search-input"]', '');
    await expect(page.locator('[data-testid="asset-item"]')).toHaveCount(searchAssets.length);

    // Test advanced filters
    await page.click('[data-testid="advanced-filters-toggle"]');
    await expect(page.locator('[data-testid="advanced-filters-panel"]')).toBeVisible();

    // Filter by value range
    await page.fill('[data-testid="min-value-input"]', '10000');
    await page.fill('[data-testid="max-value-input"]', '20000');
    await page.click('[data-testid="apply-filters-button"]');

    await expect(page.locator('[data-testid="asset-item"]')).toHaveCount(2); // checking account and gold
    
    // Filter by currency
    await page.selectOption('[data-testid="currency-filter"]', 'BTC');
    await page.click('[data-testid="apply-filters-button"]');
    
    await expect(page.locator('[data-testid="asset-item"]')).toHaveCount(0); // No BTC in range

    // Clear filters
    await page.click('[data-testid="clear-filters-button"]');
    await expect(page.locator('[data-testid="asset-item"]')).toHaveCount(searchAssets.length);
  });

  test('should maintain data integrity during rapid operations', async ({ page }) => {
    // Test rapid asset creation
    const rapidAssets = [];
    for (let i = 1; i <= 3; i++) {
      await page.click('[data-testid="add-asset-button"]');
      await page.selectOption('[data-testid="asset-type-select"]', 'cash');
      await page.fill('[data-testid="asset-value-input"]', `${i * 2000}`);
      await page.selectOption('[data-testid="currency-select"]', 'USD');
      await page.fill('[data-testid="description-input"]', `Rapid test asset ${i}`);
      
      // Don't wait for success message, create rapidly
      await page.click('[data-testid="create-asset-button"]');
      rapidAssets.push(`Rapid test asset ${i}`);
    }

    // Wait for all operations to complete
    await page.waitForTimeout(2000);
    
    // Verify all assets were created
    await expect(page.locator('[data-testid="asset-item"]')).toHaveCount(3);
    
    // Verify each asset description appears
    for (const description of rapidAssets) {
      await expect(page.locator(`[data-testid="asset-description"]:has-text("${description}")`)).toBeVisible();
    }

    // Test rapid editing
    const assetItems = page.locator('[data-testid="asset-item"]');
    for (let i = 0; i < 3; i++) {
      await assetItems.nth(i).click();
      await page.click('[data-testid="edit-asset-button"]');
      await page.fill('[data-testid="asset-value-input"]', `${(i + 1) * 3000}`);
      await page.click('[data-testid="save-asset-button"]');
      await page.click('[data-testid="back-to-assets-button"]');
    }

    // Verify all edits were applied correctly
    const values = ['$3,000.00', '$6,000.00', '$9,000.00'];
    for (let i = 0; i < 3; i++) {
      await expect(page.locator('[data-testid="asset-value"]').nth(i)).toContainText(values[i]);
    }
  });
});