/**
 * ZakatGuide Component
 * 
 * Comprehensive educational guide about Zakat obligations and calculations.
 * 
 * Constitutional Compliance:
 * - Islamic Compliance: All content based on authentic Islamic sources
 * - User-Centric Design: Progressive learning with clear explanations
 * - Transparency & Trust: Educational content with scholarly backing
 * - Lovable UI/UX: Interactive and engaging learning experience
 */

import React, { useState } from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ZakatGuideSection {
  id: string;
  title: string;
  content: string;
  icon: string;
  examples?: string[];
  calculations?: {
    scenario: string;
    assets: Record<string, number>;
    zakatDue: number;
    explanation: string;
  }[];
}

interface ZakatGuideProps {
  /** Which section to highlight initially */
  initialSection?: string;
  /** Whether to show in compact mode */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Comprehensive Zakat educational content
 * Based on authentic Islamic sources and contemporary scholarly consensus
 */
const ZAKAT_GUIDE_SECTIONS: ZakatGuideSection[] = [
  {
    id: 'basics',
    title: 'What is Zakat?',
    icon: '🕌',
    content: `Zakat is one of the Five Pillars of Islam and represents a fundamental obligation for Muslims who meet certain criteria. It is a form of worship through wealth purification and social responsibility.

The word "Zakat" comes from the Arabic root "zakah," which means purification and growth. By paying Zakat, Muslims purify their wealth and souls while contributing to the welfare of their community.

Zakat is not charity (sadaqah) but rather a religious obligation and right of the poor and needy upon the wealth of those who are financially capable.`,
    examples: [
      "2.5% of savings and liquid assets",
      "2.5% of business inventory and profits",
      "2.5% of gold and silver above nisab threshold",
      "Varying rates for agricultural produce and livestock"
    ]
  },
  {
    id: 'conditions',
    title: 'Who Must Pay Zakat?',
    icon: '✅',
    content: `Zakat becomes obligatory when specific conditions are met. These conditions ensure that only those with sufficient wealth contribute, protecting those with basic needs.

The primary conditions include being a Muslim, having reached puberty, being of sound mind, and possessing wealth above the nisab threshold for a full lunar year.

The nisab is the minimum amount of wealth a Muslim must have before they are liable to pay Zakat. It is equivalent to 87.48 grams of gold or 612.36 grams of silver.`,
    examples: [
      "Muslim adults with wealth above nisab threshold",
      "Wealth held for one complete lunar year (hawl)",
      "Liquid assets including cash, bank accounts, investments",
      "Business owners with inventory and profits",
      "Owners of gold, silver, and precious metals"
    ],
    calculations: [
      {
        scenario: "Simple Cash Savings",
        assets: {
          "Checking Account": 5000,
          "Savings Account": 8000,
          "Investment Account": 12000
        },
        zakatDue: 625,
        explanation: "Total liquid assets ($25,000) × 2.5% = $625 Zakat due"
      }
    ]
  },
  {
    id: 'assets',
    title: 'What Assets Are Subject to Zakat?',
    icon: '💰',
    content: `Zakat applies to various types of wealth and assets, but not all possessions are subject to this obligation. The general principle is that growing, profitable, or liquid assets are subject to Zakat.

Cash and cash equivalents are the most straightforward assets subject to Zakat. This includes money in bank accounts, investments, stocks, bonds, and business profits.

Gold and silver are classical examples of assets subject to Zakat, regardless of whether they are in the form of jewelry, coins, or bars. Modern scholars extend this to include other precious metals and valuable commodities.`,
    examples: [
      "Cash in hand and bank accounts",
      "Stocks, bonds, and investment funds",
      "Business inventory and trade goods",
      "Gold, silver, and precious metals",
      "Cryptocurrency (according to many scholars)",
      "Rental income and profits from property",
      "Money lent to others (if recoverable)"
    ]
  },
  {
    id: 'exemptions',
    title: 'What is Exempt from Zakat?',
    icon: '🏠',
    content: `Islam provides clear exemptions from Zakat to ensure that basic human needs are protected and that the obligation only applies to excess wealth.

Personal residence, household items, and tools needed for work or profession are exempt from Zakat. This ensures that individuals can maintain their basic standard of living without compromise.

Assets used for personal consumption rather than investment or trade are generally exempt. This distinction between productive and consumptive assets is fundamental to Islamic wealth taxation.`,
    examples: [
      "Primary residence and household items",
      "Personal vehicles for family use",
      "Clothing, furniture, and personal belongings",
      "Tools and equipment needed for work",
      "Educational materials and books",
      "Food and basic necessities",
      "Pension funds and retirement savings (in some opinions)"
    ]
  },
  {
    id: 'calculation',
    title: 'How to Calculate Zakat',
    icon: '🧮',
    content: `Zakat calculation follows specific rates established in Islamic law. The standard rate for most liquid assets is 2.5% annually, calculated on the lunar calendar.

The calculation process involves determining your total zakatable assets, subtracting any immediate debts, and applying the appropriate rate. Different types of assets may have different rates and calculation methods.

It's important to calculate Zakat based on the Islamic lunar year (354 days) rather than the solar year, which affects the timing of your obligation.`,
    examples: [
      "2.5% for cash, savings, investments, and business assets",
      "2.5% for gold, silver, and precious metals",
      "5% or 10% for agricultural produce (depending on irrigation)",
      "Varying rates for livestock (specific calculations apply)"
    ],
    calculations: [
      {
        scenario: "Mixed Assets Portfolio",
        assets: {
          "Cash & Savings": 15000,
          "Investment Portfolio": 25000,
          "Business Inventory": 18000,
          "Gold Jewelry": 8000,
          "Debts to Deduct": -5000
        },
        zakatDue: 1525,
        explanation: "Total zakatable assets ($61,000) × 2.5% = $1,525 Zakat due"
      }
    ]
  },
  {
    id: 'recipients',
    title: 'Who Can Receive Zakat?',
    icon: '🤝',
    content: `The Quran specifies eight categories of people entitled to receive Zakat, known as the "asnaf" or eligible recipients. This divine designation ensures that Zakat reaches those most in need.

The recipients include the poor (fuqara), the needy (masakin), Zakat administrators, those whose hearts are inclined toward Islam, slaves seeking freedom, debtors, those fighting in the way of Allah, and travelers in need.

Modern interpretation and application of these categories requires careful consideration by Islamic scholars to address contemporary situations while maintaining the spirit of the original designation.`,
    examples: [
      "The poor (fuqara) - those with insufficient basic needs",
      "The needy (masakin) - those below poverty line",
      "Zakat administrators and collectors",
      "New Muslims and those inclined toward Islam",
      "Those in debt for legitimate purposes",
      "Students and travelers in need",
      "Social welfare and community development projects"
    ]
  },
  {
    id: 'timing',
    title: 'When to Pay Zakat',
    icon: '📅',
    content: `Zakat becomes due after wealth has been held for one complete lunar year (hawl). This ensures that only stable wealth is subject to the obligation, not temporary or fluctuating assets.

Many Muslims choose to pay their annual Zakat during Ramadan, as the rewards for charitable acts are multiplied during this holy month. However, Zakat can be paid at any time once the lunar year is complete.

It's important to track your Zakat anniversary date and calculate your obligation based on your wealth at that specific time each lunar year.`,
    examples: [
      "After completing one lunar year (354 days) of wealth ownership",
      "During Ramadan for increased spiritual reward",
      "On a fixed annual date for consistency",
      "When wealth reaches nisab threshold and remains stable",
      "Before major life changes or large expenditures"
    ]
  },
  {
    id: 'modern',
    title: 'Zakat in Modern Times',
    icon: '🌐',
    content: `Contemporary Islamic scholars have addressed how traditional Zakat principles apply to modern financial instruments and economic realities.

Digital assets, cryptocurrency, retirement funds, and complex investment vehicles require careful consideration within Islamic jurisprudence. Scholars work to provide guidance that maintains the spirit of Zakat while addressing modern financial complexity.

Technology has also enabled more efficient Zakat collection and distribution, allowing for better transparency and impact measurement in charitable giving.`,
    examples: [
      "Cryptocurrency and digital assets",
      "401(k) and retirement account considerations",
      "Stock options and employee benefits",
      "International investment portfolios",
      "Online payment and distribution systems",
      "Blockchain-based transparency initiatives"
    ]
  }
];

/**
 * ZakatGuide Component
 * 
 * Interactive educational guide covering all aspects of Zakat
 */
export const ZakatGuide: React.FC<ZakatGuideProps> = ({
  initialSection = 'basics',
  compact = false,
  className = ''
}) => {
  const [activeSection, setActiveSection] = useState<string>(initialSection);
  const [loading, setLoading] = useState(false);

  const currentSection = ZAKAT_GUIDE_SECTIONS.find(section => section.id === activeSection) || ZAKAT_GUIDE_SECTIONS[0];

  return (
    <div className={`zakat-guide bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center">
          <span className="text-3xl mr-3">📚</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Complete Guide to Zakat
            </h1>
            <p className="text-gray-600 mt-1">
              Understanding your Islamic obligation of wealth purification
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Topics</h2>
            <nav className="space-y-2">
              {ZAKAT_GUIDE_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center p-3 text-left rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl mr-3">{section.icon}</span>
                  <span className="font-medium">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="md:w-2/3 p-6">
          {loading ? (
            <LoadingSpinner size="lg" text="Loading guide content..." />
          ) : (
            <div className="space-y-6">
              {/* Section Header */}
              <div className="flex items-center mb-4">
                <span className="text-4xl mr-4">{currentSection.icon}</span>
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentSection.title}
                </h2>
              </div>

              {/* Section Content */}
              <div className="prose prose-gray max-w-none">
                {currentSection.content.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-gray-700 leading-relaxed mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Examples */}
              {currentSection.examples && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">
                    📋 Key Points & Examples
                  </h3>
                  <ul className="space-y-2">
                    {currentSection.examples.map((example, index) => (
                      <li key={index} className="flex items-start text-blue-800">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Calculations */}
              {currentSection.calculations && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    🧮 Calculation Examples
                  </h3>
                  {currentSection.calculations.map((calc, index) => (
                    <div key={index} className="bg-green-50 rounded-lg p-6">
                      <h4 className="font-semibold text-green-900 mb-3">
                        {calc.scenario}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-green-800 mb-2">Assets:</h5>
                          <ul className="text-sm space-y-1">
                            {Object.entries(calc.assets).map(([asset, amount]) => (
                              <li key={asset} className="flex justify-between text-green-700">
                                <span>{asset}:</span>
                                <span className={amount < 0 ? 'text-red-600' : ''}>
                                  ${amount.toLocaleString()}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="bg-green-100 rounded-lg p-4">
                            <h5 className="font-medium text-green-800 mb-2">Zakat Due:</h5>
                            <p className="text-2xl font-bold text-green-900">
                              ${calc.zakatDue.toLocaleString()}
                            </p>
                            <p className="text-sm text-green-700 mt-2">
                              {calc.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    const currentIndex = ZAKAT_GUIDE_SECTIONS.findIndex(s => s.id === activeSection);
                    if (currentIndex > 0) {
                      setActiveSection(ZAKAT_GUIDE_SECTIONS[currentIndex - 1].id);
                    }
                  }}
                  disabled={ZAKAT_GUIDE_SECTIONS.findIndex(s => s.id === activeSection) === 0}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>

                <span className="text-sm text-gray-500">
                  {ZAKAT_GUIDE_SECTIONS.findIndex(s => s.id === activeSection) + 1} of {ZAKAT_GUIDE_SECTIONS.length}
                </span>

                <button
                  onClick={() => {
                    const currentIndex = ZAKAT_GUIDE_SECTIONS.findIndex(s => s.id === activeSection);
                    if (currentIndex < ZAKAT_GUIDE_SECTIONS.length - 1) {
                      setActiveSection(ZAKAT_GUIDE_SECTIONS[currentIndex + 1].id);
                    }
                  }}
                  disabled={ZAKAT_GUIDE_SECTIONS.findIndex(s => s.id === activeSection) === ZAKAT_GUIDE_SECTIONS.length - 1}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">📌 Important Note:</span> This guide provides general information based on Islamic jurisprudence.
          </p>
          <p className="text-xs text-gray-500">
            For specific situations or complex financial arrangements, please consult with qualified Islamic scholars or religious authorities.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ZakatGuide;