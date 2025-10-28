/**
 * Unit Tests for NisabCalculationService (T021)
 * 
 * Tests all core Nisab calculation functionality:
 * - Nisab threshold calculation (gold/silver)
 * - Precious metals API integration with fallback
 * - Zakat amount calculation (2.5%)
 * - Wealth comparison to Nisab
 * - Days remaining in Hawl calculation
 * - Financial data encryption/decryption
 */

import { NisabCalculationService } from '../../src/services/nisabCalculationService';
import { PreciousMetalsApiClient } from '../../src/config/preciousMetalsApi';
import { EncryptionService } from '../../src/services/EncryptionService';

// Mock dependencies
jest.mock('../../src/config/preciousMetalsApi');
jest.mock('../../src/services/EncryptionService');
jest.mock('../../src/utils/logger');

describe('NisabCalculationService', () => {
  let service: NisabCalculationService;
  let mockMetalsApi: jest.Mocked<PreciousMetalsApiClient>;
  let mockEncryptionService: jest.Mocked<EncryptionService>;

  const NISAB_GOLD_GRAMS = 87.48;
  const NISAB_SILVER_GRAMS = 612.36;
  const ZAKAT_RATE = 0.025; // 2.5%

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockMetalsApi = new PreciousMetalsApiClient() as jest.Mocked<PreciousMetalsApiClient>;
    mockEncryptionService = new EncryptionService() as jest.Mocked<EncryptionService>;

    // Setup static method mocks
    (EncryptionService.encrypt as jest.Mock) = jest.fn((value) => ({
      encryptedData: `encrypted_${value}`,
      iv: 'mock_iv',
      authTag: 'mock_auth_tag',
    }));
    (EncryptionService.decrypt as jest.Mock) = jest.fn((value) => value.replace('encrypted_', ''));

    // Create service instance with mocked dependencies
    service = new NisabCalculationService(mockMetalsApi, mockEncryptionService);
  });

  describe('calculateNisabThreshold', () => {
    it('should calculate correct Nisab thresholds using API prices', async () => {
      // Arrange: Mock API response
      const mockGoldPrice = 65.0; // USD per gram
      const mockSilverPrice = 0.75; // USD per gram

      mockMetalsApi.fetchCurrentPrices = jest.fn().mockResolvedValue([
        { metalType: 'gold', pricePerGram: mockGoldPrice, currency: 'USD', fetchedAt: new Date() },
        { metalType: 'silver', pricePerGram: mockSilverPrice, currency: 'USD', fetchedAt: new Date() },
      ]);

      // Act: Calculate Nisab with gold basis
      const result = await service.calculateNisabThreshold('USD', 'GOLD');

      // Assert: Verify calculations
      expect(result.goldPrice).toBe(mockGoldPrice);
      expect(result.silverPrice).toBe(mockSilverPrice);
      expect(result.goldNisab).toBe(Math.round(mockGoldPrice * NISAB_GOLD_GRAMS * 100) / 100);
      expect(result.silverNisab).toBe(Math.round(mockSilverPrice * NISAB_SILVER_GRAMS * 100) / 100);
      expect(result.selectedNisab).toBe(result.goldNisab);
      expect(result.basisUsed).toBe('GOLD');
      expect(result.currency).toBe('USD');
      expect(mockMetalsApi.fetchCurrentPrices).toHaveBeenCalledWith('USD');
    });

    it('should use silver Nisab when nisabBasis is SILVER', async () => {
      // Arrange
      const mockGoldPrice = 65.0;
      const mockSilverPrice = 0.75;

      mockMetalsApi.fetchCurrentPrices = jest.fn().mockResolvedValue([
        { metalType: 'gold', pricePerGram: mockGoldPrice, currency: 'USD', fetchedAt: new Date() },
        { metalType: 'silver', pricePerGram: mockSilverPrice, currency: 'USD', fetchedAt: new Date() },
      ]);

      // Act
      const result = await service.calculateNisabThreshold('USD', 'SILVER');

      // Assert
      expect(result.selectedNisab).toBe(result.silverNisab);
      expect(result.basisUsed).toBe('SILVER');
    });

    it('should use fallback prices when API fails', async () => {
      // Arrange: Mock API failure
      mockMetalsApi.fetchCurrentPrices = jest.fn().mockRejectedValue(new Error('API unavailable'));

      // Act
      const result = await service.calculateNisabThreshold('USD', 'GOLD');

      // Assert: Should use hardcoded fallback values
      expect(result.goldPrice).toBe(65.0); // Fallback gold price
      expect(result.silverPrice).toBe(0.75); // Fallback silver price
      expect(result.goldNisab).toBeGreaterThan(0);
      expect(result.silverNisab).toBeGreaterThan(0);
    });

    it('should use fallback prices when METALS_API_KEY is not set', async () => {
      // Arrange: Remove API key
      const originalKey = process.env.METALS_API_KEY;
      delete process.env.METALS_API_KEY;

      // Act
      const result = await service.calculateNisabThreshold('USD', 'GOLD');

      // Assert: Should use fallback without calling API
      expect(result.goldPrice).toBe(65.0);
      expect(result.silverPrice).toBe(0.75);
      expect(mockMetalsApi.fetchCurrentPrices).not.toHaveBeenCalled();

      // Cleanup
      if (originalKey) process.env.METALS_API_KEY = originalKey;
    });

    it('should round Nisab values to 2 decimal places', async () => {
      // Arrange: Prices that produce non-round results
      mockMetalsApi.fetchCurrentPrices = jest.fn().mockResolvedValue([
        { metalType: 'gold', pricePerGram: 65.333, currency: 'USD', fetchedAt: new Date() },
        { metalType: 'silver', pricePerGram: 0.777, currency: 'USD', fetchedAt: new Date() },
      ]);

      // Act
      const result = await service.calculateNisabThreshold('USD', 'GOLD');

      // Assert: Check proper rounding
      expect(result.goldNisab).toBe(Math.round(65.333 * NISAB_GOLD_GRAMS * 100) / 100);
      expect(result.silverNisab).toBe(Math.round(0.777 * NISAB_SILVER_GRAMS * 100) / 100);
      expect(Number.isInteger(result.goldNisab * 100)).toBe(true); // No fraction beyond cents
    });

    it('should handle different currencies', async () => {
      // Arrange
      mockMetalsApi.fetchCurrentPrices = jest.fn().mockResolvedValue([
        { metalType: 'gold', pricePerGram: 58.5, currency: 'EUR', fetchedAt: new Date() },
        { metalType: 'silver', pricePerGram: 0.65, currency: 'EUR', fetchedAt: new Date() },
      ]);

      // Act
      const result = await service.calculateNisabThreshold('EUR', 'GOLD');

      // Assert
      expect(result.currency).toBe('EUR');
      expect(mockMetalsApi.fetchCurrentPrices).toHaveBeenCalledWith('EUR');
    });

    it('should include fetchedAt timestamp', async () => {
      // Arrange
      mockMetalsApi.fetchCurrentPrices = jest.fn().mockResolvedValue([
        { metalType: 'gold', pricePerGram: 65.0, currency: 'USD', fetchedAt: new Date() },
        { metalType: 'silver', pricePerGram: 0.75, currency: 'USD', fetchedAt: new Date() },
      ]);

      // Act
      const result = await service.calculateNisabThreshold('USD', 'GOLD');

      // Assert
      expect(result.fetchedAt).toBeInstanceOf(Date);
      expect(result.fetchedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should throw descriptive error on total calculation failure', async () => {
      // Arrange: Mock unexpected error
      mockMetalsApi.fetchCurrentPrices = jest.fn().mockRejectedValue(new Error('Network timeout'));

      // Act & Assert
      await expect(service.calculateNisabThreshold('USD', 'GOLD'))
        .rejects
        .toThrow('Nisab calculation failed');
    });
  });

  describe('calculateNisabFromPrice', () => {
    it('should calculate gold Nisab from custom price', () => {
      // Arrange
      const customGoldPrice = 70.0; // USD per gram

      // Act
      const result = service.calculateNisabFromPrice('gold', customGoldPrice);

      // Assert
      expect(result).toBe(Math.round(customGoldPrice * NISAB_GOLD_GRAMS * 100) / 100);
    });

    it('should calculate silver Nisab from custom price', () => {
      // Arrange
      const customSilverPrice = 0.85; // USD per gram

      // Act
      const result = service.calculateNisabFromPrice('silver', customSilverPrice);

      // Assert
      expect(result).toBe(Math.round(customSilverPrice * NISAB_SILVER_GRAMS * 100) / 100);
    });

    it('should round results to 2 decimal places', () => {
      // Act
      const result = service.calculateNisabFromPrice('gold', 65.333);

      // Assert
      expect(Number.isInteger(result * 100)).toBe(true);
    });

    it('should handle zero price edge case', () => {
      // Act
      const result = service.calculateNisabFromPrice('gold', 0);

      // Assert
      expect(result).toBe(0);
    });

    it('should handle very large prices correctly', () => {
      // Arrange
      const veryLargePrice = 999999.99;

      // Act
      const result = service.calculateNisabFromPrice('gold', veryLargePrice);

      // Assert
      expect(result).toBeGreaterThan(0);
      expect(result).toBe(Math.round(veryLargePrice * NISAB_GOLD_GRAMS * 100) / 100);
    });
  });

  describe('calculateZakat', () => {
    it('should calculate 2.5% Zakat correctly', () => {
      // Arrange
      const zakatableWealth = 10000.0;

      // Act
      const result = service.calculateZakat(zakatableWealth);

      // Assert
      expect(result).toBe(250.0); // 2.5% of 10,000
    });

    it('should round Zakat amount to 2 decimal places', () => {
      // Arrange
      const zakatableWealth = 12345.67;

      // Act
      const result = service.calculateZakat(zakatableWealth);

      // Assert
      const expected = Math.round(12345.67 * ZAKAT_RATE * 100) / 100;
      expect(result).toBe(expected);
      expect(Number.isInteger(result * 100)).toBe(true);
    });

    it('should handle zero wealth', () => {
      // Act
      const result = service.calculateZakat(0);

      // Assert
      expect(result).toBe(0);
    });

    it('should handle small wealth amounts correctly', () => {
      // Arrange
      const smallWealth = 100.0;

      // Act
      const result = service.calculateZakat(smallWealth);

      // Assert
      expect(result).toBe(2.50); // 2.5% of 100
    });

    it('should handle very large wealth amounts', () => {
      // Arrange
      const largeWealth = 999999999.99;

      // Act
      const result = service.calculateZakat(largeWealth);

      // Assert
      expect(result).toBe(Math.round(largeWealth * ZAKAT_RATE * 100) / 100);
    });
  });

  describe('isAboveNisab', () => {
    it('should return true when wealth equals Nisab', () => {
      // Arrange
      const wealth = 5686.2;
      const nisabThreshold = 5686.2;

      // Act
      const result = service.isAboveNisab(wealth, nisabThreshold);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true when wealth exceeds Nisab', () => {
      // Arrange
      const wealth = 10000.0;
      const nisabThreshold = 5686.2;

      // Act
      const result = service.isAboveNisab(wealth, nisabThreshold);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when wealth below Nisab', () => {
      // Arrange
      const wealth = 5000.0;
      const nisabThreshold = 5686.2;

      // Act
      const result = service.isAboveNisab(wealth, nisabThreshold);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle zero wealth', () => {
      // Act
      const result = service.isAboveNisab(0, 5686.2);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle zero Nisab threshold edge case', () => {
      // Act
      const result = service.isAboveNisab(100, 0);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('calculateDaysRemaining', () => {
    it('should return positive days for future date', () => {
      // Arrange: Date 30 days in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      // Act
      const result = service.calculateDaysRemaining(futureDate);

      // Assert
      expect(result).toBeGreaterThanOrEqual(29);
      expect(result).toBeLessThanOrEqual(31); // Allow for rounding
    });

    it('should return negative days for past date', () => {
      // Arrange: Date 30 days in the past
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);

      // Act
      const result = service.calculateDaysRemaining(pastDate);

      // Assert
      expect(result).toBeLessThanOrEqual(-29);
      expect(result).toBeGreaterThanOrEqual(-31);
    });

    it('should return 0 or 1 for today/tomorrow', () => {
      // Arrange: Today's date
      const today = new Date();

      // Act
      const result = service.calculateDaysRemaining(today);

      // Assert: Should be very close to 0 (might be 0 or 1 due to rounding)
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should ceil fractional days correctly', () => {
      // Arrange: Date 2.5 days in the future
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 60); // 2.5 days = 60 hours

      // Act
      const result = service.calculateDaysRemaining(futureDate);

      // Assert: Should ceil to 3 days
      expect(result).toBeGreaterThanOrEqual(2);
      expect(result).toBeLessThanOrEqual(3);
    });

    it('should handle Hawl completion date (354 days)', () => {
      // Arrange: Typical Hawl completion date
      const hawlCompletion = new Date();
      hawlCompletion.setDate(hawlCompletion.getDate() + 354);

      // Act
      const result = service.calculateDaysRemaining(hawlCompletion);

      // Assert
      expect(result).toBeGreaterThanOrEqual(353);
      expect(result).toBeLessThanOrEqual(355);
    });
  });

  describe('encryptFinancialData', () => {
    it('should encrypt numeric value', () => {
      // Arrange
      const value = 12345.67;

      // Act
      const result = service.encryptFinancialData(value);

      // Assert
      expect(EncryptionService.encrypt).toHaveBeenCalledWith('12345.67');
      expect(result).toBeDefined();
    });

    it('should encrypt string value', () => {
      // Arrange
      const value = '9999.99';

      // Act
      const result = service.encryptFinancialData(value);

      // Assert
      expect(EncryptionService.encrypt).toHaveBeenCalledWith('9999.99');
    });

    it('should handle zero value', () => {
      // Act
      const result = service.encryptFinancialData(0);

      // Assert
      expect(EncryptionService.encrypt).toHaveBeenCalledWith('0');
    });
  });

  describe('decryptFinancialData', () => {
    it('should decrypt financial data to number', () => {
      // Arrange
      const encryptedValue = 'encrypted_12345.67';

      // Act
      const result = service.decryptFinancialData(encryptedValue);

      // Assert
      expect(EncryptionService.decrypt).toHaveBeenCalledWith(encryptedValue);
      expect(result).toBe(12345.67);
    });

    it('should handle zero encrypted value', () => {
      // Arrange
      const encryptedValue = 'encrypted_0';

      // Act
      const result = service.decryptFinancialData(encryptedValue);

      // Assert
      expect(result).toBe(0);
    });

    it('should parse decimal values correctly', () => {
      // Arrange
      const encryptedValue = 'encrypted_5686.20';

      // Act
      const result = service.decryptFinancialData(encryptedValue);

      // Assert
      expect(result).toBe(5686.20);
    });
  });

  describe('getConstants', () => {
    it('should return correct Nisab calculation constants', () => {
      // Act
      const constants = service.getConstants();

      // Assert
      expect(constants.nisabGoldGrams).toBe(87.48);
      expect(constants.nisabSilverGrams).toBe(612.36);
      expect(constants.zakatPercentage).toBe(2.5);
    });

    it('should return immutable constants', () => {
      // Act
      const constants1 = service.getConstants();
      const constants2 = service.getConstants();

      // Assert: Values should be consistent
      expect(constants1).toEqual(constants2);
    });
  });
});
