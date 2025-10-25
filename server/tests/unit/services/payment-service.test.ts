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

    it('should handle very large payment amounts', async () => {
      const largeAmountData = {
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        amount: '999999999.99',
        paymentDate: new Date('2024-01-15'),
        recipientName: 'Large Charity Organization',
        recipientType: 'charity' as const,
        recipientCategory: 'education' as const,
        paymentMethod: 'bank_transfer' as const,
        currency: 'USD',
        exchangeRate: 1.0,
      };

      const result = await PaymentService.createPayment(largeAmountData);
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();

      // Verify decryption works for large amounts
      const decryptedAmount = await PaymentEncryption.decryptAmount(result.amount, mockEncryptionKey);
      expect(decryptedAmount).toBe(largeAmountData.amount);
    });

    it('should handle very small payment amounts', async () => {
      const smallAmountData = {
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        amount: '0.01',
        paymentDate: new Date('2024-01-15'),
        recipientName: 'Small Contribution',
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        paymentMethod: 'cash' as const,
        currency: 'USD',
        exchangeRate: 1.0,
      };

      const result = await PaymentService.createPayment(smallAmountData);
      expect(result).toBeDefined();

      const decryptedAmount = await PaymentEncryption.decryptAmount(result.amount, mockEncryptionKey);
      expect(decryptedAmount).toBe(smallAmountData.amount);
    });

    it('should handle special characters in recipient names', async () => {
      const specialCharData = {
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        amount: '100.00',
        paymentDate: new Date('2024-01-15'),
        recipientName: 'Dr. María José González-Smith أحمد محمد',
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        paymentMethod: 'cash' as const,
        currency: 'USD',
        exchangeRate: 1.0,
      };

      const result = await PaymentService.createPayment(specialCharData);
      expect(result).toBeDefined();

      const decryptedName = await PaymentEncryption.decryptRecipientName(result.recipientName, mockEncryptionKey);
      expect(decryptedName).toBe(specialCharData.recipientName);
    });

    it('should handle future payment dates', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1); // 1 year in future

      const futurePaymentData = {
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        amount: '500.00',
        paymentDate: futureDate,
        recipientName: 'Future Recipient',
        recipientType: 'charity' as const,
        recipientCategory: 'education' as const,
        paymentMethod: 'bank_transfer' as const,
        currency: 'USD',
        exchangeRate: 1.0,
      };

      const result = await PaymentService.createPayment(futurePaymentData);
      expect(result).toBeDefined();
      expect(result.paymentDate).toEqual(futureDate);
    });

    it('should handle very old payment dates', async () => {
      const oldDate = new Date('1900-01-01');

      const oldPaymentData = {
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        amount: '100.00',
        paymentDate: oldDate,
        recipientName: 'Historical Recipient',
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        paymentMethod: 'cash' as const,
        currency: 'USD',
        exchangeRate: 1.0,
      };

      const result = await PaymentService.createPayment(oldPaymentData);
      expect(result).toBeDefined();
      expect(result.paymentDate).toEqual(oldDate);
    });

    it('should handle maximum length strings in notes and receipt reference', async () => {
      const longNotes = 'A'.repeat(1000); // Very long notes
      const longReceiptRef = 'RCP-' + '0'.repeat(100); // Long receipt reference

      const longStringData = {
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        amount: '100.00',
        paymentDate: new Date('2024-01-15'),
        recipientName: 'Test Recipient',
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        paymentMethod: 'cash' as const,
        notes: longNotes,
        receiptReference: longReceiptRef,
        currency: 'USD',
        exchangeRate: 1.0,
      };

      const result = await PaymentService.createPayment(longStringData);
      expect(result).toBeDefined();

      const decryptedNotes = await PaymentEncryption.decryptNotes(result.notes!, mockEncryptionKey);
      const decryptedReceiptRef = await PaymentEncryption.decryptReceiptReference(result.receiptReference!, mockEncryptionKey);

      expect(decryptedNotes).toBe(longNotes);
      expect(decryptedReceiptRef).toBe(longReceiptRef);
    });

    it('should handle empty strings in optional fields', async () => {
      const emptyStringData = {
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        amount: '100.00',
        paymentDate: new Date('2024-01-15'),
        recipientName: 'Test Recipient',
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        paymentMethod: 'cash' as const,
        notes: '',
        receiptReference: '',
        currency: 'USD',
        exchangeRate: 1.0,
      };

      const result = await PaymentService.createPayment(emptyStringData);
      expect(result).toBeDefined();

      const decryptedNotes = await PaymentEncryption.decryptNotes(result.notes!, mockEncryptionKey);
      const decryptedReceiptRef = await PaymentEncryption.decryptReceiptReference(result.receiptReference!, mockEncryptionKey);

      expect(decryptedNotes).toBe('');
      expect(decryptedReceiptRef).toBe('');
    });

    it('should handle various currency codes and exchange rates', async () => {
      const currencyTestData = {
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        amount: '100.00',
        paymentDate: new Date('2024-01-15'),
        recipientName: 'Currency Test',
        recipientType: 'charity' as const,
        recipientCategory: 'education' as const,
        paymentMethod: 'bank_transfer' as const,
        currency: 'EUR',
        exchangeRate: 0.85,
      };

      const result = await PaymentService.createPayment(currencyTestData);
      expect(result).toBeDefined();
      expect(result.currency).toBe('EUR');
      expect(result.exchangeRate).toBe(0.85);
    });
  });
});