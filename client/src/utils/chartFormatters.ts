/**
 * Chart Data Formatters
 * Utility functions for formatting data for Recharts visualization
 */

import type { AnalyticsMetricType } from '../../../shared/types/tracking';

export interface ChartDataPoint {
  [key: string]: string | number | Date;
}

/**
 * Format analytics data for chart consumption
 */
export function formatChartData(
  data: any,
  metricType: AnalyticsMetricType
): ChartDataPoint[] {
  if (!data || typeof data !== 'object') {
    return [];
  }

  // Handle different metric types
  switch (metricType) {
    case 'wealth_trend':
    case 'zakat_trend':
      return formatTrendData(data);
    
    case 'asset_composition':
      return formatCompositionData(data);
    
    case 'payment_distribution':
      return formatDistributionData(data);
    
    default:
      // Generic formatter for unknown types
      if (Array.isArray(data)) {
        return data;
      }
      return [data];
  }
}

/**
 * Format trend data (wealth/zakat over time)
 */
function formatTrendData(data: any): ChartDataPoint[] {
  if (Array.isArray(data.dataPoints)) {
    return data.dataPoints.map((point: any) => ({
      date: point.date || point.year || point.gregorianYear,
      value: point.value || point.amount || 0,
      year: point.gregorianYear || point.year,
      hijriYear: point.hijriYear,
      ...point
    }));
  }
  
  return [];
}

/**
 * Format composition data (asset breakdown)
 */
function formatCompositionData(data: any): ChartDataPoint[] {
  if (Array.isArray(data.categories)) {
    return data.categories.map((cat: any) => ({
      name: cat.name || cat.category,
      value: cat.amount || cat.value || 0,
      percentage: cat.percentage || 0,
      ...cat
    }));
  }
  
  return [];
}

/**
 * Format distribution data (payment categories)
 */
function formatDistributionData(data: any): ChartDataPoint[] {
  if (Array.isArray(data.distribution)) {
    return data.distribution.map((item: any) => ({
      name: item.category || item.type || item.name,
      value: item.amount || item.total || 0,
      count: item.count || 0,
      ...item
    }));
  }
  
  return [];
}

/**
 * Format data for multi-line charts
 */
export function formatMultiLineData(
  datasets: Array<{ name: string; data: any[] }>,
  xKey: string = 'date'
): ChartDataPoint[] {
  if (!datasets || datasets.length === 0) {
    return [];
  }

  // Merge multiple datasets by x-axis key
  const merged = new Map<string, ChartDataPoint>();

  datasets.forEach(({ name, data }) => {
    if (!Array.isArray(data)) return;

    data.forEach((point: any) => {
      const key = point[xKey];
      if (!key) return;

      const existing = merged.get(key) || { [xKey]: key };
      existing[name] = point.value || point.amount || 0;
      merged.set(key, existing);
    });
  });

  return Array.from(merged.values());
}

/**
 * Format percentage for display
 */
export function formatPercentageForChart(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}
