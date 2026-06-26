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
2| * Test Data Helpers for Nisab Year Record Tests
3| * Provides factory functions for creating valid test data
4| */
5|
6|import { Prisma } from '@prisma/client';
7|
8|/**
9| * Generate default Nisab Year Record data for testing
10| * All required fields are included with sensible defaults
11| */
12|export function createNisabYearRecordData(
13|  userId: string,
14|  overrides: Partial<Prisma.YearlySnapshotCreateInput> = {}
15|): Prisma.YearlySnapshotUncheckedCreateInput {
16|  const now = new Date();
17|  const hijriYear = 1446;
18|  const hijriMonth = 3;
19|  const hijriDay = 15;
20|  
21|  return {
22|    userId,
23|    status: 'DRAFT',
24|    nisabBasis: 'GOLD',
25|    
26|    // Hawl dates (optional but commonly used)
27|    hawlStartDate: new Date('2025-01-01'),
28|    hawlStartDateHijri: `${hijriYear}-${hijriMonth.toString().padStart(2, '0')}-${hijriDay.toString().padStart(2, '0')}`,
29|    hawlCompletionDate: new Date('2025-12-26'), // ~354 days later
30|    hawlCompletionDateHijri: `${hijriYear + 1}-${hijriMonth.toString().padStart(2, '0')}-${hijriDay.toString().padStart(2, '0')}`,
31|    nisabThresholdAtStart: '5000.00', // Encrypted value
32|    
33|    // Calculation dates
34|    calculationDate: now,
35|    gregorianYear: now.getFullYear(),
36|    gregorianMonth: now.getMonth() + 1,
37|    gregorianDay: now.getDate(),
38|    hijriYear,
39|    hijriMonth,
40|    hijriDay,
41|    
42|    // Financial data (encrypted strings)
43|    totalWealth: '10000.00',
44|    totalLiabilities: '1000.00',
45|    zakatableWealth: '9000.00',
46|    zakatAmount: '225.00', // 2.5% of zakatable wealth
47|    
48|    // Required legacy fields (deprecated but still in schema)
49|    nisabThreshold: '5000.00', // Deprecated - use nisabThresholdAtStart
50|    nisabType: 'GOLD', // Deprecated - use nisabBasis
51|    
52|    // Methodology
53|    methodologyUsed: 'standard',
54|    
55|    // Breakdown and details (encrypted JSON strings)
56|    assetBreakdown: JSON.stringify([
57|      { category: 'cash', amount: 5000, assetIds: [] },
58|      { category: 'gold', amount: 5000, assetIds: [] },
59|    ]),
60|    calculationDetails: JSON.stringify({
61|      nisabThreshold: 5000,
62|      nisabBasis: 'GOLD',
63|      zakatRate: 0.025,
64|      deductions: { liabilities: 1000, exemptAssets: 0 },
65|      methodology: 'standard',
66|    }),
67|    
68|    // Optional fields
69|    userNotes: null,
70|    isPrimary: false,
71|    finalizedAt: null,
72|    
73|    // Apply any overrides
74|    ...overrides,
75|  };
76|}
77|
78|/**
79| * Create multiple Nisab Year Records with sequential dates
80| */
81|export function createMultipleRecords(
82|  userId: string,
83|  count: number,
84|  baseOverrides: Partial<Prisma.YearlySnapshotCreateInput> = {}
85|): Prisma.YearlySnapshotUncheckedCreateInput[] {
86|  return Array.from({ length: count }, (_, index) => {
87|    const monthsAgo = count - index - 1;
88|    const calculationDate = new Date();
89|    calculationDate.setMonth(calculationDate.getMonth() - monthsAgo);
90|    
91|    return createNisabYearRecordData(userId, {
92|      ...baseOverrides,
93|      calculationDate,
94|      gregorianYear: calculationDate.getFullYear(),
95|      gregorianMonth: calculationDate.getMonth() + 1,
96|      gregorianDay: calculationDate.getDate(),
97|    });
98|  });
99|}
100|
101|/**
102| * Create a finalized record
103| */
104|export function createFinalizedRecord(
105|  userId: string,
106|  overrides: Partial<Prisma.YearlySnapshotCreateInput> = {}
107|): Prisma.YearlySnapshotUncheckedCreateInput {
108|  return createNisabYearRecordData(userId, {
109|    status: 'FINALIZED',
110|    finalizedAt: new Date(),
111|    ...overrides,
112|  });
113|}
114|
115|/**
116| * Create an unlocked record
117| */
118|export function createUnlockedRecord(
119|  userId: string,
120|  overrides: Partial<Prisma.YearlySnapshotCreateInput> = {}
121|): Prisma.YearlySnapshotUncheckedCreateInput {
122|  return createNisabYearRecordData(userId, {
123|    status: 'UNLOCKED',
124|    finalizedAt: new Date(Date.now() - 86400000), // Finalized yesterday
125|    ...overrides,
126|  });
127|}
128|