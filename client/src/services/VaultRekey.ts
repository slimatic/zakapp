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
export const reencryptVault = async (fromKey: CryptoKey): Promise<ReencryptResult> => {
    const db = await getDb();
    const result: ReencryptResult = { reencrypted: 0, failed: 0, byCollection: {} };

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
                if (!packed) continue;

                try {
                    const plain = await cryptoService.decryptWithKey(
                        packed.ciphertext,
                        packed.iv,
                        fromKey
                    );
                    if (plain !== undefined && plain !== null) updates[path] = plain;
                } catch {
                    // Not readable under `fromKey` either — this row was written
                    // under some third key. Leave it exactly as it is; rewriting
                    // it would destroy the only copy.
                }
            }

            if (Object.keys(updates).length === 0) continue;

            try {
                updates.updatedAt = new Date().toISOString();
                // `preSave` re-encrypts each of these with the session key.
                await (doc as any).atomicPatch(updates);
                result.reencrypted += 1;
                result.byCollection[name] = (result.byCollection[name] || 0) + 1;
            } catch (err) {
                result.failed += 1;
                logger.error(`Re-encrypt failed for ${name}/${doc.primary}`, err);
            }
        }
    }

    logger.info(
        `Vault re-encrypt: ${result.reencrypted} rewritten, ${result.failed} failed`,
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
