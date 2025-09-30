/**
 * Accessibility Compliance Testing (WCAG 2.1 AA)
 * 
 * Constitutional Principles:
 * - User-Centric Design: Ensure application is accessible to all users
 * - Lovable UI/UX: Beautiful and inclusive user experiences
 * - Quality & Reliability: Comprehensive accessibility validation
 */

import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Test configuration for accessibility
const WCAG_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21aa',
  'best-practice'
];

const ACCESSIBILITY_STANDARDS = {
  violations: 0, // Zero tolerance for accessibility violations
  incomplete: 5, // Allow some incomplete checks that need manual review
  passes: 50 // Minimum number of successful accessibility checks
};

test.describe('Accessibility Compliance Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Set up authentication for protected pages
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test.describe('Public Pages Accessibility', () => {
    test('Landing page should be fully accessible', async () => {
      await page.goto('/');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
      expect(accessibilityScanResults.passes.length).toBeGreaterThanOrEqual(
        ACCESSIBILITY_STANDARDS.passes
      );
    });

    test('Login page should be fully accessible', async () => {
      await page.goto('/login');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
      
      // Verify specific login accessibility features
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-label');
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('aria-label');
      await expect(page.locator('[data-testid="login-button"]')).toHaveAttribute('aria-describedby');
    });

    test('Registration page should be fully accessible', async () => {
      await page.goto('/register');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
      
      // Verify form accessibility
      const emailInput = page.locator('[data-testid="email-input"]');
      const passwordInput = page.locator('[data-testid="password-input"]');
      const confirmPasswordInput = page.locator('[data-testid="confirm-password-input"]');
      
      await expect(emailInput).toHaveAttribute('aria-required', 'true');
      await expect(passwordInput).toHaveAttribute('aria-required', 'true');
      await expect(confirmPasswordInput).toHaveAttribute('aria-required', 'true');
    });
  });

  test.describe('Dashboard and Navigation Accessibility', () => {
    test('Dashboard should be fully accessible', async () => {
      await page.goto('/dashboard');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
      
      // Verify navigation accessibility
      const mainNav = page.locator('[role="navigation"]').first();
      await expect(mainNav).toHaveAttribute('aria-label');
      
      // Verify skip links
      const skipLink = page.locator('a[href="#main-content"]');
      await expect(skipLink).toBeVisible();
    });

    test('Navigation menu should be keyboard accessible', async () => {
      await page.goto('/dashboard');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab'); // Should focus skip link
      await page.keyboard.press('Tab'); // Should focus first nav item
      
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement).toHaveAttribute('role', 'menuitem');
      
      // Test arrow key navigation
      await page.keyboard.press('ArrowDown');
      const nextFocusedElement = await page.locator(':focus');
      expect(await nextFocusedElement.getAttribute('role')).toBe('menuitem');
    });

    test('Breadcrumb navigation should be accessible', async () => {
      await page.goto('/assets');
      
      const breadcrumbs = page.locator('[aria-label="Breadcrumb"]');
      await expect(breadcrumbs).toBeVisible();
      
      const breadcrumbItems = page.locator('[aria-current="page"]');
      await expect(breadcrumbItems).toBeVisible();
    });
  });

  test.describe('Asset Management Accessibility', () => {
    test('Asset list should be accessible with screen readers', async () => {
      await page.goto('/assets');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
      
      // Verify table accessibility
      const assetTable = page.locator('[role="table"]');
      await expect(assetTable).toHaveAttribute('aria-label');
      
      const tableHeaders = page.locator('th[scope="col"]');
      expect(await tableHeaders.count()).toBeGreaterThan(0);
      
      // Verify sortable columns
      const sortableHeaders = page.locator('th[aria-sort]');
      expect(await sortableHeaders.count()).toBeGreaterThan(0);
    });

    test('Asset creation form should be fully accessible', async () => {
      await page.goto('/assets/new');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
      
      // Verify form field accessibility
      const nameInput = page.locator('[data-testid="asset-name-input"]');
      const categorySelect = page.locator('[data-testid="asset-category-select"]');
      const valueInput = page.locator('[data-testid="asset-value-input"]');
      
      await expect(nameInput).toHaveAttribute('aria-required', 'true');
      await expect(categorySelect).toHaveAttribute('aria-required', 'true');
      await expect(valueInput).toHaveAttribute('aria-required', 'true');
      
      // Verify form labels are properly associated
      await expect(nameInput).toHaveAttribute('aria-labelledby');
      await expect(categorySelect).toHaveAttribute('aria-labelledby');
      await expect(valueInput).toHaveAttribute('aria-labelledby');
    });

    test('Asset validation errors should be accessible', async () => {
      await page.goto('/assets/new');
      
      // Submit form without required fields to trigger validation
      await page.click('[data-testid="submit-button"]');
      
      // Wait for error messages
      await page.waitForSelector('[role="alert"]');
      
      const errorMessages = page.locator('[role="alert"]');
      expect(await errorMessages.count()).toBeGreaterThan(0);
      
      // Verify errors are announced to screen readers
      const firstError = errorMessages.first();
      await expect(firstError).toHaveAttribute('aria-live', 'assertive');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Zakat Calculation Accessibility', () => {
    test('Zakat calculator should be accessible', async () => {
      await page.goto('/zakat/calculate');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
      
      // Verify methodology selection is accessible
      const methodologyRadios = page.locator('[name="methodology"]');
      expect(await methodologyRadios.count()).toBeGreaterThan(0);
      
      for (let i = 0; i < await methodologyRadios.count(); i++) {
        const radio = methodologyRadios.nth(i);
        await expect(radio).toHaveAttribute('aria-describedby');
      }
    });

    test('Zakat results should be accessible', async () => {
      await page.goto('/zakat/calculate');
      
      // Fill in calculation form
      await page.selectOption('[data-testid="methodology-select"]', 'hanafi');
      await page.click('[data-testid="calculate-button"]');
      
      // Wait for results
      await page.waitForSelector('[data-testid="zakat-results"]');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
      
      // Verify results are properly labeled and announced
      const zakatAmount = page.locator('[data-testid="zakat-amount"]');
      await expect(zakatAmount).toHaveAttribute('aria-label');
      
      const resultsRegion = page.locator('[data-testid="zakat-results"]');
      await expect(resultsRegion).toHaveAttribute('role', 'region');
      await expect(resultsRegion).toHaveAttribute('aria-label');
    });

    test('Educational content should be accessible', async () => {
      await page.goto('/education');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
      
      // Verify heading hierarchy
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingTexts = await headings.allTextContents();
      
      // Should have proper heading structure
      expect(await page.locator('h1').count()).toBe(1);
      expect(await page.locator('h2').count()).toBeGreaterThan(0);
      
      // Verify Islamic content is properly structured
      const arabicText = page.locator('[lang="ar"]');
      if (await arabicText.count() > 0) {
        await expect(arabicText.first()).toHaveAttribute('dir', 'rtl');
      }
    });
  });

  test.describe('Forms and Interactive Elements', () => {
    test('All interactive elements should be keyboard accessible', async () => {
      await page.goto('/dashboard');
      
      // Get all interactive elements
      const interactiveElements = page.locator(
        'button, [role="button"], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const count = await interactiveElements.count();
      expect(count).toBeGreaterThan(0);
      
      // Test that all elements can receive focus
      for (let i = 0; i < Math.min(count, 20); i++) { // Test first 20 elements
        const element = interactiveElements.nth(i);
        await element.focus();
        
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeTruthy();
      }
    });

    test('Form validation should be accessible', async () => {
      await page.goto('/assets/new');
      
      // Test client-side validation
      const valueInput = page.locator('[data-testid="asset-value-input"]');
      await valueInput.fill('invalid-number');
      await valueInput.blur();
      
      // Should show validation message
      const validationMessage = page.locator('[data-testid="value-error"]');
      await expect(validationMessage).toBeVisible();
      await expect(validationMessage).toHaveAttribute('role', 'alert');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('Modal dialogs should be accessible', async () => {
      await page.goto('/assets');
      
      // Open delete confirmation modal
      await page.click('[data-testid="delete-asset-button"]');
      await page.waitForSelector('[role="dialog"]');
      
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      await expect(modal).toHaveAttribute('aria-labelledby');
      await expect(modal).toHaveAttribute('aria-describedby');
      
      // Verify focus is trapped in modal
      const firstFocusableElement = modal.locator('button').first();
      await expect(firstFocusableElement).toBeFocused();
      
      // Test escape key closes modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Color and Contrast Accessibility', () => {
    test('Should meet WCAG AA color contrast requirements', async () => {
      await page.goto('/dashboard');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa', 'color-contrast'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('Should not rely solely on color for information', async () => {
      await page.goto('/zakat/calculate');
      
      // Fill in form to trigger validation
      await page.click('[data-testid="calculate-button"]');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a'])
        .include('.error')
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
      
      // Verify error states use more than just color
      const errorElements = page.locator('.error, [aria-invalid="true"]');
      if (await errorElements.count() > 0) {
        // Should have text indicators, icons, or other non-color indicators
        const firstError = errorElements.first();
        const hasTextIndicator = await firstError.locator('.error-text').count() > 0;
        const hasIcon = await firstError.locator('.error-icon').count() > 0;
        const hasAriaLabel = await firstError.getAttribute('aria-label') !== null;
        
        expect(hasTextIndicator || hasIcon || hasAriaLabel).toBe(true);
      }
    });
  });

  test.describe('Screen Reader Compatibility', () => {
    test('Should provide proper landmarks and regions', async () => {
      await page.goto('/dashboard');
      
      // Verify main landmarks exist
      const mainLandmark = page.locator('main, [role="main"]');
      await expect(mainLandmark).toBeVisible();
      
      const navigation = page.locator('nav, [role="navigation"]');
      await expect(navigation).toBeVisible();
      
      const banner = page.locator('header, [role="banner"]');
      await expect(banner).toBeVisible();
      
      const contentInfo = page.locator('footer, [role="contentinfo"]');
      await expect(contentInfo).toBeVisible();
    });

    test('Should have descriptive page titles', async () => {
      const pages = [
        { url: '/', expectedTitle: /ZakApp.*Home/i },
        { url: '/dashboard', expectedTitle: /Dashboard.*ZakApp/i },
        { url: '/assets', expectedTitle: /Assets.*ZakApp/i },
        { url: '/zakat/calculate', expectedTitle: /Calculate Zakat.*ZakApp/i }
      ];
      
      for (const { url, expectedTitle } of pages) {
        await page.goto(url);
        await expect(page).toHaveTitle(expectedTitle);
      }
    });

    test('Should provide status announcements for dynamic content', async () => {
      await page.goto('/zakat/calculate');
      
      // Fill and submit calculation
      await page.selectOption('[data-testid="methodology-select"]', 'hanafi');
      await page.click('[data-testid="calculate-button"]');
      
      // Wait for calculation to complete
      await page.waitForSelector('[data-testid="calculation-complete"]');
      
      // Verify status announcement
      const statusAnnouncement = page.locator('[aria-live="polite"], [aria-live="assertive"]');
      expect(await statusAnnouncement.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('Should be accessible on mobile devices', async ({ browser }) => {
      const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 667 }, // iPhone SE size
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      });
      
      const mobilePage = await mobileContext.newPage();
      await mobilePage.goto('/dashboard');
      
      const accessibilityScanResults = await new AxeBuilder({ page: mobilePage })
        .withTags(WCAG_TAGS)
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
      
      // Verify touch targets are accessible
      const touchTargets = mobilePage.locator('button, [role="button"], a');
      const touchTargetCount = await touchTargets.count();
      
      for (let i = 0; i < Math.min(touchTargetCount, 10); i++) {
        const target = touchTargets.nth(i);
        const boundingBox = await target.boundingBox();
        
        if (boundingBox) {
          // WCAG 2.1 AA requires minimum 44x44 pixels for touch targets
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
      }
      
      await mobileContext.close();
    });

    test('Should handle orientation changes gracefully', async ({ browser }) => {
      const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 667 }
      });
      
      const mobilePage = await mobileContext.newPage();
      await mobilePage.goto('/dashboard');
      
      // Test portrait orientation
      let accessibilityScanResults = await new AxeBuilder({ page: mobilePage })
        .withTags(WCAG_TAGS)
        .analyze();
      expect(accessibilityScanResults.violations).toEqual([]);
      
      // Change to landscape orientation
      await mobilePage.setViewportSize({ width: 667, height: 375 });
      await mobilePage.waitForTimeout(500); // Allow for layout adjustment
      
      // Test landscape orientation
      accessibilityScanResults = await new AxeBuilder({ page: mobilePage })
        .withTags(WCAG_TAGS)
        .analyze();
      expect(accessibilityScanResults.violations).toEqual([]);
      
      await mobileContext.close();
    });
  });

  test.describe('Islamic Content Accessibility', () => {
    test('Arabic text should be properly configured for screen readers', async () => {
      await page.goto('/education');
      
      const arabicElements = page.locator('[lang="ar"]');
      
      if (await arabicElements.count() > 0) {
        for (let i = 0; i < await arabicElements.count(); i++) {
          const element = arabicElements.nth(i);
          
          // Verify RTL direction
          await expect(element).toHaveAttribute('dir', 'rtl');
          
          // Verify language is specified
          await expect(element).toHaveAttribute('lang', 'ar');
        }
      }
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('Zakat methodology descriptions should be accessible', async () => {
      await page.goto('/education/methodologies');
      
      const methodologyCards = page.locator('[data-testid="methodology-card"]');
      expect(await methodologyCards.count()).toBeGreaterThan(0);
      
      for (let i = 0; i < await methodologyCards.count(); i++) {
        const card = methodologyCards.nth(i);
        
        // Each methodology should have proper headings and descriptions
        const heading = card.locator('h3');
        await expect(heading).toBeVisible();
        
        const description = card.locator('[data-testid="methodology-description"]');
        await expect(description).toBeVisible();
        
        // Should have proper ARIA labels for complex content
        await expect(card).toHaveAttribute('role', 'article');
      }
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Performance and Accessibility Integration', () => {
    test('Should maintain accessibility during loading states', async () => {
      await page.goto('/assets');
      
      // Trigger a loading state
      await page.click('[data-testid="refresh-assets-button"]');
      
      // Verify loading indicator is accessible
      const loadingIndicator = page.locator('[data-testid="loading-spinner"]');
      await expect(loadingIndicator).toHaveAttribute('role', 'status');
      await expect(loadingIndicator).toHaveAttribute('aria-label');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('Should announce important state changes', async () => {
      await page.goto('/assets/new');
      
      // Fill form and submit
      await page.fill('[data-testid="asset-name-input"]', 'Test Asset');
      await page.selectOption('[data-testid="asset-category-select"]', 'cash');
      await page.fill('[data-testid="asset-value-input"]', '1000');
      await page.click('[data-testid="submit-button"]');
      
      // Verify success message is announced
      await page.waitForSelector('[data-testid="success-message"]');
      const successMessage = page.locator('[data-testid="success-message"]');
      
      await expect(successMessage).toHaveAttribute('role', 'alert');
      await expect(successMessage).toHaveAttribute('aria-live', 'assertive');
    });
  });

  test.afterEach(async () => {
    // Generate accessibility report for each test
    const testInfo = test.info();
    if (testInfo.status === 'failed') {
      // Take screenshot for failed accessibility tests
      await page.screenshot({
        path: `accessibility-failures/${testInfo.title}.png`,
        fullPage: true
      });
    }
  });
});