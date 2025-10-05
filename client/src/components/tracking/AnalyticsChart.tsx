/**
 * AnalyticsChart Component - T064
 * Visualizes analytics data using Recharts with multiple chart types
 */

import React, { useMemo } from 'react';
import {
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  Line,
  Bar,
  Pie,
  Area,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useAnalytics } from '../../hooks/useAnalytics';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { formatCurrency, formatPercentage, formatCompactNumber } from '../../utils/formatters';
import { formatChartData } from '../../utils/chartFormatters';
import type { AnalyticsMetricType, VisualizationType } from '@zakapp/shared/types/tracking';

interface AnalyticsChartProps {
  metricType: AnalyticsMetricType;
  visualizationType?: VisualizationType;
  title?: string;
  height?: number;
  compact?: boolean;
  timeframe?: 'all' | 'last_year' | 'last_5_years';
}

// Chart color scheme
const CHART_COLORS = [
  '#10B981', // Green primary
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316'  // Orange
];

const PIE_COLORS = [
  '#10B981', '#059669', '#047857', '#065F46',
  '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF',
  '#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6'
];

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  metricType,
  visualizationType,
  title,
  height = 400,
  compact = false,
  timeframe = 'all'
}) => {
  const { data: analytics, isLoading, error } = useAnalytics(metricType, timeframe);

  // Format data for chart consumption
  const chartData = useMemo(() => {
    if (!analytics?.data) return [];
    return formatChartData(analytics.data, metricType);
  }, [analytics, metricType]);

  // Determine visualization type based on metric if not specified
  const chartType = useMemo((): VisualizationType => {
    if (visualizationType) return visualizationType;
    
    switch (metricType) {
      case 'wealth_trend':
      case 'zakat_trend':
        return 'line_chart';
      case 'payment_distribution':
      case 'asset_composition':
        return 'pie_chart';
      case 'yearly_comparison':
        return 'bar_chart';
      case 'nisab_compliance':
        return 'area_chart';
      case 'payment_consistency':
        return 'bar_chart';
      default:
        return 'line_chart';
    }
  }, [metricType, visualizationType]);

  // Custom tooltip formatter
  const formatTooltip = (value: any, name: string, props: any) => {
    if (metricType.includes('trend') || metricType === 'yearly_comparison') {
      return [formatCurrency(value), name];
    }
    if (metricType === 'payment_distribution' || metricType === 'asset_composition') {
      return [formatCurrency(value), name];
    }
    if (metricType === 'nisab_compliance') {
      return [formatPercentage(value / 100), name];
    }
    return [formatCompactNumber(value), name];
  };

  // Custom label formatter for X-axis
  const formatXAxisLabel = (value: any) => {
    if (metricType.includes('trend')) {
      // Assuming date format
      return new Date(value).getFullYear().toString();
    }
    return value;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center" style={{ height }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorMessage error={error} />
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-500" style={{ height }}>
        <svg className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 00-2 2h-2a2 2 0 00-2-2z" />
        </svg>
        <p className="text-center">
          No data available for {title || metricType.replace('_', ' ')}
        </p>
      </div>
    );
  }

  const renderChart = () => {
    const commonProps = {
      width: '100%',
      height,
      data: chartData,
      margin: compact ? { top: 5, right: 5, left: 5, bottom: 5 } : { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'line_chart':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="period" 
                tickFormatter={formatXAxisLabel}
                fontSize={compact ? 10 : 12}
              />
              <YAxis 
                tickFormatter={(value) => formatCompactNumber(value)}
                fontSize={compact ? 10 : 12}
              />
              <Tooltip formatter={formatTooltip} />
              {!compact && <Legend />}
              {Object.keys(chartData[0] || {}).filter(key => key !== 'period').map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: compact ? 3 : 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar_chart':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="period" 
                tickFormatter={formatXAxisLabel}
                fontSize={compact ? 10 : 12}
              />
              <YAxis 
                tickFormatter={(value) => formatCompactNumber(value)}
                fontSize={compact ? 10 : 12}
              />
              <Tooltip formatter={formatTooltip} />
              {!compact && <Legend />}
              {Object.keys(chartData[0] || {}).filter(key => key !== 'period').map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area_chart':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="period" 
                tickFormatter={formatXAxisLabel}
                fontSize={compact ? 10 : 12}
              />
              <YAxis 
                tickFormatter={(value) => formatCompactNumber(value)}
                fontSize={compact ? 10 : 12}
              />
              <Tooltip formatter={formatTooltip} />
              {!compact && <Legend />}
              {Object.keys(chartData[0] || {}).filter(key => key !== 'period').map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="1"
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie_chart':
        // Transform data for pie chart
        const pieData = Object.keys(chartData[0] || {})
          .filter(key => key !== 'period')
          .map((key, index) => ({
            name: key,
            value: chartData.reduce((sum: number, item: any) => {
              const val = item[key];
              return sum + (typeof val === 'number' ? val : 0);
            }, 0),
            fill: PIE_COLORS[index % PIE_COLORS.length]
          }));

        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={compact ? false : (entry: any) => {
                  const total = pieData.reduce((sum, item) => sum + item.value, 0);
                  const value = typeof entry.value === 'number' ? entry.value : 0;
                  return `${entry.name}: ${formatPercentage(value / total)}`;
                }}
                outerRadius={compact ? 80 : 100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [formatCurrency(typeof value === 'number' ? value : 0), 'Amount']} />
              {!compact && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${compact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      {!compact && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {title || metricType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </h3>
          {analytics?.metadata && (
            <p className="text-sm text-gray-600 mt-1">
              {analytics.metadata.period} • Last updated: {new Date(analytics.metadata.lastUpdated).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="w-full">
        {renderChart()}
      </div>

      {/* Summary Stats */}
      {analytics?.summary && !compact && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(analytics.summary).map(([key, value]: [string, any]) => (
              <div key={key} className="text-center">
                <div className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/_/g, ' ')}
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {typeof value === 'number' ? formatCurrency(value) : String(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart Controls */}
      {!compact && (
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Chart Type: {chartType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                // Export chart functionality would go here
                console.log('Export chart functionality not implemented yet');
              }}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Export Chart
            </button>
            <button
              onClick={() => window.print()}
              className="text-xs text-gray-600 hover:text-gray-700"
            >
              Print
            </button>
          </div>
        </div>
      )}
    </div>
  );
};