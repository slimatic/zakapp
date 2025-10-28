/**
 * T021: Unit Tests for NisabCalculationService
 * 
 * Tests precious metals API integration, Nisab threshold calculation,
 * caching, and currency conversion for Zakat compliance.
 * 
 * @see specs/008-nisab-year-record/research.md - Precious metals API decision
 * @see specs/008-nisab-year-record/data-model.md - PreciousMetalPrice schema
 */

import { NisabCalculationService } from '../../../src/services/nisabCalculationService';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

jest.mock('axios');
jest.mock('@prisma/client');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NisabCalculationService', () => {
  let service: NisabCalculationService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = {
      preciousMetalPrice: {
        findFirst: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
    } as any;

    service = new NisabCalculationService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('getCurrentNisabThreshold', () => {
    it('should calculate gold-based Nisab threshold (87.48g)', async () => {
      // Arrange
      const goldPricePerGram = 60.5; // USD
      mockPrisma.preciousMetalPrice.findFirst.mockResolvedValue({
        id: 'price1',
        metalType: 'gold',
        pricePerGram: goldPricePerGram,
        currency: 'USD',
        fetchedAt: new Date(),
        sourceApi: 'metals-api.com',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      // Act
      const result = await service.getCurrentNisabThreshold('gold');

      // Assert
      const expectedNisab = 87.48 * goldPricePerGram; // 5,292.54 USD
      expect(result).toBeCloseTo(expectedNisab, 2);
      expect(mockPrisma.preciousMetalPrice.findFirst).toHaveBeenCalledWith({
        where: { metalType: 'gold' },
        orderBy: { fetchedAt: 'desc' },
      });
    });

    it('should calculate silver-based Nisab threshold (612.36g)', async () => {
      // Arrange
      const silverPricePerGram = 0.85; // USD
      mockPrisma.preciousMetalPrice.findFirst.mockResolvedValue({
        id: 'price2',
        metalType: 'silver',
        pricePerGram: silverPricePerGram,
        currency: 'USD',
        fetchedAt: new Date(),
        sourceApi: 'metals-api.com',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      // Act
      const result = await service.getCurrentNisabThreshold('silver');

      // Assert
      const expectedNisab = 612.36 * silverPricePerGram; // 520.51 USD
      expect(result).toBeCloseTo(expectedNisab, 2);
    });

    it('should fetch from metals-api.com if cache is expired', async () => {
      // Arrange
      const expiredPrice = {
        id: 'old-price',
        metalType: 'gold',
        pricePerGram: 50.0,
        currency: 'USD',
        fetchedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
        sourceApi: 'metals-api.com',
        expiresAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // Expired
      };

      mockPrisma.preciousMetalPrice.findFirst.mockResolvedValue(expiredPrice);
      
      mockedAxios.get.mockResolvedValue({
        data: {
          rates: {
            XAU: 0.0005, // 1 USD = 0.0005 troy oz gold
          },
          base: 'USD',
        },
      });

      mockPrisma.preciousMetalPrice.create.mockResolvedValue({
        id: 'new-price',
        metalType: 'gold',
        pricePerGram: 62.5,
        currency: 'USD',
        fetchedAt: new Date(),
        sourceApi: 'metals-api.com',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      // Act
      await service.getCurrentNisabThreshold('gold');

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('metals-api.com/api/latest'),
        expect.objectContaining({
          params: expect.objectContaining({
            symbols: 'XAU,XAG',
          }),
        })
      );
      expect(mockPrisma.preciousMetalPrice.create).toHaveBeenCalled();
    });

    it('should use cached price if still valid (< 24 hours old)', async () => {
      // Arrange
      const validCache = {
        id: 'valid-price',
        metalType: 'gold',
        pricePerGram: 65.0,
        currency: 'USD',
        fetchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        sourceApi: 'metals-api.com',
        expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000),
      };

      mockPrisma.preciousMetalPrice.findFirst.mockResolvedValue(validCache);

      // Act
      const result = await service.getCurrentNisabThreshold('gold');

      // Assert
      expect(result).toBeCloseTo(87.48 * 65.0, 2);
      expect(mockedAxios.get).not.toHaveBeenCalled(); // Should NOT fetch
    });

    it('should fall back to last cached price if API call fails', async () => {
      // Arrange
      const expiredPrice = {
        id: 'old-price',
        metalType: 'gold',
        pricePerGram: 58.0,
        currency: 'USD',
        fetchedAt: new Date(Date.now() - 30 * 60 * 60 * 1000), // 30 hours ago
        sourceApi: 'metals-api.com',
        expiresAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      };

      mockPrisma.preciousMetalPrice.findFirst.mockResolvedValue(expiredPrice);
      mockedAxios.get.mockRejectedValue(new Error('API rate limit exceeded'));

      // Act
      const result = await service.getCurrentNisabThreshold('gold');

      // Assert
      expect(result).toBeCloseTo(87.48 * 58.0, 2); // Use stale cache
      expect(mockedAxios.get).toHaveBeenCalled(); // Attempted fetch
    });

    it('should throw error if no cached price and API fails', async () => {
      // Arrange
      mockPrisma.preciousMetalPrice.findFirst.mockResolvedValue(null);
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(
        service.getCurrentNisabThreshold('gold')
      ).rejects.toThrow('Unable to fetch precious metal prices');
    });
  });

  describe('convertPriceToGrams', () => {
    it('should convert troy ounces to grams for gold', () => {
      // Arrange
      const pricePerTroyOz = 2000; // USD per troy oz
      const GRAMS_PER_TROY_OZ = 31.1034768;

      // Act
      const pricePerGram = service.convertPriceToGrams(pricePerTroyOz);

      // Assert
      expect(pricePerGram).toBeCloseTo(pricePerTroyOz / GRAMS_PER_TROY_OZ, 2);
    });
  });

  describe('cleanupOldPrices', () => {
    it('should delete prices older than 30 days', async () => {
      // Arrange
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      mockPrisma.preciousMetalPrice.deleteMany.mockResolvedValue({ count: 15 });

      // Act
      await service.cleanupOldPrices();

      // Assert
      expect(mockPrisma.preciousMetalPrice.deleteMany).toHaveBeenCalledWith({
        where: {
          fetchedAt: {
            lt: expect.any(Date),
          },
        },
      });
    });
  });

  describe('getNisabComparisonData', () => {
    it('should return both gold and silver Nisab thresholds', async () => {
      // Arrange
      mockPrisma.preciousMetalPrice.findFirst
        .mockResolvedValueOnce({
          id: 'gold1',
          metalType: 'gold',
          pricePerGram: 60.0,
          currency: 'USD',
          fetchedAt: new Date(),
          sourceApi: 'metals-api.com',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })
        .mockResolvedValueOnce({
          id: 'silver1',
          metalType: 'silver',
          pricePerGram: 0.80,
          currency: 'USD',
          fetchedAt: new Date(),
          sourceApi: 'metals-api.com',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

      // Act
      const result = await service.getNisabComparisonData();

      // Assert
      expect(result).toEqual({
        goldNisab: expect.any(Number),
        silverNisab: expect.any(Number),
        goldPricePerGram: 60.0,
        silverPricePerGram: 0.80,
        fetchedAt: expect.any(Date),
      });
      expect(result.goldNisab).toBeCloseTo(87.48 * 60.0, 2);
      expect(result.silverNisab).toBeCloseTo(612.36 * 0.80, 2);
    });
  });
});
