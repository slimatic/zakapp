/**
 * Copyright (c) 2024-2026 ZakApp Contributors
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

import { vi, type Mock } from 'vitest';
import { AuditTrailService } from '../../../src/services/auditTrailService';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/services/EncryptionService';

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      auditTrailEntry: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
    })),
  };
});
vi.mock('../../../src/services/EncryptionService');

describe('AuditTrailService', () => {
  let service: AuditTrailService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      auditTrailEntry: {
        create: vi.fn().mockResolvedValue({ id: 'audit1' } as any),
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
    };

    service = new AuditTrailService(mockPrisma as any);

    // Mock static EncryptionService
    vi.mocked(EncryptionService.encrypt).mockReturnValue({ encryptedData: 'enc', iv: 'iv' } as any);
    vi.mocked(EncryptionService.decrypt).mockReturnValue('decrypted');

    vi.clearAllMocks();
  });

  describe('recordEvent', () => {
    it('should record CREATED event for new Nisab Year Record', async () => {
      const userId = 'user1';
      const eventType = 'CREATED';
      const recordId = 'record1';
      const details = {
        afterState: { status: 'DRAFT' }
      };

      const result = await service.recordEvent(userId, eventType as any, recordId, details);

      expect(mockPrisma.auditTrailEntry.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          userId,
          eventType,
          nisabYearRecordId: recordId,
        })
      }));
      expect(result).toBeDefined();
    });

    it('should enforce minimum 10 characters for unlock reason', async () => {
      const userId = 'user1';
      const eventType = 'UNLOCKED';
      const recordId = 'record1';
      const details = { reason: 'Too short' };

      await expect(service.recordEvent(userId, eventType as any, recordId, details)).rejects.toThrow(
        'Unlock reason must be at least 10 characters'
      );
    });
  });

  describe('getAuditTrail', () => {
    it('should retrieve audit trail for a Nisab Year Record', async () => {
      const recordId = 'record1';
      mockPrisma.auditTrailEntry.findMany.mockResolvedValue([
        { id: 'a1', eventType: 'CREATED', timestamp: new Date() }
      ]);

      const result = await service.getAuditTrail(recordId);

      expect(result).toHaveLength(1);
      expect(mockPrisma.auditTrailEntry.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { nisabYearRecordId: recordId }
      }));
    });
  });

  describe('getUserAuditTrail', () => {
    it('should retrieve activity history for a user', async () => {
      const userId = 'user1';
      mockPrisma.auditTrailEntry.findMany.mockResolvedValue([]);
      mockPrisma.auditTrailEntry.count.mockResolvedValue(0);

      const result = await service.getUserAuditTrail(userId);

      expect(result.entries).toBeDefined();
      expect(mockPrisma.auditTrailEntry.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId }
      }));
    });
  });
});
