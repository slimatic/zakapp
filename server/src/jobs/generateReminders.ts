/**
 * Reminder Generation Job
 * 
 * Generates ReminderEvent entries for users approaching their Zakat due dates
 * based on their finalized yearly snapshots. Uses Hijri calendar anniversary
 * calculation to determine optimal reminder timing.
 * 
 * Schedule: Daily at 3:00 AM
 * Duration: ~500ms-2s depending on user base
 */

import { PrismaClient } from '@prisma/client';
import { toHijri } from 'hijri-converter';

const prisma = new PrismaClient();

/**
 * Configuration for reminder generation
 */
export const REMINDER_CONFIG = {
  // Create reminders 30 days before Zakat anniversary (Hijri)
  daysBeforeAnniversary: 30,
  // Don't create duplicate reminders within this window
  duplicateWindowDays: 7,
};

/**
 * Checks if a date is within X days of a Hijri anniversary
 */
function isNearHijriAnniversary(
  originalHijriYear: number,
  originalHijriMonth: number,
  originalHijriDay: number,
  daysInAdvance: number
): boolean {
  const today = new Date();
  const todayHijri = toHijri(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  );

  // Calculate target reminder date (anniversary - daysInAdvance)
  let targetMonth = originalHijriMonth;
  let targetDay = originalHijriDay - daysInAdvance;

  // Handle day underflow
  if (targetDay <= 0) {
    targetMonth -= 1;
    // Approximate: most Hijri months are 29-30 days
    targetDay += 29; // Will be close enough for reminder purposes
  }

  // Handle month underflow
  if (targetMonth <= 0) {
    targetMonth += 12;
  }

  // Check if today matches the reminder date
  return todayHijri.hm === targetMonth && todayHijri.hd === targetDay;
}

/**
 * Generates reminder events for users approaching Zakat anniversaries
 * 
 * @returns Statistics about reminder generation
 */
export async function generateZakatReminders(): Promise<{
  created: number;
  skipped: number;
  duration: number;
  errors: string[];
}> {
  const startTime = Date.now();
  const errors: string[] = [];
  let created = 0;
  let skipped = 0;

  try {
    // eslint-disable-next-line no-console
    console.log('[Reminder Generation] Starting reminder generation');

    // Get all users with finalized snapshots
    const users = await prisma.user.findMany({
      include: {
        yearlySnapshots: {
          where: {
            status: 'finalized',
          },
          orderBy: {
            hijriYear: 'desc',
          },
          take: 1, // Most recent snapshot per user
        },
      },
    });

    // eslint-disable-next-line no-console
    console.log(`[Reminder Generation] Checking ${users.length} users for reminders`);

    for (const user of users) {
      try {
        // Skip users with no finalized snapshots
        if (user.yearlySnapshots.length === 0) {
          skipped++;
          continue;
        }

        const latestSnapshot = user.yearlySnapshots[0];

        // Check if anniversary is approaching
        const shouldRemind = isNearHijriAnniversary(
          latestSnapshot.hijriYear,
          latestSnapshot.hijriMonth,
          1, // Use first day of the month for simplicity
          REMINDER_CONFIG.daysBeforeAnniversary
        );

        if (!shouldRemind) {
          skipped++;
          continue;
        }

        // Check for duplicate reminders in the recent window
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - REMINDER_CONFIG.duplicateWindowDays);

        const existingReminder = await prisma.reminderEvent.findFirst({
          where: {
            userId: user.id,
            eventType: 'zakat_anniversary',
            createdAt: {
              gte: cutoffDate,
            },
          },
        });

        if (existingReminder) {
          skipped++;
          continue;
        }

        // Create reminder event
        const triggerDate = new Date();
        triggerDate.setDate(triggerDate.getDate() + REMINDER_CONFIG.daysBeforeAnniversary);

        await prisma.reminderEvent.create({
          data: {
            userId: user.id,
            eventType: 'zakat_anniversary',
            triggerDate,
            title: 'Zakat Anniversary Approaching',
            message: `Your Zakat anniversary is approaching on ${triggerDate.toLocaleDateString()}. Consider creating a new yearly snapshot.`,
            status: 'pending',
            priority: 'medium',
            relatedSnapshotId: latestSnapshot.id,
          },
        });

        created++;
        // eslint-disable-next-line no-console
        console.log(`[Reminder Generation] Created reminder for user ${user.id}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to create reminder for user ${user.id}: ${errorMessage}`);
        // eslint-disable-next-line no-console
        console.error(`[Reminder Generation] Error for user ${user.id}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    // eslint-disable-next-line no-console
    console.log(`[Reminder Generation] Created ${created} reminders, skipped ${skipped} in ${duration}ms`);

    return {
      created,
      skipped,
      duration,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Reminder generation failed: ${errorMessage}`);
    // eslint-disable-next-line no-console
    console.error('[Reminder Generation] Error:', error);

    return {
      created,
      skipped,
      duration: Date.now() - startTime,
      errors,
    };
  }
}

/**
 * Job handler for scheduled execution
 */
export async function runReminderGenerationJob(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('[Reminder Generation] Job started');
  const result = await generateZakatReminders();
  
  if (result.errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error('[Reminder Generation] Job completed with errors:', result.errors);
  } else {
    // eslint-disable-next-line no-console
    console.log('[Reminder Generation] Job completed successfully');
  }
}
