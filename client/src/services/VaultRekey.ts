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
    /** What could not be read, identified well enough to act on. */
    blocked: BlockedRecord[];
}

/**
 * One record holding a value that could not be read under the supplied key.
 *
 * WHY THIS IS NOT JUST A COUNT
 *   A count tells the user they are blocked but not what to do about it. The
 *   reported experience was exactly that: a password change refused with "1
 *   encrypted value could not be read", no indication of WHICH record, and the
 *   only route out was to export everything to JSON, delete it, and re-import.
 *   A block the user cannot act on is a wall.
 *
 * HOW A RECORD IS IDENTIFIED WITHOUT THE KEY
 *   Every collection carries cleartext fields chosen for indexing, and those
 *   survive a key mismatch precisely because they were never encrypted. An asset
 *   whose `name` is unreadable still reports its `type`, `currency` and
 *   `acquisitionDate`; a liability reports `type` and `dueDate`; a payment
 *   reports `paymentDate`, `recipientType` and `method`. The cleartext fields
 *   are read from the schema, so a new one is picked up without a list to edit.
 *
 * `fields` names which values failed, because "the value is unreadable" and
 * "the name is unreadable" lead to different next steps.
 */
export interface BlockedRecord {
    /** Collection key, e.g. 'assets'. */
    collection: string;
    /** Plain-language collection name for the user. */
    collectionLabel: string;
    /** Row id — always cleartext, so always available. */
    id: string;
    /** Encrypted field paths that could not be read. */
    fields: string[];
    /** Cleartext fields, presented as the row's identity. */
    identity: Array<{ label: string; value: string }>;
}

/** User-facing names. The collection keys are storage identifiers. */
const COLLECTION_LABELS: Record<string, string> = {
    assets: 'Asset',
    liabilities: 'Liability',
    nisab_year_records: 'Zakat year record',
    payment_records: 'Payment',
    user_settings: 'Vault settings',
};

/**
 * Cleartext fields worth showing as a record's identity, in priority order.
 *
 * Read from the schema (anything NOT marked `encrypted`) and filtered to fields
 * a person would recognise. `id` is always shown, so a collection with no
 * useful cleartext still yields an identifiable row.
 */
const IDENTITY_FIELDS: Record<string, string[]> = {
    assets: ['type', 'currency', 'acquisitionDate'],
    liabilities: ['type', 'currency', 'dueDate'],
    nisab_year_records: ['nisabBasis', 'gregorianYear', 'calculationDate'],
    payment_records: ['paymentDate', 'recipientType', 'paymentMethod'],
    user_settings: ['preferredMethodology', 'preferredNisabStandard'],
};

const IDENTITY_LABELS: Record<string, string> = {
    type: 'type',
    currency: 'currency',
    acquisitionDate: 'acquired',
    dueDate: 'due',
    nisabBasis: 'nisab basis',
    gregorianYear: 'year',
    calculationDate: 'calculated',
    paymentDate: 'paid',
    recipientType: 'to',
    paymentMethod: 'method',
    preferredMethodology: 'methodology',
    preferredNisabStandard: 'nisab standard',
};

/**
 * Values are cleartext but not necessarily display-safe; a numeric field can be
 * a float and a date arrives as an ISO string. Trim both so the row reads as
 * something a person would recognise.
 */
const presentable = (value: unknown): string | null => {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string') {
        // Date-only is plenty; the time component is noise in an error message.
        const isoDate = /^(\d{4}-\d{2}-\d{2})T/.exec(value);
        return isoDate ? isoDate[1] : value;
    }
    if (typeof value === 'boolean') return value ? 'yes' : 'no';
    return null;
};


/**
 * Build a record's identity from fields that were never encrypted.
 *
 * Falls back to `id` alone when a collection has no recognisable cleartext, so
 * every blocked row is at least addressable even if it cannot be described.
 */
const identifyRecord = (collection: string, doc: any): Array<{ label: string; value: string }> => {
    const identity: Array<{ label: string; value: string }> = [];
    for (const field of IDENTITY_FIELDS[collection] ?? []) {
        const value = presentable(doc.get(field));
        if (value) identity.push({ label: IDENTITY_LABELS[field] ?? field, value });
    }
    return identity;
};

/**
 * A human-readable list of what could not be read.
 *
 * Exported so the caller can show the same detail in a UI without re-deriving
 * the wording, and so the one place that decides "how do we describe this row"
 * stays in one place.
 */
export const describeBlockedRecords = (blocked: BlockedRecord[]): string[] =>
    blocked.map((record) => {
        const where = record.identity.map((i) => `${i.label}: ${i.value}`).join(', ');
        const fields = record.fields.join(', ');
        return where
            ? `${record.collectionLabel} (${where}) — could not read: ${fields}`
            : `${record.collectionLabel} ${record.id} — could not read: ${fields}`;
    });


/**
 * Thrown when a password change cannot proceed because the vault holds values
 * this key cannot read.
 *
 * It carries the records, not just a count, so the caller can show the user what
 * is blocking them and offer a way through. A refusal that names nothing leaves
 * the user with no moves — the failure this class exists to prevent.
 *
 * `blocked` is bounded by the number of affected rows, which is normally one or
 * two; it is not a whole-vault dump.
 */
export class VaultBlockedError extends Error {
    public readonly blocked: BlockedRecord[];
    public readonly unreadableCount: number;

    constructor(blocked: BlockedRecord[], unreadableCount: number) {
        const lines = describeBlockedRecords(blocked);
        const subject = unreadableCount === 1
            ? '1 encrypted value'
            : `${unreadableCount} encrypted values`;
        super(
            `${subject} could not be read with that password, so your password was NOT changed.` +
            (lines.length ? `\n\nBlocked:\n${lines.map((l) => `  - ${l}`).join('\n')}` : '')
        );
        this.name = 'VaultBlockedError';
        this.blocked = blocked;
        this.unreadableCount = unreadableCount;
        // Restores the prototype on transpiled targets, so `instanceof` works.
        Object.setPrototypeOf(this, VaultBlockedError.prototype);
    }
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
    const result: ReencryptResult = {
        reencrypted: 0,
        failed: 0,
        unreadable: 0,
        byCollection: {},
        blocked: [],
    };

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
            const unreadableFields: string[] = [];

            for (const path of paths) {
                const raw = doc.get(path);
                if (raw === undefined || raw === null) continue;
                // Already cleartext — nothing was written under the old key.
                if (!cryptoService.isEncrypted(raw)) continue;

                const packed = cryptoService.unpackEncrypted(raw);
                if (!packed) {
                    result.unreadable += 1;
                    unreadableFields.push(path);
                    continue;
                }

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
                    unreadableFields.push(path);
                }
            }

            // Report the row, not just the count. This is what turns "1 value could
            // not be read" into something the user can act on before changing the
            // password, instead of discovering the block with no way forward.
            if (unreadableFields.length > 0) {
                result.blocked.push({
                    collection: name,
                    collectionLabel: COLLECTION_LABELS[name] ?? name,
                    id: String(doc.primary),
                    fields: unreadableFields,
                    identity: identifyRecord(name, doc),
                });
            }

            if (Object.keys(updates).length > 0) pending.push({ name, doc, updates });
        }
    }

    if (strict && result.unreadable > 0) {
        throw new VaultBlockedError(result.blocked, result.unreadable);
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
