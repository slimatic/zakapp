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

import { Payment, CreatePaymentData, PaymentData, DecryptedPaymentData } from '../models/payment';
import { prisma } from '../config/database';

export class PaymentService {
  /**
   * Creates a new payment record
   */
  static async createPayment(data: CreatePaymentData): Promise<PaymentData> {
    // Check resource limits
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { maxPayments: true }
    });

    if (user) {
      const limit = user.maxPayments ?? parseInt(process.env.DEFAULT_MAX_PAYMENTS || '100');
      const currentCount = await prisma.paymentRecord.count({
        where: { userId: data.userId }
      });

      if (currentCount >= limit) {
        throw new Error(`Payment limit reached. You can create a maximum of ${limit} payments.`);
      }
    }

    // Validate that the snapshot exists and belongs to the user
    const snapshot = await prisma.yearlySnapshot.findFirst({
      where: {
        id: data.snapshotId,
        userId: data.userId,
      },
    });

    if (!snapshot) {
      throw new Error('Snapshot not found or does not belong to user');
    }

    // Validate calculation ID if provided
    if (data.calculationId) {
      const calculation = await prisma.zakatCalculation.findFirst({
        where: {
          id: data.calculationId,
          userId: data.userId,
        },
      });

      if (!calculation) {
        throw new Error('Calculation not found or does not belong to user');
      }
    }

    // Create the payment using the Payment model
    const paymentData = await Payment.create(data);
    // Return the raw payment data (with encrypted sensitive fields) so callers can verify encryption
    return paymentData;
  }

  /**
   * Retrieves a payment by ID
   */
  static async getPaymentById(id: string, userId: string): Promise<DecryptedPaymentData | null> {
    const payment = await Payment.findById(id);

    // Ensure the payment belongs to the user
    if (payment && payment.userId !== userId) {
      throw new Error('Payment not found');
    }

    return payment;
  }

  /**
   * Retrieves all payments for a user
   */
  static async getPaymentsByUserId(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: 'paymentDate' | 'amount' | 'createdAt';
      orderDirection?: 'asc' | 'desc';
      startDate?: Date;
      endDate?: Date;
      recipientCategory?: string;
      minAmount?: string;
      maxAmount?: string;
      snapshotId?: string;
    }
  ): Promise<DecryptedPaymentData[]> {
    const {
      limit = 50,
      offset = 0,
      orderBy = 'paymentDate',
      orderDirection = 'desc',
      startDate,
      endDate,
      recipientCategory,
      minAmount,
      maxAmount,
      snapshotId,
    } = options || {};

    // Build where clause for filtering
    const where: Record<string, unknown> = { userId };

    if (snapshotId) {
      where.snapshotId = snapshotId;
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.gte = startDate;
      if (endDate) dateFilter.lte = endDate;
      where.paymentDate = dateFilter;
    }

    if (recipientCategory) {
      where.recipientCategory = recipientCategory;
    }

    // Note: Amount filtering would require decrypting all records, which is expensive
    // For now, we'll skip amount filtering in the database query
    // In a production system, you might want to store decrypted amounts in a separate index

    const payments = await prisma.paymentRecord.findMany({
      where,
      orderBy: { [orderBy]: orderDirection },
      take: limit,
      skip: offset,
    });

    // Decrypt the payments
    const decryptedPayments = await Promise.all(
      payments.map(async (payment) => {
        const decrypted = await Payment.findById(payment.id);
        return decrypted!;
      })
    );

    // Apply amount filtering if specified
    let filteredPayments = decryptedPayments;
    if (minAmount || maxAmount) {
      filteredPayments = decryptedPayments.filter(payment => {
        const amount = parseFloat(payment.decryptedAmount);
        if (minAmount && amount < parseFloat(minAmount)) return false;
        if (maxAmount && amount > parseFloat(maxAmount)) return false;
        return true;
      });
    }

    return filteredPayments;
  }

  /**
   * Updates a payment record
   */
  static async updatePayment(
    id: string,
    userId: string,
    data: Partial<CreatePaymentData>
  ): Promise<DecryptedPaymentData | null> {
    // First check if the payment exists and belongs to the user
    const existingPayment = await Payment.findById(id);
    if (!existingPayment || existingPayment.userId !== userId) {
      throw new Error('Payment not found');
    }

    // Validate snapshot if being changed
    if (data.snapshotId && data.snapshotId !== existingPayment.snapshotId) {
      const snapshot = await prisma.yearlySnapshot.findFirst({
        where: {
          id: data.snapshotId,
          userId,
        },
      });

      if (!snapshot) {
        throw new Error('New snapshot not found or does not belong to user');
      }
    }

    // Validate calculation if being changed
    if (data.calculationId !== undefined && data.calculationId !== existingPayment.calculationId) {
      if (data.calculationId) {
        const calculation = await prisma.zakatCalculation.findFirst({
          where: {
            id: data.calculationId,
            userId,
          },
        });

        if (!calculation) {
          throw new Error('New calculation not found or does not belong to user');
        }
      }
    }

    return Payment.update(id, data);
  }

  /**
   * Deletes a payment record
   */
  static async deletePayment(id: string, userId: string): Promise<boolean> {
    // First check if the payment exists and belongs to the user
    const existingPayment = await Payment.findById(id);
    if (!existingPayment || existingPayment.userId !== userId) {
      return false;
    }

    return Payment.delete(id);
  }

  /**
   * Gets payment statistics for a user
   */
  static async getPaymentStats(userId: string, startDate?: Date, endDate?: Date): Promise<{
    totalPayments: number;
    totalAmount: number;
    averageAmount: number;
    categoryBreakdown: Record<string, { count: number; amount: number }>;
  }> {
    const payments = await this.getPaymentsByUserId(userId, {
      startDate,
      endDate,
      limit: 1000, // Reasonable limit for stats
    });

    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.decryptedAmount), 0);
    const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;

    const categoryBreakdown: Record<string, { count: number; amount: number }> = {};
    payments.forEach(payment => {
      const category = payment.recipientCategory;
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { count: 0, amount: 0 };
      }
      categoryBreakdown[category].count++;
      categoryBreakdown[category].amount += parseFloat(payment.decryptedAmount);
    });

    return {
      totalPayments,
      totalAmount,
      averageAmount,
      categoryBreakdown,
    };
  }
}