import React, { useState } from 'react';

/**
 * NisabExplainer Component - T026
 *
 * Explains nisab thresholds with visual graphics and Islamic references
 */
const NisabExplainer: React.FC = () => {
  const [selectedMetal, setSelectedMetal] = useState<'gold' | 'silver'>('gold');

  // Current nisab values (approximate as of 2024 - these would be calculated dynamically)
  const nisabValues = {
    gold: {
      name: 'Gold Nisab',
      threshold: 87.48, // grams
      value: 7500, // USD equivalent
      description: 'Based on 87.48 grams of pure gold'
    },
    silver: {
      name: 'Silver Nisab',
      threshold: 612.36, // grams
      value: 750, // USD equivalent
      description: 'Based on 612.36 grams of pure silver'
    }
  };

  const currentNisab = nisabValues[selectedMetal];

  // Visual representation data
  const goldBars = Math.ceil(currentNisab.threshold / 10); // Approximate 10g bars
  const silverCoins = Math.ceil(currentNisab.threshold / 20); // Approximate 20g coins

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Understanding Nisab Threshold</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          The minimum amount of wealth required before Zakat becomes obligatory
        </p>
      </div>

      {/* What is Nisab */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What is Nisab?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-600 mb-4">
              Nisab is the minimum threshold of wealth that a Muslim must possess before Zakat becomes obligatory.
              If your total zakatable assets are below this threshold, you are not required to pay Zakat.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Key Points</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Must be maintained for one lunar year</li>
                <li>• Calculated based on gold or silver value</li>
                <li>• Different thresholds for different schools</li>
                <li>• Subject to market fluctuations</li>
              </ul>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Islamic References</h4>
            <div className="space-y-3">
              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex items-center mb-1">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">Quran</span>
                  <span className="ml-2 text-sm text-gray-500">Surah Al-Baqarah (2:219)</span>
                </div>
                <p className="text-gray-700 text-sm italic">
                  "They ask you about wine and gambling. Say, 'In them is great sin and some benefit for people...'"
                </p>
              </div>
              <div className="border-l-4 border-yellow-500 pl-4">
                <div className="flex items-center mb-1">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">Hadith</span>
                  <span className="ml-2 text-sm text-gray-500">Sahih Muslim 979</span>
                </div>
                <p className="text-gray-700 text-sm italic">
                  "There is no zakat on wealth until one year passes over it."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nisab Calculator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Nisab Threshold Calculator</h3>

        {/* Metal Selector */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setSelectedMetal('gold')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedMetal === 'gold'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🪙 Gold Standard
            </button>
            <button
              onClick={() => setSelectedMetal('silver')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedMetal === 'silver'
                  ? 'bg-gray-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🪙 Silver Standard
            </button>
          </div>
        </div>

        {/* Threshold Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{currentNisab.threshold.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Grams of {selectedMetal}</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">${currentNisab.value.toLocaleString()}</div>
            <div className="text-sm text-gray-600">USD Equivalent</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{currentNisab.threshold * 2.5 / 1000}kg</div>
            <div className="text-sm text-gray-600">Weight</div>
          </div>
        </div>

        {/* Visual Representation */}
        <div className="border-t pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Visual Representation</h4>
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="text-center mb-4">
              <p className="text-gray-600">
                {currentNisab.description} (≈ ${currentNisab.value.toLocaleString()} USD)
              </p>
            </div>

            {/* Visual bars/coins */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {Array.from({ length: selectedMetal === 'gold' ? goldBars : silverCoins }, (_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded ${
                    selectedMetal === 'gold'
                      ? 'bg-yellow-400 border-2 border-yellow-500'
                      : 'bg-gray-400 border-2 border-gray-500'
                  }`}
                  title={`${selectedMetal === 'gold' ? '10g gold bar' : '20g silver coin'}`}
                />
              ))}
            </div>

            <div className="text-center text-sm text-gray-500">
              Each {selectedMetal === 'gold' ? 'bar represents ~10g of gold' : 'coin represents ~20g of silver'}
            </div>
          </div>
        </div>
      </div>

      {/* Current Market Values */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Market Values</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Gold Price</h4>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-yellow-800">Per Gram</span>
              <span className="font-bold text-yellow-900">$85.60</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-yellow-800">Per Ounce</span>
              <span className="font-bold text-yellow-900">$2,662</span>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Silver Price</h4>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-800">Per Gram</span>
              <span className="font-bold text-gray-900">$1.23</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-800">Per Ounce</span>
              <span className="font-bold text-gray-900">$38.25</span>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Nisab values are updated daily based on current market prices.
            The values shown above are for illustration purposes.
          </p>
        </div>
      </div>

      {/* Educational Resources */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Learn More About Nisab</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Recommended Reading</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://simple-zakat-guide.com/nisab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Understanding Nisab - Simple Zakat Guide
                </a>
              </li>
              <li>
                <a
                  href="https://www.zakat.org/nisab-calculator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Interactive Nisab Calculator
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Video Resources</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-20 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">What is Nisab?</p>
                  <p className="text-gray-500 text-xs">Simple Zakat Guide • 5 min</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-20 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Gold vs Silver Nisab</p>
                  <p className="text-gray-500 text-xs">Islamic Finance Explained • 8 min</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NisabExplainer;