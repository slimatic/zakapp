# Accessibility Tests Guide

This directory contains comprehensive WCAG 2.1 AA accessibility tests for ZakApp's Tracking & Analytics System components. These tests ensure ZakApp meets Constitutional Principle I requirements for a professional, accessible user experience.

## Overview

**Test Files:**
- `payment-form.a11y.test.tsx` - PaymentForm component accessibility
- `analytics-dashboard.a11y.test.tsx` - AnalyticsDashboard component accessibility
- `export-controls.a11y.test.tsx` - ExportControls component accessibility
- `reminder-notification.a11y.test.tsx` - ReminderNotification component accessibility

**WCAG Level:** 2.1 AA Compliance  
**Testing Technology:** jest-axe + React Testing Library  
**Coverage:** 120+ test cases across 4 components

---

## Running Tests

### All Accessibility Tests
```bash
npm test -- client/tests/accessibility
```

### Specific Component
```bash
npm test -- payment-form.a11y.test.tsx
npm test -- analytics-dashboard.a11y.test.tsx
npm test -- export-controls.a11y.test.tsx
npm test -- reminder-notification.a11y.test.tsx
```

### Watch Mode (for development)
```bash
npm test -- client/tests/accessibility --watch
```

### Coverage Report
```bash
npm test -- client/tests/accessibility --coverage
```

---

## Test Structure

Each component test file follows this structure:

```typescript
describe('Component Accessibility (WCAG 2.1 AA)', () => {
  describe('Automated Accessibility Testing', () => {
    // jest-axe automated violation detection
  });

  describe('Keyboard Navigation (WCAG 2.1.1)', () => {
    // Tab, Shift+Tab, Enter, Escape, Arrow keys
  });

  describe('Screen Reader Support (WCAG 4.1.2, 4.1.3)', () => {
    // ARIA attributes, labels, roles, live regions
  });

  describe('Focus Management (WCAG 2.4.3, 2.4.7)', () => {
    // Focus order, visible indicators, focus trapping
  });

  // ... additional WCAG criteria tests
});
```

---

## WCAG Success Criteria Covered

### Perceivable (Principle 1)
- **1.1.1** Non-text Content
- **1.3.5** Identify Input Purpose
- **1.4.1** Use of Color
- **1.4.3** Contrast (Minimum) - *manual verification*
- **1.4.4** Resize Text
- **1.4.10** Reflow
- **1.4.13** Content on Hover or Focus

### Operable (Principle 2)
- **2.1.1** Keyboard
- **2.1.2** No Keyboard Trap
- **2.2.1** Timing Adjustable
- **2.4.3** Focus Order
- **2.4.7** Focus Visible
- **2.5.3** Label in Name
- **2.5.5** Target Size

### Understandable (Principle 3)
- **3.3.1** Error Identification
- **3.3.2** Labels or Instructions
- **3.3.3** Error Suggestion

### Robust (Principle 4)
- **4.1.2** Name, Role, Value
- **4.1.3** Status Messages

---

## Automated vs. Manual Testing

### Automated (via jest-axe)
✅ ARIA attribute validation  
✅ Color contrast detection  
✅ Form label associations  
✅ Heading hierarchy  
✅ Image alternative text  
✅ Landmark regions  

### Manual Verification Required
📋 Actual color contrast measurement  
📋 200% zoom testing  
📋 Screen reader testing  
📋 Reduced motion support  
📋 Mobile viewport testing  

**Manual checklists are documented in test files as comments.**

---

## Key Testing Patterns

