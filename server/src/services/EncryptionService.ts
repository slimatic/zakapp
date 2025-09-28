import crypto from 'crypto';

export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly secretKey: string;

  constructor() {
    this.secretKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    
    // Ensure secret key is 32 bytes
    if (this.secretKey.length !== 64) { // 32 bytes = 64 hex chars
      throw new Error('Encryption key must be 32 bytes (64 hex characters)');
    }
  }

  /**
   * Encrypt sensitive text data
   */
  encrypt(text: string): string {
    if (!text) return text;

    try {
      // Generate random initialization vector
      const iv = crypto.randomBytes(16);
      
      // Create cipher with IV
      const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.secretKey, 'hex'), iv);
      
      // Encrypt the text
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Combine IV and encrypted data
      return iv.toString('hex') + ':' + encrypted;
    } catch (error: any) {
      throw new Error(`Encryption failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Decrypt encrypted text data
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText || typeof encryptedText !== 'string') return encryptedText;

    try {
      // Check if text is encrypted (contains ':' separator)
      if (!encryptedText.includes(':')) {
        // If no separator, assume it's not encrypted and return as-is
        return encryptedText;
      }

      // Split IV and encrypted data
      const [ivHex, encrypted] = encryptedText.split(':');
      
      if (!ivHex || !encrypted) {
        throw new Error('Invalid encrypted data format');
      }

      // Convert IV from hex
      const iv = Buffer.from(ivHex, 'hex');
      
      // Create decipher with IV
      const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.secretKey, 'hex'), iv);
      
      // Decrypt the text
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error: any) {
      // If decryption fails, log error and return original text
      console.error('Decryption failed:', error?.message || 'Unknown error');
      return encryptedText;
    }
  }

  /**
   * Encrypt JSON object
   */
  encryptObject(obj: any): string {
    if (!obj) return '';
    
    try {
      const jsonString = JSON.stringify(obj);
      return this.encrypt(jsonString);
    } catch (error: any) {
      throw new Error(`Object encryption failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Decrypt to JSON object
   */
  decryptObject<T = any>(encryptedText: string): T | null {
    if (!encryptedText) return null;

    try {
      const decryptedString = this.decrypt(encryptedText);
      return JSON.parse(decryptedString) as T;
    } catch (error: any) {
      console.error('Object decryption failed:', error?.message || 'Unknown error');
      return null;
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  hash(data: string): string {
    if (!data) return data;
    
    return crypto
      .createHash('sha256')
      .update(data + this.secretKey)
      .digest('hex');
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate cryptographically secure random ID
   */
  generateSecureId(prefix?: string): string {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(8).toString('hex');
    const id = `${timestamp}-${random}`;
    
    return prefix ? `${prefix}-${id}` : id;
  }

  /**
   * Validate if string is encrypted (has our format)
   */
  isEncrypted(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    
    // Check if it has our encryption format (iv:encrypted)
    return text.includes(':') && text.split(':').length === 2;
  }

  /**
   * Encrypt financial amounts with additional precision preservation
   */
  encryptAmount(amount: number | string): string {
    if (amount === null || amount === undefined) return '';
    
    // Convert to string with full precision
    const amountStr = typeof amount === 'number' ? amount.toFixed(8) : amount.toString();
    return this.encrypt(amountStr);
  }

  /**
   * Decrypt financial amounts and return as number
   */
  decryptAmount(encryptedAmount: string): number {
    if (!encryptedAmount) return 0;
    
    const decrypted = this.decrypt(encryptedAmount);
    const amount = parseFloat(decrypted);
    
    return isNaN(amount) ? 0 : amount;
  }
}