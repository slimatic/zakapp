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
3| * T028: Integration Test - Hawl Interruption (Wealth Drop Below Nisab)
4| * 
5| * Tests detection and handling when aggregate wealth drops below Nisab
6| * threshold during an active Hawl period, causing interruption.
7| * 
8| * @see specs/008-nisab-year-record/quickstart.md - Scenario 3
9| */
10|
11|import request from 'supertest';
12|import app from '../../src/app';
13|import { PrismaClient } from '@prisma/client';
14|import { createAssetPayload } from '../helpers/testHelpers';
15|
16|const prisma = new PrismaClient();
17|
18|describe('Integration: Hawl Interruption', () => {
19|  let authToken: string;
20|  let userId: string;
21|  let assetId: string;
22|
23|  beforeAll(async () => {
24|    const registerResponse = await request(app)
25|      .post('/api/auth/register')
26|      .send({
27|        email: `interruption-${Date.now()}@example.com`,
28|        password: 'TestPass123!',
29|        confirmPassword: 'TestPass123!',
30|        firstName: 'Interruption',
31|        lastName: 'Test User',
32|      });
33|
34|    authToken = registerResponse.body.data.tokens.accessToken;
35|    userId = registerResponse.body.data.user.id;
36|  });
37|
38|  afterAll(async () => {
39|    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
40|    await prisma.asset.deleteMany({ where: { userId } });
41|    await prisma.user.delete({ where: { id: userId } });
42|    await prisma.$disconnect();
43|  });
44|
45|  beforeEach(async () => {
46|    // Clear previous test data
47|    await prisma.yearlySnapshot.deleteMany({ where: { userId } });
48|    await prisma.asset.deleteMany({ where: { userId } });
49|  });
50|
51|  it('should detect Hawl interruption when wealth drops below Nisab', async () => {
52|    // Step 1: Create asset above Nisab (start Hawl)
53|    const assetResponse = await request(app)
54|      .post('/api/assets')
55|      .set('Authorization', `Bearer ${authToken}`)
56|      .send(createAssetPayload({
57|        name: 'Savings Account',
58|        category: 'cash',
59|        value: 8000, // Above Nisab
60|      }));
61|
62|    assetId = assetResponse.body.asset.id;
63|
64|    // Step 2: Verify Hawl is active
65|    const statusBefore = await request(app)
66|      .get('/api/nisab-year-records/status')
67|      .set('Authorization', `Bearer ${authToken}`);
68|
69|    expect(statusBefore.body.active).toBe(true);
70|
71|    // Step 3: Reduce asset value below Nisab
72|    await request(app)
73|      .put(`/api/assets/${assetId}`)
74|      .set('Authorization', `Bearer ${authToken}`)
75|      .send({
76|        value: 3000, // Below Nisab threshold (~5,293)
77|      });
78|
79|    // Step 4: Verify Hawl status shows interruption
80|    const statusAfter = await request(app)
81|      .get('/api/nisab-year-records/status')
82|      .set('Authorization', `Bearer ${authToken}`);
83|
84|    expect(statusAfter.body.active).toBe(false);
85|    expect(statusAfter.body.interrupted).toBe(true);
86|    expect(statusAfter.body.reason).toContain('wealth dropped below Nisab');
87|  });
88|
89|  it('should archive interrupted DRAFT record', async () => {
90|    // Step 1: Start Hawl
91|    await request(app)
92|      .post('/api/assets')
93|      .set('Authorization', `Bearer ${authToken}`)
94|      .send(createAssetPayload({
95|        name: 'Cash',
96|        category: 'cash',
97|        value: 7000,
98|      }));
99|
100|    const status1 = await request(app)
101|      .get('/api/nisab-year-records/status')
102|      .set('Authorization', `Bearer ${authToken}`);
103|
104|    const recordId = status1.body.recordId;
105|
106|    // Step 2: Delete asset to drop below Nisab
107|    const assets = await request(app)
108|      .get('/api/assets')
109|      .set('Authorization', `Bearer ${authToken}`);
110|
111|    const assetId = assets.body.assets[0].id;
112|
113|    await request(app)
114|      .delete(`/api/assets/${assetId}`)
115|      .set('Authorization', `Bearer ${authToken}`);
116|
117|    // Step 3: Verify DRAFT record is archived/marked interrupted
118|    const record = await request(app)
119|      .get(`/api/nisab-year-records/${recordId}`)
120|      .set('Authorization', `Bearer ${authToken}`);
121|
122|    // Record may be deleted or marked with interrupted status
123|    expect([404, 200]).toContain(record.status);
124|    
125|    if (record.status === 200) {
126|      expect(record.body.status).toBe('INTERRUPTED');
127|    }
128|  });
129|
130|  it('should allow new Hawl to start after interruption if wealth rises again', async () => {
131|    // Step 1: Start initial Hawl
132|    const asset1 = await request(app)
133|      .post('/api/assets')
134|      .set('Authorization', `Bearer ${authToken}`)
135|      .send(createAssetPayload({
136|        name: 'Savings',
137|        category: 'cash',
138|        value: 6000,
139|      }));
140|
141|    const assetId1 = asset1.body.asset.id;
142|
143|    const status1 = await request(app)
144|      .get('/api/nisab-year-records/status')
145|      .set('Authorization', `Bearer ${authToken}`);
146|
147|    expect(status1.body.active).toBe(true);
148|    const firstRecordId = status1.body.recordId;
149|
150|    // Step 2: Drop below Nisab (interrupt)
151|    await request(app)
152|      .put(`/api/assets/${assetId1}`)
153|      .set('Authorization', `Bearer ${authToken}`)
154|      .send({ value: 2000 });
155|
156|    const status2 = await request(app)
157|      .get('/api/nisab-year-records/status')
158|      .set('Authorization', `Bearer ${authToken}`);
159|
160|    expect(status2.body.active).toBe(false);
161|
162|    // Step 3: Rise above Nisab again (new Hawl should start)
163|    await request(app)
164|      .post('/api/assets')
165|      .set('Authorization', `Bearer ${authToken}`)
166|      .send(createAssetPayload({
167|        name: 'New Income',
168|        category: 'cash',
169|        value: 8000,
170|      }));
171|
172|    const status3 = await request(app)
173|      .get('/api/nisab-year-records/status')
174|      .set('Authorization', `Bearer ${authToken}`);
175|
176|    expect(status3.body.active).toBe(true);
177|    expect(status3.body.recordId).not.toBe(firstRecordId); // New record
178|    expect(status3.body.hawlStartDate).toBeDefined();
179|  });
180|
181|  it('should not interrupt if wealth temporarily fluctuates but stays above Nisab', async () => {
182|    // Step 1: Start Hawl
183|    const asset1 = await request(app)
184|      .post('/api/assets')
185|      .set('Authorization', `Bearer ${authToken}`)
186|      .send(createAssetPayload({
187|        name: 'Cash 1',
188|        category: 'cash',
189|        value: 4000,
190|      }));
191|
192|    await request(app)
193|      .post('/api/assets')
194|      .set('Authorization', `Bearer ${authToken}`)
195|      .send(createAssetPayload({
196|        name: 'Cash 2',
197|        category: 'cash',
198|        value: 3000,
199|      }));
200|
201|    const status1 = await request(app)
202|      .get('/api/nisab-year-records/status')
203|      .set('Authorization', `Bearer ${authToken}`);
204|
205|    expect(status1.body.active).toBe(true);
206|    const recordId = status1.body.recordId;
207|
208|    // Step 2: Reduce one asset (total still above Nisab)
209|    const assetId1 = asset1.body.asset.id;
210|    await request(app)
211|      .put(`/api/assets/${assetId1}`)
212|      .set('Authorization', `Bearer ${authToken}`)
213|      .send({ value: 3500 }); // Total now 6500 (still above ~5293)
214|
215|    // Step 3: Verify Hawl still active
216|    const status2 = await request(app)
217|      .get('/api/nisab-year-records/status')
218|      .set('Authorization', `Bearer ${authToken}`);
219|
220|    expect(status2.body.active).toBe(true);
221|    expect(status2.body.recordId).toBe(recordId); // Same Hawl
222|  });
223|
224|  it('should record interruption in audit trail', async () => {
225|    // Step 1: Start Hawl
226|    await request(app)
227|      .post('/api/assets')
228|      .set('Authorization', `Bearer ${authToken}`)
229|      .send(createAssetPayload({
230|        name: 'Cash',
231|        category: 'cash',
232|        value: 7500,
233|      }));
234|
235|    const status = await request(app)
236|      .get('/api/nisab-year-records/status')
237|      .set('Authorization', `Bearer ${authToken}`);
238|
239|    const recordId = status.body.recordId;
240|
241|    // Step 2: Trigger interruption
242|    const assets = await request(app)
243|      .get('/api/assets')
244|      .set('Authorization', `Bearer ${authToken}`);
245|
246|    await request(app)
247|      .delete(`/api/assets/${assets.body.assets[0].id}`)
248|      .set('Authorization', `Bearer ${authToken}`);
249|
250|    // Step 3: Check audit trail
251|    const auditResponse = await request(app)
252|      .get(`/api/nisab-year-records/${recordId}/audit-trail`)
253|      .set('Authorization', `Bearer ${authToken}`);
254|
255|    if (auditResponse.status === 200) {
256|      const auditEntries = auditResponse.body.auditTrail;
257|      
258|      const interruptionEvent = auditEntries.find(
259|        (entry: { eventType: string }) => entry.eventType === 'INTERRUPTED'
260|      );
261|
262|      expect(interruptionEvent).toBeDefined();
263|      expect(interruptionEvent.changesSummary).toContain('wealth dropped below Nisab');
264|    }
265|  });
266|
267|  it('should clear Hawl completion date on interruption', async () => {
268|    // Step 1: Start Hawl
269|    await request(app)
270|      .post('/api/assets')
271|      .set('Authorization', `Bearer ${authToken}`)
272|      .send(createAssetPayload({
273|        name: 'Savings',
274|        category: 'cash',
275|        value: 6500,
276|      }));
277|
278|    const status1 = await request(app)
279|      .get('/api/nisab-year-records/status')
280|      .set('Authorization', `Bearer ${authToken}`);
281|
282|    expect(status1.body.hawlCompletionDate).toBeDefined();
283|
284|    // Step 2: Interrupt Hawl
285|    const assets = await request(app)
286|      .get('/api/assets')
287|      .set('Authorization', `Bearer ${authToken}`);
288|
289|    await request(app)
290|      .put(`/api/assets/${assets.body.assets[0].id}`)
291|      .set('Authorization', `Bearer ${authToken}`)
292|      .send({ value: 2500 });
293|
294|    // Step 3: Verify no active Hawl with completion date
295|    const status2 = await request(app)
296|      .get('/api/nisab-year-records/status')
297|      .set('Authorization', `Bearer ${authToken}`);
298|
299|    expect(status2.body.active).toBe(false);
300|    expect(status2.body.hawlCompletionDate).toBeUndefined();
301|  });
302|});
303|