import { PrismaClient } from '@prisma/client';
import {
  PaymentRecord,
  CreatePaymentRecordDto,
  RecipientType,
  RecipientCategory,
  PaymentMethod,
  PaymentStatus
} from '@shared/types/tracking';

const prisma = new PrismaClient();

/**
 * PaymentRecord Model - Manages Zakat payment distribution records
 * Supports Islamic recipient categories and comprehensive payment tracking
 */
export class PaymentRecordModel {
  /**
   * Validates payment record data before creation/update
   * @param data - Payment data to validate
   * @throws Error if validation fails
   */
  private static validatePaymentData(data: Partial<CreatePaymentRecordDto>): void {
    // Validate amount
    if (data.amount !== undefined && data.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    // Validate payment date
    if (data.paymentDate) {
      const paymentDate = new Date(data.paymentDate);
      const now = new Date();
      if (paymentDate > now) {
        throw new Error('Payment date cannot be in the future');
      }
    }

    // Validate recipient type
    const validRecipientTypes: RecipientType[] = ['individual', 'charity', 'organization', 'institution'];
    if (data.recipientType && !validRecipientTypes.includes(data.recipientType)) {
      throw new Error(`Invalid recipient type. Must be one of: ${validRecipientTypes.join(', ')}`);
    }

    // Validate recipient category (8 Islamic categories)
    const validCategories: RecipientCategory[] = [
      'fakir',
      'miskin',
      'amil',
      'muallaf',
      'riqab',
      'gharimin',
      'fisabilillah',
      'ibnus_sabil'
    ];
    if (data.recipientCategory && !validCategories.includes(data.recipientCategory)) {
      throw new Error(`Invalid recipient category. Must be one of: ${validCategories.join(', ')}`);
    }

    // Validate payment method
    const validPaymentMethods: PaymentMethod[] = ['cash', 'bank_transfer', 'check', 'online', 'other'];
    if (data.paymentMethod && !validPaymentMethods.includes(data.paymentMethod)) {
      throw new Error(`Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`);
    }

    // Validate status
    const validStatuses: PaymentStatus[] = ['recorded', 'verified'];
    if (data.status && !validStatuses.includes(data.status)) {
      throw new Error(`Invalid status. Must be either 'recorded' or 'verified'`);
    }

    // Validate exchange rate
    if (data.exchangeRate !== undefined && data.exchangeRate <= 0) {
      throw new Error('Exchange rate must be greater than zero');
    }

    // Validate recipient name
    if (data.recipientName !== undefined && data.recipientName.trim().length === 0) {
      throw new Error('Recipient name cannot be empty');
    }
  }

  /**
   * Validates that snapshot exists and belongs to user
   * @param snapshotId - Snapshot ID
   * @param userId - User ID
   * @throws Error if snapshot not found or doesn't belong to user
   */
  private static async validateSnapshot(snapshotId: string, userId: string): Promise<void> {
    const snapshot = await prisma.yearlySnapshot.findFirst({
      where: { id: snapshotId, userId }
    });

    if (!snapshot) {
      throw new Error('Snapshot not found or does not belong to user');
    }
  }

  /**
   * Creates a new payment record
   * @param userId - User ID
   * @param data - Payment data to create
   * @returns Promise<PaymentRecord> - Created payment record
   * @throws Error if creation fails or validation fails
   */
  static async create(userId: string, data: CreatePaymentRecordDto): Promise<PaymentRecord> {
    try {
      // Validate data
      this.validatePaymentData(data);

      // Validate snapshot exists and belongs to user
      await this.validateSnapshot(data.snapshotId, userId);

      const payment = await prisma.paymentRecord.create({
        data: {
          userId,
          snapshotId: data.snapshotId,
          amount: String(data.amount), // Will be encrypted by service layer
          paymentDate: new Date(data.paymentDate),
          recipientName: data.recipientName, // Will be encrypted by service layer
          recipientType: data.recipientType,
          recipientCategory: data.recipientCategory,
          notes: data.notes ?? null,
          receiptReference: data.receiptReference ?? null,
          paymentMethod: data.paymentMethod,
          status: data.status ?? 'recorded',
          currency: data.currency ?? 'USD',
          exchangeRate: data.exchangeRate ?? 1.0,
        }
      });

      return payment as unknown as PaymentRecord;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create payment record: ${errorMessage}`);
    }
  }

  /**
   * Retrieves payment record by ID
   * @param id - Payment record ID
   * @param userId - User ID (for ownership validation)
   * @returns Promise<PaymentRecord | null> - Payment record or null if not found
   */
  static async findById(id: string, userId: string): Promise<PaymentRecord | null> {
    try {
      const payment = await prisma.paymentRecord.findFirst({
        where: { id, userId }
      });

      return payment as unknown as PaymentRecord | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find payment record: ${errorMessage}`);
    }
  }

