import { PrismaClient } from '@prisma/client';
import {
  AnnualSummary,
  RecipientSummary,
  ComparativeAnalysis,
  ZakatMethodology
} from '@zakapp/shared';

const prisma = new PrismaClient();

/**
 * AnnualSummary Model - Manages comprehensive yearly reports
 * Combines calculation, payment, and analysis data for annual review
 */
export class AnnualSummaryModel {
  /**
   * Validates summary data
   * @param data - Summary data to validate
   * @throws Error if validation fails
   */
  private static validateSummaryData(data: Partial<{
    gregorianYear: number;
    hijriYear: number;
    startDate: Date;
    endDate: Date;
    totalZakatCalculated: number;
    totalZakatPaid: number;
    outstandingZakat: number;
    numberOfPayments: number;
  }>): void {
    // Validate year ranges
    if (data.gregorianYear !== undefined && (data.gregorianYear < 1900 || data.gregorianYear > 2200)) {
      throw new Error('Gregorian year must be between 1900 and 2200');
    }

    if (data.hijriYear !== undefined && (data.hijriYear < 1300 || data.hijriYear > 1600)) {
      throw new Error('Hijri year must be between 1300 and 1600');
    }

    // Validate date range
    if (data.startDate && data.endDate) {
      if (data.startDate > data.endDate) {
        throw new Error('Start date must be before end date');
      }
    }

    // Validate financial calculations
    if (data.totalZakatCalculated !== undefined &&
        data.totalZakatPaid !== undefined &&
        data.outstandingZakat !== undefined) {
      const expectedOutstanding = data.totalZakatCalculated - data.totalZakatPaid;
      const tolerance = 0.01;
      if (Math.abs(data.outstandingZakat - expectedOutstanding) > tolerance) {
        throw new Error('Outstanding Zakat must equal calculated minus paid');
      }
    }

    // Validate payment count
    if (data.numberOfPayments !== undefined && data.numberOfPayments < 0) {
      throw new Error('Number of payments cannot be negative');
    }
  }

  /**
   * Validates that snapshot exists and belongs to user
   * @param snapshotId - Snapshot ID
   * @param userId - User ID
   * @throws Error if snapshot not found
   */
  private static async validateSnapshot(snapshotId: string, userId: string): Promise<void> {
    const snapshot = await prisma.yearlySnapshot.findFirst({
      where: { id: snapshotId, userId }
    });

    if (!snapshot) {
      throw new Error('Snapshot not found or does not belong to user');
    }
  }

