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
import { PlusCircleIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

/**
 * Empty state component for when user has no assets
 * Provides welcoming guidance and clear call-to-action
 */
export const EmptyAssets: React.FC = () => {
  return (
    <div className="text-center py-12 px-4">
      {/* Illustration */}
      <div className="mx-auto w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
        <CurrencyDollarIcon className="w-12 h-12 text-indigo-600" />
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        No Assets Yet
      </h2>

      <p className="text-gray-600 max-w-md mx-auto mb-6">
        Start by adding your assets to calculate your Zakat accurately. Track cash, gold, investments, and more.
      </p>

      {/* What to add */}
      <div className="max-w-lg mx-auto mb-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          What you can add:
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
          <div className="bg-gray-50 rounded-lg p-3 text-left">
            <span className="font-medium text-gray-900">Cash & Bank</span>
            <p className="text-xs mt-1">Savings, checking accounts</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-left">
            <span className="font-medium text-gray-900">Gold & Silver</span>
            <p className="text-xs mt-1">Jewelry, bullion, coins</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-left">
            <span className="font-medium text-gray-900">Investments</span>
            <p className="text-xs mt-1">Stocks, bonds, mutual funds</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-left">
            <span className="font-medium text-gray-900">Cryptocurrency</span>
            <p className="text-xs mt-1">Bitcoin, Ethereum, etc.</p>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <Link
        to="/assets/new"
        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors shadow-sm"
      >
        <PlusCircleIcon className="w-5 h-5" />
        Add Your First Asset
      </Link>

      {/* Help link */}
      <p className="mt-6 text-sm text-gray-500">
        Not sure what to add?{' '}
        <Link to="/help/assets" className="text-indigo-600 hover:text-indigo-700 underline">
          Learn about asset types
        </Link>
      </p>
    </div>
  );
};

export default EmptyAssets;
