import { metalPriceScraper } from '../services/MetalPriceScraperService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MetalPriceScraperService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('scrapeGoldPrice', () => {
        it('should extract gold price from page title', async () => {
            const html = `<html><head><title>US Gold Price per Gram: $145.50 USD - Live</title></head><body>...</body></html>`;
            mockedAxios.get.mockResolvedValueOnce({ data: html });

            const price = await metalPriceScraper.scrapeGoldPrice();
            expect(price).toBe(145.50);
            expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('usa-gold-price-per-gram'), expect.anything());
        });

        it('should extract gold price from body as fallback', async () => {
            const html = `<html><head><title>Some Generic Title</title></head>
        <body>
            <div>SPOT GOLD 2000</div>
            <div>PER GRAM 145.22 $</div>
        </body></html>`;
            mockedAxios.get.mockResolvedValueOnce({ data: html });

            const price = await metalPriceScraper.scrapeGoldPrice();
            expect(price).toBe(145.22);
        });

        it('should throw error if price cannot be found', async () => {
            const html = `<html><head><title>No Price Here</title></head><body>No Price Here</body></html>`;
            mockedAxios.get.mockResolvedValueOnce({ data: html });

            await expect(metalPriceScraper.scrapeGoldPrice()).rejects.toThrow();
        });
    });

    describe('scrapeSilverPrice', () => {
        it('should extract silver price from gram format in title', async () => {
            const html = `<html><head><title>Silver Price today: $0.95 Gram, $29.50 Ounce</title></head><body>...</body></html>`;
            mockedAxios.get.mockResolvedValueOnce({ data: html });

            const price = await metalPriceScraper.scrapeSilverPrice();
            expect(price).toBe(0.95);
        });

        it('should convert ounce price if gram price missing', async () => {
            const html = `<html><head><title>Silver Price: $31.10 Ounce</title></head><body>...</body></html>`;
            mockedAxios.get.mockResolvedValueOnce({ data: html });

            // 31.10 / 31.103... ~= 1.00
            const price = await metalPriceScraper.scrapeSilverPrice();
            expect(price).toBeCloseTo(1.00, 2);
        });
    });
});
