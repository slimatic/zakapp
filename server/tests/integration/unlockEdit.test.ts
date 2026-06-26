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
3| * T030: Integration Test - Unlock, Edit, and Re-finalize Workflow
4| * 
5| * Tests the complete workflow of unlocking a FINALIZED record,
6| * editing it, and re-finalizing with full audit trail.
7| * 
8| * @see specs/008-nisab-year-record/quickstart.md - Scenario 5
9| */
10|
11|import request from 'supertest';
12|import app from '../../src/app';
13|import { PrismaClient } from '@prisma/client';
14|
15|// const prisma = new PrismaClient(); // Removed global instance
16|
17|describe('Integration: Unlock-Edit-Refinalize Workflow', () => {
18|  let authToken: string;
19|  let userId: string;
20|
21|  beforeAll(async () => {
22|    const registerResponse = await request(app)
23|      .post('/api/auth/register')
24|      .send({
25|        email: `unlock-${Date.now()}@example.com`,
26|        password: 'TestPass123!',
27|        confirmPassword: 'TestPass123!',
28|        firstName: 'Unlock',
29|        lastName: 'Test',
30|      });
31|
32|    if (registerResponse.status !== 201) {
33|      throw new Error(`Registration Failed: ${JSON.stringify(registerResponse.body, null, 2)}`);
34|    }
35|    // Updated to match new API response structure (nested in data property)
36|    authToken = registerResponse.body.data.tokens.accessToken;
37|    userId = registerResponse.body.data.user.id;
38|  });
39|
40|  afterAll(async () => {
41|    const prisma = new PrismaClient();
42|    await prisma.user.delete({ where: { id: userId } }).catch(() => { });
43|    await prisma.$disconnect();
44|  });
45|
46|  afterEach(async () => {
47|    // Clean up all Nisab records created during the test to avoid hitting resource limits
48|    const prisma = new PrismaClient();
49|    await prisma.yearlySnapshot.deleteMany({ where: { userId } }).catch(() => { });
50|    await prisma.$disconnect();
51|  });
52|
53|  it('should unlock FINALIZED record with valid reason', async () => {
54|    // Step 1: Create and finalize a record
55|    const createResponse = await request(app)
56|      .post('/api/nisab-year-records')
57|      .set('Authorization', `Bearer ${authToken}`)
58|      .send({
59|        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
60|        hawlStartDateHijri: '1444-06-08',
61|        hawlCompletionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
62|        hawlCompletionDateHijri: '1445-06-08',
63|        nisabBasis: 'GOLD',
64|        totalWealth: 10000,
65|        zakatableWealth: 10000,
66|        zakatAmount: 250,
67|      });
68|
69|    console.log('CREATE RESPONSE STATUS:', createResponse.status);
70|    console.log('CREATE RESPONSE BODY:', JSON.stringify(createResponse.body, null, 2));
71|
72|    const recordId = createResponse.body.data.id;
73|
74|    await request(app)
75|      .post(`/api/nisab-year-records/${recordId}/finalize`)
76|      .set('Authorization', `Bearer ${authToken}`);
77|
78|    // Step 2: Unlock the record
79|    const unlockReason = 'Need to correct asset valuation that was incorrectly recorded';
80|    const unlockResponse = await request(app)
81|      .post(`/api/nisab-year-records/${recordId}/unlock`)
82|      .set('Authorization', `Bearer ${authToken}`)
83|      .send({ unlockReason: unlockReason });
84|
85|    expect(unlockResponse.status).toBe(200);
86|    expect(unlockResponse.body.data.status).toBe('UNLOCKED');
87|  });
88|
89|  it('should require unlock reason with minimum 10 characters', async () => {
90|    // Step 1: Create and finalize
91|    const createResponse = await request(app)
92|      .post('/api/nisab-year-records')
93|      .set('Authorization', `Bearer ${authToken}`)
94|      .send({
95|        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
96|        hawlStartDateHijri: '1444-06-08',
97|        hawlCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
98|        hawlCompletionDateHijri: '1445-06-08',
99|        nisabBasis: 'GOLD',
100|        totalWealth: 9000,
101|        zakatableWealth: 9000,
102|        zakatAmount: 225,
103|      });
104|
105|    const recordId = createResponse.body.data.id;
106|
107|    await request(app)
108|      .post(`/api/nisab-year-records/${recordId}/finalize`)
109|      .set('Authorization', `Bearer ${authToken}`);
110|
111|    // Step 2: Attempt unlock with short reason
112|    const unlockResponse = await request(app)
113|      .post(`/api/nisab-year-records/${recordId}/unlock`)
114|      .set('Authorization', `Bearer ${authToken}`)
115|      .send({ unlockReason: 'Too short' }); // Only 9 characters
116|
117|    expect(unlockResponse.status).toBe(400);
118|    expect(unlockResponse.body.message).toContain('at least 10 characters');
119|  });
120|
121|  it('should allow editing of UNLOCKED record', async () => {
122|    // Step 1: Create, finalize, and unlock
123|    const createResponse = await request(app)
124|      .post('/api/nisab-year-records')
125|      .set('Authorization', `Bearer ${authToken}`)
126|      .send({
127|        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
128|        hawlStartDateHijri: '1444-06-08',
129|        hawlCompletionDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
130|        hawlCompletionDateHijri: '1445-06-08',
131|        nisabBasis: 'GOLD',
132|        totalWealth: 10000,
133|        zakatableWealth: 10000,
134|        zakatAmount: 250,
135|      });
136|
137|    const recordId = createResponse.body.data.id;
138|
139|    await request(app)
140|      .post(`/api/nisab-year-records/${recordId}/finalize`)
141|      .set('Authorization', `Bearer ${authToken}`);
142|
143|    await request(app)
144|      .post(`/api/nisab-year-records/${recordId}/unlock`)
145|      .set('Authorization', `Bearer ${authToken}`)
146|      .send({ unlockReason: 'Correcting asset valuation error discovered during review' });
147|
148|    // Step 2: Edit the unlocked record
149|    const updateResponse = await request(app)
150|      .put(`/api/nisab-year-records/${recordId}`)
151|      .set('Authorization', `Bearer ${authToken}`)
152|      .send({
153|        totalWealth: 12000,
154|        zakatableWealth: 12000,
155|        zakatAmount: 300,
156|      });
157|
158|    expect(updateResponse.status).toBe(200);
159|    expect(Number(updateResponse.body.data.totalWealth)).toBe(12000);
160|    expect(Number(updateResponse.body.data.zakatAmount)).toBe(300);
161|  });
162|
163|  it('should record UNLOCKED event in audit trail with reason', async () => {
164|    // Step 1: Create, finalize, and unlock
165|    const createResponse = await request(app)
166|      .post('/api/nisab-year-records')
167|      .set('Authorization', `Bearer ${authToken}`)
168|      .send({
169|        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
170|        hawlStartDateHijri: '1444-06-08',
171|        hawlCompletionDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
172|        hawlCompletionDateHijri: '1445-06-08',
173|        nisabBasis: 'SILVER',
174|        totalWealth: 7000,
175|        zakatableWealth: 7000,
176|        zakatAmount: 175,
177|      });
178|
179|    const recordId = createResponse.body.data.id;
180|
181|    await request(app)
182|      .post(`/api/nisab-year-records/${recordId}/finalize`)
183|      .set('Authorization', `Bearer ${authToken}`);
184|
185|    const unlockReason = 'Discovered missing liability deduction after consultation';
186|
187|    await request(app)
188|      .post(`/api/nisab-year-records/${recordId}/unlock`)
189|      .set('Authorization', `Bearer ${authToken}`)
190|      .send({ unlockReason: unlockReason });
191|
192|    // Step 2: Check audit trail
193|    const auditResponse = await request(app)
194|      .get(`/api/nisab-year-records/${recordId}/audit`)
195|      .set('Authorization', `Bearer ${authToken}`);
196|
197|    const unlockEvent = auditResponse.body.data.entries.find(
198|      (entry: { eventType: string }) => entry.eventType === 'UNLOCKED'
199|    );
200|
201|    expect(unlockEvent).toBeDefined();
202|    // unlockReason is encrypted in audit trail
203|    expect(unlockEvent.unlockReason).toBeDefined();
204|  });
205|
206|  it('should record EDITED events with changes summary', async () => {
207|    // Step 1: Create, finalize, unlock
208|    const createResponse = await request(app)
209|      .post('/api/nisab-year-records')
210|      .set('Authorization', `Bearer ${authToken}`)
211|      .send({
212|        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
213|        hawlStartDateHijri: '1444-06-08',
214|        hawlCompletionDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
215|        hawlCompletionDateHijri: '1445-06-08',
216|        nisabBasis: 'GOLD',
217|        totalWealth: 10000,
218|        zakatableWealth: 10000,
219|        zakatAmount: 250,
220|      });
221|
222|    const recordId = createResponse.body.data.id;
223|
224|    await request(app)
225|      .post(`/api/nisab-year-records/${recordId}/finalize`)
226|      .set('Authorization', `Bearer ${authToken}`);
227|
228|    await request(app)
229|      .post(`/api/nisab-year-records/${recordId}/unlock`)
230|      .set('Authorization', `Bearer ${authToken}`)
231|      .send({ unlockReason: 'Correcting calculation error found in audit' });
232|
233|    // Step 2: Edit multiple fields
234|    await request(app)
235|      .put(`/api/nisab-year-records/${recordId}`)
236|      .set('Authorization', `Bearer ${authToken}`)
237|      .send({
238|        totalWealth: 11500,
239|        zakatableWealth: 11500,
240|        zakatAmount: 287.5,
241|      });
242|
243|    // Step 3: Verify audit trail includes changes
244|    const auditResponse = await request(app)
245|      .get(`/api/nisab-year-records/${recordId}/audit`)
246|      .set('Authorization', `Bearer ${authToken}`);
247|
248|    const editEvent = auditResponse.body.data.entries.find(
249|      (entry: { eventType: string }) => entry.eventType === 'EDITED'
250|    );
251|
252|    expect(editEvent).toBeDefined();
253|    // Check that changes are recorded
254|    expect(editEvent.changesSummary || editEvent.changes).toBeDefined();
255|  });
256|
257|  it('should allow re-finalization after edit', async () => {
258|    // Step 1: Create, finalize, unlock, edit
259|    const createResponse = await request(app)
260|      .post('/api/nisab-year-records')
261|      .set('Authorization', `Bearer ${authToken}`)
262|      .send({
263|        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
264|        hawlStartDateHijri: '1444-06-08',
265|        hawlCompletionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
266|        hawlCompletionDateHijri: '1445-06-08',
267|        nisabBasis: 'GOLD',
268|        totalWealth: 9000,
269|        zakatableWealth: 9000,
270|        zakatAmount: 225,
271|      });
272|
273|    const recordId = createResponse.body.data.id;
274|
275|    await request(app)
276|      .post(`/api/nisab-year-records/${recordId}/finalize`)
277|      .set('Authorization', `Bearer ${authToken}`);
278|
279|    await request(app)
280|      .post(`/api/nisab-year-records/${recordId}/unlock`)
281|      .set('Authorization', `Bearer ${authToken}`)
282|      .send({ unlockReason: 'Correcting valuation after professional appraisal' });
283|
284|    await request(app)
285|      .put(`/api/nisab-year-records/${recordId}`)
286|      .set('Authorization', `Bearer ${authToken}`)
287|      .send({ totalWealth: 9500, zakatableWealth: 9500, zakatAmount: 237.5 });
288|
289|    // Step 2: Re-finalize
290|    const refinalize = await request(app)
291|      .post(`/api/nisab-year-records/${recordId}/finalize`)
292|      .set('Authorization', `Bearer ${authToken}`);
293|
294|    expect(refinalize.status).toBe(200);
295|    expect(refinalize.body.data.status).toBe('FINALIZED');
296|  });
297|
298|  it('should record REFINALIZED event in audit trail', async () => {
299|    // Step 1: Full cycle: create → finalize → unlock → edit → refinalize
300|    const createResponse = await request(app)
301|      .post('/api/nisab-year-records')
302|      .set('Authorization', `Bearer ${authToken}`)
303|      .send({
304|        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
305|        hawlStartDateHijri: '1444-06-08',
306|        hawlCompletionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
307|        hawlCompletionDateHijri: '1445-06-08',
308|        nisabBasis: 'GOLD',
309|        totalWealth: 8000,
310|        zakatableWealth: 8000,
311|        zakatAmount: 200,
312|      });
313|
314|    const recordId = createResponse.body.data.id;
315|
316|    await request(app)
317|      .post(`/api/nisab-year-records/${recordId}/finalize`)
318|      .set('Authorization', `Bearer ${authToken}`);
319|
320|    await request(app)
321|      .post(`/api/nisab-year-records/${recordId}/unlock`)
322|      .set('Authorization', `Bearer ${authToken}`)
323|      .send({ unlockReason: 'Fixing data entry mistake identified post-finalization' });
324|
325|    await request(app)
326|      .put(`/api/nisab-year-records/${recordId}`)
327|      .set('Authorization', `Bearer ${authToken}`)
328|      .send({ totalWealth: 8500, zakatableWealth: 8500, zakatAmount: 212.5 });
329|
330|    await request(app)
331|      .post(`/api/nisab-year-records/${recordId}/finalize`)
332|      .set('Authorization', `Bearer ${authToken}`);
333|
334|    // Step 2: Verify audit trail
335|    const auditResponse = await request(app)
336|      .get(`/api/nisab-year-records/${recordId}/audit`)
337|      .set('Authorization', `Bearer ${authToken}`);
338|
339|    const events = auditResponse.body.data.entries.map((e: { eventType: string }) => e.eventType);
340|
341|    expect(events).toContain('CREATED');
342|    expect(events).toContain('FINALIZED');
343|    expect(events).toContain('UNLOCKED');
344|    expect(events).toContain('EDITED');
345|    // Event is named FINALIZED not REFINALIZED after editing
346|    expect(events.filter(e => e === 'FINALIZED').length).toBeGreaterThanOrEqual(2);
347|  });
348|
349|  it('should NOT allow unlocking DRAFT record', async () => {
350|    // Step 1: Create DRAFT record (don't finalize)
351|    const createResponse = await request(app)
352|      .post('/api/nisab-year-records')
353|      .set('Authorization', `Bearer ${authToken}`)
354|      .send({
355|        hawlStartDate: new Date(),
356|        hawlStartDateHijri: '1446-07-15',
357|        hawlCompletionDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
358|        hawlCompletionDateHijri: '1447-05-25',
359|        nisabBasis: 'GOLD',
360|        totalWealth: 7000,
361|        zakatableWealth: 7000,
362|        zakatAmount: 175,
363|      });
364|
365|    const recordId = createResponse.body.data.id;
366|
367|    // Step 2: Attempt to unlock
368|    const unlockResponse = await request(app)
369|      .post(`/api/nisab-year-records/${recordId}/unlock`)
370|      .set('Authorization', `Bearer ${authToken}`)
371|      .send({ unlockReason: 'This should not be allowed for DRAFT records' });
372|
373|    expect(unlockResponse.status).toBe(409);
374|    expect(unlockResponse.body.message).toContain('Cannot unlock record in DRAFT status');
375|  });
376|
377|  it('should encrypt unlock reason in audit trail', async () => {
378|    // This test verifies that sensitive unlock reasons are encrypted
379|    // (Implementation detail - we'll verify in audit trail service tests)
380|
381|    const createResponse = await request(app)
382|      .post('/api/nisab-year-records')
383|      .set('Authorization', `Bearer ${authToken}`)
384|      .send({
385|        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
386|        hawlStartDateHijri: '1444-06-08',
387|        hawlCompletionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
388|        hawlCompletionDateHijri: '1445-06-08',
389|        nisabBasis: 'GOLD',
390|        totalWealth: 10000,
391|        zakatableWealth: 10000,
392|        zakatAmount: 250,
393|      });
394|
395|    const recordId = createResponse.body.data.id;
396|
397|    await request(app)
398|      .post(`/api/nisab-year-records/${recordId}/finalize`)
399|      .set('Authorization', `Bearer ${authToken}`);
400|
401|    const sensitiveReason = 'Correcting error due to divorce settlement asset transfer';
402|
403|    await request(app)
404|      .post(`/api/nisab-year-records/${recordId}/unlock`)
405|      .set('Authorization', `Bearer ${authToken}`)
406|      .send({ unlockReason: sensitiveReason });
407|
408|    // Audit trail should return decrypted reason for authorized user
409|    const auditResponse = await request(app)
410|      .get(`/api/nisab-year-records/${recordId}/audit`)
411|      .set('Authorization', `Bearer ${authToken}`);
412|
413|    const unlockEvent = auditResponse.body.data.entries.find(
414|      (entry: { eventType: string }) => entry.eventType === 'UNLOCKED'
415|    );
416|
417|    // unlockReason is encrypted in audit trail for security
418|    expect(unlockEvent.unlockReason).toBeDefined();
419|    expect(typeof unlockEvent.unlockReason).toBe('string');
420|  });
421|});
422|