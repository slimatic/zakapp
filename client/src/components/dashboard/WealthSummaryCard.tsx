import React from 'react';
import { useMaskedCurrency } from '../../contexts/PrivacyContext';

interface WealthSummaryCardProps {
  totalWealth: number;
  nisabThreshold: number;
  currency?: string;
}

/**
 * WealthSummaryCard component - Displays total wealth and Nisab comparison
 * 
 * Features:
 * - Prominent display of total wealth
 * - Comparison to Nisab threshold
 * - Visual indicator (icon + color) for above/below Nisab
 * - Responsive typography
 * - Clear status messaging
 * 
 * Status Colors:
 * - Green: Wealth >= Nisab (Zakat obligation applies)
 * - Red: Wealth < Nisab (No Zakat obligation)
 * 
 * @param totalWealth - User's current total wealth
 * @param nisabThreshold - Current Nisab threshold value
 * @param currency - Currency symbol (default: USD)
 */
export const WealthSummaryCard: React.FC<WealthSummaryCardProps> = ({
  totalWealth,
  nisabThreshold,
  currency = 'USD',
}) => {
  const isAboveNisab = totalWealth >= nisabThreshold;
  const difference = Math.abs(totalWealth - nisabThreshold);
  const differencePercentage = ((totalWealth - nisabThreshold) / nisabThreshold) * 100;
  const maskedCurrency = useMaskedCurrency();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Wealth Summary</h2>
        
        {/* Status Icon */}
        <div className={`p-2 rounded-full ${isAboveNisab ? 'bg-green-100' : 'bg-red-100'}`}>
          {isAboveNisab ? (
            // Checkmark icon
            <svg
              className="w-5 h-5 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            // Info icon
            <svg
              className="w-5 h-5 text-red-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Total Wealth - Large Display */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-1">Total Wealth</p>
        <p className="text-3xl md:text-4xl font-bold text-gray-900">
          {maskedCurrency(`$${totalWealth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)}
        </p>
        <p className="text-xs text-gray-500 mt-1">{currency}</p>
      </div>

      {/* Nisab Threshold Comparison */}
      <div className={`p-4 rounded-md ${isAboveNisab ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className={`text-sm font-medium ${isAboveNisab ? 'text-green-700' : 'text-red-700'}`}>
              {isAboveNisab ? 'Above Nisab' : 'Below Nisab'}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Nisab: {maskedCurrency(`$${nisabThreshold.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)}
            </p>
          </div>
          
          <div className="text-right">
            <p className={`text-lg font-bold ${isAboveNisab ? 'text-green-700' : 'text-red-700'}`}>
              {maskedCurrency(`${isAboveNisab ? '+' : '-'}$${difference.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)}
            </p>
            <p className="text-xs text-gray-600">
              {isAboveNisab ? '+' : ''}{differencePercentage.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Status Message */}
        <p className="text-xs text-gray-700 mt-2">
          {isAboveNisab
            ? 'Your wealth meets the Nisab threshold. Zakat may be due after one lunar year (Hawl).'
            : 'Your wealth is below the Nisab threshold. No Zakat obligation at this time.'}
        </p>
      </div>
    </div>
  );
};
