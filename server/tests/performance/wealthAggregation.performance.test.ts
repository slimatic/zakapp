/**
 * Performance Test: WealthAggregationService
 * 
 * Validates that wealth calculation meets performance requirements:
 * - < 100ms for up to 500 assets
 * - Consistent performance across multiple runs
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { WealthAggregationService } from '../../src/services/wealthAggregationService';

const prisma = new PrismaClient();
const service = new WealthAggregationService(prisma);

describe('WealthAggregationService Performance', () => {
  let testUserId: string;
  const performanceResults: number[] = [];

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `perf-test-${Date.now()}@example.com`,
        username: `perftest-${Date.now()}`,
        passwordHash: 'dummy-hash',
      },
    });
    testUserId = user.id;

    // Create 500 test assets (target load)
    const assets = [];
    const categories = ['cash', 'gold', 'silver', 'investments', 'business', 'crypto'];
    
    for (let i = 0; i < 500; i++) {
      assets.push({
        userId: testUserId,
        name: `Asset ${i}`,
        category: categories[i % categories.length],
        value: Math.random() * 10000 + 100,
        currency: 'USD',
        acquisitionDate: new Date(),
        isActive: true,
        calculationModifier: 1.0,
      });
    }

    await prisma.asset.createMany({ data: assets });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.asset.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  it('should calculate wealth for 500 assets in < 100ms', async () => {
    const startTime = Date.now();
    
    const result = await service.calculateTotalZakatableWealth(testUserId);
    
    const duration = Date.now() - startTime;
    performanceResults.push(duration);

    expect(result.totalZakatableWealth).toBeGreaterThan(0);
    expect(duration).toBeLessThan(100);
    
    console.log(`\n✓ Wealth calculation: ${duration}ms for 500 assets`);
  });

  it('should maintain consistent performance across 10 runs', async () => {
    const runs = 10;
    const durations: number[] = [];

    for (let i = 0; i < runs; i++) {
      const startTime = Date.now();
      await service.calculateTotalZakatableWealth(testUserId);
      durations.push(Date.now() - startTime);
    }

    const avgDuration = durations.reduce((a, b) => a + b, 0) / runs;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    expect(avgDuration).toBeLessThan(100);
    expect(maxDuration).toBeLessThan(150); // Allow some variance

    console.log(`\n✓ Average: ${avgDuration.toFixed(2)}ms`);
    console.log(`  Min: ${minDuration}ms, Max: ${maxDuration}ms`);
  });

  it('should handle incremental load (50, 100, 250, 500 assets)', async () => {
    const testCases = [
      { count: 50, maxTime: 50 },
      { count: 100, maxTime: 75 },
      { count: 250, maxTime: 90 },
      { count: 500, maxTime: 100 },
    ];

    console.log('\n📊 Performance scaling:');

    for (const testCase of testCases) {
      // Create temporary user with specific asset count
      const tempUser = await prisma.user.create({
        data: {
          email: `perf-${testCase.count}-${Date.now()}@example.com`,
          passwordHash: 'dummy',
        },
      });

      const assets = Array.from({ length: testCase.count }, (_, i) => ({
        userId: tempUser.id,
        name: `Asset ${i}`,
        category: 'cash',
        value: 1000,
        currency: 'USD',
        acquisitionDate: new Date(),
        isActive: true,
      }));

      await prisma.asset.createMany({ data: assets });

      const startTime = Date.now();
      await service.calculateTotalZakatableWealth(tempUser.id);
      const duration = Date.now() - startTime;

      // Cleanup
      await prisma.asset.deleteMany({ where: { userId: tempUser.id } });
      await prisma.user.delete({ where: { id: tempUser.id } });

      expect(duration).toBeLessThan(testCase.maxTime);
      console.log(`  ${testCase.count} assets: ${duration}ms (target: <${testCase.maxTime}ms)`);
    }
  });

  it('should efficiently query with userId + isActive index', async () => {
    // This test verifies the query uses the proper index
    // If the index isn't used, performance will degrade significantly
    
    const startTime = Date.now();
    const result = await service.calculateTotalZakatableWealth(testUserId);
    const duration = Date.now() - startTime;

    // With proper indexing, 500 assets should be < 50ms
    expect(duration).toBeLessThan(50);
    expect(result.categories.length).toBeGreaterThan(0);

    console.log(`\n✓ Indexed query: ${duration}ms (excellent performance)`);
  });
});
