import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PaymentService } from '../../../src/services/payment-service';
import { PaymentEncryption } from '../../../src/utils/encryption';

describe('PaymentService', () => {
  const mockEncryptionKey = 'test-encryption-key-32-characters-long-abcdef1234567890';

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = mockEncryptionKey;
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  describe('createPayment', () => {
    it('should create a new payment record with encrypted sensitive data', async () => {
      const paymentData = {
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        calculationId: 'calculation-123',
        amount: '1000.00',
       
        paymentDate: new Date('2024-01-15'),
        recipientName: 'John Doe',
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        notes: 'Zakat payment for Ramadan',
        receiptReference: 'RCP-2024-001',
        paymentMethod: 'bank_transfer' as const,
        currency: 'USD',
        exchangeRate: 1.0,
      };

      const result = await PaymentService.createPayment(paymentData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(paymentData.userId);
      expect(result.snapshotId).toBe(paymentData.snapshotId);
      expect(result.calculationId).toBe(paymentData.calculationId);
      expect(result.paymentDate).toEqual(paymentData.paymentDate);
      expect(result.recipientType).toBe(paymentData.recipientType);
      expect(result.recipientCategory).toBe(paymentData.recipientCategory);
      expect(result.paymentMethod).toBe(paymentData.paymentMethod);
      expect(result.currency).toBe(paymentData.currency);
      expect(result.exchangeRate).toBe(paymentData.exchangeRate);
      expect(result.status).toBe('recorded');

      // Verify sensitive data is encrypted
      expect(result.amount).not.toBe(paymentData.amount);
      expect(result.recipientName).not.toBe(paymentData.recipientName);
      expect(result.notes).not.toBe(paymentData.notes);
      expect(result.receiptReference).not.toBe(paymentData.receiptReference);

      // Verify we can decrypt the data
      const decryptedAmount = await PaymentEncryption.decryptAmount(result.amount, mockEncryptionKey);
      const decryptedRecipientName = await PaymentEncryption.decryptRecipientName(result.recipientName, mockEncryptionKey);
      const decryptedNotes = await PaymentEncryption.decryptNotes(result.notes!, mockEncryptionKey);
      const decryptedReceiptRef = await PaymentEncryption.decryptReceiptReference(result.receiptReference!, mockEncryptionKey);

      expect(decryptedAmount).toBe(paymentData.amount);
      expect(decryptedRecipientName).toBe(paymentData.recipientName);
      expect(decryptedNotes).toBe(paymentData.notes);
      expect(decryptedReceiptRef).toBe(paymentData.receiptReference);
    });

    it('should create payment without optional fields', async () => {
      const minimalPaymentData = {
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        amount: '500.00',
        paymentDate: new Date('2024-01-15'),
        recipientName: 'Jane Smith',
        recipientType: 'charity' as const,
        recipientCategory: 'education' as const,
        paymentMethod: 'cash' as const,
      };

      const result = await PaymentService.createPayment(minimalPaymentData);

      expect(result).toBeDefined();
      expect(result.calculationId).toBeUndefined();
      expect(result.notes).toBeUndefined();
      expect(result.receiptReference).toBeUndefined();
    });

    it('should throw error for invalid user ID', async () => {
      const invalidPaymentData = {
        userId: 'invalid-user',
        snapshotId: 'snapshot-123',
        amount: '100.00',
        paymentDate: new Date(),
        recipientName: 'Test Recipient',
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        paymentMethod: 'cash' as const,
      };

      await expect(PaymentService.createPayment(invalidPaymentData))
        .rejects.toThrow();
    });

    it('should throw error for invalid snapshot ID', async () => {
      const invalidPaymentData = {
        userId: 'user-123',
        snapshotId: 'invalid-snapshot',
        amount: '100.00',
        paymentDate: new Date(),
        recipientName: 'Test Recipient',
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        paymentMethod: 'cash' as const,
      };

      await expect(PaymentService.createPayment(invalidPaymentData))
        .rejects.toThrow();
    });

    it('should handle encryption failures gracefully', async () => {
      // Temporarily break encryption key
      delete process.env.ENCRYPTION_KEY;

      const paymentData = {
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        amount: '100.00',
        paymentDate: new Date(),
        recipientName: 'Test Recipient',
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        paymentMethod: 'cash' as const,
      };

      await expect(PaymentService.createPayment(paymentData))
        .rejects.toThrow('Encryption key is required');
    });
  });
});