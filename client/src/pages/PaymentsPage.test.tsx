/**
 * Copyright (c) 2024 ZakApp Contributors
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

/**
 * PaymentsPage Component Tests - T042
 * Tests for Payments Page functionality and filtering
 * Updated to use new Repositories (RxDB)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { PaymentsPage } from './PaymentsPage';

// Mock the new hooks
import { vi } from 'vitest';

// Use vi.fn() for hook implementations
const mockUsePaymentRepository = vi.fn();
const mockUseNisabRecordRepository = vi.fn();

vi.mock('../hooks/usePaymentRepository', () => ({
  usePaymentRepository: () => mockUsePaymentRepository()
}));

vi.mock('../hooks/useNisabRecordRepository', () => ({
  useNisabRecordRepository: () => mockUseNisabRecordRepository()
}));

// Mock DB to prevent DB9
vi.mock('../db', () => ({
  useDb: () => null,
  getDb: vi.fn(),
  resetDb: vi.fn(),
}));

// Mock child components to isolate page logic
vi.mock('../components/tracking/PaymentList', () => ({
  PaymentList: ({ onCreateNew }: any) => (
    <div data-testid="payment-list">
      <button data-testid="mock-add-payment-btn" onClick={onCreateNew}>Add Payment (Mock)</button>
    </div>
  )
}));

vi.mock('../components/tracking/PaymentRecordForm', () => ({
  PaymentRecordForm: () => <div data-testid="payment-form">Payment Form</div>
}));


// Wrapper for providers
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
    vi.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('renders page header and description', () => {
      mockUsePaymentRepository.mockReturnValue({ payments: [], isLoading: false });
      mockUseNisabRecordRepository.mockReturnValue({ records: [], isLoading: false });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Zakat Payments')).toBeInTheDocument();
      expect(screen.getByText(/Record and track your Zakat distributions/i)).toBeInTheDocument();
    });

    it('renders payment list component', () => {
      mockUsePaymentRepository.mockReturnValue({ payments: [], isLoading: false });
      mockUseNisabRecordRepository.mockReturnValue({ records: [], isLoading: false });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId('payment-list')).toBeInTheDocument();
    });
  });

  describe('Nisab Year Filter', () => {
    it('renders filter dropdown when records exist', () => {
      mockUsePaymentRepository.mockReturnValue({ payments: [], isLoading: false });
      mockUseNisabRecordRepository.mockReturnValue({
        records: [
          { id: '1', calculationDate: '2024-01-01', hawlStartDate: '2023-01-01', status: 'FINALIZED', zakatAmount: 250 }
        ],
        isLoading: false
      });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/Filter by Nisab Year/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Filter by Nisab Year Record/i)).toBeInTheDocument();
    });

    it('includes "All Payments" option in filter', () => {
      mockUsePaymentRepository.mockReturnValue({ payments: [], isLoading: false });
      mockUseNisabRecordRepository.mockReturnValue({
        records: [
          { id: '1', calculationDate: '2024-01-01', status: 'FINALIZED', zakatAmount: 250 }
        ],
        isLoading: false
      });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      const select = screen.getByLabelText(/Filter by Nisab Year Record/i);
      const options = within(select).getAllByRole('option');
      expect(options[0]).toHaveTextContent(/All Payments/i);
    });
  });

  describe('Empty State', () => {
    it('shows warning when no Nisab Years exist', () => {
      mockUsePaymentRepository.mockReturnValue({ payments: [], isLoading: false });
      mockUseNisabRecordRepository.mockReturnValue({ records: [], isLoading: false });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/No Nisab Year Records found/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
    });

    it('shows orphaned payments warning', () => {
      mockUsePaymentRepository.mockReturnValue({ payments: [{ id: 'p1', amount: 100 }], isLoading: false });
      mockUseNisabRecordRepository.mockReturnValue({ records: [], isLoading: false });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/Payments Need Assignment/i)).toBeInTheDocument();
    });
  });

  describe('Payment Form Interaction', () => {
    it('opens form modal when Add Payment clicked', async () => {
      mockUsePaymentRepository.mockReturnValue({ payments: [], isLoading: false });
      mockUseNisabRecordRepository.mockReturnValue({ records: [], isLoading: false });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      // Click the mock button in PaymentList
      fireEvent.click(screen.getByTestId('mock-add-payment-btn'));

      expect(await screen.findByText('Record New Payment')).toBeInTheDocument();
      expect(screen.getByTestId('payment-form')).toBeInTheDocument();
    });
  });
});
