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
            return this.scrapeGoldPriceForCountry('usa');
        }

        try {
            return await this.scrapeGoldPriceForCountry(countrySlug);
        } catch (error) {
            if (currency !== 'USD') {
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

        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(data);
        const title = $('title').text();

        // Strategy 1: Parse price from page title
        // Example: "Pakistan Gold Price per Gram: 41,275.08 Pakistani rupees (PKR) today"
        // Example: "US Gold Price per Gram: $147.82 USD Today"
        const priceMatch = title.match(/Price\s*per\s*Gram[:\s]*[^\d]*([\d,]+\.?\d*)/i);
        if (priceMatch && priceMatch[1]) {
            const price = parseFloat(priceMatch[1].replace(/,/g, ''));
            if (!isNaN(price) && price > 0) {
                return price;
            }
        }

        // Strategy 2: Look for "PER GRAM" in body followed by price
        const bodyText = $('body').text();
        const bodyMatch = bodyText.match(/PER GRAM\s+([\d,]+\.?\d*)/i);
        if (bodyMatch && bodyMatch[1]) {
            const price = parseFloat(bodyMatch[1].replace(/,/g, ''));
            if (!isNaN(price) && price > 0) {
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
            return this.scrapeSilverPriceForCountry('us');
        }

        // Silver URLs use slightly different country codes in some cases
        const silverCountrySlug = this.getSilverCountrySlug(countrySlug);

        try {
            return await this.scrapeSilverPriceForCountry(silverCountrySlug);
        } catch (error) {
            if (currency !== 'USD') {
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
     * 
     * IMPORTANT: The page has a gold price header "PER GRAM 147.xxx" that must be avoided.
     * We specifically look for the "(999) Silver/gram" table row which has the actual silver price.
     */
    private async scrapeSilverPriceForCountry(countrySlug: string): Promise<number> {
        const url = `https://www.livepriceofgold.com/silver-price/${countrySlug}.html`;

        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(data);
        const title = $('title').text();

        // Strategy 1: Look for "(999) Silver/gram" table row - this is 999 fine silver
        // The table structure is: <tr><td>(999) Silver/gram</td><td class="bold3">2.90</td>...
        let silverPrice: number | null = null;

        $('table tr').each((_, row) => {
            const rowText = $(row).text();
            // Look specifically for pure silver (999) row
            if (rowText.includes('999') && rowText.toLowerCase().includes('silver') && rowText.toLowerCase().includes('gram')) {
                // Get the price from the bold3 class cell (second td usually)
                const priceCell = $(row).find('td.bold3').first();
                if (priceCell.length) {
                    const priceText = priceCell.text().trim();
                    const price = parseFloat(priceText.replace(/,/g, ''));
                    if (!isNaN(price) && price > 0) {
                        silverPrice = price;
                        return false; // Exit loop
                    }
                }

                // Fallback: try to extract any number from the row after "999"
                const match = rowText.match(/999[^\d]*Silver[^\d]*gram[^\d]*(\d+\.?\d*)/i);
                if (match && match[1]) {
                    const price = parseFloat(match[1]);
                    if (!isNaN(price) && price > 0) {
                        silverPrice = price;
                        return false;
                    }
                }
            }
        });

        if (silverPrice) {
            return silverPrice;
        }

        // Strategy 2: Look for any "Silver/gram" row (not just 999)
        $('table tr').each((_, row) => {
            const rowText = $(row).text().toLowerCase();
            if (rowText.includes('silver') && rowText.includes('gram') && !silverPrice) {
                const priceCell = $(row).find('td.bold3').first();
                if (priceCell.length) {
                    const price = parseFloat(priceCell.text().replace(/,/g, ''));
                    if (!isNaN(price) && price > 0) {
                        silverPrice = price;
                        return false;
                    }
                }
            }
        });

        if (silverPrice) {
            return silverPrice;
        }

        // Strategy 3: Look for silver ounce price and convert
        // Sometimes the page shows ounce price in a data table
        const bodyText = $('body').text();
        const ounceMatch = bodyText.match(/silver[^$]*\$?\s*([\d,.]+)\s*(?:per\s*)?(?:oz|ounce)/i);
        if (ounceMatch && ounceMatch[1]) {
            const pricePerOz = parseFloat(ounceMatch[1].replace(/,/g, ''));
            if (!isNaN(pricePerOz) && pricePerOz > 15 && pricePerOz < 200) {
                const pricePerGram = pricePerOz / 31.1034768;
                return pricePerGram;
            }
        }

        throw new Error(`Could not find silver price on ${url}. Check if page structure changed.`);
    }

    /**
     * Get list of supported currencies that have country mappings
     */
    getSupportedCurrencies(): string[] {
        return Object.keys(MetalPriceScraperService.CURRENCY_TO_COUNTRY);
    }
}

export const metalPriceScraper = new MetalPriceScraperService();

