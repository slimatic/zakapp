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

import { prisma } from '../utils/prisma';
import { Logger } from '../utils/logger';
import { AssetAmountSnapshotService } from './AssetAmountSnapshotService';

export type AssetAmountEventType = 'CREATED' | 'UPDATED' | 'CORRECTION' | 'BACKPORT';
export type EventSource = 'manual' | 'import' | 'api';

export interface CreateAssetAmountEventDto {
  assetId: string;
  eventType: AssetAmountEventType;
  amount: number;
  effectiveDate: Date;
  description?: string;
  source?: EventSource;
  metadata?: Record<string, unknown>;
  originalEventId?: string;
}

export interface AssetHistoryQueryOptions {
  startDate?: Date;
  endDate?: Date;
  eventType?: string;
  limit?: number;
}

export class AssetAmountEventService {
  private logger = new Logger('AssetAmountEventService');
  private snapshotService: AssetAmountSnapshotService;

  constructor() {
    this.snapshotService = new AssetAmountSnapshotService();
  }

  /**
   * Create a new asset amount event with audit trail
   */
  async createEvent(userId: string, dto: CreateAssetAmountEventDto): Promise<any> {
    // Validate asset exists and belongs to user
    const asset = await prisma.asset.findFirst({
      where: {
        id: dto.assetId,
        userId,
        isActive: true
      }
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    // Validate correction events have originalEventId
    if (dto.eventType === 'CORRECTION' && !dto.originalEventId) {
      throw new Error('CORRECTION events require originalEventId');
    }

    // If correction, mark original as reversed
    if (dto.eventType === 'CORRECTION' && dto.originalEventId) {
      const originalEvent = await prisma.assetAmountEvent.findFirst({
        where: {
          id: dto.originalEventId,
          assetId: dto.assetId
        }
      });

      if (!originalEvent) {
        throw new Error('Original event not found');
      }
    }

    // Create event in transaction with audit trail
    const event = await prisma.$transaction(async (tx) => {
      // Create the event
      const created = await tx.assetAmountEvent.create({
        data: {
          assetId: dto.assetId,
          eventType: dto.eventType,
          amount: dto.amount,
          currency: asset.currency,
          effectiveDate: dto.effectiveDate,
          userId,
          description: dto.description,
          source: dto.source || 'manual',
          metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
          originalEventId: dto.originalEventId || null,
          isReversed: false
        }
      });

      // If this is a correction, mark original as reversed
      if (dto.eventType === 'CORRECTION' && dto.originalEventId) {
        await tx.assetAmountEvent.update({
          where: { id: dto.originalEventId },
          data: { isReversed: true }
        });
      }

      // Create audit trail entry (asset-level, so nisabYearRecordId is null)
      await tx.auditTrailEntry.create({
        data: {
          nisabYearRecordId: null,
          userId,
          eventType: 'ASSET_AMOUNT_EVENT_CREATED',
          timestamp: new Date(),
          unlockReason: null,
          changesSummary: JSON.stringify({
            assetId: dto.assetId,
            eventType: dto.eventType,
            amount: dto.amount,
            effectiveDate: dto.effectiveDate,
            description: dto.description,
            source: dto.source
          }),
          beforeState: null,
          afterState: JSON.stringify({
            eventId: created.id,
            amount: dto.amount,
            effectiveDate: dto.effectiveDate
          }),
          assetAmountEventId: created.id
        }
      });

      return created;
    });

    // Trigger async snapshot regeneration
    this.triggerSnapshotRegeneration(dto.assetId, dto.effectiveDate).catch((err) => {
      this.logger.error('Failed to trigger snapshot regeneration', err);
    });

    return event;
  }

  /**
   * Get asset amount history with optional filters
   */
  async getAssetHistory(assetId: string, userId: string, options?: AssetHistoryQueryOptions): Promise<any[]> {
    // Verify asset belongs to user
    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        userId,
        isActive: true
      }
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    return prisma.assetAmountEvent.findMany({
      where: {
        assetId,
        isReversed: false,
        ...(options?.startDate || options?.endDate
          ? {
              effectiveDate: {
                ...(options?.startDate && { gte: options.startDate }),
                ...(options?.endDate && { lte: options.endDate })
              }
            }
          : {}),
        ...(options?.eventType && { eventType: options.eventType })
      },
      orderBy: { effectiveDate: 'desc' },
      ...(options?.limit && { take: options.limit }),
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });
  }

  /**
   * Get asset amount at a specific date (latest effective on or before)
   */
  async getAssetAmountAtDate(assetId: string, userId: string, targetDate: Date): Promise<number | null> {
    // Verify asset belongs to user
    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        userId,
        isActive: true
      }
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    // Get latest event effective on or before targetDate
    const event = await prisma.assetAmountEvent.findFirst({
      where: {
        assetId,
        effectiveDate: { lte: targetDate },
        isReversed: false
      },
      orderBy: { effectiveDate: 'desc' }
    });

    return event?.amount ?? null;
  }

