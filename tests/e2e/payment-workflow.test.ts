import { test, expect } from '@playwright/test';

test.describe('Payment Recording Workflow', () => {
  test('should complete full payment recording workflow', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Login
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    // Navigate to payments page
    await page.click('[data-testid="payments-nav"]');

    // Click add payment button
    await page.click('[data-testid="add-payment-button"]');

    // Fill payment form
    await page.fill('[data-testid="amount-input"]', '750.00');
    await page.fill('[data-testid="payment-date-input"]', '2024-03-15');
    await page.fill('[data-testid="recipient-name-input"]', 'Local Mosque');
    await page.selectOption('[data-testid="recipient-type-select"]', 'mosque');
    await page.selectOption('[data-testid="recipient-category-select"]', 'general');
    await page.selectOption('[data-testid="payment-method-select"]', 'bank_transfer');
    await page.fill('[data-testid="notes-input"]', 'Ramadan Zakat payment');

    // Submit the form
    await page.click('[data-testid="submit-payment-button"]');

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Payment recorded successfully');

    // Verify payment appears in history
    await page.click('[data-testid="payment-history-tab"]');
    await expect(page.locator('[data-testid="payment-list"]')).toContainText('Local Mosque');
    await expect(page.locator('[data-testid="payment-list"]')).toContainText('$750.00');

    // Navigate to analytics
    await page.click('[data-testid="analytics-nav"]');

    // Verify payment appears in analytics
    await expect(page.locator('[data-testid="total-payments"]')).toContainText('1');
    await expect(page.locator('[data-testid="total-amount"]')).toContainText('$750.00');
  });

  test('should validate payment form fields', async ({ page }) => {
    // Login and navigate to payment form
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.click('[data-testid="payments-nav"]');
    await page.click('[data-testid="add-payment-button"]');

    // Try to submit empty form
    await page.click('[data-testid="submit-payment-button"]');

    // Verify validation errors
    await expect(page.locator('[data-testid="amount-error"]')).toContainText('Amount is required');
    await expect(page.locator('[data-testid="payment-date-error"]')).toContainText('Payment date is required');
    await expect(page.locator('[data-testid="recipient-name-error"]')).toContainText('Recipient name is required');
    await expect(page.locator('[data-testid="recipient-type-error"]')).toContainText('Recipient type is required');
    await expect(page.locator('[data-testid="recipient-category-error"]')).toContainText('Recipient category is required');
    await expect(page.locator('[data-testid="payment-method-error"]')).toContainText('Payment method is required');
  });

  test('should handle payment form with optional fields', async ({ page }) => {
    // Login and navigate to payment form
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.click('[data-testid="payments-nav"]');
    await page.click('[data-testid="add-payment-button"]');

    // Fill only required fields
    await page.fill('[data-testid="amount-input"]', '250.00');
    await page.fill('[data-testid="payment-date-input"]', '2024-03-20');
    await page.fill('[data-testid="recipient-name-input"]', 'Orphanage');
    await page.selectOption('[data-testid="recipient-type-select"]', 'organization');
    await page.selectOption('[data-testid="recipient-category-select"]', 'orphans');
    await page.selectOption('[data-testid="payment-method-select"]', 'cash');

    // Submit the form
    await page.click('[data-testid="submit-payment-button"]');

    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Payment recorded successfully');
  });
});