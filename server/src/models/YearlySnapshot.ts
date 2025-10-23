import { PrismaClient } from '@prisma/client';
import {
  YearlySnapshot,
  CreateYearlySnapshotDto,
  UpdateYearlySnapshotDto,
  SnapshotStatus,
  NisabType,
  ZakatMethodology
} from '../../../shared/src/types/tracking';

const prisma = new PrismaClient();

/**
 * YearlySnapshot Model - Manages historical Zakat calculation snapshots
 * Supports comprehensive yearly tracking with dual calendar systems
 */
export class YearlySnapshotModel {
  /**
   * Validates snapshot data before creation/update
   * @param data - Snapshot data to validate
   * @throws Error if validation fails
   */
  static validateSnapshotData(data: Partial<CreateYearlySnapshotDto>): void {
    // Validate calculation date
    if (data.calculationDate) {
      const calcDate = new Date(data.calculationDate);
      const now = new Date();
      if (calcDate > now) {
        throw new Error('Calculation date cannot be in the future');
      }
    }

    // Validate financial values
    if (data.totalWealth !== undefined && data.totalWealth < 0) {
      throw new Error('Total wealth cannot be negative');
    }

    if (data.totalLiabilities !== undefined && data.totalLiabilities < 0) {
      throw new Error('Total liabilities cannot be negative');
    }

    if (data.zakatAmount !== undefined && data.zakatAmount < 0) {
      throw new Error('Zakat amount cannot be negative');
    }

    // Validate zakatable wealth calculation
    if (data.totalWealth !== undefined && 
        data.totalLiabilities !== undefined && 
        data.zakatableWealth !== undefined) {
      const expectedZakatable = data.totalWealth - data.totalLiabilities;
      const tolerance = 0.01; // Allow for rounding differences
      if (Math.abs(data.zakatableWealth - expectedZakatable) > tolerance) {
        throw new Error('Zakatable wealth must equal total wealth minus total liabilities');
      }
    }

    // Validate zakat amount against zakatable wealth
    if (data.zakatAmount !== undefined && data.zakatableWealth !== undefined) {
      if (data.zakatAmount > data.zakatableWealth) {
        throw new Error('Zakat amount cannot exceed zakatable wealth');
      }
    }

    // Validate methodology
    const validMethodologies: ZakatMethodology[] = ['Standard', 'Hanafi', 'Shafii', 'Custom'];
    if (data.methodologyUsed && !validMethodologies.includes(data.methodologyUsed)) {
      throw new Error(`Invalid methodology. Must be one of: ${validMethodologies.join(', ')}`);
    }

    // Validate nisab type
    const validNisabTypes: NisabType[] = ['gold', 'silver'];
    if (data.nisabType && !validNisabTypes.includes(data.nisabType)) {
      throw new Error(`Invalid nisab type. Must be either 'gold' or 'silver'`);
    }

    // Validate status
    const validStatuses: SnapshotStatus[] = ['draft', 'finalized'];
    if (data.status && !validStatuses.includes(data.status)) {
      throw new Error(`Invalid status. Must be either 'draft' or 'finalized'`);
    }

    // Validate calendar dates
    if (data.gregorianMonth !== undefined && (data.gregorianMonth < 1 || data.gregorianMonth > 12)) {
      throw new Error('Gregorian month must be between 1 and 12');
    }

    if (data.gregorianDay !== undefined && (data.gregorianDay < 1 || data.gregorianDay > 31)) {
      throw new Error('Gregorian day must be between 1 and 31');
    }

    if (data.hijriMonth !== undefined && (data.hijriMonth < 1 || data.hijriMonth > 12)) {
      throw new Error('Hijri month must be between 1 and 12');
    }

    if (data.hijriDay !== undefined && (data.hijriDay < 1 || data.hijriDay > 30)) {
      throw new Error('Hijri day must be between 1 and 30');
    }
  }

