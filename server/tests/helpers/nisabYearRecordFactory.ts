/**
 * Test Data Helpers for Nisab Year Record Tests
 * Provides factory functions for creating valid test data
 */

import { Prisma } from '@prisma/client';

/**
 * Generate default Nisab Year Record data for testing
 * All required fields are included with sensible defaults
 */
export function createNisabYearRecordData(
  userId: string,
  overrides: Partial<Prisma.YearlySnapshotCreateInput> = {}
): Prisma.YearlySnapshotUncheckedCreateInput {
  const now = new Date();
  const hijriYear = 1446;
  const hijriMonth = 3;
  const hijriDay = 15;
  
  return {
    userId,
    status: 'DRAFT',
    nisabBasis: 'GOLD',
    
    // Hawl dates (optional but commonly used)
    hawlStartDate: new Date('2025-01-01'),
    hawlStartDateHijri: `${hijriYear}-${hijriMonth.toString().padStart(2, '0')}-${hijriDay.toString().padStart(2, '0')}`,
    hawlCompletionDate: new Date('2025-12-26'), // ~354 days later
    hawlCompletionDateHijri: `${hijriYear + 1}-${hijriMonth.toString().padStart(2, '0')}-${hijriDay.toString().padStart(2, '0')}`,
    nisabThresholdAtStart: '5000.00', // Encrypted value
    
    // Calculation dates
    calculationDate: now,
    gregorianYear: now.getFullYear(),
    gregorianMonth: now.getMonth() + 1,
    gregorianDay: now.getDate(),
    hijriYear,
    hijriMonth,
    hijriDay,
    
    // Financial data (encrypted strings)
    totalWealth: '10000.00',
    totalLiabilities: '1000.00',
    zakatableWealth: '9000.00',
    zakatAmount: '225.00', // 2.5% of zakatable wealth
    
    // Required legacy fields (deprecated but still in schema)
    nisabThreshold: '5000.00', // Deprecated - use nisabThresholdAtStart
    nisabType: 'GOLD', // Deprecated - use nisabBasis
    
    // Methodology
    methodologyUsed: 'standard',
    
    // Breakdown and details (encrypted JSON strings)
    assetBreakdown: JSON.stringify([
      { category: 'cash', amount: 5000, assetIds: [] },
      { category: 'gold', amount: 5000, assetIds: [] },
    ]),
    calculationDetails: JSON.stringify({
      nisabThreshold: 5000,
      nisabBasis: 'GOLD',
      zakatRate: 0.025,
      deductions: { liabilities: 1000, exemptAssets: 0 },
      methodology: 'standard',
    }),
    
    // Optional fields
    userNotes: null,
    isPrimary: false,
    finalizedAt: null,
    
    // Apply any overrides
    ...overrides,
  };
}

/**
 * Create multiple Nisab Year Records with sequential dates
 */
export function createMultipleRecords(
  userId: string,
  count: number,
  baseOverrides: Partial<Prisma.YearlySnapshotCreateInput> = {}
): Prisma.YearlySnapshotUncheckedCreateInput[] {
  return Array.from({ length: count }, (_, index) => {
    const monthsAgo = count - index - 1;
    const calculationDate = new Date();
    calculationDate.setMonth(calculationDate.getMonth() - monthsAgo);
    
    return createNisabYearRecordData(userId, {
      ...baseOverrides,
      calculationDate,
      gregorianYear: calculationDate.getFullYear(),
      gregorianMonth: calculationDate.getMonth() + 1,
      gregorianDay: calculationDate.getDate(),
    });
  });
}

/**
 * Create a finalized record
 */
export function createFinalizedRecord(
  userId: string,
  overrides: Partial<Prisma.YearlySnapshotCreateInput> = {}
): Prisma.YearlySnapshotUncheckedCreateInput {
  return createNisabYearRecordData(userId, {
    status: 'FINALIZED',
    finalizedAt: new Date(),
    ...overrides,
  });
}

/**
 * Create an unlocked record
 */
export function createUnlockedRecord(
  userId: string,
  overrides: Partial<Prisma.YearlySnapshotCreateInput> = {}
): Prisma.YearlySnapshotUncheckedCreateInput {
  return createNisabYearRecordData(userId, {
    status: 'UNLOCKED',
    finalizedAt: new Date(Date.now() - 86400000), // Finalized yesterday
    ...overrides,
  });
}
