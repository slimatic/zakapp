/**
 * Copyright (c) 2024-2026 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

1|/**
2| * Performance Test: WealthAggregationService
3| * 
4| * Validates that wealth calculation meets performance requirements:
5| * - < 100ms for up to 500 assets
6| * - Consistent performance across multiple runs
7| */
8|
9|import { describe, it, expect, beforeAll, afterAll } from 'vitest';
10|import { PrismaClient } from '@prisma/client';
11|import { WealthAggregationService } from '../../src/services/wealthAggregationService';
12|
13|const prisma = new PrismaClient();
14|const service = new WealthAggregationService(prisma);
15|
16|describe('WealthAggregationService Performance', () => {
17|  let testUserId: string;
18|  const performanceResults: number[] = [];
19|
20|  beforeAll(async () => {
21|    // Create test user
22|    const user = await prisma.user.create({
23|      data: {
24|        email: `perf-test-${Date.now()}@example.com`,
25|        username: `perftest-${Date.now()}`,
26|        passwordHash: 'dummy-hash',
27|      },
28|    });
29|    testUserId = user.id;
30|
31|    // Create 500 test assets (target load)
32|    const assets = [];
33|    const categories = ['cash', 'gold', 'silver', 'investments', 'business', 'crypto'];
34|    
35|    for (let i = 0; i < 500; i++) {
36|      assets.push({
37|        userId: testUserId,
38|        name: `Asset ${i}`,
39|        category: categories[i % categories.length],
40|        value: Math.random() * 10000 + 100,
41|        currency: 'USD',
42|        acquisitionDate: new Date(),
43|        isActive: true,
44|        calculationModifier: 1.0,
45|      });
46|    }
47|
48|    await prisma.asset.createMany({ data: assets });
49|  });
50|
51|  afterAll(async () => {
52|    // Cleanup
53|    await prisma.asset.deleteMany({ where: { userId: testUserId } });
54|    await prisma.user.delete({ where: { id: testUserId } });
55|    await prisma.$disconnect();
56|  });
57|
58|  it('should calculate wealth for 500 assets in < 100ms', async () => {
59|    const startTime = Date.now();
60|    
61|    const result = await service.calculateTotalZakatableWealth(testUserId);
62|    
63|    const duration = Date.now() - startTime;
64|    performanceResults.push(duration);
65|
66|    expect(result.totalZakatableWealth).toBeGreaterThan(0);
67|    expect(duration).toBeLessThan(100);
68|    
69|    console.log(`\n✓ Wealth calculation: ${duration}ms for 500 assets`);
70|  });
71|
72|  it('should maintain consistent performance across 10 runs', async () => {
73|    const runs = 10;
74|    const durations: number[] = [];
75|
76|    for (let i = 0; i < runs; i++) {
77|      const startTime = Date.now();
78|      await service.calculateTotalZakatableWealth(testUserId);
79|      durations.push(Date.now() - startTime);
80|    }
81|
82|    const avgDuration = durations.reduce((a, b) => a + b, 0) / runs;
83|    const maxDuration = Math.max(...durations);
84|    const minDuration = Math.min(...durations);
85|
86|    expect(avgDuration).toBeLessThan(100);
87|    expect(maxDuration).toBeLessThan(150); // Allow some variance
88|
89|    console.log(`\n✓ Average: ${avgDuration.toFixed(2)}ms`);
90|    console.log(`  Min: ${minDuration}ms, Max: ${maxDuration}ms`);
91|  });
92|
93|  it('should handle incremental load (50, 100, 250, 500 assets)', async () => {
94|    const testCases = [
95|      { count: 50, maxTime: 50 },
96|      { count: 100, maxTime: 75 },
97|      { count: 250, maxTime: 90 },
98|      { count: 500, maxTime: 100 },
99|    ];
100|
101|    console.log('\n📊 Performance scaling:');
102|
103|    for (const testCase of testCases) {
104|      // Create temporary user with specific asset count
105|      const tempUser = await prisma.user.create({
106|        data: {
107|          email: `perf-${testCase.count}-${Date.now()}@example.com`,
108|          passwordHash: 'dummy',
109|        },
110|      });
111|
112|      const assets = Array.from({ length: testCase.count }, (_, i) => ({
113|        userId: tempUser.id,
114|        name: `Asset ${i}`,
115|        category: 'cash',
116|        value: 1000,
117|        currency: 'USD',
118|        acquisitionDate: new Date(),
119|        isActive: true,
120|      }));
121|
122|      await prisma.asset.createMany({ data: assets });
123|
124|      const startTime = Date.now();
125|      await service.calculateTotalZakatableWealth(tempUser.id);
126|      const duration = Date.now() - startTime;
127|
128|      // Cleanup
129|      await prisma.asset.deleteMany({ where: { userId: tempUser.id } });
130|      await prisma.user.delete({ where: { id: tempUser.id } });
131|
132|      expect(duration).toBeLessThan(testCase.maxTime);
133|      console.log(`  ${testCase.count} assets: ${duration}ms (target: <${testCase.maxTime}ms)`);
134|    }
135|  });
136|
137|  it('should efficiently query with userId + isActive index', async () => {
138|    // This test verifies the query uses the proper index
139|    // If the index isn't used, performance will degrade significantly
140|    
141|    const startTime = Date.now();
142|    const result = await service.calculateTotalZakatableWealth(testUserId);
143|    const duration = Date.now() - startTime;
144|
145|    // With proper indexing, 500 assets should be < 50ms
146|    expect(duration).toBeLessThan(50);
147|    expect(result.categories.length).toBeGreaterThan(0);
148|
149|    console.log(`\n✓ Indexed query: ${duration}ms (excellent performance)`);
150|  });
151|});
152|