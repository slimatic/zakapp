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

import { YearlySnapshotModel } from '../models/YearlySnapshot';
import { PaymentRecordModel } from '../models/PaymentRecord';
import { YearlySnapshot } from '@zakapp/shared';
import { readEncryptedAmount, decryptNumericFields } from '../utils/encryptedNumbers';

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
    /**
     * Fields that could not be read. Present so the caller can tell a genuine
     * "no trend" from "we could not read the numbers". Empty in the normal case.
     */
    unreadableFields: string[];
  }> {
    if (snapshotIds.length < 2) {
      throw new Error('At least 2 snapshots are required for comparison');
    }

    // Fetch all snapshots.
    //
    // IMPORTANT: `YearlySnapshotModel.findById` returns the RAW Prisma row, so
    // totalWealth / zakatableWealth / zakatAmount / nisabThreshold arrive as
    // CIPHERTEXT. Every arithmetic operation below used to run on those strings:
    //
    //   Math.min(...ciphertexts)      -> NaN
    //   Math.max(...ciphertexts)      -> NaN
    //   sum + ciphertext              -> string concatenation
    //   (NaN - NaN) / NaN / years     -> NaN
    //   s.zakatableWealth >= s.nisab  -> string comparison, both sides ciphertext
    //
    // So the comparison response carried NaN in every numeric field, and the
    // generated insights told the user their wealth "remained relatively stable"
    // because the decreasing-branch was never reached. Decrypt first.
    const snapshots: YearlySnapshot[] = [];
    const unreadableFields: string[] = [];

    for (const id of snapshotIds) {
      const snapshot = await YearlySnapshotModel.findById(id, userId);
      if (!snapshot) {
        throw new Error(`Snapshot ${id} not found`);
      }

      const { row, unreadable } = await decryptNumericFields(
        snapshot as unknown as Record<string, unknown>,
        ['totalWealth', 'zakatableWealth', 'zakatAmount', 'nisabThreshold'],
        this.encryptionKey
      );
      for (const field of unreadable) {
        unreadableFields.push(`${id}.${field}`);
      }
      snapshots.push(row as unknown as YearlySnapshot);
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
    const averageGrowthRate = years > 0 && firstWealth > 0
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
      insights,
      unreadableFields
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
      // findByUser returns raw Prisma rows — decrypt before doing arithmetic.
      // Without this, totalPaid was a concatenation of ciphertext strings, the
      // year-over-year subtractions were NaN, and JSON turned every NaN into null.
      const { row: snapshot } = await decryptNumericFields(
        snapshots.data[i] as unknown as Record<string, unknown>,
        ['totalWealth', 'zakatableWealth', 'zakatAmount', 'nisabThreshold'],
        this.encryptionKey
      );

      // Get payments for this snapshot.
      // findBySnapshot also returns raw rows, so each amount must be decrypted
      // individually — `sum + ciphertext` concatenates rather than throwing.
      const payments = await PaymentRecordModel.findBySnapshot(
        (snapshot as { id: string }).id,
        userId
      );
      let totalPaid = 0;
      for (const payment of payments) {
        totalPaid += await readEncryptedAmount(payment.amount, this.encryptionKey);
      }

      const yearData: Record<string, unknown> = {
        year: (snapshot as { gregorianYear: number }).gregorianYear,
        totalWealth: (snapshot as { totalWealth: number }).totalWealth,
        zakatableWealth: (snapshot as { zakatableWealth: number }).zakatableWealth,
        zakatAmount: (snapshot as { zakatAmount: number }).zakatAmount,
        nisabThreshold: (snapshot as { nisabThreshold: number }).nisabThreshold,
        totalPaid,
        paymentCount: payments.length
      };

      // Calculate changes from previous year
      if (i > 0) {
        const previousSnapshot = data[i - 1] as {
          totalWealth: number;
          zakatAmount: number;
        };
        yearData.wealthChangeFromPrevious =
          (snapshot as { totalWealth: number }).totalWealth - previousSnapshot.totalWealth;
        yearData.zakatChangeFromPrevious =
          (snapshot as { zakatAmount: number }).zakatAmount - previousSnapshot.zakatAmount;
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
    for (const rawSnapshot of snapshots.data) {
      // Raw Prisma rows — decrypt before comparing or dividing.
      const { row: snapshot } = await decryptNumericFields(
        rawSnapshot as unknown as Record<string, unknown>,
        ['zakatAmount', 'totalWealth', 'zakatableWealth', 'nisabThreshold'],
        this.encryptionKey
      );
      const snap = snapshot as unknown as {
        id: string;
        gregorianYear: number;
        zakatAmount: number;
      };

      const payments = await PaymentRecordModel.findBySnapshot(snap.id, userId);
      let totalPaid = 0;
      for (const payment of payments) {
        totalPaid += await readEncryptedAmount(payment.amount, this.encryptionKey);
      }

      const completionRate = snap.zakatAmount > 0
        ? (totalPaid / snap.zakatAmount) * 100
        : 0;

      years.push({
        year: snap.gregorianYear,
        zakatCalculated: snap.zakatAmount,
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
   *
   * NOTE ON THE PROSE. These strings are shown to the user as statements of fact
   * about their finances. They used to be derived from comparisons between
   * CIPHERTEXT strings, and because every comparison against NaN (or between two
   * ciphertexts) is false, only the "stable" branches could ever be reached — the
   * app confidently told a user their wealth "remained relatively stable" no matter
   * what the numbers were.
   *
   * Now that the inputs are decrypted, the branches are meaningful. The
   * "all above nisab" insight additionally requires finite values, so an unreadable
   * comparison stays silent rather than asserting compliance it cannot verify.
   *
   * @param snapshots - Snapshots being compared (decrypted numeric fields)
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

    // Nisab compliance.
    // Require finite values before claiming compliance — an unverifiable comparison
    // must not produce an assertion of correctness.
    const comparable = snapshots.every(
      s =>
        Number.isFinite(Number(s.zakatableWealth)) &&
        Number.isFinite(Number(s.nisabThreshold)) &&
        Number(s.nisabThreshold) > 0
    );
    const allAboveNisab =
      comparable &&
      snapshots.every(s => Number(s.zakatableWealth) >= Number(s.nisabThreshold));

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
