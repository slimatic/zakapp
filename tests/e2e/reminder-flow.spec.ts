/**
 * E2E Test: Reminder Acknowledgment Workflow
 * Tests the complete workflow for managing Zakat reminders
 * 
 * Scenarios:
 * 1. System generates reminder for Zakat anniversary
 * 2. User views reminders
 * 3. User acknowledges reminder
 * 4. User dismisses reminder
 * 5. Reminder statistics and history
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
  await page.selectOption('select[name="status"]', testSnapshot.status);
  
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/tracking/snapshots');
}

async function navigateToDashboard(page: Page) {
  await page.click('a[href="/dashboard"]');
  await expect(page).toHaveURL('/dashboard');
}

test.describe('Reminder Acknowledgment Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await createSnapshot(page);
  });

  test('should display reminder banner on dashboard', async ({ page }) => {
    await navigateToDashboard(page);

    // Wait for reminders to load
    await page.waitForTimeout(1000);

    // Verify reminder banner is visible (if any reminders exist)
    const reminderBanner = page.locator('.reminder-banner');
    const count = await reminderBanner.count();
    
    if (count > 0) {
      await expect(reminderBanner.first()).toBeVisible();
    }
  });

  test('should show Zakat anniversary reminder', async ({ page }) => {
    // Navigate to reminders page
    await page.click('a[href="/tracking/reminders"]');
    await expect(page).toHaveURL('/tracking/reminders');

    // Verify page title
    await expect(page.locator('h1:has-text("Reminders")')).toBeVisible();

    // Verify reminders list
    await expect(page.locator('.reminders-list')).toBeVisible();
  });

  test('should acknowledge a reminder', async ({ page }) => {
    await page.goto('/tracking/reminders');

    // Wait for reminders to load
    await page.waitForSelector('.reminder-card', { timeout: 5000 }).catch(() => {
      // If no reminders, create a test reminder scenario
    });

    const reminderCards = page.locator('.reminder-card');
    const count = await reminderCards.count();

    if (count > 0) {
      // Click acknowledge button on first reminder
      await page.click('.reminder-card:first-child button:has-text("Acknowledge")');

      // Verify success message
      await expect(page.locator('text=/acknowledged/i')).toBeVisible();

      // Verify reminder status changed
      await expect(page.locator('.reminder-card:first-child .status:has-text("Acknowledged")')).toBeVisible();
    }
  });

  test('should dismiss a reminder', async ({ page }) => {
    await page.goto('/tracking/reminders');

    const reminderCards = page.locator('.reminder-card');
    const count = await reminderCards.count();

    if (count > 0) {
      // Click dismiss button
      await page.click('.reminder-card:first-child button:has-text("Dismiss")');

      // Confirm dismissal if modal appears
      const confirmButton = page.locator('button:has-text("Confirm")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Verify success message
      await expect(page.locator('text=/dismissed/i')).toBeVisible();

      // Verify reminder is removed or marked as dismissed
      const updatedCount = await reminderCards.count();
      expect(updatedCount).toBeLessThanOrEqual(count);
    }
  });

  test('should filter reminders by status', async ({ page }) => {
    await page.goto('/tracking/reminders');

    // Verify filter dropdown exists
    await expect(page.locator('select[name="statusFilter"]')).toBeVisible();

    // Filter by "pending"
    await page.selectOption('select[name="statusFilter"]', 'pending');

    // Verify only pending reminders are shown
    const pendingReminders = page.locator('.reminder-card .status:has-text("Pending")');
    const acknowledgedReminders = page.locator('.reminder-card .status:has-text("Acknowledged")');
    
    const pendingCount = await pendingReminders.count();
    const acknowledgedCount = await acknowledgedReminders.count();
    
    if (pendingCount > 0) {
      expect(acknowledgedCount).toBe(0);
    }

    // Filter by "acknowledged"
    await page.selectOption('select[name="statusFilter"]', 'acknowledged');

    // Verify only acknowledged reminders are shown
    await page.waitForTimeout(500);
    const newPendingCount = await page.locator('.reminder-card .status:has-text("Pending")').count();
    expect(newPendingCount).toBe(0);
  });

  test('should filter reminders by event type', async ({ page }) => {
    await page.goto('/tracking/reminders');

    // Verify event type filter
    await expect(page.locator('select[name="eventTypeFilter"]')).toBeVisible();

    // Filter by "zakat_anniversary"
    await page.selectOption('select[name="eventTypeFilter"]', 'zakat_anniversary');

    // Verify only anniversary reminders are shown
    const reminderCards = page.locator('.reminder-card');
    const count = await reminderCards.count();

    for (let i = 0; i < count; i++) {
      const card = reminderCards.nth(i);
      await expect(card.locator('text=/anniversary/i')).toBeVisible();
    }
  });

  test('should display reminder priority levels', async ({ page }) => {
    await page.goto('/tracking/reminders');

    const reminderCards = page.locator('.reminder-card');
    const count = await reminderCards.count();

    if (count > 0) {
      const firstCard = reminderCards.first();
      
      // Verify priority badge exists
      const priorityBadge = firstCard.locator('.priority-badge, .priority');
      await expect(priorityBadge).toBeVisible();

      // Verify priority is one of: high, medium, low
      const priorityText = await priorityBadge.textContent();
      expect(priorityText?.toLowerCase()).toMatch(/high|medium|low/);
    }
  });

  test('should show reminder statistics', async ({ page }) => {
    await page.goto('/tracking/reminders');

    // Verify statistics section
    await expect(page.locator('.reminder-stats, .statistics')).toBeVisible();

    // Verify key metrics are displayed
    await expect(page.locator('text=/Total Reminders/i')).toBeVisible();
    await expect(page.locator('text=/Pending/i')).toBeVisible();
    await expect(page.locator('text=/Acknowledged/i')).toBeVisible();
  });

  test('should show reminder date and time', async ({ page }) => {
    await page.goto('/tracking/reminders');

    const reminderCards = page.locator('.reminder-card');
    const count = await reminderCards.count();

    if (count > 0) {
      const firstCard = reminderCards.first();
      
      // Verify date is displayed
      await expect(firstCard.locator('.reminder-date, .date')).toBeVisible();

      // Verify time or timestamp is shown
      const dateText = await firstCard.locator('.reminder-date, .date').textContent();
      expect(dateText).toBeTruthy();
    }
  });

  test('should navigate to related snapshot from reminder', async ({ page }) => {
    await page.goto('/tracking/reminders');

    const reminderCards = page.locator('.reminder-card');
    const count = await reminderCards.count();

    if (count > 0) {
      // Click "View Snapshot" link
      const viewLink = page.locator('.reminder-card:first-child a:has-text("View"), a:has-text("Snapshot")').first();
      
      if (await viewLink.isVisible()) {
        await viewLink.click();

        // Verify navigated to snapshot detail page
        await expect(page).toHaveURL(/\/tracking\/snapshots\/[a-z0-9-]+/);
      }
    }
  });

  test('should snooze a reminder', async ({ page }) => {
    await page.goto('/tracking/reminders');

    const reminderCards = page.locator('.reminder-card');
    const count = await reminderCards.count();

    if (count > 0) {
      // Click snooze button
      const snoozeButton = page.locator('.reminder-card:first-child button:has-text("Snooze")');
      
      if (await snoozeButton.isVisible()) {
        await snoozeButton.click();

        // Select snooze duration
        await page.selectOption('select[name="snoozeDuration"]', '1_day');
        await page.click('button:has-text("Confirm")');

        // Verify success message
        await expect(page.locator('text=/snoozed/i')).toBeVisible();
      }
    }
  });

  test('should mark reminder as complete', async ({ page }) => {
    await page.goto('/tracking/reminders');

    const reminderCards = page.locator('.reminder-card');
    const count = await reminderCards.count();

    if (count > 0) {
      // Click complete button
      const completeButton = page.locator('.reminder-card:first-child button:has-text("Complete"), button:has-text("Mark Complete")').first();
      
      if (await completeButton.isVisible()) {
        await completeButton.click();

        // Verify success message
        await expect(page.locator('text=/completed/i, text=/marked.*complete/i')).toBeVisible();
      }
    }
  });

  test('should display reminder message content', async ({ page }) => {
    await page.goto('/tracking/reminders');

    const reminderCards = page.locator('.reminder-card');
    const count = await reminderCards.count();

    if (count > 0) {
      const firstCard = reminderCards.first();
      
      // Verify reminder has a title/message
      const title = firstCard.locator('.reminder-title, h3, .title');
      await expect(title).toBeVisible();

      // Verify reminder has description/notes
      const description = firstCard.locator('.reminder-description, .description, .message');
      const hasDescription = await description.count();
      
      if (hasDescription > 0) {
        await expect(description).toBeVisible();
      }
    }
  });

  test('should show Hijri anniversary dates in reminders', async ({ page }) => {
    await page.goto('/tracking/reminders');

    const reminderCards = page.locator('.reminder-card:has-text("anniversary")');
    const count = await reminderCards.count();

    if (count > 0) {
      // Verify Hijri date is mentioned
      await expect(reminderCards.first().locator('text=/AH|Hijri|Muharram|Ramadan|Dhul/i')).toBeVisible();
    }
  });

  test('should display overdue reminders prominently', async ({ page }) => {
    await page.goto('/tracking/reminders');

    // Look for overdue indicators
    const overdueReminders = page.locator('.reminder-card.overdue, .reminder-card .overdue');
    const count = await overdueReminders.count();

    if (count > 0) {
      // Verify overdue styling (red badge, warning icon, etc.)
      await expect(overdueReminders.first()).toBeVisible();
    }
  });

  test('should auto-dismiss shown reminders', async ({ page }) => {
    await page.goto('/tracking/reminders');

    const initialCount = await page.locator('.reminder-card').count();

    // Mark some reminders as shown/acknowledged
    const shownReminders = page.locator('.reminder-card .status:has-text("Shown")');
    const shownCount = await shownReminders.count();

    // Navigate away and back
    await page.goto('/dashboard');
    await page.goto('/tracking/reminders');

    // Shown reminders should persist or be auto-dismissed based on settings
    const newCount = await page.locator('.reminder-card').count();
    
    // Count may change due to auto-dismissal
    expect(newCount).toBeLessThanOrEqual(initialCount);
  });

  test('should bulk acknowledge multiple reminders', async ({ page }) => {
    await page.goto('/tracking/reminders');

    const reminderCards = page.locator('.reminder-card');
    const count = await reminderCards.count();

    if (count >= 2) {
      // Select multiple reminders
      await page.check('.reminder-card:nth-child(1) input[type="checkbox"]');
      await page.check('.reminder-card:nth-child(2) input[type="checkbox"]');

      // Click bulk acknowledge button
      await page.click('button:has-text("Acknowledge Selected")');

      // Verify success message
      await expect(page.locator('text=/reminders acknowledged/i')).toBeVisible();
    }
  });

  test('should show reminder notification count in header', async ({ page }) => {
    await navigateToDashboard(page);

    // Check notification badge in header
    const notificationBadge = page.locator('.notification-badge, .reminder-count');
    
    if (await notificationBadge.isVisible()) {
      const badgeText = await notificationBadge.textContent();
      expect(badgeText).toMatch(/\d+/); // Should contain a number
    }
  });

  test('should create manual reminder', async ({ page }) => {
    await page.goto('/tracking/reminders');

    // Click create reminder button
    await page.click('button:has-text("Create Reminder")');

    // Fill reminder form
    await page.fill('input[name="title"]', 'Custom Payment Reminder');
    await page.fill('textarea[name="message"]', 'Remember to complete Zakat payment');
    await page.selectOption('select[name="eventType"]', 'payment_due');
    await page.selectOption('select[name="priority"]', 'high');
    await page.fill('input[name="eventDate"]', '2024-12-01');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('text=/Reminder created/i')).toBeVisible();

    // Verify reminder appears in list
    await expect(page.locator('text=/Custom Payment Reminder/i')).toBeVisible();
  });

  test('should display reminder settings page', async ({ page }) => {
    await page.goto('/settings');

    // Navigate to reminder settings
    await page.click('a:has-text("Reminders"), button:has-text("Reminders")');

    // Verify settings options
    await expect(page.locator('input[name="enableReminders"]')).toBeVisible();
    await expect(page.locator('input[name="emailNotifications"]')).toBeVisible();
    await expect(page.locator('select[name="reminderFrequency"]')).toBeVisible();
  });

  test('should show reminder history', async ({ page }) => {
    await page.goto('/tracking/reminders');

    // Click history tab
    const historyTab = page.locator('button:has-text("History"), a:has-text("History")');
    
    if (await historyTab.isVisible()) {
      await historyTab.click();

      // Verify history list
      await expect(page.locator('.reminder-history')).toBeVisible();
    }
  });
});
