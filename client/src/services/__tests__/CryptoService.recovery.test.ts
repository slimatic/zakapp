
import { describe, it, expect } from 'vitest';
import { cryptoService } from '../CryptoService';

describe('CryptoService Recovery Flow', () => {
    const oldPassword = 'OldPassword123!';
    const newPassword = 'NewPassword456!';
    const salt = 'test-salt-123';

    it('should encrypt with one key and recover with a temporary key', async () => {
        // 1. Derive Old Key
        const oldKey = await cryptoService.deriveKey(oldPassword, salt);
        const oldJwk = await cryptoService.exportSessionKey(oldKey);

        // 2. Set Session to OLD and Encrypt Data
        await cryptoService.restoreSessionKey(oldJwk);

        const originalText = 'Secret Gold';
        const res = await cryptoService.encrypt(originalText);
        // Pack it like AuthContext/RxDB would
        const packed = cryptoService.packEncrypted(res.iv, res.cipherText);

        expect(packed).toContain('ZK1:'); // Verify encryption format

        // 3. Switch Session to NEW Key (Simulate Password Change/Login)
        const newKey = await cryptoService.deriveKey(newPassword, salt);
        const newJwk = await cryptoService.exportSessionKey(newKey);
        await cryptoService.restoreSessionKey(newJwk);

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
