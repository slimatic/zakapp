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
 * ComparisonCalculator Component
 * 
 * Compares Zakat calculations across different Islamic methodologies
 * side-by-side to help users understand the differences.
 */

import React, { useState, useEffect } from 'react';
import { Tooltip, InfoIcon } from '../ui';

export interface ComparisonCalculatorProps {
  initialAssets?: Record<string, number>;
  className?: string;
}

interface MethodologyResult {
  methodology: string;
  methodologyName: string;
  nisabThreshold: number;
  nisabType: string;
  totalZakat: number;
  rate: number;
  description: string;
}

interface AssetInputs {
  cash: number;
  gold: number;
  silver: number;
  crypto: number;
  business: number;
  investments: number;
}

export const ComparisonCalculator: React.FC<ComparisonCalculatorProps> = ({
  initialAssets,
  className = ''
}) => {
  const [assets, setAssets] = useState<AssetInputs>({
    cash: 0,
    gold: 0,
    silver: 0,
    crypto: 0,
    business: 0,
    investments: 0,
    ...initialAssets
  });

  const [results, setResults] = useState<MethodologyResult[]>([]);
  const [totalWealth, setTotalWealth] = useState(0);

  // Calculate total wealth whenever assets change
  useEffect(() => {
    const total = Object.values(assets).reduce((sum, val) => sum + val, 0);
    setTotalWealth(total);
  }, [assets]);

  // Calculate Zakat for all methodologies
  useEffect(() => {
    const zakatRate = 0.025; // 2.5%

    const methodologies: MethodologyResult[] = [
      {
        methodology: 'standard',
        methodologyName: 'Standard (AAOIFI)',
        nisabThreshold: 5500, // Gold-based (85g)
        nisabType: 'Gold-based (85g)',
        totalZakat: totalWealth >= 5500 ? totalWealth * zakatRate : 0,
        rate: 2.5,
        description: 'Uses gold-based nisab. Widely accepted modern standard.'
      },
      {
        methodology: 'hanafi',
        methodologyName: 'Hanafi',
        nisabThreshold: 3000, // Silver-based (595g) - typically lower
        nisabType: 'Silver-based (595g)',
        totalZakat: totalWealth >= 3000 ? totalWealth * zakatRate : 0,
        rate: 2.5,
        description: 'Uses lower of silver or gold nisab. More inclusive approach.'
      },
      {
        methodology: 'shafii',
        methodologyName: "Shafi'i",
        nisabThreshold: 5500, // Gold-based (85g)
        nisabType: 'Gold-based (85g)',
        totalZakat: totalWealth >= 5500 ? totalWealth * zakatRate : 0,
        rate: 2.5,
        description: 'Separates gold and silver nisabs. Detailed categorization.'
      }
    ];

    setResults(methodologies);
  }, [totalWealth]);

  const handleAssetChange = (assetType: keyof AssetInputs, value: string) => {
    const numValue = parseFloat(value) || 0;
    setAssets(prev => ({ ...prev, [assetType]: numValue }));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getHighestZakat = (): number => {
    return Math.max(...results.map(r => r.totalZakat));
  };

  const getLowestZakat = (): number => {
    const nonZero = results.filter(r => r.totalZakat > 0);
    return nonZero.length > 0 ? Math.min(...nonZero.map(r => r.totalZakat)) : 0;
  };

  const getDifference = (): number => {
    return getHighestZakat() - getLowestZakat();
  };

  const exportComparison = () => {
    const data = {
      timestamp: new Date().toISOString(),
      totalWealth,
      assets,
      methodologies: results.map(r => ({
        methodology: r.methodologyName,
        nisabThreshold: r.nisabThreshold,
        nisabType: r.nisabType,
        zakatDue: r.totalZakat,
        meetsNisab: totalWealth >= r.nisabThreshold
      })),
      difference: getDifference()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zakat-comparison-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Methodology Comparison Calculator
        </h1>
        <p className="text-gray-600">
          Compare how different Islamic methodologies calculate your Zakat obligation
        </p>
      </div>

      {/* Asset Input Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Enter Your Assets</h2>
          <Tooltip content="Enter the same asset values to see how different methodologies calculate Zakat">
            <InfoIcon />
          </Tooltip>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries({
            cash: { label: 'Cash & Savings', icon: '💰' },
            gold: { label: 'Gold', icon: '🪙' },
            silver: { label: 'Silver', icon: '🪙' },
            crypto: { label: 'Cryptocurrency', icon: '₿' },
            business: { label: 'Business Assets', icon: '💼' },
            investments: { label: 'Investments', icon: '📈' }
          }).map(([key, { label, icon }]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {icon} {label}
              </label>
              <input
                type="number"
                value={assets[key as keyof AssetInputs] || ''}
                onChange={(e) => handleAssetChange(key as keyof AssetInputs, e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">Total Wealth:</span>
            <span className="text-lg font-bold text-blue-900">
              {formatCurrency(totalWealth)}
            </span>
          </div>
        </div>
      </div>

      {/* Comparison Results */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Methodology Comparison</h2>
          <button
            onClick={exportComparison}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            📥 Export Comparison
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {results.map((result, index) => {
            const meetsNisab = totalWealth >= result.nisabThreshold;
            const isHighest = result.totalZakat === getHighestZakat() && result.totalZakat > 0;
            const isLowest = result.totalZakat === getLowestZakat() && result.totalZakat > 0;

            return (
              <div
                key={result.methodology}
                className={`bg-white rounded-lg border-2 p-6 transition-all ${isHighest && totalWealth > 0
                  ? 'border-red-500 shadow-lg'
                  : isLowest && totalWealth > 0
                    ? 'border-green-500 shadow-lg'
                    : 'border-gray-200'
                  }`}
              >
                {/* Badge for highest/lowest */}
                {isHighest && totalWealth > 0 && (
                  <div className="mb-2">
                    <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                      Highest Zakat
                    </span>
                  </div>
                )}
                {isLowest && totalWealth > 0 && (
                  <div className="mb-2">
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                      Lowest Zakat
                    </span>
                  </div>
                )}

                {/* Methodology Name */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {result.methodologyName}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4">
                  {result.description}
                </p>

                {/* Nisab Info */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Nisab Threshold:</span>
                    <Tooltip content={`Minimum wealth required for Zakat. ${result.nisabType}`}>
                      <InfoIcon />
                    </Tooltip>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(result.nisabThreshold)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{result.nisabType}</p>
                </div>

                {/* Nisab Status */}
                <div className={`mb-4 p-3 rounded-lg ${meetsNisab ? 'bg-green-50' : 'bg-gray-50'
                  }`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {meetsNisab ? '✅' : '○'}
                    </span>
                    <span className={`text-sm font-medium ${meetsNisab ? 'text-green-700' : 'text-gray-600'
                      }`}>
                      {meetsNisab ? 'Meets Nisab' : 'Below Nisab'}
                    </span>
                  </div>
                </div>

                {/* Zakat Amount */}
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600 mb-1">Zakat Due:</p>
                  <p className={`text-2xl font-bold ${meetsNisab ? 'text-green-700' : 'text-gray-400'
                    }`}>
                    {formatCurrency(result.totalZakat)}
                  </p>
                  {meetsNisab && (
                    <p className="text-xs text-gray-500 mt-1">
                      {result.rate}% of {formatCurrency(totalWealth)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Differences Explanation */}
      {totalWealth > 0 && getDifference() > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Understanding the Differences
              </h3>
              <p className="text-sm text-yellow-800 mb-3">
                The difference between the highest and lowest Zakat calculations is{' '}
                <strong>{formatCurrency(getDifference())}</strong>. Here's why:
              </p>
              <ul className="space-y-2 text-sm text-yellow-800">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    <strong>Nisab Threshold:</strong> Hanafi methodology uses a lower silver-based nisab ({formatCurrency(3000)}),
                    while Standard and Shafi'i use gold-based nisab ({formatCurrency(5500)}). Lower nisab means more people qualify to pay Zakat.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    <strong>Charitable Wisdom:</strong> The Hanafi school chose the lower threshold to maximize benefit
                    to those in need, reflecting the principle that "the poor have a right in the wealth of the rich."
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    <strong>All Are Valid:</strong> Each methodology is based on authentic Islamic scholarship.
                    Choose based on your madhab, region, or scholar's guidance.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Key Insights */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">Same Rate, Different Thresholds</p>
            <p className="text-xs text-blue-700">
              All methodologies apply 2.5% rate, but differ in nisab thresholds based on gold vs silver values.
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-900 mb-1">Regional Preferences</p>
            <p className="text-xs text-green-700">
              South Asia often follows Hanafi, Middle East follows Shafi'i, modern contexts use Standard.
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm font-medium text-purple-900 mb-1">Scholarly Agreement</p>
            <p className="text-xs text-purple-700">
              All scholars agree on the 2.5% rate and core principles. Differences are in application details.
            </p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <p className="text-sm font-medium text-amber-900 mb-1">When in Doubt</p>
            <p className="text-xs text-amber-700">
              Consult a qualified Islamic scholar who understands your specific situation and local context.
            </p>
          </div>
        </div>
      </div>

      {/* Educational Note */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-700 italic">
          <strong>📚 Note:</strong> This comparison tool is for educational purposes.
          All methodologies are based on authentic Islamic scholarship. Your choice should
          be guided by your madhab, regional scholarly consensus, or consultation with a qualified scholar.
        </p>
      </div>
    </div>
  );
};

export default ComparisonCalculator;
