import EncryptionService from '../../server/src/services/EncryptionService';

describe('Implementation Task T023: EncryptionService', () => {
  describe('Core Encryption/Decryption', () => {
    it('should encrypt and decrypt data successfully', async () => {
      const plaintext = 'sensitive financial data';
      const key = EncryptionService.generateKey();

      const encrypted = await EncryptionService.encrypt(plaintext, key);
      const decrypted = await EncryptionService.decrypt(encrypted, key);

      expect(decrypted).toBe(plaintext);
      expect(encrypted).not.toBe(plaintext);
    });

    it('should generate different encrypted values for the same plaintext', async () => {
      const plaintext = 'sensitive financial data';
      const key = EncryptionService.generateKey();

      const encrypted1 = await EncryptionService.encrypt(plaintext, key);
      const encrypted2 = await EncryptionService.encrypt(plaintext, key);

      expect(encrypted1).not.toBe(encrypted2);
      expect(await EncryptionService.decrypt(encrypted1, key)).toBe(plaintext);
      expect(await EncryptionService.decrypt(encrypted2, key)).toBe(plaintext);
    });

    it('should throw error for empty plaintext', async () => {
      const key = EncryptionService.generateKey();

      await expect(EncryptionService.encrypt('', key)).rejects.toThrow('Plaintext cannot be empty');
    });

    it('should throw error for empty key', async () => {
      await expect(EncryptionService.encrypt('data', '')).rejects.toThrow('Encryption key is required');
    });

    it('should throw error for invalid encrypted data format', async () => {
      const key = EncryptionService.generateKey();

      await expect(EncryptionService.decrypt('invalid:format:too:many:parts', key)).rejects.toThrow('Invalid encrypted data format');
      await expect(EncryptionService.decrypt('no-colon', key)).rejects.toThrow('Invalid encrypted data format');
    });
  });

  describe('Object Encryption/Decryption', () => {
    it('should encrypt and decrypt objects successfully', async () => {
      const data = {
        name: 'Ahmed',
        balance: 10000,
        currency: 'USD',
        metadata: { account: 'savings' }
      };
      const key = EncryptionService.generateKey();

      const encrypted = await EncryptionService.encryptObject(data, key);
      const decrypted = await EncryptionService.decryptObject(encrypted, key);

      expect(decrypted).toEqual(data);
      expect(encrypted).not.toContain('Ahmed');
      expect(encrypted).not.toContain('10000');
    });

    it('should handle complex nested objects', async () => {
      const complexData = {
        user: {
          profile: {
            name: 'Fatima',
            settings: {
              currency: 'SAR',
              language: 'ar'
            }
          }
        },
        assets: [
          { type: 'cash', value: 5000 },
          { type: 'gold', value: 25000 }
        ]
      };
      const key = EncryptionService.generateKey();

      const encrypted = await EncryptionService.encryptObject(complexData, key);
      const decrypted = await EncryptionService.decryptObject(encrypted, key);

      expect(decrypted).toEqual(complexData);
    });
  });

  describe('Key Management', () => {
    it('should generate secure random keys', () => {
      const key1 = EncryptionService.generateKey();
      const key2 = EncryptionService.generateKey();

      expect(key1).not.toBe(key2);
      expect(key1.length).toBeGreaterThan(0);
      expect(key2.length).toBeGreaterThan(0);
      
      // Base64 encoded 32-byte key should be ~44 characters
      expect(key1.length).toBe(44);
      expect(key2.length).toBe(44);
    });

    it('should derive keys from passwords using PBKDF2', async () => {
      const password = 'user_password_123';
      const salt = EncryptionService.generateSalt();

      const derivedKey1 = await EncryptionService.deriveKey(password, salt);
      const derivedKey2 = await EncryptionService.deriveKey(password, salt);

      expect(derivedKey1).toBe(derivedKey2); // Same input should give same output
      expect(derivedKey1.length).toBe(44); // Base64 encoded 32-byte key
    });

    it('should generate different keys for different salts', async () => {
      const password = 'user_password_123';
      const salt1 = EncryptionService.generateSalt();
      const salt2 = EncryptionService.generateSalt();

      const derivedKey1 = await EncryptionService.deriveKey(password, salt1);
      const derivedKey2 = await EncryptionService.deriveKey(password, salt2);

      expect(derivedKey1).not.toBe(derivedKey2);
    });

    it('should generate cryptographically secure salts', () => {
      const salt1 = EncryptionService.generateSalt();
      const salt2 = EncryptionService.generateSalt();

      expect(salt1).not.toBe(salt2);
      expect(salt1.length).toBeGreaterThan(0);
      expect(salt2.length).toBeGreaterThan(0);
    });

    it('should reject empty password for key derivation', async () => {
      const salt = EncryptionService.generateSalt();
      
      await expect(EncryptionService.deriveKey('', salt)).rejects.toThrow('Password cannot be empty');
    });

    it('should reject empty salt for key derivation', async () => {
      await expect(EncryptionService.deriveKey('password', '')).rejects.toThrow('Salt cannot be empty');
    });
  });

  describe('Hashing and Verification', () => {
    it('should create consistent SHA-256 hashes', () => {
      const data = 'test data for hashing';
      
      const hash1 = EncryptionService.hash(data);
      const hash2 = EncryptionService.hash(data);

      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64); // SHA-256 hex output
    });

    it('should create different hashes for different data', () => {
      const hash1 = EncryptionService.hash('data1');
      const hash2 = EncryptionService.hash('data2');

      expect(hash1).not.toBe(hash2);
    });

    it('should verify hashes correctly', () => {
      const data = 'verification test data';
      const hash = EncryptionService.hash(data);

      expect(EncryptionService.verifyHash(data, hash)).toBe(true);
      expect(EncryptionService.verifyHash('different data', hash)).toBe(false);
    });

    it('should handle empty data in hash verification', () => {
      const hash = EncryptionService.hash('test');

      expect(EncryptionService.verifyHash('', hash)).toBe(false);
      expect(EncryptionService.verifyHash('test', '')).toBe(false);
    });

    it('should throw error for empty data hashing', () => {
      expect(() => EncryptionService.hash('')).toThrow('Data to hash cannot be empty');
    });
  });

  describe('Islamic Compliance Features', () => {
    it('should encrypt asset data with integrity checks', async () => {
      const assetData = {
        type: 'cash',
        value: 10000,
        currency: 'USD',
        metadata: { account: 'zakat_fund' }
      };
      const key = EncryptionService.generateKey();

      const encrypted = await EncryptionService.encryptAssetData(assetData, key);
      const decrypted = await EncryptionService.decryptAssetData(encrypted, key);

      expect(decrypted.type).toBe(assetData.type);
      expect(decrypted.value).toBe(assetData.value);
      expect(decrypted.currency).toBe(assetData.currency);
      expect(decrypted.metadata).toEqual(assetData.metadata);
      expect(decrypted.encrypted_at).toBeDefined();
    });

    it('should validate asset data integrity', async () => {
      const assetData = {
        type: 'gold',
        value: 50000,
        currency: 'SAR'
      };
      const key = EncryptionService.generateKey();

      const encrypted = await EncryptionService.encryptAssetData(assetData, key);
      
      // Tamper with encrypted data
      const tamperedEncrypted = encrypted.replace(/.$/, 'X'); // Change last character

      await expect(EncryptionService.decryptAssetData(tamperedEncrypted, key))
        .rejects.toThrow();
    });

    it('should include timestamp in encrypted asset data', async () => {
      const assetData = {
        type: 'silver',
        value: 15000,
        currency: 'USD'
      };
      const key = EncryptionService.generateKey();

      const beforeEncryption = new Date().toISOString();
      const encrypted = await EncryptionService.encryptAssetData(assetData, key);
      const afterEncryption = new Date().toISOString();
      
      const decrypted = await EncryptionService.decryptAssetData(encrypted, key);

      expect(decrypted.encrypted_at).toBeDefined();
      expect(decrypted.encrypted_at >= beforeEncryption).toBe(true);
      expect(decrypted.encrypted_at <= afterEncryption).toBe(true);
    });
  });

  describe('Security Features', () => {
    it('should detect encrypted data format', () => {
      const key = EncryptionService.generateKey();
      const plaintext = 'test data';

      // Valid encrypted data format should be detected
      EncryptionService.encrypt(plaintext, key).then(encrypted => {
        expect(EncryptionService.isEncrypted(encrypted)).toBe(true);
      });

      // Plain text should not be detected as encrypted
      expect(EncryptionService.isEncrypted(plaintext)).toBe(false);
      expect(EncryptionService.isEncrypted('')).toBe(false);
      expect(EncryptionService.isEncrypted('not:encrypted:format')).toBe(false);
    });

    it('should normalize keys correctly', async () => {
      const plaintext = 'test data';
      
      // Test with base64 key
      const base64Key = EncryptionService.generateKey();
      const encrypted1 = await EncryptionService.encrypt(plaintext, base64Key);
      const decrypted1 = await EncryptionService.decrypt(encrypted1, base64Key);
      expect(decrypted1).toBe(plaintext);

      // Test with UTF-8 string key
      const stringKey = 'this_is_a_test_key_for_encryption';
      const encrypted2 = await EncryptionService.encrypt(plaintext, stringKey);
      const decrypted2 = await EncryptionService.decrypt(encrypted2, stringKey);
      expect(decrypted2).toBe(plaintext);
    });

    it('should validate encryption configuration', () => {
      const isValid = EncryptionService.validateConfiguration();
      expect(isValid).toBe(true);
    });

    it('should handle key length variations', async () => {
      const plaintext = 'test data';
      
      // Short key (will be padded)
      const shortKey = 'short';
      const encrypted1 = await EncryptionService.encrypt(plaintext, shortKey);
      const decrypted1 = await EncryptionService.decrypt(encrypted1, shortKey);
      expect(decrypted1).toBe(plaintext);

      // Long key (will be truncated)
      const longKey = 'this_is_a_very_long_key_that_exceeds_32_bytes_and_should_be_truncated_properly';
      const encrypted2 = await EncryptionService.encrypt(plaintext, longKey);
      const decrypted2 = await EncryptionService.decrypt(encrypted2, longKey);
      expect(decrypted2).toBe(plaintext);
    });
  });

  describe('Error Handling', () => {
    it('should provide meaningful error messages', async () => {
      const key = EncryptionService.generateKey();

      // Test various error conditions
      await expect(EncryptionService.encrypt('', key))
        .rejects.toThrow('Encryption failed: Plaintext cannot be empty');

      await expect(EncryptionService.decrypt('', key))
        .rejects.toThrow('Decryption failed: Encrypted data cannot be empty');

      await expect(EncryptionService.encrypt('data', ''))
        .rejects.toThrow('Encryption failed: Encryption key is required');

      await expect(EncryptionService.encryptObject(null, key))
        .rejects.toThrow('Object encryption failed');
    });

    it('should handle malformed encrypted data gracefully', async () => {
      const key = EncryptionService.generateKey();

      await expect(EncryptionService.decrypt('malformed', key))
        .rejects.toThrow('Invalid encrypted data format');

      await expect(EncryptionService.decrypt('invalid:base64!@#$', key))
        .rejects.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large data encryption efficiently', async () => {
      const largeData = 'A'.repeat(10000); // 10KB of data
      const key = EncryptionService.generateKey();

      const startTime = Date.now();
      const encrypted = await EncryptionService.encrypt(largeData, key);
      const decrypted = await EncryptionService.decrypt(encrypted, key);
      const endTime = Date.now();

      expect(decrypted).toBe(largeData);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle multiple concurrent encryptions', async () => {
      const data = 'concurrent test data';
      const key = EncryptionService.generateKey();

      const promises = Array.from({ length: 10 }, () => 
        EncryptionService.encrypt(data, key)
      );

      const results = await Promise.all(promises);
      
      // All should succeed and produce different encrypted values
      expect(results.length).toBe(10);
      expect(new Set(results).size).toBe(10); // All different due to random IVs
    });
  });
});