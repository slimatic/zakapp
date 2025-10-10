import { PrismaClient } from '@prisma/client';
import { EncryptionService } from './EncryptionService';

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '[REDACTED]';

export interface SaveCalculationRequest {
  methodology: string;
  calendarType: string;
  totalWealth: number;
  nisabThreshold: number;
  zakatDue: number;
  zakatRate?: number;
  assetBreakdown: any;
  notes?: string;
  metadata?: any;
}

export interface CalculationHistoryFilters {
  methodology?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'calculationDate' | 'totalWealth' | 'zakatDue';
  sortOrder?: 'asc' | 'desc';
}

export interface TrendAnalysisOptions {
  period?: '1month' | '3months' | '6months' | '1year' | '2years' | 'all';
}

export class CalculationHistoryService {
  /**
   * Save a new calculation to history
   * Encrypts sensitive data before storage
   */
  async saveCalculation(userId: string, request: SaveCalculationRequest) {
    const {
      methodology,
      calendarType,
      totalWealth,
      nisabThreshold,
      zakatDue,
      zakatRate = 2.5,
      assetBreakdown,
      notes,
      metadata
    } = request;

    // Encrypt sensitive data
    const encryptedTotalWealth = await EncryptionService.encrypt(totalWealth.toString(), ENCRYPTION_KEY);
    const encryptedNisab = await EncryptionService.encrypt(nisabThreshold.toString(), ENCRYPTION_KEY);
    const encryptedZakatDue = await EncryptionService.encrypt(zakatDue.toString(), ENCRYPTION_KEY);
    const encryptedAssetBreakdown = await EncryptionService.encrypt(JSON.stringify(assetBreakdown), ENCRYPTION_KEY);
    const encryptedNotes = notes ? await EncryptionService.encrypt(notes, ENCRYPTION_KEY) : null;
    const encryptedMetadata = metadata ? await EncryptionService.encrypt(JSON.stringify(metadata), ENCRYPTION_KEY) : null;

    // Save to database
    const calculation = await prisma.calculationHistory.create({
      data: {
        userId,
        methodology,
        calendarType,
        totalWealth: encryptedTotalWealth,
        nisabThreshold: encryptedNisab,
        zakatDue: encryptedZakatDue,
        zakatRate,
        assetBreakdown: encryptedAssetBreakdown,
        notes: encryptedNotes,
        metadata: encryptedMetadata
      }
    });

    // Return decrypted version
    return await this.decryptCalculation(calculation);
  }

