
import { describe, it, expect } from 'vitest';
import { cryptoService } from '../CryptoService';

describe('CryptoService Recovery Flow', () => {
    const oldPassword = 'OldPassword123!';
    const newPassword = 'NewPassword456!';
    const salt = 'test-salt-123';

    it('should encrypt with one key and recover with a temporary key', async () => {
        // 1. Derive the OLD key (this also makes it the active session key)
        await cryptoService.deriveKey(oldPassword, salt);

        const originalText = 'Secret Gold';
        const res = await cryptoService.encrypt(originalText);
        // Pack it like AuthContext/RxDB would
        const packed = cryptoService.packEncrypted(res.iv, res.cipherText);

        expect(packed).toContain('ZK1:'); // Verify encryption format

        // 3. Switch to the NEW key (simulate a password change / fresh login)
        await cryptoService.deriveKey(newPassword, salt);

        // 4. Verify Standard Decryption Fails
        let failed = false;
        try {
            await cryptoService.decrypt(res.cipherText, res.iv);
        } catch (e) {
            failed = true;
        }

        if (!failed) {
            try {
                const decryptedRes = await cryptoService.decrypt(res.cipherText, res.iv);
                if (decryptedRes !== originalText) {
                    // console.log('Decryption returned garbage (good):', decryptedRes);
                    failed = true;
                } else {
                    console.error('CRITICAL: Decryption SUCCEEDED with wrong key!');
                }
            } catch {
                failed = true;
            }
        }
        expect(failed).toBe(true);

        // 5. Recover using Temporary Key (The Fix)
        const tempOldKey = await cryptoService.deriveTemporaryKey(oldPassword, salt);

        // Unpack manually to pass to decryptWithKey (as AuthContext does)
        const p = cryptoService.unpackEncrypted(packed);
        expect(p).not.toBeNull();

        if (p) {
            const recovered = await cryptoService.decryptWithKey(p.ciphertext, p.iv, tempOldKey);
            expect(recovered).toBe(originalText);
        }
    });
});

/**
 * #725 -- the master key must not be walkable off the page. These two assertions
 * are the regression guard: re-making the key extractable fails the first, and
 * breaking the database passphrase derivation fails the second.
 */
describe('master key custody', () => {
    it('is non-extractable and cannot be exported as a JWK', async () => {
        await cryptoService.deriveKey('custody-pw', 'custody-salt');
        const key = (cryptoService as unknown as { masterKey: CryptoKey }).masterKey;
        expect(key).toBeTruthy();
        expect(key.extractable).toBe(false);
        await expect(window.crypto.subtle.exportKey('jwk', key)).rejects.toThrow();
    });

    it('still yields the database passphrase, 32 bytes base64url unpadded', async () => {
        await cryptoService.deriveKey('custody-pw', 'custody-salt');
        const passphrase = await cryptoService.exportKeyString();
        expect(passphrase).toMatch(/^[A-Za-z0-9_-]{43}$/);
    });
});
