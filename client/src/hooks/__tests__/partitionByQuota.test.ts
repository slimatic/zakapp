/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * A restore must not lose rows to the quota counter, and a no-op re-import
 * must not be refused because the account is already full. Both were caused by
 * slicing the incoming list by `remaining`, which counts stored rows without
 * noticing that most of the incoming ids are those same stored rows.
 */
import { describe, it, expect } from 'vitest';
import { partitionByQuota } from '../useRepositoryLimits';

const collectionWith = (ids: string[]) => ({
  find: () => ({
    exec: async () => ids.map((id) => ({ get: (path: string) => (path === 'id' ? id : undefined) })),
  }),
}) as any;

describe('partitionByQuota', () => {
  it('accepts updates to stored rows even when the account is full', async () => {
    const incoming = [{ id: 'a' }, { id: 'b' }];
    const result = await partitionByQuota('payments', collectionWith(['a', 'b']), { maxPayments: 2 }, 'u', incoming);

    expect(result.accepted).toEqual(incoming);
    expect(result.skipped).toBe(0);
  });

  it('keeps every update and only the new rows that fit', async () => {
    const incoming = [{ id: 'a' }, { id: 'new-1' }, { id: 'new-2' }];
    // One slot left (limit 3, two stored).
    const result = await partitionByQuota('payments', collectionWith(['a', 'b']), { maxPayments: 3 }, 'u', incoming);

    expect(result.accepted.map((d) => d.id)).toEqual(['a', 'new-1']);
    expect(result.skipped).toBe(1);
  });

  it('accepts everything when the account has no limit', async () => {
    const incoming = [{ id: 'x' }, { id: 'y' }];
    const result = await partitionByQuota('payments', collectionWith([]), {}, 'u', incoming);

    expect(result.accepted).toEqual(incoming);
    expect(result.skipped).toBe(0);
  });
});
