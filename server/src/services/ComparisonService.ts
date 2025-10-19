import { YearlySnapshotModel } from '../models/YearlySnapshot';
import { PaymentRecordModel } from '../models/PaymentRecord';
import { EncryptionService } from './EncryptionService';
import { YearlySnapshot } from '@zakapp/shared/types/tracking';

/**
 * ComparisonService - Business logic for multi-snapshot analysis
 * Handles trend detection and comparative analytics across years
 */
export class ComparisonService {
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || '';
    if (!this.encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
  }

  /**
   * Compares multiple snapshots and provides analysis
   * @param snapshotIds - Array of snapshot IDs to compare
   * @param userId - User ID for authorization
   * @returns Comparison analysis
   */
  async compareSnapshots(
    snapshotIds: string[],
    userId: string
  ): Promise<{
    snapshots: YearlySnapshot[];
    wealthTrend: 'increasing' | 'decreasing' | 'stable';
    zakatTrend: 'increasing' | 'decreasing' | 'stable';
    averageGrowthRate: number;
    totalWealth: {
      min: number;
      max: number;
      average: number;
      current: number;
    };
    totalZakat: {
      min: number;
      max: number;
      average: number;
      current: number;
    };
    insights: string[];
  }> {
    if (snapshotIds.length < 2) {
      throw new Error('At least 2 snapshots are required for comparison');
    }

    // Fetch all snapshots
    const snapshots: YearlySnapshot[] = [];
    for (const id of snapshotIds) {
      const snapshot = await YearlySnapshotModel.findById(id, userId);
      if (!snapshot) {
        throw new Error(`Snapshot ${id} not found`);
      }
      snapshots.push(snapshot);
    }

    // Sort by year
    snapshots.sort((a, b) => a.gregorianYear - b.gregorianYear);

    // Calculate wealth trend
    const wealthValues = snapshots.map(s => s.totalWealth);
    const wealthTrend = this.calculateTrend(wealthValues);

    // Calculate zakat trend
    const zakatValues = snapshots.map(s => s.zakatAmount);
    const zakatTrend = this.calculateTrend(zakatValues);

    // Calculate growth rate
    const firstWealth = snapshots[0].totalWealth;
    const lastWealth = snapshots[snapshots.length - 1].totalWealth;
    const years = snapshots[snapshots.length - 1].gregorianYear - snapshots[0].gregorianYear;
    const averageGrowthRate = years > 0
      ? ((lastWealth - firstWealth) / firstWealth / years) * 100
      : 0;

    // Calculate statistics
    const totalWealth = {
      min: Math.min(...wealthValues),
      max: Math.max(...wealthValues),
      average: wealthValues.reduce((sum, v) => sum + v, 0) / wealthValues.length,
      current: lastWealth
    };

    const totalZakat = {
      min: Math.min(...zakatValues),
      max: Math.max(...zakatValues),
      average: zakatValues.reduce((sum, v) => sum + v, 0) / zakatValues.length,
      current: snapshots[snapshots.length - 1].zakatAmount
    };

    // Generate insights
    const insights = this.generateInsights(snapshots, wealthTrend, zakatTrend, averageGrowthRate);

    return {
      snapshots,
      wealthTrend,
      zakatTrend,
      averageGrowthRate,
      totalWealth,
      totalZakat,
      insights
    };
  }

  /**
   * Compares all available years for a user
   * @param userId - User ID
   * @returns Year-over-year comparison
   */
  async compareAllYears(userId: string): Promise<{
    years: number[];
    data: Array<{
      year: number;
      totalWealth: number;
      zakatableWealth: number;
      zakatAmount: number;
      nisabThreshold: number;
      totalPaid: number;
      paymentCount: number;
      wealthChangeFromPrevious?: number;
      zakatChangeFromPrevious?: number;
    }>;
    overallTrend: 'increasing' | 'decreasing' | 'stable';
    totalYears: number;
  }> {
    const snapshots = await YearlySnapshotModel.findByUser(userId, {
      page: 1,
      limit: 1000,
      sortBy: 'year',
      sortOrder: 'asc'
    });

    if (snapshots.data.length === 0) {
      return {
        years: [],
        data: [],
        overallTrend: 'stable',
        totalYears: 0
      };
    }

    const years = snapshots.data.map(s => s.gregorianYear);
    const data = [];

    for (let i = 0; i < snapshots.data.length; i++) {
      const snapshot = snapshots.data[i];
      
      // Get payments for this snapshot
      const payments = await PaymentRecordModel.findBySnapshot(snapshot.id, userId);
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

      const yearData: any = {
        year: snapshot.gregorianYear,
        totalWealth: snapshot.totalWealth,
        zakatableWealth: snapshot.zakatableWealth,
        zakatAmount: snapshot.zakatAmount,
        nisabThreshold: snapshot.nisabThreshold,
        totalPaid,
        paymentCount: payments.length
      };

      // Calculate changes from previous year
      if (i > 0) {
        const previousSnapshot = snapshots.data[i - 1];
        yearData.wealthChangeFromPrevious = snapshot.totalWealth - previousSnapshot.totalWealth;
        yearData.zakatChangeFromPrevious = snapshot.zakatAmount - previousSnapshot.zakatAmount;
      }

      data.push(yearData);
    }

    // Calculate overall trend
    const wealthValues = data.map(d => d.totalWealth);
    const overallTrend = this.calculateTrend(wealthValues);

    return {
      years,
      data,
      overallTrend,
      totalYears: years.length
    };
  }

