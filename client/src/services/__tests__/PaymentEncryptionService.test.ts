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

import { PaymentEncryptionService } from '../PaymentEncryptionService';
import { cryptoService } from '../CryptoService';
import { PaymentRecord } from '@zakapp/shared/types/tracking';

// Mock crypto.subtle for testing
const mockCrypto = {
  subtle: {
    importKey: jest.fn(),
    deriveKey: jest.fn(),
    exportKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    digest: jest.fn()
  },
  getRandomValues: jest.fn((arr) => {
    // Fill with predictable test values
    for (let i = 0; i < arr.length; i++) {
      arr[i] = i % 256;
    }
    return arr;
  })
};

// Setup global crypto mock
(global as any).crypto = mockCrypto;

describe('PaymentEncryptionService', () => {
  beforeAll(async () => {
    // Mock the deriveKey and encrypt/decrypt methods
    mockCrypto.subtle.importKey.mockResolvedValue('mock-key-material' as any);
    mockCrypto.subtle.deriveKey.mockResolvedValue('mock-derived-key' as any);
    mockCrypto.subtle.exportKey.mockResolvedValue({ k: 'mock-jwk-key' } as any);

    // Mock encryption to return predictable output
    mockCrypto.subtle.encrypt.mockImplementation(async (algorithm, key, data) => {
      const encoder = new TextEncoder();
      const decoded = new TextDecoder().decode(data);
      // Return a buffer that includes the plaintext for testing
      return encoder.encode(`encrypted:${decoded}`).buffer;
    });

    // Mock decryption to reverse the encryption
    mockCrypto.subtle.decrypt.mockImplementation(async (algorithm, key, data) => {
      const decoder = new TextDecoder();
      const decrypted = decoder.decode(data);
      // Remove the "encrypted:" prefix
      const plaintext = decrypted.replace('encrypted:', '');
      return new TextEncoder().encode(plaintext).buffer;
    });

    // Initialize crypto service
    await cryptoService.deriveKey('test-password', 'test-salt');
  });

  describe('encryptPaymentData', () => {
    it('should encrypt recipientName with ZK1 format', async () => {
      const payment: Partial<PaymentRecord> = {
        recipientName: 'Masjid Al-Noor',
        amount: 500
      };

      const encrypted = await PaymentEncryptionService.encryptPaymentData(payment);

      expect(encrypted.recipientName).toBeDefined();
      expect(typeof encrypted.recipientName).toBe('string');
      expect(encrypted.recipientName).toMatch(/^ZK1:/);
      expect(encrypted.amount).toBe(500); // Amount should not be encrypted
    });

    it('should encrypt notes with ZK1 format', async () => {
      const payment: Partial<PaymentRecord> = {
        notes: 'Zakat payment for 2024',
        amount: 1000
      };

      const encrypted = await PaymentEncryptionService.encryptPaymentData(payment);

      expect(encrypted.notes).toBeDefined();
      expect(typeof encrypted.notes).toBe('string');
      expect(encrypted.notes).toMatch(/^ZK1:/);
    });

    it('should encrypt receiptReference with ZK1 format', async () => {
      const payment: Partial<PaymentRecord> = {
        receiptReference: 'RCPT-2024-001',
        amount: 250
      };

      const encrypted = await PaymentEncryptionService.encryptPaymentData(payment);

      expect(encrypted.receiptReference).toBeDefined();
      expect(typeof encrypted.receiptReference).toBe('string');
      expect(encrypted.receiptReference).toMatch(/^ZK1:/);
    });

    it('should encrypt all sensitive fields simultaneously', async () => {
      const payment: Partial<PaymentRecord> = {
        recipientName: 'Test Charity',
        notes: 'Test note',
        receiptReference: 'TEST-123',
        amount: 100
      };

      const encrypted = await PaymentEncryptionService.encryptPaymentData(payment);

      expect(encrypted.recipientName).toMatch(/^ZK1:/);
      expect(encrypted.notes).toMatch(/^ZK1:/);
      expect(encrypted.receiptReference).toMatch(/^ZK1:/);
      expect(encrypted.amount).toBe(100);
    });

    it('should handle undefined sensitive fields gracefully', async () => {
      const payment: Partial<PaymentRecord> = {
        amount: 500,
        recipientName: undefined,
        notes: undefined
      };

      const encrypted = await PaymentEncryptionService.encryptPaymentData(payment);

      expect(encrypted.recipientName).toBeUndefined();
      expect(encrypted.notes).toBeUndefined();
      expect(encrypted.amount).toBe(500);
    });

    it('should preserve non-sensitive fields', async () => {
      const payment: Partial<PaymentRecord> = {
        id: 'payment-123',
        userId: 'user-456',
        recipientName: 'Test',
        amount: 500,
        currency: 'USD',
        paymentDate: '2024-01-01',
        status: 'recorded'
      };

      const encrypted = await PaymentEncryptionService.encryptPaymentData(payment);

      expect(encrypted.id).toBe('payment-123');
      expect(encrypted.userId).toBe('user-456');
      expect(encrypted.amount).toBe(500);
      expect(encrypted.currency).toBe('USD');
      expect(encrypted.paymentDate).toBe('2024-01-01');
      expect(encrypted.status).toBe('recorded');
    });
  });

  describe('decryptPaymentData', () => {
    it('should decrypt ZK1 encrypted recipientName', async () => {
      const original: Partial<PaymentRecord> = {
        recipientName: 'Test Charity',
        amount: 500
      };

      const encrypted = await PaymentEncryptionService.encryptPaymentData(original);
      const decrypted = await PaymentEncryptionService.decryptPaymentData(encrypted);

      expect(decrypted.recipientName).toBe('Test Charity');
      expect(decrypted.amount).toBe(500);
    });

    it('should decrypt ZK1 encrypted notes', async () => {
      const original: Partial<PaymentRecord> = {
        notes: 'Private payment note',
        amount: 1000
      };

      const encrypted = await PaymentEncryptionService.encryptPaymentData(original);
      const decrypted = await PaymentEncryptionService.decryptPaymentData(encrypted);

      expect(decrypted.notes).toBe('Private payment note');
    });

    it('should decrypt all encrypted fields correctly', async () => {
      const original: Partial<PaymentRecord> = {
        recipientName: 'Masjid Central',
        notes: 'Ramadan Zakat',
        receiptReference: 'RCPT-2024-999',
        amount: 2500
      };

      const encrypted = await PaymentEncryptionService.encryptPaymentData(original);
      const decrypted = await PaymentEncryptionService.decryptPaymentData(encrypted);

      expect(decrypted.recipientName).toBe('Masjid Central');
      expect(decrypted.notes).toBe('Ramadan Zakat');
      expect(decrypted.receiptReference).toBe('RCPT-2024-999');
      expect(decrypted.amount).toBe(2500);
    });

    it('should handle legacy format (plaintext pass-through)', async () => {
      const legacyData: Partial<PaymentRecord> = {
        recipientName: 'Already Decrypted',
        notes: 'Plain text note',
        amount: 100
      };

      const decrypted = await PaymentEncryptionService.decryptPaymentData(legacyData);

      expect(decrypted.recipientName).toBe('Already Decrypted');
      expect(decrypted.notes).toBe('Plain text note');
      expect(decrypted.amount).toBe(100);
    });

    it('should handle undefined fields gracefully', async () => {
      const payment: Partial<PaymentRecord> = {
        amount: 500,
        recipientName: undefined
      };

      const decrypted = await PaymentEncryptionService.decryptPaymentData(payment);

      expect(decrypted.recipientName).toBeUndefined();
      expect(decrypted.amount).toBe(500);
    });
  });

  describe('round-trip encryption/decryption', () => {
    it('should maintain data integrity through encrypt/decrypt cycle', async () => {
      const original: Partial<PaymentRecord> = {
        id: 'test-payment-001',
        userId: 'user-123',
        recipientName: 'Islamic Relief',
        notes: 'Emergency fund donation',
        receiptReference: 'IR-2024-XYZ',
        amount: 5000,
        currency: 'USD',
        paymentDate: '2024-01-15',
        status: 'recorded'
      };

      const encrypted = await PaymentEncryptionService.encryptPaymentData(original);
      const decrypted = await PaymentEncryptionService.decryptPaymentData(encrypted);

      expect(decrypted.id).toBe(original.id);
      expect(decrypted.userId).toBe(original.userId);
      expect(decrypted.recipientName).toBe(original.recipientName);
      expect(decrypted.notes).toBe(original.notes);
      expect(decrypted.receiptReference).toBe(original.receiptReference);
      expect(decrypted.amount).toBe(original.amount);
      expect(decrypted.currency).toBe(original.currency);
      expect(decrypted.paymentDate).toBe(original.paymentDate);
      expect(decrypted.status).toBe(original.status);
    });
  });

  describe('API conversion helpers', () => {
    it('should convert from API format to PaymentRecord', () => {
      const apiData = {
        id: 'api-payment-1',
        userId: 'user-1',
        amount: 1000,
        paymentDate: '2024-01-01',
        recipient: 'ZK1:abc:def', // API uses "recipient"
        notes: 'ZK1:ghi:jkl',
        currency: 'USD',
        status: 'recorded',
        paymentMethod: 'bank_transfer'
      };

      const payment = PaymentEncryptionService.apiToPaymentRecord(apiData as any);

      expect(payment.recipientName).toBe('ZK1:abc:def'); // Maps to recipientName
      expect(payment.notes).toBe('ZK1:ghi:jkl');
      expect(payment.amount).toBe(1000);
    });

    it('should convert from PaymentRecord to API format', () => {
      const payment: Partial<PaymentRecord> = {
        id: 'payment-1',
        userId: 'user-1',
        recipientName: 'ZK1:abc:def', // PaymentRecord uses recipientName
        notes: 'ZK1:ghi:jkl',
        amount: 1000,
        currency: 'USD',
        paymentDate: '2024-01-01',
        status: 'recorded',
        paymentMethod: 'cash'
      };

      const apiData = PaymentEncryptionService.paymentRecordToApi(payment as any);

      expect(apiData.recipient).toBe('ZK1:abc:def'); // Maps to recipient
      expect(apiData.notes).toBe('ZK1:ghi:jkl');
      expect(apiData.amount).toBe(1000);
    });
  });
});
