/**
 * MethodologyEducation Component
 * 
 * Provides comprehensive educational content about Islamic Zakat calculation methodologies.
 * 
 * Constitutional Compliance:
 * - Islamic Compliance: All content based on authentic Islamic jurisprudence
 * - User-Centric Design: Clear, accessible educational content
 * - Transparency & Trust: Scholarly references and citations
 * - Lovable UI/UX: Beautiful, engaging educational interface
 */

import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';

// Types for educational content
export interface MethodologyEducationContent {
  historicalBackground: string;
  nisabApproach: string;
  businessAssetTreatment: string;
  debtTreatment: string;
  pros: string[];
  considerations: string[];
  scholarlyReferences: string[];
  regionalUsage: string[];
  keyPrinciples: string[];
}

export interface MethodologyInfo {
  id: string;
  name: string;
  description: string;
  zakatRate: number;
  nisabSource: string;
  calendarType: string;
  regions: string[];
}

interface MethodologyEducationProps {
  /** Methodology ID to display education for */
  methodology: string;
  /** Whether to show the component in compact mode */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when content is loaded */
  onContentLoaded?: (content: MethodologyEducationContent) => void;
}

/**
 * Default educational content for different methodologies
 * Based on established Islamic jurisprudence and scholarly consensus
 */
const DEFAULT_EDUCATIONAL_CONTENT: Record<string, MethodologyEducationContent> = {
  standard: {
    historicalBackground: "The Standard methodology represents the contemporary scholarly consensus on Zakat calculation, developed through the collective efforts of modern Islamic finance institutions and religious authorities. This approach synthesizes classical jurisprudence with modern financial realities.",
    nisabApproach: "Nisab threshold is calculated based on the current market value of silver (612.36 grams) or gold (87.48 grams), whichever is lower. This ensures maximum benefit for those entitled to receive Zakat while maintaining the authentic Islamic threshold.",
    businessAssetTreatment: "Business assets are evaluated at their current market value, including inventory, cash, receivables, and investment assets. Fixed assets used directly in business operations are typically excluded from Zakat calculation.",
    debtTreatment: "Debts are deducted from total assets before calculating Zakat, provided they are due within the Zakat year. Long-term debts may be treated differently based on regional scholarly opinions.",
    pros: [
      "Widely accepted by contemporary Islamic scholars",
      "Adaptable to modern financial instruments",
      "Clear guidelines for business assets",
      "Regular updates based on market conditions",
      "Comprehensive treatment of various asset types"
    ],
    considerations: [
      "May require frequent recalculation due to market fluctuations",
      "Complex for individuals with diverse investment portfolios",
      "Regional variations in interpretation may exist"
    ],
    scholarlyReferences: [
      "Fiqh al-Zakat by Dr. Yusuf al-Qaradawi",
      "AAOIFI Sharia Standards for Islamic Financial Institutions",
      "Islamic Society of North America (ISNA) Zakat Guidelines",
      "The World Zakat Forum consensus documents"
    ],
    regionalUsage: [
      "North America", "Europe", "Southeast Asia", "Middle East", "Australia"
    ],
    keyPrinciples: [
      "2.5% rate on most liquid assets",
      "Silver-based nisab threshold",
      "Lunar calendar basis",
      "Asset-based calculation",
      "Debt deduction allowance"
    ]
  },
  hanafi: {
    historicalBackground: "The Hanafi methodology follows the jurisprudential school founded by Imam Abu Hanifa (699-767 CE). It represents one of the four major Sunni schools of Islamic jurisprudence and is widely followed in Central Asia, the Indian subcontinent, Turkey, and parts of the Arab world.",
    nisabApproach: "Strictly adheres to the silver-based nisab threshold (612.36 grams of silver). This approach tends to result in a lower nisab threshold, making Zakat obligations more inclusive and ensuring broader wealth redistribution.",
    businessAssetTreatment: "Business inventory and trading assets are subject to Zakat at their current market value. The Hanafi school emphasizes the importance of intention (niyyah) in distinguishing between trading assets and personal use items.",
    debtTreatment: "Debts are generally deducted from assets, but the Hanafi school has specific rulings about the types of debts that can be deducted and the timing of such deductions.",
    pros: [
      "Lower nisab threshold increases social justice",
      "Well-established historical precedent",
      "Clear rulings on trade and commerce",
      "Comprehensive debt treatment guidelines",
      "Flexible approach to modern financial instruments"
    ],
    considerations: [
      "May result in higher Zakat obligations",
      "Some rulings may need contemporary interpretation",
      "Regional variations in application"
    ],
    scholarlyReferences: [
      "Al-Hidayah by Imam Burhan al-Din al-Marghinani",
      "Radd al-Muhtar by Ibn Abidin",
      "Al-Fatawa al-Hindiyyah",
      "Contemporary Hanafi scholars' consensus"
    ],
    regionalUsage: [
      "Turkey", "Central Asia", "Indian Subcontinent", "Afghanistan", "Some Arab regions"
    ],
    keyPrinciples: [
      "Silver-based nisab calculation",
      "Emphasis on trading intention",
      "Comprehensive debt deductions",
      "Traditional lunar calendar",
      "Community-focused approach"
    ]
  },
  shafi: {
    historicalBackground: "The Shafi'i methodology is based on the jurisprudential school founded by Imam Muhammad ibn Idris al-Shafi'i (767-820 CE). This school is prominent in Southeast Asia, East Africa, and parts of the Middle East, known for its systematic approach to Islamic law.",
    nisabApproach: "Uses gold-based nisab calculation (87.48 grams of gold) which typically results in a higher threshold. This approach reflects the school's emphasis on precision and the historical stability of gold as a monetary standard.",
    businessAssetTreatment: "Business assets are carefully categorized based on their intended use. Trading inventory is subject to Zakat, while fixed assets for business operations are generally exempt. The school emphasizes clear categorization.",
    debtTreatment: "Debts are deducted from total wealth, but the Shafi'i school has specific conditions for what constitutes deductible debt. Emergency debts and those affecting basic needs are given priority consideration.",
    pros: [
      "Stable gold-based calculations",
      "Clear asset categorization rules",
      "Well-developed commercial law principles",
      "Systematic approach to modern finance",
      "Strong scholarly consensus on interpretations"
    ],
    considerations: [
      "Higher nisab threshold may exclude some individuals",
      "Gold price volatility affects calculations",
      "May require specialized knowledge for complex assets"
    ],
    scholarlyReferences: [
      "Al-Umm by Imam al-Shafi'i",
      "Al-Muhadhdhab by Imam al-Shirazi",
      "Minhaj al-Talibin by Imam al-Nawawi",
      "Contemporary Shafi'i scholarly consensus"
    ],
    regionalUsage: [
      "Southeast Asia", "Indonesia", "Malaysia", "East Africa", "Yemen", "Southern Arabia"
    ],
    keyPrinciples: [
      "Gold-based nisab threshold",
      "Systematic asset categorization",
      "Conditional debt deductions",
      "Lunar calendar adherence",
      "Precision in calculations"
    ]
  }
};

