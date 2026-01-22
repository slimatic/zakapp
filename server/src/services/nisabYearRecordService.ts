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
 * Nisab Year Record Service (T045)
 * 
 * Core service for Nisab Year Record lifecycle management
 * Handles CRUD operations, status transitions, and live tracking
 */

import { PrismaClient } from '@prisma/client';
import type { YearlySnapshot } from '@prisma/client';
import { Logger } from '../utils/logger';
import { EncryptionService } from './EncryptionService';
import { AuditTrailService } from './auditTrailService';
import { NisabCalculationService } from './nisabCalculationService';
import { HawlTrackingService } from './hawlTrackingService';
import { WealthAggregationService } from './wealthAggregationService';
import type {
  NisabYearRecord,
  NisabYearRecordWithLiveTracking,
  RecordStatus,
  NisabBasis,
  CreateNisabYearRecordDto,
  UpdateNisabYearRecordDto,
  FinalizeRecordDto,
  UnlockRecordDto,
  LiveHawlData,
  LiveTrackingData,
} from '@zakapp/shared';

export class NisabYearRecordService {
  private logger = new Logger('NisabYearRecordService');
  private prisma: PrismaClient;
  private auditTrailService: AuditTrailService;
  private nisabCalculationService: NisabCalculationService;
  private hawlTrackingService: HawlTrackingService;
  private wealthAggregationService: WealthAggregationService;

  constructor(
    prisma?: PrismaClient,
    auditTrailService?: AuditTrailService,
    nisabCalculationService?: NisabCalculationService,
    hawlTrackingService?: HawlTrackingService,
    wealthAggregationService?: WealthAggregationService
  ) {
    this.prisma = prisma || new PrismaClient();
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
  ): Promise<NisabYearRecord | NisabYearRecordWithLiveTracking> {
    try {
      // Check resource limits
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { maxNisabRecords: true }
      });

