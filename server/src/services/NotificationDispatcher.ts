/**
 * Notification Dispatcher (M5.1)
 *
 * Routes HAWL reminders to the correct delivery channel(s) based on
 * user preference (push, email, both).
 *
 * Uses existing infrastructure:
 *   - EmailService          → SMTP / Resend
 *   - PushNotificationService → Web Push (VAPID)
 *   - ReminderEventModel    → In-app dashboard reminders
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';
import { ReminderEventModel } from '../models/ReminderEvent';
import type { ReminderPriority, ReminderEventType } from '@zakapp/shared';

const logger = new Logger('NotificationDispatcher');

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type NotificationChannel = 'push' | 'email' | 'both';

export interface DispatchPayload {
  userId: string;
  userEmail: string;
  title: string;
  message: string;
  priority: ReminderPriority;
  relatedSnapshotId: string;
  windowLabel: string;
  daysUntilCompletion: number;
  metadata?: Record<string, unknown>;
}

export interface DispatchResult {
  userId: string;
  channels: NotificationChannel[];
  inApp: boolean;
  email: boolean;
  push: boolean;
  error?: string;
}

/* ------------------------------------------------------------------ */
/*  Lazy imports — keep soft dep on optional services                  */
/* ------------------------------------------------------------------ */

/**
 * Lazy imports to keep soft dep on optional services.
 */
async function getEmailService() {
  const { EmailService } = await import('../services/EmailService');
  return EmailService.getInstance();
}

async function getPushService() {
  const { sendPushToUser } = await import('../services/PushNotificationService');
  return { sendPushToUser };
}

/* ------------------------------------------------------------------ */
/*  Main dispatcher                                                    */
/* ------------------------------------------------------------------ */

/**
 * Dispatch a HAWL reminder to the user's preferred channel(s).
 *
 * Order:
 *   1. Always create an in-app ReminderEvent (dashboard notification).
 *   2. If channel includes 'email', send via EmailService.
 *   3. If channel includes 'push',  send via PushNotificationService.
 */
export async function dispatchHawlReminder(
  prisma: PrismaClient,
  payload: DispatchPayload,
  channel: NotificationChannel
): Promise<DispatchResult> {
  const result: DispatchResult = {
    userId: payload.userId,
    channels: channel === 'both' ? ['push', 'email'] : [channel],
    inApp: false,
    email: false,
    push: false,
  };

  try {
    /* 1. In-app dashboard reminder (always) */
    await ReminderEventModel.create(payload.userId, {
      eventType: 'hawl_due' as ReminderEventType,
      triggerDate: new Date(),
      title: payload.title,
      message: payload.message,
      priority: payload.priority,
      relatedSnapshotId: payload.relatedSnapshotId,
      metadata: {
        ...payload.metadata,
        window: payload.windowLabel,
        daysUntilCompletion: payload.daysUntilCompletion,
        dispatchedChannels: result.channels,
      },
    });
    result.inApp = true;

    /* 2. Email */
    if (channel === 'email' || channel === 'both') {
      try {
        const emailService = await getEmailService();

        // Build a simple HTML email body
        const htmlBody = buildEmailHtml(payload.title, payload.message, payload.daysUntilCompletion);

        const sent = await emailService.sendEmail(
          payload.userEmail,
          payload.title,
          htmlBody,
          // plain-text fallback
          payload.message.replace(/<[^>]*>/g, '')
        );

        if (sent) {
          result.email = true;
          logger.info(`📧 Email sent to ${payload.userEmail} for HAWL reminder`);
        } else {
          logger.warn(`⚠️ Email not sent to ${payload.userEmail} — sendEmail returned false`);
        }
      } catch (emailErr) {
        logger.error(`❌ Email dispatch failed for ${payload.userEmail}:`, emailErr);
        result.error = `Email failed: ${emailErr instanceof Error ? emailErr.message : String(emailErr)}`;
      }
    }

    /* 3. Push */
    if (channel === 'push' || channel === 'both') {
      try {
        const { sendPushToUser } = await getPushService();

        await sendPushToUser(payload.userId, {
          title: payload.title,
          body: payload.message.replace(/<[^>]*>/g, ''),
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: `hawl-reminder-${payload.windowLabel}`,
          data: {
            url: '/zakat/calculator',
            daysUntilCompletion: payload.daysUntilCompletion,
            snapshotId: payload.relatedSnapshotId,
          },
          actions: [
            { action: 'calculate', title: 'Calculate Zakat' },
            { action: 'dismiss',   title: 'Dismiss' },
          ],
        });

        result.push = true;
        logger.info(`🔔 Push sent to user ${payload.userId} for HAWL reminder`);
      } catch (pushErr) {
        logger.error(`❌ Push dispatch failed for user ${payload.userId}:`, pushErr);
        result.error = result.error
          ? `${result.error}; Push failed: ${pushErr instanceof Error ? pushErr.message : String(pushErr)}`
          : `Push failed: ${pushErr instanceof Error ? pushErr.message : String(pushErr)}`;
      }
    }

    return result;
  } catch (err) {
    const msg = `Dispatch failed for user ${payload.userId}: ${
      err instanceof Error ? err.message : String(err)
    }`;
    logger.error(msg, err);
    result.error = msg;
    return result;
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function buildEmailHtml(title: string, message: string, daysUntil: number): string {
  const urgencyClass = daysUntil <= 1 ? 'urgent' : daysUntil <= 7 ? 'soon' : 'upcoming';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #059669; padding: 28px 24px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 600; }
    .body { padding: 24px; }
    .body p { color: #374151; line-height: 1.6; font-size: 16px; margin: 0 0 16px; }
    .cta { display: block; text-align: center; margin: 24px 0; }
    .cta a { display: inline-block; background: #059669; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 500; }
    .footer { padding: 16px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; text-align: center; }
    .urgent .header { background: #dc2626; }
    .urgent .cta a { background: #dc2626; }
    .soon .header { background: #ea580c; }
    .soon .cta a { background: #ea580c; }
  </style>
</head>
<body>
  <div class="container ${urgencyClass}">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="body">
      <p>${message.replace(/\n/g, '<br>')}</p>
      <div class="cta">
        <a href="https://zakapp.app/zakat/calculator">Calculate Zakat Now</a>
      </div>
    </div>
    <div class="footer">
      You received this reminder because your Zakat due date is approaching.<br>
      <a href="https://zakapp.app/settings">Manage reminder preferences</a>
    </div>
  </div>
</body>
</html>`;
}
