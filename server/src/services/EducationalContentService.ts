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
 * Educational Content Service
 * Provides Islamic education and explanatory content for Zakat calculations
 * 
 * Follows ZakApp constitutional principles:
 * - Islamic Compliance: Accurate educational content from authentic sources
 * - Transparency: Clear explanations with scholarly citations
 * - User-Centric Design: Educational content tailored to user understanding level
 * - Simplicity & Clarity: Complex Islamic concepts explained simply
 */
export class EducationalContentService {

  /**
   * Get comprehensive Zakat education content
   * 
   * @param userLevel - User's knowledge level (beginner, intermediate, advanced)
   * @param language - Content language (default: 'en')
   * @returns Structured educational content about Zakat
   */
  getZakatEducation(
    userLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner',
    language: string = 'en'
  ): {
    introduction: string;
    pillars: string[];
    requirements: string[];
    calculations: string[];
    examples: Array<{ scenario: string; explanation: string; calculation: string }>;
    sources: string[];
  } {
    return {
      introduction: this.getZakatIntroduction(userLevel),
      pillars: this.getZakatPillars(userLevel),
      requirements: this.getZakatRequirements(userLevel),
      calculations: this.getCalculationSteps(userLevel),
      examples: this.getZakatExamples(userLevel),
      sources: this.getZakatSources()
    };
  }

  /**
   * Get methodology-specific educational content
   * 
   * @param methodology - Islamic calculation methodology
   * @param userLevel - User's knowledge level
   * @returns Educational content specific to the methodology
   */
  getMethodologyEducation(
    methodology: string,
    userLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  ): {
    overview: string;
    principles: string[];
    advantages: string[];
    considerations: string[];
    regions: string[];
    sources: string[];
    examples: Array<{ title: string; description: string }>;
  } {
    const methodologyData = this.getMethodologyData(methodology);
    
    return {
      overview: this.getMethodologyOverview(methodology, userLevel),
      principles: methodologyData.principles,
      advantages: methodologyData.advantages,
      considerations: methodologyData.considerations,
      regions: methodologyData.regions,
      sources: methodologyData.sources,
      examples: this.getMethodologyExamples(methodology, userLevel)
    };
  }

  /**
   * Get asset-specific Zakat education
   * 
   * @param assetType - Type of asset (cash, gold, silver, business, etc.)
   * @param userLevel - User's knowledge level
   * @returns Educational content specific to the asset type
   */
  getAssetEducation(
    assetType: string,
    userLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  ): {
    definition: string;
    zakatRules: string[];
    calculations: string[];
    examples: Array<{ scenario: string; calculation: string; notes: string }>;
    commonQuestions: Array<{ question: string; answer: string }>;
    sources: string[];
  } {
    return {
      definition: this.getAssetDefinition(assetType, userLevel),
      zakatRules: this.getAssetZakatRules(assetType, userLevel),
      calculations: this.getAssetCalculations(assetType, userLevel),
      examples: this.getAssetExamples(assetType, userLevel),
      commonQuestions: this.getAssetFAQ(assetType),
      sources: this.getAssetSources(assetType)
    };
  }

  /**
   * Get nisab educational content
   * 
   * @param methodology - Islamic calculation methodology
   * @param userLevel - User's knowledge level
   * @returns Educational content about nisab thresholds
   */
  getNisabEducation(
    methodology: string,
    userLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  ): {
    definition: string;
    importance: string;
    calculation: string;
    historicalContext: string;
    modernApplication: string;
    examples: Array<{ title: string; explanation: string }>;
    sources: string[];
  } {
    return {
      definition: this.getNisabDefinition(userLevel),
      importance: this.getNisabImportance(userLevel),
      calculation: this.getNisabCalculation(methodology, userLevel),
      historicalContext: this.getNisabHistory(userLevel),
      modernApplication: this.getNisabModernContext(userLevel),
      examples: this.getNisabExamples(methodology, userLevel),
      sources: this.getNisabSources()
    };
  }

