/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
    createRateLimit,
    loginRateLimit,
    registrationRateLimit,
    resetRateLimitStore,
} from '../../src/middleware/RateLimitMiddleware';

const req = (ip = '203.0.113.7') => ({ ip } as any);

const res = () => {
    const r: any = {
        statusCode: 200,
        body: null,
        headers: {},
        status(code: number) { r.statusCode = code; return r; },
        json(body: any) { r.body = body; return r; },
        set(headers: Record<string, string>) { Object.assign(r.headers, headers); return r; },
    };
    return r;
};

const call = (middleware: any, ip = '203.0.113.7') => {
    const response = res();
    let passed = false;
    middleware(req(ip), response, () => { passed = true; });
    return { passed, response };
};

beforeEach(() => resetRateLimitStore());

describe('rate limit scoping', () => {
    it('blocks once the limit is reached', () => {
        const limiter = createRateLimit({ windowMs: 60_000, max: 2, scope: 'probe' });

        expect(call(limiter).passed).toBe(true);
        expect(call(limiter).passed).toBe(true);

        const blocked = call(limiter);
        expect(blocked.passed).toBe(false);
        expect(blocked.response.statusCode).toBe(429);
        expect(blocked.response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('keeps login and registration in separate buckets for the same IP', () => {
        // The registration budget is 50 in the test env. Exhausting it must not
        // consume the login budget - they used to share one IP-keyed counter.
        for (let i = 0; i < 50; i += 1) {
            expect(call(registrationRateLimit).passed).toBe(true);
        }
        expect(call(registrationRateLimit).passed).toBe(false);

        expect(call(loginRateLimit).passed).toBe(true);
    });

    it('scopes by limiter, not only by IP', () => {
        const a = createRateLimit({ windowMs: 60_000, max: 1, scope: 'a' });
        const b = createRateLimit({ windowMs: 60_000, max: 1, scope: 'b' });

        expect(call(a).passed).toBe(true);
        expect(call(a).passed).toBe(false);
        expect(call(b).passed).toBe(true);
    });
});
