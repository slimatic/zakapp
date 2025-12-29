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

import { PrismaClient } from '@prisma/client';
import {
  ReminderEvent,
  ReminderEventType,
  ReminderPriority,
  ReminderStatus
} from '@zakapp/shared';

const prisma = new PrismaClient();

/**
 * ReminderEvent Model - Manages dashboard notifications
 * Supports Zakat obligation reminders and tracking milestones
 */
export class ReminderEventModel {
  /**
   * Validates reminder event data
   * @param data - Reminder data to validate
   * @throws Error if validation fails
   */
  private static validateReminderData(data: Partial<{
    eventType: ReminderEventType;
    priority: ReminderPriority;
    status: ReminderStatus;
    triggerDate: Date;
    title: string;
    message: string;
  }>): void {
    // Validate event type
    const validEventTypes: ReminderEventType[] = [
      'zakat_anniversary_approaching',
      'calculation_overdue',
      'payment_incomplete',
      'yearly_comparison_available',
      'data_backup_reminder',
      'methodology_review'
    ];
    if (data.eventType && !validEventTypes.includes(data.eventType)) {
      throw new Error(`Invalid event type. Must be one of: ${validEventTypes.join(', ')}`);
    }

    // Validate priority
    const validPriorities: ReminderPriority[] = ['high', 'medium', 'low'];
    if (data.priority && !validPriorities.includes(data.priority)) {
      throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }

    // Validate status
    const validStatuses: ReminderStatus[] = ['pending', 'shown', 'acknowledged', 'dismissed'];
    if (data.status && !validStatuses.includes(data.status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Validate title and message
    if (data.title !== undefined && data.title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }

    if (data.message !== undefined && data.message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }
  }

  /**
   * Creates a new reminder event
   * @param userId - User ID
   * @param data - Reminder data
   * @returns Promise<ReminderEvent> - Created reminder
   */
  static async create(
    userId: string,
    data: {
      eventType: ReminderEventType;
      triggerDate: Date;
      title: string;
      message: string;
      priority: ReminderPriority;
      relatedSnapshotId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<ReminderEvent> {
    try {
      // Validate data
      this.validateReminderData(data);

      // Validate related snapshot if provided
      if (data.relatedSnapshotId) {
        const snapshot = await prisma.yearlySnapshot.findFirst({
          where: { id: data.relatedSnapshotId, userId }
        });

        if (!snapshot) {
          throw new Error('Related snapshot not found or does not belong to user');
        }
      }

      const reminder = await prisma.reminderEvent.create({
        data: {
          userId,
          eventType: data.eventType,
          triggerDate: data.triggerDate,
          title: data.title,
          message: data.message,
          priority: data.priority,
          status: 'pending',
          relatedSnapshotId: data.relatedSnapshotId ?? null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null
        }
      });

      return reminder as unknown as ReminderEvent;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create reminder event: ${errorMessage}`);
    }
  }

  /**
   * Retrieves reminder by ID
   * @param id - Reminder ID
   * @param userId - User ID (for ownership validation)
   * @returns Promise<ReminderEvent | null>
   */
  static async findById(id: string, userId: string): Promise<ReminderEvent | null> {
    try {
      const reminder = await prisma.reminderEvent.findFirst({
        where: { id, userId }
      });

      return reminder as unknown as ReminderEvent | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find reminder event: ${errorMessage}`);
    }
  }

  /**
   * Retrieves active reminders for a user
   * @param userId - User ID
   * @param options - Query options
   * @returns Promise<ReminderEvent[]>
   */
  static async findActive(
    userId: string,
    options: {
      priority?: ReminderPriority;
      eventType?: ReminderEventType;
      limit?: number;
    } = {}
  ): Promise<ReminderEvent[]> {
    try {
      const where: any = {
        userId,
        status: { in: ['pending', 'shown'] },
        triggerDate: { lte: new Date() }
      };

      if (options.priority) {
        where.priority = options.priority;
      }

      if (options.eventType) {
        where.eventType = options.eventType;
      }

      const reminders = await prisma.reminderEvent.findMany({
        where,
        orderBy: [
          { priority: 'asc' }, // high priority first (assuming high=1, medium=2, low=3)
          { triggerDate: 'asc' }
        ],
        take: options.limit
      });

      return reminders as unknown as ReminderEvent[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find active reminders: ${errorMessage}`);
    }
  }

  /**
   * Retrieves all reminders for a user with filtering
   * @param userId - User ID
   * @param options - Query options
   * @returns Promise<{ data: ReminderEvent[]; total: number }>
   */
  static async findByUser(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: ReminderStatus;
      priority?: ReminderPriority;
      eventType?: ReminderEventType;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ data: ReminderEvent[]; total: number }> {
    try {
      const page = options.page ?? 1;
      const limit = options.limit ?? 20;
      const skip = (page - 1) * limit;

      const where: any = { userId };

      if (options.status) {
        where.status = options.status;
      }

      if (options.priority) {
        where.priority = options.priority;
      }

      if (options.eventType) {
        where.eventType = options.eventType;
      }

      const [reminders, total] = await Promise.all([
        prisma.reminderEvent.findMany({
          where,
          orderBy: { triggerDate: options.sortOrder ?? 'desc' },
          skip,
          take: limit
        }),
        prisma.reminderEvent.count({ where })
      ]);

      return {
        data: reminders as unknown as ReminderEvent[],
        total
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find reminder events: ${errorMessage}`);
    }
  }

  /**
   * Updates reminder status
   * @param id - Reminder ID
   * @param userId - User ID (for ownership validation)
   * @param status - New status
   * @returns Promise<ReminderEvent>
   */
  static async updateStatus(
    id: string,
    userId: string,
    status: ReminderStatus
  ): Promise<ReminderEvent> {
    try {
      this.validateReminderData({ status });

      const existing = await this.findById(id, userId);
      if (!existing) {
        throw new Error('Reminder event not found');
      }

      const updateData: any = { status };

      if (status === 'acknowledged') {
        updateData.acknowledgedAt = new Date();
      }

      const reminder = await prisma.reminderEvent.update({
        where: { id },
        data: updateData
      });

      return reminder as unknown as ReminderEvent;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update reminder status: ${errorMessage}`);
    }
  }

  /**
   * Acknowledges a reminder
   * @param id - Reminder ID
   * @param userId - User ID (for ownership validation)
   * @returns Promise<ReminderEvent>
   */
  static async acknowledge(id: string, userId: string): Promise<ReminderEvent> {
    return this.updateStatus(id, userId, 'acknowledged');
  }

  /**
   * Dismisses a reminder
   * @param id - Reminder ID
   * @param userId - User ID (for ownership validation)
   * @returns Promise<ReminderEvent>
   */
  static async dismiss(id: string, userId: string): Promise<ReminderEvent> {
    return this.updateStatus(id, userId, 'dismissed');
  }

  /**
   * Marks pending reminders as shown
   * @param userId - User ID
   * @returns Promise<number> - Number of updated reminders
   */
  static async markPendingAsShown(userId: string): Promise<number> {
    try {
      const result = await prisma.reminderEvent.updateMany({
        where: {
          userId,
          status: 'pending',
          triggerDate: { lte: new Date() }
        },
        data: {
          status: 'shown'
        }
      });

      return result.count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to mark reminders as shown: ${errorMessage}`);
    }
  }

  /**
   * Deletes a reminder
   * @param id - Reminder ID
   * @param userId - User ID (for ownership validation)
   * @returns Promise<void>
   */
  static async delete(id: string, userId: string): Promise<void> {
    try {
      const existing = await this.findById(id, userId);
      if (!existing) {
        throw new Error('Reminder event not found');
      }

      await prisma.reminderEvent.delete({
        where: { id }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete reminder event: ${errorMessage}`);
    }
  }

  /**
   * Deletes old acknowledged/dismissed reminders
   * @param daysOld - Number of days old to delete (default: 90)
   * @returns Promise<number> - Number of deleted reminders
   */
  static async deleteOld(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.reminderEvent.deleteMany({
        where: {
          status: { in: ['acknowledged', 'dismissed'] },
          createdAt: { lt: cutoffDate }
        }
      });

      return result.count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete old reminders: ${errorMessage}`);
    }
  }

  /**
   * Gets reminder statistics for a user
   * @param userId - User ID
   * @returns Promise<{ total: number; pending: number; shown: number; acknowledged: number; dismissed: number }>
   */
  static async getStatistics(userId: string): Promise<{
    total: number;
    pending: number;
    shown: number;
    acknowledged: number;
    dismissed: number;
  }> {
    try {
      const [total, pending, shown, acknowledged, dismissed] = await Promise.all([
        prisma.reminderEvent.count({ where: { userId } }),
        prisma.reminderEvent.count({ where: { userId, status: 'pending' } }),
        prisma.reminderEvent.count({ where: { userId, status: 'shown' } }),
        prisma.reminderEvent.count({ where: { userId, status: 'acknowledged' } }),
        prisma.reminderEvent.count({ where: { userId, status: 'dismissed' } })
      ]);

      return {
        total,
        pending,
        shown,
        acknowledged,
        dismissed
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get reminder statistics: ${errorMessage}`);
    }
  }
}
