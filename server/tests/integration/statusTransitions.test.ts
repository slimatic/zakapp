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
3| * T031: Integration Test - Status Transition Validation
4| * 
5| * Tests enforcement of valid state transitions and prevention of invalid ones.
6| * 
7| * @see specs/008-nisab-year-record/data-model.md - State transition rules
8| */
9|
10|import request from 'supertest';
11|import moment from 'moment';
12|import app from '../../src/app';
13|import { PrismaClient } from '@prisma/client';
14|
15|const prisma = new PrismaClient();
16|
17|describe('Integration: Status Transition Validation', () => {
18|  let authToken: string;
19|  let userId: string;
20|
21|  beforeAll(async () => {
22|    const registerResponse = await request(app)
23|      .post('/api/auth/register')
24|      .send({
25|        email: `transitions-${Date.now()}@example.com`,
26|        password: 'TestPass123!',
27|        confirmPassword: 'TestPass123!',
28|        firstName: 'Transitions',
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
43|  describe('Valid Transitions', () => {
44|    it('should allow DRAFT → FINALIZED transition', async () => {
45|      const createResponse = await request(app)
46|        .post('/api/nisab-year-records')
47|        .set('Authorization', `Bearer ${authToken}`)
48|        .send({
49|          hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
50|          hawlStartDateHijri: '1445-01-01',
51|          hawlCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
52|          hawlCompletionDateHijri: '1446-01-01',
53|          nisabBasis: 'GOLD',
54|          totalWealth: 10000,
55|          zakatableWealth: 10000,
56|          zakatAmount: 250,
57|        });
58|
59|      const recordId = createResponse.body.data.id;
60|      expect(createResponse.body.data.status).toBe('DRAFT');
61|
62|      const finalizeResponse = await request(app)
63|        .post(`/api/nisab-year-records/${recordId}/finalize`)
64|        .set('Authorization', `Bearer ${authToken}`);
65|
66|      expect(finalizeResponse.status).toBe(200);
67|      expect(finalizeResponse.body.data.status).toBe('FINALIZED');
68|    });
69|
70|    it('should allow FINALIZED → UNLOCKED transition', async () => {
71|      const createResponse = await request(app)
72|        .post('/api/nisab-year-records')
73|        .set('Authorization', `Bearer ${authToken}`)
74|        .send({
75|          hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
76|          hawlStartDateHijri: '1445-01-01',
77|          hawlCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
78|          hawlCompletionDateHijri: '1446-01-01',
79|          nisabBasis: 'GOLD',
80|          totalWealth: 9000,
81|          zakatableWealth: 9000,
82|          zakatAmount: 225,
83|        });
84|
85|      const recordId = createResponse.body.data.id;
86|
87|      await request(app)
88|        .post(`/api/nisab-year-records/${recordId}/finalize`)
89|        .set('Authorization', `Bearer ${authToken}`);
90|
91|      const unlockResponse = await request(app)
92|        .post(`/api/nisab-year-records/${recordId}/unlock`)
93|        .set('Authorization', `Bearer ${authToken}`)
94|        .send({ unlockReason: 'Valid reason for unlocking the record here' });
95|
96|      expect(unlockResponse.status).toBe(200);
97|      expect(unlockResponse.body.data.status).toBe('UNLOCKED');
98|    });
99|
100|    it('should allow UNLOCKED → FINALIZED transition (re-finalization)', async () => {
101|      const createResponse = await request(app)
102|        .post('/api/nisab-year-records')
103|        .set('Authorization', `Bearer ${authToken}`)
104|        .send({
105|          hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
106|          hawlStartDateHijri: '1445-01-01',
107|          hawlCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
108|          hawlCompletionDateHijri: '1446-01-01',
109|          nisabBasis: 'GOLD',
110|          totalWealth: 8000,
111|          zakatableWealth: 8000,
112|          zakatAmount: 200,
113|        });
114|
115|      const recordId = createResponse.body.data.id;
116|
117|      await request(app)
118|        .post(`/api/nisab-year-records/${recordId}/finalize`)
119|        .set('Authorization', `Bearer ${authToken}`);
120|
121|      await request(app)
122|        .post(`/api/nisab-year-records/${recordId}/unlock`)
123|        .set('Authorization', `Bearer ${authToken}`)
124|        .send({ unlockReason: 'Unlocking for necessary corrections' });
125|
126|      const refinalize = await request(app)
127|        .post(`/api/nisab-year-records/${recordId}/finalize`)
128|        .set('Authorization', `Bearer ${authToken}`);
129|
130|      expect(refinalize.status).toBe(200);
131|      expect(refinalize.body.data.status).toBe('FINALIZED');
132|    });
133|  });
134|
135|  describe('Invalid Transitions', () => {
136|    it('should NOT allow DRAFT → UNLOCKED transition', async () => {
137|      const createResponse = await request(app)
138|        .post('/api/nisab-year-records')
139|        .set('Authorization', `Bearer ${authToken}`)
140|        .send({
141|          hawlStartDate: new Date(),
142|          hawlStartDateHijri: '1445-01-01',
143|          hawlCompletionDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
144|          hawlCompletionDateHijri: '1446-01-01',
145|          nisabBasis: 'GOLD',
146|          totalWealth: 7000,
147|          zakatableWealth: 7000,
148|          zakatAmount: 175,
149|        });
150|
151|      const recordId = createResponse.body.data.id;
152|      expect(createResponse.body.data.status).toBe('DRAFT');
153|
154|      const unlockAttempt = await request(app)
155|        .post(`/api/nisab-year-records/${recordId}/unlock`)
156|        .set('Authorization', `Bearer ${authToken}`)
157|        .send({ unlockReason: 'Attempting invalid transition' });
158|
159|      expect(unlockAttempt.status).toBe(409);
160|      expect(unlockAttempt.body.message).toContain('Cannot unlock record');
161|    });
162|
163|    it('should NOT allow FINALIZED → DRAFT transition', async () => {
164|      const createResponse = await request(app)
165|        .post('/api/nisab-year-records')
166|        .set('Authorization', `Bearer ${authToken}`)
167|        .send({
168|          hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
169|          hawlStartDateHijri: '1445-01-01',
170|          hawlCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
171|          hawlCompletionDateHijri: '1446-01-01',
172|          nisabBasis: 'GOLD',
173|          totalWealth: 9000,
174|          zakatableWealth: 9000,
175|          zakatAmount: 225,
176|        });
177|
178|      const recordId = createResponse.body.data.id;
179|
180|      await request(app)
181|        .post(`/api/nisab-year-records/${recordId}/finalize`)
182|        .set('Authorization', `Bearer ${authToken}`);
183|
184|      // Attempt to manually update status to DRAFT
185|      const updateAttempt = await request(app)
186|        .put(`/api/nisab-year-records/${recordId}`)
187|        .set('Authorization', `Bearer ${authToken}`)
188|        .send({ status: 'DRAFT' });
189|
190|      expect([400, 403, 409]).toContain(updateAttempt.status);
191|      expect(updateAttempt.body.error).toBeDefined();
192|    });
193|
194|    it('should NOT allow UNLOCKED → DRAFT transition', async () => {
195|      const createResponse = await request(app)
196|        .post('/api/nisab-year-records')
197|        .set('Authorization', `Bearer ${authToken}`)
198|        .send({
199|          hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
200|          hawlStartDateHijri: '1445-01-01',
201|          hawlCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
202|          hawlCompletionDateHijri: '1446-01-01',
203|          nisabBasis: 'GOLD',
204|          totalWealth: 8500,
205|          zakatableWealth: 8500,
206|          zakatAmount: 212.5,
207|        });
208|
209|      const recordId = createResponse.body.data.id;
210|
211|      await request(app)
212|        .post(`/api/nisab-year-records/${recordId}/finalize`)
213|        .set('Authorization', `Bearer ${authToken}`);
214|
215|      await request(app)
216|        .post(`/api/nisab-year-records/${recordId}/unlock`)
217|        .set('Authorization', `Bearer ${authToken}`)
218|        .send({ unlockReason: 'Unlocking for corrections' });
219|
220|      // Attempt to set status to DRAFT
221|      const updateAttempt = await request(app)
222|        .put(`/api/nisab-year-records/${recordId}`)
223|        .set('Authorization', `Bearer ${authToken}`)
224|        .send({ status: 'DRAFT' });
225|
226|      expect([400, 403, 409]).toContain(updateAttempt.status);
227|    });
228|
229|    it('should NOT allow direct status field updates', async () => {
230|      const createResponse = await request(app)
231|        .post('/api/nisab-year-records')
232|        .set('Authorization', `Bearer ${authToken}`)
233|        .send({
234|          hawlStartDate: new Date(),
235|          hawlStartDateHijri: '1445-01-01',
236|          hawlCompletionDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
237|          hawlCompletionDateHijri: '1446-01-01',
238|          nisabBasis: 'GOLD',
239|          totalWealth: 7500,
240|          zakatableWealth: 7500,
241|          zakatAmount: 187.5,
242|        });
243|
244|      const recordId = createResponse.body.data.id;
245|
246|      const updateAttempt = await request(app)
247|        .put(`/api/nisab-year-records/${recordId}`)
248|        .set('Authorization', `Bearer ${authToken}`)
249|        .send({ status: 'FINALIZED' });
250|
251|      expect(updateAttempt.status).toBe(400);
252|      expect(updateAttempt.body.message).toContain('Status can only be changed via finalize/unlock endpoints');
253|    });
254|  });
255|
256|  describe('State Transition Constraints', () => {
257|    it('should maintain status integrity across multiple operations', async () => {
258|      const createResponse = await request(app)
259|        .post('/api/nisab-year-records')
260|        .set('Authorization', `Bearer ${authToken}`)
261|        .send({
262|          hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
263|          hawlStartDateHijri: '1445-01-01',
264|          hawlCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
265|          hawlCompletionDateHijri: '1446-01-01',
266|          nisabBasis: 'GOLD',
267|          totalWealth: 10000,
268|          zakatableWealth: 10000,
269|          zakatAmount: 250,
270|        });
271|
272|      const recordId = createResponse.body.data.id;
273|
274|      // Check status at each stage
275|      let record = await request(app)
276|        .get(`/api/nisab-year-records/${recordId}`)
277|        .set('Authorization', `Bearer ${authToken}`);
278|      expect(record.body.data.status).toBe('DRAFT');
279|
280|      await request(app)
281|        .post(`/api/nisab-year-records/${recordId}/finalize`)
282|        .set('Authorization', `Bearer ${authToken}`);
283|
284|      record = await request(app)
285|        .get(`/api/nisab-year-records/${recordId}`)
286|        .set('Authorization', `Bearer ${authToken}`);
287|      expect(record.body.data.status).toBe('FINALIZED');
288|
289|      await request(app)
290|        .post(`/api/nisab-year-records/${recordId}/unlock`)
291|        .set('Authorization', `Bearer ${authToken}`)
292|        .send({ unlockReason: 'Correction needed after review' });
293|
294|      record = await request(app)
295|        .get(`/api/nisab-year-records/${recordId}`)
296|        .set('Authorization', `Bearer ${authToken}`);
297|      expect(record.body.data.status).toBe('UNLOCKED');
298|    });
299|
300|    it('should prevent concurrent status changes', async () => {
301|      // This test would require actual concurrent requests
302|      // Simplified version: verify atomic transitions
303|      
304|      const createResponse = await request(app)
305|        .post('/api/nisab-year-records')
306|        .set('Authorization', `Bearer ${authToken}`)
307|        .send({
308|          hawlStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
309|          hawlStartDateHijri: '1445-01-01',
310|          hawlCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
311|          hawlCompletionDateHijri: '1446-01-01',
312|          nisabBasis: 'GOLD',
313|          totalWealth: 9500,
314|          zakatableWealth: 9500,
315|          zakatAmount: 237.5,
316|        });
317|
318|      const recordId = createResponse.body.data.id;
319|
320|      const finalize1 = request(app)
321|        .post(`/api/nisab-year-records/${recordId}/finalize`)
322|        .set('Authorization', `Bearer ${authToken}`);
323|
324|      const finalize2 = request(app)
325|        .post(`/api/nisab-year-records/${recordId}/finalize`)
326|        .set('Authorization', `Bearer ${authToken}`);
327|
328|      const results = await Promise.all([finalize1, finalize2]);
329|
330|      // One should succeed, one should fail (already finalized)
331|      const statuses = results.map(r => r.status);
332|      expect(statuses).toContain(200);
333|      expect(statuses.filter(s => s === 400 || s === 409).length).toBeGreaterThanOrEqual(1);
334|    });
335|  });
336|});
337|