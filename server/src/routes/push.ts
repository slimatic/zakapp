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
 * Push notification subscription routes (#313)
 *
 * POST /api/push/subscribe    — store a Web Push subscription for the caller
 * POST /api/push/unsubscribe  — remove a subscription by endpoint
 * GET  /api/push/vapid-key    — public VAPID key for client subscription setup
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { validateSchema } from '../middleware/ValidationMiddleware';
import { Logger } from '../utils/logger';
import {
  subscribePush,
  unsubscribePush,
  getVapidPublicKey
} from '../services/PushNotificationService';

const logger = new Logger('PushRoutes');

const router = Router();

const subscribeSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512)
  }),
  userAgent: z.string().max(512).optional()
});

const unsubscribeSchema = z.object({
  endpoint: z.string().max(2048)
});

// Public VAPID key so browsers can subscribe before auth-dependent flows
router.get('/vapid-key', (_req, res: Response) => {
  res.json({ publicKey: getVapidPublicKey() });
});

router.post('/subscribe', authMiddleware, validateSchema(subscribeSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userAgent = Array.isArray(req.headers['user-agent'])
      ? req.headers['user-agent'][0]
      : req.headers['user-agent'];
    await subscribePush(user.id, req.body, userAgent);
    return res.status(201).json({ ok: true });
  } catch (err) {
    logger.error('Push subscribe failed:', err);
    return res.status(500).json({ error: 'Failed to store subscription' });
  }
});

router.post('/unsubscribe', authMiddleware, validateSchema(unsubscribeSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    await unsubscribePush(user.id, req.body.endpoint);
    return res.json({ ok: true });
  } catch (err) {
    logger.error('Push unsubscribe failed:', err);
    return res.status(500).json({ error: 'Failed to remove subscription' });
  }
});

export default router;