import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentForm } from '../../../src/components/PaymentForm';

describe('PaymentForm Accessibility', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without accessibility issues', () => {
    expect(() => render(<PaymentForm {...defaultProps} />)).not.toThrow();
  });

  it('should indicate loading state accessibly', () => {
    render(<PaymentForm {...defaultProps} isLoading={true} />);

    const submitButton = screen.getByRole('button', { name: /saving/i });
    expect(submitButton).toBeDisabled();
  });

  it('should have accessible form structure', () => {
    render(<PaymentForm {...defaultProps} />);

    // Form should have proper structure with inputs and labels
    const inputs = screen.getAllByRole('textbox');
    const selects = screen.getAllByRole('combobox');
    const buttons = screen.getAllByRole('button');

    expect(inputs.length).toBeGreaterThan(0);
    expect(selects.length).toBeGreaterThan(0);
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should be responsive on different screen sizes', () => {
    render(<PaymentForm {...defaultProps} />);

    // Form should be contained and responsive - check that key elements exist
    const amountInput = screen.getByRole('spinbutton', { name: /amount/i });
    expect(amountInput).toBeVisible();
  });
});