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
 * You should have received a copy of the GNU Affero General Public
 * License along with this program. If not, see
 * <https://www.gnu.org/licenses/>.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

import { useNisabThreshold } from '../useNisabThreshold';

/**
 * A payload whose two code paths give DIFFERENT answers.
 *
 * The server returns a `pricePerGram` and a pre-multiplied `nisabValue`. The
 * multiplication is where the gram convention enters, and the server bakes its own
 * (87.48 / 612.36) into `nisabValue`. So at 100 per gram the server says 8748, and:
 *
 *   multiplying with 'tola'    100 x 87.48 = 8748   (agrees with the server)
 *   multiplying with 'aaoifi'  100 x 85    = 8500   (proves the setting was applied)
 *   reading `nisabValue`       always 8748, whichever convention was asked for
 *
 * That last row is the regression the standard tests exist to catch: a hook that
 * trusts `nisabValue` makes the user's setting silently ineffective. A fixture
 * exercising only the default would pass either way.
 */
function nisabResponse(currency: string) {
  return {
    success: true,
    data: {
      currency,
      effectiveDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      goldPrice: { pricePerGram: 100, currency, nisabGrams: 87.48, nisabValue: 8748 },
      silverPrice: { pricePerGram: 1, currency, nisabGrams: 612.36, nisabValue: 612.36 },
    },
  };
}

function makeWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

/**
 * Regression test for issue #310 (v0.15.2 user report).
 *
 * The nisab threshold hook built its React Query key from the requested currency but
 * never SENT the currency to the server, so every user got the USD nisab. An IDR
 * user's dashboard then compared an IDR total against a USD threshold (+343301.6%
 * nonsense). The fetch must include ?currency=<code> so the server resolves metal
 * prices in that currency.
 */
describe('useNisabThreshold — issue #310 currency param regression', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => nisabResponse('IDR'),
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('sends the requested currency as a query param', async () => {
    renderHook(() => useNisabThreshold('IDR', 'GOLD'), { wrapper: makeWrapper(queryClient) });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('/api/zakat/nisab');
    expect(url).toContain('currency=IDR');
  });

  it('defaults to currency=USD when no currency is passed', async () => {
    fetchMock.mockClear();
    renderHook(() => useNisabThreshold(), { wrapper: makeWrapper(queryClient) });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('currency=USD');
  });
});

/**
 * The gram convention belongs to the user, so the hook has to apply it.
 * See the fixture note above for why these assertions distinguish the two paths.
 */
describe('useNisabThreshold — nisab weight standard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, json: async () => nisabResponse('USD') });
  });

  afterEach(() => {
    queryClient.clear();
  });

  async function thresholdFor(standard?: string, basis: 'GOLD' | 'SILVER' = 'GOLD') {
    const { result } = renderHook(() => useNisabThreshold('USD', basis, standard), {
      wrapper: makeWrapper(queryClient),
    });
    await waitFor(() => expect(result.current.nisabAmount).toBeDefined());
    return result.current;
  }

  it("applies the selected convention rather than the server's pre-multiplied value", async () => {
    // 100/g: tola = 100 x 87.48, aaoifi = 100 x 85. The server's `nisabValue` is 8748.
    expect((await thresholdFor('tola')).nisabAmount).toBeCloseTo(8748, 2);
    // 8500 can only come from multiplying by the chosen 85 g.
    expect((await thresholdFor('aaoifi')).nisabAmount).toBeCloseTo(8500, 2);
  });

  it('applies the convention to the silver basis too', async () => {
    // 1/g: tola = 612.36, aaoifi = 595.
    expect((await thresholdFor('tola', 'SILVER')).nisabAmount).toBeCloseTo(612.36, 2);
    expect((await thresholdFor('aaoifi', 'SILVER')).nisabAmount).toBeCloseTo(595, 2);
  });

  it('falls back to the shipped default when the preference is absent or unrecognised', async () => {
    // Must not produce the OTHER convention, and must not produce NaN.
    expect((await thresholdFor()).nisabAmount).toBeCloseTo(8748, 2);
    expect((await thresholdFor('')).nisabAmount).toBeCloseTo(8748, 2);
    expect((await thresholdFor('nonsense')).nisabAmount).toBeCloseTo(8748, 2);
  });

  it('reports the convention actually applied, so callers can label the figure', async () => {
    expect((await thresholdFor('aaoifi')).nisabStandard).toBe('aaoifi');
    // An unrecognised value reports the standard used, not the string passed in.
    expect((await thresholdFor('nonsense')).nisabStandard).toBe('tola');
  });

  it('keys the cache by convention, so switching cannot serve a stale threshold', async () => {
    const first = renderHook(() => useNisabThreshold('USD', 'GOLD', 'tola'), {
      wrapper: makeWrapper(queryClient),
    });
    await waitFor(() => expect(first.result.current.nisabAmount).toBeDefined());

    const second = renderHook(() => useNisabThreshold('USD', 'GOLD', 'aaoifi'), {
      wrapper: makeWrapper(queryClient),
    });
    await waitFor(() => expect(second.result.current.nisabAmount).toBeCloseTo(8500, 2));

    // One fetch per convention, and the two results coexist rather than overwriting.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(first.result.current.nisabAmount).toBeCloseTo(8748, 2);
    expect(first.result.current.nisabStandard).toBe('tola');
  });

  it('uses the server figure only when no per-gram price is available', async () => {
    // A legacy or flat payload must still yield a usable threshold rather than NaN.
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          currency: 'USD',
          lastUpdated: new Date().toISOString(),
          goldPrice: { nisabValue: 8748 },
          silverPrice: { nisabValue: 612.36 },
        },
      }),
    });

    expect((await thresholdFor('aaoifi')).nisabAmount).toBeCloseTo(8748, 2);
  });
});
