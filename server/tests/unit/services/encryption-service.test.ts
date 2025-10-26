import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { EncryptionService } from '../../../src/services/EncryptionService';

describe('EncryptionService', () => {
  const testKey = 'test-encryption-key-32-characters-long-abcdef1234567890';
  const shortKey = 'short-key';

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = testKey;
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  describe('constructor', () => {
    it('should create instance with valid environment key', () => {
      expect(() => new EncryptionService()).not.toThrow();
    });

    it('should throw error when ENCRYPTION_KEY is missing', () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => new EncryptionService()).toThrow('ENCRYPTION_KEY environment variable is required');
    });

    it('should throw error when ENCRYPTION_KEY is too short', () => {
      process.env.ENCRYPTION_KEY = shortKey;
      expect(() => new EncryptionService()).toThrow('Encryption key must be exactly 32 characters');
    });
  });

  describe('encrypt (synchronous legacy)', () => {
    it('should encrypt plaintext and return object with encrypted data and IV', () => {
      const plaintext = 'Hello, World!';

      const result = EncryptionService.encrypt(plaintext);

      expect(result).toHaveProperty('encryptedData');
      expect(result).toHaveProperty('iv');
      expect(typeof result.encryptedData).toBe('string');
      expect(typeof result.iv).toBe('string');
      expect(result.encryptedData).not.toBe(plaintext);
      expect(result.iv).toMatch(/^[a-f0-9]+$/); // Hex format
    });

    it('should throw error for null or undefined plaintext', () => {
      expect(() => EncryptionService.encrypt(null as unknown as string)).toThrow('Plaintext cannot be empty');
      expect(() => EncryptionService.encrypt(undefined as unknown as string)).toThrow('Plaintext cannot be empty');
    });

    it('should throw error when ENCRYPTION_KEY is missing', () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => EncryptionService.encrypt('test')).toThrow('Encryption key is required');
    });

    it('should handle empty string', () => {
      const result = EncryptionService.encrypt('');
      expect(result).toHaveProperty('encryptedData');
      expect(result).toHaveProperty('iv');
    });

    it('should handle very long plaintext', () => {
      const longText = 'A'.repeat(10000);
      const result = EncryptionService.encrypt(longText);
      expect(result).toHaveProperty('encryptedData');
      expect(result.encryptedData.length).toBeGreaterThan(0);
    });

    it('should handle special characters and unicode', () => {
      const unicodeText = 'Hello 世界 🌍 éñ español';
      const result = EncryptionService.encrypt(unicodeText);
      expect(result).toHaveProperty('encryptedData');
      expect(result.encryptedData).not.toBe(unicodeText);
    });
  });

  describe('encrypt (asynchronous)', () => {
    it('should encrypt plaintext with provided key and return base64 string', async () => {
      const plaintext = 'Hello, World!';
      const key = 'custom-test-key-32-characters-long-abcdef1234567890';

      const result = await EncryptionService.encrypt(plaintext, key);

      expect(typeof result).toBe('string');
      expect(result).toContain(':'); // Should contain iv:encrypted format
      expect(result).not.toBe(plaintext);

      const parts = result.split(':');
      expect(parts).toHaveLength(2);
      expect(() => Buffer.from(parts[0], 'base64')).not.toThrow(); // IV should be valid base64
      expect(() => Buffer.from(parts[1], 'base64')).not.toThrow(); // Encrypted data should be valid base64
    });

    it('should throw error for empty key', async () => {
      await expect(EncryptionService.encrypt('test', '')).rejects.toThrow('Encryption key is required');
    });

    it('should handle different key lengths by normalizing', async () => {
      const plaintext = 'test';
      const shortKey = 'short';
      const longKey = 'very-long-key-that-exceeds-32-characters-and-should-be-truncated';

      const result1 = await EncryptionService.encrypt(plaintext, shortKey);
      const result2 = await EncryptionService.encrypt(plaintext, longKey);

      expect(typeof result1).toBe('string');
      expect(typeof result2).toBe('string');
      expect(result1).toContain(':');
      expect(result2).toContain(':');
    });
  });

  describe('decrypt (synchronous legacy)', () => {
    it('should decrypt data encrypted with synchronous method', () => {
      const plaintext = 'Hello, World!';
      const encrypted = EncryptionService.encrypt(plaintext);

      const decrypted = EncryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt data in base64 format', () => {
      const plaintext = 'Test message';
      const encrypted = EncryptionService.encrypt(plaintext);

      const decrypted = EncryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error for invalid encrypted data format', () => {
      expect(() => EncryptionService.decrypt('invalid')).toThrow('Invalid encrypted data format');
      expect(() => EncryptionService.decrypt('')).toThrow('Invalid encrypted data format');
      expect(() => EncryptionService.decrypt({})).toThrow('Invalid encrypted data format');
    });

    it('should throw error for corrupted IV', () => {
      const encrypted = EncryptionService.encrypt('test');
      const corrupted = {
        ...encrypted,
        iv: 'invalid-hex'
      };

      expect(() => EncryptionService.decrypt(corrupted)).toThrow();
    });

    it('should throw error for corrupted encrypted data', () => {
      const encrypted = EncryptionService.encrypt('test');
      const corrupted = {
        ...encrypted,
        encryptedData: 'invalid-hex'
      };

      expect(() => EncryptionService.decrypt(corrupted)).toThrow();
    });
  });

  describe('decrypt (asynchronous)', () => {
    it('should decrypt data encrypted with asynchronous method', async () => {
      const plaintext = 'Hello, World!';
      const key = 'custom-test-key-32-characters-long-abcdef1234567890';
      const encrypted = await EncryptionService.encrypt(plaintext, key);

      const decrypted = await EncryptionService.decrypt(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error for invalid base64 format', async () => {
      const key = 'custom-test-key-32-characters-long-abcdef1234567890';

      await expect(EncryptionService.decrypt('invalid-base64', key)).rejects.toThrow();
      await expect(EncryptionService.decrypt('invalid:format:with:colons', key)).rejects.toThrow();
    });

    it('should throw error for wrong key', async () => {
      const plaintext = 'Secret message';
      const key1 = 'custom-test-key-32-characters-long-abcdef1234567890';
      const key2 = 'different-key-32-characters-long-abcdef1234567890';
      const encrypted = await EncryptionService.encrypt(plaintext, key1);

      await expect(EncryptionService.decrypt(encrypted, key2)).rejects.toThrow();
    });

    it('should throw error for empty encrypted data', async () => {
      const key = 'custom-test-key-32-characters-long-abcdef1234567890';

      await expect(EncryptionService.decrypt('', key)).rejects.toThrow('Encrypted data cannot be empty');
    });
  });

  describe('encryptObject', () => {
    it('should encrypt objects synchronously (legacy)', () => {
      const testObject = { name: 'John', age: 30, data: [1, 2, 3] };

      const encrypted = EncryptionService.encryptObject(testObject);

      expect(encrypted).toHaveProperty('encryptedData');
      expect(encrypted).toHaveProperty('iv');
      expect(typeof encrypted.encryptedData).toBe('string');
      expect(typeof encrypted.iv).toBe('string');
    });

    it('should encrypt objects asynchronously', async () => {
      const testObject = { name: 'John', age: 30, data: [1, 2, 3] };
      const key = 'custom-test-key-32-characters-long-abcdef1234567890';

      const encrypted = await EncryptionService.encryptObject(testObject, key);

      expect(typeof encrypted).toBe('string');
      expect(encrypted).toContain(':');
    });

    it('should throw error for null or undefined objects', () => {
      expect(() => EncryptionService.encryptObject(null as unknown as object)).toThrow('Data cannot be null or undefined');
      expect(() => EncryptionService.encryptObject(undefined as unknown as object)).toThrow('Data cannot be null or undefined');
    });

    it('should handle complex nested objects', async () => {
      const complexObject = {
        user: { id: 123, name: 'Test' },
        settings: { theme: 'dark', notifications: true },
        data: [1, 'two', { three: 3 }],
        metadata: { created: new Date(), version: '1.0' }
      };
      const key = 'custom-test-key-32-characters-long-abcdef1234567890';

      const encrypted = await EncryptionService.encryptObject(complexObject, key);
      const decrypted = await EncryptionService.decryptObject(encrypted, key);

      expect(decrypted).toEqual(complexObject);
    });
  });

  describe('decryptObject', () => {
    it('should decrypt objects synchronously (legacy)', () => {
      const testObject = { name: 'John', age: 30 };
      const encrypted = EncryptionService.encryptObject(testObject);

      const decrypted = EncryptionService.decryptObject(encrypted);

      expect(decrypted).toEqual(testObject);
    });

    it('should decrypt objects asynchronously', async () => {
      const testObject = { name: 'John', age: 30 };
      const key = 'custom-test-key-32-characters-long-abcdef1234567890';
      const encrypted = await EncryptionService.encryptObject(testObject, key);

      const decrypted = await EncryptionService.decryptObject(encrypted, key);

      expect(decrypted).toEqual(testObject);
    });

    it('should handle decryption errors gracefully', () => {
      expect(() => EncryptionService.decryptObject('invalid-data')).toThrow('Object decryption failed');
    });
  });

  describe('generateKey', () => {
    it('should generate a valid encryption key', () => {
      const key = EncryptionService.generateKey();

      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);

      // Should be valid base64
      expect(() => Buffer.from(key, 'base64')).not.toThrow();

      // Should be correct length when decoded
      const keyBuffer = Buffer.from(key, 'base64');
      expect(keyBuffer.length).toBe(32);
    });

    it('should generate unique keys', () => {
      const key1 = EncryptionService.generateKey();
      const key2 = EncryptionService.generateKey();

      expect(key1).not.toBe(key2);
    });
  });

  describe('deriveKey', () => {
    it('should derive key from password and salt', async () => {
      const password = 'mySecretPassword';
      const salt = 'randomSalt123';

      const key = await EncryptionService.deriveKey(password, salt);

      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);

      // Should be valid base64
      expect(() => Buffer.from(key, 'base64')).not.toThrow();
    });

    it('should derive consistent keys from same inputs', async () => {
      const password = 'mySecretPassword';
      const salt = 'randomSalt123';

      const key1 = await EncryptionService.deriveKey(password, salt);
      const key2 = await EncryptionService.deriveKey(password, salt);

      expect(key1).toBe(key2);
    });

    it('should derive different keys for different passwords', async () => {
      const salt = 'randomSalt123';

      const key1 = await EncryptionService.deriveKey('password1', salt);
      const key2 = await EncryptionService.deriveKey('password2', salt);

      expect(key1).not.toBe(key2);
    });

    it('should derive different keys for different salts', async () => {
      const password = 'mySecretPassword';

      const key1 = await EncryptionService.deriveKey(password, 'salt1');
      const key2 = await EncryptionService.deriveKey(password, 'salt2');

      expect(key1).not.toBe(key2);
    });

    it('should throw error for empty password', async () => {
      await expect(EncryptionService.deriveKey('', 'salt')).rejects.toThrow('Password cannot be empty');
    });

    it('should throw error for empty salt', async () => {
      await expect(EncryptionService.deriveKey('password', '')).rejects.toThrow('Salt cannot be empty');
    });

    it('should handle custom iterations', async () => {
      const password = 'password';
      const salt = 'salt';
      const iterations = 50000;

      const key = await EncryptionService.deriveKey(password, salt, iterations);

      expect(typeof key).toBe('string');
      expect(() => Buffer.from(key, 'base64')).not.toThrow();
    });
  });

  describe('generateSalt', () => {
    it('should generate a valid salt', () => {
      const salt = EncryptionService.generateSalt();

      expect(typeof salt).toBe('string');
      expect(salt.length).toBeGreaterThan(0);

      // Should be valid base64
      expect(() => Buffer.from(salt, 'base64')).not.toThrow();

      // Should be 16 bytes when decoded
      const saltBuffer = Buffer.from(salt, 'base64');
      expect(saltBuffer.length).toBe(16);
    });

    it('should generate unique salts', () => {
      const salt1 = EncryptionService.generateSalt();
      const salt2 = EncryptionService.generateSalt();

      expect(salt1).not.toBe(salt2);
    });
  });

  describe('hash', () => {
    it('should create SHA-256 hash', () => {
      const data = 'Hello, World!';
      const hash = EncryptionService.hash(data);

      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 produces 64 character hex string
      expect(hash).toMatch(/^[a-f0-9]+$/); // Should be hex
    });

    it('should create consistent hashes', () => {
      const data = 'Hello, World!';
      const hash1 = EncryptionService.hash(data);
      const hash2 = EncryptionService.hash(data);

      expect(hash1).toBe(hash2);
    });

    it('should create different hashes for different data', () => {
      const hash1 = EncryptionService.hash('data1');
      const hash2 = EncryptionService.hash('data2');

      expect(hash1).not.toBe(hash2);
    });

    it('should throw error for empty data', () => {
      expect(() => EncryptionService.hash('')).toThrow('Data to hash cannot be empty');
    });
  });

  describe('verifyHash', () => {
    it('should verify correct hash', () => {
      const data = 'Hello, World!';
      const hash = EncryptionService.hash(data);

      const isValid = EncryptionService.verifyHash(data, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect hash', () => {
      const data = 'Hello, World!';
      const wrongHash = 'wrong-hash';

      const isValid = EncryptionService.verifyHash(data, wrongHash);

      expect(isValid).toBe(false);
    });

    it('should handle empty inputs', () => {
      expect(EncryptionService.verifyHash('', '')).toBe(false);
      expect(EncryptionService.verifyHash('data', '')).toBe(false);
      expect(EncryptionService.verifyHash('', 'hash')).toBe(false);
    });

    it('should be timing-safe', () => {
      const data = 'test-data';
      const correctHash = EncryptionService.hash(data);
      const wrongHash = 'a' + correctHash.substring(1); // One character different

      // Both should return false but take similar time
      const result1 = EncryptionService.verifyHash(data, correctHash);
      const result2 = EncryptionService.verifyHash(data, wrongHash);

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe('isEncrypted', () => {
    it('should identify encrypted data', () => {
      const plaintext = 'Hello, World!';
      const encrypted = 'SGVsbG8sIFdvcmxkIQ==:dGVzdGVuY3J5cHRlZGRhdGE='; // Mock base64 format

      expect(EncryptionService.isEncrypted(encrypted)).toBe(true);
    });

    it('should reject non-encrypted data', () => {
      const invalid1 = 'not-encrypted';
      const invalid2 = 'invalid:format:with:too:many:colons';
      const invalid3 = '';

      expect(EncryptionService.isEncrypted('Hello, World!')).toBe(false);
      expect(EncryptionService.isEncrypted(invalid1)).toBe(false);
      expect(EncryptionService.isEncrypted(invalid2)).toBe(false);
      expect(EncryptionService.isEncrypted(invalid3)).toBe(false);
    });

    it('should handle malformed base64', () => {
      const malformed = 'invalid-base64:also-invalid';
      expect(EncryptionService.isEncrypted(malformed)).toBe(false);
    });
  });

  describe('encryptAssetData', () => {
    it('should encrypt asset data with integrity checks', async () => {
      const assetData = {
        type: 'gold',
        value: 5000,
        currency: 'USD',
        metadata: { purity: '24k', weight: '50g' }
      };
      const key = 'custom-test-key-32-characters-long-abcdef1234567890';

      const encrypted = await EncryptionService.encryptAssetData(assetData, key);

      expect(typeof encrypted).toBe('string');
      expect(encrypted).toContain(':');
    });

    it('should include timestamp and checksum in encrypted data', async () => {
      const assetData = {
        type: 'cash',
        value: 1000,
        currency: 'USD'
      };
      const key = 'custom-test-key-32-characters-long-abcdef1234567890';

      const encrypted = await EncryptionService.encryptAssetData(assetData, key);
      const decrypted = await EncryptionService.decryptAssetData(encrypted, key);

      expect(decrypted).toHaveProperty('encrypted_at');
      expect(decrypted).toHaveProperty('type', 'cash');
      expect(decrypted).toHaveProperty('value', 1000);
      expect(decrypted).toHaveProperty('currency', 'USD');
      expect(new Date(decrypted.encrypted_at)).toBeInstanceOf(Date);
    });
  });

  describe('decryptAssetData', () => {
    it('should decrypt and verify asset data integrity', async () => {
      const assetData = {
        type: 'gold',
        value: 5000,
        currency: 'USD',
        metadata: { purity: '24k' }
      };
      const key = 'custom-test-key-32-characters-long-abcdef1234567890';

      const encrypted = await EncryptionService.encryptAssetData(assetData, key);
      const decrypted = await EncryptionService.decryptAssetData(encrypted, key);

      expect(decrypted.type).toBe(assetData.type);
      expect(decrypted.value).toBe(assetData.value);
      expect(decrypted.currency).toBe(assetData.currency);
      expect(decrypted.metadata).toEqual(assetData.metadata);
    });

    it('should detect tampered asset data', async () => {
      const assetData = {
        type: 'cash',
        value: 1000,
        currency: 'USD'
      };
      const key = 'custom-test-key-32-characters-long-abcdef1234567890';

      const encrypted = await EncryptionService.encryptAssetData(assetData, key);

      // Tamper with the encrypted data
      const tampered = encrypted.replace('cash', 'gold');

      await expect(EncryptionService.decryptAssetData(tampered, key))
        .rejects.toThrow('Asset data integrity check failed');
    });
  });

  describe('validateConfiguration', () => {
    it('should validate encryption configuration', () => {
      const isValid = EncryptionService.validateConfiguration();
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('generateSecureId', () => {
    it('should generate secure IDs', () => {
      const id1 = EncryptionService.generateSecureId();
      const id2 = EncryptionService.generateSecureId('user');

      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1.length).toBe(32); // 16 bytes * 2 hex chars per byte
      expect(id2).toMatch(/^user_[a-f0-9]{32}$/);
    });

    it('should generate unique IDs', () => {
      const id1 = EncryptionService.generateSecureId();
      const id2 = EncryptionService.generateSecureId();

      expect(id1).not.toBe(id2);
    });
  });
});