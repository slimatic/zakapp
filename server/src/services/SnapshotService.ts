import { PrismaClient } from '@prisma/client';
import { EncryptionService } from './EncryptionService';

const prisma = new PrismaClient();
const encryptionService = new EncryptionService();

export interface CreateSnapshotRequest {
  name?: string;
  description?: string;
  tags?: string[];
  includeAssets?: string[];
  includeLiabilities?: string[];
  metadata?: Record<string, any>;
}

export interface SnapshotData {
  id: string;
  userId: string;
  name: string;
  description?: string;
  snapshotDate: Date;
  islamicYear: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assetsCount: number;
  liabilitiesCount: number;
  tags: string[];
  metadata: Record<string, any>;
  assets: any[];
  liabilities: any[];
}

export interface SnapshotComparison {
  baseSnapshot: SnapshotData;
  compareSnapshot: SnapshotData;
  timeDifference: {
    days: number;
    months: number;
    years: number;
  };
  netWorthChange: {
    absolute: number;
    percentage: number;
  };
  assetChanges: {
    added: any[];
    removed: any[];
    modified: any[];
    valueChange: number;
  };
  liabilityChanges: {
    added: any[];
    removed: any[];
    modified: any[];
    valueChange: number;
  };
  categoryAnalysis: Record<string, {
    previousValue: number;
    currentValue: number;
    change: number;
    changePercentage: number;
  }>;
}

export class SnapshotService {
  /**
   * Create a snapshot of user's current financial state
   */
  async createSnapshot(userId: string, request: CreateSnapshotRequest = {}): Promise<SnapshotData> {
    const {
      name,
      description,
      tags = [],
      includeAssets = [],
      includeLiabilities = [],
      metadata = {}
    } = request;

    const now = new Date();
    const islamicYear = this.getIslamicYear(now);
    
    // Get default snapshot name if not provided
    const snapshotName = name || `Snapshot ${now.toISOString().split('T')[0]}`;

    // Get user assets
    const assetsQuery: any = {
      userId,
      isActive: true
    };
    
    if (includeAssets.length > 0) {
      assetsQuery.id = { in: includeAssets };
    }

    const assets = await prisma.asset.findMany({
      where: assetsQuery,
      include: {
        metadata: true
      }
    });

    // Get user liabilities
    const liabilitiesQuery: any = {
      userId,
      isActive: true
    };
    
    if (includeLiabilities.length > 0) {
      liabilitiesQuery.id = { in: includeLiabilities };
    }

    const liabilities = await prisma.liability.findMany({
      where: liabilitiesQuery
    });

    // Calculate totals
    const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
    const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.amount, 0);
    const netWorth = totalAssets - totalLiabilities;

    // Encrypt snapshot data
    const encryptedAssets = encryptionService.encryptObject({
      assets: assets.map(asset => ({
        id: asset.id,
        name: asset.name,
        category: asset.category,
        value: asset.value,
        currency: asset.currency,
        acquisitionDate: asset.acquisitionDate,
        metadata: asset.metadata
      }))
    });

    const encryptedLiabilities = encryptionService.encryptObject({
      liabilities: liabilities.map(liability => ({
        id: liability.id,
        name: liability.name,
        type: liability.type,
        amount: liability.amount,
        currency: liability.currency,
        dueDate: liability.dueDate
      }))
    });

    // Create snapshot
    const snapshot = await prisma.snapshot.create({
      data: {
        userId,
        name: snapshotName,
        description: description || null,
        snapshotDate: now,
        islamicYear,
        totalAssets,
        totalLiabilities,
        netWorth,
        assetsCount: assets.length,
        liabilitiesCount: liabilities.length,
        tags: JSON.stringify(tags),
        metadata: JSON.stringify({
          ...metadata,
          creationMethod: 'manual',
          includeAssets: includeAssets.length > 0 ? includeAssets : 'all',
          includeLiabilities: includeLiabilities.length > 0 ? includeLiabilities : 'all'
        }),
        assetsData: encryptedAssets,
        liabilitiesData: encryptedLiabilities
      }
    });

