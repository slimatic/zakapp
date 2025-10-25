import express from 'express';
import { ReminderService } from '../services/ReminderService';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { validateSchema } from '../middleware/ValidationMiddleware';
import { z } from 'zod';

const router = express.Router();
const reminderService = new ReminderService();

// Validation schemas
const createReminderSchema = z.object({
  eventType: z.enum(['zakat_anniversary_approaching', 'calculation_overdue', 'payment_incomplete', 'yearly_comparison_available', 'data_backup_reminder', 'methodology_review']),
  triggerDate: z.string().datetime(),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  relatedSnapshotId: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const updateReminderSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  message: z.string().min(1).max(1000).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  status: z.enum(['pending', 'acknowledged', 'dismissed']).optional()
});

const reminderQuerySchema = z.object({
  status: z.enum(['pending', 'shown', 'acknowledged', 'dismissed']).optional(),
  eventType: z.enum(['zakat_anniversary_approaching', 'calculation_overdue', 'payment_incomplete', 'yearly_comparison_available', 'data_backup_reminder', 'methodology_review']).optional(),
  limit: z.string().transform(val => parseInt(val)).optional(),
  offset: z.string().transform(val => parseInt(val)).optional()
});

// POST /api/reminders - Create a new reminder
router.post('/', authenticateToken, validateSchema(createReminderSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId as string;
    const reminderData = req.body;

    const reminder = await reminderService.createReminder(userId, reminderData);

    res.status(201).json({
      success: true,
      data: { reminder }
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/reminders - Get user reminders
router.get('/', authenticateToken, validateSchema(reminderQuerySchema), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId as string;
    const { status, eventType, limit = 50, offset = 0 } = req.query as {
      status?: 'pending' | 'shown' | 'acknowledged' | 'dismissed';
      eventType?: 'zakat_anniversary_approaching' | 'calculation_overdue' | 'payment_incomplete' | 'yearly_comparison_available' | 'data_backup_reminder' | 'methodology_review';
      limit?: number;
      offset?: number;
    };

    const reminders = await reminderService.listReminders(userId, {
      status,
      eventType,
      limit,
      page: offset ? Math.floor(offset / limit) + 1 : 1
    });

    res.json({
      success: true,
      data: { reminders: reminders.data, total: reminders.total }
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/reminders/:id - Get a specific reminder
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId as string;
    const reminderId = req.params.id;

    const reminder = await reminderService.getReminder(reminderId, userId);

    if (!reminder) {
      return res.status(404).json({
        success: false,
        error: 'Reminder not found'
      });
    }

    res.json({
      success: true,
      data: { reminder }
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/reminders/:id - Update a reminder
router.put('/:id', authenticateToken, validateSchema(updateReminderSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId as string;
    const reminderId = req.params.id;
    const updateData = req.body;

    // Use updateStatus for status updates
    if (updateData.status) {
      const reminder = await reminderService.updateStatus(reminderId, userId, updateData.status);
      res.json({
        success: true,
        data: { reminder }
      });
    } else {
      // For other updates, we might need to implement a more general update method
      // For now, return not implemented
      res.status(501).json({
        success: false,
        error: 'General reminder updates not yet implemented'
      });
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/reminders/:id - Delete a reminder
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId as string;
    const reminderId = req.params.id;

    await reminderService.deleteReminder(reminderId, userId);

    res.json({
      success: true,
      message: 'Reminder deleted successfully'
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/reminders/:id/acknowledge - Acknowledge a reminder
router.post('/:id/acknowledge', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId as string;
    const reminderId = req.params.id;

    const reminder = await reminderService.acknowledgeReminder(reminderId, userId);

    if (!reminder) {
      return res.status(404).json({
        success: false,
        error: 'Reminder not found'
      });
    }

    res.json({
      success: true,
      data: { reminder }
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/reminders/upcoming - Get upcoming reminders
router.get('/upcoming/all', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId as string;

    // Use getActiveReminders for now since getUpcomingReminders doesn't exist
    const reminders = await reminderService.getActiveReminders(userId);

    res.json({
      success: true,
      data: { reminders }
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;