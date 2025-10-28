/**
 * T025: Unit Tests for NisabYearRecordService
 * 
 * Tests CRUD operations, status transition validation, encryption handling,
 * and business rules for Nisab Year Record management.
 * 
 * @see specs/008-nisab-year-record/data-model.md - NisabYearRecord schema and state transitions
 */

import { NisabYearRecordService } from '../../../src/services/nisabYearRecordService';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/services/encryptionService';
import { AuditTrailService } from '../../../src/services/auditTrailService';

jest.mock('@prisma/client');
jest.mock('../../../src/services/encryptionService');
jest.mock('../../../src/services/auditTrailService');

describe('NisabYearRecordService', () => {
  let service: NisabYearRecordService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockEncryption: jest.Mocked<EncryptionService>;
  let mockAuditTrail: jest.Mocked<AuditTrailService>;

  beforeEach(() => {
    mockPrisma = {
      nisabYearRecord: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    } as any;

    mockEncryption = {
      encryptValue: jest.fn((val) => `encrypted:${val}`),
      decryptValue: jest.fn((val) => val.replace('encrypted:', '')),
      encryptObject: jest.fn((obj) => `encrypted:${JSON.stringify(obj)}`),
      decryptObject: jest.fn((str) => JSON.parse(str.replace('encrypted:', ''))),
    } as any;

    mockAuditTrail = {
      recordEvent: jest.fn(),
    } as any;

    service = new NisabYearRecordService(mockPrisma, mockEncryption, mockAuditTrail);
    jest.clearAllMocks();
  });

  describe('createRecord', () => {
    it('should create a new DRAFT Nisab Year Record', async () => {
      // Arrange
      const recordData = {
        userId: 'user1',
        hawlStartDate: new Date('2024-01-01'),
        hawlCompletionDate: new Date('2024-12-20'),
        nisabBasis: 'gold' as const,
        nisabThresholdAtStart: 5293.54,
        totalWealth: 10000,
        totalLiabilities: 1000,
        zakatableWealth: 9000,
        zakatAmount: 225, // 2.5% of 9000
      };

      mockPrisma.nisabYearRecord.create.mockResolvedValue({
        id: 'record1',
        ...recordData,
        status: 'DRAFT',
        createdAt: new Date(),
      } as any);

      // Act
      const result = await service.createRecord(recordData);

      // Assert
      expect(mockPrisma.nisabYearRecord.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user1',
          status: 'DRAFT',
          hawlStartDate: recordData.hawlStartDate,
          nisabBasis: 'gold',
          totalWealth: expect.stringContaining('encrypted:'),
          nisabThresholdAtStart: expect.stringContaining('encrypted:'),
        }),
      });
      expect(mockAuditTrail.recordEvent).toHaveBeenCalledWith({
        nisabYearRecordId: 'record1',
        userId: 'user1',
        eventType: 'CREATED',
        afterState: expect.any(Object),
      });
    });

    it('should encrypt sensitive financial data', async () => {
      // Arrange
      const recordData = {
        userId: 'user1',
        hawlStartDate: new Date('2024-01-01'),
        hawlCompletionDate: new Date('2024-12-20'),
        nisabBasis: 'silver' as const,
        nisabThresholdAtStart: 520.51,
        totalWealth: 8000,
        zakatableWealth: 8000,
        zakatAmount: 200,
      };

      mockPrisma.nisabYearRecord.create.mockResolvedValue({ id: 'record1' } as any);

      // Act
      await service.createRecord(recordData);

      // Assert
      expect(mockEncryption.encryptValue).toHaveBeenCalledWith('520.51');
      expect(mockEncryption.encryptValue).toHaveBeenCalledWith('8000');
      expect(mockEncryption.encryptValue).toHaveBeenCalledWith('200');
    });

    it('should validate Hawl completion date is 354 days after start', async () => {
      // Arrange
      const invalidData = {
        userId: 'user1',
        hawlStartDate: new Date('2024-01-01'),
        hawlCompletionDate: new Date('2025-01-01'), // 366 days (invalid)
        nisabBasis: 'gold' as const,
        nisabThresholdAtStart: 5293.54,
      };

      // Act & Assert
      await expect(service.createRecord(invalidData as any)).rejects.toThrow(
        'Hawl completion date must be approximately 354 days after start date'
      );
      expect(mockPrisma.nisabYearRecord.create).not.toHaveBeenCalled();
    });

    it('should accept Hawl completion date within ±5 days tolerance', async () => {
      // Arrange
      const validData = {
        userId: 'user1',
        hawlStartDate: new Date('2024-01-01'),
        hawlCompletionDate: new Date('2024-12-22'), // 356 days (within tolerance)
        nisabBasis: 'gold' as const,
        nisabThresholdAtStart: 5293.54,
        totalWealth: 10000,
        zakatableWealth: 10000,
        zakatAmount: 250,
      };

      mockPrisma.nisabYearRecord.create.mockResolvedValue({ id: 'record1' } as any);

      // Act
      await service.createRecord(validData);

      // Assert
      expect(mockPrisma.nisabYearRecord.create).toHaveBeenCalled();
    });
  });

  describe('getRecord', () => {
    it('should retrieve and decrypt a Nisab Year Record', async () => {
      // Arrange
      const mockRecord = {
        id: 'record1',
        userId: 'user1',
        status: 'DRAFT',
        totalWealth: 'encrypted:10000',
        zakatableWealth: 'encrypted:9000',
        zakatAmount: 'encrypted:225',
        nisabThresholdAtStart: 'encrypted:5293.54',
      };

      mockPrisma.nisabYearRecord.findUnique.mockResolvedValue(mockRecord as any);

      // Act
      const result = await service.getRecord('record1', 'user1');

      // Assert
      expect(result.totalWealth).toBe(10000);
      expect(result.zakatAmount).toBe(225);
      expect(mockEncryption.decryptValue).toHaveBeenCalledTimes(4);
    });

    it('should throw error if record belongs to different user', async () => {
      // Arrange
      mockPrisma.nisabYearRecord.findUnique.mockResolvedValue({
        id: 'record1',
        userId: 'user2', // Different user
      } as any);

      // Act & Assert
      await expect(service.getRecord('record1', 'user1')).rejects.toThrow(
        'Not authorized to access this record'
      );
    });

    it('should throw error if record does not exist', async () => {
      // Arrange
      mockPrisma.nisabYearRecord.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getRecord('nonexistent', 'user1')).rejects.toThrow(
        'Nisab Year Record not found'
      );
    });
  });

  describe('updateRecord', () => {
    it('should update a DRAFT record', async () => {
      // Arrange
      const existingRecord = {
        id: 'record1',
        userId: 'user1',
        status: 'DRAFT',
        totalWealth: 'encrypted:10000',
      };

      const updates = {
        totalWealth: 12000,
        zakatAmount: 300,
      };

      mockPrisma.nisabYearRecord.findUnique.mockResolvedValue(existingRecord as any);
      mockPrisma.nisabYearRecord.update.mockResolvedValue({
        ...existingRecord,
        ...updates,
      } as any);

      // Act
      const result = await service.updateRecord('record1', 'user1', updates);

      // Assert
      expect(mockPrisma.nisabYearRecord.update).toHaveBeenCalledWith({
        where: { id: 'record1' },
        data: expect.objectContaining({
          totalWealth: expect.stringContaining('encrypted:'),
        }),
      });
      expect(mockAuditTrail.recordEvent).toHaveBeenCalledWith({
        nisabYearRecordId: 'record1',
        userId: 'user1',
        eventType: 'EDITED',
        changesSummary: expect.any(Object),
        beforeState: expect.any(Object),
        afterState: expect.any(Object),
      });
    });

    it('should NOT allow updates to FINALIZED record', async () => {
      // Arrange
      mockPrisma.nisabYearRecord.findUnique.mockResolvedValue({
        id: 'record1',
        userId: 'user1',
        status: 'FINALIZED',
      } as any);

      // Act & Assert
      await expect(
        service.updateRecord('record1', 'user1', { totalWealth: 15000 })
      ).rejects.toThrow('Cannot update finalized record. Unlock it first.');
      expect(mockPrisma.nisabYearRecord.update).not.toHaveBeenCalled();
    });

    it('should allow updates to UNLOCKED record', async () => {
      // Arrange
      mockPrisma.nisabYearRecord.findUnique.mockResolvedValue({
        id: 'record1',
        userId: 'user1',
        status: 'UNLOCKED',
        totalWealth: 'encrypted:10000',
      } as any);

      mockPrisma.nisabYearRecord.update.mockResolvedValue({} as any);

      // Act
      await service.updateRecord('record1', 'user1', { totalWealth: 11000 });

      // Assert
      expect(mockPrisma.nisabYearRecord.update).toHaveBeenCalled();
    });
  });

  describe('finalizeRecord', () => {
    it('should finalize a DRAFT record after Hawl completion', async () => {
      // Arrange
      const record = {
        id: 'record1',
        userId: 'user1',
        status: 'DRAFT',
        hawlCompletionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      };

      mockPrisma.nisabYearRecord.findUnique.mockResolvedValue(record as any);
      mockPrisma.nisabYearRecord.update.mockResolvedValue({
        ...record,
        status: 'FINALIZED',
        finalizedAt: new Date(),
      } as any);

      // Act
      const result = await service.finalizeRecord('record1', 'user1');

      // Assert
      expect(result.status).toBe('FINALIZED');
      expect(mockPrisma.nisabYearRecord.update).toHaveBeenCalledWith({
        where: { id: 'record1' },
        data: {
          status: 'FINALIZED',
          finalizedAt: expect.any(Date),
        },
      });
      expect(mockAuditTrail.recordEvent).toHaveBeenCalledWith({
        nisabYearRecordId: 'record1',
        userId: 'user1',
        eventType: 'FINALIZED',
        beforeState: expect.objectContaining({ status: 'DRAFT' }),
        afterState: expect.objectContaining({ status: 'FINALIZED' }),
      });
    });

    it('should NOT finalize before Hawl completion date', async () => {
      // Arrange
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
      mockPrisma.nisabYearRecord.findUnique.mockResolvedValue({
        id: 'record1',
        userId: 'user1',
        status: 'DRAFT',
        hawlCompletionDate: futureDate,
      } as any);

      // Act & Assert
      await expect(service.finalizeRecord('record1', 'user1')).rejects.toThrow(
        'Cannot finalize before Hawl completion date'
      );
    });

    it('should allow finalization with override flag even before completion', async () => {
      // Arrange
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      mockPrisma.nisabYearRecord.findUnique.mockResolvedValue({
        id: 'record1',
        userId: 'user1',
        status: 'DRAFT',
        hawlCompletionDate: futureDate,
      } as any);

      mockPrisma.nisabYearRecord.update.mockResolvedValue({
        status: 'FINALIZED',
      } as any);

      // Act
      const result = await service.finalizeRecord('record1', 'user1', { override: true });

      // Assert
      expect(result.status).toBe('FINALIZED');
    });

    it('should NOT allow finalization of already FINALIZED record', async () => {
      // Arrange
      mockPrisma.nisabYearRecord.findUnique.mockResolvedValue({
        id: 'record1',
        userId: 'user1',
        status: 'FINALIZED',
      } as any);

      // Act & Assert
      await expect(service.finalizeRecord('record1', 'user1')).rejects.toThrow(
        'Record is already finalized'
      );
    });
  });

  describe('unlockRecord', () => {
    it('should unlock a FINALIZED record with valid reason', async () => {
      // Arrange
      const unlockReason = 'Need to correct incorrectly recorded asset value';
      mockPrisma.nisabYearRecord.findUnique.mockResolvedValue({
        id: 'record1',
        userId: 'user1',
        status: 'FINALIZED',
      } as any);

      mockPrisma.nisabYearRecord.update.mockResolvedValue({
        status: 'UNLOCKED',
      } as any);

      // Act
      const result = await service.unlockRecord('record1', 'user1', unlockReason);

      // Assert
      expect(result.status).toBe('UNLOCKED');
      expect(mockAuditTrail.recordEvent).toHaveBeenCalledWith({
        nisabYearRecordId: 'record1',
        userId: 'user1',
        eventType: 'UNLOCKED',
        unlockReason,
        beforeState: expect.objectContaining({ status: 'FINALIZED' }),
        afterState: expect.objectContaining({ status: 'UNLOCKED' }),
      });
    });

    it('should require unlock reason with minimum 10 characters', async () => {
      // Arrange
      mockPrisma.nisabYearRecord.findUnique.mockResolvedValue({
        id: 'record1',
        userId: 'user1',
        status: 'FINALIZED',
      } as any);

      // Act & Assert
      await expect(
        service.unlockRecord('record1', 'user1', 'Too short')
      ).rejects.toThrow('Unlock reason must be at least 10 characters');
    });

    it('should NOT allow unlocking DRAFT record', async () => {
      // Arrange
      mockPrisma.nisabYearRecord.findUnique.mockResolvedValue({
        id: 'record1',
        userId: 'user1',
        status: 'DRAFT',
      } as any);

      // Act & Assert
      await expect(
        service.unlockRecord('record1', 'user1', 'Valid reason here')
      ).rejects.toThrow('Only FINALIZED records can be unlocked');
    });
  });

  describe('deleteRecord', () => {
    it('should delete a DRAFT record', async () => {
      // Arrange
      mockPrisma.nisabYearRecord.findUnique.mockResolvedValue({
        id: 'record1',
        userId: 'user1',
        status: 'DRAFT',
      } as any);

      mockPrisma.nisabYearRecord.delete.mockResolvedValue({} as any);

      // Act
      await service.deleteRecord('record1', 'user1');

      // Assert
      expect(mockPrisma.nisabYearRecord.delete).toHaveBeenCalledWith({
        where: { id: 'record1' },
      });
    });

    it('should NOT allow deletion of FINALIZED record', async () => {
      // Arrange
      mockPrisma.nisabYearRecord.findUnique.mockResolvedValue({
        id: 'record1',
        userId: 'user1',
        status: 'FINALIZED',
      } as any);

      // Act & Assert
      await expect(service.deleteRecord('record1', 'user1')).rejects.toThrow(
        'Cannot delete finalized record'
      );
      expect(mockPrisma.nisabYearRecord.delete).not.toHaveBeenCalled();
    });

    it('should NOT allow deletion of UNLOCKED record', async () => {
      // Arrange
      mockPrisma.nisabYearRecord.findUnique.mockResolvedValue({
        id: 'record1',
        userId: 'user1',
        status: 'UNLOCKED',
      } as any);

      // Act & Assert
      await expect(service.deleteRecord('record1', 'user1')).rejects.toThrow(
        'Cannot delete unlocked record'
      );
    });
  });

  describe('listRecords', () => {
    it('should list all records for a user', async () => {
      // Arrange
      const mockRecords = [
        { id: 'record1', userId: 'user1', status: 'DRAFT', createdAt: new Date() },
        { id: 'record2', userId: 'user1', status: 'FINALIZED', createdAt: new Date() },
      ];

      mockPrisma.nisabYearRecord.findMany.mockResolvedValue(mockRecords as any);

      // Act
      const result = await service.listRecords('user1');

      // Assert
      expect(result).toHaveLength(2);
      expect(mockPrisma.nisabYearRecord.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter records by status', async () => {
      // Arrange
      mockPrisma.nisabYearRecord.findMany.mockResolvedValue([]);

      // Act
      await service.listRecords('user1', { status: 'FINALIZED' });

      // Assert
      expect(mockPrisma.nisabYearRecord.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1', status: 'FINALIZED' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
