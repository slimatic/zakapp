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

    it('should handle very long titles and messages', async () => {
      const longTitle = 'A'.repeat(200); // Very long title
      const longMessage = 'B'.repeat(2000); // Very long message

      const longReminderData = {
        userId: 'user-123',
        eventType: 'zakat_due' as const,
        triggerDate: new Date(Date.now() + 86400000),
        title: longTitle,
        message: longMessage,
        priority: 'high' as const,
      };

      const result = await ReminderService.scheduleReminder(longReminderData);
      expect(result).toBeDefined();
      expect(result.title).not.toBe(longTitle); // Should be encrypted
      expect(result.message).not.toBe(longMessage); // Should be encrypted
    });

    it('should handle special characters and unicode in messages', async () => {
      const unicodeMessage = 'Zakat reminder: $1,250.00 💰📅 Islamic calendar: رمضان 1445';

      const unicodeReminderData = {
        userId: 'user-123',
        eventType: 'payment_reminder' as const,
        triggerDate: new Date(Date.now() + 86400000),
        title: 'Unicode Test Reminder',
        message: unicodeMessage,
        priority: 'medium' as const,
      };

      const result = await ReminderService.scheduleReminder(unicodeReminderData);
      expect(result).toBeDefined();
      expect(result.message).not.toBe(unicodeMessage); // Should be encrypted
    });

    it('should handle very distant future dates', async () => {
      const farFutureDate = new Date();
      farFutureDate.setFullYear(farFutureDate.getFullYear() + 10); // 10 years in future

      const farFutureReminderData = {
        userId: 'user-123',
        eventType: 'annual_review' as const,
        triggerDate: farFutureDate,
        title: 'Long-term Reminder',
        message: 'This is a reminder far in the future',
        priority: 'low' as const,
      };

      const result = await ReminderService.scheduleReminder(farFutureReminderData);
      expect(result).toBeDefined();
      expect(result.triggerDate).toEqual(farFutureDate);
    });

    it('should handle complex metadata objects', async () => {
      const complexMetadata = {
        calculationId: 'calc-123',
        snapshotId: 'snap-456',
        amount: 1250.50,
        currency: 'USD',
        recipientCategories: ['poor', 'orphan', 'widow'],
        paymentMethods: ['bank_transfer', 'cash'],
        notes: 'Complex metadata test',
        nestedObject: {
          level1: {
            level2: 'deep nesting test'
          }
        },
        arrayOfObjects: [
          { id: 1, value: 'test1' },
          { id: 2, value: 'test2' }
        ]
      };

      const complexReminderData = {
        userId: 'user-123',
        eventType: 'custom' as const,
        triggerDate: new Date(Date.now() + 86400000),
        title: 'Complex Metadata Test',
        message: 'Testing complex metadata handling',
        metadata: complexMetadata,
      };

      const result = await ReminderService.scheduleReminder(complexReminderData);
      expect(result).toBeDefined();
      expect(result.metadata).toEqual(complexMetadata);
    });

    it('should handle empty optional fields gracefully', async () => {
      const emptyFieldsReminderData = {
        userId: 'user-123',
        eventType: 'payment_reminder' as const,
        triggerDate: new Date(Date.now() + 86400000),
        title: '',
        message: '',
        priority: 'low' as const,
        relatedSnapshotId: '',
        metadata: {},
      };

      const result = await ReminderService.scheduleReminder(emptyFieldsReminderData);
      expect(result).toBeDefined();
      expect(result.title).not.toBe(''); // Should be encrypted even if empty
      expect(result.message).not.toBe(''); // Should be encrypted even if empty
      expect(result.relatedSnapshotId).toBe('');
      expect(result.metadata).toEqual({});
    });

    it('should handle same-day scheduling (minimum future time)', async () => {
      const soonDate = new Date(Date.now() + 60000); // 1 minute in future

      const soonReminderData = {
        userId: 'user-123',
        eventType: 'zakat_due' as const,
        triggerDate: soonDate,
        title: 'Very Soon Reminder',
        message: 'This reminder triggers very soon',
        priority: 'high' as const,
      };

      const result = await ReminderService.scheduleReminder(soonReminderData);
      expect(result).toBeDefined();
      expect(result.triggerDate.getTime()).toBeGreaterThan(Date.now());
    });

    it('should handle reminders at exact midnight', async () => {
      const midnightDate = new Date();
      midnightDate.setHours(23, 59, 59, 999); // End of current day
      midnightDate.setDate(midnightDate.getDate() + 1); // Next day
      midnightDate.setHours(0, 0, 0, 0); // Midnight

      const midnightReminderData = {
        userId: 'user-123',
        eventType: 'annual_review' as const,
        triggerDate: midnightDate,
        title: 'Midnight Reminder',
        message: 'Reminder at exact midnight',
      };

      const result = await ReminderService.scheduleReminder(midnightReminderData);
      expect(result).toBeDefined();
      expect(result.triggerDate.getHours()).toBe(0);
      expect(result.triggerDate.getMinutes()).toBe(0);
      expect(result.triggerDate.getSeconds()).toBe(0);
    });
  });
});