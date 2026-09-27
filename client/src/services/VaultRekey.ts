/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

/**
 * Re-encrypts the local vault under a different password.
 *
 * WHY THIS EXISTS
 *   The vault key is PBKDF2(password, salt), so changing the account
 *   password changes the key that every encrypted field was written with.
 *   Nothing re-encrypted the existing rows, so a password change left the
 *   vault unreadable — the data survived, but the key that could read it
 *   did not. This module is the missing half of that operation.
 *
 * WHY IT READS THE SCHEMA INSTEAD OF A FIELD LIST
 *   A hardcoded list of encrypted fields drifts the moment a schema
 *   changes, and the failure mode is silent: a forgotten field stays
 *   encrypted under the old key and the user loses only that data. The
 *   paths are read from each collection's schema — the same source
 *   `RxDBZeroKnowledgePlugin` uses to decide what to encrypt — so the two
 *   can never disagree.
 *
 * ORDERING
 *   `reencryptVault` decrypts with `fromKey` and writes back, at which
 *   point `preSave` re-encrypts with whatever key the session currently
 *   holds. Callers must therefore set the session key to the *target* key
 *   before calling, and restore the old one if the operation is reversed.
 */

import { getDb } from '../db';
import { cryptoService } from './CryptoService';
import { logger } from '../utils/logger';

/** Collections that carry encrypted fields. Mirrors SYNC_COLLECTIONS. */
const COLLECTIONS = [
    'assets',
    'liabilities',
    'nisab_year_records',
    'payment_records',
    'user_settings',
] as const;

export interface ReencryptResult {
    /** Docs whose fields were rewritten under the new key. */
    reencrypted: number;
    /** Docs that failed and were left untouched. */
    failed: number;
    /** Values that could not be read under the supplied key. */
    unreadable: number;
    /** Per-collection counts, for diagnostics. */
    byCollection: Record<string, number>;
}

/**
 * Encrypted field paths for a collection, read from its own schema.
 * Returns [] when the collection is unknown or declares none.
 */
const getEncryptedPaths = (collection: any): string[] => {
    const props = collection?.schema?.jsonSchema?.properties;
    if (!props) return [];
    return Object.keys(props).filter((key) => (props[key] as any)?.encrypted);
};

/**
 * Re-encrypt every encrypted field in the local vault from `fromKey` to the
 * session's current key.
 *
 * Fields that are absent, cleartext, or already readable under the current
 * key are left alone, which makes a second run a no-op rather than a
 * corruption.
 */
export const reencryptVault = async (
    fromKey: CryptoKey,
    opts: { strict?: boolean } = {}
): Promise<ReencryptResult> => {
    // Strict mode throws instead of writing a partial result, which is what a
    // password change needs. Recovery leaves it off so a salvageable vault is
    // salvaged and the caller is told the unreadable count.
    const strict = opts.strict ?? false;
    const db = await getDb();
    const result: ReencryptResult = { reencrypted: 0, failed: 0, unreadable: 0, byCollection: {} };

    // Phase 1 — decrypt everything first, writing nothing.
    //
    // If a value cannot be read under `fromKey`, the re-key cannot be completed.
    // Strict mode (password change) stops here rather than writing a partial
    // result: a half-re-keyed vault reported as success is the exact failure this
    // change exists to prevent. Recovery stays tolerant — someone rescuing a
    // vault wants whatever can be salvaged, and is told the count.
    const pending: Array<{ name: string; doc: any; updates: Record<string, unknown> }> = [];

    for (const name of COLLECTIONS) {
        const collection = (db as any)[name];
        if (!collection) continue;

        const paths = getEncryptedPaths(collection);
        if (paths.length === 0) continue;

        const docs = await collection.find().exec();

        for (const doc of docs) {
            const updates: Record<string, unknown> = {};

            for (const path of paths) {
                const raw = doc.get(path);
                if (raw === undefined || raw === null) continue;
                // Already cleartext — nothing was written under the old key.
                if (!cryptoService.isEncrypted(raw)) continue;

                const packed = cryptoService.unpackEncrypted(raw);
                if (!packed) { result.unreadable += 1; continue; }

                try {
                    const plain = await cryptoService.decryptWithKey(
                        packed.ciphertext,
                        packed.iv,
                        fromKey
                    );
                    if (plain !== undefined && plain !== null) updates[path] = plain;
                } catch {
                    // Written under some third key. Rewriting it would destroy the
                    // only copy, so it is reported rather than touched.
                    result.unreadable += 1;
                }
            }

            if (Object.keys(updates).length > 0) pending.push({ name, doc, updates });
        }
    }

    if (strict && result.unreadable > 0) {
        throw new Error(
            `${result.unreadable} encrypted value${result.unreadable === 1 ? '' : 's'} could not be ` +
            `read with that password, so nothing was changed.`
        );
    }

    // Phase 2 — write. `preSave` re-encrypts each field with the session key.
    for (const { name, doc, updates } of pending) {
        try {
            updates.updatedAt = new Date().toISOString();
            await (doc as any).atomicPatch(updates);
            result.reencrypted += 1;
            result.byCollection[name] = (result.byCollection[name] || 0) + 1;
        } catch (err) {
            result.failed += 1;
            logger.error(`Re-encrypt failed for ${name}/${doc.primary}`, err);
        }
    }

    if (strict && result.failed > 0) {
        throw new Error(
            `${result.failed} record${result.failed === 1 ? '' : 's'} could not be rewritten. ` +
            `Retry before changing your password.`
        );
    }

    logger.info(
        `Vault re-encrypt: ${result.reencrypted} rewritten, ${result.failed} failed, ` +
        `${result.unreadable} unreadable`,
        result.byCollection
    );
    return result;
};

/**
 * The salt the vault key was derived from. Stored server-side so it survives
 * a password change — without it the old key cannot be rebuilt and the vault
 * is unrecoverable.
 */
export const resolveVaultSalt = async (
    backendUserId: string,
    user?: { salt?: string; profile?: { salt?: string } } | null
): Promise<string | null> => {
    const fromUser = user?.salt || user?.profile?.salt;
    if (fromUser) return fromUser;
    return localStorage.getItem(`zakapp_salt_${backendUserId}`);
};
