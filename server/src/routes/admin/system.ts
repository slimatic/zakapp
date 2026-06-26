/**
 * Copyright (c) 2024-2026 ZakApp Contributors
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
import { prisma } from '../../utils/prisma';
import { checkSchemaStatus } from '../../utils/schemaCheck';
import { authenticate, requireAdmin } from '../../middleware/AuthMiddleware';
import packageJson from '../../../package.json';

const router = express.Router();

router.get('/status', authenticate, requireAdmin, async (req, res) => {
  try {
    // Check DB connection
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    // Check schema status
    const schemaStatus = await checkSchemaStatus();

    // Environment info (safe subset)
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      TZ: process.env.TZ,
    };

    const memoryUsage = process.memoryUsage();

    res.json({
      success: true,
      data: {
        status: 'ok',
        version: packageJson.version,
        uptime: process.uptime(),
        database: {
          connected: true,
          latencyMs: dbLatency,
          schemaUpToDate: schemaStatus.upToDate,
          pendingMigrations: schemaStatus.pending.length,
        },
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
        },
        environment: env,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'System status check failed',
      details: {
        database: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      }
    });
  }
});

router.get('/status/schema', authenticate, requireAdmin, async (req, res) => {
  const status = await checkSchemaStatus();
  res.json({
    success: !status.error,
    data: status
  });
});

export default router;
