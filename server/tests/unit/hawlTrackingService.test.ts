/**
 * Unit Tests for HawlTrackingService (T022)
 * 
 * Tests Hawl (lunar year) lifecycle management:
 * - Nisab achievement detection
 * - Hawl tracking state calculation
 * - Live Hawl data metrics
 * - Hawl interruption detection
 * - 354-day lunar year calculations
 */

import { HawlTrackingService } from '../../src/services/hawlTrackingService';
import { WealthAggregationService } from '../../src/services/wealthAggregationService';
import { NisabCalculationService } from '../../src/services/nisabCalculationService';
import moment from 'moment';
import 'moment-hijri';

// Mock dependencies
jest.mock('../../src/services/wealthAggregationService');
jest.mock('../../src/services/nisabCalculationService');
jest.mock('../../src/utils/logger');

describe('HawlTrackingService', () => {
  let service: HawlTrackingService;
  let mockWealthService: jest.Mocked<WealthAggregationService>;
  let mockNisabService: jest.Mocked<NisabCalculationService>;

  const HAWL_DURATION_DAYS = 354; // Lunar year

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock instances
    mockWealthService = new WealthAggregationService() as jest.Mocked<WealthAggregationService>;
    mockNisabService = new NisabCalculationService() as jest.Mocked<NisabCalculationService>;

    // Create service with mocked dependencies
    service = new HawlTrackingService(mockWealthService, mockNisabService);
  });

  describe('detectNisabAchievement', () => {
    const userId = 'user_123';
    const mockNisabData = {
      goldPrice: 65.0,
      silverPrice: 0.75,
      goldNisab: 5686.2,
      silverNisab: 459.27,
      selectedNisab: 5686.2,
      basisUsed: 'GOLD' as const,
      currency: 'USD',
      fetchedAt: new Date(),
    };

    it('should detect Nisab achievement when wealth reaches threshold', async () => {
      // Arrange
      const currentWealth = 6000.0; // Above Nisab
      mockNisabService.calculateNisabThreshold = jest.fn().mockResolvedValue(mockNisabData);
      mockNisabService.isAboveNisab = jest.fn().mockReturnValue(true);

      // Act
      const result = await service.detectNisabAchievement(userId, currentWealth, 'GOLD');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.userId).toBe(userId);
      expect(result?.currentWealth).toBe(currentWealth);
      expect(result?.nisabThreshold).toBe(mockNisabData.selectedNisab);
      expect(result?.nisabBasis).toBe('GOLD');
      expect(result?.hawlStartDate).toBeInstanceOf(Date);
      expect(result?.hawlCompletionDate).toBeInstanceOf(Date);
      
      // Verify Hawl duration is ~354 days
      const duration = moment(result?.hawlCompletionDate).diff(
        moment(result?.hawlStartDate),
        'days'
      );
      expect(duration).toBe(HAWL_DURATION_DAYS);
    });

    it('should return null when wealth below Nisab', async () => {
      // Arrange
      const currentWealth = 5000.0; // Below Nisab
      mockNisabService.calculateNisabThreshold = jest.fn().mockResolvedValue(mockNisabData);
      mockNisabService.isAboveNisab = jest.fn().mockReturnValue(false);

      // Act
      const result = await service.detectNisabAchievement(userId, currentWealth, 'GOLD');

      // Assert
      expect(result).toBeNull();
    });

    it('should use silver Nisab when nisabBasis is SILVER', async () => {
      // Arrange
      const silverNisabData = { ...mockNisabData, selectedNisab: 459.27, basisUsed: 'SILVER' as const };
      mockNisabService.calculateNisabThreshold = jest.fn().mockResolvedValue(silverNisabData);
      mockNisabService.isAboveNisab = jest.fn().mockReturnValue(true);

      // Act
      const result = await service.detectNisabAchievement(userId, 500.0, 'SILVER');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.nisabBasis).toBe('SILVER');
      expect(mockNisabService.calculateNisabThreshold).toHaveBeenCalledWith('USD', 'SILVER');
    });

    it('should include timestamp of achievement', async () => {
      // Arrange
      const currentWealth = 6000.0;
      const beforeTime = new Date();
      mockNisabService.calculateNisabThreshold = jest.fn().mockResolvedValue(mockNisabData);
      mockNisabService.isAboveNisab = jest.fn().mockReturnValue(true);

      // Act
      const result = await service.detectNisabAchievement(userId, currentWealth, 'GOLD');
      const afterTime = new Date();

      // Assert
      expect(result?.timestamp).toBeInstanceOf(Date);
      expect(result?.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(result?.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should propagate errors from Nisab calculation', async () => {
      // Arrange
      mockNisabService.calculateNisabThreshold = jest.fn().mockRejectedValue(
        new Error('API unavailable')
      );

      // Act & Assert
      await expect(
        service.detectNisabAchievement(userId, 6000.0, 'GOLD')
      ).rejects.toThrow('API unavailable');
    });

    it('should handle exact Nisab threshold', async () => {
      // Arrange: Wealth exactly equals Nisab
      const currentWealth = 5686.2;
      mockNisabService.calculateNisabThreshold = jest.fn().mockResolvedValue(mockNisabData);
      mockNisabService.isAboveNisab = jest.fn().mockReturnValue(true);

      // Act
      const result = await service.detectNisabAchievement(userId, currentWealth, 'GOLD');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.currentWealth).toBe(currentWealth);
      expect(result?.nisabThreshold).toBe(currentWealth);
    });
  });

  describe('calculateHawlTrackingState', () => {
    const userId = 'user_123';
    const hawlStartDate = moment().subtract(100, 'days').toDate();
    const hawlCompletionDate = moment(hawlStartDate).add(HAWL_DURATION_DAYS, 'days').toDate();

    const mockRecordData = {
      id: 'record_123',
      userId,
      hawlStartDate,
      hawlStartDateHijri: '1446-01-15',
      hawlCompletionDate,
      hawlCompletionDateHijri: '1447-01-15',
      nisabBasis: 'GOLD',
      nisabThresholdAtStart: '5686.20',
      nisabThreshold: '5700.00',
      totalWealth: '6000.00',
      status: 'DRAFT',
    };

    it('should calculate correct Hawl tracking state', () => {
      // Arrange
      const currentWealth = 6500.0;

      // Act
      const result = service.calculateHawlTrackingState(mockRecordData, currentWealth);

      // Assert
      expect(result.userId).toBe(userId);
      expect(result.recordId).toBe('record_123');
      expect(result.status).toBe('ACTIVE');
      expect(result.hawlStartDate).toBe(hawlStartDate);
      expect(result.hawlCompletionDate).toBe(hawlCompletionDate);
      expect(result.currentWealth).toBe(currentWealth);
      expect(result.nisabThresholdAtStart).toBe(5686.20);
      expect(result.wealthAtStart).toBe(6000.00);
    });

    it('should calculate days elapsed and remaining correctly', () => {
      // Arrange
      const currentWealth = 6500.0;

      // Act
      const result = service.calculateHawlTrackingState(mockRecordData, currentWealth);

      // Assert
      expect(result.daysElapsed).toBeGreaterThanOrEqual(99);
      expect(result.daysElapsed).toBeLessThanOrEqual(101);
      expect(result.daysRemaining).toBeGreaterThanOrEqual(253);
      expect(result.daysRemaining).toBeLessThanOrEqual(255);
      expect(result.daysElapsed + result.daysRemaining).toBeCloseTo(HAWL_DURATION_DAYS, 0);
    });

    it('should calculate Hawl progress percentage', () => {
      // Arrange
      const currentWealth = 6500.0;

      // Act
      const result = service.calculateHawlTrackingState(mockRecordData, currentWealth);

      // Assert
      const expectedProgress = (100 / HAWL_DURATION_DAYS) * 100; // 100 days elapsed
      expect(result.hawlProgress).toBeGreaterThanOrEqual(expectedProgress - 1);
      expect(result.hawlProgress).toBeLessThanOrEqual(expectedProgress + 1);
      expect(result.hawlProgress).toBeGreaterThanOrEqual(0);
      expect(result.hawlProgress).toBeLessThanOrEqual(100);
    });

    it('should mark status as COMPLETE when Hawl period ended', () => {
      // Arrange: Record with past completion date
      const pastRecord = {
        ...mockRecordData,
        hawlStartDate: moment().subtract(400, 'days').toDate(),
        hawlCompletionDate: moment().subtract(46, 'days').toDate(),
      };
      const currentWealth = 6500.0;

      // Act
      const result = service.calculateHawlTrackingState(pastRecord, currentWealth);

      // Assert
      expect(result.status).toBe('COMPLETE');
      expect(result.isHawlComplete).toBe(true);
      expect(result.daysRemaining).toBe(0);
    });

    it('should mark status as INTERRUPTED when wealth drops below Nisab', () => {
      // Arrange: Current wealth below Nisab threshold
      const currentWealth = 5000.0; // Below 5686.20

      // Act
      const result = service.calculateHawlTrackingState(mockRecordData, currentWealth);

      // Assert
      expect(result.status).toBe('INTERRUPTED');
      expect(result.currentWealth).toBeLessThan(result.nisabThresholdAtStart);
    });

    it('should track minimum wealth during period', () => {
      // Arrange: Current wealth lower than initial wealth
      const currentWealth = 5800.0; // Lower than initial 6000

      // Act
      const result = service.calculateHawlTrackingState(mockRecordData, currentWealth);

      // Assert
      expect(result.minimumWealthDuringPeriod).toBe(5800.0);
    });

    it('should cap progress at 100% for overdue Hawl', () => {
      // Arrange: Hawl completion date far in the past
      const pastRecord = {
        ...mockRecordData,
        hawlStartDate: moment().subtract(500, 'days').toDate(),
        hawlCompletionDate: moment().subtract(146, 'days').toDate(),
      };

      // Act
      const result = service.calculateHawlTrackingState(pastRecord, 6500.0);

      // Assert
      expect(result.hawlProgress).toBe(100);
    });

    it('should include lastUpdated timestamp', () => {
      // Arrange
      const beforeTime = new Date();

      // Act
      const result = service.calculateHawlTrackingState(mockRecordData, 6500.0);
      const afterTime = new Date();

      // Assert
      expect(result.lastUpdated).toBeInstanceOf(Date);
      expect(result.lastUpdated.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(result.lastUpdated.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('calculateLiveHawlData', () => {
    const mockRecordData = {
      id: 'record_123',
      userId: 'user_123',
      hawlStartDate: moment().subtract(100, 'days').toDate(),
      hawlCompletionDate: moment().add(254, 'days').toDate(),
      nisabThresholdAtStart: '5686.20',
      status: 'DRAFT',
    };

    beforeEach(() => {
      // Mock calculateZakat method
      mockNisabService.calculateZakat = jest.fn().mockReturnValue(162.50);
    });

    it('should calculate live Hawl data with wealth above Nisab', () => {
      // Arrange
      const currentWealth = 6500.0;

      // Act
      const result = service.calculateLiveHawlData(mockRecordData, currentWealth);

      // Assert
      expect(result.recordId).toBe('record_123');
      expect(result.userId).toBe('user_123');
      expect(result.currentWealth).toBe(currentWealth);
      expect(result.nisabThreshold).toBe(5686.20);
      expect(result.wealthStatus).toBe('ABOVE_NISAB');
      expect(result.percentageOfNisab).toBeGreaterThan(100);
      expect(result.excessAboveNisab).toBe(currentWealth - 5686.20);
      expect(result.deficitBelowNisab).toBeUndefined();
    });

    it('should calculate live Hawl data with wealth below Nisab', () => {
      // Arrange
      const currentWealth = 5000.0;

      // Act
      const result = service.calculateLiveHawlData(mockRecordData, currentWealth);

      // Assert
      expect(result.wealthStatus).toBe('BELOW_NISAB');
      expect(result.percentageOfNisab).toBeLessThan(100);
      expect(result.deficitBelowNisab).toBe(5686.20 - currentWealth);
      expect(result.excessAboveNisab).toBeUndefined();
      expect(result.estimatedZakat).toBe(0); // No Zakat when below Nisab
    });

    it('should calculate estimated Zakat when above Nisab', () => {
      // Arrange
      const currentWealth = 6500.0;

      // Act
      const result = service.calculateLiveHawlData(mockRecordData, currentWealth);

      // Assert
      expect(result.estimatedZakat).toBeGreaterThan(0);
      expect(mockNisabService.calculateZakat).toHaveBeenCalledWith(currentWealth);
    });

    it('should indicate if Hawl is complete and can finalize', () => {
      // Arrange: Record with completion date in past
      const completedRecord = {
        ...mockRecordData,
        hawlStartDate: moment().subtract(400, 'days').toDate(),
        hawlCompletionDate: moment().subtract(46, 'days').toDate(),
      };

      // Act
      const result = service.calculateLiveHawlData(completedRecord, 6500.0);

      // Assert
      expect(result.isHawlComplete).toBe(true);
      expect(result.canFinalize).toBe(true);
      expect(result.daysRemaining).toBe(0);
    });

    it('should indicate active Hawl status', () => {
      // Arrange
      const currentWealth = 6500.0;

      // Act
      const result = service.calculateLiveHawlData(mockRecordData, currentWealth);

      // Assert
      expect(result.isHawlActive).toBe(true);
      expect(result.status).toBe('ACTIVE');
    });

    it('should calculate percentage of Nisab correctly', () => {
      // Arrange
      const currentWealth = 5686.20; // Exactly at Nisab

      // Act
      const result = service.calculateLiveHawlData(mockRecordData, currentWealth);

      // Assert
      expect(result.percentageOfNisab).toBe(100);
    });

    it('should include next update expectation timestamp', () => {
      // Arrange
      const beforeTime = moment();

      // Act
      const result = service.calculateLiveHawlData(mockRecordData, 6500.0);
      const afterTime = moment();

      // Assert
      expect(result.nextUpdateExpected).toBeInstanceOf(Date);
      const expectedTime = moment(result.nextUpdateExpected);
      expect(expectedTime.isAfter(beforeTime.add(4, 'minutes'))).toBe(true);
      expect(expectedTime.isBefore(afterTime.add(6, 'minutes'))).toBe(true);
    });

    it('should include lastUpdated timestamp', () => {
      // Act
      const result = service.calculateLiveHawlData(mockRecordData, 6500.0);

      // Assert
      expect(result.lastUpdated).toBeInstanceOf(Date);
      expect(result.lastUpdated.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('detectHawlInterruption', () => {
    const mockRecordData = {
      id: 'record_123',
      userId: 'user_123',
      hawlStartDate: moment().subtract(100, 'days').toDate(),
      hawlCompletionDate: moment().add(254, 'days').toDate(),
      nisabThresholdAtStart: '5686.20',
    };

    it('should detect interruption when wealth drops below Nisab', () => {
      // Arrange
      const previousWealth = 6000.0; // Above Nisab
      const currentWealth = 5500.0; // Below Nisab

      // Act
      const result = service.detectHawlInterruption(
        mockRecordData,
        previousWealth,
        currentWealth
      );

      // Assert
      expect(result).not.toBeNull();
      expect(result?.userId).toBe('user_123');
      expect(result?.recordId).toBe('record_123');
      expect(result?.previousWealth).toBe(previousWealth);
      expect(result?.currentWealth).toBe(currentWealth);
      expect(result?.nisabThreshold).toBe(5686.20);
      expect(result?.timestamp).toBeInstanceOf(Date);
    });

    it('should return null when wealth stays above Nisab', () => {
      // Arrange
      const previousWealth = 6000.0;
      const currentWealth = 6500.0; // Still above Nisab

      // Act
      const result = service.detectHawlInterruption(
        mockRecordData,
        previousWealth,
        currentWealth
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when wealth stays below Nisab', () => {
      // Arrange
      const previousWealth = 5000.0; // Already below
      const currentWealth = 5200.0; // Still below

      // Act
      const result = service.detectHawlInterruption(
        mockRecordData,
        previousWealth,
        currentWealth
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should calculate days completed and remaining', () => {
      // Arrange
      const previousWealth = 6000.0;
      const currentWealth = 5500.0;

      // Act
      const result = service.detectHawlInterruption(
        mockRecordData,
        previousWealth,
        currentWealth
      );

      // Assert
      expect(result?.daysCompleted).toBeGreaterThanOrEqual(99);
      expect(result?.daysCompleted).toBeLessThanOrEqual(101);
      expect(result?.daysRemaining).toBeGreaterThanOrEqual(253);
      expect(result?.daysRemaining).toBeLessThanOrEqual(255);
    });

    it('should handle exact Nisab threshold crossing', () => {
      // Arrange
      const previousWealth = 5686.20; // Exactly at Nisab
      const currentWealth = 5686.19; // Just below

      // Act
      const result = service.detectHawlInterruption(
        mockRecordData,
        previousWealth,
        currentWealth
      );

      // Assert
      expect(result).not.toBeNull();
      expect(result?.previousWealth).toBe(previousWealth);
      expect(result?.currentWealth).toBe(currentWealth);
    });

    it('should include timestamp of interruption', () => {
      // Arrange
      const beforeTime = new Date();
      const previousWealth = 6000.0;
      const currentWealth = 5500.0;

      // Act
      const result = service.detectHawlInterruption(
        mockRecordData,
        previousWealth,
        currentWealth
      );
      const afterTime = new Date();

      // Assert
      expect(result?.timestamp).toBeInstanceOf(Date);
      expect(result?.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(result?.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });
});
