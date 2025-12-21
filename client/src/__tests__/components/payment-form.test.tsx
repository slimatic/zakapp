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
    expect(screen.getByLabelText(/recipient type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/recipient category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/payment method/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    render(<PaymentForm {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /submit|save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
      expect(screen.getByText(/payment date is required/i)).toBeInTheDocument();
      expect(screen.getByText(/recipient name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/recipient type is required/i)).toBeInTheDocument();
      expect(screen.getByText(/recipient category is required/i)).toBeInTheDocument();
      expect(screen.getByText(/payment method is required/i)).toBeInTheDocument();
    });
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
    fireEvent.change(screen.getByLabelText(/recipient type/i), {
      target: { value: 'mosque' }
    });
    fireEvent.change(screen.getByLabelText(/recipient category/i), {
      target: { value: 'general' }
    });
    fireEvent.change(screen.getByLabelText(/payment method/i), {
      target: { value: 'bank_transfer' }
    });
    fireEvent.change(screen.getByLabelText(/notes/i), {
      target: { value: 'Ramadan Zakat payment' }
    });

    const submitButton = screen.getByRole('button', { name: /submit|save/i });
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

    const submitButton = screen.getByRole('button', { name: /submit|save/i });
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

    const submitButton = screen.getByRole('button', { name: /submit|save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/amount .*valid.*number/i)).toBeInTheDocument();
    });
  });
});