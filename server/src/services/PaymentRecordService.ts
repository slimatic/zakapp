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

import { PaymentRecordModel } from '../models/PaymentRecord';
import { EncryptionService } from './EncryptionService';
import {
  PaymentRecord,
  CreatePaymentRecordDto,
  PaginationParams,
  PaginationResult,
  RecipientCategory,
  PaymentStatus
} from '@zakapp/shared';

/**
 * PaymentRecordService - Business logic for Zakat payment distribution
 * Handles encryption, Islamic category validation, and payment aggregation
 */
export class PaymentRecordService {
  private encryptionKey: string;
  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || '';
    if (!this.encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
  }

  /**
   * Decrypts sensitive payment fields
   * @param payment - Encrypted payment record
   * @returns Decrypted payment record
   */
  private async decryptPaymentData(payment: any): Promise<PaymentRecord> {
    try {
      const decrypted: any = { ...payment };

      // Amount can be stored as an encrypted string or plain numeric string
      if (payment.amount !== undefined && payment.amount !== null) {
        try {
          const rawAmount = payment.amount;

          const tryDecryptNormalizedAmount = async (raw: string) => {
            // Collect every plausible ciphertext form and try them in order,
            // returning the first that actually decrypts.
            //
            // Relying on EncryptionService.isEncrypted() alone is NOT sufficient:
            // it requires each base64 group to be >= 12 characters, so the
            // ciphertext of a plaintext shorter than 7 characters is reported as
            // not-encrypted. Attempting the decryption and letting AES-GCM
            // authentication decide is the reliable test.
            const candidates: string[] = [];
            if (EncryptionService.isEncrypted(raw)) candidates.push(raw);

            // Structured forms: 2 or 3 separator-delimited groups.
            const seps = [':', '.=', '.', '|', ';'];
            for (const sep of seps) {
              if (!raw.includes(sep)) continue;
              const parts = raw.split(sep);
              if (parts.length === 2 || parts.length === 3) {
                const normalized = parts.join(':');
                if (EncryptionService.isEncrypted(normalized)) candidates.push(normalized);
                // Also try the joined form even when isEncrypted says no, so a
                // short body still reaches the AES attempt below.
                candidates.push(normalized);
              }
            }
            candidates.push(raw);

            for (const candidate of candidates) {
              try {
                return await EncryptionService.decrypt(candidate, this.encryptionKey);
              } catch {
                // try the next candidate
              }
            }

            throw new Error('NotEncryptedOrUnsupportedFormat');
          };

          if (typeof rawAmount === 'string') {
            // ------------------------------------------------------------------
            // ORDER MATTERS HERE. A plain numeric string must be tried FIRST.
            //
            // A GCM ciphertext is "ivB64:bodyB64:tagB64". EncryptionService
            // .isEncrypted() requires every base64 group to be >= 12 characters,
            // so the body of a SHORT plaintext is not recognised as ciphertext:
            //
            //   plaintext   body (base64)   detected as encrypted?
            //   "1"         4 chars         no
            //   "1000"      8 chars         no
            //   "1234.56"   12 chars        yes
            //
            // Encrypting an amount whose plaintext is < 7 characters therefore
            // produces ciphertext that isEncrypted() reports as false. The old
            // code then ran parseFloat() on the CIPHERTEXT, which yields NaN for
            // almost every value below 1,000,000 — and in unlucky cases returned a
            // wrong number (e.g. "99.99" -> 8).
            //
            // Deciding "plain number or ciphertext?" from the CONTENT is reliable;
            // deciding it from isEncrypted() is not. So: parse as a number first,
            // and only attempt decryption when that fails AND the value looks
            // like ciphertext.
            // ------------------------------------------------------------------
            const asPlainNumber = Number(rawAmount);
            if (rawAmount.trim() !== '' && Number.isFinite(asPlainNumber)) {
              decrypted.amount = asPlainNumber;
            } else {
              // Not a plain number — it should be ciphertext, including the
              // legacy separator variants handled by tryDecryptNormalizedAmount.
              const dec = await tryDecryptNormalizedAmount(rawAmount);
              const parsed = parseFloat(dec);
              if (!Number.isFinite(parsed)) {
                throw new Error(`Decrypted amount is not numeric: ${JSON.stringify(dec)}`);
              }
              decrypted.amount = parsed;
            }
          } else {
            decrypted.amount = rawAmount as number;
          }
        } catch (err) {
          // Only reached when the value is neither a plain number nor decryptable.
          // Never silently coerce to NaN: surface it so the caller can see the row
          // is unreadable rather than reporting a corrupt amount as real data.
          const fallback = typeof payment.amount === 'string' ? Number(payment.amount) : payment.amount;
          if (!Number.isFinite(fallback)) {
            throw new Error(
              `Unreadable payment amount (id=${payment?.id ?? 'unknown'}): value is neither a plain number nor decryptable`
            );
          }
          decrypted.amount = fallback;
        }
      }

      // recipientName, notes and receiptReference may be encrypted or plain text
      const tryDecryptField = async (field: string) => {
        const val = (payment as any)[field];
        if (val !== undefined && val !== null) {
          if (typeof val !== 'string') {
            (decrypted as any)[field] = val;
            return;
          }

          const tryDecryptNormalized = async (raw: string) => {
            if (EncryptionService.isEncrypted(raw)) {
              return await EncryptionService.decrypt(raw, this.encryptionKey);
            }

            if (raw.includes('.=')) {
              const alt = raw.replace('.=', ':');
              if (EncryptionService.isEncrypted(alt)) {
                return await EncryptionService.decrypt(alt, this.encryptionKey);
              }
            }

            if (raw.includes('.') && !raw.includes(':')) {
              const parts = raw.split('.');
              if (parts.length === 2) {
                const alt = parts.join(':');
                if (EncryptionService.isEncrypted(alt)) {
                  return await EncryptionService.decrypt(alt, this.encryptionKey);
                }
              }
            }

            throw new Error('NotEncryptedOrUnsupportedFormat');
          };

          try {
            (decrypted as any)[field] = await tryDecryptNormalized(val as string);
          } catch (innerErr) {
            // Fall back to raw value if decryption fails
            (decrypted as any)[field] = val;
          }
        }
      };

      await tryDecryptField('recipientName');
      await tryDecryptField('notes');
      await tryDecryptField('receiptReference');

      return decrypted as PaymentRecord;
    } catch (error) {
      throw new Error(
        `Failed to decrypt payment data: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }


  /**
   * Encrypts sensitive payment fields before persistence
   */
  private async encryptPaymentData(data: Partial<CreatePaymentRecordDto> | CreatePaymentRecordDto): Promise<any> {
    const encrypted: any = { ...data };

    if (data.amount !== undefined && data.amount !== null) {
      // Store amounts as encrypted strings
      encrypted.amount = await EncryptionService.encrypt(String(data.amount), this.encryptionKey);
    }

    const tryEncryptField = async (field: string) => {
      const val = (data as any)[field];
      if (val !== undefined && val !== null) {
        try {
          encrypted[field] = await EncryptionService.encrypt(String(val), this.encryptionKey);
        } catch (err) {
          encrypted[field] = val;
        }
      }
    };

    await tryEncryptField('recipientName');
    await tryEncryptField('notes');
    await tryEncryptField('receiptReference');

    return encrypted;
  }
  /**
   * Creates a new payment record
   * @param userId - User ID
* @param data - Payment data
* @returns Created payment record
*/
  async createPayment(userId: string, data: CreatePaymentRecordDto): Promise<PaymentRecord> {
    // Encrypt sensitive data
    const encrypted = await this.encryptPaymentData(data);

    // Create payment in database
    const payment = await PaymentRecordModel.create(userId, encrypted);

    // Return decrypted data for immediate use
    return await this.decryptPaymentData(payment);
  }

  /**
   * Gets a single payment by ID
   * @param id - Payment ID
   * @param userId - User ID for authorization
   * @returns Decrypted payment or null
   */
  async getPayment(id: string, userId: string): Promise<PaymentRecord | null> {
    const payment = await PaymentRecordModel.findById(id, userId);

    if (!payment) {
      return null;
    }

    return await this.decryptPaymentData(payment);
  }

  /**
   * Lists payments for a user with pagination and filtering
   * @param userId - User ID
   * @param params - Pagination and filter params
   * @returns Paginated payments
   */
  async listPayments(
    userId: string,
    params: PaginationParams & {
      snapshotId?: string;
      category?: RecipientCategory;
      status?: PaymentStatus;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<PaginationResult<PaymentRecord>> {
    const result = await PaymentRecordModel.findByUser(userId, {
      page: params.page,
      limit: params.limit,
      snapshotId: params.snapshotId,
      recipientCategory: params.category,
      status: params.status,
      startDate: params.startDate,
      endDate: params.endDate,
      sortOrder: 'desc'
    });

    // Decrypt all payments; collect and consolidate decryption warnings to avoid noisy logs
    const settled = await Promise.allSettled(
      result.data.map(payment => this.decryptPaymentData(payment))
    );

    const decryptedData = settled
      .map((s, idx) => ({ s, orig: result.data[idx] }))
      .filter(item => item.s.status === 'fulfilled')
      .map(item => (item.s as PromiseFulfilledResult<any>).value);

    // Log any failures but continue
    // Log failures silently or to a future logging service
    // console.error removed for OSS readiness

    const currentPage = params.page ?? 1;
    const itemsPerPage = params.limit ?? 20;
    const totalPages = Math.ceil(result.total / itemsPerPage);

    return {
      data: decryptedData,
      pagination: {
        currentPage,
        totalPages,
        totalItems: result.total,
        itemsPerPage,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      }
    };
  }

  /**
   * Lists all payments for a user across all Nisab Year Records
   * @param userId - User ID for authorization
   * @param category - Optional category filter
   * @returns Array of decrypted payments
   */
  async getAllPayments(userId: string, category?: string): Promise<PaymentRecord[]> {
    const options: any = {};
    if (category) {
      options.recipientCategory = category;
    }

    const result = await PaymentRecordModel.findByUser(userId, options);

    const settled = await Promise.allSettled(
      result.data.map(payment => this.decryptPaymentData(payment))
    );

    const decrypted = settled
      .map((s, idx) => ({ s, orig: result.data[idx] }))
      .filter(item => item.s.status === 'fulfilled')
      .map(item => (item.s as PromiseFulfilledResult<any>).value);

    // console.error removed for OSS readiness

    return decrypted;
  }

  /**
   * Lists payments for a specific snapshot
   * @param snapshotId - Snapshot ID
   * @param userId - User ID for authorization
   * @returns Array of decrypted payments
   */
  async getPaymentsBySnapshot(snapshotId: string, userId: string): Promise<PaymentRecord[]> {
    const payments = await PaymentRecordModel.findBySnapshot(snapshotId, userId);
    const settled = await Promise.allSettled(
      payments.map(payment => this.decryptPaymentData(payment))
    );

    const decrypted = settled
      .map((s, idx) => ({ s, orig: payments[idx] }))
      .filter(item => item.s.status === 'fulfilled')
      .map(item => (item.s as PromiseFulfilledResult<any>).value);

    // console.error removed for OSS readiness

    return decrypted;
  }

  /**
   * Updates a payment record
   * @param id - Payment ID
   * @param userId - User ID for authorization
   * @param data - Update data
   * @returns Updated payment
   */
  async updatePayment(
    id: string,
    userId: string,
    data: Partial<CreatePaymentRecordDto>
  ): Promise<PaymentRecord> {
    // Check if payment exists
    const payment = await PaymentRecordModel.findById(id, userId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Encrypt sensitive data
    const encrypted = await this.encryptPaymentData(data);

    // Update payment
    const updated = await PaymentRecordModel.update(id, userId, encrypted);

    // Return decrypted data
    return await this.decryptPaymentData(updated);
  }

  /**
   * Deletes a payment record
   * @param id - Payment ID
   * @param userId - User ID for authorization
   */
  async deletePayment(id: string, userId: string): Promise<void> {
    // Check if payment exists
    const payment = await PaymentRecordModel.findById(id, userId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    await PaymentRecordModel.delete(id, userId);
  }

  /**
   * Gets total amount paid for a snapshot
   * @param snapshotId - Snapshot ID
   * @param userId - User ID for authorization
   * @returns Total amount paid
   */
  async getTotalPaid(snapshotId: string, userId: string): Promise<number> {
    const payments = await this.getPaymentsBySnapshot(snapshotId, userId);

    return payments.reduce((total, payment) => total + payment.amount, 0);
  }

  /**
   * Gets payment statistics grouped by Islamic category
   * @param snapshotId - Snapshot ID
   * @param userId - User ID for authorization
   * @returns Statistics by category
   */
  async getStatisticsByCategory(
    snapshotId: string,
    userId: string
  ): Promise<{
    category: RecipientCategory;
    count: number;
    totalAmount: number;
    percentage: number;
  }[]> {
    const payments = await this.getPaymentsBySnapshot(snapshotId, userId);
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    // Group by category
    const categoryMap = new Map<RecipientCategory, { count: number; totalAmount: number }>();

    payments.forEach(payment => {
      const existing = categoryMap.get(payment.recipientCategory) || { count: 0, totalAmount: 0 };
      categoryMap.set(payment.recipientCategory, {
        count: existing.count + 1,
        totalAmount: existing.totalAmount + payment.amount
      });
    });

    // Convert to array with percentages
    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      count: stats.count,
      totalAmount: stats.totalAmount,
      percentage: totalAmount > 0 ? (stats.totalAmount / totalAmount) * 100 : 0
    }));
  }

  /**
   * Gets overall payment statistics for a user
   * @param userId - User ID
   * @returns Overall statistics
   */
  async getOverallStatistics(userId: string): Promise<{
    totalPayments: number;
    totalAmount: number;
    verifiedCount: number;
    recordedCount: number;
    averagePaymentAmount: number;
    categoryDistribution: {
      category: RecipientCategory;
      count: number;
      totalAmount: number;
    }[];
  }> {
    const result = await PaymentRecordModel.findByUser(userId, {
      page: 1,
      limit: 10000 // Get all for statistics
    });

    const payments = await Promise.all(
      result.data.map(payment => this.decryptPaymentData(payment))
    );
    // Note: keep as-is here for statistics but handle errors upstream

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const verifiedCount = payments.filter(p => p.status === 'verified').length;
    const recordedCount = payments.filter(p => p.status === 'recorded').length;

    // Group by category
    const categoryMap = new Map<RecipientCategory, { count: number; totalAmount: number }>();
    payments.forEach(payment => {
      const existing = categoryMap.get(payment.recipientCategory) || { count: 0, totalAmount: 0 };
      categoryMap.set(payment.recipientCategory, {
        count: existing.count + 1,
        totalAmount: existing.totalAmount + payment.amount
      });
    });

    return {
      totalPayments: payments.length,
      totalAmount,
      verifiedCount,
      recordedCount,
      averagePaymentAmount: payments.length > 0 ? totalAmount / payments.length : 0,
      categoryDistribution: Array.from(categoryMap.entries()).map(([category, stats]) => ({
        category,
        count: stats.count,
        totalAmount: stats.totalAmount
      }))
    };
  }
}
