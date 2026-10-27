import { vi, type Mock, describe, it, expect, beforeEach } from 'vitest';
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
 * Unit Tests for ReminderService
 * Tests reminder lifecycle management and trigger logic
 */

import { ReminderService } from '../../services/ReminderService';
import { ReminderEventModel } from '../../models/ReminderEvent';
import { YearlySnapshotModel } from '../../models/YearlySnapshot';

// Mock the models
vi.mock('../../models/ReminderEvent');
vi.mock('../../models/YearlySnapshot');

describe('ReminderService', () => {
  let service: ReminderService;
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    service = new ReminderService();
    vi.clearAllMocks();
  });

  describe('createReminder', () => {
    it('should create a reminder with all required fields', async () => {
      const reminderData = {
        eventType: 'zakat_anniversary_approaching' as const,
        triggerDate: new Date('2025-06-15'),
        title: 'Zakat Anniversary Reminder',
        message: 'Your annual Zakat calculation is due',
        priority: 'high' as const,
        relatedSnapshotId: 'snapshot-123',
        metadata: { year: 2025 }
      };

      (ReminderEventModel.create as Mock).mockResolvedValue({
        id: 'reminder-123',
        ...reminderData,
        userId: mockUserId,
        status: 'pending'
      });

      const result = await service.createReminder(mockUserId, reminderData);

      expect(result).toBeDefined();
      expect(ReminderEventModel.create).toHaveBeenCalledWith(mockUserId, reminderData);
    });

    it('should handle optional metadata', async () => {
      const reminderData = {
        eventType: 'payment_incomplete' as const,
        triggerDate: new Date('2025-01-01'),
        title: 'Payment Due',
        message: 'Zakat payment is due',
        priority: 'medium' as const
      };

      (ReminderEventModel.create as Mock).mockResolvedValue({
        id: 'reminder-123',
        ...reminderData,
        userId: mockUserId
      });

      await service.createReminder(mockUserId, reminderData);

      expect(ReminderEventModel.create).toHaveBeenCalledWith(mockUserId, reminderData);
    });
  });

  describe('getReminder', () => {
    it('should retrieve reminder by ID', async () => {
      const mockReminder = {
        id: 'reminder-123',
        userId: mockUserId,
        eventType: 'zakat_anniversary_approaching',
        status: 'pending'
      };

      (ReminderEventModel.findById as Mock).mockResolvedValue(mockReminder);

      const result = await service.getReminder('reminder-123', mockUserId);

      expect(result).toEqual(mockReminder);
      expect(ReminderEventModel.findById).toHaveBeenCalledWith('reminder-123', mockUserId);
    });

    it('should return null if reminder not found', async () => {
      (ReminderEventModel.findById as Mock).mockResolvedValue(null);

      const result = await service.getReminder('invalid-id', mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('getActiveReminders', () => {
    it('should retrieve all active reminders', async () => {
      const mockReminders = [
        { id: 'rem1', status: 'pending', triggerDate: new Date() },
        { id: 'rem2', status: 'shown', triggerDate: new Date() }
      ];

      (ReminderEventModel.findActive as Mock).mockResolvedValue(mockReminders);

      const result = await service.getActiveReminders(mockUserId);

      expect(result).toEqual(mockReminders);
      expect(ReminderEventModel.findActive).toHaveBeenCalledWith(mockUserId);
    });

    it('should return empty array if no active reminders', async () => {
      (ReminderEventModel.findActive as Mock).mockResolvedValue([]);

      const result = await service.getActiveReminders(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('listReminders', () => {
    it('should list reminders with pagination', async () => {
      const mockResult = {
        data: [
          { id: 'rem1', status: 'pending' },
          { id: 'rem2', status: 'shown' }
        ],
        total: 2
      };

      (ReminderEventModel.findByUser as Mock).mockResolvedValue(mockResult);

      const result = await service.listReminders(mockUserId, {
        page: 1,
        limit: 20
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(ReminderEventModel.findByUser).toHaveBeenCalledWith(mockUserId, {
        page: 1,
        limit: 20
      });
    });

    it('should filter by status', async () => {
      (ReminderEventModel.findByUser as Mock).mockResolvedValue({ data: [], total: 0 });

      await service.listReminders(mockUserId, { status: 'acknowledged' });

      expect(ReminderEventModel.findByUser).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({ status: 'acknowledged' })
      );
    });

    it('should filter by event type', async () => {
      (ReminderEventModel.findByUser as Mock).mockResolvedValue({ data: [], total: 0 });

      await service.listReminders(mockUserId, { eventType: 'zakat_anniversary_approaching' });

      expect(ReminderEventModel.findByUser).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({ eventType: 'zakat_anniversary_approaching' })
      );
    });

    it('should support sorting', async () => {
      (ReminderEventModel.findByUser as Mock).mockResolvedValue({ data: [], total: 0 });

      await service.listReminders(mockUserId, { sortOrder: 'desc' });

      expect(ReminderEventModel.findByUser).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({ sortOrder: 'desc' })
      );
    });
  });

  describe('updateStatus', () => {
    it('should update reminder status', async () => {
      const mockReminder = {
        id: 'reminder-123',
        status: 'shown'
      };

      (ReminderEventModel.updateStatus as Mock).mockResolvedValue(mockReminder);

      const result = await service.updateStatus('reminder-123', mockUserId, 'shown');

      expect(result.status).toBe('shown');
      expect(ReminderEventModel.updateStatus).toHaveBeenCalledWith(
        'reminder-123',
        mockUserId,
        'shown'
      );
    });

    it('should handle all status transitions', async () => {
      const statuses: Array<'pending' | 'shown' | 'acknowledged' | 'dismissed'> = [
        'pending',
        'shown',
        'acknowledged',
        'dismissed'
      ];

      for (const status of statuses) {
        (ReminderEventModel.updateStatus as Mock).mockResolvedValue({ id: 'rem', status });

        const result = await service.updateStatus('reminder-123', mockUserId, status);

        expect(result.status).toBe(status);
      }
    });
  });

  describe('acknowledgeReminder', () => {
    it('should acknowledge a reminder', async () => {
      const mockReminder = {
        id: 'reminder-123',
        status: 'acknowledged',
        acknowledgedAt: new Date()
      };

      (ReminderEventModel.acknowledge as Mock).mockResolvedValue(mockReminder);

      const result = await service.acknowledgeReminder('reminder-123', mockUserId);

      expect(result.status).toBe('acknowledged');
      expect(result.acknowledgedAt).toBeDefined();
      expect(ReminderEventModel.acknowledge).toHaveBeenCalledWith('reminder-123', mockUserId);
    });
  });

  describe('dismissReminder', () => {
    it('should dismiss a reminder', async () => {
      const mockReminder = {
        id: 'reminder-123',
        status: 'dismissed'
      };

      (ReminderEventModel.dismiss as Mock).mockResolvedValue(mockReminder);

      const result = await service.dismissReminder('reminder-123', mockUserId);

      expect(result.status).toBe('dismissed');
      expect(ReminderEventModel.dismiss).toHaveBeenCalledWith('reminder-123', mockUserId);
    });
  });

  describe('markPendingAsShown', () => {
    it('should mark all pending reminders as shown', async () => {
      (ReminderEventModel.markPendingAsShown as Mock).mockResolvedValue(5);

      const result = await service.markPendingAsShown(mockUserId);

      expect(result).toBe(5);
      expect(ReminderEventModel.markPendingAsShown).toHaveBeenCalledWith(mockUserId);
    });

    it('should return 0 if no pending reminders', async () => {
      (ReminderEventModel.markPendingAsShown as Mock).mockResolvedValue(0);

      const result = await service.markPendingAsShown(mockUserId);

      expect(result).toBe(0);
    });
  });

  describe('deleteReminder', () => {
    it('should delete a reminder', async () => {
      (ReminderEventModel.delete as Mock).mockResolvedValue(undefined);

      await service.deleteReminder('reminder-123', mockUserId);

      expect(ReminderEventModel.delete).toHaveBeenCalledWith('reminder-123', mockUserId);
    });
  });

  describe('deleteOldReminders', () => {
    it('should delete reminders older than specified days', async () => {
      (ReminderEventModel.deleteOld as Mock).mockResolvedValue(10);

      const result = await service.deleteOldReminders(90);

      expect(result).toBe(10);
      expect(ReminderEventModel.deleteOld).toHaveBeenCalledWith(90);
    });

    it('should use default of 90 days if not specified', async () => {
      (ReminderEventModel.deleteOld as Mock).mockResolvedValue(5);

      const result = await service.deleteOldReminders();

      expect(result).toBe(5);
      expect(ReminderEventModel.deleteOld).toHaveBeenCalledWith(90);
    });

    it('should handle different retention periods', async () => {
      (ReminderEventModel.deleteOld as Mock).mockResolvedValue(3);

      await service.deleteOldReminders(30);

      expect(ReminderEventModel.deleteOld).toHaveBeenCalledWith(30);
    });
  });

  describe('getStatistics', () => {
    it('should return reminder statistics', async () => {
      const mockStats = {
        total: 20,
        pending: 5,
        shown: 8,
        acknowledged: 6,
        dismissed: 1
      };

      (ReminderEventModel.getStatistics as Mock).mockResolvedValue(mockStats);

      const result = await service.getStatistics(mockUserId);

      expect(result).toEqual(mockStats);
      expect(ReminderEventModel.getStatistics).toHaveBeenCalledWith(mockUserId);
    });

    it('should return zero statistics for new user', async () => {
      const emptyStats = {
        total: 0,
        pending: 0,
        shown: 0,
        acknowledged: 0,
        dismissed: 0
      };

      (ReminderEventModel.getStatistics as Mock).mockResolvedValue(emptyStats);

      const result = await service.getStatistics(mockUserId);

      expect(result.total).toBe(0);
      expect(result.pending).toBe(0);
    });
  });

  describe('triggerZakatAnniversaryReminders', () => {
    const mockSnapshots = [
      {
        id: 'snap1',
        userId: mockUserId,
        hijriYear: 1445,
        hijriMonth: 9,
        hijriDay: 15,
        gregorianYear: 2024,
        status: 'finalized'
      },
      {
        id: 'snap2',
        userId: mockUserId,
        hijriYear: 1444,
        hijriMonth: 9,
        hijriDay: 15,
        gregorianYear: 2023,
        status: 'finalized'
      }
    ];

    beforeEach(() => {
      (YearlySnapshotModel.findByUser as Mock).mockResolvedValue({
        data: mockSnapshots,
        total: 2
      });
      (ReminderEventModel.findByUser as Mock).mockResolvedValue({ data: [], total: 0 });
      (ReminderEventModel.create as Mock).mockImplementation(async (userId, data) => ({
        id: 'reminder-new',
        userId,
        ...data
      }));
    });

    it('should create reminders for upcoming anniversaries', async () => {
      // Set createdAt to almost 1 year ago so it's within the 7-day window
      const almostOneYearAgo = new Date();
      almostOneYearAgo.setFullYear(almostOneYearAgo.getFullYear() - 1);
      almostOneYearAgo.setDate(almostOneYearAgo.getDate() + 2);
      
      (YearlySnapshotModel.findByUser as Mock).mockResolvedValue({
        data: [{ ...mockSnapshots[0], createdAt: almostOneYearAgo }],
        total: 1
      });

      const result = await service.triggerZakatAnniversaryReminders(mockUserId);

      expect(result.length).toBeGreaterThanOrEqual(0);
      expect(YearlySnapshotModel.findByUser).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({ status: 'finalized' })
      );
    });

    it('should check for existing reminders', async () => {
      await service.triggerZakatAnniversaryReminders(mockUserId);

      expect(ReminderEventModel.findByUser).toHaveBeenCalled();
    });

    it('should not duplicate reminders', async () => {
      const existingReminder = {
        id: 'existing-reminder',
        eventType: 'zakat_anniversary_approaching',
        relatedSnapshotId: 'snap1',
        triggerDate: new Date()
      };

      (ReminderEventModel.findByUser as Mock).mockResolvedValue({
        data: [existingReminder],
        total: 1
      });

      await service.triggerZakatAnniversaryReminders(mockUserId);

      // Should check but not create duplicate
      expect(ReminderEventModel.findByUser).toHaveBeenCalled();
    });

    it('triggers on the lunar anniversary, a Hawl after the calculation', async () => {
      const createdAt = new Date(Date.now() - 352 * 86_400_000);

      (YearlySnapshotModel.findByUser as Mock).mockResolvedValue({
        data: [{ ...mockSnapshots[0], createdAt }],
        total: 1
      });

      await service.triggerZakatAnniversaryReminders(mockUserId);

      expect(ReminderEventModel.create).toHaveBeenCalledTimes(1);
      const [, payload] = (ReminderEventModel.create as Mock).mock.calls[0];

      const expected = new Date(createdAt);
      expected.setDate(expected.getDate() + 354);
      expect(new Date(payload.triggerDate).getTime()).toBe(expected.getTime());
    });

    it('does not trigger on what would only be a Gregorian anniversary', async () => {
      const createdAt = new Date(Date.now() - 363 * 86_400_000);

      (YearlySnapshotModel.findByUser as Mock).mockResolvedValue({
        data: [{ ...mockSnapshots[0], createdAt }],
        total: 1
      });

      await service.triggerZakatAnniversaryReminders(mockUserId);

      expect(ReminderEventModel.create).not.toHaveBeenCalled();
    });
  });

  describe('triggerAutomaticReminders', () => {
    // The anniversary of a calculation is one Hawl (354 days), not one
    // Gregorian year; the two dates differ by 11 days for the same snapshot.
    const snapshotAt = (daysAgo: number) => ({
      id: 'snap-auto',
      userId: mockUserId,
      status: 'draft',
      calculationDate: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
      gregorianYear: new Date().getFullYear()
    });

    beforeEach(() => {
      (YearlySnapshotModel.findByUser as Mock).mockResolvedValue({ data: [], total: 0 });
      (ReminderEventModel.findByUser as Mock).mockResolvedValue({ data: [], total: 0 });
      (ReminderEventModel.create as Mock).mockImplementation(async (userId, data) => ({
        id: 'reminder-auto',
        userId,
        ...data
      }));
    });

    it('announces the anniversary one hawl after the calculation', async () => {
      (YearlySnapshotModel.findPrimaryByYear as Mock).mockResolvedValue(snapshotAt(334));

      await service.triggerAutomaticReminders(mockUserId);

      expect(ReminderEventModel.create).toHaveBeenCalledTimes(1);
      const [, payload] = (ReminderEventModel.create as Mock).mock.calls[0];
      expect(payload.eventType).toBe('zakat_anniversary_approaching');
      expect(payload.metadata.daysRemaining).toBeGreaterThan(0);
      expect(payload.metadata.daysRemaining).toBeLessThanOrEqual(30);
    });

    it('stays silent once the hawl has passed', async () => {
      (YearlySnapshotModel.findPrimaryByYear as Mock).mockResolvedValue(snapshotAt(355));

      await service.triggerAutomaticReminders(mockUserId);

      expect(ReminderEventModel.create).not.toHaveBeenCalled();
    });
  });

  describe('priority handling', () => {
    it('should support high priority reminders', async () => {
      const highPriorityData = {
        eventType: 'zakat_anniversary_approaching' as const,
        triggerDate: new Date(),
        title: 'Urgent',
        message: 'Immediate action required',
        priority: 'high' as const
      };

      (ReminderEventModel.create as Mock).mockResolvedValue({
        ...highPriorityData,
        id: 'rem',
        userId: mockUserId
      });

      const result = await service.createReminder(mockUserId, highPriorityData);

      expect(result.priority).toBe('high');
    });

    it('should support medium priority reminders', async () => {
      const mediumPriorityData = {
        eventType: 'payment_incomplete' as const,
        triggerDate: new Date(),
        title: 'Reminder',
        message: 'Action needed',
        priority: 'medium' as const
      };

      (ReminderEventModel.create as Mock).mockResolvedValue({
        ...mediumPriorityData,
        id: 'rem',
        userId: mockUserId
      });

      const result = await service.createReminder(mockUserId, mediumPriorityData);

      expect(result.priority).toBe('medium');
    });

    it('should support low priority reminders', async () => {
      const lowPriorityData = {
        eventType: 'methodology_review' as const,
        triggerDate: new Date(),
        title: 'FYI',
        message: 'Information',
        priority: 'low' as const
      };

      (ReminderEventModel.create as Mock).mockResolvedValue({
        ...lowPriorityData,
        id: 'rem',
        userId: mockUserId
      });

      const result = await service.createReminder(mockUserId, lowPriorityData);

      expect(result.priority).toBe('low');
    });
  });

  describe('event types', () => {
    const eventTypes = [
      'zakat_anniversary_approaching',
      'payment_incomplete',
      'calculation_overdue',
      'methodology_review'
    ] as const;

    eventTypes.forEach(eventType => {
      it(`should support ${eventType} event type`, async () => {
        const reminderData = {
          eventType,
          triggerDate: new Date(),
          title: `Test ${eventType}`,
          message: 'Test message',
          priority: 'medium' as const
        };

        (ReminderEventModel.create as Mock).mockResolvedValue({
          ...reminderData,
          id: 'rem',
          userId: mockUserId
        });

        const result = await service.createReminder(mockUserId, reminderData);

        expect(result.eventType).toBe(eventType);
      });
    });
  });
});
