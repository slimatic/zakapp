/**
 * Nisab Year Record Service (T045)
 * 
 * Core service for Nisab Year Record lifecycle management
 * Handles CRUD operations, status transitions, and live tracking
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { Logger } from '../utils/logger';
import { EncryptionService } from './EncryptionService';
import { AuditTrailService } from './auditTrailService';
import { NisabCalculationService } from './nisabCalculationService';
import { HawlTrackingService } from './hawlTrackingService';
import { WealthAggregationService } from './wealthAggregationService';
import type {
  NisabYearRecord,
  RecordStatus,
  NisabBasis,
  CreateNisabYearRecordDto,
  UpdateNisabYearRecordDto,
  FinalizeRecordDto,
  UnlockRecordDto,
  NisabYearRecordResponse,
  LiveHawlData,
} from '@zakapp/shared';

export class NisabYearRecordService {
  private logger = new Logger('NisabYearRecordService');
  private prisma: PrismaClient;
  private encryptionService: EncryptionService;
  private auditTrailService: AuditTrailService;
  private nisabCalculationService: NisabCalculationService;
  private hawlTrackingService: HawlTrackingService;
  private wealthAggregationService: WealthAggregationService;

  constructor(
    prisma?: PrismaClient,
    encryptionService?: EncryptionService,
    auditTrailService?: AuditTrailService,
    nisabCalculationService?: NisabCalculationService,
    hawlTrackingService?: HawlTrackingService,
    wealthAggregationService?: WealthAggregationService
  ) {
  this.prisma = prisma || new PrismaClient();
  this.encryptionService = encryptionService || new EncryptionService();
    this.auditTrailService = auditTrailService || new AuditTrailService();
    this.nisabCalculationService = nisabCalculationService || new NisabCalculationService();
    this.hawlTrackingService = hawlTrackingService || new HawlTrackingService();
    this.wealthAggregationService = wealthAggregationService || new WealthAggregationService();
  }

  /**
   * Create a new Nisab Year Record
   * Records start in DRAFT status
   * 
   * @param userId - Owner of the record
   * @param dto - Record creation data
   * @returns Created record
   */
  async createRecord(
    userId: string,
    dto: CreateNisabYearRecordDto
  ): Promise<NisabYearRecordResponse> {
    try {
      // Validate Nisab basis
      if (!['GOLD', 'SILVER'].includes(dto.nisabBasis)) {
        throw new Error('Invalid Nisab basis: must be GOLD or SILVER');
      }

      // Validate hawl start date or hijri start string is present
      if (!dto.hawlStartDate && !dto.hawlStartDateHijri) {
        throw new Error('Hawl start date is required (hawlStartDate or hawlStartDateHijri)');
      }

      // Fetch current Nisab threshold
      const nisabData = await this.nisabCalculationService.calculateNisabThreshold(
        // shared types use hawl-based DTOs and prefer currency in caller; default to USD
        (dto as any).currency || 'USD',
        dto.nisabBasis as NisabBasis
      );

      // Create the record in DRAFT status
      // map CreateNisabYearRecordDto -> YearlySnapshot (Prisma model)
      const createData: Prisma.YearlySnapshotCreateInput = {
        userId,
        hawlStartDate: dto.hawlStartDate ? new Date(dto.hawlStartDate as any) : null,
        hawlStartDateHijri: dto.hawlStartDateHijri || null,
        hawlCompletionDate: dto.hawlCompletionDate ? new Date(dto.hawlCompletionDate as any) : null,
        hawlCompletionDateHijri: dto.hawlCompletionDateHijri || null,
        nisabBasis: dto.nisabBasis as any,
        status: 'DRAFT',
        nisabThresholdAtStart: nisabData.selectedNisab.toString(),
        nisabThresholdAtStartEncrypted: EncryptionService.encrypt(nisabData.selectedNisab.toString()) as any,
        calculationDate: new Date(),
        gregorianYear: new Date().getFullYear(),
        gregorianMonth: new Date().getMonth() + 1,
        gregorianDay: new Date().getDate(),
        hijriYear: 0,
        hijriMonth: 0,
        hijriDay: 0,
        totalWealth: (dto.totalWealth || 0).toString(),
        totalLiabilities: (dto.totalLiabilities || 0).toString(),
        zakatableWealth: (dto.zakatableWealth || 0).toString(),
        zakatAmount: (dto.zakatAmount || 0).toString(),
        methodologyUsed: dto.methodologyUsed || 'standard',
        assetBreakdown: dto.assetBreakdown ? JSON.stringify(dto.assetBreakdown) : null,
        calculationDetails: dto.calculationDetails ? JSON.stringify(dto.calculationDetails) : null,
        userNotes: dto.userNotes || null,
      } as any;

      const record = await this.prisma.yearlySnapshot.create({ data: createData });

      // Record audit event
      await this.auditTrailService.recordEvent(
        userId,
        'CREATED',
        record.id,
        { afterState: record as any }
      );

      this.logger.info(`Nisab Year Record created: ${record.id} for user ${userId}`);

      return this._mapToResponse(record);
    } catch (error) {
      this.logger.error('Failed to create Nisab Year Record', error);
      throw new Error(`Record creation failed: ${error.message}`);
    }
  }

  /**
   * Get a single record by ID
   * Includes live tracking data if DRAFT
   * 
   * @param userId - Requesting user (for authorization)
   * @param recordId - Record ID
   * @returns Record with live data
   */
  async getRecord(userId: string, recordId: string): Promise<NisabYearRecordResponse> {
    try {
      const record = await this.prisma.yearlySnapshot.findUnique({
        where: { id: recordId },
      });

      if (!record) {
        throw new Error('Record not found');
      }

      // Verify ownership
      if (record.userId !== userId) {
        throw new Error('Unauthorized: record does not belong to user');
      }

      // Add live tracking data if DRAFT
      let liveHawlData: LiveHawlData | undefined;
      if (record.status === 'DRAFT' && record.hawlStartDate) {
        const currentWealth = await this.wealthAggregationService.calculateTotalZakatableWealth(userId);
        liveHawlData = await this.hawlTrackingService.calculateLiveHawlData(
          record as any,
          currentWealth.totalZakatableWealth
        );
      }

      return this._mapToResponse(record, liveHawlData);
    } catch (error) {
      this.logger.error('Failed to get record', error);
      throw error;
    }
  }

  /**
   * Get all records for a user with optional filters
   * Supports filtering by status, Hijri year, and date range
   * 
   * @param userId - Record owner
   * @param filters - Optional filter criteria
   * @param limit - Results per page
   * @param offset - Pagination offset
   * @returns Records matching criteria
   */
  async getRecords(
    userId: string,
    filters?: {
      status?: RecordStatus[];
      hijriYear?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    records: NisabYearRecordResponse[];
    total: number;
  }> {
    try {
      const where: Prisma.YearlySnapshotWhereInput = {
        userId,
      };

      // Apply filters
      if (filters?.status?.length) {
        where.status = { in: filters.status };
      }
      if (filters?.hijriYear) {
        where.hijriYear = parseInt(filters.hijriYear, 10);
      }
      if (filters?.startDate || filters?.endDate) {
        where.calculationDate = {};
        if (filters.startDate) where.calculationDate.gte = filters.startDate;
        if (filters.endDate) where.calculationDate.lte = filters.endDate;
      }

      const [records, total] = await Promise.all([
        this.prisma.yearlySnapshot.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        this.prisma.yearlySnapshot.count({ where }),
      ]);

      return {
        records: records.map(r => this._mapToResponse(r)),
        total,
      };
    } catch (error) {
      this.logger.error('Failed to get records', error);
      throw error;
    }
  }

  /**
   * Update record details
   * Allowed in DRAFT status only
   * Creates audit trail for changes
   * 
   * @param userId - Record owner (for authorization)
   * @param recordId - Record ID to update
   * @param dto - Update data
   * @returns Updated record
   */
  async updateRecord(
    userId: string,
    recordId: string,
    dto: UpdateNisabYearRecordDto
  ): Promise<NisabYearRecordResponse> {
    try {
      const record = await this._verifyOwnership(userId, recordId);

      // Only allow updates in DRAFT status
      if (record.status !== 'DRAFT') {
        throw new Error(`Cannot update record in ${record.status} status`);
      }

      const beforeState = { ...record };

      // Update fields
      const updateData: Prisma.YearlySnapshotUpdateInput = {
        userNotes: dto.userNotes !== undefined ? dto.userNotes : record.userNotes,
        methodologyUsed: dto.methodologyUsed || record.methodologyUsed,
      } as any;

      const updatedRecord = await this.prisma.yearlySnapshot.update({
        where: { id: recordId },
        data: updateData,
      });

      // Record audit event with before/after states
      await this.auditTrailService.recordEvent(
        userId,
        'EDITED',
        recordId,
        {
          changesSummary: this._getChangedFields(beforeState, updatedRecord),
          beforeState,
          afterState: updatedRecord as any,
        }
      );

      this.logger.info(`Nisab Year Record updated: ${recordId}`);

      return this._mapToResponse(updatedRecord);
    } catch (error) {
      this.logger.error('Failed to update record', error);
      throw error;
    }
  }

  /**
   * Finalize a record
   * Transitions from DRAFT → FINALIZED
   * Locks most fields and creates final Zakat calculation
   * 
   * @param userId - Record owner
   * @param recordId - Record to finalize
   * @param dto - Finalization details
   * @returns Finalized record
   */
  async finalizeRecord(
    userId: string,
    recordId: string,
    dto: FinalizeRecordDto
  ): Promise<NisabYearRecordResponse> {
    try {
      const record = await this._verifyOwnership(userId, recordId);

      // Check if can finalize
      if (!['DRAFT', 'REFINALIZED'].includes(record.status)) {
        throw new Error(`Cannot finalize record in ${record.status} status`);
      }

      // Verify Hawl is complete
      if (!record.hawlStartDate) {
        throw new Error('Cannot finalize: Hawl not started');
      }

      const isHawlComplete = await this.hawlTrackingService.isHawlComplete(record.hawlStartDate);
      if (!isHawlComplete) {
        throw new Error('Cannot finalize: Hawl period not complete (354 days required)');
      }

      // Calculate final Zakat
      const zakatableWealth = await this.wealthAggregationService.calculatePeriodWealth(
        userId,
        record.hawlStartDate,
        record.hawlCompletionDate || new Date()
      );

  const finalZakatAmount = zakatableWealth.totalZakatableWealth * 0.025;

      // Update record to FINALIZED
      const finalizedRecord = await this.prisma.yearlySnapshot.update({
        where: { id: recordId },
        data: {
          status: 'FINALIZED',
          zakatableWealth: zakatableWealth.totalZakatableWealth.toString(),
          zakatAmount: finalZakatAmount.toString(),
          hawlCompletionDate: new Date(),
          userNotes: (dto as any).overrideNote || record.userNotes,
          finalizedAt: new Date(),
        } as any,
      });

      // Record audit event
      await this.auditTrailService.recordEvent(
        userId,
        'FINALIZED',
        recordId,
        {
          afterState: {
            status: 'FINALIZED',
            finalZakatAmount,
            finalizationNotes: (dto as any).overrideNote,
          },
        }
      );

      this.logger.info(`Nisab Year Record finalized: ${recordId} with Zakat ${finalZakatAmount}`);

      return this._mapToResponse(finalizedRecord);
    } catch (error) {
      this.logger.error('Failed to finalize record', error);
      throw error;
    }
  }

  /**
   * Unlock a finalized record
   * Transitions from FINALIZED → UNLOCKED
   * Allows corrections to the record
   * Requires justification
   * 
   * @param userId - Record owner
   * @param recordId - Record to unlock
   * @param dto - Unlock details with reason
   * @returns Unlocked record
   */
  async unlockRecord(
    userId: string,
    recordId: string,
    dto: UnlockRecordDto
  ): Promise<NisabYearRecordResponse> {
    try {
      const record = await this._verifyOwnership(userId, recordId);

      if (record.status !== 'FINALIZED') {
        throw new Error(`Cannot unlock record in ${record.status} status`);
      }

      // Validate unlock reason
      if (!(dto as any).unlockReason || (dto as any).unlockReason.length < 10) {
        throw new Error('Unlock reason must be at least 10 characters');
      }

      // Transition to UNLOCKED
      const unlockedRecord = await this.prisma.yearlySnapshot.update({
        where: { id: recordId },
        data: {
          status: 'UNLOCKED',
        } as any,
      });

      // Record audit event with encrypted reason
      await this.auditTrailService.recordEvent(
        userId,
        'UNLOCKED',
        recordId,
        {
          reason: (dto as any).unlockReason,
          afterState: { status: 'UNLOCKED', unlockedAt: new Date() },
        }
      );

      this.logger.info(`Nisab Year Record unlocked: ${recordId} with reason: ${(dto as any).unlockReason.substring(0, 20)}...`);

      return this._mapToResponse(unlockedRecord);
    } catch (error) {
      this.logger.error('Failed to unlock record', error);
      throw error;
    }
  }

  /**
   * Delete a record
   * Only DRAFT records can be deleted
   * 
   * @param userId - Record owner
   * @param recordId - Record to delete
   */
  async deleteRecord(userId: string, recordId: string): Promise<void> {
    try {
      const record = await this._verifyOwnership(userId, recordId);

      if (record.status !== 'DRAFT') {
        throw new Error(`Cannot delete record in ${record.status} status (only DRAFT allowed)`);
      }

      // Delete audit trail entries first (foreign key constraint)
      // Delete audit entries using raw SQL to avoid Prisma client type mismatches
      await this.prisma.$executeRaw`DELETE FROM audit_trail_entries WHERE "nisabYearRecordId" = ${recordId}`;

      // Delete the record
      await this.prisma.yearlySnapshot.delete({
        where: { id: recordId },
      });

      this.logger.info(`Nisab Year Record deleted: ${recordId}`);
    } catch (error) {
      this.logger.error('Failed to delete record', error);
      throw error;
    }
  }

  /**
   * Re-finalize an UNLOCKED record
   * Transitions from UNLOCKED → FINALIZED
   * Recalculates final Zakat based on current data
   * 
   * @param userId - Record owner
   * @param recordId - Record to re-finalize
   * @returns Re-finalized record
   */
  async refinalize(userId: string, recordId: string): Promise<NisabYearRecordResponse> {
    try {
      const record = await this._verifyOwnership(userId, recordId);

      if (record.status !== 'UNLOCKED') {
        throw new Error(`Cannot refinalize record in ${record.status} status`);
      }

      // Recalculate Zakat with any updated data
      const zakatableWealth = await this.wealthAggregationService.calculatePeriodWealth(
        userId,
        record.hawlStartDate!,
        record.hawlCompletionDate || new Date()
      );

  const finalZakatAmount = zakatableWealth.totalZakatableWealth * 0.025;

      // Transition to FINALIZED
      const refinializedRecord = await this.prisma.yearlySnapshot.update({
        where: { id: recordId },
        data: {
          status: 'FINALIZED',
          zakatableWealth: zakatableWealth.totalZakatableWealth.toString(),
          zakatAmount: finalZakatAmount.toString(),
          finalizedAt: new Date(),
        } as any,
      });

      // Record audit event
      await this.auditTrailService.recordEvent(
        userId,
        'REFINALIZED',
        recordId,
        { afterState: { status: 'FINALIZED', finalZakatAmount } }
      );

      this.logger.info(`Nisab Year Record re-finalized: ${recordId}`);

      return this._mapToResponse(refinializedRecord);
    } catch (error) {
      this.logger.error('Failed to refinalize record', error);
      throw error;
    }
  }

  /**
   * Private: Verify user ownership of record
   */
  private async _verifyOwnership(userId: string, recordId: string): Promise<any> {
    const record = await this.prisma.yearlySnapshot.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      throw new Error('Record not found');
    }

    if (record.userId !== userId) {
      throw new Error('Unauthorized: record does not belong to user');
    }

    return record;
  }

  /**
   * Private: Get changed fields between two states
   */
  private _getChangedFields(before: any, after: any): Record<string, any> {
    const changes: Record<string, any> = {};

    const trackFields = ['notes', 'nisabBasis', 'status'];
    for (const field of trackFields) {
      if (before[field] !== after[field]) {
        changes[field] = {
          before: before[field],
          after: after[field],
        };
      }
    }

    return changes;
  }

  /**
   * Private: Map database record to response DTO
   */
  private _mapToResponse(record: any, liveHawlData?: LiveHawlData): NisabYearRecordResponse {
    const data = {
      id: record.id,
      userId: record.userId,
      hawlStartDate: record.hawlStartDate,
      hawlStartDateHijri: record.hawlStartDateHijri,
      hawlCompletionDate: record.hawlCompletionDate,
      hawlCompletionDateHijri: record.hawlCompletionDateHijri,
      nisabThresholdAtStart: record.nisabThresholdAtStart,
      nisabBasis: record.nisabBasis,
      totalWealth: record.totalWealth,
      totalLiabilities: record.totalLiabilities,
      zakatableWealth: record.zakatableWealth,
      zakatAmount: record.zakatAmount,
      methodologyUsed: record.methodologyUsed,
      assetBreakdown: record.assetBreakdown,
      calculationDetails: record.calculationDetails,
      status: record.status,
      finalizedAt: record.finalizedAt,
      userNotes: record.userNotes,
      calculationDate: record.calculationDate,
      gregorianYear: record.gregorianYear,
      gregorianMonth: record.gregorianMonth,
      gregorianDay: record.gregorianDay,
    } as any;

    if (liveHawlData) {
      (data as any).liveTracking = liveHawlData;
    }

    return { success: true, data };
  }
}
