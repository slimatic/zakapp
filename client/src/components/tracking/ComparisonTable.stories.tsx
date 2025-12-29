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
import { ComparisonTable } from './ComparisonTable';

/**
 * ComparisonTable Component Stories
 * 
 * The ComparisonTable component displays side-by-side comparison of multiple
 * yearly snapshots with trend indicators and percentage changes.
 */
const meta = {
  title: 'Tracking/ComparisonTable',
  component: ComparisonTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive table for comparing multiple yearly snapshots with trend analysis and insights.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ComparisonTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Two-Year Comparison
 * Comparing two consecutive years
 */
export const TwoYears: Story = {
  args: {
    snapshots: [
      {
        id: 'snap_2023',
        year: 2023,
        hijriYear: 1445,
        totalWealth: 125000,
        totalLiabilities: 15000,
        zakatableWealth: 110000,
        zakatDue: 2750,
        methodology: 'standard',
      },
      {
        id: 'snap_2024',
        year: 2024,
        hijriYear: 1446,
        totalWealth: 150000,
        totalLiabilities: 20000,
        zakatableWealth: 130000,
        zakatDue: 3250,
        methodology: 'standard',
      },
    ],
  },
};

/**
 * Three-Year Comparison
 * Comparing three consecutive years
 */
export const ThreeYears: Story = {
  args: {
    snapshots: [
      {
        id: 'snap_2022',
        year: 2022,
        hijriYear: 1444,
        totalWealth: 100000,
        totalLiabilities: 10000,
        zakatableWealth: 90000,
        zakatDue: 2250,
        methodology: 'standard',
      },
      {
        id: 'snap_2023',
        year: 2023,
        hijriYear: 1445,
        totalWealth: 125000,
        totalLiabilities: 15000,
        zakatableWealth: 110000,
        zakatDue: 2750,
        methodology: 'standard',
      },
      {
        id: 'snap_2024',
        year: 2024,
        hijriYear: 1446,
        totalWealth: 150000,
        totalLiabilities: 20000,
        zakatableWealth: 130000,
        zakatDue: 3250,
        methodology: 'standard',
      },
    ],
  },
};

/**
 * Five-Year Comparison
 * Maximum comparison view
 */
export const FiveYears: Story = {
  args: {
    snapshots: [
      { id: 'snap_2020', year: 2020, hijriYear: 1442, totalWealth: 60000, totalLiabilities: 5000, zakatableWealth: 55000, zakatDue: 1375, methodology: 'standard' },
      { id: 'snap_2021', year: 2021, hijriYear: 1443, totalWealth: 80000, totalLiabilities: 8000, zakatableWealth: 72000, zakatDue: 1800, methodology: 'standard' },
      { id: 'snap_2022', year: 2022, hijriYear: 1444, totalWealth: 100000, totalLiabilities: 10000, zakatableWealth: 90000, zakatDue: 2250, methodology: 'standard' },
      { id: 'snap_2023', year: 2023, hijriYear: 1445, totalWealth: 125000, totalLiabilities: 15000, zakatableWealth: 110000, zakatDue: 2750, methodology: 'standard' },
      { id: 'snap_2024', year: 2024, hijriYear: 1446, totalWealth: 150000, totalLiabilities: 20000, zakatableWealth: 130000, zakatDue: 3250, methodology: 'standard' },
    ],
  },
};

/**
 * With Declining Wealth
 * Showing negative growth trend
 */
export const DecliningWealth: Story = {
  args: {
    snapshots: [
      {
        id: 'snap_2022',
        year: 2022,
        hijriYear: 1444,
        totalWealth: 150000,
        totalLiabilities: 20000,
        zakatableWealth: 130000,
        zakatDue: 3250,
        methodology: 'standard',
      },
      {
        id: 'snap_2023',
        year: 2023,
        hijriYear: 1445,
        totalWealth: 120000,
        totalLiabilities: 15000,
        zakatableWealth: 105000,
        zakatDue: 2625,
        methodology: 'standard',
      },
      {
        id: 'snap_2024',
        year: 2024,
        hijriYear: 1446,
        totalWealth: 100000,
        totalLiabilities: 10000,
        zakatableWealth: 90000,
        zakatDue: 2250,
        methodology: 'standard',
      },
    ],
  },
};

/**
 * Different Methodologies
 * Comparing snapshots with different calculation methods
 */
export const DifferentMethodologies: Story = {
  args: {
    snapshots: [
      {
        id: 'snap_2022',
        year: 2022,
        hijriYear: 1444,
        totalWealth: 100000,
        totalLiabilities: 10000,
        zakatableWealth: 90000,
        zakatDue: 2250,
        methodology: 'standard',
        nisabType: 'gold',
        nisabThreshold: 85000,
      },
      {
        id: 'snap_2023',
        year: 2023,
        hijriYear: 1445,
        totalWealth: 100000,
        totalLiabilities: 10000,
        zakatableWealth: 90000,
        zakatDue: 2250,
        methodology: 'hanafi',
        nisabType: 'silver',
        nisabThreshold: 5000,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Comparison showing different calculation methodologies (Standard vs Hanafi) and nisab types (gold vs silver).',
      },
    },
  },
};

/**
 * With Insights
 * Table with generated insights
 */
export const WithInsights: Story = {
  args: {
    snapshots: [
      {
        id: 'snap_2023',
        year: 2023,
        hijriYear: 1445,
        totalWealth: 100000,
        totalLiabilities: 10000,
        zakatableWealth: 90000,
        zakatDue: 2250,
        methodology: 'standard',
      },
      {
        id: 'snap_2024',
        year: 2024,
        hijriYear: 1446,
        totalWealth: 150000,
        totalLiabilities: 20000,
        zakatableWealth: 130000,
        zakatDue: 3250,
        methodology: 'standard',
      },
    ],
    insights: [
      {
        type: 'positive',
        title: 'Wealth Growth',
        message: 'Your wealth increased by 50% over 1 year',
        icon: '📈',
      },
      {
        type: 'warning',
        title: 'Liabilities Increased',
        message: 'Liabilities doubled from $10,000 to $20,000',
        icon: '⚠️',
      },
      {
        type: 'info',
        title: 'Zakat Proportional',
        message: 'Zakat increased proportionally with wealth',
        icon: 'ℹ️',
      },
    ],
  },
};

/**
 * Loading State
 * Table in loading state
 */
export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

/**
 * Empty State
 * No snapshots to compare
 */
export const EmptyState: Story = {
  args: {
    snapshots: [],
    emptyMessage: 'Select at least 2 snapshots to compare',
  },
};
