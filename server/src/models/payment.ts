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


import { PaymentEncryption } from '../utils/encryption';
import { prisma } from '../config/database';
import { Logger } from '../utils/logger';

const logger = new Logger('PaymentModel');


export interface CreatePaymentData {
  userId: string;
  snapshotId: string;
  calculationId?: string;
  amount: string;
  paymentDate: Date;
  recipientName: string;
  recipientType: 'individual' | 'organization' | 'charity' | 'mosque' | 'family' | 'other';
  recipientCategory: 'poor' | 'orphans' | 'widows' | 'education' | 'healthcare' | 'infrastructure' | 'general';
  notes?: string;
  receiptReference?: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'crypto' | 'other';
  currency?: string;
  exchangeRate?: number;
}

export interface PaymentData {
  id: string;
  userId: string;
  snapshotId: string;
  calculationId?: string;
  amount: string; // Encrypted
  paymentDate: Date;
  recipientName: string; // Encrypted
  recipientType: string;
  recipientCategory: string;
  notes?: string; // Encrypted
  receiptReference?: string; // Encrypted
  paymentMethod: string;
  status: string;
  currency: string;
  exchangeRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DecryptedPaymentData extends Omit<PaymentData, 'amount' | 'recipientName' | 'notes' | 'receiptReference'> {
  decryptedAmount: string;
  decryptedRecipientName: string;
  decryptedNotes?: string;
  decryptedReceiptReference?: string;
}

export class Payment {
  /**
   * Creates a new payment record with encrypted sensitive data
   */
  static async create(data: CreatePaymentData): Promise<PaymentData> {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    // Encrypt sensitive data
    const encryptedAmount = await PaymentEncryption.encryptAmount(data.amount, encryptionKey);
    const encryptedRecipientName = await PaymentEncryption.encryptRecipientName(data.recipientName, encryptionKey);
    const encryptedNotes = data.notes ? await PaymentEncryption.encryptNotes(data.notes, encryptionKey) : undefined;
    const encryptedReceiptRef = data.receiptReference ? await PaymentEncryption.encryptReceiptReference(data.receiptReference, encryptionKey) : undefined;

    const paymentRecord = await prisma.paymentRecord.create({
      data: {
        userId: data.userId,
        snapshotId: data.snapshotId,
        calculationId: data.calculationId,
        amount: encryptedAmount,
        paymentDate: data.paymentDate,
        recipientName: encryptedRecipientName,
        recipientType: data.recipientType,
        recipientCategory: data.recipientCategory,
        notes: encryptedNotes,
        receiptReference: encryptedReceiptRef,
        paymentMethod: data.paymentMethod,
        currency: data.currency || 'USD',
        exchangeRate: data.exchangeRate || 1.0,
        status: 'recorded',
      },
    });

    return {
      id: paymentRecord.id,
      userId: paymentRecord.userId,
      snapshotId: paymentRecord.snapshotId,
      calculationId: paymentRecord.calculationId || undefined,
      amount: paymentRecord.amount,
      paymentDate: paymentRecord.paymentDate,
      recipientName: paymentRecord.recipientName,
      recipientType: paymentRecord.recipientType,
      recipientCategory: paymentRecord.recipientCategory,
      notes: paymentRecord.notes || undefined,
      receiptReference: paymentRecord.receiptReference || undefined,
      paymentMethod: paymentRecord.paymentMethod,
      status: paymentRecord.status,
      currency: paymentRecord.currency,
      exchangeRate: paymentRecord.exchangeRate,
      createdAt: paymentRecord.createdAt,
      updatedAt: paymentRecord.updatedAt,
    };
  }

  /**
   * Finds a payment by ID and decrypts sensitive data
   */
  static async findById(id: string): Promise<DecryptedPaymentData | null> {
    const paymentRecord = await prisma.paymentRecord.findUnique({
      where: { id },
    });

    if (!paymentRecord) {
      return null;
    }

    return this.decryptPaymentData(paymentRecord);
  }

