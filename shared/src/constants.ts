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

1|// Constants for the zakapp application
2|
3|/**
4| * Re-export comprehensive Islamic constants from dedicated module
5| *
6| * IMPORTANT: The canonical source for Islamic Zakat constants is now
7| * in constants/islamicConstants.ts. This includes:
8| * - NISAB_THRESHOLDS (with scholarly references)
9| * - ZAKAT_RATES (with detailed explanations)
10| * - HAWL_CONSTANTS (lunar calendar calculations)
11| * - CALCULATION_METHODS (madhab-specific approaches)
12| * - Helper functions for calculations
13| *
14| * The legacy constants below are maintained for backward compatibility
15| * but new code should use the comprehensive islamicConstants module.
16| */
17|export * from './constants/islamicConstants.js';
18|
19|// Legacy Zakat calculation constants (DEPRECATED - use islamicConstants instead)
20|// @deprecated Use ZAKAT_RATES from islamicConstants.ts
21|// export const ZAKAT_RATES = {
22|//   STANDARD_RATE: 2.5, // 2.5% for most assets
23|//   AGRICULTURAL_RAIN_FED: 10, // 10% for rain-fed crops
24|//   AGRICULTURAL_IRRIGATED: 5, // 5% for irrigated crops
25|// } as const;
26|
27|// Legacy Nisab thresholds (DEPRECATED - use islamicConstants instead)
28|// @deprecated Use NISAB_THRESHOLDS from islamicConstants.ts
29|// export const NISAB_THRESHOLDS = {
30|//   GOLD_GRAMS: 87.48, // ~3 ounces of gold
31|//   SILVER_GRAMS: 612.36, // ~21 ounces of silver
32|// } as const;
33|
34|// Supported currencies
35|export const CURRENCIES = [
36|  { code: 'USD', name: 'US Dollar', symbol: '$' },
37|  { code: 'EUR', name: 'Euro', symbol: '€' },
38|  { code: 'GBP', name: 'British Pound', symbol: '£' },
39|  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
40|  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
41|  { code: 'EGP', name: 'Egyptian Pound', symbol: 'ج.م' },
42|  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
43|  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
44|  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
45|  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
46|  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
47|  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
48|] as const;
49|
50|// Asset categories with their details
51|// @deprecated Use ASSET_CATEGORIES from islamicConstants.ts
52|
53|// Calendar types
54|export const CALENDAR_TYPES = {
55|  LUNAR: {
56|    id: 'lunar',
57|    name: 'Lunar (Hijri)',
58|    description: 'Islamic lunar calendar',
59|  },
60|  SOLAR: {
61|    id: 'solar',
62|    name: 'Solar (Gregorian)',
63|    description: 'Gregorian solar calendar',
64|  },
65|} as const;
66|
67|// Supported languages
68|export const LANGUAGES = [
69|  { code: 'en', name: 'English', nativeName: 'English' },
70|  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
71|  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
72|  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
73|  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
74|  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
75|] as const;
76|
77|// API endpoints
78|export const API_ENDPOINTS = {
79|  BASE: '/api/v1',
80|  AUTH: {
81|    REGISTER: '/auth/register',
82|    LOGIN: '/auth/login',
83|    REFRESH: '/auth/refresh',
84|    LOGOUT: '/auth/logout',
85|    DEMO_STATUS: '/auth/demo-status',
86|    DEMO_USERS: '/auth/demo-users',
87|  },
88|  USERS: {
89|    PROFILE: '/users/profile',
90|    CHANGE_PASSWORD: '/users/change-password',
91|  },
92|  ASSETS: {
93|    BASE: '/assets',
94|    CATEGORIES: '/assets/categories',
95|  },
96|  ZAKAT: {
97|    CALCULATE: '/zakat/calculate',
98|    HISTORY: '/zakat/history',
99|    PAYMENT: '/zakat/payment',
100|  },
101|  DATA: {
102|    EXPORT: '/data/export',
103|    IMPORT: '/data/import',
104|    BACKUP: '/data/backup',
105|  },
106|} as const;
107|
108|// Error codes
109|export const ERROR_CODES = {
110|  INVALID_REQUEST: 'INVALID_REQUEST',
111|  UNAUTHORIZED: 'UNAUTHORIZED',
112|  FORBIDDEN: 'FORBIDDEN',
113|  NOT_FOUND: 'NOT_FOUND',
114|  VALIDATION_ERROR: 'VALIDATION_ERROR',
115|  INTERNAL_ERROR: 'INTERNAL_ERROR',
116|  USER_EXISTS: 'USER_EXISTS',
117|  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
118|  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
119|  RATE_LIMITED: 'RATE_LIMITED',
120|  RATE_LIMIT: 'RATE_LIMIT',
121|  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
122|} as const;
123|
124|// Validation constraints
125|export const VALIDATION = {
126|  USERNAME: {
127|    MIN_LENGTH: 3,
128|    MAX_LENGTH: 50,
129|    PATTERN: /^[a-zA-Z0-9_-]+$/,
130|  },
131|  PASSWORD: {
132|    MIN_LENGTH: 8,
133|    MAX_LENGTH: 128,
134|    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]+$/,
135|  },
136|  EMAIL: {
137|    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
138|  },
139|  ASSET_NAME: {
140|    MIN_LENGTH: 1,
141|    MAX_LENGTH: 100,
142|  },
143|  AMOUNT: {
144|    MIN_VALUE: 0,
145|    MAX_VALUE: 999999999999, // 999 billion
146|  },
147|} as const;
148|
149|// Default values
150|export const DEFAULTS = {
151|  CURRENCY: 'USD',
152|  LANGUAGE: 'en',
153|  CALENDAR_TYPE: 'lunar',
154|  ZAKAT_METHOD: 'standard',
155|  PAGINATION_LIMIT: 20,
156|} as const;
157|
158|// Date formats
159|export const DATE_FORMATS = {
160|  ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',
161|  DISPLAY: 'MMM DD, YYYY',
162|  HIJRI: 'DD MMM YYYY AH',
163|} as const;
164|
165|/**
166| * Educational content for zakat calculation methodologies.
167| * Provides historical background, detailed explanations of approaches,
168| * pros/cons analysis, and considerations for each methodology.
169| */
170|export const METHODOLOGY_EDUCATION = {
171|  HANAFI: {
172|    historicalBackground: 'The Hanafi school, founded by Imam Abu Hanifa (699-767 CE) in Kufa, Iraq, is the oldest and most widely followed Sunni school of Islamic jurisprudence. Known for its emphasis on rational reasoning (ra\'y) and analogy (qiyas), it is predominant in Turkey, Central Asia, the Indian subcontinent, and significant parts of the Arab world. Key sources include Al-Hidayah by al-Marghinani and Fath al-Qadir by Ibn al-Humam.',
173|    nisabApproach: 'Uses silver-based nisab exclusively (612.36 grams of silver), providing a lower threshold that ensures broader zakat eligibility. This approach is based on authenticated hadiths and the principle of facilitating zakat obligations for more Muslims, reflecting the school\'s emphasis on accessibility and social welfare.',
174|    businessAssetTreatment: 'Comprehensive inclusion of all business assets including inventory, accounts receivable, work-in-progress, and working capital. This thorough wealth assessment methodology reflects the Hanafi emphasis on complete financial transparency and is detailed in classical texts like Al-Hidayah.',
175|    debtTreatment: 'Allows for comprehensive debt deduction, including both immediate obligations and reasonable future commitments. This flexible approach provides relief to those with significant financial obligations while maintaining the integrity of zakat calculations, as outlined in Hanafi jurisprudential texts.',
176|    pros: [
177|      'Lower silver-based nisab threshold ensures broader zakat eligibility',
178|      'Comprehensive and transparent business asset inclusion methodology',
179|      'Flexible debt deduction approach accommodates modern financial complexities',
180|      'Well-established scholarly precedent spanning over 1,200 years',
181|      'Rational approach allows for adaptation to contemporary circumstances',
182|      'Widely accepted across diverse Muslim communities globally'
183|    ],
184|    considerations: [
185|      'Silver-based nisab may result in higher zakat amounts when silver prices are low',
186|      'Requires detailed business asset evaluation and documentation',
187|      'Complex debt assessment may need professional guidance',
188|      'Comprehensive approach may be time-intensive for complex portfolios',
189|      'Requires good understanding of classical jurisprudential principles'
190|    ]
191|  },
192|  SHAFII: {
193|    historicalBackground: 'The Shafi\'i school, founded by Imam Muhammad ibn Idris al-Shafi\'i (767-820 CE), is renowned for its systematic methodology and detailed legal categorization. It is the dominant school in Southeast Asia, East Africa, parts of the Middle East, and significant Muslim populations worldwide. Key sources include Al-Majmu\' Sharh al-Muhadhdhab by Imam al-Nawawi and Minhaj al-Talibin.',
194|    nisabApproach: 'Uses the dual minimum approach, taking the lower of gold nisab (87.48 grams) or silver nisab (612.36 grams). This balanced methodology considers market conditions of both precious metals and ensures accessibility while maintaining traditional nisab principles as established in classical Shafi\'i jurisprudence.',
195|    businessAssetTreatment: 'Employs detailed categorization of business assets with specific rules for different types of commercial activities. Emphasizes precision in asset classification according to their intended use and Islamic commercial law principles, as detailed in Al-Majmu\' and other authoritative Shafi\'i texts.',
196|    debtTreatment: 'Takes a conservative approach to debt deduction, focusing on immediate and certain obligations while exercising caution with speculative or uncertain debts. This methodology ensures accuracy and religious compliance as outlined in classical Shafi\'i jurisprudential works.',
197|    pros: [
198|      'Balanced dual-minimum nisab approach adapts to market conditions',
199|      'Systematic and precise asset categorization reduces calculation errors',
200|      'Conservative debt treatment provides certainty and religious confidence',
201|      'Strong methodological framework based on established legal principles',
202|      'Well-suited for diverse asset types and modern financial instruments',
203|      'Comprehensive scholarly documentation spanning centuries'
204|    ],
205|    considerations: [
206|      'More complex asset categorization requires detailed financial knowledge',
207|      'Conservative debt approach may limit some legitimate deductions',
208|      'Requires good understanding of different asset types and classifications',
209|      'Systematic approach may be less accessible for simple portfolios',
210|      'May require professional guidance for complex business structures'
211|    ]
212|  },
213|  STANDARD: {
214|    historicalBackground: 'The Standard method represents a contemporary consensus approach developed for global Muslim communities by organizations like AAOIFI (Accounting and Auditing Organization for Islamic Financial Institutions), IFSB (Islamic Financial Services Board), and other international Islamic finance bodies. It incorporates modern financial principles while maintaining religious compliance and scholarly validation.',
215|    nisabApproach: 'Uses the dual minimum approach, selecting the lower of gold nisab (87.48 grams) or silver nisab (612.36 grams). This methodology provides flexibility based on current market conditions while ensuring accessibility and follows the principle of choosing the threshold most beneficial to those seeking to fulfill their zakat obligations.',
216|    businessAssetTreatment: 'Employs market value-based assessment of business assets using standard international accounting principles adapted for Islamic finance. Focuses on readily determinable values while maintaining compatibility with modern business structures and regulatory requirements across different jurisdictions.',
217|    debtTreatment: 'Implements immediate debt deduction approach, focusing on current and certain obligations while maintaining calculation simplicity. This method balances accuracy with practical implementation for diverse global communities while ensuring compliance with contemporary Islamic finance standards.',
218|    pros: [
219|      'Modern consensus approach validated by leading Islamic finance institutions',
220|      'Internationally recognized standards facilitate cross-border consistency',
221|      'Simplified calculation process suitable for diverse user backgrounds',
222|      'Excellent compatibility with modern financial systems and regulations',
223|      'Supported by contemporary Islamic finance institutions globally',
224|      'Flexible dual nisab calculation adapts to market conditions'
225|    ],
226|    considerations: [
227|      'May not align perfectly with specific regional scholarly traditions',
228|      'Simplified approach may not capture all jurisprudential nuances',
229|      'Relies on contemporary scholarly consensus rather than classical texts',
230|      'Less historical precedent compared to traditional madhhab approaches',
231|      'May require ongoing validation as financial instruments evolve'
232|    ]
233|  },
234|  MALIKI: {
235|    historicalBackground: 'The Maliki school, founded by Imam Malik ibn Anas (711-795 CE), is one of the four major Sunni schools of Islamic jurisprudence. It emphasizes community benefit (maslaha) and practical application, and is predominant in North Africa, West Africa, and parts of the Arabian Peninsula.',
236|    nisabApproach: 'Uses a flexible dual approach that may adjust nisab thresholds based on regional economic conditions and community welfare considerations. This reflects the Maliki emphasis on practical application and community benefit.',
237|    businessAssetTreatment: 'Comprehensive treatment of commercial assets with particular emphasis on agricultural goods and trade merchandise. Includes detailed rules for seasonal businesses and agricultural cycles, reflecting the school\'s historical roots in agricultural societies.',
238|    debtTreatment: 'Community-based debt assessment that considers both individual circumstances and broader economic conditions. May allow for community-verified debt deductions and considers the debtor\'s overall community standing.',
239|    pros: [
240|      'Adapts to local economic conditions and community needs',
241|      'Strong framework for agricultural asset handling',
242|      'Community-centric approach promotes social welfare',
243|      'Flexible implementation based on regional requirements',
244|      'Comprehensive treatment of trade goods and commerce',
245|      'Historical precedent for practical jurisprudence'
246|    ],
247|    considerations: [
248|      'Requires regional economic data for proper implementation',
249|      'Complex adjustment mechanisms may be difficult to standardize',
250|      'Less standardized across different regions and communities',
251|      'May require community consensus for certain calculations',
252|      'Implementation complexity may vary by location'
253|    ]
254|  },
255|  HANBALI: {
256|    historicalBackground: 'The Hanbali school, founded by Imam Ahmad ibn Hanbal (780-855 CE), is known for its strict adherence to Quranic and Hadith texts. It is the official school of jurisprudence in Saudi Arabia and is followed in parts of the Gulf states, emphasizing traditional and conservative approaches.',
257|    nisabApproach: 'Prefers gold-based nisab calculations as the primary standard, based on strong textual precedents from Islamic sources. This conservative approach ensures consistency with traditional interpretations and provides stability in calculations.',
258|    businessAssetTreatment: 'Strict categorization of business assets based on classical Islamic commercial law. Emphasizes clear distinctions between different types of commercial activities and applies conservative valuation methods to ensure compliance with traditional interpretations.',
259|    debtTreatment: 'Conservative approach to debt deduction, focusing on immediate and certain obligations with clear documentation. Tends to be cautious about speculative or uncertain debts to ensure strict compliance with Islamic principles.',
260|    pros: [
261|      'Clear precedential basis rooted in Quran and authentic Hadith',
262|      'Consistent with traditional Islamic interpretations',
263|      'Simplified and stable gold-based calculation logic',
264|      'Conservative approach ensures religious compliance',
265|      'Well-established scholarly precedent and documentation',
266|      'Provides certainty and consistency in calculations'
267|    ],
268|    considerations: [
269|      'Gold-based nisab may exclude lower-income individuals in some contexts',
270|      'Less adaptive to modern financial instruments and structures',
271|      'Limited flexibility for contemporary business models',
272|      'May not suit all regional economic contexts',
273|      'Conservative debt treatment may limit legitimate deductions',
274|      'Requires careful interpretation for modern applications'
275|    ]
276|  },
277|  CUSTOM: {
278|    historicalBackground: 'Custom methodology allows users to define their own calculation parameters based on personal consultation with qualified Islamic scholars or specific regional requirements. This approach recognizes the diversity of Islamic jurisprudential opinions and local practices while maintaining the fundamental principles of zakat.',
279|    nisabApproach: 'User-defined nisab threshold based on scholarly consultation or specific circumstances. Provides maximum flexibility for unique situations while requiring proper Islamic jurisprudential guidance to ensure religious validity.',
280|    businessAssetTreatment: 'Configurable asset treatment based on individual needs and scholarly guidance. Allows for specialized business considerations that may not be covered by standard methodologies while maintaining Islamic compliance principles.',
281|    debtTreatment: 'Flexible debt deduction rules that can be customized based on individual circumstances and scholarly advice. Enables accommodation of unique financial situations while ensuring proper Islamic jurisprudential oversight.',
282|    pros: [
283|      'Maximum flexibility for unique situations and circumstances',
284|      'Can accommodate specific regional practices and interpretations',
285|      'Allows for direct scholarly consultation integration',
286|      'Adaptable to changing circumstances and modern contexts',
287|      'Supports specialized business models and structures',
288|      'Enables compliance with local Islamic authorities and customs'
289|    ],
290|    considerations: [
291|      'Requires qualified scholarly guidance for proper implementation',
292|      'May lack standardization benefits of established methods',
293|      'Full responsibility for correctness lies with user and advisor',
294|      'May be complex to implement properly without expert guidance',
295|      'Potential for inconsistent applications across different users',
296|      'Requires ongoing scholarly oversight and validation'
297|    ]
298|  }
299|} as const;
300|
301|/**
302| * Regional methodology recommendations mapping.
303| * Maps countries/regions to recommended zakat calculation methodologies
304| * based on prevalent Islamic schools of thought and local practices.
305| */
306|export const REGIONAL_METHODOLOGY_MAP = {
307|  // Middle East & Gulf
308|  'Saudi Arabia': ['hanbali', 'standard'],
309|  'United Arab Emirates': ['standard', 'hanafi'],
310|  'Qatar': ['hanbali', 'standard'],
311|  'Kuwait': ['standard', 'hanafi'],
312|  'Oman': ['standard', 'shafii'],
313|  'Bahrain': ['standard', 'hanafi'],
314|  'Iraq': ['hanafi', 'standard'],
315|  'Jordan': ['hanafi', 'standard'],
316|  'Lebanon': ['hanafi', 'shafii'],
317|  'Syria': ['hanafi', 'standard'],
318|  'Palestine': ['hanafi', 'shafii'],
319|  
320|  // North Africa
321|  'Egypt': ['hanafi', 'standard'],
322|  'Libya': ['maliki', 'hanafi'],
323|  'Tunisia': ['maliki', 'hanafi'],
324|  'Algeria': ['maliki', 'hanafi'],
325|  'Morocco': ['maliki', 'standard'],
326|  'Sudan': ['maliki', 'hanafi'],
327|  
328|  // Southeast Asia
329|  'Indonesia': ['shafii', 'standard'],
330|  'Malaysia': ['shafii', 'standard'],
331|  'Singapore': ['shafii', 'standard'],
332|  'Thailand': ['shafii', 'standard'],
333|  'Philippines': ['shafii', 'standard'],
334|  'Brunei': ['shafii', 'standard'],
335|  'Cambodia': ['shafii', 'standard'],
336|  
337|  // South Asia
338|  'Pakistan': ['hanafi', 'standard'],
339|  'India': ['hanafi', 'standard'],
340|  'Bangladesh': ['hanafi', 'standard'],
341|  'Afghanistan': ['hanafi', 'standard'],
342|  'Maldives': ['shafii', 'standard'],
343|  'Sri Lanka': ['shafii', 'hanafi'],
344|  
345|  // Central Asia & Caucasus
346|  'Turkey': ['hanafi', 'standard'],
347|  'Kazakhstan': ['hanafi', 'standard'],
348|  'Uzbekistan': ['hanafi', 'standard'],
349|  'Turkmenistan': ['hanafi', 'standard'],
350|  'Kyrgyzstan': ['hanafi', 'standard'],
351|  'Tajikistan': ['hanafi', 'standard'],
352|  'Azerbaijan': ['hanafi', 'standard'],
353|  
354|  // East Africa
355|  'Somalia': ['shafii', 'standard'],
356|  'Ethiopia': ['shafii', 'standard'],
357|  'Kenya': ['shafii', 'standard'],
358|  'Tanzania': ['shafii', 'standard'],
359|  'Uganda': ['shafii', 'hanafi'],
360|  'Djibouti': ['shafii', 'standard'],
361|  
362|  // West Africa
363|  'Nigeria': ['maliki', 'standard'],
364|  'Senegal': ['maliki', 'standard'],
365|  'Mali': ['maliki', 'standard'],
366|  'Burkina Faso': ['maliki', 'standard'],
367|  'Niger': ['maliki', 'standard'],
368|  'Guinea': ['maliki', 'standard'],
369|  'Gambia': ['maliki', 'standard'],
370|  'Mauritania': ['maliki', 'standard'],
371|  'Chad': ['maliki', 'standard'],
372|  
373|  // Western Countries (Diaspora)
374|  'United States': ['standard', 'hanafi', 'shafii'],
375|  'Canada': ['standard', 'hanafi', 'shafii'],
376|  'United Kingdom': ['standard', 'hanafi', 'shafii'],
377|  'France': ['standard', 'maliki', 'hanafi'],
378|  'Germany': ['standard', 'hanafi'],
379|  'Netherlands': ['standard', 'hanafi'],
380|  'Australia': ['standard', 'hanafi', 'shafii'],
381|  'New Zealand': ['standard', 'shafii']
382|} as const;
383|
384|/**
385| * Scholarly sources and references for zakat methodologies.
386| * Provides authoritative sources, classical texts, and contemporary validation
387| * for each methodology's jurisprudential foundations.
388| */
389|export const METHODOLOGY_SOURCES = {
390|  HANAFI: {
391|    classicalSources: [
392|      {
393|        title: 'Al-Hidayah',
394|        author: 'Burhan al-Din al-Marghinani',
395|        description: 'Primary source for Hanafi methodology and classical jurisprudence foundations',
396|        period: '12th century CE'
397|      },
398|      {
399|        title: 'Fath al-Qadir',
400|        author: 'Kamal al-Din Ibn al-Humam',
401|        description: 'Advanced Hanafi jurisprudence with detailed calculations and examples',
402|        period: '15th century CE'
403|      }
404|    ],
405|    contemporarySources: [
406|      {
407|        title: 'Contemporary Hanafi Fiqh Studies',
408|        organization: 'Darul Uloom institutions globally',
409|        description: 'Modern applications of Hanafi jurisprudence'
410|      }
411|    ],
412|    regions: ['Turkey', 'Central Asia', 'Indian subcontinent', 'Parts of Middle East']
413|  },
414|  SHAFII: {
415|    classicalSources: [
416|      {
417|        title: 'Al-Majmu\' Sharh al-Muhadhdhab',
418|        author: 'Imam al-Nawawi',
419|        description: 'Comprehensive Shafi\'i methodology with detailed asset categorization',
420|        period: '13th century CE'
421|      },
422|      {
423|        title: 'Minhaj al-Talibin',
424|        author: 'Imam al-Nawawi',
425|        description: 'Practical implementation guide for contemporary applications',
426|        period: '13th century CE'
427|      }
428|    ],
429|    contemporarySources: [
430|      {
431|        title: 'AAOIFI Shafi\'i Compliance Guidelines',
432|        organization: 'Accounting and Auditing Organization for Islamic Financial Institutions',
433|        description: 'Modern financial applications of Shafi\'i principles'
434|      }
435|    ],
436|    regions: ['Southeast Asia', 'East Africa', 'Parts of Middle East']
437|  },
438|  MALIKI: {
439|    classicalSources: [
440|      {
441|        title: 'Al-Mudawwana',
442|        author: 'Imam Malik ibn Anas',
443|        description: 'Foundational Maliki jurisprudence with regional adaptation principles',
444|        period: '8th century CE'
445|      },
446|      {
447|        title: 'Bidayat al-Mujtahid',
448|        author: 'Ibn Rushd (Averroes)',
449|        description: 'Comparative jurisprudence approach with cross-school analysis',
450|        period: '12th century CE'
451|      }
452|    ],
453|    contemporarySources: [
454|      {
455|        title: 'North African Fiqh Academies',
456|        organization: 'Regional Islamic scholarly institutions',
457|        description: 'Modern applications adapted to regional conditions'
458|      }
459|    ],
460|    regions: ['North Africa', 'West Africa', 'Parts of Arabian Peninsula']
461|  },
462|  HANBALI: {
463|    classicalSources: [
464|      {
465|        title: 'Al-Mughni',
466|        author: 'Ibn Qudamah al-Maqdisi',
467|        description: 'Comprehensive Hanbali methodology with conservative approaches',
468|        period: '12th-13th century CE'
469|      },
470|      {
471|        title: 'Works of Ibn Taymiyyah',
472|        author: 'Taqi al-Din Ibn Taymiyyah',
473|        description: 'Textual precedent emphasis and jurisprudential analysis',
474|        period: '13th-14th century CE'
475|      }
476|    ],
477|    contemporarySources: [
478|      {
479|        title: 'Saudi Fiqh Academy',
480|        organization: 'Islamic Fiqh Academy, Makkah',
481|        description: 'Official scholarly guidance for Hanbali applications'
482|      }
483|    ],
484|    regions: ['Saudi Arabia', 'Qatar', 'Parts of Gulf States']
485|  },
486|  STANDARD: {
487|    contemporarySources: [
488|      {
489|        title: 'AAOIFI Financial Accounting Standard 9 (FAS 9)',
490|        organization: 'Accounting and Auditing Organization for Islamic Financial Institutions',
491|        description: 'International standard for Zakat calculation and disclosure'
492|      },
493|      {
494|        title: 'IFSB Guidelines',
495|        organization: 'Islamic Financial Services Board',
496|        description: 'Regulatory guidance for Islamic financial institutions'
497|      },
498|      {
499|        title: 'Islamic Development Bank Research',
500|        organization: 'Islamic Development Bank',
501|        description: 'Contemporary research on zakat implementation'
502|      }
503|    ],
504|    regions: ['International', 'Global Muslim communities']
505|  }
506|} as const;
507|
508|/**
509| * Additional educational resources for zakat calculation methodologies.
510| * Provides comprehensive learning materials, FAQs, and implementation guidance.
511| */
512|export const METHODOLOGY_RESOURCES = {
513|  commonQuestions: [
514|    {
515|      question: 'Which methodology should I choose?',
516|      answer: 'The choice depends on your regional background, personal preference, and scholarly guidance. Consider your location, the complexity of your assets, and consultation with local Islamic scholars.'
517|    },
518|    {
519|      question: 'Can I switch between methodologies?',
520|      answer: 'While possible, it\'s recommended to maintain consistency in your chosen methodology for annual zakat calculations. Consult with qualified scholars before making changes.'
521|    },
522|    {
523|      question: 'How do modern financial instruments fit into classical methodologies?',
524|      answer: 'Contemporary scholars have developed guidance for modern assets. The Standard method often provides the most comprehensive framework for contemporary financial instruments.'
525|    }
526|  ],
527|  implementationTips: [
528|    'Maintain detailed records of your assets and their categorization',
529|    'Consider consulting with Islamic finance professionals for complex portfolios',
530|    'Review your chosen methodology annually with qualified scholars',
531|    'Keep documentation of scholarly consultations and methodology decisions'
532|  ],
533|  additionalReading: [
534|    'Contemporary Islamic Finance and Zakat Studies',
535|    'Regional Fiqh Academy Publications',
536|    'Islamic Development Bank Zakat Research',
537|    'University Islamic Studies Departments Publications'
538|  ]
539|} as const;
540|
541|/**
542| * Valid asset category types - simple array for validation
543| * Single source of truth derived from AssetCategoryType
544| * Use this for validation instead of hardcoding category lists
545| */
546|export const VALID_ASSET_CATEGORY_VALUES = [
547|  'cash',
548|  'gold',
549|  'silver',
550|  'business',
551|  'property',
552|  'stocks',
553|  'crypto',
554|  'debts',
555|  'expenses',
556|] as const;
557|
558|/**
559| * Helper function to check if a value is a valid asset category
560| */
561|export function isValidAssetCategory(value: unknown): boolean {
562|  return typeof value === 'string' && VALID_ASSET_CATEGORY_VALUES.includes(value as any);
563|}
564|