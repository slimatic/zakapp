// Integration test setup
import { PrismaClient } from '../../server/node_modules/@prisma/client';
import path from 'path';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../server/.env.test') });

let prisma: PrismaClient;

// Ensure test database path is absolute
const TEST_DB_PATH = path.resolve(__dirname, '../../server/data/test-integration.db');

beforeAll(async () => {
  // Create a test database connection with absolute path
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${TEST_DB_PATH}`
      }
    }
  });
  
  // Initialize connection and enable foreign keys (SQLite only)
  await prisma.$connect();
  
  // Enable foreign keys for SQLite databases
  try {
    await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
  } catch (error) {
    // Ignore if not SQLite (PostgreSQL, MySQL, etc. have foreign keys enabled by default)
    console.log('Foreign key enforcement setup skipped (not needed for this database)');
  }
  
  console.log('✅ Test database connected:', TEST_DB_PATH);
});

afterAll(async () => {
  // Clean up test database connection
  await prisma.$disconnect();
  console.log('✅ Test database disconnected');
});

beforeEach(async () => {
  // Clean database before each test using Prisma model introspection
  const { Prisma } = await import('../../server/node_modules/@prisma/client');
  const models = Prisma.dmmf?.datamodel?.models || [];
  
  // Delete in reverse order to handle foreign key constraints
  const modelNames = models
    .map(model => model.name.charAt(0).toLowerCase() + model.name.slice(1))
    .reverse();
  
  for (const modelName of modelNames) {
    try {
      const prismaModel = (prisma as any)[modelName];
      if (prismaModel && typeof prismaModel.deleteMany === 'function') {
        await prismaModel.deleteMany({});
      }
    } catch (error) {
      // Skip models that don't support deleteMany operation
      console.warn(`Could not clean model ${modelName}:`, error);
    }
  }
});

export { prisma };