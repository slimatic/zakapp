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

1|import { vi } from 'vitest';
2|import { NisabCalculationService } from '../../../src/services/nisabCalculationService';
3|import { PreciousMetalsApiClient } from '../../../src/config/preciousMetalsApi';
4|
5|vi.mock('../../../src/config/preciousMetalsApi');
6|vi.mock('../../../src/services/EncryptionService');
7|
8|describe('NisabCalculationService', () => {
9|  let service: NisabCalculationService;
10|  let mockApi: any;
11|
12|  beforeEach(() => {
13|    mockApi = {
14|      fetchCurrentPrices: vi.fn().mockResolvedValue([
15|        { metalType: 'gold', pricePerGram: 60.5, currency: 'USD' },
16|        { metalType: 'silver', pricePerGram: 0.85, currency: 'USD' },
17|      ]),
18|    };
19|
20|    service = new NisabCalculationService(mockApi as any);
21|    vi.clearAllMocks();
22|  });
23|
24|  describe('calculateNisabThreshold', () => {
25|    it('should calculate Nisab thresholds based on fetched prices', async () => {
26|      // Set API key to trigger fetching logic in service
27|      process.env.METALS_API_KEY = 'test-key';
28|
29|      const result = await service.calculateNisabThreshold('USD', 'GOLD');
30|
31|      expect(result.goldPrice).toBe(60.5);
32|      expect(result.silverPrice).toBe(0.85);
33|      expect(result.goldNisab).toBeCloseTo(87.48 * 60.5, 2);
34|      expect(mockApi.fetchCurrentPrices).toHaveBeenCalledWith('USD');
35|    });
36|
37|    it('should use fallback prices if API fetch fails', async () => {
38|      mockApi.fetchCurrentPrices.mockRejectedValue(new Error('API Error'));
39|
40|      const result = await service.calculateNisabThreshold('USD', 'GOLD');
41|
42|      expect(result.goldPrice).toBe(65.0); // Fallback
43|      expect(result.silverPrice).toBe(0.75); // Fallback
44|    });
45|  });
46|
47|  describe('calculateZakat', () => {
48|    it('should calculate 2.5% of wealth', () => {
49|      expect(service.calculateZakat(10000)).toBe(250);
50|      expect(service.calculateZakat(100)).toBe(2.5);
51|    });
52|  });
53|
54|  describe('isAboveNisab', () => {
55|    it('should return true if wealth is above or equal to threshold', () => {
56|      expect(service.isAboveNisab(5000, 5000)).toBe(true);
57|      expect(service.isAboveNisab(6000, 5000)).toBe(true);
58|      expect(service.isAboveNisab(4000, 5000)).toBe(false);
59|    });
60|  });
61|});
62|