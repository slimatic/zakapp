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

1|import { vi, describe, it, expect, beforeEach } from 'vitest';
2|import { HawlTrackingService } from '../../../src/services/hawlTrackingService';
3|import { PrismaClient } from '@prisma/client';
4|import moment from 'moment-hijri';
5|
6|vi.mock('@prisma/client', () => {
7|  return {
8|    PrismaClient: vi.fn().mockImplementation(() => ({
9|      yearlySnapshot: {
10|        findFirst: vi.fn(),
11|        create: vi.fn(),
12|        update: vi.fn(),
13|      },
14|      user: {
15|        findMany: vi.fn(),
16|      },
17|    })),
18|  };
19|});
20|vi.mock('../../../src/services/wealthAggregationService');
21|vi.mock('../../../src/services/nisabCalculationService');
22|vi.mock('../../../src/services/EncryptionService');
23|
24|describe('HawlTrackingService', () => {
25|  let service: HawlTrackingService;
26|  let mockPrisma: any;
27|  let mockWealthAgg: any;
28|  let mockNisabCalc: any;
29|
30|  beforeEach(() => {
31|    mockPrisma = {
32|      $transaction: vi.fn(async (callback) => {
33|        // When transaction is called with a callback, execute it with mockPrisma as tx
34|        if (typeof callback === 'function') {
35|          return await callback(mockPrisma);
36|        }
37|        return callback;
38|      }),
39|      yearlySnapshot: {
40|        findFirst: vi.fn(),
41|        create: vi.fn(),
42|        update: vi.fn(),
43|        delete: vi.fn(),
44|      },
45|      user: {
46|        findMany: vi.fn().mockResolvedValue([]),
47|      },
48|    };
49|
50|    mockWealthAgg = {
51|      calculateTotalZakatableWealth: vi.fn().mockResolvedValue({ totalZakatableWealth: 10000 }),
52|      getZakatableAssets: vi.fn().mockResolvedValue([]),
53|    };
54|
55|    mockNisabCalc = {
56|      calculateNisabThreshold: vi.fn().mockResolvedValue({ selectedNisab: 5000 }),
57|      calculateZakat: vi.fn().mockReturnValue(250),
58|    };
59|
60|    service = new HawlTrackingService(
61|      mockPrisma as any,
62|      mockWealthAgg as any,
63|      mockNisabCalc as any
64|    );
65|
66|    vi.clearAllMocks();
67|  });
68|
69|  describe('calculateHawlCompletionDate', () => {
70|    it('should add 354 days to start date for lunar year', () => {
71|      const startDate = new Date('2024-01-01T00:00:00Z');
72|      const completionDate = service.calculateHawlCompletionDate(startDate);
73|      const daysDiff = Math.floor(
74|        (completionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
75|      );
76|      expect(daysDiff).toBe(354);
77|    });
78|  });
79|
80|  describe('toHijriDate', () => {
81|    it('should convert Gregorian date to Hijri format', () => {
82|      const gregorianDate = new Date('2024-03-15T00:00:00Z');
83|      const hijriString = service.toHijriDate(gregorianDate);
84|      expect(hijriString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
85|    });
86|  });
87|
88|  describe('detectNisabAchievement', () => {
89|    it('should process users and create DRAFT records if Nisab reached', async () => {
90|      mockPrisma.user.findMany.mockResolvedValue([{ id: 'user1' }]);
91|      mockPrisma.yearlySnapshot.findFirst.mockResolvedValue(null);
92|      mockWealthAgg.calculateTotalZakatableWealth.mockResolvedValue({ totalZakatableWealth: 6000 });
93|      mockNisabCalc.calculateNisabThreshold.mockResolvedValue({ selectedNisab: 5000 });
94|
95|      const count = await service.detectNisabAchievement('GOLD');
96|
97|      expect(count).toBe(1);
98|      expect(mockPrisma.yearlySnapshot.create).toHaveBeenCalled();
99|    });
100|  });
101|
102|  describe('isHawlComplete', () => {
103|    it('should return true if 354 days have passed', () => {
104|      const longAgo = new Date(Date.now() - 360 * 24 * 60 * 60 * 1000);
105|      expect(service.isHawlComplete(longAgo)).toBe(true);
106|    });
107|
108|    it('should return false if 354 days have not passed', () => {
109|      const recently = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
110|      expect(service.isHawlComplete(recently)).toBe(false);
111|    });
112|  });
113|
114|  describe('handleWealthChange', () => {
115|    it('should start Hawl if wealth >= Nisab and no active Hawl', async () => {
116|      mockPrisma.yearlySnapshot.findFirst.mockResolvedValue(null);
117|      mockWealthAgg.calculateTotalZakatableWealth.mockResolvedValue({ totalZakatableWealth: 6000 });
118|      mockNisabCalc.calculateNisabThreshold.mockResolvedValue({ selectedNisab: 5000 });
119|
120|      await service.handleWealthChange('user1');
121|
122|      expect(mockPrisma.yearlySnapshot.create).toHaveBeenCalled();
123|    });
124|
125|    it('should interrupt Hawl if wealth < Nisab and active Hawl exists', async () => {
126|      mockPrisma.yearlySnapshot.findFirst.mockResolvedValue({
127|        id: 'record1',
128|        nisabThresholdAtStart: '5000',
129|        nisabBasis: 'GOLD'
130|      });
131|      mockWealthAgg.calculateTotalZakatableWealth.mockResolvedValue({ totalZakatableWealth: 4000 });
132|      mockNisabCalc.calculateNisabThreshold.mockResolvedValue({ selectedNisab: 5000 });
133|
134|      await service.handleWealthChange('user1');
135|
136|      expect(mockPrisma.yearlySnapshot.delete).toHaveBeenCalledWith({
137|        where: { id: 'record1' }
138|      });
139|    });
140|
141|    it('should do nothing if wealth < Nisab and no active Hawl', async () => {
142|      mockPrisma.yearlySnapshot.findFirst.mockResolvedValue(null);
143|      mockWealthAgg.calculateTotalZakatableWealth.mockResolvedValue({ totalZakatableWealth: 4000 });
144|      mockNisabCalc.calculateNisabThreshold.mockResolvedValue({ selectedNisab: 5000 });
145|
146|      await service.handleWealthChange('user1');
147|
148|      expect(mockPrisma.yearlySnapshot.create).not.toHaveBeenCalled();
149|    });
150|
151|    it('should do nothing if wealth >= Nisab and active Hawl exists', async () => {
152|       mockPrisma.yearlySnapshot.findFirst.mockResolvedValue({
153|        id: 'record1',
154|        nisabThresholdAtStart: '5000',
155|        nisabBasis: 'GOLD'
156|      });
157|      mockWealthAgg.calculateTotalZakatableWealth.mockResolvedValue({ totalZakatableWealth: 6000 });
158|      mockNisabCalc.calculateNisabThreshold.mockResolvedValue({ selectedNisab: 5000 });
159|
160|      await service.handleWealthChange('user1');
161|
162|      expect(mockPrisma.yearlySnapshot.delete).not.toHaveBeenCalled();
163|      expect(mockPrisma.yearlySnapshot.create).not.toHaveBeenCalled();
164|    });
165|  });
166|});
167|