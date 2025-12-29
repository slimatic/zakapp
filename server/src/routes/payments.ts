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

import express from 'express';
import { PaymentService } from '../services/payment-service';
import { CreatePaymentData } from '../models/payment';
import { authMiddleware } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { validateSchema } from '../middleware/ValidationMiddleware';
import { createPaymentSchema, updatePaymentSchema, paymentQuerySchema } from '@zakapp/shared';

const router = express.Router();

// POST /api/payments
router.post('/', authMiddleware, validateSchema(createPaymentSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = (req as any).userId;
    const data: CreatePaymentData = { ...(req.body as CreatePaymentData), userId };
    const payment = await PaymentService.createPayment(data as CreatePaymentData);
    res.status(201).json({ success: true, data: { payment } });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/payments
router.get('/', authMiddleware, validateSchema(paymentQuerySchema), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId as string;
    const query = req.query as Record<string, unknown>;
    const payments = await PaymentService.getPaymentsByUserId(userId, query);
    res.json({ success: true, data: { payments } });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/payments/:id
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
  const userId = req.userId as string;
    const payment = await PaymentService.getPaymentById(req.params.id, userId);
    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
    res.json({ success: true, data: { payment } });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/payments/:id
router.put('/:id', authMiddleware, validateSchema(updatePaymentSchema), async (req: AuthenticatedRequest, res) => {
  try {
  const userId = req.userId as string;
    const body = req.body as Partial<CreatePaymentData>;
    const updated = await PaymentService.updatePayment(req.params.id, userId, body);
    res.json({ success: true, data: { payment: updated } });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/payments/:id
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
  const userId = req.userId as string;
    const ok = await PaymentService.deletePayment(req.params.id, userId);
    if (!ok) return res.status(404).json({ success: false, error: 'Payment not found' });
    res.json({ success: true });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
