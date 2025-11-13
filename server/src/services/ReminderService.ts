import { ReminderEventModel } from '../models/ReminderEvent';
import { YearlySnapshotModel } from '../models/YearlySnapshot';
import {
  ReminderEvent,
  ReminderEventType,
  ReminderPriority,
  ReminderStatus
} from '@zakapp/shared';

/**
 * ReminderService - Business logic for notification management
 * Handles reminder triggers, lifecycle management, and smart notifications
 */
export class ReminderService {

  /**
   * Creates a new reminder event
   * @param userId - User ID
   * @param data - Reminder data
   * @returns Created reminder
   */
  async createReminder(
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
    return await ReminderEventModel.create(userId, data);
  }

  /**
   * Gets a reminder by ID
   * @param id - Reminder ID
   * @param userId - User ID for authorization
   * @returns Reminder or null
   */
  async getReminder(id: string, userId: string): Promise<ReminderEvent | null> {
    return await ReminderEventModel.findById(id, userId);
  }

  /**
   * Lists active reminders for a user
   * @param userId - User ID
   * @returns Array of active reminders
   */
  async getActiveReminders(userId: string): Promise<ReminderEvent[]> {
    return await ReminderEventModel.findActive(userId);
  }

  /**
   * Lists all reminders for a user with pagination
   * @param userId - User ID
   * @param options - Query options
   * @returns Paginated reminders
   */
  async listReminders(
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
    return await ReminderEventModel.findByUser(userId, options);
  }

  /**
   * Updates reminder status
   * @param id - Reminder ID
   * @param userId - User ID for authorization
   * @param status - New status
   * @returns Updated reminder
   */
  async updateStatus(id: string, userId: string, status: ReminderStatus): Promise<ReminderEvent> {
    return await ReminderEventModel.updateStatus(id, userId, status);
  }

  /**
   * Acknowledges a reminder (user has seen and acted on it)
   * @param id - Reminder ID
   * @param userId - User ID for authorization
   * @returns Updated reminder
   */
  async acknowledgeReminder(id: string, userId: string): Promise<ReminderEvent> {
    return await ReminderEventModel.acknowledge(id, userId);
  }

  /**
   * Dismisses a reminder (user doesn't want to see it again)
   * @param id - Reminder ID
   * @param userId - User ID for authorization
   * @returns Updated reminder
   */
  async dismissReminder(id: string, userId: string): Promise<ReminderEvent> {
    return await ReminderEventModel.dismiss(id, userId);
  }

  /**
   * Marks pending reminders as shown
   * @param userId - User ID
   * @returns Number of reminders updated
   */
  async markPendingAsShown(userId: string): Promise<number> {
    return await ReminderEventModel.markPendingAsShown(userId);
  }

  /**
   * Deletes a reminder
   * @param id - Reminder ID
   * @param userId - User ID for authorization
   */
  async deleteReminder(id: string, userId: string): Promise<void> {
    return await ReminderEventModel.delete(id, userId);
  }

  /**
   * Deletes old acknowledged/dismissed reminders
   * @param daysOld - Delete reminders older than this many days
   * @returns Number of deleted reminders
   */
  async deleteOldReminders(daysOld: number = 90): Promise<number> {
    return await ReminderEventModel.deleteOld(daysOld);
  }

  /**
   * Gets reminder statistics
   * @param userId - User ID
   * @returns Statistics summary
   */
  async getStatistics(userId: string): Promise<{
    total: number;
    pending: number;
    shown: number;
    acknowledged: number;
    dismissed: number;
  }> {
    return await ReminderEventModel.getStatistics(userId);
  }

