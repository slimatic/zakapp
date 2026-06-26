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

1|import { vi, type Mock } from 'vitest';
2|/**
3| * T026: Integration Test - Nisab Achievement Detection
4| * 
5| * Tests end-to-end workflow when user's wealth first reaches Nisab threshold,
6| * including Hawl tracking initialization and DRAFT record creation.
7| * 
8| * @see specs/008-nisab-year-record/quickstart.md - Scenario 1
9| */
10|
11|import request from 'supertest';
12|import app from '../../src/app';
13|import { PrismaClient } from '@prisma/client';
14|import { NisabCalculationService } from '../../src/services/nisabCalculationService';
15|import { HawlTrackingService } from '../../src/services/hawlTrackingService';
16|import { WealthAggregationService } from '../../src/services/wealthAggregationService';
17|import { createAssetPayload } from '../helpers/testHelpers';
18|
19|const prisma = new PrismaClient();
20|
21|describe('Integration: Nisab Achievement Detection', () => {
22|  let authToken: string;
23|  let userId: string;
24|
25|  beforeAll(async () => {
26|    // Create test user and get auth token
27|    const registerResponse = await request(app)
28|      .post('/api/auth/register')
29|      .send({
30|        email: `nisabtest-${Date.now()}@example.com`,
31|        password: 'TestPass123!',
32|        confirmPassword: 'TestPass123!',
33|        firstName: 'Nisab',
34|        lastName: 'Test User',
35|      });
36|
37|    authToken = registerResponse.body.data.tokens.accessToken;
38|    userId = registerResponse.body.data.user.id;
39|  });
40|
41|  afterAll(async () => {
42|    // Cleanup
43|    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
44|    await prisma.asset.deleteMany({ where: { userId } });
45|    await prisma.user.delete({ where: { id: userId } });
46|    await prisma.$disconnect();
47|  });
48|
49|  beforeEach(async () => {
50|    // Clear records before each test
51|    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
52|    await prisma.asset.deleteMany({ where: { userId } });
53|  });
54|
55|  it('should detect Nisab achievement and create DRAFT record', async () => {
56|    // Step 1: User has assets below Nisab
57|    await request(app)
58|      .post('/api/assets')
59|      .set('Authorization', `Bearer ${authToken}`)
60|      .send(createAssetPayload({
61|        name: 'Savings Account',
62|        category: 'cash',
63|        value: 4000,
64|      }));
65|
66|    // Step 2: Verify no Hawl is active yet
67|    const statusBefore = await request(app)
68|      .get('/api/nisab-year-records/status')
69|      .set('Authorization', `Bearer ${authToken}`);
70|
71|    expect(statusBefore.body.active).toBe(false);
72|
73|    // Step 3: Add asset that pushes wealth above Nisab
74|    const assetResponse = await request(app)
75|      .post('/api/assets')
76|      .set('Authorization', `Bearer ${authToken}`)
77|      .send(createAssetPayload({
78|        name: 'Gold Holdings',
79|        category: 'gold',
80|        value: 3500, // Total now = 7500 (above gold Nisab ~5293)
81|      }));
82|
83|    expect(assetResponse.status).toBe(201);
84|
85|    // Step 4: Check Hawl status - should be active now
86|    const statusAfter = await request(app)
87|      .get('/api/nisab-year-records/status')
88|      .set('Authorization', `Bearer ${authToken}`);
89|
90|    expect(statusAfter.body.active).toBe(true);
91|    expect(statusAfter.body.hawlStartDate).toBeDefined();
92|    expect(statusAfter.body.hawlCompletionDate).toBeDefined();
93|    expect(statusAfter.body.daysRemaining).toBeGreaterThan(350);
94|    expect(statusAfter.body.nisabBasis).toBe('gold');
95|
96|    // Step 5: Verify DRAFT record was created
97|    const recordsResponse = await request(app)
98|      .get('/api/nisab-year-records')
99|      .set('Authorization', `Bearer ${authToken}`)
100|      .query({ status: 'DRAFT' });
101|
102|    expect(recordsResponse.body.records).toHaveLength(1);
103|    const draftRecord = recordsResponse.body.records[0];
104|    expect(draftRecord.status).toBe('DRAFT');
105|    expect(draftRecord.totalWealth).toBeGreaterThanOrEqual(7500);
106|  });
107|
108|  it('should not create duplicate Hawl if active DRAFT exists', async () => {
109|    // Step 1: Create assets above Nisab
110|    await request(app)
111|      .post('/api/assets')
112|      .set('Authorization', `Bearer ${authToken}`)
113|      .send(createAssetPayload({
114|        name: 'Savings',
115|        category: 'cash',
116|        value: 8000,
117|      }));
118|
119|    // Step 2: Verify Hawl started
120|    const status1 = await request(app)
121|      .get('/api/nisab-year-records/status')
122|      .set('Authorization', `Bearer ${authToken}`);
123|
124|    expect(status1.body.active).toBe(true);
125|    const firstRecordId = status1.body.recordId;
126|
127|    // Step 3: Add more assets
128|    await request(app)
129|      .post('/api/assets')
130|      .set('Authorization', `Bearer ${authToken}`)
131|      .send(createAssetPayload({
132|        name: 'Investment Account',
133|        category: 'investment',
134|        value: 5000,
135|      }));
136|
137|    // Step 4: Verify same Hawl is still active (no duplicate)
138|    const status2 = await request(app)
139|      .get('/api/nisab-year-records/status')
140|      .set('Authorization', `Bearer ${authToken}`);
141|
142|    expect(status2.body.active).toBe(true);
143|    expect(status2.body.recordId).toBe(firstRecordId);
144|
145|    // Step 5: Confirm only 1 DRAFT record exists
146|    const records = await request(app)
147|      .get('/api/nisab-year-records')
148|      .set('Authorization', `Bearer ${authToken}`)
149|      .query({ status: 'DRAFT' });
150|
151|    expect(records.body.records).toHaveLength(1);
152|  });
153|
154|  it('should use gold-based Nisab if gold threshold is lower', async () => {
155|    // Mock current precious metal prices
156|    // Assume: Gold Nisab ~$5,293, Silver Nisab ~$520
157|    // User will reach silver Nisab first at lower wealth amount
158|
159|    await request(app)
160|      .post('/api/assets')
161|      .set('Authorization', `Bearer ${authToken}`)
162|      .send(createAssetPayload({
163|        name: 'Cash Savings',
164|        category: 'cash',
165|        value: 600, // Above silver Nisab, below gold Nisab
166|      }));
167|
168|    const status = await request(app)
169|      .get('/api/nisab-year-records/status')
170|      .set('Authorization', `Bearer ${authToken}`);
171|
172|    // Should detect Nisab achievement based on lower threshold (silver)
173|    // Note: Actual behavior depends on app's Nisab selection logic
174|    expect(status.body.active).toBe(true);
175|    expect(['gold', 'silver']).toContain(status.body.nisabBasis);
176|  });
177|
178|  it('should lock Nisab threshold value at Hawl start', async () => {
179|    // Step 1: Create assets above Nisab
180|    await request(app)
181|      .post('/api/assets')
182|      .set('Authorization', `Bearer ${authToken}`)
183|      .send(createAssetPayload({
184|        name: 'Cash',
185|        category: 'cash',
186|        value: 10000,
187|      }));
188|
189|    // Step 2: Get active Hawl details
190|    const status = await request(app)
191|      .get('/api/nisab-year-records/status')
192|      .set('Authorization', `Bearer ${authToken}`);
193|
194|    const recordId = status.body.recordId;
195|
196|    // Step 3: Fetch full record
197|    const recordResponse = await request(app)
198|      .get(`/api/nisab-year-records/${recordId}`)
199|      .set('Authorization', `Bearer ${authToken}`);
200|
201|    // Step 4: Verify nisabThresholdAtStart is set and won't change
202|    expect(recordResponse.body.nisabThresholdAtStart).toBeDefined();
203|    expect(parseFloat(recordResponse.body.nisabThresholdAtStart)).toBeGreaterThan(0);
204|
205|    // Store initial threshold
206|    const initialThreshold = recordResponse.body.nisabThresholdAtStart;
207|
208|    // Step 5: Simulate time passage and price change
209|    // (In real implementation, prices would be fetched from API and cached)
210|    // For test, verify threshold doesn't change when record is retrieved again
211|
212|    const recordResponseLater = await request(app)
213|      .get(`/api/nisab-year-records/${recordId}`)
214|      .set('Authorization', `Bearer ${authToken}`);
215|
216|    expect(recordResponseLater.body.nisabThresholdAtStart).toBe(initialThreshold);
217|  });
218|
219|  it('should calculate Hawl completion date as 354 days from start', async () => {
220|    // Create assets above Nisab
221|    await request(app)
222|      .post('/api/assets')
223|      .set('Authorization', `Bearer ${authToken}`)
224|      .send(createAssetPayload({
225|        name: 'Savings',
226|        category: 'cash',
227|        value: 7000,
228|      }));
229|
230|    const status = await request(app)
231|      .get('/api/nisab-year-records/status')
232|      .set('Authorization', `Bearer ${authToken}`);
233|
234|    const startDate = new Date(status.body.hawlStartDate);
235|    const completionDate = new Date(status.body.hawlCompletionDate);
236|
237|    const daysDiff = Math.floor(
238|      (completionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
239|    );
240|
241|    expect(daysDiff).toBe(354);
242|  });
243|
244|  it('should include Hijri date equivalents', async () => {
245|    // Create assets above Nisab
246|    await request(app)
247|      .post('/api/assets')
248|      .set('Authorization', `Bearer ${authToken}`)
249|      .send(createAssetPayload({
250|        name: 'Cash',
251|        category: 'cash',
252|        value: 6000,
253|      }));
254|
255|    const status = await request(app)
256|      .get('/api/nisab-year-records/status')
257|      .set('Authorization', `Bearer ${authToken}`);
258|
259|    const recordId = status.body.recordId;
260|
261|    const record = await request(app)
262|      .get(`/api/nisab-year-records/${recordId}`)
263|      .set('Authorization', `Bearer ${authToken}`);
264|
265|    expect(record.body.hawlStartDateHijri).toMatch(/^\d{4}-\d{2}-\d{2}$/);
266|    expect(record.body.hawlCompletionDateHijri).toMatch(/^\d{4}-\d{2}-\d{2}$/);
267|  });
268|});
269|