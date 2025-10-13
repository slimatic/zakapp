/**
 * Regional Methodology Mapping
 * 
 * Maps geographical regions to commonly followed Zakat calculation methodologies
 * based on historical scholarly traditions and contemporary practices.
 */

export interface RegionalInfo {
  region: string;
  countries: string[];
  primaryMethodology: 'standard' | 'hanafi' | 'shafi' | 'maliki';
  secondaryMethodologies?: string[];
  description: string;
  scholarlyTradition: string;
  commonPractices: string[];
  notes?: string;
}

export const REGIONAL_METHODOLOGIES: Record<string, RegionalInfo> = {
  'middle-east-gulf': {
    region: 'Middle East - Gulf States',
    countries: ['Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'],
    primaryMethodology: 'standard',
    secondaryMethodologies: ['hanafi', 'maliki'],
    description: 'Gulf states primarily follow AAOIFI standards due to modern Islamic banking infrastructure',
    scholarlyTradition: 'Mix of Hanbali (Saudi) and Maliki (UAE, Kuwait) traditions, with contemporary AAOIFI adoption',
    commonPractices: [
      'Gold-based nisab commonly used',
      'Modern financial instruments well-established',
      'AAOIFI guidelines widely adopted by Islamic banks',
      '2.5% standard rate on most assets',
      'Strong institutional Zakat collection systems'
    ],
    notes: 'These countries have well-developed Islamic finance sectors that follow AAOIFI standards'
  },

  'middle-east-levant': {
    region: 'Middle East - Levant',
    countries: ['Jordan', 'Palestine', 'Lebanon', 'Syria'],
    primaryMethodology: 'hanafi',
    secondaryMethodologies: ['shafi', 'standard'],
    description: 'Levant region has strong Hanafi and Shafi\'i traditions with increasing AAOIFI adoption',
    scholarlyTradition: 'Historical mix of Hanafi and Shafi\'i schools',
    commonPractices: [
      'Silver-based nisab common in Hanafi communities',
      'Gold-based nisab in Shafi\'i communities',
      'Strong emphasis on supporting local poor',
      'Personal consultation with local scholars encouraged',
      'Growing adoption of contemporary standards'
    ]
  },

  'south-asia': {
    region: 'South Asia',
    countries: ['Pakistan', 'India', 'Bangladesh', 'Afghanistan', 'Nepal (Muslim communities)'],
    primaryMethodology: 'hanafi',
    secondaryMethodologies: ['standard'],
    description: 'Hanafi school predominant across South Asia with centuries of scholarly tradition',
    scholarlyTradition: 'Hanafi madhab established through Deoband and Barelvi scholarly traditions',
    commonPractices: [
      'Silver-based nisab (595g) widely used',
      'Lower threshold ensures more wealth is zakatable',
      'Strong emphasis on local Zakat distribution',
      'Jewelry and ornaments zakatable (Hanafi view)',
      'Agricultural Zakat (\'Ushr) commonly calculated',
      'Local scholars provide specific guidance'
    ],
    notes: 'One of the largest Muslim populations worldwide, predominantly Hanafi'
  },

  'southeast-asia': {
    region: 'Southeast Asia',
    countries: ['Indonesia', 'Malaysia', 'Singapore', 'Brunei', 'Thailand', 'Philippines', 'Cambodia'],
    primaryMethodology: 'shafi',
    secondaryMethodologies: ['standard'],
    description: 'Shafi\'i school predominant with strong institutional Zakat systems',
    scholarlyTradition: 'Shafi\'i madhab brought by Arab traders and scholars centuries ago',
    commonPractices: [
      'Gold-based nisab (85g) standard',
      'Personal jewelry exempt from Zakat',
      'Detailed asset categorization',
      'State-managed Zakat institutions (Malaysia, Indonesia)',
      'Modern Zakat management systems',
      'Business Zakat well-established',
      'Agricultural produce (rice, palm oil) Zakat common'
    ],
    notes: 'Home to the world\'s largest Muslim population (Indonesia) with sophisticated Zakat systems'
  },

  'north-africa': {
    region: 'North Africa',
    countries: ['Morocco', 'Algeria', 'Tunisia', 'Libya', 'Mauritania'],
    primaryMethodology: 'maliki',
    secondaryMethodologies: ['standard'],
    description: 'Maliki school predominant across Maghreb region',
    scholarlyTradition: 'Maliki madhab established through Andalusian and North African scholarship',
    commonPractices: [
      'Gold-based nisab commonly used',
      'Agricultural Zakat significant (dates, olives)',
      'Local scholarly interpretation important',
      'Mix of traditional and modern approaches',
      'Growing adoption of AAOIFI standards'
    ],
    notes: 'Maliki principles are similar to modern AAOIFI standards in many aspects'
  },

  'east-africa': {
    region: 'East Africa',
    countries: ['Somalia', 'Kenya', 'Tanzania', 'Ethiopia', 'Uganda', 'Djibouti'],
    primaryMethodology: 'shafi',
    secondaryMethodologies: ['standard'],
    description: 'Shafi\'i school predominant along East African coast',
    scholarlyTradition: 'Shafi\'i tradition from Arab and Persian trade connections',
    commonPractices: [
      'Gold-based nisab standard',
      'Strong community-based Zakat distribution',
      'Agricultural and livestock Zakat common',
      'Traditional calculation methods preserved',
      'Increasing modern methodology adoption'
    ]
  },

  'west-africa': {
    region: 'West Africa',
    countries: ['Nigeria', 'Senegal', 'Mali', 'Niger', 'Guinea', 'Burkina Faso', 'Côte d\'Ivoire'],
    primaryMethodology: 'maliki',
    secondaryMethodologies: ['standard'],
    description: 'Maliki school predominant with diverse local practices',
    scholarlyTradition: 'Maliki madhab through trans-Saharan scholarly networks',
    commonPractices: [
      'Mix of traditional and contemporary approaches',
      'Agricultural Zakat significant',
      'Livestock Zakat common',
      'Community-based distribution emphasized',
      'Local scholars provide specific guidance'
    ]
  },

  'central-asia': {
    region: 'Central Asia',
    countries: ['Turkey', 'Uzbekistan', 'Kazakhstan', 'Tajikistan', 'Kyrgyzstan', 'Turkmenistan', 'Azerbaijan'],
    primaryMethodology: 'hanafi',
    secondaryMethodologies: ['standard'],
    description: 'Hanafi school predominant throughout Turkish and Central Asian regions',
    scholarlyTradition: 'Ottoman Hanafi tradition in Turkey, Central Asian Hanafi scholarship',
    commonPractices: [
      'Silver-based nisab traditional',
      'Gold-based nisab increasingly used',
      'Modern Turkey follows AAOIFI standards',
      'State Zakat systems in some countries (Turkey)',
      'Mix of traditional and contemporary practices'
    ],
    notes: 'Turkey has well-developed modern Zakat infrastructure, Central Asian countries reviving Islamic practices'
  },

  'europe': {
    region: 'Europe',
    countries: ['United Kingdom', 'France', 'Germany', 'Netherlands', 'Belgium', 'Austria', 'Spain', 'Italy'],
    primaryMethodology: 'standard',
    secondaryMethodologies: ['hanafi', 'shafi', 'maliki'],
    description: 'Diverse Muslim communities, AAOIFI standard most practical for modern context',
    scholarlyTradition: 'Diverse - European Council for Fatwa and Research provides contemporary guidance',
    commonPractices: [
      'AAOIFI standards widely recommended',
      'Gold-based nisab common',
      'Modern financial instruments well-addressed',
      'Multi-madhab communities use standard approach',
      'Local Islamic centers provide guidance',
      'European Council for Fatwa and Research influential'
    ],
    notes: 'Multicultural Muslim communities benefit from unified AAOIFI approach'
  },

  'north-america': {
    region: 'North America',
    countries: ['United States', 'Canada'],
    primaryMethodology: 'standard',
    secondaryMethodologies: ['hanafi', 'shafi'],
    description: 'Diverse Muslim communities, AAOIFI standard recommended by major organizations',
    scholarlyTradition: 'ISNA, AMJA, and other North American fiqh councils provide contemporary guidance',
    commonPractices: [
      'AAOIFI standards widely adopted',
      'Gold-based nisab standard',
      'Clear guidelines for modern assets (401k, stocks, crypto)',
      'Institutional Zakat through Islamic centers',
      'North American Fiqh Council guidance followed',
      'ISNA Zakat calculator widely used'
    ],
    notes: 'Major Islamic organizations (ISNA, ICNA, AMJA) recommend AAOIFI-aligned approaches'
  },

  'oceania': {
    region: 'Oceania',
    countries: ['Australia', 'New Zealand'],
    primaryMethodology: 'standard',
    secondaryMethodologies: ['hanafi', 'shafi'],
    description: 'Diverse Muslim communities follow AAOIFI standards',
    scholarlyTradition: 'Australian and New Zealand fiqh councils provide guidance',
    commonPractices: [
      'AAOIFI standards commonly used',
      'Gold-based nisab standard',
      'Modern financial instruments addressed',
      'Islamic centers provide local guidance',
      'Mix of madhab backgrounds use unified approach'
    ]
  },

  'yemen': {
    region: 'Yemen',
    countries: ['Yemen'],
    primaryMethodology: 'shafi',
    secondaryMethodologies: ['standard'],
    description: 'Predominantly Shafi\'i with Zaydi traditions in some regions',
    scholarlyTradition: 'Strong Shafi\'i and Zaydi scholarly heritage',
    commonPractices: [
      'Gold-based nisab standard',
      'Traditional Shafi\'i calculations',
      'Agricultural and livestock Zakat significant',
      'Local scholarly guidance important'
    ]
  },

  'egypt-sudan': {
    region: 'Egypt & Sudan',
    countries: ['Egypt', 'Sudan'],
    primaryMethodology: 'hanafi',
    secondaryMethodologies: ['maliki', 'shafi', 'standard'],
    description: 'Predominantly Hanafi with Maliki traditions, strong Islamic scholarship center',
    scholarlyTradition: 'Al-Azhar University influence, mix of madhabs',
    commonPractices: [
      'Hanafi approach common but flexible',
      'Modern AAOIFI adoption in urban areas',
      'Al-Azhar guidance influential',
      'State Zakat systems in place',
      'Agricultural Zakat (Nile valley)'
    ],
    notes: 'Egypt\'s Al-Azhar is one of the oldest and most influential Islamic universities globally'
  },

  'iran': {
    region: 'Iran',
    countries: ['Iran'],
    primaryMethodology: 'standard',
    description: 'Shia Ja\'fari school with unique Khums and Zakat rules',
    scholarlyTradition: 'Ja\'fari (Twelver Shia) jurisprudence',
    commonPractices: [
      'Khums (one-fifth) on certain income types',
      'Zakat al-Fitrah obligatory',
      'Zakat on specific assets (gold, silver, livestock, crops)',
      'Different nisab thresholds than Sunni schools',
      'Consultation with Marja\' (religious authority) essential'
    ],
    notes: 'Shia jurisprudence differs significantly from Sunni schools. Users should consult qualified Shia scholars.'
  }
};

