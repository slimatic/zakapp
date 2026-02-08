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

import { EncryptionService } from './EncryptionService';
import { sign } from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

import { getEncryptionKey } from '../config/security';

const ENCRYPTION_KEY = getEncryptionKey();
const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret-for-development';

export interface CreatePaymentDto {
  calculationId?: string;
  amount: number;
  paymentDate: string;
  recipient?: string;
  notes?: string;
}

export interface UpdatePaymentDto {
  amount?: number;
  paymentDate?: string;
  recipient?: string;
  notes?: string;
}

export interface PaymentFilters {
  year?: number;
  page?: number;
  limit?: number;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  calculationId: string;
  amount: number;
  paymentDate: string;
  recipient?: string;
  notes?: string;
  receiptUrl: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * PaymentRecordService - Service for managing Zakat payment records
 * Provides CRUD operations with encryption and receipt URL generation
 */
export class PaymentRecordService {
  /**
   * Creates a new payment record
   * @param userId - User ID
   * @param data - Payment data
   * @returns Created payment record
   */
  async createPayment(userId: string, data: CreatePaymentDto): Promise<PaymentRecord> {
    // Validate calculation exists and belongs to user (skip for testing if calculationId is not provided)
    if (data.calculationId) {
      const calculation = await prisma.zakatCalculation.findFirst({
        where: {
          id: data.calculationId,
          userId
        }
      });

      if (!calculation) {
        throw new Error('Calculation not found');
      }
    }

    // Validate amount is positive
    if (data.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    // Validate payment date is not in the future
    const paymentDate = new Date(data.paymentDate);
    const now = new Date();
    if (paymentDate > now) {
      throw new Error('Payment date cannot be in the future');
    }

    // DUAL-MODE ENCRYPTION DETECTION
    // If data is already in ZK1 format, store as-is (client-encrypted)
    // Otherwise, encrypt with server key (legacy mode)
    const isZK1Recipient = EncryptionService.isZeroKnowledgeFormat(data.recipient);
    const isZK1Notes = EncryptionService.isZeroKnowledgeFormat(data.notes);

    const encryptedRecipient = data.recipient ? (
      isZK1Recipient 
        ? data.recipient // Already encrypted by client, store as-is
        : await EncryptionService.encrypt(data.recipient, ENCRYPTION_KEY)
    ) : null;

    const encryptedNotes = data.notes ? (
      isZK1Notes
        ? data.notes // Already encrypted by client, store as-is
        : await EncryptionService.encrypt(data.notes, ENCRYPTION_KEY)
    ) : null;

    // Store format metadata for proper decryption later
    const verificationDetails = {
      recipient: encryptedRecipient,
      encryptionFormat: isZK1Recipient ? 'ZK1' : 'SERVER_GCM',
      encryptedAt: new Date().toISOString()
    };

    // Create payment record
    const payment = await prisma.zakatPayment.create({
      data: {
        userId,
        calculationId: data.calculationId || null,
        paymentDate,
        amount: data.amount,
        currency: 'USD', // Default for now
        recipients: JSON.stringify([]), // Empty array for compatibility
        paymentMethod: 'other', // Default
        islamicYear: this.getIslamicYear(paymentDate),
        notes: encryptedNotes,
        status: 'completed',
        verificationDetails: JSON.stringify(verificationDetails)
      }
    });

    // Generate receipt URL with signed token
    const receiptToken = sign(
      { paymentId: payment.id, userId },
      JWT_SECRET,
      { expiresIn: '1y' }
    );
    const receiptUrl = `/api/zakat/receipts/${receiptToken}`;

    return {
      id: payment.id,
      userId: payment.userId,
      calculationId: payment.calculationId || undefined,
      amount: payment.amount,
      paymentDate: payment.paymentDate.toISOString().split('T')[0],
      recipient: data.recipient,
      notes: data.notes,
      receiptUrl,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.createdAt.toISOString() // Use createdAt as updatedAt since no updatedAt field
    };
  }

  /**
   * Gets payments for a user with optional filtering
   * @param userId - User ID
   * @param filters - Optional filters
   * @returns Array of payment records
   */
  async getPayments(userId: string, filters: PaymentFilters = {}): Promise<PaymentRecord[]> {
    const where: any = { userId };

    // Filter by year if specified
    if (filters.year) {
      const startDate = new Date(filters.year, 0, 1); // January 1st
      const endDate = new Date(filters.year + 1, 0, 1); // January 1st of next year
      where.paymentDate = {
        gte: startDate,
        lt: endDate
      };
    }

    const payments = await prisma.zakatPayment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      skip: filters.page ? (filters.page - 1) * (filters.limit || 20) : 0,
      take: filters.limit || 20
    });

