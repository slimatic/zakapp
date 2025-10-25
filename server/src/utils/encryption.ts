import { EncryptionService } from '../services/EncryptionService';

/**
 * Encryption utilities for payment data
 * Provides payment-specific encryption/decryption functions
 */
export class PaymentEncryption {
  /**
   * Encrypts payment amount
   * @param amount - Payment amount as string
   * @param key - Encryption key
   * @returns Encrypted amount
   */
  static async encryptAmount(amount: string, key: string): Promise<string> {
    return await EncryptionService.encrypt(amount, key);
  }

  /**
   * Decrypts payment amount
   * @param encryptedAmount - Encrypted payment amount
   * @param key - Encryption key
   * @returns Decrypted amount
   */
  static async decryptAmount(encryptedAmount: string, key: string): Promise<string> {
    return await EncryptionService.decrypt(encryptedAmount, key);
  }

  /**
   * Encrypts recipient name
   * @param recipientName - Recipient name
   * @param key - Encryption key
   * @returns Encrypted recipient name
   */
  static async encryptRecipientName(recipientName: string, key: string): Promise<string> {
    return await EncryptionService.encrypt(recipientName, key);
  }

  /**
   * Decrypts recipient name
   * @param encryptedRecipientName - Encrypted recipient name
   * @param key - Encryption key
   * @returns Decrypted recipient name
   */
  static async decryptRecipientName(encryptedRecipientName: string, key: string): Promise<string> {
    return await EncryptionService.decrypt(encryptedRecipientName, key);
  }

  /**
   * Encrypts payment notes
   * @param notes - Payment notes
   * @param key - Encryption key
   * @returns Encrypted notes
   */
  static async encryptNotes(notes: string, key: string): Promise<string> {
    return await EncryptionService.encrypt(notes, key);
  }

  /**
   * Decrypts payment notes
   * @param encryptedNotes - Encrypted payment notes
   * @param key - Encryption key
   * @returns Decrypted notes
   */
  static async decryptNotes(encryptedNotes: string, key: string): Promise<string> {
    return await EncryptionService.decrypt(encryptedNotes, key);
  }

  /**
   * Encrypts receipt reference
   * @param receiptReference - Receipt reference
   * @param key - Encryption key
   * @returns Encrypted receipt reference
   */
  static async encryptReceiptReference(receiptReference: string, key: string): Promise<string> {
    return await EncryptionService.encrypt(receiptReference, key);
  }

  /**
   * Decrypts receipt reference
   * @param encryptedReceiptReference - Encrypted receipt reference
   * @param key - Encryption key
   * @returns Decrypted receipt reference
   */
  static async decryptReceiptReference(encryptedReceiptReference: string, key: string): Promise<string> {
    return await EncryptionService.decrypt(encryptedReceiptReference, key);
  }
}

/**
 * Encryption utilities for reminder data
 * Provides reminder-specific encryption/decryption functions
 */
export class ReminderEncryption {
  /**
   * Encrypts reminder message
   * @param message - Reminder message
   * @param key - Encryption key
   * @returns Encrypted message
   */
  static async encryptMessage(message: string, key: string): Promise<string> {
    return await EncryptionService.encrypt(message, key);
  }

  /**
   * Decrypts reminder message
   * @param encryptedMessage - Encrypted reminder message
   * @param key - Encryption key
   * @returns Decrypted message
   */
  static async decryptMessage(encryptedMessage: string, key: string): Promise<string> {
    return await EncryptionService.decrypt(encryptedMessage, key);
  }
}