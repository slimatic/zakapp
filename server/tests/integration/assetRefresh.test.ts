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

1|import { describe, it, expect, beforeEach, afterEach, afterAll, vi, type Mock } from 'vitest';
2|/**
3| * Integration Test: Asset Refresh Workflow
4| * Purpose: Test asset refresh functionality for DRAFT Nisab Year Records
5| * Requirements: FR-032a
6| * Expected: FAIL (endpoint doesn't exist yet) - TDD approach
7| */
8|
9|import request from 'supertest';
10|import { app } from '../../src/app';
11|import { prisma } from '../../src/lib/prisma';
12|import { EncryptionService } from '../../src/services/EncryptionService';
13|import { authHelpers } from '../helpers/authHelpers';
14|import { assetHelpers } from '../helpers/assetHelpers';
15|
16|describe('Asset Refresh Workflow Integration Test', () => {
17|  let authToken: string;
18|  let userId: string;
19|
20|  beforeEach(async () => {
21|    // Create test user and get auth token
22|    const authResult = await authHelpers.createAuthenticatedUser();
23|    authToken = authResult.token;
24|    userId = authResult.userId;
25|  });
26|
27|  afterEach(async () => {
28|    if (userId) {
29|      await prisma.yearlySnapshot.deleteMany({ where: { userId } });
30|      await prisma.asset.deleteMany({ where: { userId } });
31|      await prisma.user.deleteMany({ where: { id: userId } });
32|    }
33|  });
34|
35|  afterAll(async () => {
36|    await prisma.$disconnect();
37|  });
38|
39|  describe('GET /api/nisab-year-records/:id/assets/refresh', () => {
40|    it('should return current assets for DRAFT record', async () => {
41|      // Step 1: Create initial assets
42|      const initialAssets = [
43|        {
44|          name: 'Initial Cash',
45|          category: 'cash',
46|          value: 5000,
47|          isZakatable: true,
48|        },
49|        {
50|          name: 'Initial Bitcoin',
51|          category: 'crypto',
52|          value: 3000,
53|          isZakatable: true,
54|        },
55|      ];
56|
57|      const createdAssets = await Promise.all(
58|        initialAssets.map((asset) =>
59|          assetHelpers.createAsset(userId, asset, authToken)
60|        )
61|      );
62|
63|      // Step 2: Create DRAFT Nisab Year Record with asset snapshot
64|      const initialSnapshot = {
65|        assets: createdAssets.map((asset) => ({
66|          id: asset.id,
67|          name: asset.name,
68|          category: asset.category,
69|          value: asset.value,
70|          isZakatable: asset.isZakatable,
71|          addedAt: asset.createdAt,
72|        })),
73|        capturedAt: new Date().toISOString(),
74|        totalWealth: 8000,
75|        zakatableWealth: 8000,
76|      };
77|
78|      const record = await prisma.yearlySnapshot.create({
79|        data: {
80|          userId,
81|          hawlStartDate: new Date('2025-01-01'),
82|          hawlStartDateHijri: '1446-06-01',
83|          hawlCompletionDate: new Date('2025-12-20'),
84|          hawlCompletionDateHijri: '1447-06-01',
85|          nisabThresholdAtStart: JSON.stringify(EncryptionService.encrypt('5000')),
86|          nisabBasis: 'gold',
87|          calculationDate: new Date('2025-01-01'),
88|          gregorianYear: 2025,
89|          gregorianMonth: 1,
90|          gregorianDay: 1,
91|          hijriYear: 1446,
92|          hijriMonth: 6,
93|          hijriDay: 1,
94|          totalWealth: JSON.stringify(EncryptionService.encrypt('8000')),
95|          totalLiabilities: JSON.stringify(EncryptionService.encrypt('0')),
96|          zakatableWealth: JSON.stringify(EncryptionService.encrypt('8000')),
97|          zakatAmount: JSON.stringify(EncryptionService.encrypt('200')),
98|          methodologyUsed: 'standard',
99|          status: 'DRAFT',
100|          assetBreakdown: JSON.stringify(EncryptionService.encrypt(JSON.stringify(initialSnapshot))),
101|          calculationDetails: JSON.stringify(EncryptionService.encrypt(JSON.stringify({}))),
102|          isPrimary: false,
103|          nisabThreshold: JSON.stringify(EncryptionService.encrypt('5000')),
104|          nisabType: 'gold',
105|        },
106|      });
107|
108|      // Step 3: Add new asset to user
109|      const newAsset = await assetHelpers.createAsset(
110|        userId,
111|        {
112|          name: 'New Gold Investment',
113|          category: 'gold',
114|          value: 2500,
115|          isZakatable: true,
116|        },
117|        authToken
118|      );
119|
120|      // Step 4: Call refresh endpoint
121|      const response = await request(app)
122|        .get(`/api/nisab-year-records/${record.id}/assets/refresh`)
123|        .set('Authorization', `Bearer ${authToken}`)
124|        .expect(200);
125|
126|      // Step 5: Verify response includes NEW asset
127|      expect(response.body.success).toBe(true);
128|      expect(response.body.data.assets).toHaveLength(3);
129|      
130|      const assetNames = response.body.data.assets.map((a: any) => a.name);
131|      expect(assetNames).toContain('Initial Cash');
132|      expect(assetNames).toContain('Initial Bitcoin');
133|      expect(assetNames).toContain('New Gold Investment');
134|
135|      // Verify asset structure
136|      const goldAsset = response.body.data.assets.find(
137|        (a: any) => a.name === 'New Gold Investment'
138|      );
139|      expect(goldAsset).toMatchObject({
140|        id: newAsset.id,
141|        name: 'New Gold Investment',
142|        category: 'gold',
143|        value: 2500,
144|        isZakatable: true,
145|      });
146|      expect(goldAsset.addedAt).toBeDefined();
147|
148|      // Verify totals returned include zakatableValue and zakatableWealth matches sum of zakatableValue
149|      // All created assets are fully zakatable (modifier 1.0) so zakatableWealth should equal total wealth
150|      expect(response.body.data).toHaveProperty('totalWealth');
151|      expect(response.body.data).toHaveProperty('zakatableWealth');
152|      expect(response.body.data.totalWealth).toBe(5000 + 3000 + 2500);
153|      expect(response.body.data.zakatableWealth).toBe(5000 + 3000 + 2500);
154|
155|      // Step 6: Verify record is NOT updated (refresh doesn't persist)
156|      const unchangedRecord = await prisma.yearlySnapshot.findUnique({
157|        where: { id: record.id },
158|      });
159|      
160|      const storedSnapshot = JSON.parse(
161|        EncryptionService.decrypt(unchangedRecord!.assetBreakdown)
162|      );
163|      expect(storedSnapshot.assets).toHaveLength(2); // Still original 2 assets
164|    });
165|
166|    it('should return 400 for FINALIZED record', async () => {
167|      // Create FINALIZED record
168|      const record = await prisma.yearlySnapshot.create({
169|        data: {
170|          userId,
171|          hawlStartDate: new Date('2024-01-01'),
172|          hawlStartDateHijri: '1445-06-01',
173|          hawlCompletionDate: new Date('2024-12-20'),
174|          hawlCompletionDateHijri: '1446-06-01',
175|          nisabThresholdAtStart: JSON.stringify(EncryptionService.encrypt('5000')),
176|          nisabBasis: 'gold',
177|          calculationDate: new Date('2024-12-20'),
178|          gregorianYear: 2024,
179|          gregorianMonth: 12,
180|          gregorianDay: 20,
181|          hijriYear: 1446,
182|          hijriMonth: 6,
183|          hijriDay: 1,
184|          totalWealth: JSON.stringify(EncryptionService.encrypt('10000')),
185|          totalLiabilities: JSON.stringify(EncryptionService.encrypt('0')),
186|          zakatableWealth: JSON.stringify(EncryptionService.encrypt('10000')),
187|          zakatAmount: JSON.stringify(EncryptionService.encrypt('250')),
188|          methodologyUsed: 'standard',
189|          status: 'FINALIZED',
190|          finalizedAt: new Date('2024-12-20'),
191|          assetBreakdown: JSON.stringify(EncryptionService.encrypt(JSON.stringify({ assets: [] }))),
192|          calculationDetails: JSON.stringify(EncryptionService.encrypt(JSON.stringify({}))),
193|          isPrimary: false,
194|          nisabThreshold: JSON.stringify(EncryptionService.encrypt('5000')),
195|          nisabType: 'gold',
196|        },
197|      });
198|
199|      // Try to refresh FINALIZED record
200|      const response = await request(app)
201|        .get(`/api/nisab-year-records/${record.id}/assets/refresh`)
202|        .set('Authorization', `Bearer ${authToken}`)
203|        .expect(400);
204|
205|      expect(response.body.success).toBe(false);
206|      expect(response.body.error).toContain('INVALID_STATUS');
207|      expect(response.body.message).toMatch(/Can only refresh assets for DRAFT records/i);
208|    });
209|
210|    it('should return 400 for UNLOCKED record', async () => {
211|      // Create UNLOCKED record
212|      const record = await prisma.yearlySnapshot.create({
213|        data: {
214|          userId,
215|          hawlStartDate: new Date('2024-01-01'),
216|          hawlStartDateHijri: '1445-06-01',
217|          hawlCompletionDate: new Date('2024-12-20'),
218|          hawlCompletionDateHijri: '1446-06-01',
219|          nisabThresholdAtStart: JSON.stringify(EncryptionService.encrypt('5000')),
220|          nisabBasis: 'gold',
221|          calculationDate: new Date('2024-12-20'),
222|          gregorianYear: 2024,
223|          gregorianMonth: 12,
224|          gregorianDay: 20,
225|          hijriYear: 1446,
226|          hijriMonth: 6,
227|          hijriDay: 1,
228|          totalWealth: JSON.stringify(EncryptionService.encrypt('10000')),
229|          totalLiabilities: JSON.stringify(EncryptionService.encrypt('0')),
230|          zakatableWealth: JSON.stringify(EncryptionService.encrypt('10000')),
231|          zakatAmount: JSON.stringify(EncryptionService.encrypt('250')),
232|          methodologyUsed: 'standard',
233|          status: 'UNLOCKED',
234|          finalizedAt: new Date('2024-12-20'),
235|          assetBreakdown: JSON.stringify(EncryptionService.encrypt(JSON.stringify({ assets: [] }))),
236|          calculationDetails: JSON.stringify(EncryptionService.encrypt(JSON.stringify({}))),
237|          isPrimary: false,
238|          nisabThreshold: JSON.stringify(EncryptionService.encrypt('5000')),
239|          nisabType: 'gold',
240|        },
241|      });
242|
243|      // Try to refresh UNLOCKED record
244|      const response = await request(app)
245|        .get(`/api/nisab-year-records/${record.id}/assets/refresh`)
246|        .set('Authorization', `Bearer ${authToken}`)
247|        .expect(400);
248|
249|      expect(response.body.success).toBe(false);
250|      expect(response.body.error).toBe('INVALID_STATUS');
251|    });
252|
253|    it('should return 404 for non-existent record', async () => {
254|      const fakeId = 'clxxxxxxxxxxxxxxxxxxxxxxxx';
255|
256|      await request(app)
257|        .get(`/api/nisab-year-records/${fakeId}/assets/refresh`)
258|        .set('Authorization', `Bearer ${authToken}`)
259|        .expect(404);
260|    });
261|
262|    it('should return 403 when accessing another user\'s record', async () => {
263|      // Create another user
264|      const otherUser = await authHelpers.createAuthenticatedUser();
265|
266|      // Create record for other user
267|      const record = await prisma.yearlySnapshot.create({
268|        data: {
269|          userId: otherUser.userId,
270|          hawlStartDate: new Date('2025-01-01'),
271|          hawlStartDateHijri: '1446-06-01',
272|          hawlCompletionDate: new Date('2025-12-20'),
273|          hawlCompletionDateHijri: '1447-06-01',
274|          nisabThresholdAtStart: JSON.stringify(EncryptionService.encrypt('5000')),
275|          nisabBasis: 'gold',
276|          calculationDate: new Date('2025-01-01'),
277|          gregorianYear: 2025,
278|          gregorianMonth: 1,
279|          gregorianDay: 1,
280|          hijriYear: 1446,
281|          hijriMonth: 6,
282|          hijriDay: 1,
283|          totalWealth: JSON.stringify(EncryptionService.encrypt('10000')),
284|          totalLiabilities: JSON.stringify(EncryptionService.encrypt('0')),
285|          zakatableWealth: JSON.stringify(EncryptionService.encrypt('10000')),
286|          zakatAmount: JSON.stringify(EncryptionService.encrypt('250')),
287|          methodologyUsed: 'standard',
288|          status: 'DRAFT',
289|          assetBreakdown: JSON.stringify(EncryptionService.encrypt(JSON.stringify({ assets: [] }))),
290|          calculationDetails: JSON.stringify(EncryptionService.encrypt(JSON.stringify({}))),
291|          isPrimary: false,
292|          nisabThreshold: JSON.stringify(EncryptionService.encrypt('5000')),
293|          nisabType: 'gold',
294|        },
295|      });
296|
297|      // Try to access with original user's token
298|      await request(app)
299|        .get(`/api/nisab-year-records/${record.id}/assets/refresh`)
300|        .set('Authorization', `Bearer ${authToken}`)
301|        .expect(403);
302|    });
303|
304|    it('should handle assets deleted after record creation', async () => {
305|      // Create assets
306|      const assets = await Promise.all([
307|        assetHelpers.createAsset(
308|          userId,
309|          { name: 'Asset 1', category: 'cash', value: 5000, isZakatable: true },
310|          authToken
311|        ),
312|        assetHelpers.createAsset(
313|          userId,
314|          { name: 'Asset 2', category: 'crypto', value: 3000, isZakatable: true },
315|          authToken
316|        ),
317|      ]);
318|
319|      // Create DRAFT record
320|      const record = await prisma.yearlySnapshot.create({
321|        data: {
322|          userId,
323|          hawlStartDate: new Date('2025-01-01'),
324|          hawlStartDateHijri: '1446-06-01',
325|          hawlCompletionDate: new Date('2025-12-20'),
326|          hawlCompletionDateHijri: '1447-06-01',
327|          nisabThresholdAtStart: JSON.stringify(EncryptionService.encrypt('5000')),
328|          nisabBasis: 'gold',
329|          calculationDate: new Date('2025-01-01'),
330|          gregorianYear: 2025,
331|          gregorianMonth: 1,
332|          gregorianDay: 1,
333|          hijriYear: 1446,
334|          hijriMonth: 6,
335|          hijriDay: 1,
336|          totalWealth: JSON.stringify(EncryptionService.encrypt('8000')),
337|          totalLiabilities: JSON.stringify(EncryptionService.encrypt('0')),
338|          zakatableWealth: JSON.stringify(EncryptionService.encrypt('8000')),
339|          zakatAmount: JSON.stringify(EncryptionService.encrypt('200')),
340|          methodologyUsed: 'standard',
341|          status: 'DRAFT',
342|          assetBreakdown: JSON.stringify(EncryptionService.encrypt(JSON.stringify({ assets: [] }))),
343|          calculationDetails: JSON.stringify(EncryptionService.encrypt(JSON.stringify({}))),
344|          isPrimary: false,
345|          nisabThreshold: JSON.stringify(EncryptionService.encrypt('5000')),
346|          nisabType: 'gold',
347|        },
348|      });
349|
350|      // Delete one asset
351|      await prisma.asset.delete({ where: { id: assets[1].id } });
352|
353|      // Refresh should return only remaining asset
354|      const response = await request(app)
355|        .get(`/api/nisab-year-records/${record.id}/assets/refresh`)
356|        .set('Authorization', `Bearer ${authToken}`)
357|        .expect(200);
358|
359|      expect(response.body.data.assets).toHaveLength(1);
360|      expect(response.body.data.assets[0].name).toBe('Asset 1');
361|    });
362|
363|    it('should only return zakatable assets', async () => {
364|      // Create mix of zakatable and non-zakatable assets
365|      await assetHelpers.createAsset(
366|        userId,
367|        { name: 'Cash', category: 'cash', value: 5000, isZakatable: true },
368|        authToken
369|      );
370|      // Add a passive asset to ensure zakatableValue is lower
371|      await assetHelpers.createAsset(
372|        userId,
373|        { name: 'Passive Fund', category: 'stocks', value: 6000, isZakatable: true, isPassiveInvestment: true },
374|        authToken
375|      );
376|      await assetHelpers.createAsset(
377|        userId,
378|        { name: 'House', category: 'property', value: 250000, isZakatable: false },
379|        authToken
380|      );
381|      await assetHelpers.createAsset(
382|        userId,
383|        { name: 'Gold', category: 'gold', value: 3000, isZakatable: true },
384|        authToken
385|      );
386|
387|      // Create DRAFT record
388|      const record = await prisma.yearlySnapshot.create({
389|        data: {
390|          userId,
391|          hawlStartDate: new Date('2025-01-01'),
392|          hawlStartDateHijri: '1446-06-01',
393|          hawlCompletionDate: new Date('2025-12-20'),
394|          hawlCompletionDateHijri: '1447-06-01',
395|          nisabThresholdAtStart: JSON.stringify(EncryptionService.encrypt('5000')),
396|          nisabBasis: 'gold',
397|          calculationDate: new Date('2025-01-01'),
398|          gregorianYear: 2025,
399|          gregorianMonth: 1,
400|          gregorianDay: 1,
401|          hijriYear: 1446,
402|          hijriMonth: 6,
403|          hijriDay: 1,
404|          totalWealth: JSON.stringify(EncryptionService.encrypt('8000')),
405|          totalLiabilities: JSON.stringify(EncryptionService.encrypt('0')),
406|          zakatableWealth: JSON.stringify(EncryptionService.encrypt('8000')),
407|          zakatAmount: JSON.stringify(EncryptionService.encrypt('200')),
408|          methodologyUsed: 'standard',
409|          status: 'DRAFT',
410|          assetBreakdown: JSON.stringify(EncryptionService.encrypt(JSON.stringify({ assets: [] }))),
411|          calculationDetails: JSON.stringify(EncryptionService.encrypt(JSON.stringify({}))),
412|          isPrimary: false,
413|          nisabThreshold: JSON.stringify(EncryptionService.encrypt('5000')),
414|          nisabType: 'gold',
415|        },
416|      });
417|
418|      // Refresh should return only zakatable assets
419|      const response = await request(app)
420|        .get(`/api/nisab-year-records/${record.id}/assets/refresh`)
421|        .set('Authorization', `Bearer ${authToken}`)
422|        .expect(200);
423|
424|      expect(response.body.data).toBeDefined();
425|      // Should include three zakatable assets (Cash, Passive Fund, Gold)
426|      expect(response.body.data.assets).toHaveLength(3);
427|      const assetNames = response.body.data.assets.map((a: any) => a.name);
428|      expect(assetNames).toContain('Cash');
429|      expect(assetNames).toContain('Gold');
430|      expect(assetNames).toContain('Passive Fund');
431|      expect(assetNames).not.toContain('House');
432|
433|      // Verify Passive Fund has a reduced zakatableValue (0.3 * 6000 = 1800)
434|      const passive = response.body.data.assets.find((a: any) => a.name === 'Passive Fund');
435|      expect(passive).toBeDefined();
436|      expect(passive.zakatableValue).toBe(6000 * 0.3);
437|
438|      // Verify the returned zakatableWealth equals the sum of per-asset zakatableValue
439|      const expectedZakatable = response.body.data.assets.reduce((s: number, a: any) => s + (a.zakatableValue ?? a.value), 0);
440|      expect(response.body.data.zakatableWealth).toBe(expectedZakatable);
441|    });
442|
443|    it('should allow updating record with refreshed assets and persist zakatable wealth correctly', async () => {
444|      // Create assets including a passive one
445|      const a1 = await assetHelpers.createAsset(userId, { name: 'Cash', category: 'cash', value: 600, isZakatable: true }, authToken);
446|      const a2 = await assetHelpers.createAsset(userId, { name: 'Passive Stock', category: 'stocks', value: 6000, isZakatable: true, isPassiveInvestment: true }, authToken);
447|
448|      // Create DRAFT record
449|      const record = await prisma.yearlySnapshot.create({
450|        data: {
451|          userId,
452|          hawlStartDate: new Date('2025-01-01'),
453|          hawlStartDateHijri: '1446-06-01',
454|          hawlCompletionDate: new Date('2025-12-20'),
455|          hawlCompletionDateHijri: '1447-06-01',
456|          nisabThresholdAtStart: JSON.stringify(EncryptionService.encrypt('5000')),
457|          nisabBasis: 'gold',
458|          calculationDate: new Date('2025-01-01'),
459|          gregorianYear: 2025,
460|          gregorianMonth: 1,
461|          gregorianDay: 1,
462|          hijriYear: 1446,
463|          hijriMonth: 6,
464|          hijriDay: 1,
465|          totalWealth: JSON.stringify(EncryptionService.encrypt('0')),
466|          totalLiabilities: JSON.stringify(EncryptionService.encrypt('0')),
467|          zakatableWealth: JSON.stringify(EncryptionService.encrypt('0')),
468|          zakatAmount: JSON.stringify(EncryptionService.encrypt('0')),
469|          methodologyUsed: 'standard',
470|          status: 'DRAFT',
471|          assetBreakdown: JSON.stringify(EncryptionService.encrypt(JSON.stringify({ assets: [] }))),
472|          calculationDetails: JSON.stringify(EncryptionService.encrypt(JSON.stringify({}))),
473|          isPrimary: false,
474|          nisabThreshold: JSON.stringify(EncryptionService.encrypt('5000')),
475|          nisabType: 'gold',
476|        }
477|      });
478|
479|      // Refresh to get current assets
480|      const refreshRes = await request(app)
481|        .get(`/api/nisab-year-records/${record.id}/assets/refresh`)
482|        .set('Authorization', `Bearer ${authToken}`)
483|        .expect(200);
484|
485|      const available = refreshRes.body.data.assets;
486|      // Select all assets returned
487|      const selected = available.map((a: any) => a);
488|
489|      const totalWealth = selected.reduce((s: number, a: any) => s + a.value, 0);
490|      const zakatableWealth = selected.reduce((s: number, a: any) => s + (a.zakatableValue ?? a.value), 0);
491|      const zakatAmount = zakatableWealth * 0.025;
492|
493|      // Update the record with assetBreakdown including zakatableValue
494|      await request(app)
495|        .put(`/api/nisab-year-records/${record.id}`)
496|        .set('Authorization', `Bearer ${authToken}`)
497|        .send({
498|          assetBreakdown: {
499|            assets: selected.map((a: any) => ({ id: a.id, name: a.name, category: a.category, value: a.value, isZakatable: a.isZakatable, zakatableValue: a.zakatableValue, calculationModifier: a.calculationModifier, addedAt: a.addedAt })),
500|            capturedAt: new Date().toISOString(),
501|            totalWealth,
502|            zakatableWealth,
503|          },
504|          totalWealth: totalWealth.toString(),
505|          zakatableWealth: zakatableWealth.toString(),
506|          zakatAmount: zakatAmount.toString(),
507|        })
508|        .expect(200);
509|
510|      // Read the stored record and verify encrypted assetBreakdown was saved and contains correct zakatableWealth
511|      const stored = await prisma.yearlySnapshot.findUnique({ where: { id: record.id } });
512|      const decrypted = JSON.parse(EncryptionService.decrypt(stored!.assetBreakdown));
513|      expect(Number(decrypted.zakatableWealth)).toBe(zakatableWealth);
514|    });
515|
516|    it('should require authentication', async () => {
517|      await request(app)
518|        .get('/api/nisab-year-records/some-id/assets/refresh')
519|        .expect(401);
520|    });
521|  });
522|});
523|