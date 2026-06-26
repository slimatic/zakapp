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

1|import { vi, type Mock, describe, it, expect, beforeAll, afterAll } from 'vitest';
2|/**
3| * T029: Integration Test - Finalization Workflow
4| * 
5| * Tests the complete workflow of finalizing a Nisab Year Record
6| * after Hawl completion, including validation and state transitions.
7| * 
8| * @see specs/008-nisab-year-record/quickstart.md - Scenario 4
9| */
10|
11|import request from 'supertest';
12|import app from '../../src/app';
13|import { PrismaClient } from '@prisma/client';
14|
15|const prisma = new PrismaClient();
16|
17|describe('Integration: Finalization Workflow', () => {
18|  let authToken: string;
19|  let userId: string;
20|
21|  beforeAll(async () => {
22|    const registerResponse = await request(app)
23|      .post('/api/auth/register')
24|      .send({
25|        email: `finalization-${Date.now()}@example.com`,
26|        password: 'TestPass123!',
27|        confirmPassword: 'TestPass123!',
28|        firstName: 'Finalization',
29|        lastName: 'Test User',
30|      });
31|
32|    authToken = registerResponse.body.data.tokens.accessToken;
33|    userId = registerResponse.body.data.user.id;
34|  });
35|
36|  afterAll(async () => {
37|    if (userId) {
38|      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
39|    }
40|    await prisma.$disconnect();
41|  });
42|
43|  it('should finalize DRAFT record after Hawl completion date', async () => {
44|    // Step 1: Create a DRAFT record with past completion date
45|    const createResponse = await request(app)
46|      .post('/api/nisab-year-records')
47|      .set('Authorization', `Bearer ${authToken}`)
48|      .send({
49|        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
50|        hawlStartDateHijri: '1445-01-01',
51|        hawlCompletionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
52|        hawlCompletionDateHijri: '1446-01-01',
53|        nisabBasis: 'GOLD',
54|        totalWealth: 10000,
55|        zakatableWealth: 10000,
56|        zakatAmount: 250,
57|      });
58|
59|    const recordId = createResponse.body.data.id;
60|
61|    // Step 2: Finalize the record
62|    const finalizeResponse = await request(app)
63|      .post(`/api/nisab-year-records/${recordId}/finalize`)
64|      .set('Authorization', `Bearer ${authToken}`);
65|
66|    expect(finalizeResponse.status).toBe(200);
67|    expect(finalizeResponse.body.data.status).toBe('FINALIZED');
68|    expect(finalizeResponse.body.data.finalizedAt).toBeDefined();
69|
70|    // Step 3: Verify record is now read-only
71|    const updateAttempt = await request(app)
72|      .put(`/api/nisab-year-records/${recordId}`)
73|      .set('Authorization', `Bearer ${authToken}`)
74|      .send({ totalWealth: 15000 });
75|
76|    expect(updateAttempt.status).toBe(403);
77|    expect(updateAttempt.body.error).toContain('Cannot update finalized record');
78|  });
79|
80|  it('should NOT finalize before Hawl completion date without override', async () => {
81|    // Step 1: Create DRAFT with future completion date
82|    const createResponse = await request(app)
83|      .post('/api/nisab-year-records')
84|      .set('Authorization', `Bearer ${authToken}`)
85|      .send({
86|        hawlStartDate: new Date(),
87|        hawlStartDateHijri: '1446-01-01',
88|        hawlCompletionDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000), // 300 days from now
89|        hawlCompletionDateHijri: '1447-01-01',
90|        nisabBasis: 'GOLD',
91|        totalWealth: 8000,
92|        zakatableWealth: 8000,
93|        zakatAmount: 200,
94|      });
95|
96|    const recordId = createResponse.body.data.id;
97|
98|    // Step 2: Attempt to finalize
99|    const finalizeResponse = await request(app)
100|      .post(`/api/nisab-year-records/${recordId}/finalize`)
101|      .set('Authorization', `Bearer ${authToken}`);
102|
103|    expect(finalizeResponse.status).toBe(400);
104|    expect(finalizeResponse.body.error).toContain('Cannot finalize before Hawl completion');
105|  });
106|
107|  it('should allow early finalization with override flag', async () => {
108|    // Step 1: Create DRAFT with future completion date
109|    const createResponse = await request(app)
110|      .post('/api/nisab-year-records')
111|      .set('Authorization', `Bearer ${authToken}`)
112|      .send({
113|        hawlStartDate: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
114|        hawlStartDateHijri: '1445-02-01',
115|        hawlCompletionDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000), // 50 days future
116|        hawlCompletionDateHijri: '1446-02-01',
117|        nisabBasis: 'SILVER',
118|        totalWealth: 7000,
119|        zakatableWealth: 7000,
120|        zakatAmount: 175,
121|      });
122|
123|    const recordId = createResponse.body.data.id;
124|
125|    // Step 2: Finalize with override
126|    const finalizeResponse = await request(app)
127|      .post(`/api/nisab-year-records/${recordId}/finalize`)
128|      .set('Authorization', `Bearer ${authToken}`)
129|      .send({ override: true });
130|
131|    expect(finalizeResponse.status).toBe(200);
132|    expect(finalizeResponse.body.data.status).toBe('FINALIZED');
133|  });
134|
135|  it('should record FINALIZED event in audit trail', async () => {
136|    // Step 1: Create and finalize record
137|    const createResponse = await request(app)
138|      .post('/api/nisab-year-records')
139|      .set('Authorization', `Bearer ${authToken}`)
140|      .send({
141|        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
142|        hawlStartDateHijri: '1445-01-01',
143|        hawlCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
144|        hawlCompletionDateHijri: '1446-01-01',
145|        nisabBasis: 'GOLD',
146|        totalWealth: 12000,
147|        zakatableWealth: 12000,
148|        zakatAmount: 300,
149|      });
150|
151|    const recordId = createResponse.body.data.id;
152|
153|    await request(app)
154|      .post(`/api/nisab-year-records/${recordId}/finalize`)
155|      .set('Authorization', `Bearer ${authToken}`);
156|
157|    // Step 2: Check audit trail
158|    const auditResponse = await request(app)
159|      .get(`/api/nisab-year-records/${recordId}/audit-trail`)
160|      .set('Authorization', `Bearer ${authToken}`);
161|
162|    expect(auditResponse.status).toBe(200);
163|    
164|    const finalizedEvent = auditResponse.body.auditTrail.find(
165|      (entry: { eventType: string }) => entry.eventType === 'FINALIZED'
166|    );
167|
168|    expect(finalizedEvent).toBeDefined();
169|    expect(finalizedEvent.beforeState.status).toBe('DRAFT');
170|    expect(finalizedEvent.afterState.status).toBe('FINALIZED');
171|    expect(finalizedEvent.timestamp).toBeDefined();
172|  });
173|
174|  it('should prevent deletion of FINALIZED record', async () => {
175|    // Step 1: Create and finalize record
176|    const createResponse = await request(app)
177|      .post('/api/nisab-year-records')
178|      .set('Authorization', `Bearer ${authToken}`)
179|      .send({
180|        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
181|        hawlStartDateHijri: '1445-01-01',
182|        hawlCompletionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
183|        hawlCompletionDateHijri: '1446-01-01',
184|        nisabBasis: 'GOLD',
185|        totalWealth: 9000,
186|        zakatableWealth: 9000,
187|        zakatAmount: 225,
188|      });
189|
190|    const recordId = createResponse.body.data.id;
191|
192|    await request(app)
193|      .post(`/api/nisab-year-records/${recordId}/finalize`)
194|      .set('Authorization', `Bearer ${authToken}`);
195|
196|    // Step 2: Attempt to delete
197|    const deleteResponse = await request(app)
198|      .delete(`/api/nisab-year-records/${recordId}`)
199|      .set('Authorization', `Bearer ${authToken}`);
200|
201|    expect(deleteResponse.status).toBe(403);
202|    expect(deleteResponse.body.error).toContain('Cannot delete finalized record');
203|  });
204|
205|  it('should lock all financial values on finalization', async () => {
206|    // Step 1: Create DRAFT record
207|    const createResponse = await request(app)
208|      .post('/api/nisab-year-records')
209|      .set('Authorization', `Bearer ${authToken}`)
210|      .send({
211|        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
212|        hawlStartDateHijri: '1445-01-01',
213|        hawlCompletionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
214|        hawlCompletionDateHijri: '1446-01-01',
215|        nisabBasis: 'GOLD',
216|        totalWealth: 11000,
217|        zakatableWealth: 11000,
218|        zakatAmount: 275,
219|      });
220|
221|    const recordId = createResponse.body.data.id;
222|    const beforeWealth = createResponse.body.data.totalWealth;
223|    const beforeZakat = createResponse.body.data.zakatAmount;
224|
225|    // Step 2: Finalize
226|    await request(app)
227|      .post(`/api/nisab-year-records/${recordId}/finalize`)
228|      .set('Authorization', `Bearer ${authToken}`);
229|
230|    // Step 3: Verify values unchanged
231|    const afterResponse = await request(app)
232|      .get(`/api/nisab-year-records/${recordId}`)
233|      .set('Authorization', `Bearer ${authToken}`);
234|
235|    expect(afterResponse.body.data.totalWealth).toBe(beforeWealth);
236|    expect(afterResponse.body.data.zakatAmount).toBe(beforeZakat);
237|    expect(afterResponse.body.data.status).toBe('FINALIZED');
238|  });
239|
240|  it('should NOT allow re-finalization of already FINALIZED record', async () => {
241|    // Step 1: Create and finalize
242|    const createResponse = await request(app)
243|      .post('/api/nisab-year-records')
244|      .set('Authorization', `Bearer ${authToken}`)
245|      .send({
246|        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
247|        hawlStartDateHijri: '1445-01-01',
248|        hawlCompletionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
249|        hawlCompletionDateHijri: '1446-01-01',
250|        nisabBasis: 'GOLD',
251|        totalWealth: 10000,
252|        zakatableWealth: 10000,
253|        zakatAmount: 250,
254|      });
255|
256|    const recordId = createResponse.body.data.id;
257|
258|    await request(app)
259|      .post(`/api/nisab-year-records/${recordId}/finalize`)
260|      .set('Authorization', `Bearer ${authToken}`);
261|
262|    // Step 2: Attempt to finalize again
263|    const secondFinalizeResponse = await request(app)
264|      .post(`/api/nisab-year-records/${recordId}/finalize`)
265|      .set('Authorization', `Bearer ${authToken}`);
266|
267|    expect(secondFinalizeResponse.status).toBe(400);
268|    expect(secondFinalizeResponse.body.error).toContain('already finalized');
269|  });
270|
271|  it('should include finalizedAt timestamp', async () => {
272|    // Step 1: Create and finalize
273|    const createResponse = await request(app)
274|      .post('/api/nisab-year-records')
275|      .set('Authorization', `Bearer ${authToken}`)
276|      .send({
277|        hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
278|        hawlStartDateHijri: '1445-01-01',
279|        hawlCompletionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
280|        hawlCompletionDateHijri: '1446-01-01',
281|        nisabBasis: 'GOLD',
282|        totalWealth: 8500,
283|        zakatableWealth: 8500,
284|        zakatAmount: 212.5,
285|      });
286|
287|    const recordId = createResponse.body.data.id;
288|
289|    const beforeFinalize = Date.now();
290|
291|    const finalizeResponse = await request(app)
292|      .post(`/api/nisab-year-records/${recordId}/finalize`)
293|      .set('Authorization', `Bearer ${authToken}`);
294|
295|    const afterFinalize = Date.now();
296|
297|    const finalizedAt = new Date(finalizeResponse.body.data.finalizedAt);
298|
299|    expect(finalizedAt.getTime()).toBeGreaterThanOrEqual(beforeFinalize);
300|    expect(finalizedAt.getTime()).toBeLessThanOrEqual(afterFinalize);
301|  });
302|});
303|