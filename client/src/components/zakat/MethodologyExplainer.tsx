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

/**
 * MethodologyExplainer Component - T026
 *
 * Provides detailed explanations of different Zakat calculation methodologies
 * with Islamic source references and educational content.
 */
const MethodologyExplainer: React.FC = () => {
  const [selectedMethodology, setSelectedMethodology] = useState<string>('standard');

  const methodologies = {
    standard: {
      name: 'Standard Methodology',
      description: 'The most commonly used approach based on Hanafi school of thought',
      calculation: '2.5% of zakatable assets above nisab threshold',
      assets: ['Cash', 'Gold', 'Silver', 'Business inventory', 'Investment accounts'],
      references: [
        { type: 'Quran', reference: 'Surah At-Taubah (9:103)', text: 'Take, [O, Muhammad], from their wealth a charity by which you purify them and cause them increase...' },
        { type: 'Hadith', reference: 'Sahih Muslim 979', text: 'Zakat is obligatory upon the Muslims...' }
      ],
      details: 'This methodology follows the traditional Hanafi approach where business assets are valued at cost price, and debts owed to you are included in the calculation.'
    },
    hanafi: {
      name: 'Hanafi Methodology',
      description: 'Traditional Hanafi school approach with specific business valuation rules',
      calculation: '2.5% of zakatable assets above nisab threshold',
      assets: ['Cash', 'Gold', 'Silver', 'Business inventory (cost price)', 'Investment accounts'],
      references: [
        { type: 'Quran', reference: 'Surah Al-Baqarah (2:267)', text: 'O you who have believed, spend from the good things which you have earned...' },
        { type: 'Hadith', reference: 'Sunan Abu Dawood 1572', text: 'The Prophet (ﷺ) said: "Zakat is a purification..."' }
      ],
      details: 'Business inventory is valued at cost price rather than market value. This conservative approach ensures the calculation is based on actual investment rather than potential profit.'
    },
    shafii: {
      name: 'Shafi\'i Methodology',
      description: 'Shafi\'i school approach with market value calculations',
      calculation: '2.5% of zakatable assets above nisab threshold',
      assets: ['Cash', 'Gold', 'Silver', 'Business inventory (market value)', 'Investment accounts'],
      references: [
        { type: 'Quran', reference: 'Surah Al-Hashr (59:7)', text: 'And whatever the Messenger has given you - take; and what he has forbidden you - refrain from...' },
        { type: 'Hadith', reference: 'Jami\' at-Tirmidhi 617', text: 'The Prophet (ﷺ) said: "The hand of the giver is superior to the hand of the taker..."' }
      ],
      details: 'Business inventory is valued at current market value. This approach considers the actual worth of assets in the marketplace.'
    },
    maliki: {
      name: 'Maliki Methodology',
      description: 'Maliki school approach with comprehensive asset inclusion',
      calculation: '2.5% of zakatable assets above nisab threshold',
      assets: ['Cash', 'Gold', 'Silver', 'Business assets', 'Agricultural produce', 'Livestock'],
      references: [
        { type: 'Quran', reference: 'Surah Al-Ma\'un (107:1-3)', text: 'Have you seen the one who denies the Recompense? For that is the one who drives away the orphan, And does not encourage the feeding of the poor.' },
        { type: 'Hadith', reference: 'Sahih al-Bukhari 1395', text: 'The Prophet (ﷺ) said: "The upper hand is better than the lower hand..."' }
      ],
      details: 'Includes agricultural produce and livestock in zakatable assets. This methodology takes a broader view of wealth that should be purified through Zakat.'
    }
  };

  const currentMethodology = methodologies[selectedMethodology as keyof typeof methodologies];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Zakat Calculation Methodologies</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Understanding the different approaches to Zakat calculation based on Islamic schools of thought
        </p>
      </div>

      {/* Methodology Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Methodology</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(methodologies).map(([key, method]) => (
            <button
              key={key}
              onClick={() => setSelectedMethodology(key)}
              className={`p-3 rounded-lg border-2 transition-colors ${
                selectedMethodology === key
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="font-medium text-sm">{method.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Methodology Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Basic Info */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">{currentMethodology.name}</h3>
            <p className="text-gray-600 mb-6">{currentMethodology.description}</p>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Calculation Method</h4>
                <p className="text-gray-600">{currentMethodology.calculation}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Zakatable Assets</h4>
                <ul className="text-gray-600 space-y-1">
                  {currentMethodology.assets.map((asset, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {asset}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Key Details</h4>
                <p className="text-gray-600">{currentMethodology.details}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Islamic References */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Islamic References</h4>
            <div className="space-y-4">
              {currentMethodology.references.map((ref, index) => (
                <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                  <div className="flex items-center mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      ref.type === 'Quran' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {ref.type}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">{ref.reference}</span>
                  </div>
                  <blockquote className="text-gray-700 italic text-sm">
                    "{ref.text}"
                  </blockquote>
                </div>
              ))}
            </div>

            {/* Additional Resources */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-2">Learn More</h5>
              <div className="space-y-2 text-sm">
                <a
                  href="https://simple-zakat-guide.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Simple Zakat Guide
                </a>
                <a
                  href="https://www.zakat.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Zakat Foundation
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Video */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Educational Video</h4>
        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l.707.707A1 1 0 0012.414 11H15m-3 7.5A9.5 9.5 0 1121.5 12 9.5 9.5 0 0112 2.5z" />
            </svg>
            <p className="text-gray-500">Video: Understanding Zakat Methodologies</p>
            <p className="text-sm text-gray-400 mt-2">Coming soon - Educational video content</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MethodologyExplainer;