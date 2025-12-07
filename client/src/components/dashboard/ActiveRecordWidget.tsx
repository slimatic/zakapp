import React from 'react';
import { Link } from 'react-router-dom';
import { IslamicTerm } from '../common';

// Type matching the actual API response from the backend
interface NisabYearRecord {
  id: string;
  userId: string;
  // API field names (as returned by the backend)
  hawlStartDate?: string;
  hawlCompletionDate?: string;
  nisabThresholdAtStart?: string | number; // Can be encrypted string or decrypted number
  totalWealth?: string | number;
  zakatableWealth?: string | number;
  zakatAmount?: string | number;
  nisabBasis?: 'GOLD' | 'SILVER';
  status?: string;
  methodologyUsed?: string;
  // Legacy field names (for backward compatibility)
  startDate?: string;
  endDate?: string;
  initialNisabThreshold?: number;
  nisabMethod?: string;
  daysElapsed?: number;
  daysRemaining?: number;
  currentWealth?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ActiveRecordWidgetProps {
  record: NisabYearRecord | null;
}

/**
 * ActiveRecordWidget component - Displays active Nisab Year Record status
 * 
 * Features:
 * - Hawl progress indicator (Day X of 354)
 * - Visual progress bar with percentage
 * - Wealth vs Nisab comparison with color-coded status
 * - Status indicators: Green (above), Yellow (near), Red (below)
 * - Link to detailed Nisab Records page
 * 
 * Status Logic:
 * - Green: Wealth > Nisab + 10%
 * - Yellow: Wealth between Nisab and Nisab + 10%
 * - Red: Wealth < Nisab
 * 
 * @param record - Active Nisab Year Record (null if none exists)
 */
export const ActiveRecordWidget: React.FC<ActiveRecordWidgetProps> = ({ record }) => {
  if (!record) {
    return null;
  }

  // Get start and end dates (support both API and legacy field names)
  const startDateStr = record.hawlStartDate || record.startDate;
  const endDateStr = record.hawlCompletionDate || record.endDate;
  
  // Calculate days elapsed and remaining from dates
  const totalDays = 354; // Lunar year
  let daysElapsed = record.daysElapsed || 0;
  let daysRemaining = record.daysRemaining || totalDays;
  
  if (startDateStr) {
    const startDate = new Date(startDateStr);
    const today = new Date();
    const diffTime = today.getTime() - startDate.getTime();
    daysElapsed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    daysRemaining = Math.max(0, totalDays - daysElapsed);
  }
  
  const progressPercentage = Math.min((daysElapsed / totalDays) * 100, 100);

  // Get wealth values (support both API and legacy field names)
  // API returns totalWealth as string, need to parse it
  const currentWealth = record.currentWealth || 
    (typeof record.totalWealth === 'string' ? parseFloat(record.totalWealth) : record.totalWealth) || 
    0;
  
  // Nisab threshold might be encrypted (string) or a number
  // If it's an encrypted string (contains special chars), use a default
  let nisabThreshold = record.initialNisabThreshold || 5000;
  if (record.nisabThresholdAtStart) {
    if (typeof record.nisabThresholdAtStart === 'number') {
      nisabThreshold = record.nisabThresholdAtStart;
    } else if (typeof record.nisabThresholdAtStart === 'string') {
      // Try to parse if it's a numeric string, otherwise it might be encrypted
      const parsed = parseFloat(record.nisabThresholdAtStart);
      if (!isNaN(parsed)) {
        nisabThreshold = parsed;
      }
      // If it's encrypted (NaN), keep the default
    }
  }
  
  // Prevent division by zero
  const wealthDifference = currentWealth - nisabThreshold;
  const differencePercentage = nisabThreshold > 0 
    ? (wealthDifference / nisabThreshold) * 100 
    : 0;

  /**
   * Determine status color based on wealth vs Nisab
   */
  const getStatusColor = (): { bg: string; text: string; border: string; status: string } => {
    if (differencePercentage >= 10) {
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        status: 'Well Above Nisab',
      };
    } else if (differencePercentage >= 0) {
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        status: 'Near Nisab',
      };
    } else {
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        status: 'Below Nisab',
      };
    }
  };

  const statusColors = getStatusColor();

  return (
    <div className={`rounded-lg border-2 ${statusColors.border} ${statusColors.bg} p-6 shadow-md`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Active <IslamicTerm term="HAWL">Hawl</IslamicTerm> Period</h2>
        <span className={`text-sm font-medium ${statusColors.text}`}>
          {statusColors.status}
        </span>
      </div>

      {/* Hawl Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Day {daysElapsed} of {totalDays}
          </span>
          <span className="text-sm text-gray-600">
            {daysRemaining} days remaining
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-green-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Hawl progress: ${progressPercentage.toFixed(1)}%`}
          />
        </div>

        <p className="text-xs text-gray-500 mt-1">
          {progressPercentage.toFixed(1)}% complete
        </p>
      </div>

      {/* Wealth Comparison */}
      <div className="mb-4 p-4 bg-white rounded-md border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Current Wealth</span>
          <span className="text-lg font-bold text-gray-900">
            ${currentWealth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600"><IslamicTerm term="NISAB">Nisab</IslamicTerm> Threshold</span>
          <span className="text-sm font-medium text-gray-700">
            ${nisabThreshold.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Difference</span>
            <span className={`text-sm font-bold ${statusColors.text}`}>
              {wealthDifference >= 0 ? '+' : ''}
              ${Math.abs(wealthDifference).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              {' '}({differencePercentage >= 0 ? '+' : ''}{differencePercentage.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Action Link */}
      <Link
        to="/nisab-records"
        className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
      >
        View Detailed Record
      </Link>
    </div>
  );
};
