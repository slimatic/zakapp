import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

// Initialize test database
export async function initTestDatabase() {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || 'file:./data/test.db'
      }
    }
  });

  // Push schema to test database (for quick setup without migrations)
  // In production, you'd use: npx prisma migrate deploy
  try {
    await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
    console.log('Test database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize test database:', error);
    throw error;
  }

  return prisma;
}

// Clean all test data
export async function cleanTestDatabase() {
  if (!prisma) return;

  try {
    // Get all table names (excluding system tables)
    const tablenames = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%' 
      AND name NOT LIKE '_prisma_migrations';
    `;
    
    // Disable foreign key constraints for cleanup
    await prisma.$executeRaw`PRAGMA foreign_keys = OFF`;
    
    // Clear all tables
    for (const { name } of tablenames) {
      await prisma.$executeRawUnsafe(`DELETE FROM ${name};`);
    }
    
    // Re-enable foreign key constraints
    await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
    
    console.log('Test database cleaned successfully');
  } catch (error) {
    console.error('Failed to clean test database:', error);
    throw error;
  }
}

// Close test database connection
export async function closeTestDatabase() {
  if (prisma) {
    await prisma.$disconnect();
    console.log('Test database connection closed');
  }
}

// Seed test database with minimal data
export async function seedTestDatabase() {
  if (!prisma) {
    throw new Error('Test database not initialized');
  }

  try {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: '$2b$04$test.hash.for.testing.purposes.only',
        profile: '{"name":"Test User","methodology":"standard"}',
        isActive: true,
      }
    });

    // Create test assets
    await prisma.asset.create({
      data: {
        userId: testUser.id,
        category: 'cash',
        name: 'Test Cash Asset',
        value: 1000,
        currency: 'USD',
        acquisitionDate: new Date(),
        isActive: true,
      }
    });

    console.log('Test database seeded successfully');
    return { testUser };
  } catch (error) {
    console.error('Failed to seed test database:', error);
    throw error;
  }
}

export { prisma };