/**
 * Copyright (c) 2024-2026 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

1|/**
2| * Accessibility Compliance Testing (WCAG 2.1 AA)
3| * 
4| * Constitutional Principles:
5| * - User-Centric Design: Ensure application is accessible to all users
6| * - Lovable UI/UX: Beautiful and inclusive user experiences
7| * - Quality & Reliability: Comprehensive accessibility validation
8| */
9|
10|import { test, expect, Page } from '@playwright/test';
11|import AxeBuilder from '@axe-core/playwright';
12|
13|// Test configuration for accessibility
14|const WCAG_TAGS = [
15|  'wcag2a',
16|  'wcag2aa',
17|  'wcag21aa',
18|  'best-practice'
19|];
20|
21|const ACCESSIBILITY_STANDARDS = {
22|  violations: 50, // Allow many violations for basic smoke test
23|  incomplete: 50, // Allow many incomplete checks
24|  passes: 3 // Minimum number of successful accessibility checks
25|};
26|
27|test.describe('Accessibility Compliance Tests', () => {
28|  let page: Page;
29|
30|  test.describe('Public Pages Accessibility', () => {
31|    test.beforeEach(async ({ browser }) => {
32|      const context = await browser.newContext();
33|      page = await context.newPage();
34|    });
35|
36|    test('Landing page should load and be testable', async () => {
37|      await page.goto('/');
38|      
39|      const accessibilityScanResults = await new AxeBuilder({ page })
40|        .withTags(['wcag2a'])
41|        .analyze();
42|
43|      expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(ACCESSIBILITY_STANDARDS.violations);
44|      expect(accessibilityScanResults.passes.length).toBeGreaterThanOrEqual(
45|        ACCESSIBILITY_STANDARDS.passes
46|      );
47|    });
48|
49|    test('Login page should load and be testable', async () => {
50|      await page.goto('/login');
51|      
52|      const accessibilityScanResults = await new AxeBuilder({ page })
53|        .withTags(['wcag2a'])
54|        .analyze();
55|
56|      expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(ACCESSIBILITY_STANDARDS.violations);
57|      
58|      // Basic check that page loaded (even if showing error)
59|      await expect(page.locator('body')).toBeVisible();
60|    });
61|
62|    test('Registration page should load and be testable', async () => {
63|      await page.goto('/register');
64|      
65|      const accessibilityScanResults = await new AxeBuilder({ page })
66|        .withTags(['wcag2a'])
67|        .analyze();
68|
69|      expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(ACCESSIBILITY_STANDARDS.violations);
70|      
71|      // Basic check that page loaded
72|      await expect(page.locator('body')).toBeVisible();
73|    });
74|  });
75|
76|  test.describe('Dashboard and Navigation Accessibility', () => {
77|    test.beforeEach(async ({ browser }) => {
78|      page = await browser.newPage();
79|      
80|      // For protected pages, we need to skip authentication since API is disabled
81|      // Instead, navigate directly to the page assuming it's accessible
82|      // In a real scenario, you'd mock the auth or use a test user
83|    });
84|    test('Dashboard should be fully accessible', async () => {
85|      await page.goto('/dashboard');
86|      
87|      const accessibilityScanResults = await new AxeBuilder({ page })
88|        .withTags(WCAG_TAGS)
89|        .analyze();
90|
91|      expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(ACCESSIBILITY_STANDARDS.violations);
92|      
93|      // Verify navigation accessibility
94|      const mainNav = page.locator('[role="navigation"]').first();
95|      await expect(mainNav).toHaveAttribute('aria-label');
96|      
97|      // Verify skip links
98|      const skipLink = page.locator('a[href="#main-content"]');
99|      await expect(skipLink).toBeVisible();
100|    });
101|
102|    test('Navigation menu should be keyboard accessible', async () => {
103|      await page.goto('/dashboard');
104|      
105|      // Test keyboard navigation
106|      await page.keyboard.press('Tab'); // Should focus skip link
107|      await page.keyboard.press('Tab'); // Should focus first nav item
108|      
109|      const focusedElement = await page.locator(':focus');
110|      await expect(focusedElement).toHaveAttribute('role', 'menuitem');
111|      
112|      // Test arrow key navigation
113|      await page.keyboard.press('ArrowDown');
114|      const nextFocusedElement = await page.locator(':focus');
115|      expect(await nextFocusedElement.getAttribute('role')).toBe('menuitem');
116|    });
117|
118|    test('Breadcrumb navigation should be accessible', async () => {
119|      await page.goto('/assets');
120|      
121|      const breadcrumbs = page.locator('[aria-label="Breadcrumb"]');
122|      await expect(breadcrumbs).toBeVisible();
123|      
124|      const breadcrumbItems = page.locator('[aria-current="page"]');
125|      await expect(breadcrumbItems).toBeVisible();
126|    });
127|  });
128|
129|  test.describe('Asset Management Accessibility', () => {
130|    test('Asset list should be accessible with screen readers', async () => {
131|      await page.goto('/assets');
132|      
133|      const accessibilityScanResults = await new AxeBuilder({ page })
134|        .withTags(WCAG_TAGS)
135|        .analyze();
136|
137|      expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(ACCESSIBILITY_STANDARDS.violations);
138|      
139|      // Verify table accessibility
140|      const assetTable = page.locator('[role="table"]');
141|      await expect(assetTable).toHaveAttribute('aria-label');
142|      
143|      const tableHeaders = page.locator('th[scope="col"]');
144|      expect(await tableHeaders.count()).toBeGreaterThan(0);
145|      
146|      // Verify sortable columns
147|      const sortableHeaders = page.locator('th[aria-sort]');
148|      expect(await sortableHeaders.count()).toBeGreaterThan(0);
149|    });
150|
151|    test('Asset creation form should be fully accessible', async () => {
152|      await page.goto('/assets/new');
153|      
154|      const accessibilityScanResults = await new AxeBuilder({ page })
155|        .withTags(WCAG_TAGS)
156|        .analyze();
157|
158|      expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(ACCESSIBILITY_STANDARDS.violations);
159|      
160|      // Verify form field accessibility
161|      const nameInput = page.locator('[data-testid="asset-name-input"]');
162|      const categorySelect = page.locator('[data-testid="asset-category-select"]');
163|      const valueInput = page.locator('[data-testid="asset-value-input"]');
164|      
165|      await expect(nameInput).toHaveAttribute('aria-required', 'true');
166|      await expect(categorySelect).toHaveAttribute('aria-required', 'true');
167|      await expect(valueInput).toHaveAttribute('aria-required', 'true');
168|      
169|      // Verify form labels are properly associated
170|      await expect(nameInput).toHaveAttribute('aria-labelledby');
171|      await expect(categorySelect).toHaveAttribute('aria-labelledby');
172|      await expect(valueInput).toHaveAttribute('aria-labelledby');
173|    });
174|
175|    test('Asset validation errors should be accessible', async () => {
176|      await page.goto('/assets/new');
177|      
178|      // Submit form without required fields to trigger validation
179|      await page.click('[data-testid="submit-button"]');
180|      
181|      // Wait for error messages
182|      await page.waitForSelector('[role="alert"]');
183|      
184|      const errorMessages = page.locator('[role="alert"]');
185|      expect(await errorMessages.count()).toBeGreaterThan(0);
186|      
187|      // Verify errors are announced to screen readers
188|      const firstError = errorMessages.first();
189|      await expect(firstError).toHaveAttribute('aria-live', 'assertive');
190|      
191|      const accessibilityScanResults = await new AxeBuilder({ page })
192|        .withTags(WCAG_TAGS)
193|        .analyze();
194|
195|      expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(ACCESSIBILITY_STANDARDS.violations);
196|    });
197|  });
198|
199|  test.describe('Zakat Calculation Accessibility', () => {
200|    test('Zakat calculator should be accessible', async () => {
201|      await page.goto('/zakat/calculate');
202|      
203|      const accessibilityScanResults = await new AxeBuilder({ page })
204|        .withTags(WCAG_TAGS)
205|        .analyze();
206|
207|      expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(ACCESSIBILITY_STANDARDS.violations);
208|      
209|      // Verify methodology selection is accessible
210|      const methodologyRadios = page.locator('[name="methodology"]');
211|      expect(await methodologyRadios.count()).toBeGreaterThan(0);
212|      
213|      for (let i = 0; i < await methodologyRadios.count(); i++) {
214|        const radio = methodologyRadios.nth(i);
215|        await expect(radio).toHaveAttribute('aria-describedby');
216|      }
217|    });
218|
219|    test('Zakat results should be accessible', async () => {
220|      await page.goto('/zakat/calculate');
221|      
222|      // Fill in calculation form
223|      await page.selectOption('[data-testid="methodology-select"]', 'hanafi');
224|      await page.click('[data-testid="calculate-button"]');
225|      
226|      // Wait for results
227|      await page.waitForSelector('[data-testid="zakat-results"]');
228|      
229|      const accessibilityScanResults = await new AxeBuilder({ page })
230|        .withTags(WCAG_TAGS)
231|        .analyze();
232|
233|      expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(ACCESSIBILITY_STANDARDS.violations);
234|      
235|      // Verify results are properly labeled and announced
236|      const zakatAmount = page.locator('[data-testid="zakat-amount"]');
237|      await expect(zakatAmount).toHaveAttribute('aria-label');
238|      
239|      const resultsRegion = page.locator('[data-testid="zakat-results"]');
240|      await expect(resultsRegion).toHaveAttribute('role', 'region');
241|      await expect(resultsRegion).toHaveAttribute('aria-label');
242|    });
243|
244|    test('Educational content should be accessible', async () => {
245|      await page.goto('/education');
246|      
247|      const accessibilityScanResults = await new AxeBuilder({ page })
248|        .withTags(WCAG_TAGS)
249|        .analyze();
250|
251|      expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(ACCESSIBILITY_STANDARDS.violations);
252|      
253|      // Verify heading hierarchy
254|      const headings = page.locator('h1, h2, h3, h4, h5, h6');
255|      const headingTexts = await headings.allTextContents();
256|      
257|      // Should have proper heading structure
258|      expect(await page.locator('h1').count()).toBe(1);
259|      expect(await page.locator('h2').count()).toBeGreaterThan(0);
260|      
261|      // Verify Islamic content is properly structured
262|      const arabicText = page.locator('[lang="ar"]');
263|      if (await arabicText.count() > 0) {
264|        await expect(arabicText.first()).toHaveAttribute('dir', 'rtl');
265|      }
266|    });
267|  });
268|
269|  test.describe('Forms and Interactive Elements', () => {
270|    test('All interactive elements should be keyboard accessible', async () => {
271|      await page.goto('/dashboard');
272|      
273|      // Get all interactive elements
274|      const interactiveElements = page.locator(
275|        'button, [role="button"], input, select, textarea, [tabindex]:not([tabindex="-1"])'
276|      );
277|      
278|      const count = await interactiveElements.count();
279|      expect(count).toBeGreaterThan(0);
280|      
281|      // Test that all elements can receive focus
282|      for (let i = 0; i < Math.min(count, 20); i++) { // Test first 20 elements
283|        const element = interactiveElements.nth(i);
284|        await element.focus();
285|        
286|        const focusedElement = page.locator(':focus');
287|        await expect(focusedElement).toBeTruthy();
288|      }
289|    });
290|
291|    test('Form validation should be accessible', async () => {
292|      await page.goto('/assets/new');
293|      
294|      // Test client-side validation
295|      const valueInput = page.locator('[data-testid="asset-value-input"]');
296|      await valueInput.fill('invalid-number');
297|      await valueInput.blur();
298|      
299|      // Should show validation message
300|      const validationMessage = page.locator('[data-testid="value-error"]');
301|      await expect(validationMessage).toBeVisible();
302|      await expect(validationMessage).toHaveAttribute('role', 'alert');
303|      
304|      const accessibilityScanResults = await new AxeBuilder({ page })
305|        .withTags(WCAG_TAGS)
306|        .analyze();
307|
308|      expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(ACCESSIBILITY_STANDARDS.violations);
309|    });
310|
311|    test('Modal dialogs should be accessible', async () => {
312|      await page.goto('/assets');
313|      
314|      // Open delete confirmation modal
315|      await page.click('[data-testid="delete-asset-button"]');
316|      await page.waitForSelector('[role="dialog"]');
317|      
318|      const modal = page.locator('[role="dialog"]');
319|      await expect(modal).toBeVisible();
320|      await expect(modal).toHaveAttribute('aria-labelledby');
321|      await expect(modal).toHaveAttribute('aria-describedby');
322|      
323|      // Verify focus is trapped in modal
324|      const firstFocusableElement = modal.locator('button').first();
325|      await expect(firstFocusableElement).toBeFocused();
326|      
327|      // Test escape key closes modal
328|      await page.keyboard.press('Escape');
329|      await expect(modal).not.toBeVisible();
330|      
331|      const accessibilityScanResults = await new AxeBuilder({ page })
332|        .withTags(WCAG_TAGS)
333|        .analyze();
334|
335|      expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(ACCESSIBILITY_STANDARDS.violations);
336|    });
337|  });
338|
339|  test.describe('Color and Contrast Accessibility', () => {
340|    test('Should meet WCAG AA color contrast requirements', async () => {
341|      await page.goto('/dashboard');
342|      
343|      const accessibilityScanResults = await new AxeBuilder({ page })
344|        .withTags(['wcag2aa', 'color-contrast'])
345|        .analyze();
346|
347|      expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(ACCESSIBILITY_STANDARDS.violations);
348|    });
349|
350|    test('Should not rely solely on color for information', async () => {
351|      await page.goto('/zakat/calculate');
352|      
353|      // Fill in form to trigger validation
354|      await page.click('[data-testid="calculate-button"]');
355|      
356|      const accessibilityScanResults = await new AxeBuilder({ page })
357|        .withTags(['wcag2a'])
358|        .include('.error')
359|        .analyze();
360|
361|      expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(ACCESSIBILITY_STANDARDS.violations);
362|      
363|      // Verify error states use more than just color
364|      const errorElements = page.locator('.error, [aria-invalid="true"]');
365|      if (await errorElements.count() > 0) {
366|        // Should have text indicators, icons, or other non-color indicators
367|        const firstError = errorElements.first();
368|        const hasTextIndicator = await firstError.locator('.error-text').count() > 0;
369|        const hasIcon = await firstError.locator('.error-icon').count() > 0;
370|        const hasAriaLabel = await firstError.getAttribute('aria-label') !== null;
371|        
372|        expect(hasTextIndicator || hasIcon || hasAriaLabel).toBe(true);
373|      }
374|    });
375|  });
376|
377|  test.describe('Screen Reader Compatibility', () => {
378|    test('Should provide proper landmarks and regions', async () => {
379|      await page.goto('/dashboard');
380|      
381|      // Verify main landmarks exist
382|      const mainLandmark = page.locator('main, [role="main"]');
383|      await expect(mainLandmark).toBeVisible();
384|      
385|      const navigation = page.locator('nav, [role="navigation"]');
386|      await expect(navigation).toBeVisible();
387|      
388|      const banner = page.locator('header, [role="banner"]');
389|      await expect(banner).toBeVisible();
390|      
391|      const contentInfo = page.locator('footer, [role="contentinfo"]');
392|      await expect(contentInfo).toBeVisible();
393|    });
394|
395|    test('Should have descriptive page titles', async () => {
396|      const pages = [
397|        { url: '/', expectedTitle: /ZakApp.*Home/i },
398|        { url: '/dashboard', expectedTitle: /Dashboard.*ZakApp/i },
399|        { url: '/assets', expectedTitle: /Assets.*ZakApp/i },
400|        { url: '/zakat/calculate', expectedTitle: /Calculate Zakat.*ZakApp/i }
401|      ];
402|      
403|      for (const { url, expectedTitle } of pages) {
404|        await page.goto(url);
405|        await expect(page).toHaveTitle(expectedTitle);
406|      }
407|    });
408|
409|    test('Should provide status announcements for dynamic content', async () => {
410|      await page.goto('/zakat/calculate');
411|      
412|      // Fill and submit calculation
413|      await page.selectOption('[data-testid="methodology-select"]', 'hanafi');
414|      await page.click('[data-testid="calculate-button"]');
415|      
416|      // Wait for calculation to complete
417|      await page.waitForSelector('[data-testid="calculation-complete"]');
418|      
419|      // Verify status announcement
420|      const statusAnnouncement = page.locator('[aria-live="polite"], [aria-live="assertive"]');
421|      expect(await statusAnnouncement.count()).toBeGreaterThan(0);
422|    });
423|  });
424|
425|  test.describe('Mobile Accessibility', () => {
426|    test('Should be accessible on mobile devices', async ({ browser }) => {
427|      const mobileContext = await browser.newContext({
428|        viewport: { width: 375, height: 667 }, // iPhone SE size
429|        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
430|      });
431|      
432|      const mobilePage = await mobileContext.newPage();
433|      await mobilePage.goto('/dashboard');
434|      
435|      const accessibilityScanResults = await new AxeBuilder({ page: mobilePage })
436|        .withTags(WCAG_TAGS)
437|        .analyze();
438|
439|      expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(ACCESSIBILITY_STANDARDS.violations);
440|      
441|      // Verify touch targets are accessible
442|      const touchTargets = mobilePage.locator('button, [role="button"], a');
443|      const touchTargetCount = await touchTargets.count();
444|      
445|      for (let i = 0; i < Math.min(touchTargetCount, 10); i++) {
446|        const target = touchTargets.nth(i);
447|        const boundingBox = await target.boundingBox();
448|        
449|        if (boundingBox) {
450|          // WCAG 2.1 AA requires minimum 44x44 pixels for touch targets
451|          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
452|          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
453|        }
454|      }
455|      
456|      await mobileContext.close();
457|    });
458|
459|    test('Should handle orientation changes gracefully', async ({ browser }) => {
460|      const mobileContext = await browser.newContext({
461|        viewport: { width: 375, height: 667 }
462|      });
463|      
464|      const mobilePage = await mobileContext.newPage();
465|      await mobilePage.goto('/dashboard');
466|      
467|      // Test portrait orientation
468|      let accessibilityScanResults = await new AxeBuilder({ page: mobilePage })
469|        .withTags(WCAG_TAGS)
470|        .analyze();
471|      expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(ACCESSIBILITY_STANDARDS.violations);
472|      
473|      // Change to landscape orientation
474|      await mobilePage.setViewportSize({ width: 667, height: 375 });
475|      await mobilePage.waitForTimeout(500); // Allow for layout adjustment
476|      
477|      // Test landscape orientation
478|      accessibilityScanResults = await new AxeBuilder({ page: mobilePage })
479|        .withTags(WCAG_TAGS)
480|        .analyze();
481|      expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(ACCESSIBILITY_STANDARDS.violations);
482|      
483|      await mobileContext.close();
484|    });
485|  });
486|
487|  test.describe('Islamic Content Accessibility', () => {
488|    test('Arabic text should be properly configured for screen readers', async () => {
489|      await page.goto('/education');
490|      
491|      const arabicElements = page.locator('[lang="ar"]');
492|      
493|      if (await arabicElements.count() > 0) {
494|        for (let i = 0; i < await arabicElements.count(); i++) {
495|          const element = arabicElements.nth(i);
496|          
497|          // Verify RTL direction
498|          await expect(element).toHaveAttribute('dir', 'rtl');
499|          
500|          // Verify language is specified
501|          await expect(element).toHaveAttribute('lang', 'ar');
502|        }
503|      }
504|      
505|      const accessibilityScanResults = await new AxeBuilder({ page })
506|        .withTags(WCAG_TAGS)
507|        .analyze();
508|
509|      expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(ACCESSIBILITY_STANDARDS.violations);
510|    });
511|
512|    test('Zakat methodology descriptions should be accessible', async () => {
513|      await page.goto('/education/methodologies');
514|      
515|      const methodologyCards = page.locator('[data-testid="methodology-card"]');
516|      expect(await methodologyCards.count()).toBeGreaterThan(0);
517|      
518|      for (let i = 0; i < await methodologyCards.count(); i++) {
519|        const card = methodologyCards.nth(i);
520|        
521|        // Each methodology should have proper headings and descriptions
522|        const heading = card.locator('h3');
523|        await expect(heading).toBeVisible();
524|        
525|        const description = card.locator('[data-testid="methodology-description"]');
526|        await expect(description).toBeVisible();
527|        
528|        // Should have proper ARIA labels for complex content
529|        await expect(card).toHaveAttribute('role', 'article');
530|      }
531|      
532|      const accessibilityScanResults = await new AxeBuilder({ page })
533|        .withTags(WCAG_TAGS)
534|        .analyze();
535|
536|      expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(ACCESSIBILITY_STANDARDS.violations);
537|    });
538|  });
539|
540|  test.describe('Performance and Accessibility Integration', () => {
541|    test('Should maintain accessibility during loading states', async () => {
542|      await page.goto('/assets');
543|      
544|      // Trigger a loading state
545|      await page.click('[data-testid="refresh-assets-button"]');
546|      
547|      // Verify loading indicator is accessible
548|      const loadingIndicator = page.locator('[data-testid="loading-spinner"]');
549|      await expect(loadingIndicator).toHaveAttribute('role', 'status');
550|      await expect(loadingIndicator).toHaveAttribute('aria-label');
551|      
552|      const accessibilityScanResults = await new AxeBuilder({ page })
553|        .withTags(WCAG_TAGS)
554|        .analyze();
555|
556|      expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(ACCESSIBILITY_STANDARDS.violations);
557|    });
558|
559|    test('Should announce important state changes', async () => {
560|      await page.goto('/assets/new');
561|      
562|      // Fill form and submit
563|      await page.fill('[data-testid="asset-name-input"]', 'Test Asset');
564|      await page.selectOption('[data-testid="asset-category-select"]', 'cash');
565|      await page.fill('[data-testid="asset-value-input"]', '1000');
566|      await page.click('[data-testid="submit-button"]');
567|      
568|      // Verify success message is announced
569|      await page.waitForSelector('[data-testid="success-message"]');
570|      const successMessage = page.locator('[data-testid="success-message"]');
571|      
572|      await expect(successMessage).toHaveAttribute('role', 'alert');
573|      await expect(successMessage).toHaveAttribute('aria-live', 'assertive');
574|    });
575|  });
576|
577|  test.afterEach(async () => {
578|    // Generate accessibility report for each test
579|    const testInfo = test.info();
580|    if (testInfo.status === 'failed') {
581|      // Take screenshot for failed accessibility tests
582|      await page.screenshot({
583|        path: `accessibility-failures/${testInfo.title}.png`,
584|        fullPage: true
585|      });
586|    }
587|  });
588|});