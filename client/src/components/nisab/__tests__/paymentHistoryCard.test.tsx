/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { PrivacyProvider } from '../../../contexts/PrivacyContext';
import { PaymentHistoryCard } from '../PaymentHistoryCard';

afterEach(cleanup);

const baseProps = {
  totalObligation: 1000,
  totalPaid: 400,
  remainingBalance: 600,
  isFullyPaid: false,
  recordStatus: 'DRAFT',
  payments: [],
  canRecordPayment: true,
  onRecordPayment: vi.fn(),
  formatCurrency: (n: number) => `$${n.toLocaleString('en-US')}`,
};

describe('PaymentHistoryCard (#341-lite extraction)', () => {
  it('renders obligation, paid, and remaining amounts', () => {
    render(<PaymentHistoryCard {...baseProps} />);
    expect(screen.getByText('Obligation:')).toBeInTheDocument();
    expect(screen.getByText('$1,000')).toBeInTheDocument();
    expect(screen.getByText('$400')).toBeInTheDocument();
    expect(screen.getByText('$600')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('shows the Record Payment button only when allowed', () => {
    const onRecordPayment = vi.fn();
    const { rerender } = render(
      <PaymentHistoryCard {...baseProps} onRecordPayment={onRecordPayment} />
    );
    const btn = screen.getByText('+ Record Payment');
    fireEvent.click(btn);
    expect(onRecordPayment).toHaveBeenCalledTimes(1);

    rerender(<PaymentHistoryCard {...baseProps} onRecordPayment={onRecordPayment} canRecordPayment={false} />);
    expect(screen.queryByText('+ Record Payment')).not.toBeInTheDocument();
  });

  it('shows the Paid badge and hides the button when fully paid', () => {
    render(
      <PaymentHistoryCard
        {...baseProps}
        totalPaid={1000}
        remainingBalance={0}
        isFullyPaid={true}
        canRecordPayment={false}
      />
    );
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.queryByText('+ Record Payment')).not.toBeInTheDocument();
  });

  it('renders payments and the empty state', () => {
    const { rerender } = render(
      <PrivacyProvider>
        <PaymentHistoryCard {...baseProps} payments={[{ id: 'p1', paymentDate: new Date().toISOString() }]} />
      </PrivacyProvider>
    );
    expect(screen.queryByText('No payments recorded yet.')).not.toBeInTheDocument();

    rerender(
      <PrivacyProvider>
        <PaymentHistoryCard {...baseProps} payments={[]} />
      </PrivacyProvider>
    );
    expect(screen.getByText('No payments recorded yet.')).toBeInTheDocument();
  });
});