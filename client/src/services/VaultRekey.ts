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
            // `incrementalPatch` runs the collection's `pre save` hooks, which is
            // where `zeroKnowledgePlugin` re-encrypts each field with the session
            // key. RxDB 16 exposes no `atomicPatch` — calling it threw and, in
            // strict mode, failed the password change.
            await (doc as any).incrementalPatch(updates);
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

    // The verifier is a hash of the vault key, and the key has just changed. Leaving it
    // alone would make the NEXT login contradict it: the new password derives the new key,
    // compare against the old verifier, and the user is told their data is unreachable when
    // it is perfectly readable. Refresh it whenever the key moves.
    //
    // Best-effort: an unrefreshed verifier costs a false warning on the next login, which
    // is bad but recoverable. Failing the password change here would not be.
    try {
        const sessionKey = await cryptoService.exportKeyString();
        const derivedVerifier = await cryptoService.hash(sessionKey);
        // One vault per device, so this is the device's own settings doc. Read rather than
        // taking a userId parameter: the caller varies between the password change and the
        // recovery path, and both mean "this device's vault".
        const settingsDocs = await db.user_settings.find().exec();
        for (const settings of settingsDocs) {
            const salt = settings.get('securityProfile')?.salt;
            await (settings as any).incrementalPatch({
                securityProfile: { salt, verifier: derivedVerifier }
            });
        }
    } catch (verifierError) {
        logger.warn('Could not refresh the vault verifier after re-key', verifierError);
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

/**
 * Is this session's vault key the one this device's rows were written with?
 *
 * `securityProfile.verifier` is a SHA-256 of the derived key, stored beside the salt when
 * the vault was created. Comparing it against the current session key detects the one
 * failure that is otherwise completely silent: a password whose derived key does not match
 * the stored rows. Every repository swallows its own decrypt failure, so the values stay
 * `ZK1:...`, `parseFloat` turns them into NaN, and the user sees a broken app with nothing
 * on the wire to explain it.
 *
 * THREE outcomes, and treating the third as a mismatch would be a bug:
 *
 *   'match'    the key is right; nothing to do.
 *   'mismatch' a verifier exists and disagrees - the key really is wrong.
 *   'unknown'  no verifier stored (vault predates them, or a recovery did not set one).
 *              Unknown is NOT a mismatch. Callers backfill instead of warning, because
 *              warning here would accuse a correct password of being wrong.
 *
 * This is a diagnostic only. It must never gate a login: refusing on 'mismatch' would lock
 * out whoever actually holds the correct key whenever the stored verifier is stale, and the
 * verifier is a value the client has not always kept current.
 */
export type VaultKeyStatus = 'match' | 'mismatch' | 'unknown';

export const checkVaultKey = async (
    storedVerifier: string | undefined | null,
    derivedVerifier: string
): Promise<VaultKeyStatus> => {
    if (!storedVerifier) return 'unknown';
    return storedVerifier === derivedVerifier ? 'match' : 'mismatch';
};
