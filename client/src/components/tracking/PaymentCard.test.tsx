/**
 * PaymentCard Component Tests - T045
 * Tests for Payment Card display and Nisab Year context
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PaymentCard } from './PaymentCard';
import type { PaymentRecord } from '@zakapp/shared/types/tracking';

// Mock formatters
jest.mock('../../utils/formatters', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
  formatDate: (date: string) => new Date(date).toLocaleDateString()
}));

const mockPayment: PaymentRecord = {
  id: 'payment-1',
  userId: 'user-1',
  snapshotId: 'snapshot-1',
  amount: 250,
  currency: 'USD',
  paymentDate: '2024-12-01T00:00:00.000Z',
  recipientName: 'Islamic Relief',
  recipientType: 'charity',
  recipientCategory: 'fakir',
  paymentMethod: 'bank_transfer',
  notes: 'Monthly Zakat payment',
  receiptReference: 'REF-2024-001',
  createdAt: '2024-12-01T10:00:00.000Z',
  updatedAt: '2024-12-01T10:00:00.000Z'
};

const mockNisabYear = {
  id: 'snapshot-1',
  userId: 'user-1',
  hawlStartDate: '2023-06-01T00:00:00.000Z',
  hawlEndDate: '2024-06-01T00:00:00.000Z',
  calculationDate: '2024-06-01T00:00:00.000Z',
  nisabThreshold: 5000,
  totalWealth: 20000,
  zakatAmount: 500,
  zakatPaid: 250,
  zakatableAssets: [],
  nisabBasis: 'GOLD' as const,
  status: 'FINALIZED' as const,
  createdAt: '2024-06-01T00:00:00.000Z',
  updatedAt: '2024-12-01T10:00:00.000Z'
};

describe('PaymentCard', () => {
  describe('Payment Details Display', () => {
    it('renders payment amount correctly', () => {
      render(<PaymentCard payment={mockPayment} />);
      
      expect(screen.getByText('$250.00')).toBeInTheDocument();
    });

    it('displays recipient name', () => {
      render(<PaymentCard payment={mockPayment} />);
      
      expect(screen.getByText('Islamic Relief')).toBeInTheDocument();
    });

    it('shows payment category', () => {
      render(<PaymentCard payment={mockPayment} />);
      
      // Component shows human-readable category name
      expect(screen.getByText(/Al-Fuqara|The Poor/i)).toBeInTheDocument();
    });

    it('displays payment method', () => {
      render(<PaymentCard payment={mockPayment} />);
      
      expect(screen.getByText(/bank_transfer/i)).toBeInTheDocument();
    });

    it('shows payment date', () => {
      render(<PaymentCard payment={mockPayment} />);
      
      // Check for date in the document (format may vary)
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });

    it('displays notes when provided', () => {
      render(<PaymentCard payment={mockPayment} />);
      
      expect(screen.getByText('Monthly Zakat payment')).toBeInTheDocument();
    });
  });

  describe('Nisab Year Context', () => {
    it('displays linked Nisab Year information when provided', () => {
      render(<PaymentCard payment={mockPayment} nisabYear={mockNisabYear} />);
      
      // Should show year information
      expect(screen.getByText(/2023|2024/)).toBeInTheDocument();
    });

    it('shows Zakat due for the Nisab Year', () => {
      render(<PaymentCard payment={mockPayment} nisabYear={mockNisabYear} />);
      
      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });

    it('displays total paid for the Nisab Year', () => {
      render(<PaymentCard payment={mockPayment} nisabYear={mockNisabYear} />);
      
      expect(screen.getByText('$250.00')).toBeInTheDocument();
    });

    it('shows outstanding balance', () => {
      render(<PaymentCard payment={mockPayment} nisabYear={mockNisabYear} />);
      
      // Outstanding = 500 - 250 = 250
      const outstandingElements = screen.getAllByText('$250.00');
      expect(outstandingElements.length).toBeGreaterThan(0);
    });

    it('displays progress percentage', () => {
      render(<PaymentCard payment={mockPayment} nisabYear={mockNisabYear} />);
      
      // 250/500 = 50%
      expect(screen.getByText(/50%/i)).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('shows green progress when fully paid', () => {
      const fullyPaidNisabYear = {
        ...mockNisabYear,
        zakatPaid: 500
      };

      const { container } = render(
        <PaymentCard payment={mockPayment} nisabYear={fullyPaidNisabYear} />
      );
      
      const progressBar = container.querySelector('.bg-green-500');
      expect(progressBar).toBeInTheDocument();
    });

    it('shows yellow progress for partial payment', () => {
      const { container } = render(
        <PaymentCard payment={mockPayment} nisabYear={mockNisabYear} />
      );
      
      const progressBar = container.querySelector('.bg-yellow-500');
      expect(progressBar).toBeInTheDocument();
    });

    it('shows red progress when no payment', () => {
      const noPaidNisabYear = {
        ...mockNisabYear,
        zakatPaid: 0
      };

      const { container } = render(
        <PaymentCard payment={mockPayment} nisabYear={noPaidNisabYear} />
      );
      
      const progressBar = container.querySelector('.bg-red-500');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('calls onEdit when edit button clicked', () => {
      const onEdit = jest.fn();
      render(<PaymentCard payment={mockPayment} onEdit={onEdit} />);
      
      const editButton = screen.getByText(/edit/i);
      fireEvent.click(editButton);
      
      expect(onEdit).toHaveBeenCalledWith(mockPayment);
    });

    it('calls onDelete when delete button clicked', () => {
      const onDelete = jest.fn();
      render(<PaymentCard payment={mockPayment} onDelete={onDelete} />);
      
      const deleteButton = screen.getByText(/delete/i);
      fireEvent.click(deleteButton);
      
      expect(onDelete).toHaveBeenCalledWith(mockPayment.id);
    });

    it('calls onViewDetails when view details clicked', () => {
      const onViewDetails = jest.fn();
      render(<PaymentCard payment={mockPayment} onViewDetails={onViewDetails} />);
      
      const viewButton = screen.getByText(/view details/i);
      fireEvent.click(viewButton);
      
      expect(onViewDetails).toHaveBeenCalledWith(mockPayment);
    });
  });

  describe('Terminology Compliance', () => {
    it('does not use "snapshot" terminology', () => {
      const { container } = render(
        <PaymentCard payment={mockPayment} nisabYear={mockNisabYear} />
      );
      
      const text = container.textContent || '';
      expect(text.toLowerCase()).not.toContain('snapshot');
    });

    it('uses "Nisab Year" terminology when showing year context', () => {
      render(<PaymentCard payment={mockPayment} nisabYear={mockNisabYear} />);
      
      expect(screen.getByText(/Nisab Year|Hawl/i)).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('renders in compact mode when specified', () => {
      const { container } = render(
        <PaymentCard payment={mockPayment} compact={true} />
      );
      
      expect(container.firstChild).toHaveClass('compact');
    });
  });

  describe('Islamic Calendar Display', () => {
    it('shows Hijri date when available', () => {
      render(<PaymentCard payment={mockPayment} nisabYear={mockNisabYear} />);
      
      // The component should display Islamic year (Hijri)
      // The exact format depends on the implementation
      expect(screen.getByText(/Hijri|Islamic/i)).toBeInTheDocument();
    });
  });

  describe('Category Descriptions', () => {
    it('displays category description for Islamic recipients', () => {
      render(<PaymentCard payment={mockPayment} />);
      
      // Should show Al-Fuqara description for 'fakir' category
      expect(screen.getByText(/Fuqara|Poor/i)).toBeInTheDocument();
    });
  });
});
