// Early test setup: ensure all Prisma clients use the TEST_DATABASE_URL when provided
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
} else if (!process.env.DATABASE_URL) {
  // Default to an absolute path inside the server/test directory for stability
  process.env.DATABASE_URL = `file:${__dirname}/test.db`;
  process.env.TEST_DATABASE_URL = process.env.DATABASE_URL;
}

// Ensure ENCRYPTION_KEY has a default during tests to avoid runtime errors
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key-32-bytes!';

export {};
