import express from 'express';
import { prisma } from '../../utils/prisma';
import { authenticate, requireAdmin } from '../../middleware/AuthMiddleware';
import packageJson from '../../../package.json';

const router = express.Router();

router.get('/status', authenticate, requireAdmin, async (req, res) => {
  try {
    // Check DB connection
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

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
          latencyMs: dbLatency
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

export default router;
