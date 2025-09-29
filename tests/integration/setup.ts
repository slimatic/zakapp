// Integration test setup
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

beforeAll(async () => {
  // Create a test database connection
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./test-integration.db'
      }
    }
  });
  
  // Run migrations for test database
  // Note: In a real implementation, you'd run: npx prisma migrate deploy
});

afterAll(async () => {
  // Clean up test database
  await prisma.$disconnect();
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