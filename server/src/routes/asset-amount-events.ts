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

import * as express from 'express';
import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticate } from '../middleware/AuthMiddleware';
import { AssetAmountEventService } from '../services/AssetAmountEventService';

const router = express.Router();

/**
 * GET /assets/:assetId/history
 * Get asset amount history
 */
router.get('/:assetId/history', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { assetId } = req.params;
    const { startDate, endDate, eventType, limit } = req.query;

    const eventService = new AssetAmountEventService();
    const history = await eventService.getAssetHistory(assetId, userId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      eventType: eventType as string,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GET_HISTORY_FAILED',
        message: error.message
      }
    });
  }
});

/**
 * GET /assets/:assetId/amount-at
 * Get amount at specific date
 */
router.get('/:assetId/amount-at', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { assetId } = req.params;
    const { date } = req.query;

    if (!date) {
      throw new Error('Date parameter is required');
    }

    const eventService = new AssetAmountEventService();
    const amount = await eventService.getAssetAmountAtDate(
      assetId,
      userId,
      new Date(date as string)
    );

    res.json({
      success: true,
      data: { amount, date }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GET_AMOUNT_FAILED',
        message: error.message
      }
    });
  }
});

/**
 * POST /assets/:assetId/backport
 * Backport historical data
 */
router.post('/:assetId/backport', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { assetId } = req.params;
    const { entries } = req.body;

    if (!entries || !Array.isArray(entries)) {
      throw new Error('Entries array is required');
    }

    if (entries.length === 0) {
      throw new Error('At least one entry is required');
    }

    // Validate entries
    for (const entry of entries) {
      if (entry.amount === undefined || entry.amount === null || typeof entry.amount !== 'number' || !Number.isFinite(entry.amount)) {
        throw new Error('Each entry must have a valid amount');
      }
      if (!entry.effectiveDate) {
        throw new Error('Each entry must have an effectiveDate');
      }
    }

    // Parse effectiveDates to Date objects
    const parsedEntries = entries.map((entry: any) => ({
      amount: entry.amount,
      effectiveDate: new Date(entry.effectiveDate),
      description: entry.description || ''
    }));

    // Validate all dates
    for (const entry of parsedEntries) {
      if (isNaN(entry.effectiveDate.getTime())) {
        throw new Error(`Invalid effectiveDate: ${entry.effectiveDate}`);
      }
    }

    const eventService = new AssetAmountEventService();
    const events = await eventService.backportHistoricalData(userId, assetId, parsedEntries);

    res.json({
      success: true,
      data: {
        events,
        count: events.length
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'BACKPORT_FAILED',
        message: error.message
      }
    });
  }
});

/**
 * POST /assets/:assetId/events
 * Create a new event manually
 */
router.post('/:assetId/events', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { assetId } = req.params;
    const { eventType, amount, effectiveDate, description, source, metadata } = req.body;

    if (!eventType || amount === undefined || amount === null || !effectiveDate) {
      throw new Error('eventType, amount, and effectiveDate are required');
    }

    const validTypes = ['CREATED', 'UPDATED', 'CORRECTION', 'BACKPORT'];
    if (!validTypes.includes(eventType)) {
      throw new Error(`Invalid eventType. Must be one of: ${validTypes.join(', ')}`);
    }

    const eventService = new AssetAmountEventService();
    const event = await eventService.createEvent(userId, {
      assetId,
      eventType,
      amount,
      effectiveDate: new Date(effectiveDate),
      description,
      source: source || 'manual',
      metadata
    });

    res.json({
      success: true,
      data: event
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CREATE_EVENT_FAILED',
        message: error.message
      }
    });
  }
});

/**
 * DELETE /assets/:assetId/events/:eventId
 * Reverse an event
 */
router.delete('/:assetId/events/:eventId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { eventId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new Error('Reason for reversal is required');
    }

    const eventService = new AssetAmountEventService();
    const event = await eventService.reverseEvent(userId, eventId, reason);

    res.json({
      success: true,
      data: event
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'REVERSE_EVENT_FAILED',
        message: error.message
      }
    });
  }
});

/**
 * GET /history
 * Get all events for user
 */
router.get('/history/all', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, assetId, limit } = req.query;

    const eventService = new AssetAmountEventService();
    const history = await eventService.getUserEventHistory(userId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      assetId: assetId as string,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GET_ALL_HISTORY_FAILED',
        message: error.message
      }
    });
  }
});

export default router;
