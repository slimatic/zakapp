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
 * CalculationExplanation Component
 * 
 * Provides method-specific explanations for Zakat calculations,
 * including nisab reasoning, asset treatment, and Islamic sources.
 */

import React, { useState } from 'react';

export interface CalculationExplanationProps {
  methodology: 'standard' | 'hanafi' | 'shafii' | 'custom';
  nisabAmount: number;
  currency?: string;
  showSources?: boolean;
  className?: string;
}

interface ExplanationSection {
  title: string;
  content: string;
  details?: string[];
  sources?: string[];
}

interface MethodologyExplanation {
  nisabReasoning: ExplanationSection;
  calculationMethod: ExplanationSection;
  assetTreatment: ExplanationSection;
  specialCases: ExplanationSection;
}

/**
 * Get comprehensive explanation for each methodology
 */
const getMethodologyExplanation = (
  methodology: string,
  nisabAmount: number,
  currency: string
): MethodologyExplanation => {
  const explanations: Record<string, MethodologyExplanation> = {
    standard: {
      nisabReasoning: {
        title: 'Why This Nisab Threshold?',
        content: `The Standard (AAOIFI) methodology uses a gold-based nisab of 85 grams, currently valued at ${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(nisabAmount)}.`,
        details: [
          'Based on the hadith: "There is no Zakat on gold less than 20 mithqal (approximately 85 grams)"',
          'Gold-based nisab is more stable and widely accepted in modern times',
          'Aligns with AAOIFI (Accounting and Auditing Organization for Islamic Financial Institutions) standards',
          'Used by majority of contemporary Islamic scholars and institutions',
          'Provides consistency across different countries and currencies'
        ],
        sources: [
          'Sahih al-Bukhari, Book 24, Hadith 534',
          'AAOIFI Shari\'ah Standard No. 35 on Zakat',
          'Fiqh al-Zakat by Dr. Yusuf al-Qaradawi',
          'Islamic Fiqh Council (OIC) Resolution 2/3'
        ]
      },
      calculationMethod: {
        title: 'How This Methodology Calculates',
        content: 'The Standard methodology applies a uniform 2.5% rate to all zakatable assets after reaching nisab.',
        details: [
          'Calculate total zakatable wealth (cash, gold, silver, investments, business assets)',
          'Compare against nisab threshold (85g gold value)',
          'If wealth ≥ nisab for one lunar year, Zakat is due',
          'Apply 2.5% rate to total zakatable amount',
          'Formula: Zakat = Total Zakatable Wealth × 0.025',
          'Uses current market prices for gold and assets',
          'Considers all liquid and semi-liquid assets'
        ],
        sources: [
          'Quran 9:60 - "Zakat is for the poor and the needy..."',
          'Hadith: "On silver, if it reaches 200 dirhams, 2.5% is due"',
          'AAOIFI Accounting Standards for Islamic Finance'
        ]
      },
      assetTreatment: {
        title: 'Asset Treatment Reasoning',
        content: 'Different asset types are treated based on their liquidity and Islamic rulings.',
        details: [
          '💰 Cash & Savings: Fully zakatable at 2.5% (highly liquid)',
          '🪙 Gold & Silver: Zakatable at 2.5% (store of value)',
          '💼 Business Inventory: Zakatable at 2.5% (intended for trade)',
          '📈 Investments: Zakatable at 2.5% (liquid assets)',
          '₿ Cryptocurrency: Treated as currency, zakatable at 2.5%',
          '🏠 Personal Residence: Not zakatable (not for trade)',
          '🏢 Investment Property: Rental income zakatable, not property value',
          '💳 Debts Owed to You: Zakatable if collectible',
          '📉 Debts You Owe: Can be deducted from zakatable wealth'
        ],
        sources: [
          'Fiqh of Zakat by Dr. Yusuf al-Qaradawi',
          'Contemporary Fatawa on Zakat (IUMS)',
          'AAOIFI Shari\'ah Standard on Zakat'
        ]
      },
      specialCases: {
        title: 'Special Considerations',
        content: 'Modern financial instruments require scholarly interpretation.',
        details: [
          'Retirement accounts: Scholars differ - some say zakatable, others exempt until withdrawn',
          'Stock investments: Zakatable based on current market value',
          'Business equipment: Not zakatable (tools of trade)',
          'Mixed-use property: Only business portion considered',
          'Uncertain debts: Only include if reasonably collectible'
        ],
        sources: [
          'European Council for Fatwa and Research',
          'AAOIFI Shari\'ah Standards',
          'Fiqh Council of North America'
        ]
      }
    },
    hanafi: {
      nisabReasoning: {
        title: 'Why This Nisab Threshold?',
        content: `The Hanafi methodology uses a silver-based nisab of 595 grams OR 85 grams of gold, whichever is lower in value (currently ${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(nisabAmount)}).`,
        details: [
          'Based on the hadith: "There is no Zakat on silver less than 200 dirhams (approximately 595g)"',
          'Hanafi school traditionally prefers silver-based nisab',
          'Uses the lower of gold or silver value to maximize charity',
          'This approach benefits more people in need',
          'Historically silver was more common in trade',
          'Lower threshold means more people qualify to pay Zakat'
        ],
        sources: [
          'Al-Mabsut by Imam al-Sarakhsi',
          'Al-Hidayah by al-Marghinani',
          'Fatawa Hindiya (Hanafi fiqh compilation)',
          'Badai al-Sanai by al-Kasani'
        ]
      },
      calculationMethod: {
        title: 'How This Methodology Calculates',
        content: 'The Hanafi methodology uses the lower nisab threshold and includes certain debts differently.',
        details: [
          'Compare wealth against LOWER value: 595g silver OR 85g gold',
          'This often results in silver-based nisab being used',
          'Same 2.5% rate applied to zakatable wealth',
          'Hanafi school allows deducting immediate debts from wealth',
          'More inclusive approach - more people pay Zakat',
          'Formula: Zakat = (Total Wealth - Immediate Debts) × 0.025',
          'Emphasizes helping the poor by lowering the threshold'
        ],
        sources: [
          'Hanafi fiqh texts (Al-Hidayah, Al-Mabsut)',
          'Contemporary Hanafi scholars\' rulings',
          'Islamic Fiqh Academy decisions'
        ]
      },
      assetTreatment: {
        title: 'Asset Treatment Reasoning',
        content: 'Hanafi school has specific rulings on various asset types.',
        details: [
          '💰 Cash & Savings: Fully zakatable at 2.5%',
          '🪙 Gold & Silver: Zakatable at 2.5% (even if for personal use)',
          '💼 Business Inventory: Zakatable at 2.5%',
          '📈 Investments: Zakatable at 2.5%',
          '₿ Cryptocurrency: Treated as commodity, zakatable',
          '🏠 Personal Residence: Not zakatable',
          '🏢 Rental Property: Hanafi scholars differ - some include property value',
          '💳 Immediate Debts: Can be deducted before calculating Zakat',
          '📋 Long-term Debts: Not typically deducted'
        ],
        sources: [
          'Al-Fatawa al-Hindiyyah',
          'Contemporary Hanafi scholars',
          'Darul Ifta rulings'
        ]
      },
      specialCases: {
        title: 'Special Considerations',
        content: 'Hanafi school has unique positions on certain matters.',
        details: [
          'Personal gold jewelry: Hanafi school considers it zakatable (minority view)',
          'Mixed nisab: Can combine gold and silver values to reach nisab',
          'Debts: More lenient in allowing debt deductions',
          'Business assets: Equipment not zakatable, inventory is',
          'Agricultural produce: Different rules apply (separate from wealth Zakat)'
        ],
        sources: [
          'Hanafi fiqh manuals',
          'Fatawa from Hanafi institutions',
          'Contemporary Hanafi scholarship'
        ]
      }
    },
    shafii: {
      nisabReasoning: {
        title: 'Why This Nisab Threshold?',
        content: `The Shafi'i methodology uses a gold-based nisab of 85 grams, currently valued at ${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(nisabAmount)}.`,
        details: [
          'Based on authentic hadiths about gold nisab (20 mithqal = 85g)',
          'Shafi\'i school emphasizes gold as the primary standard',
          'Silver nisab is separate: 595 grams (200 dirhams)',
          'Gold and silver nisabs NOT combined',
          'Each precious metal has its own threshold',
          'More conservative approach ensuring proper wealth assessment'
        ],
        sources: [
          'Al-Umm by Imam al-Shafi\'i',
          'Al-Majmu\' by Imam al-Nawawi',
          'Minhaj al-Talibin by Imam al-Nawawi',
          'Contemporary Shafi\'i scholars'
        ]
      },
      calculationMethod: {
        title: 'How This Methodology Calculates',
        content: 'The Shafi\'i methodology emphasizes precise categorization and separate calculation for different asset types.',
        details: [
          'Each asset type assessed separately against its nisab',
          'Gold: 85g threshold, 2.5% rate',
          'Silver: 595g threshold, 2.5% rate',
          'Trade goods: Value-based, combined with currency',
          'Cannot combine gold and silver to reach nisab',
          'Must meet nisab for each category independently',
          'Formula: Calculate each category separately, then sum',
          'Very precise and detailed categorization'
        ],
        sources: [
          'Shafi\'i fiqh texts (Al-Umm, Al-Majmu\')',
          'Fatawa from Shafi\'i scholars',
          'Dar al-Ifta al-Misriyyah (Egyptian Fatwa Authority)'
        ]
      },
      assetTreatment: {
        title: 'Asset Treatment Reasoning',
        content: 'Shafi\'i school provides detailed categorization of assets.',
        details: [
          '💰 Cash & Currency: Zakatable at 2.5% if reaches nisab',
          '🪙 Gold: Separate nisab (85g), not combined with silver',
          '🪙 Silver: Separate nisab (595g), not combined with gold',
          '💼 Trade Goods: Combined with currency for nisab calculation',
          '📈 Investments: Zakatable based on current market value',
          '₿ Cryptocurrency: Scholarly discussion ongoing, likely zakatable',
          '🏠 Personal Property: Not zakatable',
          '🏢 Rental Income: Income zakatable, not property itself',
          '💳 Debts: Collectible debts zakatable, owed debts don\'t reduce Zakat'
        ],
        sources: [
          'Reliance of the Traveller (Shafi\'i manual)',
          'Contemporary Shafi\'i fatawa',
          'Al-Azhar University rulings'
        ]
      },
      specialCases: {
        title: 'Special Considerations',
        content: 'Shafi\'i school has specific positions on complex cases.',
        details: [
          'Separate nisab for each metal: Gold and silver not mixed',
          'Trade goods: Evaluated at market price on Zakat due date',
          'Personal jewelry: Not zakatable (unless for trade)',
          'Mixed assets: Each category evaluated independently',
          'Retirement accounts: Zakatable if accessible'
        ],
        sources: [
          'Shafi\'i fiqh manuals',
          'Dar al-Ifta al-Misriyyah',
          'Contemporary Shafi\'i scholarship'
        ]
      }
    },
    custom: {
      nisabReasoning: {
        title: 'Why This Nisab Threshold?',
        content: `You are using a custom nisab of ${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(nisabAmount)} based on guidance from your local scholar or Islamic authority.`,
        details: [
          'Custom nisab allows following specific scholarly guidance',
          'May be based on local cost of living',
          'Could reflect specific madhab interpretation',
          'Might consider regional economic factors',
          'Always consult qualified scholars for custom calculations',
          'Ensure your custom nisab aligns with Islamic principles'
        ],
        sources: [
          'Consult your local Islamic scholar',
          'Local Islamic authority',
          'Your madhab\'s contemporary scholars'
        ]
      },
      calculationMethod: {
        title: 'How This Methodology Calculates',
        content: 'Custom methodology follows guidance provided by your Islamic scholar or institution.',
        details: [
          'Follow the specific calculation method advised by your scholar',
          'Standard rate is 2.5% but verify with your authority',
          'May have specific asset inclusion/exclusion rules',
          'Ensure methodology is based on authentic Islamic sources',
          'Document the reasoning and sources used',
          'Review periodically with qualified scholars'
        ],
        sources: [
          'Your Islamic scholar or institution',
          'Local fatwa authority',
          'Madhab-specific contemporary scholars'
        ]
      },
      assetTreatment: {
        title: 'Asset Treatment Reasoning',
        content: 'Follow the asset treatment guidelines provided by your Islamic authority.',
        details: [
          'Verify which assets are zakatable in your methodology',
          'Confirm the treatment of modern financial instruments',
          'Understand debt deduction rules in your approach',
          'Check special cases relevant to your situation',
          'Always prioritize scholarly guidance over personal interpretation'
        ],
        sources: [
          'Your local Islamic scholar',
          'Fatwa from your trusted authority',
          'Madhab-specific rulings'
        ]
      },
      specialCases: {
        title: 'Special Considerations',
        content: 'For custom calculations, special cases require direct scholarly consultation.',
        details: [
          'Complex assets: Seek specific guidance',
          'Modern financial instruments: Verify treatment',
          'Mixed ownership: Clarify calculation method',
          'Regional considerations: Apply local scholarly consensus',
          'Always document the basis for custom calculations'
        ],
        sources: [
          'Direct consultation with qualified scholar',
          'Local Islamic authority',
          'Madhab-specific contemporary fatawa'
        ]
      }
    }
  };

  return explanations[methodology] || explanations.standard;
};

