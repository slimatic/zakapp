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

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardActionCards } from '../DashboardActionCards';
import type { Asset } from '../../types';
import type { NisabYearRecord } from '../../types/nisabYearRecord';
import type { PaymentRecord } from '@zakapp/shared/types/tracking';

const mockAssets: Asset[] = [];
const mockPayments: PaymentRecord[] = [];

describe('DashboardActionCards', () => {
  const defaultProps = {
    assets: mockAssets,
    activeNisabRecord: null as NisabYearRecord | null,
    payments: mockPayments,
  };

  const renderComponent = (props = defaultProps) => {
    return render(
      <MemoryRouter>
        <DashboardActionCards {...props} />
      </MemoryRouter>
    );
  };

  describe('when user has no assets', () => {
    it('shows "Add Your First Asset" card', () => {
      renderComponent({
        ...defaultProps,
        assets: [],
        activeNisabRecord: null,
      });

      expect(screen.getByText('Add Your First Asset')).toBeInTheDocument();
      expect(screen.getByText(/Begin your Zakat journey by adding/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Add Asset/i })).toHaveAttribute('href', '/assets/new');
    });

    it('has primary variant styling', () => {
      renderComponent({
        ...defaultProps,
        assets: [],
      });

      const card = screen.getByTestId('action-card-primary');
      expect(card).toBeInTheDocument();
    });
  });

  describe('when user has assets but no active nisab record', () => {
    const assetsWithOne: Asset[] = [
      {
        id: '1',
        type: 'CASH',
        name: 'Savings',
        value: 5000,
        currency: 'USD',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    it('shows "Start Nisab Year Tracking" card', () => {
      renderComponent({
        ...defaultProps,
        assets: assetsWithOne,
        activeNisabRecord: null,
      });

      expect(screen.getByText('Start Nisab Year Tracking')).toBeInTheDocument();
      expect(screen.getByText(/Create a Nisab Year Record/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Create Nisab Record/i })).toHaveAttribute('href', '/nisab-records');
    });

    it('has warning variant styling', () => {
      renderComponent({
        ...defaultProps,
        assets: assetsWithOne,
        activeNisabRecord: null,
      });

      const card = screen.getByTestId('action-card-warning');
      expect(card).toBeInTheDocument();
    });
  });

  describe('when user has assets, active record, and zakat owed > paid', () => {
    const assetsWithOne: Asset[] = [
      {
        id: '1',
        type: 'CASH',
        name: 'Savings',
        value: 10000,
        currency: 'USD',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    const activeRecord: NisabRecord = {
      id: '1',
      userId: 'user1',
      year: 2024,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      nisabBasis: 'GOLD',
      nisabValue: 5000,
      isActive: true,
      isCompleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const paymentsPartial: Payment[] = [
      {
        id: '1',
        userId: 'user1',
        nisabRecordId: '1',
        amount: 100,
        currency: 'USD',
        paymentDate: '2024-06-01',
        notes: 'Partial payment',
        createdAt: '2024-06-01T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
      },
    ];

    it('shows "Zakat Payment Due" card with remaining amount', () => {
      renderComponent({
        ...defaultProps,
        assets: assetsWithOne,
        activeNisabRecord: activeRecord,
        payments: paymentsPartial,
      });

      expect(screen.getByText('Zakat Payment Due')).toBeInTheDocument();
      expect(screen.getByText(/\$150\.00 remaining/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Make Payment/i })).toHaveAttribute('href', '/payments');
    });

    it('has urgent variant styling', () => {
      renderComponent({
        ...defaultProps,
        assets: assetsWithOne,
        activeNisabRecord: activeRecord,
        payments: paymentsPartial,
      });

      const card = screen.getByTestId('action-card-urgent');
      expect(card).toBeInTheDocument();
    });
  });

  describe('when user has everything up to date', () => {
    const assetsWithTwo: Asset[] = [
      {
        id: '1',
        type: 'CASH',
        name: 'Savings',
        value: 10000,
        currency: 'USD',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        type: 'GOLD',
        name: 'Gold Holdings',
        value: 5000,
        currency: 'USD',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    const activeRecord: NisabRecord = {
      id: '1',
      userId: 'user1',
      year: 2024,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      nisabBasis: 'GOLD',
      nisabValue: 5000,
      isActive: true,
      isCompleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const paymentsFull: Payment[] = [
      {
        id: '1',
        userId: 'user1',
        nisabRecordId: '1',
        amount: 375, // 2.5% of 15000 = 375
        currency: 'USD',
        paymentDate: '2024-06-01',
        notes: 'Full payment',
        createdAt: '2024-06-01T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
      },
    ];

    it('shows summary/analytics card', () => {
      renderComponent({
        ...defaultProps,
        assets: assetsWithTwo,
        activeNisabRecord: activeRecord,
        payments: paymentsFull,
      });

      expect(screen.getByText('Your Wealth at a Glance')).toBeInTheDocument();
      expect(screen.getByText('Total Assets')).toBeInTheDocument();
      expect(screen.getByText('Active Record')).toBeInTheDocument();
      expect(screen.getByText('Payments Made')).toBeInTheDocument();
      expect(screen.getByText('Tracking Status')).toBeInTheDocument();
    });

    it('displays correct asset count', () => {
      renderComponent({
        ...defaultProps,
        assets: assetsWithTwo,
        activeNisabRecord: activeRecord,
        payments: paymentsFull,
      });

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('has links to view assets and payments', () => {
      renderComponent({
        ...defaultProps,
        assets: assetsWithTwo,
        activeNisabRecord: activeRecord,
        payments: paymentsFull,
      });

      expect(screen.getByRole('link', { name: /View All Assets/i })).toHaveAttribute('href', '/assets');
      expect(screen.getByRole('link', { name: /Payment History/i })).toHaveAttribute('href', '/payments');
    });
  });

  describe('accessibility', () => {
    it('has proper testid for the container', () => {
      renderComponent();
      expect(screen.getByTestId('dashboard-action-cards')).toBeInTheDocument();
    });

    it('renders links with proper href attributes', () => {
      renderComponent({
        ...defaultProps,
        assets: [],
      });

      const link = screen.getByRole('link', { name: /Add Asset/i });
      expect(link).toHaveAttribute('href', '/assets/new');
    });
  });

  describe('zakat calculation logic', () => {
    it('calculates 2.5% zakat correctly', () => {
      const assets: Asset[] = [
        {
          id: '1',
          type: 'CASH',
          name: 'Savings',
          value: 20000,
          currency: 'USD',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      const activeRecord: NisabRecord = {
        id: '1',
        userId: 'user1',
        year: 2024,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        nisabBasis: 'GOLD',
        nisabValue: 5000,
        isActive: true,
        isCompleted: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      // 2.5% of 20000 = 500, paid 200, remaining 300
      const payments: Payment[] = [
        {
          id: '1',
          userId: 'user1',
          nisabRecordId: '1',
          amount: 200,
          currency: 'USD',
          paymentDate: '2024-06-01',
          notes: 'Partial',
          createdAt: '2024-06-01T00:00:00Z',
          updatedAt: '2024-06-01T00:00:00Z',
        },
      ];

      renderComponent({
        assets,
        activeNisabRecord: activeRecord,
        payments,
      });

      expect(screen.getByText(/\$300\.00 remaining/i)).toBeInTheDocument();
    });

    it('does not show payment card when zakat is fully paid', () => {
      const assets: Asset[] = [
        {
          id: '1',
          type: 'CASH',
          name: 'Savings',
          value: 10000,
          currency: 'USD',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      const activeRecord: NisabRecord = {
        id: '1',
        userId: 'user1',
        year: 2024,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        nisabBasis: 'GOLD',
        nisabValue: 5000,
        isActive: true,
        isCompleted: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      // 2.5% of 10000 = 250, paid 250
      const payments: Payment[] = [
        {
          id: '1',
          userId: 'user1',
          nisabRecordId: '1',
          amount: 250,
          currency: 'USD',
          paymentDate: '2024-06-01',
          notes: 'Full payment',
          createdAt: '2024-06-01T00:00:00Z',
          updatedAt: '2024-06-01T00:00:00Z',
        },
      ];

      renderComponent({
        assets,
        activeNisabRecord: activeRecord,
        payments,
      });

      expect(screen.queryByText('Zakat Payment Due')).not.toBeInTheDocument();
      expect(screen.getByText('Your Wealth at a Glance')).toBeInTheDocument();
    });
  });
});