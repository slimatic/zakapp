import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * MetalPriceScraperService
 * Scrapes live gold and silver prices in user's local currency.
 * Source: livepriceofgold.com (has country-specific pages with local prices)
 * 
 * This avoids the need for currency conversion APIs by scraping prices
 * directly in the target currency.
 */
export class MetalPriceScraperService {
    /**
     * Map of currency codes to country slugs used in livepriceofgold.com URLs
     * 
     * Gold URL pattern: https://www.livepriceofgold.com/{country}-gold-price-per-gram.html
     * Silver URL pattern: https://www.livepriceofgold.com/silver-price/{country}.html
     */
    private static readonly CURRENCY_TO_COUNTRY: Record<string, string> = {
        'USD': 'usa',
        'EUR': 'europe',      // Uses eurozone pricing
        'GBP': 'uk',
        'SAR': 'saudi-arabia',
        'AED': 'uae',
        'EGP': 'egypt',
        'TRY': 'turkey',
        'INR': 'india',
        'PKR': 'pakistan',
        'BDT': 'bangladesh',
        'MYR': 'malaysia',
        'IDR': 'indonesia',
        'AUD': 'australia',
        'CAD': 'canada',
        'KWD': 'kuwait',
        'QAR': 'qatar',
        'BHD': 'bahrain',
        'OMR': 'oman',
        'JOD': 'jordan',
    };

    /**
     * Scrape current Gold price per Gram in specified currency
     * Falls back to USD and logs warning if currency not supported
     */
    async scrapeGoldPrice(currency: string = 'USD'): Promise<number> {
        const countrySlug = MetalPriceScraperService.CURRENCY_TO_COUNTRY[currency.toUpperCase()];

        if (!countrySlug) {
            console.warn(`Currency ${currency} not mapped to country, falling back to USD`);
            return this.scrapeGoldPriceForCountry('usa');
        }

        try {
            return await this.scrapeGoldPriceForCountry(countrySlug);
        } catch (error) {
            console.error(`Failed to scrape gold price for ${currency} (${countrySlug}):`, error);

            // Fall back to USD if country-specific scrape fails
            if (currency !== 'USD') {
                console.log('Falling back to USD gold price...');
                return this.scrapeGoldPriceForCountry('usa');
            }
            throw error;
        }
    }

    /**
     * Scrape gold price from country-specific page
     */
    private async scrapeGoldPriceForCountry(countrySlug: string): Promise<number> {
        const url = `https://www.livepriceofgold.com/${countrySlug}-gold-price-per-gram.html`;
        console.log(`Scraping Gold price from ${url}...`);

        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(data);
        const title = $('title').text();
        console.log('Page Title:', title);

        // Strategy 1: Parse price from page title
        // Example: "Pakistan Gold Price per Gram: 41,275.08 Pakistani rupees (PKR) today"
        // Example: "US Gold Price per Gram: $147.82 USD Today"
        const priceMatch = title.match(/Price\s*per\s*Gram[:\s]*[^\d]*([\d,]+\.?\d*)/i);
        if (priceMatch && priceMatch[1]) {
            const price = parseFloat(priceMatch[1].replace(/,/g, ''));
            if (!isNaN(price) && price > 0) {
                console.log(`Scraped Gold Price (from Title): ${price}`);
                return price;
            }
        }

        // Strategy 2: Look for "PER GRAM" in body followed by price
        const bodyText = $('body').text();
        const bodyMatch = bodyText.match(/PER GRAM\s+([\d,]+\.?\d*)/i);
        if (bodyMatch && bodyMatch[1]) {
            const price = parseFloat(bodyMatch[1].replace(/,/g, ''));
            if (!isNaN(price) && price > 0) {
                console.log(`Scraped Gold Price (from Body): ${price}`);
                return price;
            }
        }

        throw new Error(`Could not parse gold price from ${url}`);
    }

