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
import { AnalyticsService } from '../services/AnalyticsService';
import { authMiddleware } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { validateSchema } from '../middleware/ValidationMiddleware';
import { z } from 'zod';
import { AnalyticsMetric } from '@zakapp/shared/types/tracking';

const router = express.Router();
const analyticsService = new AnalyticsService();

// Validation schemas
const analyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  metricTypes: z.array(z.string()).optional(),
  includeCache: z.boolean().default(true)
});

const summaryQuerySchema = z.object({
  year: z.number().optional(),
  includeTrends: z.boolean().default(true),
  includeProjections: z.boolean().default(false)
});

// GET /api/analytics/summary - Get analytics summary
router.get('/summary', authMiddleware, validateSchema(summaryQuerySchema), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId as string;
    const { year, includeTrends, includeProjections } = req.query as {
      year?: string;
      includeTrends?: string;
      includeProjections?: string;
    };

    // Get current year if not specified
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    // Build summary with multiple metrics
    const summary: {
      year: number;
      metrics: Record<string, AnalyticsMetric>;
    } = {
      year: currentYear,
      metrics: {}
    };

    // Always include wealth and zakat trends
    if (includeTrends === 'true') {
      const wealthTrend = await analyticsService.getMetric(userId, 'wealth_trend', { startDate, endDate });
      const zakatTrend = await analyticsService.getMetric(userId, 'zakat_trend', { startDate, endDate });

      if (wealthTrend) summary.metrics.wealthTrend = wealthTrend;
      if (zakatTrend) summary.metrics.zakatTrend = zakatTrend;
    }

    // Include payment distribution
    const paymentDistribution = await analyticsService.getMetric(userId, 'payment_distribution', { startDate, endDate });
    if (paymentDistribution) summary.metrics.paymentDistribution = paymentDistribution;

    // Include asset composition
    const assetComposition = await analyticsService.getMetric(userId, 'asset_composition', { startDate, endDate });
    if (assetComposition) summary.metrics.assetComposition = assetComposition;

    // Include yearly comparison if projections requested
    if (includeProjections === 'true') {
      const yearlyComparison = await analyticsService.getMetric(userId, 'yearly_comparison', {
        startDate: new Date(currentYear - 2, 0, 1),
        endDate: new Date(currentYear, 11, 31)
      });
      if (yearlyComparison) summary.metrics.yearlyComparison = yearlyComparison;
    }

    res.json({
      success: true,
      data: { summary }
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/analytics/metrics - Get specific analytics metrics
router.get('/metrics', authMiddleware, validateSchema(analyticsQuerySchema), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId as string;
    const { startDate, endDate, metricTypes } = req.query as {
      startDate?: string;
      endDate?: string;
      metricTypes?: string;
      includeCache?: string;
    };

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    // Default metric types if none specified
    const defaultMetrics = ['wealth_trend', 'zakat_trend', 'payment_distribution', 'asset_composition'];
    const requestedMetrics = metricTypes ? metricTypes.split(',') : defaultMetrics;

    // Fetch all requested metrics
    const metrics: Record<string, AnalyticsMetric> = {};

    for (const metricType of requestedMetrics) {
      const metric = await analyticsService.getMetric(userId, metricType, {
        startDate: start,
        endDate: end
      });
      if (metric) {
        metrics[metricType] = metric;
      }
    }

    res.json({
      success: true,
      data: { metrics }
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/analytics/trends - Get analytics trends
router.get('/trends', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId as string;
    const { period = '12months' } = req.query as { period?: string };

    // Parse period to determine date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case '12months':
      default:
        startDate = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
        break;
    }

    // Get wealth and zakat trends for the period
    const wealthTrend = await analyticsService.getMetric(userId, 'wealth_trend', {
      startDate,
      endDate: now
    });
    const zakatTrend = await analyticsService.getMetric(userId, 'zakat_trend', {
      startDate,
      endDate: now
    });

    const trends = {
      period,
      wealthTrend,
      zakatTrend
    };

    res.json({
      success: true,
      data: { trends }
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/analytics/comparison - Compare analytics across periods
router.get('/comparison', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId as string;
    const { period1, period2 } = req.query as { period1?: string; period2?: string };

    // Parse periods (expected format: "2023" or "2022-2024")
    let years: number[] = [];

    if (period1 && period2) {
      // Compare specific years
      const year1 = parseInt(period1);
      const year2 = parseInt(period2);
      if (!isNaN(year1) && !isNaN(year2)) {
        years = [year1, year2];
      }
    } else {
      // Default to last 3 years
      const currentYear = new Date().getFullYear();
      years = [currentYear - 2, currentYear - 1, currentYear];
    }

    // Get yearly comparison
    const comparison = await analyticsService.getMetric(userId, 'yearly_comparison', {
      startDate: new Date(Math.min(...years), 0, 1),
      endDate: new Date(Math.max(...years), 11, 31)
    });

    res.json({
      success: true,
      data: { comparison }
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/analytics/cache/clear - Clear analytics cache
router.post('/cache/clear', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId as string;
    await analyticsService.invalidateCache(userId);

    res.json({
      success: true,
      message: 'Analytics cache cleared successfully'
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/web-vitals
 * 
 * T036: Analytics Endpoint for Core Web Vitals
 * Receives performance metrics from the frontend (web-vitals library)
 * Metrics: CLS, FID, FCP, LCP, TTFB
 * 
 * These metrics help track real-user performance and identify regressions
 */
router.post('/web-vitals', async (req, res) => {
  try {
    const {
      name,
      value,
      rating,
      delta,
      id,
      timestamp,
      url,
      userAgent,
    } = req.body;

    // Validate required fields
    if (!name || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_METRIC',
        message: 'Metric name and value are required',
      });
    }

    // Log metric for monitoring (in production, store in database)
    console.log('[Web Vitals]', {
      name,
      value: typeof value === 'number' ? `${value.toFixed(2)}` : value,
      rating,
      url,
      timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
    });

    // TODO: Store in database for analytics dashboard
    // await prisma.webVital.create({
    //   data: {
    //     name,
    //     value,
    //     rating,
    //     delta,
    //     metricId: id,
    //     timestamp: new Date(timestamp),
    //     url,
    //     userAgent,
    //   },
    // });

    return res.status(201).json({
      success: true,
      message: 'Metric recorded successfully',
    });
  } catch (error) {
    console.error('[Analytics] Error recording web vital:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to record metric',
    });
  }
});

export default router;