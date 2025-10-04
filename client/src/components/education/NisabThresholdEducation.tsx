/**
 * NisabThresholdEducation Component
 * 
 * Educational component explaining nisab thresholds and their calculation.
 * 
 * Constitutional Compliance:
 * - Islamic Compliance: Based on authentic Islamic jurisprudence
 * - User-Centric Design: Clear explanations with visual examples
 * - Transparency & Trust: Real-time data and scholarly references
 * - Lovable UI/UX: Interactive and engaging threshold calculator
 */

import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';

interface NisabData {
  goldPrice: number;
  silverPrice: number;
  goldNisab: number;
  silverNisab: number;
  goldThreshold: number;
  silverThreshold: number;
  recommendedThreshold: number;
  lastUpdated: string;
}

interface NisabThresholdEducationProps {
  /** Whether to show current market prices */
  showLivePrices?: boolean;
  /** Currency to display prices in */
  currency?: string;
  /** Additional CSS classes */
  className?: string;
  /** Callback when threshold data is loaded */
  onDataLoaded?: (data: NisabData) => void;
}

/**
 * Mock nisab data for demonstration
 * In production, this would come from a real-time API
 */
const MOCK_NISAB_DATA: NisabData = {
  goldPrice: 64.50, // per gram in USD
  silverPrice: 0.82, // per gram in USD
  goldNisab: 87.48, // grams
  silverNisab: 612.36, // grams
  goldThreshold: 5642.496, // goldPrice * goldNisab
  silverThreshold: 502.13, // silverPrice * silverNisab
  recommendedThreshold: 502.13, // lower of the two (silver)
  lastUpdated: new Date().toISOString()
};

/**
 * NisabThresholdEducation Component
 * 
 * Provides comprehensive education about nisab thresholds with real-time calculations
 */