  /**
   * Retrieves all payments for a user with pagination and filtering
   * @param userId - User ID
   * @param options - Query options
   * @returns Promise<PaymentRecord[]> - Array of payment records
   */
  static async findByUser(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      snapshotId?: string;
      status?: PaymentStatus;
      recipientCategory?: RecipientCategory;
      startDate?: Date;
      endDate?: Date;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ data: PaymentRecord[]; total: number }> {
    try {
      const page = options.page ?? 1;
      const limit = options.limit ?? 20;
      const skip = (page - 1) * limit;

      const where: any = { userId };

      if (options.snapshotId) {
        where.snapshotId = options.snapshotId;
      }

      if (options.status) {
        where.status = options.status;
      }

      if (options.recipientCategory) {
        where.recipientCategory = options.recipientCategory;
      }

      if (options.startDate || options.endDate) {
        where.paymentDate = {};
        if (options.startDate) {
          where.paymentDate.gte = options.startDate;
        }
        if (options.endDate) {
          where.paymentDate.lte = options.endDate;
        }
      }

      const [payments, total] = await Promise.all([
        prisma.paymentRecord.findMany({
          where,
          orderBy: { paymentDate: options.sortOrder ?? 'desc' },
          skip,
          take: limit,
        }),
        prisma.paymentRecord.count({ where })
      ]);

      return {
        data: payments as unknown as PaymentRecord[],
        total
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find payment records: ${errorMessage}`);
    }
  }

  /**
   * Retrieves all payments for a specific snapshot
   * @param snapshotId - Snapshot ID
   * @param userId - User ID (for ownership validation)
   * @returns Promise<PaymentRecord[]> - Array of payment records
   */
  static async findBySnapshot(snapshotId: string, userId: string): Promise<PaymentRecord[]> {
    try {
      // Validate snapshot belongs to user
      await this.validateSnapshot(snapshotId, userId);

      const payments = await prisma.paymentRecord.findMany({
        where: { snapshotId, userId },
        orderBy: { paymentDate: 'desc' }
      });

      return payments as unknown as PaymentRecord[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find payments for snapshot: ${errorMessage}`);
    }
  }

  /**
   * Updates a payment record
   * @param id - Payment record ID
   * @param userId - User ID (for ownership validation)
   * @param data - Update data
   * @returns Promise<PaymentRecord> - Updated payment record
   * @throws Error if update fails
   */
  static async update(
    id: string,
    userId: string,
    data: Partial<CreatePaymentRecordDto>
  ): Promise<PaymentRecord> {
    try {
      // Validate data
      this.validatePaymentData(data);

      // Check if payment exists
      const existing = await this.findById(id, userId);
      if (!existing) {
        throw new Error('Payment record not found');
      }

      const updateData: any = {};

      if (data.amount !== undefined) {
        updateData.amount = String(data.amount);
      }

      if (data.paymentDate) {
        updateData.paymentDate = new Date(data.paymentDate);
      }

      if (data.recipientName) {
        updateData.recipientName = data.recipientName;
      }

      if (data.recipientType) {
        updateData.recipientType = data.recipientType;
      }

      if (data.recipientCategory) {
        updateData.recipientCategory = data.recipientCategory;
      }

      if (data.notes !== undefined) {
        updateData.notes = data.notes;
      }

      if (data.receiptReference !== undefined) {
        updateData.receiptReference = data.receiptReference;
      }

      if (data.paymentMethod) {
        updateData.paymentMethod = data.paymentMethod;
      }

      if (data.status) {
        updateData.status = data.status;
      }

      if (data.currency) {
        updateData.currency = data.currency;
      }

      if (data.exchangeRate !== undefined) {
        updateData.exchangeRate = data.exchangeRate;
      }

      const payment = await prisma.paymentRecord.update({
        where: { id },
        data: updateData
      });

      return payment as unknown as PaymentRecord;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update payment record: ${errorMessage}`);
    }
  }

  /**
   * Deletes a payment record
   * @param id - Payment record ID
   * @param userId - User ID (for ownership validation)
   * @returns Promise<void>
   */
  static async delete(id: string, userId: string): Promise<void> {
    try {
      const existing = await this.findById(id, userId);
      if (!existing) {
        throw new Error('Payment record not found');
      }

      await prisma.paymentRecord.delete({
        where: { id }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete payment record: ${errorMessage}`);
    }
  }

  /**
   * Calculates total payments for a snapshot
   * @param snapshotId - Snapshot ID
   * @param userId - User ID (for ownership validation)
   * @returns Promise<number> - Total amount paid
   */
  static async getTotalPaidForSnapshot(snapshotId: string, userId: string): Promise<number> {
    try {
      const payments = await this.findBySnapshot(snapshotId, userId);
      return payments.reduce((sum, payment) => {
        const amount = parseFloat(payment.amount as unknown as string);
        return sum + (amount * payment.exchangeRate);
      }, 0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to calculate total paid: ${errorMessage}`);
    }
  }

  /**
   * Gets payment statistics by recipient category
   * @param userId - User ID
   * @param snapshotId - Optional snapshot ID to filter by
   * @returns Promise<Record<RecipientCategory, { count: number; total: number }>>
   */
  static async getStatisticsByCategory(
    userId: string,
    snapshotId?: string
  ): Promise<Record<string, { count: number; total: number }>> {
    try {
      const where: any = { userId };
      if (snapshotId) {
        where.snapshotId = snapshotId;
      }

      const payments = await prisma.paymentRecord.findMany({ where });

      const stats: Record<string, { count: number; total: number }> = {};

      payments.forEach((payment: any) => {
        const category = payment.recipientCategory;
        const amount = parseFloat(payment.amount) * payment.exchangeRate;

        if (!stats[category]) {
          stats[category] = { count: 0, total: 0 };
        }

        stats[category].count++;
        stats[category].total += amount;
      });

      return stats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get payment statistics: ${errorMessage}`);
    }
  }
}