/**
 * MethodologyEducation Component
 * 
 * Displays comprehensive educational content about a specific Zakat calculation methodology
 */
export const MethodologyEducation: React.FC<MethodologyEducationProps> = ({
  methodology,
  compact = false,
  className = '',
  onContentLoaded
}) => {
  const [content, setContent] = useState<MethodologyEducationContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('overview');

  // Load educational content
  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch from API first, fallback to default content
        const educationalContent = DEFAULT_EDUCATIONAL_CONTENT[methodology] || 
          DEFAULT_EDUCATIONAL_CONTENT.standard;

        setContent(educationalContent);
        onContentLoaded?.(educationalContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load educational content');
      } finally {
        setLoading(false);
      }
    };

    if (methodology) {
      loadContent();
    }
  }, [methodology, onContentLoaded]);

  if (loading) {
    return (
      <div className={`methodology-education ${className}`}>
        <LoadingSpinner size="lg" text="Loading educational content..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`methodology-education ${className}`}>
        <ErrorMessage 
          type="error"
          title="Failed to Load Educational Content"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!content) {
    return (
      <div className={`methodology-education ${className}`}>
        <ErrorMessage 
          type="warning"
          title="No Educational Content Available"
          message="Educational content for this methodology is not currently available."
        />
      </div>
    );
  }

  const sections = compact 
    ? ['overview', 'principles']
    : ['overview', 'principles', 'implementation', 'references', 'regional'];

  const methodologyName = methodology.charAt(0).toUpperCase() + methodology.slice(1);

  return (
    <div className={`methodology-education bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center">
          <span className="text-3xl mr-3">📚</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {methodologyName} Methodology Guide
            </h2>
            <p className="text-gray-600 mt-1">
              Islamic jurisprudence and practical guidance
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex px-6 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeSection === section
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {section === 'overview' && '📖 Overview'}
              {section === 'principles' && '⚖️ Key Principles'}
              {section === 'implementation' && '🔧 Implementation'}
              {section === 'references' && '📚 References'}
              {section === 'regional' && '🌍 Regional Usage'}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Sections */}
      <div className="p-6">
        {activeSection === 'overview' && (
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Historical Background
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {content.historicalBackground}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Nisab Calculation Approach
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {content.nisabApproach}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Advantages & Considerations
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-green-800 mb-2">✅ Advantages</h4>
                  <ul className="space-y-1">
                    {content.pros.map((pro, index) => (
                      <li key={index} className="text-sm text-green-700 flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-orange-800 mb-2">⚠️ Considerations</h4>
                  <ul className="space-y-1">
                    {content.considerations.map((consideration, index) => (
                      <li key={index} className="text-sm text-orange-700 flex items-start">
                        <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {consideration}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeSection === 'principles' && (
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Key Principles & Rules
              </h3>
              <div className="grid gap-4">
                {content.keyPrinciples.map((principle, index) => (
                  <div key={index} className="flex items-start bg-blue-50 rounded-lg p-4">
                    <span className="text-blue-600 font-bold text-lg mr-3">
                      {index + 1}.
                    </span>
                    <p className="text-blue-800 font-medium">{principle}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeSection === 'implementation' && (
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Business Asset Treatment
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {content.businessAssetTreatment}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Debt Treatment Guidelines
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {content.debtTreatment}
              </p>
            </section>
          </div>
        )}

        {activeSection === 'references' && (
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Scholarly References
              </h3>
              <div className="space-y-3">
                {content.scholarlyReferences.map((reference, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-gray-400 mr-3">📖</span>
                    <p className="text-gray-700">{reference}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeSection === 'regional' && (
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Regional Usage & Applications
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {content.regionalUsage.map((region, index) => (
                  <div key={index} className="flex items-center bg-gray-50 rounded-lg p-3">
                    <span className="text-blue-600 mr-2">🌍</span>
                    <span className="text-gray-700 font-medium">{region}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
        <p className="text-sm text-gray-600 text-center">
          <span className="font-medium">📌 Important:</span> This educational content is for guidance only. 
          Please consult with qualified Islamic scholars for specific situations and detailed rulings.
        </p>
      </div>
    </div>
  );
};

export default MethodologyEducation;