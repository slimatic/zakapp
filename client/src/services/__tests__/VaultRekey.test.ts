/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The behaviour under test is the one that silently lost data: a password
 * change derives a new vault key, and every field written under the old key
 * must be readable again afterwards. These tests encrypt under `oldKey`,
 * re-key, and assert the values survive.
 */

const state: {
    sessionKey: CryptoKey | null;
    docs: any[];
    encryptedPaths: string[];
} = { sessionKey: null, docs: [], encryptedPaths: [] };

const makeDoc = (fields: Record<string, unknown>) => ({
    primary: fields.id,
    get: (k: string) => fields[k],
    atomicPatch: vi.fn(async (patch: Record<string, unknown>) => {
        for (const [k, v] of Object.entries(patch)) {
            // Stand in for the preSave hook: re-encrypt under the session key.
            if (state.encryptedPaths.includes(k) && state.sessionKey) {
                const enc = await realEncrypt(v, state.sessionKey);
                fields[k] = enc;
            } else {
                fields[k] = v;
            }
        }
        return fields;
    }),
    _fields: fields,
});

const realEncrypt = async (value: unknown, key: CryptoKey): Promise<string> => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const buf = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(JSON.stringify(value))
    );
    const b64 = (b: ArrayBuffer) => Buffer.from(new Uint8Array(b)).toString('base64');
    return `ZK1:${b64(iv.buffer)}:${b64(buf)}`;
};

vi.mock('../../db', () => ({
    getDb: async () => ({
        get assets() {
            return {
                schema: {
                    jsonSchema: {
                        properties: Object.fromEntries(
                            state.encryptedPaths.map((p) => [p, { encrypted: true }])
                        ),
                    },
                },
                find: () => ({ exec: async () => state.docs }),
            };
        },
        liabilities: undefined,
        nisab_year_records: undefined,
        payment_records: undefined,
        user_settings: undefined,
    }),
}));

// Minimal CryptoService stand-in wired to a real AES-GCM key, so the test
// exercises the actual encrypt/decrypt round trip rather than a stub.
const keyFromPassword = async (password: string, salt: string): Promise<CryptoKey> => {
    const material = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 1000, hash: 'SHA-256' },
        material, { name: 'AES-GCM', length: 256 }, false, ['decrypt', 'encrypt']
    );
};

vi.mock('../CryptoService', () => ({
    cryptoService: {
        ZK_PREFIX: 'ZK1:',
        isEncrypted: (v: any) => typeof v === 'string' && v.startsWith('ZK1:'),
        unpackEncrypted: (d: string) => {
            const parts = d.substring(4).split(':');
            return parts.length >= 2 ? { iv: parts[0], ciphertext: parts[1] } : null;
        },
        decryptWithKey: async (cipherText: string, ivBase64: string, key: CryptoKey) => {
            const dec = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: Uint8Array.from(Buffer.from(ivBase64, 'base64')) as any },
                key,
                Uint8Array.from(Buffer.from(cipherText, 'base64')) as any
            );
            const text = new TextDecoder().decode(dec);
            try { return JSON.parse(text); } catch { return text; }
        },
    },
}));

vi.mock('../../utils/logger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const { reencryptVault } = await import('../VaultRekey');

describe('reencryptVault (password change must not lose data)', () => {
    beforeEach(() => {
        state.docs = [];
        state.encryptedPaths = ['name', 'value'];
        state.sessionKey = null;
    });

    it('makes fields written under the old key readable under the new key', async () => {
        const salt = 'salt-abc';
        const oldKey = await keyFromPassword('OldPass123!', salt);
        const newKey = await keyFromPassword('NewPass456!', salt);

        const fields: Record<string, unknown> = {
            id: 'a1',
            name: await realEncrypt('Gold Bar', oldKey),
            value: await realEncrypt(1234.5, oldKey),
        };
        state.docs = [makeDoc(fields)];

        // Session holds the NEW key; rows are encrypted under the OLD one.
        state.sessionKey = newKey;
        const res = await reencryptVault(oldKey);

        expect(res.reencrypted).toBe(1);
        expect(res.failed).toBe(0);

        // The rewritten ciphertext must now decrypt with the NEW key.
        const packedName = state.docs[0].get('name') as string;
        const p = packedName.substring(4).split(':');
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: Uint8Array.from(Buffer.from(p[0], 'base64')) as any },
            newKey,
            Uint8Array.from(Buffer.from(p[1], 'base64')) as any
        );
        expect(JSON.parse(new TextDecoder().decode(decrypted))).toBe('Gold Bar');
    });

    it('leaves rows it cannot decrypt, rather than destroying them', async () => {
        const salt = 'salt-abc';
        const oldKey = await keyFromPassword('OldPass123!', salt);
        const strangerKey = await keyFromPassword('SomeThirdKey!', salt);
        const newKey = await keyFromPassword('NewPass456!', salt);

        const original = await realEncrypt('Unreadable', strangerKey);
        state.docs = [makeDoc({ id: 'a2', name: original })];
        state.sessionKey = newKey;

        const res = await reencryptVault(oldKey);

        expect(res.reencrypted).toBe(0);
        expect(res.failed).toBe(0);
        // The ciphertext is untouched — still the only copy of that value.
        expect(state.docs[0].get('name')).toBe(original);
    });

    it('is a no-op when run twice', async () => {
        const salt = 'salt-abc';
        const oldKey = await keyFromPassword('OldPass123!', salt);
        const newKey = await keyFromPassword('NewPass456!', salt);

        state.docs = [makeDoc({ id: 'a3', name: await realEncrypt('Once', oldKey) })];
        state.sessionKey = newKey;

        const first = await reencryptVault(oldKey);
        const second = await reencryptVault(oldKey);

        expect(first.reencrypted).toBe(1);
        expect(second.reencrypted).toBe(0);
    });
});
