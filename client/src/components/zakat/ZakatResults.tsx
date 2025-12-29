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

import React, { useState } from 'react';
import { Button } from '../ui';

interface ZakatCalculation {
  id: string;
  calculationDate: string;
  methodology: string;
  calendarType: string;
  summary: {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    nisabThreshold: number;
    nisabSource: 'gold' | 'silver';
    isZakatObligatory: boolean;
    zakatAmount: number;
    zakatRate: number;
  };
  breakdown: {
    assetsByCategory: Array<{
      category: string;
      totalValue: number;
      zakatableAmount: number;
      rate: number;
      zakatAmount: number;
      assets: Array<{
        id: string;
        name: string;
        value: number;
        zakatableValue: number;
      }>;
    }>;
    liabilities: Array<{
      id: string;
      name: string;
      amount: number;
      deductible: boolean;
    }>;
  };
  educationalContent: {
    methodologyExplanation: string;
    scholarlyReferences: string[];
    nisabExplanation: string;
  };
}

interface ZakatResultsProps {
  calculation: ZakatCalculation;
  onExport: (format: 'pdf' | 'json') => void;
  onSave: () => void;
  saveCalculationName: string;
  onSaveNameChange: (name: string) => void;
}

/**
 * ZakatResults Component
 * Displays detailed Zakat calculation breakdown with visual charts,
 * educational content, and export capabilities
 */
