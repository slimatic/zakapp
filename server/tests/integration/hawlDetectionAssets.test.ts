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

1|import { vi, type Mock, describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
2|/**
3| * Integration Test: Automatic Asset Inclusion in Background Job
4| * Purpose: Test that Hawl detection job automatically includes assets in DRAFT records
5| * Requirements: FR-014, FR-011a
6| * Expected: FAIL (asset snapshot logic doesn't exist yet) - TDD approach
7| */
8|
9|import { prisma } from '../../src/lib/prisma';
10|import { EncryptionService } from '../../src/services/EncryptionService';
11|import { HawlTrackingService } from '../../src/services/hawlTrackingService';
12|import { authHelpers } from '../helpers/authHelpers';
13|import { assetHelpers } from '../helpers/assetHelpers';
14|
15|// Type for asset breakdown structure
16|interface AssetSnapshotItem {
17|  id: string;
18|  name: string;
19|  category: string;
20|  value: number;
21|  isZakatable: boolean;
22|  addedAt: string | Date;
23|}
24|
25|interface AssetBreakdown {
26|  assets: AssetSnapshotItem[];
27|  capturedAt: string;
28|  totalWealth: number;
29|  zakatableWealth: number;
30|}
31|
32|describe('Automatic Asset Inclusion in Hawl Detection', () => {
33|  let hawlTrackingService: HawlTrackingService;
34|  let userId: string;
35|  let authToken: string;
36|
37|  beforeAll(async () => {
38|    hawlTrackingService = new HawlTrackingService();
39|  });
40|
41|  beforeEach(async () => {
42|    // Clean specific tables that might conflict
43|    await prisma.preciousMetalPrice.deleteMany();
44|    
45|    // Create test user
46|    const authResult = await authHelpers.createAuthenticatedUser();
47|    userId = authResult.userId;
48|    authToken = authResult.token;
49|
50|    // Set up Nisab threshold (using gold: 87.48g * $70/g = $6,123.60)
51|    await prisma.preciousMetalPrice.create({
52|      data: {
53|        metalType: 'gold',
54|        pricePerGram: 70.0,
55|        currency: 'USD',
56|        fetchedAt: new Date(),
57|        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
58|      },
59|    });
60|    
61|    // Set Silver price high enough so Silver Nisab is NOT lower than Gold Nisab
62|    // Silver Nisab = 612.36g. If price is $10/g -> $6,123.60.
63|    // This forces the system to treat ~$6,123 as the effective threshold, 
64|    // ensuring 3000 or 5000 doesn't trigger "low nisab" creation.
65|    await prisma.preciousMetalPrice.create({
66|      data: {
67|        metalType: 'silver',
68|        pricePerGram: 10.0,
69|        currency: 'USD',
70|        fetchedAt: new Date(),
71|        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
72|      },
73|    });
74|  });
75|
76|  afterEach(async () => {
77|    // Clean up resources for this specific user
78|    if (userId) {
79|      await prisma.yearlySnapshot.deleteMany({ where: { userId } });
80|      await prisma.asset.deleteMany({ where: { userId } });
81|      await prisma.user.deleteMany({ where: { id: userId } });
82|    }
83|    await prisma.preciousMetalPrice.deleteMany();
84|  });
85|
86|  afterAll(async () => {
87|    await prisma.$disconnect();
88|  });
89|
90|  describe('Asset Snapshot Creation', () => {
91|    it('should create DRAFT record with assetBreakdown populated when Nisab achieved', async () => {
92|      // Create assets that exceed Nisab threshold ($6,123.60)
93|      const assets = await Promise.all([
94|        assetHelpers.createAsset(
95|          userId,
96|          {
97|            name: 'Savings Account',
98|            category: 'CASH',
99|            value: 5000,
100|            isZakatable: true,
101|          },
102|          authToken
103|        ),
104|        assetHelpers.createAsset(
105|          userId,
106|          {
107|            name: 'Bitcoin',
108|            category: 'CRYPTO',
109|            value: 3000,
110|            isZakatable: true,
111|          },
112|          authToken
113|        ),
114|        assetHelpers.createAsset(
115|          userId,
116|          {
117|            name: 'Gold Jewelry',
118|        category: 'gold',
119|            value: 2500,
120|            isZakatable: true,
121|          },
122|          authToken
123|        ),
124|      ]);
125|      // Total: 10,500 > Nisab threshold of 6,123.60
126|
127|      // Run Hawl detection job
128|      await hawlTrackingService.detectNisabAchievement();
129|
130|      // Verify DRAFT record was created
131|      const records = await prisma.yearlySnapshot.findMany({
132|        where: { userId },
133|      });
134|
135|      expect(records).toHaveLength(1);
136|      const record = records[0];
137|
138|      expect(record.status).toBe('DRAFT');
139|      expect(record.assetBreakdown).toBeTruthy();
140|
141|      // Decrypt and verify asset breakdown
142|      const assetBreakdown: AssetBreakdown = JSON.parse(
143|        EncryptionService.decrypt(record.assetBreakdown)
144|      );
145|
146|      // Verify JSON structure
147|      expect(assetBreakdown).toHaveProperty('assets');
148|      expect(assetBreakdown).toHaveProperty('capturedAt');
149|      expect(assetBreakdown).toHaveProperty('totalWealth');
150|      expect(assetBreakdown).toHaveProperty('zakatableWealth');
151|
152|      // Verify all zakatable assets included
153|      expect(assetBreakdown.assets).toHaveLength(3);
154|
155|      const assetIds = assetBreakdown.assets.map((a: AssetSnapshotItem) => a.id);
156|      expect(assetIds).toContain(assets[0].id);
157|      expect(assetIds).toContain(assets[1].id);
158|      expect(assetIds).toContain(assets[2].id);
159|
160|      // Verify each asset has required fields
161|      assetBreakdown.assets.forEach((asset: AssetSnapshotItem) => {
162|        expect(asset).toHaveProperty('id');
163|        expect(asset).toHaveProperty('name');
164|        expect(asset).toHaveProperty('category');
165|        expect(asset).toHaveProperty('value');
166|        expect(asset).toHaveProperty('isZakatable');
167|        expect(asset).toHaveProperty('addedAt');
168|      });
169|
170|      // Verify totals
171|      expect(assetBreakdown.totalWealth).toBe(10500);
172|      expect(assetBreakdown.zakatableWealth).toBe(10500);
173|
174|      // Verify capturedAt is recent
175|      const capturedAt = new Date(assetBreakdown.capturedAt);
176|      const now = new Date();
177|      const diff = now.getTime() - capturedAt.getTime();
178|      expect(diff).toBeLessThan(5000); // Within 5 seconds
179|    });
180|
181|    it('should include correct asset details in snapshot', async () => {
182|      // Create specific asset with known values
183|      const asset = await assetHelpers.createAsset(
184|        userId,
185|        {
186|          name: 'Test Gold Bar',
187|          category: 'GOLD',
188|          value: 7500.50,
189|          isZakatable: true,
190|        },
191|        authToken
192|      );
193|
194|      // Run Hawl detection job
195|      await hawlTrackingService.detectNisabAchievement();
196|
197|      // Get created record
198|      const record = await prisma.yearlySnapshot.findFirst({
199|        where: { userId },
200|      });
201|
202|      expect(record).toBeTruthy();
203|
204|      const assetBreakdown = JSON.parse(
205|        EncryptionService.decrypt(record!.assetBreakdown)
206|      );
207|
208|      const snapshotAsset = assetBreakdown.assets[0];
209|
210|      expect(snapshotAsset).toMatchObject({
211|        id: asset.id,
212|        name: 'Test Gold Bar',
213|        category: 'gold',
214|        value: 7500.50,
215|        isZakatable: true,
216|      });
217|
218|      // Verify addedAt is a valid ISO date
219|      expect(new Date(snapshotAsset.addedAt).toISOString()).toBe(
220|        snapshotAsset.addedAt
221|      );
222|    });
223|
224|    it('should only include zakatable assets in snapshot', async () => {
225|      // Create mix of zakatable and non-zakatable assets
226|      await assetHelpers.createAsset(
227|        userId,
228|        {
229|          name: 'Cash',
230|          category: 'CASH',
231|          value: 5000,
232|          isZakatable: true,
233|        },
234|        authToken
235|      );
236|      await assetHelpers.createAsset(
237|        userId,
238|        {
239|          name: 'Primary Residence',
240|          category: 'PROPERTY',
241|          value: 250000,
242|          isZakatable: false,
243|        },
244|        authToken
245|      );
246|      await assetHelpers.createAsset(
247|        userId,
248|        {
249|          name: 'Gold',
250|          category: 'GOLD',
251|          value: 3000,
252|          isZakatable: true,
253|        },
254|        authToken
255|      );
256|
257|      // Run Hawl detection job
258|      await hawlTrackingService.detectNisabAchievement();
259|
260|      // Get created record
261|      const record = await prisma.yearlySnapshot.findFirst({
262|        where: { userId },
263|      });
264|
265|      const assetBreakdown = JSON.parse(
266|        EncryptionService.decrypt(record!.assetBreakdown)
267|      );
268|
269|      // Should only have 2 zakatable assets, not the residence
270|      expect(assetBreakdown.assets).toHaveLength(2);
271|
272|      const assetNames = assetBreakdown.assets.map((a: AssetSnapshotItem) => a.name);
273|      expect(assetNames).toContain('Cash');
274|      expect(assetNames).toContain('Gold');
275|      expect(assetNames).not.toContain('Primary Residence');
276|
277|      // totalWealth should include all assets (including non-zakatable)
278|      expect(assetBreakdown.totalWealth).toBe(258000);
279|
280|      // zakatableWealth should only include zakatable assets
281|      expect(assetBreakdown.zakatableWealth).toBe(8000);
282|    });
283|
284|    it('should encrypt assetBreakdown field', async () => {
285|      // Create asset above Nisab
286|      await assetHelpers.createAsset(
287|        userId,
288|        {
289|          name: 'Savings',
290|          category: 'CASH',
291|          value: 10000,
292|          isZakatable: true,
293|        },
294|        authToken
295|      );
296|
297|      // Run Hawl detection job
298|      await hawlTrackingService.detectNisabAchievement();
299|
300|      // Get raw record from database
301|      const record = await prisma.yearlySnapshot.findFirst({
302|        where: { userId },
303|      });
304|
305|      // Verify assetBreakdown is encrypted (not valid JSON without decryption)
306|      expect(() => JSON.parse(record!.assetBreakdown)).toThrow();
307|
308|      // Verify it can be decrypted
309|      const decrypted = EncryptionService.decrypt(record!.assetBreakdown);
310|      const parsed = JSON.parse(decrypted);
311|      expect(parsed.assets).toHaveLength(1);
312|    });
313|
314|    it('should handle user with no assets', async () => {
315|      // User has no assets, so Nisab not achieved
316|      await hawlTrackingService.detectNisabAchievement();
317|
318|      // No record should be created
319|      const records = await prisma.yearlySnapshot.findMany({
320|        where: { userId },
321|      });
322|
323|      expect(records).toHaveLength(0);
324|    });
325|
326|    it('should handle user with assets below Nisab', async () => {
327|      // Create asset below Nisab threshold ($6,123.60)
328|      await assetHelpers.createAsset(
329|        userId,
330|        {
331|          name: 'Small Savings',
332|          category: 'CASH',
333|          value: 3000,
334|          isZakatable: true,
335|        },
336|        authToken
337|      );
338|
339|      // Run Hawl detection job
340|      await hawlTrackingService.detectNisabAchievement();
341|
342|      // No record should be created
343|      const records = await prisma.yearlySnapshot.findMany({
344|        where: { userId },
345|      });
346|
347|      expect(records).toHaveLength(0);
348|    });
349|
350|    it('should create snapshot at exact moment of detection', async () => {
351|      // Create initial asset above Nisab
352|      await assetHelpers.createAsset(
353|        userId,
354|        {
355|          name: 'Initial Asset',
356|          category: 'CASH',
357|          value: 10000,
358|          isZakatable: true,
359|        },
360|        authToken
361|      );
362|
363|      const detectionTime = new Date();
364|
365|      // Run Hawl detection job
366|      await hawlTrackingService.detectNisabAchievement();
367|
368|      // Immediately modify asset value
369|      const asset = await prisma.asset.findFirst({ where: { userId } });
370|      await prisma.asset.update({
371|        where: { id: asset!.id },
372|        data: { value: 5000 }, // Reduced to below Nisab
373|      });
374|
375|      // Get created record
376|      const record = await prisma.yearlySnapshot.findFirst({
377|        where: { userId },
378|      });
379|
380|      const assetBreakdown = JSON.parse(
381|        EncryptionService.decrypt(record!.assetBreakdown)
382|      );
383|
384|      // Snapshot should still show original value (10000), not modified value (5000)
385|      expect(assetBreakdown.assets[0].value).toBe(10000);
386|      expect(assetBreakdown.totalWealth).toBe(10000);
387|
388|      // Verify capturedAt is around detection time
389|      const capturedAt = new Date(assetBreakdown.capturedAt);
390|      const diff = Math.abs(capturedAt.getTime() - detectionTime.getTime());
391|      expect(diff).toBeLessThan(5000); // Within 5 seconds
392|    });
393|
394|    it('should not create duplicate records if Nisab already achieved', async () => {
395|      // Create assets above Nisab
396|      await assetHelpers.createAsset(
397|        userId,
398|        {
399|          name: 'Cash',
400|          category: 'CASH',
401|          value: 10000,
402|          isZakatable: true,
403|        },
404|        authToken
405|      );
406|
407|      // Run detection first time
408|      await hawlTrackingService.detectNisabAchievement();
409|
410|      const firstRecords = await prisma.yearlySnapshot.findMany({
411|        where: { userId },
412|      });
413|      expect(firstRecords).toHaveLength(1);
414|
415|      // Run detection second time
416|      await hawlTrackingService.detectNisabAchievement();
417|
418|      const secondRecords = await prisma.yearlySnapshot.findMany({
419|        where: { userId },
420|      });
421|
422|      // Should still only have 1 record
423|      expect(secondRecords).toHaveLength(1);
424|      expect(secondRecords[0].id).toBe(firstRecords[0].id);
425|    });
426|
427|    it('should handle assets with zero value', async () => {
428|      // Create assets including one with zero value
429|      await assetHelpers.createAsset(
430|        userId,
431|        {
432|          name: 'Active Account',
433|          category: 'CASH',
434|          value: 7000,
435|          isZakatable: true,
436|        },
437|        authToken
438|      );
439|      await assetHelpers.createAsset(
440|        userId,
441|        {
442|          name: 'Empty Account',
443|          category: 'CASH',
444|          value: 0,
445|          isZakatable: true,
446|        },
447|        authToken
448|      );
449|
450|      // Run Hawl detection job
451|      await hawlTrackingService.detectNisabAchievement();
452|
453|      // Get created record
454|      const record = await prisma.yearlySnapshot.findFirst({
455|        where: { userId },
456|      });
457|
458|      const assetBreakdown = JSON.parse(
459|        EncryptionService.decrypt(record!.assetBreakdown)
460|      );
461|
462|      // Both assets should be included
463|      expect(assetBreakdown.assets).toHaveLength(2);
464|
465|      const emptyAccount = assetBreakdown.assets.find(
466|        (a: AssetSnapshotItem) => a.name === 'Empty Account'
467|      );
468|      expect(emptyAccount?.value).toBe(0);
469|
470|      // Totals should still be correct
471|      expect(assetBreakdown.totalWealth).toBe(7000);
472|      expect(assetBreakdown.zakatableWealth).toBe(7000);
473|    });
474|
475|    it('should preserve asset order by addedAt date', async () => {
476|      // Create assets at different times
477|      await assetHelpers.createAsset(
478|        userId,
479|        {
480|          name: 'First Asset',
481|          category: 'CASH',
482|          value: 3000,
483|          isZakatable: true,
484|        },
485|        authToken
486|      );
487|
488|      // Wait a bit
489|      await new Promise((resolve) => setTimeout(resolve, 100));
490|
491|      await assetHelpers.createAsset(
492|        userId,
493|        {
494|          name: 'Second Asset',
495|          category: 'GOLD',
496|          value: 4000,
497|          isZakatable: true,
498|        },
499|        authToken
500|      );
501|
502|      // Run Hawl detection job
503|      await hawlTrackingService.detectNisabAchievement();
504|
505|      // Get created record
506|      const record = await prisma.yearlySnapshot.findFirst({
507|        where: { userId },
508|      });
509|
510|      const assetBreakdown = JSON.parse(
511|        EncryptionService.decrypt(record!.assetBreakdown)
512|      );
513|
514|      // Assets should be in chronological order
515|      expect(assetBreakdown.assets[0].name).toBe('First Asset');
516|      expect(assetBreakdown.assets[1].name).toBe('Second Asset');
517|
518|      // Verify timestamps
519|      const firstAddedAt = new Date(assetBreakdown.assets[0].addedAt);
520|      const secondAddedAt = new Date(assetBreakdown.assets[1].addedAt);
521|      expect(firstAddedAt.getTime()).toBeLessThan(secondAddedAt.getTime());
522|    });
523|  });
524|
525|  describe('JSON Structure Validation', () => {
526|    it('should match exact assetBreakdown JSON structure', async () => {
527|      // Create test asset
528|      await assetHelpers.createAsset(
529|        userId,
530|        {
531|          name: 'Test Asset',
532|          category: 'CASH',
533|          value: 10000,
534|          isZakatable: true,
535|        },
536|        authToken
537|      );
538|
539|      // Run Hawl detection job
540|      await hawlTrackingService.detectNisabAchievement();
541|
542|      // Get created record
543|      const record = await prisma.yearlySnapshot.findFirst({
544|        where: { userId },
545|      });
546|
547|      const assetBreakdown = JSON.parse(
548|        EncryptionService.decrypt(record!.assetBreakdown)
549|      );
550|
551|      // Verify exact structure matches specification
552|      expect(assetBreakdown).toEqual({
553|        assets: expect.arrayContaining([
554|          expect.objectContaining({
555|            id: expect.any(String),
556|            name: expect.any(String),
557|            category: expect.any(String),
558|            value: expect.any(Number),
559|            isZakatable: expect.any(Boolean),
560|            addedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/), // ISO date
561|          }),
562|        ]),
563|        capturedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/), // ISO date
564|        totalWealth: expect.any(Number),
565|        zakatableWealth: expect.any(Number),
566|      });
567|
568|      // Verify no extra fields
569|      const allowedKeys = ['assets', 'capturedAt', 'totalWealth', 'zakatableWealth'];
570|      const actualKeys = Object.keys(assetBreakdown);
571|      expect(actualKeys.sort()).toEqual(allowedKeys.sort());
572|    });
573|  });
574|});
575|