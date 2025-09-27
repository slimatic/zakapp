export declare const ZAKAT_RATES: {
    readonly STANDARD_RATE: 2.5;
    readonly AGRICULTURAL_RAIN_FED: 10;
    readonly AGRICULTURAL_IRRIGATED: 5;
};
export declare const NISAB_THRESHOLDS: {
    readonly GOLD_GRAMS: 87.48;
    readonly SILVER_GRAMS: 612.36;
};
export declare const CURRENCIES: readonly [{
    readonly code: "USD";
    readonly name: "US Dollar";
    readonly symbol: "$";
}, {
    readonly code: "EUR";
    readonly name: "Euro";
    readonly symbol: "€";
}, {
    readonly code: "GBP";
    readonly name: "British Pound";
    readonly symbol: "£";
}, {
    readonly code: "SAR";
    readonly name: "Saudi Riyal";
    readonly symbol: "ر.س";
}, {
    readonly code: "AED";
    readonly name: "UAE Dirham";
    readonly symbol: "د.إ";
}, {
    readonly code: "EGP";
    readonly name: "Egyptian Pound";
    readonly symbol: "ج.م";
}, {
    readonly code: "TRY";
    readonly name: "Turkish Lira";
    readonly symbol: "₺";
}, {
    readonly code: "INR";
    readonly name: "Indian Rupee";
    readonly symbol: "₹";
}, {
    readonly code: "PKR";
    readonly name: "Pakistani Rupee";
    readonly symbol: "₨";
}, {
    readonly code: "BDT";
    readonly name: "Bangladeshi Taka";
    readonly symbol: "৳";
}, {
    readonly code: "MYR";
    readonly name: "Malaysian Ringgit";
    readonly symbol: "RM";
}, {
    readonly code: "IDR";
    readonly name: "Indonesian Rupiah";
    readonly symbol: "Rp";
}];
export declare const ASSET_CATEGORIES: {
    readonly CASH: {
        readonly id: "cash";
        readonly name: "Cash & Bank Accounts";
        readonly description: "Liquid cash, savings, and checking accounts";
        readonly zakatRate: 2.5;
        readonly zakatEligible: true;
        readonly defaultZakatEligible: true;
        readonly nisabApplicable: true;
        readonly subCategories: readonly [{
            readonly id: "savings";
            readonly name: "Savings Account";
            readonly description: "Money in savings accounts";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["interestRate"];
        }, {
            readonly id: "checking";
            readonly name: "Checking Account";
            readonly description: "Money in checking accounts";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly [];
        }, {
            readonly id: "cash_on_hand";
            readonly name: "Cash on Hand";
            readonly description: "Physical cash in possession";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly [];
        }, {
            readonly id: "certificates_of_deposit";
            readonly name: "Certificates of Deposit";
            readonly description: "Time deposits with fixed terms";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["interestRate", "maturityDate"];
        }, {
            readonly id: "money_market";
            readonly name: "Money Market Accounts";
            readonly description: "High-yield savings with limited transactions";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["interestRate"];
        }];
    };
    readonly GOLD: {
        readonly id: "gold";
        readonly name: "Gold";
        readonly description: "Gold jewelry, coins, and bars";
        readonly zakatRate: 2.5;
        readonly zakatEligible: true;
        readonly defaultZakatEligible: true;
        readonly nisabApplicable: true;
        readonly subCategories: readonly [{
            readonly id: "jewelry";
            readonly name: "Gold Jewelry";
            readonly description: "Gold jewelry for personal use or investment";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["weight", "purity"];
        }, {
            readonly id: "coins";
            readonly name: "Gold Coins";
            readonly description: "Gold coins for investment";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["weight", "purity"];
        }, {
            readonly id: "bars";
            readonly name: "Gold Bars";
            readonly description: "Gold bars and bullion";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["weight", "purity"];
        }, {
            readonly id: "ornaments";
            readonly name: "Gold Ornaments";
            readonly description: "Decorative gold items";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["weight", "purity"];
        }];
    };
    readonly SILVER: {
        readonly id: "silver";
        readonly name: "Silver";
        readonly description: "Silver jewelry, coins, and bars";
        readonly zakatRate: 2.5;
        readonly zakatEligible: true;
        readonly defaultZakatEligible: true;
        readonly nisabApplicable: true;
        readonly subCategories: readonly [{
            readonly id: "jewelry";
            readonly name: "Silver Jewelry";
            readonly description: "Silver jewelry for personal use or investment";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["weight", "purity"];
        }, {
            readonly id: "coins";
            readonly name: "Silver Coins";
            readonly description: "Silver coins for investment";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["weight", "purity"];
        }, {
            readonly id: "bars";
            readonly name: "Silver Bars";
            readonly description: "Silver bars and bullion";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["weight", "purity"];
        }, {
            readonly id: "ornaments";
            readonly name: "Silver Ornaments";
            readonly description: "Decorative silver items";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["weight", "purity"];
        }, {
            readonly id: "utensils";
            readonly name: "Silver Utensils";
            readonly description: "Silver utensils and household items";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["weight", "purity"];
        }];
    };
    readonly BUSINESS: {
        readonly id: "business";
        readonly name: "Business Assets";
        readonly description: "Business inventory, trade goods, and commercial assets";
        readonly zakatRate: 2.5;
        readonly zakatEligible: true;
        readonly defaultZakatEligible: true;
        readonly nisabApplicable: true;
        readonly subCategories: readonly [{
            readonly id: "inventory";
            readonly name: "Business Inventory";
            readonly description: "Goods held for sale in ordinary course of business";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["businessType", "holdingPeriod"];
        }, {
            readonly id: "trade_goods";
            readonly name: "Trade Goods";
            readonly description: "Goods acquired for trading purposes";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["businessType", "holdingPeriod"];
        }, {
            readonly id: "raw_materials";
            readonly name: "Raw Materials";
            readonly description: "Materials to be used in production";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["businessType"];
        }, {
            readonly id: "finished_goods";
            readonly name: "Finished Goods";
            readonly description: "Completed products ready for sale";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["businessType"];
        }, {
            readonly id: "work_in_progress";
            readonly name: "Work in Progress";
            readonly description: "Partially completed goods";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["businessType"];
        }];
    };
    readonly PROPERTY: {
        readonly id: "property";
        readonly name: "Investment Property";
        readonly description: "Real estate held for investment purposes";
        readonly zakatRate: 2.5;
        readonly zakatEligible: true;
        readonly defaultZakatEligible: true;
        readonly nisabApplicable: true;
        readonly subCategories: readonly [{
            readonly id: "residential_investment";
            readonly name: "Residential Investment";
            readonly description: "Residential properties held for rental income or appreciation";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["propertyType", "location", "rentalIncome"];
        }, {
            readonly id: "commercial";
            readonly name: "Commercial Property";
            readonly description: "Office buildings, retail spaces, warehouses";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["propertyType", "location", "rentalIncome"];
        }, {
            readonly id: "land";
            readonly name: "Land";
            readonly description: "Undeveloped land held for investment";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["location"];
        }, {
            readonly id: "agricultural";
            readonly name: "Agricultural Property";
            readonly description: "Farm land and agricultural properties";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["propertyType", "location"];
        }, {
            readonly id: "industrial";
            readonly name: "Industrial Property";
            readonly description: "Manufacturing facilities and industrial properties";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["propertyType", "location", "rentalIncome"];
        }];
    };
    readonly STOCKS: {
        readonly id: "stocks";
        readonly name: "Stocks & Securities";
        readonly description: "Shares, bonds, and other securities";
        readonly zakatRate: 2.5;
        readonly zakatEligible: true;
        readonly defaultZakatEligible: true;
        readonly nisabApplicable: true;
        readonly subCategories: readonly [{
            readonly id: "individual_stocks";
            readonly name: "Individual Stocks";
            readonly description: "Shares in individual companies";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["ticker", "shares", "dividendYield"];
        }, {
            readonly id: "mutual_funds";
            readonly name: "Mutual Funds";
            readonly description: "Professionally managed investment funds";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["ticker", "shares", "dividendYield"];
        }, {
            readonly id: "etfs";
            readonly name: "Exchange-Traded Funds";
            readonly description: "Funds that trade like stocks";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["ticker", "shares", "dividendYield"];
        }, {
            readonly id: "bonds";
            readonly name: "Bonds";
            readonly description: "Government and corporate bonds";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["ticker", "shares", "dividendYield"];
        }, {
            readonly id: "index_funds";
            readonly name: "Index Funds";
            readonly description: "Funds that track market indices";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["ticker", "shares", "dividendYield"];
        }, {
            readonly id: "retirement_401k";
            readonly name: "401(k) Retirement Account";
            readonly description: "Employer-sponsored retirement savings plan";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["employerMatch", "vestingSchedule"];
        }, {
            readonly id: "retirement_ira";
            readonly name: "IRA (Individual Retirement Account)";
            readonly description: "Individual retirement account (traditional or Roth)";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["iraType", "contributionLimit"];
        }, {
            readonly id: "retirement_other";
            readonly name: "Other Retirement Accounts";
            readonly description: "Other retirement investment accounts (403b, SEP-IRA, etc.)";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["accountType"];
        }];
    };
    readonly CRYPTO: {
        readonly id: "crypto";
        readonly name: "Cryptocurrency";
        readonly description: "Digital currencies and crypto assets";
        readonly zakatRate: 2.5;
        readonly zakatEligible: true;
        readonly defaultZakatEligible: true;
        readonly nisabApplicable: true;
        readonly subCategories: readonly [{
            readonly id: "bitcoin";
            readonly name: "Bitcoin";
            readonly description: "Bitcoin cryptocurrency";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["coinSymbol", "quantity", "stakingRewards"];
        }, {
            readonly id: "ethereum";
            readonly name: "Ethereum";
            readonly description: "Ethereum cryptocurrency";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["coinSymbol", "quantity", "stakingRewards"];
        }, {
            readonly id: "altcoins";
            readonly name: "Alternative Coins";
            readonly description: "Other cryptocurrencies besides Bitcoin";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["coinSymbol", "quantity", "stakingRewards"];
        }, {
            readonly id: "stablecoins";
            readonly name: "Stablecoins";
            readonly description: "Cryptocurrencies pegged to stable assets";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["coinSymbol", "quantity"];
        }, {
            readonly id: "defi_tokens";
            readonly name: "DeFi Tokens";
            readonly description: "Decentralized Finance protocol tokens";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["coinSymbol", "quantity", "stakingRewards"];
        }];
    };
    readonly DEBTS: {
        readonly id: "debts";
        readonly name: "Debts & Receivables";
        readonly description: "Money owed to you by others";
        readonly zakatRate: 2.5;
        readonly zakatEligible: true;
        readonly defaultZakatEligible: true;
        readonly nisabApplicable: true;
        readonly subCategories: readonly [{
            readonly id: "accounts_receivable";
            readonly name: "Accounts Receivable";
            readonly description: "Money owed by customers for goods or services";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["debtor", "dueDate"];
        }, {
            readonly id: "personal_loans_given";
            readonly name: "Personal Loans Given";
            readonly description: "Money lent to individuals";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["debtor", "dueDate", "interestRate", "repaymentSchedule"];
        }, {
            readonly id: "business_loans_given";
            readonly name: "Business Loans Given";
            readonly description: "Money lent to businesses";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["debtor", "dueDate", "interestRate", "repaymentSchedule"];
        }, {
            readonly id: "promissory_notes";
            readonly name: "Promissory Notes";
            readonly description: "Written promises to pay specific amounts";
            readonly zakatRate: 2.5;
            readonly zakatEligible: true;
            readonly specificFields: readonly ["debtor", "dueDate", "interestRate"];
        }];
    };
    readonly EXPENSES: {
        readonly id: "expenses";
        readonly name: "Deductible Expenses";
        readonly description: "Expenses that can be deducted from zakat calculation";
        readonly zakatRate: 0;
        readonly zakatEligible: false;
        readonly defaultZakatEligible: false;
        readonly nisabApplicable: false;
        readonly subCategories: readonly [{
            readonly id: "debts_owed";
            readonly name: "Outstanding Debts";
            readonly description: "Debts you owe to others (credit cards, loans, mortgages)";
            readonly zakatRate: 0;
            readonly zakatEligible: false;
            readonly specificFields: readonly ["creditor", "dueDate", "interestRate"];
        }, {
            readonly id: "essential_needs";
            readonly name: "Essential Living Expenses";
            readonly description: "Basic living expenses for the year (housing, food, clothing)";
            readonly zakatRate: 0;
            readonly zakatEligible: false;
            readonly specificFields: readonly ["expenseType", "frequency"];
        }, {
            readonly id: "family_obligations";
            readonly name: "Family Financial Obligations";
            readonly description: "Financial support for dependents and family members";
            readonly zakatRate: 0;
            readonly zakatEligible: false;
            readonly specificFields: readonly ["dependentCount", "supportType"];
        }, {
            readonly id: "business_liabilities";
            readonly name: "Business Liabilities";
            readonly description: "Business-related debts and obligations";
            readonly zakatRate: 0;
            readonly zakatEligible: false;
            readonly specificFields: readonly ["businessType", "liabilityType"];
        }];
    };
};
/**
 * Zakat calculation methodologies with comprehensive methodology information.
 *
 * This constant provides detailed information for four main zakat calculation approaches:
 * - Standard Method (AAOIFI-compliant): Modern international consensus approach
 * - Hanafi School Method: Silver-based nisab with comprehensive business inclusion
 * - Shafi'i School Method: Detailed categorization with dual nisab approach
 * - Custom Method: User-defined parameters for unique circumstances
 *
 * Each methodology includes:
 * @property {string} id - Unique identifier for the methodology
 * @property {string} name - Human-readable name of the methodology
 * @property {string} description - Brief description of the methodology's approach
 * @property {string} nisabBasis - Nisab calculation approach (silver/dual_minimum/configurable)
 * @property {string} businessAssetTreatment - How business assets are handled (market_value/comprehensive/categorized/configurable)
 * @property {string} debtDeduction - Debt deduction approach (immediate/comprehensive/conservative/configurable)
 * @property {string[]} scholarlyBasis - Scholarly sources and jurisprudential foundations
 * @property {string[]} regions - Geographic regions where the methodology is commonly used
 * @property {number} zakatRate - Standard zakat rate percentage (typically 2.5)
 * @property {('lunar'|'solar')[]} calendarSupport - Supported calendar systems
 * @property {boolean} [customRules] - Whether the method supports custom rule configuration
 * @property {string[]} suitableFor - Target user groups and use cases
 * @property {string[]} pros - Advantages and benefits of using this methodology
 * @property {string[]} cons - Limitations and considerations
 * @property {string} explanation - Comprehensive explanation of the methodology's principles and application
 *
 * This structure supports educational content display, methodology comparison,
 * regional recommendations, and informed user decision-making for zakat calculations.
 *
 * @see {@link MethodologyInfo} for the TypeScript interface definition
 * @see {@link METHODOLOGY_EDUCATION} for additional educational content
 * @see {@link REGIONAL_METHODOLOGY_MAP} for regional recommendations
 */
