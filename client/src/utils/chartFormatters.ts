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
 * Chart Data Formatters
 * Utility functions for formatting data for Recharts visualization
 */

import type { AnalyticsMetricType } from '@zakapp/shared/types/tracking';

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
  if (!data) {
    return [];
  }
  
  // Parse JSON string if needed
  let parsedData = data;
  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      console.error('[ChartFormatter] Failed to parse data:', e);
      return [];
    }
  }
  
  if (typeof parsedData !== 'object') {
    return [];
  }

  // Handle different metric types
  switch (metricType) {
    case 'wealth_trend':
    case 'zakat_trend':
      return formatTrendData(parsedData);
    
    case 'asset_composition':
      return formatCompositionData(parsedData);
    
    case 'payment_distribution':
      return formatDistributionData(parsedData);
    
    default:
      // Generic formatter for unknown types
      if (Array.isArray(parsedData)) {
        return parsedData;
      }
      return [parsedData];
  }
}

/**
 * Format trend data (wealth/zakat over time)
 */
function formatTrendData(data: any): ChartDataPoint[] {
  // Handle data.trend array from backend analytics service
  const trendArray = data.trend || data.dataPoints || [];
  
  console.log(`[ChartFormatter] formatTrendData - trendArray:`, trendArray);
  
  if (!Array.isArray(trendArray) || trendArray.length === 0) {
    console.log(`[ChartFormatter] formatTrendData - No trend data found`);
    return [];
  }

  const formatted = trendArray.map((point: any) => {
    const formattedPoint: ChartDataPoint = {
      period: point.year?.toString() || new Date(point.date).getFullYear().toString(),
    };

    // Add wealth data if present (wealth_trend)
    if (point.totalWealth !== undefined) {
      formattedPoint['Total Wealth'] = parseFloat(point.totalWealth) || 0;
    }
    if (point.zakatableWealth !== undefined) {
      formattedPoint['Zakatable Wealth'] = parseFloat(point.zakatableWealth) || 0;
    }

    // Add zakat data if present (zakat_trend)
    if (point.zakatAmount !== undefined) {
      formattedPoint['Zakat Due'] = parseFloat(point.zakatAmount) || 0;
    }
    if (point.nisabThreshold !== undefined) {
      formattedPoint['Nisab Threshold'] = parseFloat(point.nisabThreshold) || 0;
    }

    return formattedPoint;
  });
  
  console.log(`[ChartFormatter] formatTrendData - formatted:`, formatted);
  return formatted;
}

/**
 * Format composition data (asset breakdown)
 */
function formatCompositionData(data: any): ChartDataPoint[] {
  // Handle composition array from backend
  const compositionArray = data.composition || data.categories || [];
  
  if (!Array.isArray(compositionArray) || compositionArray.length === 0) {
    return [];
  }

  // Get the most recent composition data
  const latest = compositionArray[compositionArray.length - 1];
  if (!latest || !latest.breakdown) {
    return [];
  }

  // Extract asset categories from breakdown
  const breakdown = latest.breakdown;
  if (!breakdown.assets || !Array.isArray(breakdown.assets)) {
    return [];
  }

  // Group by category and sum values
  const categoryMap = new Map<string, number>();
  breakdown.assets.forEach((asset: any) => {
    const category = asset.category || 'other';
    const value = parseFloat(asset.value) || 0;
    categoryMap.set(category, (categoryMap.get(category) || 0) + value);
  });

  return Array.from(categoryMap.entries()).map(([name, value]) => ({
    period: name,
    [name]: value
  }));
}

/**
 * Format distribution data (payment categories)
 */
function formatDistributionData(data: any): ChartDataPoint[] {
  const distributionArray = data.distribution || [];
  
  if (!Array.isArray(distributionArray) || distributionArray.length === 0) {
    return [];
  }

  return distributionArray.map((item: any) => {
    const category = item.category || item.type || item.name || 'Unknown';
    const amount = item.totalAmount || item.amount || item.total || 0;
    
    return {
      period: category,
      [category]: parseFloat(amount) || 0
    };
  });
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
