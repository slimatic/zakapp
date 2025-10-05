import type { Meta, StoryObj } from '@storybook/react';
import { AnalyticsChart } from './AnalyticsChart';

/**
 * AnalyticsChart Component Stories
 * 
 * The AnalyticsChart component displays Zakat trends and wealth analytics
 * using Recharts with support for multiple chart types.
 */
const meta = {
  title: 'Tracking/AnalyticsChart',
  component: AnalyticsChart,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive charts for visualizing Zakat trends, wealth growth, and payment distribution.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['line', 'bar', 'area', 'pie'],
      description: 'Chart type',
    },
    data: {
      control: 'object',
      description: 'Chart data array',
    },
    title: {
      control: 'text',
      description: 'Chart title',
    },
  },
} satisfies Meta<typeof AnalyticsChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Wealth Trend Line Chart
 * Multi-year wealth growth visualization
 */
export const WealthTrend: Story = {
  args: {
    type: 'line',
    title: 'Wealth Growth Over Time',
    data: [
      { year: '2022', wealth: 100000, zakatableWealth: 90000, liabilities: 10000 },
      { year: '2023', wealth: 125000, zakatableWealth: 110000, liabilities: 15000 },
      { year: '2024', wealth: 150000, zakatableWealth: 130000, liabilities: 20000 },
    ],
    xKey: 'year',
    yKeys: [
      { key: 'wealth', name: 'Total Wealth', color: '#10b981' },
      { key: 'zakatableWealth', name: 'Zakatable Wealth', color: '#3b82f6' },
      { key: 'liabilities', name: 'Liabilities', color: '#ef4444' },
    ],
  },
};

/**
 * Zakat Due Bar Chart
 * Yearly Zakat obligations comparison
 */
export const ZakatDue: Story = {
  args: {
    type: 'bar',
    title: 'Zakat Due by Year',
    data: [
      { year: '2022', zakatDue: 2500, paid: 2500, remaining: 0 },
      { year: '2023', zakatDue: 3125, paid: 3000, remaining: 125 },
      { year: '2024', zakatDue: 3750, paid: 2000, remaining: 1750 },
    ],
    xKey: 'year',
    yKeys: [
      { key: 'paid', name: 'Paid', color: '#10b981', stackId: 'zakat' },
      { key: 'remaining', name: 'Remaining', color: '#f59e0b', stackId: 'zakat' },
    ],
  },
};

/**
 * Payment Distribution Pie Chart
 * Breakdown by recipient category
 */
export const PaymentDistribution: Story = {
  args: {
    type: 'pie',
    title: 'Payment Distribution by Category',
    data: [
      { name: 'Al-Fuqara (The Poor)', value: 1000, category: 'fakir' },
      { name: 'Al-Masakin (The Needy)', value: 1500, category: 'miskin' },
      { name: 'Fi Sabilillah (Cause of Allah)', value: 750, category: 'fisabilillah' },
      { name: 'Al-Gharimin (In Debt)', value: 500, category: 'gharim' },
      { name: 'Ibn as-Sabil (Travelers)', value: 250, category: 'ibnsabil' },
    ],
    valueKey: 'value',
    nameKey: 'name',
  },
};

/**
 * Area Chart - Wealth Accumulation
 * Cumulative wealth growth over time
 */
export const WealthAccumulation: Story = {
  args: {
    type: 'area',
    title: 'Wealth Accumulation',
    data: [
      { year: '2020', wealth: 50000 },
      { year: '2021', wealth: 75000 },
      { year: '2022', wealth: 100000 },
      { year: '2023', wealth: 125000 },
      { year: '2024', wealth: 150000 },
    ],
    xKey: 'year',
    yKeys: [
      { key: 'wealth', name: 'Total Wealth', color: '#3b82f6' },
    ],
  },
};

/**
 * Monthly Payment Timeline
 * Payment activity throughout the year
 */
export const MonthlyPayments: Story = {
  args: {
    type: 'bar',
    title: 'Monthly Payment Activity',
    data: [
      { month: 'Jan', payments: 0, count: 0 },
      { month: 'Feb', payments: 1000, count: 1 },
      { month: 'Mar', payments: 0, count: 0 },
      { month: 'Apr', payments: 1500, count: 2 },
      { month: 'May', payments: 0, count: 0 },
      { month: 'Jun', payments: 750, count: 1 },
      { month: 'Jul', payments: 0, count: 0 },
      { month: 'Aug', payments: 0, count: 0 },
      { month: 'Sep', payments: 500, count: 1 },
      { month: 'Oct', payments: 0, count: 0 },
      { month: 'Nov', payments: 0, count: 0 },
      { month: 'Dec', payments: 0, count: 0 },
    ],
    xKey: 'month',
    yKeys: [
      { key: 'payments', name: 'Amount Paid', color: '#10b981' },
    ],
  },
};

/**
 * Empty State
 * Chart with no data
 */
export const EmptyState: Story = {
  args: {
    type: 'line',
    title: 'Wealth Trend',
    data: [],
    emptyMessage: 'No data available. Create your first snapshot to see analytics.',
  },
};

/**
 * Loading State
 * Chart in loading state
 */
export const Loading: Story = {
  args: {
    type: 'line',
    title: 'Wealth Trend',
    isLoading: true,
  },
};

/**
 * Multi-Line Comparison
 * Comparing multiple metrics
 */
export const MultiLineComparison: Story = {
  args: {
    type: 'line',
    title: 'Financial Metrics Comparison',
    data: [
      { year: '2022', wealth: 100000, zakat: 2500, payments: 2500, assets: 110000 },
      { year: '2023', wealth: 125000, zakat: 3125, payments: 3000, assets: 140000 },
      { year: '2024', wealth: 150000, zakat: 3750, payments: 2000, assets: 170000 },
    ],
    xKey: 'year',
    yKeys: [
      { key: 'wealth', name: 'Wealth', color: '#3b82f6' },
      { key: 'zakat', name: 'Zakat Due', color: '#10b981' },
      { key: 'payments', name: 'Payments', color: '#8b5cf6' },
      { key: 'assets', name: 'Total Assets', color: '#f59e0b' },
    ],
  },
};