export declare const ZAKAT_METHODS: {
    readonly STANDARD: {
        readonly id: "standard";
        readonly name: "Standard Method (AAOIFI)";
        readonly description: "Internationally recognized dual nisab method";
        readonly nisabBasis: "dual_minimum";
        readonly businessAssetTreatment: "market_value";
        readonly debtDeduction: "immediate";
        readonly scholarlyBasis: readonly ["AAOIFI FAS 9", "Contemporary consensus"];
        readonly regions: readonly ["International", "Gulf States", "Western countries"];
        readonly zakatRate: 2.5;
        readonly calendarSupport: readonly ["lunar", "solar"];
        readonly customRules: false;
        readonly suitableFor: readonly ["Muslims in diverse global locations", "Those seeking internationally recognized standards", "Users preferring simplified calculations", "Multi-national Islamic finance institutions"];
        readonly pros: readonly ["Modern consensus approach", "Internationally recognized standards", "Simplified calculation process", "Good for diverse geographic regions", "Supported by contemporary Islamic finance institutions", "Flexible nisab calculation based on market conditions"];
        readonly cons: readonly ["May not align with specific regional traditions", "Simplified approach may not capture all nuances", "Requires trust in contemporary scholarly consensus", "Less historical precedent than traditional schools"];
        readonly explanation: "The Standard method represents a modern consensus approach developed for contemporary global Muslim communities. It incorporates guidelines from Islamic finance institutions like AAOIFI and uses a dual minimum nisab approach, selecting the lower threshold between gold and silver to ensure accessibility while maintaining religious compliance.";
    };
    readonly HANAFI: {
        readonly id: "hanafi";
        readonly name: "Hanafi School Method";
        readonly description: "Silver-based nisab with comprehensive business inclusion";
        readonly nisabBasis: "silver";
        readonly businessAssetTreatment: "comprehensive";
        readonly debtDeduction: "comprehensive";
        readonly scholarlyBasis: readonly ["Al-Hidayah", "Classical Hanafi texts"];
        readonly regions: readonly ["Turkey", "Central Asia", "Indian subcontinent"];
        readonly zakatRate: 2.5;
        readonly calendarSupport: readonly ["lunar", "solar"];
        readonly customRules: false;
        readonly suitableFor: readonly ["Muslims following Hanafi jurisprudence", "Residents of Turkey, Central Asia, and South Asia", "Business owners with diverse asset portfolios", "Those preferring comprehensive wealth assessment"];
        readonly pros: readonly ["Lower nisab threshold ensures broader zakat eligibility", "Comprehensive business asset inclusion", "Flexible debt deduction approach", "Well-established scholarly precedent", "Thorough wealth assessment methodology", "Accommodates complex business structures"];
        readonly cons: readonly ["May result in higher zakat amounts for some individuals", "Requires detailed business asset evaluation", "Complex debt assessment needed", "More time-intensive calculation process"];
        readonly explanation: "The Hanafi method, based on the jurisprudence of Imam Abu Hanifa (699-767 CE), uses exclusively silver-based nisab thresholds and emphasizes comprehensive inclusion of business assets. This approach ensures broader zakat eligibility and thorough wealth assessment, making it particularly suitable for business owners and those with diverse asset portfolios.";
    };
    readonly SHAFII: {
        readonly id: "shafii";
        readonly name: "Shafi'i School Method";
        readonly description: "Detailed categorization with dual nisab";
        readonly nisabBasis: "dual_minimum";
        readonly businessAssetTreatment: "categorized";
        readonly debtDeduction: "conservative";
        readonly scholarlyBasis: readonly ["Al-Majmu'", "Shafi'i jurisprudence"];
        readonly regions: readonly ["Southeast Asia", "East Africa", "Parts of Middle East"];
        readonly zakatRate: 2.5;
        readonly calendarSupport: readonly ["lunar", "solar"];
        readonly customRules: false;
        readonly suitableFor: readonly ["Muslims following Shafi'i jurisprudence", "Residents of Southeast Asia and East Africa", "Those preferring detailed asset categorization", "Users seeking methodical and systematic approach"];
        readonly pros: readonly ["Balanced nisab calculation approach", "Detailed and precise asset categorization", "Conservative debt treatment provides certainty", "Strong methodological framework", "Well-suited for diverse asset types", "Systematic approach reduces calculation errors"];
        readonly cons: readonly ["More complex asset categorization required", "Conservative debt approach may limit deductions", "Requires good understanding of different asset types", "May be less accessible for simple portfolios"];
        readonly explanation: "The Shafi'i method, founded by Imam al-Shafi'i (767-820 CE), emphasizes systematic methodology and detailed asset categorization. It uses a dual minimum nisab approach while requiring precise classification of business assets and conservative debt treatment, making it ideal for those seeking methodical and thorough zakat calculations.";
    };
    readonly MALIKI: {
        readonly id: "maliki";
        readonly name: "Maliki School Method";
        readonly description: "Community-focused approach with regional adaptation";
        readonly nisabBasis: "dual_flexible";
        readonly businessAssetTreatment: "comprehensive";
        readonly debtDeduction: "community_based";
        readonly scholarlyBasis: readonly ["Al-Mudawwana", "Bidayat al-Mujtahid", "Maliki jurisprudence"];
        readonly regions: readonly ["North Africa", "West Africa", "Sudan", "Parts of Arabia"];
        readonly zakatRate: 2.5;
        readonly calendarSupport: readonly ["lunar", "solar"];
        readonly customRules: false;
        readonly suitableFor: readonly ["Muslims following Maliki jurisprudence", "Residents of North and West Africa", "Agricultural communities", "Those preferring community-centric approaches"];
        readonly pros: readonly ["Adapts to local economic conditions", "Strong agricultural asset handling", "Community-centric approach", "Flexible implementation based on regional needs", "Considers broader economic context", "Comprehensive trade goods treatment"];
        readonly cons: readonly ["Requires regional economic data", "Complex adjustment mechanisms", "Less standardized across regions", "May be difficult to implement uniformly"];
        readonly explanation: "The Maliki method, based on the jurisprudence of Imam Malik (711-795 CE), emphasizes community benefit and practical application. It allows for nisab adjustments based on regional economic conditions and provides detailed rules for agricultural zakat, making it particularly suitable for agricultural communities and regions with varying economic conditions.";
    };
    readonly HANBALI: {
        readonly id: "hanbali";
        readonly name: "Hanbali School Method";
        readonly description: "Conservative gold-based approach with textual emphasis";
        readonly nisabBasis: "gold";
        readonly businessAssetTreatment: "categorized";
        readonly debtDeduction: "conservative";
        readonly scholarlyBasis: readonly ["Al-Mughni", "Hanbali classical texts", "Ibn Taymiyyah works"];
        readonly regions: readonly ["Saudi Arabia", "Qatar", "Parts of Gulf States"];
        readonly zakatRate: 2.5;
        readonly calendarSupport: readonly ["lunar", "solar"];
        readonly customRules: false;
        readonly suitableFor: readonly ["Muslims following Hanbali jurisprudence", "Residents of Saudi Arabia and Gulf states", "Those preferring traditional textual approaches", "Users seeking conservative calculations"];
        readonly pros: readonly ["Clear precedential basis from Quran and Hadith", "Consistent with traditional interpretations", "Simplified calculation logic", "Stable gold-based reference", "Conservative approach ensures compliance", "Well-established scholarly precedent"];
        readonly cons: readonly ["May exclude lower-income individuals due to higher thresholds", "Less adaptive to modern financial instruments", "Limited flexibility for contemporary assets", "May not suit all economic contexts"];
        readonly explanation: "The Hanbali method, founded by Imam Ahmad ibn Hanbal (780-855 CE), emphasizes textual adherence and conservative calculations. It prefers gold-based nisab calculations and takes a conservative approach to debt deductions, making it suitable for those seeking traditional, scripture-based zakat calculations with clear precedential foundations.";
    };
    readonly CUSTOM: {
        readonly id: "custom";
        readonly name: "Custom Method";
        readonly description: "User-defined calculation parameters";
        readonly nisabBasis: "configurable";
        readonly businessAssetTreatment: "configurable";
        readonly debtDeduction: "configurable";
        readonly scholarlyBasis: readonly ["User consultation recommended"];
        readonly regions: readonly ["User-specific"];
        readonly zakatRate: 2.5;
        readonly calendarSupport: readonly ["lunar", "solar"];
        readonly customRules: true;
        readonly suitableFor: readonly ["Muslims with unique circumstances requiring specialized calculations", "Those following specific regional practices not covered by standard methods", "Users with access to qualified Islamic scholars for consultation", "Communities with established local zakat practices"];
        readonly pros: readonly ["Maximum flexibility for unique situations", "Can accommodate specific regional practices", "Allows for scholarly consultation integration", "Adaptable to changing circumstances", "Supports specialized business models", "Enables compliance with local Islamic authorities"];
        readonly cons: readonly ["Requires qualified scholarly guidance", "May lack standardization benefits", "Responsibility for correctness lies with user", "May be complex to implement properly", "Potential for inconsistent applications", "Requires ongoing scholarly oversight"];
        readonly explanation: "The Custom method provides maximum flexibility for users with unique circumstances or specific regional requirements. It allows configuration of all calculation parameters based on scholarly consultation or established local practices. This method requires careful implementation with qualified Islamic scholarship to ensure religious compliance while meeting specific needs.";
    };
};
export declare const CALENDAR_TYPES: {
    readonly LUNAR: {
        readonly id: "lunar";
        readonly name: "Lunar (Hijri)";
        readonly description: "Islamic lunar calendar";
    };
    readonly SOLAR: {
        readonly id: "solar";
        readonly name: "Solar (Gregorian)";
        readonly description: "Gregorian solar calendar";
    };
};
export declare const LANGUAGES: readonly [{
    readonly code: "en";
    readonly name: "English";
    readonly nativeName: "English";
}, {
    readonly code: "ar";
    readonly name: "Arabic";
    readonly nativeName: "العربية";
}, {
    readonly code: "tr";
    readonly name: "Turkish";
    readonly nativeName: "Türkçe";
}, {
    readonly code: "ur";
    readonly name: "Urdu";
    readonly nativeName: "اردو";
}, {
    readonly code: "id";
    readonly name: "Indonesian";
    readonly nativeName: "Bahasa Indonesia";
}, {
    readonly code: "ms";
    readonly name: "Malay";
    readonly nativeName: "Bahasa Melayu";
}];
export declare const API_ENDPOINTS: {
    readonly BASE: "/api/v1";
    readonly AUTH: {
        readonly REGISTER: "/auth/register";
        readonly LOGIN: "/auth/login";
        readonly REFRESH: "/auth/refresh";
        readonly LOGOUT: "/auth/logout";
        readonly DEMO_STATUS: "/auth/demo-status";
        readonly DEMO_USERS: "/auth/demo-users";
    };
    readonly USERS: {
        readonly PROFILE: "/users/profile";
        readonly CHANGE_PASSWORD: "/users/change-password";
    };
    readonly ASSETS: {
        readonly BASE: "/assets";
        readonly CATEGORIES: "/assets/categories";
    };
    readonly ZAKAT: {
        readonly CALCULATE: "/zakat/calculate";
        readonly HISTORY: "/zakat/history";
        readonly PAYMENT: "/zakat/payment";
    };
    readonly DATA: {
        readonly EXPORT: "/data/export";
        readonly IMPORT: "/data/import";
        readonly BACKUP: "/data/backup";
    };
};
export declare const ERROR_CODES: {
    readonly INVALID_REQUEST: "INVALID_REQUEST";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly USER_EXISTS: "USER_EXISTS";
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly RATE_LIMITED: "RATE_LIMITED";
    readonly RATE_LIMIT: "RATE_LIMIT";
    readonly PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE";
};
export declare const VALIDATION: {
    readonly USERNAME: {
        readonly MIN_LENGTH: 3;
        readonly MAX_LENGTH: 50;
        readonly PATTERN: RegExp;
    };
    readonly PASSWORD: {
        readonly MIN_LENGTH: 8;
        readonly MAX_LENGTH: 128;
        readonly PATTERN: RegExp;
    };
    readonly EMAIL: {
        readonly PATTERN: RegExp;
    };
    readonly ASSET_NAME: {
        readonly MIN_LENGTH: 1;
        readonly MAX_LENGTH: 100;
    };
    readonly AMOUNT: {
        readonly MIN_VALUE: 0;
        readonly MAX_VALUE: 999999999999;
    };
};
export declare const DEFAULTS: {
    readonly CURRENCY: "USD";
    readonly LANGUAGE: "en";
    readonly CALENDAR_TYPE: "lunar";
    readonly ZAKAT_METHOD: "standard";
    readonly PAGINATION_LIMIT: 20;
};
export declare const DATE_FORMATS: {
    readonly ISO: "YYYY-MM-DDTHH:mm:ss.sssZ";
    readonly DISPLAY: "MMM DD, YYYY";
    readonly HIJRI: "DD MMM YYYY AH";
};
/**
 * Educational content for zakat calculation methodologies.
 * Provides historical background, detailed explanations of approaches,
 * pros/cons analysis, and considerations for each methodology.
 */
export declare const METHODOLOGY_EDUCATION: {
    readonly HANAFI: {
        readonly historicalBackground: "The Hanafi school, founded by Imam Abu Hanifa (699-767 CE) in Kufa, Iraq, is the oldest and most widely followed Sunni school of Islamic jurisprudence. Known for its emphasis on rational reasoning (ra'y) and analogy (qiyas), it is predominant in Turkey, Central Asia, the Indian subcontinent, and significant parts of the Arab world. Key sources include Al-Hidayah by al-Marghinani and Fath al-Qadir by Ibn al-Humam.";
        readonly nisabApproach: "Uses silver-based nisab exclusively (612.36 grams of silver), providing a lower threshold that ensures broader zakat eligibility. This approach is based on authenticated hadiths and the principle of facilitating zakat obligations for more Muslims, reflecting the school's emphasis on accessibility and social welfare.";
        readonly businessAssetTreatment: "Comprehensive inclusion of all business assets including inventory, accounts receivable, work-in-progress, and working capital. This thorough wealth assessment methodology reflects the Hanafi emphasis on complete financial transparency and is detailed in classical texts like Al-Hidayah.";
        readonly debtTreatment: "Allows for comprehensive debt deduction, including both immediate obligations and reasonable future commitments. This flexible approach provides relief to those with significant financial obligations while maintaining the integrity of zakat calculations, as outlined in Hanafi jurisprudential texts.";
        readonly pros: readonly ["Lower silver-based nisab threshold ensures broader zakat eligibility", "Comprehensive and transparent business asset inclusion methodology", "Flexible debt deduction approach accommodates modern financial complexities", "Well-established scholarly precedent spanning over 1,200 years", "Rational approach allows for adaptation to contemporary circumstances", "Widely accepted across diverse Muslim communities globally"];
        readonly considerations: readonly ["Silver-based nisab may result in higher zakat amounts when silver prices are low", "Requires detailed business asset evaluation and documentation", "Complex debt assessment may need professional guidance", "Comprehensive approach may be time-intensive for complex portfolios", "Requires good understanding of classical jurisprudential principles"];
    };
    readonly SHAFII: {
        readonly historicalBackground: "The Shafi'i school, founded by Imam Muhammad ibn Idris al-Shafi'i (767-820 CE), is renowned for its systematic methodology and detailed legal categorization. It is the dominant school in Southeast Asia, East Africa, parts of the Middle East, and significant Muslim populations worldwide. Key sources include Al-Majmu' Sharh al-Muhadhdhab by Imam al-Nawawi and Minhaj al-Talibin.";
        readonly nisabApproach: "Uses the dual minimum approach, taking the lower of gold nisab (87.48 grams) or silver nisab (612.36 grams). This balanced methodology considers market conditions of both precious metals and ensures accessibility while maintaining traditional nisab principles as established in classical Shafi'i jurisprudence.";
        readonly businessAssetTreatment: "Employs detailed categorization of business assets with specific rules for different types of commercial activities. Emphasizes precision in asset classification according to their intended use and Islamic commercial law principles, as detailed in Al-Majmu' and other authoritative Shafi'i texts.";
        readonly debtTreatment: "Takes a conservative approach to debt deduction, focusing on immediate and certain obligations while exercising caution with speculative or uncertain debts. This methodology ensures accuracy and religious compliance as outlined in classical Shafi'i jurisprudential works.";
        readonly pros: readonly ["Balanced dual-minimum nisab approach adapts to market conditions", "Systematic and precise asset categorization reduces calculation errors", "Conservative debt treatment provides certainty and religious confidence", "Strong methodological framework based on established legal principles", "Well-suited for diverse asset types and modern financial instruments", "Comprehensive scholarly documentation spanning centuries"];
        readonly considerations: readonly ["More complex asset categorization requires detailed financial knowledge", "Conservative debt approach may limit some legitimate deductions", "Requires good understanding of different asset types and classifications", "Systematic approach may be less accessible for simple portfolios", "May require professional guidance for complex business structures"];
    };
    readonly STANDARD: {
        readonly historicalBackground: "The Standard method represents a contemporary consensus approach developed for global Muslim communities by organizations like AAOIFI (Accounting and Auditing Organization for Islamic Financial Institutions), IFSB (Islamic Financial Services Board), and other international Islamic finance bodies. It incorporates modern financial principles while maintaining religious compliance and scholarly validation.";
        readonly nisabApproach: "Uses the dual minimum approach, selecting the lower of gold nisab (87.48 grams) or silver nisab (612.36 grams). This methodology provides flexibility based on current market conditions while ensuring accessibility and follows the principle of choosing the threshold most beneficial to those seeking to fulfill their zakat obligations.";
        readonly businessAssetTreatment: "Employs market value-based assessment of business assets using standard international accounting principles adapted for Islamic finance. Focuses on readily determinable values while maintaining compatibility with modern business structures and regulatory requirements across different jurisdictions.";
        readonly debtTreatment: "Implements immediate debt deduction approach, focusing on current and certain obligations while maintaining calculation simplicity. This method balances accuracy with practical implementation for diverse global communities while ensuring compliance with contemporary Islamic finance standards.";
        readonly pros: readonly ["Modern consensus approach validated by leading Islamic finance institutions", "Internationally recognized standards facilitate cross-border consistency", "Simplified calculation process suitable for diverse user backgrounds", "Excellent compatibility with modern financial systems and regulations", "Supported by contemporary Islamic finance institutions globally", "Flexible dual nisab calculation adapts to market conditions"];
        readonly considerations: readonly ["May not align perfectly with specific regional scholarly traditions", "Simplified approach may not capture all jurisprudential nuances", "Relies on contemporary scholarly consensus rather than classical texts", "Less historical precedent compared to traditional madhhab approaches", "May require ongoing validation as financial instruments evolve"];
    };
    readonly MALIKI: {
        readonly historicalBackground: "The Maliki school, founded by Imam Malik ibn Anas (711-795 CE), is one of the four major Sunni schools of Islamic jurisprudence. It emphasizes community benefit (maslaha) and practical application, and is predominant in North Africa, West Africa, and parts of the Arabian Peninsula.";
        readonly nisabApproach: "Uses a flexible dual approach that may adjust nisab thresholds based on regional economic conditions and community welfare considerations. This reflects the Maliki emphasis on practical application and community benefit.";
        readonly businessAssetTreatment: "Comprehensive treatment of commercial assets with particular emphasis on agricultural goods and trade merchandise. Includes detailed rules for seasonal businesses and agricultural cycles, reflecting the school's historical roots in agricultural societies.";
        readonly debtTreatment: "Community-based debt assessment that considers both individual circumstances and broader economic conditions. May allow for community-verified debt deductions and considers the debtor's overall community standing.";
        readonly pros: readonly ["Adapts to local economic conditions and community needs", "Strong framework for agricultural asset handling", "Community-centric approach promotes social welfare", "Flexible implementation based on regional requirements", "Comprehensive treatment of trade goods and commerce", "Historical precedent for practical jurisprudence"];
        readonly considerations: readonly ["Requires regional economic data for proper implementation", "Complex adjustment mechanisms may be difficult to standardize", "Less standardized across different regions and communities", "May require community consensus for certain calculations", "Implementation complexity may vary by location"];
    };
    readonly HANBALI: {
        readonly historicalBackground: "The Hanbali school, founded by Imam Ahmad ibn Hanbal (780-855 CE), is known for its strict adherence to Quranic and Hadith texts. It is the official school of jurisprudence in Saudi Arabia and is followed in parts of the Gulf states, emphasizing traditional and conservative approaches.";
        readonly nisabApproach: "Prefers gold-based nisab calculations as the primary standard, based on strong textual precedents from Islamic sources. This conservative approach ensures consistency with traditional interpretations and provides stability in calculations.";
        readonly businessAssetTreatment: "Strict categorization of business assets based on classical Islamic commercial law. Emphasizes clear distinctions between different types of commercial activities and applies conservative valuation methods to ensure compliance with traditional interpretations.";
        readonly debtTreatment: "Conservative approach to debt deduction, focusing on immediate and certain obligations with clear documentation. Tends to be cautious about speculative or uncertain debts to ensure strict compliance with Islamic principles.";
        readonly pros: readonly ["Clear precedential basis rooted in Quran and authentic Hadith", "Consistent with traditional Islamic interpretations", "Simplified and stable gold-based calculation logic", "Conservative approach ensures religious compliance", "Well-established scholarly precedent and documentation", "Provides certainty and consistency in calculations"];
        readonly considerations: readonly ["Gold-based nisab may exclude lower-income individuals in some contexts", "Less adaptive to modern financial instruments and structures", "Limited flexibility for contemporary business models", "May not suit all regional economic contexts", "Conservative debt treatment may limit legitimate deductions", "Requires careful interpretation for modern applications"];
    };
    readonly CUSTOM: {
        readonly historicalBackground: "Custom methodology allows users to define their own calculation parameters based on personal consultation with qualified Islamic scholars or specific regional requirements. This approach recognizes the diversity of Islamic jurisprudential opinions and local practices while maintaining the fundamental principles of zakat.";
        readonly nisabApproach: "User-defined nisab threshold based on scholarly consultation or specific circumstances. Provides maximum flexibility for unique situations while requiring proper Islamic jurisprudential guidance to ensure religious validity.";
        readonly businessAssetTreatment: "Configurable asset treatment based on individual needs and scholarly guidance. Allows for specialized business considerations that may not be covered by standard methodologies while maintaining Islamic compliance principles.";
        readonly debtTreatment: "Flexible debt deduction rules that can be customized based on individual circumstances and scholarly advice. Enables accommodation of unique financial situations while ensuring proper Islamic jurisprudential oversight.";
        readonly pros: readonly ["Maximum flexibility for unique situations and circumstances", "Can accommodate specific regional practices and interpretations", "Allows for direct scholarly consultation integration", "Adaptable to changing circumstances and modern contexts", "Supports specialized business models and structures", "Enables compliance with local Islamic authorities and customs"];
        readonly considerations: readonly ["Requires qualified scholarly guidance for proper implementation", "May lack standardization benefits of established methods", "Full responsibility for correctness lies with user and advisor", "May be complex to implement properly without expert guidance", "Potential for inconsistent applications across different users", "Requires ongoing scholarly oversight and validation"];
    };
};
/**
 * Regional methodology recommendations mapping.
 * Maps countries/regions to recommended zakat calculation methodologies
 * based on prevalent Islamic schools of thought and local practices.
 */
export declare const REGIONAL_METHODOLOGY_MAP: {
    readonly 'Saudi Arabia': readonly ["hanbali", "standard"];
    readonly 'United Arab Emirates': readonly ["standard", "hanafi"];
    readonly Qatar: readonly ["hanbali", "standard"];
    readonly Kuwait: readonly ["standard", "hanafi"];
    readonly Oman: readonly ["standard", "shafii"];
    readonly Bahrain: readonly ["standard", "hanafi"];
    readonly Iraq: readonly ["hanafi", "standard"];
    readonly Jordan: readonly ["hanafi", "standard"];
    readonly Lebanon: readonly ["hanafi", "shafii"];
    readonly Syria: readonly ["hanafi", "standard"];
    readonly Palestine: readonly ["hanafi", "shafii"];
    readonly Egypt: readonly ["hanafi", "standard"];
    readonly Libya: readonly ["maliki", "hanafi"];
    readonly Tunisia: readonly ["maliki", "hanafi"];
    readonly Algeria: readonly ["maliki", "hanafi"];
    readonly Morocco: readonly ["maliki", "standard"];
    readonly Sudan: readonly ["maliki", "hanafi"];
    readonly Indonesia: readonly ["shafii", "standard"];
    readonly Malaysia: readonly ["shafii", "standard"];
    readonly Singapore: readonly ["shafii", "standard"];
    readonly Thailand: readonly ["shafii", "standard"];
    readonly Philippines: readonly ["shafii", "standard"];
    readonly Brunei: readonly ["shafii", "standard"];
    readonly Cambodia: readonly ["shafii", "standard"];
    readonly Pakistan: readonly ["hanafi", "standard"];
    readonly India: readonly ["hanafi", "standard"];
    readonly Bangladesh: readonly ["hanafi", "standard"];
    readonly Afghanistan: readonly ["hanafi", "standard"];
    readonly Maldives: readonly ["shafii", "standard"];
    readonly 'Sri Lanka': readonly ["shafii", "hanafi"];
    readonly Turkey: readonly ["hanafi", "standard"];
    readonly Kazakhstan: readonly ["hanafi", "standard"];
    readonly Uzbekistan: readonly ["hanafi", "standard"];
    readonly Turkmenistan: readonly ["hanafi", "standard"];
    readonly Kyrgyzstan: readonly ["hanafi", "standard"];
    readonly Tajikistan: readonly ["hanafi", "standard"];
    readonly Azerbaijan: readonly ["hanafi", "standard"];
    readonly Somalia: readonly ["shafii", "standard"];
    readonly Ethiopia: readonly ["shafii", "standard"];
    readonly Kenya: readonly ["shafii", "standard"];
    readonly Tanzania: readonly ["shafii", "standard"];
    readonly Uganda: readonly ["shafii", "hanafi"];
    readonly Djibouti: readonly ["shafii", "standard"];
    readonly Nigeria: readonly ["maliki", "standard"];
    readonly Senegal: readonly ["maliki", "standard"];
    readonly Mali: readonly ["maliki", "standard"];
    readonly 'Burkina Faso': readonly ["maliki", "standard"];
    readonly Niger: readonly ["maliki", "standard"];
    readonly Guinea: readonly ["maliki", "standard"];
    readonly Gambia: readonly ["maliki", "standard"];
    readonly Mauritania: readonly ["maliki", "standard"];
    readonly Chad: readonly ["maliki", "standard"];
    readonly 'United States': readonly ["standard", "hanafi", "shafii"];
    readonly Canada: readonly ["standard", "hanafi", "shafii"];
    readonly 'United Kingdom': readonly ["standard", "hanafi", "shafii"];
    readonly France: readonly ["standard", "maliki", "hanafi"];
    readonly Germany: readonly ["standard", "hanafi"];
    readonly Netherlands: readonly ["standard", "hanafi"];
    readonly Australia: readonly ["standard", "hanafi", "shafii"];
    readonly 'New Zealand': readonly ["standard", "shafii"];
};
/**
 * Scholarly sources and references for zakat methodologies.
 * Provides authoritative sources, classical texts, and contemporary validation
 * for each methodology's jurisprudential foundations.
 */
export declare const METHODOLOGY_SOURCES: {
    readonly HANAFI: {
        readonly classicalSources: readonly [{
            readonly title: "Al-Hidayah";
            readonly author: "Burhan al-Din al-Marghinani";
            readonly description: "Primary source for Hanafi methodology and classical jurisprudence foundations";
            readonly period: "12th century CE";
        }, {
            readonly title: "Fath al-Qadir";
            readonly author: "Kamal al-Din Ibn al-Humam";
            readonly description: "Advanced Hanafi jurisprudence with detailed calculations and examples";
            readonly period: "15th century CE";
        }];
        readonly contemporarySources: readonly [{
            readonly title: "Contemporary Hanafi Fiqh Studies";
            readonly organization: "Darul Uloom institutions globally";
            readonly description: "Modern applications of Hanafi jurisprudence";
        }];
        readonly regions: readonly ["Turkey", "Central Asia", "Indian subcontinent", "Parts of Middle East"];
    };
    readonly SHAFII: {
        readonly classicalSources: readonly [{
            readonly title: "Al-Majmu' Sharh al-Muhadhdhab";
            readonly author: "Imam al-Nawawi";
            readonly description: "Comprehensive Shafi'i methodology with detailed asset categorization";
            readonly period: "13th century CE";
        }, {
            readonly title: "Minhaj al-Talibin";
            readonly author: "Imam al-Nawawi";
            readonly description: "Practical implementation guide for contemporary applications";
            readonly period: "13th century CE";
        }];
        readonly contemporarySources: readonly [{
            readonly title: "AAOIFI Shafi'i Compliance Guidelines";
            readonly organization: "Accounting and Auditing Organization for Islamic Financial Institutions";
            readonly description: "Modern financial applications of Shafi'i principles";
        }];
        readonly regions: readonly ["Southeast Asia", "East Africa", "Parts of Middle East"];
    };
    readonly MALIKI: {
        readonly classicalSources: readonly [{
            readonly title: "Al-Mudawwana";
            readonly author: "Imam Malik ibn Anas";
            readonly description: "Foundational Maliki jurisprudence with regional adaptation principles";
            readonly period: "8th century CE";
        }, {
            readonly title: "Bidayat al-Mujtahid";
            readonly author: "Ibn Rushd (Averroes)";
            readonly description: "Comparative jurisprudence approach with cross-school analysis";
            readonly period: "12th century CE";
        }];
        readonly contemporarySources: readonly [{
            readonly title: "North African Fiqh Academies";
            readonly organization: "Regional Islamic scholarly institutions";
            readonly description: "Modern applications adapted to regional conditions";
        }];
        readonly regions: readonly ["North Africa", "West Africa", "Parts of Arabian Peninsula"];
    };
    readonly HANBALI: {
        readonly classicalSources: readonly [{
            readonly title: "Al-Mughni";
            readonly author: "Ibn Qudamah al-Maqdisi";
            readonly description: "Comprehensive Hanbali methodology with conservative approaches";
            readonly period: "12th-13th century CE";
        }, {
            readonly title: "Works of Ibn Taymiyyah";
            readonly author: "Taqi al-Din Ibn Taymiyyah";
            readonly description: "Textual precedent emphasis and jurisprudential analysis";
            readonly period: "13th-14th century CE";
        }];
        readonly contemporarySources: readonly [{
            readonly title: "Saudi Fiqh Academy";
            readonly organization: "Islamic Fiqh Academy, Makkah";
            readonly description: "Official scholarly guidance for Hanbali applications";
        }];
        readonly regions: readonly ["Saudi Arabia", "Qatar", "Parts of Gulf States"];
    };
    readonly STANDARD: {
        readonly contemporarySources: readonly [{
            readonly title: "AAOIFI Financial Accounting Standard 9 (FAS 9)";
            readonly organization: "Accounting and Auditing Organization for Islamic Financial Institutions";
            readonly description: "International standard for Zakat calculation and disclosure";
        }, {
            readonly title: "IFSB Guidelines";
            readonly organization: "Islamic Financial Services Board";
            readonly description: "Regulatory guidance for Islamic financial institutions";
        }, {
            readonly title: "Islamic Development Bank Research";
            readonly organization: "Islamic Development Bank";
            readonly description: "Contemporary research on zakat implementation";
        }];
        readonly regions: readonly ["International", "Global Muslim communities"];
    };
};
/**
 * Additional educational resources for zakat calculation methodologies.
 * Provides comprehensive learning materials, FAQs, and implementation guidance.
 */
