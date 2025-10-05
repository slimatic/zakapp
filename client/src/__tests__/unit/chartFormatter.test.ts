/**
 * Unit Tests for chartFormatter utility
 * Tests data transformation for Recharts visualization
 */

import {
  formatWealthTrend,
  formatZakatTrend,
  formatPaymentDistribution,
  formatYearlyComparison,
  formatWealthVsZakat,
  formatAssetComposition,
  formatPaymentCompletion,
  formatCategoryName,
  formatAssetTypeName,
  CATEGORY_COLORS
} from '../../utils/chartFormatter';
import type { YearlySnapshot, PaymentRecord } from '@zakapp/shared/types/tracking';

describe('chartFormatter utility', () => {
  const mockSnapshots: YearlySnapshot[] = [
    {
      id: 'snap-1',
      userId: 'user-123',
      calculationDate: new Date('2022-06-15'),
      gregorianYear: 2022,
      gregorianMonth: 6,
      gregorianDay: 15,
      hijriYear: 1444,
      hijriMonth: 11,
      hijriDay: 15,
      totalWealth: 100000,
      totalLiabilities: 10000,
      zakatableWealth: 90000,
      zakatAmount: 2250,
      methodologyUsed: 'Standard',
      nisabThreshold: 85000,
      nisabType: 'gold',
      status: 'finalized',
      assetBreakdown: {
        cash: 40000,
        gold: 20000,
        investments: 30000,
        businessAssets: 10000
      },
      calculationDetails: {},
      userNotes: null,
      isPrimary: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'snap-2',
      userId: 'user-123',
      calculationDate: new Date('2023-06-15'),
      gregorianYear: 2023,
      gregorianMonth: 6,
      gregorianDay: 15,
      hijriYear: 1445,
      hijriMonth: 11,
      hijriDay: 25,
      totalWealth: 125000,
      totalLiabilities: 15000,
      zakatableWealth: 110000,
      zakatAmount: 2750,
      methodologyUsed: 'Standard',
      nisabThreshold: 85000,
      nisabType: 'gold',
      status: 'finalized',
      assetBreakdown: {
        cash: 50000,
        gold: 25000,
        investments: 40000,
        businessAssets: 10000
      },
      calculationDetails: {},
      userNotes: null,
      isPrimary: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'snap-3',
      userId: 'user-123',
      calculationDate: new Date('2024-06-15'),
      gregorianYear: 2024,
      gregorianMonth: 6,
      gregorianDay: 15,
      hijriYear: 1446,
      hijriMonth: 12,
      hijriDay: 8,
      totalWealth: 150000,
      totalLiabilities: 20000,
      zakatableWealth: 130000,
      zakatAmount: 3250,
      methodologyUsed: 'Standard',
      nisabThreshold: 85000,
      nisabType: 'gold',
      status: 'finalized',
      assetBreakdown: {
        cash: 60000,
        gold: 30000,
        investments: 50000,
        businessAssets: 10000
      },
      calculationDetails: {},
      userNotes: null,
      isPrimary: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockPayments: PaymentRecord[] = [
    {
      id: 'pay-1',
      userId: 'user-123',
      snapshotId: 'snap-3',
      amount: 1000,
      paymentDate: new Date('2024-07-01'),
      recipientName: 'Recipient 1',
      recipientType: 'individual',
      recipientCategory: 'fakir',
      notes: 'Payment 1',
      receiptReference: 'RCPT-001',
      paymentMethod: 'cash',
      status: 'verified',
      currency: 'USD',
      exchangeRate: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'pay-2',
      userId: 'user-123',
      snapshotId: 'snap-3',
      amount: 1500,
      paymentDate: new Date('2024-08-01'),
      recipientName: 'Recipient 2',
      recipientType: 'organization',
      recipientCategory: 'miskin',
      notes: 'Payment 2',
      receiptReference: 'RCPT-002',
      paymentMethod: 'bank_transfer',
      status: 'recorded',
      currency: 'USD',
      exchangeRate: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'pay-3',
      userId: 'user-123',
      snapshotId: 'snap-3',
      amount: 750,
      paymentDate: new Date('2024-09-01'),
      recipientName: 'Recipient 3',
      recipientType: 'individual',
      recipientCategory: 'riqab',
      notes: 'Payment 3',
      receiptReference: 'RCPT-003',
      paymentMethod: 'online',
      status: 'verified',
      currency: 'USD',
      exchangeRate: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  describe('formatWealthTrend', () => {
    it('should format wealth trend data for time series chart', () => {
      const result = formatWealthTrend(mockSnapshots);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('wealth');
      expect(result[0].wealth).toBe(100000);
      expect(result[1].wealth).toBe(125000);
      expect(result[2].wealth).toBe(150000);
    });

    it('should sort data by date ascending', () => {
      const unsorted = [mockSnapshots[2], mockSnapshots[0], mockSnapshots[1]];
      const result = formatWealthTrend(unsorted);

      expect(result[0].date).toContain('2022');
      expect(result[1].date).toContain('2023');
      expect(result[2].date).toContain('2024');
    });

    it('should format dates correctly', () => {
      const result = formatWealthTrend(mockSnapshots);

      expect(result[0].date).toMatch(/Jun \d{4}/);
    });

    it('should handle empty snapshots array', () => {
      const result = formatWealthTrend([]);

      expect(result).toEqual([]);
    });

    it('should handle single snapshot', () => {
      const result = formatWealthTrend([mockSnapshots[0]]);

      expect(result).toHaveLength(1);
      expect(result[0].wealth).toBe(100000);
    });
  });

  describe('formatZakatTrend', () => {
    it('should format Zakat trend data for time series chart', () => {
      const result = formatZakatTrend(mockSnapshots);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('zakat');
      expect(result[0].zakat).toBe(2250);
      expect(result[1].zakat).toBe(2750);
      expect(result[2].zakat).toBe(3250);
    });

    it('should sort data by date ascending', () => {
      const unsorted = [mockSnapshots[1], mockSnapshots[2], mockSnapshots[0]];
      const result = formatZakatTrend(unsorted);

      expect(result[0].date).toContain('2022');
      expect(result[1].date).toContain('2023');
      expect(result[2].date).toContain('2024');
    });

    it('should handle empty snapshots array', () => {
      const result = formatZakatTrend([]);

      expect(result).toEqual([]);
    });
  });

  describe('formatPaymentDistribution', () => {
    it('should format payment distribution by category', () => {
      const result = formatPaymentDistribution(mockPayments);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('value');
      expect(result[0]).toHaveProperty('color');
    });

    it('should group payments by category', () => {
      const result = formatPaymentDistribution(mockPayments);

      const fakirPayment = result.find(r => r.name.toLowerCase().includes('fakir'));
      const miskinPayment = result.find(r => r.name.toLowerCase().includes('miskin'));
      const riqabPayment = result.find(r => r.name.toLowerCase().includes('riqab'));

      expect(fakirPayment?.value).toBe(1000);
      expect(miskinPayment?.value).toBe(1500);
      expect(riqabPayment?.value).toBe(750);
    });

    it('should assign colors from CATEGORY_COLORS', () => {
      const result = formatPaymentDistribution(mockPayments);

      result.forEach(item => {
        expect(item.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('should handle empty payments array', () => {
      const result = formatPaymentDistribution([]);

      expect(result).toEqual([]);
    });

    it('should handle single payment', () => {
      const result = formatPaymentDistribution([mockPayments[0]]);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(1000);
    });

    it('should aggregate multiple payments to same category', () => {
      const duplicatePayments = [
        mockPayments[0],
        { ...mockPayments[0], id: 'pay-4', amount: 500 }
      ];

      const result = formatPaymentDistribution(duplicatePayments);
      const fakirTotal = result.find(r => r.name.toLowerCase().includes('fakir'));

      expect(fakirTotal?.value).toBe(1500); // 1000 + 500
    });
  });

  describe('formatYearlyComparison', () => {
    it('should format yearly comparison for wealth metric', () => {
      const result = formatYearlyComparison(mockSnapshots, 'wealth');

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('year');
      expect(result[0]).toHaveProperty('value');
      expect(result[0].year).toBe('2022');
      expect(result[0].value).toBe(100000);
    });

    it('should format yearly comparison for zakat metric', () => {
      const result = formatYearlyComparison(mockSnapshots, 'zakat');

      expect(result[0].value).toBe(2250);
      expect(result[1].value).toBe(2750);
      expect(result[2].value).toBe(3250);
    });

    it('should sort by year ascending', () => {
      const unsorted = [mockSnapshots[2], mockSnapshots[0], mockSnapshots[1]];
      const result = formatYearlyComparison(unsorted, 'wealth');

      expect(result[0].year).toBe('2022');
      expect(result[1].year).toBe('2023');
      expect(result[2].year).toBe('2024');
    });

    it('should handle empty snapshots array', () => {
      const result = formatYearlyComparison([], 'wealth');

      expect(result).toEqual([]);
    });

    it('should default to wealth metric if not specified', () => {
      const result = formatYearlyComparison(mockSnapshots);

      expect(result[0].value).toBe(100000); // Total wealth
    });
  });

  describe('formatWealthVsZakat', () => {
    it('should format wealth vs zakat comparison', () => {
      const result = formatWealthVsZakat(mockSnapshots);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('wealth');
      expect(result[0]).toHaveProperty('zakat');
    });

    it('should include both wealth and zakat values', () => {
      const result = formatWealthVsZakat(mockSnapshots);

      expect(result[0].wealth).toBe(100000);
      expect(result[0].zakat).toBe(2250);
      expect(result[1].wealth).toBe(125000);
      expect(result[1].zakat).toBe(2750);
    });

    it('should sort by date ascending', () => {
      const unsorted = [mockSnapshots[1], mockSnapshots[2], mockSnapshots[0]];
      const result = formatWealthVsZakat(unsorted);

      expect(result[0].date).toContain('2022');
      expect(result[1].date).toContain('2023');
      expect(result[2].date).toContain('2024');
    });

    it('should handle empty snapshots array', () => {
      const result = formatWealthVsZakat([]);

      expect(result).toEqual([]);
    });
  });

  describe('formatAssetComposition', () => {
    it('should format asset composition for pie chart', () => {
      const assetBreakdown = mockSnapshots[0].assetBreakdown!;
      const result = formatAssetComposition(assetBreakdown);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('value');
      expect(result[0]).toHaveProperty('color');
    });

    it('should include all asset types from breakdown', () => {
      const assetBreakdown = {
        cash: 40000,
        gold: 20000,
        investments: 30000,
        businessAssets: 10000
      };
      const result = formatAssetComposition(assetBreakdown);

      expect(result).toHaveLength(4);
      expect(result.find(r => r.name.toLowerCase().includes('cash'))?.value).toBe(40000);
      expect(result.find(r => r.name.toLowerCase().includes('gold'))?.value).toBe(20000);
      expect(result.find(r => r.name.toLowerCase().includes('investment'))?.value).toBe(30000);
      expect(result.find(r => r.name.toLowerCase().includes('business'))?.value).toBe(10000);
    });

    it('should exclude zero-value assets', () => {
      const assetBreakdown = {
        cash: 40000,
        gold: 0,
        investments: 30000
      };
      const result = formatAssetComposition(assetBreakdown);

      expect(result).toHaveLength(2);
      expect(result.find(r => r.name.toLowerCase().includes('gold'))).toBeUndefined();
    });

    it('should handle empty asset breakdown', () => {
      const result = formatAssetComposition({});

      expect(result).toEqual([]);
    });

    it('should assign unique colors to each asset type', () => {
      const assetBreakdown = mockSnapshots[0].assetBreakdown!;
      const result = formatAssetComposition(assetBreakdown);

      const colors = result.map(r => r.color);
      const uniqueColors = new Set(colors);

      expect(uniqueColors.size).toBe(colors.length);
    });
  });

  describe('formatPaymentCompletion', () => {
    it('should format payment completion for bar chart', () => {
      const result = formatPaymentCompletion(mockSnapshots, mockPayments);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('year');
      expect(result[0]).toHaveProperty('paid');
      expect(result[0]).toHaveProperty('due');
    });

    it('should calculate paid and due amounts correctly', () => {
      const result = formatPaymentCompletion(mockSnapshots, mockPayments);

      // 2024 snapshot has 3 payments totaling 3250
      const currentYear = result.find(r => r.year === '2024');
      expect(currentYear?.paid).toBe(3250); // sum of mockPayments
      expect(currentYear?.due).toBe(3250); // zakatAmount
    });

    it('should handle years with no payments', () => {
      const result = formatPaymentCompletion(mockSnapshots, mockPayments);

      const year2022 = result.find(r => r.year === '2022');
      expect(year2022?.paid).toBe(0);
      expect(year2022?.due).toBe(2250);
    });

    it('should sort by year ascending', () => {
      const unsorted = [mockSnapshots[2], mockSnapshots[0], mockSnapshots[1]];
      const result = formatPaymentCompletion(unsorted, mockPayments);

      expect(result[0].year).toBe('2022');
      expect(result[1].year).toBe('2023');
      expect(result[2].year).toBe('2024');
    });

    it('should handle empty payments array', () => {
      const result = formatPaymentCompletion(mockSnapshots, []);

      expect(result[0].paid).toBe(0);
      expect(result[1].paid).toBe(0);
      expect(result[2].paid).toBe(0);
    });

    it('should handle empty snapshots array', () => {
      const result = formatPaymentCompletion([], mockPayments);

      expect(result).toEqual([]);
    });
  });

  describe('formatCategoryName', () => {
    it('should format category names correctly', () => {
      expect(formatCategoryName('fakir')).toBe('Al-Fuqara (The Poor)');
      expect(formatCategoryName('miskin')).toBe('Al-Masakin (The Needy)');
      expect(formatCategoryName('amil')).toBe('Al-Amileen (Collectors)');
      expect(formatCategoryName('muallaf')).toBe('Al-Muallafatu Qulubuhum (New Muslims)');
      expect(formatCategoryName('riqab')).toBe('Ar-Riqab (Freeing Slaves)');
      expect(formatCategoryName('gharim')).toBe('Al-Gharimeen (Debtors)');
      expect(formatCategoryName('fisabilillah')).toBe('Fi Sabilillah (In the Way of Allah)');
      expect(formatCategoryName('ibnus_sabil')).toBe('Ibn As-Sabil (Travelers)');
    });

    it('should handle unknown category', () => {
      expect(formatCategoryName('unknown' as any)).toBe('Other');
    });

    it('should handle case insensitivity', () => {
      expect(formatCategoryName('FAKIR' as any)).toBe('Al-Fuqara (The Poor)');
      expect(formatCategoryName('Miskin' as any)).toBe('Al-Masakin (The Needy)');
    });
  });

  describe('formatAssetTypeName', () => {
    it('should format asset type names correctly', () => {
      expect(formatAssetTypeName('cash')).toBe('Cash & Bank Accounts');
      expect(formatAssetTypeName('gold')).toBe('Gold & Precious Metals');
      expect(formatAssetTypeName('silver')).toBe('Silver');
      expect(formatAssetTypeName('cryptocurrency')).toBe('Cryptocurrency');
      expect(formatAssetTypeName('investments')).toBe('Investments & Stocks');
      expect(formatAssetTypeName('businessAssets')).toBe('Business Assets');
      expect(formatAssetTypeName('realEstate')).toBe('Real Estate (for trade)');
      expect(formatAssetTypeName('debts')).toBe('Debts Owed to You');
    });

    it('should handle unknown asset type', () => {
      expect(formatAssetTypeName('unknown' as any)).toBe('Other Assets');
    });

    it('should handle case variations', () => {
      expect(formatAssetTypeName('CASH' as any)).toBe('Cash & Bank Accounts');
      expect(formatAssetTypeName('Gold' as any)).toBe('Gold & Precious Metals');
    });
  });

  describe('CATEGORY_COLORS constant', () => {
    it('should have colors for all 8 Islamic categories', () => {
      expect(CATEGORY_COLORS).toHaveProperty('fakir');
      expect(CATEGORY_COLORS).toHaveProperty('miskin');
      expect(CATEGORY_COLORS).toHaveProperty('amil');
      expect(CATEGORY_COLORS).toHaveProperty('muallaf');
      expect(CATEGORY_COLORS).toHaveProperty('riqab');
      expect(CATEGORY_COLORS).toHaveProperty('gharim');
      expect(CATEGORY_COLORS).toHaveProperty('fisabilillah');
      expect(CATEGORY_COLORS).toHaveProperty('ibnus_sabil');
    });

    it('should have valid hex color codes', () => {
      Object.values(CATEGORY_COLORS).forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('should have unique colors for each category', () => {
      const colors = Object.values(CATEGORY_COLORS);
      const uniqueColors = new Set(colors);

      expect(uniqueColors.size).toBe(colors.length);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle snapshots with missing asset breakdown', () => {
      const snapshotNoAssets = { ...mockSnapshots[0], assetBreakdown: undefined };
      const result = formatWealthTrend([snapshotNoAssets]);

      expect(result).toHaveLength(1);
      expect(result[0].wealth).toBe(100000);
    });

    it('should handle negative values gracefully', () => {
      const negativeSnapshot = {
        ...mockSnapshots[0],
        totalWealth: -1000,
        zakatAmount: 0
      };

      const result = formatWealthTrend([negativeSnapshot]);

      expect(result[0].wealth).toBe(-1000);
    });

    it('should handle zero values', () => {
      const zeroSnapshot = {
        ...mockSnapshots[0],
        totalWealth: 0,
        zakatAmount: 0
      };

      const result = formatWealthVsZakat([zeroSnapshot]);

      expect(result[0].wealth).toBe(0);
      expect(result[0].zakat).toBe(0);
    });

    it('should handle very large numbers', () => {
      const largeSnapshot = {
        ...mockSnapshots[0],
        totalWealth: 10000000,
        zakatAmount: 250000
      };

      const result = formatWealthTrend([largeSnapshot]);

      expect(result[0].wealth).toBe(10000000);
    });
  });

  describe('integration scenarios', () => {
    it('should format complete dashboard data', () => {
      const wealthTrend = formatWealthTrend(mockSnapshots);
      const zakatTrend = formatZakatTrend(mockSnapshots);
      const paymentDist = formatPaymentDistribution(mockPayments);
      const yearlyComp = formatYearlyComparison(mockSnapshots, 'wealth');

      expect(wealthTrend).toHaveLength(3);
      expect(zakatTrend).toHaveLength(3);
      expect(paymentDist.length).toBeGreaterThan(0);
      expect(yearlyComp).toHaveLength(3);
    });

    it('should handle multi-year analysis', () => {
      const comparison = formatYearlyComparison(mockSnapshots, 'wealth');
      const completion = formatPaymentCompletion(mockSnapshots, mockPayments);

      expect(comparison).toHaveLength(3);
      expect(completion).toHaveLength(3);

      // Verify wealth trend
      expect(comparison[0].value).toBe(100000);
      expect(comparison[1].value).toBe(125000);
      expect(comparison[2].value).toBe(150000);
    });

    it('should support asset breakdown visualization', () => {
      const assetComp = formatAssetComposition(mockSnapshots[2].assetBreakdown!);

      expect(assetComp.length).toBeGreaterThan(0);
      expect(assetComp.reduce((sum, item) => sum + item.value, 0)).toBe(150000);
    });
  });
});