  /**
   * Backport historical data for an asset
   */
  async backportHistoricalData(
    userId: string,
    assetId: string,
    entries: Array<{
      amount: number;
      effectiveDate: Date;
      description: string;
    }>
  ): Promise<any[]> {
    // Verify asset belongs to user
    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        userId,
        isActive: true
      }
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    if (entries.length === 0) {
      return [];
    }

    const events = [];
    const dates: Date[] = [];

    // Create events for each entry
    for (const entry of entries) {
      const event = await this.createEvent(userId, {
        assetId,
        eventType: 'BACKPORT',
        amount: entry.amount,
        effectiveDate: entry.effectiveDate,
        description: entry.description,
        source: 'import'
      });
      events.push(event);
      dates.push(entry.effectiveDate);
    }

    // Regenerate snapshots for the full date range
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date();

    try {
      await this.snapshotService.regenerateForDateRange(assetId, {
        startDate: minDate,
        endDate: maxDate
      });
    } catch (err) {
      this.logger.error('Failed to regenerate snapshots after backport', err);
    }

    return events;
  }

  /**
   * Get all events for a user across all their assets
   */
  async getUserEventHistory(
    userId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      assetId?: string;
      limit?: number;
    }
  ): Promise<any[]> {
    // Get user's assets
    const userAssets = await prisma.asset.findMany({
      where: {
        userId,
        isActive: true
      },
      select: { id: true }
    });

    const assetIds = userAssets.map((a) => a.id);

    const effectiveDateFilter: { gte?: Date; lte?: Date } = {};
    if (options?.startDate) {
      effectiveDateFilter.gte = options.startDate;
    }
    if (options?.endDate) {
      effectiveDateFilter.lte = options.endDate;
    }

    return prisma.assetAmountEvent.findMany({
      where: {
        assetId: options?.assetId || { in: assetIds },
        isReversed: false,
        ...(Object.keys(effectiveDateFilter).length > 0 && { effectiveDate: effectiveDateFilter })
      },
      orderBy: { effectiveDate: 'desc' },
      ...(options?.limit && { take: options.limit }),
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });
  }

  /**
   * Reverse an event (create a correction)
   */
  async reverseEvent(userId: string, eventId: string, description: string): Promise<any> {
    // Get the original event
    const originalEvent = await prisma.assetAmountEvent.findFirst({
      where: {
        id: eventId,
        asset: {
          userId
        }
      },
      include: {
        asset: true
      }
    });

    if (!originalEvent) {
      throw new Error('Event not found');
    }

    if (originalEvent.isReversed) {
      throw new Error('Event already reversed');
    }

    // Create a correction event
    return this.createEvent(userId, {
      assetId: originalEvent.assetId,
      eventType: 'CORRECTION',
      amount: originalEvent.amount,
      effectiveDate: originalEvent.effectiveDate,
      description: `Reversed: ${description}`,
      source: 'manual',
      originalEventId: eventId
    });
  }

  /**
   * Trigger async snapshot regeneration
   */
  private async triggerSnapshotRegeneration(assetId: string, date: Date): Promise<void> {
    // Get start of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    // Queue regeneration (simplified - in production use a job queue)
    this.snapshotService
      .regenerateForDateRange(assetId, {
        startDate: startOfDay,
        endDate: new Date()
      })
      .catch((err) => {
        this.logger.error(`Snapshot regeneration failed for asset ${assetId}`, err);
      });
  }
}