/**
 * Get methodology recommendation by country
 */
export const getMethodologyByCountry = (country: string): string => {
  const countryLower = country.toLowerCase();
  
  for (const regional of Object.values(REGIONAL_METHODOLOGIES)) {
    if (regional.countries.some(c => c.toLowerCase() === countryLower)) {
      return regional.primaryMethodology;
    }
  }
  
  // Default to standard for unknown countries
  return 'standard';
};

/**
 * Get regional information by country
 */
export const getRegionalInfoByCountry = (country: string): RegionalInfo | null => {
  const countryLower = country.toLowerCase();
  
  for (const regional of Object.values(REGIONAL_METHODOLOGIES)) {
    if (regional.countries.some(c => c.toLowerCase() === countryLower)) {
      return regional;
    }
  }
  
  return null;
};

/**
 * Get all regions list
 */
export const getAllRegions = (): string[] => {
  return Object.keys(REGIONAL_METHODOLOGIES);
};

/**
 * Get countries for a specific methodology
 */
export const getCountriesByMethodology = (methodology: string): string[] => {
  const countries: string[] = [];
  
  for (const regional of Object.values(REGIONAL_METHODOLOGIES)) {
    if (regional.primaryMethodology === methodology) {
      countries.push(...regional.countries);
    }
  }
  
  return countries;
};

/**
 * Search for regional information
 */
export const searchRegionalInfo = (searchTerm: string): RegionalInfo[] => {
  const searchLower = searchTerm.toLowerCase();
  const results: RegionalInfo[] = [];
  
  for (const regional of Object.values(REGIONAL_METHODOLOGIES)) {
    if (
      regional.region.toLowerCase().includes(searchLower) ||
      regional.countries.some(c => c.toLowerCase().includes(searchLower)) ||
      regional.description.toLowerCase().includes(searchLower)
    ) {
      results.push(regional);
    }
  }
  
  return results;
};
