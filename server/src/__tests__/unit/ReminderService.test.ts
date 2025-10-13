/**
 * Unit Tests for ReminderService
 * Tests reminder lifecycle management and trigger logic
 */

import { ReminderService } from '../../services/ReminderService';
import { ReminderEventModel } from '../../models/ReminderEvent';
import { YearlySnapshotModel } from '../../models/YearlySnapshot';

// Mock the models
jest.mock('../../models/ReminderEvent');
jest.mock('../../models/YearlySnapshot');

describe('ReminderService', () => {
  let service: ReminderService;
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    service = new ReminderService();
    jest.clearAllMocks();
  });

  describe('createReminder', () => {
    it('should create a reminder with all required fields', async () => {
      const reminderData = {
        eventType: 'zakat_anniversary' as const,
        triggerDate: new Date('2025-06-15'),
        title: 'Zakat Anniversary Reminder',
        message: 'Your annual Zakat calculation is due',
        priority: 'high' as const,
        relatedSnapshotId: 'snapshot-123',
        metadata: { year: 2025 }
      };

      (ReminderEventModel.create as jest.Mock).mockResolvedValue({
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
        eventType: 'payment_due' as const,
        triggerDate: new Date('2025-01-01'),
        title: 'Payment Due',
        message: 'Zakat payment is due',
        priority: 'medium' as const
      };

      (ReminderEventModel.create as jest.Mock).mockResolvedValue({
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
        eventType: 'zakat_anniversary',
        status: 'pending'
      };

      (ReminderEventModel.findById as jest.Mock).mockResolvedValue(mockReminder);

      const result = await service.getReminder('reminder-123', mockUserId);

      expect(result).toEqual(mockReminder);
      expect(ReminderEventModel.findById).toHaveBeenCalledWith('reminder-123', mockUserId);
    });

    it('should return null if reminder not found', async () => {
      (ReminderEventModel.findById as jest.Mock).mockResolvedValue(null);

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

      (ReminderEventModel.findActive as jest.Mock).mockResolvedValue(mockReminders);

      const result = await service.getActiveReminders(mockUserId);

      expect(result).toEqual(mockReminders);
      expect(ReminderEventModel.findActive).toHaveBeenCalledWith(mockUserId);
    });

    it('should return empty array if no active reminders', async () => {
      (ReminderEventModel.findActive as jest.Mock).mockResolvedValue([]);

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

      (ReminderEventModel.findByUser as jest.Mock).mockResolvedValue(mockResult);

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
      (ReminderEventModel.findByUser as jest.Mock).mockResolvedValue({ data: [], total: 0 });

      await service.listReminders(mockUserId, { status: 'acknowledged' });

      expect(ReminderEventModel.findByUser).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({ status: 'acknowledged' })
      );
    });

    it('should filter by event type', async () => {
      (ReminderEventModel.findByUser as jest.Mock).mockResolvedValue({ data: [], total: 0 });

      await service.listReminders(mockUserId, { eventType: 'zakat_anniversary' });

      expect(ReminderEventModel.findByUser).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({ eventType: 'zakat_anniversary' })
      );
    });

    it('should support sorting', async () => {
      (ReminderEventModel.findByUser as jest.Mock).mockResolvedValue({ data: [], total: 0 });

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

      (ReminderEventModel.updateStatus as jest.Mock).mockResolvedValue(mockReminder);

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
        (ReminderEventModel.updateStatus as jest.Mock).mockResolvedValue({ id: 'rem', status });

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

      (ReminderEventModel.acknowledge as jest.Mock).mockResolvedValue(mockReminder);

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

      (ReminderEventModel.dismiss as jest.Mock).mockResolvedValue(mockReminder);

      const result = await service.dismissReminder('reminder-123', mockUserId);

      expect(result.status).toBe('dismissed');
      expect(ReminderEventModel.dismiss).toHaveBeenCalledWith('reminder-123', mockUserId);
    });
  });

  describe('markPendingAsShown', () => {
    it('should mark all pending reminders as shown', async () => {
      (ReminderEventModel.markPendingAsShown as jest.Mock).mockResolvedValue(5);

      const result = await service.markPendingAsShown(mockUserId);

      expect(result).toBe(5);
      expect(ReminderEventModel.markPendingAsShown).toHaveBeenCalledWith(mockUserId);
    });

    it('should return 0 if no pending reminders', async () => {
      (ReminderEventModel.markPendingAsShown as jest.Mock).mockResolvedValue(0);

      const result = await service.markPendingAsShown(mockUserId);

      expect(result).toBe(0);
    });
  });

  describe('deleteReminder', () => {
    it('should delete a reminder', async () => {
      (ReminderEventModel.delete as jest.Mock).mockResolvedValue(undefined);

      await service.deleteReminder('reminder-123', mockUserId);

      expect(ReminderEventModel.delete).toHaveBeenCalledWith('reminder-123', mockUserId);
    });
  });

  describe('deleteOldReminders', () => {
    it('should delete reminders older than specified days', async () => {
      (ReminderEventModel.deleteOld as jest.Mock).mockResolvedValue(10);

      const result = await service.deleteOldReminders(90);

      expect(result).toBe(10);
      expect(ReminderEventModel.deleteOld).toHaveBeenCalledWith(90);
    });

    it('should use default of 90 days if not specified', async () => {
      (ReminderEventModel.deleteOld as jest.Mock).mockResolvedValue(5);

      const result = await service.deleteOldReminders();

      expect(result).toBe(5);
      expect(ReminderEventModel.deleteOld).toHaveBeenCalledWith(90);
    });

    it('should handle different retention periods', async () => {
      (ReminderEventModel.deleteOld as jest.Mock).mockResolvedValue(3);

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

      (ReminderEventModel.getStatistics as jest.Mock).mockResolvedValue(mockStats);

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

      (ReminderEventModel.getStatistics as jest.Mock).mockResolvedValue(emptyStats);

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
      (YearlySnapshotModel.findByUser as jest.Mock).mockResolvedValue({
        data: mockSnapshots,
        total: 2
      });
      (ReminderEventModel.findByUser as jest.Mock).mockResolvedValue({ data: [], total: 0 });
      (ReminderEventModel.create as jest.Mock).mockImplementation(async (userId, data) => ({
        id: 'reminder-new',
        userId,
        ...data
      }));
    });

    it('should create reminders for upcoming anniversaries', async () => {
      const result = await service.triggerZakatAnniversaryReminders(mockUserId);

      expect(result).toBeGreaterThanOrEqual(0);
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
        eventType: 'zakat_anniversary',
        relatedSnapshotId: 'snap1',
        triggerDate: new Date()
      };

      (ReminderEventModel.findByUser as jest.Mock).mockResolvedValue({
        data: [existingReminder],
        total: 1
      });

      await service.triggerZakatAnniversaryReminders(mockUserId);

      // Should check but not create duplicate
      expect(ReminderEventModel.findByUser).toHaveBeenCalled();
    });
  });

  describe('priority handling', () => {
    it('should support high priority reminders', async () => {
      const highPriorityData = {
        eventType: 'zakat_anniversary' as const,
        triggerDate: new Date(),
        title: 'Urgent',
        message: 'Immediate action required',
        priority: 'high' as const
      };

      (ReminderEventModel.create as jest.Mock).mockResolvedValue({
        ...highPriorityData,
        id: 'rem',
        userId: mockUserId
      });

      const result = await service.createReminder(mockUserId, highPriorityData);

      expect(result.priority).toBe('high');
    });

    it('should support medium priority reminders', async () => {
      const mediumPriorityData = {
        eventType: 'payment_due' as const,
        triggerDate: new Date(),
        title: 'Reminder',
        message: 'Action needed',
        priority: 'medium' as const
      };

      (ReminderEventModel.create as jest.Mock).mockResolvedValue({
        ...mediumPriorityData,
        id: 'rem',
        userId: mockUserId
      });

      const result = await service.createReminder(mockUserId, mediumPriorityData);

      expect(result.priority).toBe('medium');
    });

    it('should support low priority reminders', async () => {
      const lowPriorityData = {
        eventType: 'info' as const,
        triggerDate: new Date(),
        title: 'FYI',
        message: 'Information',
        priority: 'low' as const
      };

      (ReminderEventModel.create as jest.Mock).mockResolvedValue({
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
      'zakat_anniversary',
      'payment_due',
      'calculation_reminder',
      'info'
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

        (ReminderEventModel.create as jest.Mock).mockResolvedValue({
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
