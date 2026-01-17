import { vi } from 'vitest';
import { NisabCalculationService } from '../../../src/services/nisabCalculationService';
import { PreciousMetalsApiClient } from '../../../src/config/preciousMetalsApi';

vi.mock('../../../src/config/preciousMetalsApi');
vi.mock('../../../src/services/EncryptionService');

describe('NisabCalculationService', () => {
  let service: NisabCalculationService;
  let mockApi: any;

  beforeEach(() => {
    mockApi = {
      fetchCurrentPrices: vi.fn().mockResolvedValue([
        { metalType: 'gold', pricePerGram: 60.5, currency: 'USD' },
        { metalType: 'silver', pricePerGram: 0.85, currency: 'USD' },
      ]),
    };

    service = new NisabCalculationService(mockApi as any);
    vi.clearAllMocks();
  });

  describe('calculateNisabThreshold', () => {
    it('should calculate Nisab thresholds based on fetched prices', async () => {
      // Set API key to trigger fetching logic in service
      process.env.METALS_API_KEY = 'test-key';

      const result = await service.calculateNisabThreshold('USD', 'GOLD');

      expect(result.goldPrice).toBe(60.5);
      expect(result.silverPrice).toBe(0.85);
      expect(result.goldNisab).toBeCloseTo(87.48 * 60.5, 2);
      expect(mockApi.fetchCurrentPrices).toHaveBeenCalledWith('USD');
    });

    it('should use fallback prices if API fetch fails', async () => {
      mockApi.fetchCurrentPrices.mockRejectedValue(new Error('API Error'));

      const result = await service.calculateNisabThreshold('USD', 'GOLD');

      expect(result.goldPrice).toBe(65.0); // Fallback
      expect(result.silverPrice).toBe(0.75); // Fallback
    });
  });

  describe('calculateZakat', () => {
    it('should calculate 2.5% of wealth', () => {
      expect(service.calculateZakat(10000)).toBe(250);
      expect(service.calculateZakat(100)).toBe(2.5);
    });
  });

  describe('isAboveNisab', () => {
    it('should return true if wealth is above or equal to threshold', () => {
      expect(service.isAboveNisab(5000, 5000)).toBe(true);
      expect(service.isAboveNisab(6000, 5000)).toBe(true);
      expect(service.isAboveNisab(4000, 5000)).toBe(false);
    });
  });
});
