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

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export class AssetAmountSnapshotService {
  private logger = new Logger('AssetAmountSnapshotService');

  /**
   * Regenerate snapshots for a date range
   */
  async regenerateForDateRange(assetId: string, range: DateRange): Promise<void> {
    // Get all events in the date range
    const events = await prisma.assetAmountEvent.findMany({
      where: {
        assetId,
        effectiveDate: { gte: range.startDate, lte: range.endDate },
        isReversed: false
      },
      orderBy: { effectiveDate: 'asc' }
    });

    if (events.length === 0) {
      return;
    }

    // Group events by date (start of day)
    const eventsByDate = new Map<string, typeof events>();
    for (const event of events) {
      const dateKey = this.getStartOfDay(event.effectiveDate).toISOString();
      if (!eventsByDate.has(dateKey)) {
        eventsByDate.set(dateKey, []);
      }
      eventsByDate.get(dateKey)!.push(event);
    }

    // For each date, create/update snapshot with latest event
    for (const [dateStr, dayEvents] of Array.from(eventsByDate.entries())) {
      // Get the latest event for this date (by recordedAt)
      const latestEvent = dayEvents.sort(
        (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      )[0];

      const date = new Date(dateStr);
      const eventCount = dayEvents.length;

      // Upsert snapshot
      await prisma.assetAmountSnapshot.upsert({
        where: {
          assetId_date: {
            assetId,
            date
          }
        },
        update: {
          amount: latestEvent.amount,
          eventCount
        },
        create: {
          assetId,
          date,
          amount: latestEvent.amount,
          eventCount
        }
      });
    }

    this.logger.info(`Regenerated ${eventsByDate.size} snapshots for asset ${assetId}`);
  }

  /**
   * Get snapshot at a specific date
   */
  async getSnapshotAtDate(assetId: string, targetDate: Date): Promise<any | null> {
    const snapshot = await prisma.assetAmountSnapshot.findFirst({
      where: {
        assetId,
        date: { lte: targetDate }
      },
      orderBy: { date: 'desc' }
    });

    if (snapshot) {
      return snapshot;
    }

    // Fall back to events if no snapshot
    const event = await prisma.assetAmountEvent.findFirst({
      where: {
        assetId,
        effectiveDate: { lte: targetDate },
        isReversed: false
      },
      orderBy: { effectiveDate: 'desc' }
    });

    if (!event) {
      return null;
    }

    // Return a virtual snapshot
    return {
      assetId,
      date: event.effectiveDate,
      amount: event.amount,
      eventCount: 1,
      isVirtual: true
    };
  }

  /**
   * Get snapshots for a date range
   */
  async getSnapshotsInRange(assetId: string, range: DateRange): Promise<any[]> {
    return prisma.assetAmountSnapshot.findMany({
      where: {
        assetId,
        date: { gte: range.startDate, lte: range.endDate }
      },
      orderBy: { date: 'asc' }
    });
  }

  /**
   * Get the current (latest) snapshot for an asset
   */
  async getCurrentSnapshot(assetId: string): Promise<any | null> {
    return prisma.assetAmountSnapshot.findFirst({
      where: { assetId },
      orderBy: { date: 'desc' }
    });
  }

  /**
   * Delete snapshots for a date range
   */
  async deleteSnapshotsInRange(assetId: string, range: DateRange): Promise<number> {
    const result = await prisma.assetAmountSnapshot.deleteMany({
      where: {
        assetId,
        date: { gte: range.startDate, lte: range.endDate }
      }
    });

    return result.count;
  }

  /**
   * Get the total event count between two snapshots
   */
  async getEventCountBetween(assetId: string, startDate: Date, endDate: Date): Promise<number> {
    return prisma.assetAmountEvent.count({
      where: {
        assetId,
        effectiveDate: { gte: startDate, lte: endDate },
        isReversed: false
      }
    });
  }

  /**
   * Ensure snapshots exist for all dates in range (fill gaps)
   */
  async fillMissingSnapshots(assetId: string, range: DateRange): Promise<void> {
    // Get existing snapshots
    const existingSnapshots = await prisma.assetAmountSnapshot.findMany({
      where: {
        assetId,
        date: { gte: range.startDate, lte: range.endDate }
      },
      orderBy: { date: 'asc' }
    });

    // Get all events
    const events = await prisma.assetAmountEvent.findMany({
      where: {
        assetId,
        effectiveDate: { gte: range.startDate, lte: range.endDate },
        isReversed: false
      },
      orderBy: { effectiveDate: 'asc' }
    });

    if (events.length === 0) {
      return;
    }

    // Create a map of existing snapshot dates
    const existingDates = new Set(existingSnapshots.map((s) => s.date.toISOString()));

    // Find the last known value before the range
    let lastKnownValue = 0;
    const lastSnapshotBefore = await prisma.assetAmountSnapshot.findFirst({
      where: {
        assetId,
        date: { lt: range.startDate }
      },
      orderBy: { date: 'desc' }
    });

    if (lastSnapshotBefore) {
      lastKnownValue = lastSnapshotBefore.amount;
    } else {
      // Try getting from earliest event
      const earliestEvent = await prisma.assetAmountEvent.findFirst({
        where: {
          assetId,
          effectiveDate: { lte: range.startDate },
          isReversed: false
        },
        orderBy: { effectiveDate: 'asc' }
      });
      if (earliestEvent) {
        lastKnownValue = earliestEvent.amount;
      }
    }

    // Group events by date
    const eventsByDate = new Map<string, typeof events>();
    for (const event of events) {
      const dateKey = this.getStartOfDay(event.effectiveDate).toISOString();
      if (!eventsByDate.has(dateKey)) {
        eventsByDate.set(dateKey, []);
      }
      eventsByDate.get(dateKey)!.push(event);
    }

    // Iterate through each day in the range
    const currentDate = this.getStartOfDay(range.startDate);
    const endDate = this.getStartOfDay(range.endDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString();

      // If we don't have a snapshot for this date
      if (!existingDates.has(dateKey)) {
        // Check if we have events for this date
        const dayEvents = eventsByDate.get(dateKey);

        if (dayEvents && dayEvents.length > 0) {
          // Use the latest event for this date
          const latestEvent = dayEvents.sort(
            (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
          )[0];

          await prisma.assetAmountSnapshot.create({
            data: {
              assetId,
              date: new Date(dateKey),
              amount: latestEvent.amount,
              eventCount: dayEvents.length
            }
          });

          lastKnownValue = latestEvent.amount;
        } else if (lastKnownValue > 0) {
          // Forward-fill with last known value
          await prisma.assetAmountSnapshot.create({
            data: {
              assetId,
              date: new Date(dateKey),
              amount: lastKnownValue,
              eventCount: 0
            }
          });
        }
      } else {
        // Update last known value from existing snapshot
        const existingSnapshot = existingSnapshots.find(
          (s) => s.date.toISOString() === dateKey
        );
        if (existingSnapshot) {
          lastKnownValue = existingSnapshot.amount;
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  /**
   * Helper: Get start of day
   */
  private getStartOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }
}