export declare const METHODOLOGY_RESOURCES: {
    readonly commonQuestions: readonly [{
        readonly question: "Which methodology should I choose?";
        readonly answer: "The choice depends on your regional background, personal preference, and scholarly guidance. Consider your location, the complexity of your assets, and consultation with local Islamic scholars.";
    }, {
        readonly question: "Can I switch between methodologies?";
        readonly answer: "While possible, it's recommended to maintain consistency in your chosen methodology for annual zakat calculations. Consult with qualified scholars before making changes.";
    }, {
        readonly question: "How do modern financial instruments fit into classical methodologies?";
        readonly answer: "Contemporary scholars have developed guidance for modern assets. The Standard method often provides the most comprehensive framework for contemporary financial instruments.";
    }];
    readonly implementationTips: readonly ["Maintain detailed records of your assets and their categorization", "Consider consulting with Islamic finance professionals for complex portfolios", "Review your chosen methodology annually with qualified scholars", "Keep documentation of scholarly consultations and methodology decisions"];
    readonly additionalReading: readonly ["Contemporary Islamic Finance and Zakat Studies", "Regional Fiqh Academy Publications", "Islamic Development Bank Zakat Research", "University Islamic Studies Departments Publications"];
};
//# sourceMappingURL=constants.d.ts.map