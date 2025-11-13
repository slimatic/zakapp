import React from 'react';
import { Link } from 'react-router-dom';

// Type matching the NisabYearRecord from Feature 008
interface NisabYearRecord {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  initialNisabThreshold: number;
  nisabMethod: string;
  status: 'active' | 'completed' | 'finalized';
  daysElapsed?: number;
  daysRemaining?: number;
  currentWealth?: number;
  createdAt: string;
  updatedAt: string;
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

  const daysElapsed = record.daysElapsed || 0;
  const daysRemaining = record.daysRemaining || 354;
  const totalDays = 354; // Lunar year
  const progressPercentage = Math.min((daysElapsed / totalDays) * 100, 100);

  const currentWealth = record.currentWealth || 0;
  const nisabThreshold = record.initialNisabThreshold;
  const wealthDifference = currentWealth - nisabThreshold;
  const differencePercentage = (wealthDifference / nisabThreshold) * 100;

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
        <h2 className="text-xl font-bold text-gray-900">Active Hawl Period</h2>
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
          <span className="text-sm text-gray-600">Nisab Threshold</span>
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
