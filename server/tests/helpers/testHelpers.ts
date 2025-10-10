/**
 * Test helpers for integration tests
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Generate a test user for testing
 */
export async function generateTestUser(username: string) {
  const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
  
  const user = await prisma.user.create({
    data: {
      email: `${username}@test.com`,
      passwordHash: hashedPassword,
      profile: JSON.stringify({ name: `Test User ${username}` }),
      isActive: true,
    }
  });

  return user;
}

/**
 * Cleanup test data for a user
 */
export async function cleanupTestData(userId: string) {
  // Delete in order due to foreign key constraints
  await prisma.calculationHistory.deleteMany({ where: { userId } });
  await prisma.asset.deleteMany({ where: { userId } });
  await prisma.paymentRecord.deleteMany({ where: { userId } });
  await prisma.yearlySnapshot.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
}

/**
 * Create test assets for a user
 */
export async function createTestAssets(userId: string, authToken: string) {
  const testAssets = [
    {
      name: 'Savings Account',
      type: 'cash',
      value: 50000,
      currency: 'USD',
      description: 'Primary savings'
    },
    {
      name: 'Gold Jewelry',
      type: 'gold',
      value: 25000,
      currency: 'USD',
      weight: 200, // grams
      description: 'Gold jewelry collection'
    },
    {
      name: 'Business Inventory',
      type: 'business',
      value: 30000,
      currency: 'USD',
      description: 'Trading inventory'
    },
    {
      name: 'Investment Account',
      type: 'investment',
      value: 40000,
      currency: 'USD',
      description: 'Stock portfolio'
    }
  ];

  return testAssets;
}