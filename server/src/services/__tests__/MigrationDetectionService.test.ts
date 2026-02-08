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
import { MigrationDetectionService } from '../MigrationDetectionService';
import { EncryptionService } from '../EncryptionService';
import { prisma } from '../../utils/prisma';

// Mock Prisma
vi.mock('../../utils/prisma', () => ({
  prisma: {
    zakatPayment: {
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('MigrationDetectionService', () => {
  const mockUserId = 'test-user-123';
  const ENCRYPTION_KEY = 'test-encryption-key-32-chars-!!!';

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = ENCRYPTION_KEY;
    vi.clearAllMocks();
  });

  describe('getUserEncryptionStatus', () => {
    it('should return status with all ZK1 payments', async () => {
      const mockPayments = [
        {
          verificationDetails: JSON.stringify({ encryptionFormat: 'ZK1' }),
        },
        {
          verificationDetails: JSON.stringify({ encryptionFormat: 'ZK1' }),
        },
        {
          verificationDetails: JSON.stringify({ encryptionFormat: 'ZK1' }),
        },
      ];

      (prisma.zakatPayment.findMany as any).mockResolvedValue(mockPayments);

      const result = await MigrationDetectionService.getUserEncryptionStatus(mockUserId);

      expect(result).toEqual({
        needsMigration: false,
        totalPayments: 3,
        zkPayments: 3,
        serverPayments: 0,
      });
    });

    it('should return status with all legacy payments', async () => {
      const mockPayments = [
        {
          verificationDetails: JSON.stringify({ encryptionFormat: 'SERVER_GCM' }),
        },
        {
          verificationDetails: JSON.stringify({ encryptionFormat: 'SERVER_GCM' }),
        },
      ];

      (prisma.zakatPayment.findMany as any).mockResolvedValue(mockPayments);

      const result = await MigrationDetectionService.getUserEncryptionStatus(mockUserId);

      expect(result).toEqual({
        needsMigration: true,
        totalPayments: 2,
        zkPayments: 0,
        serverPayments: 2,
      });
    });

    it('should return status with mixed payments', async () => {
      const mockPayments = [
        {
          verificationDetails: JSON.stringify({ encryptionFormat: 'ZK1' }),
        },
        {
          verificationDetails: JSON.stringify({ encryptionFormat: 'SERVER_GCM' }),
        },
        {
          verificationDetails: JSON.stringify({ encryptionFormat: 'ZK1' }),
        },
        {
          verificationDetails: JSON.stringify({ encryptionFormat: 'SERVER_GCM' }),
        },
        {
          verificationDetails: JSON.stringify({ encryptionFormat: 'ZK1' }),
        },
      ];

      (prisma.zakatPayment.findMany as any).mockResolvedValue(mockPayments);

      const result = await MigrationDetectionService.getUserEncryptionStatus(mockUserId);

      expect(result).toEqual({
        needsMigration: true,
        totalPayments: 5,
        zkPayments: 3,
        serverPayments: 2,
      });
    });

    it('should handle empty payment list', async () => {
      (prisma.zakatPayment.findMany as any).mockResolvedValue([]);

      const result = await MigrationDetectionService.getUserEncryptionStatus(mockUserId);

      expect(result).toEqual({
        needsMigration: false,
        totalPayments: 0,
        zkPayments: 0,
        serverPayments: 0,
      });
    });

    it('should handle missing encryptionFormat (legacy data)', async () => {
      const mockPayments = [
        {
          verificationDetails: JSON.stringify({}), // No encryptionFormat
        },
        {
          verificationDetails: JSON.stringify({ recipient: 'encrypted:data' }),
        },
      ];

      (prisma.zakatPayment.findMany as any).mockResolvedValue(mockPayments);

      const result = await MigrationDetectionService.getUserEncryptionStatus(mockUserId);

      // Missing format should be treated as legacy
      expect(result.needsMigration).toBe(true);
      expect(result.serverPayments).toBe(2);
    });
  });

  describe('prepareMigrationData', () => {
    it('should decrypt legacy payments for migration', async () => {
      const decryptSpy = vi.spyOn(EncryptionService, 'decrypt');
      decryptSpy.mockImplementation((ciphertext: string, key: string) =>
        Promise.resolve(ciphertext.replace('encrypted:', ''))
      );

      const mockPayments = [
        {
          id: 'payment-1',
          amount: 500,
          paymentDate: new Date('2024-01-15'),
          notes: 'encrypted:My donation notes',
          verificationDetails: JSON.stringify({
            recipient: 'encrypted:Local Masjid',
            encryptionFormat: 'SERVER_GCM',
          }),
        },
        {
          id: 'payment-2',
          amount: 300,
          paymentDate: new Date('2024-02-10'),
          notes: 'encrypted:Another note',
          verificationDetails: JSON.stringify({
            recipient: 'encrypted:Charity Organization',
            encryptionFormat: 'SERVER_GCM',
          }),
        },
      ];

      (prisma.zakatPayment.findMany as any).mockResolvedValue(mockPayments);

      const result = await MigrationDetectionService.prepareMigrationData(mockUserId);

      expect(result.payments).toHaveLength(2);
      expect(result.payments[0]).toEqual({
        id: 'payment-1',
        recipient: 'Local Masjid',
        notes: 'My donation notes',
        amount: 500,
        paymentDate: '2024-01-15',
      });
      expect(result.payments[1]).toEqual({
        id: 'payment-2',
        recipient: 'Charity Organization',
        notes: 'Another note',
        amount: 300,
        paymentDate: '2024-02-10',
      });

      // Verify decryption was called
      expect(decryptSpy).toHaveBeenCalledWith('encrypted:Local Masjid', ENCRYPTION_KEY);
      expect(decryptSpy).toHaveBeenCalledWith('encrypted:My donation notes', ENCRYPTION_KEY);

      decryptSpy.mockRestore();
    });

    it('should skip ZK1 payments (already migrated)', async () => {
      const decryptSpy = vi.spyOn(EncryptionService, 'decrypt');

      const mockPayments = [
        {
          id: 'payment-zk1',
          amount: 500,
          paymentDate: new Date('2024-01-15'),
          notes: 'ZK1:zknotesiv:zknotescipher',
          verificationDetails: JSON.stringify({
            recipient: 'ZK1:zkrecipiv:zkrecipcipher',
            encryptionFormat: 'ZK1',
          }),
        },
        {
          id: 'payment-legacy',
          amount: 300,
          paymentDate: new Date('2024-02-10'),
          notes: 'encrypted:Legacy note',
          verificationDetails: JSON.stringify({
            recipient: 'encrypted:Legacy Charity',
            encryptionFormat: 'SERVER_GCM',
          }),
        },
      ];

      decryptSpy.mockImplementation((ciphertext: string, key: string) =>
        Promise.resolve(ciphertext.replace('encrypted:', ''))
      );

      (prisma.zakatPayment.findMany as any).mockResolvedValue(mockPayments);

      const result = await MigrationDetectionService.prepareMigrationData(mockUserId);

      // Only legacy payment should be returned
      expect(result.payments).toHaveLength(1);
      expect(result.payments[0].id).toBe('payment-legacy');
      expect(result.payments[0].recipient).toBe('Legacy Charity');

      // Decrypt should not be called for ZK1 data
      expect(decryptSpy).not.toHaveBeenCalledWith(expect.stringContaining('ZK1:'), expect.any(String));

      decryptSpy.mockRestore();
    });

    it('should handle payments without recipient or notes', async () => {
      const mockPayments = [
        {
          id: 'payment-1',
          amount: 500,
          paymentDate: new Date('2024-01-15'),
          notes: null,
          verificationDetails: JSON.stringify({
            encryptionFormat: 'SERVER_GCM',
          }),
        },
      ];

      (prisma.zakatPayment.findMany as any).mockResolvedValue(mockPayments);

      const result = await MigrationDetectionService.prepareMigrationData(mockUserId);

      expect(result.payments).toHaveLength(1);
      expect(result.payments[0]).toEqual({
        id: 'payment-1',
        recipient: undefined,
        notes: undefined,
        amount: 500,
        paymentDate: '2024-01-15',
      });
    });

    it('should handle decryption errors gracefully', async () => {
      const decryptSpy = vi.spyOn(EncryptionService, 'decrypt');
      decryptSpy.mockRejectedValue(new Error('Decryption failed'));

      const mockPayments = [
        {
          id: 'payment-1',
          amount: 500,
          paymentDate: new Date('2024-01-15'),
          notes: 'corrupted:data',
          verificationDetails: JSON.stringify({
            recipient: 'corrupted:data',
            encryptionFormat: 'SERVER_GCM',
          }),
        },
      ];

      (prisma.zakatPayment.findMany as any).mockResolvedValue(mockPayments);

      const result = await MigrationDetectionService.prepareMigrationData(mockUserId);

      // Should return payment with undefined fields instead of throwing
      expect(result.payments).toHaveLength(1);
      expect(result.payments[0].recipient).toBeUndefined();
      expect(result.payments[0].notes).toBeUndefined();

      decryptSpy.mockRestore();
    });
  });

  describe('markUserMigrated', () => {
    it('should update user settings with migration flag', async () => {
      const encryptSpy = vi.spyOn(EncryptionService, 'encrypt');
      const decryptSpy = vi.spyOn(EncryptionService, 'decrypt');

      // Mock existing user with settings
      (prisma.user.findUnique as any).mockResolvedValue({
        id: mockUserId,
        settings: 'encrypted:{"currency":"USD","language":"en"}',
      });

      decryptSpy.mockImplementation((ciphertext: string, key: string) =>
        Promise.resolve('{"currency":"USD","language":"en"}')
      );

      encryptSpy.mockImplementation((plaintext: string, key: string) =>
        Promise.resolve(`encrypted:${plaintext}`)
      );

      (prisma.user.update as any).mockResolvedValue({});

      await MigrationDetectionService.markUserMigrated(mockUserId);

      // Verify update was called with migration flags
      const updateCall = (prisma.user.update as any).mock.calls[0][0];
      expect(updateCall.where.id).toBe(mockUserId);
      
      // Parse encrypted settings to verify migration flags
      const encryptedSettings = updateCall.data.settings;
      expect(encryptedSettings).toContain('encrypted:');
      
      // Verify encryption was called with updated settings
      expect(encryptSpy).toHaveBeenCalled();
      const encryptCallArg = encryptSpy.mock.calls[0][0];
      const settingsObj = JSON.parse(encryptCallArg);
      expect(settingsObj.encryptionMigrated).toBe(true);
      expect(settingsObj.migratedAt).toBeDefined();
      expect(settingsObj.currency).toBe('USD'); // Preserved existing settings

      encryptSpy.mockRestore();
      decryptSpy.mockRestore();
    });

    it('should handle user with no existing settings', async () => {
      const encryptSpy = vi.spyOn(EncryptionService, 'encrypt');

      (prisma.user.findUnique as any).mockResolvedValue({
        id: mockUserId,
        settings: null,
      });

      encryptSpy.mockImplementation((plaintext: string, key: string) =>
        Promise.resolve(`encrypted:${plaintext}`)
      );

      (prisma.user.update as any).mockResolvedValue({});

      await MigrationDetectionService.markUserMigrated(mockUserId);

      // Verify new settings were created with migration flags
      expect(encryptSpy).toHaveBeenCalled();
      const encryptCallArg = encryptSpy.mock.calls[0][0];
      const settingsObj = JSON.parse(encryptCallArg);
      expect(settingsObj.encryptionMigrated).toBe(true);
      expect(settingsObj.migratedAt).toBeDefined();

      encryptSpy.mockRestore();
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(
        MigrationDetectionService.markUserMigrated('nonexistent-user')
      ).rejects.toThrow('User not found');
    });

    it('should handle corrupted settings gracefully', async () => {
      const encryptSpy = vi.spyOn(EncryptionService, 'encrypt');
      const decryptSpy = vi.spyOn(EncryptionService, 'decrypt');

      (prisma.user.findUnique as any).mockResolvedValue({
        id: mockUserId,
        settings: 'corrupted data that wont decrypt',
      });

      // Simulate decryption failure
      decryptSpy.mockRejectedValue(new Error('Decryption failed'));

      encryptSpy.mockImplementation((plaintext: string, key: string) =>
        Promise.resolve(`encrypted:${plaintext}`)
      );

      (prisma.user.update as any).mockResolvedValue({});

      // Should not throw, should create new settings
      await MigrationDetectionService.markUserMigrated(mockUserId);

      // Verify new settings were created
      expect(encryptSpy).toHaveBeenCalled();

      encryptSpy.mockRestore();
      decryptSpy.mockRestore();
    });
  });
});
