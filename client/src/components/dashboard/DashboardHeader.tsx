import React from 'react';

interface DashboardHeaderProps {
  userName?: string;
  hasAssets: boolean;
  hasActiveRecord: boolean;
}

/**
 * DashboardHeader component - Contextual welcome message for dashboard
 * 
 * Features:
 * - Welcome message with user's name (if available)
 * - Contextual subtitle based on user's current state
 * - Responsive typography
 * - Helps users understand their current status and next steps
 * 
 * User States:
 * 1. No assets → Encourage adding first asset
 * 2. Has assets, no record → Encourage creating Nisab record
 * 3. Has active record → Confirm tracking status
 * 
 * @param userName - Optional user's name for personalization
 * @param hasAssets - Whether user has any assets
 * @param hasActiveRecord - Whether user has an active Nisab Year Record
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName,
  hasAssets,
  hasActiveRecord,
}) => {
  /**
   * Determine contextual subtitle based on user state
   */
  const getSubtitle = (): string => {
    if (!hasAssets) {
      return 'Start by adding your assets to begin tracking your Zakat obligations';
    }
    
    if (!hasActiveRecord) {
      return 'Create a Nisab Year Record to start tracking your Hawl period';
    }
    
    return 'Your Zakat tracking is active. Monitor your progress below.';
  };

  return (
    <div className="mb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        {userName ? `Welcome back, ${userName}` : 'Welcome to ZakApp'}
      </h1>
      <p className="text-base md:text-lg text-gray-600">
        {getSubtitle()}
      </p>
      
      {/* App description for new users */}
      {!hasAssets && (
        <p className="mt-3 text-sm text-gray-500 max-w-2xl">
          ZakApp is your Islamic Zakat calculator that helps you track your wealth, 
          monitor your Hawl period, and calculate your Zakat obligations with confidence.
        </p>
      )}
    </div>
  );
};
