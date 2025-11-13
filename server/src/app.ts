import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

// Load environment variables
import 'dotenv/config';

// Import route modules
import authRoutes from './routes/auth';
import assetRoutes from './routes/assets';
import calculationsRoutes from './routes/calculations';
import zakatRoutes from './routes/zakat';
import trackingRoutes from './routes/tracking';
import analyticsRoutes from './routes/analytics';
import snapshotsRoutes from './routes/snapshots';
import paymentsRoutes from './routes/payments';
import userRoutes from './routes/user';
import nisabYearRecordsRoutes from './routes/nisab-year-records';

// Import middleware
// import { DatabaseManager } from './config/database';
// import { errorHandler } from './middleware/ErrorHandler';

// Import job scheduler
// import { initializeJobs, stopAllJobs } from './jobs/scheduler';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Logging middleware - TEMPORARILY DISABLED due to hanging issue
// TODO: Debug morgan middleware hanging on Node v23.1.0
// app.use(morgan('dev'));

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
app.use('/api/assets', assetRoutes);
app.use('/api/calculations', calculationsRoutes);
app.use('/api/zakat', zakatRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/snapshots', snapshotsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/user', userRoutes);
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
  //     // stopAllJobs();
      
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