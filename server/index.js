const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const zakatRoutes = require('./routes/zakat');
const assetRoutes = require('./routes/assets');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', (req, res, next) => {
  console.log('Auth request:', req.method, req.url, 'Body:', JSON.stringify(req.body));
  
  // Capture the original res.json to log responses
  const originalJson = res.json.bind(res);
  res.json = function(obj) {
    console.log('Auth response:', res.statusCode, JSON.stringify(obj));
    return originalJson(obj);
  };
  
  next();
}, authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/zakat', zakatRoutes);
app.use('/api/assets', assetRoutes);

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'ZakApp API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      assets: '/api/assets',
      zakat: '/api/zakat',
      user: '/api/user',
      health: '/health'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 zakapp server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Data directory: ${process.env.DATA_DIR || './data'}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.error('');
    console.error('To fix this issue, you can:');
    console.error('• Set a different port: PORT=5001 npm run dev');
    console.error('• Or set PORT environment variable: export PORT=5001');
    console.error('• Or kill the process using the port:');
    console.error(`  - Find the process: lsof -ti:${PORT}`);
    console.error(`  - Kill the process: kill -9 $(lsof -ti:${PORT})`);
    console.error('');
    process.exit(1);
  } else {
    console.error('Server error:', error);
    process.exit(1);
  }
});

module.exports = app;