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

import { AnnualSummaryModel } from '../models/AnnualSummary';
import { YearlySnapshotModel } from '../models/YearlySnapshot';
import { PaymentRecordModel } from '../models/PaymentRecord';
import { EncryptionService } from './EncryptionService';
import { Logger } from '../utils/logger';

const logger = new Logger('AnnualSummaryService');

import {
  AnnualSummary,
  RecipientSummary,
  ComparativeAnalysis,
  ZakatMethodology
} from '@zakapp/shared';

/**
 * AnnualSummaryService - Business logic for annual Zakat reports
 * Handles report generation with comparative analysis
 */
export class AnnualSummaryService {
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || '';
    if (!this.encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
  }

  /**
   * Decrypts annual summary data
   * @param summary - Encrypted summary
   * @returns Decrypted summary
   */
  private async decryptSummaryData(summary: any): Promise<AnnualSummary> {
    if (!summary) return summary;

    const decrypted = { ...summary };

    try {
      // Decrypt JSON fields if they're strings
      if (typeof summary.recipientSummary === 'string') {
        decrypted.recipientSummary = JSON.parse(
          await EncryptionService.decrypt(summary.recipientSummary, this.encryptionKey)
        );
      } else if (typeof summary.recipientSummary === 'object') {
        decrypted.recipientSummary = summary.recipientSummary;
      }

      if (typeof summary.assetBreakdown === 'string') {
        decrypted.assetBreakdown = JSON.parse(
          await EncryptionService.decrypt(summary.assetBreakdown, this.encryptionKey)
        );
      } else if (typeof summary.assetBreakdown === 'object') {
        decrypted.assetBreakdown = summary.assetBreakdown;
      }

      if (summary.comparativeAnalysis && typeof summary.comparativeAnalysis === 'string') {
        decrypted.comparativeAnalysis = JSON.parse(
          await EncryptionService.decrypt(summary.comparativeAnalysis, this.encryptionKey)
        );
      } else if (typeof summary.comparativeAnalysis === 'object') {
        decrypted.comparativeAnalysis = summary.comparativeAnalysis;
      }

      if (summary.nisabInfo && typeof summary.nisabInfo === 'string') {
        decrypted.nisabInfo = JSON.parse(
          await EncryptionService.decrypt(summary.nisabInfo, this.encryptionKey)
        );
      } else if (typeof summary.nisabInfo === 'object') {
        decrypted.nisabInfo = summary.nisabInfo;
      }

      if (summary.userNotes && typeof summary.userNotes === 'string') {
        decrypted.userNotes = await EncryptionService.decrypt(summary.userNotes, this.encryptionKey);
      }
    } catch (error) {
      // If decryption fails, data might already be decrypted
      logger.error('Decryption error in AnnualSummaryService:', error);

    }

    return decrypted as AnnualSummary;
  }

