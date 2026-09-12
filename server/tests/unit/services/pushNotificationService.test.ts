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

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the prisma singleton BEFORE importing the service under test
vi.mock('../../../src/utils/prisma', () => ({
  prisma: {
    pushSubscription: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn()
    },
    yearlySnapshot: {
      findMany: vi.fn()
    },
    reminderEvent: {
      findFirst: vi.fn(),
      create: vi.fn()
    }
  }
}));

// Inject a controllable web-push implementation through the service's test
// seam (raw CJS require inside the service bypasses vi.mock's registry).
const mockSendNotification = vi.fn();
const mockWebPush = { sendNotification: mockSendNotification } as any;

import { prisma } from '../../../src/utils/prisma';
import {
  subscribePush,
  unsubscribePush,
  sendPushToUser,
  scheduleZakatReminders,
  __setWebPushForTesting
} from '../../../src/services/PushNotificationService';

describe('PushNotificationService (#313)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __setWebPushForTesting(mockWebPush);
  });

  describe('subscribePush', () => {
    it('upserts a subscription keyed by endpoint', async () => {
      const sub = {
        endpoint: 'https://push.example.com/abc123',
        keys: { p256dh: 'key-p256dh', auth: 'key-auth' }
      };

      await subscribePush('user1', sub, 'UA/1.0');

      expect(prisma.pushSubscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { endpoint: sub.endpoint },
          create: expect.objectContaining({
            userId: 'user1',
            endpoint: sub.endpoint,
            p256dh: 'key-p256dh',
            auth: 'key-auth',
            userAgent: 'UA/1.0'
          }),
          update: expect.objectContaining({ userId: 'user1' })
        })
      );
    });

    it('stores null userAgent when not provided', async () => {
      await subscribePush('user1', {
        endpoint: 'https://push.example.com/x',
        keys: { p256dh: 'k', auth: 'a' }
      });

      expect(prisma.pushSubscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ userAgent: null })
        })
      );
    });
  });

  describe('unsubscribePush', () => {
    it('deletes only the caller endpoint', async () => {
      await unsubscribePush('user1', 'https://push.example.com/abc123');

      expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user1', endpoint: 'https://push.example.com/abc123' }
      });
    });
  });

  describe('sendPushToUser', () => {
    it('sends to all stored subscriptions and prunes expired ones', async () => {
      (prisma.pushSubscription.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 's1', endpoint: 'https://push.example.com/live', p256dh: 'k1', auth: 'a1' },
        { id: 's2', endpoint: 'https://push.example.com/dead', p256dh: 'k2', auth: 'a2' }
      ]);
      mockSendNotification.mockImplementation((sub) => {
        if (sub.endpoint.includes('live')) return Promise.resolve();
        const err: any = new Error('gone');
        err.statusCode = 410;
        return Promise.reject(err);
      });

      await sendPushToUser('user1', { title: 'T', body: 'B' });

      expect(mockSendNotification).toHaveBeenCalledTimes(2);
      // Expired subscription pruned; live one kept
      expect(prisma.pushSubscription.delete).toHaveBeenCalledWith({ where: { id: 's2' } });
      expect(prisma.pushSubscription.delete).not.toHaveBeenCalledWith({ where: { id: 's1' } });
    });

    it('succeeds silently when the user has no subscriptions', async () => {
      (prisma.pushSubscription.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      await expect(sendPushToUser('user1', { title: 'T', body: 'B' })).resolves.toBeUndefined();
      expect(mockSendNotification).not.toHaveBeenCalled();
    });
  });

  describe('scheduleZakatReminders', () => {
    const daysFromNow = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

    it('sends reminders on day 30/7/1 and stores dedupe rows', async () => {
      (prisma.yearlySnapshot.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { userId: 'u1', hawlCompletionDate: daysFromNow(7) },
        { userId: 'u2', hawlCompletionDate: daysFromNow(15) } // not a marker day
      ]);
      (prisma.reminderEvent.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.pushSubscription.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 's1', endpoint: 'https://push.example.com/e', p256dh: 'k', auth: 'a' }
      ]);
      mockSendNotification.mockResolvedValue(undefined);

      await scheduleZakatReminders();

      // Only u1 (day 7 marker) sent
      expect(mockSendNotification).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(mockSendNotification.mock.calls[0][1]);
      expect(payload.title).toBe('Zakat Reminder');
      expect(payload.data.daysUntilDue).toBe(7);
      expect(prisma.reminderEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'u1', eventType: 'push_zakat_due_7' })
        })
      );
    });

    it('skips users who already received the reminder for that day marker', async () => {
      (prisma.yearlySnapshot.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { userId: 'u1', hawlCompletionDate: daysFromNow(1) }
      ]);
      (prisma.reminderEvent.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'already'
      });

      await scheduleZakatReminders();

      expect(mockSendNotification).not.toHaveBeenCalled();
      expect(prisma.reminderEvent.create).not.toHaveBeenCalled();
    });

    it('ignores snapshots outside the 30-day window or finalized', async () => {
      (prisma.yearlySnapshot.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      await scheduleZakatReminders();
      expect(mockSendNotification).not.toHaveBeenCalled();
    });
  });
});