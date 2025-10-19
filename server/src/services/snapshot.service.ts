import { PrismaClient, Asset, Liability } from '@prisma/client';
import { EncryptionService } from './EncryptionService';
import {
  CalculationSnapshot,
  CalculationSnapshotDetail,
  CreateCalculationSnapshotRequest,
  SnapshotComparison,
  SnapshotAssetValue
} from '../../../shared/src/types';

const prisma = new PrismaClient();

/**
 * CalculationSnapshotService - Handles immutable snapshots of Zakat calculations
 * Provides operations for creating, retrieving, and comparing calculation snapshots
 * with lock/unlock workflow for finalization
 */
export class CalculationSnapshotService {
  private readonly encryptionKey: string;

  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || '[REDACTED]';
  }

  /**
   * Create a new calculation snapshot
   * @param userId User ID
   * @param request Calculation request parameters
   * @returns Created calculation snapshot
   */
  async createSnapshot(
    userId: string,
    request: CreateCalculationSnapshotRequest
  ): Promise<CalculationSnapshotDetail> {
    const { methodology, methodologyConfigId, calendarType, referenceDate } = request;

    // Validate methodology config if CUSTOM
    if (methodology === 'CUSTOM' && !methodologyConfigId) {
      throw new Error('methodologyConfigId is required for CUSTOM methodology');
    }

    if (methodology !== 'CUSTOM' && methodologyConfigId) {
      throw new Error('methodologyConfigId should not be provided for non-CUSTOM methodologies');
    }

    // Get user preferences for defaults
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredCalendar: true, preferredMethodology: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const effectiveCalendarType = calendarType || user.preferredCalendar || 'GREGORIAN';
    const calculationDate = referenceDate ? new Date(referenceDate) : new Date();

    // Calculate Zakat year boundaries
    const { zakatYearStart, zakatYearEnd } = this.calculateZakatYearBoundaries(
      calculationDate,
      effectiveCalendarType
    );

    // Get all active assets
    const assets = await prisma.asset.findMany({
      where: { userId, isActive: true }
    });

    if (assets.length === 0) {
      throw new Error('No assets found for calculation');
    }

    // Calculate totals
    const totalWealth = assets.reduce((sum, asset) => sum + asset.value, 0);

    // Get nisab threshold (simplified - should use NisabService)
    const nisabThreshold = 7500; // Placeholder - should be calculated based on methodology

    // Calculate zakat due
    const zakatDue = totalWealth >= nisabThreshold ? totalWealth * 0.025 : 0;

    // Create the snapshot
    const snapshot = await prisma.calculationSnapshot.create({
      data: {
        userId,
        calculationDate,
        methodology: methodology.toString(),
        methodologyConfigId,
        totalWealth: await EncryptionService.encrypt(totalWealth.toString(), this.encryptionKey),
        zakatDue: await EncryptionService.encrypt(zakatDue.toString(), this.encryptionKey),
        nisabThreshold: await EncryptionService.encrypt(nisabThreshold.toString(), this.encryptionKey),
        calendarType: effectiveCalendarType,
        zakatYearStart,
        zakatYearEnd,
        isLocked: true
      }
    });

    // Create asset values snapshot
    const assetValues = await this.createAssetValuesSnapshot(snapshot.id, assets);

    return {
      ...snapshot,
      methodology: snapshot.methodology as 'STANDARD' | 'HANAFI' | 'SHAFII' | 'CUSTOM',
      calculationDate: snapshot.calculationDate.toISOString(),
      zakatYearStart: snapshot.zakatYearStart.toISOString(),
      zakatYearEnd: snapshot.zakatYearEnd.toISOString(),
      totalWealth,
      zakatDue,
      nisabThreshold,
      assetValues
    } as unknown as CalculationSnapshotDetail;
  }

  /**
   * Get all snapshots for a user
   * @param userId User ID
   * @returns List of snapshots
   */
  async getSnapshots(userId: string): Promise<CalculationSnapshot[]> {
    const snapshots = await prisma.calculationSnapshot.findMany({
      where: { userId },
      orderBy: { calculationDate: 'desc' }
    });

    // Decrypt sensitive fields
    return Promise.all(
      snapshots.map(async (snapshot) => ({
        ...snapshot,
        methodology: snapshot.methodology as 'STANDARD' | 'HANAFI' | 'SHAFII' | 'CUSTOM',
        calculationDate: snapshot.calculationDate.toISOString(),
        zakatYearStart: snapshot.zakatYearStart.toISOString(),
        zakatYearEnd: snapshot.zakatYearEnd.toISOString(),
        totalWealth: parseFloat(await EncryptionService.decrypt(snapshot.totalWealth, this.encryptionKey)),
        zakatDue: parseFloat(await EncryptionService.decrypt(snapshot.zakatDue, this.encryptionKey)),
        nisabThreshold: parseFloat(await EncryptionService.decrypt(snapshot.nisabThreshold, this.encryptionKey))
      }))
    ) as unknown as Promise<CalculationSnapshot[]>;
  }

  /**
   * Get a specific snapshot with details
   * @param userId User ID
   * @param snapshotId Snapshot ID
   * @returns Detailed snapshot information
   */
  async getSnapshot(
    userId: string,
    snapshotId: string
  ): Promise<CalculationSnapshotDetail | null> {
    const snapshot = await prisma.calculationSnapshot.findFirst({
      where: { id: snapshotId, userId },
      include: { assetValues: true }
    });

    if (!snapshot) {
      return null;
    }

    // Decrypt sensitive fields
    const decryptedSnapshot = {
      ...snapshot,
      methodology: snapshot.methodology as 'STANDARD' | 'HANAFI' | 'SHAFII' | 'CUSTOM',
      calculationDate: snapshot.calculationDate.toISOString(),
      zakatYearStart: snapshot.zakatYearStart.toISOString(),
      zakatYearEnd: snapshot.zakatYearEnd.toISOString(),
      totalWealth: parseFloat(await EncryptionService.decrypt(snapshot.totalWealth, this.encryptionKey)),
      zakatDue: parseFloat(await EncryptionService.decrypt(snapshot.zakatDue, this.encryptionKey)),
      nisabThreshold: parseFloat(
        await EncryptionService.decrypt(snapshot.nisabThreshold, this.encryptionKey)
      ),
      assetValues: snapshot.assetValues.map((av) => ({
        ...av,
        capturedAt: av.capturedAt.toISOString(),
        capturedValue: parseFloat(av.capturedValue)
      }))
    };

    return decryptedSnapshot as unknown as CalculationSnapshotDetail;
  }

  /**
   * Compare two snapshots
   * @param userId User ID
   * @param fromSnapshotId Source snapshot ID
   * @param toSnapshotId Target snapshot ID
   * @returns Comparison between snapshots
   */
  async compareSnapshots(
    userId: string,
    fromSnapshotId: string,
    toSnapshotId: string
  ): Promise<SnapshotComparison> {
    const [fromSnapshot, toSnapshot] = await Promise.all([
      this.getSnapshot(userId, fromSnapshotId),
      this.getSnapshot(userId, toSnapshotId)
    ]);

    if (!fromSnapshot || !toSnapshot) {
      throw new Error('One or both snapshots not found');
    }

    const fromDate = new Date(fromSnapshot.calculationDate);
    const toDate = new Date(toSnapshot.calculationDate);

    return {
      from: fromSnapshot,
      to: toSnapshot,
      wealthChange: {
        absolute: toSnapshot.totalWealth - fromSnapshot.totalWealth,
        percentage: ((toSnapshot.totalWealth - fromSnapshot.totalWealth) / fromSnapshot.totalWealth) * 100
      },
      zakatDueChange: {
        absolute: toSnapshot.zakatDue - fromSnapshot.zakatDue,
        percentage: ((toSnapshot.zakatDue - fromSnapshot.zakatDue) / (fromSnapshot.zakatDue || 1)) * 100
      },
      methodologyChange: fromSnapshot.methodology !== toSnapshot.methodology,
      daysElapsed: Math.floor(
        (toDate.getTime() - fromDate.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    } as unknown as SnapshotComparison;
  }

  /**
   * Lock a snapshot to make it immutable
   * @param userId User ID
   * @param snapshotId Snapshot ID
   * @returns Updated snapshot
   */
  async lockSnapshot(userId: string, snapshotId: string): Promise<CalculationSnapshot> {
    const snapshot = await prisma.calculationSnapshot.findFirst({
      where: { id: snapshotId, userId }
    });

    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    const updated = await prisma.calculationSnapshot.update({
      where: { id: snapshotId },
      data: { isLocked: true }
    });

    return {
      ...updated,
      methodology: updated.methodology as 'STANDARD' | 'HANAFI' | 'SHAFII' | 'CUSTOM',
      calculationDate: updated.calculationDate.toISOString(),
      zakatYearStart: updated.zakatYearStart.toISOString(),
      zakatYearEnd: updated.zakatYearEnd.toISOString()
    } as unknown as CalculationSnapshot;
  }

  /**
   * Unlock a snapshot to allow edits
   * @param userId User ID
   * @param snapshotId Snapshot ID
   * @param reason Reason for unlock
   * @returns Updated snapshot
   */
  async unlockSnapshot(userId: string, snapshotId: string, reason: string): Promise<CalculationSnapshot> {
    const snapshot = await prisma.calculationSnapshot.findFirst({
      where: { id: snapshotId, userId }
    });

    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    const updated = await prisma.calculationSnapshot.update({
      where: { id: snapshotId },
      data: {
        isLocked: false,
        unlockReason: reason,
        unlockedAt: new Date()
      }
    });

    return {
      ...updated,
      methodology: updated.methodology as 'STANDARD' | 'HANAFI' | 'SHAFII' | 'CUSTOM',
      calculationDate: updated.calculationDate.toISOString(),
      zakatYearStart: updated.zakatYearStart.toISOString(),
      zakatYearEnd: updated.zakatYearEnd.toISOString()
    } as unknown as CalculationSnapshot;
  }

  /**
   * Delete a snapshot
   * @param userId User ID
   * @param snapshotId Snapshot ID
   * @returns Deletion confirmation
   */
  async deleteSnapshot(userId: string, snapshotId: string): Promise<boolean> {
    const snapshot = await prisma.calculationSnapshot.findFirst({
      where: { id: snapshotId, userId }
    });

    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    // Delete related asset values first
    await prisma.snapshotAssetValue.deleteMany({
      where: { snapshotId }
    });

    // Delete the snapshot
    await prisma.calculationSnapshot.delete({
      where: { id: snapshotId }
    });

    return true;
  }

  /**
   * Create asset values snapshot
   * @param snapshotId Snapshot ID
   * @param assets Assets to snapshot
   * @returns Asset values
   */
  private async createAssetValuesSnapshot(
    snapshotId: string,
    assets: Asset[]
  ): Promise<SnapshotAssetValue[]> {
    const assetValues = await Promise.all(
      assets.map((asset) =>
        prisma.snapshotAssetValue.create({
          data: {
            snapshotId,
            assetId: asset.id,
            assetName: asset.name,
            assetCategory: asset.category,
            capturedValue: asset.value.toString(),
            capturedAt: new Date(),
            isZakatable: this.isAssetZakatable(asset.category)
          }
        })
      )
    );

    return assetValues.map((av) => ({
      ...av,
      capturedAt: av.capturedAt.toISOString(),
      capturedValue: parseFloat(av.capturedValue)
    })) as unknown as SnapshotAssetValue[];
  }

  /**
   * Determine if an asset category is zakatable
   * @param category Asset category
   * @returns True if zakatable
   */
  private isAssetZakatable(category: string): boolean {
    const zakatableCategories = [
      'CASH',
      'BANK_ACCOUNT',
      'GOLD',
      'SILVER',
      'CRYPTOCURRENCY',
      'BUSINESS_INVENTORY',
      'INVESTMENT_ACCOUNT'
    ];
    return zakatableCategories.includes(category);
  }

  /**
   * Calculate Zakat year boundaries
   * @param date Reference date
   * @param calendarType Calendar type (GREGORIAN or HIJRI)
   * @returns Year boundaries
   */
  private calculateZakatYearBoundaries(
    date: Date,
    calendarType: string
  ): { zakatYearStart: Date; zakatYearEnd: Date } {
    if (calendarType === 'HIJRI') {
      // Simplified Hijri calculation - in production, use hijri-converter
      // Calculate approximate Hijri year for reference purposes
      void Math.floor((date.getFullYear() - 622) * 1.03);
      const zakatYearStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const zakatYearEnd = new Date(zakatYearStart.getTime() + 365 * 24 * 60 * 60 * 1000);
      return { zakatYearStart, zakatYearEnd };
    }

    // Gregorian calendar - default to lunar year from reference date
    const zakatYearStart = new Date(date);
    const zakatYearEnd = new Date(zakatYearStart.getTime() + 365 * 24 * 60 * 60 * 1000);

    return { zakatYearStart, zakatYearEnd };
  }
}

// Export singleton instance
export const calculationSnapshotService = new CalculationSnapshotService();
