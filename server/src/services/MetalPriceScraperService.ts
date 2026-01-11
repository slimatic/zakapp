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
    private static readonly FALLBACK_GOLD = 65.0; // USD/g
    private static readonly FALLBACK_SILVER = 0.85; // USD/g

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
     */
    async scrapeSilverPrice(): Promise<number> {
        try {
            // Use the US Silver page which often lists gram prices or at least ounce prices
            // Based on user request URL: https://www.livepriceofgold.com/silver-price
            // But better: https://www.livepriceofgold.com/silver-price/us.html might be more specific
            // Let's try the generic one first as it often has a summary table
            const url = 'https://www.livepriceofgold.com/silver-price/us.html';

            console.log(`Scraping Silver price from ${url}...`);
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(data);
            const title = $('title').text();
            console.log('Silver Page Title:', title);

            // Title often: "Silver Price today in US: $30.50 Ounce, $0.98 Gram..."
            const gramMatch = title.match(/\$\s*([\d,]+\.?\d*)\s*Gram/i);
            if (gramMatch && gramMatch[1]) {
                const price = parseFloat(gramMatch[1].replace(/,/g, ''));
                if (!isNaN(price) && price > 0) {
                    console.log(`Scraped Silver Price (Gram): ${price}`);
                    return price;
                }
            }

            // Search for "Ounce" price and convert
            const ounceMatch = title.match(/\$\s*([\d,]+\.?\d*)\s*Ounce/i); // "Silver Price: $30.50 Ounce"
            if (ounceMatch && ounceMatch[1]) {
                const pricePerOz = parseFloat(ounceMatch[1].replace(/,/g, ''));
                if (!isNaN(pricePerOz) && pricePerOz > 0) {
                    const pricePerGram = pricePerOz / 31.1034768; // Troy Ounce to Grams
                    console.log(`Scraped Silver Price (Ounce: ${pricePerOz} -> Gram: ${pricePerGram})`);
                    return pricePerGram;
                }
            }

            // Body fallback similar to gold
            const bodyText = $('body').text();
            const bodyGramMatch = bodyText.match(/PER GRAM\s+([\d,]+\.?\d*)\s*\$/i);
            if (bodyGramMatch && bodyGramMatch[1]) {
                const price = parseFloat(bodyGramMatch[1].replace(/,/g, ''));
                if (!isNaN(price) && price > 0) {
                    console.log(`Scraped Silver Price (from Body): ${price}`);
                    return price;
                }
            }

            throw new Error('Could not parse silver price from page');

        } catch (error) {
            console.error('Silver Scraping Failed:', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }
}

export const metalPriceScraper = new MetalPriceScraperService();