  /**
   * Get frequently asked questions about Zakat
   * 
   * @param category - FAQ category (general, calculation, assets, etc.)
   * @param userLevel - User's knowledge level
   * @returns Array of FAQ items
   */
  getZakatFAQ(
    category: 'general' | 'calculation' | 'assets' | 'timing' | 'distribution' = 'general',
    userLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  ): Array<{ question: string; answer: string; category: string; level: string }> {
    const faqs = this.getFAQDatabase();
    
    return faqs.filter(faq => 
      faq.category === category && 
      this.isAppropriateLevel(faq.level, userLevel)
    );
  }

  /**
   * Get Zakat introduction based on user level
   */
  private getZakatIntroduction(userLevel: string): string {
    switch (userLevel) {
      case 'beginner':
        return "Zakat is one of the Five Pillars of Islam, representing the obligation to give a portion of one's wealth to those in need. It purifies wealth and helps create a just society by redistributing resources to support the less fortunate.";
      
      case 'intermediate':
        return "Zakat (Arabic: زكاة) is the third Pillar of Islam, mandated by the Quran and Sunnah as both a religious duty and social responsibility. It involves giving 2.5% of qualifying wealth annually to eligible recipients, serving to purify wealth, reduce inequality, and strengthen community bonds.";
      
      case 'advanced':
        return "Zakat represents a sophisticated Islamic economic mechanism that combines spiritual purification (tazkiyah) with social welfare (maslaha). As both a religious obligation and economic policy tool, it operates on principles of wealth circulation, social justice, and economic stability as outlined in classical Islamic jurisprudence and contemporary Islamic finance.";
      
      default:
        return this.getZakatIntroduction('beginner');
    }
  }

  /**
   * Get the Five Pillars explanation
   */
  private getZakatPillars(userLevel: string): string[] {
    const pillars = [
      "Shahada (Declaration of Faith): Belief in one God and Muhammad as His messenger",
      "Salah (Prayer): Five daily prayers performed at specific times",
      "Zakat (Almsgiving): Annual charitable giving of 2.5% of qualifying wealth",
      "Sawm (Fasting): Fasting during the month of Ramadan",
      "Hajj (Pilgrimage): Pilgrimage to Mecca once in a lifetime if able"
    ];

    if (userLevel === 'beginner') {
      return pillars;
    } else {
      return pillars.map(pillar => {
        if (pillar.includes('Zakat')) {
          return pillar + " - The focus of this application, involving precise calculation based on Islamic jurisprudence";
        }
        return pillar;
      });
    }
  }

  /**
   * Get Zakat requirements
   */
  private getZakatRequirements(userLevel: string): string[] {
    const basic = [
      "Muslim: The person must be Muslim",
      "Sane and Adult: Must be mentally capable and of age",
      "Free: Must not be enslaved (historical context)",
      "Owner: Must have complete ownership of the wealth",
      "Nisab: Wealth must meet the minimum threshold (nisab)",
      "One Year: Wealth must be held for one lunar year (hawl)",
      "Excess: Wealth must be above basic needs"
    ];

    if (userLevel === 'beginner') {
      return basic.slice(0, 5); // Simplified list
    } else {
      return basic;
    }
  }

  /**
   * Get calculation steps
   */
  private getCalculationSteps(userLevel: string): string[] {
    switch (userLevel) {
      case 'beginner':
        return [
          "1. Add up all your eligible assets (cash, gold, silver, investments)",
          "2. Check if the total meets the nisab threshold",
          "3. If yes, calculate 2.5% of the total amount",
          "4. This is your Zakat obligation for the year"
        ];
      
      case 'intermediate':
        return [
          "1. Identify all Zakat-eligible assets (cash, gold, silver, business inventory, investments)",
          "2. Calculate the total value in a consistent currency",
          "3. Determine the applicable nisab threshold based on gold/silver prices",
          "4. Verify assets have been held for one complete lunar year (hawl)",
          "5. Subtract any immediate debts or obligations",
          "6. Apply the 2.5% Zakat rate to the net qualifying amount",
          "7. Identify eligible recipients for distribution"
        ];
      
      case 'advanced':
        return [
          "1. Asset Classification: Categorize wealth according to Islamic jurisprudence (mal mustafad vs. mal qadim)",
          "2. Valuation: Apply appropriate valuation methods (current market value, cost basis, or liquidation value)",
          "3. Nisab Assessment: Calculate methodology-specific nisab using contemporary gold/silver prices",
          "4. Hawl Verification: Confirm lunar year completion for qualifying assets (with interruption analysis)",
          "5. Debt Analysis: Apply school-specific debt deduction rules (immediate vs. deferred obligations)",
          "6. Rate Application: Apply standard 2.5% rate (or methodology-specific variations)",
          "7. Distribution Planning: Ensure compliance with eight Quranic categories of recipients"
        ];
      
      default:
        return this.getCalculationSteps('beginner');
    }
  }

