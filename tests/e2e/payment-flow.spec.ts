/**
 * E2E Test: Payment Recording and Summary View Workflow
 * Tests the complete workflow for recording Zakat payments and viewing annual summary
 * 
 * Scenarios:
 * 1. Create finalized snapshot
 * 2. Record multiple payments with different categories
 * 3. View payment list with filtering
 * 4. View annual summary with payment totals
 * 5. Verify payment completion tracking
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
  status: 'finalized'
};

const testPayments = [
  {
    amount: 1000,
    paymentDate: '2024-07-01',
    recipientName: 'Local Masjid',
    recipientType: 'organization',
    recipientCategory: 'fakir',
    notes: 'Monthly Zakat distribution',
    paymentMethod: 'bank_transfer'
  },
  {
    amount: 1500,
    paymentDate: '2024-08-01',
    recipientName: 'Family in Need',
    recipientType: 'individual',
    recipientCategory: 'miskin',
    notes: 'Direct assistance',
    paymentMethod: 'cash'
  },
  {
    amount: 750,
    paymentDate: '2024-09-01',
    recipientName: 'Islamic Relief',
    recipientType: 'organization',
    recipientCategory: 'fisabilillah',
    notes: 'In the way of Allah',
    paymentMethod: 'online'
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
  
  // Fill basic form fields
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
  await page.selectOption('select[name="status"]', testSnapshot.status);
  
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/tracking/snapshots');
}

async function navigateToPayments(page: Page) {
  await page.click('a[href="/tracking/payments"]');
  await expect(page).toHaveURL('/tracking/payments');
}

async function fillPaymentForm(page: Page, payment: typeof testPayments[0]) {
  await page.fill('input[name="amount"]', payment.amount.toString());
  await page.fill('input[name="paymentDate"]', payment.paymentDate);
  await page.fill('input[name="recipientName"]', payment.recipientName);
  await page.selectOption('select[name="recipientType"]', payment.recipientType);
  await page.selectOption('select[name="recipientCategory"]', payment.recipientCategory);
  await page.fill('textarea[name="notes"]', payment.notes);
  await page.selectOption('select[name="paymentMethod"]', payment.paymentMethod);
}

test.describe('Payment Recording and Summary Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await createSnapshot(page);
  });

  test('should record a single payment successfully', async ({ page }) => {
    await navigateToPayments(page);

    // Click "Record Payment" button
    await page.click('button:has-text("Record Payment")');

    // Select snapshot
    await page.selectOption('select[name="snapshotId"]', { index: 0 });

    // Fill payment form
    await fillPaymentForm(page, testPayments[0]);

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('text=/Payment recorded successfully/i')).toBeVisible();

    // Verify payment appears in list
    await expect(page.locator(`text=/${testPayments[0].recipientName}/`)).toBeVisible();
    await expect(page.locator(`text=/\\$${testPayments[0].amount.toLocaleString()}/`)).toBeVisible();
  });

  test('should record multiple payments for same snapshot', async ({ page }) => {
    await navigateToPayments(page);

    // Record all test payments
    for (const payment of testPayments) {
      await page.click('button:has-text("Record Payment")');
      await page.selectOption('select[name="snapshotId"]', { index: 0 });
      await fillPaymentForm(page, payment);
      await page.click('button[type="submit"]');
      await expect(page.locator('text=/Payment recorded successfully/i')).toBeVisible();
    }

    // Verify all payments are in list
    for (const payment of testPayments) {
      await expect(page.locator(`text=/${payment.recipientName}/`)).toBeVisible();
    }

    // Verify total count
    const paymentCards = page.locator('.payment-card');
    await expect(paymentCards).toHaveCount(testPayments.length);
  });

  test('should filter payments by category', async ({ page }) => {
    await navigateToPayments(page);

    // Record payments with different categories
    for (const payment of testPayments) {
      await page.click('button:has-text("Record Payment")');
      await page.selectOption('select[name="snapshotId"]', { index: 0 });
      await fillPaymentForm(page, payment);
      await page.click('button[type="submit"]');
      await expect(page.locator('text=/Payment recorded successfully/i')).toBeVisible();
    }

    // Filter by "fakir" category
    await page.selectOption('select[name="categoryFilter"]', 'fakir');

    // Verify only fakir payment is visible
    await expect(page.locator('text=/Local Masjid/')).toBeVisible();
    await expect(page.locator('text=/Family in Need/')).not.toBeVisible();
    await expect(page.locator('text=/Islamic Relief/')).not.toBeVisible();

    // Filter by "miskin" category
    await page.selectOption('select[name="categoryFilter"]', 'miskin');

    // Verify only miskin payment is visible
    await expect(page.locator('text=/Family in Need/')).toBeVisible();
    await expect(page.locator('text=/Local Masjid/')).not.toBeVisible();
  });

  test('should filter payments by recipient type', async ({ page }) => {
    await navigateToPayments(page);

    // Record payments
    for (const payment of testPayments) {
      await page.click('button:has-text("Record Payment")');
      await page.selectOption('select[name="snapshotId"]', { index: 0 });
      await fillPaymentForm(page, payment);
      await page.click('button[type="submit"]');
      await expect(page.locator('text=/Payment recorded successfully/i')).toBeVisible();
    }

    // Filter by "organization"
    await page.selectOption('select[name="typeFilter"]', 'organization');

    // Verify only organization payments are visible
    await expect(page.locator('text=/Local Masjid/')).toBeVisible();
    await expect(page.locator('text=/Islamic Relief/')).toBeVisible();
    await expect(page.locator('text=/Family in Need/')).not.toBeVisible();

    // Filter by "individual"
    await page.selectOption('select[name="typeFilter"]', 'individual');

    // Verify only individual payment is visible
    await expect(page.locator('text=/Family in Need/')).toBeVisible();
    await expect(page.locator('text=/Local Masjid/')).not.toBeVisible();
  });

  test('should display annual summary with payment totals', async ({ page }) => {
    await navigateToPayments(page);

    // Record all payments
    for (const payment of testPayments) {
      await page.click('button:has-text("Record Payment")');
      await page.selectOption('select[name="snapshotId"]', { index: 0 });
      await fillPaymentForm(page, payment);
      await page.click('button[type="submit"]');
      await expect(page.locator('text=/Payment recorded successfully/i')).toBeVisible();
    }

    // Navigate to analytics/summary page
    await page.click('a[href="/tracking/analytics"]');
    await expect(page).toHaveURL('/tracking/analytics');

    // Calculate expected totals
    const totalPaid = testPayments.reduce((sum, p) => sum + p.amount, 0);
    const zakatDue = testSnapshot.zakatAmount;
    const outstanding = zakatDue - totalPaid;
    const completionPercentage = Math.round((totalPaid / zakatDue) * 100);

    // Verify total paid
    await expect(page.locator(`text=/Total Paid.*\\$${totalPaid.toLocaleString()}/i`)).toBeVisible();

    // Verify Zakat due
    await expect(page.locator(`text=/Zakat Due.*\\$${zakatDue.toLocaleString()}/i`)).toBeVisible();

    // Verify outstanding
    await expect(page.locator(`text=/Outstanding.*\\$${outstanding.toLocaleString()}/i`)).toBeVisible();

    // Verify completion percentage
    await expect(page.locator(`text=/${completionPercentage}% Complete/i`)).toBeVisible();
  });

  test('should show payment breakdown by category in summary', async ({ page }) => {
    await navigateToPayments(page);

    // Record payments
    for (const payment of testPayments) {
      await page.click('button:has-text("Record Payment")');
      await page.selectOption('select[name="snapshotId"]', { index: 0 });
      await fillPaymentForm(page, payment);
      await page.click('button[type="submit"]');
      await expect(page.locator('text=/Payment recorded successfully/i')).toBeVisible();
    }

    // Navigate to analytics
    await page.click('a[href="/tracking/analytics"]');

    // Verify category breakdown section exists
    await expect(page.locator('text=/Payment Distribution/i')).toBeVisible();

    // Verify each category appears with amount
    await expect(page.locator('text=/Al-Fuqara.*\\$1,000/i')).toBeVisible(); // fakir
    await expect(page.locator('text=/Al-Masakin.*\\$1,500/i')).toBeVisible(); // miskin
    await expect(page.locator('text=/Fi Sabilillah.*\\$750/i')).toBeVisible(); // fisabilillah
  });

  test('should validate payment amount against Zakat due', async ({ page }) => {
    await navigateToPayments(page);
    await page.click('button:has-text("Record Payment")');
    await page.selectOption('select[name="snapshotId"]', { index: 0 });

    // Try to record payment exceeding Zakat amount
    const excessiveAmount = testSnapshot.zakatAmount + 1000;
    await page.fill('input[name="amount"]', excessiveAmount.toString());
    await page.fill('input[name="paymentDate"]', '2024-07-01');
    await page.fill('input[name="recipientName"]', 'Test Recipient');
    await page.selectOption('select[name="recipientType"]', 'individual');
    await page.selectOption('select[name="recipientCategory"]', 'fakir');
    await page.fill('textarea[name="notes"]', 'Test');
    await page.selectOption('select[name="paymentMethod"]', 'cash');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify warning message (not error, but warning about exceeding)
    await expect(page.locator('text=/exceeds.*Zakat amount/i')).toBeVisible();
  });

  test('should edit a payment record', async ({ page }) => {
    await navigateToPayments(page);

    // Record a payment
    await page.click('button:has-text("Record Payment")');
    await page.selectOption('select[name="snapshotId"]', { index: 0 });
    await fillPaymentForm(page, testPayments[0]);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/Payment recorded successfully/i')).toBeVisible();

    // Click edit button on payment card
    await page.click('.payment-card:first-child button:has-text("Edit")');

    // Update amount
    const newAmount = 1200;
    await page.fill('input[name="amount"]', newAmount.toString());

    // Update notes
    const newNotes = 'Updated payment notes';
    await page.fill('textarea[name="notes"]', newNotes);

    // Save changes
    await page.click('button:has-text("Save Changes")');

    // Verify success message
    await expect(page.locator('text=/Payment updated successfully/i')).toBeVisible();

    // Verify updated values
    await expect(page.locator(`text=/\\$${newAmount.toLocaleString()}/`)).toBeVisible();
  });

  test('should delete a payment record', async ({ page }) => {
    await navigateToPayments(page);

    // Record a payment
    await page.click('button:has-text("Record Payment")');
    await page.selectOption('select[name="snapshotId"]', { index: 0 });
    await fillPaymentForm(page, testPayments[0]);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/Payment recorded successfully/i')).toBeVisible();

    // Click delete button
    await page.click('.payment-card:first-child button:has-text("Delete")');

    // Confirm deletion
    await page.click('button:has-text("Confirm Delete")');

    // Verify success message
    await expect(page.locator('text=/Payment deleted successfully/i')).toBeVisible();

    // Verify payment no longer in list
    await expect(page.locator(`text=/${testPayments[0].recipientName}/`)).not.toBeVisible();
  });

  test('should display payment history with dates', async ({ page }) => {
    await navigateToPayments(page);

    // Record payments on different dates
    for (const payment of testPayments) {
      await page.click('button:has-text("Record Payment")');
      await page.selectOption('select[name="snapshotId"]', { index: 0 });
      await fillPaymentForm(page, payment);
      await page.click('button[type="submit"]');
      await expect(page.locator('text=/Payment recorded successfully/i')).toBeVisible();
    }

    // Verify dates are displayed correctly
    await expect(page.locator('text=/Jul.*2024/i')).toBeVisible();
    await expect(page.locator('text=/Aug.*2024/i')).toBeVisible();
    await expect(page.locator('text=/Sep.*2024/i')).toBeVisible();

    // Verify payments are sorted by date (newest first)
    const paymentCards = page.locator('.payment-card');
    const firstCard = paymentCards.nth(0);
    await expect(firstCard.locator('text=/Sep.*2024/i')).toBeVisible();
  });

  test('should support receipt reference for payments', async ({ page }) => {
    await navigateToPayments(page);
    await page.click('button:has-text("Record Payment")');
    await page.selectOption('select[name="snapshotId"]', { index: 0 });

    // Fill form with receipt reference
    await fillPaymentForm(page, testPayments[0]);
    const receiptRef = 'RCPT-2024-001';
    await page.fill('input[name="receiptReference"]', receiptRef);

    await page.click('button[type="submit"]');
    await expect(page.locator('text=/Payment recorded successfully/i')).toBeVisible();

    // Verify receipt reference is displayed
    await expect(page.locator(`text=/${receiptRef}/`)).toBeVisible();
  });

  test('should display Islamic category names correctly', async ({ page }) => {
    await navigateToPayments(page);
    await page.click('button:has-text("Record Payment")');

    // Check that Islamic category names are displayed in dropdown
    const categorySelect = page.locator('select[name="recipientCategory"]');
    await expect(categorySelect.locator('option:has-text("Al-Fuqara")')).toBeVisible();
    await expect(categorySelect.locator('option:has-text("Al-Masakin")')).toBeVisible();
    await expect(categorySelect.locator('option:has-text("Fi Sabilillah")')).toBeVisible();
  });
});
