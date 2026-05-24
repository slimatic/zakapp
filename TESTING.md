# ZakApp Server Testing Guide

## Test Runner: Vitest

The `zakapp-server` package uses **Vitest** (`^3.2.4`) exclusively. All previous Jest configuration has been removed.

### Why Vitest
- Native TypeScript support (no ts-jest overhead).
- Vite-based instant cold start for tests.
- Compatible mock API (`vi` instead of `jest`).
- Unified toolchain with the client's Vite build.

## Configuration

- **Config file**: `server/vitest.config.ts`
- **Global setup**: `server/test/globalSetup.ts` (runs Prisma `migrate deploy` against `TEST_DATABASE_URL` before tests)
- **Setup files**: `server/test/setupEnv.ts` (loads `.env.test` into `process.env`)
- **Global teardown**: `server/test/globalTeardown.ts` (currently a no-op hook)
- **Globals enabled** (`globals: true`) so `describe`, `it`, `expect`, `vi` do not need to be imported in every test.
- **Environment**: `node`
- **Pool**: `forks` (prevents Prisma connection pool contamination across test files)

## Scripts

| Task | Command |
|------|---------|
| Run tests once | `npm test` |
| Watch mode | `npm run test:watch` |
| With coverage | `npm run test:coverage` |

## Test Conventions (MUST READ)

1. **Import globals explicitly** — While `globals: true` allows skipping imports, the codebase standard is to still import from `vitest` for clarity:

```ts
   import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
```

2. **Use `vi` for mocks** — Never reference `jest` globals (`jest.fn`, `jest.mock`, etc). The only approved global APIs come from `vitest`:

   - `vi.fn()` for spies/mocks
   - `vi.mock(...)` for module mocking
   - `vi.spyOn(...)` for partial object mocking
   - `vi.useFakeTimers()` / `vi.useRealTimers()` for time control

3. **No `jest-environment-jsdom`** — The server suite runs in `node` environment only. Any DOM-specific testing is the client's responsibility.

4. **No stale `setupTests.ts`** — The old `test/setupTests.ts` and `tests/setup.ts` (Jest-style timeout + env setup) have been removed. Environment bootstrap lives in `test/setupEnv.ts` and migration setup in `test/globalSetup.ts`.

## Directory Layout

```
server/
├── vitest.config.ts          # single source of truth
├── test/
│   ├── globalSetup.ts        # DB schema readiness
│   ├── globalTeardown.ts     # cleanup hook (no-op)
│   ├── setupEnv.ts           # env var loading
│   ├── setupDatabase.ts      # test DB helpers
│   └── databaseHelpers.ts    # DB seed/reset utilities
├── tests/
│   ├── contract/            # API contract tests (*.test.ts)
│   ├── integration/         # integration tests (*.test.ts)
│   ├── performance/         # perf tests (*.test.ts)
│   ├── unit/                # service unit tests (*.test.ts)
│   └── helpers/             # test factories
└── src/
    └── __tests__/            # unit + integration tests (*.test.ts)
```

## Linting

ESLint is configured via `eslint.config.js` (flat config). The server no longer uses `.eslintrc.js`. Test files are linted with the same rule set as source files. No `jest` global is declared.
