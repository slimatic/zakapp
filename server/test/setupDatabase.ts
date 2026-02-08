import { beforeEach, afterEach } from 'vitest';
import { setupTestDatabase, cleanupTestDatabase, cleanTestDatabase } from './databaseHelpers';
import { execSync } from 'child_process';

console.log('setupDatabase.ts loaded');

// Setup fresh database for each test
beforeEach(async () => {
  console.log('setupDatabase.ts beforeEach running');
  try {
    console.log('Applying schema to test database...');
    // Ensure the database schema is applied to the test database
    execSync('npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL || 'file:./test.db' },
      stdio: 'inherit' // Show output for debugging
    });
    console.log('Schema applied successfully');
  } catch (error) {
    console.error('Failed to apply schema:', error);
    throw error;
  }

  await setupTestDatabase();
});

afterEach(async () => {
  console.log('setupDatabase.ts afterEach running');
  await cleanTestDatabase();
  await cleanupTestDatabase();
});