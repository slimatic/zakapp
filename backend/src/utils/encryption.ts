import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits

// Get encryption key from environment or generate a fallback
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'fallback-dev-key-change-in-production-32chars!!';

/**
 * Generate a secure encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
}

/**
 * Derive key from password using PBKDF2
 */
export function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt sensitive data
 */
export function encryptData(data: string, userKey?: string): string {
  try {
    const key = userKey ? Buffer.from(userKey, 'base64') : Buffer.from(ENCRYPTION_KEY.padEnd(KEY_LENGTH, '0').slice(0, KEY_LENGTH));
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipher(ALGORITHM, key);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combine IV and encrypted data
    const result = {
      iv: iv.toString('hex'),
      data: encrypted,
    };
    
    return Buffer.from(JSON.stringify(result)).toString('base64');
  } catch (error) {
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string, userKey?: string): string {
  try {
    const key = userKey ? Buffer.from(userKey, 'base64') : Buffer.from(ENCRYPTION_KEY.padEnd(KEY_LENGTH, '0').slice(0, KEY_LENGTH));
    
    const parsed = JSON.parse(Buffer.from(encryptedData, 'base64').toString('utf8'));
    const encrypted = parsed.data;
    
    const decipher = crypto.createDecipher(ALGORITHM, key);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed');
  }
}

/**
 * Encrypt user preferences
 */
export function encryptUserPreferences(preferences: any): string {
  return encryptData(JSON.stringify(preferences));
}

/**
 * Decrypt user preferences
 */
export function decryptUserPreferences(encryptedPreferences: string): any {
  try {
    const decrypted = decryptData(encryptedPreferences);
    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error('Failed to decrypt user preferences');
  }
}

/**
 * Hash sensitive data (one-way)
 */
export function hashSensitiveData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Encrypt file data
 */
export function encryptFileData(data: Buffer, userKey?: string): Buffer {
  try {
    const key = userKey ? Buffer.from(userKey, 'base64') : Buffer.from(ENCRYPTION_KEY.padEnd(KEY_LENGTH, '0').slice(0, KEY_LENGTH));
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipher(ALGORITHM, key);
    
    const encrypted = Buffer.concat([
      cipher.update(data),
      cipher.final(),
    ]);
    
    // Combine IV and encrypted data
    return Buffer.concat([
      iv,
      encrypted,
    ]);
  } catch (error) {
    throw new Error('File encryption failed');
  }
}

/**
 * Decrypt file data
 */
export function decryptFileData(encryptedData: Buffer, userKey?: string): Buffer {
  try {
    const key = userKey ? Buffer.from(userKey, 'base64') : Buffer.from(ENCRYPTION_KEY.padEnd(KEY_LENGTH, '0').slice(0, KEY_LENGTH));
    
    // Extract IV
    const iv = encryptedData.slice(0, IV_LENGTH);
    
    // Extract encrypted data
    const encrypted = encryptedData.slice(IV_LENGTH);
    
    const decipher = crypto.createDecipher(ALGORITHM, key);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    
    return decrypted;
  } catch (error) {
    throw new Error('File decryption failed');
  }
}

/**
 * Create encryption key for user (derived from user password)
 */
export function createUserEncryptionKey(userId: string, password: string): string {
  const salt = crypto.createHash('sha256').update(userId).digest();
  const key = deriveKey(password, salt);
  return key.toString('base64');
}

/**
 * Validate encryption key format
 */
export function isValidEncryptionKey(key: string): boolean {
  try {
    const decoded = Buffer.from(key, 'base64');
    return decoded.length === KEY_LENGTH;
  } catch (error) {
    return false;
  }
}