/**
 * Zakat calculation utilities
 * Based on Islamic finance principles and various methodologies
 */

class ZakatCalculator {
  constructor() {
    // Nisab values (these should be updated regularly based on current gold/silver prices)
    // Default values in USD - should be configurable
    this.goldNisab = 2512; // Approx value of 87.48 grams of gold
    this.silverNisab = 357; // Approx value of 612.36 grams of silver
    
    // Zakat rates
    this.standardRate = 0.025; // 2.5%
    this.agricultureRate = 0.10; // 10% for rain-fed crops
    this.irrigatedAgricultureRate = 0.05; // 5% for irrigated crops
    this.livestockRates = {
      camels: this.getCamelZakat,
      cattle: this.getCattleZakat,
      goats: this.getGoatZakat
    };
  }

  /**
   * Calculate total Zakat for all assets
   */
  calculateTotalZakat(assets, liabilities = [], nisabChoice = 'gold') {
    const calculations = {};
    let totalZakatableWealth = 0;
    let totalZakat = 0;

    // Calculate nisab threshold
    const nisab = nisabChoice === 'silver' ? this.silverNisab : this.goldNisab;

    // Group assets by type
    const assetGroups = this.groupAssetsByType(assets);

    // Calculate for each asset type
    for (const [assetType, typeAssets] of Object.entries(assetGroups)) {
      const calculation = this.calculateAssetTypeZakat(assetType, typeAssets, nisab);
      calculations[assetType] = calculation;
      
      if (calculation.eligible) {
        totalZakatableWealth += calculation.totalValue;
        totalZakat += calculation.zakatAmount;
      }
    }

    // Deduct eligible liabilities
    const deductibleLiabilities = this.calculateDeductibleLiabilities(liabilities);
    const netZakatableWealth = Math.max(0, totalZakatableWealth - deductibleLiabilities);

    // Recalculate if net wealth affects nisab eligibility
    const meetsNisab = netZakatableWealth >= nisab;
    
    if (!meetsNisab) {
      // Reset all calculations if below nisab
      for (const calc of Object.values(calculations)) {
        calc.eligible = false;
        calc.zakatAmount = 0;
      }
      totalZakat = 0;
    }

    return {
      totalZakatableWealth,
      deductibleLiabilities,
      netZakatableWealth,
      nisab,
      meetsNisab,
      totalZakat,
      calculations,
      summary: {
        currency: 'USD', // Should be configurable
        calculationDate: new Date().toISOString(),
        nisabChoice,
        methodology: 'standard'
      }
    };
  }

  /**
   * Group assets by type for calculation
   */
  groupAssetsByType(assets) {
    const groups = {};
    
    for (const asset of assets) {
      if (!asset.zakatEligible) continue;
      
      const type = asset.type || 'cash';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(asset);
    }
    
    return groups;
  }

  /**
   * Calculate Zakat for a specific asset type
   */
  calculateAssetTypeZakat(assetType, assets, nisab) {
    const totalValue = assets.reduce((sum, asset) => sum + (asset.value || 0), 0);
    
    let zakatRate = this.standardRate;
    let zakatAmount = 0;
    let eligible = false;
    let notes = '';

    switch (assetType) {
      case 'cash':
      case 'savings':
      case 'checking':
        eligible = totalValue >= nisab;
        zakatAmount = eligible ? totalValue * zakatRate : 0;
        notes = eligible ? 'Standard 2.5% rate applied' : 'Below nisab threshold';
        break;

      case 'gold':
        // Gold has its own nisab (87.48 grams)
        const goldNisabValue = this.goldNisab;
        eligible = totalValue >= goldNisabValue;
        zakatAmount = eligible ? totalValue * zakatRate : 0;
        notes = eligible ? 'Gold nisab threshold met' : 'Below gold nisab threshold';
        break;

      case 'silver':
        // Silver has its own nisab (612.36 grams)
        const silverNisabValue = this.silverNisab;
        eligible = totalValue >= silverNisabValue;
        zakatAmount = eligible ? totalValue * zakatRate : 0;
        notes = eligible ? 'Silver nisab threshold met' : 'Below silver nisab threshold';
        break;

      case 'investment':
      case 'stocks':
      case 'bonds':
        // Investment assets are subject to standard rate
        eligible = totalValue > 0; // Will be checked against total nisab later
        zakatAmount = totalValue * zakatRate;
        notes = 'Investment assets subject to 2.5% rate';
        break;

      case 'business':
        // Business assets/inventory
        eligible = totalValue > 0;
        zakatAmount = totalValue * zakatRate;
        notes = 'Business assets subject to 2.5% rate';
        break;

      case 'agriculture':
        // Agricultural produce
        zakatRate = this.agricultureRate; // Default to rain-fed rate
        eligible = totalValue > 0;
        zakatAmount = totalValue * zakatRate;
        notes = 'Agricultural produce - 10% rate (rain-fed) or 5% rate (irrigated)';
        break;

      case 'livestock':
        // Livestock has special calculation rules
        const livestockCalc = this.calculateLivestockZakat(assets);
        eligible = livestockCalc.eligible;
        zakatAmount = livestockCalc.amount;
        notes = livestockCalc.notes;
        break;

      case 'property':
        // Rental property income, not the property value itself
        eligible = false; // Property value is not subject to Zakat
        zakatAmount = 0;
        notes = 'Property value not subject to Zakat (rental income is)';
        break;

      default:
        // Unknown asset type - apply standard rate conservatively
        eligible = totalValue > 0;
        zakatAmount = totalValue * zakatRate;
        notes = `Unknown asset type - standard rate applied`;
    }

    return {
      assetType,
      totalValue,
      zakatRate,
      zakatAmount,
      eligible,
      notes,
      assets: assets.map(a => ({
        id: a.id,
        name: a.name,
        value: a.value,
        currency: a.currency
      }))
    };
  }

