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

import React from 'react';

export const GettingStarted: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Getting Started with ZakApp</h1>
        <p className="mt-2 text-gray-600">
          Your complete guide to calculating and managing Zakat according to Islamic principles
        </p>
      </div>

      {/* Quick Start Steps */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Start Guide</h2>
        <div className="space-y-6">
          {/* Step 1 */}
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Add Your Assets</h3>
              <p className="text-gray-600 mb-2">
                Start by adding all your zakatable assets including cash, bank accounts, gold, silver, 
                investments, and business assets.
              </p>
              <a href="/assets" className="text-green-600 hover:text-green-700 font-medium">
                Add Assets →
              </a>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Calculate Your Zakat</h3>
              <p className="text-gray-600 mb-2">
                Use our comprehensive calculator to determine your Zakat obligation based on 
                authentic Islamic methodologies.
              </p>
              <a href="/nisab-records" className="text-green-600 hover:text-green-700 font-medium">
                Calculate Zakat →
              </a>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Track Your History</h3>
              <p className="text-gray-600 mb-2">
                Keep records of your calculations and payments for better financial planning 
                and Islamic compliance.
              </p>
              <a href="/history" className="text-green-600 hover:text-green-700 font-medium">
                View History →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Islamic Guidance */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-green-900 mb-4">Understanding Zakat</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-green-900 mb-2">What is Zakat?</h3>
            <p className="text-green-800 text-sm">
              Zakat is one of the Five Pillars of Islam, a mandatory charitable contribution 
              calculated as 2.5% of savings and wealth above the nisab threshold.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-green-900 mb-2">When is Zakat Due?</h3>
            <p className="text-green-800 text-sm">
              Zakat becomes obligatory when your wealth exceeds the nisab threshold and you 
              have owned it for one full lunar year (hawl).
            </p>
          </div>
          <div>
            <h3 className="font-medium text-green-900 mb-2">What is Nisab?</h3>
            <p className="text-green-800 text-sm">
              Nisab is the minimum threshold of wealth that makes Zakat obligatory. It's equivalent 
              to 85 grams of gold or 595 grams of silver.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-green-900 mb-2">Who Receives Zakat?</h3>
            <p className="text-green-800 text-sm">
              The Quran specifies eight categories of people entitled to receive Zakat, 
              including the poor, needy, and those in debt.
            </p>
          </div>
        </div>
      </div>

      {/* Asset Types Guide */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Zakatable Assets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">✅ Zakatable Assets</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Cash in hand and bank accounts</li>
              <li>• Gold and silver (jewelry & investments)</li>
              <li>• Stocks, bonds, and mutual funds</li>
              <li>• Business inventory and receivables</li>
              <li>• Cryptocurrency holdings</li>
              <li>• Rental income properties (in some opinions)</li>
              <li>• Money lent to others (if recoverable)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-3">❌ Non-Zakatable Assets</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Primary residence</li>
              <li>• Personal vehicles</li>
              <li>• Household furniture and appliances</li>
              <li>• Tools needed for work</li>
              <li>• Personal clothing and items</li>
              <li>• Pension funds (until accessed)</li>
              <li>• Debts you owe to others</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Calculation Methods */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">Calculation Methodologies</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-blue-900">Standard Methodology</h3>
            <p className="text-blue-800 text-sm">
              Uses the lower of gold or silver nisab thresholds, providing a balanced approach 
              suitable for most situations.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-blue-900">Hanafi Methodology</h3>
            <p className="text-blue-800 text-sm">
              Follows the Hanafi school of jurisprudence, typically using the silver nisab 
              threshold which results in a lower threshold and more Zakat obligations.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900">Q: How often should I calculate Zakat?</h3>
            <p className="text-gray-600 text-sm mt-1">
              A: You should calculate Zakat annually, ideally on the same date each year (your Zakat anniversary).
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Q: Can I pay Zakat in installments?</h3>
            <p className="text-gray-600 text-sm mt-1">
              A: Yes, you can pay Zakat in advance or in installments throughout the year, but the full amount 
              should be distributed once it becomes due.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Q: Do I pay Zakat on my retirement fund?</h3>
            <p className="text-gray-600 text-sm mt-1">
              A: Generally, Zakat is not due on retirement funds that you cannot access. However, consult 
              a scholar for your specific situation.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Q: What if I'm in debt?</h3>
            <p className="text-gray-600 text-sm mt-1">
              A: You can deduct immediate debts from your total wealth before calculating Zakat. The remaining 
              amount should exceed nisab for Zakat to be due.
            </p>
          </div>
        </div>
      </div>

      {/* Security Note */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-yellow-900 mb-2">🔐 Your Privacy & Security</h2>
        <p className="text-yellow-800 text-sm">
          ZakApp uses bank-level encryption to protect your financial information. All sensitive data 
          is encrypted before storage, and we never store your login credentials in plain text. 
          Your financial information remains private and secure.
        </p>
      </div>

      {/* Contact */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Need Help?</h3>
        <p className="text-gray-600 text-sm mb-4">
          For complex situations or specific Islamic jurisprudence questions, 
          we recommend consulting with a qualified Islamic scholar.
        </p>
        <div className="space-x-4">
          <a href="/assets" className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700">
            Start Adding Assets
          </a>
          <a href="/nisab-records" className="border border-green-600 text-green-600 px-6 py-2 rounded-md hover:bg-green-50">
            Calculate Zakat
          </a>
        </div>
      </div>
    </div>
  );
};