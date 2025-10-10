import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';

interface TrendData {
  period: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  calculationCount: number;
  wealthTrend: Array<{
    date: string;
    wealth: number;
  }>;
  zakatTrend: Array<{
    date: string;
    zakat: number;
  }>;
  methodologyDistribution: Record<string, number>;
  averages: {
    wealth: number;
    zakat: number;
  };
  totals: {
    wealth: number;
    zakat: number;
  };
}

interface CalculationTrendsProps {
  userId?: string;
}

const METHODOLOGY_COLORS = {
  standard: '#3B82F6', // Blue
  hanafi: '#10B981',   // Green
  shafi: '#8B5CF6',    // Purple
  custom: '#6B7280'    // Gray
};

const METHODOLOGY_NAMES: Record<string, string> = {
  standard: 'Standard (AAOIFI)',
  hanafi: 'Hanafi',
  shafi: "Shafi'i",
  custom: 'Custom'
};

export const CalculationTrends: React.FC<CalculationTrendsProps> = () => {
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'1month' | '3months' | '6months' | '1year' | '2years' | 'all'>('1year');

  useEffect(() => {
    loadTrends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const loadTrends = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/calculations/trends/analysis?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load trend analysis');
      }

      const data = await response.json();

      if (data.success) {
        setTrends(data.trends);
      } else {
        throw new Error(data.message || 'Failed to load trends');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatCompactCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'MMM dd');
    } catch {
      return dateString;
    }
  };

  // Prepare data for charts
  const prepareCombinedTrendData = () => {
    if (!trends) return [];
    const wealthMap = new Map(trends.wealthTrend.map(item => [item.date, item.wealth]));
    const zakatMap = new Map(trends.zakatTrend.map(item => [item.date, item.zakat]));
    
    const allDates = new Set([...wealthMap.keys(), ...zakatMap.keys()]);
    
    return Array.from(allDates).sort().map(date => ({
      date: formatDate(date),
      wealth: wealthMap.get(date) || 0,
      zakat: zakatMap.get(date) || 0
    }));
  };

  const prepareMethodologyData = () => {
    if (!trends) return [];
    return Object.entries(trends.methodologyDistribution).map(([key, value]) => ({
      name: METHODOLOGY_NAMES[key] || key,
      value,
      color: METHODOLOGY_COLORS[key as keyof typeof METHODOLOGY_COLORS] || METHODOLOGY_COLORS.custom
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
        <button
          onClick={loadTrends}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!trends || trends.calculationCount === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          No trend data available
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Complete a few calculations to see your trends over time.
        </p>
      </div>
    );
  }

  const combinedData = prepareCombinedTrendData();
  const methodologyData = prepareMethodologyData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Calculation Trends
        </h2>
        
        {/* Period Selector */}
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value as typeof selectedPeriod)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="1month">Last Month</option>
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="1year">Last Year</option>
          <option value="2years">Last 2 Years</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Calculations</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {trends.calculationCount}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Average Wealth</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {formatCompactCurrency(trends.averages.wealth)}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Average Zakat</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
            {formatCompactCurrency(trends.averages.zakat)}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Zakat</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
            {formatCompactCurrency(trends.totals.zakat)}
          </p>
        </div>
      </div>

      {/* Combined Trend Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Wealth & Zakat Over Time
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={combinedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              tickFormatter={formatCompactCurrency}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
                color: '#F9FAFB'
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="wealth"
              name="Total Wealth"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="zakat"
              name="Zakat Due"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ fill: '#10B981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Methodology Distribution */}
      {methodologyData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Methodology Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={methodologyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {methodologyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Calculations by Methodology
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={methodologyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                  angle={-15}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    color: '#F9FAFB'
                  }}
                />
                <Bar dataKey="value" name="Calculations">
                  {methodologyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Data Table Alternative for Accessibility */}
      <details className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <summary className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer">
          View Data Table (Accessible Alternative)
        </summary>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Date
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                  Wealth
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                  Zakat
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {combinedData.map((row, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                    {row.date}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-white">
                    {formatCurrency(row.wealth)}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-green-600 dark:text-green-400">
                    {formatCurrency(row.zakat)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {/* Educational Note */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <svg
            className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Understanding Your Trends:</strong> These trends show how your wealth and Zakat obligations have changed over time. Regular tracking helps you plan for your annual Zakat payment and understand your financial growth.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculationTrends;
