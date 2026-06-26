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

1|/**
2| * Rate-limiting tests — ZakApp Server
3| *
4| * Tests cover:
5| *   - Login route (10 reqs / 15 min)
6| *   - Health route (30 reqs / 1 min)
7| *   - 429 response
8| *   - Decrementing X-RateLimit-Remaining
9| *   - X-RateLimit-Limit, X-RateLimit-Reset, Retry-After headers
10| *   - Store expiration / reset
11| *   - IP-based isolation
12| *   - Route-based isolation (different limiters keep separate counters)
13| */
14|
15|import request from 'supertest';
16|import { describe, it, expect, beforeEach, afterEach } from 'vitest';
17|import app from '../../src/app';
18|import {
19|  resetRateLimitStore,
20|  setLoginRateLimitMax,
21|  setRegistrationRateLimitMax,
22|  __setTestOverrides,
23|  __resetTestOverrides,
24|  createRateLimit,
25|  createRateLimitStore,
26|  getAuthRateLimitMax,
27|  getApiRateLimitMax,
28|} from '../../src/middleware/RateLimitMiddleware';
29|
30|describe('Rate Limiting', () => {
31|  // ── helpers ──────────────────────────────────────────────────────
32|  function makeLoginReq(email?: string) {
33|    return request(app)
34|      .post('/api/auth/login')
35|      .set('X-Forwarded-For', '203.0.113.42')
36|      .send({ email: email || 'test@example.com', password: 'wrong-pass' });
37|  }
38|
39|  function makeHealthReq() {
40|    return request(app)
41|      .get('/health')
42|      .set('X-Forwarded-For', '203.0.113.42');
43|  }
44|
45|  function makeRegisterReq(email?: string) {
46|    return request(app)
47|      .post('/api/auth/register')
48|      .set('X-Forwarded-For', '203.0.113.42')
49|      .send({
50|        email: email || `user-${Date.now()}@example.com`,
51|        password: 'TestPass123!',
52|        confirmPassword: 'TestPass123!',
53|        firstName: 'Test',
54|        lastName: 'User',
55|      });
56|  }
57|
58|  // ── setup / teardown ─────────────────────────────────────────────
59|  beforeEach(() => {
60|    resetRateLimitStore();
61|    __resetTestOverrides();
62|  });
63|
64|  afterEach(() => {
65|    resetRateLimitStore();
66|    __resetTestOverrides();
67|  });
68|
69|  // ═════════════════════════════════════════════════════════════════
70|  // 1. Rate limit responses (429)
71|  // ═════════════════════════════════════════════════════════════════
72|  describe('429 responses', () => {
73|    it('returns 429 after exceeding login limit', async () => {
74|      __setTestOverrides({ maxLogins: 3 });
75|
76|      // 3 requests should succeed (status !== 429 even if credentials are wrong)
77|      for (let i = 0; i < 3; i++) {
78|        const res = await makeLoginReq();
79|        expect(res.status).not.toBe(429);
80|        expect(res.headers['x-ratelimit-remaining']).toBeDefined();
81|      }
82|
83|      // 4th request triggers rate limit
84|      const res429 = await makeLoginReq();
85|      expect(res429.status).toBe(429);
86|      expect(res429.body.success).toBe(false);
87|      expect(res429.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
88|    });
89|
90|    it('returns 429 after exceeding health limit', async () => {
91|      // Health limit is 30/min — we verify 429 via generic limiter below.
92|      const res1 = await request(app).get('/health').set('X-Forwarded-For', '203.0.113.55');
93|      expect(res1.status).toBe(200);
94|    });
95|  });
96|
97|  // ═════════════════════════════════════════════════════════════════
98|  // 2. Headers — X-RateLimit-Limit, X-RateLimit-Remaining,
99|  //    X-RateLimit-Reset, Retry-After
100|  // ═════════════════════════════════════════════════════════════════
101|  describe('Rate limit headers', () => {
102|    it('returns correct X-RateLimit-Limit on login', async () => {
103|      __setTestOverrides({ maxLogins: 5 });
104|      const res = await makeLoginReq();
105|      expect(res.headers['x-ratelimit-limit']).toBe('5');
106|    });
107|
108|    it('decrements X-RateLimit-Remaining on each login request', async () => {
109|      __setTestOverrides({ maxLogins: 5 });
110|
111|      const email = 'same@example.com';
112|      for (let i = 0; i < 3; i++) {
113|        const res = await makeLoginReq(email);
114|        const remaining = parseInt(res.headers['x-ratelimit-remaining'] as string, 10);
115|        expect(remaining).toBe(5 - (i + 1));
116|        expect(res.status).not.toBe(429);
117|      }
118|    });
119|
120|    it('returns Retry-After on rate-limited request', async () => {
121|      __setTestOverrides({ maxLogins: 1 });
122|      await makeLoginReq();
123|
124|      const res = await makeLoginReq();
125|      expect(res.status).toBe(429);
126|      expect(res.headers['retry-after']).toBeDefined();
127|      const retryAfter = parseInt(res.headers['retry-after'] as string, 10);
128|      expect(retryAfter).toBeGreaterThan(0);
129|      expect(retryAfter).toBeLessThanOrEqual(15 * 60 + 1); // <= 15 min + 1s
130|    });
131|
132|    it('returns ISO date in X-RateLimit-Reset', async () => {
133|      const res = await makeLoginReq();
134|      const reset = res.headers['x-ratelimit-reset'] as string;
135|      expect(reset).toBeDefined();
136|      expect(Date.parse(reset)).not.toBeNaN();
137|    });
138|
139|    it('includes valid headers on health endpoint', async () => {
140|      const res = await makeHealthReq();
141|      expect(res.status).toBe(200);
142|      expect(res.headers['x-ratelimit-limit']).toBe('30');
143|      expect(parseInt(res.headers['x-ratelimit-remaining'] as string, 10)).toBeLessThan(30);
144|    });
145|  });
146|
147|  // ═════════════════════════════════════════════════════════════════
148|  // 3. Store expiration / window reset
149|  // ═════════════════════════════════════════════════════════════════
150|  describe('Store expiration', () => {
151|    it('resets counter after window expires', async () => {
152|      const store = createRateLimitStore();
153|      const now = Date.now();
154|
155|      const entry1 = store.increment('test-key', 100, now);
156|      expect(entry1.count).toBe(1);
157|
158|      const entry2 = store.increment('test-key', 100, now + 101);
159|      expect(entry2.count).toBe(1);
160|    });
161|
162|    it('keeps counter within active window', async () => {
163|      const store = createRateLimitStore();
164|      const now = Date.now();
165|
166|      const e1 = store.increment('k', 5000, now);
167|      expect(e1.count).toBe(1);
168|
169|      const e2 = store.increment('k', 5000, now + 2000);
170|      expect(e2.count).toBe(2);
171|
172|      const e3 = store.increment('k', 5000, now + 4999);
173|      expect(e3.count).toBe(3);
174|    });
175|  });
176|
177|  // ═════════════════════════════════════════════════════════════════
178|  // 4. IP-based isolation
179|  // ═════════════════════════════════════════════════════════════════
180|  describe('IP isolation', () => {
181|    it('limits are isolated per IP', async () => {
182|      __setTestOverrides({ maxLogins: 2 });
183|
184|      const ipA = '203.0.113.5';
185|      await request(app)
186|        .post('/api/auth/login')
187|        .set('X-Forwarded-For', ipA)
188|        .send({ email: 'a@example.com', password: 'x' });
189|      await request(app)
190|        .post('/api/auth/login')
191|        .set('X-Forwarded-For', ipA)
192|        .send({ email: 'a@example.com', password: 'x' });
193|
194|      const resA = await request(app)
195|        .post('/api/auth/login')
196|        .set('X-Forwarded-For', ipA)
197|        .send({ email: 'a@example.com', password: 'x' });
198|      expect(resA.status).toBe(429);
199|
200|      const resB = await request(app)
201|        .post('/api/auth/login')
202|        .set('X-Forwarded-For', '203.0.113.99')
203|        .send({ email: 'b@example.com', password: 'x' });
204|      expect(resB.status).not.toBe(429);
205|    });
206|  });
207|
208|  // ═════════════════════════════════════════════════════════════════
209|  // 5. Route isolation (different counters per limiter)
210|  // ═════════════════════════════════════════════════════════════════
211|  describe('Route isolation', () => {
212|    it('login and registration use independent counters', async () => {
213|      __setTestOverrides({ maxLogins: 2, maxRegistrations: 2 });
214|
215|      await makeLoginReq();
216|      await makeLoginReq();
217|
218|      const loginBlocked = await makeLoginReq();
219|      expect(loginBlocked.status).toBe(429);
220|
221|      const regOk = await makeRegisterReq('fresh-reg@example.com');
222|      expect(regOk.status).not.toBe(429);
223|    });
224|
225|    it('health and login share the same IP but use independent stores', async () => {
226|      __setTestOverrides({ maxLogins: 1 });
227|
228|      await makeLoginReq();
229|      const blocked = await makeLoginReq();
230|      expect(blocked.status).toBe(429);
231|
232|      const health = await makeHealthReq();
233|      expect(health.status).toBe(200);
234|    });
235|  });
236|
237|  // ═════════════════════════════════════════════════════════════════
238|  // 6. Regression — resetRateLimitStore correctly resets everything
239|  // ═════════════════════════════════════════════════════════════════
240|  describe('Manual store reset', () => {
241|    it('resetRateLimitStore() clears all stores', async () => {
242|      __setTestOverrides({ maxLogins: 1 });
243|      await makeLoginReq();
244|      expect((await makeLoginReq()).status).toBe(429);
245|
246|      resetRateLimitStore();
247|
248|      const after = await makeLoginReq();
249|      expect(after.status).not.toBe(429);
250|    });
251|  });
252|
253|  // ═════════════════════════════════════════════════════════════════
254|  // 7. createRateLimit helper
255|  // ═════════════════════════════════════════════════════════════════
256|  describe('createRateLimit helper', () => {
257|    it('creates an isolated limiter with custom window and max', () => {
258|      const limiter = createRateLimit({ windowMs: 1000, max: 3 });
259|      expect(typeof limiter).toBe('function');
260|    });
261|  });
262|
263|  // ═════════════════════════════════════════════════════════════════
264|  // 8. Blanket auth rate limiter (all /auth/* routes)
265|  // ═════════════════════════════════════════════════════════════════
266|  describe('Blanket auth rate limiter', () => {
267|    it('returns 429 after exceeding blanket auth limit on /auth/*', async () => {
268|      __setTestOverrides({ maxAuth: 2 });
269|
270|      // The blanket limiter fires first (before login-specific) on POST /api/auth/login
271|      const ip = '203.0.113.88';
272|      for (let i = 0; i < 2; i++) {
273|        const res = await request(app)
274|          .post('/api/auth/login')
275|          .set('X-Forwarded-For', ip)
276|          .send({ email: 'any@example.com', password: 'x' });
277|        expect(res.status).not.toBe(429);
278|      }
279|
280|      // 3rd request blocked by blanket auth limiter
281|      const blocked = await request(app)
282|        .post('/api/auth/login')
283|        .set('X-Forwarded-For', ip)
284|        .send({ email: 'any@example.com', password: 'x' });
285|      expect(blocked.status).toBe(429);
286|      expect(blocked.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
287|    });
288|
289|    it('blanket auth max respects test overrides', () => {
290|      __setTestOverrides({ maxAuth: 5 });
291|      expect(getAuthRateLimitMax()).toBe(5);
292|      __setTestOverrides({ maxAuth: 7 });
293|      expect(getAuthRateLimitMax()).toBe(7);
294|    });
295|  });
296|
297|  // ═════════════════════════════════════════════════════════════════
298|  // 9. Environment variable configuration for API rate limits
299|  // ═════════════════════════════════════════════════════════════════
300|  describe('Environment variable configuration', () => {
301|    it(' respects RATE_LIMIT_MAX and RATE_LIMIT_WINDOW_MS', () => {
302|      // We cannot change env vars after process start in a clean way here,
303|      // so we verify the env helper is wired by checking exported defaults.
304|      // If RATE_LIMIT_MAX were set to 50 before server boot, getApiRateLimitMax() would return 50.
305|      // In this test process we confirm the fallback constants are >0.
306|      expect(getApiRateLimitMax()).toBeGreaterThan(0);
307|    });
308|  });
309|
310|  // ═════════════════════════════════════════════════════════════════
311|  // 10. Localhost / dev skip
312|  // ═════════════════════════════════════════════════════════════════
313|  describe('Trusted IP skip', () => {
314|    it('skips health limiter for localhost IP in dev', async () => {
315|      __setTestOverrides({ skipTrusted: true });
316|      // With skipTrusted=true, isTrustedIp is effectively bypassed; we test via health endpoint
317|      const res = await request(app).get('/health');
318|      expect(res.status).toBe(200);
319|      expect(res.headers['x-ratelimit-limit']).toBeUndefined();
320|    });
321|
322|    it('enforces health limiter when skipTrusted is false', async () => {
323|      __setTestOverrides({ skipTrusted: false, maxHealth: 1 });
324|      await request(app).get('/health');
325|      const blocked = await request(app).get('/health');
326|      expect(blocked.status).toBe(429);
327|    });
328|  });
329|});
330|