  /**
   * Get practical Zakat examples
   */
  private getZakatExamples(userLevel: string): Array<{ scenario: string; explanation: string; calculation: string }> {
    const examples: Array<{ scenario: string; explanation: string; calculation: string }> = [];

    if (userLevel === 'beginner') {
      examples.push({
        scenario: "Simple Cash Savings",
        explanation: "Ahmad has $10,000 in savings that he has held for over a year. The current nisab is $5,000.",
        calculation: "Since $10,000 > $5,000 (nisab), Zakat = $10,000 × 2.5% = $250"
      });

      examples.push({
        scenario: "Below Nisab",
        explanation: "Fatima has $3,000 in savings. The current nisab is $5,000.",
        calculation: "Since $3,000 < $5,000 (nisab), no Zakat is due this year"
      });
    } else {
      examples.push({
        scenario: "Mixed Assets Portfolio",
        explanation: "Business owner with $15,000 cash, $8,000 inventory, and $12,000 in gold",
        calculation: "Total: $35,000. Nisab: $5,890. Zakat = $35,000 × 2.5% = $875"
      });

      examples.push({
        scenario: "Debt Considerations",
        explanation: "Person has $20,000 assets but owes $8,000 in immediate debts",
        calculation: "Net assets: $12,000. If > nisab, Zakat = $12,000 × 2.5% = $300"
      });
    }

    return examples;
  }

  /**
   * Get scholarly sources for Zakat
   */
  private getZakatSources(): string[] {
    return [
      "Quran: Surah Al-Baqarah (2:43, 2:110, 2:177), Surah At-Tawbah (9:103)",
      "Hadith: Sahih Bukhari, Sahih Muslim collections on Zakat",
      "Classical Texts: Al-Hidayah, Al-Majmu', Al-Mughni, Al-Mudawwana",
      "Contemporary: AAOIFI Shariah Standards, Islamic Fiqh Academy decisions",
      "Modern Scholars: Sheikh Yusuf al-Qaradawi, Dr. Wahbah al-Zuhayli",
      "Institutions: Dar al-Ifta, Islamic Society of North America (ISNA)"
    ];
  }

  /**
   * Get methodology-specific data
   */
  private getMethodologyData(methodology: string): any {
    const methodologies = {
      hanafi: {
        principles: [
          "Silver-based nisab calculation for broader eligibility",
          "Comprehensive inclusion of business assets",
          "Flexible debt deduction approach",
          "Emphasis on practical application"
        ],
        advantages: [
          "Lower nisab threshold benefits more people",
          "Comprehensive business asset coverage",
          "Well-established scholarly precedent",
          "Suitable for complex portfolios"
        ],
        considerations: [
          "May result in higher Zakat amounts",
          "Requires detailed asset evaluation",
          "More complex calculation process"
        ],
        regions: ["Turkey", "Central Asia", "Indian subcontinent"],
        sources: ["Al-Hidayah", "Classical Hanafi texts", "Imam Abu Hanifa's rulings"]
      },
      
      shafii: {
        principles: [
          "Balanced dual minimum nisab approach",
          "Detailed asset categorization",
          "Conservative debt treatment",
          "Systematic methodology"
        ],
        advantages: [
          "Balanced and moderate approach",
          "Clear categorization system",
          "Reduces calculation errors",
          "Suitable for diverse assets"
        ],
        considerations: [
          "More complex categorization required",
          "Conservative debt approach may limit deductions"
        ],
        regions: ["Southeast Asia", "East Africa", "Parts of Middle East"],
        sources: ["Al-Majmu'", "Shafi'i jurisprudence", "Al-Nawawi's works"]
      },

      standard: {
        principles: [
          "Modern consensus approach",
          "Dual minimum nisab selection",
          "International compatibility",
          "Simplified calculations"
        ],
        advantages: [
          "Internationally recognized",
          "Modern institutional support",
          "Flexible for global Muslims",
          "Clear documentation"
        ],
        considerations: [
          "Less historical precedent",
          "May not suit regional traditions"
        ],
        regions: ["International", "Gulf States", "Western countries"],
        sources: ["AAOIFI Standards", "Contemporary consensus", "Islamic finance institutions"]
      }
    };

    return methodologies[methodology.toLowerCase()] || methodologies.standard;
  }

