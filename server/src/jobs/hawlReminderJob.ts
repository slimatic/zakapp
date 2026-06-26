/**
 * Copyright (c) 2024-2026 ZakApp Contributors
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
 * HAWL Reminder Job (M5.1)
 *
 * Scheduled job that generates reminder events for users approaching
 * their Hawl (lunar year) completion date.
 *
 * Reminder windows: 30 days, 7 days, 1 day before Hawl end
 * Respects user preferences: reminderEnabled, reminderChannel
 *
 * Schedule: Daily at 6:00 AM local time
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';
import { ReminderEventModel } from '../models/ReminderEvent';
import { EncryptionService } from '../services/EncryptionService';
import type { ReminderEventType } from '@zakapp/shared';

const logger = new Logger('HawlReminderJob');

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface HawlReminderResult {
  startTime: Date;
  endTime: Date;
  durationMs: number;
  usersProcessed: number;
  remindersCreated: number;
  remindersSkipped: number;
  errors: string[];
  errorCount: number;
  breakdown: Record<string, number>; // "30d" | "7d" | "1d"
}

interface UserSettings {
  reminderEnabled?: boolean;
  reminderChannel?: 'push' | 'email' | 'both';
  [key: string]: unknown;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const HAWL_DURATION_DAYS = 354;

/** How far in advance to generate each reminder tier */
const REMINDER_WINDOWS = [
  { label: '30d', daysBefore: 30, priority: 'medium' as const },
  { label: '7d',  daysBefore: 7,  priority: 'high'   as const },
  { label: '1d',  daysBefore: 1,  priority: 'high'   as const },
];

/** Prevent duplicate reminders for same window within this range */
const DUPLICATE_WINDOW_DAYS = 7;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Extract user preferences from encrypted settings blob.
 * Defaults: reminderEnabled=true, reminderChannel='push'
 */
function parseUserSettings(settings: string | null | undefined): UserSettings {
  if (!settings) {
    return { reminderEnabled: true, reminderChannel: 'push' };
  }

  // The `settings` field is encrypted JSON stored on the User model.
  // The caller (runHawlReminderJob) must decrypt it before calling
  // this function.
  try {
    const parsed = typeof settings === 'string' ? JSON.parse(settings) : settings;
    return {
      reminderEnabled: parsed?.reminderEnabled ?? true,
      reminderChannel: parsed?.reminderChannel ?? 'push',
      ...parsed,
    };
  } catch {
    return { reminderEnabled: true, reminderChannel: 'push' };
  }
}

/**
 * Check whether a reminder for this user/window already exists.
 */
async function reminderExists(
  prisma: PrismaClient,
  userId: string,
  snapshotId: string,
  windowLabel: string
): Promise<boolean> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DUPLICATE_WINDOW_DAYS);

  const existing = await prisma.reminderEvent.findFirst({
    where: {
      userId,
      relatedSnapshotId: snapshotId,
      eventType: 'hawl_due',
      status: { in: ['pending', 'shown'] },
      createdAt: { gte: cutoffDate },
      metadata: { contains: `"window":"${windowLabel}"` },
    },
  });

  return !!existing;
}

/* ------------------------------------------------------------------ */
/*  Job entry point                                                    */
/* ------------------------------------------------------------------ */

/**
 * Generate HAWL end reminders for all active users with an
 * active (DRAFT) yearly snapshot.
 *
 * Rules:
 * 1. Only process active snapshots (status = 'DRAFT') that have
 *    a `hawlCompletionDate` set.
 * 2. Respect user settings (reminderEnabled / reminderChannel).
 * 3. Create at most one reminder per window per snapshot to avoid
 *    spam.  Existing pending/shown reminders act as dedup.
 * 4. Trigger 30 days, 7 days, and 1 day before Hawl completion.
 */
