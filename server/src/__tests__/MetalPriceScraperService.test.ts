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

import { vi, type Mocked } from 'vitest';
import { metalPriceScraper } from '../services/MetalPriceScraperService';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = axios as Mocked<typeof axios>;

describe('MetalPriceScraperService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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

        it('should ignore high values (gold price) in body and throw or find correct silver price', async () => {
            // Simulator: Gold price appears first in sidebar
            const html = `<html>
                <body>
                    <div class="sidebar">Gold Price: PER GRAM 140.89 $</div>
                    <div class="main">
                        <h1>Silver Price</h1>
                        <div>Silver Price per Gram: $0.98</div>
                    </div>
                </body>
            </html>`;
            mockedAxios.get.mockResolvedValueOnce({ data: html });

            // Should find 0.98 via Strict Body Match, or at least NOT return 140.89
            const price = await metalPriceScraper.scrapeSilverPrice();
            expect(price).toBe(0.98);
        });

        it('should throw error if only high value (gold) is found', async () => {
            const html = `<html><body><div>Gold Price: PER GRAM 140.89 $</div></body></html>`;
            mockedAxios.get.mockResolvedValueOnce({ data: html });

            await expect(metalPriceScraper.scrapeSilverPrice()).rejects.toThrow();
        });
    });
});
