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

/**
 * Regression test for issue #310 (v0.15.2 user report).
 *
 * The nisab threshold hook built its React Query key from the requested
 * currency but never SENT the currency to the server, so every user got the
 * USD nisab. An IDR user's dashboard then compared an IDR total against a
 * USD threshold (+343301.6% nonsense). The fetch must include
 * ?currency=<code> so the server resolves metal prices in that currency.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

import { useNisabThreshold } from '../useNisabThreshold';

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
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(() => useNisabThreshold('IDR', 'GOLD'), { wrapper });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('/api/zakat/nisab');
    expect(url).toContain('currency=IDR');
  });

  it('defaults to currency=USD when no currency is passed', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    fetchMock.mockClear();
    renderHook(() => useNisabThreshold(), { wrapper });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('currency=USD');
  });
});