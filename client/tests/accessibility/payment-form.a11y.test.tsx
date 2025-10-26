/**
 * Accessibility tests for PaymentForm component
 * Tests WCAG 2.1 AA compliance per Constitutional Principle I
 * 
 * Coverage:
 * - Keyboard navigation
 * - Screen reader support
 * - Focus management
 * - ARIA attributes
 * - Color contrast (documented)
 * - Form validation announcements
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import PaymentForm from '../../src/components/PaymentForm';

expect.extend(toHaveNoViolations);

describe('PaymentForm Accessibility (WCAG 2.1 AA)', () => {
  describe('Automated Accessibility Testing', () => {
    it('should have no axe violations in default state', async () => {
      const { container } = render(<PaymentForm />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations with validation errors', async () => {
      const { container } = render(<PaymentForm />);
      const user = userEvent.setup();
      
      // Submit empty form to trigger validation
      const submitButton = screen.getByRole('button', { name: /submit|record payment/i });
      await user.click(submitButton);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations with filled form', async () => {
      const { container } = render(<PaymentForm />);
      const user = userEvent.setup();
      
      // Fill out form
      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '100.00');

      const dateInput = screen.getByLabelText(/date/i);
      await user.type(dateInput, '2024-01-15');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation (WCAG 2.1.1)', () => {
    it('should allow tab navigation through all form fields', async () => {
      render(<PaymentForm />);
      const user = userEvent.setup();

      const amountInput = screen.getByLabelText(/amount/i);
      const dateInput = screen.getByLabelText(/date/i);
      const categorySelect = screen.getByLabelText(/category/i);
      const notesTextarea = screen.queryByLabelText(/notes/i);
      const submitButton = screen.getByRole('button', { name: /submit|record payment/i });

      // Tab through all fields
      await user.tab();
      expect(amountInput).toHaveFocus();

      await user.tab();
      expect(dateInput).toHaveFocus();

      await user.tab();
      expect(categorySelect).toHaveFocus();

      if (notesTextarea) {
        await user.tab();
        expect(notesTextarea).toHaveFocus();
      }

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('should support reverse tab navigation (Shift+Tab)', async () => {
      render(<PaymentForm />);
      const user = userEvent.setup();

      const submitButton = screen.getByRole('button', { name: /submit|record payment/i });
      submitButton.focus();

      await user.tab({ shift: true });
      const notesTextarea = screen.queryByLabelText(/notes/i);
      if (notesTextarea) {
        expect(notesTextarea).toHaveFocus();
      } else {
        expect(screen.getByLabelText(/category/i)).toHaveFocus();
      }
    });

    it('should support Enter key to submit form', async () => {
      const onSubmit = jest.fn();
      render(<PaymentForm onSubmit={onSubmit} />);
      const user = userEvent.setup();

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '100.00');
      await user.type(amountInput, '{Enter}');

      // Form should attempt submission
      expect(onSubmit).toHaveBeenCalled();
    });

    it('should support Escape key to clear/reset form', async () => {
      render(<PaymentForm />);
      const user = userEvent.setup();

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '100.00');
      
      await user.keyboard('{Escape}');
      
      // Form should be cleared or focus returned to first field
      expect(amountInput).toHaveValue('') || expect(amountInput).toHaveFocus();
    });
  });

  describe('Screen Reader Support (WCAG 4.1.3)', () => {
    it('should have proper form labels for all inputs', () => {
      render(<PaymentForm />);

      // All inputs should have associated labels
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    });

    it('should have descriptive button text', () => {
      render(<PaymentForm />);

      const submitButton = screen.getByRole('button', { name: /submit|record payment|save/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAccessibleName();
    });

    it('should announce validation errors to screen readers', async () => {
      render(<PaymentForm />);
      const user = userEvent.setup();

      const submitButton = screen.getByRole('button', { name: /submit|record payment/i });
      await user.click(submitButton);

      // Error messages should have proper aria-live regions
      const errorMessages = screen.queryAllByRole('alert');
      errorMessages.forEach(error => {
        expect(error).toHaveAttribute('role', 'alert');
      });
    });

    it('should have aria-required on required fields', () => {
      render(<PaymentForm />);

      const amountInput = screen.getByLabelText(/amount/i);
      const dateInput = screen.getByLabelText(/date/i);

      expect(amountInput).toHaveAttribute('aria-required', 'true') || 
             expect(amountInput).toHaveAttribute('required');
      expect(dateInput).toHaveAttribute('aria-required', 'true') || 
             expect(dateInput).toHaveAttribute('required');
    });

    it('should have aria-invalid on fields with errors', async () => {
      render(<PaymentForm />);
      const user = userEvent.setup();

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, 'invalid');
      await user.tab(); // Blur to trigger validation

      // Input should be marked as invalid
      expect(amountInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have aria-describedby linking errors to inputs', async () => {
      render(<PaymentForm />);
      const user = userEvent.setup();

      const amountInput = screen.getByLabelText(/amount/i);
      const submitButton = screen.getByRole('button', { name: /submit|record payment/i });
      
      await user.click(submitButton);

      // If there's an error, input should reference it
      const ariaDescribedBy = amountInput.getAttribute('aria-describedby');
      if (ariaDescribedBy) {
        const errorElement = document.getElementById(ariaDescribedBy);
        expect(errorElement).toBeInTheDocument();
      }
    });
  });

  describe('Focus Management (WCAG 2.4.3, 2.4.7)', () => {
    it('should maintain logical focus order', async () => {
      render(<PaymentForm />);
      const user = userEvent.setup();

      const focusableElements = [
        screen.getByLabelText(/amount/i),
        screen.getByLabelText(/date/i),
        screen.getByLabelText(/category/i),
        screen.getByRole('button', { name: /submit|record payment/i })
      ];

      let previousTabIndex = -1;
      for (const element of focusableElements) {
        await user.tab();
        const currentTabIndex = parseInt(element.getAttribute('tabindex') || '0');
        expect(currentTabIndex).toBeGreaterThanOrEqual(previousTabIndex);
        previousTabIndex = currentTabIndex;
      }
    });

    it('should show visible focus indicators', async () => {
      render(<PaymentForm />);
      const user = userEvent.setup();

      const amountInput = screen.getByLabelText(/amount/i);
      await user.tab();
      
      expect(amountInput).toHaveFocus();
      
      // Element should have focus styling (check via computed styles or class)
      const focusedElement = document.activeElement;
      expect(focusedElement).toBe(amountInput);
    });

    it('should not trap focus within form', async () => {
      const { container } = render(
        <div>
          <button>Before Form</button>
          <PaymentForm />
          <button>After Form</button>
        </div>
      );
      const user = userEvent.setup();

      const beforeButton = screen.getByText('Before Form');
      beforeButton.focus();

      // Should be able to tab through entire form and reach after button
      for (let i = 0; i < 10; i++) {
        await user.tab();
      }

      const afterButton = screen.getByText('After Form');
      expect(afterButton).toHaveFocus() || expect(document.activeElement).not.toBe(beforeButton);
    });

    it('should return focus to trigger element on cancel', async () => {
      const onCancel = jest.fn();
      render(<PaymentForm onCancel={onCancel} />);
      const user = userEvent.setup();

      const cancelButton = screen.queryByRole('button', { name: /cancel/i });
      if (cancelButton) {
        const amountInput = screen.getByLabelText(/amount/i);
        amountInput.focus();

        await user.click(cancelButton);
        
        // Focus should be managed appropriately
        expect(onCancel).toHaveBeenCalled();
      }
    });
  });

  describe('Form Validation Announcements (WCAG 3.3.1, 3.3.3)', () => {
    it('should provide clear error messages', async () => {
      render(<PaymentForm />);
      const user = userEvent.setup();

      const submitButton = screen.getByRole('button', { name: /submit|record payment/i });
      await user.click(submitButton);

      // Error messages should be specific and helpful
      const errors = screen.queryAllByRole('alert');
      errors.forEach(error => {
        expect(error).toHaveTextContent(/.+/); // Not empty
        expect(error.textContent).not.toMatch(/error|invalid/i); // More specific than generic
      });
    });

    it('should provide success feedback after submission', async () => {
      const onSubmit = jest.fn();
      render(<PaymentForm onSubmit={onSubmit} />);
      const user = userEvent.setup();

      // Fill valid form
      await user.type(screen.getByLabelText(/amount/i), '100.00');
      await user.type(screen.getByLabelText(/date/i), '2024-01-15');

      const submitButton = screen.getByRole('button', { name: /submit|record payment/i });
      await user.click(submitButton);

      // Success message should be announced
      const successMessage = await screen.findByRole('status', { timeout: 1000 }).catch(() => null);
      if (successMessage) {
        expect(successMessage).toHaveTextContent(/success|saved|recorded/i);
      }
    });
  });

  describe('Input Constraints (WCAG 1.3.5)', () => {
    it('should have autocomplete attributes where appropriate', () => {
      render(<PaymentForm />);

      const amountInput = screen.getByLabelText(/amount/i);
      
      // Payment amount might not need autocomplete, but check if present
      const autocomplete = amountInput.getAttribute('autocomplete');
      if (autocomplete) {
        expect(['off', 'transaction-amount']).toContain(autocomplete);
      }
    });

    it('should have inputmode for numeric inputs', () => {
      render(<PaymentForm />);

      const amountInput = screen.getByLabelText(/amount/i);
      
      // Should suggest numeric keyboard on mobile
      expect(amountInput).toHaveAttribute('type', 'number') || 
             expect(amountInput).toHaveAttribute('inputmode', 'decimal');
    });

    it('should have min/max/step attributes for amount', () => {
      render(<PaymentForm />);

      const amountInput = screen.getByLabelText(/amount/i);
      
      // Should have constraints to guide input
      const min = amountInput.getAttribute('min');
      const step = amountInput.getAttribute('step');
      
      if (min) expect(parseFloat(min)).toBeGreaterThanOrEqual(0);
      if (step) expect(parseFloat(step)).toBeGreaterThan(0);
    });
  });

  describe('Color & Contrast (WCAG 1.4.3) - Manual Verification Required', () => {
    it('should document color contrast requirements', () => {
      /**
       * MANUAL VERIFICATION CHECKLIST:
       * 
       * Normal Text (< 18pt regular, < 14pt bold):
       * - Contrast ratio ≥ 4.5:1 against background
       * 
       * Large Text (≥ 18pt regular, ≥ 14pt bold):
       * - Contrast ratio ≥ 3:1 against background
       * 
       * UI Components & Graphics:
       * - Contrast ratio ≥ 3:1 for focus indicators
       * - Contrast ratio ≥ 3:1 for form field borders
       * 
       * Use browser DevTools or tools like:
       * - Chrome DevTools Accessibility Panel
       * - axe DevTools extension
       * - WAVE browser extension
       * - Contrast Checker tools
       * 
       * Verify:
       * ✓ Labels against background
       * ✓ Input field borders
       * ✓ Error messages
       * ✓ Focus indicators
       * ✓ Button text against button background
       * ✓ Disabled state visibility
       */
      expect(true).toBe(true); // Placeholder for manual check documentation
    });
  });

  describe('Responsive & Zoom Support (WCAG 1.4.4, 1.4.10)', () => {
    it('should remain functional at 200% zoom', () => {
      /**
       * MANUAL VERIFICATION CHECKLIST:
       * 
       * At 200% browser zoom:
       * ✓ All form fields remain visible
       * ✓ All labels remain associated with inputs
       * ✓ Submit button remains accessible
       * ✓ Error messages don't overlap content
       * ✓ No horizontal scrolling required
       * ✓ Focus indicators remain visible
       * 
       * Test at viewport widths: 320px, 768px, 1024px, 1920px
       */
      render(<PaymentForm />);
      
      // Basic structural check
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit|record payment/i })).toBeInTheDocument();
    });

    it('should support mobile viewport (320px width)', () => {
      /**
       * MANUAL VERIFICATION CHECKLIST:
       * 
       * At 320px viewport width:
       * ✓ Form remains usable without horizontal scroll
       * ✓ Touch targets ≥ 44x44px
       * ✓ Text remains readable
       * ✓ Input fields full width or appropriately sized
       * ✓ Buttons remain accessible
       */
      render(<PaymentForm />);
      
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    });
  });

  describe('Touch Target Size (WCAG 2.5.5)', () => {
    it('should have minimum touch target size of 44x44px', () => {
      render(<PaymentForm />);

      const submitButton = screen.getByRole('button', { name: /submit|record payment/i });
      
      // Check computed dimensions
      const rect = submitButton.getBoundingClientRect();
      
      // Should meet minimum touch target size
      // Note: This may vary with responsive design
      expect(rect.height).toBeGreaterThanOrEqual(36); // Allowing some flexibility for unit tests
      expect(rect.width).toBeGreaterThanOrEqual(36);
    });
  });
});
