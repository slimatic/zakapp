/**
 * Copyright (c) 2024 ZakApp Contributors
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

import { Request, Response, NextFunction } from 'express';

/**
 * Per-instance in-memory rate limiting store (isolated per limiter)
 *
 * Benefits:
 * - Each limiter has its own counter, so login and registration don't share state.
 * - Counting can be scoped to userId for authenticated routes if desired.
 * - The store can be reset per-instance in tests without side effects.
 */

interface Entry {
  count: number;
  resetTime: number;
}

interface Store {
  [key: string]: Entry;
}

/** Return true if the request comes from a local / internal address. */
function isTrustedIp(req: Request): boolean {
  // X-Forwarded-For is what the keyFrom helper uses first
  const xfwd = (req.headers['x-forwarded-for'] as string) || '';
  if (xfwd) {
    const first = xfwd.split(',')[0].trim();
    if (
      first === '127.0.0.1' ||
      first === '::1' ||
      first.startsWith('10.') ||
      first.startsWith('192.168.') ||
      first.startsWith('172.16.') ||
      first.startsWith('172.17.') ||
      first.startsWith('172.18.') ||
      first.startsWith('172.19.') ||
      first.startsWith('172.20.') ||
      first.startsWith('172.21.') ||
      first.startsWith('172.22.') ||
      first.startsWith('172.23.') ||
      first.startsWith('172.24.') ||
      first.startsWith('172.25.') ||
      first.startsWith('172.26.') ||
      first.startsWith('172.27.') ||
      first.startsWith('172.28.') ||
      first.startsWith('172.29.') ||
      first.startsWith('172.30.') ||
      first.startsWith('172.31.')
    ) {
      return true;
    }
  }

  const remote = req.socket?.remoteAddress || req.ip || '';
  if (
    remote === '127.0.0.1' ||
    remote === '::1' ||
    remote === 'localhost' ||
    remote?.startsWith('10.') ||
    remote?.startsWith('192.168.') ||
    remote?.startsWith('172.16.') ||
    remote?.startsWith('172.17.') ||
    remote?.startsWith('172.18.') ||
    remote?.startsWith('172.19.') ||
    remote?.startsWith('172.20.') ||
    remote?.startsWith('172.21.') ||
    remote?.startsWith('172.22.') ||
    remote?.startsWith('172.23.') ||
    remote?.startsWith('172.24.') ||
    remote?.startsWith('172.25.') ||
    remote?.startsWith('172.26.') ||
    remote?.startsWith('172.27.') ||
    remote?.startsWith('172.28.') ||
    remote?.startsWith('172.29.') ||
    remote?.startsWith('172.30.') ||
    remote?.startsWith('172.31.')
  ) {
    return true;
  }

  return false;
}

/** Build a key from Express req (IP + optional account identifier). */
function keyFrom(req: Request, account?: string): string {
  const ip = (req.headers['x-forwarded-for'] as string)
    || req.socket?.remoteAddress
    || req.ip
    || 'unknown';
  return account ? `${ip}:${account}` : ip;
}

/** Create a new rate-limiting store (isolated from other limiters). */
export function createRateLimitStore() {
  const store: Store = {};

  function get(key: string, now: number): Entry | undefined {
    const entry = store[key];
    if (!entry) return undefined;
    if (now > entry.resetTime) {
      delete store[key];
      return undefined;
    }
    return entry;
  }

  function increment(key: string, windowMs: number, now: number): Entry {
    const existing = get(key, now);
    if (!existing) {
      const next: Entry = { count: 1, resetTime: now + windowMs };
      store[key] = next;
      return next;
    }
    existing.count += 1;
    return existing;
  }

  function reset(): void {
    Object.keys(store).forEach((k) => delete store[k]);
  }

  return { store, get, increment, reset };
}

/* ── Environment config helpers ──────────────────────────────────────── */

function envInt(key: string, fallback: number): number {
  const val = process.env[key];
  if (!val) return fallback;
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/* ── Test helpers ──────────────────────────────────────────────────── */
let _testOverrides = {
  maxRegistrations: 0, // 0 means use default
  maxLogins: 0,
  maxAuth: 0,          // blanket auth limiter override
  maxApi: 0,           // blanket API limiter override
  maxHealth: 0,
  skipTrusted: null as boolean | null,
};

export function __setTestOverrides(vals: Partial<typeof _testOverrides>) {
  _testOverrides = { ..._testOverrides, ...vals };
}

export function __resetTestOverrides() {
  _testOverrides = { maxRegistrations: 0, maxLogins: 0, maxAuth: 0, maxApi: 0, maxHealth: 0, skipTrusted: null };
}

/* ── Login rate limiter ─────────────────────────────────────────────── */

const loginStore = createRateLimitStore();

const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_MAX = 10;

export function getLoginMax(): number {
  return _testOverrides.maxLogins || LOGIN_MAX;
}

export function getLoginStore() {
  return loginStore;
}

export const loginRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const now = Date.now();
  const key = keyFrom(req, req.body?.email);
  const max = getLoginMax();
  const entry = loginStore.increment(key, LOGIN_WINDOW_MS, now);

  res.set({
    'X-RateLimit-Limit': String(max),
    'X-RateLimit-Remaining': String(Math.max(0, max - entry.count)),
    'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
  });

  if (entry.count > max) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return res.set('Retry-After', String(retryAfter)).status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many login attempts, please try again later',
        retryAfter,
      },
    });
  }

  next();
};

/* ── Registration rate limiter ──────────────────────────────────────── */

const registrationStore = createRateLimitStore();

