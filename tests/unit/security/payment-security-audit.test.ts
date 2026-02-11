import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PaymentService } from '@/services/payment-service';
import { PaymentEncryption } from '@/utils/encryption';

describe('Payment Data Security Audit', () => {
  const mockEncryptionKey = 'test-encryption-key-32-characters-long-abcdef1234567890';

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = mockEncryptionKey;
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  describe('Encryption Security', () => {
    it('should properly encrypt sensitive payment data', async () => {
      const sensitiveData = {
        amount: '1234.56',
        recipientName: 'John Sensitive Doe',
        notes: 'Confidential payment for sensitive matter',
        receiptReference: 'RCP-2024-SECRET-001',
      };

      const result = await PaymentService.createPayment({
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        ...sensitiveData,
        paymentDate: new Date(),
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        paymentMethod: 'bank_transfer' as const,
        currency: 'USD',
        exchangeRate: 1.0,
      });

      // Verify all sensitive data is encrypted
      expect(result.amount).not.toBe(sensitiveData.amount);
      expect(result.recipientName).not.toBe(sensitiveData.recipientName);
      expect(result.notes).not.toBe(sensitiveData.notes);
      expect(result.receiptReference).not.toBe(sensitiveData.receiptReference);

      // Verify encryption is deterministic (same input = same output for same key)
      const result2 = await PaymentService.createPayment({
        userId: 'user-456',
        snapshotId: 'snapshot-456',
        ...sensitiveData,
        paymentDate: new Date(),
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        paymentMethod: 'bank_transfer' as const,
        currency: 'USD',
        exchangeRate: 1.0,
      });

      expect(result.amount).toBe(result2.amount); // Same encryption for same data
      expect(result.recipientName).toBe(result2.recipientName);
    });

    it('should use different encryption for different data', async () => {
      const payment1 = await PaymentService.createPayment({
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        amount: '100.00',
        paymentDate: new Date(),
        recipientName: 'Alice',
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        paymentMethod: 'cash' as const,
      });

      const payment2 = await PaymentService.createPayment({
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        amount: '200.00', // Different amount
        paymentDate: new Date(),
        recipientName: 'Bob', // Different name
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        paymentMethod: 'cash' as const,
      });

      // Different data should produce different encrypted outputs
      expect(payment1.amount).not.toBe(payment2.amount);
      expect(payment1.recipientName).not.toBe(payment2.recipientName);
    });

    it('should handle encryption key rotation securely', async () => {
      const originalKey = mockEncryptionKey;
      const newKey = 'new-encryption-key-32-characters-long-xyz123456789';

      // Create payment with original key
      const payment = await PaymentService.createPayment({
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        amount: '500.00',
        paymentDate: new Date(),
        recipientName: 'Key Rotation Test',
        recipientType: 'charity' as const,
        recipientCategory: 'education' as const,
        paymentMethod: 'bank_transfer' as const,
      });

      // Verify we can decrypt with original key
      const decryptedAmount = await PaymentEncryption.decryptAmount(payment.amount, originalKey);
      expect(decryptedAmount).toBe('500.00');

      // Simulate key rotation - should not be able to decrypt with wrong key
      await expect(PaymentEncryption.decryptAmount(payment.amount, newKey))
        .rejects.toThrow();

      // Should be able to decrypt with correct key
      const stillDecrypted = await PaymentEncryption.decryptAmount(payment.amount, originalKey);
      expect(stillDecrypted).toBe('500.00');
    });

    it('should prevent encryption key leakage in memory', async () => {
      // Test that encryption key is not stored in a way that could be leaked
      process.env.ENCRYPTION_KEY = mockEncryptionKey;

      // Perform encryption operation
      const encrypted = await PaymentEncryption.encryptAmount('100.00', mockEncryptionKey);

      // Key should not be stored in the result
      expect(encrypted).not.toContain(mockEncryptionKey);

      // Key should not be accessible from the encrypted data
      expect(encrypted.length).toBeGreaterThan(10); // Should be encrypted, not plaintext
    });
  });

  describe('Data Validation Security', () => {
    it('should prevent SQL injection through payment data', async () => {
      const maliciousData = {
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        amount: "100.00'; DROP TABLE payments; --",
        paymentDate: new Date(),
        recipientName: "Malicious'; DELETE FROM users WHERE '1'='1",
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        paymentMethod: 'cash' as const,
        notes: "'; EXEC xp_cmdshell('net user') --",
      };

      const result = await PaymentService.createPayment(maliciousData);

      // Data should be stored safely (encrypted), not executed as SQL
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();

      // Verify the malicious data is stored as-is, not executed
      const decryptedName = await PaymentEncryption.decryptRecipientName(result.recipientName, mockEncryptionKey);
      expect(decryptedName).toBe(maliciousData.recipientName);
    });

    it('should prevent XSS through payment data', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      ];

      for (const payload of xssPayloads) {
        const payment = await PaymentService.createPayment({
          userId: 'user-123',
          snapshotId: 'snapshot-123',
          amount: '100.00',
          paymentDate: new Date(),
          recipientName: payload,
          recipientType: 'individual' as const,
          recipientCategory: 'poor' as const,
          paymentMethod: 'cash' as const,
        });

        // Data should be stored encrypted, preventing direct XSS
        expect(payment.recipientName).not.toBe(payload);

        // Verify we can safely decrypt it
        const decrypted = await PaymentEncryption.decryptRecipientName(payment.recipientName, mockEncryptionKey);
        expect(decrypted).toBe(payload);
      }
    });

    it('should validate payment amounts securely', async () => {
      const invalidAmounts = [
        '-100.00', // Negative
        '0', // Zero
        '999999999999.99', // Too large
        '1e10', // Scientific notation
        'NaN', // Not a number
        'Infinity', // Infinity
        '', // Empty
        'abc', // Non-numeric
      ];

      for (const invalidAmount of invalidAmounts) {
        await expect(PaymentService.createPayment({
          userId: 'user-123',
          snapshotId: 'snapshot-123',
          amount: invalidAmount,
          paymentDate: new Date(),
          recipientName: 'Test',
          recipientType: 'individual' as const,
          recipientCategory: 'poor' as const,
          paymentMethod: 'cash' as const,
        })).rejects.toThrow();
      }
    });

    it('should prevent buffer overflow attacks', async () => {
      const largeString = 'A'.repeat(10000); // 10KB string

      const payment = await PaymentService.createPayment({
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        amount: '100.00',
        paymentDate: new Date(),
        recipientName: largeString,
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        paymentMethod: 'cash' as const,
        notes: largeString,
      });

      // Should handle large strings without crashing
      expect(payment).toBeDefined();

      // Should be able to decrypt large strings
      const decryptedName = await PaymentEncryption.decryptRecipientName(payment.recipientName, mockEncryptionKey);
      expect(decryptedName).toBe(largeString);
    });
  });

  describe('Access Control Security', () => {
    it('should enforce user data isolation', async () => {
      // Create payments for different users
      const payment1 = await PaymentService.createPayment({
        userId: 'user-1',
        snapshotId: 'snapshot-1',
        amount: '100.00',
        paymentDate: new Date(),
        recipientName: 'User 1 Payment',
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        paymentMethod: 'cash' as const,
      });

      const payment2 = await PaymentService.createPayment({
        userId: 'user-2',
        snapshotId: 'snapshot-2',
        amount: '200.00',
        paymentDate: new Date(),
        recipientName: 'User 2 Payment',
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        paymentMethod: 'cash' as const,
      });

      // Payments should be properly isolated
      expect(payment1.userId).toBe('user-1');
      expect(payment2.userId).toBe('user-2');
      expect(payment1.id).not.toBe(payment2.id);
    });

    it('should prevent unauthorized access to encrypted data', async () => {
      const payment = await PaymentService.createPayment({
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        amount: '1000.00',
        paymentDate: new Date(),
        recipientName: 'Secret Payment',
        recipientType: 'charity' as const,
        recipientCategory: 'education' as const,
        paymentMethod: 'bank_transfer' as const,
      });

      // Without the correct key, decryption should fail
      const wrongKey = 'wrong-encryption-key-32-characters-long-wrong123456';

      await expect(PaymentEncryption.decryptAmount(payment.amount, wrongKey))
        .rejects.toThrow();

      await expect(PaymentEncryption.decryptRecipientName(payment.recipientName, wrongKey))
        .rejects.toThrow();
    });

    it('should handle encryption key absence securely', async () => {
      delete process.env.ENCRYPTION_KEY;

      await expect(PaymentService.createPayment({
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        amount: '100.00',
        paymentDate: new Date(),
        recipientName: 'Test',
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        paymentMethod: 'cash' as const,
      })).rejects.toThrow('Encryption key is required');
    });
  });

  describe('Data Integrity Security', () => {
    it('should maintain data integrity through encryption/decryption cycle', async () => {
      const testData = {
        amount: '123.45',
        recipientName: 'José María González',
        notes: 'Payment with special characters: àáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ',
        receiptReference: 'RCP-2024-Ñ-001',
      };

      const payment = await PaymentService.createPayment({
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        ...testData,
        paymentDate: new Date(),
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        paymentMethod: 'bank_transfer' as const,
        currency: 'EUR',
        exchangeRate: 0.85,
      });

      // Verify round-trip encryption/decryption preserves data
      const decryptedAmount = await PaymentEncryption.decryptAmount(payment.amount, mockEncryptionKey);
      const decryptedName = await PaymentEncryption.decryptRecipientName(payment.recipientName, mockEncryptionKey);
      const decryptedNotes = await PaymentEncryption.decryptNotes(payment.notes!, mockEncryptionKey);
      const decryptedReceipt = await PaymentEncryption.decryptReceiptReference(payment.receiptReference!, mockEncryptionKey);

      expect(decryptedAmount).toBe(testData.amount);
      expect(decryptedName).toBe(testData.recipientName);
      expect(decryptedNotes).toBe(testData.notes);
      expect(decryptedReceipt).toBe(testData.receiptReference);
    });

    it('should prevent data tampering detection', async () => {
      const payment = await PaymentService.createPayment({
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        amount: '500.00',
        paymentDate: new Date(),
        recipientName: 'Integrity Test',
        recipientType: 'charity' as const,
        recipientCategory: 'education' as const,
        paymentMethod: 'bank_transfer' as const,
      });

      // Simulate tampering with encrypted data
      const tamperedAmount = payment.amount.slice(0, -1) + 'X'; // Change last character

      // Should fail to decrypt tampered data
      await expect(PaymentEncryption.decryptAmount(tamperedAmount, mockEncryptionKey))
        .rejects.toThrow();
    });

    it('should handle concurrent payment creation securely', async () => {
      const paymentPromises = Array(5).fill(null).map((_, index) =>
        PaymentService.createPayment({
          userId: `user-${index}`,
          snapshotId: `snapshot-${index}`,
          amount: `${100 + index}.00`,
          paymentDate: new Date(),
          recipientName: `Concurrent User ${index}`,
          recipientType: 'individual' as const,
          recipientCategory: 'poor' as const,
          paymentMethod: 'cash' as const,
        })
      );

      const payments = await Promise.all(paymentPromises);

      // All payments should be created successfully
      expect(payments).toHaveLength(5);
      payments.forEach((payment: any, index: number) => {
        expect(payment).toBeDefined();
        expect(payment.userId).toBe(`user-${index}`);
      });

      // All payments should have unique IDs
      const ids = payments.map((p: any) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});