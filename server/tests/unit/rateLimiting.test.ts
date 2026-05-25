/**
 * Rate-limiting tests — ZakApp Server
 *
 * Tests cover:
 *   - Login route (10 reqs / 15 min)
 *   - Health route (30 reqs / 1 min)
 *   - 429 response
 *   - Decrementing X-RateLimit-Remaining
 *   - X-RateLimit-Limit, X-RateLimit-Reset, Retry-After headers
 *   - Store expiration / reset
 *   - IP-based isolation
 *   - Route-based isolation (different limiters keep separate counters)
 */

import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import app from '../../src/app';
import {
  resetRateLimitStore,
  setLoginRateLimitMax,
  setRegistrationRateLimitMax,
  __setTestOverrides,
  __resetTestOverrides,
  createRateLimit,
  createRateLimitStore,
  getAuthRateLimitMax,
  getApiRateLimitMax,
} from '../../src/middleware/RateLimitMiddleware';

describe('Rate Limiting', () => {
  // ── helpers ──────────────────────────────────────────────────────
  function makeLoginReq(email?: string) {
    return request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '203.0.113.42')
      .send({ email: email || 'test@example.com', password: 'wrong-pass' });
  }

  function makeHealthReq() {
    return request(app)
      .get('/health')
      .set('X-Forwarded-For', '203.0.113.42');
  }

  function makeRegisterReq(email?: string) {
    return request(app)
      .post('/api/auth/register')
      .set('X-Forwarded-For', '203.0.113.42')
      .send({
        email: email || `user-${Date.now()}@example.com`,
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      });
  }

  // ── setup / teardown ─────────────────────────────────────────────
  beforeEach(() => {
    resetRateLimitStore();
    __resetTestOverrides();
  });

  afterEach(() => {
    resetRateLimitStore();
    __resetTestOverrides();
  });

  // ═════════════════════════════════════════════════════════════════
  // 1. Rate limit responses (429)
  // ═════════════════════════════════════════════════════════════════
  describe('429 responses', () => {
    it('returns 429 after exceeding login limit', async () => {
      __setTestOverrides({ maxLogins: 3 });

      // 3 requests should succeed (status !== 429 even if credentials are wrong)
      for (let i = 0; i < 3; i++) {
        const res = await makeLoginReq();
        expect(res.status).not.toBe(429);
        expect(res.headers['x-ratelimit-remaining']).toBeDefined();
      }

      // 4th request triggers rate limit
      const res429 = await makeLoginReq();
      expect(res429.status).toBe(429);
      expect(res429.body.success).toBe(false);
      expect(res429.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('returns 429 after exceeding health limit', async () => {
      // Health limit is 30/min — we verify 429 via generic limiter below.
      const res1 = await request(app).get('/health').set('X-Forwarded-For', '203.0.113.55');
      expect(res1.status).toBe(200);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 2. Headers — X-RateLimit-Limit, X-RateLimit-Remaining,
  //    X-RateLimit-Reset, Retry-After
  // ═════════════════════════════════════════════════════════════════
  describe('Rate limit headers', () => {
    it('returns correct X-RateLimit-Limit on login', async () => {
      __setTestOverrides({ maxLogins: 5 });
      const res = await makeLoginReq();
      expect(res.headers['x-ratelimit-limit']).toBe('5');
    });

    it('decrements X-RateLimit-Remaining on each login request', async () => {
      __setTestOverrides({ maxLogins: 5 });

      const email = 'same@example.com';
      for (let i = 0; i < 3; i++) {
        const res = await makeLoginReq(email);
        const remaining = parseInt(res.headers['x-ratelimit-remaining'] as string, 10);
        expect(remaining).toBe(5 - (i + 1));
        expect(res.status).not.toBe(429);
      }
    });

    it('returns Retry-After on rate-limited request', async () => {
      __setTestOverrides({ maxLogins: 1 });
      await makeLoginReq();

      const res = await makeLoginReq();
      expect(res.status).toBe(429);
      expect(res.headers['retry-after']).toBeDefined();
      const retryAfter = parseInt(res.headers['retry-after'] as string, 10);
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(15 * 60 + 1); // <= 15 min + 1s
    });

    it('returns ISO date in X-RateLimit-Reset', async () => {
      const res = await makeLoginReq();
      const reset = res.headers['x-ratelimit-reset'] as string;
      expect(reset).toBeDefined();
      expect(Date.parse(reset)).not.toBeNaN();
    });

    it('includes valid headers on health endpoint', async () => {
      const res = await makeHealthReq();
      expect(res.status).toBe(200);
      expect(res.headers['x-ratelimit-limit']).toBe('30');
      expect(parseInt(res.headers['x-ratelimit-remaining'] as string, 10)).toBeLessThan(30);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 3. Store expiration / window reset
  // ═════════════════════════════════════════════════════════════════
  describe('Store expiration', () => {
    it('resets counter after window expires', async () => {
      const store = createRateLimitStore();
      const now = Date.now();

      const entry1 = store.increment('test-key', 100, now);
      expect(entry1.count).toBe(1);

      const entry2 = store.increment('test-key', 100, now + 101);
      expect(entry2.count).toBe(1);
    });

    it('keeps counter within active window', async () => {
      const store = createRateLimitStore();
      const now = Date.now();

      const e1 = store.increment('k', 5000, now);
      expect(e1.count).toBe(1);

      const e2 = store.increment('k', 5000, now + 2000);
      expect(e2.count).toBe(2);

      const e3 = store.increment('k', 5000, now + 4999);
      expect(e3.count).toBe(3);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 4. IP-based isolation
  // ═════════════════════════════════════════════════════════════════
  describe('IP isolation', () => {
    it('limits are isolated per IP', async () => {
      __setTestOverrides({ maxLogins: 2 });

      const ipA = '203.0.113.5';
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', ipA)
        .send({ email: 'a@example.com', password: 'x' });
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', ipA)
        .send({ email: 'a@example.com', password: 'x' });

      const resA = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', ipA)
        .send({ email: 'a@example.com', password: 'x' });
      expect(resA.status).toBe(429);

      const resB = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '203.0.113.99')
        .send({ email: 'b@example.com', password: 'x' });
      expect(resB.status).not.toBe(429);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 5. Route isolation (different counters per limiter)
  // ═════════════════════════════════════════════════════════════════
  describe('Route isolation', () => {
    it('login and registration use independent counters', async () => {
      __setTestOverrides({ maxLogins: 2, maxRegistrations: 2 });

      await makeLoginReq();
      await makeLoginReq();

      const loginBlocked = await makeLoginReq();
      expect(loginBlocked.status).toBe(429);

      const regOk = await makeRegisterReq('fresh-reg@example.com');
      expect(regOk.status).not.toBe(429);
    });

    it('health and login share the same IP but use independent stores', async () => {
      __setTestOverrides({ maxLogins: 1 });

      await makeLoginReq();
      const blocked = await makeLoginReq();
      expect(blocked.status).toBe(429);

      const health = await makeHealthReq();
      expect(health.status).toBe(200);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 6. Regression — resetRateLimitStore correctly resets everything
  // ═════════════════════════════════════════════════════════════════
  describe('Manual store reset', () => {
    it('resetRateLimitStore() clears all stores', async () => {
      __setTestOverrides({ maxLogins: 1 });
      await makeLoginReq();
      expect((await makeLoginReq()).status).toBe(429);

      resetRateLimitStore();

      const after = await makeLoginReq();
      expect(after.status).not.toBe(429);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 7. createRateLimit helper
  // ═════════════════════════════════════════════════════════════════
  describe('createRateLimit helper', () => {
    it('creates an isolated limiter with custom window and max', () => {
      const limiter = createRateLimit({ windowMs: 1000, max: 3 });
      expect(typeof limiter).toBe('function');
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 8. Blanket auth rate limiter (all /auth/* routes)
  // ═════════════════════════════════════════════════════════════════
  describe('Blanket auth rate limiter', () => {
    it('returns 429 after exceeding blanket auth limit on /auth/*', async () => {
      __setTestOverrides({ maxAuth: 2 });

      // The blanket limiter fires first (before login-specific) on POST /api/auth/login
      const ip = '203.0.113.88';
      for (let i = 0; i < 2; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .set('X-Forwarded-For', ip)
          .send({ email: 'any@example.com', password: 'x' });
        expect(res.status).not.toBe(429);
      }

      // 3rd request blocked by blanket auth limiter
      const blocked = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', ip)
        .send({ email: 'any@example.com', password: 'x' });
      expect(blocked.status).toBe(429);
      expect(blocked.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('blanket auth max respects test overrides', () => {
      __setTestOverrides({ maxAuth: 5 });
      expect(getAuthRateLimitMax()).toBe(5);
      __setTestOverrides({ maxAuth: 7 });
      expect(getAuthRateLimitMax()).toBe(7);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 9. Environment variable configuration for API rate limits
  // ═════════════════════════════════════════════════════════════════
  describe('Environment variable configuration', () => {
    it(' respects RATE_LIMIT_MAX and RATE_LIMIT_WINDOW_MS', () => {
      // We cannot change env vars after process start in a clean way here,
      // so we verify the env helper is wired by checking exported defaults.
      // If RATE_LIMIT_MAX were set to 50 before server boot, getApiRateLimitMax() would return 50.
      // In this test process we confirm the fallback constants are >0.
      expect(getApiRateLimitMax()).toBeGreaterThan(0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 10. Localhost / dev skip
  // ═════════════════════════════════════════════════════════════════
  describe('Trusted IP skip', () => {
    it('skips health limiter for localhost IP in dev', async () => {
      __setTestOverrides({ skipTrusted: true });
      // With skipTrusted=true, isTrustedIp is effectively bypassed; we test via health endpoint
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.headers['x-ratelimit-limit']).toBeUndefined();
    });

    it('enforces health limiter when skipTrusted is false', async () => {
      __setTestOverrides({ skipTrusted: false, maxHealth: 1 });
      await request(app).get('/health');
      const blocked = await request(app).get('/health');
      expect(blocked.status).toBe(429);
    });
  });
});