const REGISTRATION_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const REGISTRATION_MAX = 100;

export function getRegistrationMax(): number {
  return _testOverrides.maxRegistrations || REGISTRATION_MAX;
}

export function getRegistrationStore() {
  return registrationStore;
}

export const registrationRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const now = Date.now();
  const key = keyFrom(req, req.body?.email);
  const max = getRegistrationMax();
  const entry = registrationStore.increment(key, REGISTRATION_WINDOW_MS, now);

  res.set({
    'X-RateLimit-Limit': String(max),
    'X-RateLimit-Remaining': String(Math.max(0, max - entry.count)),
    'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
  });

  if (entry.count > max) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return res.set('Retry-After', String(retryAfter)).status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many registration attempts, please try again later',
        retryAfter,
      },
    });
  }

  next();
};

/* ── Health-check rate limiter ────────────────────────────────────── */

const healthStore = createRateLimitStore();

const HEALTH_WINDOW_MS = 60 * 1000; // 1 minute
const HEALTH_MAX = 30; // 30 requests per minute

export function getHealthMax(): number {
  return _testOverrides.maxHealth || HEALTH_MAX;
}

export function getHealthStore() {
  return healthStore;
}

export const healthRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // Skip for trusted (localhost / internal) IPs in development
  if (
    (_testOverrides.skipTrusted !== false) &&
    ((_testOverrides.skipTrusted === true) || (process.env.NODE_ENV === 'development' && isTrustedIp(req)))
  ) {
    return next();
  }

  const now = Date.now();
  const key = keyFrom(req);
  const max = getHealthMax();
  const entry = healthStore.increment(key, HEALTH_WINDOW_MS, now);

  res.set({
    'X-RateLimit-Limit': String(max),
    'X-RateLimit-Remaining': String(Math.max(0, max - entry.count)),
    'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
  });

  if (entry.count > max) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many health check requests, please try again later',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      },
    });
  }

  next();
};

/* ── Generic API rate limiter ──────────────────────────────────────── */

const apiRateLimitStore = createRateLimitStore();

const API_RATE_LIMIT_WINDOW_MS = envInt('RATE_LIMIT_WINDOW_MS', 60 * 1000);    // 1 minute default
const API_RATE_LIMIT_MAX = envInt('RATE_LIMIT_MAX', 100);                     // 100 req/min default

export function getApiRateLimitMax(): number {
  return _testOverrides.maxApi || API_RATE_LIMIT_MAX;
}

export function getApiRateLimitStore() {
  return apiRateLimitStore;
}

export const apiRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const now = Date.now();
  const key = keyFrom(req);
  const max = getApiRateLimitMax();
  const windowMs = API_RATE_LIMIT_WINDOW_MS;
  const entry = apiRateLimitStore.increment(key, windowMs, now);

  res.set({
    'X-RateLimit-Limit': String(max),
    'X-RateLimit-Remaining': String(Math.max(0, max - entry.count)),
    'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
  });

  if (entry.count > max) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many API requests, please try again later',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      },
    });
  }

  next();
};

/* ── Blanket auth rate limiter (all /auth/* routes) ────────────────── */

const authRateLimitStore = createRateLimitStore();

const AUTH_WINDOW_MS = envInt('RATE_LIMIT_AUTH_WINDOW_MS', 60 * 1000);     // 1 minute default
const AUTH_MAX = envInt('RATE_LIMIT_AUTH_MAX', 10);                         // 10 req/min per IP default

export function getAuthRateLimitMax(): number {
  return _testOverrides.maxAuth || AUTH_MAX;
}

export function getAuthRateLimitStore() {
  return authRateLimitStore;
}

/**
 * Strict blanket rate limiter for all /auth/* routes.
 * In development, requests from localhost / private IPs are skipped.
 */
export const authRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // Skip for trusted (localhost / internal) IPs in development
  if (
    (_testOverrides.skipTrusted !== false) &&
    ((_testOverrides.skipTrusted === true) || (process.env.NODE_ENV === 'development' && isTrustedIp(req)))
  ) {
    return next();
  }

  const now = Date.now();
  const key = keyFrom(req);
  const max = getAuthRateLimitMax();
  const windowMs = AUTH_WINDOW_MS;
  const entry = authRateLimitStore.increment(key, windowMs, now);

  res.set({
    'X-RateLimit-Limit': String(max),
    'X-RateLimit-Remaining': String(Math.max(0, max - entry.count)),
    'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
  });

  if (entry.count > max) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return res.set('Retry-After', String(retryAfter)).status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts, please try again later',
        retryAfter,
      },
    });
  }

  next();
};

/* ── Legacy exports for backward compatibility ──────────────────────── */

export const resetRateLimitStore = () => {
  loginStore.reset();
  registrationStore.reset();
  healthStore.reset();
  apiRateLimitStore.reset();
  authRateLimitStore.reset();
};

export const setRegistrationRateLimitMax = (max: number) => {
  _testOverrides.maxRegistrations = max;
};

export const setLoginRateLimitMax = (max: number) => {
  _testOverrides.maxLogins = max;
};

export const createRateLimit = (options: { windowMs: number; max: number; message?: string }) => {
  const localStore = createRateLimitStore();
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = keyFrom(req);
    const entry = localStore.increment(key, options.windowMs, now);

    res.set({
      'X-RateLimit-Limit': String(options.max),
      'X-RateLimit-Remaining': String(Math.max(0, options.max - entry.count)),
      'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
    });

    if (entry.count > options.max) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: options.message || 'Too many requests, please try again later',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        },
      });
    }

    next();
  };
};
