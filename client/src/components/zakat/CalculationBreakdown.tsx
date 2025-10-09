/**
 * CalculationBreakdown Component
 * 
 * Displays a detailed breakdown of Zakat calculation by asset category
 * with visual progress bars and color-coded sections.
 */

import React from 'react';

export interface AssetBreakdown {
  type: string;
  category: string;
  totalValue: number;
  zakatableAmount: number;
  zakatDue: number;
  percentage: number;
  count: number;
}

export interface CalculationBreakdownProps {
  breakdown: AssetBreakdown[];
  totalAssets: number;
  totalZakat: number;
  currency?: string;
  methodology?: string;
  showPrintView?: boolean;
}

/**
 * Format currency with proper symbol and formatting
 */
const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Get color scheme for asset category
 */
const getCategoryColor = (category: string): { bg: string; border: string; text: string; bar: string } => {
  const colors: Record<string, { bg: string; border: string; text: string; bar: string }> = {
    'Cash & Savings': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', bar: 'bg-green-500' },
    'Gold': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', bar: 'bg-yellow-500' },
    'Silver': { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-800', bar: 'bg-gray-400' },
    'Stocks & Investments': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', bar: 'bg-blue-500' },
    'Cryptocurrency': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', bar: 'bg-purple-500' },
    'Business Assets': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', bar: 'bg-orange-500' },
    'Real Estate': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', bar: 'bg-red-500' },
    'Other': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', bar: 'bg-indigo-500' }
  };

  return colors[category] || colors['Other'];
};

/**
 * Get icon for asset category
 */
const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    'Cash & Savings': '💵',
    'Gold': '🥇',
    'Silver': '⚪',
    'Stocks & Investments': '📈',
    'Cryptocurrency': '₿',
    'Business Assets': '🏪',
    'Real Estate': '🏠',
    'Other': '📦'
  };

  return icons[category] || '📦';
};

export const CalculationBreakdown: React.FC<CalculationBreakdownProps> = ({
  breakdown,
  totalAssets,
  totalZakat,
  currency = 'USD',
  methodology = 'Standard',
  showPrintView = false
}) => {
  // Calculate percentages for visual display
  const maxZakat = Math.max(...breakdown.map(b => b.zakatDue));

  return (
    <div className={`space-y-6 ${showPrintView ? 'print:block' : ''}`}>
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xl font-semibold text-gray-900">Calculation Breakdown</h3>
        <p className="text-sm text-gray-600 mt-1">
          Detailed breakdown by asset category using {methodology} methodology
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-600">Total Assets</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            {formatCurrency(totalAssets, currency)}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {breakdown.reduce((sum, b) => sum + b.count, 0)} assets
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-600">Zakatable Amount</p>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {formatCurrency(breakdown.reduce((sum, b) => sum + b.zakatableAmount, 0), currency)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            {((breakdown.reduce((sum, b) => sum + b.zakatableAmount, 0) / totalAssets) * 100).toFixed(1)}% of total
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm font-medium text-purple-600">Total Zakat Due</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">
            {formatCurrency(totalZakat, currency)}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            2.5% of zakatable wealth
          </p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900">By Category</h4>
        
        {breakdown.map((item, index) => {
          const colors = getCategoryColor(item.category);
          const icon = getCategoryIcon(item.category);
          const barWidth = maxZakat > 0 ? (item.zakatDue / maxZakat) * 100 : 0;

          return (
            <div
              key={index}
              className={`border ${colors.border} ${colors.bg} rounded-lg p-4 transition-all hover:shadow-md print:break-inside-avoid`}
            >
              {/* Category Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl" role="img" aria-label={item.category}>
                    {icon}
                  </span>
                  <div>
                    <h5 className={`font-semibold ${colors.text}`}>
                      {item.category}
                    </h5>
                    <p className="text-xs text-gray-600">
                      {item.count} {item.count === 1 ? 'asset' : 'assets'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${colors.text}`}>
                    {formatCurrency(item.zakatDue, currency)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {item.percentage.toFixed(1)}% of total
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className={`${colors.bar} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: `${barWidth}%` }}
                    role="progressbar"
                    aria-valuenow={barWidth}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${item.category} Zakat contribution`}
                  ></div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-gray-600 text-xs">Total Value</p>
                  <p className={`font-semibold ${colors.text}`}>
                    {formatCurrency(item.totalValue, currency)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Zakatable</p>
                  <p className={`font-semibold ${colors.text}`}>
                    {formatCurrency(item.zakatableAmount, currency)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Rate</p>
                  <p className={`font-semibold ${colors.text}`}>
                    2.5%
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Zakat Due</p>
                  <p className={`font-semibold ${colors.text}`}>
                    {formatCurrency(item.zakatDue, currency)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Calculation Formula */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 print:break-inside-avoid">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Calculation Formula</h4>
        <div className="text-sm text-gray-700 space-y-1 font-mono">
          <p>Total Zakatable Wealth = {formatCurrency(breakdown.reduce((sum, b) => sum + b.zakatableAmount, 0), currency)}</p>
          <p>Zakat Rate = 2.5%</p>
          <p className="pt-2 border-t border-gray-300 font-semibold">
            Zakat Due = {formatCurrency(breakdown.reduce((sum, b) => sum + b.zakatableAmount, 0), currency)} × 0.025 = {formatCurrency(totalZakat, currency)}
          </p>
        </div>
      </div>

      {/* Print-only Footer */}
      {showPrintView && (
        <div className="hidden print:block text-sm text-gray-600 text-center border-t border-gray-200 pt-4">
          <p>Generated by ZakApp - Islamic Zakat Calculator</p>
          <p>Calculated on {new Date().toLocaleDateString()}</p>
          <p className="text-xs mt-2">
            Please consult with qualified Islamic scholars for specific guidance on your Zakat obligations.
          </p>
        </div>
      )}
    </div>
  );
};

export default CalculationBreakdown;