  /**
   * Validates that only one primary snapshot exists per year per user
   * @param userId - User ID
   * @param gregorianYear - Gregorian year
   * @param excludeSnapshotId - Optional snapshot ID to exclude (for updates)
   * @throws Error if another primary snapshot exists
   */
  private static async validatePrimarySnapshot(
    userId: string,
    gregorianYear: number,
    isPrimary: boolean,
    excludeSnapshotId?: string
  ): Promise<void> {
    if (!isPrimary) return;

    const existingPrimary = await prisma.yearlySnapshot.findFirst({
      where: {
        userId,
        gregorianYear,
        isPrimary: true,
        ...(excludeSnapshotId && { id: { not: excludeSnapshotId } })
      }
    });

    if (existingPrimary) {
      throw new Error(`A primary snapshot already exists for year ${gregorianYear}`);
    }
  }

  /**
   * Creates a new yearly snapshot
   * @param userId - User ID
   * @param data - Snapshot data to create
   * @returns Promise<YearlySnapshot> - Created snapshot
   * @throws Error if creation fails or validation fails
   */
  static async create(userId: string, data: CreateYearlySnapshotDto): Promise<YearlySnapshot> {
    try {
      // Validate data - MOVED TO SERVICE LAYER
      // this.validateSnapshotData(data);

      // Validate primary snapshot constraint
      await this.validatePrimarySnapshot(
        userId,
        data.gregorianYear,
        data.isPrimary ?? false
      );

      // Calculate zakatable wealth if not provided
      const zakatableWealth = data.zakatableWealth ?? (data.totalWealth - data.totalLiabilities);

      const snapshot = await prisma.yearlySnapshot.create({
        data: {
          userId,
          calculationDate: new Date(data.calculationDate),
          gregorianYear: data.gregorianYear,
          gregorianMonth: data.gregorianMonth ?? new Date(data.calculationDate).getMonth() + 1,
          gregorianDay: data.gregorianDay ?? new Date(data.calculationDate).getDate(),
          hijriYear: data.hijriYear,
          hijriMonth: data.hijriMonth ?? 1,
          hijriDay: data.hijriDay ?? 1,
          totalWealth: String(data.totalWealth), // Will be encrypted by service layer
          totalLiabilities: String(data.totalLiabilities),
          zakatableWealth: String(zakatableWealth),
          zakatAmount: String(data.zakatAmount),
          methodologyUsed: data.methodologyUsed,
          nisabThreshold: String(data.nisabThreshold),
          nisabType: data.nisabType,
          status: data.status ?? 'draft',
          assetBreakdown: data.assetBreakdown ? JSON.stringify(data.assetBreakdown) : '{}',
          calculationDetails: data.calculationDetails ? JSON.stringify(data.calculationDetails) : '{}',
          userNotes: data.userNotes ?? null,
          isPrimary: data.isPrimary ?? false,
        }
      });

      return snapshot as unknown as YearlySnapshot;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create yearly snapshot: ${errorMessage}`);
    }
  }

  /**
   * Retrieves snapshot by ID
   * @param id - Snapshot ID
   * @param userId - User ID (for ownership validation)
   * @returns Promise<YearlySnapshot | null> - Snapshot or null if not found
   */
  static async findById(id: string, userId: string): Promise<YearlySnapshot | null> {
    try {
      const snapshot = await prisma.yearlySnapshot.findFirst({
        where: { id, userId }
      });

      return snapshot as unknown as YearlySnapshot | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find yearly snapshot: ${errorMessage}`);
    }
  }

  /**
   * Retrieves all snapshots for a user with pagination and filtering
   * @param userId - User ID
   * @param options - Query options
   * @returns Promise<YearlySnapshot[]> - Array of snapshots
   */
  static async findByUser(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      year?: number;
      status?: SnapshotStatus;
      sortBy?: 'date' | 'year';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ data: YearlySnapshot[]; total: number }> {
    try {
      const page = options.page ?? 1;
      const limit = options.limit ?? 20;
      const skip = (page - 1) * limit;

      const where: any = { userId };

      if (options.year) {
        where.gregorianYear = options.year;
      }

      if (options.status && options.status !== 'all' as any) {
        where.status = options.status;
      }

      const orderBy: any = {};
      if (options.sortBy === 'year') {
        orderBy.gregorianYear = options.sortOrder ?? 'desc';
      } else {
        orderBy.calculationDate = options.sortOrder ?? 'desc';
      }

      const [snapshots, total] = await Promise.all([
        prisma.yearlySnapshot.findMany({
          where,
          orderBy,
          skip,
          take: limit,
        }),
        prisma.yearlySnapshot.count({ where })
      ]);

      return {
        data: snapshots as unknown as YearlySnapshot[],
        total
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find yearly snapshots: ${errorMessage}`);
    }
  }

  /**
   * Updates a snapshot (only if status is 'draft')
   * @param id - Snapshot ID
   * @param userId - User ID (for ownership validation)
   * @param data - Update data
   * @returns Promise<YearlySnapshot> - Updated snapshot
   * @throws Error if snapshot is finalized or update fails
   */
  static async update(
    id: string,
    userId: string,
    data: UpdateYearlySnapshotDto
  ): Promise<YearlySnapshot> {
    try {
      // Validate data
      this.validateSnapshotData(data);

      // Check if snapshot exists and is editable
      const existing = await this.findById(id, userId);
      if (!existing) {
        throw new Error('Snapshot not found');
      }

      if (existing.status === 'finalized') {
        throw new Error('Cannot update finalized snapshot');
      }

      const updateData: any = {};

      if (data.totalWealth !== undefined) {
        updateData.totalWealth = String(data.totalWealth);
      }

      if (data.totalLiabilities !== undefined) {
        updateData.totalLiabilities = String(data.totalLiabilities);
      }

      if (data.zakatAmount !== undefined) {
        updateData.zakatAmount = String(data.zakatAmount);
      }

      if (data.methodologyUsed) {
        updateData.methodologyUsed = data.methodologyUsed;
      }

      if (data.assetBreakdown) {
        updateData.assetBreakdown = JSON.stringify(data.assetBreakdown);
      }

      if (data.calculationDetails) {
        updateData.calculationDetails = JSON.stringify(data.calculationDetails);
      }

      if (data.userNotes !== undefined) {
        updateData.userNotes = data.userNotes;
      }

      // Recalculate zakatable wealth if relevant fields changed
      if (data.totalWealth !== undefined || data.totalLiabilities !== undefined) {
        const totalWealth = data.totalWealth ?? parseFloat(existing.totalWealth as unknown as string);
        const totalLiabilities = data.totalLiabilities ?? parseFloat(existing.totalLiabilities as unknown as string);
        updateData.zakatableWealth = String(totalWealth - totalLiabilities);
      }

      const snapshot = await prisma.yearlySnapshot.update({
        where: { id },
        data: updateData
      });

      return snapshot as unknown as YearlySnapshot;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update yearly snapshot: ${errorMessage}`);
    }
  }

  /**
   * Finalizes a snapshot (makes it immutable)
   * @param id - Snapshot ID
   * @param userId - User ID (for ownership validation)
   * @returns Promise<YearlySnapshot> - Finalized snapshot
   * @throws Error if snapshot is already finalized
   */
  static async finalize(id: string, userId: string): Promise<YearlySnapshot> {
    try {
      const existing = await this.findById(id, userId);
      if (!existing) {
        throw new Error('Snapshot not found');
      }

      if (existing.status === 'finalized') {
        throw new Error('Snapshot is already finalized');
      }

      const snapshot = await prisma.yearlySnapshot.update({
        where: { id },
        data: { status: 'finalized' }
      });

      return snapshot as unknown as YearlySnapshot;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to finalize yearly snapshot: ${errorMessage}`);
    }
  }

  /**
   * Deletes a snapshot and associated data
   * @param id - Snapshot ID
   * @param userId - User ID (for ownership validation)
   * @returns Promise<void>
   */
  static async delete(id: string, userId: string): Promise<void> {
    try {
      const existing = await this.findById(id, userId);
      if (!existing) {
        throw new Error('Snapshot not found');
      }

      await prisma.yearlySnapshot.delete({
        where: { id }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete yearly snapshot: ${errorMessage}`);
    }
  }

  /**
   * Gets the primary snapshot for a specific year
   * @param userId - User ID
   * @param gregorianYear - Gregorian year
   * @returns Promise<YearlySnapshot | null> - Primary snapshot or null
   */
  static async findPrimaryByYear(userId: string, gregorianYear: number): Promise<YearlySnapshot | null> {
    try {
      const snapshot = await prisma.yearlySnapshot.findFirst({
        where: {
          userId,
          gregorianYear,
          isPrimary: true
        }
      });

      return snapshot as unknown as YearlySnapshot | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find primary snapshot: ${errorMessage}`);
    }
  }
}
