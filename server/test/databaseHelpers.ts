import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

let prisma: PrismaClient;

/**
 * Setup isolated test database for each test
 * Each test gets a fresh database with schema applied
 */
export async function setupTestDatabase() {
  const dbPath = process.env.TEST_DATABASE_URL?.replace('file:', '') || './test.db';

  // Ensure test directory exists
  const testDir = path.dirname(dbPath);
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // Remove any existing test database file to ensure clean state
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  try {
    // Create fresh database with schema
    execSync('npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL || 'file:./test.db' },
      stdio: 'pipe' // Suppress output
    });

    // Create new Prisma client for this test
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || 'file:./test.db'
        }
      }
    });

    // Connect to the database
    await prisma.$connect();

    // Enable foreign keys for SQLite databases
    await prisma.$executeRaw`PRAGMA foreign_keys = ON`;

    console.log('Isolated test database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize isolated test database:', error);
    throw error;
  }

  return prisma;
}

/**
 * Clean up test database after each test
 */
export async function cleanupTestDatabase() {
  if (prisma) {
    try {
      await prisma.$disconnect();
      console.log('Test database connection closed');
    } catch (error) {
      console.error('Error closing test database:', error);
    }
  }

  // Clean up the test database file
  const dbPath = process.env.TEST_DATABASE_URL?.replace('file:', '');
  if (dbPath && fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
      console.log('Test database file cleaned up');
    } catch (error) {
      console.warn('Could not clean up test database file:', error);
    }
  }
}

/**
 * Clean all test data between tests
 */
export async function cleanTestDatabase() {
  if (!prisma) return;

  try {
    // Clean specific tables used in tests, in reverse dependency order
    const tablesToClean = [
      'zakatPayment',
      'zakatCalculation',
      'liability',
      'asset',
      'user'
    ];

    for (const tableName of tablesToClean) {
      try {
        const prismaModel = (prisma as any)[tableName];
        if (prismaModel && typeof prismaModel.deleteMany === 'function') {
          await prismaModel.deleteMany({});
        }
      } catch (error) {
        console.warn(`Could not clean table ${tableName}:`, error);
      }
    }

    console.log('Test database cleaned successfully');
  } catch (error) {
    console.error('Failed to clean test database:', error);
    throw error;
  }
}

export { prisma };