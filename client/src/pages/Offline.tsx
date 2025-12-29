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
import { WifiIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * Offline Fallback Page
 * 
 * Displayed when the user is offline and tries to access uncached content.
 * Provides helpful information about offline capabilities.
 */
export const OfflinePage: React.FC = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Offline Icon */}
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <WifiIcon className="w-8 h-8 text-gray-400" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          You're Offline
        </h1>
        
        <p className="text-gray-600 mb-6">
          It looks like you've lost your internet connection. Some features may not be available.
        </p>

        {/* Available Offline Features */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <h2 className="font-semibold text-blue-900 mb-2">
            Available Offline:
          </h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>View previously loaded assets and calculations</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>Use the Zakat calculator (results saved locally)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>Review your calculation history</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>View educational content</span>
            </li>
          </ul>
        </div>

        {/* Unavailable Features */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
          <h2 className="font-semibold text-amber-900 mb-2">
            Requires Internet:
          </h2>
          <ul className="space-y-2 text-sm text-amber-800">
            <li className="flex items-start">
              <span className="mr-2">⚠️</span>
              <span>Syncing data across devices</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">⚠️</span>
              <span>Creating or updating assets</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">⚠️</span>
              <span>Real-time currency conversion</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">⚠️</span>
              <span>Fetching latest nisab values</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleRefresh}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Try Again
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            Go Back
          </button>
        </div>

        {/* Help Text */}
        <p className="mt-6 text-xs text-gray-500">
          Any changes you make while offline will be automatically synced when you reconnect to the internet.
        </p>
      </div>
    </div>
  );
};

export default OfflinePage;
