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
    // Enable foreign keys for SQLite databases
    try {
      await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
    } catch (error) {
      // Ignore if not SQLite (PostgreSQL, MySQL, etc. have foreign keys enabled by default)
      console.log('Foreign key enforcement setup skipped (not needed for this database)');
    }
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
    // Use Prisma's DMMF for database-agnostic table introspection
    const { Prisma } = await import('@prisma/client');
    const models = Prisma.dmmf?.datamodel?.models || [];
    
    // Delete in reverse order to handle foreign key constraints
    const modelNames = models
      .map(model => model.name.charAt(0).toLowerCase() + model.name.slice(1))
      .reverse();
    
    // Clear all tables using Prisma's deleteMany
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