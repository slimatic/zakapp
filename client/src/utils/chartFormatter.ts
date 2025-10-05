/**
 * Chart Data Formatter Utility
 * Transforms tracking data into Recharts-compatible formats
 * Supports line charts, bar charts, pie charts, and area charts
 */

import { format } from 'date-fns';
import type { YearlySnapshot, PaymentRecord } from '@zakapp/shared/types/tracking';

/**
 * Data point for line/area charts (wealth or Zakat trends)
 */
export interface TimeSeriesDataPoint {
  date: string; // Formatted date for display
  timestamp: number; // Unix timestamp for sorting
  value: number; // Numeric value
  label?: string; // Optional label (e.g., year)
}

/**
 * Data point for bar charts (yearly comparison)
 */
export interface BarChartDataPoint {
  name: string; // Category name (e.g., "2023", "2024")
  value: number; // Numeric value
  label?: string; // Optional formatted label
  color?: string; // Optional custom color
}

/**
 * Data point for pie charts (payment distribution)
 */
export interface PieChartDataPoint {
  name: string; // Category name
  value: number; // Numeric value
  percentage: number; // Percentage of total
  color?: string; // Optional custom color
}

/**
 * Data point for multi-series charts
 */
export interface MultiSeriesDataPoint {
  date: string; // X-axis label
  [key: string]: string | number; // Dynamic series values
}

/**
 * Color palette for Islamic recipient categories
 */
export const CATEGORY_COLORS: Record<string, string> = {
  fakir: '#10b981', // Green
  miskin: '#3b82f6', // Blue
  amil: '#8b5cf6', // Purple
  muallaf: '#f59e0b', // Amber
  riqab: '#ef4444', // Red
  gharimin: '#ec4899', // Pink
  fisabilillah: '#14b8a6', // Teal
  ibnus_sabil: '#6366f1' // Indigo
};

/**
 * Formats yearly snapshots as time series data for wealth trends
 * @param snapshots - Array of yearly snapshots
 * @returns Array of time series data points
 */
export function formatWealthTrend(snapshots: YearlySnapshot[]): TimeSeriesDataPoint[] {
  return snapshots
    .sort((a, b) => new Date(a.calculationDate).getTime() - new Date(b.calculationDate).getTime())
    .map(snapshot => ({
      date: format(new Date(snapshot.calculationDate), 'MMM yyyy'),
      timestamp: new Date(snapshot.calculationDate).getTime(),
      value: snapshot.totalWealth,
      label: `${snapshot.gregorianYear}`
    }));
}

/**
 * Formats yearly snapshots as time series data for Zakat trends
 * @param snapshots - Array of yearly snapshots
 * @returns Array of time series data points
 */
export function formatZakatTrend(snapshots: YearlySnapshot[]): TimeSeriesDataPoint[] {
  return snapshots
    .sort((a, b) => new Date(a.calculationDate).getTime() - new Date(b.calculationDate).getTime())
    .map(snapshot => ({
      date: format(new Date(snapshot.calculationDate), 'MMM yyyy'),
      timestamp: new Date(snapshot.calculationDate).getTime(),
      value: snapshot.zakatAmount,
      label: `${snapshot.gregorianYear}`
    }));
}

/**
 * Formats payment records as pie chart data by recipient category
 * @param payments - Array of payment records
 * @returns Array of pie chart data points
 */
export function formatPaymentDistribution(payments: PaymentRecord[]): PieChartDataPoint[] {
  const categoryTotals: Record<string, number> = {};
  let totalAmount = 0;

  // Calculate totals per category
  payments.forEach(payment => {
    const category = payment.recipientType;
    categoryTotals[category] = (categoryTotals[category] || 0) + payment.amount;
    totalAmount += payment.amount;
  });

  // Convert to pie chart format
  return Object.entries(categoryTotals).map(([category, amount]) => ({
    name: formatCategoryName(category),
    value: amount,
    percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
    color: CATEGORY_COLORS[category] || '#6b7280'
  }));
}

/**
 * Formats snapshots as bar chart data for yearly comparison
 * @param snapshots - Array of yearly snapshots
 * @param metric - Which metric to display ('wealth' | 'zakat' | 'nisab')
 * @returns Array of bar chart data points
 */
export function formatYearlyComparison(
  snapshots: YearlySnapshot[],
  metric: 'wealth' | 'zakat' | 'nisab' = 'wealth'
): BarChartDataPoint[] {
  return snapshots
    .sort((a, b) => a.gregorianYear - b.gregorianYear)
    .map(snapshot => {
      let value: number;
      switch (metric) {
        case 'wealth':
          value = snapshot.totalWealth;
          break;
        case 'zakat':
          value = snapshot.zakatAmount;
          break;
        case 'nisab':
          value = snapshot.nisabThreshold;
          break;
        default:
          value = snapshot.totalWealth;
      }

      return {
        name: `${snapshot.gregorianYear}`,
        value,
        label: format(new Date(snapshot.calculationDate), 'MMM yyyy')
      };
    });
}

/**
 * Formats snapshots as multi-series data for comparing wealth vs Zakat
 * @param snapshots - Array of yearly snapshots
 * @returns Array of multi-series data points
 */
export function formatWealthVsZakat(snapshots: YearlySnapshot[]): MultiSeriesDataPoint[] {
  return snapshots
    .sort((a, b) => new Date(a.calculationDate).getTime() - new Date(b.calculationDate).getTime())
    .map(snapshot => ({
      date: format(new Date(snapshot.calculationDate), 'MMM yyyy'),
      wealth: snapshot.totalWealth,
      zakat: snapshot.zakatAmount,
      year: snapshot.gregorianYear
    }));
}

