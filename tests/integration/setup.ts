// Integration test setup
import { PrismaClient } from '../../server/node_modules/@prisma/client';
import path from 'path';

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
  
  // Initialize connection and enable foreign keys
  await prisma.$connect();
  await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
  
  console.log('✅ Test database connected:', TEST_DB_PATH);
});

afterAll(async () => {
  // Clean up test database connection
  await prisma.$disconnect();
  console.log('✅ Test database disconnected');
});

beforeEach(async () => {
  // Clean database before each test
  const tablenames = await prisma.$queryRaw<Array<{ name: string }>>`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_migrations';
  `;
  
  for (const { name } of tablenames) {
    await prisma.$executeRawUnsafe(`DELETE FROM ${name};`);
  }
});

export { prisma };