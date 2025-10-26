// Integration test setup
import { initTestDatabase, cleanTestDatabase } from '../../server/prisma/test-setup';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../server/.env.test') });

// Override DATABASE_URL to use test database BEFORE any server code is imported
process.env.DATABASE_URL = `file:${path.resolve(__dirname, '../../server/data/test-integration.db')}`;
process.env.TEST_DATABASE_URL = process.env.DATABASE_URL;

// Create unique database name based on test file or timestamp
const testFileName = process.env.JEST_WORKER_ID || `test-${Date.now()}`;
const TEST_DB_PATH = path.resolve(__dirname, `../../server/data/test-integration-${testFileName}.db`);
const TEST_DB_URL = `file:${TEST_DB_PATH}`;
const SCHEMA_PATH = path.resolve(__dirname, '../../server/prisma/schema.prisma');

beforeAll(async () => {
  // Delete existing test database file if it exists
  if (fs.existsSync(TEST_DB_PATH)) {
    console.log(`🗑️ Deleting existing test database: ${TEST_DB_PATH}`);
    try {
      fs.unlinkSync(TEST_DB_PATH);
    } catch (error) {
      console.log(`⚠️ Could not delete test database (might be already deleted):`, error instanceof Error ? error.message : String(error));
    }
  } else {
    console.log(`ℹ️ Test database does not exist: ${TEST_DB_PATH}`);
  }
  
  // Create a test database connection with absolute path
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: TEST_DB_URL
      }
    }
  });
  
  // Apply database schema
  console.log(`🚀 Applying database schema to: ${TEST_DB_PATH}`);
  const { execSync } = require('child_process');
  try {
    // Override DATABASE_URL for schema push - use absolute path to ensure correct location
    execSync(`cd /home/lunareclipse/zakapp/server && DATABASE_URL="${TEST_DB_URL}" npx prisma db push --accept-data-loss`, { stdio: 'inherit' });
    console.log(`✅ Test database schema applied`);
  } catch (error) {
    console.error('❌ Failed to apply test database schema:', error);
    throw error;
  }

  // Connect to database
  await prisma.$connect();
  console.log(`✅ Test database connected: ${TEST_DB_PATH}`);
}, 60000); // 60 seconds timeout

afterAll(async () => {
  // Clean up test database connection
  if (prisma) {
    await prisma.$disconnect();
  }
  console.log('✅ Test database disconnected');
});

beforeEach(async () => {
  // Database cleanup is now handled in beforeAll after schema setup
  // This ensures tables exist before attempting to clean them
});

export { prisma };