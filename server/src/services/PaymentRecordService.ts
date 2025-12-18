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

              if (typeof rawAmount === 'string') {
                try {
                  const dec = await tryDecryptNormalizedAmount(rawAmount);
                  decrypted.amount = parseFloat(dec);
                } catch (inner) {
                  // Not encrypted, parse as plain string
                  decrypted.amount = parseFloat(rawAmount as string);
                }
              } else {
                decrypted.amount = rawAmount as number;
              }
            } catch (err) {
              console.error('[PaymentRecordService] Warning: failed to decrypt/parse payment.amount, falling back to raw value', err instanceof Error ? err.message : err);
              decrypted.amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount;
            }
          }

          // recipientName, notes and receiptReference may be encrypted or plain text
          const decryptionFailures: { field: string; err: any }[] = [];
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
                // Collect failure and fall back to raw value; we'll log a single consolidated warning later
                decryptionFailures.push({ field, err: innerErr instanceof Error ? innerErr.message : innerErr });

                // Additional diagnostics to help identify format issues
                try {
                  const sample = String(val).slice(0, 200);
                  const isBuf = Buffer.isBuffer(val);
                  let isEncryptedCheck = false;
                  try {
                    isEncryptedCheck = EncryptionService.isEncrypted(val as string);
                  } catch (e) {
                    isEncryptedCheck = false;
                  }

                  console.warn(`[PaymentRecordService] Decryption failure diagnostics for payment ${payment.id || '[unknown]'} field=${field} => type=${typeof val}, isBuffer=${isBuf}, looksEncrypted=${isEncryptedCheck}, sample=${sample}`);
                } catch (diagErr) {
                  console.warn('[PaymentRecordService] Failed to capture decryption diagnostics', diagErr instanceof Error ? diagErr.message : diagErr);
                }

                (decrypted as any)[field] = val;
              }
            }
          };

          await tryDecryptField('recipientName');
          await tryDecryptField('notes');
          await tryDecryptField('receiptReference');

          if (decryptionFailures.length > 0) {
            const fields = decryptionFailures.map(f => f.field).join(', ');
            const firstErr = decryptionFailures[0].err;
            let msg = `[PaymentRecordService] Failed to decrypt fields for payment ${payment.id || '[unknown]'}: ${fields}. First error: ${firstErr}`;

            // Provide actionable guidance when no previous keys are configured
            if (!process.env.ENCRYPTION_PREVIOUS_KEYS) {
              msg += ' — Note: no ENCRYPTION_PREVIOUS_KEYS configured. If these payments were encrypted with an earlier key, set ENCRYPTION_PREVIOUS_KEYS to a comma-separated list of previous keys to attempt fallback decryption.';
            } else {
              msg += ' — Previous keys are configured; decryption still failed with all provided keys.';
            }

            console.warn(msg);
          }

          return decrypted as PaymentRecord;
        } catch (error) {
          // Diagnostic logging to help identify decryption format/key issues
          try {
            const amountFormat = typeof payment.amount === 'string' ? payment.amount.slice(0, 64) : String(payment.amount);
            console.error('[PaymentRecordService] Failed to decrypt payment data for record', payment.id || '[unknown id]');
            console.error('[PaymentRecordService] Encrypted field samples: amount(sample)=', amountFormat);
            // Use EncryptionService utilities to inspect format where possible
            try {
              const isAmountEncrypted = EncryptionService.isEncrypted(payment.amount as string);
              console.error('[PaymentRecordService] EncryptionService.isEncrypted(amount)=', isAmountEncrypted);
            } catch (inner) {
              console.error('[PaymentRecordService] isEncrypted check failed for amount');
            }
          } catch (logErr) {
            console.error('[PaymentRecordService] Failed to emit diagnostic log', logErr instanceof Error ? logErr.message : logErr);
          }

          throw new Error(
            `Failed to decrypt payment data: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
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
          console.error(`[PaymentRecordService] Warning: failed to encrypt ${field}, falling back to raw value`, err);
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
    console.log('PaymentRecordService.createPayment - input data:', JSON.stringify(data, null, 2));
    
    // Encrypt sensitive data
    const encrypted = await this.encryptPaymentData(data);
    
    console.log('PaymentRecordService.createPayment - encrypted data:', JSON.stringify(encrypted, null, 2));

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
    settled.forEach((s, idx) => {
      if (s.status === 'rejected') {
        const payment = result.data[idx];
        console.error('[PaymentRecordService] Failed to decrypt payment id=', payment?.id || '[unknown]');
        console.error('[PaymentRecordService] decryption error:', (s as PromiseRejectedResult).reason);
      }
    });

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

    settled.forEach((s, idx) => {
      if (s.status === 'rejected') {
        const payment = result.data[idx];
        console.error('[PaymentRecordService] Failed to decrypt payment id=', payment?.id || '[unknown]');
      }
    });

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

    settled.forEach((s, idx) => {
      if (s.status === 'rejected') {
        const payment = payments[idx];
        console.error('[PaymentRecordService] Failed to decrypt payment id=', payment?.id || '[unknown]');
      }
    });

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
