import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed CalculationMethodologies
  const existingMethodologies = await prisma.calculationMethodology.findMany();
  
  if (existingMethodologies.length === 0) {
    await prisma.calculationMethodology.create({
      data: {
        name: 'Standard',
        description: 'Commonly accepted Zakat calculation approach based on multiple classical and contemporary scholars',
        scholarlySource: 'Multiple classical and contemporary Islamic scholars',
        nisabCalculation: JSON.stringify({
          basis: 'lower_of_gold_silver',
          goldGrams: 87.48,
          silverGrams: 612.36,
          calculation: 'min(goldValue, silverValue)'
        }),
        assetRules: JSON.stringify({
          cash: { rate: 0.025, zakatable: true },
          gold: { rate: 0.025, zakatable: true, nisabBased: true },
          silver: { rate: 0.025, zakatable: true, nisabBased: true },
          business: { rate: 0.025, zakatable: true, inventoryOnly: true },
          property: { rate: 0, zakatable: false, tradingOnly: true },
          stocks: { rate: 0.025, zakatable: true },
          crypto: { rate: 0.025, zakatable: true }
        }),
        liabilityRules: JSON.stringify({
          deductible: ['immediate_debts', 'current_loans'],
          timing: 'current_year_only',
          fullDeduction: true
        }),
        calendarRules: JSON.stringify({
          supported: ['lunar', 'solar'],
          default: 'lunar',
          yearStart: 'personal_anniversary'
        }),
        zakatRates: JSON.stringify({
          default: 0.025,
          agriculture: 0.1,
          livestock: 'variable'
        }),
        regionalVariations: JSON.stringify({
          global: true,
          localAdjustments: 'supported'
        })
      }
    });

    await prisma.calculationMethodology.create({
      data: {
        name: 'Hanafi',
        description: 'Hanafi madhab approach to Zakat calculation based on silver nisab',
        scholarlySource: 'Hanafi fiqh authorities and classical texts',
        nisabCalculation: JSON.stringify({
          basis: 'silver_only',
          goldGrams: 87.48,
          silverGrams: 612.36,
          calculation: 'silverValue'
        }),
        assetRules: JSON.stringify({
          cash: { rate: 0.025, zakatable: true },
          gold: { rate: 0.025, zakatable: true, nisabBased: true },
          silver: { rate: 0.025, zakatable: true, nisabBased: true },
          business: { rate: 0.025, zakatable: true, fullValue: true },
          property: { rate: 0, zakatable: false },
          stocks: { rate: 0.025, zakatable: true },
          crypto: { rate: 0.025, zakatable: true }
        }),
        liabilityRules: JSON.stringify({
          deductible: ['immediate_debts'],
          timing: 'due_within_year',
          fullDeduction: false
        }),
        calendarRules: JSON.stringify({
          supported: ['lunar'],
          default: 'lunar',
          yearStart: 'hijri_new_year'
        }),
        zakatRates: JSON.stringify({
          default: 0.025
        }),
        regionalVariations: JSON.stringify({
          southAsian: true,
          turkish: true
        })
      }
    });

    await prisma.calculationMethodology.create({
      data: {
        name: 'Shafi_i',
        description: 'Shafi\'i madhab approach emphasizing gold-based nisab calculation',
        scholarlySource: 'Shafi\'i school scholars and Al-Nawawi\'s guidance',
        nisabCalculation: JSON.stringify({
          basis: 'gold_preferred',
          goldGrams: 87.48,
          silverGrams: 612.36,
          calculation: 'goldValue'
        }),
        assetRules: JSON.stringify({
          cash: { rate: 0.025, zakatable: true },
          gold: { rate: 0.025, zakatable: true, nisabBased: true },
          silver: { rate: 0.025, zakatable: true, nisabBased: true },
          business: { rate: 0.025, zakatable: true, netWorth: true },
          property: { rate: 0, zakatable: false, tradingOnly: true },
          stocks: { rate: 0.025, zakatable: true },
          crypto: { rate: 0.025, zakatable: true }
        }),
        liabilityRules: JSON.stringify({
          deductible: ['all_debts'],
          timing: 'current_obligations',
          fullDeduction: true
        }),
        calendarRules: JSON.stringify({
          supported: ['lunar', 'solar'],
          default: 'lunar',
          yearStart: 'wealth_acquisition'
        }),
        zakatRates: JSON.stringify({
          default: 0.025
        }),
        regionalVariations: JSON.stringify({
          southeast_asian: true,
          arab_world: true
        })
      }
    });
  }

  // Seed initial NisabThreshold (example values)
  const existingThreshold = await prisma.nisabThreshold.findFirst({
    where: { isActive: true }
  });

  if (!existingThreshold) {
    await prisma.nisabThreshold.create({
      data: {
        effectiveDate: new Date(),
        goldPricePerGram: 65.50, // Example price in USD
        silverPricePerGram: 0.85, // Example price in USD
        currency: 'USD',
        goldNisabGrams: 87.48,
        silverNisabGrams: 612.36,
        goldNisabValue: 65.50 * 87.48, // $5,729.94
        silverNisabValue: 0.85 * 612.36, // $520.51
        priceSource: 'manual_seed',
        exchangeRates: JSON.stringify({
          USD: 1.0,
          EUR: 0.85,
          GBP: 0.73,
          CAD: 1.35,
          AUD: 1.45
        }),
        isActive: true
      }
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });