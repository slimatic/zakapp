/**
 * Educational Tooltip Content
 * 
 * Comprehensive educational content for tooltips throughout
 * the Zakat calculator application.
 */

export interface TooltipContent {
  title: string;
  description: string;
  examples?: string[];
  islamicSource?: string;
}

/**
 * Asset Type Tooltips
 */
export const assetTooltips: Record<string, TooltipContent> = {
  cash: {
    title: 'Cash & Savings',
    description: 'All liquid money including cash in hand, checking accounts, savings accounts, and money market funds.',
    examples: [
      'Cash in wallet or home',
      'Bank account balances',
      'Money market accounts',
      'Fixed deposits (if liquid)'
    ],
    islamicSource: 'All currency holdings are zakatable at 2.5% if above nisab for one lunar year.'
  },
  
  gold: {
    title: 'Gold',
    description: 'Gold jewelry, coins, bullion, or any form of gold ownership. Most scholars agree all gold is zakatable.',
    examples: [
      'Gold jewelry (worn or stored)',
      'Gold coins',
      'Gold bullion/bars',
      'Gold ETFs or certificates'
    ],
    islamicSource: 'Hadith: "There is no Zakat on gold less than 20 mithqal (85 grams)" - This is the nisab threshold for gold.'
  },
  
  silver: {
    title: 'Silver',
    description: 'Silver in any form including jewelry, coins, bullion. Silver has a separate nisab threshold of 595 grams.',
    examples: [
      'Silver jewelry',
      'Silver coins',
      'Silver bullion/bars',
      'Silver utensils or decorations'
    ],
    islamicSource: 'Hadith: "There is no Zakat on silver less than 200 dirhams (595 grams)"'
  },
  
  crypto: {
    title: 'Cryptocurrency',
    description: 'Digital currencies like Bitcoin, Ethereum, etc. Most contemporary scholars treat crypto as zakatable currency.',
    examples: [
      'Bitcoin (BTC)',
      'Ethereum (ETH)',
      'Other cryptocurrencies',
      'Stablecoins (USDT, USDC)'
    ],
    islamicSource: 'Contemporary scholars generally treat cryptocurrency as currency or trade goods, making it zakatable at 2.5%.'
  },
  
  business: {
    title: 'Business Assets',
    description: 'Inventory and goods intended for trade. Calculate based on current market value on your Zakat due date.',
    examples: [
      'Retail inventory',
      'Wholesale goods',
      'Raw materials for production',
      'Finished products for sale'
    ],
    islamicSource: 'Quran 2:267: "O you who believe, spend of the good things you have earned." Trade goods are zakatable.'
  },
  
  investments: {
    title: 'Investments',
    description: 'Stocks, bonds, mutual funds, and other investment accounts. Calculate Zakat on current market value.',
    examples: [
      'Stock portfolios',
      'Mutual funds',
      'Index funds',
      'Investment trusts'
    ],
    islamicSource: 'Contemporary scholars agree investment accounts are zakatable based on current market value at Zakat due date.'
  },
  
  realEstate: {
    title: 'Investment Property',
    description: 'Property owned for investment purposes. Note: Personal residence is NOT zakatable. Only rental income is zakatable, not the property value itself.',
    examples: [
      'Rental properties (income only)',
      'Land held for investment',
      'Commercial property (rental income)',
      'Property held for trading'
    ],
    islamicSource: 'Scholars distinguish between property for personal use (not zakatable) and investment property (income zakatable).'
  },
  
  debts: {
    title: 'Debts & Liabilities',
    description: 'Money owed to you (add to wealth) or debts you owe (may be deducted depending on methodology).',
    examples: [
      'Personal loans given',
      'Business receivables',
      'Debts owed by others',
      'Credit card debt (may deduct)'
    ],
    islamicSource: 'Scholars differ on debt deduction. Hanafi school allows more deductions; Shafi\'i school is more restrictive.'
  }
};

