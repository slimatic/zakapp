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
