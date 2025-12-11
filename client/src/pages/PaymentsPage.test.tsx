/**
 * PaymentsPage Component Tests - T042
 * Tests for Payments Page functionality and filtering
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { PaymentsPage } from './PaymentsPage';

// Mock the hooks
jest.mock('../hooks/usePayments', () => ({
  usePayments: jest.fn()
}));

jest.mock('../hooks/useSnapshots', () => ({
  useSnapshots: jest.fn()
}));

// Mock child components
jest.mock('../components/tracking/PaymentList', () => ({
  PaymentList: ({ onCreateNew }: any) => (
    <div data-testid="payment-list">
      <button onClick={onCreateNew}>Add Payment</button>
    </div>
  )
}));

jest.mock('../components/tracking/PaymentRecordForm', () => ({
  PaymentRecordForm: () => <div data-testid="payment-form">Payment Form</div>
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('PaymentsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('renders page header and description', () => {
      const { usePayments } = require('../hooks/usePayments');
      const { useSnapshots } = require('../hooks/useSnapshots');

      usePayments.mockReturnValue({ data: { payments: [ ] } }, isLoading: false });
      useSnapshots.mockReturnValue({ data: { data: { records: [] } } }, isLoading: false });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Zakat Payments')).toBeInTheDocument();
      expect(screen.getByText(/Record and track your Zakat distributions/i)).toBeInTheDocument();
    });

    it('renders payment list component', () => {
      const { usePayments } = require('../hooks/usePayments');
      const { useSnapshots } = require('../hooks/useSnapshots');

      usePayments.mockReturnValue({ data: { payments: [ ] } }, isLoading: false });
      useSnapshots.mockReturnValue({ data: { data: { records: [] } } }, isLoading: false });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId('payment-list')).toBeInTheDocument();
    });
  });

  describe('Nisab Year Filter', () => {
    it('renders filter dropdown when snapshots exist', () => {
      const { usePayments } = require('../hooks/usePayments');
      const { useSnapshots } = require('../hooks/useSnapshots');

      usePayments.mockReturnValue({ data: { payments: [ ] } }, isLoading: false });
      useSnapshots.mockReturnValue({
        data: {
          data: {
            records: [
              { id: '1', calculationDate: '2024-01-01', status: 'FINALIZED', zakatAmount: 250 },
              { id: '2', calculationDate: '2023-01-01', status: 'FINALIZED', zakatAmount: 300 }
            ]
          }
        },
        isLoading: false
      });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Filter by Nisab Year')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('includes "All Payments" option in filter', () => {
      const { usePayments } = require('../hooks/usePayments');
      const { useSnapshots } = require('../hooks/useSnapshots');

      usePayments.mockReturnValue({ data: { payments: [ ] } }, isLoading: false });
      useSnapshots.mockReturnValue({
        data: {
          data: {
            records: [
              { id: '1', calculationDate: '2024-01-01', status: 'FINALIZED', zakatAmount: 250 }
            ]
          }
        },
        isLoading: false
      });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      
      // Check for "All Payments" option by checking the select's options
      const options = within(select).getAllByRole('option');
      expect(options[0]).toHaveTextContent('All Payments');
    });
  });

  describe('Summary Statistics', () => {
    it('displays summary stats when payments exist', () => {
      const { usePayments } = require('../hooks/usePayments');
      const { useSnapshots } = require('../hooks/useSnapshots');

      usePayments.mockReturnValue({
        data: {
          payments: [
            { id: '1', amount: 100 },
            { id: '2', amount: 150 }
          ]
        },
        isLoading: false
      });
      useSnapshots.mockReturnValue({ data: { data: { records: [] } } }, isLoading: false });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Total Paid')).toBeInTheDocument();
      expect(screen.getByText('Records')).toBeInTheDocument();
      expect(screen.getByText('Average')).toBeInTheDocument();
    });

    it('does not display summary when no payments', () => {
      const { usePayments } = require('../hooks/usePayments');
      const { useSnapshots } = require('../hooks/useSnapshots');

      usePayments.mockReturnValue({ data: { payments: [ ] } }, isLoading: false });
      useSnapshots.mockReturnValue({ data: { data: { records: [] } } }, isLoading: false });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      expect(screen.queryByText('Total Paid')).not.toBeInTheDocument();
    });
  });

  describe('Payment Form Modal', () => {
    it('opens form modal when "Add Payment" clicked', async () => {
      const { usePayments } = require('../hooks/usePayments');
      const { useSnapshots } = require('../hooks/useSnapshots');

      usePayments.mockReturnValue({ data: { payments: [ ] } }, isLoading: false });
      useSnapshots.mockReturnValue({ data: { data: { records: [] } } }, isLoading: false });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      const addButton = screen.getByText('Add Payment');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Record New Payment')).toBeInTheDocument();
        expect(screen.getByTestId('payment-form')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('shows warning when no Nisab Years exist', () => {
      const { usePayments } = require('../hooks/usePayments');
      const { useSnapshots } = require('../hooks/useSnapshots');

      usePayments.mockReturnValue({ data: { payments: [ ] } }, isLoading: false });
      useSnapshots.mockReturnValue({ data: { data: { records: [] } } }, isLoading: false });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/No Nisab Year Records found/i)).toBeInTheDocument();
      expect(screen.getByText('Go to Tracking Dashboard')).toBeInTheDocument();
    });
  });

  describe('Terminology Compliance', () => {
    it('does not use "snapshot" terminology', () => {
      const { usePayments } = require('../hooks/usePayments');
      const { useSnapshots } = require('../hooks/useSnapshots');

      usePayments.mockReturnValue({ data: { payments: [ ] } }, isLoading: false });
      useSnapshots.mockReturnValue({
        data: {
          data: {
            records: [
              { id: '1', calculationDate: '2024-01-01', status: 'FINALIZED' }
            ]
          }
        },
        isLoading: false
      });

      const { container } = render(<PaymentsPage />, { wrapper: createWrapper() });
      
      const text = container.textContent || '';
      expect(text.toLowerCase()).not.toContain('snapshot');
    });

    it('uses "Nisab Year" terminology', () => {
      const { usePayments } = require('../hooks/usePayments');
      const { useSnapshots } = require('../hooks/useSnapshots');

      usePayments.mockReturnValue({ data: { payments: [ ] } }, isLoading: false });
      useSnapshots.mockReturnValue({
        data: {
          data: {
            records: [
              { id: '1', calculationDate: '2024-01-01', status: 'FINALIZED' }
            ]
          }
        },
        isLoading: false
      });

      render(<PaymentsPage />, { wrapper: createWrapper() });
      
      expect(screen.getByText(/Nisab Year/i)).toBeInTheDocument();
    });
  });

  describe('Help Section', () => {
    it('renders Islamic recipients information', () => {
      const { usePayments } = require('../hooks/usePayments');
      const { useSnapshots } = require('../hooks/useSnapshots');

      usePayments.mockReturnValue({ data: { payments: [ ] } }, isLoading: false });
      useSnapshots.mockReturnValue({ data: { data: { records: [] } } }, isLoading: false });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('About Zakat Payments & Recipients')).toBeInTheDocument();
      expect(screen.getByText(/8 categories/i)).toBeInTheDocument();
      expect(screen.getByText(/Al-Fuqara/i)).toBeInTheDocument();
    });
  });
});

// Helper to work with select elements
function within(element: HTMLElement) {
  return {
    getAllByRole: (role: string) => {
      return Array.from(element.querySelectorAll(role === 'option' ? 'option' : `[role="${role}"]`));
    }
  };
}
