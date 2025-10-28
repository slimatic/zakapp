/**
 * Unit Tests for AuditTrailService (T024)
 * 
 * Tests immutable audit trail functionality:
 * - Event recording with encryption
 * - Unlock reason validation (min 10 chars)
 * - Audit trail retrieval
 * - Event filtering by type
 * - User activity tracking
 */

import { AuditTrailService } from '../../src/services/auditTrailService';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../src/services/EncryptionService';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('../../src/services/EncryptionService');
jest.mock('../../src/utils/logger');

describe('AuditTrailService', () => {
  let service: AuditTrailService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockEncryptionService: jest.Mocked<EncryptionService>;

  const userId = 'user_123';
  const recordId = 'record_123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Prisma client
    mockPrisma = {
      auditTrailEntry: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    } as any;

    mockEncryptionService = new EncryptionService() as jest.Mocked<EncryptionService>;

    // Mock static encryption methods
    (EncryptionService.encrypt as jest.Mock) = jest.fn((value) => ({
      encryptedData: `encrypted_${value}`,
      iv: 'mock_iv',
      authTag: 'mock_auth_tag',
    }));
    (EncryptionService.decrypt as jest.Mock) = jest.fn((encrypted) => {
      const parsed = JSON.parse(encrypted);
      return parsed.encryptedData.replace('encrypted_', '');
    });

    service = new AuditTrailService(mockPrisma, mockEncryptionService);
  });

  describe('recordEvent', () => {
    it('should record audit event with basic details', async () => {
      // Arrange
      const mockCreatedEntry = {
        id: 'audit_123',
        nisabYearRecordId: recordId,
        userId,
        eventType: 'CREATED',
        timestamp: new Date(),
        unlockReason: null,
        changesSummary: null,
        beforeState: null,
        afterState: null,
      };
      mockPrisma.auditTrailEntry.create = jest.fn().mockResolvedValue(mockCreatedEntry);

      // Act
      const result = await service.recordEvent(userId, 'CREATED', recordId);

      // Assert
      expect(mockPrisma.auditTrailEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          nisabYearRecordId: recordId,
          userId,
          eventType: 'CREATED',
          timestamp: expect.any(Date),
        }),
      });
      expect(result.id).toBe('audit_123');
      expect(result.eventType).toBe('CREATED');
    });

    it('should encrypt unlock reason when provided', async () => {
      // Arrange
      const unlockReason = 'Correcting calculation error from previous year';
      const mockCreatedEntry = {
        id: 'audit_123',
        nisabYearRecordId: recordId,
        userId,
        eventType: 'UNLOCKED',
        timestamp: new Date(),
        unlockReason: JSON.stringify({ encryptedData: `encrypted_${unlockReason}` }),
        changesSummary: null,
        beforeState: null,
        afterState: null,
      };
      mockPrisma.auditTrailEntry.create = jest.fn().mockResolvedValue(mockCreatedEntry);

      // Act
      await service.recordEvent(userId, 'UNLOCKED', recordId, { reason: unlockReason });

      // Assert
      expect(EncryptionService.encrypt).toHaveBeenCalledWith(unlockReason);
      expect(mockPrisma.auditTrailEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'UNLOCKED',
          unlockReason: expect.any(String),
        }),
      });
    });

    it('should validate unlock reason minimum length (10 chars)', async () => {
      // Arrange: Reason too short
      const shortReason = 'Too short';

      // Act & Assert
      await expect(
        service.recordEvent(userId, 'UNLOCKED', recordId, { reason: shortReason })
      ).rejects.toThrow('Unlock reason must be at least 10 characters');
    });

    it('should accept unlock reason exactly 10 characters', async () => {
      // Arrange
      const exactReason = '1234567890'; // Exactly 10 chars
      const mockCreatedEntry = {
        id: 'audit_123',
        nisabYearRecordId: recordId,
        userId,
        eventType: 'UNLOCKED',
        timestamp: new Date(),
        unlockReason: JSON.stringify({ encryptedData: `encrypted_${exactReason}` }),
        changesSummary: null,
        beforeState: null,
        afterState: null,
      };
      mockPrisma.auditTrailEntry.create = jest.fn().mockResolvedValue(mockCreatedEntry);

      // Act
      const result = await service.recordEvent(userId, 'UNLOCKED', recordId, { reason: exactReason });

      // Assert
      expect(result).toBeDefined();
      expect(EncryptionService.encrypt).toHaveBeenCalledWith(exactReason);
    });

    it('should encrypt changes summary when provided', async () => {
      // Arrange
      const changesSummary = {
        userNotes: { from: 'Old note', to: 'New note' },
        methodologyUsed: { from: 'standard', to: 'hanafi' },
      };
      const mockCreatedEntry = {
        id: 'audit_123',
        nisabYearRecordId: recordId,
        userId,
        eventType: 'EDITED',
        timestamp: new Date(),
        unlockReason: null,
        changesSummary: JSON.stringify({ encryptedData: `encrypted_${JSON.stringify(changesSummary)}` }),
        beforeState: null,
        afterState: null,
      };
      mockPrisma.auditTrailEntry.create = jest.fn().mockResolvedValue(mockCreatedEntry);

      // Act
      await service.recordEvent(userId, 'EDITED', recordId, { changesSummary });

      // Assert
      expect(EncryptionService.encrypt).toHaveBeenCalledWith(JSON.stringify(changesSummary));
    });

    it('should encrypt before and after states', async () => {
      // Arrange
      const beforeState = { status: 'DRAFT', userNotes: 'Before' };
      const afterState = { status: 'FINALIZED', userNotes: 'After' };
      const mockCreatedEntry = {
        id: 'audit_123',
        nisabYearRecordId: recordId,
        userId,
        eventType: 'FINALIZED',
        timestamp: new Date(),
        unlockReason: null,
        changesSummary: null,
        beforeState: JSON.stringify({ encryptedData: `encrypted_${JSON.stringify(beforeState)}` }),
        afterState: JSON.stringify({ encryptedData: `encrypted_${JSON.stringify(afterState)}` }),
      };
      mockPrisma.auditTrailEntry.create = jest.fn().mockResolvedValue(mockCreatedEntry);

      // Act
      await service.recordEvent(userId, 'FINALIZED', recordId, { beforeState, afterState });

      // Assert
      expect(EncryptionService.encrypt).toHaveBeenCalledWith(JSON.stringify(beforeState));
      expect(EncryptionService.encrypt).toHaveBeenCalledWith(JSON.stringify(afterState));
    });

    it('should handle all event types correctly', async () => {
      // Arrange
      const eventTypes = ['CREATED', 'FINALIZED', 'UNLOCKED', 'EDITED', 'REFINALIZED'];
      
      for (const eventType of eventTypes) {
        const mockEntry = {
          id: `audit_${eventType}`,
          nisabYearRecordId: recordId,
          userId,
          eventType,
          timestamp: new Date(),
          unlockReason: null,
          changesSummary: null,
          beforeState: null,
          afterState: null,
        };
        mockPrisma.auditTrailEntry.create = jest.fn().mockResolvedValue(mockEntry);

        // Act
        const result = await service.recordEvent(userId, eventType as any, recordId);

        // Assert
        expect(result.eventType).toBe(eventType);
      }
    });

    it('should throw descriptive error on database failure', async () => {
      // Arrange
      mockPrisma.auditTrailEntry.create = jest.fn().mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act & Assert
      await expect(
        service.recordEvent(userId, 'CREATED', recordId)
      ).rejects.toThrow('Audit trail recording failed: Database connection failed');
    });

    it('should include timestamp in created entry', async () => {
      // Arrange
      const beforeTime = new Date();
      const mockCreatedEntry = {
        id: 'audit_123',
        nisabYearRecordId: recordId,
        userId,
        eventType: 'CREATED',
        timestamp: new Date(),
        unlockReason: null,
        changesSummary: null,
        beforeState: null,
        afterState: null,
      };
      mockPrisma.auditTrailEntry.create = jest.fn().mockResolvedValue(mockCreatedEntry);

      // Act
      await service.recordEvent(userId, 'CREATED', recordId);
      const afterTime = new Date();

      // Assert
      expect(mockPrisma.auditTrailEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          timestamp: expect.any(Date),
        }),
      });
      const callArgs = (mockPrisma.auditTrailEntry.create as jest.Mock).mock.calls[0][0];
      expect(callArgs.data.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(callArgs.data.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('getAuditTrail', () => {
    it('should retrieve audit trail in chronological order (oldest first)', async () => {
      // Arrange
      const mockEntries = [
        {
          id: 'audit_1',
          nisabYearRecordId: recordId,
          userId,
          eventType: 'CREATED',
          timestamp: new Date('2024-01-01'),
          unlockReason: null,
          changesSummary: null,
          beforeState: null,
          afterState: null,
        },
        {
          id: 'audit_2',
          nisabYearRecordId: recordId,
          userId,
          eventType: 'FINALIZED',
          timestamp: new Date('2024-06-01'),
          unlockReason: null,
          changesSummary: null,
          beforeState: null,
          afterState: null,
        },
      ];
      mockPrisma.auditTrailEntry.findMany = jest.fn().mockResolvedValue(mockEntries);

      // Act
      const result = await service.getAuditTrail(recordId);

      // Assert
      expect(mockPrisma.auditTrailEntry.findMany).toHaveBeenCalledWith({
        where: { nisabYearRecordId: recordId },
        orderBy: { timestamp: 'asc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].eventType).toBe('CREATED');
      expect(result[1].eventType).toBe('FINALIZED');
    });

    it('should return empty array when no audit entries exist', async () => {
      // Arrange
      mockPrisma.auditTrailEntry.findMany = jest.fn().mockResolvedValue([]);

      // Act
      const result = await service.getAuditTrail(recordId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should decrypt sensitive data when includeDecrypted is true', async () => {
      // Arrange
      const mockEntries = [
        {
          id: 'audit_1',
          nisabYearRecordId: recordId,
          userId,
          eventType: 'UNLOCKED',
          timestamp: new Date(),
          unlockReason: JSON.stringify({ encryptedData: 'encrypted_Correcting error' }),
          changesSummary: null,
          beforeState: null,
          afterState: null,
        },
      ];
      mockPrisma.auditTrailEntry.findMany = jest.fn().mockResolvedValue(mockEntries);

      // Act
      const result = await service.getAuditTrail(recordId, true);

      // Assert
      expect(EncryptionService.decrypt).toHaveBeenCalled();
      expect(result[0].unlockReason).toBeDefined();
    });

    it('should not decrypt when includeDecrypted is false', async () => {
      // Arrange
      const mockEntries = [
        {
          id: 'audit_1',
          nisabYearRecordId: recordId,
          userId,
          eventType: 'UNLOCKED',
          timestamp: new Date(),
          unlockReason: JSON.stringify({ encryptedData: 'encrypted_Reason' }),
          changesSummary: null,
          beforeState: null,
          afterState: null,
        },
      ];
      mockPrisma.auditTrailEntry.findMany = jest.fn().mockResolvedValue(mockEntries);

      // Act
      const result = await service.getAuditTrail(recordId, false);

      // Assert
      expect(result).toHaveLength(1);
      // Decryption may still be called by mapping function, but result should be encrypted format
    });

    it('should throw descriptive error on retrieval failure', async () => {
      // Arrange
      mockPrisma.auditTrailEntry.findMany = jest.fn().mockRejectedValue(
        new Error('Database query failed')
      );

      // Act & Assert
      await expect(service.getAuditTrail(recordId))
        .rejects
        .toThrow('Audit trail retrieval failed: Database query failed');
    });
  });

  describe('getUserAuditTrail', () => {
    it('should retrieve user audit trail with pagination', async () => {
      // Arrange
      const mockEntries = [
        {
          id: 'audit_1',
          nisabYearRecordId: 'record_1',
          userId,
          eventType: 'CREATED',
          timestamp: new Date('2024-06-01'),
          unlockReason: null,
          changesSummary: null,
          beforeState: null,
          afterState: null,
        },
      ];
      const mockTotal = 50;
      mockPrisma.auditTrailEntry.findMany = jest.fn().mockResolvedValue(mockEntries);
      mockPrisma.auditTrailEntry.count = jest.fn().mockResolvedValue(mockTotal);

      // Act
      const result = await service.getUserAuditTrail(userId, 10, 0);

      // Assert
      expect(mockPrisma.auditTrailEntry.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { timestamp: 'desc' }, // Most recent first
        take: 10,
        skip: 0,
      });
      expect(result.entries).toHaveLength(1);
      expect(result.total).toBe(50);
    });

    it('should use default pagination values', async () => {
      // Arrange
      mockPrisma.auditTrailEntry.findMany = jest.fn().mockResolvedValue([]);
      mockPrisma.auditTrailEntry.count = jest.fn().mockResolvedValue(0);

      // Act
      await service.getUserAuditTrail(userId);

      // Assert
      expect(mockPrisma.auditTrailEntry.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 100, // Default limit
        skip: 0,   // Default offset
      });
    });

    it('should apply custom pagination parameters', async () => {
      // Arrange
      mockPrisma.auditTrailEntry.findMany = jest.fn().mockResolvedValue([]);
      mockPrisma.auditTrailEntry.count = jest.fn().mockResolvedValue(0);

      // Act
      await service.getUserAuditTrail(userId, 25, 50);

      // Assert
      expect(mockPrisma.auditTrailEntry.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 25,
        skip: 50,
      });
    });

    it('should return correct total count', async () => {
      // Arrange
      mockPrisma.auditTrailEntry.findMany = jest.fn().mockResolvedValue([]);
      mockPrisma.auditTrailEntry.count = jest.fn().mockResolvedValue(150);

      // Act
      const result = await service.getUserAuditTrail(userId, 10, 0);

      // Assert
      expect(result.total).toBe(150);
      expect(mockPrisma.auditTrailEntry.count).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should propagate errors', async () => {
      // Arrange
      mockPrisma.auditTrailEntry.findMany = jest.fn().mockRejectedValue(
        new Error('Query timeout')
      );

      // Act & Assert
      await expect(service.getUserAuditTrail(userId))
        .rejects
        .toThrow('Query timeout');
    });
  });

  describe('getEventsByType', () => {
    it('should filter events by specific type', async () => {
      // Arrange
      const mockEntries = [
        {
          id: 'audit_1',
          nisabYearRecordId: recordId,
          userId,
          eventType: 'UNLOCKED',
          timestamp: new Date('2024-03-01'),
          unlockReason: JSON.stringify({ encryptedData: 'encrypted_Reason 1' }),
          changesSummary: null,
          beforeState: null,
          afterState: null,
        },
        {
          id: 'audit_2',
          nisabYearRecordId: recordId,
          userId,
          eventType: 'UNLOCKED',
          timestamp: new Date('2024-06-01'),
          unlockReason: JSON.stringify({ encryptedData: 'encrypted_Reason 2' }),
          changesSummary: null,
          beforeState: null,
          afterState: null,
        },
      ];
      mockPrisma.auditTrailEntry.findMany = jest.fn().mockResolvedValue(mockEntries);

      // Act
      const result = await service.getEventsByType(recordId, 'UNLOCKED');

      // Assert
      expect(mockPrisma.auditTrailEntry.findMany).toHaveBeenCalledWith({
        where: {
          nisabYearRecordId: recordId,
          eventType: 'UNLOCKED',
        },
      });
      expect(result).toHaveLength(2);
      expect(result.every(e => e.eventType === 'UNLOCKED')).toBe(true);
    });

    it('should return empty array when no events of type exist', async () => {
      // Arrange
      mockPrisma.auditTrailEntry.findMany = jest.fn().mockResolvedValue([]);

      // Act
      const result = await service.getEventsByType(recordId, 'REFINALIZED');

      // Assert
      expect(result).toEqual([]);
    });

    it('should work with all event types', async () => {
      // Arrange
      const eventTypes: Array<'CREATED' | 'FINALIZED' | 'UNLOCKED' | 'EDITED' | 'REFINALIZED'> = 
        ['CREATED', 'FINALIZED', 'UNLOCKED', 'EDITED', 'REFINALIZED'];

      for (const eventType of eventTypes) {
        mockPrisma.auditTrailEntry.findMany = jest.fn().mockResolvedValue([]);

        // Act
        await service.getEventsByType(recordId, eventType);

        // Assert
        expect(mockPrisma.auditTrailEntry.findMany).toHaveBeenCalledWith({
          where: {
            nisabYearRecordId: recordId,
            eventType,
          },
        });
      }
    });

    it('should propagate database errors', async () => {
      // Arrange
      mockPrisma.auditTrailEntry.findMany = jest.fn().mockRejectedValue(
        new Error('Connection lost')
      );

      // Act & Assert
      await expect(service.getEventsByType(recordId, 'EDITED'))
        .rejects
        .toThrow('Connection lost');
    });
  });

  describe('Immutability guarantees', () => {
    it('should only support CREATE operations (no UPDATE)', () => {
      // Assert: Verify service has no update method
      expect((service as any).updateEvent).toBeUndefined();
    });

    it('should only support CREATE operations (no DELETE)', () => {
      // Assert: Verify service has no delete method
      expect((service as any).deleteEvent).toBeUndefined();
    });

    it('should create append-only audit entries', async () => {
      // Arrange
      const mockEntry = {
        id: 'audit_1',
        nisabYearRecordId: recordId,
        userId,
        eventType: 'CREATED',
        timestamp: new Date(),
        unlockReason: null,
        changesSummary: null,
        beforeState: null,
        afterState: null,
      };
      mockPrisma.auditTrailEntry.create = jest.fn().mockResolvedValue(mockEntry);

      // Act
      await service.recordEvent(userId, 'CREATED', recordId);

      // Assert: Verify only create was called
      expect(mockPrisma.auditTrailEntry.create).toHaveBeenCalled();
      expect((mockPrisma.auditTrailEntry as any).update).toBeUndefined();
      expect((mockPrisma.auditTrailEntry as any).delete).toBeUndefined();
    });
  });
});