export async function runHawlReminderJob(
  prisma: PrismaClient
): Promise<HawlReminderResult> {
  const startTime = new Date();
  const result: HawlReminderResult = {
    startTime,
    endTime: startTime,
    durationMs: 0,
    usersProcessed: 0,
    remindersCreated: 0,
    remindersSkipped: 0,
    errors: [],
    errorCount: 0,
    breakdown: { '30d': 0, '7d': 0, '1d': 0 },
  };

  try {
    logger.info('Starting HAWL reminder job');

    /* 1. Find all users with an active (DRAFT) snapshot
          that has hawlCompletionDate populated. */
    const snapshots = await prisma.yearlySnapshot.findMany({
      where: {
        status: 'DRAFT',
        hawlCompletionDate: { not: null },
        user: { isActive: true },
      },
      include: { user: { select: { id: true, email: true, settings: true, isActive: true } } },
      orderBy: { hawlCompletionDate: 'asc' },
    });

    logger.info(`Found ${snapshots.length} active snapshots with Hawl completion dates`);

    for (const snapshot of snapshots) {
      try {
        result.usersProcessed++;

        const user = snapshot.user;
        const hawlCompletionDate = snapshot.hawlCompletionDate!;
        const now = new Date();

        /* 2. Calculate how many days until Hawl completion */
        const msUntilCompletion = hawlCompletionDate.getTime() - now.getTime();
        const daysUntilCompletion = Math.ceil(msUntilCompletion / (1000 * 60 * 60 * 24));

        if (daysUntilCompletion < 0) {
          // Hawl already complete; reminder window has passed.
          result.remindersSkipped++;
          continue;
        }

        /* 3. Decrypt user settings and check preferences */
        let decryptedSettings: UserSettings;
        if (user.settings) {
          try {
            const plain = await EncryptionService.decrypt(user.settings, process.env.ENCRYPTION_KEY!);
            decryptedSettings = parseUserSettings(plain);
          } catch {
            decryptedSettings = parseUserSettings(null);
          }
        } else {
          decryptedSettings = parseUserSettings(null);
        }

        if (decryptedSettings.reminderEnabled === false) {
          result.remindersSkipped++;
          logger.debug(`User ${user.id} has reminders disabled — skipping`);
          continue;
        }

        /* 4. Determine which window(s) we are inside */
        for (const window of REMINDER_WINDOWS) {
          const triggerDays = window.daysBefore;

          // We want to fire when the user is *within* the window.
          // Example: for 30-day window, days until completion must be
          // <= 30 AND > 7 (so the 7-day window doesn't overlap).
          const nextWindowDays = REMINDER_WINDOWS.find(w => w.daysBefore < triggerDays)?.daysBefore ?? 0;

          const isInWindow =
            daysUntilCompletion <= triggerDays &&
            daysUntilCompletion > nextWindowDays;

          if (!isInWindow) continue;

          /* 5. Duplicate check */
          const alreadyExists = await reminderExists(
            prisma,
            user.id,
            snapshot.id,
            window.label
          );

          if (alreadyExists) {
            logger.debug(`User ${user.id}: ${window.label} reminder already exists`);
            continue;
          }

          /* 6. Create ReminderEvent */
          const triggerDate = new Date();
          triggerDate.setDate(triggerDate.getDate() + Math.max(0, daysUntilCompletion));

          const message = buildReminderMessage(
            daysUntilCompletion,
            hawlCompletionDate,
            decryptedSettings.reminderChannel ?? 'push'
          );

          await ReminderEventModel.create(user.id, {
            eventType: 'hawl_due' as ReminderEventType,
            triggerDate,
            title: buildReminderTitle(daysUntilCompletion),
            message,
            priority: window.priority,
            relatedSnapshotId: snapshot.id,
            metadata: {
              window: window.label,
              daysUntilCompletion,
              hawlCompletionDate: hawlCompletionDate.toISOString(),
              reminderChannel: decryptedSettings.reminderChannel ?? 'push',
            },
          });

          result.remindersCreated++;
          result.breakdown[window.label]++;
          logger.info(
            `Created ${window.label} HAWL reminder for user ${user.id} ` +
            `(${daysUntilCompletion} days until completion)`
          );
        }
      } catch (userError) {
        result.errorCount++;
        const errorMsg = `Error processing snapshot ${snapshot.id}: ${
          userError instanceof Error ? userError.message : String(userError)
        }`;
        result.errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }

    const endTime = new Date();
    result.endTime = endTime;
    result.durationMs = endTime.getTime() - startTime.getTime();

    logger.info(
      `HAWL reminder job complete: ${result.usersProcessed} users, ` +
      `${result.remindersCreated} created, ${result.remindersSkipped} skipped, ` +
      `${result.errorCount} errors, ${result.durationMs}ms ` +
      `[30d=${result.breakdown['30d']}, 7d=${result.breakdown['7d']}, 1d=${result.breakdown['1d']}]`
    );

    return result;
  } catch (error) {
    logger.error('HAWL reminder job failed', error);
    result.errorCount++;
    result.errors.push(
      `Job execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/*  Message builders                                                   */
/* ------------------------------------------------------------------ */

function buildReminderTitle(daysUntil: number): string {
  if (daysUntil <= 1) return 'Your Zakat is Due Today';
  if (daysUntil <= 7) return 'Zakat Due This Week';
  return 'Zakat Due in 30 Days';
}

function buildReminderMessage(
  daysUntil: number,
  completionDate: Date,
  channel: string
): string {
  const dateStr = completionDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const base =
    daysUntil <= 1
      ? `Your Hawl (lunar year) reaches completion on ${dateStr}. Your Zakat obligation is now due. May Allah accept your charity. 🌙`
      : daysUntil <= 7
      ? `Your Zakat due date is approaching in ${daysUntil} day${daysUntil === 1 ? '' : 's'} (${dateStr}). Prepare your calculation and consider fulfilling your obligation early.`
      : `Your Zakat anniversary is approaching in ${daysUntil} days (${dateStr}). Begin reviewing your assets and liabilities to prepare for your calculation.`;

  if (channel === 'email') {
    return `${base}\n\nThis is a reminder from ZakApp. You can adjust your reminder preferences in your settings.`;
  }

  return base;
}

/* ------------------------------------------------------------------ */
/*  Cron / scheduler configuration                                     */
/* ------------------------------------------------------------------ */

export const hawlReminderJobConfig = {
  name: 'hawlReminderJob',
  schedule: '0 6 * * *', // Every day at 06:00
  description: 'Daily HAWL reminder: notifies 30d, 7d, 1d before Hawl completion',
  timeout: 60000, // 60 second timeout
  maxRetries: 3,
  retryDelay: 5000,
};
