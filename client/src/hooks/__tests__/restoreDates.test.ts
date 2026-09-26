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

/**
 * A restored backup must keep the dates that were exported.
 *
 * Reported after a successful export -> wipe -> import: everything came back, but
 * asset age looked like it had been reset. It had, twice over:
 *
 * 1. Every repository set `createdAt: new Date()` AFTER spreading the payload, so
 *    the preserved value from the file was overwritten. `acquisitionDate` survived
 *    the import correctly - `createdAt` did not.
 * 2. The detail page computed "Asset Age" from `createdAt` and never showed
 *    `acquisitionDate` at all. So the field that WAS restored was invisible, and
 *    the label was reading a field that says nothing about how long a holding has
 *    been held.
 *
 * Date provenance matters for zakat, not just tidiness: hawl is a lunar year of
 * ownership, so resetting dates makes old holdings look new.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const insert = vi.fn();

// The repository also opens a live subscription (db.assets.find().$), so the mock
// has to look like RxDB or the hook throws before it exposes addAsset.
vi.mock('../../db', () => ({
  useDb: () => ({
    assets: {
      insert,
      find: () => ({
        exec: async () => [],
        $: { pipe: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }) },
      }),
    },
  }),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));

import { useAssetRepository } from '../useAssetRepository';

describe('restore keeps original dates', () => {
  beforeEach(() => insert.mockReset().mockImplementation(async (doc: any) => doc));

  it('preserves createdAt supplied by a restore instead of overwriting it', async () => {
    const { result } = renderHook(() => useAssetRepository());
    await waitFor(() => expect(result.current.addAsset).toBeTruthy());

    // An asset the user acquired in 2019 and entered a year ago.
    const restored = {
      id: 'a1',
      name: 'Gold',
      type: 'GOLD' as any,
      value: 87500.25,
      currency: 'USD',
      acquisitionDate: '2019-03-01T00:00:00.000Z',
      createdAt: '2025-09-01T00:00:00.000Z',
      isActive: true,
    };

    await result.current.addAsset(restored);

    const written = insert.mock.calls[0][0];
    // The whole point: these must survive, not be reset to "now".
    expect(written.acquisitionDate).toBe('2019-03-01T00:00:00.000Z');
    expect(written.createdAt).toBe('2025-09-01T00:00:00.000Z');
  });

  it('still stamps the current time for a genuinely new asset', async () => {
    const { result } = renderHook(() => useAssetRepository());
    await waitFor(() => expect(result.current.addAsset).toBeTruthy());

    // The form sends no createdAt, so normal creation is unaffected by the fix.
    const fresh = {
      name: 'Cash', type: 'CASH' as any, value: 100, currency: 'USD',
      acquisitionDate: '2026-09-25T00:00:00.000Z',
    };
    const before = Date.now();
    await result.current.addAsset(fresh);

    const written = insert.mock.calls[0][0];
    const writtenAt = new Date(written.createdAt).getTime();
    expect(writtenAt).toBeGreaterThanOrEqual(before - 1000);
    expect(writtenAt).toBeLessThanOrEqual(Date.now() + 1000);
    // An id is still generated for a new asset.
    expect(written.id).toBeTruthy();
  });

  it('updatedAt is always now - only createdAt is provenance', async () => {
    const { result } = renderHook(() => useAssetRepository());
    await waitFor(() => expect(result.current.addAsset).toBeTruthy());

    await result.current.addAsset({
      name: 'X', type: 'CASH' as any, value: 1, currency: 'USD',
      acquisitionDate: '2019-01-01T00:00:00.000Z',
      createdAt: '2019-01-01T00:00:00.000Z',
      updatedAt: '2019-01-01T00:00:00.000Z',
    });

    const written = insert.mock.calls[0][0];
    expect(written.createdAt).toBe('2019-01-01T00:00:00.000Z');
    expect(new Date(written.updatedAt).getTime()).toBeGreaterThan(new Date('2019-01-01').getTime());
  });
});
