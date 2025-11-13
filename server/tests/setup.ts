/**
 * Jest setup file
 * Runs before all tests to configure the testing environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';
process.env.DATABASE_URL = 'file:./test.db';
process.env.METALS_API_KEY = 'test-metals-api-key';

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set longer timeout for integration tests
jest.setTimeout(30000);