### 1. Automated Axe Validation
```typescript
it('should have no axe violations in default state', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 2. Keyboard Navigation
```typescript
it('should allow tab navigation through all form fields', async () => {
  render(<Component />);
  const user = userEvent.setup();

  await user.tab();
  expect(firstElement).toHaveFocus();

  await user.tab();
  expect(secondElement).toHaveFocus();
});
```

### 3. Screen Reader Announcements
```typescript
it('should announce validation errors to screen readers', async () => {
  render(<Component />);
  const user = userEvent.setup();

  // Trigger error
  await user.click(submitButton);

  // Verify announcement
  const errorMessages = screen.queryAllByRole('alert');
  expect(errorMessages[0]).toHaveAttribute('role', 'alert');
});
```

### 4. Focus Management
```typescript
it('should trap focus in modal notifications', async () => {
  render(<Modal />);
  const user = userEvent.setup();

  // Tab through all elements
  for (let i = 0; i < 10; i++) {
    await user.tab();
  }

  // Focus should remain within modal
  expect(modal).toContainElement(document.activeElement);
});
```

---

## Manual Testing Procedures

### Color Contrast Testing

**Tools:**
- Chrome DevTools → Elements → Accessibility Panel
- [axe DevTools Extension](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

**Thresholds:**
- Normal text: ≥4.5:1
- Large text (≥18pt or ≥14pt bold): ≥3:1
- UI components: ≥3:1

**What to Check:**
- [ ] Form labels vs background
- [ ] Input field borders
- [ ] Error messages
- [ ] Focus indicators
- [ ] Button text vs button background
- [ ] Disabled state text

### Zoom Testing

**Procedure:**
1. Open component in browser
2. Set zoom to 200% (Cmd/Ctrl + Plus)
3. Verify functionality

**Checklist:**
- [ ] All content remains visible
- [ ] No horizontal scrolling required
- [ ] Text remains readable
- [ ] Interactive elements remain accessible
- [ ] No overlapping content

### Screen Reader Testing

**Tools:**
- macOS: VoiceOver (Cmd+F5)
- Windows: NVDA (free) or JAWS
- ChromeVox extension

**Test Flow:**
1. Navigate component with screen reader only
2. Verify all content is announced
3. Verify tab order makes sense
4. Verify form validation is announced
5. Verify dynamic updates are announced

### Mobile Testing

**Viewports to Test:**
- 320px (iPhone SE)
- 375px (iPhone 12)
- 768px (iPad)
- 1024px (iPad Pro)

**Checklist:**
- [ ] Touch targets ≥44x44px
- [ ] No content cut off
- [ ] All controls accessible
- [ ] No precision gestures required

---

## Common Issues & Solutions

### Issue: "expected to have no violations but had..."

**Cause:** Component has accessibility violations  
**Solution:** Read the axe error details and fix the specific issue

Example:
```
Expected no violations but found:
- "Form elements must have labels" on <input>

Fix: Add proper <label> or aria-label
```

### Issue: "Element does not have focus"

**Cause:** Focus management not working correctly  
**Solution:** Verify tab order and focusable elements

```typescript
// Check if element is focusable
expect(element).toHaveAttribute('tabindex', '0');
expect(element.tabIndex).toBeGreaterThanOrEqual(0);
```

### Issue: "Cannot find role='alert'"

**Cause:** Error messages not properly announced  
**Solution:** Add role="alert" or aria-live

```typescript
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

---

## Adding New Accessibility Tests

### 1. Create Test File
```bash
touch client/tests/accessibility/new-component.a11y.test.tsx
```

### 2. Use Template
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import NewComponent from '../../src/components/NewComponent';

expect.extend(toHaveNoViolations);

describe('NewComponent Accessibility (WCAG 2.1 AA)', () => {
  describe('Automated Accessibility Testing', () => {
    it('should have no axe violations', async () => {
      const { container } = render(<NewComponent />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // Add more test suites...
});
```

### 3. Test Coverage Checklist
- [ ] Automated axe tests
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Focus management
- [ ] Error handling
- [ ] Touch targets (mobile)
- [ ] Zoom support (manual checklist)
- [ ] Color contrast (manual checklist)

---

## CI/CD Integration

Accessibility tests run automatically in CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Run Accessibility Tests
  run: npm test -- client/tests/accessibility --ci --coverage
```

**Failure Policy:** Pipeline fails if any accessibility violations detected.

---

## Resources

### WCAG Documentation
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)

### Testing Tools
- [jest-axe Documentation](https://github.com/nickcolley/jest-axe)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

### Best Practices
- [WebAIM Articles](https://webaim.org/articles/)
- [a11y Project Checklist](https://www.a11yproject.com/checklist/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

---

## Maintenance

### When to Update Tests
- ✅ When adding new interactive components
- ✅ When modifying existing component behavior
- ✅ When changing component structure/DOM
- ✅ When adding new user interactions
- ✅ When WCAG guidelines are updated

### Review Schedule
- **Weekly:** Review any test failures in CI
- **Monthly:** Run manual verification checklists
- **Quarterly:** Review WCAG updates and test coverage

---

## Contact

**For Accessibility Questions:**
- Review Constitutional Principle I (Professional & Modern UX)
- Consult WCAG 2.1 documentation
- Run automated tests and read violations
- Test with actual screen readers

**For Test Issues:**
- Check test failure messages
- Review component implementation
- Verify jest-axe is up to date
- Check React Testing Library docs

---

*Last Updated: 2025-01-13*  
*WCAG Version: 2.1 Level AA*  
*Total Test Cases: 120+*