      if (user) {
        const limit = user.maxNisabRecords ?? parseInt(process.env.DEFAULT_MAX_NISAB_RECORDS || '10');
        const currentCount = await this.prisma.yearlySnapshot.count({
          where: { userId }
        });

        if (currentCount >= limit) {
          throw new Error(`Nisab Record limit reached. You can create a maximum of ${limit} records.`);
        }
      }

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
        dto.currency || 'USD',
        dto.nisabBasis as NisabBasis
      );

      // Build asset breakdown snapshot if selectedAssetIds provided
      let assetBreakdownEncrypted: string | null = null;
      if (dto.selectedAssetIds && dto.selectedAssetIds.length > 0) {
        // Fetch all zakatable assets
        const allAssets = await this.wealthAggregationService.getZakatableAssets(userId);

        // Filter to selected assets only
        const selectedAssets = allAssets.filter(asset =>
          dto.selectedAssetIds!.includes(asset.id)
        );

        // Build asset breakdown JSON
        const totalWealth = selectedAssets.reduce((sum, asset) => sum + asset.value, 0);
        const zakatableWealth = selectedAssets
          .filter(a => a.isZakatable)
          .reduce((sum, asset) => sum + ((asset as any).zakatableValue || asset.value || 0), 0);

        const assetBreakdown = {
          assets: selectedAssets.map(asset => ({
            id: asset.id,
            name: asset.name,
            category: asset.category,
            value: asset.value,
            calculationModifier: (asset as any).calculationModifier || 1.0,
            zakatableValue: (asset as any).zakatableValue || asset.value,
            isZakatable: asset.isZakatable,
            addedAt: asset.addedAt.toISOString(),
          })),
          capturedAt: new Date().toISOString(),
          totalWealth,
          zakatableWealth,
        };

        // Encrypt asset breakdown
        assetBreakdownEncrypted = await EncryptionService.encrypt(
          JSON.stringify(assetBreakdown),
          process.env.ENCRYPTION_KEY!
        );
      } else if (dto.assetBreakdown) {
        // Use provided assetBreakdown if no selectedAssetIds
        assetBreakdownEncrypted = JSON.stringify(dto.assetBreakdown);
      }

      // Ensure assetBreakdown is not null
      if (!assetBreakdownEncrypted) {
        assetBreakdownEncrypted = await EncryptionService.encrypt('{}', process.env.ENCRYPTION_KEY!);
      }

      // Create the record in DRAFT status
      // map CreateNisabYearRecordDto -> YearlySnapshot (Prisma model)
      const createData: Record<string, unknown> = {
        hawlStartDate: new Date(dto.hawlStartDate),
        hawlStartDateHijri: dto.hawlStartDateHijri,
        hawlCompletionDate: new Date(dto.hawlCompletionDate),
        hawlCompletionDateHijri: dto.hawlCompletionDateHijri,
        nisabBasis: dto.nisabBasis || 'GOLD',
        status: 'DRAFT',
        nisabThreshold: (dto.nisabThresholdAtStart ?? nisabData.selectedNisab).toString(), // Deprecated but required
        nisabType: dto.nisabBasis || 'GOLD', // Deprecated but required
        nisabThresholdAtStart: await EncryptionService.encrypt(
          (dto.nisabThresholdAtStart ?? nisabData.selectedNisab).toString(),
          process.env.ENCRYPTION_KEY!
        ),
        calculationDate: new Date(),
        gregorianYear: new Date().getFullYear(),
        gregorianMonth: new Date().getMonth() + 1,
        gregorianDay: new Date().getDate(),
        hijriYear: dto.hawlStartDateHijri ? parseInt(dto.hawlStartDateHijri.split('-')[0]) : 0,
        hijriMonth: dto.hawlStartDateHijri ? parseInt(dto.hawlStartDateHijri.split('-')[1]) : 0,
        hijriDay: dto.hawlStartDateHijri ? parseInt(dto.hawlStartDateHijri.split('-')[2]) : 0,
        totalWealth: (dto.totalWealth || 0).toString(),
        totalLiabilities: (dto.totalLiabilities || 0).toString(),
        zakatableWealth: (dto.zakatableWealth || 0).toString(),
        zakatAmount: (dto.zakatAmount || 0).toString(),
        methodologyUsed: dto.methodologyUsed || 'standard',
        assetBreakdown: assetBreakdownEncrypted,
        calculationDetails: dto.calculationDetails ? JSON.stringify(dto.calculationDetails) : JSON.stringify({}),
        userNotes: dto.userNotes || null,
        user: {
          connect: { id: userId }
        }
      };

      const record = await this.prisma.yearlySnapshot.create({ data: createData as any });

      // Record audit event
      await this.auditTrailService.recordEvent(
        userId,
        'CREATED',
        record.id,
        { afterState: record as Record<string, unknown> }
      );

      this.logger.info(`Nisab Year Record created: ${record.id} for user ${userId}`);

      return await this._mapToResponse(record);
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
  async getRecord(userId: string, recordId: string): Promise<NisabYearRecord> {
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
      let liveTrackingData: LiveTrackingData | undefined;
      if (record.status === 'DRAFT' && record.hawlStartDate) {
        const currentWealth = await this.wealthAggregationService.calculateTotalZakatableWealth(userId);
        const liveHawlData = await this.hawlTrackingService.calculateLiveHawlData(
          record as { hawlStartDate: Date; nisabThreshold: string;[key: string]: unknown },
          currentWealth.totalZakatableWealth
        );
        // Convert live data and include both totalWealth and totalZakatableWealth for richer UI
        liveTrackingData = this._convertLiveHawlToLiveTracking(liveHawlData, currentWealth.totalWealth, currentWealth.totalZakatableWealth);
      }

      return await this._mapToResponse(record, liveTrackingData);
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
    records: (NisabYearRecord | NisabYearRecordWithLiveTracking)[];
    total: number;
  }> {
    try {
      const where: any = {
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
        records: await Promise.all(records.map(r => this._mapToResponse(r))),
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
  ): Promise<NisabYearRecord | NisabYearRecordWithLiveTracking> {
    try {
      const record = await this._verifyOwnership(userId, recordId);

      // Allow updates in DRAFT and UNLOCKED status
      if (record.status !== 'DRAFT' && record.status !== 'UNLOCKED') {
        throw new Error(`Cannot update record in ${record.status} status`);
      }

      const beforeState = { ...record };

      // Update fields
      const updateData: Record<string, unknown> = {
        userNotes: dto.userNotes !== undefined ? dto.userNotes : record.userNotes,
        methodologyUsed: dto.methodologyUsed || record.methodologyUsed,
      };

      // Handle date updates
      if (dto.hawlStartDate !== undefined) {
        updateData.hawlStartDate = new Date(dto.hawlStartDate);
      }

      if (dto.hawlCompletionDate !== undefined) {
        updateData.hawlCompletionDate = new Date(dto.hawlCompletionDate);
      }

      // Handle wealth updates (must be encrypted)
      if (dto.totalWealth !== undefined) {
        const wealth = typeof dto.totalWealth === 'string' ? dto.totalWealth : dto.totalWealth.toString();
        try {
          updateData.totalWealth = await EncryptionService.encrypt(wealth, process.env.ENCRYPTION_KEY!);
        } catch (error) {
          this.logger.error('Failed to encrypt totalWealth', error);
          throw new Error('Failed to encrypt wealth data');
        }
      }

      if (dto.zakatableWealth !== undefined) {
        const wealth = typeof dto.zakatableWealth === 'string' ? dto.zakatableWealth : dto.zakatableWealth.toString();
        try {
          updateData.zakatableWealth = await EncryptionService.encrypt(wealth, process.env.ENCRYPTION_KEY!);
        } catch (error) {
          this.logger.error('Failed to encrypt zakatableWealth', error);
          throw new Error('Failed to encrypt wealth data');
        }
      }

      if (dto.zakatAmount !== undefined) {
        const amount = typeof dto.zakatAmount === 'string' ? dto.zakatAmount : dto.zakatAmount.toString();
        try {
          updateData.zakatAmount = await EncryptionService.encrypt(amount, process.env.ENCRYPTION_KEY!);
        } catch (error) {
          this.logger.error('Failed to encrypt zakatAmount', error);
          throw new Error('Failed to encrypt zakat amount');
        }
      }

      if (dto.totalLiabilities !== undefined) {
        const liabilities = typeof dto.totalLiabilities === 'string' ? dto.totalLiabilities : dto.totalLiabilities.toString();
        try {
          updateData.totalLiabilities = await EncryptionService.encrypt(liabilities, process.env.ENCRYPTION_KEY!);
        } catch (error) {
          this.logger.error('Failed to encrypt totalLiabilities', error);
          throw new Error('Failed to encrypt liabilities data');
        }
      }

      // Handle asset breakdown encryption
      if (dto.assetBreakdown !== undefined) {
        try {
          const encrypted = await EncryptionService.encrypt(JSON.stringify(dto.assetBreakdown), process.env.ENCRYPTION_KEY!);
          updateData.assetBreakdown = encrypted;
        } catch (error) {
          this.logger.error('Failed to encrypt asset breakdown', error);
          throw new Error('Failed to encrypt asset data');
        }
      }

      // Handle calculation details encryption
      if (dto.calculationDetails !== undefined) {
        try {
          const encrypted = await EncryptionService.encrypt(JSON.stringify(dto.calculationDetails), process.env.ENCRYPTION_KEY!);
          updateData.calculationDetails = encrypted;
        } catch (error) {
          this.logger.error('Failed to encrypt calculation details', error);
          throw new Error('Failed to encrypt calculation details');
        }
      }

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
          afterState: updatedRecord as Record<string, unknown>,
        }
      );

      this.logger.info(`Nisab Year Record updated: ${recordId}`);

      return await this._mapToResponse(updatedRecord);
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
  ): Promise<NisabYearRecord | NisabYearRecordWithLiveTracking> {
    try {
      const record = await this._verifyOwnership(userId, recordId);

      // Check if can finalize: allow DRAFT or UNLOCKED (re-finalize flow)
      if (!['DRAFT', 'REFINALIZED', 'UNLOCKED'].includes(record.status)) {
        throw new Error(`Cannot finalize record in ${record.status} status`);
      }

      // Verify Hawl is complete
      if (!record.hawlStartDate) {
        throw new Error('Cannot finalize: Hawl not started');
      }

      const isHawlComplete = await this.hawlTrackingService.isHawlComplete(record.hawlStartDate as Date);
      if (!isHawlComplete) {
        throw new Error('Cannot finalize: Hawl period not complete (354 days required)');
      }

      // Calculate final Zakat using all current active assets
      // Note: Hawl period tracking validates duration requirement, not which assets to include
      const zakatableWealth = await this.wealthAggregationService.calculateTotalZakatableWealth(userId);

      const finalZakatAmount = zakatableWealth.totalZakatableWealth * 0.025;

      // Calculate total gross wealth. Prefer explicit totalWealth if provided by the aggregation service.
      const totalWealth = typeof zakatableWealth.totalWealth === 'number'
        ? zakatableWealth.totalWealth
        : Object.values(zakatableWealth.breakdown).reduce((sum: number, val: number) => sum + val, 0);

      // Encrypt all wealth fields before saving
      const encryptedTotalWealth = await EncryptionService.encrypt(
        totalWealth.toString(),
        process.env.ENCRYPTION_KEY!
      );
      const encryptedZakatableWealth = await EncryptionService.encrypt(
        zakatableWealth.totalZakatableWealth.toString(),
        process.env.ENCRYPTION_KEY!
      );
      const encryptedZakatAmount = await EncryptionService.encrypt(
        finalZakatAmount.toString(),
        process.env.ENCRYPTION_KEY!
      );

      // Update record to FINALIZED
      // If this is a re-finalization (record.status === 'UNLOCKED'), preserve the original hawlStartDate and hawlCompletionDate where appropriate
      const updateData: any = {
        status: 'FINALIZED',
        totalWealth: encryptedTotalWealth,
        zakatableWealth: encryptedZakatableWealth,
        zakatAmount: encryptedZakatAmount,
        userNotes: ('overrideNote' in dto ? (dto as { overrideNote?: string }).overrideNote : undefined) || record.userNotes,
        finalizedAt: new Date(),
      };

      // Only set hawlCompletionDate to now when the previous status was DRAFT (first finalization)
      if (record.status === 'DRAFT') {
        updateData.hawlCompletionDate = new Date();
      }

      const finalizedRecord = await this.prisma.yearlySnapshot.update({
        where: { id: recordId },
        data: updateData,
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
            finalizationNotes: ('overrideNote' in dto ? (dto as { overrideNote?: string }).overrideNote : undefined),
          },
        }
      );

      this.logger.info(`Nisab Year Record finalized: ${recordId} with Zakat ${finalZakatAmount}`);

      return await this._mapToResponse(finalizedRecord);
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
  ): Promise<NisabYearRecord | NisabYearRecordWithLiveTracking> {
    try {
      const record = await this._verifyOwnership(userId, recordId);

      if (record.status !== 'FINALIZED') {
        throw new Error(`Cannot unlock record in ${record.status} status`);
      }

      // Validate unlock reason
      const unlockReason = ('unlockReason' in dto ? (dto as { unlockReason?: string }).unlockReason : undefined);
      if (!unlockReason || unlockReason.length < 10) {
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
          reason: unlockReason,
          afterState: { status: 'UNLOCKED', unlockedAt: new Date() },
        }
      );

      this.logger.info(`Nisab Year Record unlocked: ${recordId} with reason: ${unlockReason.substring(0, 20)}...`);

      return await this._mapToResponse(unlockedRecord);
    } catch (error) {
      this.logger.error('Failed to unlock record', error);
      throw error;
    }
  }

  /**
   * Delete a record
   * Only allowed for DRAFT and UNLOCKED records (not FINALIZED)
   * 
   * @param userId - Record owner
   * @param recordId - Record to delete
   */
  async deleteRecord(userId: string, recordId: string): Promise<void> {
    try {
      const record = await this._verifyOwnership(userId, recordId);

      if (record.status === 'FINALIZED') {
        throw new Error(`Cannot delete FINALIZED record. Please unlock it first if you need to make changes.`);
      }

      if (record.status !== 'DRAFT' && record.status !== 'UNLOCKED') {
        throw new Error(`Cannot delete record in ${record.status} status (only DRAFT or UNLOCKED allowed)`);
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
  async refinalize(userId: string, recordId: string): Promise<NisabYearRecord | NisabYearRecordWithLiveTracking> {
    try {
      const record = await this._verifyOwnership(userId, recordId);

      if (record.status !== 'UNLOCKED') {
        throw new Error(`Cannot refinalize record in ${record.status} status`);
      }

      // Recalculate Zakat using all current active assets
      // Note: Hawl period tracking validates duration requirement, not which assets to include
      const zakatableWealth = await this.wealthAggregationService.calculateTotalZakatableWealth(userId);

      const finalZakatAmount = zakatableWealth.totalZakatableWealth * 0.025;

      // Calculate total gross wealth. Prefer explicit totalWealth if provided by the aggregation service.
      const totalWealth = typeof zakatableWealth.totalWealth === 'number'
        ? zakatableWealth.totalWealth
        : Object.values(zakatableWealth.breakdown).reduce((sum: number, val: number) => sum + val, 0);

      // Encrypt all wealth fields before saving
      const encryptedTotalWealth = await EncryptionService.encrypt(
        totalWealth.toString(),
        process.env.ENCRYPTION_KEY!
      );
      const encryptedZakatableWealth = await EncryptionService.encrypt(
        zakatableWealth.totalZakatableWealth.toString(),
        process.env.ENCRYPTION_KEY!
      );
      const encryptedZakatAmount = await EncryptionService.encrypt(
        finalZakatAmount.toString(),
        process.env.ENCRYPTION_KEY!
      );

      // Transition to FINALIZED
      const refinializedRecord = await this.prisma.yearlySnapshot.update({
        where: { id: recordId },
        data: {
          status: 'FINALIZED',
          totalWealth: encryptedTotalWealth,
          zakatableWealth: encryptedZakatableWealth,
          zakatAmount: encryptedZakatAmount,
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

      return await this._mapToResponse(refinializedRecord);
    } catch (error) {
      this.logger.error('Failed to refinalize record', error);
      throw error;
    }
  }

  /**
   * Private: Verify user ownership of record
   */
  private async _verifyOwnership(userId: string, recordId: string): Promise<{ id: string; userId: string; status: string;[key: string]: unknown }> {
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
  private _getChangedFields(before: Record<string, unknown>, after: Record<string, unknown>): Record<string, unknown> {
    const changes: Record<string, unknown> = {};

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
  private async _mapToResponse(record: YearlySnapshot, liveTrackingData?: LiveTrackingData): Promise<NisabYearRecord | NisabYearRecordWithLiveTracking> {
    // Decrypt sensitive fields with fallback for plaintext or corrupted data
    const safeDecrypt = async (value: string | null | undefined, defaultValue = '0'): Promise<string> => {
      if (!value) return defaultValue;
      try {
        const decrypted = await EncryptionService.decrypt(value, process.env.ENCRYPTION_KEY!);
        return decrypted || defaultValue;
      } catch {
        // If decryption fails, assume it's plaintext or return default
        return !isNaN(Number(value)) ? value : defaultValue;
      }
    };

    const decryptedTotalWealth = await safeDecrypt(record.totalWealth as string | null | undefined);
    const decryptedTotalLiabilities = await safeDecrypt(record.totalLiabilities as string | null | undefined);
    const decryptedZakatableWealth = await safeDecrypt(record.zakatableWealth as string | null | undefined);
    const decryptedZakatAmount = await safeDecrypt(record.zakatAmount as string | null | undefined);
    const decryptedNisabThreshold = await safeDecrypt(record.nisabThresholdAtStart as string | null | undefined);

    const baseRecord: NisabYearRecord = {
      id: record.id,
      userId: record.userId,
      hawlStartDate: record.hawlStartDate as Date | string,
      hawlStartDateHijri: record.hawlStartDateHijri || '',
      hawlCompletionDate: record.hawlCompletionDate as Date | string,
      hawlCompletionDateHijri: record.hawlCompletionDateHijri || '',
      nisabThresholdAtStart: Number(decryptedNisabThreshold),
      nisabBasis: (record.nisabBasis as NisabBasis) || 'GOLD',
      totalWealth: decryptedTotalWealth,
      totalLiabilities: decryptedTotalLiabilities,
      zakatableWealth: decryptedZakatableWealth,
      zakatAmount: decryptedZakatAmount,
      methodologyUsed: record.methodologyUsed,
      assetBreakdown: record.assetBreakdown,
      calculationDetails: record.calculationDetails,
      status: record.status as RecordStatus,
      finalizedAt: record.finalizedAt,
      userNotes: record.userNotes,
      calculationDate: record.calculationDate,
      gregorianYear: record.gregorianYear,
      gregorianMonth: record.gregorianMonth,
      gregorianDay: record.gregorianDay,
      hijriYear: record.hijriYear,
      hijriMonth: record.hijriMonth,
      hijriDay: record.hijriDay,
      isPrimary: record.isPrimary,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };

    return liveTrackingData
      ? ({ ...baseRecord, liveTracking: liveTrackingData } as NisabYearRecordWithLiveTracking)
      : baseRecord;
  }

  private _convertLiveHawlToLiveTracking(liveHawlData: LiveHawlData, currentTotalWealth?: number, currentZakatableWealth?: number): LiveTrackingData {
    return {
      currentTotalWealth: currentTotalWealth ?? liveHawlData.currentWealth,
      // Also expose zakatable wealth explicitly for UI
      // NOTE: LiveTrackingData type allows additional properties
      ...(currentZakatableWealth !== undefined ? { currentZakatableWealth } : {}),
      nisabThreshold: liveHawlData.nisabThreshold,
      daysRemaining: liveHawlData.daysRemaining,
      hawlProgress: liveHawlData.hawlProgress,
      isHawlComplete: liveHawlData.isHawlComplete,
      canFinalize: liveHawlData.canFinalize,
      lastUpdated: liveHawlData.lastUpdated,
    } as any;
  }
}