    // Decrypt and format payments
    const formattedPayments: PaymentRecord[] = [];
    for (const payment of payments) {
      const verificationDetails = JSON.parse(payment.verificationDetails || '{}');
      
      // DUAL-MODE DECRYPTION
      let recipient: string | undefined;
      if (verificationDetails.recipient) {
        if (verificationDetails.encryptionFormat === 'ZK1') {
          // Client-encrypted: Return as-is (client will decrypt)
          recipient = verificationDetails.recipient;
        } else {
          // Server-encrypted legacy format: Decrypt before returning
          recipient = await EncryptionService.decrypt(verificationDetails.recipient, ENCRYPTION_KEY);
        }
      }

      // Handle notes decryption (notes might not have format metadata in old records)
      let notes: string | undefined;
      if (payment.notes) {
        if (EncryptionService.isZeroKnowledgeFormat(payment.notes)) {
          // ZK1 format: Return as-is
          notes = payment.notes;
        } else {
          // Legacy format: Decrypt
          notes = await EncryptionService.decrypt(payment.notes, ENCRYPTION_KEY);
        }
      }

      // Generate receipt URL
      const receiptToken = sign(
        { paymentId: payment.id, userId },
        JWT_SECRET,
        { expiresIn: '1y' }
      );
      const receiptUrl = `/api/zakat/receipts/${receiptToken}`;

      formattedPayments.push({
        id: payment.id,
        userId: payment.userId,
        calculationId: payment.calculationId!,
        amount: payment.amount,
        paymentDate: payment.paymentDate.toISOString().split('T')[0],
        recipient,
        notes,
        receiptUrl,
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.createdAt.toISOString() // Use createdAt as updatedAt
      });
    }

    return formattedPayments;
  }

  /**
   * Gets a single payment by ID
   * @param userId - User ID
   * @param id - Payment ID
   * @returns Payment record or null if not found
   */
  async getPayment(userId: string, id: string): Promise<PaymentRecord | null> {
    const payment = await prisma.zakatPayment.findFirst({
      where: { id, userId }
    });

    if (!payment || payment.status === 'cancelled') {
      return null;
    }

    const verificationDetails = JSON.parse(payment.verificationDetails || '{}');
    
    // DUAL-MODE DECRYPTION
    let recipient: string | undefined;
    if (verificationDetails.recipient) {
      if (verificationDetails.encryptionFormat === 'ZK1') {
        // Client-encrypted: Return as-is (client will decrypt)
        recipient = verificationDetails.recipient;
      } else {
        // Server-encrypted legacy format: Decrypt before returning
        recipient = await EncryptionService.decrypt(verificationDetails.recipient, ENCRYPTION_KEY);
      }
    }

    // Handle notes decryption
    let notes: string | undefined;
    if (payment.notes) {
      if (EncryptionService.isZeroKnowledgeFormat(payment.notes)) {
        // ZK1 format: Return as-is
        notes = payment.notes;
      } else {
        // Legacy format: Decrypt
        notes = await EncryptionService.decrypt(payment.notes, ENCRYPTION_KEY);
      }
    }

    // Generate receipt URL
    const receiptToken = sign(
      { paymentId: payment.id, userId },
      JWT_SECRET,
      { expiresIn: '1y' }
    );
    const receiptUrl = `/api/zakat/receipts/${receiptToken}`;

    return {
      id: payment.id,
      userId: payment.userId,
      calculationId: payment.calculationId!,
      amount: payment.amount,
      paymentDate: payment.paymentDate.toISOString().split('T')[0],
      recipient,
      notes,
      receiptUrl,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.createdAt.toISOString() // Use createdAt as updatedAt
    };
  }

