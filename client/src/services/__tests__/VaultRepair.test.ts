/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * A value written twice must be recoverable without the backup file, and a
 * value written once must be left alone. Runs against a real RxDB collection
 * with the real plugin so the write path under test is the one that ships.
 */
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { webcrypto } from 'node:crypto';
import { createRxDatabase, addRxPlugin, type RxDatabase } from 'rxdb';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { RxDBZeroKnowledgePlugin } from '../../db/plugins/zeroKnowledgePlugin';
import { cryptoService } from '../CryptoService';
import { repairDoubleEncryptedFields } from '../VaultRepair';

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
  await database.addCollections({ payment_records: { schema } });
  return database;
};

const readOnce = async (packed: string) => {
  const p = cryptoService.unpackEncrypted(packed)!;
  return cryptoService.decrypt(p.ciphertext, p.iv);
};

/** Reproduces a row written by the old repository: plaintext encrypted twice. */
const doubleWrap = async (plain: string) => {
  const once = await cryptoService.encrypt(plain);
  const single = cryptoService.packEncrypted(once.iv, once.cipherText);
  const twice = await cryptoService.encrypt(single);
  return cryptoService.packEncrypted(twice.iv, twice.cipherText);
};

describe('repairDoubleEncryptedFields', () => {
  it('unwraps the second layer and leaves a single readable layer', async () => {
    db = await newDb('repair1');
    const damaged = await doubleWrap('Masjid Al-Noor');
    // Written through the collection so preSave is the shipping write path.
    await db.payment_records.insert({ id: '1', recipientName: await doubleWrap('placeholder') });
    await (await db.payment_records.findOne('1').exec()).incrementalPatch({ recipientName: damaged });

    const before = (await db.payment_records.findOne('1').exec()).get('recipientName');
    expect(cryptoService.isEncrypted(await readOnce(before))).toBe(true); // still wrapped

    const result = await repairDoubleEncryptedFields({ db, force: true });
    expect(result.repaired).toBe(1);
    expect(result.fields).toBe(1);

    const after = (await db.payment_records.findOne('1').exec()).get('recipientName');
    expect(await readOnce(after)).toBe('Masjid Al-Noor');
  });

  it('is idempotent: a second run changes nothing', async () => {
    db = await newDb('repair2');
    await db.payment_records.insert({ id: '1', recipientName: await doubleWrap('Masjid') });

    await repairDoubleEncryptedFields({ db, force: true });
    const second = await repairDoubleEncryptedFields({ db, force: true });

    expect(second.repaired).toBe(0);
    expect(await readOnce((await db.payment_records.findOne('1').exec()).get('recipientName'))).toBe('Masjid');
  });

  it('leaves a single-layer row and a cleartext row alone', async () => {
    db = await newDb('repair3');
    await db.payment_records.insert({ id: '1', recipientName: 'Masjid' });
    // A row from another install whose key this session does not hold.
    const foreign = 'ZK1:AAAAAAAAAAAAAAAA:BBBBBBBBBBBBBBBBBBBB';
    await (await db.payment_records.findOne('1').exec()).incrementalPatch({ notes: foreign });

    const result = await repairDoubleEncryptedFields({ db, force: true });

    expect(result.repaired).toBe(0);
    const doc = await db.payment_records.findOne('1').exec();
    expect(await readOnce(doc.get('recipientName'))).toBe('Masjid');
    expect(doc.get('notes')).toBe(foreign);
  });
});
