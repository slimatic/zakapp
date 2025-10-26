import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface AnalyticsData {
  totalPayments: number;
  totalAmount: number;
  monthlyTrends: Array<{ month: number; year: number; paymentCount: number; totalAmount: number }>;
  yearlyComparison: Array<{ year: number; totalAmount: number; paymentCount: number }>;
  categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>;
}

interface AnalyticsDashboardProps {
  data: AnalyticsData | null;
  isLoading: boolean;
  onExport?: (format: 'pdf' | 'csv') => void;
}

/**
 * AnalyticsDashboard Component
 * Comprehensive analytics dashboard with multiple visualization types
 * Shows wealth trends, Zakat giving patterns, and payment distributions
 */
export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = React.memo(({
  data,
  isLoading,
  onExport
}) => {
  // Memoize expensive currency formatting function
  const formatCurrency = useMemo(() => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    });
    return (amount: number) => formatter.format(amount);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No analytics data available</div>
        <div className="text-gray-400 text-sm mt-2">
          Start recording payments to see your giving patterns
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalPayments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(data.totalAmount)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.monthlyTrends.map(trend => (
              <div key={`${trend.month}-${trend.year}`} className="flex justify-between">
                <span>{trend.month}/{trend.year}</span>
                <span>{trend.paymentCount} payments - {formatCurrency(trend.totalAmount)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Year-over-Year Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Year-over-Year Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.yearlyComparison.map(comparison => (
              <div key={comparison.year} className="flex justify-between items-center">
                <span className="font-medium">{comparison.year}</span>
                <div className="text-right">
                  <div className="font-bold">{formatCurrency(comparison.totalAmount)}</div>
                  <div className="text-sm text-gray-500">{comparison.paymentCount} payments</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.categoryBreakdown.map(category => (
              <div key={category.category} className="flex justify-between items-center">
                <span className="capitalize">{category.category}</span>
                <div className="text-right">
                  <div className="font-bold">{formatCurrency(category.amount)}</div>
                  <div className="text-sm text-gray-500">{category.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});