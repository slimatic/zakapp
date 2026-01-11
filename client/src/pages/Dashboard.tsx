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

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { useAssetRepository } from '../hooks/useAssetRepository';
import { useNisabRecordRepository } from '../hooks/useNisabRecordRepository';
import { usePaymentRepository } from '../hooks/usePaymentRepository';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { ActiveRecordWidget } from '../components/dashboard/ActiveRecordWidget';
import { WealthSummaryCard } from '../components/dashboard/WealthSummaryCard';
import { OnboardingGuide } from '../components/dashboard/OnboardingGuide';
import { SkeletonCard } from '../components/common/SkeletonLoader';
import { AssetsBreakdownChart } from '../components/dashboard/AssetsBreakdownChart';
import { useUserOnboarding } from '../hooks/useUserOnboarding';
import { useNisabThreshold } from '../hooks/useNisabThreshold';
import { useMaskedCurrency } from '../contexts/PrivacyContext';
import type { Asset } from '../types';
import { useBestAction } from '../hooks/useBestAction';
import { GlossaryTerm } from '../components/common/GlossaryTerm';

/**
 * Educational Module Component
 * Collapsible educational content about Zakat and Nisab
 */
const EducationalModule: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('zakapp_educational_expanded');
    if (saved === 'true') {
      setIsExpanded(true);
    }
  }, []);

  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('zakapp_educational_expanded', String(newState));
  };

  return (
    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border-2 border-teal-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-100 rounded-lg">
            <svg
              className="w-6 h-6 text-teal-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Understanding Zakat & Nisab</h2>
        </div>

        <button
          onClick={toggleExpanded}
          className="p-2 rounded-md text-gray-600 hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={isExpanded ? 'Collapse educational content' : 'Expand educational content'}
          aria-expanded={isExpanded}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What is <GlossaryTerm term="zakat" />?</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              <GlossaryTerm term="zakat" /> is one of the Five Pillars of Islam and is an obligatory act of charity. It requires Muslims
              who meet specific wealth criteria to donate 2.5% of their qualifying wealth annually to those in need.
              <GlossaryTerm term="zakat" /> purifies wealth and helps create a more equitable society.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What is <GlossaryTerm term="nisab" />?</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              <GlossaryTerm term="nisab" /> is the minimum threshold of wealth a Muslim must possess for one lunar year (<GlossaryTerm term="hawl" />) before
              <GlossaryTerm term="zakat" /> becomes obligatory. The <GlossaryTerm term="nisab" /> can be calculated based on the value of gold (85 grams) or
              silver (595 grams). ZakApp helps you track your wealth and determine when you've reached the <GlossaryTerm term="nisab" /> threshold.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">The <GlossaryTerm term="hawl" /> Period</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              The <GlossaryTerm term="hawl" /> is the Islamic lunar year period (354 days) during which your wealth must remain above
              the <GlossaryTerm term="nisab" /> threshold for <GlossaryTerm term="zakat" /> to be due. ZakApp's Nisab Year Record feature helps you track this
              period automatically and alerts you when <GlossaryTerm term="zakat" /> payment is due.
            </p>
          </div>

          <div className="pt-4 border-t border-teal-200">
            <h3 className="font-semibold text-gray-900 mb-3">Learn More</h3>
            <div className="space-y-2">
              <Link
                to="/learn"
                className="flex items-center text-sm text-teal-700 hover:text-teal-800 hover:underline"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                Visit Learning Center
              </Link>
              <a
                href="https://youtube.com/playlist?list=PLXguldgkbZPffh6p4efOetXkTeJATAbcS&si=CoJ4JB5dLrJDgNS7"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-teal-700 hover:text-teal-800 hover:underline"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Watch: Simple Zakat Guide (Video Series)
              </a>
            </div>
          </div>
        </div>
      )}

      {!isExpanded && (
        <span className="text-sm text-gray-600 block">
          Learn about <GlossaryTerm term="zakat" /> obligations, <GlossaryTerm term="nisab" /> threshold, and the <GlossaryTerm term="hawl" /> period. Click to expand.
        </span>
      )}
    </div>
  );
};

/**
 * Dashboard Component - Refactored as Central Hub
 * 
 * Features:
 * - Smart Journey Card (OnboardingGuide + NextBestAction)
 * - Wealth Summary
 * - Active Record Widget
 * - Educational Module
 */
