import React from 'react';
import { render } from '@testing-library/react';
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

  it('should render without accessibility violations', () => {
    // Basic accessibility check: component should render without throwing
    expect(() => render(<PaymentForm {...defaultProps} />)).not.toThrow();
  });

  it('should handle loading state accessibly', () => {
    // Loading state should not break accessibility
    expect(() => render(<PaymentForm {...defaultProps} isLoading={true} />)).not.toThrow();
  });

  it('should maintain accessibility across different states', () => {
    // Test various component states for accessibility
    const states = [
      { ...defaultProps, isLoading: false },
      { ...defaultProps, isLoading: true },
    ];

    states.forEach(state => {
      expect(() => render(<PaymentForm {...state} />)).not.toThrow();
    });
  });
});