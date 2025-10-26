import { Reminder, DecryptedReminderData, CreateReminderData as ModelCreateReminderData } from '../models/reminder';
import { prisma } from '../config/database';

export interface CreateReminderData {
  userId: string;
  paymentId?: string;
  reminderType: 'payment_due' | 'nisab_check' | 'yearly_reminder' | 'custom';
  message: string;
  scheduledDate: Date;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceEndDate?: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'sent' | 'acknowledged' | 'cancelled';
}

export interface UpdateReminderData {
  message?: string;
  scheduledDate?: Date;
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceEndDate?: Date;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'sent' | 'acknowledged' | 'cancelled';
}

export interface ReminderStats {
  totalReminders: number;
  pendingReminders: number;
  sentReminders: number;
  acknowledgedReminders: number;
  overdueReminders: number;
}

export class ReminderService {
  /**
   * Maps service reminder type to model event type
   */
  private static mapReminderTypeToEventType(reminderType: string): 'zakat_due' | 'payment_reminder' | 'annual_review' | 'custom' {
    switch (reminderType) {
      case 'payment_due':
        return 'payment_reminder';
      case 'nisab_check':
        return 'zakat_due';
      case 'yearly_reminder':
        return 'annual_review';
      case 'custom':
      default:
        return 'custom';
    }
  }

  /**
   * Maps model event type to service reminder type
   */
  private static mapEventTypeToReminderType(eventType: string): 'payment_due' | 'nisab_check' | 'yearly_reminder' | 'custom' {
    switch (eventType) {
      case 'payment_reminder':
        return 'payment_due';
      case 'zakat_due':
        return 'nisab_check';
      case 'annual_review':
        return 'yearly_reminder';
      case 'custom':
      default:
        return 'custom';
    }
  }

  /**
   * Generates a title for the reminder based on type
   */
  private static generateReminderTitle(reminderType: string): string {
    switch (reminderType) {
      case 'payment_due':
        return 'Payment Due Reminder';
      case 'nisab_check':
        return 'Nisab Threshold Check';
      case 'yearly_reminder':
        return 'Yearly Zakat Reminder';
      case 'custom':
      default:
        return 'Custom Reminder';
    }
  }