  /**
   * Generates an annual summary for a snapshot
   * @param snapshotId - Snapshot ID
   * @param userId - User ID for authorization
   * @returns Generated summary
   */
  async generateSummary(snapshotId: string, userId: string): Promise<AnnualSummary> {
    // Get snapshot
    const snapshot = await YearlySnapshotModel.findById(snapshotId, userId);
    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    // Get payments for this snapshot
    const payments = await PaymentRecordModel.findBySnapshot(snapshotId, userId);

    // Calculate totals by category for recipient summary
    const byCategory = new Map<string, { count: number; totalAmount: number }>();
    const byType = new Map<string, { count: number; totalAmount: number }>();
    let totalPaid = 0;

    for (const payment of payments) {
      const amount = payment.amount; // Already decrypted from model
      totalPaid += amount;

      // By category
      const catExisting = byCategory.get(payment.recipientCategory) || { count: 0, totalAmount: 0 };
      byCategory.set(payment.recipientCategory, {
        count: catExisting.count + 1,
        totalAmount: catExisting.totalAmount + amount
      });

      // By type
      const typeExisting = byType.get(payment.recipientType) || { count: 0, totalAmount: 0 };
      byType.set(payment.recipientType, {
        count: typeExisting.count + 1,
        totalAmount: typeExisting.totalAmount + amount
      });
    }

    const recipientSummary: RecipientSummary = {
      byType: Array.from(byType.entries()).map(([type, stats]) => ({
        type: type as any,
        count: stats.count,
        totalAmount: stats.totalAmount
      })),
      byCategory: Array.from(byCategory.entries()).map(([category, stats]) => ({
        category: category as any,
        count: stats.count,
        totalAmount: stats.totalAmount
      })),
      uniqueRecipients: 0, // TODO: Implement proper unique recipient counting
      averagePayment: 0 // TODO: Implement proper average calculation
    };

    // Get previous year's snapshot for comparison
    const previousYear = snapshot.gregorianYear - 1;
    const previousSnapshot = await YearlySnapshotModel.findPrimaryByYear(userId, previousYear);

    let comparativeAnalysis: ComparativeAnalysis | undefined = undefined;
    if (previousSnapshot) {
      const wealthChange = snapshot.totalWealth - previousSnapshot.totalWealth;
      const zakatChange = snapshot.zakatAmount - previousSnapshot.zakatAmount;

      comparativeAnalysis = {
        previousYear: {
          year: previousYear,
          wealth: previousSnapshot.totalWealth,
          zakat: previousSnapshot.zakatAmount,
          paid: 0 // TODO: Get actual paid amount from payments
        },
        currentYear: {
          year: snapshot.gregorianYear,
          wealth: snapshot.totalWealth,
          zakat: snapshot.zakatAmount,
          paid: 0 // TODO: Get actual paid amount from payments
        },
        changes: {
          wealthChange: wealthChange,
          wealthChangePercent: previousSnapshot.totalWealth > 0
            ? (wealthChange / previousSnapshot.totalWealth) * 100
            : 0,
          zakatChange: zakatChange,
          zakatChangePercent: previousSnapshot.zakatAmount > 0
            ? (zakatChange / previousSnapshot.zakatAmount) * 100
            : 0,
          paymentConsistency: 'maintained' as const // TODO: Calculate based on actual payments
        }
      };
    }

    // Get asset breakdown from snapshot
    let assetBreakdown: Record<string, any> = {};
    try {
      if (typeof snapshot.assetBreakdown === 'string') {
        assetBreakdown = JSON.parse(snapshot.assetBreakdown);
      } else if (typeof snapshot.assetBreakdown === 'object') {
        assetBreakdown = snapshot.assetBreakdown;
      }
    } catch (e) {
      assetBreakdown = {};
    }

    // Get calculation details for nisab info
    let nisabInfo: Record<string, any> = {
      threshold: snapshot.nisabThreshold,
      type: snapshot.nisabType,
      methodology: (snapshot as any).methodology || 'standard' // TODO: Add methodology to YearlySnapshot schema
    };

    const totalZakatCalculated = snapshot.zakatAmount;
    const outstandingZakat = Math.max(0, totalZakatCalculated - totalPaid);

    // Create summary
    const summaryData = {
      snapshotId,
      gregorianYear: snapshot.gregorianYear,
      hijriYear: snapshot.hijriYear,
      startDate: new Date(snapshot.calculationDate),
      endDate: new Date(snapshot.calculationDate), // Same as calculation date
      totalZakatCalculated,
      totalZakatPaid: totalPaid,
      outstandingZakat,
      numberOfPayments: payments.length,
      recipientSummary,
      assetBreakdown,
      comparativeAnalysis,
      methodologyUsed: ((snapshot as any).methodology || 'standard') as ZakatMethodology, // TODO: Add methodology to YearlySnapshot schema
      nisabInfo,
      userNotes: snapshot.userNotes
    };

    const summary = await AnnualSummaryModel.create(userId, summaryData);
    return await this.decryptSummaryData(summary);
  }

