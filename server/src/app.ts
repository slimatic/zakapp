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
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

// Load environment variables
import 'dotenv/config';

// Import route modules
import authRoutes from './routes/auth';
import syncRoutes from './routes/sync';
import assetRoutes from './routes/assets';
import calculationsRoutes from './routes/calculations';
import zakatRoutes from './routes/zakat';
import trackingRoutes from './routes/tracking';
import analyticsRoutes from './routes/analytics';
import snapshotsRoutes from './routes/snapshots';
import paymentsRoutes from './routes/payments';
import userRoutes from './routes/user';
import calendarRoutes from './routes/calendar';
import nisabYearRecordsRoutes from './routes/nisab-year-records';
import feedbackRoutes from './routes/feedback';
import adminEncryptionRoutes from './routes/admin/encryption';
import adminRoutes from './routes/admin';
import debugRoutes from './routes/debug';

// Import middleware
// import { DatabaseManager } from './config/database';
// import { errorHandler } from './middleware/ErrorHandler';
import { MaintenanceMiddleware } from './middleware/MaintenanceMiddleware';

// Import job scheduler
// import { initializeJobs, stopAllJobs } from './jobs/scheduler';

const app = express();

// Security middleware
app.use(helmet());

// Maintenance Mode - must be early in middleware chain
const maintenanceMw = new MaintenanceMiddleware();

// Maintenance status endpoint (must be before maintenance middleware)
app.get('/api/maintenance-status', maintenanceMw.getStatusEndpoint());

// Apply maintenance middleware globally (blocks all routes except /health and /api/maintenance-status)
app.use(maintenanceMw.getMiddleware());

// CORS Configuration - supports localhost, IP addresses, and custom domains
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // In development, allow all localhost and local network IPs
    if (process.env.NODE_ENV === 'development') {
      // Allow localhost variants
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      // Allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      const ipPattern = /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)\d+\.\d+:\d+$/;
      if (ipPattern.test(origin)) {
        return callback(null, true);
      }
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Check if origin matches wildcard pattern (e.g., *.example.com)
    const wildcardMatch = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(origin);
      }
      return false;
    });

    if (wildcardMatch) {
      return callback(null, true);
    }

    // Log rejected origin in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚠️  CORS rejected origin: ${origin}`);
      console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
    }

    // Reject unauthorized origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  maxAge: 86400 // 24 hours
}));

// Logging middleware
// Use 'combined' for production (standard Apache format) and 'dev' for development
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat));

// Compression middleware
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/calculations', calculationsRoutes);
app.use('/api/zakat', zakatRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/snapshots', snapshotsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes); // Alias for consistency (hotfix for 404s)
app.use('/api/calendar', calendarRoutes);
app.use('/api/feedback', feedbackRoutes);
// app.use('/api/admin/encryption', adminEncryptionRoutes); // Replaced by generic admin routes
app.use('/api/admin', adminRoutes);

// Mount development-only diagnostics
if (process.env.NODE_ENV === 'development') {
  app.use('/api/debug', debugRoutes);
}
app.use('/', nisabYearRecordsRoutes); // Feature 008: Nisab Year Records routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

export { app };
// Force restart attempt 3
export default app;

// Start server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  const server = app.listen(PORT, () => {
    console.log(`🚀 ZakApp Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);

    // Initialize database connection
    // const dbManager = DatabaseManager.getInstance();

    // Initialize background jobs
    console.log('⏰ Initializing background jobs...');
    // initializeJobs();
  });

  // Graceful shutdown handler
  // const gracefulShutdown = (signal: string) => {
  //   console.log(`\n${signal} received. Starting graceful shutdown...`);

  //   // Stop accepting new requests
  //   server.close(() => {
  //     console.log('✅ HTTP server closed');

  //     // Stop all background jobs
  //     // stopAll jobs();

  //     console.log('✅ Graceful shutdown complete');
  //     process.exit(0);
  //   });

  //   // Force shutdown after 30 seconds
  //   setTimeout(() => {
  //     console.error('⚠️  Forced shutdown after timeout');
  //     process.exit(1);
  //   }, 30000);
  // };

  // Register shutdown handlers
  // process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  // process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}