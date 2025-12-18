/**
 * Wealth Aggregation Service (T043)
 * 
 * Calculates total zakatable wealth across all asset categories
 * Performance target: < 100ms for 500 assets
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';
import { EncryptionService } from './EncryptionService';

export interface WealthCalculation {
  totalZakatableWealth: number;
  // Gross total wealth before applying calculation modifiers
  totalWealth?: number;
  breakdown: {
    cash: number;
    gold: number;
    silver: number;
    business: number;
    crypto: number;
    investments: number;
    receivables: number;
    other: number;
  };
  categories: {
    category: string;
    value: number;
    count: number;
  }[];
  timestamp: Date;
}

export class WealthAggregationService {
  private logger = new Logger('WealthAggregationService');
  private prisma: PrismaClient;
  private encryptionService: EncryptionService;

  constructor(
    prisma?: PrismaClient,
    encryptionService?: EncryptionService
  ) {
    this.prisma = prisma || new PrismaClient();
    this.encryptionService = encryptionService || new EncryptionService();
  }

  /**
   * Get all zakatable assets for a user
   * Used for asset snapshot creation in Nisab Year Records
   * 
   * @param userId - User ID
   * @returns Array of zakatable assets with id, name, category, value, isZakatable, addedAt
   */
  async getZakatableAssets(userId: string): Promise<Array<{
    id: string;
    name: string;
    category: string;
    value: number;
    isZakatable: boolean;
    addedAt: Date;
  }>> {
    try {
      // Fetch all active assets for user
      const assets = await this.prisma.asset.findMany({
        where: {
          userId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          category: true,
          value: true,
          calculationModifier: true,
          metadata: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Map to zakatable asset format
      // Respect per-asset metadata (zakatEligible) and decrypt when present
      return await Promise.all(assets.map(async (asset) => {
        let metadata: any = {};
        try {
          if (asset.metadata) {
            metadata = await EncryptionService.decryptObject(asset.metadata, process.env.ENCRYPTION_KEY!);
          }
        } catch (e) {
          metadata = {};
        }

        const isZakatable = metadata?.zakatEligible === undefined ? true : Boolean(metadata?.zakatEligible);
        const modifier = typeof asset.calculationModifier === 'number' ? asset.calculationModifier : 1.0;
        const zakatableValue = isZakatable ? ((asset.value || 0) * modifier) : 0;

        return {
          id: asset.id,
          name: asset.name,
          category: asset.category,
          value: asset.value,
          isZakatable,
          addedAt: asset.createdAt,
          calculationModifier: modifier,
          zakatableValue,
        } as any;
      }));
    } catch (error) {
      this.logger.error('Failed to fetch zakatable assets', error);
      throw new Error(`Failed to fetch zakatable assets: ${error.message}`);
    }
  }

  /**
   * Calculate total zakatable wealth for a user
   * Sums all zakatable assets and subtracts liabilities
   * 
   * @param userId - User ID
   * @returns WealthCalculation with breakdown by category
   * @performance Should complete in < 100ms for 500 assets
   */
  async calculateTotalZakatableWealth(userId: string): Promise<WealthCalculation> {
    const startTime = Date.now();

    try {
      // Fetch all assets for user (indexed query for performance)
      const assets = await this.prisma.asset.findMany({
        where: {
          userId,
          isActive: true,
        },
        select: {
          id: true,
          category: true,
          value: true,
          calculationModifier: true,
        },
      });

      // Calculate breakdown by category
      const breakdown = this._calculateBreakdown(assets);
      const totalZakatableWealth = this._sumZakatableWealth(breakdown);
      const totalWealth = assets.reduce((s, a) => s + (a.value || 0), 0);

      const duration = Date.now() - startTime;
      this.logger.debug(`Wealth calculation for ${userId}: ${duration}ms for ${assets.length} assets`);

      if (duration > 100) {
        this.logger.warn(`Slow wealth calculation: ${duration}ms (target: <100ms)`);
      }

      return {
        totalZakatableWealth,
        totalWealth,
        breakdown,
        categories: this._groupByCategory(assets),
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to calculate wealth', error);
      throw new Error(`Wealth calculation failed: ${error.message}`);
    }
  }

  /**
   * Calculate wealth for a specific year/period
   * Used for Nisab year records
   * 
   * @param userId - User ID
   * @param startDate - Period start date
   * @param endDate - Period end date
   * @returns Wealth calculation for the period
   */
  async calculatePeriodWealth(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WealthCalculation> {
    try {
      const assets = await this.prisma.asset.findMany({
        where: {
          userId,
          isActive: true,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          category: true,
          value: true,
          calculationModifier: true,
        },
      });

      const breakdown = this._calculateBreakdown(assets);
      const totalZakatableWealth = this._sumZakatableWealth(breakdown);
      const totalWealth = assets.reduce((s, a) => s + (a.value || 0), 0);

      return {
        totalZakatableWealth,
        totalWealth,
        breakdown,
        categories: this._groupByCategory(assets),
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to calculate period wealth', error);
      throw error;
    }
  }

  /**
   * Calculate Zakat amount (2.5% of zakatable wealth)
   * 
   * @param zakatableWealth - Total wealth eligible for Zakat
   * @returns Zakat amount
   */
  calculateZakat(zakatableWealth: number): number {
    const zakat = zakatableWealth * 0.025;
    return Math.round(zakat * 100) / 100;
  }

  /**
   * Check if wealth is above Nisab threshold
   * 
   * @param userId - User ID
   * @param nisabThreshold - Nisab amount
   * @returns true if user's wealth >= Nisab
   */
  async isAboveNisab(userId: string, nisabThreshold: number): Promise<boolean> {
    const wealth = await this.calculateTotalZakatableWealth(userId);
    return wealth.totalZakatableWealth >= nisabThreshold;
  }

  /**
   * Get wealth by specific category
   * 
   * @param userId - User ID
   * @param category - Asset category
   * @returns Total value of assets in category
   */
  async getWealthByCategory(userId: string, category: string): Promise<number> {
    const assets = await this.prisma.asset.findMany({
      where: {
        userId,
        category,
        isActive: true,
      },
    });

    return assets.reduce((sum, asset) => sum + asset.value, 0);
  }

  /**
   * Calculate liabilities/debts to deduct from wealth
   * 
   * @param userId - User ID
   * @returns Total liabilities
   */
  async calculateTotalLiabilities(userId: string): Promise<number> {
    const liabilities = await this.prisma.liability.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    return liabilities.reduce((sum, liability) => sum + liability.amount, 0);
  }

  /**
   * Calculate net zakatable wealth (gross - liabilities)
   * 
   * @param userId - User ID
   * @returns Net zakatable wealth
   */
  async calculateNetZakatableWealth(userId: string): Promise<number> {
    const wealth = await this.calculateTotalZakatableWealth(userId);
    const liabilities = await this.calculateTotalLiabilities(userId);
    return Math.max(0, wealth.totalZakatableWealth - liabilities);
  }

  /**
   * Get wealth comparison between two periods
   * Used for showing year-over-year changes
   * 
   * @param userId - User ID
   * @param period1Start - First period start
   * @param period1End - First period end
   * @param period2Start - Second period start
   * @param period2End - Second period end
   * @returns Comparison with deltas
   */
  async compareWealthPeriods(
    userId: string,
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date
  ): Promise<{
    period1: WealthCalculation;
    period2: WealthCalculation;
    absoluteChange: number;
    percentageChange: number;
  }> {
    const period1 = await this.calculatePeriodWealth(userId, period1Start, period1End);
    const period2 = await this.calculatePeriodWealth(userId, period2Start, period2End);

    const absoluteChange = period2.totalZakatableWealth - period1.totalZakatableWealth;
    const percentageChange = period1.totalZakatableWealth === 0 
      ? 0 
      : (absoluteChange / period1.totalZakatableWealth) * 100;

    return {
      period1,
      period2,
      absoluteChange,
      percentageChange,
    };
  }

  /**
   * Private: Calculate breakdown by category from assets array
   */
  private _calculateBreakdown(assets: any[]): WealthCalculation['breakdown'] {
    const breakdown: WealthCalculation['breakdown'] = {
      cash: 0,
      gold: 0,
      silver: 0,
      business: 0,
      crypto: 0,
      investments: 0,
      receivables: 0,
      other: 0,
    };

    for (const asset of assets) {
      // Apply calculation modifier if present; default to 1.0
      const modifier = typeof asset.calculationModifier === 'number' ? asset.calculationModifier : 1.0;
      const zakatableValue = (asset.value || 0) * modifier;
      // All active assets are considered zakatable by category
      // Specific eligibility rules are handled by ZakatEngine
      const category = (asset.category || 'other').toLowerCase();
      if (category in breakdown) {
        breakdown[category as keyof typeof breakdown] += zakatableValue;
      } else {
        breakdown.other += zakatableValue;
      }
    }

    return breakdown;
  }

  /**
   * Private: Sum total zakatable wealth from breakdown
   */
  private _sumZakatableWealth(breakdown: WealthCalculation['breakdown']): number {
    return Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  }

  /**
   * Private: Group assets by category with counts
   */
  private _groupByCategory(assets: any[]): WealthCalculation['categories'] {
    const grouped: Record<string, { value: number; count: number }> = {};

    for (const asset of assets) {
      // All active assets are considered zakatable by category
      const category = asset.category.toLowerCase();
      if (!grouped[category]) {
        grouped[category] = { value: 0, count: 0 };
      }
      grouped[category].value += asset.value;
      grouped[category].count += 1;
    }

    return Object.entries(grouped).map(([category, data]) => ({
      category,
      ...data,
    }));
  }
}
