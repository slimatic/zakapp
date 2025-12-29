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
import { AssetCategoryType } from '@zakapp/shared';

interface AssetCategory {
  id: AssetCategoryType;
  name: string;
  description: string;
  zakatRule: string;
  icon: string;
  examples: string[];
  nisabThreshold?: number;
  zakatRate: number;
}

/**
 * AssetCategories component for displaying asset categories and their Zakat rules
 */
export const AssetCategories: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<AssetCategoryType | null>(null);

  const categories: AssetCategory[] = [
    {
      id: 'cash',
      name: 'Cash & Savings',
      description: 'Liquid money including bank accounts, cash on hand, and money market accounts',
      zakatRule: 'Fully zakatable if held for one lunar year and exceeds nisab threshold',
      icon: '💰',
      examples: ['Savings accounts', 'Checking accounts', 'Cash on hand', 'Money market accounts', 'CDs'],
      zakatRate: 2.5
    },
    {
      id: 'gold',
      name: 'Gold',
      description: 'Gold jewelry, coins, bars, and ornaments',
      zakatRule: 'Zakatable if total weight exceeds 85 grams (7.5 tola) of pure gold',
      icon: '🥇',
      examples: ['Gold jewelry', 'Gold coins', 'Gold bars', 'Gold ornaments'],
      nisabThreshold: 85, // grams
      zakatRate: 2.5
    },
    {
      id: 'silver',
      name: 'Silver',
      description: 'Silver jewelry, coins, bars, ornaments, and utensils',
      zakatRule: 'Zakatable if total weight exceeds 595 grams (52.5 tola) of pure silver',
      icon: '🥈',
      examples: ['Silver jewelry', 'Silver coins', 'Silver bars', 'Silver utensils', 'Ornaments'],
      nisabThreshold: 595, // grams
      zakatRate: 2.5
    },
    {
      id: 'business',
      name: 'Business Assets',
      description: 'Business inventory, trade goods, and commercial assets',
      zakatRule: 'Zakatable on current market value of inventory and trade goods',
      icon: '🏢',
      examples: ['Inventory', 'Trade goods', 'Raw materials', 'Finished products', 'Work in progress'],
      zakatRate: 2.5
    },
    {
      id: 'stocks',
      name: 'Stocks & Investments',
      description: 'Shares, mutual funds, bonds, and investment accounts',
      zakatRule: 'Zakatable on current market value, excluding retirement accounts in some methodologies',
      icon: '📈',
      examples: ['Individual stocks', 'Mutual funds', 'ETFs', 'Bonds', 'Index funds'],
      zakatRate: 2.5
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      description: 'Digital currencies and crypto assets',
      zakatRule: 'Treated as currency, zakatable on current market value',
      icon: '₿',
      examples: ['Bitcoin', 'Ethereum', 'Stablecoins', 'DeFi tokens', 'Altcoins'],
      zakatRate: 2.5
    },
    {
      id: 'property',
      name: 'Investment Property',
      description: 'Real estate held for investment or rental income',
      zakatRule: 'Generally zakatable only if held for trade, not personal residence',
      icon: '🏠',
      examples: ['Rental properties', 'Commercial real estate', 'Investment land', 'REITs'],
      zakatRate: 2.5
    },
    {
      id: 'debts',
      name: 'Debts Owed to You',
      description: 'Money owed to you by others',
      zakatRule: 'Zakatable if likely to be collected',
      icon: '📝',
      examples: ['Personal loans given', 'Business receivables', 'Security deposits recoverable'],
      zakatRate: 2.5
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Asset Categories & Zakat Rules</h1>
        <p className="text-lg text-gray-600">
          Understanding how different types of assets are treated in Islamic Zakat calculation
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`bg-white rounded-lg border-2 p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedCategory === category.id 
                ? 'border-blue-500 ring-2 ring-blue-200' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <div className="text-center">
              <div className="text-4xl mb-3">{category.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {category.name}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {category.description}
              </p>
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {category.zakatRate}% Zakat Rate
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Information Panel */}
      {selectedCategoryData && (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="flex items-center mb-6">
            <div className="text-5xl mr-4">{selectedCategoryData.icon}</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedCategoryData.name}
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedCategoryData.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Zakat Rules */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Zakat Rules</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    {selectedCategoryData.zakatRule}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Zakat Rate</h4>
                    <p className="text-xl font-bold text-green-600">
                      {selectedCategoryData.zakatRate}%
                    </p>
                  </div>
                  
                  {selectedCategoryData.nisabThreshold && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        Nisab Threshold
                      </h4>
                      <p className="text-lg font-bold text-orange-600">
                        {selectedCategoryData.nisabThreshold} 
                        {selectedCategoryData.id === 'gold' ? 'g' : selectedCategoryData.id === 'silver' ? 'g' : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Examples */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Examples</h3>
              <div className="space-y-2">
                {selectedCategoryData.examples.map((example, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{example}</span>
                  </div>
                ))}
              </div>

              {/* Islamic Guidance */}
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-900 mb-2">
                  📖 Islamic Guidance
                </h4>
                <p className="text-xs text-green-800">
                  {selectedCategoryData.id === 'cash' && 
                    "Cash and liquid assets are subject to Zakat if they meet the nisab threshold and have been held for one complete lunar year (hawl)."}
                  {selectedCategoryData.id === 'gold' && 
                    "Gold is mentioned specifically in Islamic texts. The nisab for gold is 20 mithqals (approximately 85 grams of pure gold)."}
                  {selectedCategoryData.id === 'silver' && 
                    "Silver nisab is 200 dirhams (approximately 595 grams of pure silver). This is often used as the lower nisab threshold."}
                  {selectedCategoryData.id === 'business' && 
                    "Business inventory and trade goods are zakatable based on their current market value, not the original purchase price."}
                  {selectedCategoryData.id === 'stocks' && 
                    "Modern scholars generally agree that stocks are zakatable, though some exclude retirement accounts that cannot be accessed."}
                  {selectedCategoryData.id === 'crypto' && 
                    "Cryptocurrency is a modern asset. Most scholars treat it like currency, subject to the same Zakat rules as cash."}
                  {selectedCategoryData.id === 'property' && 
                    "Real estate for personal use is generally not zakatable. Investment property may be zakatable depending on intent."}
                  {selectedCategoryData.id === 'debts' && 
                    "Debts owed to you are zakatable if you reasonably expect to collect them and they meet other Zakat conditions."}
                </p>
              </div>
            </div>
          </div>

          {/* Calculation Example */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Calculation Example
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Asset Value:</span>
                <span className="ml-2 font-semibold">{formatCurrency(10000)}</span>
              </div>
              <div>
                <span className="text-gray-600">Zakat Rate:</span>
                <span className="ml-2 font-semibold">{selectedCategoryData.zakatRate}%</span>
              </div>
              <div>
                <span className="text-gray-600">Zakat Due:</span>
                <span className="ml-2 font-semibold text-green-600">
                  {formatCurrency(10000 * (selectedCategoryData.zakatRate / 100))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* General Information */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          📚 General Zakat Principles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
          <div>
            <h4 className="font-semibold mb-2">Key Requirements:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Must meet nisab threshold (minimum amount)</li>
              <li>Must be held for one complete lunar year (hawl)</li>
              <li>Must be in excess of basic needs</li>
              <li>Owner must have complete control over the asset</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Important Notes:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Debts are deducted from zakatable wealth</li>
              <li>Different methodologies may have variations</li>
              <li>Consult qualified scholars for complex situations</li>
              <li>Intention (niyyah) is important in Islamic practice</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};