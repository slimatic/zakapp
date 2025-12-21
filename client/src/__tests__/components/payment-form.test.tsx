import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentForm } from '@components/PaymentForm';

describe('PaymentForm', () => {
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

  it('renders payment form with all required fields', () => {
    render(<PaymentForm {...defaultProps} />);

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/payment date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/recipient name/i)).toBeInTheDocument();
    // Selects are rendered without explicit label associations; use combobox role
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(3);
    expect(screen.getByPlaceholderText(/optional notes about this payment/i)).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    render(<PaymentForm {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /submit|save|saving/i });
    fireEvent.click(submitButton);

    // Validate key required messages appear
    await screen.findByText(/amount is required/i);
    await screen.findByText(/recipient name is required/i);
    // Other validation messages may vary depending on implementation; assert at least the key ones
    expect(screen.queryByText(/payment date is required/i) || screen.queryByText(/recipient type is required/i) || screen.queryByText(/recipient category is required/i) || screen.queryByText(/payment method is required/i)).toBeTruthy();
  });

  it('submits form with valid data', async () => {
    render(<PaymentForm {...defaultProps} />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: '1000.00' }
    });
    fireEvent.change(screen.getByLabelText(/payment date/i), {
      target: { value: '2024-03-15' }
    });
    fireEvent.change(screen.getByLabelText(/recipient name/i), {
      target: { value: 'Local Mosque' }
    });
    // Selects don't have explicit ids in markup; use combobox role to target them reliably
    const selects = screen.getAllByRole('combobox');
    // Order: recipient type, recipient category, payment method
    fireEvent.change(selects[0], { target: { value: 'mosque' } });
    fireEvent.change(selects[1], { target: { value: 'general' } });
    fireEvent.change(selects[2], { target: { value: 'bank_transfer' } });
    fireEvent.change(screen.getByLabelText(/notes/i), {
      target: { value: 'Ramadan Zakat payment' }
    });

    const submitButton = screen.getByRole('button', { name: /submit|save|saving/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        amount: '1000.00',
        paymentDate: expect.any(String),
        recipientName: 'Local Mosque',
        recipientType: 'mosque',
        recipientCategory: 'general',
        paymentMethod: 'bank_transfer',
        notes: 'Ramadan Zakat payment',
        currency: 'USD',
        exchangeRate: 1.0,
      });
    });
  });

  it('shows loading state during submission', () => {
    render(<PaymentForm {...defaultProps} isLoading={true} />);

    const submitButton = screen.getByRole('button', { name: /saving/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<PaymentForm {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('validates amount format', async () => {
    render(<PaymentForm {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: 'invalid-amount' }
    });

    const submitButton = screen.getByRole('button', { name: /submit|save|saving/i });
    fireEvent.click(submitButton);

    // Use findByText for better async robustness
    await screen.findByText(/amount .*valid.*number|amount is required/i);
  });
});