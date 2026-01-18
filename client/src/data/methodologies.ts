/**
 * Copyright (c) 2024 ZakApp Contributors
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

/**
 * Islamic Zakat Calculation Methodologies
 * 
 * Comprehensive educational content for different Zakat calculation methodologies
 * based on authentic Islamic scholarly sources.
 * 
 * ⚠️ IMPORTANT DISCLAIMER:
 * The information provided here is for educational purposes only.
 * Users should consult with qualified Islamic scholars for specific guidance
 * on their Zakat obligations, as individual circumstances may vary.
 */

export interface Methodology {
  id: 'standard' | 'hanafi' | 'shafii' | 'custom';
  name: string;
  shortDescription: string;
  icon: string;

  // Detailed Information
  overview: string;
  historicalContext: string;
  nisabCalculation: {
    description: string;
    method: string;
    threshold: string;
  };
  assetTreatment: {
    description: string;
    rules: string[];
  };
  whenToUse: string[];
  practicalExample: {
    scenario: string;
    calculation: string;
    result: string;
  };
  sources: string[];
  characteristics: string[];

  // Regional Information
  commonRegions?: string[];
  scholarlyBasis?: string;
}

export const methodologies: Record<string, Methodology> = {
  standard: {
    id: 'standard',
    name: 'Standard (AAOIFI)',
    shortDescription: 'Modern widely-accepted standard based on AAOIFI guidelines',
    icon: '⭐',

    overview: `The Standard methodology follows the Accounting and Auditing Organization for Islamic Financial Institutions (AAOIFI) guidelines. 
    This is the most widely accepted modern standard for Zakat calculation, providing clear rules for contemporary financial instruments and assets.`,

    historicalContext: `AAOIFI was established in 1991 in Bahrain to develop and issue standards for Islamic financial institutions. 
    The Zakat standards were developed by a committee of prominent Islamic scholars and financial experts to address modern financial instruments 
    while adhering to classical Islamic jurisprudence principles.`,

    nisabCalculation: {
      description: 'Based on the gold standard',
      method: 'Gold-based nisab threshold',
      threshold: '85 grams of gold (approximately $5,000-6,000 USD depending on current gold prices)'
    },

    assetTreatment: {
      description: 'Comprehensive categorization for modern assets',
      rules: [
        'Cash and bank savings: 2.5% Zakat',
        'Gold and silver: 2.5% Zakat (if above nisab)',
        'Business inventory: 2.5% on current market value',
        'Investment accounts: 2.5% on total value',
        'Stocks and shares: 2.5% on current market value',
        'Cryptocurrency: Treated as currency, 2.5% Zakat',
        'Rental property: Zakat on rental income, not property value',
        'Personal residence: Not subject to Zakat',
        'Debts owed to you: Include if collectible'
      ]
    },

    whenToUse: [
      'You want to follow widely-accepted modern standards',
      'You have diverse modern financial instruments',
      'You prefer a clear, standardized approach',
      'Your region follows AAOIFI standards',
      'You want mainstream scholarly consensus'
    ],

    practicalExample: {
      scenario: 'Ahmad has $50,000 in savings, $30,000 in gold, $20,000 in stocks, and $10,000 in cryptocurrency. Total wealth: $110,000.',
      calculation: 'Total Zakatable Wealth: $110,000\nNisab (85g gold): $5,500\nWealth exceeds nisab ✓\nZakat Rate: 2.5%\nZakat Due: $110,000 × 0.025',
      result: '$2,750 Zakat due'
    },

    sources: [
      'AAOIFI Shariah Standards - Zakat Standard',
      'Contemporary Fatawa on Zakat',
      'Islamic Fiqh Academy resolutions'
    ],

    characteristics: [
      '2.5% rate on all zakatable wealth',
      'Gold-based nisab (85g of gold)',
      'Clear rules for modern financial instruments',
      'Most widely accepted by Islamic institutions'
    ],

    commonRegions: ['Global', 'GCC Countries', 'Southeast Asia', 'Western Countries'],
    scholarlyBasis: 'Contemporary scholarly consensus (Ijma\') based on classical principles'
  },

  hanafi: {
    id: 'hanafi',
    name: 'Hanafi Method',
    shortDescription: 'Traditional method using silver-based nisab, more inclusive',
    icon: '🌙',

    overview: `The Hanafi methodology follows the Hanafi school of Islamic jurisprudence (madhab), one of the four major Sunni schools. 
    It uses the silver-based nisab, which typically results in a lower threshold, making Zakat obligatory for more people and 
    ensuring greater wealth distribution to those in need.`,

    historicalContext: `Named after Imam Abu Hanifa (699-767 CE), this school originated in Kufa, Iraq. 
    The Hanafi approach to Zakat emphasizes inclusivity and maximizing benefit to the poor. The use of silver as the nisab standard 
    was prevalent in early Islamic history and continues in regions following Hanafi jurisprudence.`,

    nisabCalculation: {
      description: 'Based on the silver standard OR gold standard, whichever is lower',
      method: 'Silver-based nisab threshold (typically lower)',
      threshold: '595 grams of silver (approximately $350-500 USD) OR 85 grams of gold, whichever is LOWER'
    },

    assetTreatment: {
      description: 'Traditional categorization with emphasis on silver standard',
      rules: [
        'Cash and savings: 2.5% Zakat if above silver nisab',
        'Gold and silver ornaments: Zakat due even on jewelry (Hanafi view)',
        'Business goods: 2.5% on inventory value',
        'Agricultural produce: Different rates (5-10%) based on irrigation',
        'Livestock: Specific rates based on numbers',
        'Debts: May be deducted before calculating Zakat',
        'Personal use items: Not subject to Zakat',
        'Mixed use items: Scholarly difference of opinion'
      ]
    },

    whenToUse: [
      'You follow the Hanafi school of jurisprudence',
      'You want a more inclusive approach that benefits more recipients',
      'Your local scholars recommend the Hanafi method',
      'You are in a region with Hanafi tradition (South Asia, Turkey, Central Asia)',
      'You prefer the lower nisab threshold for maximum charity impact'
    ],

    practicalExample: {
      scenario: 'Fatima has $15,000 in savings, $8,000 in jewelry, and $7,000 in business inventory. Total wealth: $30,000.',
      calculation: 'Total Zakatable Wealth: $30,000\nNisab (Silver): $400\nNisab (Gold): $5,500\nUse lower threshold (Silver): $400\nWealth exceeds nisab ✓\nZakat Rate: 2.5%\nZakat Due: $30,000 × 0.025',
      result: '$750 Zakat due (using silver nisab)'
    },

    sources: [
      'Al-Hidayah by Al-Marghinani',
      'Fatawa Alamgiri',
      'Contemporary Hanafi Fiqh councils',
      'Imam Abu Hanifa\'s authentic narrations'
    ],

    characteristics: [
      'Silver-based nisab (595g silver)',
      'Lower threshold benefits more recipients',
      'Zakat on jewelry (even personal use)',
      'Traditional approach from Hanafi madhab'
    ],

    commonRegions: ['South Asia', 'Turkey', 'Central Asia', 'Parts of Middle East'],
    scholarlyBasis: 'Hanafi School of Jurisprudence (Madhab)'
  },

  shafii: {
    id: 'shafii',
    name: 'Shafi\'i Method',
    shortDescription: 'Traditional method with detailed categorization',
    icon: '📚', overview: `The Shafi'i methodology follows the Shafi'i school of Islamic jurisprudence, known for its detailed and systematic approach 
    to Zakat calculation. It provides specific rules for different asset categories based on classical Islamic texts and scholarly consensus.`,

    historicalContext: `Named after Imam Muhammad ibn Idris al-Shafi'i (767-820 CE), this school developed in Mecca and later Egypt. 
    The Shafi'i approach is known for its emphasis on hadith (prophetic traditions) and detailed categorization of rulings. 
    It is widely followed in East Africa, Southeast Asia, and parts of the Middle East.`,

    nisabCalculation: {
      description: 'Based on the gold standard',
      method: 'Gold-based nisab threshold',
      threshold: '85 grams of gold (same as standard method)'
    },

    assetTreatment: {
      description: 'Detailed categorization with specific rules for each asset type',
      rules: [
        'Cash and liquid assets: 2.5% Zakat',
        'Trade goods: 2.5% on market value of inventory',
        'Gold and silver: 2.5% (jewelry for personal use exempt in Shafi\'i view)',
        'Agricultural produce: 5% (irrigated) or 10% (rain-fed)',
        'Livestock: Specific detailed rates',
        'Mines and buried treasure: 20% (Khums)',
        'Property for trade: 2.5% on value',
        'Personal residence: Exempt',
        'Business equipment: Exempt (Zakat on produce/profit)'
      ]
    },

    whenToUse: [
      'You follow the Shafi\'i school of jurisprudence',
      'You want detailed, specific rules for different assets',
      'You are in a region with Shafi\'i tradition (Southeast Asia, East Africa)',
      'You prefer a methodology with clear hadith-based evidence',
      'Your local scholars follow the Shafi\'i madhab'
    ],

    practicalExample: {
      scenario: 'Yusuf has a business with $80,000 inventory, $40,000 in cash, and $15,000 in agricultural income. He calculates separately by category.',
      calculation: 'Business Inventory: $80,000 × 2.5% = $2,000\nCash: $40,000 × 2.5% = $1,000\nAgriculture (irrigated): $15,000 × 5% = $750\nTotal Zakat',
      result: '$3,750 Zakat due (category-specific calculation)'
    },

    sources: [
      'Al-Umm by Imam al-Shafi\'i',
      'Minhaj al-Talibin by Imam al-Nawawi',
      'Contemporary Shafi\'i Fiqh councils',
      'Authenticated hadiths in Shafi\'i compilations'
    ],

    characteristics: [
      'Gold-based nisab (85g gold)',
      'Detailed asset categorization',
      'Personal jewelry exempt from Zakat',
      'Strong hadith-based methodology'
    ],

    commonRegions: ['Southeast Asia', 'East Africa', 'Yemen', 'Parts of Middle East'],
    scholarlyBasis: 'Shafi\'i School of Jurisprudence (Madhab)'
  },

  custom: {
    id: 'custom',
    name: 'Custom Method',
    shortDescription: 'User-defined rules based on local scholar guidance',
    icon: '⚙️',

    overview: `The Custom methodology allows users to define their own Zakat calculation rules based on guidance from their local Islamic scholars. 
    This is useful for those following specific regional practices, particular scholarly opinions, or dealing with unique circumstances 
    not covered by standard methodologies.`,

    historicalContext: `Throughout Islamic history, scholars have provided specific guidance for unique situations and regional contexts. 
    The Custom method acknowledges that Zakat jurisprudence can vary based on different scholarly interpretations (ikhtilaf) 
    and local customs ('urf) that align with Islamic principles.`,

    nisabCalculation: {
      description: 'User-defined based on scholar guidance',
      method: 'Can be gold-based, silver-based, or custom threshold',
      threshold: 'Configurable based on local scholarly fatwa'
    },

    assetTreatment: {
      description: 'Flexible rules based on specific scholarly guidance',
      rules: [
        'User defines specific asset categories',
        'Custom rates can be applied (typically 2.5% but adjustable)',
        'Special rules for unique assets or situations',
        'Accommodation for regional variations',
        'Can combine elements from different madhabs based on scholarly approval',
        'Useful for complex financial situations',
        'Must be based on authentic scholarly guidance'
      ]
    },

    whenToUse: [
      'You have unique financial circumstances',
      'Your local scholar provides specific guidance different from standard methods',
      'You are following a specific scholarly opinion (fatwa)',
      'You need to accommodate regional variations',
      'Standard methods don\'t address your specific situation',
      'You want to be very conservative and calculate higher Zakat'
    ],

    practicalExample: {
      scenario: 'A user following a specific scholar who recommends 3% Zakat on investments to be extra cautious, and uses a custom nisab based on local currency.',
      calculation: 'Based on scholar guidance:\nInvestments: $100,000 × 3% = $3,000\nOther assets: Custom rules apply\nCustom nisab threshold: $4,000',
      result: 'Zakat calculated according to specific scholarly guidance'
    },

    sources: [
      'Local Islamic scholars',
      'Specific fatwas from recognized authorities',
      'Regional fiqh councils',
      'Classical texts with specific scholarly interpretations'
    ],

    characteristics: [
      'Fully customizable nisab and rates',
      'Based on specific scholarly guidance',
      'Accommodates unique situations',
      'Requires consultation with scholars'
    ],

    commonRegions: ['Variable - based on individual circumstances'],
    scholarlyBasis: 'Specific scholarly opinion (Fatwa) or combination of approaches'
  }
};