  /**
   * Gets a summary by ID
   * @param id - Summary ID
   * @param userId - User ID for authorization
   * @returns Summary or null
   */
  async getSummary(id: string, userId: string): Promise<AnnualSummary | null> {
    const summary = await AnnualSummaryModel.findById(id, userId);

    if (!summary) {
      return null;
    }

    return await this.decryptSummaryData(summary);
  }

  /**
   * Gets summary by snapshot ID
   * @param snapshotId - Snapshot ID
   * @param userId - User ID for authorization
   * @returns Summary or null
   */
  async getSummaryBySnapshot(snapshotId: string, userId: string): Promise<AnnualSummary | null> {
    const summary = await AnnualSummaryModel.findBySnapshot(snapshotId, userId);

    if (!summary) {
      return null;
    }

    return await this.decryptSummaryData(summary);
  }

  /**
   * Gets summaries by year
   * @param year - Gregorian year
   * @param userId - User ID for authorization
   * @returns Array of summaries
   */
  async getSummariesByYear(year: number, userId: string): Promise<AnnualSummary[]> {
    const summaries = await AnnualSummaryModel.findByYear(userId, year); // Fixed parameter order

    return await Promise.all(
      summaries.map(summary => this.decryptSummaryData(summary))
    );
  }

  /**
   * Lists all summaries for a user with pagination
   * @param userId - User ID
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated summaries
   */
  async listSummaries(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: AnnualSummary[]; total: number }> {
    const result = await AnnualSummaryModel.findByUser(userId, { page, limit });

    const decryptedData = await Promise.all(
      result.data.map(summary => this.decryptSummaryData(summary))
    );

    return {
      data: decryptedData,
      total: result.total
    };
  }

  /**
   * Updates a summary
   * @param id - Summary ID
   * @param userId - User ID for authorization
   * @param data - Update data
   * @returns Updated summary
   */
  async updateSummary(
    id: string,
    userId: string,
    data: Partial<{
      totalZakatCalculated: number;
      totalZakatPaid: number;
      outstandingZakat: number;
      numberOfPayments: number;
      recipientSummary: RecipientSummary;
      assetBreakdown: Record<string, any>;
      comparativeAnalysis: ComparativeAnalysis;
      userNotes: string;
    }>
  ): Promise<AnnualSummary> {
    const summary = await AnnualSummaryModel.findById(id, userId);
    if (!summary) {
      throw new Error('Summary not found');
    }

    const updated = await AnnualSummaryModel.update(id, userId, data);
    return await this.decryptSummaryData(updated);
  }

  /**
   * Deletes a summary
   * @param id - Summary ID
   * @param userId - User ID for authorization
   */
  async deleteSummary(id: string, userId: string): Promise<void> {
    const summary = await AnnualSummaryModel.findById(id, userId);
    if (!summary) {
      throw new Error('Summary not found');
    }

    await AnnualSummaryModel.delete(id, userId);
  }

  /**
   * Gets statistics across all summaries
   * @param userId - User ID
   * @returns Overall statistics
   */
  async getOverallStatistics(userId: string): Promise<{
    totalYears: number;
    totalZakatCalculated: number;
    totalZakatPaid: number;
    totalOutstanding: number;
    averageZakatPerYear: number;
    paymentCompletionRate: number;
  }> {
    const result = await this.listSummaries(userId, 1, 1000);
    const summaries = result.data;

    const totalZakatCalculated = summaries.reduce((sum, s) => sum + s.totalZakatCalculated, 0);
    const totalZakatPaid = summaries.reduce((sum, s) => sum + s.totalZakatPaid, 0);
    const totalOutstanding = summaries.reduce((sum, s) => sum + s.outstandingZakat, 0);

    return {
      totalYears: summaries.length,
      totalZakatCalculated,
      totalZakatPaid,
      totalOutstanding,
      averageZakatPerYear: summaries.length > 0 ? totalZakatCalculated / summaries.length : 0,
      paymentCompletionRate: totalZakatCalculated > 0 ? (totalZakatPaid / totalZakatCalculated) * 100 : 0
    };
  }
}
