import { z } from 'zod';

// Payment validation schemas
export const createPaymentSchema = z.object({
  snapshotId: z.string().cuid(),
  calculationId: z.string().cuid().optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid decimal number'),
  paymentDate: z.string().datetime(),
  recipientName: z.string().min(1).max(200),
  recipientType: z.enum(['individual', 'organization', 'charity', 'mosque', 'family', 'other']),
  recipientCategory: z.enum(['poor', 'orphans', 'widows', 'education', 'healthcare', 'infrastructure', 'general']),
  notes: z.string().max(1000).optional(),
  receiptReference: z.string().max(200).optional(),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'check', 'crypto', 'other']),
  currency: z.string().length(3).default('USD'),
  exchangeRate: z.number().min(0).default(1.0),
});

export const updatePaymentSchema = createPaymentSchema.partial().extend({
  id: z.string().cuid(),
  status: z.enum(['recorded', 'verified']).optional(),
});

export const paymentQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['paymentDate', 'amount', 'recipientName', 'createdAt']).default('paymentDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['recorded', 'verified']).optional(),
  recipientCategory: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  maxAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
});

// Reminder validation schemas
export const createReminderSchema = z.object({
  eventType: z.enum(['zakat_due', 'payment_reminder', 'annual_review', 'custom']),
  triggerDate: z.string().datetime(),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  relatedSnapshotId: z.string().cuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateReminderSchema = createReminderSchema.partial().extend({
  id: z.string().cuid(),
  status: z.enum(['pending', 'shown', 'acknowledged', 'dismissed']).optional(),
  acknowledgedAt: z.string().datetime().optional(),
});

export const reminderQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['triggerDate', 'priority', 'createdAt']).default('triggerDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  status: z.enum(['pending', 'shown', 'acknowledged', 'dismissed']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  eventType: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Analytics validation schemas
export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupBy: z.enum(['month', 'quarter', 'year']).default('month'),
  includeTrends: z.boolean().default(true),
  includeComparisons: z.boolean().default(true),
});

export const exportQuerySchema = z.object({
  format: z.enum(['csv', 'pdf']).default('csv'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  includeNotes: z.boolean().default(true),
  includeReceipts: z.boolean().default(false),
});

// Type exports
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type PaymentQueryInput = z.infer<typeof paymentQuerySchema>;

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
export type ReminderQueryInput = z.infer<typeof reminderQuerySchema>;

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type ExportQueryInput = z.infer<typeof exportQuerySchema>;