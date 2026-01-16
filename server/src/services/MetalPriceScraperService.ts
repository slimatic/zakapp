import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * MetalPriceScraperService
 * Scrapes live gold and silver prices to avoid API limits.
 * Source: livepriceofgold.com
 */
export class MetalPriceScraperService {
    private static readonly GOLD_URL = 'https://www.livepriceofgold.com/usa-gold-price-per-gram.html';
    private static readonly SILVER_URL = 'https://www.livepriceofgold.com/silver-price.html'; // Main silver page generally has gram price too

    // Fallback static values in case scraping fails entirely
    // Note: These are defaults; NisabService may also check MANUAL_GOLD/SILVER_PRICE_USD env vars.
    private static readonly FALLBACK_GOLD = process.env.MANUAL_GOLD_PRICE_USD ? parseFloat(process.env.MANUAL_GOLD_PRICE_USD) : 65.0;
    private static readonly FALLBACK_SILVER = process.env.MANUAL_SILVER_PRICE_USD ? parseFloat(process.env.MANUAL_SILVER_PRICE_USD) : 0.85;

    /**
     * Scrape current Gold price per Gram in USD
     */
    async scrapeGoldPrice(): Promise<number> {
        try {
            console.log(`Scraping Gold price from ${MetalPriceScraperService.GOLD_URL}...`);
            const { data } = await axios.get(MetalPriceScraperService.GOLD_URL, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(data);

            // Selectors based on inspection (Subject to change if site updates)
            // Usually the site puts the gram price clearly in the content or title
            // Strategy 1: Look for specific table cells or classes
            // Strategy 2: Parse from Page Title which is often "US Gold Price per Gram: $145.00..."

            const title = $('title').text();
            console.log('Page Title:', title);
            // Example: "US Gold Price per Gram: $145.00 USD Today in the United States - Live Price of Gold"

            const priceMatch = title.match(/Price\s*per\s*Gram:\s*\$\s*([\d,]+\.?\d*)/i);
            if (priceMatch && priceMatch[1]) {
                const price = parseFloat(priceMatch[1].replace(/,/g, ''));
                if (!isNaN(price) && price > 0) {
                    console.log(`Scraped Gold Price (from Title): ${price}`);
                    return price;
                }
            }

            // Fallback Strategy: Look for data in body if title parsing fails
            // Note: This is brittle without exact class names, relying on text search near keywords
            // Check for specific text block from previous `view_content_chunk`: "PER GRAM 145.0222 $"
            const bodyText = $('body').text();
            // Regex to find "PER GRAM" followed by number and $
            const bodyMatch = bodyText.match(/PER GRAM\s+([\d,]+\.?\d*)\s*\$/i);
            if (bodyMatch && bodyMatch[1]) {
                const price = parseFloat(bodyMatch[1].replace(/,/g, ''));
                if (!isNaN(price) && price > 0) {
                    console.log(`Scraped Gold Price (from Body): ${price}`);
                    return price;
                }
            }

            throw new Error('Could not parse gold price from page');

        } catch (error) {
            console.error('Gold Scraping Failed:', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    /**
     * Scrape current Silver price per Gram in USD
     * Uses multiple strategies and sources for robustness
     */
    async scrapeSilverPrice(): Promise<number> {
        const MAX_REASONABLE_SILVER_PRICE = 5.0; // Hard cap to prevent grabbing Gold price (~$80-150+)
        const errors: string[] = [];

        // Strategy 1: Try livepriceofgold.com silver page
        try {
            const price = await this.scrapeSilverFromLivePriceOfGold();
            if (price && price > 0 && price < MAX_REASONABLE_SILVER_PRICE) {
                console.log(`Scraped Silver Price (livepriceofgold): ${price}`);
                return price;
            }
        } catch (error) {
            errors.push(`livepriceofgold: ${error instanceof Error ? error.message : 'Unknown'}`);
        }

        // Strategy 2: Try goldprice.org as alternative source
        try {
            const price = await this.scrapeSilverFromGoldpriceOrg();
            if (price && price > 0 && price < MAX_REASONABLE_SILVER_PRICE) {
                console.log(`Scraped Silver Price (goldprice.org): ${price}`);
                return price;
            }
        } catch (error) {
            errors.push(`goldprice.org: ${error instanceof Error ? error.message : 'Unknown'}`);
        }

        // All strategies failed
        console.error('Silver Scraping Failed from all sources:', errors.join('; '));
        throw new Error('Could not parse silver price from any source');
    }

    /**
     * Scrape silver from livepriceofgold.com
     */
    private async scrapeSilverFromLivePriceOfGold(): Promise<number> {
        const url = 'https://www.livepriceofgold.com/silver-price/us.html';

        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(data);
        const title = $('title').text();
        console.log('Silver Page Title:', title);

        // Strategy A: Look for per-ounce price in title and convert
        // Example: "US Silver Price Live - $30.50/oz Today"
        const ounceMatch = title.match(/\$\s*([0-9,.]+)\s*(?:\/?\s*(?:oz|ounce))?/i);
        if (ounceMatch && ounceMatch[1]) {
            const pricePerOz = parseFloat(ounceMatch[1].replace(/,/g, ''));
            if (!isNaN(pricePerOz) && pricePerOz > 20 && pricePerOz < 100) { // Reasonable oz range
                const pricePerGram = pricePerOz / 31.1034768;
                console.log(`Converted Silver Price from Ounce: $${pricePerOz}/oz -> $${pricePerGram.toFixed(4)}/g`);
                return pricePerGram;
            }
        }

        // Strategy B: Look in tables for "per gram" row
        // Search for table cells containing "gram" and nearby dollar amounts
        let gramPrice: number | null = null;
        $('table tr').each((_, row) => {
            const rowText = $(row).text().toLowerCase();
            if (rowText.includes('gram') && !gramPrice) {
                const priceMatch = $(row).text().match(/\$\s*([0-9,.]+)/);
                if (priceMatch) {
                    const price = parseFloat(priceMatch[1].replace(/,/g, ''));
                    if (price > 0 && price < 5.0) {
                        gramPrice = price;
                    }
                }
            }
        });

        if (gramPrice) {
            return gramPrice;
        }

        // Strategy C: Look for specific div/span with silver gram price
        const bodyText = $('body').text();

        // Match "Silver ... per Gram ... $X.XX"
        const silverGramMatch = bodyText.match(/silver[^$]*per\s*gram[^$]*\$([0-9,.]+)/i);
        if (silverGramMatch && silverGramMatch[1]) {
            const price = parseFloat(silverGramMatch[1].replace(/,/g, ''));
            if (price > 0 && price < 5.0) {
                return price;
            }
        }

        throw new Error('Could not find silver gram price on livepriceofgold.com');
    }

    /**
     * Alternative source: goldprice.org
     */
    private async scrapeSilverFromGoldpriceOrg(): Promise<number> {
        const url = 'https://goldprice.org/silver-price.html';

        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(data);

        // goldprice.org typically has format: "1 gram = $X.XX"
        const bodyText = $('body').text();

        // Look for "gram = $X.XX" pattern
        const gramMatch = bodyText.match(/gram\s*=\s*\$?\s*([0-9,.]+)/i);
        if (gramMatch && gramMatch[1]) {
            const price = parseFloat(gramMatch[1].replace(/,/g, ''));
            if (!isNaN(price) && price > 0 && price < 5.0) {
                return price;
            }
        }

        // Alternative: Look for ounce price and convert
        const ounceMatch = bodyText.match(/ounce\s*=\s*\$?\s*([0-9,.]+)/i);
        if (ounceMatch && ounceMatch[1]) {
            const pricePerOz = parseFloat(ounceMatch[1].replace(/,/g, ''));
            if (!isNaN(pricePerOz) && pricePerOz > 20 && pricePerOz < 100) {
                return pricePerOz / 31.1034768;
            }
        }

        throw new Error('Could not find silver price on goldprice.org');
    }
}

export const metalPriceScraper = new MetalPriceScraperService();
