/**
 * T022: Unit Tests for HawlTrackingService
 * 
 * Tests Hawl (354-day lunar year) detection, completion tracking,
 * Nisab interruption detection, and Hijri date calculations.
 * 
 * @see specs/008-nisab-year-record/research.md - Hijri calendar library selection
 * @see specs/008-nisab-year-record/data-model.md - HawlTracker virtual entity
 */

import { HawlTrackingService } from '../../../src/services/hawlTrackingService';
import { PrismaClient } from '@prisma/client';
import moment from 'moment-hijri';

jest.mock('@prisma/client');

describe('HawlTrackingService', () => {
  let service: HawlTrackingService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = {
      nisabYearRecord: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    } as any;

    service = new HawlTrackingService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('calculateHawlCompletionDate', () => {
    it('should add 354 days to start date for lunar year', () => {
      // Arrange
      const startDate = new Date('2024-01-01T00:00:00Z');

      // Act
      const completionDate = service.calculateHawlCompletionDate(startDate);

      // Assert
      const daysDiff = Math.floor(
        (completionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBe(354);
    });

    it('should handle leap year edge cases correctly', () => {
      // Arrange - Start in leap year
      const startDate = new Date('2024-02-29T00:00:00Z');

      // Act
      const completionDate = service.calculateHawlCompletionDate(startDate);

      // Assert
      expect(completionDate).toBeInstanceOf(Date);
      const daysDiff = Math.floor(
        (completionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBe(354);
    });
  });

  describe('convertToHijriDate', () => {
    it('should convert Gregorian date to Hijri format', () => {
      // Arrange
      const gregorianDate = new Date('2024-03-15T00:00:00Z');

      // Act
      const hijriString = service.convertToHijriDate(gregorianDate);

      // Assert
      expect(hijriString).toMatch(/^\d{4}-\d{2}-\d{2}$/); // Format: YYYY-MM-DD
      const hijriMoment = moment(gregorianDate);
      expect(hijriString).toBe(hijriMoment.format('iYYYY-iMM-iDD'));
    });
  });

  describe('detectNisabAchievement', () => {
    it('should detect when aggregate wealth first reaches Nisab', async () => {
      // Arrange
      const userId = 'user1';
      const currentWealth = 6000; // Above Nisab
      const nisabThreshold = 5293; // Gold-based
      
      mockPrisma.nisabYearRecord.findFirst.mockResolvedValue(null); // No active Hawl

      // Act
      const result = await service.detectNisabAchievement(
        userId,
        currentWealth,
        nisabThreshold,
        'gold'
      );

      // Assert
      expect(result).toEqual({
        hawlStarted: true,
        hawlStartDate: expect.any(Date),
        hawlCompletionDate: expect.any(Date),
        nisabBasis: 'gold',
      });
      expect(mockPrisma.nisabYearRecord.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          status: 'DRAFT',
          hawlStartDate: expect.any(Date),
          nisabBasis: 'gold',
        }),
      });
    });

    it('should not start new Hawl if active DRAFT already exists', async () => {
      // Arrange
      const userId = 'user1';
      mockPrisma.nisabYearRecord.findFirst.mockResolvedValue({
        id: 'record1',
        userId,
        status: 'DRAFT',
        hawlStartDate: new Date('2024-01-01'),
        hawlCompletionDate: new Date('2024-12-20'),
      } as any);

      // Act
      const result = await service.detectNisabAchievement(
        userId,
        7000,
        5293,
        'gold'
      );

      // Assert
      expect(result).toEqual({
        hawlStarted: false,
        existingHawl: expect.objectContaining({
          id: 'record1',
        }),
      });
      expect(mockPrisma.nisabYearRecord.create).not.toHaveBeenCalled();
    });

    it('should not start Hawl if wealth is below Nisab', async () => {
      // Arrange
      const userId = 'user1';
      const currentWealth = 4000; // Below Nisab
      const nisabThreshold = 5293;
      
      mockPrisma.nisabYearRecord.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.detectNisabAchievement(
        userId,
        currentWealth,
        nisabThreshold,
        'gold'
      );

      // Assert
      expect(result).toEqual({
        hawlStarted: false,
        reason: 'Wealth below Nisab threshold',
      });
      expect(mockPrisma.nisabYearRecord.create).not.toHaveBeenCalled();
    });
  });

  describe('checkHawlInterruption', () => {
    it('should detect Hawl interruption when wealth drops below Nisab', async () => {
      // Arrange
      const userId = 'user1';
      const currentWealth = 4500; // Dropped below Nisab
      const nisabThreshold = 5293;

      mockPrisma.nisabYearRecord.findFirst.mockResolvedValue({
        id: 'record1',
        userId,
        status: 'DRAFT',
        hawlStartDate: new Date('2024-01-01'),
        hawlCompletionDate: new Date('2024-12-20'),
        nisabThresholdAtStart: '5293.00', // Encrypted in real scenario
      } as any);

      // Act
      const result = await service.checkHawlInterruption(
        userId,
        currentWealth,
        nisabThreshold
      );

      // Assert
      expect(result).toEqual({
        interrupted: true,
        recordId: 'record1',
        interruptionDate: expect.any(Date),
      });
    });

    it('should not interrupt if wealth remains above Nisab', async () => {
      // Arrange
      const userId = 'user1';
      const currentWealth = 6500; // Still above Nisab
      const nisabThreshold = 5293;

      mockPrisma.nisabYearRecord.findFirst.mockResolvedValue({
        id: 'record1',
        userId,
        status: 'DRAFT',
        hawlStartDate: new Date('2024-01-01'),
      } as any);

      // Act
      const result = await service.checkHawlInterruption(
        userId,
        currentWealth,
        nisabThreshold
      );

      // Assert
      expect(result).toEqual({
        interrupted: false,
      });
    });

    it('should return not interrupted if no active Hawl exists', async () => {
      // Arrange
      mockPrisma.nisabYearRecord.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.checkHawlInterruption('user1', 3000, 5293);

      // Assert
      expect(result).toEqual({
        interrupted: false,
        reason: 'No active Hawl to interrupt',
      });
    });
  });

  describe('getActiveHawlStatus', () => {
    it('should return active Hawl with days remaining', async () => {
      // Arrange
      const userId = 'user1';
      const today = new Date();
      const completionDate = new Date(today.getTime() + 50 * 24 * 60 * 60 * 1000); // 50 days from now

      mockPrisma.nisabYearRecord.findFirst.mockResolvedValue({
        id: 'record1',
        userId,
        status: 'DRAFT',
        hawlStartDate: new Date(today.getTime() - 304 * 24 * 60 * 60 * 1000),
        hawlCompletionDate: completionDate,
        nisabBasis: 'gold',
      } as any);

      // Act
      const result = await service.getActiveHawlStatus(userId);

      // Assert
      expect(result).toEqual({
        active: true,
        recordId: 'record1',
        hawlStartDate: expect.any(Date),
        hawlCompletionDate: completionDate,
        daysRemaining: expect.any(Number),
        nisabBasis: 'gold',
      });
      expect(result.daysRemaining).toBeGreaterThanOrEqual(49);
      expect(result.daysRemaining).toBeLessThanOrEqual(51);
    });

    it('should return completed status if Hawl period has passed', async () => {
      // Arrange
      const userId = 'user1';
      const completionDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

      mockPrisma.nisabYearRecord.findFirst.mockResolvedValue({
        id: 'record1',
        userId,
        status: 'DRAFT',
        hawlCompletionDate: completionDate,
      } as any);

      // Act
      const result = await service.getActiveHawlStatus(userId);

      // Assert
      expect(result).toEqual({
        active: true,
        completed: true,
        readyForFinalization: true,
        recordId: 'record1',
        daysRemaining: 0,
      });
    });

    it('should return inactive if no DRAFT record exists', async () => {
      // Arrange
      mockPrisma.nisabYearRecord.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.getActiveHawlStatus('user1');

      // Assert
      expect(result).toEqual({
        active: false,
      });
    });
  });

  describe('validateHawlCompletionDate', () => {
    it('should accept completion date exactly 354 days after start', () => {
      // Arrange
      const startDate = new Date('2024-01-01T00:00:00Z');
      const completionDate = new Date('2024-12-20T00:00:00Z'); // 354 days later

      // Act
      const isValid = service.validateHawlCompletionDate(startDate, completionDate);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should accept completion date within ±5 days tolerance', () => {
      // Arrange
      const startDate = new Date('2024-01-01T00:00:00Z');
      const completionDate = new Date('2024-12-23T00:00:00Z'); // 357 days (within tolerance)

      // Act
      const isValid = service.validateHawlCompletionDate(startDate, completionDate);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject completion date more than 5 days off', () => {
      // Arrange
      const startDate = new Date('2024-01-01T00:00:00Z');
      const completionDate = new Date('2024-12-30T00:00:00Z'); // 364 days (too far)

      // Act
      const isValid = service.validateHawlCompletionDate(startDate, completionDate);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should reject completion date before start date', () => {
      // Arrange
      const startDate = new Date('2024-01-01T00:00:00Z');
      const completionDate = new Date('2023-12-01T00:00:00Z');

      // Act
      const isValid = service.validateHawlCompletionDate(startDate, completionDate);

      // Assert
      expect(isValid).toBe(false);
    });
  });
});
