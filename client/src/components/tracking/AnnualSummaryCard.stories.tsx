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

import type { Meta, StoryObj } from '@storybook/react';
import { AnnualSummaryCard } from './AnnualSummaryCard';

/**
 * AnnualSummaryCard Component Stories
 * 
 * The AnnualSummaryCard component displays a summary of Zakat obligations
 * and payments for a specific year with visual progress indicators.
 */
const meta = {
  title: 'Tracking/AnnualSummaryCard',
  component: AnnualSummaryCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Card component displaying annual Zakat summary with payment progress and category breakdown.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AnnualSummaryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Fully Paid
 * All Zakat paid for the year
 */
export const FullyPaid: Story = {
  args: {
    year: 2024,
    hijriYear: 1446,
    zakatDue: 3250,
    totalPayments: 3250,
    paymentCount: 5,
    categoryBreakdown: {
      fakir: 1000,
      miskin: 1500,
      fisabilillah: 750,
    },
    snapshotId: 'snap_1234567890abcdef',
  },
};

/**
 * Partially Paid
 * Some Zakat paid, some remaining
 */
export const PartiallyPaid: Story = {
  args: {
    year: 2024,
    hijriYear: 1446,
    zakatDue: 3250,
    totalPayments: 2000,
    paymentCount: 3,
    categoryBreakdown: {
      fakir: 1000,
      miskin: 1000,
    },
    snapshotId: 'snap_1234567890abcdef',
  },
};

/**
 * No Payments Yet
 * Zakat due but no payments recorded
 */
export const NoPayments: Story = {
  args: {
    year: 2024,
    hijriYear: 1446,
    zakatDue: 3250,
    totalPayments: 0,
    paymentCount: 0,
    categoryBreakdown: {},
    snapshotId: 'snap_1234567890abcdef',
  },
};

/**
 * All Categories
 * Payments distributed across all 8 categories
 */
export const AllCategories: Story = {
  args: {
    year: 2024,
    hijriYear: 1446,
    zakatDue: 8000,
    totalPayments: 8000,
    paymentCount: 8,
    categoryBreakdown: {
      fakir: 1200,
      miskin: 1500,
      amil: 800,
      muallaf: 600,
      riqab: 700,
      gharim: 1000,
      fisabilillah: 1500,
      ibnsabil: 700,
    },
    snapshotId: 'snap_1234567890abcdef',
  },
};

/**
 * High Zakat Amount
 * Large Zakat obligation
 */
export const HighAmount: Story = {
  args: {
    year: 2024,
    hijriYear: 1446,
    zakatDue: 25000,
    totalPayments: 18000,
    paymentCount: 12,
    categoryBreakdown: {
      fakir: 5000,
      miskin: 6000,
      fisabilillah: 4000,
      gharim: 3000,
    },
    snapshotId: 'snap_1234567890abcdef',
  },
};

/**
 * Nearly Complete
 * Almost all Zakat paid
 */
export const NearlyComplete: Story = {
  args: {
    year: 2024,
    hijriYear: 1446,
    zakatDue: 3250,
    totalPayments: 3200,
    paymentCount: 6,
    categoryBreakdown: {
      fakir: 1000,
      miskin: 1500,
      fisabilillah: 700,
    },
    snapshotId: 'snap_1234567890abcdef',
  },
};

/**
 * With Notes
 * Card with additional notes
 */
export const WithNotes: Story = {
  args: {
    year: 2024,
    hijriYear: 1446,
    zakatDue: 3250,
    totalPayments: 2500,
    paymentCount: 4,
    categoryBreakdown: {
      fakir: 1000,
      miskin: 1000,
      fisabilillah: 500,
    },
    notes: 'Paid through local Islamic center. Receipt references: RCP-2024-001 through RCP-2024-004.',
    snapshotId: 'snap_1234567890abcdef',
  },
};

/**
 * Loading State
 * Card in loading state
 */
export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

/**
 * Compact View
 * Minimal card layout
 */
export const Compact: Story = {
  args: {
    year: 2024,
    hijriYear: 1446,
    zakatDue: 3250,
    totalPayments: 2000,
    paymentCount: 3,
    categoryBreakdown: {
      fakir: 1000,
      miskin: 1000,
    },
    variant: 'compact',
    snapshotId: 'snap_1234567890abcdef',
  },
};
