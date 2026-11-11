/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * The zero-knowledge plugin OWNS encryption at the storage boundary.
 *
 * A caller that encrypts first and then hands the record to RxDB gets a second
 * layer: `preInsert` used to encrypt unconditionally while `preSave` skipped
 * already-encrypted values. One decrypt then returns a ZK1 blob instead of the
 * plaintext, which the UI renders as "Encrypted recipient".
 *
 * These tests pin the invariant on BOTH write paths: a value that is already
 * encrypted must survive as-is, and a plaintext value must gain exactly one
 * layer.
 */
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { webcrypto } from 'node:crypto';
import { createRxDatabase, addRxPlugin, type RxDatabase } from 'rxdb';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { RxDBZeroKnowledgePlugin } from '../plugins/zeroKnowledgePlugin';
import { cryptoService } from '../../services/CryptoService';
import { PaymentEncryptionService } from '../../services/PaymentEncryptionService';

const DB_NAME = 'zkplugin';
const schema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    recipientName: { type: 'string', encrypted: true },
    notes: { type: 'string', encrypted: true },
  },
  required: ['id', 'recipientName'],
};

let db: RxDatabase;

beforeAll(async () => {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
  Object.defineProperty((globalThis as any).window ?? globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
  await cryptoService.deriveKey('test-password', 'test-salt');
  addRxPlugin(RxDBZeroKnowledgePlugin);
});

afterEach(async () => {
  await db?.remove();
});

const newDb = async (name: string) => {
  const database = await createRxDatabase({ name, storage: getRxStorageMemory() });
  await database.addCollections({ things: { schema } });
  return database;
};

/** One decrypt, exactly the way the repository read path does it. */
const readOnce = async (packed: string) => {
  const p = cryptoService.unpackEncrypted(packed)!;
  return cryptoService.decrypt(p.ciphertext, p.iv);
};

describe('zeroKnowledgePlugin write paths', () => {
  it('insert: plaintext gains exactly one layer', async () => {
    db = await newDb('zkplain');
    await db.things.insert({ id: '1', recipientName: 'Masjid Al-Noor' });

    const stored = (await db.things.findOne('1').exec()).get('recipientName');
    expect(cryptoService.isEncrypted(stored)).toBe(true);
    expect(await readOnce(stored)).toBe('Masjid Al-Noor');
  });

  it('insert: an already-encrypted value is not encrypted again', async () => {
    db = await newDb('zkidem');
    const pre = await PaymentEncryptionService.encryptPaymentData({ recipientName: 'Masjid Al-Noor' });
    const value = pre.recipientName as string;
    expect(cryptoService.isEncrypted(value)).toBe(true);

    await db.things.insert({ id: '1', recipientName: value });

    const stored = (await db.things.findOne('1').exec()).get('recipientName');
    // The one layer that already existed is preserved, not wrapped again.
    expect(await readOnce(stored)).toBe('Masjid Al-Noor');
  });

  it('bulkUpsert: an already-encrypted value is not encrypted again', async () => {
    db = await newDb('zkbulk');
    const pre = await PaymentEncryptionService.encryptPaymentData({ recipientName: 'Masjid Al-Noor', notes: 'Ramadan' });

    await db.things.bulkUpsert([{ id: '1', recipientName: pre.recipientName as string, notes: pre.notes as string }]);

    const doc = await db.things.findOne('1').exec();
    expect(await readOnce(doc.get('recipientName'))).toBe('Masjid Al-Noor');
    expect(await readOnce(doc.get('notes'))).toBe('Ramadan');
  });
});
