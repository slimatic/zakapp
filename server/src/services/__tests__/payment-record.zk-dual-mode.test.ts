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

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PaymentRecordService } from '../payment-record.service';
import { EncryptionService } from '../EncryptionService';
import { prisma } from '../../utils/prisma';

// Mock Prisma
vi.mock('../../utils/prisma', () => ({
  prisma: {
    zakatCalculation: { findFirst: vi.fn() },
    zakatPayment: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('PaymentRecordService - ZK1 Dual-Mode Encryption', () => {
  let service: PaymentRecordService;
  const mockUserId = 'test-user-123';
  const mockCalculationId = 'calc-123';
  // Use the same encryption key as setupEnv.ts
  const ENCRYPTION_KEY = 'test-encryption-key-32-chars-!!!';

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = ENCRYPTION_KEY;
    service = new PaymentRecordService();
    vi.clearAllMocks();
  });

  describe('createPayment - ZK1 Format Detection', () => {
    it('should store ZK1 data without re-encrypting', async () => {
      // Mock calculation lookup
      (prisma.zakatCalculation.findFirst as any).mockResolvedValue({
        id: mockCalculationId,
        userId: mockUserId,
      });

      // Mock payment creation
      const mockPayment = {
        id: 'payment-123',
        userId: mockUserId,
        calculationId: mockCalculationId,
        amount: 500,
        paymentDate: new Date('2024-01-01'),
        currency: 'USD',
        recipients: JSON.stringify([]),
        paymentMethod: 'other',
        islamicYear: '1402',
        notes: 'ZK1:notesiv123:notescipher456',
        status: 'completed',
        verificationDetails: JSON.stringify({
          recipient: 'ZK1:testiv123:testcipher456',
          encryptionFormat: 'ZK1',
          encryptedAt: expect.any(String),
        }),
        createdAt: new Date(),
      };
      (prisma.zakatPayment.create as any).mockResolvedValue(mockPayment);

      // Create payment with ZK1 format
      const result = await service.createPayment(mockUserId, {
        calculationId: mockCalculationId,
        recipient: 'ZK1:testiv123:testcipher456',
        notes: 'ZK1:notesiv123:notescipher456',
        amount: 500,
        paymentDate: '2024-01-01',
      });

      // Verify Prisma was called with ZK1 data unchanged
      const createCall = (prisma.zakatPayment.create as any).mock.calls[0][0];
      const verificationDetails = JSON.parse(createCall.data.verificationDetails);
      
      expect(verificationDetails.recipient).toBe('ZK1:testiv123:testcipher456');
      expect(verificationDetails.encryptionFormat).toBe('ZK1');
      expect(createCall.data.notes).toBe('ZK1:notesiv123:notescipher456');
      
      // Result should return ZK1 data as-is
      expect(result.recipient).toBe('ZK1:testiv123:testcipher456');
      expect(result.notes).toBe('ZK1:notesiv123:notescipher456');
    });

    it('should handle legacy format with server encryption', async () => {
      // Mock calculation lookup
      (prisma.zakatCalculation.findFirst as any).mockResolvedValue({
        id: mockCalculationId,
        userId: mockUserId,
      });

      // Spy on EncryptionService.encrypt
      const encryptSpy = vi.spyOn(EncryptionService, 'encrypt');
      encryptSpy.mockImplementation((plaintext: string, key: string) => 
        Promise.resolve(`encrypted:${plaintext}`)
      );

      // Mock payment creation
      (prisma.zakatPayment.create as any).mockResolvedValue({
        id: 'payment-123',
        userId: mockUserId,
        calculationId: mockCalculationId,
        amount: 200,
        paymentDate: new Date('2024-01-01'),
        currency: 'USD',
        recipients: JSON.stringify([]),
        paymentMethod: 'other',
        islamicYear: '1402',
        notes: 'encrypted:Legacy notes',
        status: 'completed',
        verificationDetails: JSON.stringify({
          recipient: 'encrypted:Old Masjid',
          encryptionFormat: 'SERVER_GCM',
          encryptedAt: expect.any(String),
        }),
        createdAt: new Date(),
      });

      // Create payment with plaintext (simulating old client)
      await service.createPayment(mockUserId, {
        calculationId: mockCalculationId,
        recipient: 'Old Masjid',
        notes: 'Legacy notes',
        amount: 200,
        paymentDate: '2024-01-01',
      });

      // Verify server encrypted the plaintext
      expect(encryptSpy).toHaveBeenCalledWith('Old Masjid', ENCRYPTION_KEY);
      expect(encryptSpy).toHaveBeenCalledWith('Legacy notes', ENCRYPTION_KEY);

      // Verify format stored correctly
      const createCall = (prisma.zakatPayment.create as any).mock.calls[0][0];
      const verificationDetails = JSON.parse(createCall.data.verificationDetails);
      expect(verificationDetails.encryptionFormat).toBe('SERVER_GCM');

      encryptSpy.mockRestore();
    });

    it('should handle null/undefined recipient and notes', async () => {
      (prisma.zakatCalculation.findFirst as any).mockResolvedValue({
        id: mockCalculationId,
        userId: mockUserId,
      });

      (prisma.zakatPayment.create as any).mockResolvedValue({
        id: 'payment-123',
        userId: mockUserId,
        calculationId: mockCalculationId,
        amount: 100,
        paymentDate: new Date('2024-01-01'),
        currency: 'USD',
        recipients: JSON.stringify([]),
        paymentMethod: 'other',
        islamicYear: '1402',
        notes: null,
        status: 'completed',
        verificationDetails: JSON.stringify({
          recipient: null,
          encryptionFormat: 'SERVER_GCM',
          encryptedAt: expect.any(String),
        }),
        createdAt: new Date(),
      });

      const result = await service.createPayment(mockUserId, {
        calculationId: mockCalculationId,
        amount: 100,
        paymentDate: '2024-01-01',
      });

      expect(result.recipient).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });
  });

  describe('getPayments - ZK1 Decryption Handling', () => {
    it('should return ZK1 data as-is without decrypting', async () => {
      const mockPayments = [
        {
          id: 'payment-1',
          userId: mockUserId,
          calculationId: mockCalculationId,
          amount: 500,
          paymentDate: new Date('2024-01-01'),
          currency: 'USD',
          recipients: JSON.stringify([]),
          paymentMethod: 'other',
          islamicYear: '1402',
          notes: 'ZK1:notesiv123:notescipher456',
          status: 'completed',
          verificationDetails: JSON.stringify({
            recipient: 'ZK1:testiv123:testcipher456',
            encryptionFormat: 'ZK1',
          }),
          createdAt: new Date(),
        },
      ];

      (prisma.zakatPayment.findMany as any).mockResolvedValue(mockPayments);

      const result = await service.getPayments(mockUserId);

      // ZK1 data should be returned unchanged (client will decrypt)
      expect(result[0].recipient).toBe('ZK1:testiv123:testcipher456');
      expect(result[0].notes).toBe('ZK1:notesiv123:notescipher456');
    });

    it('should decrypt legacy format with server decryption', async () => {
      // Spy on EncryptionService.decrypt
      const decryptSpy = vi.spyOn(EncryptionService, 'decrypt');
      decryptSpy.mockImplementation((ciphertext: string, key: string) =>
        Promise.resolve(ciphertext.replace('encrypted:', ''))
      );

      const mockPayments = [
        {
          id: 'payment-2',
          userId: mockUserId,
          calculationId: mockCalculationId,
          amount: 200,
          paymentDate: new Date('2024-01-01'),
          currency: 'USD',
          recipients: JSON.stringify([]),
          paymentMethod: 'other',
          islamicYear: '1402',
          notes: 'encrypted:Legacy Notes',
          status: 'completed',
          verificationDetails: JSON.stringify({
            recipient: 'encrypted:Old Masjid',
            encryptionFormat: 'SERVER_GCM',
          }),
          createdAt: new Date(),
        },
      ];

      (prisma.zakatPayment.findMany as any).mockResolvedValue(mockPayments);

      const result = await service.getPayments(mockUserId);

      // Server should decrypt legacy data
      expect(decryptSpy).toHaveBeenCalledWith('encrypted:Old Masjid', ENCRYPTION_KEY);
      expect(decryptSpy).toHaveBeenCalledWith('encrypted:Legacy Notes', ENCRYPTION_KEY);
      expect(result[0].recipient).toBe('Old Masjid');
      expect(result[0].notes).toBe('Legacy Notes');

      decryptSpy.mockRestore();
    });

    it('should handle mixed ZK1 and legacy payments', async () => {
      const decryptSpy = vi.spyOn(EncryptionService, 'decrypt');
      decryptSpy.mockImplementation((ciphertext: string, key: string) =>
        Promise.resolve(ciphertext.replace('encrypted:', ''))
      );

      const mockPayments = [
        {
          id: 'payment-zk1',
          userId: mockUserId,
          calculationId: mockCalculationId,
          amount: 500,
          paymentDate: new Date('2024-01-15'),
          currency: 'USD',
          recipients: JSON.stringify([]),
          paymentMethod: 'other',
          islamicYear: '1402',
          notes: 'ZK1:zknotesiv:zknotescipher',
          status: 'completed',
          verificationDetails: JSON.stringify({
            recipient: 'ZK1:zkrecipiv:zkrecipcipher',
            encryptionFormat: 'ZK1',
          }),
          createdAt: new Date('2024-01-15'),
        },
        {
          id: 'payment-legacy',
          userId: mockUserId,
          calculationId: mockCalculationId,
          amount: 300,
          paymentDate: new Date('2024-01-10'),
          currency: 'USD',
          recipients: JSON.stringify([]),
          paymentMethod: 'other',
          islamicYear: '1402',
          notes: 'encrypted:Old notes',
          status: 'completed',
          verificationDetails: JSON.stringify({
            recipient: 'encrypted:Old Recipient',
            encryptionFormat: 'SERVER_GCM',
          }),
          createdAt: new Date('2024-01-10'),
        },
      ];

      (prisma.zakatPayment.findMany as any).mockResolvedValue(mockPayments);

      const result = await service.getPayments(mockUserId);

      // ZK1 payment should be returned as-is
      expect(result[0].recipient).toBe('ZK1:zkrecipiv:zkrecipcipher');
      expect(result[0].notes).toBe('ZK1:zknotesiv:zknotescipher');

      // Legacy payment should be decrypted
      expect(result[1].recipient).toBe('Old Recipient');
      expect(result[1].notes).toBe('Old notes');

      // Decrypt should only be called for legacy payments
      expect(decryptSpy).toHaveBeenCalledWith('encrypted:Old Recipient', ENCRYPTION_KEY);
      expect(decryptSpy).toHaveBeenCalledWith('encrypted:Old notes', ENCRYPTION_KEY);
      expect(decryptSpy).not.toHaveBeenCalledWith(expect.stringContaining('ZK1:'), expect.any(String));

      decryptSpy.mockRestore();
    });
  });

  describe('getPayment - Single Payment Retrieval', () => {
    it('should return ZK1 payment without decrypting', async () => {
      (prisma.zakatPayment.findFirst as any).mockResolvedValue({
        id: 'payment-zk1',
        userId: mockUserId,
        calculationId: mockCalculationId,
        amount: 500,
        paymentDate: new Date('2024-01-01'),
        currency: 'USD',
        recipients: JSON.stringify([]),
        paymentMethod: 'other',
        islamicYear: '1402',
        notes: 'ZK1:notesiv:notescipher',
        status: 'completed',
        verificationDetails: JSON.stringify({
          recipient: 'ZK1:recipiv:recipcipher',
          encryptionFormat: 'ZK1',
        }),
        createdAt: new Date(),
      });

      const result = await service.getPayment(mockUserId, 'payment-zk1');

      expect(result).not.toBeNull();
      expect(result!.recipient).toBe('ZK1:recipiv:recipcipher');
      expect(result!.notes).toBe('ZK1:notesiv:notescipher');
    });

    it('should decrypt legacy payment', async () => {
      const decryptSpy = vi.spyOn(EncryptionService, 'decrypt');
      decryptSpy.mockImplementation((ciphertext: string, key: string) =>
        Promise.resolve(ciphertext.replace('encrypted:', ''))
      );

      (prisma.zakatPayment.findFirst as any).mockResolvedValue({
        id: 'payment-legacy',
        userId: mockUserId,
        calculationId: mockCalculationId,
        amount: 200,
        paymentDate: new Date('2024-01-01'),
        currency: 'USD',
        recipients: JSON.stringify([]),
        paymentMethod: 'other',
        islamicYear: '1402',
        notes: 'encrypted:Old notes',
        status: 'completed',
        verificationDetails: JSON.stringify({
          recipient: 'encrypted:Old Recipient',
          encryptionFormat: 'SERVER_GCM',
        }),
        createdAt: new Date(),
      });

      const result = await service.getPayment(mockUserId, 'payment-legacy');

      expect(result).not.toBeNull();
      expect(result!.recipient).toBe('Old Recipient');
      expect(result!.notes).toBe('Old notes');

      decryptSpy.mockRestore();
    });
  });

  describe('updatePayment - ZK1 Support', () => {
    it('should accept ZK1 format when updating recipient', async () => {
      (prisma.zakatPayment.findFirst as any).mockResolvedValue({
        id: 'payment-123',
        userId: mockUserId,
        calculationId: mockCalculationId,
        amount: 500,
        paymentDate: new Date('2024-01-01'),
        currency: 'USD',
        recipients: JSON.stringify([]),
        paymentMethod: 'other',
        islamicYear: '1402',
        notes: null,
        status: 'completed',
        verificationDetails: JSON.stringify({}),
        createdAt: new Date(),
      });

      (prisma.zakatPayment.update as any).mockResolvedValue({
        id: 'payment-123',
        userId: mockUserId,
        calculationId: mockCalculationId,
        amount: 500,
        paymentDate: new Date('2024-01-01'),
        currency: 'USD',
        recipients: JSON.stringify([]),
        paymentMethod: 'other',
        islamicYear: '1402',
        notes: null,
        status: 'completed',
        verificationDetails: JSON.stringify({
          recipient: 'ZK1:newiv:newcipher',
          encryptionFormat: 'ZK1',
        }),
        createdAt: new Date(),
      });

      await service.updatePayment(mockUserId, 'payment-123', {
        recipient: 'ZK1:newiv:newcipher',
      });

      const updateCall = (prisma.zakatPayment.update as any).mock.calls[0][0];
      const verificationDetails = JSON.parse(updateCall.data.verificationDetails);
      
      expect(verificationDetails.recipient).toBe('ZK1:newiv:newcipher');
      expect(verificationDetails.encryptionFormat).toBe('ZK1');
    });

    it('should encrypt plaintext when updating (legacy mode)', async () => {
      const encryptSpy = vi.spyOn(EncryptionService, 'encrypt');
      encryptSpy.mockImplementation((plaintext: string, key: string) =>
        Promise.resolve(`encrypted:${plaintext}`)
      );

      (prisma.zakatPayment.findFirst as any).mockResolvedValue({
        id: 'payment-123',
        userId: mockUserId,
        calculationId: mockCalculationId,
        amount: 500,
        paymentDate: new Date('2024-01-01'),
        currency: 'USD',
        recipients: JSON.stringify([]),
        paymentMethod: 'other',
        islamicYear: '1402',
        notes: null,
        status: 'completed',
        verificationDetails: JSON.stringify({}),
        createdAt: new Date(),
      });

      (prisma.zakatPayment.update as any).mockResolvedValue({
        id: 'payment-123',
        userId: mockUserId,
        calculationId: mockCalculationId,
        amount: 500,
        paymentDate: new Date('2024-01-01'),
        currency: 'USD',
        recipients: JSON.stringify([]),
        paymentMethod: 'other',
        islamicYear: '1402',
        notes: null,
        status: 'completed',
        verificationDetails: JSON.stringify({
          recipient: 'encrypted:New Recipient',
          encryptionFormat: 'SERVER_GCM',
        }),
        createdAt: new Date(),
      });

      await service.updatePayment(mockUserId, 'payment-123', {
        recipient: 'New Recipient',
      });

      expect(encryptSpy).toHaveBeenCalledWith('New Recipient', ENCRYPTION_KEY);

      encryptSpy.mockRestore();
    });
  });
});
