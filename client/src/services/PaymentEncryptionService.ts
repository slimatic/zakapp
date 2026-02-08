/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { cryptoService } from './CryptoService';
import { EncryptedPaymentData, DecryptedPaymentData } from '@zakapp/shared/types/zk-contracts';
import { PaymentRecord } from '@zakapp/shared/types/tracking';

/**
 * PaymentEncryptionService
 * 
 * Handles client-side encryption/decryption of payment data using ZK1 format.
 * This service bridges between the local PaymentRecord type and the API contract types.
 * 
 * ZK1 Format: ZK1:<iv_base64>:<ciphertext_base64>
 * 
 * Encrypted Fields:
 * - recipientName (sensitive)
 * - notes (private user notes)
 * - receiptReference (optional)
 */
export class PaymentEncryptionService {
  /**
   * Encrypts payment data before sending to server
   * Uses ZK1 format: ZK1:<iv>:<ciphertext>
   * 
   * @param payment - Payment record with plaintext data
   * @returns Payment record with encrypted sensitive fields
   */
  static async encryptPaymentData(payment: Partial<PaymentRecord>): Promise<Partial<PaymentRecord>> {
    const encrypted: Partial<PaymentRecord> = { ...payment };

    // Encrypt recipientName if present
    if (payment.recipientName && typeof payment.recipientName === 'string') {
      const { iv, cipherText } = await cryptoService.encrypt(payment.recipientName);
      encrypted.recipientName = cryptoService.packEncrypted(iv, cipherText);
    }

    // Encrypt notes if present
    if (payment.notes && typeof payment.notes === 'string') {
      const { iv, cipherText } = await cryptoService.encrypt(payment.notes);
      encrypted.notes = cryptoService.packEncrypted(iv, cipherText);
    }

    // Encrypt receiptReference if present
    if (payment.receiptReference && typeof payment.receiptReference === 'string') {
      const { iv, cipherText } = await cryptoService.encrypt(payment.receiptReference);
      encrypted.receiptReference = cryptoService.packEncrypted(iv, cipherText);
    }

    return encrypted;
  }

  /**
   * Decrypts payment data received from server
   * Handles both ZK1 (client-encrypted) and legacy (server-encrypted) formats
   * 
   * @param encrypted - Payment record with encrypted fields
   * @returns Payment record with decrypted fields
   */
  static async decryptPaymentData(encrypted: Partial<PaymentRecord>): Promise<Partial<PaymentRecord>> {
    const decrypted: Partial<PaymentRecord> = { ...encrypted };

    // Decrypt recipientName if ZK1 format
    if (encrypted.recipientName && typeof encrypted.recipientName === 'string') {
      if (cryptoService.isEncrypted(encrypted.recipientName)) {
        const unpacked = cryptoService.unpackEncrypted(encrypted.recipientName);
        if (unpacked) {
          try {
            decrypted.recipientName = await cryptoService.decrypt(unpacked.ciphertext, unpacked.iv);
          } catch (e) {
            console.warn('PaymentEncryptionService: Failed to decrypt recipientName', e);
            decrypted.recipientName = '[Decryption Failed]';
          }
        }
      }
      // If not encrypted (legacy format), pass through as-is
    }

    // Decrypt notes if ZK1 format
    if (encrypted.notes && typeof encrypted.notes === 'string') {
      if (cryptoService.isEncrypted(encrypted.notes)) {
        const unpacked = cryptoService.unpackEncrypted(encrypted.notes);
        if (unpacked) {
          try {
            decrypted.notes = await cryptoService.decrypt(unpacked.ciphertext, unpacked.iv);
          } catch (e) {
            console.warn('PaymentEncryptionService: Failed to decrypt notes', e);
            decrypted.notes = '[Decryption Failed]';
          }
        }
      }
    }

    // Decrypt receiptReference if ZK1 format
    if (encrypted.receiptReference && typeof encrypted.receiptReference === 'string') {
      if (cryptoService.isEncrypted(encrypted.receiptReference)) {
        const unpacked = cryptoService.unpackEncrypted(encrypted.receiptReference);
        if (unpacked) {
          try {
            decrypted.receiptReference = await cryptoService.decrypt(unpacked.ciphertext, unpacked.iv);
          } catch (e) {
            console.warn('PaymentEncryptionService: Failed to decrypt receiptReference', e);
            decrypted.receiptReference = '[Decryption Failed]';
          }
        }
      }
    }

    return decrypted;
  }

  /**
   * Convert from API contract format (EncryptedPaymentData) to PaymentRecord
   * Maps field names: recipient -> recipientName
   */
  static apiToPaymentRecord(apiData: EncryptedPaymentData): Partial<PaymentRecord> {
    return {
      id: apiData.id,
      userId: apiData.userId,
      calculationId: apiData.calculationId || undefined,
      amount: apiData.amount,
      currency: apiData.currency || 'USD',
      paymentDate: apiData.paymentDate,
      recipientName: apiData.recipient, // Map recipient -> recipientName
      notes: apiData.notes,
      paymentMethod: (apiData.paymentMethod as any) || 'cash',
      status: (apiData.status as any) || 'recorded',
      createdAt: apiData.createdAt,
      updatedAt: apiData.updatedAt
    };
  }

  /**
   * Convert from PaymentRecord to API contract format (EncryptedPaymentData)
   * Maps field names: recipientName -> recipient
   */
  static paymentRecordToApi(payment: Partial<PaymentRecord>): EncryptedPaymentData {
    return {
      id: payment.id,
      userId: payment.userId,
      calculationId: payment.calculationId,
      amount: payment.amount!,
      currency: payment.currency,
      paymentDate: payment.paymentDate as string,
      recipient: payment.recipientName, // Map recipientName -> recipient
      notes: payment.notes,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      createdAt: payment.createdAt as string,
      updatedAt: payment.updatedAt as string
    };
  }
}
