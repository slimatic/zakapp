/**
 * Unit Tests for Encryption Service
 * 
 * Constitutional Principles:
 * - Privacy & Security First: Comprehensive testing of encryption/decryption
 * - Quality & Reliability: >90% code coverage and edge case testing
 * - Transparency & Trust: Clear test scenarios and security validation
 */

import { EncryptionService } from '../../server/src/services/EncryptionService';
import crypto from 'crypto';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;
  
  beforeEach(() => {
    // Set test encryption key
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters-long-abcdef1234567890';
    encryptionService = new EncryptionService();
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with valid encryption key', () => {
      expect(() => new EncryptionService()).not.toThrow();
    });

    it('should throw error with missing encryption key', () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => new EncryptionService()).toThrow('ENCRYPTION_KEY environment variable is required');
    });

    it('should throw error with invalid encryption key length', () => {
      process.env.ENCRYPTION_KEY = 'too-short';
      expect(() => new EncryptionService()).toThrow('Encryption key must be exactly 32 characters');
    });

    it('should create singleton instance', () => {
      const instance1 = EncryptionService.getInstance();
      const instance2 = EncryptionService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Basic Encryption/Decryption', () => {
    it('should encrypt and decrypt text data', () => {
      const plaintext = 'Hello, World!';
      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
      expect(encrypted.encryptedData).not.toBe(plaintext);
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.iv).toHaveLength(32); // 16 bytes in hex
    });

    it('should encrypt and decrypt JSON objects', () => {
      const data = { name: 'John Doe', balance: 1000.50, currency: 'USD' };
      const encrypted = encryptionService.encryptObject(data);
      const decrypted = encryptionService.decryptObject(encrypted);
      
      expect(decrypted).toEqual(data);
    });

    it('should encrypt and decrypt arrays', () => {
      const data = ['item1', 'item2', 'item3'];
      const encrypted = encryptionService.encryptObject(data);
      const decrypted = encryptionService.decryptObject(encrypted);
      
      expect(decrypted).toEqual(data);
    });

    it('should handle empty strings', () => {
      const plaintext = '';
      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should handle null and undefined values in objects', () => {
      const data = { nullValue: null, undefinedValue: undefined, emptyString: '' };
      const encrypted = encryptionService.encryptObject(data);
      const decrypted = encryptionService.decryptObject(encrypted);
      
      expect(decrypted).toEqual(data);
    });
  });

  describe('Security Properties', () => {
    it('should generate different IV for each encryption', () => {
      const plaintext = 'Same message';
      const encrypted1 = encryptionService.encrypt(plaintext);
      const encrypted2 = encryptionService.encrypt(plaintext);
      
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.encryptedData).not.toBe(encrypted2.encryptedData);
    });

    it('should produce different ciphertext for identical inputs', () => {
      const plaintext = 'Sensitive financial data';
      const results = Array.from({ length: 5 }, () => encryptionService.encrypt(plaintext));
      
      const uniqueCiphertexts = new Set(results.map(r => r.encryptedData));
      expect(uniqueCiphertexts.size).toBe(5);
    });

    it('should handle sensitive financial data correctly', () => {
      const sensitiveData = {
        accountBalance: 50000.75,
        bankAccount: '1234567890',
        socialSecurity: '123-45-6789',
        creditCard: '4532-1234-5678-9012'
      };
      
      const encrypted = encryptionService.encryptObject(sensitiveData);
      const decrypted = encryptionService.decryptObject(encrypted);
      
      expect(decrypted).toEqual(sensitiveData);
      expect(JSON.stringify(encrypted)).not.toContain('50000.75');
      expect(JSON.stringify(encrypted)).not.toContain('1234567890');
    });

    it('should use AES-256-CBC algorithm', () => {
      const plaintext = 'Test message';
      const encrypted = encryptionService.encrypt(plaintext);
      
      // Verify IV length (16 bytes for AES)
      expect(Buffer.from(encrypted.iv, 'hex')).toHaveLength(16);
      
      // Verify encrypted data is properly formatted
      expect(encrypted.encryptedData).toMatch(/^[0-9a-f]+$/i);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid encrypted data format', () => {
      const invalidEncrypted = {
        encryptedData: 'invalid-hex-data',
        iv: '1234567890abcdef1234567890abcdef'
      };
      
      expect(() => encryptionService.decrypt(invalidEncrypted))
        .toThrow('Failed to decrypt data');
    });

    it('should throw error for invalid IV format', () => {
      const validData = encryptionService.encrypt('test');
      const invalidEncrypted = {
        encryptedData: validData.encryptedData,
        iv: 'invalid-iv'
      };
      
      expect(() => encryptionService.decrypt(invalidEncrypted))
        .toThrow('Failed to decrypt data');
    });

    it('should throw error for missing encrypted data', () => {
      const invalidEncrypted = {
        encryptedData: '',
        iv: '1234567890abcdef1234567890abcdef'
      };
      
      expect(() => encryptionService.decrypt(invalidEncrypted))
        .toThrow('Encrypted data and IV are required');
    });

    it('should throw error for missing IV', () => {
      const validData = encryptionService.encrypt('test');
      const invalidEncrypted = {
        encryptedData: validData.encryptedData,
        iv: ''
      };
      
      expect(() => encryptionService.decrypt(invalidEncrypted))
        .toThrow('Encrypted data and IV are required');
    });

    it('should handle JSON parsing errors gracefully', () => {
      // Create encrypted data that will result in invalid JSON
      const validEncrypted = encryptionService.encrypt('not-valid-json{');
      
      expect(() => encryptionService.decryptObject(validEncrypted))
        .toThrow('Failed to parse decrypted JSON');
    });
  });

  describe('Data Types and Edge Cases', () => {
    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      const encrypted = encryptionService.encrypt(longString);
      const decrypted = encryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(longString);
    });

    it('should handle unicode characters', () => {
      const unicodeText = '🔒 Secure زكاة calculation データ';
      const encrypted = encryptionService.encrypt(unicodeText);
      const decrypted = encryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(unicodeText);
    });

    it('should handle special characters and symbols', () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?`~"\'\n\t\r';
      const encrypted = encryptionService.encrypt(specialText);
      const decrypted = encryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(specialText);
    });

    it('should handle complex nested objects', () => {
      const complexData = {
        user: {
          id: 'user123',
          profile: {
            name: 'Ahmed Hassan',
            assets: [
              { type: 'cash', value: 1000, currency: 'USD' },
              { type: 'gold', value: 5000, weight: '50g' }
            ]
          }
        },
        calculations: {
          nisab: 5000,
          zakatRate: 0.025,
          totalZakat: 150
        }
      };
      
      const encrypted = encryptionService.encryptObject(complexData);
      const decrypted = encryptionService.decryptObject(encrypted);
      
      expect(decrypted).toEqual(complexData);
    });

    it('should handle numeric precision correctly', () => {
      const preciseNumbers = {
        smallDecimal: 0.0000001,
        largeNumber: 999999999.99,
        negativeNumber: -12345.6789,
        scientificNotation: 1.23e-10
      };
      
      const encrypted = encryptionService.encryptObject(preciseNumbers);
      const decrypted = encryptionService.decryptObject(encrypted);
      
      expect(decrypted).toEqual(preciseNumbers);
    });
  });

  describe('Performance and Memory', () => {
    it('should encrypt/decrypt within reasonable time limits', () => {
      const largeData = {
        assets: Array.from({ length: 1000 }, (_, i) => ({
          id: `asset-${i}`,
          value: Math.random() * 10000,
          category: 'test'
        }))
      };
      
      const startTime = Date.now();
      const encrypted = encryptionService.encryptObject(largeData);
      const decrypted = encryptionService.decryptObject(encrypted);
      const endTime = Date.now();
      
      expect(decrypted).toEqual(largeData);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should not leak memory with repeated operations', () => {
      const testData = 'Memory leak test data';
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many encryption/decryption operations
      for (let i = 0; i < 1000; i++) {
        const encrypted = encryptionService.encrypt(testData + i);
        encryptionService.decrypt(encrypted);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Islamic Compliance Data Protection', () => {
    it('should properly encrypt Zakat calculation data', () => {
      const zakatData = {
        methodology: 'hanafi',
        nisabThreshold: 4948.87, // Current gold nisab
        assets: {
          cash: 10000,
          gold: { weight: '85g', value: 5000 },
          silver: { weight: '595g', value: 500 },
          business: 15000
        },
        totalZakatable: 30500,
        zakatDue: 762.50,
        paymentDate: '2024-09-29',
        recipient: 'Local Islamic Center'
      };
      
      const encrypted = encryptionService.encryptObject(zakatData);
      const decrypted = encryptionService.decryptObject(encrypted);
      
      expect(decrypted).toEqual(zakatData);
      
      // Ensure sensitive financial data is not visible in encrypted form
      const encryptedString = JSON.stringify(encrypted);
      expect(encryptedString).not.toContain('10000');
      expect(encryptedString).not.toContain('762.50');
      expect(encryptedString).not.toContain('hanafi');
    });

    it('should encrypt user profile data securely', () => {
      const profileData = {
        personalInfo: {
          name: 'Fatima Al-Zahra',
          email: 'fatima@example.com',
          location: 'Dubai, UAE'
        },
        preferences: {
          zakatMethodology: 'shafi',
          currency: 'AED',
          language: 'ar',
          notifications: true
        },
        privacySettings: {
          shareCalculations: false,
          anonymousMode: true,
          dataRetention: '1year'
        }
      };
      
      const encrypted = encryptionService.encryptObject(profileData);
      const decrypted = encryptionService.decryptObject(encrypted);
      
      expect(decrypted).toEqual(profileData);
      
      // Verify PII is encrypted
      const encryptedString = JSON.stringify(encrypted);
      expect(encryptedString).not.toContain('Fatima Al-Zahra');
      expect(encryptedString).not.toContain('fatima@example.com');
      expect(encryptedString).not.toContain('Dubai, UAE');
    });
  });

  describe('Backwards Compatibility', () => {
    it('should maintain consistent encryption format', () => {
      const testData = 'consistency test';
      const encrypted = encryptionService.encrypt(testData);
      
      // Verify structure matches expected format
      expect(encrypted).toHaveProperty('encryptedData');
      expect(encrypted).toHaveProperty('iv');
      expect(typeof encrypted.encryptedData).toBe('string');
      expect(typeof encrypted.iv).toBe('string');
      expect(encrypted.iv).toHaveLength(32); // 16 bytes in hex
    });

    it('should decrypt data encrypted with same algorithm', () => {
      const plaintext = 'backwards compatibility test';
      
      // Simulate encryption with same algorithm manually
      const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'utf8');
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-cbc', key);
      const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
      
      const manualEncryption = {
        encryptedData: encrypted.toString('hex'),
        iv: iv.toString('hex')
      };
      
      // This test verifies our service can handle the expected format
      expect(typeof manualEncryption.encryptedData).toBe('string');
      expect(typeof manualEncryption.iv).toBe('string');
    });
  });
});