export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // We keep completedSteps from useUserOnboarding or derive them dynamically?
  // Let's rely on local derivation for "Smart" steps to be consistent.
  const maskedCurrency = useMaskedCurrency();

  // Redirect to onboarding if setup is incomplete
  // Redirect to onboarding if setup is incomplete
  useEffect(() => {
    // Check if user explicitly skipped via local prefs (fallback for robust UX)
    const localPrefs = user?.id ? localStorage.getItem(`zakapp_local_prefs_${user.id}`) : null;
    let hasSkipped = false;
    if (localPrefs) {
      try {
        const prefs = JSON.parse(localPrefs);
        if (prefs.skipped) hasSkipped = true;
      } catch (e) {
        console.warn('Dashboard: Failed to parse local prefs', e);
      }
    }

    // Only redirect if NOT complete AND NOT skipped AND NO ASSETS/RECORDS
    // (Legacy users or partially synced users might have assets but isSetupCompleted=false)
    if (user && user.isSetupCompleted === false && !hasSkipped && !hasAssets && !hasActiveRecord) {
      navigate('/onboarding');
    }
  }, [user, navigate, hasAssets, hasActiveRecord]);

  // Local Data Repositories (RxDB)
  const { assets, isLoading: assetsLoading, error: assetsError } = useAssetRepository();
  const { activeRecord, isLoading: recordsLoading, error: recordsError } = useNisabRecordRepository();
  const { payments, isLoading: paymentsLoading } = usePaymentRepository();

  const hasAssets = assets.length > 0;
  const hasActiveRecord = activeRecord !== null;
  const hasPayments = payments.length > 0;

  // Calculate total wealth
  const totalWealth = assets.reduce((sum: number, asset: Asset) => {
    return sum + (asset.value || 0);
  }, 0);

  // Determine completed steps based on state
  const completedSteps = useMemo(() => {
    const steps: number[] = [];
    if (hasAssets) steps.push(1);
    // Logic: If user has significant assets, they should have a record.
    if (hasActiveRecord) steps.push(2);
    // Step 3 (Payments) is completed if a payment is recorded
    if (hasPayments) steps.push(3);
    return steps;
  }, [hasAssets, hasActiveRecord, hasPayments]);

  const isOnboardingComplete = completedSteps.includes(3);

  // Use the new Smart Action hook
  // Pass isOnboardingComplete to prevent premature "Maintenance" suggestions
  const bestAction = useBestAction(
    user,
    assets,
    activeRecord,
    hasAssets,
    hasActiveRecord,
    totalWealth,
    isOnboardingComplete
  );

  // Determine current onboarding step based on state
  const currentStep = useMemo(() => {
    if (!hasAssets) return 1;
    if (!hasActiveRecord && totalWealth > 0) return 2;
    // If Onboarding is "Complete", we default to 3 (Tracking Payments) 
    // OR return to 1 if we want the "Keep Up Good Work" cycle. 
    // Since OnboardingGuide handles `bestAction` overrides, setting 3 here is safe default.
    return 3;
  }, [hasAssets, hasActiveRecord, totalWealth]);

  // Get Nisab threshold (use live value for consistency with other pages)
  const nisabBasis = (activeRecord?.nisabBasis || 'GOLD') as 'GOLD' | 'SILVER';
  const { nisabAmount } = useNisabThreshold('USD', nisabBasis);
  const nisabThreshold = nisabAmount || 5000; // Default fallback

  // Loading state
  if (assetsLoading || recordsLoading || paymentsLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3 mb-2" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // Error state
  if (assetsError || recordsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          error={assetsError || recordsError}
          title="Failed to load dashboard"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6" id="main-content">
      {/* Dashboard Header */}
      <DashboardHeader
        userName={user?.username}
        hasAssets={hasAssets}
        hasActiveRecord={hasActiveRecord}
      />

      {/* Primary: Smart Journey Card */}
      {/* This replaces both "OnboardingGuide" and "NextActionCard" with a single unified component */}
      <OnboardingGuide
        currentStep={currentStep as 1 | 2 | 3}
        completedSteps={completedSteps}
        bestAction={bestAction || undefined}
        isOnboardingComplete={isOnboardingComplete}
      />

      {/* Main Content Area */}
      {hasAssets && (
        <div className="space-y-6">

          {/* T023: Active Record Widget */}
          {hasActiveRecord && activeRecord && (
            <ActiveRecordWidget record={activeRecord} />
          )}

          {/* Wealth and Breakdown Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <WealthSummaryCard
              totalWealth={totalWealth}
              nisabThreshold={nisabThreshold}
              currency={(user as any)?.preferences?.currency || 'USD'}
            />

            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <AssetsBreakdownChart
                assets={assets}
                currency={(user as any)?.preferences?.currency || 'USD'}
              />
            </div>
          </div>

          {/* Recent Assets Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Assets</h2>
              <Link
                to="/assets"
                className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline"
              >
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {assets.slice(0, 5).map((asset: Asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{asset.name}</p>
                      <p className="text-sm text-gray-600 capitalize">
                        {asset.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {maskedCurrency(new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: asset.currency || 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(asset.value || 0))}
                    </p>
                    <span className="text-xs text-green-600 font-medium">Zakatable</span>
                  </div>
                </div>
              ))}

              {assets.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  No assets added yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Educational Module (Always visible at bottom) */}
      <EducationalModule />
    </div>
  );
};