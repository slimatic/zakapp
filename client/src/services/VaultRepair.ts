/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Unwraps values that were encrypted twice.
 *
 * WHY THIS EXISTS
 *   `usePaymentRepository` encrypted a payment before handing it to RxDB, and
 *   the zero-knowledge plugin's `preInsert` encrypted it again. The read path
 *   unwraps one layer, so the user saw `ZK1:…` under "Encrypted recipient"
 *   while the plaintext sat one layer below. Both writers are fixed, but rows
 *   already written keep their second layer, and no code path would ever
 *   remove it.
 *
 * WHAT IT DOES
 *   Decrypts each stored value once. If the result is itself a ZK1 blob, the
 *   value was double-wrapped: the inner blob is written back unchanged, so
 *   the row ends with exactly one layer, under the same key, with no
 *   re-encryption. A second run finds plaintext and does nothing.
 *
 * WHAT IT REFUSES
 *   Values that cannot be decrypted under the current key are left exactly as
 *   they are. They may belong to another install's key, and rewriting them
 *   would destroy the only copy.
 */

import { getDb } from '../db';
import { cryptoService } from './CryptoService';
import { getEncryptedPaths, COLLECTIONS } from './VaultRekey';
import { logger } from '../utils/logger';

export interface DoubleWrapRepairResult {
    /** Documents rewritten with one encryption layer instead of two. */
    repaired: number;
    /** Fields unwrapped across all repaired documents. */
    fields: number;
    /** Documents left untouched because a value could not be decrypted. */
    skipped: number;
}

const MARKER_PREFIX = 'zakapp_doublewrap_repair_v1_';

/** Run once per browser/user; the scan is idempotent, the marker only saves work. */
const alreadyRan = (userId?: string): boolean => {
    if (!userId) return false;
    try {
        return localStorage.getItem(MARKER_PREFIX + userId) === 'done';
    } catch {
        return false;
    }
};

const markDone = (userId?: string): void => {
    if (!userId) return;
    try {
        localStorage.setItem(MARKER_PREFIX + userId, 'done');
    } catch {
        // A full quota means the scan runs again next login; it is a no-op.
    }
};

export const repairDoubleEncryptedFields = async (
    opts: { db?: any; userId?: string; force?: boolean } = {}
): Promise<DoubleWrapRepairResult> => {
    const result: DoubleWrapRepairResult = { repaired: 0, fields: 0, skipped: 0 };
    if (!opts.force && alreadyRan(opts.userId)) return result;

    const db = opts.db ?? (await getDb());
    if (!db) return result;

    for (const name of COLLECTIONS) {
        const collection = db[name];
        if (!collection) continue;

        const paths = getEncryptedPaths(collection);
        if (paths.length === 0) continue;

        const docs = await collection.find().exec();
        for (const doc of docs) {
            const updates: Record<string, unknown> = {};

            for (const path of paths) {
                const stored = doc.get(path);
                if (!cryptoService.isEncrypted(stored)) continue;

                const packed = cryptoService.unpackEncrypted(stored);
                if (!packed) continue;

                let inner: string;
                try {
                    inner = await cryptoService.decrypt(packed.ciphertext, packed.iv);
                } catch {
                    result.skipped += 1;
                    continue;
                }

                if (inner === stored) continue; // decrypt returned its input (fail-open) — nothing to repair
                if (cryptoService.isEncrypted(inner)) updates[path] = inner;
            }

            if (Object.keys(updates).length === 0) continue;

            try {
                // preSave sees an already-encrypted value and leaves it alone,
                // so this stores the single remaining layer as-is.
                await doc.incrementalPatch({ ...updates, updatedAt: new Date().toISOString() });
                result.repaired += 1;
                result.fields += Object.keys(updates).length;
            } catch (err) {
                logger.error(`Double-wrap repair failed for ${name}/${doc.primary}`, err);
                result.skipped += 1;
            }
        }
    }

    if (result.repaired > 0 || result.skipped === 0) markDone(opts.userId);
    if (result.repaired > 0) {
        logger.info(`Double-wrap repair: ${result.fields} field(s) in ${result.repaired} record(s)`);
    }
    return result;
};