/**
 * Methodology Tooltips
 */
export const methodologyTooltips: Record<string, TooltipContent> = {
  nisab: {
    title: 'What is Nisab?',
    description: 'Nisab is the minimum amount of wealth a Muslim must possess for one full lunar year before Zakat becomes obligatory. It is equivalent to 85 grams of gold OR 595 grams of silver.',
    examples: [
      'Gold nisab: 85 grams (~$5,500 USD)',
      'Silver nisab: 595 grams (~$300-500 USD)',
      'Lower value typically used (more charitable)'
    ],
    islamicSource: 'Based on authentic hadiths establishing minimum thresholds for Zakat obligation.'
  },
  
  hawl: {
    title: 'What is Hawl (One Year)?',
    description: 'Hawl means your wealth must remain at or above nisab for one complete lunar year (354-355 days) before Zakat becomes due.',
    examples: [
      'Lunar year = 354-355 days',
      'Gregorian year = 365 days',
      'Wealth must stay above nisab throughout'
    ],
    islamicSource: 'Hadith: "No Zakat is due on wealth until a year has passed over it."'
  },
  
  zakatRate: {
    title: 'Why 2.5%?',
    description: 'The Zakat rate of 2.5% (or 1/40th) is established by the Prophet Muhammad (peace be upon him) for wealth, gold, silver, and trade goods.',
    examples: [
      '$10,000 wealth = $250 Zakat',
      '$50,000 wealth = $1,250 Zakat',
      'Fixed rate regardless of amount'
    ],
    islamicSource: 'Hadith: "On silver, if it reaches 200 dirhams, 2.5% is due as Zakat."'
  },
  
  standard: {
    title: 'Standard (AAOIFI) Methodology',
    description: 'Gold-based nisab following modern AAOIFI (Accounting and Auditing Organization for Islamic Financial Institutions) standards. Widely accepted globally.',
    examples: [
      'Nisab: 85 grams gold',
      'Rate: 2.5%',
      'Used by most Islamic banks'
    ],
    islamicSource: 'AAOIFI Shari\'ah Standard No. 35 on Zakat'
  },
  
  hanafi: {
    title: 'Hanafi Methodology',
    description: 'Uses the lower of silver (595g) or gold (85g) nisab. More inclusive approach that maximizes charity to those in need.',
    examples: [
      'Nisab: Lower of silver or gold value',
      'More people qualify to pay',
      'Immediate debts deductible'
    ],
    islamicSource: 'Based on classical Hanafi fiqh texts like Al-Hidayah and Al-Mabsut'
  },
  
  shafi: {
    title: "Shafi'i Methodology",
    description: 'Separates gold and silver nisabs. Each metal has its own threshold and they are not combined. More detailed categorization.',
    examples: [
      'Gold: 85g threshold',
      'Silver: 595g threshold (separate)',
      'Cannot mix gold and silver'
    ],
    islamicSource: 'Based on Shafi\'i fiqh texts like Al-Umm by Imam al-Shafi\'i'
  },
  
  custom: {
    title: 'Custom Methodology',
    description: 'Follow guidance from your local Islamic scholar or authority. Always verify with qualified scholars for your specific situation.',
    examples: [
      'Regional scholarly consensus',
      'Specific madhab rulings',
      'Contemporary fatawa'
    ],
    islamicSource: 'Consult qualified Islamic scholars for personalized guidance'
  }
};

/**
 * Islamic Terms Tooltips
 */