  /**
   * Calculates payment completion trends across years
   * @param userId - User ID
   * @returns Payment trend analysis
   */
  async analyzePaymentTrends(userId: string): Promise<{
    years: Array<{
      year: number;
      zakatCalculated: number;
      totalPaid: number;
      completionRate: number;
      numberOfPayments: number;
    }>;
    averageCompletionRate: number;
    consistencyScore: number; // 0-100, higher is more consistent
  }> {
    const snapshots = await YearlySnapshotModel.findByUser(userId, {
      page: 1,
      limit: 1000,
      sortBy: 'year',
      sortOrder: 'asc'
    });

    const years = [];
    for (const snapshot of snapshots.data) {
      const payments = await PaymentRecordModel.findBySnapshot(snapshot.id, userId);
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const completionRate = snapshot.zakatAmount > 0
        ? (totalPaid / snapshot.zakatAmount) * 100
        : 0;

      years.push({
        year: snapshot.gregorianYear,
        zakatCalculated: snapshot.zakatAmount,
        totalPaid,
        completionRate,
        numberOfPayments: payments.length
      });
    }

    const averageCompletionRate = years.length > 0
      ? years.reduce((sum, y) => sum + y.completionRate, 0) / years.length
      : 0;

    // Calculate consistency (lower variance = higher consistency)
    const variance = years.length > 1
      ? years.reduce((sum, y) => sum + Math.pow(y.completionRate - averageCompletionRate, 2), 0) / years.length
      : 0;
    
    const consistencyScore = Math.max(0, 100 - variance);

    return {
      years,
      averageCompletionRate,
      consistencyScore
    };
  }

  /**
   * Calculates trend direction from values
   * @param values - Array of numeric values
   * @returns Trend direction
   */
  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  /**
   * Generates insights from comparison data
   * @param snapshots - Snapshots being compared
   * @param wealthTrend - Wealth trend direction
   * @param zakatTrend - Zakat trend direction
   * @param growthRate - Average growth rate
   * @returns Array of insight strings
   */
  private generateInsights(
    snapshots: YearlySnapshot[],
    wealthTrend: string,
    zakatTrend: string,
    growthRate: number
  ): string[] {
    const insights: string[] = [];

    // Wealth trend insight
    if (wealthTrend === 'increasing') {
      insights.push(`Your wealth has been increasing over the ${snapshots.length} year period, with an average growth rate of ${growthRate.toFixed(1)}% per year.`);
    } else if (wealthTrend === 'decreasing') {
      insights.push(`Your wealth has been declining over the ${snapshots.length} year period. Consider reviewing your financial strategy.`);
    } else {
      insights.push(`Your wealth has remained relatively stable over the ${snapshots.length} year period.`);
    }

    // Zakat trend insight
    if (zakatTrend === 'increasing') {
      insights.push('Your Zakat obligations have been increasing, reflecting growth in zakatable assets.');
    } else if (zakatTrend === 'decreasing') {
      insights.push('Your Zakat obligations have been decreasing over time.');
    }

    // Nisab compliance
    const allAboveNisab = snapshots.every(s => s.zakatableWealth >= s.nisabThreshold);
    if (allAboveNisab) {
      insights.push('You have consistently maintained wealth above the nisab threshold across all years.');
    }

    // Methodology consistency
    const methodologies = new Set(snapshots.map(s => s.methodologyUsed));
    if (methodologies.size > 1) {
      insights.push(`You have used ${methodologies.size} different calculation methodologies. Consider using a consistent methodology for better year-over-year comparison.`);
    }

    return insights;
  }
}