  /**
   * Get calculation history for a user with filters and pagination
   */
  async getCalculationHistory(userId: string, filters: CalculationHistoryFilters = {}) {
    const {
      methodology,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'calculationDate',
      sortOrder = 'desc'
    } = filters;

    // Validate pagination
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(Math.max(1, limit), 100); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = { userId };
    
    if (methodology) {
      where.methodology = methodology;
    }
    
    if (startDate || endDate) {
      where.calculationDate = {};
      if (startDate) where.calculationDate.gte = startDate;
      if (endDate) where.calculationDate.lte = endDate;
    }

    // Get total count for pagination
    const totalCount = await prisma.calculationHistory.count({ where });

    // Get calculations
    const calculations = await prisma.calculationHistory.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limitNum
    });

    // Decrypt all calculations
    const decryptedCalculations = await Promise.all(
      calculations.map(calc => this.decryptCalculation(calc))
    );

    return {
      calculations: decryptedCalculations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
        hasMore: skip + limitNum < totalCount
      }
    };
  }

  /**
   * Get a specific calculation by ID
   */
  async getCalculationById(userId: string, calculationId: string) {
    const calculation = await prisma.calculationHistory.findFirst({
      where: {
        id: calculationId,
        userId // Ensure user owns this calculation
      }
    });

    if (!calculation) {
      throw new Error('Calculation not found or access denied');
    }

    return await this.decryptCalculation(calculation);
  }

  /**
   * Delete a calculation from history
   */
  async deleteCalculation(userId: string, calculationId: string) {
    // Verify ownership
    const calculation = await prisma.calculationHistory.findFirst({
      where: {
        id: calculationId,
        userId
      }
    });

    if (!calculation) {
      throw new Error('Calculation not found or access denied');
    }

    // Delete the calculation
    await prisma.calculationHistory.delete({
      where: { id: calculationId }
    });

    return { success: true, message: 'Calculation deleted successfully' };
  }

  /**
   * Get trend analysis for calculations over time
   */
  async getTrendAnalysis(userId: string, options: TrendAnalysisOptions = {}) {
    const { period = '1year' } = options;

    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '1month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case '2years':
        startDate.setFullYear(startDate.getFullYear() - 2);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Get calculations in date range
    const calculations = await prisma.calculationHistory.findMany({
      where: {
        userId,
        calculationDate: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { calculationDate: 'asc' }
    });

    // Decrypt calculations
    const decryptedCalculations = await Promise.all(
      calculations.map(calc => this.decryptCalculation(calc))
    );

    // Calculate trends
    const wealthTrend = decryptedCalculations.map(calc => ({
      date: calc.calculationDate,
      wealth: calc.totalWealth
    }));

    const zakatTrend = decryptedCalculations.map(calc => ({
      date: calc.calculationDate,
      zakat: calc.zakatDue
    }));

    // Calculate methodology distribution
    const methodologyDistribution = decryptedCalculations.reduce((acc, calc) => {
      acc[calc.methodology] = (acc[calc.methodology] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate averages
    const totalWealth = decryptedCalculations.reduce((sum, calc) => sum + calc.totalWealth, 0);
    const totalZakat = decryptedCalculations.reduce((sum, calc) => sum + calc.zakatDue, 0);
    const count = decryptedCalculations.length;

    return {
      period,
      dateRange: {
        start: startDate,
        end: endDate
      },
      calculationCount: count,
      wealthTrend,
      zakatTrend,
      methodologyDistribution,
      averages: {
        wealth: count > 0 ? totalWealth / count : 0,
        zakat: count > 0 ? totalZakat / count : 0
      },
      totals: {
        wealth: totalWealth,
        zakat: totalZakat
      }
    };
  }

  /**
   * Compare multiple calculations
   */
  async compareCalculations(userId: string, calculationIds: string[]) {
    if (calculationIds.length < 2) {
      throw new Error('At least 2 calculations are required for comparison');
    }

    if (calculationIds.length > 10) {
      throw new Error('Maximum 10 calculations can be compared at once');
    }

    // Get all calculations
    const calculations = await prisma.calculationHistory.findMany({
      where: {
        id: { in: calculationIds },
        userId // Ensure user owns all calculations
      },
      orderBy: { calculationDate: 'asc' }
    });

    if (calculations.length !== calculationIds.length) {
      throw new Error('One or more calculations not found or access denied');
    }

    // Decrypt calculations
    const decryptedCalculations = await Promise.all(
      calculations.map(calc => this.decryptCalculation(calc))
    );

    // Calculate comparison statistics
    const wealths = decryptedCalculations.map(c => c.totalWealth);
    const zakats = decryptedCalculations.map(c => c.zakatDue);
    const nisabs = decryptedCalculations.map(c => c.nisabThreshold);

    const stats = {
      wealth: {
        min: Math.min(...wealths),
        max: Math.max(...wealths),
        range: Math.max(...wealths) - Math.min(...wealths),
        average: wealths.reduce((a, b) => a + b, 0) / wealths.length
      },
      zakat: {
        min: Math.min(...zakats),
        max: Math.max(...zakats),
        range: Math.max(...zakats) - Math.min(...zakats),
        average: zakats.reduce((a, b) => a + b, 0) / zakats.length
      },
      nisab: {
        min: Math.min(...nisabs),
        max: Math.max(...nisabs),
        range: Math.max(...nisabs) - Math.min(...nisabs),
        average: nisabs.reduce((a, b) => a + b, 0) / nisabs.length
      }
    };

    // Methodology analysis
    const methodologies = decryptedCalculations.map(c => c.methodology);
    const uniqueMethodologies = Array.from(new Set(methodologies));

    return {
      calculations: decryptedCalculations,
      statistics: stats,
      methodologies: uniqueMethodologies,
      comparisonCount: decryptedCalculations.length
    };
  }

  /**
   * Private helper: Decrypt a calculation record
   */
  private async decryptCalculation(calculation: any) {
    try {
      return {
        id: calculation.id,
        userId: calculation.userId,
        methodology: calculation.methodology,
        calendarType: calculation.calendarType,
        calculationDate: calculation.calculationDate,
        totalWealth: parseFloat(await EncryptionService.decrypt(calculation.totalWealth, ENCRYPTION_KEY)),
        nisabThreshold: parseFloat(await EncryptionService.decrypt(calculation.nisabThreshold, ENCRYPTION_KEY)),
        zakatDue: parseFloat(await EncryptionService.decrypt(calculation.zakatDue, ENCRYPTION_KEY)),
        zakatRate: calculation.zakatRate,
        assetBreakdown: JSON.parse(await EncryptionService.decrypt(calculation.assetBreakdown, ENCRYPTION_KEY)),
        notes: calculation.notes ? await EncryptionService.decrypt(calculation.notes, ENCRYPTION_KEY) : null,
        metadata: calculation.metadata ? JSON.parse(await EncryptionService.decrypt(calculation.metadata, ENCRYPTION_KEY)) : null,
        createdAt: calculation.createdAt,
        updatedAt: calculation.updatedAt
      };
    } catch (error) {
      console.error('Error decrypting calculation:', error);
      throw new Error('Failed to decrypt calculation data');
    }
  }

  /**
   * Update calculation notes
   */
  async updateCalculationNotes(userId: string, calculationId: string, notes: string) {
    // Verify ownership
    const calculation = await prisma.calculationHistory.findFirst({
      where: {
        id: calculationId,
        userId
      }
    });

    if (!calculation) {
      throw new Error('Calculation not found or access denied');
    }

    // Encrypt notes
    const encryptedNotes = await EncryptionService.encrypt(notes, ENCRYPTION_KEY);

    // Update
    const updated = await prisma.calculationHistory.update({
      where: { id: calculationId },
      data: {
        notes: encryptedNotes,
        updatedAt: new Date()
      }
    });

    return await this.decryptCalculation(updated);
  }
}

export default new CalculationHistoryService();
