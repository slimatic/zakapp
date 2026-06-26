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

1|import { describe, it, expect, vi, beforeEach } from 'vitest';
2|import { WealthAggregationService } from '../../../src/services/wealthAggregationService';
3|import { PrismaClient } from '@prisma/client';
4|import { EncryptionService } from '../../../src/services/EncryptionService';
5|
6|vi.mock('@prisma/client', () => ({
7|  PrismaClient: vi.fn().mockImplementation(() => ({
8|    asset: {
9|      findMany: vi.fn(),
10|    },
11|    liability: {
12|      findMany: vi.fn(),
13|    },
14|  })),
15|}));
16|vi.mock('../../../src/services/EncryptionService');
17|
18|describe('WealthAggregationService', () => {
19|  let service: WealthAggregationService;
20|  let mockPrisma: any;
21|
22|  beforeEach(() => {
23|    mockPrisma = {
24|      asset: {
25|        findMany: vi.fn().mockResolvedValue([]),
26|      },
27|      liability: {
28|        findMany: vi.fn().mockResolvedValue([]),
29|      },
30|    };
31|
32|    service = new WealthAggregationService(mockPrisma as any);
33|
34|    vi.mocked(EncryptionService.decryptObject).mockResolvedValue({ zakatEligible: true });
35|
36|    vi.clearAllMocks();
37|  });
38|
39|  describe('calculateTotalZakatableWealth', () => {
40|    it('should sum all active asset values', async () => {
41|      const userId = 'user1';
42|      const mockAssets = [
43|        { id: 'a1', category: 'cash', value: 5000, calculationModifier: 1.0 },
44|        { id: 'a2', category: 'gold', value: 3000, calculationModifier: 1.0 },
45|      ];
46|
47|      mockPrisma.asset.findMany.mockResolvedValue(mockAssets);
48|
49|      const result = await service.calculateTotalZakatableWealth(userId);
50|
51|      expect(result.totalZakatableWealth).toBe(8000);
52|      expect(result.breakdown.cash).toBe(5000);
53|      expect(result.breakdown.gold).toBe(3000);
54|    });
55|
56|    it('should apply calculation modifiers', async () => {
57|      const userId = 'user1';
58|      const mockAssets = [
59|        { id: 'a1', category: 'investments', value: 10000, calculationModifier: 0.3 }, // Only 30% zakatable
60|      ];
61|
62|      mockPrisma.asset.findMany.mockResolvedValue(mockAssets);
63|
64|      const result = await service.calculateTotalZakatableWealth(userId);
65|
66|      expect(result.totalZakatableWealth).toBe(3000);
67|    });
68|  });
69|
70|  describe('calculateTotalLiabilities', () => {
71|    it('should sum all active liability amounts', async () => {
72|      const userId = 'user1';
73|      const mockLiabilities = [
74|        { id: 'l1', amount: 1500 },
75|        { id: 'l2', amount: 500 },
76|      ];
77|
78|      mockPrisma.liability.findMany.mockResolvedValue(mockLiabilities);
79|
80|      const total = await service.calculateTotalLiabilities(userId);
81|
82|      expect(total).toBe(2000);
83|    });
84|  });
85|
86|  describe('calculateNetZakatableWealth', () => {
87|    it('should subtract liabilities from total zakatable wealth', async () => {
88|      const userId = 'user1';
89|
90|      // Mock assets (10,000 zakatable)
91|      mockPrisma.asset.findMany.mockResolvedValue([
92|        { id: 'a1', category: 'cash', value: 10000, calculationModifier: 1.0 }
93|      ]);
94|
95|      // Mock liabilities (2,000)
96|      mockPrisma.liability.findMany.mockResolvedValue([
97|        { id: 'l1', amount: 2000 }
98|      ]);
99|
100|      const netWealth = await service.calculateNetZakatableWealth(userId);
101|
102|      expect(netWealth).toBe(8000);
103|    });
104|  });
105|
106|  describe('calculatePeriodWealth', () => {
107|    it('should calculate wealth for specific date range', async () => {
108|      const userId = 'user1';
109|      const startDate = new Date('2024-01-01');
110|      const endDate = new Date('2024-12-31');
111|
112|      const mockAssets = [
113|        { id: 'a1', category: 'cash', value: 5000, calculationModifier: 1.0, createdAt: new Date('2024-06-01') },
114|      ];
115|
116|      mockPrisma.asset.findMany.mockResolvedValue(mockAssets);
117|
118|      const result = await service.calculatePeriodWealth(userId, startDate, endDate);
119|
120|      expect(mockPrisma.asset.findMany).toHaveBeenCalledWith(expect.objectContaining({
121|        where: expect.objectContaining({
122|          createdAt: { gte: startDate, lte: endDate }
123|        })
124|      }));
125|      expect(result.totalZakatableWealth).toBe(5000);
126|    });
127|  });
128|
129|  describe('getWealthByCategory', () => {
130|    it('should return sum of assets in category', async () => {
131|      const userId = 'user1';
132|      mockPrisma.asset.findMany.mockResolvedValue([
133|        { value: 1000 },
134|        { value: 2000 }
135|      ]);
136|
137|      const result = await service.getWealthByCategory(userId, 'cash');
138|
139|      expect(result).toBe(3000);
140|      expect(mockPrisma.asset.findMany).toHaveBeenCalledWith(expect.objectContaining({
141|        where: expect.objectContaining({ category: 'cash' })
142|      }));
143|    });
144|  });
145|});
146|