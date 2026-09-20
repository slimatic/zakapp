import express from 'express';
import { prisma } from '../../utils/prisma';
import { checkSchemaStatus } from '../../utils/schemaCheck';
import { emailService } from '../../services/EmailService';
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

    // Email health, surfaced because a misconfigured provider is invisible otherwise:
    // registration still returns 201 and the failure only appears in server logs.
    const emailConfig = await emailService.describeConfig();

    // Verification counts. The admin dashboard previously reported only total/active,
    // so an operator could not see how many accounts were stuck unverified.
    const [totalUsers, verifiedUsers, unverifiedUsers, pendingTokens] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.count({ where: { isVerified: false } }),
      prisma.user.count({ where: { verificationToken: { not: null } } })
    ]);

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
        email: {
          configured: emailConfig.configured,
          provider: emailConfig.provider,
          from: emailConfig.from,
          host: emailConfig.host,
          port: emailConfig.port,
          secure: emailConfig.secure,
          issue: emailConfig.issue,
        },
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          unverified: unverifiedUsers,
          pendingVerificationTokens: pendingTokens,
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
