/**
 * `securityProfile.verifier` is a SHA-256 of the derived vault key, stored beside the salt
 * when a device's vault is created. Nothing read it, which is why the wrong-key case was
 * completely silent: every `use*Repository` hook catches its own decrypt failure and keeps
 * the ciphertext, so `parseFloat("ZK1:...")` yields NaN and the UI shows `$NaN` or blanks.
 * No error reaches the user or the network - the only trace is a `console.error` nobody
 * opens. The user's report is "my data looks like a mess".
 *
 * `checkVaultKey` reads the verifier so that failure has a name.
 *
 * IT IS A DIAGNOSTIC, NEVER A GATE - and that is the load-bearing decision here. The
 * verifier is client-written and was NOT refreshed on password change before this change,
 * so a stored value can legitimately be stale. Refusing a login on a disagreement would
 * then reject whichever password is actually correct, converting a display bug into a
 * lockout. The caller warns and continues.
 */
import { describe, it, expect, vi } from 'vitest';

// VaultRekey pulls in the DB and crypto layers at module scope; none of them are reached by
// checkVaultKey, which compares two strings.
vi.mock('../../db', () => ({ getDb: async () => ({}) }));
vi.mock('../CryptoService', () => ({ cryptoService: {} }));
vi.mock('../../utils/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const { checkVaultKey } = await import('../VaultRekey');

describe('checkVaultKey', () => {
    it('reports a match when the session key is the one the rows were written with', async () => {
        await expect(checkVaultKey('hash-of-key', 'hash-of-key')).resolves.toBe('match');
    });

    it('reports a mismatch when the derived key differs from the stored verifier', async () => {
        await expect(checkVaultKey('hash-of-key', 'hash-of-a-different-key')).resolves.toBe('mismatch');
    });

    it('reports UNKNOWN - not mismatch - when no verifier is stored', async () => {
        // Vaults predating verifiers, and vaults whose recovery did not set one. Reporting
        // 'mismatch' here would accuse a correct password of being wrong, show a false alarm
        // about the user's data, and is why the caller backfills instead of warning.
        await expect(checkVaultKey(undefined, 'hash-of-key')).resolves.toBe('unknown');
        await expect(checkVaultKey(null, 'hash-of-key')).resolves.toBe('unknown');
        await expect(checkVaultKey('', 'hash-of-key')).resolves.toBe('unknown');
    });

    it('keeps all three outcomes distinct rather than collapsing to a boolean', async () => {
        // The whole point of the type: a boolean would force 'unknown' into one of the other
        // two, and either choice is a bug - one locks users out, the other cries wolf.
        const outcomes = await Promise.all([
            checkVaultKey('a', 'a'),
            checkVaultKey('a', 'b'),
            checkVaultKey(undefined, 'a'),
        ]);
        expect(new Set(outcomes).size).toBe(3);
        expect(outcomes).toEqual(['match', 'mismatch', 'unknown']);
    });

    it('never throws - the caller treats it as best-effort inside a login', async () => {
        const weird = [undefined, null, '', 'x', {} as unknown as string];
        for (const v of weird) {
            await expect(checkVaultKey(v, 'derived')).resolves.toBeTypeOf('string');
        }
    });
});