export const CalculationExplanation: React.FC<CalculationExplanationProps> = ({
  methodology,
  nisabAmount,
  currency = 'USD',
  showSources = true,
  className = ''
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const explanation = getMethodologyExplanation(methodology, nisabAmount, currency);

  const toggleSection = (sectionKey: string) => {
    setExpandedSection(expandedSection === sectionKey ? null : sectionKey);
  };

  const renderSection = (sectionKey: string, section: ExplanationSection) => {
    const isExpanded = expandedSection === sectionKey;

    return (
      <div key={sectionKey} className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
          aria-expanded={isExpanded}
        >
          <span className="font-semibold text-gray-900">{section.title}</span>
          <span className="text-gray-500 text-xl">
            {isExpanded ? '−' : '+'}
          </span>
        </button>

        {isExpanded && (
          <div className="p-4 bg-white">
            <p className="text-gray-700 mb-3">{section.content}</p>

            {section.details && section.details.length > 0 && (
              <div className="mb-3">
                <h4 className="font-medium text-gray-900 mb-2">Details:</h4>
                <ul className="space-y-2">
                  {section.details.map((detail, idx) => (
                    <li key={idx} className="text-sm text-gray-700 pl-4 border-l-2 border-blue-200">
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {showSources && section.sources && section.sources.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Islamic Sources:</h4>
                <ul className="space-y-1">
                  {section.sources.map((source, idx) => (
                    <li key={idx} className="text-xs text-gray-600 italic pl-4">
                      📚 {source}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const methodologyNames: Record<string, string> = {
    standard: 'Standard (AAOIFI)',
    hanafi: 'Hanafi',
    shafii: "Shafi'i",
    custom: 'Custom'
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Understanding Your Calculation
        </h3>
        <p className="text-sm text-gray-600">
          Detailed explanation for {methodologyNames[methodology]} methodology
        </p>
      </div>

      <div className="space-y-3">
        {renderSection('nisabReasoning', explanation.nisabReasoning)}
        {renderSection('calculationMethod', explanation.calculationMethod)}
        {renderSection('assetTreatment', explanation.assetTreatment)}
        {renderSection('specialCases', explanation.specialCases)}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>📖 Important Note:</strong> This tool provides general guidance based on established Islamic scholarship.
          For complex situations or specific questions, always consult with a qualified Islamic scholar or local Islamic authority.
        </p>
      </div>
    </div>
  );
};

export default CalculationExplanation;