    return this.formatSnapshotData(snapshot, assets, liabilities);
  }

  /**
   * Get user snapshots with pagination
   */
  async getUserSnapshots(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      year?: string;
      tags?: string[];
      sortBy?: 'date' | 'name' | 'netWorth';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ) {
    const {
      page = 1,
      limit = 10,
      year,
      tags = [],
      sortBy = 'date',
      sortOrder = 'desc'
    } = options;

    const where: any = { userId };
    
    if (year) {
      where.islamicYear = year;
    }

    const snapshots = await prisma.snapshot.findMany({
      where,
      orderBy: this.buildOrderBy(sortBy, sortOrder),
      skip: (page - 1) * limit,
      take: limit
    });

    const total = await prisma.snapshot.count({ where });

    // Filter by tags if provided
    let filteredSnapshots = snapshots;
    if (tags.length > 0) {
      filteredSnapshots = snapshots.filter(snapshot => {
        const snapshotTags = JSON.parse(snapshot.tags || '[]');
        return tags.some(tag => snapshotTags.includes(tag));
      });
    }

    return {
      snapshots: filteredSnapshots.map(snapshot => ({
        id: snapshot.id,
        name: snapshot.name,
        description: snapshot.description,
        snapshotDate: snapshot.snapshotDate,
        islamicYear: snapshot.islamicYear,
        totalAssets: snapshot.totalAssets,
        totalLiabilities: snapshot.totalLiabilities,
        netWorth: snapshot.netWorth,
        assetsCount: snapshot.assetsCount,
        liabilitiesCount: snapshot.liabilitiesCount,
        tags: JSON.parse(snapshot.tags || '[]'),
        metadata: JSON.parse(snapshot.metadata || '{}')
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get specific snapshot by ID
   */
  async getSnapshotById(userId: string, snapshotId: string): Promise<SnapshotData> {
    const snapshot = await prisma.snapshot.findFirst({
      where: {
        id: snapshotId,
        userId
      }
    });

    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    // Decrypt snapshot data
    const assetsData = encryptionService.decryptObject(snapshot.assetsData);
    const liabilitiesData = encryptionService.decryptObject(snapshot.liabilitiesData);

    return this.formatSnapshotData(
      snapshot,
      assetsData.assets || [],
      liabilitiesData.liabilities || []
    );
  }

  /**
   * Compare two snapshots
   */
  async compareSnapshots(
    userId: string,
    baseSnapshotId: string,
    compareSnapshotId: string
  ): Promise<SnapshotComparison> {
    const baseSnapshot = await this.getSnapshotById(userId, baseSnapshotId);
    const compareSnapshot = await this.getSnapshotById(userId, compareSnapshotId);

    // Calculate time difference
    const timeDiff = this.calculateTimeDifference(
      baseSnapshot.snapshotDate,
      compareSnapshot.snapshotDate
    );

    // Calculate net worth change
    const netWorthChange = {
      absolute: compareSnapshot.netWorth - baseSnapshot.netWorth,
      percentage: baseSnapshot.netWorth === 0 ? 0 : 
        ((compareSnapshot.netWorth - baseSnapshot.netWorth) / baseSnapshot.netWorth) * 100
    };

    // Analyze asset changes
    const assetChanges = this.analyzeAssetChanges(baseSnapshot.assets, compareSnapshot.assets);

    // Analyze liability changes
    const liabilityChanges = this.analyzeLiabilityChanges(
      baseSnapshot.liabilities,
      compareSnapshot.liabilities
    );

    // Category analysis
    const categoryAnalysis = this.analyzeCategoryChanges(
      baseSnapshot.assets,
      compareSnapshot.assets
    );

    return {
      baseSnapshot,
      compareSnapshot,
      timeDifference: timeDiff,
      netWorthChange,
      assetChanges,
      liabilityChanges,
      categoryAnalysis
    };
  }

  /**
   * Update snapshot metadata
   */
  async updateSnapshot(
    userId: string,
    snapshotId: string,
    updates: {
      name?: string;
      description?: string;
      tags?: string[];
      metadata?: Record<string, any>;
    }
  ) {
    const snapshot = await prisma.snapshot.findFirst({
      where: { id: snapshotId, userId }
    });

    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    const currentMetadata = JSON.parse(snapshot.metadata || '{}');
    const updatedMetadata = updates.metadata ? 
      { ...currentMetadata, ...updates.metadata } : currentMetadata;

    const updatedSnapshot = await prisma.snapshot.update({
      where: { id: snapshotId },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.description && { description: updates.description }),
        ...(updates.tags && { tags: JSON.stringify(updates.tags) }),
        metadata: JSON.stringify(updatedMetadata)
      }
    });

    return {
      id: updatedSnapshot.id,
      name: updatedSnapshot.name,
      description: updatedSnapshot.description,
      snapshotDate: updatedSnapshot.snapshotDate,
      tags: JSON.parse(updatedSnapshot.tags || '[]'),
      metadata: JSON.parse(updatedSnapshot.metadata || '{}')
    };
  }

  /**
   * Delete snapshot
   */
  async deleteSnapshot(userId: string, snapshotId: string): Promise<void> {
    const snapshot = await prisma.snapshot.findFirst({
      where: { id: snapshotId, userId }
    });

    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    await prisma.snapshot.delete({
      where: { id: snapshotId }
    });
  }

  /**
   * Get snapshot statistics
   */
  async getSnapshotStatistics(userId: string, year?: string) {
    const where: any = { userId };
    if (year) {
      where.islamicYear = year;
    }

    const snapshots = await prisma.snapshot.findMany({
      where,
      orderBy: { snapshotDate: 'asc' }
    });

    if (snapshots.length === 0) {
      return {
        totalSnapshots: 0,
        dateRange: null,
        netWorthTrend: [],
        averageNetWorth: 0,
        bestPerformingPeriod: null,
        worstPerformingPeriod: null
      };
    }

    const netWorthTrend = snapshots.map(snapshot => ({
      date: snapshot.snapshotDate,
      netWorth: snapshot.netWorth,
      totalAssets: snapshot.totalAssets,
      totalLiabilities: snapshot.totalLiabilities
    }));

    const averageNetWorth = snapshots.reduce((sum, s) => sum + s.netWorth, 0) / snapshots.length;

    // Find best and worst performing periods (if we have at least 2 snapshots)
    let bestPerformingPeriod = null;
    let worstPerformingPeriod = null;

    if (snapshots.length >= 2) {
      let maxGrowth = -Infinity;
      let minGrowth = Infinity;
      let bestPeriod = null;
      let worstPeriod = null;

      for (let i = 1; i < snapshots.length; i++) {
        const previousSnapshot = snapshots[i - 1];
        const currentSnapshot = snapshots[i];
        
        const growth = previousSnapshot.netWorth === 0 ? 0 :
          ((currentSnapshot.netWorth - previousSnapshot.netWorth) / previousSnapshot.netWorth) * 100;

        if (growth > maxGrowth) {
          maxGrowth = growth;
          bestPeriod = { from: previousSnapshot, to: currentSnapshot, growth };
        }

        if (growth < minGrowth) {
          minGrowth = growth;
          worstPeriod = { from: previousSnapshot, to: currentSnapshot, growth };
        }
      }

      bestPerformingPeriod = bestPeriod;
      worstPerformingPeriod = worstPeriod;
    }

    return {
      totalSnapshots: snapshots.length,
      dateRange: {
        earliest: snapshots[0].snapshotDate,
        latest: snapshots[snapshots.length - 1].snapshotDate
      },
      netWorthTrend,
      averageNetWorth,
      bestPerformingPeriod,
      worstPerformingPeriod
    };
  }

  /**
   * Create automatic yearly snapshots
   */
  async createYearlySnapshot(userId: string): Promise<SnapshotData> {
    const currentYear = this.getIslamicYear(new Date());
    const snapshotName = `Yearly Snapshot ${currentYear}`;

    // Check if yearly snapshot already exists
    const existingSnapshot = await prisma.snapshot.findFirst({
      where: {
        userId,
        islamicYear: currentYear,
        name: snapshotName
      }
    });

    if (existingSnapshot) {
      throw new Error('Yearly snapshot already exists for this year');
    }

    return this.createSnapshot(userId, {
      name: snapshotName,
      description: `Automatic yearly snapshot for Islamic year ${currentYear}`,
      tags: ['yearly', 'automatic'],
      metadata: {
        automatic: true,
        snapshotType: 'yearly'
      }
    });
  }

  /**
   * Private: Format snapshot data for response
   */
  private formatSnapshotData(snapshot: any, assets: any[], liabilities: any[]): SnapshotData {
    return {
      id: snapshot.id,
      userId: snapshot.userId,
      name: snapshot.name,
      description: snapshot.description,
      snapshotDate: snapshot.snapshotDate,
      islamicYear: snapshot.islamicYear,
      totalAssets: snapshot.totalAssets,
      totalLiabilities: snapshot.totalLiabilities,
      netWorth: snapshot.netWorth,
      assetsCount: snapshot.assetsCount,
      liabilitiesCount: snapshot.liabilitiesCount,
      tags: JSON.parse(snapshot.tags || '[]'),
      metadata: JSON.parse(snapshot.metadata || '{}'),
      assets,
      liabilities
    };
  }

  /**
   * Private: Build order by clause
   */
  private buildOrderBy(sortBy: string, sortOrder: string) {
    switch (sortBy) {
      case 'name':
        return { name: sortOrder };
      case 'netWorth':
        return { netWorth: sortOrder };
      case 'date':
      default:
        return { snapshotDate: sortOrder };
    }
  }

  /**
   * Private: Calculate time difference between dates
   */
  private calculateTimeDifference(date1: Date, date2: Date) {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.ceil(diffDays / 30);
    const diffYears = Math.ceil(diffDays / 365);

    return {
      days: diffDays,
      months: diffMonths,
      years: diffYears
    };
  }

  /**
   * Private: Analyze asset changes between snapshots
   */
  private analyzeAssetChanges(baseAssets: any[], compareAssets: any[]) {
    const baseAssetMap = new Map(baseAssets.map(a => [a.id, a]));
    const compareAssetMap = new Map(compareAssets.map(a => [a.id, a]));

    const added = compareAssets.filter(asset => !baseAssetMap.has(asset.id));
    const removed = baseAssets.filter(asset => !compareAssetMap.has(asset.id));
    const modified: any[] = [];

    // Find modified assets
    for (const asset of compareAssets) {
      const baseAsset = baseAssetMap.get(asset.id);
      if (baseAsset && (baseAsset.value !== asset.value || baseAsset.name !== asset.name)) {
        modified.push({
          current: asset,
          previous: baseAsset,
          valueChange: asset.value - baseAsset.value
        });
      }
    }

    const valueChange = compareAssets.reduce((sum, a) => sum + a.value, 0) - 
                       baseAssets.reduce((sum, a) => sum + a.value, 0);

    return { added, removed, modified, valueChange };
  }

  /**
   * Private: Analyze liability changes between snapshots
   */
  private analyzeLiabilityChanges(baseLiabilities: any[], compareLiabilities: any[]) {
    const baseLiabilityMap = new Map(baseLiabilities.map(l => [l.id, l]));
    const compareLiabilityMap = new Map(compareLiabilities.map(l => [l.id, l]));

    const added = compareLiabilities.filter(liability => !baseLiabilityMap.has(liability.id));
    const removed = baseLiabilities.filter(liability => !compareLiabilityMap.has(liability.id));
    const modified: any[] = [];

    // Find modified liabilities
    for (const liability of compareLiabilities) {
      const baseLiability = baseLiabilityMap.get(liability.id);
      if (baseLiability && (baseLiability.amount !== liability.amount || baseLiability.name !== liability.name)) {
        modified.push({
          current: liability,
          previous: baseLiability,
          valueChange: liability.amount - baseLiability.amount
        });
      }
    }

    const valueChange = compareLiabilities.reduce((sum, l) => sum + l.amount, 0) - 
                       baseLiabilities.reduce((sum, l) => sum + l.amount, 0);

    return { added, removed, modified, valueChange };
  }

  /**
   * Private: Analyze category changes
   */
  private analyzeCategoryChanges(baseAssets: any[], compareAssets: any[]) {
    const baseCategoryTotals = this.calculateCategoryTotals(baseAssets);
    const compareCategoryTotals = this.calculateCategoryTotals(compareAssets);

    const allCategories = new Set([
      ...Object.keys(baseCategoryTotals),
      ...Object.keys(compareCategoryTotals)
    ]);

    const analysis: Record<string, any> = {};

    for (const category of allCategories) {
      const previousValue = baseCategoryTotals[category] || 0;
      const currentValue = compareCategoryTotals[category] || 0;
      const change = currentValue - previousValue;
      const changePercentage = previousValue === 0 ? 0 : (change / previousValue) * 100;

      analysis[category] = {
        previousValue,
        currentValue,
        change,
        changePercentage
      };
    }

    return analysis;
  }

  /**
   * Private: Calculate category totals
   */
  private calculateCategoryTotals(assets: any[]): Record<string, number> {
    return assets.reduce((acc, asset) => {
      const category = asset.category || 'uncategorized';
      acc[category] = (acc[category] || 0) + asset.value;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Private: Get Islamic year from date
   */
  private getIslamicYear(date: Date): string {
    // Simplified Islamic year calculation
    const gregorianYear = date.getFullYear();
    const approximateIslamicYear = Math.floor((gregorianYear - 622) * 1.031) + 1;
    return approximateIslamicYear.toString();
  }
}