export const ZakatResults: React.FC<ZakatResultsProps> = ({
  calculation,
  onExport,
  onSave,
  saveCalculationName,
  onSaveNameChange
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'breakdown' | 'education'>('summary');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (rate: number): string => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  const getZakatStatusColor = () => {
    return calculation.summary.isZakatObligatory 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getZakatStatusIcon = () => {
    return calculation.summary.isZakatObligatory ? '✅' : '⚠️';
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      cash: '💰',
      gold: '🥇',
      silver: '🥈',
      crypto: '₿',
      business: '🏢',
      investment: '📈',
      real_estate: '🏠',
      other: '💼'
    };
    return icons[category] || '💰';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Zakat Calculation Results
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Calculated on {new Date(calculation.calculationDate).toLocaleDateString()} 
              using {calculation.methodology} methodology
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowSaveDialog(true)}
            >
              Save Calculation
            </Button>
            <div className="relative">
              <Button
                variant="secondary"
                onClick={() => onExport('pdf')}
              >
                Export PDF
              </Button>
            </div>
            <Button
              variant="secondary"
              onClick={() => onExport('json')}
            >
              Export JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`px-6 py-4 border-b border-gray-200 ${getZakatStatusColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getZakatStatusIcon()}</span>
            <div>
              <h3 className="text-lg font-semibold">
                {calculation.summary.isZakatObligatory 
                  ? 'Zakat is Obligatory' 
                  : 'Zakat is Not Obligatory'
                }
              </h3>
              <p className="text-sm">
                {calculation.summary.isZakatObligatory
                  ? `Your Zakat obligation is ${formatCurrency(calculation.summary.zakatAmount)}`
                  : `Your wealth is below the nisab threshold of ${formatCurrency(calculation.summary.nisabThreshold)}`
                }
              </p>
            </div>
          </div>
          {calculation.summary.isZakatObligatory && (
            <div className="text-right">
              <div className="text-3xl font-bold">
                {formatCurrency(calculation.summary.zakatAmount)}
              </div>
              <div className="text-sm">
                {formatPercentage(calculation.summary.zakatRate)} of eligible wealth
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex px-6">
          {[
            { id: 'summary', label: 'Summary', icon: '📊' },
            { id: 'breakdown', label: 'Detailed Breakdown', icon: '📋' },
            { id: 'education', label: 'Islamic Guidance', icon: '📚' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600">Total Assets</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(calculation.summary.totalAssets)}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600">Net Worth</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(calculation.summary.netWorth)}
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-600">Nisab Threshold</div>
                <div className="text-2xl font-bold text-blue-900 mt-1">
                  {formatCurrency(calculation.summary.nisabThreshold)}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Based on {calculation.summary.nisabSource} prices
                </div>
              </div>
            </div>

            {/* Asset Distribution Chart Placeholder */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Asset Distribution by Category
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {calculation.breakdown.assetsByCategory.map((category, index) => (
                  <div key={category.category} className="text-center">
                    <div className="text-3xl mb-2">{getCategoryIcon(category.category)}</div>
                    <div className="text-sm font-medium text-gray-900 capitalize">
                      {category.category.replace('_', ' ')}
                    </div>
                    <div className="text-lg font-bold text-gray-900 mt-1">
                      {formatCurrency(category.totalValue)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {((category.totalValue / calculation.summary.totalAssets) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Payment Suggestion */}
            {calculation.summary.isZakatObligatory && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-lg font-medium text-green-900 mb-2">
                  💡 Payment Suggestions
                </h4>
                <div className="space-y-2 text-sm text-green-800">
                  <p>
                    <strong>Monthly Payment:</strong> {formatCurrency(calculation.summary.zakatAmount / 12)} 
                    (spread over 12 months)
                  </p>
                  <p>
                    <strong>Before Ramadan:</strong> Consider paying your Zakat before the holy month to 
                    maximize spiritual rewards.
                  </p>
                  <p>
                    <strong>Local Recipients:</strong> Prioritize local Islamic charities and those in need 
                    within your community.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Breakdown Tab */}
        {activeTab === 'breakdown' && (
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900">
              Asset-by-Asset Analysis
            </h4>
            
            {calculation.breakdown.assetsByCategory.map((category) => (
              <div key={category.category} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getCategoryIcon(category.category)}</span>
                    <div>
                      <h5 className="text-lg font-medium text-gray-900 capitalize">
                        {category.category.replace('_', ' ')}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {category.assets.length} asset{category.assets.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      Zakat: {formatCurrency(category.zakatAmount)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatPercentage(category.rate)} of {formatCurrency(category.zakatableAmount)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {category.assets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-gray-900">{asset.name}</div>
                        <div className="text-sm text-gray-600">
                          Total Value: {formatCurrency(asset.value)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(asset.zakatableValue)}
                        </div>
                        <div className="text-sm text-gray-600">
                          Zakatable Value
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Liabilities Deduction */}
            {calculation.breakdown.liabilities.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="text-lg font-medium text-gray-900 mb-4">
                  💳 Liability Deductions
                </h5>
                <div className="space-y-2">
                  {calculation.breakdown.liabilities.map((liability) => (
                    <div key={liability.id} className="flex items-center justify-between py-2 px-3 bg-red-50 rounded">
                      <div>
                        <div className="font-medium text-gray-900">{liability.name}</div>
                        <div className="text-sm text-gray-600">
                          {liability.deductible ? 'Deductible' : 'Non-deductible'}
                        </div>
                      </div>
                      <div className="font-medium text-red-600">
                        -{formatCurrency(liability.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Education Tab */}
        {activeTab === 'education' && (
          <div className="space-y-6">
            {/* Methodology Explanation */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-blue-900 mb-4">
                📖 {calculation.methodology} Methodology
              </h4>
              <p className="text-blue-800 leading-relaxed">
                {calculation.educationalContent.methodologyExplanation}
              </p>
            </div>

            {/* Nisab Explanation */}
            <div className="bg-green-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-green-900 mb-4">
                ⚖️ Understanding Nisab
              </h4>
              <p className="text-green-800 leading-relaxed mb-4">
                {calculation.educationalContent.nisabExplanation}
              </p>
              <div className="text-sm text-green-700">
                <p><strong>Current Calculation:</strong></p>
                <p>• Nisab source: {calculation.summary.nisabSource}</p>
                <p>• Threshold amount: {formatCurrency(calculation.summary.nisabThreshold)}</p>
                <p>• Your wealth: {formatCurrency(calculation.summary.netWorth)}</p>
              </div>
            </div>

            {/* Scholarly References */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                📚 Scholarly References
              </h4>
              <ul className="space-y-2">
                {calculation.educationalContent.scholarlyReferences.map((reference, index) => (
                  <li key={index} className="text-gray-700 text-sm">
                    <span className="font-medium">{index + 1}.</span> {reference}
                  </li>
                ))}
              </ul>
            </div>

            {/* Additional Islamic Guidance */}
            <div className="bg-yellow-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-yellow-900 mb-4">
                🤲 Additional Guidance
              </h4>
              <div className="space-y-3 text-sm text-yellow-800">
                <p>
                  <strong>Intention (Niyyah):</strong> Ensure your intention is pure when paying Zakat, 
                  as it is an act of worship and purification of wealth.
                </p>
                <p>
                  <strong>Eligible Recipients:</strong> Zakat must be paid to one of the eight categories 
                  mentioned in the Quran (Surah At-Tawbah, 9:60).
                </p>
                <p>
                  <strong>Timing:</strong> Zakat becomes due once a lunar year (Hawl) has passed since 
                  acquiring nisab-level wealth.
                </p>
                <p>
                  <strong>Local vs Global:</strong> While helping local communities is encouraged, 
                  Zakat can be distributed globally based on need and impact.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Calculation Modal */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Save Calculation
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="saveName" className="block text-sm font-medium text-gray-700 mb-2">
                  Calculation Name
                </label>
                <input
                  type="text"
                  id="saveName"
                  value={saveCalculationName}
                  onChange={(e) => onSaveNameChange(e.target.value)}
                  placeholder="e.g., Zakat 2025 - Ramadan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowSaveDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    onSave();
                    setShowSaveDialog(false);
                  }}
                  disabled={!saveCalculationName.trim()}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};