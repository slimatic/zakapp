import { PrismaClient } from '@prisma/client';
import { EncryptionService } from './EncryptionService';
import {
  CalculationSnapshot,
  CalculationSnapshotDetail,
  CreateCalculationSnapshotRequest,
  SnapshotComparison,
  SnapshotAssetValue
} from '../../../shared/src/types';

const prisma = new PrismaClient();
const encryptionService = new EncryptionService();

export class CalculationSnapshotService {
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
        methodology,
        methodologyConfigId,
        totalWealth: await encryptionService.encrypt(totalWealth.toString()),
        zakatDue: await encryptionService.encrypt(zakatDue.toString()),
        nisabThreshold: await encryptionService.encrypt(nisabThreshold.toString()),
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
      totalWealth,
      zakatDue,
      nisabThreshold,
      assetValues
    };
  }

  /**
   * Get all snapshots for a user
   * @param userId User ID
   * @returns Array of calculation snapshots
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
        totalWealth: parseFloat(await encryptionService.decrypt(snapshot.totalWealth)),
        zakatDue: parseFloat(await encryptionService.decrypt(snapshot.zakatDue)),
        nisabThreshold: parseFloat(await encryptionService.decrypt(snapshot.nisabThreshold))
      }))
    );
  }

  /**
   * Get a specific snapshot with details
   * @param userId User ID
   * @param snapshotId Snapshot ID
   * @returns Detailed snapshot information
   */
  async getSnapshot(userId: string, snapshotId: string): Promise<CalculationSnapshotDetail | null> {
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
      totalWealth: parseFloat(await encryptionService.decrypt(snapshot.totalWealth)),
      zakatDue: parseFloat(await encryptionService.decrypt(snapshot.zakatDue)),
      nisabThreshold: parseFloat(await encryptionService.decrypt(snapshot.nisabThreshold))
    };

    return decryptedSnapshot;
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

    const timeDifference = this.calculateTimeDifference(
      new Date(fromSnapshot.calculationDate),
      new Date(toSnapshot.calculationDate)
    );

    const wealthChange = this.calculateChange(
      fromSnapshot.totalWealth,
      toSnapshot.totalWealth
    );

    const zakatChange = this.calculateChange(
      fromSnapshot.zakatDue,
      toSnapshot.zakatDue
    );

    const assetChanges = this.compareAssetValues(
      fromSnapshot.assetValues,
      toSnapshot.assetValues
    );

    return {
      fromSnapshot,
      toSnapshot,
      timeDifference,
      wealthChange,
      zakatChange,
      assetChanges
    };
  }

  /**
   * Delete a snapshot (with validation)
   * @param userId User ID
   * @param snapshotId Snapshot ID
   */
  async deleteSnapshot(userId: string, snapshotId: string): Promise<void> {
    const snapshot = await prisma.calculationSnapshot.findFirst({
      where: { id: snapshotId, userId }
    });

    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    // Cannot delete current year snapshot (simplified check)
    const currentYear = new Date().getFullYear();
    const snapshotYear = new Date(snapshot.calculationDate).getFullYear();

    if (snapshotYear === currentYear) {
      throw new Error('Cannot delete current year snapshot');
    }

    await prisma.calculationSnapshot.delete({
      where: { id: snapshotId }
    });
  }

  /**
   * Unlock a snapshot for editing
   * @param userId User ID
   * @param snapshotId Snapshot ID
   * @param reason Reason for unlocking
   */
  async unlockSnapshot(userId: string, snapshotId: string, reason: string): Promise<void> {
    const snapshot = await prisma.calculationSnapshot.findFirst({
      where: { id: snapshotId, userId }
    });

    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    if (!snapshot.isLocked) {
      throw new Error('Snapshot is already unlocked');
    }

    await prisma.calculationSnapshot.update({
      where: { id: snapshotId },
      data: {
        isLocked: false,
        unlockedAt: new Date(),
        unlockedBy: userId,
        unlockReason: reason
      }
    });
  }

  /**
   * Lock a snapshot
   * @param userId User ID
   * @param snapshotId Snapshot ID
   */
  async lockSnapshot(userId: string, snapshotId: string): Promise<void> {
    const snapshot = await prisma.calculationSnapshot.findFirst({
      where: { id: snapshotId, userId }
    });

    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    if (snapshot.isLocked) {
      throw new Error('Snapshot is already locked');
    }

    await prisma.calculationSnapshot.update({
      where: { id: snapshotId },
      data: {
        isLocked: true,
        lockedAt: new Date()
      }
    });
  }

  private async createAssetValuesSnapshot(
    snapshotId: string,
    assets: any[]
  ): Promise<SnapshotAssetValue[]> {
    const assetValues = assets.map(asset => ({
      snapshotId,
      assetId: asset.id,
      assetName: asset.name,
      assetCategory: asset.category,
      capturedValue: asset.value,
      capturedAt: new Date(),
      isZakatable: this.isAssetZakatable(asset.category)
    }));

    await prisma.snapshotAssetValue.createMany({
      data: assetValues
    });

    return assetValues;
  }

  private calculateZakatYearBoundaries(date: Date, calendarType: string): {
    zakatYearStart: Date;
    zakatYearEnd: Date;
  } {
    // Simplified calculation - should use proper calendar logic
    const year = date.getFullYear();
    const start = new Date(year, 0, 1); // January 1st
    const end = new Date(year, 11, 31); // December 31st

    return { zakatYearStart: start, zakatYearEnd: end };
  }

  private isAssetZakatable(category: string): boolean {
    // Simplified logic - should use methodology rules
    const zakatableCategories = ['cash', 'gold', 'silver', 'business', 'investments'];
    return zakatableCategories.includes(category.toLowerCase());
  }

  private calculateTimeDifference(from: Date, to: Date): {
    days: number;
    months: number;
    years: number;
  } {
    const diffTime = Math.abs(to.getTime() - from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.abs(
      (to.getFullYear() * 12 + to.getMonth()) -
      (from.getFullYear() * 12 + from.getMonth())
    );
    const diffYears = Math.abs(to.getFullYear() - from.getFullYear());

    return { days: diffDays, months: diffMonths, years: diffYears };
  }

  private calculateChange(from: number, to: number): {
    absolute: number;
    percentage: number;
  } {
    const absolute = to - from;
    const percentage = from !== 0 ? (absolute / from) * 100 : 0;

    return { absolute, percentage };
  }

  private compareAssetValues(
    fromAssets: SnapshotAssetValue[],
    toAssets: SnapshotAssetValue[]
  ): {
    added: SnapshotAssetValue[];
    removed: SnapshotAssetValue[];
    modified: SnapshotAssetValue[];
    valueChange: number;
  } {
    const fromMap = new Map(fromAssets.map(a => [a.assetId, a]));
    const toMap = new Map(toAssets.map(a => [a.assetId, a]));

    const added = toAssets.filter(a => !fromMap.has(a.assetId));
    const removed = fromAssets.filter(a => !toMap.has(a.assetId));
    const modified = toAssets.filter(a => {
      const fromAsset = fromMap.get(a.assetId);
      return fromAsset && fromAsset.capturedValue !== a.capturedValue;
    });

    const totalFromValue = fromAssets.reduce((sum, a) => sum + a.capturedValue, 0);
    const totalToValue = toAssets.reduce((sum, a) => sum + a.capturedValue, 0);
    const valueChange = totalToValue - totalFromValue;

    return { added, removed, modified, valueChange };
  }
}

export default new CalculationSnapshotService();