export const NisabThresholdEducation: React.FC<NisabThresholdEducationProps> = ({
  showLivePrices = true,
  currency = 'USD',
  className = '',
  onDataLoaded
}) => {
  const [nisabData, setNisabData] = useState<NisabData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'explanation' | 'calculation' | 'comparison'>('explanation');

  // Load nisab data
  useEffect(() => {
    const loadNisabData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate API call - in production, fetch from real API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setNisabData(MOCK_NISAB_DATA);
        onDataLoaded?.(MOCK_NISAB_DATA);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load nisab data');
      } finally {
        setLoading(false);
      }
    };

    loadNisabData();
  }, [onDataLoaded]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className={`nisab-education ${className}`}>
        <LoadingSpinner size="lg" text="Loading nisab threshold data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`nisab-education ${className}`}>
        <ErrorMessage 
          type="error"
          title="Failed to Load Nisab Data"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!nisabData) {
    return (
      <div className={`nisab-education ${className}`}>
        <ErrorMessage 
          type="warning"
          title="No Nisab Data Available"
          message="Nisab threshold data is not currently available."
        />
      </div>
    );
  }

  return (
    <div className={`nisab-threshold-education bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-3xl mr-3">⚖️</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Understanding Nisab Thresholds
              </h2>
              <p className="text-gray-600 mt-1">
                The minimum wealth required for Zakat obligation
              </p>
            </div>
          </div>
          {showLivePrices && (
            <div className="text-right">
              <div className="text-sm text-gray-500">Last Updated</div>
              <div className="text-sm font-medium text-gray-700">
                {formatDate(nisabData.lastUpdated)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current Thresholds Display */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-green-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Current Nisab Thresholds
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Gold Nisab */}
          <div className="bg-white rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">🥇</span>
              <h4 className="font-semibold text-yellow-800">Gold-Based Nisab</h4>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                {nisabData.goldNisab} grams of gold
              </div>
              <div className="text-xl font-bold text-yellow-700">
                {formatCurrency(nisabData.goldThreshold)}
              </div>
              <div className="text-xs text-gray-500">
                @ {formatCurrency(nisabData.goldPrice)}/gram
              </div>
            </div>
          </div>

          {/* Silver Nisab */}
          <div className="bg-white rounded-lg p-4 border border-gray-300">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">🥈</span>
              <h4 className="font-semibold text-gray-700">Silver-Based Nisab</h4>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                {nisabData.silverNisab} grams of silver
              </div>
              <div className="text-xl font-bold text-gray-700">
                {formatCurrency(nisabData.silverThreshold)}
              </div>
              <div className="text-xs text-gray-500">
                @ {formatCurrency(nisabData.silverPrice)}/gram
              </div>
            </div>
          </div>

          {/* Recommended Threshold */}
          <div className="bg-white rounded-lg p-4 border border-green-300">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">✅</span>
              <h4 className="font-semibold text-green-800">Recommended</h4>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                Lower threshold (more inclusive)
              </div>
              <div className="text-xl font-bold text-green-700">
                {formatCurrency(nisabData.recommendedThreshold)}
              </div>
              <div className="text-xs text-green-600">
                Based on silver value
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex px-6">
          {[
            { id: 'explanation', label: '📖 Explanation', icon: '📖' },
            { id: 'calculation', label: '🧮 Calculation', icon: '🧮' },
            { id: 'comparison', label: '⚖️ Comparison', icon: '⚖️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Sections */}
      <div className="p-6">
        {activeTab === 'explanation' && (
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                What is Nisab?
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Nisab (نصاب) is the minimum amount of wealth a Muslim must possess before they become liable to pay Zakat. 
                It serves as a threshold to ensure that only those with sufficient wealth contribute to this religious obligation, 
                protecting those who are struggling to meet their basic needs.
              </p>
              <p className="text-gray-700 leading-relaxed">
                The concept of nisab is derived from the Hadith of Prophet Muhammad (peace be upon him) and has been 
                established based on specific quantities of gold and silver that were considered significant wealth during his time.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Historical Foundation
              </h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-blue-800 leading-relaxed">
                  <strong>Prophet Muhammad (ﷺ) said:</strong> "No Zakat is due on less than five ounces of silver, 
                  no Zakat is due on less than five camels, and no Zakat is due on less than five wasqs of grain."
                  <br />
                  <em className="text-blue-600">- Sahih Bukhari</em>
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Modern Application
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">Gold Standard</h4>
                  <p className="text-yellow-700 text-sm">
                    Based on 20 mithqals (87.48 grams) of gold. This tends to result in a higher threshold, 
                    making it more exclusive but maintaining the traditional standard.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Silver Standard</h4>
                  <p className="text-gray-600 text-sm">
                    Based on 200 dirhams (612.36 grams) of silver. This typically results in a lower threshold, 
                    making Zakat obligations more inclusive and benefiting more recipients.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'calculation' && (
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                How Nisab is Calculated
              </h3>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-3">Gold Nisab Calculation</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Standard quantity:</span>
                      <span className="font-mono">{nisabData.goldNisab} grams</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current gold price:</span>
                      <span className="font-mono">{formatCurrency(nisabData.goldPrice)}/gram</span>
                    </div>
                    <div className="border-t border-yellow-300 pt-2 flex justify-between font-semibold">
                      <span>Gold nisab threshold:</span>
                      <span className="font-mono">{formatCurrency(nisabData.goldThreshold)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3">Silver Nisab Calculation</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Standard quantity:</span>
                      <span className="font-mono">{nisabData.silverNisab} grams</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current silver price:</span>
                      <span className="font-mono">{formatCurrency(nisabData.silverPrice)}/gram</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 flex justify-between font-semibold">
                      <span>Silver nisab threshold:</span>
                      <span className="font-mono">{formatCurrency(nisabData.silverThreshold)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Practical Example
              </h3>
              <div className="bg-green-50 rounded-lg p-6">
                <p className="text-green-800 mb-4">
                  <strong>Scenario:</strong> Ahmed has $800 in savings and wants to know if he needs to pay Zakat.
                </p>
                <div className="space-y-2 text-sm text-green-700">
                  <div>• Ahmed's wealth: $800</div>
                  <div>• Current recommended nisab: {formatCurrency(nisabData.recommendedThreshold)}</div>
                  <div className="font-semibold text-green-900">
                    • Result: $800 {'>'}  {formatCurrency(nisabData.recommendedThreshold)}, so Ahmed must pay Zakat
                  </div>
                  <div>• Zakat due: $800 × 2.5% = $20</div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Gold vs Silver Nisab: Scholarly Perspectives
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-yellow-800">Gold-Based Approach</h4>
                  
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h5 className="font-medium text-yellow-800 mb-2">✅ Advantages</h5>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Historically stable precious metal</li>
                      <li>• Less volatile than silver prices</li>
                      <li>• Traditional monetary standard</li>
                      <li>• Preferred by some classical scholars</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-100 rounded-lg p-4">
                    <h5 className="font-medium text-yellow-800 mb-2">⚠️ Considerations</h5>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Results in higher threshold</li>
                      <li>• May exclude those who should pay</li>
                      <li>• Less inclusive for wealth distribution</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700">Silver-Based Approach</h4>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-700 mb-2">✅ Advantages</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Lower threshold, more inclusive</li>
                      <li>• Benefits more Zakat recipients</li>
                      <li>• Aligns with social justice principles</li>
                      <li>• Preferred by many contemporary scholars</li>
                    </ul>
                  </div>

                  <div className="bg-gray-100 rounded-lg p-4">
                    <h5 className="font-medium text-gray-700 mb-2">⚠️ Considerations</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• More volatile pricing</li>
                      <li>• Requires regular recalculation</li>
                      <li>• May burden middle-income earners</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Contemporary Scholarly Consensus
              </h3>
              <div className="bg-blue-50 rounded-lg p-6">
                <p className="text-blue-800 leading-relaxed">
                  <strong>Most contemporary Islamic scholars recommend using the silver-based nisab</strong> as it results 
                  in a lower threshold, making Zakat obligations more inclusive and ensuring that wealth circulation 
                  benefits a greater number of those in need. This approach aligns with the broader objectives of Islamic 
                  social justice and wealth distribution.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Regional Variations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-800 mb-2">🌍 Middle East</h5>
                  <p className="text-gray-600">Often prefer gold standard due to traditional monetary systems</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-800 mb-2">🌏 Southeast Asia</h5>
                  <p className="text-gray-600">Commonly use silver standard for more inclusive calculations</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-800 mb-2">🌎 Western Countries</h5>
                  <p className="text-gray-600">Tend to adopt silver standard following contemporary scholarship</p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">📌 Remember:</span> Nisab thresholds change with market prices.
          </p>
          <p className="text-xs text-gray-500">
            Check current values regularly and consult Islamic scholars for guidance on methodology selection.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NisabThresholdEducation;