
import { NisabService } from '../NisabService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NisabService', () => {
    let service: NisabService;

    beforeEach(() => {
        service = new NisabService();
        service.clearCache();
        jest.clearAllMocks();
        process.env.GOLD_API_KEY = 'test-api-key';
    });

    afterEach(() => {
        delete process.env.GOLD_API_KEY;
    });

    it('should fetch live gold price successfully', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            data: {
                price_gram_24k: 75.50,
                price: 2348.00 // Ounce price
            }
        });

        const price = await service['getCurrentGoldPrice']('USD');
        expect(price).toBe(75.50);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            expect.stringContaining('/api/XAU/USD'),
            expect.anything()
        );
    });

    it('should fallback to price per ounce calculation if gram price missing', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            data: {
                price: 2348.00 // Ounce price ~ $75.49/g
            }
        });

        const price = await service['getCurrentGoldPrice']('USD');
        expect(price).toBeCloseTo(2348.00 / 31.1034768, 4);
    });

    it('should fallback to static value on API error', async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

        const price = await service['getCurrentGoldPrice']('USD');
        expect(price).toBe(65); // Static fallback
    });

    it('should use cache if valid', async () => {
        // First call - API success
        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            data: { price_gram_24k: 80.00 }
        });

        await service['getCurrentGoldPrice']('USD');

        // Second call - should use cache, no API call
        mockedAxios.get.mockClear();
        const price = await service['getCurrentGoldPrice']('USD');

        expect(price).toBe(80.00);
        expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should calculate silver nisab correctly', async () => {
        // Mock Gold call first (success) - needed because calculateNisab fetches both
        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            data: { price_gram_24k: 70.00 } // Gold price
        });

        // Mock Silver call second (success)
        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            data: { price_gram_24k: 1.20 } // Silver price
        });

        const nisabInfo = await service.calculateNisab('standard', 'USD');
        // Silver Nisab = 612.36g * 1.20
        expect(nisabInfo.silverNisab).toBeCloseTo(612.36 * 1.20, 2);
    });
});
