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

/**
 * Push Notification Service
 * 
 * Handles sending push notifications to subscribed users for Zakat reminders.
 * Uses Web Push protocol with VAPID authentication.
 */

// web-push is now a direct dependency (#313). Imported lazily via require to
// keep the module resilient if the dependency is stripped in slim installs.
import type * as WebPushTypes from 'web-push';
let webpush: typeof WebPushTypes | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  webpush = require('web-push');
} catch (err) {
  // web-push absence is handled gracefully (push disabled).
  webpush = null;
}

/**
 * Test seam (#313): override the web-push implementation (e.g. vi.mock in
 * tests, where raw CJS require bypasses the ESM mock registry).
 * @internal
 */
export function __setWebPushForTesting(impl: typeof WebPushTypes | null): void {
  webpush = impl;
  configureVapid();
}

import { Logger } from '../utils/logger';

const logger = new Logger('PushNotificationService');
import { prisma } from '../utils/prisma';


// Reminder policy (#313): fire on these days-before-due within a 30-day window
const REMINDER_DAYS = [30, 7, 1];
const REMINDER_WINDOW_DAYS = 30;

// VAPID keys for push notifications
// In production, these should be environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@zakapp.com';

function configureVapid(): void {
  if (webpush && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  }
}
configureVapid();

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

/**
 * Send push notification to a single subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    if (!webpush) {
      logger.warn('⚠️ web-push unavailable — notification skipped');
      return false;
    }
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    logger.info('✅ Push notification sent successfully');
    return true;
  } catch (error: any) {
    if (error.statusCode === 410) {
      // Subscription expired or unsubscribed
      logger.warn('⚠️ Push subscription expired:', error.endpoint);
      return false;
    }

    logger.error('❌ Failed to send push notification:', error);
    return false;
  }
}

/**
 * Send push notification to a user (all their subscriptions)
 */
export async function sendPushToUser(
  userId: string,
  payload: NotificationPayload
): Promise<void> {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    });

    logger.info(`📤 Sending push notification to user ${userId} (${subscriptions.length} subscription(s))`);

    for (const sub of subscriptions) {
      const success = await sendPushNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      if (!success) {
        // Subscription expired (410) or send failed unrecoverably — prune it
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
      }
    }
  } catch (error) {
    logger.error('❌ Failed to send push notification to user:', error);
  }
}

/**
 * Persist a new push subscription for a user (idempotent on endpoint).
 */
export async function subscribePush(
  userId: string,
  subscription: PushSubscription,
  userAgent?: string
): Promise<void> {
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      userId,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent ?? null
    },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent ?? null
    }
  });
  logger.info(`✅ Push subscription stored for user ${userId}`);
}

/**
 * Remove a push subscription (by endpoint, for the owning user).
 */
export async function unsubscribePush(userId: string, endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({
    where: { userId, endpoint }
  });
  logger.info(`✅ Push subscription removed for user ${userId}`);
}

/**
 * Send Zakat reminder notification to user
 */
export async function sendZakatReminder(
  userId: string,
  daysUntilDue: number
): Promise<void> {
  const payload: NotificationPayload = {
    title: 'Zakat Reminder',
    body: `Your Zakat calculation is due in ${daysUntilDue} days. Don't forget to update your assets!`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'zakat-reminder',
    data: {
      url: '/zakat/calculator',
      daysUntilDue,
    },
    actions: [
      {
        action: 'calculate',
        title: 'Calculate Now',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  };

  await sendPushToUser(userId, payload);
}

/**
 * Send asset update reminder notification
 */
export async function sendAssetUpdateReminder(
  userId: string,
  daysUntilZakat: number
): Promise<void> {
  const payload: NotificationPayload = {
    title: 'Update Your Assets',
    body: `${daysUntilZakat} days until your Zakat due date. Update your assets to get an accurate calculation.`,
    icon: '/icons/icon-192x192.png',
    tag: 'asset-update',
    data: {
      url: '/assets',
    },
    actions: [
      {
        action: 'update',
        title: 'Update Assets',
      },
      {
        action: 'dismiss',
        title: 'Later',
      },
    ],
  };

  await sendPushToUser(userId, payload);
}

/**
 * Schedule Zakat reminders for all users
 * This would typically run as a cron job
 */
export async function scheduleZakatReminders(): Promise<void> {
  try {
    logger.info('⏰ Scheduling Zakat reminders...');

    // Hawl windows ending within the next 30 days that are not yet finalized
    const now = new Date();
    const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const snapshots = await prisma.yearlySnapshot.findMany({
      where: {
        hawlCompletionDate: { gte: now, lte: windowEnd },
        status: { not: 'FINALIZED' }
      },
      select: { userId: true, hawlCompletionDate: true }
    });

    for (const snap of snapshots) {
      if (!snap.hawlCompletionDate) continue;
      const daysUntilDue = Math.ceil(
        (snap.hawlCompletionDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );

      // Only fire on the configured reminder days (30 / 7 / 1)
      if (!REMINDER_DAYS.includes(daysUntilDue)) continue;

      // Dedupe: one ReminderEvent per user/day-marker; skip if already sent
      const dedupeKey = `push_zakat_due_${daysUntilDue}`;
      const alreadySent = await prisma.reminderEvent.findFirst({
        where: {
          userId: snap.userId,
          eventType: dedupeKey,
          triggerDate: snap.hawlCompletionDate
        }
      });
      if (alreadySent) continue;

      await sendZakatReminder(snap.userId, daysUntilDue);
      await prisma.reminderEvent.create({
        data: {
          userId: snap.userId,
          eventType: dedupeKey,
          triggerDate: snap.hawlCompletionDate,
          title: 'Zakat Reminder',
          message: `Your Zakat calculation is due in ${daysUntilDue} days.`,
          priority: daysUntilDue <= 7 ? 'high' : 'medium',
          status: 'pending'
        }
      }).catch(err => logger.warn('ReminderEvent dedupe row not stored:', err));
    }

    logger.info('✅ Zakat reminders scheduled successfully');
  } catch (error) {
    logger.error('❌ Failed to schedule Zakat reminders:', error);
  }
}

/**
 * Get VAPID public key for client-side subscription
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

export default {
  sendPushNotification,
  sendPushToUser,
  sendZakatReminder,
  sendAssetUpdateReminder,
  scheduleZakatReminders,
  getVapidPublicKey,
};