  /**
   * Creates a new reminder
   */
  static async createReminder(reminderData: CreateReminderData): Promise<DecryptedReminderData> {
    try {
      // Convert service interface to model interface
      const modelData: ModelCreateReminderData = {
        userId: reminderData.userId,
        eventType: this.mapReminderTypeToEventType(reminderData.reminderType),
        triggerDate: reminderData.scheduledDate,
        title: this.generateReminderTitle(reminderData.reminderType),
        message: reminderData.message,
        priority: reminderData.priority,
        relatedSnapshotId: reminderData.paymentId,
        metadata: {
          isRecurring: reminderData.isRecurring,
          recurrencePattern: reminderData.recurrencePattern,
          recurrenceEndDate: reminderData.recurrenceEndDate?.toISOString(),
        },
      };

      const reminder = await Reminder.create(modelData);

      // Decrypt the reminder to return DecryptedReminderData
      const decryptedReminder = await Reminder.findById(reminder.id);
      if (!decryptedReminder) {
        throw new Error('Failed to retrieve created reminder');
      }

      // If recurring, schedule the next occurrence
      if (reminderData.isRecurring && reminderData.recurrencePattern) {
        await this.scheduleNextRecurrence(decryptedReminder.id, reminderData);
      }

      return decryptedReminder;
    } catch (error) {
      throw new Error(`Failed to create reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets a reminder by ID
   */
  static async getReminderById(reminderId: string, userId: string): Promise<DecryptedReminderData | null> {
    try {
      const reminder = await Reminder.findById(reminderId);
      // Check if reminder belongs to user
      if (reminder && reminder.userId !== userId) {
        return null;
      }
      return reminder;
    } catch (error) {
      throw new Error(`Failed to get reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets all reminders for a user with optional filtering
   */
  static async getRemindersByUserId(
    userId: string,
    filters: {
      status?: 'pending' | 'shown' | 'acknowledged' | 'dismissed';
      reminderType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<DecryptedReminderData[]> {
    try {
      // Convert service filters to model filters
      const modelFilters = {
        status: filters.status,
        limit: filters.limit,
        offset: filters.offset,
      };

      return await Reminder.findByUserId(userId, modelFilters);
    } catch (error) {
      throw new Error(`Failed to get reminders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates a reminder
   */
  static async updateReminder(
    reminderId: string,
    userId: string,
    updateData: UpdateReminderData
  ): Promise<DecryptedReminderData | null> {
    try {
      // First check if reminder belongs to user
      const existingReminder = await Reminder.findById(reminderId);
      if (!existingReminder || existingReminder.userId !== userId) {
        return null;
      }

      // Convert service update data to model format
      const modelUpdateData: Partial<ModelCreateReminderData & { status?: 'pending' | 'shown' | 'acknowledged' | 'dismissed' }> = {};

      if (updateData.message) modelUpdateData.message = updateData.message;
      if (updateData.scheduledDate) modelUpdateData.triggerDate = updateData.scheduledDate;
      if (updateData.priority) modelUpdateData.priority = updateData.priority;
      if (updateData.status) modelUpdateData.status = updateData.status as 'pending' | 'shown' | 'acknowledged' | 'dismissed';

      if (Object.keys(modelUpdateData).length > 0) {
        const reminder = await Reminder.update(reminderId, modelUpdateData);

        // If the reminder was updated and is recurring, reschedule next occurrence
        if (reminder && updateData.isRecurring && updateData.recurrencePattern) {
          await this.scheduleNextRecurrence(reminderId, {
            ...updateData,
            userId,
            reminderType: this.mapEventTypeToReminderType(reminder.eventType),
            scheduledDate: updateData.scheduledDate || reminder.triggerDate,
          } as CreateReminderData);
        }

        return reminder;
      }

      return existingReminder;
    } catch (error) {
      throw new Error(`Failed to update reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deletes a reminder
   */
  static async deleteReminder(reminderId: string, userId: string): Promise<boolean> {
    try {
      // First check if reminder belongs to user
      const existingReminder = await Reminder.findById(reminderId);
      if (!existingReminder || existingReminder.userId !== userId) {
        return false;
      }

      return await Reminder.delete(reminderId);
    } catch (error) {
      throw new Error(`Failed to delete reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Acknowledges a reminder (marks as read/handled)
   */
  static async acknowledgeReminder(reminderId: string, userId: string): Promise<DecryptedReminderData | null> {
    try {
      // First check if reminder belongs to user
      const existingReminder = await Reminder.findById(reminderId);
      if (!existingReminder || existingReminder.userId !== userId) {
        return null;
      }

      return await Reminder.acknowledge(reminderId);
    } catch (error) {
      throw new Error(`Failed to acknowledge reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets reminders that are due for sending
   */
  static async getDueReminders(limit: number = 100): Promise<DecryptedReminderData[]> {
    try {
      // Note: The model method doesn't take a limit parameter, so we'll get all due reminders
      // and slice if needed. In a real implementation, you might want to modify the model method.
      const allDueReminders = await Reminder.findDueReminders();
      return allDueReminders.slice(0, limit);
    } catch (error) {
      throw new Error(`Failed to get due reminders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Marks a reminder as sent
   */
  static async markReminderAsSent(reminderId: string): Promise<DecryptedReminderData | null> {
    try {
      return await Reminder.update(reminderId, { status: 'shown' });
    } catch (error) {
      throw new Error(`Failed to mark reminder as sent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Schedules the next occurrence of a recurring reminder
   */
  private static async scheduleNextRecurrence(
    originalReminderId: string,
    reminderData: CreateReminderData
  ): Promise<void> {
    if (!reminderData.isRecurring || !reminderData.recurrencePattern || !reminderData.recurrenceEndDate) {
      return;
    }

    const nextDate = this.calculateNextRecurrenceDate(
      reminderData.scheduledDate,
      reminderData.recurrencePattern
    );

    // Check if next date is before end date
    if (nextDate && nextDate <= reminderData.recurrenceEndDate) {
      const nextReminderData: CreateReminderData = {
        ...reminderData,
        scheduledDate: nextDate,
        status: 'pending',
      };

      await this.createReminder(nextReminderData);
    }
  }

  /**
   * Calculates the next recurrence date based on pattern
   */
  private static calculateNextRecurrenceDate(
    currentDate: Date,
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ): Date | null {
    const nextDate = new Date(currentDate);

    switch (pattern) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        return null;
    }

    return nextDate;
  }

  /**
   * Gets reminder statistics for a user
   */
  static async getReminderStats(userId: string): Promise<ReminderStats> {
    try {
      const reminders = await Reminder.findByUserId(userId);

      const now = new Date();
      const stats: ReminderStats = {
        totalReminders: reminders.length,
        pendingReminders: 0,
        sentReminders: 0,
        acknowledgedReminders: 0,
        overdueReminders: 0,
      };

      reminders.forEach(reminder => {
        switch (reminder.status) {
          case 'pending':
            stats.pendingReminders++;
            if (reminder.triggerDate < now) {
              stats.overdueReminders++;
            }
            break;
          case 'sent':
            stats.sentReminders++;
            break;
          case 'acknowledged':
            stats.acknowledgedReminders++;
            break;
        }
      });

      return stats;
    } catch (error) {
      throw new Error(`Failed to get reminder stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cancels all future occurrences of a recurring reminder
   */
  static async cancelRecurringReminder(reminderId: string, userId: string): Promise<boolean> {
    try {
      // Find the reminder and mark it as cancelled
      const reminder = await Reminder.findById(reminderId);
      if (!reminder || reminder.userId !== userId) {
        return false;
      }

      const updatedReminder = await Reminder.update(reminderId, { status: 'dismissed' });

      if (!updatedReminder) {
        return false;
      }

      // Find and cancel all future occurrences of this reminder series
      // This is a simplified implementation - in a real system you might want
      // to link recurring reminders with a series ID
      const futureReminders = await prisma.reminderEvent.findMany({
        where: {
          userId,
          eventType: reminder.eventType,
          triggerDate: {
            gt: new Date(),
          },
          status: 'pending',
        },
      });

      // Cancel future reminders (this is a basic implementation)
      for (const futureReminder of futureReminders) {
        await Reminder.update(futureReminder.id, { status: 'dismissed' });
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to cancel recurring reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Creates a payment reminder for a specific payment
   */
  static async createPaymentReminder(
    userId: string,
    paymentId: string,
    reminderDate: Date,
    message?: string
  ): Promise<DecryptedReminderData> {
    const reminderData: CreateReminderData = {
      userId,
      paymentId,
      reminderType: 'payment_due',
      message: message || 'Payment reminder: Your Zakat payment is due.',
      scheduledDate: reminderDate,
      isRecurring: false,
      priority: 'medium',
      status: 'pending',
    };

    return await this.createReminder(reminderData);
  }

  /**
   * Backwards-compatible alias used by tests: scheduleReminder
   */
  static async scheduleReminder(reminderData: any) {
    // Map incoming shape from tests to internal CreateReminderData if necessary
    // If the test already provides the expected fields, pass-through
    if (!reminderData) throw new Error('Invalid reminder data');
    // Normalize fields
    const normalized = {
      userId: reminderData.userId,
      reminderType: reminderData.eventType || reminderData.reminderType || 'custom',
      message: reminderData.message,
      scheduledDate: reminderData.triggerDate || reminderData.scheduledDate,
      isRecurring: !!reminderData.isRecurring,
      recurrencePattern: reminderData.recurrencePattern,
      recurrenceEndDate: reminderData.recurrenceEndDate,
      priority: reminderData.priority || 'medium',
      paymentId: reminderData.relatedSnapshotId || reminderData.paymentId,
    } as any;

    return this.createReminder(normalized as any);
  }

  /**
   * Creates a yearly Zakat reminder
   */
  static async createYearlyReminder(
    userId: string,
    reminderDate: Date,
    message?: string
  ): Promise<DecryptedReminderData> {
    const reminderData: CreateReminderData = {
      userId,
      reminderType: 'yearly_reminder',
      message: message || 'Yearly reminder: Time to calculate your Zakat for this year.',
      scheduledDate: reminderDate,
      isRecurring: true,
      recurrencePattern: 'yearly',
      recurrenceEndDate: new Date(reminderDate.getFullYear() + 10, reminderDate.getMonth(), reminderDate.getDate()), // 10 years
      priority: 'high',
      status: 'pending',
    };

    return await this.createReminder(reminderData);
  }
}