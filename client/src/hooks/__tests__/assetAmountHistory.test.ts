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
 * Asset amount history is recorded locally.
 *
 * Assets live in this browser (RxDB/IndexedDB) and `Asset.value` is encrypted, so
 * the server cannot read a value or compute a history from one. The history is
 * therefore written by the same layer that writes the asset.
 *
 * These guard the two ways that can silently fail:
 *
 * 1. No event is written at all, so the page shows an empty history forever and
 *    the feature looks like it does not exist.
 * 2. An event is written on every save, including saves that changed nothing, so
 *    the real changes are buried under duplicates and the history stops being
 *    evidence of anything.
 *
 * Plus the availability rule: a history write must never fail an asset save.
 * Losing the edit is worse than losing its log line.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const assetsInsert = vi.fn();
const eventsInsert = vi.fn();
const patch = vi.fn(async () => undefined);
const assetsFindOne = vi.fn();
const existingDoc = (value = 1000) => ({ value, currency: 'USD', metadata: '{}', patch });

// The repository also opens a live subscription (db.assets.find().$), so the mock
// has to look like RxDB or the hook throws before it exposes addAsset.
vi.mock('../../db', () => ({
  useDb: () => ({
    assets: {
      insert: assetsInsert,
      findOne: assetsFindOne,
      find: () => ({
        exec: async () => [],
        $: { pipe: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }) },
      }),
    },
    asset_amount_events: { insert: eventsInsert },
  }),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));

import { useAssetRepository } from '../useAssetRepository';

const asset = (value: unknown) => ({
  id: 'a1',
  name: 'Gold',
  type: 'GOLD' as any,
  value: value as any,
  currency: 'USD',
  acquisitionDate: '2026-01-01T00:00:00.000Z',
  isActive: true,
});

describe('asset amount history is recorded', () => {
  beforeEach(() => {
    assetsInsert.mockReset().mockImplementation(async (doc: any) => doc);
    eventsInsert.mockReset().mockImplementation(async (doc: any) => doc);
    patch.mockClear();
    // No doc yet: an id that is not present means a genuine create.
    assetsFindOne.mockReset().mockImplementation(() => ({ exec: async () => null }));
  });

  it('records a CREATED event carrying the asset value', async () => {
    const { result } = renderHook(() => useAssetRepository());
    await waitFor(() => expect(result.current.addAsset).toBeTruthy());

    await result.current.addAsset(asset(87500.25));

    expect(eventsInsert).toHaveBeenCalledTimes(1);
    const event = eventsInsert.mock.calls[0][0];
    expect(event.eventType).toBe('CREATED');
    expect(event.amount).toBe(87500.25);
    expect(event.assetId).toBe('a1');
    expect(event.userId).toBe('u1');
    expect(event.effectiveDate).toBeTruthy();
  });

  it('parses a numeric string value rather than storing a string', async () => {
    const { result } = renderHook(() => useAssetRepository());
    await waitFor(() => expect(result.current.addAsset).toBeTruthy());

    await result.current.addAsset(asset('2500.50'));

    expect(eventsInsert.mock.calls[0][0].amount).toBe(2500.5);
  });

  it('skips recording when the value is not a finite number', async () => {
    // An unparseable value must not become NaN in the history: NaN poisons every
    // later comparison, so the asset would silently vanish from amount-at-date.
    const { result } = renderHook(() => useAssetRepository());
    await waitFor(() => expect(result.current.addAsset).toBeTruthy());

    await result.current.addAsset(asset('not-a-number'));

    expect(eventsInsert).not.toHaveBeenCalled();
  });

  it('records an UPDATED event when the value actually changes', async () => {
    assetsFindOne.mockImplementation(() => ({ exec: async () => existingDoc(1000) }));
    const { result } = renderHook(() => useAssetRepository());
    await waitFor(() => expect(result.current.updateAsset).toBeTruthy());

    await result.current.updateAsset('a1', { value: 1500 } as any);

    expect(eventsInsert).toHaveBeenCalledTimes(1);
    const event = eventsInsert.mock.calls[0][0];
    expect(event.eventType).toBe('UPDATED');
    expect(event.amount).toBe(1500);
  });

  it('does NOT record when the value is unchanged', async () => {
    // The edit form submits the whole asset, so saving without touching the value
    // would otherwise append a duplicate on every visit and bury the real changes.
    assetsFindOne.mockImplementation(() => ({ exec: async () => existingDoc(1000) }));
    const { result } = renderHook(() => useAssetRepository());
    await waitFor(() => expect(result.current.updateAsset).toBeTruthy());

    // The mocked doc holds 1000; submit the same value.
    await result.current.updateAsset('a1', { value: 1000 } as any);

    expect(patch).toHaveBeenCalled();
    expect(eventsInsert).not.toHaveBeenCalled();
  });

  // Re-importing the same backup must overwrite in place, not insert a second
  // copy: the id already exists, and insert would throw CONFLICT per row.
  it('updates an existing asset in place instead of inserting a duplicate', async () => {
    assetsFindOne.mockImplementation(() => ({ exec: async () => existingDoc(1000) }));
    const { result } = renderHook(() => useAssetRepository());
    await waitFor(() => expect(result.current.addAsset).toBeTruthy());

    await result.current.addAsset(asset(1200));

    expect(patch).toHaveBeenCalled();
    expect(assetsInsert).not.toHaveBeenCalled();
  });

  it('does not fail the asset save when recording history throws', async () => {
    // History is best-effort: the asset edit is the thing the user asked for.
    eventsInsert.mockImplementation(async () => { throw new Error('quota exceeded'); });
    const { result } = renderHook(() => useAssetRepository());
    await waitFor(() => expect(result.current.addAsset).toBeTruthy());

    await expect(result.current.addAsset(asset(100))).resolves.toBeTruthy();
    expect(assetsInsert).toHaveBeenCalledTimes(1);
  });
});