  /**
   * Updates a payment record
   * @param userId - User ID
   * @param id - Payment ID
   * @param data - Update data
   * @returns Updated payment record
   */
  async updatePayment(userId: string, id: string, data: UpdatePaymentDto): Promise<PaymentRecord> {
    // Check if payment exists and belongs to user
    const existingPayment = await prisma.zakatPayment.findFirst({
      where: { id, userId }
    });

    if (!existingPayment) {
      throw new Error('Payment not found');
    }

    // Validate amount if provided
    if (data.amount !== undefined && data.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    // Validate payment date if provided
    if (data.paymentDate) {
      const paymentDate = new Date(data.paymentDate);
      const now = new Date();
      if (paymentDate > now) {
        throw new Error('Payment date cannot be in the future');
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (data.amount !== undefined) {
      updateData.amount = data.amount;
    }

    if (data.paymentDate) {
      updateData.paymentDate = new Date(data.paymentDate);
    }

    // Encrypt sensitive data
    if (data.recipient !== undefined) {
      const verificationDetails = JSON.parse(existingPayment.verificationDetails || '{}');
      
      // Check if client is sending ZK1 format
      const isZK1 = EncryptionService.isZeroKnowledgeFormat(data.recipient);
      
      verificationDetails.recipient = data.recipient ? (
        isZK1
          ? data.recipient // Already encrypted by client
          : await EncryptionService.encrypt(data.recipient, ENCRYPTION_KEY)
      ) : null;
      
      verificationDetails.encryptionFormat = isZK1 ? 'ZK1' : 'SERVER_GCM';
      verificationDetails.originalRecipient = data.recipient;
      updateData.verificationDetails = JSON.stringify(verificationDetails);
    }

    if (data.notes !== undefined) {
      const isZK1 = EncryptionService.isZeroKnowledgeFormat(data.notes);
      updateData.notes = data.notes ? (
        isZK1
          ? data.notes // Already encrypted by client
          : await EncryptionService.encrypt(data.notes, ENCRYPTION_KEY)
      ) : null;
    }

    // Update payment
    const updatedPayment = await prisma.zakatPayment.update({
      where: { id },
      data: updateData
    });

    // Return formatted payment
    return await this.getPayment(userId, id) as PaymentRecord;
  }

  /**
   * Deletes a payment record (soft delete by marking as cancelled)
   * @param userId - User ID
   * @param id - Payment ID
   */
  async deletePayment(userId: string, id: string): Promise<void> {
    // Check if payment exists and belongs to user
    const payment = await prisma.zakatPayment.findFirst({
      where: { id, userId }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Soft delete by updating status
    await prisma.zakatPayment.update({
      where: { id },
      data: {
        status: 'cancelled',
        notes: payment.notes // Keep existing notes
      }
    });
  }

  /**
   * Generates Islamic year from Gregorian date
   * @param date - Gregorian date
   * @returns Islamic year as string
   */
  private getIslamicYear(date: Date): string {
    // Simple conversion - in production this would use a proper Hijri calendar library
    // For now, approximate by subtracting 622 years and adjusting for lunar calendar
    const gregorianYear = date.getFullYear();
    const islamicYear = gregorianYear - 622 + Math.floor((date.getMonth() + 1) / 12);
    return islamicYear.toString();
  }
}