export const islamicTerms: Record<string, TooltipContent> = {
  zakat: {
    title: 'Zakat (الزكاة)',
    description: 'One of the Five Pillars of Islam. An obligatory charity paid annually to purify wealth and help those in need.',
    islamicSource: 'Quran 9:60 specifies eight categories of Zakat recipients.'
  },
  
  nisab: {
    title: 'Nisab (النصاب)',
    description: 'The minimum threshold of wealth before Zakat becomes obligatory.',
    islamicSource: 'Based on hadith establishing gold (85g) and silver (595g) thresholds.'
  },
  
  hawl: {
    title: 'Hawl (الحول)',
    description: 'One complete lunar year that wealth must be held before Zakat is due.',
    islamicSource: 'Hadith: "No Zakat is due until a year has passed."'
  },
  
  sadaqah: {
    title: 'Sadaqah (الصدقة)',
    description: 'Voluntary charity given beyond the obligatory Zakat. Highly encouraged in Islam.',
    islamicSource: 'Hadith: "Charity does not decrease wealth."'
  },
  
  madhab: {
    title: 'Madhab (مذهب)',
    description: 'School of Islamic jurisprudence. The four main Sunni schools are Hanafi, Maliki, Shafi\'i, and Hanbali.',
    islamicSource: 'Different schools may have varying rulings on Zakat calculation details.'
  },
  
  muqaddar: {
    title: 'Muqaddar (مقدار)',
    description: 'The amount or rate of Zakat due. For wealth, it is 2.5% (1/40th).',
    islamicSource: 'Established by Prophet Muhammad (peace be upon him).'
  },
  
  amwal: {
    title: 'Amwal Zakawiyyah (أموال زكوية)',
    description: 'Zakatable wealth - assets that are subject to Zakat.',
    islamicSource: 'Includes currency, gold, silver, trade goods, and certain other assets.'
  }
};

/**
 * Common Questions Tooltips
 */
export const faqTooltips: Record<string, TooltipContent> = {
  personalJewelry: {
    title: 'Is personal jewelry zakatable?',
    description: 'Scholars differ. Hanafi school says yes (all gold/silver is zakatable). Majority say no if worn regularly for adornment. Consult your local scholar.',
    islamicSource: 'This is an area of scholarly difference (ikhtilaf).'
  },
  
  retirementAccounts: {
    title: 'Are retirement accounts zakatable?',
    description: 'Contemporary scholars differ. Some say zakatable if accessible; others exempt until withdrawn. Consider consulting a scholar familiar with your specific account type.',
    islamicSource: 'Modern financial instruments require contemporary scholarly interpretation.'
  },
  
  mortgage: {
    title: 'Can I deduct my mortgage?',
    description: 'Scholars differ by madhab. Hanafi school more lenient on debt deduction. Shafi\'i school generally does not allow deducting long-term debts. Check your methodology.',
    islamicSource: 'Classical texts address immediate debts; modern mortgages require contemporary interpretation.'
  },
  
  paymentDate: {
    title: 'When should I pay Zakat?',
    description: 'Zakat is due when your wealth has been above nisab for one lunar year. Many Muslims pay during Ramadan for increased reward, but any time after due date is permissible.',
    islamicSource: 'Hadith encourages paying during Ramadan but does not make it obligatory.'
  },
  
  multiplePayments: {
    title: 'Can I pay Zakat in installments?',
    description: 'Yes, you can pay Zakat in installments after it becomes due. You can also pay it early before the year ends.',
    islamicSource: 'Flexibility allowed as long as full amount is paid within reasonable time.'
  },
  
  localCurrency: {
    title: 'What currency should I use?',
    description: 'Calculate Zakat in your local currency using current exchange rates. The nisab value changes with gold/silver prices.',
    islamicSource: 'Use current market values on your Zakat due date.'
  }
};

/**
 * Helper function to get tooltip content
 */
export const getTooltipContent = (category: string, key: string): TooltipContent | null => {
  const categories: Record<string, Record<string, TooltipContent>> = {
    asset: assetTooltips,
    methodology: methodologyTooltips,
    islamic: islamicTerms,
    faq: faqTooltips
  };
  
  return categories[category]?.[key] || null;
};

const tooltipData = {
  assetTooltips,
  methodologyTooltips,
  islamicTerms,
  faqTooltips,
  getTooltipContent
};

export default tooltipData;
