// Integration test setup
import { initTestDatabase, cleanTestDatabase } from '../../server/prisma/test-setup';
import path from 'path';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../server/.env.test') });

// Override DATABASE_URL to use test database BEFORE any server code is imported
process.env.DATABASE_URL = `file:${path.resolve(__dirname, '../../server/data/test-integration.db')}`;
process.env.TEST_DATABASE_URL = process.env.DATABASE_URL;

let prisma: any;

beforeAll(async () => {
  // Initialize test database with schema
  prisma = await initTestDatabase();
  console.log('✅ Test database connected:', process.env.DATABASE_URL);
});

afterAll(async () => {
  // Clean up test database connection
  if (prisma) {
    await prisma.$disconnect();
  }
  console.log('✅ Test database disconnected');
});

beforeEach(async () => {
  // Clean all test data before each test
  await cleanTestDatabase();
});

export { prisma };