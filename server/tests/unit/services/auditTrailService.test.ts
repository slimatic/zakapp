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

1|import { vi, type Mock } from 'vitest';
2|import { AuditTrailService } from '../../../src/services/auditTrailService';
3|import { PrismaClient } from '@prisma/client';
4|import { EncryptionService } from '../../../src/services/EncryptionService';
5|
6|vi.mock('@prisma/client', () => {
7|  return {
8|    PrismaClient: vi.fn().mockImplementation(() => ({
9|      auditTrailEntry: {
10|        create: vi.fn(),
11|        findMany: vi.fn(),
12|        count: vi.fn(),
13|      },
14|    })),
15|  };
16|});
17|vi.mock('../../../src/services/EncryptionService');
18|
19|describe('AuditTrailService', () => {
20|  let service: AuditTrailService;
21|  let mockPrisma: any;
22|
23|  beforeEach(() => {
24|    mockPrisma = {
25|      auditTrailEntry: {
26|        create: vi.fn().mockResolvedValue({ id: 'audit1' } as any),
27|        findMany: vi.fn().mockResolvedValue([]),
28|        count: vi.fn().mockResolvedValue(0),
29|      },
30|    };
31|
32|    service = new AuditTrailService(mockPrisma as any);
33|
34|    // Mock static EncryptionService
35|    vi.mocked(EncryptionService.encrypt).mockReturnValue({ encryptedData: 'enc', iv: 'iv' } as any);
36|    vi.mocked(EncryptionService.decrypt).mockReturnValue('decrypted');
37|
38|    vi.clearAllMocks();
39|  });
40|
41|  describe('recordEvent', () => {
42|    it('should record CREATED event for new Nisab Year Record', async () => {
43|      const userId = 'user1';
44|      const eventType = 'CREATED';
45|      const recordId = 'record1';
46|      const details = {
47|        afterState: { status: 'DRAFT' }
48|      };
49|
50|      const result = await service.recordEvent(userId, eventType as any, recordId, details);
51|
52|      expect(mockPrisma.auditTrailEntry.create).toHaveBeenCalledWith(expect.objectContaining({
53|        data: expect.objectContaining({
54|          userId,
55|          eventType,
56|          nisabYearRecordId: recordId,
57|        })
58|      }));
59|      expect(result).toBeDefined();
60|    });
61|
62|    it('should enforce minimum 10 characters for unlock reason', async () => {
63|      const userId = 'user1';
64|      const eventType = 'UNLOCKED';
65|      const recordId = 'record1';
66|      const details = { reason: 'Too short' };
67|
68|      await expect(service.recordEvent(userId, eventType as any, recordId, details)).rejects.toThrow(
69|        'Unlock reason must be at least 10 characters'
70|      );
71|    });
72|  });
73|
74|  describe('getAuditTrail', () => {
75|    it('should retrieve audit trail for a Nisab Year Record', async () => {
76|      const recordId = 'record1';
77|      mockPrisma.auditTrailEntry.findMany.mockResolvedValue([
78|        { id: 'a1', eventType: 'CREATED', timestamp: new Date() }
79|      ]);
80|
81|      const result = await service.getAuditTrail(recordId);
82|
83|      expect(result).toHaveLength(1);
84|      expect(mockPrisma.auditTrailEntry.findMany).toHaveBeenCalledWith(expect.objectContaining({
85|        where: { nisabYearRecordId: recordId }
86|      }));
87|    });
88|  });
89|
90|  describe('getUserAuditTrail', () => {
91|    it('should retrieve activity history for a user', async () => {
92|      const userId = 'user1';
93|      mockPrisma.auditTrailEntry.findMany.mockResolvedValue([]);
94|      mockPrisma.auditTrailEntry.count.mockResolvedValue(0);
95|
96|      const result = await service.getUserAuditTrail(userId);
97|
98|      expect(result.entries).toBeDefined();
99|      expect(mockPrisma.auditTrailEntry.findMany).toHaveBeenCalledWith(expect.objectContaining({
100|        where: { userId }
101|      }));
102|    });
103|  });
104|});
105|