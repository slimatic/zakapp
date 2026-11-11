/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * A pulled CouchDB document must keep its `_deleted` flag.
 *
 * rxdb's `couchDBDocToRxDocData` does `_deleted = !!doc._deleted`, so returning
 * the decrypted body without the flag writes a deletion back as a live row.
 * The next device then resurrects what the first device deleted.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { webcrypto } from 'node:crypto';
import { cryptoService } from '../CryptoService';
import { decryptPulledDocument } from '../SyncService';

beforeAll(async () => {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
  Object.defineProperty((globalThis as any).window ?? globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
  await cryptoService.deriveKey('test-password', 'test-salt');
});

describe('decryptPulledDocument', () => {
  it('passes a tombstone through as deleted, without decrypting it', async () => {
    const pulled = await decryptPulledDocument({
      _id: 'payments/1',
      _rev: '2-abc',
      _deleted: true,
      encrypted: 'not-a-real-ciphertext',
      iv: 'x',
      tag: 'y',
    });

    expect(pulled).toEqual({ _id: 'payments/1', _rev: '2-abc', _deleted: true });
  });

  it('decrypts a live document', async () => {
    const sealed = await cryptoService.encryptObject({ id: '1', recipientName: 'Masjid' });
    const pulled = await decryptPulledDocument({
      _id: 'payments/1',
      _rev: '1-abc',
      encrypted: (sealed as any).ciphertext ?? (sealed as any).encrypted,
      iv: sealed.iv,
      tag: sealed.tag,
    });

    expect(pulled).toMatchObject({ _id: 'payments/1', _rev: '1-abc', id: '1', recipientName: 'Masjid' });
    expect((pulled as any)._deleted).toBeUndefined();
  });

  it('leaves design documents untouched', async () => {
    const design = { _id: '_design/filter', _rev: '1-x', filters: {} };
    expect(await decryptPulledDocument(design)).toBe(design);
  });
});
