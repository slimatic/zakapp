import express from 'express';
import { PaymentService } from '../services/payment-service';
import { CreatePaymentData } from '../models/payment';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { validateSchema } from '../middleware/ValidationMiddleware';
import { createPaymentSchema, updatePaymentSchema, paymentQuerySchema } from '../../../shared/validation';

const router = express.Router();

// POST /api/payments
router.post('/', authenticateToken, validateSchema(createPaymentSchema), async (req: AuthenticatedRequest, res) => {
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
router.get('/', authenticateToken, validateSchema(paymentQuerySchema), async (req: AuthenticatedRequest, res) => {
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
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
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
router.put('/:id', authenticateToken, validateSchema(updatePaymentSchema), async (req: AuthenticatedRequest, res) => {
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
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
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