/**
 * Get methodology by ID
 */
export const getMethodology = (id: string): Methodology | undefined => {
  return methodologies[id];
};

/**
 * Get all methodologies as an array
 */
export const getAllMethodologies = (): Methodology[] => {
  return Object.values(methodologies);
};

/**
 * Methodology comparison data
 */
export interface MethodologyComparison {
  feature: string;
  standard: string;
  hanafi: string;
  shafii: string;
  custom: string;
}

export const methodologyComparison: MethodologyComparison[] = [
  {
    feature: 'Nisab Threshold',
    standard: '85g gold (~$5,500)',
    hanafi: '595g silver OR 85g gold (lower value)',
    shafii: '85g gold (~$5,500)',
    custom: 'User-defined'
  },
  {
    feature: 'Zakat Rate',
    standard: '2.5% on all assets',
    hanafi: '2.5% on qualifying assets',
    shafii: '2.5-20% by category',
    custom: 'Configurable'
  },
  {
    feature: 'Personal Jewelry',
    standard: 'Exempt (personal use)',
    hanafi: 'Zakatable (even personal)',
    shafii: 'Exempt (personal use)',
    custom: 'User choice'
  },
  {
    feature: 'Modern Investments',
    standard: 'Clear rules provided',
    hanafi: 'Scholarly guidance needed',
    shafii: 'Detailed categorization',
    custom: 'User-defined rules'
  },
  {
    feature: 'Best For',
    standard: 'Modern diverse portfolio',
    hanafi: 'Maximum charity impact',
    shafii: 'Detailed categorization',
    custom: 'Unique circumstances'
  },
  {
    feature: 'Scholarly Basis',
    standard: 'AAOIFI/Contemporary',
    hanafi: 'Hanafi Madhab',
    shafii: 'Shafi\'i Madhab',
    custom: 'Specific fatwa'
  }
];

/**
 * Important disclaimer for users
 */
export const DISCLAIMER = `
⚠️ IMPORTANT DISCLAIMER

The information provided about Zakat calculation methodologies is for educational 
purposes only and should not be considered as definitive religious guidance.

Please consult with qualified Islamic scholars or recognized Islamic institutions 
for specific advice regarding your Zakat obligations. Individual circumstances, 
regional variations, and contemporary scholarly opinions may affect how Zakat 
should be calculated in your particular situation.

This tool is designed to assist with calculations but cannot replace the guidance 
of knowledgeable scholars who can address your specific circumstances.
`;
