// Test setup file
import dotenv from 'dotenv';
import { UserStore } from '../src/utils/userStore';
import { clearUsedTokens } from '../src/utils/jwt';
import { clearInvalidatedTokens } from '../src/middleware/auth';
import { clearResetTokens } from '../src/utils/resetTokens';
import { initTestDatabase, cleanTestDatabase } from '../prisma/test-setup';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set default test environment
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-32-characters!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters!!';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters!!';

// Initialize test database before all tests
beforeAll(async () => {
  await initTestDatabase();
});

// Clean database before each test suite
beforeEach(async () => {
  await cleanTestDatabase();
  UserStore.clear();
  clearUsedTokens();
  clearInvalidatedTokens();
  clearResetTokens();
});