  /**
   * Creates a new annual summary
   * @param userId - User ID
   * @param data - Summary data
   * @returns Promise<AnnualSummary> - Created summary
   */
  static async create(
    userId: string,
    data: {
      snapshotId: string;
      gregorianYear: number;
      hijriYear: number;
      startDate: Date;
      endDate: Date;
      totalZakatCalculated: number;
      totalZakatPaid: number;
      outstandingZakat: number;
      numberOfPayments: number;
      recipientSummary: RecipientSummary;
      assetBreakdown: Record<string, any>;
      comparativeAnalysis?: ComparativeAnalysis;
      methodologyUsed: ZakatMethodology;
      nisabInfo: Record<string, any>;
      userNotes?: string;
    }
  ): Promise<AnnualSummary> {
    try {
      // Validate data
      this.validateSummaryData(data);

      // Validate snapshot
      await this.validateSnapshot(data.snapshotId, userId);

      // Check if summary already exists for this snapshot
      const existing = await prisma.annualSummary.findUnique({
        where: { snapshotId: data.snapshotId }
      });

      if (existing) {
        throw new Error('Annual summary already exists for this snapshot');
      }

      const summary = await prisma.annualSummary.create({
        data: {
          userId,
          snapshotId: data.snapshotId,
          gregorianYear: data.gregorianYear,
          hijriYear: data.hijriYear,
          startDate: data.startDate,
          endDate: data.endDate,
          totalZakatCalculated: String(data.totalZakatCalculated), // Will be encrypted
          totalZakatPaid: String(data.totalZakatPaid),
          outstandingZakat: String(data.outstandingZakat),
          numberOfPayments: data.numberOfPayments,
          recipientSummary: JSON.stringify(data.recipientSummary),
          assetBreakdown: JSON.stringify(data.assetBreakdown),
          comparativeAnalysis: data.comparativeAnalysis ? JSON.stringify(data.comparativeAnalysis) : '{}',
          methodologyUsed: data.methodologyUsed,
          nisabInfo: JSON.stringify(data.nisabInfo),
          userNotes: data.userNotes ?? null,
          version: 1
        }
      });

      return summary as unknown as AnnualSummary;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create annual summary: ${errorMessage}`);
    }
  }

  /**
   * Retrieves summary by ID
   * @param id - Summary ID
   * @param userId - User ID (for ownership validation)
   * @returns Promise<AnnualSummary | null>
   */
  static async findById(id: string, userId: string): Promise<AnnualSummary | null> {
    try {
      const summary = await prisma.annualSummary.findFirst({
        where: { id, userId }
      });

      return summary as unknown as AnnualSummary | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find annual summary: ${errorMessage}`);
    }
  }

  /**
   * Retrieves summary by snapshot ID
   * @param snapshotId - Snapshot ID
   * @param userId - User ID (for ownership validation)
   * @returns Promise<AnnualSummary | null>
   */
  static async findBySnapshot(snapshotId: string, userId: string): Promise<AnnualSummary | null> {
    try {
      await this.validateSnapshot(snapshotId, userId);

      const summary = await prisma.annualSummary.findUnique({
        where: { snapshotId }
      });

      return summary as unknown as AnnualSummary | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find summary by snapshot: ${errorMessage}`);
    }
  }

  /**
   * Retrieves summaries by year
   * @param userId - User ID
   * @param gregorianYear - Gregorian year
   * @returns Promise<AnnualSummary[]>
   */
  static async findByYear(userId: string, gregorianYear: number): Promise<AnnualSummary[]> {
    try {
      const summaries = await prisma.annualSummary.findMany({
        where: {
          userId,
          gregorianYear
        },
        orderBy: { generatedAt: 'desc' }
      });

      return summaries as unknown as AnnualSummary[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find summaries by year: ${errorMessage}`);
    }
  }

  /**
   * Retrieves all summaries for a user
   * @param userId - User ID
   * @param options - Query options
   * @returns Promise<AnnualSummary[]>
   */
  static async findByUser(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ data: AnnualSummary[]; total: number }> {
    try {
      const page = options.page ?? 1;
      const limit = options.limit ?? 20;
      const skip = (page - 1) * limit;

      const [summaries, total] = await Promise.all([
        prisma.annualSummary.findMany({
          where: { userId },
          orderBy: { gregorianYear: options.sortOrder ?? 'desc' },
          skip,
          take: limit
        }),
        prisma.annualSummary.count({ where: { userId } })
      ]);

      return {
        data: summaries as unknown as AnnualSummary[],
        total
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find annual summaries: ${errorMessage}`);
    }
  }

  /**
   * Updates an annual summary (regenerates)
   * @param id - Summary ID
   * @param userId - User ID (for ownership validation)
   * @param data - Updated summary data
   * @returns Promise<AnnualSummary>
   */
  static async update(
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
    try {
      const existing = await this.findById(id, userId);
      if (!existing) {
        throw new Error('Annual summary not found');
      }

      // Validate updated data
      if (data.totalZakatCalculated !== undefined ||
          data.totalZakatPaid !== undefined ||
          data.outstandingZakat !== undefined) {
        this.validateSummaryData({
          totalZakatCalculated: data.totalZakatCalculated,
          totalZakatPaid: data.totalZakatPaid,
          outstandingZakat: data.outstandingZakat
        });
      }

      const updateData: any = {};

      if (data.totalZakatCalculated !== undefined) {
        updateData.totalZakatCalculated = String(data.totalZakatCalculated);
      }

      if (data.totalZakatPaid !== undefined) {
        updateData.totalZakatPaid = String(data.totalZakatPaid);
      }

      if (data.outstandingZakat !== undefined) {
        updateData.outstandingZakat = String(data.outstandingZakat);
      }

      if (data.numberOfPayments !== undefined) {
        updateData.numberOfPayments = data.numberOfPayments;
      }

      if (data.recipientSummary) {
        updateData.recipientSummary = JSON.stringify(data.recipientSummary);
      }

      if (data.assetBreakdown) {
        updateData.assetBreakdown = JSON.stringify(data.assetBreakdown);
      }

      if (data.comparativeAnalysis) {
        updateData.comparativeAnalysis = JSON.stringify(data.comparativeAnalysis);
      }

      if (data.userNotes !== undefined) {
        updateData.userNotes = data.userNotes;
      }

      updateData.version = existing.version + 1;
      updateData.generatedAt = new Date();

      const summary = await prisma.annualSummary.update({
        where: { id },
        data: updateData
      });

      return summary as unknown as AnnualSummary;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update annual summary: ${errorMessage}`);
    }
  }

  /**
   * Deletes an annual summary
   * @param id - Summary ID
   * @param userId - User ID (for ownership validation)
   * @returns Promise<void>
   */
  static async delete(id: string, userId: string): Promise<void> {
    try {
      const existing = await this.findById(id, userId);
      if (!existing) {
        throw new Error('Annual summary not found');
      }

      await prisma.annualSummary.delete({
        where: { id }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete annual summary: ${errorMessage}`);
    }
  }

  /**
   * Gets summary statistics for a user
   * @param userId - User ID
   * @returns Promise<{ totalYears: number; totalZakatPaid: number; averagePayments: number }>
   */
  static async getStatistics(userId: string): Promise<{
    totalYears: number;
    totalZakatPaid: number;
    averagePayments: number;
  }> {
    try {
      const summaries = await prisma.annualSummary.findMany({
        where: { userId }
      });

      const totalYears = summaries.length;
      const totalZakatPaid = summaries.reduce((sum, s: any) => {
        return sum + parseFloat(s.totalZakatPaid);
      }, 0);
      const averagePayments = totalYears > 0
        ? summaries.reduce((sum, s: any) => sum + s.numberOfPayments, 0) / totalYears
        : 0;

      return {
        totalYears,
        totalZakatPaid,
        averagePayments
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get summary statistics: ${errorMessage}`);
    }
  }

  /**
   * Creates or updates an annual summary
   * @param userId - User ID
   * @param data - Summary data
   * @returns Promise<AnnualSummary> - Created or updated summary
   */
  static async createOrUpdate(
    userId: string,
    data: {
      snapshotId: string;
      gregorianYear: number;
      hijriYear: number;
      startDate: Date;
      endDate: Date;
      totalZakatCalculated: number;
      totalZakatPaid: number;
      outstandingZakat: number;
      numberOfPayments: number;
      recipientSummary: RecipientSummary;
      assetBreakdown: Record<string, any>;
      comparativeAnalysis?: ComparativeAnalysis;
      methodologyUsed: ZakatMethodology;
      nisabInfo: Record<string, any>;
      userNotes?: string;
    }
  ): Promise<AnnualSummary> {
    try {
      // Check if summary already exists
      const existing = await this.findBySnapshot(data.snapshotId, userId);
      
      if (existing) {
        // Update existing summary
        return await this.update(existing.id, userId, data);
      } else {
        // Create new summary
        return await this.create(userId, data);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create or update annual summary: ${errorMessage}`);
    }
  }
}