    /**
     * Scrape current Silver price per Gram in specified currency
     * Uses multiple strategies and sources for robustness
     */
    async scrapeSilverPrice(currency: string = 'USD'): Promise<number> {
        const countrySlug = MetalPriceScraperService.CURRENCY_TO_COUNTRY[currency.toUpperCase()];

        if (!countrySlug) {
            console.warn(`Currency ${currency} not mapped to country, falling back to USD`);
            return this.scrapeSilverPriceForCountry('us');
        }

        // Silver URLs use slightly different country codes in some cases
        const silverCountrySlug = this.getSilverCountrySlug(countrySlug);

        try {
            return await this.scrapeSilverPriceForCountry(silverCountrySlug);
        } catch (error) {
            console.error(`Failed to scrape silver price for ${currency} (${silverCountrySlug}):`, error);

            // Fall back to USD if country-specific scrape fails
            if (currency !== 'USD') {
                console.log('Falling back to USD silver price...');
                return this.scrapeSilverPriceForCountry('us');
            }
            throw error;
        }
    }

    /**
     * Map gold country slug to silver country slug (some differ)
     */
    private getSilverCountrySlug(goldSlug: string): string {
        const silverSlugOverrides: Record<string, string> = {
            'usa': 'us',
            'uk': 'uk',
            'europe': 'europe',
            // Most countries use same slug for silver
        };
        return silverSlugOverrides[goldSlug] || goldSlug;
    }

    /**
     * Scrape silver price from country-specific page
     */
    private async scrapeSilverPriceForCountry(countrySlug: string): Promise<number> {
        const url = `https://www.livepriceofgold.com/silver-price/${countrySlug}.html`;
        console.log(`Scraping Silver price from ${url}...`);

        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(data);
        const title = $('title').text();
        console.log('Silver Page Title:', title);

        // Strategy 1: Look for per-ounce price and convert to grams
        // Title format varies, often shows ounce price
        const ounceMatch = title.match(/[\d,]+\.?\d*/);
        if (ounceMatch) {
            const possibleOz = parseFloat(ounceMatch[0].replace(/,/g, ''));
            // Sanity check: ounce prices should be 20-100+ for silver
            if (!isNaN(possibleOz) && possibleOz > 15 && possibleOz < 200) {
                const pricePerGram = possibleOz / 31.1034768;
                console.log(`Converted Silver from Ounce: ${possibleOz}/oz -> ${pricePerGram.toFixed(4)}/g`);
                return pricePerGram;
            }
        }

        // Strategy 2: Look in tables for "per gram" row
        const bodyText = $('body').text();

        // Look for gram price pattern in body
        const gramMatch = bodyText.match(/gram[^0-9]*?([\d,]+\.?\d*)/i);
        if (gramMatch && gramMatch[1]) {
            const price = parseFloat(gramMatch[1].replace(/,/g, ''));
            // Silver per gram should be reasonable (< 100 for most currencies relative to gold)
            // For PKR: ~480/g, for INR: ~95/g, for USD: ~1/g
            // Let's use a ratio check: silver should be ~60-80x cheaper than gold
            if (!isNaN(price) && price > 0) {
                console.log(`Scraped Silver Price (gram pattern): ${price}`);
                return price;
            }
        }

        // Strategy 3: For livepriceofgold, silver page sometimes shows "per gram" differently
        // Look for table cells with "GRAM" label
        let gramPrice: number | null = null;
        $('table tr').each((_, row) => {
            const rowText = $(row).text().toLowerCase();
            if (rowText.includes('gram') && !gramPrice) {
                const priceMatch = $(row).text().match(/([\d,]+\.?\d*)/);
                if (priceMatch) {
                    const price = parseFloat(priceMatch[1].replace(/,/g, ''));
                    if (price > 0 && price < 10000) { // Reasonable range for silver per gram
                        gramPrice = price;
                    }
                }
            }
        });

        if (gramPrice) {
            console.log(`Scraped Silver Price (table gram row): ${gramPrice}`);
            return gramPrice;
        }

        throw new Error(`Could not parse silver price from ${url}`);
    }

    /**
     * Get list of supported currencies that have country mappings
     */
    getSupportedCurrencies(): string[] {
        return Object.keys(MetalPriceScraperService.CURRENCY_TO_COUNTRY);
    }
}

export const metalPriceScraper = new MetalPriceScraperService();
