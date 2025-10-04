import * as crypto from 'crypto';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;

  static async encrypt(plaintext: string, key: string): Promise<string> {
    try {
      if (!plaintext) throw new Error('Plaintext cannot be empty');
      if (!key) throw new Error('Encryption key is required');

      const encryptionKey = this.normalizeKey(key);
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipheriv(this.ALGORITHM, encryptionKey, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      return iv.toString('base64') + ':' + encrypted;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Encryption failed: ${errorMessage}`);
    }
  }

  static async decrypt(encryptedData: string, key: string): Promise<string> {
    try {
      if (!encryptedData) throw new Error('Encrypted data cannot be empty');
      if (!key) throw new Error('Decryption key is required');

      const parts = encryptedData.split(':');
      if (parts.length !== 2) throw new Error('Invalid encrypted data format');

      const [ivBase64, encrypted] = parts;
      const iv = Buffer.from(ivBase64, 'base64');
      
      if (iv.length !== this.IV_LENGTH) throw new Error('Invalid IV length');

      const decryptionKey = this.normalizeKey(key);
      const decipher = crypto.createDecipheriv(this.ALGORITHM, decryptionKey, iv);
      
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Decryption failed: ${errorMessage}`);
    }
  }

  static async encryptObject<T>(data: T, key: string): Promise<string> {
    try {
      if (data === null || data === undefined) {
        throw new Error('Data cannot be null or undefined');
      }
      const jsonString = JSON.stringify(data);
      return await this.encrypt(jsonString, key);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Object encryption failed: ${errorMessage}`);
    }
  }

  static async decryptObject<T>(encryptedData: string, key: string): Promise<T> {
    try {
      const jsonString = await this.decrypt(encryptedData, key);
      return JSON.parse(jsonString) as T;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Object decryption failed: ${errorMessage}`);
    }
  }

  static generateKey(): string {
    try {
      const key = crypto.randomBytes(this.KEY_LENGTH);
      return key.toString('base64');
    } catch (error) {
      throw new Error('Failed to generate encryption key');
    }
  }

  static async deriveKey(password: string, salt: string, iterations: number = 100000): Promise<string> {
    try {
      if (!password) throw new Error('Password cannot be empty');
      if (!salt) throw new Error('Salt cannot be empty');

      return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, iterations, this.KEY_LENGTH, 'sha512', (err, key) => {
          if (err) {
            reject(new Error(`Key derivation failed: ${err.message}`));
          } else {
            resolve(key.toString('base64'));
          }
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Key derivation failed: ${errorMessage}`);
    }
  }

  static generateSalt(): string {
    try {
      const salt = crypto.randomBytes(16);
      return salt.toString('base64');
    } catch (error) {
      throw new Error('Failed to generate salt');
    }
  }

  static hash(data: string): string {
    try {
      if (!data) throw new Error('Data to hash cannot be empty');
      return crypto.createHash('sha256').update(data).digest('hex');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Hashing failed: ${errorMessage}`);
    }
  }

  static verifyHash(data: string, hash: string): boolean {
    try {
      if (!data || !hash) return false;
      
      const dataHash = this.hash(data);
      return crypto.timingSafeEqual(
        Buffer.from(dataHash, 'hex'),
        Buffer.from(hash, 'hex')
      );
    } catch (error) {
      return false;
    }
  }

  private static normalizeKey(key: string): Buffer {
    try {
      let keyBuffer: Buffer;
      
      try {
        keyBuffer = Buffer.from(key, 'base64');
      } catch {
        keyBuffer = Buffer.from(key, 'utf8');
      }

      if (keyBuffer.length === this.KEY_LENGTH) {
        return keyBuffer;
      } else if (keyBuffer.length > this.KEY_LENGTH) {
        return keyBuffer.subarray(0, this.KEY_LENGTH);
      } else {
        const paddedKey = Buffer.alloc(this.KEY_LENGTH);
        keyBuffer.copy(paddedKey);
        return paddedKey;
      }
    } catch (error) {
      throw new Error('Invalid encryption key format');
    }
  }

  static isEncrypted(data: string): boolean {
    try {
      if (!data || typeof data !== 'string') return false;

      const parts = data.split(':');
      if (parts.length !== 2) return false;

      const [ivPart, encryptedPart] = parts;
      
      try {
        const iv = Buffer.from(ivPart, 'base64');
        Buffer.from(encryptedPart, 'base64');
        return iv.length === this.IV_LENGTH;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Encrypts financial asset data with integrity checks
   */
  static async encryptAssetData(assetData: {
    type: string;
    value: number;
    currency: string;
    metadata?: Record<string, any>;
  }, key: string): Promise<string> {
    try {
      const dataWithMetadata = {
        ...assetData,
        encrypted_at: new Date().toISOString(),
        checksum: this.hash(JSON.stringify(assetData))
      };

      return await this.encryptObject(dataWithMetadata, key);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Asset encryption failed: ${errorMessage}`);
    }
  }

  /**
   * Decrypts and verifies financial asset data
   */
  static async decryptAssetData(encryptedAssetData: string, key: string): Promise<{
    type: string;
    value: number;
    currency: string;
    metadata?: Record<string, any>;
    encrypted_at: string;
  }> {
    try {
      const decryptedData = await this.decryptObject<{
        type: string;
        value: number;
        currency: string;
        metadata?: Record<string, any>;
        encrypted_at: string;
        checksum: string;
      }>(encryptedAssetData, key);

      const { checksum, ...assetData } = decryptedData;
      const expectedChecksum = this.hash(JSON.stringify({
        type: assetData.type,
        value: assetData.value,
        currency: assetData.currency,
        metadata: assetData.metadata
      }));

      if (checksum !== expectedChecksum) {
        throw new Error('Asset data integrity check failed');
      }

      return assetData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Asset decryption failed: ${errorMessage}`);
    }
  }

  /**
   * Validates encryption configuration
   */
  static validateConfiguration(): boolean {
    try {
      const testKey = this.generateKey();
      const testData = 'test_encryption_data';
      const testKeyBuffer = this.normalizeKey(testKey);
      const iv = crypto.randomBytes(this.IV_LENGTH);
      
      const cipher = crypto.createCipheriv(this.ALGORITHM, testKeyBuffer, iv);
      cipher.update(testData, 'utf8');
      cipher.final('base64');
      
      return true;
    } catch (error) {
      console.error('Encryption configuration validation failed:', error);
      return false;
    }
  }
}

// Export singleton instance for application use
export const encryptionService = {
  encrypt: EncryptionService.encrypt,
  decrypt: EncryptionService.decrypt,
  encryptObject: EncryptionService.encryptObject,
  decryptObject: EncryptionService.decryptObject,
  generateKey: EncryptionService.generateKey,
  deriveKey: EncryptionService.deriveKey,
  generateSalt: EncryptionService.generateSalt,
  hash: EncryptionService.hash,
  verifyHash: EncryptionService.verifyHash,
  isEncrypted: EncryptionService.isEncrypted,
  encryptAssetData: EncryptionService.encryptAssetData,
  decryptAssetData: EncryptionService.decryptAssetData,
  validateConfiguration: EncryptionService.validateConfiguration
};
