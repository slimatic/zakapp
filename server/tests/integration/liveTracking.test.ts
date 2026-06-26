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
3| * T027: Integration Test - Live Wealth Tracking
4| * 
5| * Tests real-time wealth aggregation updates as assets change,
6| * frontend polling simulation, and <100ms performance requirement.
7| * 
8| * @see specs/008-nisab-year-record/research.md - Live tracking implementation
9| * @see specs/008-nisab-year-record/quickstart.md - Scenario 2
10| */
11|
12|import request from 'supertest';
13|import moment from 'moment';
14|import app from '../../src/app';
15|import { PrismaClient } from '@prisma/client';
16|import { createAssetPayload, extractAssetId, extractAssetValue } from '../helpers/testHelpers';
17|
18|const prisma = new PrismaClient();
19|
20|describe('Integration: Live Wealth Tracking', () => {
21|  let authToken: string;
22|  let userId: string;
23|  let draftRecordId: string;
24|
25|  beforeAll(async () => {
26|    const registerResponse = await request(app)
27|      .post('/api/auth/register')
28|      .send({
29|        email: `livetrack-${Date.now()}@example.com`,
30|        password: 'TestPass123!',
31|        confirmPassword: 'TestPass123!',
32|        firstName: 'Live',
33|        lastName: 'Track User',
34|      });
35|
36|    authToken = registerResponse.body.data.tokens.accessToken;
37|    userId = registerResponse.body.data.user.id;
38|
39|    // Create initial assets to trigger Hawl
40|    await request(app)
41|      .post('/api/assets')
42|      .set('Authorization', `Bearer ${authToken}`)
43|      .send(createAssetPayload({
44|        name: 'Initial Cash',
45|        category: 'cash',
46|        value: 7000,
47|      }));
48|
49|    const status = await request(app)
50|      .get('/api/nisab-year-records/status')
51|      .set('Authorization', `Bearer ${authToken}`);
52|
53|    draftRecordId = status.body.recordId;
54|  });
55|
56|  afterAll(async () => {
57|    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
58|    await prisma.asset.deleteMany({ where: { userId } });
59|    await prisma.user.delete({ where: { id: userId } });
60|    await prisma.$disconnect();
61|  });
62|
63|  it('should update DRAFT record when asset is added', async () => {
64|    // Step 1: Get current DRAFT record wealth
65|    const before = await request(app)
66|      .get(`/api/nisab-year-records/${draftRecordId}`)
67|      .set('Authorization', `Bearer ${authToken}`);
68|
69|    const wealthBefore = parseFloat(before.body.totalWealth);
70|
71|    // Step 2: Add new asset
72|    const newAssetResponse = await request(app)
73|      .post('/api/assets')
74|      .set('Authorization', `Bearer ${authToken}`)
75|      .send(createAssetPayload({
76|        name: 'Gold Jewelry',
77|        category: 'gold',
78|        value: 2000,
79|      }));
80|
81|    expect(newAssetResponse.status).toBe(201);
82|
83|    // Step 3: Verify DRAFT record updated automatically
84|    const after = await request(app)
85|      .get(`/api/nisab-year-records/${draftRecordId}`)
86|      .set('Authorization', `Bearer ${authToken}`);
87|
88|    const wealthAfter = parseFloat(after.body.totalWealth);
89|
90|    expect(wealthAfter).toBe(wealthBefore + 2000);
91|  });
92|
93|  it('should update DRAFT record when asset value is modified', async () => {
94|    // Step 1: Create an asset
95|    const assetResponse = await request(app)
96|      .post('/api/assets')
97|      .set('Authorization', `Bearer ${authToken}`)
98|      .send(createAssetPayload({
99|        name: 'Gold Jewelry',
100|        category: 'gold',
101|        value: 2000,
102|      }));
103|
104|    const assetId = extractAssetId(assetResponse);
105|
106|    // Step 2: Get current wealth
107|    const before = await request(app)
108|      .get(`/api/nisab-year-records/${draftRecordId}`)
109|      .set('Authorization', `Bearer ${authToken}`);
110|
111|    const wealthBefore = parseFloat(before.body.totalWealth);
112|
113|    // Step 3: Update asset value
114|    await request(app)
115|      .put(`/api/assets/${assetId}`)
116|      .set('Authorization', `Bearer ${authToken}`)
117|      .send({
118|        value: 7000, // Increased by 2000
119|      });
120|
121|    // Step 4: Verify wealth increased
122|    const after = await request(app)
123|      .get(`/api/nisab-year-records/${draftRecordId}`)
124|      .set('Authorization', `Bearer ${authToken}`);
125|
126|    const wealthAfter = parseFloat(after.body.totalWealth);
127|
128|    expect(wealthAfter).toBe(wealthBefore + 2000);
129|  });
130|
131|  it('should update DRAFT record when asset is deleted', async () => {
132|    // Step 1: Create asset to delete
133|    const assetResponse = await request(app)
134|      .post('/api/assets')
135|      .set('Authorization', `Bearer ${authToken}`)
136|      .send(createAssetPayload({
137|        name: 'Asset to Delete',
138|        category: 'cash',
139|        value: 1500,
140|      }));
141|
142|    const assetId = extractAssetId(assetResponse);
143|
144|    // Step 2: Get current wealth
145|    const before = await request(app)
146|      .get(`/api/nisab-year-records/${draftRecordId}`)
147|      .set('Authorization', `Bearer ${authToken}`);
148|
149|    const wealthBefore = parseFloat(before.body.totalWealth);
150|
151|    // Step 3: Delete asset
152|    await request(app)
153|      .delete(`/api/assets/${assetId}`)
154|      .set('Authorization', `Bearer ${authToken}`);
155|
156|    // Step 4: Verify wealth decreased
157|    const after = await request(app)
158|      .get(`/api/nisab-year-records/${draftRecordId}`)
159|      .set('Authorization', `Bearer ${authToken}`);
160|
161|    const wealthAfter = parseFloat(after.body.totalWealth);
162|
163|    expect(wealthAfter).toBe(wealthBefore - 1500);
164|  });
165|
166|  it('should recalculate Zakat amount when wealth changes', async () => {
167|    // Step 1: Get current Zakat amount
168|    const before = await request(app)
169|      .get(`/api/nisab-year-records/${draftRecordId}`)
170|      .set('Authorization', `Bearer ${authToken}`);
171|
172|    const zakatBefore = parseFloat(before.body.zakatAmount);
173|    const wealthBefore = parseFloat(before.body.zakatableWealth);
174|
175|    // Step 2: Add asset
176|    await request(app)
177|      .post('/api/assets')
178|      .set('Authorization', `Bearer ${authToken}`)
179|      .send(createAssetPayload({
180|        name: 'Additional Cash',
181|        category: 'cash',
182|        value: 4000,
183|      }));
184|
185|    // Step 3: Verify Zakat recalculated (2.5% of new wealth)
186|    const after = await request(app)
187|      .get(`/api/nisab-year-records/${draftRecordId}`)
188|      .set('Authorization', `Bearer ${authToken}`);
189|
190|    const zakatAfter = parseFloat(after.body.zakatAmount);
191|    const wealthAfter = parseFloat(after.body.zakatableWealth);
192|
193|    expect(wealthAfter).toBe(wealthBefore + 4000);
194|    expect(zakatAfter).toBeCloseTo(wealthAfter * 0.025, 2);
195|    expect(zakatAfter).toBeGreaterThan(zakatBefore);
196|  });
197|
198|  it('should handle non-zakatable assets correctly', async () => {
199|    // Step 1: Get wealth before
200|    const before = await request(app)
201|      .get(`/api/nisab-year-records/${draftRecordId}`)
202|      .set('Authorization', `Bearer ${authToken}`);
203|
204|    const wealthBefore = parseFloat(before.body.totalWealth);
205|
206|    // Step 2: Add non-zakatable asset (property category)
207|    await request(app)
208|      .post('/api/assets')
209|      .set('Authorization', `Bearer ${authToken}`)
210|      .send(createAssetPayload({
211|        name: 'Personal Residence',
212|        category: 'property',
213|        value: 300000,
214|        // Note: Zakat calculation is based on category and modifiers, not a flag
215|      }));
216|
217|    // Step 3: Verify wealth unchanged
218|    const after = await request(app)
219|      .get(`/api/nisab-year-records/${draftRecordId}`)
220|      .set('Authorization', `Bearer ${authToken}`);
221|
222|    const wealthAfter = parseFloat(after.body.totalWealth);
223|
224|    expect(wealthAfter).toBe(wealthBefore); // Should not include non-zakatable
225|  });
226|
227|  it('should meet performance requirement (<100ms for aggregation)', async () => {
228|    // Create 50 assets sequentially to avoid SQLite contention during parallel test runs
229|    for (let i = 0; i < 50; i++) {
230|      await request(app)
231|        .post('/api/assets')
232|        .set('Authorization', `Bearer ${authToken}`)
233|        .send(createAssetPayload({
234|          name: `Asset ${i}`,
235|          category: i % 2 === 0 ? 'cash' : 'gold',
236|          value: 100 + i,
237|        }));
238|    }
239|
240|    // Measure aggregation time
241|    const startTime = Date.now();
242|    
243|    const response = await request(app)
244|      .get(`/api/nisab-year-records/${draftRecordId}`)
245|      .set('Authorization', `Bearer ${authToken}`);
246|
247|    const duration = Date.now() - startTime;
248|
249|    expect(response.status).toBe(200);
250|    expect(duration).toBeLessThan(100); // Performance requirement
251|  });
252|
253|  it('should provide asset breakdown by category', async () => {
254|    // Get record with breakdown
255|    const response = await request(app)
256|      .get(`/api/nisab-year-records/${draftRecordId}`)
257|      .set('Authorization', `Bearer ${authToken}`);
258|
259|    expect(response.body.assetBreakdown).toBeDefined();
260|    expect(response.body.assetBreakdown).toHaveProperty('cash');
261|    expect(response.body.assetBreakdown).toHaveProperty('gold');
262|    
263|    // Verify total matches sum of categories
264|    const breakdownTotal = Object.values(response.body.assetBreakdown as Record<string, number>)
265|      .reduce((sum, val) => sum + val, 0);
266|    
267|    const recordTotal = parseFloat(response.body.totalWealth);
268|    
269|    expect(breakdownTotal).toBeCloseTo(recordTotal, 2);
270|  });
271|
272|  it('should update updatedAt timestamp on recalculation', async () => {
273|    // Step 1: Get current updatedAt
274|    const before = await request(app)
275|      .get(`/api/nisab-year-records/${draftRecordId}`)
276|      .set('Authorization', `Bearer ${authToken}`);
277|
278|    const updatedAtBefore = new Date(before.body.updatedAt);
279|
280|    // Wait a moment to ensure timestamp difference
281|    await new Promise(resolve => setTimeout(resolve, 1000));
282|
283|    // Step 2: Modify asset
284|    await request(app)
285|      .post('/api/assets')
286|      .set('Authorization', `Bearer ${authToken}`)
287|      .send(createAssetPayload({
288|        name: 'New Asset',
289|        category: 'cash',
290|        value: 500,
291|      }));
292|
293|    // Step 3: Verify updatedAt changed
294|    const after = await request(app)
295|      .get(`/api/nisab-year-records/${draftRecordId}`)
296|      .set('Authorization', `Bearer ${authToken}`);
297|
298|    const updatedAtAfter = new Date(after.body.updatedAt);
299|
300|    expect(updatedAtAfter.getTime()).toBeGreaterThan(updatedAtBefore.getTime());
301|  });
302|});
303|