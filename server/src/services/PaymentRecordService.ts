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
   * Encrypts sensitive payment fields
   * Per schema: amount, recipientName, notes, receiptReference are encrypted Strings
   * @param data - Payment data to encrypt
   * @returns Encrypted data
   */
  private async encryptPaymentData(data: any): Promise<any> {
    const encrypted = { ...data };

    // Encrypt amount (stored as encrypted String)
    if (data.amount !== undefined) {
      encrypted.amount = await EncryptionService.encrypt(String(data.amount), this.encryptionKey);
    }

    // Encrypt recipient name (stored as encrypted String)
    if (data.recipientName) {
      encrypted.recipientName = await EncryptionService.encrypt(data.recipientName, this.encryptionKey);
    }

    // Encrypt notes if provided (stored as encrypted String)
    if (data.notes) {
      encrypted.notes = await EncryptionService.encrypt(data.notes, this.encryptionKey);
    }

    // Encrypt receipt reference if provided (stored as encrypted String)
    if (data.receiptReference) {
      encrypted.receiptReference = await EncryptionService.encrypt(data.receiptReference, this.encryptionKey);
    }

    // exchangeRate is stored as plain Float - no encryption needed
    // recipientType, recipientCategory, paymentMethod, status, currency are plain Strings - no encryption needed

    return encrypted;
  }

  /**
   * Decrypts sensitive payment fields
   * @param payment - Encrypted payment record
   * @returns Decrypted payment record
   */
  private async decryptPaymentData(payment: any): Promise<PaymentRecord> {
    try {
      const decrypted: any = {
        ...payment,
      };

      // Decrypt only the fields that are actually encrypted in the database
      // Per schema: amount, recipientName, notes, receiptReference are encrypted Strings
      // exchangeRate is a plain Float, not encrypted
      
      if (payment.amount) {
        decrypted.amount = parseFloat(
          await EncryptionService.decrypt(payment.amount, this.encryptionKey)
        );
      }

      if (payment.recipientName) {
        decrypted.recipientName = await EncryptionService.decrypt(
          payment.recipientName,
          this.encryptionKey
        );
      }

      if (payment.notes) {
        decrypted.notes = await EncryptionService.decrypt(
          payment.notes,
          this.encryptionKey
        );
      }

      if (payment.receiptReference) {
        decrypted.receiptReference = await EncryptionService.decrypt(
          payment.receiptReference,
          this.encryptionKey
        );
      }

      // exchangeRate, currency, recipientType, recipientCategory, paymentMethod, status
      // are all plain fields - no decryption needed

      return decrypted;
    } catch (error) {
      throw new Error(
        `Failed to decrypt payment data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
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

    // Decrypt all payments
    const decryptedData = await Promise.all(
      result.data.map(payment => this.decryptPaymentData(payment))
    );

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
    
    return await Promise.all(
      result.data.map(payment => this.decryptPaymentData(payment))
    );
  }

  /**
   * Lists payments for a specific snapshot
   * @param snapshotId - Snapshot ID
   * @param userId - User ID for authorization
   * @returns Array of decrypted payments
   */
  async getPaymentsBySnapshot(snapshotId: string, userId: string): Promise<PaymentRecord[]> {
    const payments = await PaymentRecordModel.findBySnapshot(snapshotId, userId);
    
    return await Promise.all(
      payments.map(payment => this.decryptPaymentData(payment))
    );
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