/**
 * Formats asset breakdown as pie chart data
 * @param assetBreakdown - Asset breakdown object from snapshot
 * @returns Array of pie chart data points
 */
export function formatAssetComposition(
  assetBreakdown: Record<string, number> | undefined
): PieChartDataPoint[] {
  if (!assetBreakdown || Object.keys(assetBreakdown).length === 0) {
    return [];
  }

  const totalValue = Object.values(assetBreakdown).reduce((sum, val) => sum + val, 0);

  return Object.entries(assetBreakdown).map(([assetType, value]) => ({
    name: formatAssetTypeName(assetType),
    value,
    percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
  }));
}

/**
 * Formats payment completion data as bar chart
 * @param snapshots - Array of yearly snapshots with payment info
 * @param payments - Array of all payment records
 * @returns Array of bar chart data points showing paid vs due
 */
export function formatPaymentCompletion(
  snapshots: YearlySnapshot[],
  payments: Record<string, PaymentRecord[]>
): BarChartDataPoint[] {
  return snapshots
    .sort((a, b) => a.gregorianYear - b.gregorianYear)
    .map(snapshot => {
      const snapshotPayments = payments[snapshot.id] || [];
      const totalPaid = snapshotPayments.reduce((sum, p) => sum + p.amount, 0);
      const percentagePaid = snapshot.zakatAmount > 0 
        ? (totalPaid / snapshot.zakatAmount) * 100 
        : 0;

      return {
        name: `${snapshot.gregorianYear}`,
        value: percentagePaid,
        label: `${percentagePaid.toFixed(1)}% paid`
      };
    });
}

/**
 * Formats snapshots for area chart with zakatable vs non-zakatable wealth
 * @param snapshots - Array of yearly snapshots
 * @returns Array of multi-series data points
 */
export function formatZakatableBreakdown(snapshots: YearlySnapshot[]): MultiSeriesDataPoint[] {
  return snapshots
    .sort((a, b) => new Date(a.calculationDate).getTime() - new Date(b.calculationDate).getTime())
    .map(snapshot => ({
      date: format(new Date(snapshot.calculationDate), 'MMM yyyy'),
      zakatable: snapshot.zakatableWealth,
      nonZakatable: snapshot.totalWealth - snapshot.zakatableWealth,
      year: snapshot.gregorianYear
    }));
}

/**
 * Calculates growth rate between consecutive data points
 * @param dataPoints - Array of time series data points
 * @returns Array with added growthRate property
 */
export function calculateGrowthRates(
  dataPoints: TimeSeriesDataPoint[]
): (TimeSeriesDataPoint & { growthRate?: number })[] {
  return dataPoints.map((point, index) => {
    if (index === 0) {
      return { ...point, growthRate: undefined };
    }

    const previousValue = dataPoints[index - 1].value;
    const growthRate = previousValue > 0 
      ? ((point.value - previousValue) / previousValue) * 100 
      : 0;

    return {
      ...point,
      growthRate: parseFloat(growthRate.toFixed(2))
    };
  });
}

/**
 * Formats category name for display
 * @param category - Internal category name
 * @returns Formatted display name
 */
export function formatCategoryName(category: string): string {
  const displayNames: Record<string, string> = {
    fakir: 'The Poor (Fakir)',
    miskin: 'The Needy (Miskin)',
    amil: 'Zakat Administrators (Amil)',
    muallaf: 'New Muslims (Muallaf)',
    riqab: 'Freeing Slaves (Riqab)',
    gharimin: 'Debtors (Gharimin)',
    fisabilillah: "In Allah's Cause (Fisabilillah)",
    ibnus_sabil: 'Travelers (Ibnus Sabil)'
  };

  return displayNames[category] || category;
}

/**
 * Formats asset type name for display
 * @param assetType - Internal asset type
 * @returns Formatted display name
 */
export function formatAssetTypeName(assetType: string): string {
  const displayNames: Record<string, string> = {
    cash: 'Cash & Bank',
    gold: 'Gold',
    silver: 'Silver',
    crypto: 'Cryptocurrency',
    business: 'Business Assets',
    investment: 'Investments',
    real_estate: 'Real Estate',
    other: 'Other Assets'
  };

  return displayNames[assetType] || assetType.replace(/_/g, ' ');
}

/**
 * Aggregates data by time period (month, quarter, year)
 * @param dataPoints - Array of time series data points
 * @param period - Aggregation period
 * @returns Aggregated data points
 */
export function aggregateByPeriod(
  dataPoints: TimeSeriesDataPoint[],
  period: 'month' | 'quarter' | 'year'
): TimeSeriesDataPoint[] {
  const grouped: Record<string, TimeSeriesDataPoint[]> = {};

  dataPoints.forEach(point => {
    const date = new Date(point.timestamp);
    let key: string;

    switch (period) {
      case 'month':
        key = format(date, 'yyyy-MM');
        break;
      case 'quarter':
        key = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
        break;
      case 'year':
        key = `${date.getFullYear()}`;
        break;
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(point);
  });

  return Object.entries(grouped).map(([key, points]) => {
    const avgValue = points.reduce((sum, p) => sum + p.value, 0) / points.length;
    return {
      date: key,
      timestamp: points[0].timestamp,
      value: parseFloat(avgValue.toFixed(2)),
      label: key
    };
  });
}

/**
 * Filters data points by date range
 * @param dataPoints - Array of time series data points
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns Filtered data points
 */
export function filterByDateRange(
  dataPoints: TimeSeriesDataPoint[],
  startDate: Date,
  endDate: Date
): TimeSeriesDataPoint[] {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  return dataPoints.filter(
    point => point.timestamp >= startTime && point.timestamp <= endTime
  );
}
