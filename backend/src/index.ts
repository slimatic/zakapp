import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { dataRouter } from './routes/data.js';
import { assetsRouter } from './routes/assets.js';
import { assetBulkRouter } from './routes/assetBulk.js';
import zakatRouter from './routes/zakat.js';
import {
  generalRateLimit,
  securityHeaders,
  sanitizeInput,
  requestSizeLimit,
} from './middleware/security.js';
import { initializeSessions } from './utils/session.js';
import { API_ENDPOINTS } from '@zakapp/shared';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Log port configuration
console.log(`🔧 Server configuration:`);
console.log(`   Port: ${PORT} ${process.env.PORT ? '(from environment)' : '(default)'}`);
console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`   CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
console.log('');

// Initialize session management
initializeSessions().catch(console.error);

// Security middleware (applied early)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

app.use(securityHeaders);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// Request size and rate limiting
app.use(requestSizeLimit('10mb'));
app.use(generalRateLimit);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Input sanitization
app.use(sanitizeInput);

// Routes
app.use('/api/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/data', dataRouter);
app.use('/api/v1/assets', assetsRouter);
app.use('/api/v1/assets/bulk', assetBulkRouter);
app.use('/api/v1/zakat', zakatRouter);

// Basic API endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'zakapp API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: API_ENDPOINTS,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction
  ) => {
    console.error('Error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message:
        process.env.NODE_ENV === 'development'
          ? err.message
          : 'Something went wrong',
    });
  }
);

// Start server with error handling
server.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📝 API documentation: http://localhost:${PORT}/api`);
  console.log(`✅ Shared package integration working!`);
});

// Handle server startup errors
server.on('error', (error: Error & { code?: string }) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.error('');
    console.error('To fix this issue, you can:');
    console.error(`• Set a different port: PORT=3002 npm run dev`);
    console.error(`• Or set PORT environment variable: export PORT=3002`);
    console.error(`• Or kill the process using port ${PORT}:`);
    console.error(`  - Find the process: lsof -ti:${PORT}`);
    console.error(`  - Kill the process: kill -9 $(lsof -ti:${PORT})`);
    console.error('');
    console.error('If using Docker:');
    console.error('• Make sure to update the port mapping in docker-compose.yml');
    console.error(`• Change "3001:3001" to "${PORT}:${PORT}" in the backend service`);
    process.exit(1);
  } else {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Gracefully shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;
