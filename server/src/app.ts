import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Import route modules
import authRoutes from './routes/auth';
import assetRoutes from './routes/assets';
import zakatRoutes from './routes/zakat';
import userRoutes from './routes/user';
import dataRoutes from './routes/data';
import systemRoutes from './routes/system';
import exportRoutes from './routes/export';
import importRoutes from './routes/import';
import trackingRoutes from './routes/tracking';
import calculationsRoutes from './routes/calculations';
import methodologiesRoutes from './routes/methodologies';
import calendarRoutes from './routes/calendar';

// Import middleware
import { errorHandler } from './middleware/ErrorHandler';

// Import job scheduler
import { initializeJobs, stopAllJobs } from './jobs/scheduler';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/zakat', zakatRoutes);
app.use('/api/user', userRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/import', importRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/calculations', calculationsRoutes);
app.use('/api/methodologies', methodologiesRoutes);
app.use('/api/calendar', calendarRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 ZakApp Server running on port ${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    // eslint-disable-next-line no-console
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    
    // Initialize background jobs
    // eslint-disable-next-line no-console
    console.log('⏰ Initializing background jobs...');
    initializeJobs();
  });

  // Graceful shutdown handler
  const gracefulShutdown = (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    
    // Stop accepting new requests
    server.close(() => {
      // eslint-disable-next-line no-console
      console.log('✅ HTTP server closed');
      
      // Stop all background jobs
      stopAllJobs();
      
      // eslint-disable-next-line no-console
      console.log('✅ Graceful shutdown complete');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.error('⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  // Register shutdown handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

export default app;