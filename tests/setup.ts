// Global test setup for all Jest tests
import 'jest-extended';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods in test environment
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});