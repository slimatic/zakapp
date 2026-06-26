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

1|import { PrismaClient } from '@prisma/client';
2|import { runHawlDetectionJob } from '../../src/jobs/hawlDetectionJob';
3|import { NisabCalculationService } from '../../src/services/nisabCalculationService';
4|import { HawlTrackingService } from '../../src/services/hawlTrackingService';
5|import { WealthAggregationService } from '../../src/services/wealthAggregationService';
6|import { NisabYearRecordService } from '../../src/services/nisabYearRecordService';
7|import { AuditTrailService } from '../../src/services/auditTrailService';
8|import request from 'supertest';
9|import app from '../../src/app';
10|
11|const prisma = new PrismaClient();
12|
13|describe('Integration: Hawl Detection & Reconciliation Job', () => {
14|    let authToken: string;
15|    let userId: string;
16|    
17|    // Services
18|    const nisabCalcService = new NisabCalculationService();
19|    const hawlTrackingService = new HawlTrackingService();
20|    const wealthAggService = new WealthAggregationService();
21|    const nisabYearRecordService = new NisabYearRecordService();
22|    const auditTrailService = new AuditTrailService();
23|
24|    beforeAll(async () => {
25|        // Register user
26|        const registerResponse = await request(app)
27|            .post('/api/auth/register')
28|            .send({
29|                email: `jobtest-${Date.now()}@example.com`,
30|                password: 'TestPass123!',
31|                confirmPassword: 'TestPass123!',
32|                firstName: 'Job',
33|                lastName: 'Test',
34|            });
35|        
36|        authToken = registerResponse.body.data.tokens.accessToken;
37|        userId = registerResponse.body.data.user.id;
38|    });
39|
40|    afterAll(async () => {
41|        await prisma.yearlySnapshot.deleteMany({ where: { userId } });
42|        await prisma.asset.deleteMany({ where: { userId } });
43|        await prisma.user.delete({ where: { id: userId } });
44|        await prisma.$disconnect();
45|    });
46|
47|    beforeEach(async () => {
48|        await prisma.yearlySnapshot.deleteMany({ where: { userId } });
49|        await prisma.asset.deleteMany({ where: { userId } });
50|    });
51|
52|    it('should reconcile wealth drift in DRAFT records', async () => {
53|        // 1. Create a wealth record via API (ensures user has wealth)
54|        await request(app)
55|            .post('/api/assets')
56|            .set('Authorization', `Bearer ${authToken}`)
57|            .send({
58|                name: 'Cash',
59|                category: 'cash',
60|                value: 10000,
61|                currency: 'USD',
62|                acquisitionDate: new Date(),
63|            });
64|
65|        // 2. Create a DRAFT record with INCORRECT wealth manually
66|        await prisma.yearlySnapshot.create({
67|            data: {
68|                userId: userId,
69|                status: 'DRAFT',
70|                nisabBasis: 'GOLD',
71|                nisabThreshold: '5000',
72|                nisabType: 'gold',
73|                calculationDate: new Date(),
74|                gregorianYear: new Date().getFullYear(),
75|                gregorianMonth: new Date().getMonth() + 1,
76|                gregorianDay: new Date().getDate(),
77|                hijriYear: 0,
78|                hijriMonth: 0,
79|                hijriDay: 0,
80|                totalWealth: '0',
81|                totalLiabilities: '0',
82|                zakatableWealth: '5000', // Drift! Actual is 10000
83|                zakatAmount: '0',
84|                methodologyUsed: 'standard',
85|                assetBreakdown: '{}',
86|                calculationDetails: '{}',
87|            } as any
88|        });
89|
90|        // 3. Run the job
91|        const result = await runHawlDetectionJob(
92|            prisma,
93|            nisabCalcService,
94|            hawlTrackingService,
95|            wealthAggService,
96|            nisabYearRecordService,
97|            auditTrailService
98|        );
99|
100|        // 4. Assert reconciliation
101|        expect(result.reconciledRecords).toBeGreaterThan(0);
102|        
103|        const updatedRecord = await prisma.yearlySnapshot.findFirst({
104|            where: { userId, status: 'DRAFT' }
105|        });
106|        
107|        expect(updatedRecord).toBeDefined();
108|        // Allow floating point precision issues by checking closeness
109|        expect(Number(updatedRecord!.zakatableWealth)).toBeCloseTo(10000);
110|    });
111|
112|    it('should detect missed Nisab achievement (Safety Net)', async () => {
113|        // 1. Create wealth above Nisab
114|        await request(app)
115|            .post('/api/assets')
116|            .set('Authorization', `Bearer ${authToken}`)
117|            .send({
118|                name: 'Gold',
119|                category: 'gold',
120|                value: 7000, // Above typical gold nisab
121|                currency: 'USD',
122|                acquisitionDate: new Date(),
123|            });
124|
125|        // 2. Ensure NO record exists (simulating missed real-time trigger)
126|        // (API creates one, so we delete it)
127|        await prisma.yearlySnapshot.deleteMany({ where: { userId } });
128|
129|        // 3. Run Job
130|        const result = await runHawlDetectionJob(
131|            prisma,
132|            nisabCalcService,
133|            hawlTrackingService,
134|            wealthAggService,
135|            nisabYearRecordService,
136|            auditTrailService
137|        );
138|
139|        // 4. Assert creation
140|        expect(result.nisabAchievements).toBeGreaterThan(0);
141|        
142|        const newRecord = await prisma.yearlySnapshot.findFirst({
143|            where: { userId, status: 'DRAFT' }
144|        });
145|        expect(newRecord).toBeDefined();
146|        expect(Number(newRecord!.zakatableWealth)).toBeCloseTo(7000);
147|    });
148|});
149|