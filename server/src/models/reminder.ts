import { ReminderEvent } from '@prisma/client';
import { ReminderEncryption } from '../utils/encryption';
import { prisma } from '../config/database';

export interface CreateReminderData {
  userId: string;
  eventType: 'zakat_due' | 'payment_reminder' | 'annual_review' | 'custom';
  triggerDate: Date;
  title: string;
  message: string;
  priority?: 'high' | 'medium' | 'low';
  relatedSnapshotId?: string;
  metadata?: Record<string, unknown>;
}

export interface ReminderData {
  id: string;
  userId: string;
  eventType: string;
  triggerDate: Date;
  title: string;
  message: string; // Encrypted
  priority: string;
  status: string;
  relatedSnapshotId?: string;
  metadata?: Record<string, unknown>;
  acknowledgedAt?: Date;
  createdAt: Date;
}

export interface DecryptedReminderData extends Omit<ReminderData, 'message'> {
  decryptedMessage: string;
  // Backwards-compatible alias used by tests
  message?: string;
}

export class Reminder {
  /**
   * Creates a new reminder event with encrypted message
   */
  static async create(data: CreateReminderData): Promise<ReminderData> {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    // Validate trigger date is not in the past
    if (data.triggerDate < new Date()) {
      throw new Error('Trigger date cannot be in the past');
    }

    // Encrypt the message
    const encryptedMessage = await ReminderEncryption.encryptMessage(data.message, encryptionKey);

    const reminderEvent = await prisma.reminderEvent.create({
      data: {
        userId: data.userId,
        eventType: data.eventType,
        triggerDate: data.triggerDate,
        title: data.title,
        message: encryptedMessage,
        priority: data.priority || 'medium',
        relatedSnapshotId: data.relatedSnapshotId,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
        status: 'pending',
      },
    });

    return {
      id: reminderEvent.id,
      userId: reminderEvent.userId,
      eventType: reminderEvent.eventType,
      triggerDate: reminderEvent.triggerDate,
      title: reminderEvent.title,
      message: reminderEvent.message,
      priority: reminderEvent.priority,
      status: reminderEvent.status,
      relatedSnapshotId: reminderEvent.relatedSnapshotId || undefined,
      metadata: reminderEvent.metadata ? JSON.parse(reminderEvent.metadata) : undefined,
      acknowledgedAt: reminderEvent.acknowledgedAt || undefined,
      createdAt: reminderEvent.createdAt,
    };
  }

  /**
   * Finds a reminder by ID and decrypts the message
   */
  static async findById(id: string): Promise<DecryptedReminderData | null> {
    const reminderEvent = await prisma.reminderEvent.findUnique({
      where: { id },
    });

    if (!reminderEvent) {
      return null;
    }

    return this.decryptReminderData(reminderEvent);
  }

  /**
   * Finds all reminders for a user with decrypted messages
   */
  static async findByUserId(userId: string, options?: {
    status?: 'pending' | 'shown' | 'acknowledged' | 'dismissed';
    limit?: number;
    offset?: number;
    orderBy?: 'triggerDate' | 'priority' | 'createdAt';
    orderDirection?: 'asc' | 'desc';
  }): Promise<DecryptedReminderData[]> {
    const { status, limit = 50, offset = 0, orderBy = 'triggerDate', orderDirection = 'asc' } = options || {};

    const where: Record<string, unknown> = { userId };
    if (status) {
      where.status = status;
    }

    const reminderEvents = await prisma.reminderEvent.findMany({
      where,
      orderBy: { [orderBy]: orderDirection },
      take: limit,
      skip: offset,
    });

    return Promise.all(reminderEvents.map(event => this.decryptReminderData(event)));
  }

  /**
   * Finds pending reminders that are due
   */
  static async findDueReminders(userId?: string): Promise<DecryptedReminderData[]> {
    const now = new Date();

    const where: Record<string, unknown> = {
      status: 'pending',
      triggerDate: { lte: now },
    };

    if (userId) {
      where['userId'] = userId;
    }

    const reminderEvents = await prisma.reminderEvent.findMany({
      where,
      orderBy: {
        priority: 'desc', // High priority first
        triggerDate: 'asc',
      },
    });

    return Promise.all(reminderEvents.map(event => this.decryptReminderData(event)));
  }

  /**
   * Updates a reminder event
   */
  static async update(id: string, data: Partial<CreateReminderData & { status?: 'pending' | 'shown' | 'acknowledged' | 'dismissed' }>): Promise<DecryptedReminderData | null> {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    const updateData: Record<string, unknown> = {};

    // Encrypt message if provided
    if (data.message) {
      updateData.message = await ReminderEncryption.encryptMessage(data.message, encryptionKey);
    }

    // Add other fields
    if (data.eventType) updateData.eventType = data.eventType;
    if (data.triggerDate) {
      if (data.triggerDate < new Date()) {
        throw new Error('Trigger date cannot be in the past');
      }
      updateData.triggerDate = data.triggerDate;
    }
    if (data.title) updateData.title = data.title;
    if (data.priority) updateData.priority = data.priority;
    if (data.relatedSnapshotId !== undefined) updateData.relatedSnapshotId = data.relatedSnapshotId;
    if (data.metadata !== undefined) updateData.metadata = data.metadata ? JSON.stringify(data.metadata) : null;
    if (data.status) {
      updateData.status = data.status;
      if (data.status === 'acknowledged') {
        updateData.acknowledgedAt = new Date();
      }
    }

    const reminderEvent = await prisma.reminderEvent.update({
      where: { id },
      data: updateData,
    });

    return this.decryptReminderData(reminderEvent);
  }

  /**
   * Acknowledges a reminder
   */
  static async acknowledge(id: string): Promise<DecryptedReminderData | null> {
    return this.update(id, { status: 'acknowledged' });
  }

  /**
   * Dismisses a reminder
   */
  static async dismiss(id: string): Promise<DecryptedReminderData | null> {
    return this.update(id, { status: 'dismissed' });
  }

  /**
   * Deletes a reminder event
   */
  static async delete(id: string): Promise<boolean> {
    try {
      await prisma.reminderEvent.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Decrypts the message in a reminder event
   */
  private static async decryptReminderData(reminderEvent: ReminderEvent): Promise<DecryptedReminderData> {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    const decryptedMessage = await ReminderEncryption.decryptMessage(reminderEvent.message, encryptionKey);

    return {
      id: reminderEvent.id,
      userId: reminderEvent.userId,
      eventType: reminderEvent.eventType,
      triggerDate: reminderEvent.triggerDate,
      title: reminderEvent.title,
      priority: reminderEvent.priority,
      status: reminderEvent.status,
      relatedSnapshotId: reminderEvent.relatedSnapshotId || undefined,
      metadata: reminderEvent.metadata ? JSON.parse(reminderEvent.metadata) : undefined,
      acknowledgedAt: reminderEvent.acknowledgedAt || undefined,
      createdAt: reminderEvent.createdAt,
      decryptedMessage,
      message: decryptedMessage,
    };
  }
}