  /**
   * Get methodology overview based on user level
   */
  private getMethodologyOverview(methodology: string, userLevel: string): string {
    const overviews = {
      hanafi: {
        beginner: "The Hanafi method uses silver-based nisab and includes business assets comprehensively, making it suitable for business owners.",
        intermediate: "Following Imam Abu Hanifa's jurisprudence, this method emphasizes practical application with silver-based nisab and comprehensive business asset inclusion.",
        advanced: "The Hanafi methodology represents the largest Islamic school globally, characterized by silver-based nisab calculation, comprehensive business asset treatment, and flexible debt deduction principles rooted in Imam Abu Hanifa's (699-767 CE) jurisprudential framework."
      },
      shafii: {
        beginner: "The Shafi'i method uses balanced calculations with detailed asset categories and conservative debt treatment.",
        intermediate: "Based on Imam al-Shafi'i's systematic approach, this method emphasizes methodical categorization and conservative debt deduction.",
        advanced: "The Shafi'i methodology, established by Imam al-Shafi'i (767-820 CE), emphasizes systematic legal methodology (usul al-fiqh) with balanced dual minimum nisab, detailed asset categorization, and conservative debt treatment principles."
      },
      standard: {
        beginner: "The Standard method is designed for international use with simplified calculations and modern guidelines.",
        intermediate: "A contemporary approach based on international Islamic finance standards, suitable for global Muslim communities.",
        advanced: "The Standard methodology represents a modern synthesis of classical Islamic jurisprudence adapted for contemporary global financial systems, incorporating AAOIFI standards and international Islamic finance principles."
      }
    };

    return overviews[methodology.toLowerCase()]?.[userLevel] || overviews.standard[userLevel];
  }

  /**
   * Get methodology examples
   */
  private getMethodologyExamples(methodology: string, userLevel: string): Array<{ title: string; description: string }> {
    // Return methodology-specific examples based on user level
    return [
      {
        title: `${methodology} Calculation Example`,
        description: `Practical example showing how ${methodology} methodology applies to a typical Zakat calculation scenario.`
      }
    ];
  }

  /**
   * Get asset definition based on type and user level
   */
  private getAssetDefinition(assetType: string, userLevel: string): string {
    const definitions = {
      cash: {
        beginner: "Money in bank accounts, savings, or cash on hand that you own.",
        intermediate: "Liquid monetary assets including bank deposits, cash holdings, and readily convertible financial instruments.",
        advanced: "Fungible monetary assets encompassing demand deposits, savings accounts, money market funds, and other liquid financial instruments held for investment or transactional purposes."
      },
      gold: {
        beginner: "Gold jewelry, coins, or bars that you own as investment or savings.",
        intermediate: "Precious metal holdings including jewelry, coins, bars, and gold-based financial instruments.",
        advanced: "Precious metal assets in physical form (jewelry, bullion, coins) or financial derivatives, valued at current market prices for Zakat assessment."
      }
    };

    return definitions[assetType.toLowerCase()]?.[userLevel] || "Asset type information not available.";
  }