  /**
   * Finds all payments for a user with decrypted data
   */
  static async findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
    orderBy?: 'paymentDate' | 'amount' | 'createdAt';
    orderDirection?: 'asc' | 'desc';
  }): Promise<DecryptedPaymentData[]> {
    const { limit = 50, offset = 0, orderBy = 'paymentDate', orderDirection = 'desc' } = options || {};

    const paymentRecords = await prisma.paymentRecord.findMany({
      where: { userId },
      orderBy: { [orderBy]: orderDirection },
      take: limit,
      skip: offset,
    });

    return Promise.all(paymentRecords.map(record => this.decryptPaymentData(record)));
  }

  /**
   * Updates a payment record
   */
  static async update(id: string, data: Partial<CreatePaymentData>): Promise<DecryptedPaymentData | null> {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    // Encrypt sensitive data if provided
    const updateData: any = {};
    if (data.amount) {
      updateData.amount = await PaymentEncryption.encryptAmount(data.amount, encryptionKey);
    }
    if (data.recipientName) {
      updateData.recipientName = await PaymentEncryption.encryptRecipientName(data.recipientName, encryptionKey);
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes ? await PaymentEncryption.encryptNotes(data.notes, encryptionKey) : null;
    }
    if (data.receiptReference !== undefined) {
      updateData.receiptReference = data.receiptReference ? await PaymentEncryption.encryptReceiptReference(data.receiptReference, encryptionKey) : null;
    }

    // Add non-sensitive fields
    if (data.snapshotId) updateData.snapshotId = data.snapshotId;
    if (data.calculationId !== undefined) updateData.calculationId = data.calculationId;
    if (data.paymentDate) updateData.paymentDate = data.paymentDate;
    if (data.recipientType) updateData.recipientType = data.recipientType;
    if (data.recipientCategory) updateData.recipientCategory = data.recipientCategory;
    if (data.paymentMethod) updateData.paymentMethod = data.paymentMethod;
    if (data.currency) updateData.currency = data.currency;
    if (data.exchangeRate) updateData.exchangeRate = data.exchangeRate;

    const paymentRecord = await prisma.paymentRecord.update({
      where: { id },
      data: updateData,
    });

    return this.decryptPaymentData(paymentRecord);
  }

  /**
   * Deletes a payment record
   */
  static async delete(id: string): Promise<boolean> {
    try {
      await prisma.paymentRecord.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Decrypts sensitive data in a payment record
   */
  private static async decryptPaymentData(paymentRecord: any): Promise<DecryptedPaymentData> {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    // Attempt to decrypt sensitive fields. If decryption fails for any field,
    // return the raw encrypted value in a companion property and continue —
    // do NOT throw here so listing endpoints remain resilient.
    let decryptedAmount: string | undefined;
    let decryptedRecipientName: string | undefined;
    let decryptedNotes: string | undefined;
    let decryptedReceiptRef: string | undefined;

    try {
      decryptedAmount = await PaymentEncryption.decryptAmount(paymentRecord.amount, encryptionKey);
    } catch (err) {
      logger.error(`Failed to decrypt amount for payment ${paymentRecord.id}: ${err instanceof Error ? err.message : String(err)}`);
      // leave decryptedAmount undefined so callers can fallback to raw field
    }


    try {
      decryptedRecipientName = await PaymentEncryption.decryptRecipientName(paymentRecord.recipientName, encryptionKey);
    } catch (err) {
      logger.error(`Failed to decrypt recipientName for payment ${paymentRecord.id}: ${err instanceof Error ? err.message : String(err)}`);
    }


    if (paymentRecord.notes) {
      try {
        decryptedNotes = await PaymentEncryption.decryptNotes(paymentRecord.notes, encryptionKey);
      } catch (err) {
        logger.error(`Failed to decrypt notes for payment ${paymentRecord.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }


    if (paymentRecord.receiptReference) {
      try {
        decryptedReceiptRef = await PaymentEncryption.decryptReceiptReference(paymentRecord.receiptReference, encryptionKey);
      } catch (err) {
        logger.error(`Failed to decrypt receiptReference for payment ${paymentRecord.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }


    return {
      id: paymentRecord.id,
      userId: paymentRecord.userId,
      snapshotId: paymentRecord.snapshotId,
      calculationId: paymentRecord.calculationId || undefined,
      paymentDate: paymentRecord.paymentDate,
      recipientType: paymentRecord.recipientType,
      recipientCategory: paymentRecord.recipientCategory,
      paymentMethod: paymentRecord.paymentMethod,
      status: paymentRecord.status,
      currency: paymentRecord.currency,
      exchangeRate: paymentRecord.exchangeRate,
      createdAt: paymentRecord.createdAt,
      updatedAt: paymentRecord.updatedAt,
      decryptedAmount,
      decryptedRecipientName,
      decryptedNotes,
      decryptedReceiptReference: decryptedReceiptRef,
    };
  }
}