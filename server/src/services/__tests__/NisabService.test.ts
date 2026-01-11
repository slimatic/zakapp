import { NisabService } from '../NisabService';
import { metalPriceScraper } from '../MetalPriceScraperService';
import axios from 'axios';

jest.mock('../MetalPriceScraperService');
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NisabService', () => {
    let service: NisabService;

    beforeEach(() => {
        service = new NisabService();
        service.clearCache();
        jest.clearAllMocks();
        process.env.GOLD_API_KEY = 'test-api-key';

        // Setup default scraper mock values
        (metalPriceScraper.scrapeGoldPrice as jest.Mock).mockResolvedValue(65.0);
        (metalPriceScraper.scrapeSilverPrice as jest.Mock).mockResolvedValue(0.85); // Matches static fallback for consistency
    });

    afterEach(() => {
        delete process.env.GOLD_API_KEY;
    });

    it('should fetch live gold price successfully', async () => {
        // Scraper success
        (metalPriceScraper.scrapeGoldPrice as jest.Mock).mockResolvedValueOnce(75.50);

        const price = await service['getCurrentGoldPrice']('USD');
        expect(price).toBe(75.50);
        expect(metalPriceScraper.scrapeGoldPrice).toHaveBeenCalled();
        expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should fallback to API if scraper fails', async () => {
        // Scraper failure
        (metalPriceScraper.scrapeGoldPrice as jest.Mock).mockRejectedValue(new Error('Scraper Fail'));

        // API Success
        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            data: {
                price: 2348.00 // Ounce price
            }
        });

        const price = await service['getCurrentGoldPrice']('USD');
        expect(price).toBeCloseTo(2348.00 / 31.1034768, 4);
        expect(metalPriceScraper.scrapeGoldPrice).toHaveBeenCalled();
        expect(mockedAxios.get).toHaveBeenCalledWith(
            expect.stringContaining('/api/XAU/USD'),
            expect.anything()
        );
    });

    it('should fallback to static value on API error', async () => {
        // Mock scraper failure
        (metalPriceScraper.scrapeGoldPrice as jest.Mock).mockRejectedValue(new Error('Scraper failed'));
        // Mock API failure
        mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

        const price = await service['getCurrentGoldPrice']('USD');
        expect(price).toBe(65); // Static fallback
    });

    it('should use cache if valid', async () => {
        // First call - Scraper success
        (metalPriceScraper.scrapeGoldPrice as jest.Mock).mockResolvedValueOnce(80.00);

        await service['getCurrentGoldPrice']('USD');

        // Second call - should use cache, no calls
        jest.clearAllMocks(); // Clear call history

        const price = await service['getCurrentGoldPrice']('USD');

        expect(price).toBe(80.00);
        expect(metalPriceScraper.scrapeGoldPrice).not.toHaveBeenCalled();
        expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should calculate silver nisab correctly', async () => {
        // Mock Gold scraper (success)
        (metalPriceScraper.scrapeGoldPrice as jest.Mock).mockResolvedValueOnce(70.00);

        // Mock Silver scraper (success)
        (metalPriceScraper.scrapeSilverPrice as jest.Mock).mockResolvedValueOnce(1.20);

        const nisabInfo = await service.calculateNisab('standard', 'USD');
        // Silver Nisab = 612.36g * 1.20
        expect(nisabInfo.silverNisab).toBeCloseTo(612.36 * 1.20, 2);
    });
});