  /**
   * Get asset-specific Zakat rules
   */
  private getAssetZakatRules(assetType: string, userLevel: string): string[] {
    // Implementation for asset-specific rules
    return [`Zakat rules for ${assetType} assets`];
  }

  /**
   * Get asset calculation methods
   */
  private getAssetCalculations(assetType: string, userLevel: string): string[] {
    // Implementation for asset calculation steps
    return [`Calculation steps for ${assetType} assets`];
  }

  /**
   * Get asset examples
   */
  private getAssetExamples(assetType: string, userLevel: string): Array<{ scenario: string; calculation: string; notes: string }> {
    // Implementation for asset-specific examples
    return [{
      scenario: `Example ${assetType} scenario`,
      calculation: "Sample calculation",
      notes: "Additional notes"
    }];
  }

  /**
   * Get asset FAQ
   */
  private getAssetFAQ(assetType: string): Array<{ question: string; answer: string }> {
    // Implementation for asset-specific FAQ
    return [{
      question: `Common question about ${assetType}`,
      answer: "Answer to the question"
    }];
  }

  /**
   * Get asset sources
   */
  private getAssetSources(assetType: string): string[] {
    // Implementation for asset-specific sources
    return [`Sources for ${assetType} Zakat rulings`];
  }

  /**
   * Get nisab definition
   */
  private getNisabDefinition(userLevel: string): string {
    switch (userLevel) {
      case 'beginner':
        return "Nisab is the minimum amount of wealth you must have before you need to pay Zakat.";
      case 'intermediate':
        return "Nisab represents the threshold amount of wealth that triggers Zakat obligation, based on the value of gold or silver.";
      case 'advanced':
        return "Nisab (Arabic: نصاب) constitutes the jurisprudentially defined minimum threshold of wealth ownership that activates the Zakat obligation, historically based on specific quantities of gold (87.48g) or silver (612.36g) and their contemporary monetary equivalents.";
      default:
        return this.getNisabDefinition('beginner');
    }
  }

  /**
   * Additional helper methods for nisab, FAQ, etc.
   */
  private getNisabImportance(userLevel: string): string {
    return "Nisab ensures that only those with sufficient wealth contribute to Zakat, protecting those with limited resources.";
  }

  private getNisabCalculation(methodology: string, userLevel: string): string {
    return `Nisab calculation using ${methodology} methodology varies based on gold/silver prices.`;
  }

  private getNisabHistory(userLevel: string): string {
    return "The nisab amounts were established during Prophet Muhammad's time based on prevalent silver and gold standards.";
  }

  private getNisabModernContext(userLevel: string): string {
    return "Modern nisab calculations use current precious metal prices to determine equivalent monetary thresholds.";
  }

  private getNisabExamples(methodology: string, userLevel: string): Array<{ title: string; explanation: string }> {
    return [{
      title: `${methodology} Nisab Example`,
      explanation: "Example calculation showing nisab determination"
    }];
  }

  private getNisabSources(): string[] {
    return [
      "Hadith collections on nisab amounts",
      "Classical jurisprudence texts",
      "Contemporary scholarly consensus"
    ];
  }

  private getFAQDatabase(): Array<{ question: string; answer: string; category: string; level: string }> {
    return [
      {
        question: "What is Zakat?",
        answer: "Zakat is one of the Five Pillars of Islam, requiring Muslims to give 2.5% of their eligible wealth to those in need annually.",
        category: "general",
        level: "beginner"
      },
      {
        question: "Who is eligible to receive Zakat?",
        answer: "The Quran specifies eight categories of Zakat recipients, including the poor, needy, and those in debt.",
        category: "distribution",
        level: "intermediate"
      }
    ];
  }

  private isAppropriateLevel(contentLevel: string, userLevel: string): boolean {
    const levels = ['beginner', 'intermediate', 'advanced'];
    const contentIndex = levels.indexOf(contentLevel);
    const userIndex = levels.indexOf(userLevel);
    
    // Show content at or below user's level
    return contentIndex <= userIndex;
  }
}

// Export singleton instance
export const educationalContentService = new EducationalContentService();