  /**
   * Calculate deductible liabilities
   */
  calculateDeductibleLiabilities(liabilities) {
    return liabilities
      .filter(liability => liability.deductibleFromZakat)
      .reduce((sum, liability) => sum + (liability.amount || 0), 0);
  }

  /**
   * Calculate livestock Zakat (simplified)
   */
  calculateLivestockZakat(livestockAssets) {
    // This is a simplified version - actual livestock Zakat is quite complex
    // and depends on specific numbers and types of animals
    
    let totalZakat = 0;
    let eligible = false;
    let notes = 'Livestock Zakat calculation (simplified)';

    for (const asset of livestockAssets) {
      const quantity = asset.metadata?.quantity || 0;
      const animalType = asset.metadata?.animalType || 'unknown';

      switch (animalType) {
        case 'sheep':
        case 'goats':
          if (quantity >= 40) {
            eligible = true;
            totalZakat += Math.floor(quantity / 40); // 1 sheep per 40
          }
          break;
        case 'cattle':
          if (quantity >= 30) {
            eligible = true;
            totalZakat += Math.floor(quantity / 30); // 1 calf per 30
          }
          break;
        case 'camels':
          if (quantity >= 5) {
            eligible = true;
            totalZakat += Math.floor(quantity / 5); // 1 sheep per 5 camels (simplified)
          }
          break;
      }
    }

    return {
      eligible,
      amount: totalZakat, // Note: This is in animals, not monetary value
      notes: `${notes}. Total animals due: ${totalZakat}`
    };
  }

  /**
   * Get current gold price (placeholder - should integrate with real API)
   */
  async getCurrentGoldPrice() {
    // In production, this would fetch from a real API
    // For now, return a default value
    return {
      pricePerGram: 65, // USD per gram
      currency: 'USD',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get current silver price (placeholder)
   */
  async getCurrentSilverPrice() {
    return {
      pricePerGram: 0.85, // USD per gram
      currency: 'USD',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Update nisab values based on current metal prices
   */
  async updateNisabValues() {
    try {
      const goldPrice = await this.getCurrentGoldPrice();
      const silverPrice = await this.getCurrentSilverPrice();

      // 87.48 grams of gold
      this.goldNisab = 87.48 * goldPrice.pricePerGram;
      
      // 612.36 grams of silver  
      this.silverNisab = 612.36 * silverPrice.pricePerGram;

      return {
        goldNisab: this.goldNisab,
        silverNisab: this.silverNisab,
        goldPrice: goldPrice.pricePerGram,
        silverPrice: silverPrice.pricePerGram,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error updating nisab values:', error);
      throw error;
    }
  }

  /**
   * Validate asset data for Zakat calculation
   */
  validateAssets(assets) {
    const errors = [];
    
    for (const asset of assets) {
      if (!asset.id) {
        errors.push(`Asset missing ID: ${asset.name || 'Unknown'}`);
      }
      if (typeof asset.value !== 'number' || asset.value < 0) {
        errors.push(`Invalid value for asset: ${asset.name || asset.id}`);
      }
      if (!asset.type) {
        errors.push(`Asset missing type: ${asset.name || asset.id}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = new ZakatCalculator();