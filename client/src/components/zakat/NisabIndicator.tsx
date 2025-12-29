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
 * NisabIndicator Component
 * 
 * Visual indicator showing user's wealth relative to nisab threshold
 * with educational tooltips and clear status indication.
 */

import React, { useState } from 'react';

export interface NisabIndicatorProps {
  totalWealth: number;
  nisabThreshold: number;
  currency?: string;
  nisabType?: 'gold' | 'silver' | 'effective';
  showDetails?: boolean;
  className?: string;
}

/**
 * Format currency with proper symbol and formatting
 */
const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format large numbers with K/M abbreviations
 */
const formatCompactNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toFixed(0);
};

export const NisabIndicator: React.FC<NisabIndicatorProps> = ({
  totalWealth,
  nisabThreshold,
  currency = 'USD',
  nisabType = 'effective',
  showDetails = true,
  className = ''
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Calculate percentage and status
  const percentage = (totalWealth / nisabThreshold) * 100;
  const isAboveNisab = totalWealth >= nisabThreshold;
  const difference = Math.abs(totalWealth - nisabThreshold);
  const percentageDifference = Math.abs(percentage - 100);

  // Determine color scheme based on status
  const getColorScheme = () => {
    if (isAboveNisab) {
      if (percentage >= 200) {
        return {
          bg: 'bg-green-50',
          border: 'border-green-300',
          text: 'text-green-800',
          bar: 'bg-green-500',
          barGlow: 'shadow-green-500/50',
          icon: '✅',
          status: 'Zakat is due'
        };
      } else {
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-300',
          text: 'text-blue-800',
          bar: 'bg-blue-500',
          barGlow: 'shadow-blue-500/50',
          icon: '✓',
          status: 'Zakat is due'
        };
      }
    } else {
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-300',
        text: 'text-gray-700',
        bar: 'bg-gray-400',
        barGlow: 'shadow-gray-400/50',
        icon: '○',
        status: 'Below nisab threshold'
      };
    }
  };

  const colors = getColorScheme();
  const displayPercentage = Math.min(percentage, 100); // Cap at 100% for visual bar

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl" role="img" aria-label="Status">
            {colors.icon}
          </span>
          <div>
            <h3 className={`text-lg font-semibold ${colors.text}`}>
              Nisab Status
            </h3>
            <p className="text-sm text-gray-600">
              {colors.status}
            </p>
          </div>
        </div>
        
        {/* Info Tooltip */}
        <div className="relative">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold hover:bg-blue-200 transition-colors"
            aria-label="What is nisab?"
          >
            ?
          </button>
          
          {showTooltip && (
            <div className="absolute right-0 top-8 z-10 w-72 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-sm">
              <p className="font-semibold text-gray-900 mb-2">What is Nisab?</p>
              <p className="text-gray-700 mb-2">
                Nisab is the minimum amount of wealth a Muslim must possess for one lunar year before Zakat becomes obligatory.
              </p>
              <p className="text-gray-700 mb-2">
                It is equivalent to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 mb-2">
                <li>85 grams of gold, OR</li>
                <li>595 grams of silver</li>
              </ul>
              <p className="text-xs text-gray-600 italic">
                The lower value is typically used to maximize benefit to those in need.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Your Wealth</span>
          <span className="text-gray-600">Nisab Threshold</span>
        </div>
        
        <div className="relative">
          {/* Background Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            {/* Progress Fill */}
            <div
              className={`${colors.bar} h-4 rounded-full transition-all duration-1000 ease-out ${
                isAboveNisab ? 'shadow-lg ' + colors.barGlow : ''
              }`}
              style={{ width: `${displayPercentage}%` }}
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={200}
              aria-label="Wealth relative to nisab threshold"
            >
              {/* Animated pulse for above nisab */}
              {isAboveNisab && (
                <div className="h-full w-full animate-pulse opacity-30 bg-white"></div>
              )}
            </div>
          </div>
          
          {/* Nisab Marker */}
          <div
            className="absolute top-0 h-4 w-0.5 bg-red-500"
            style={{ left: '100%', transform: 'translateX(-1px)' }}
            aria-hidden="true"
          ></div>
          <div
            className="absolute -top-1 bg-red-500 text-white text-xs px-1 rounded"
            style={{ left: '100%', transform: 'translateX(-50%)' }}
            aria-hidden="true"
          >
            ▼
          </div>
        </div>
        
        <div className="flex justify-between text-xs mt-2 text-gray-600">
          <span>{formatCompactNumber(totalWealth)}</span>
          <span>{formatCompactNumber(nisabThreshold)}</span>
        </div>
      </div>

      {/* Detailed Stats */}
      {showDetails && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-600">Your Total Wealth</p>
            <p className={`text-lg font-bold ${colors.text}`}>
              {formatCurrency(totalWealth, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Nisab Threshold</p>
            <p className="text-lg font-bold text-gray-800">
              {formatCurrency(nisabThreshold, currency)}
            </p>
            {nisabType && (
              <p className="text-xs text-gray-500 capitalize mt-0.5">
                {nisabType}-based
              </p>
            )}
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-600">
              {isAboveNisab ? 'Above Nisab by' : 'Below Nisab by'}
            </p>
            <p className={`text-lg font-bold ${isAboveNisab ? 'text-green-700' : 'text-gray-600'}`}>
              {formatCurrency(difference, currency)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {percentageDifference.toFixed(1)}% {isAboveNisab ? 'above' : 'below'} threshold
            </p>
          </div>
        </div>
      )}

      {/* Status Message */}
      <div className={`mt-4 p-3 ${isAboveNisab ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'} border rounded-md`}>
        <p className="text-sm font-medium text-gray-900">
          {isAboveNisab ? (
            <>
              ✓ Your wealth exceeds the nisab threshold. <strong>Zakat is obligatory</strong> on your wealth if you have owned it for one lunar year (hawl).
            </>
          ) : (
            <>
              Your wealth is below the nisab threshold. Zakat is not currently obligatory, but voluntary charity (Sadaqah) is always encouraged.
            </>
          )}
        </p>
      </div>

      {/* Educational Note */}
      <div className="mt-4 text-xs text-gray-600 italic">
        <p>
          💡 Remember: Zakat becomes due after your wealth has been above nisab for one complete lunar year (hawl). 
          The calculation date matters!
        </p>
      </div>
    </div>
  );
};

export default NisabIndicator;
