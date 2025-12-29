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
 * 1. No assets (brand new) → Welcome to ZakApp with app description
 * 2. Has assets, no record → Encourage creating Nisab record with wealth info
 * 3. Has active record → Welcome back with tracking status
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
   * Determine greeting based on user state
   */
  const getGreeting = (): string => {
    // Brand new users (no assets) get product welcome
    if (!hasAssets) {
      return 'Welcome to ZakApp';
    }
    
    // Returning users (have assets) get personalized greeting
    return userName ? `Welcome back, ${userName}` : 'Welcome back';
  };

  /**
   * Determine contextual subtitle based on user state
   */
  const getSubtitle = (): string => {
    if (!hasAssets) {
      return 'Your Islamic Zakat Calculator';
    }
    
    if (!hasActiveRecord) {
      return 'Create a Nisab Year Record to start tracking your Hawl period';
    }
    
    return 'Your Zakat tracking is active. Monitor your progress below.';
  };

  return (
    <div className="mb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        {getGreeting()}
      </h1>
      <p className="text-base md:text-lg text-gray-600">
        {getSubtitle()}
      </p>
      
      {/* App description for brand new users */}
      {!hasAssets && (
        <p className="mt-3 text-sm text-gray-500 max-w-2xl">
          Track your wealth, monitor your Hawl period, and calculate your Zakat 
          obligations with confidence. Start by adding your first asset below.
        </p>
      )}
    </div>
  );
};
