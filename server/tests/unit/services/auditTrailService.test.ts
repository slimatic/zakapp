/**
 * T024: Unit Tests for AuditTrailService
 * 
 * Tests event recording, encryption of sensitive data, immutability enforcement,
 * and audit trail querying for Nisab Year Records.
 * 
 * @see specs/008-nisab-year-record/research.md - Audit trail best practices
 * @see specs/008-nisab-year-record/data-model.md - AuditTrailEntry schema
 */

import { AuditTrailService } from '../../../src/services/auditTrailService';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/services/encryptionService';

jest.mock('@prisma/client');
jest.mock('../../../src/services/encryptionService');

describe('AuditTrailService', () => {
  let service: AuditTrailService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockEncryption: jest.Mocked<EncryptionService>;

  beforeEach(() => {
    mockPrisma = {
      auditTrailEntry: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(), // Should never be called
        delete: jest.fn(), // Should never be called
      },
    } as any;

    mockEncryption = {
      encryptValue: jest.fn((val) => `encrypted:${val}`),
      decryptValue: jest.fn((val) => val.replace('encrypted:', '')),
    } as any;

    service = new AuditTrailService(mockPrisma, mockEncryption);
    jest.clearAllMocks();
  });

  describe('recordEvent', () => {
    it('should record CREATED event for new Nisab Year Record', async () => {
      // Arrange
      const eventData = {
        nisabYearRecordId: 'record1',
        userId: 'user1',
        eventType: 'CREATED' as const,
        afterState: {
          status: 'DRAFT',
          hawlStartDate: '2024-01-01',
          nisabBasis: 'gold',
        },
      };

      mockPrisma.auditTrailEntry.create.mockResolvedValue({
        id: 'audit1',
        ...eventData,
        timestamp: new Date(),
      } as any);

      // Act
      const result = await service.recordEvent(eventData);

      // Assert
      expect(mockPrisma.auditTrailEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          nisabYearRecordId: 'record1',
          userId: 'user1',
          eventType: 'CREATED',
          afterState: expect.stringContaining('encrypted:'),
        }),
      });
      expect(result.id).toBe('audit1');
    });

    it('should record UNLOCKED event with encrypted unlock reason', async () => {
      // Arrange
      const unlockReason = 'Need to correct asset value that was incorrectly entered';
      const eventData = {
        nisabYearRecordId: 'record1',
        userId: 'user1',
        eventType: 'UNLOCKED' as const,
        unlockReason,
        beforeState: { status: 'FINALIZED' },
        afterState: { status: 'UNLOCKED' },
      };

      mockPrisma.auditTrailEntry.create.mockResolvedValue({
        id: 'audit2',
        ...eventData,
        unlockReason: 'encrypted:' + unlockReason,
        timestamp: new Date(),
      } as any);

      // Act
      const result = await service.recordEvent(eventData);

      // Assert
      expect(mockEncryption.encryptValue).toHaveBeenCalledWith(unlockReason);
      expect(mockPrisma.auditTrailEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'UNLOCKED',
          unlockReason: expect.stringContaining('encrypted:'),
        }),
      });
    });

    it('should require unlock reason for UNLOCKED events', async () => {
      // Arrange
      const eventData = {
        nisabYearRecordId: 'record1',
        userId: 'user1',
        eventType: 'UNLOCKED' as const,
        // Missing unlockReason
      };

      // Act & Assert
      await expect(service.recordEvent(eventData as any)).rejects.toThrow(
        'Unlock reason is required for UNLOCKED events'
      );
      expect(mockPrisma.auditTrailEntry.create).not.toHaveBeenCalled();
    });

    it('should enforce minimum 10 characters for unlock reason', async () => {
      // Arrange
      const eventData = {
        nisabYearRecordId: 'record1',
        userId: 'user1',
        eventType: 'UNLOCKED' as const,
        unlockReason: 'Too short', // Only 9 characters
      };

      // Act & Assert
      await expect(service.recordEvent(eventData)).rejects.toThrow(
        'Unlock reason must be at least 10 characters'
      );
    });

    it('should record EDITED event with encrypted changes summary', async () => {
      // Arrange
      const eventData = {
        nisabYearRecordId: 'record1',
        userId: 'user1',
        eventType: 'EDITED' as const,
        changesSummary: {
          fieldsChanged: ['totalWealth', 'zakatAmount'],
          reason: 'Asset value correction',
        },
        beforeState: { totalWealth: '10000.00' },
        afterState: { totalWealth: '12000.00' },
      };

      mockPrisma.auditTrailEntry.create.mockResolvedValue({
        id: 'audit3',
        timestamp: new Date(),
      } as any);

      // Act
      await service.recordEvent(eventData);

      // Assert
      expect(mockEncryption.encryptValue).toHaveBeenCalledWith(
        JSON.stringify(eventData.changesSummary)
      );
      expect(mockPrisma.auditTrailEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'EDITED',
          changesSummary: expect.stringContaining('encrypted:'),
        }),
      });
    });

    it('should record FINALIZED event with timestamp', async () => {
      // Arrange
      const eventData = {
        nisabYearRecordId: 'record1',
        userId: 'user1',
        eventType: 'FINALIZED' as const,
        beforeState: { status: 'DRAFT' },
        afterState: { status: 'FINALIZED' },
      };

      mockPrisma.auditTrailEntry.create.mockResolvedValue({
        id: 'audit4',
        timestamp: new Date(),
      } as any);

      // Act
      const result = await service.recordEvent(eventData);

      // Assert
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(mockPrisma.auditTrailEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'FINALIZED',
        }),
      });
    });

    it('should include IP address and user agent if provided', async () => {
      // Arrange
      const eventData = {
        nisabYearRecordId: 'record1',
        userId: 'user1',
        eventType: 'CREATED' as const,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      };

      mockPrisma.auditTrailEntry.create.mockResolvedValue({
        id: 'audit5',
        timestamp: new Date(),
      } as any);

      // Act
      await service.recordEvent(eventData);

      // Assert
      expect(mockPrisma.auditTrailEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ipAddress: '192.168.1.1',
          userAgent: expect.stringContaining('Mozilla'),
        }),
      });
    });
  });

  describe('getAuditTrail', () => {
    it('should retrieve audit trail for a Nisab Year Record', async () => {
      // Arrange
      const nisabYearRecordId = 'record1';
      const mockEntries = [
        {
          id: 'audit1',
          eventType: 'CREATED',
          timestamp: new Date('2024-01-01'),
          unlockReason: null,
          changesSummary: null,
          beforeState: null,
          afterState: 'encrypted:{"status":"DRAFT"}',
        },
        {
          id: 'audit2',
          eventType: 'FINALIZED',
          timestamp: new Date('2024-12-20'),
          unlockReason: null,
          changesSummary: null,
          beforeState: 'encrypted:{"status":"DRAFT"}',
          afterState: 'encrypted:{"status":"FINALIZED"}',
        },
      ];

      mockPrisma.auditTrailEntry.findMany.mockResolvedValue(mockEntries as any);

      // Act
      const result = await service.getAuditTrail(nisabYearRecordId);

      // Assert
      expect(result).toHaveLength(2);
      expect(mockPrisma.auditTrailEntry.findMany).toHaveBeenCalledWith({
        where: { nisabYearRecordId },
        orderBy: { timestamp: 'desc' },
      });
    });

    it('should decrypt unlock reasons in audit trail', async () => {
      // Arrange
      const mockEntries = [
        {
          id: 'audit1',
          eventType: 'UNLOCKED',
          timestamp: new Date(),
          unlockReason: 'encrypted:Correcting asset valuation error',
          changesSummary: null,
        },
      ];

      mockPrisma.auditTrailEntry.findMany.mockResolvedValue(mockEntries as any);

      // Act
      const result = await service.getAuditTrail('record1');

      // Assert
      expect(mockEncryption.decryptValue).toHaveBeenCalledWith(
        'encrypted:Correcting asset valuation error'
      );
      expect(result[0].unlockReason).toBe('Correcting asset valuation error');
    });

    it('should decrypt changes summary in audit trail', async () => {
      // Arrange
      const mockEntries = [
        {
          id: 'audit1',
          eventType: 'EDITED',
          timestamp: new Date(),
          changesSummary: 'encrypted:{"fieldsChanged":["totalWealth"]}',
        },
      ];

      mockPrisma.auditTrailEntry.findMany.mockResolvedValue(mockEntries as any);

      // Act
      const result = await service.getAuditTrail('record1');

      // Assert
      expect(result[0].changesSummary).toEqual({
        fieldsChanged: ['totalWealth'],
      });
    });

    it('should return empty array for records with no audit trail', async () => {
      // Arrange
      mockPrisma.auditTrailEntry.findMany.mockResolvedValue([]);

      // Act
      const result = await service.getAuditTrail('nonexistent-record');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getUserAuditHistory', () => {
    it('should retrieve all audit events for a user', async () => {
      // Arrange
      const userId = 'user1';
      const mockEntries = [
        { id: 'audit1', eventType: 'CREATED', timestamp: new Date('2024-01-01') },
        { id: 'audit2', eventType: 'FINALIZED', timestamp: new Date('2024-12-20') },
      ];

      mockPrisma.auditTrailEntry.findMany.mockResolvedValue(mockEntries as any);

      // Act
      const result = await service.getUserAuditHistory(userId);

      // Assert
      expect(result).toHaveLength(2);
      expect(mockPrisma.auditTrailEntry.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { timestamp: 'desc' },
      });
    });

    it('should filter by event type if specified', async () => {
      // Arrange
      const userId = 'user1';
      const eventType = 'UNLOCKED';

      mockPrisma.auditTrailEntry.findMany.mockResolvedValue([]);

      // Act
      await service.getUserAuditHistory(userId, { eventType });

      // Assert
      expect(mockPrisma.auditTrailEntry.findMany).toHaveBeenCalledWith({
        where: { userId, eventType },
        orderBy: { timestamp: 'desc' },
      });
    });
  });

  describe('Immutability Enforcement', () => {
    it('should NOT allow updates to audit trail entries', async () => {
      // Act & Assert
      expect(service.updateAuditEntry).toBeUndefined();
      // If method exists, it should throw error
    });

    it('should NOT allow deletion of audit trail entries', async () => {
      // Act & Assert
      expect(service.deleteAuditEntry).toBeUndefined();
      // If method exists, it should throw error
    });

    it('should prevent modification attempts via service', async () => {
      // Arrange
      const attemptedUpdate = async () => {
        // @ts-expect-error - Intentionally calling private/non-existent method
        await service.modifyEntry('audit1', { eventType: 'EDITED' });
      };

      // Act & Assert
      await expect(attemptedUpdate).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should retrieve 50 audit entries in < 15ms', async () => {
      // Arrange
      const mockEntries = Array.from({ length: 50 }, (_, i) => ({
        id: `audit${i}`,
        eventType: 'EDITED',
        timestamp: new Date(),
        changesSummary: `encrypted:{"change":${i}}`,
      }));

      mockPrisma.auditTrailEntry.findMany.mockResolvedValue(mockEntries as any);

      // Act
      const startTime = Date.now();
      await service.getAuditTrail('record1');
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(15);
    });
  });
});
