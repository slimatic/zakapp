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
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { formatErrorForDisplay, getSupportMessage } from '../../utils/errorMessages';

interface ErrorDisplayProps {
  error: any;
  onRetry?: () => void;
  className?: string;
}

/**
 * User-friendly error display component
 * Shows helpful error messages with recovery guidance
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  className = '',
}) => {
  if (!error) return null;

  const { title, message, recoverySteps, showSupport } = formatErrorForDisplay(error);

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-900">{title}</h3>
          <p className="text-sm text-red-800 mt-1">{message}</p>
        </div>
      </div>

      {/* Recovery Steps */}
      {recoverySteps.length > 0 && (
        <div className="bg-white rounded-md p-3 mb-3">
          <div className="flex items-start gap-2 mb-2">
            <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <h4 className="font-medium text-gray-900 text-sm">What you can do:</h4>
          </div>
          <ul className="space-y-1.5 ml-7">
            {recoverySteps.map((step, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start">
                <span className="mr-2">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            Try Again
          </button>
        )}
        
        {showSupport && (
          <a
            href="mailto:support@zakapp.com"
            className="px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            Contact Support
          </a>
        )}
      </div>

      {/* Support Message */}
      {showSupport && (
        <p className="text-xs text-gray-600 mt-3">{getSupportMessage()}</p>
      )}
    </div>
  );
};

export default ErrorDisplay;
