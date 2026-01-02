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
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formatGregorianDate, gregorianToHijri, formatHijriDate } from '../../utils/calendarConverter';

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const hijriAdjustment = (user as any)?.settings?.hijriAdjustment || 0;

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

  // Get current date components
  const today = new Date();
  const gregorian = formatGregorianDate(today);
  const hijri = formatHijriDate(gregorianToHijri(today, hijriAdjustment));

  return (
    <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
      <div>
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

      <div className="flex items-center gap-3">
        {/* Restart Onboarding Action */}
        <button
          onClick={() => {
            if (window.confirm("Run the Setup Wizard again? This preserves your history but allows you to re-enter your wealth data from scratch.")) {
              navigate('/onboarding');
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white/50 rounded-lg border border-gray-200 backdrop-blur-sm text-gray-700 font-medium hover:text-emerald-700 hover:bg-white hover:border-emerald-300 transition-all shadow-sm group"
          title="Run Setup Wizard"
          aria-label="Run Setup Wizard"
        >
          <svg className="w-5 h-5 text-gray-500 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <span className="hidden sm:inline">Setup Wizard</span>
        </button>

        {/* Date Display Widget */}
        <div className="hidden md:block text-right bg-white/50 p-2.5 px-4 rounded-lg border border-gray-100 backdrop-blur-sm shadow-sm">
          <p className="text-sm font-semibold text-gray-900 leading-tight">{gregorian}</p>
          <p className="text-xs text-teal-700 font-medium font-serif mt-0.5">{hijri}</p>
        </div>
      </div>
    </div>
  );
};