  /**
   * Triggers automatic reminders based on user's snapshots
   * @param userId - User ID
   * @returns Array of created reminders
   */
  async triggerAutomaticReminders(userId: string): Promise<ReminderEvent[]> {
    const createdReminders: ReminderEvent[] = [];
    const now = new Date();

    // Get all snapshots for the user
    const snapshots = await YearlySnapshotModel.findByUser(userId, {
      page: 1,
      limit: 1000
    });

    // Check for Zakat anniversary approaching (30 days before)
    const currentYear = now.getFullYear();
    const primarySnapshot = await YearlySnapshotModel.findPrimaryByYear(userId, currentYear);

    if (primarySnapshot) {
      const calcDate = new Date(primarySnapshot.calculationDate);
      const nextAnniversary = new Date(calcDate);
      nextAnniversary.setFullYear(currentYear + 1);

      const daysUntilAnniversary = Math.floor(
        (nextAnniversary.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilAnniversary <= 30 && daysUntilAnniversary > 0) {
        // Check if reminder already exists
        const existing = await ReminderEventModel.findByUser(userId, {
          status: 'pending'
        });

        const anniversaryReminderExists = existing.data.some(
          r => r.eventType === 'zakat_anniversary_approaching'
        );

        if (!anniversaryReminderExists) {
          const reminder = await this.createReminder(userId, {
            eventType: 'zakat_anniversary_approaching',
            triggerDate: now,
            title: 'Zakat Anniversary Approaching',
            message: `Your Zakat anniversary is in ${daysUntilAnniversary} days. Time to start preparing your calculation.`,
            priority: 'high',
            relatedSnapshotId: primarySnapshot.id,
            metadata: { daysRemaining: daysUntilAnniversary }
          });
          createdReminders.push(reminder);
        }
      }
    }

    // Check for overdue calculations (no calculation this year)
    if (!primarySnapshot) {
      const lastYearSnapshot = await YearlySnapshotModel.findPrimaryByYear(userId, currentYear - 1);
      
      if (lastYearSnapshot) {
        const monthsSinceLastCalc = Math.floor(
          (now.getTime() - new Date(lastYearSnapshot.calculationDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
        );

        if (monthsSinceLastCalc >= 13) {
          const existing = await ReminderEventModel.findByUser(userId, {
            status: 'pending'
          });

          const overdueReminderExists = existing.data.some(
            r => r.eventType === 'calculation_overdue'
          );

          if (!overdueReminderExists) {
            const reminder = await this.createReminder(userId, {
              eventType: 'calculation_overdue',
              triggerDate: now,
              title: 'Zakat Calculation Overdue',
              message: `It's been ${monthsSinceLastCalc} months since your last Zakat calculation. Calculate now to stay on track.`,
              priority: 'high',
              metadata: { monthsOverdue: monthsSinceLastCalc }
            });
            createdReminders.push(reminder);
          }
        }
      }
    }

    // Check for incomplete payments
    if (primarySnapshot && primarySnapshot.status === 'finalized') {
      const PaymentRecordModel = (await import('../models/PaymentRecord')).PaymentRecordModel;
      const payments = await PaymentRecordModel.findBySnapshot(primarySnapshot.id, userId);
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const zakatAmount = primarySnapshot.zakatAmount;

      if (totalPaid < zakatAmount) {
        const percentageRemaining = ((zakatAmount - totalPaid) / zakatAmount) * 100;

        if (percentageRemaining > 10) {
          const existing = await ReminderEventModel.findByUser(userId, {
            status: 'pending'
          });

          const paymentReminderExists = existing.data.some(
            r => r.eventType === 'payment_incomplete'
          );

          if (!paymentReminderExists) {
            const reminder = await this.createReminder(userId, {
              eventType: 'payment_incomplete',
              triggerDate: now,
              title: 'Zakat Payment Incomplete',
              message: `${percentageRemaining.toFixed(1)}% of your Zakat obligation remains unpaid. Record your payments to track completion.`,
              priority: 'medium',
              relatedSnapshotId: primarySnapshot.id,
              metadata: { 
                amountRemaining: zakatAmount - totalPaid,
                percentageRemaining 
              }
            });
            createdReminders.push(reminder);
          }
        }
      }
    }

    // Check for yearly comparison availability (if user has 2+ years)
    if (snapshots.data.length >= 2) {
      const existing = await ReminderEventModel.findByUser(userId, {
        status: 'pending'
      });

      const comparisonReminderExists = existing.data.some(
        r => r.eventType === 'yearly_comparison_available'
      );

      if (!comparisonReminderExists) {
        const reminder = await this.createReminder(userId, {
          eventType: 'yearly_comparison_available',
          triggerDate: now,
          title: 'Yearly Comparison Available',
          message: `You have ${snapshots.data.length} years of data. View trends and insights in your analytics dashboard.`,
          priority: 'low',
          metadata: { yearsAvailable: snapshots.data.length }
        });
        createdReminders.push(reminder);
      }
    }

    // Data backup reminder (every 6 months)
    const allReminders = await ReminderEventModel.findByUser(userId, {
      sortOrder: 'desc'
    });

    const backupReminders = allReminders.data.filter(r => r.eventType === 'data_backup_reminder');
    
    const shouldCreateBackupReminder = 
      backupReminders.length === 0 ||
      (now.getTime() - new Date(backupReminders[0].createdAt).getTime()) > (180 * 24 * 60 * 60 * 1000);

    if (shouldCreateBackupReminder && snapshots.data.length > 0) {
      const reminder = await this.createReminder(userId, {
        eventType: 'data_backup_reminder',
        triggerDate: now,
        title: 'Backup Your Data',
        message: 'Export and backup your Zakat calculation history to keep your records safe.',
        priority: 'low',
        metadata: { snapshotsCount: snapshots.data.length }
      });
      createdReminders.push(reminder);
    }

    return createdReminders;
  }

  /**
   * Triggers zakat anniversary reminders for a user
   * @param userId - User ID
   * @returns Array of created reminders
   */
  async triggerZakatAnniversaryReminders(userId: string): Promise<ReminderEvent[]> {
    const createdReminders: ReminderEvent[] = [];
    const now = new Date();

    // Get all snapshots for the user
    const snapshots = await YearlySnapshotModel.findByUser(userId, { limit: 100 });
    
    for (const snapshot of snapshots.data) {
      // Check if it's time for anniversary reminder (1 year after calculation)
      const anniversaryDate = new Date(snapshot.createdAt);
      anniversaryDate.setFullYear(anniversaryDate.getFullYear() + 1);
      
      // If anniversary is within 7 days
      const daysUntilAnniversary = Math.ceil((anniversaryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilAnniversary >= 0 && daysUntilAnniversary <= 7) {
        const reminder = await this.createReminder(userId, {
          eventType: 'zakat_anniversary_approaching',
          triggerDate: anniversaryDate,
          title: 'Zakat Anniversary Reminder',
          message: `Your Zakat calculation from ${snapshot.gregorianYear} is approaching its one-year anniversary.`,
          priority: 'high',
          relatedSnapshotId: snapshot.id,
          metadata: { 
            year: snapshot.gregorianYear,
            anniversaryDate: anniversaryDate.toISOString()
          }
        });
        createdReminders.push(reminder);
      }
    }

    return createdReminders;
  }

  /**
   * Batch triggers reminders for all users (for scheduled jobs)
   * @returns Number of reminders created
   */
  async batchTriggerReminders(): Promise<{ usersProcessed: number; remindersCreated: number }> {
    // This would be called by a cron job
    // For now, just return a placeholder
    return {
      usersProcessed: 0,
      remindersCreated: 0
    };
  }
}
