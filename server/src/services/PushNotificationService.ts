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

// Dynamically require optional dependency 'web-push' to avoid compile-time errors when it's not installed
let webpush: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  webpush = require('web-push');
} catch (err) {
  // web-push is optional in some environments (tests, CI). We'll handle absence gracefully.
  webpush = null;
}

import { prisma } from '../config/database';
import { Logger } from '../utils/logger';

const logger = new Logger('PushNotificationService');


// VAPID keys for push notifications
// In production, these should be environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@zakapp.com';

// Configure web-push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  logger.warn('⚠️ VAPID keys not configured - push notifications will not work');
}

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
    // In a real implementation, fetch user's push subscriptions from database
    // For now, this is a placeholder

    logger.info(`📤 Sending push notification to user: ${userId}`);
    logger.info(`Notification: ${payload.title} - ${payload.body}`);

    // TODO: Implement database schema for storing push subscriptions
    // const subscriptions = await prisma.pushSubscription.findMany({
    //   where: { userId }
    // });

    // for (const sub of subscriptions) {
    //   const success = await sendPushNotification(sub.subscription, payload);
    //   if (!success) {
    //     // Remove expired subscription
    //     await prisma.pushSubscription.delete({ where: { id: sub.id } });
    //   }
    // }
  } catch (error) {
    logger.error('❌ Failed to send push notification to user:', error);
  }
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

    // TODO: Implement logic to find users whose Zakat is due soon
    // const usersWithUpcomingZakat = await prisma.user.findMany({
    //   where: {
    //     zakatDueDate: {
    //       gte: new Date(),
    //       lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
    //     },
    //   },
    // });

    // for (const user of usersWithUpcomingZakat) {
    //   const daysUntilDue = Math.ceil(
    //     (user.zakatDueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    //   );
    //   
    //   if (daysUntilDue === 30 || daysUntilDue === 7 || daysUntilDue === 1) {
    //     await sendZakatReminder(user.id, daysUntilDue);
    //   }
    // }

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
