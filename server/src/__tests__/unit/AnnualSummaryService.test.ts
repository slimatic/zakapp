/**
 * Unit Tests for AnnualSummaryService
 * Tests summary generation and comparative analysis calculations
 */

import { AnnualSummaryService } from '../../services/AnnualSummaryService';
import { AnnualSummaryModel } from '../../models/AnnualSummary';
import { YearlySnapshotModel } from '../../models/YearlySnapshot';
import { PaymentRecordModel } from '../../models/PaymentRecord';

// Mock the models
jest.mock('../../models/AnnualSummary');
jest.mock('../../models/YearlySnapshot');
jest.mock('../../models/PaymentRecord');

describe('AnnualSummaryService', () => {
  let service: AnnualSummaryService;
  const mockUserId = 'test-user-123';
  const mockSnapshotId = 'snapshot-123';

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters!!';
    service = new AnnualSummaryService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  describe('constructor', () => {
    it('should throw error if ENCRYPTION_KEY is not set', () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => new AnnualSummaryService()).toThrow('ENCRYPTION_KEY environment variable is required');
    });
  });

  describe('generateSummary', () => {
    const mockSnapshot = {
      id: mockSnapshotId,
      userId: mockUserId,
      gregorianYear: 2024,
      hijriYear: 1446,
      totalWealth: 150000,
      totalLiabilities: 20000,
      zakatableWealth: 130000,
      zakatAmount: 3250,
      methodologyUsed: 'Standard',
      nisabThreshold: 85000,
      calculationDate: new Date('2024-06-15'),
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    };

    const mockPayments = [
      { id: 'pay1', amount: 1000, recipientCategory: 'fakir', recipientType: 'individual' },
      { id: 'pay2', amount: 1500, recipientCategory: 'miskin', recipientType: 'individual' },
      { id: 'pay3', amount: 750, recipientCategory: 'fakir', recipientType: 'organization' }
    ];

    beforeEach(() => {
      (YearlySnapshotModel.findById as jest.Mock).mockResolvedValue(mockSnapshot);
      (PaymentRecordModel.findBySnapshot as jest.Mock).mockResolvedValue(mockPayments);
      (YearlySnapshotModel.findPrimaryByYear as jest.Mock).mockResolvedValue(null);
      (AnnualSummaryModel.createOrUpdate as jest.Mock).mockImplementation(async (data) => ({
        id: 'summary-123',
        ...data
      }));
    });

    it('should throw error if snapshot not found', async () => {
      (YearlySnapshotModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.generateSummary(mockSnapshotId, mockUserId)
      ).rejects.toThrow('Snapshot not found');
    });

    it('should generate summary with correct totals', async () => {
      const result = await service.generateSummary(mockSnapshotId, mockUserId);

      expect(result).toBeDefined();
      expect(YearlySnapshotModel.findById).toHaveBeenCalledWith(mockSnapshotId, mockUserId);
      expect(PaymentRecordModel.findBySnapshot).toHaveBeenCalledWith(mockSnapshotId, mockUserId);
    });

    it('should calculate total paid correctly', async () => {
      await service.generateSummary(mockSnapshotId, mockUserId);

      expect(AnnualSummaryModel.createOrUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          totalZakatPaid: 3250 // sum of all payments
        })
      );
    });

    it('should calculate outstanding Zakat correctly', async () => {
      await service.generateSummary(mockSnapshotId, mockUserId);

      expect(AnnualSummaryModel.createOrUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          outstandingZakat: 0 // 3250 - 3250
        })
      );
    });

    it('should group payments by category', async () => {
      await service.generateSummary(mockSnapshotId, mockUserId);

      const call = (AnnualSummaryModel.createOrUpdate as jest.Mock).mock.calls[0][0];
      const recipientSummary = call.recipientSummary;

      expect(recipientSummary.byCategory).toBeDefined();
      expect(recipientSummary.byCategory).toHaveLength(2); // fakir and miskin

      const fakirCategory = recipientSummary.byCategory.find((c: any) => c.category === 'fakir');
      expect(fakirCategory.count).toBe(2); // pay1 and pay3
      expect(fakirCategory.totalAmount).toBe(1750); // 1000 + 750
    });

    it('should group payments by type', async () => {
      await service.generateSummary(mockSnapshotId, mockUserId);

      const call = (AnnualSummaryModel.createOrUpdate as jest.Mock).mock.calls[0][0];
      const recipientSummary = call.recipientSummary;

      expect(recipientSummary.byType).toBeDefined();

      const individualType = recipientSummary.byType.find((t: any) => t.type === 'individual');
      expect(individualType.count).toBe(2); // pay1 and pay2
      expect(individualType.totalAmount).toBe(2500); // 1000 + 1500

      const orgType = recipientSummary.byType.find((t: any) => t.type === 'organization');
      expect(orgType.count).toBe(1);
      expect(orgType.totalAmount).toBe(750);
    });

    it('should handle zero payments', async () => {
      (PaymentRecordModel.findBySnapshot as jest.Mock).mockResolvedValue([]);

      await service.generateSummary(mockSnapshotId, mockUserId);

      expect(AnnualSummaryModel.createOrUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          totalZakatPaid: 0,
          outstandingZakat: 3250, // full amount outstanding
          numberOfPayments: 0
        })
      );
    });

    it('should include comparative analysis when previous year exists', async () => {
      const previousSnapshot = {
        id: 'prev-snapshot',
        userId: mockUserId,
        gregorianYear: 2023,
        totalWealth: 120000,
        zakatAmount: 3000
      };

      (YearlySnapshotModel.findPrimaryByYear as jest.Mock).mockResolvedValue(previousSnapshot);

      await service.generateSummary(mockSnapshotId, mockUserId);

      const call = (AnnualSummaryModel.createOrUpdate as jest.Mock).mock.calls[0][0];

      expect(call.comparativeAnalysis).toBeDefined();
      expect(call.comparativeAnalysis.previousYear).toBe(2023);
      expect(call.comparativeAnalysis.wealthChange).toBe(30000); // 150000 - 120000
      expect(call.comparativeAnalysis.zakatChange).toBe(250); // 3250 - 3000
    });

    it('should calculate percentage changes correctly', async () => {
      const previousSnapshot = {
        id: 'prev-snapshot',
        userId: mockUserId,
        gregorianYear: 2023,
        totalWealth: 100000,
        zakatAmount: 2500
      };

      (YearlySnapshotModel.findPrimaryByYear as jest.Mock).mockResolvedValue(previousSnapshot);

      await service.generateSummary(mockSnapshotId, mockUserId);

      const call = (AnnualSummaryModel.createOrUpdate as jest.Mock).mock.calls[0][0];
      const analysis = call.comparativeAnalysis;

      // Wealth change: (150000 - 100000) / 100000 = 50%
      expect(analysis.wealthChangePercentage).toBeCloseTo(50, 1);

      // Zakat change: (3250 - 2500) / 2500 = 30%
      expect(analysis.zakatChangePercentage).toBeCloseTo(30, 1);
    });

    it('should handle division by zero in percentage calculations', async () => {
      const previousSnapshot = {
        id: 'prev-snapshot',
        userId: mockUserId,
        gregorianYear: 2023,
        totalWealth: 0,
        zakatAmount: 0
      };

      (YearlySnapshotModel.findPrimaryByYear as jest.Mock).mockResolvedValue(previousSnapshot);

      await service.generateSummary(mockSnapshotId, mockUserId);

      const call = (AnnualSummaryModel.createOrUpdate as jest.Mock).mock.calls[0][0];
      const analysis = call.comparativeAnalysis;

      expect(analysis.wealthChangePercentage).toBe(0);
      expect(analysis.zakatChangePercentage).toBe(0);
    });

    it('should not include comparative analysis for first year', async () => {
      (YearlySnapshotModel.findPrimaryByYear as jest.Mock).mockResolvedValue(null);

      await service.generateSummary(mockSnapshotId, mockUserId);

      const call = (AnnualSummaryModel.createOrUpdate as jest.Mock).mock.calls[0][0];

      expect(call.comparativeAnalysis).toBeUndefined();
    });

    it('should include asset breakdown from snapshot', async () => {
      const snapshotWithAssets = {
        ...mockSnapshot,
        assetBreakdown: {
          cash: 50000,
          gold: 30000,
          investments: 50000,
          businessAssets: 20000
        }
      };

      (YearlySnapshotModel.findById as jest.Mock).mockResolvedValue(snapshotWithAssets);

      await service.generateSummary(mockSnapshotId, mockUserId);

      const call = (AnnualSummaryModel.createOrUpdate as jest.Mock).mock.calls[0][0];

      expect(call.assetBreakdown).toBeDefined();
      expect(call.assetBreakdown.cash).toBe(50000);
    });

    it('should include nisab information', async () => {
      await service.generateSummary(mockSnapshotId, mockUserId);

      const call = (AnnualSummaryModel.createOrUpdate as jest.Mock).mock.calls[0][0];

      expect(call.nisabInfo).toBeDefined();
      expect(call.nisabInfo.threshold).toBe(85000);
      expect(call.nisabInfo.type).toBeDefined();
    });

    it('should calculate correct number of payments', async () => {
      await service.generateSummary(mockSnapshotId, mockUserId);

      expect(AnnualSummaryModel.createOrUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          numberOfPayments: 3
        })
      );
    });

    it('should set correct years', async () => {
      await service.generateSummary(mockSnapshotId, mockUserId);

      expect(AnnualSummaryModel.createOrUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          gregorianYear: 2024,
          hijriYear: 1446
        })
      );
    });

    it('should use methodology from snapshot', async () => {
      await service.generateSummary(mockSnapshotId, mockUserId);

      expect(AnnualSummaryModel.createOrUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          methodologyUsed: 'Standard'
        })
      );
    });
  });

  describe('getSummary', () => {
    it('should retrieve summary by ID', async () => {
      const mockSummary = {
        id: 'summary-123',
        userId: mockUserId,
        snapshotId: mockSnapshotId
      };

      (AnnualSummaryModel.findById as jest.Mock).mockResolvedValue(mockSummary);

      const result = await service.getSummary('summary-123', mockUserId);

      expect(result).toBeDefined();
      expect(AnnualSummaryModel.findById).toHaveBeenCalledWith('summary-123', mockUserId);
    });

    it('should return null if summary not found', async () => {
      (AnnualSummaryModel.findById as jest.Mock).mockResolvedValue(null);

      const result = await service.getSummary('invalid-id', mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('getSummaryBySnapshot', () => {
    it('should retrieve summary by snapshot ID', async () => {
      const mockSummary = {
        id: 'summary-123',
        snapshotId: mockSnapshotId
      };

      (AnnualSummaryModel.findBySnapshot as jest.Mock).mockResolvedValue(mockSummary);

      const result = await service.getSummaryBySnapshot(mockSnapshotId, mockUserId);

      expect(result).toBeDefined();
      expect(AnnualSummaryModel.findBySnapshot).toHaveBeenCalledWith(mockSnapshotId, mockUserId);
    });
  });

  describe('decryptSummaryData', () => {
    it('should handle null summary', async () => {
      const result = await (service as any).decryptSummaryData(null);
      expect(result).toBeNull();
    });

    it('should handle already decrypted objects', async () => {
      const summary = {
        recipientSummary: { byType: [], byCategory: [] },
        assetBreakdown: { cash: 50000 },
        nisabInfo: { threshold: 85000 }
      };

      const result = await (service as any).decryptSummaryData(summary);

      expect(result.recipientSummary).toEqual({ byType: [], byCategory: [] });
      expect(result.assetBreakdown).toEqual({ cash: 50000 });
    });

    it('should preserve non-encrypted fields', async () => {
      const summary = {
        id: 'summary-123',
        userId: mockUserId,
        gregorianYear: 2024,
        recipientSummary: { byType: [], byCategory: [] }
      };

      const result = await (service as any).decryptSummaryData(summary);

      expect(result.id).toBe('summary-123');
      expect(result.userId).toBe(mockUserId);
      expect(result.gregorianYear).toBe(2024);
    });
  });
});
