import { describe, it, expect } from '@jest/globals';
import { ReminderService } from '../../../src/services/reminder-service';

describe('ReminderService', () => {
  describe('scheduleReminder', () => {
    it('should schedule a new reminder event', async () => {
      const reminderData = {
        userId: 'user-123',
        eventType: 'zakat_due' as const,
        triggerDate: new Date('2024-12-31'),
        title: 'Zakat Due Reminder',
        message: 'Your Zakat payment is due. Please review your calculations.',
        priority: 'high' as const,
        relatedSnapshotId: 'snapshot-123',
        metadata: { calculationId: 'calc-123' },
      };

      const result = await ReminderService.scheduleReminder(reminderData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(reminderData.userId);
      expect(result.eventType).toBe(reminderData.eventType);
      expect(result.triggerDate).toEqual(reminderData.triggerDate);
      expect(result.title).toBe(reminderData.title);
      expect(result.priority).toBe(reminderData.priority);
      expect(result.relatedSnapshotId).toBe(reminderData.relatedSnapshotId);
      expect(result.metadata).toEqual(reminderData.metadata);
      expect(result.status).toBe('pending');
      expect(result.acknowledgedAt).toBeUndefined();
    });

    it('should schedule reminder with minimal required fields', async () => {
      const minimalReminderData = {
        userId: 'user-123',
        eventType: 'payment_reminder' as const,
        triggerDate: new Date('2024-06-15'),
        title: 'Payment Reminder',
        message: 'Remember to make your Zakat payment.',
      };

      const result = await ReminderService.scheduleReminder(minimalReminderData);

      expect(result).toBeDefined();
      expect(result.priority).toBe('medium'); // Default value
      expect(result.relatedSnapshotId).toBeUndefined();
      expect(result.metadata).toBeUndefined();
    });

    it('should encrypt sensitive reminder message', async () => {
      const reminderData = {
        userId: 'user-123',
        eventType: 'zakat_due' as const,
        triggerDate: new Date('2024-12-31'),
        title: 'Zakat Due',
        message: 'Your Zakat amount is $1,250. Payment due by December 31st.',
        priority: 'high' as const,
      };

      const result = await ReminderService.scheduleReminder(reminderData);

      // Verify message is encrypted (not plaintext)
      expect(result.message).not.toBe(reminderData.message);
      expect(result.message).not.toContain('1250');
      expect(result.message).not.toContain('December 31st');
    });

    it('should throw error for invalid user ID', async () => {
      const invalidReminderData = {
        userId: '',
        eventType: 'zakat_due' as const,
        triggerDate: new Date(),
        title: 'Test Reminder',
        message: 'Test message',
      };

      await expect(ReminderService.scheduleReminder(invalidReminderData))
        .rejects.toThrow('Invalid user ID');
    });

    it('should throw error for past trigger date', async () => {
      const pastReminderData = {
        userId: 'user-123',
        eventType: 'zakat_due' as const,
        triggerDate: new Date('2020-01-01'), // Past date
        title: 'Past Reminder',
        message: 'This should fail',
      };

      await expect(ReminderService.scheduleReminder(pastReminderData))
        .rejects.toThrow('Trigger date cannot be in the past');
    });

    it('should handle different event types', async () => {
      const eventTypes = ['zakat_due', 'payment_reminder', 'annual_review', 'custom'] as const;

      for (const eventType of eventTypes) {
        const reminderData = {
          userId: 'user-123',
          eventType,
          triggerDate: new Date(Date.now() + 86400000), // Tomorrow
          title: `Test ${eventType}`,
          message: `Test message for ${eventType}`,
        };

        const result = await ReminderService.scheduleReminder(reminderData);
        expect(result.eventType).toBe(eventType);
      }
    });
  });
});