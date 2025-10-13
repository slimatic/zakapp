import { PrismaClient } from '@prisma/client';
import { EncryptionService } from './EncryptionService';

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '[REDACTED]';

export interface CreatePaymentRequest {
  calculationId: string;
  amount: number;
  currency?: string;
  paymentDate: Date;
  recipients: PaymentRecipient[];
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'online' | 'other';
  receiptNumber?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface PaymentRecipient {
  name: string;
  type: 'individual' | 'organization' | 'charity';
  category: 'poor' | 'needy' | 'collectors' | 'hearts_reconciled' | 'slaves' | 'debtors' | 'path_of_allah' | 'travelers';
  amount: number;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  notes?: string;
}

export interface PaymentData {
  id: string;
  userId: string;
  calculationId: string;
  paymentDate: Date;
  amount: number;
  currency: string;
  recipients: PaymentRecipient[];
  paymentMethod: string;
  receiptNumber?: string;
  islamicYear: string;
  notes?: string;
  status: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentStatistics {
  totalPaid: number;
  paymentsCount: number;
  averagePayment: number;
  paymentsByYear: Record<string, number>;
  paymentsByMethod: Record<string, number>;
  paymentsByRecipientCategory: Record<string, number>;
  recentPayments: PaymentData[];
}

export class PaymentService {
  /**
   * Record a new Zakat payment
   */
  async recordPayment(userId: string, request: CreatePaymentRequest): Promise<PaymentData> {
    const {
      calculationId,
      amount,
      currency = 'USD',
      paymentDate,
      recipients,
      paymentMethod,
      receiptNumber,
      notes,
      metadata = {}
    } = request;

    // Validate calculation exists and belongs to user
    const calculation = await prisma.zakatCalculation.findFirst({
      where: {
        id: calculationId,
        userId
      }
    });

    if (!calculation) {
      throw new Error('Calculation not found');
    }

    // Validate recipients total equals payment amount
    const recipientsTotal = recipients.reduce((sum, r) => sum + r.amount, 0);
    if (Math.abs(recipientsTotal - amount) > 0.01) {
      throw new Error('Recipients total must equal payment amount');
    }

    // Validate recipient categories are valid
    this.validateRecipientCategories(recipients);

    const islamicYear = this.getIslamicYear(paymentDate);

    // Encrypt sensitive recipient data
    const encryptedRecipients = await Promise.all(recipients.map(async recipient => ({
      ...recipient,
      contactInfo: recipient.contactInfo ? 
        await EncryptionService.encryptObject(recipient.contactInfo, ENCRYPTION_KEY) : null
    })));

    // Create payment record
    const payment = await prisma.zakatPayment.create({
      data: {
        userId,
        calculationId,
        paymentDate,
        amount,
        currency,
        recipients: JSON.stringify(encryptedRecipients),
        paymentMethod,
        receiptNumber: receiptNumber || null,
        islamicYear,
        notes: notes || null,
        status: 'completed',
        verificationDetails: JSON.stringify({
          ...metadata,
          recipientCount: recipients.length,
          paymentCategories: this.extractPaymentCategories(recipients)
        })
      }
    });

    return await this.formatPaymentData(payment);
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(userId: string, paymentId: string): Promise<PaymentData> {
    const payment = await prisma.zakatPayment.findFirst({
      where: {
        id: paymentId,
        userId
      }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    return await this.formatPaymentData(payment);
  }

  /**
   * Get user's payment history
   */
  async getPaymentHistory(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      year?: string;
      status?: string;
      paymentMethod?: string;
      sortBy?: 'date' | 'amount';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ) {
    const {
      page = 1,
      limit = 10,
      year,
      status = 'completed',
      paymentMethod,
      sortBy = 'date',
      sortOrder = 'desc'
    } = options;

    const where: any = { userId };
    
    if (year) {
      where.islamicYear = year;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    const orderBy = sortBy === 'date' ? 
      { paymentDate: sortOrder } : 
      { amount: sortOrder };

    const payments = await prisma.zakatPayment.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        calculation: {
          select: {
            id: true,
            calculationDate: true,
            methodology: true,
            zakatAmount: true,
            netWorth: true
          }
        }
      }
    });

    const total = await prisma.zakatPayment.count({ where });

    return {
      payments: await Promise.all(payments.map(async payment => ({
        ...await this.formatPaymentData(payment),
        calculation: payment.calculation
      }))),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update payment
   */
  async updatePayment(
    userId: string,
    paymentId: string,
    updates: {
      recipients?: PaymentRecipient[];
      paymentMethod?: string;
      receiptNumber?: string;
      notes?: string;
      status?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<PaymentData> {
    const payment = await prisma.zakatPayment.findFirst({
      where: { id: paymentId, userId }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    const updateData: any = {};

    if (updates.recipients) {
      // Validate recipients
      this.validateRecipientCategories(updates.recipients);
      
      // Encrypt sensitive recipient data
      const encryptedRecipients = await Promise.all(updates.recipients.map(async recipient => ({
        ...recipient,
        contactInfo: recipient.contactInfo ? 
          await EncryptionService.encryptObject(recipient.contactInfo, ENCRYPTION_KEY) : null
      })));

      updateData.recipients = JSON.stringify(encryptedRecipients);

      // Update metadata with new recipient info
      const currentMetadata = JSON.parse(payment.verificationDetails || '{}');
      updateData.verificationDetails = JSON.stringify({
        ...currentMetadata,
        recipientCount: updates.recipients.length,
        paymentCategories: this.extractPaymentCategories(updates.recipients),
        lastUpdated: new Date().toISOString()
      });
    }

    if (updates.paymentMethod) {
      updateData.paymentMethod = updates.paymentMethod;
    }

    if (updates.receiptNumber !== undefined) {
      updateData.receiptNumber = updates.receiptNumber;
    }

    if (updates.notes !== undefined) {
      updateData.notes = updates.notes;
    }

    if (updates.status) {
      updateData.status = updates.status;
    }

    if (updates.metadata) {
      const currentMetadata = JSON.parse(payment.verificationDetails || '{}');
      updateData.verificationDetails = JSON.stringify({
        ...currentMetadata,
        ...updates.metadata
      });
    }

    const updatedPayment = await prisma.zakatPayment.update({
      where: { id: paymentId },
      data: updateData
    });

    return this.formatPaymentData(updatedPayment);
  }

  /**
   * Delete payment
   */
  async deletePayment(userId: string, paymentId: string): Promise<void> {
    const payment = await prisma.zakatPayment.findFirst({
      where: { id: paymentId, userId }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    await prisma.zakatPayment.delete({
      where: { id: paymentId }
    });
  }

  /**
   * Get payment statistics
   */
  async getPaymentStatistics(userId: string, year?: string): Promise<PaymentStatistics> {
    const where: any = { userId, status: 'completed' };
    if (year) {
      where.islamicYear = year;
    }

    const payments = await prisma.zakatPayment.findMany({
      where,
      orderBy: { paymentDate: 'desc' }
    });

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const paymentsCount = payments.length;
    const averagePayment = paymentsCount > 0 ? totalPaid / paymentsCount : 0;

    // Group by year
    const paymentsByYear = payments.reduce((acc, payment) => {
      const year = payment.islamicYear;
      acc[year] = (acc[year] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);

    // Group by payment method
    const paymentsByMethod = payments.reduce((acc, payment) => {
      const method = payment.paymentMethod;
      acc[method] = (acc[method] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);

    // Group by recipient category
    const paymentsByRecipientCategory = payments.reduce((acc, payment) => {
      const recipients = JSON.parse(payment.recipients || '[]');
      recipients.forEach((recipient: PaymentRecipient) => {
        const category = recipient.category;
        acc[category] = (acc[category] || 0) + recipient.amount;
      });
      return acc;
    }, {} as Record<string, number>);

    // Get recent payments (limit 5)
    const recentPayments = await Promise.all(payments.slice(0, 5).map(async p => await this.formatPaymentData(p)));

    return {
      totalPaid,
      paymentsCount,
      averagePayment,
      paymentsByYear,
      paymentsByMethod,
      paymentsByRecipientCategory,
      recentPayments
    };
  }

  /**
   * Get payments summary for a specific year
   */
  async getYearSummary(userId: string, year: string) {
    const payments = await prisma.zakatPayment.findMany({
      where: {
        userId,
        islamicYear: year,
        status: 'completed'
      },
      include: {
        calculation: {
          select: {
            zakatAmount: true,
            methodology: true
          }
        }
      }
    });

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalObligatory = payments.reduce((sum, p) => 
      sum + (p.calculation?.zakatAmount || 0), 0
    );

    // Calculate distribution by categories
    const distributionByCategory = payments.reduce((acc, payment) => {
      const recipients = JSON.parse(payment.recipients || '[]');
      recipients.forEach((recipient: PaymentRecipient) => {
        if (!acc[recipient.category]) {
          acc[recipient.category] = {
            amount: 0,
            recipientCount: 0,
            percentage: 0
          };
        }
        acc[recipient.category].amount += recipient.amount;
        acc[recipient.category].recipientCount += 1;
      });
      return acc;
    }, {} as Record<string, any>);

    // Calculate percentages
    Object.keys(distributionByCategory).forEach(category => {
      distributionByCategory[category].percentage = 
        (distributionByCategory[category].amount / totalPaid) * 100;
    });

    return {
      year,
      totalPaid,
      totalObligatory,
      remainingToPay: Math.max(0, totalObligatory - totalPaid),
      paymentsCount: payments.length,
      distributionByCategory,
      paymentMethods: this.summarizePaymentMethods(payments),
      monthlyBreakdown: this.createMonthlyBreakdown(payments)
    };
  }

  /**
   * Get recipient suggestions based on previous payments
   */
  async getRecipientSuggestions(userId: string, limit: number = 10) {
    const payments = await prisma.zakatPayment.findMany({
      where: { userId, status: 'completed' },
      orderBy: { paymentDate: 'desc' },
      take: 50 // Look at last 50 payments for suggestions
    });

    const recipientMap = new Map();

    payments.forEach(payment => {
      const recipients = JSON.parse(payment.recipients || '[]');
      recipients.forEach((recipient: PaymentRecipient) => {
        const key = `${recipient.name}-${recipient.category}`;
        if (!recipientMap.has(key)) {
          recipientMap.set(key, {
            name: recipient.name,
            type: recipient.type,
            category: recipient.category,
            averageAmount: recipient.amount,
            paymentCount: 1,
            lastPaymentDate: payment.paymentDate
          });
        } else {
          const existing = recipientMap.get(key);
          existing.averageAmount = 
            (existing.averageAmount * existing.paymentCount + recipient.amount) / 
            (existing.paymentCount + 1);
          existing.paymentCount += 1;
          if (payment.paymentDate > existing.lastPaymentDate) {
            existing.lastPaymentDate = payment.paymentDate;
          }
        }
      });
    });

    // Sort by payment count (most frequent first) and limit
    return Array.from(recipientMap.values())
      .sort((a, b) => b.paymentCount - a.paymentCount)
      .slice(0, limit);
  }

  /**
   * Generate payment receipt data
   */
  async generateReceiptData(userId: string, paymentId: string) {
    const payment = await prisma.zakatPayment.findFirst({
      where: { id: paymentId, userId },
      include: {
        calculation: {
          select: {
            id: true,
            calculationDate: true,
            methodology: true,
            zakatAmount: true,
            netWorth: true,
            nisabThreshold: true
          }
        },
        user: {
          select: {
            email: true,
            profile: true
          }
        }
      }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Decrypt user profile if exists
    let userProfile: any = {};
    if (payment.user?.profile) {
      try {
        userProfile = await EncryptionService.decryptObject(payment.user.profile, ENCRYPTION_KEY) || {};
      } catch (error) {
        // Handle decryption error gracefully
        userProfile = {};
      }
    }

    // Decrypt recipient contact info
    const recipients = await Promise.all(JSON.parse(payment.recipients || '[]').map(async (recipient: any) => ({
      ...recipient,
      contactInfo: recipient.contactInfo ? 
        await EncryptionService.decryptObject(recipient.contactInfo, ENCRYPTION_KEY) : null
    })));

    return {
      receiptNumber: payment.receiptNumber || payment.id,
      paymentDate: payment.paymentDate,
      islamicYear: payment.islamicYear,
      payer: {
        email: payment.user?.email,
        profile: userProfile
      },
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        notes: payment.notes
      },
      calculation: payment.calculation,
      recipients,
      summary: {
        totalAmount: payment.amount,
        recipientCount: recipients.length,
        categories: this.extractPaymentCategories(recipients)
      },
      generatedAt: new Date()
    };
  }

  /**
   * Private: Format payment data for response
   */
  private async formatPaymentData(payment: any): Promise<PaymentData> {
    // Decrypt recipient contact info
    let recipients = [];
    try {
      recipients = await Promise.all(JSON.parse(payment.recipients || '[]').map(async (recipient: any) => ({
        ...recipient,
        contactInfo: recipient.contactInfo ? 
          await EncryptionService.decryptObject(recipient.contactInfo, ENCRYPTION_KEY) : null
      })));
    } catch (error) {
      recipients = [];
    }

    return {
      id: payment.id,
      userId: payment.userId,
      calculationId: payment.calculationId,
      paymentDate: payment.paymentDate,
      amount: payment.amount,
      currency: payment.currency,
      recipients,
      paymentMethod: payment.paymentMethod,
      receiptNumber: payment.receiptNumber,
      islamicYear: payment.islamicYear,
      notes: payment.notes,
      status: payment.status,
      metadata: JSON.parse(payment.verificationDetails || '{}'),
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    };
  }

  /**
   * Private: Validate recipient categories
   */
  private validateRecipientCategories(recipients: PaymentRecipient[]): void {
    const validCategories = [
      'poor', 'needy', 'collectors', 'hearts_reconciled',
      'slaves', 'debtors', 'path_of_allah', 'travelers'
    ];

    for (const recipient of recipients) {
      if (!validCategories.includes(recipient.category)) {
        throw new Error(`Invalid recipient category: ${recipient.category}`);
      }
      
      if (recipient.amount <= 0) {
        throw new Error('Recipient amount must be positive');
      }
    }
  }

  /**
   * Private: Extract payment categories from recipients
   */
  private extractPaymentCategories(recipients: PaymentRecipient[]): string[] {
    return [...new Set(recipients.map(r => r.category))];
  }

  /**
   * Private: Summarize payment methods
   */
  private summarizePaymentMethods(payments: any[]) {
    return payments.reduce((acc, payment) => {
      const method = payment.paymentMethod;
      if (!acc[method]) {
        acc[method] = { count: 0, amount: 0 };
      }
      acc[method].count += 1;
      acc[method].amount += payment.amount;
      return acc;
    }, {} as Record<string, any>);
  }

  /**
   * Private: Create monthly breakdown
   */
  private createMonthlyBreakdown(payments: any[]) {
    const monthlyData = payments.reduce((acc, payment) => {
      const month = payment.paymentDate.toISOString().substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { amount: 0, count: 0 };
      }
      acc[month].amount += payment.amount;
      acc[month].count += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]: [string, any]) => ({
        month,
        amount: data.amount,
        count: data.count
      }));
  }

  /**
   * Private: Get Islamic year from date
   */
  private getIslamicYear(date: Date): string {
    // Simplified Islamic year calculation
    const gregorianYear = date.getFullYear();
    const approximateIslamicYear = Math.floor((gregorianYear - 622) * 1.031) + 1;
    return approximateIslamicYear.toString();
  }
}