/**
 * Jest setup file
 * Runs before all tests to configure the testing environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing';
process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';
process.env.DATABASE_URL = 'file:/home/agentx/github-repos/zakapp/server/prisma/test/test.db';
process.env.METALS_API_KEY = 'test-metals-api-key';



// Set longer timeout for integration tests
jest.setTimeout(30000);
