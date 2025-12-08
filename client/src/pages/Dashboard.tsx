import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { QuickActionCard } from '../components/dashboard/QuickActionCard';
import { ActiveRecordWidget } from '../components/dashboard/ActiveRecordWidget';
import { WealthSummaryCard } from '../components/dashboard/WealthSummaryCard';
import { OnboardingGuide } from '../components/dashboard/OnboardingGuide';
import { SkeletonCard } from '../components/common/SkeletonLoader';
import { useUserOnboarding } from '../hooks/useUserOnboarding';
import type { Asset } from '@zakapp/shared';

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
    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border-2 border-teal-200 p-6">
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
            <h3 className="font-semibold text-gray-900 mb-2">What is Zakat?</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Zakat is one of the Five Pillars of Islam and is an obligatory act of charity. It requires Muslims 
              who meet specific wealth criteria to donate 2.5% of their qualifying wealth annually to those in need. 
              Zakat purifies wealth and helps create a more equitable society.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What is Nisab?</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Nisab is the minimum threshold of wealth a Muslim must possess for one lunar year (Hawl) before 
              Zakat becomes obligatory. The Nisab can be calculated based on the value of gold (85 grams) or 
              silver (595 grams). ZakApp helps you track your wealth and determine when you've reached the Nisab threshold.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">The Hawl Period</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              The Hawl is the Islamic lunar year period (354 days) during which your wealth must remain above 
              the Nisab threshold for Zakat to be due. ZakApp's Nisab Year Record feature helps you track this 
              period automatically and alerts you when Zakat payment is due.
            </p>
          </div>

          <div className="pt-4 border-t border-teal-200">
            <h3 className="font-semibold text-gray-900 mb-3">Learn More</h3>
            <div className="space-y-2">
              <a
                href="https://www.youtube.com/watch?v=SimpleZakatGuide"
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
              <a
                href="/help"
                className="flex items-center text-sm text-teal-700 hover:text-teal-800 hover:underline"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Read: Detailed Zakat & Nisab Guide
              </a>
            </div>
          </div>
        </div>
      )}

      {!isExpanded && (
        <p className="text-sm text-gray-600">
          Learn about Zakat obligations, Nisab threshold, and the Hawl period. Click to expand.
        </p>
      )}
    </div>
  );
};

/**
 * Dashboard Component - Refactored as Central Hub
 * 
 * Features:
 * - Progressive disclosure based on user state
 * - Empty state with onboarding guidance
 * - Active record status display
 * - Quick action cards
 * - Educational module
 * - Wealth summary
 */
export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { currentStep, completedSteps } = useUserOnboarding();

  // Debug logging
  // Track onboarding state for UI rendering

  // Fetch user's assets
  const {
    data: assetsResponse,
    isLoading: assetsLoading,
    error: assetsError,
  } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await apiService.getAssets();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch active Nisab Year Record (DRAFT = active/in-progress)
  const {
    data: recordsData,
    isLoading: recordsLoading,
    error: recordsError,
  } = useQuery({
    queryKey: ['nisab-year-records', 'active'],
    queryFn: async () => {
      const response = await apiService.getNisabYearRecords({ 
        status: ['DRAFT']
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const assets = assetsResponse?.assets || [];
  
  // Handle double-wrapped API response structure and get latest record
  const allRecords = Array.isArray(recordsData) 
    ? recordsData 
    : (recordsData?.records || []);
  
  // Sort by hawlStartDate descending (newest first) and take the first one
  // Ensure allRecords items have the expected shape for typing
  type RecordItem = { hawlStartDate?: string | null } & Record<string, any>;
  const records = allRecords.length > 0 
    ? [allRecords.sort((a: RecordItem, b: RecordItem) => {
        const at = a?.hawlStartDate ? new Date(a.hawlStartDate).getTime() : 0;
        const bt = b?.hawlStartDate ? new Date(b.hawlStartDate).getTime() : 0;
        return bt - at;
      })[0]]
    : [];
  const activeRecord = records[0] || null;
  const hasAssets = assets.length > 0;
  const hasActiveRecord = activeRecord !== null;

  // Calculate total wealth
  const totalWealth = assets.reduce((sum: number, asset: Asset) => {
    return sum + (asset.value || 0);
  }, 0);

  // Get Nisab threshold (from active record or default)
  const nisabThreshold = activeRecord?.initialNisabThreshold || 5000; // Default fallback

  // Loading state
  if (assetsLoading || recordsLoading) {
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

  // Quick Action Cards Configuration
  const getQuickActions = () => {
    if (!hasAssets) {
      // New user: Add first asset
      return [
        {
          title: 'Add Your First Asset',
          description: 'Start tracking your wealth by adding your first asset',
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ),
          href: '/assets/new',
          variant: 'primary' as const,
        },
      ];
    }

    if (!hasActiveRecord) {
      // Has assets but no record: Create Nisab Record
      return [
        {
          title: 'Create Nisab Record',
          description: 'Start tracking your Hawl period to monitor Zakat obligations',
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
          href: '/nisab-records',
          variant: 'primary' as const,
        },
        {
          title: 'Add More Assets',
          description: 'Continue building your wealth portfolio',
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ),
          href: '/assets/new',
        },
      ];
    }

    // Has active record: Show management actions
    return [
      {
        title: 'View All Records',
        description: 'Manage your Nisab Year Records and history',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ),
        href: '/nisab-records',
      },
      {
        title: 'Update Assets',
        description: 'Keep your asset values current and accurate',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
        href: '/assets',
      },
      {
        title: 'Add Asset',
        description: 'Add new assets to your portfolio',
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        ),
        href: '/assets/new',
      },
    ];
  };

  const quickActions = getQuickActions();

  return (
    <div className="container mx-auto px-4 py-6 space-y-6" id="main-content">
      {/* Dashboard Header */}
      <DashboardHeader
        userName={user?.username}
        hasAssets={hasAssets}
        hasActiveRecord={hasActiveRecord}
      />

      {/* T022: Empty State - No Assets */}
      {!hasAssets && (
        <div className="space-y-6">
          {/* Onboarding Guide */}
          <OnboardingGuide
            currentStep={currentStep}
            completedSteps={completedSteps}
          />

          {/* Quick Actions for New Users */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => (
              <QuickActionCard
                key={index}
                title={action.title}
                description={action.description}
                icon={action.icon}
                href={action.href}
                variant={action.variant}
              />
            ))}
          </div>

          {/* Educational Module */}
          <EducationalModule />
        </div>
      )}

      {/* T022 & T023: Has Assets State */}
      {hasAssets && (
        <div className="space-y-6">
          {/* Show onboarding guide unless all steps are completed */}
          {!completedSteps.includes(3) && (
            <OnboardingGuide
              currentStep={currentStep}
              completedSteps={completedSteps}
            />
          )}

          {/* Onboarding Prompt: First asset added, encourage Nisab record creation */}
          {!hasActiveRecord && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Great start! You have {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: user?.preferences?.currency || 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(totalWealth)} in tracked assets.
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Ready to start tracking your Zakat obligations? Create a Nisab Year Record 
                    to monitor your Hawl period and calculate when Zakat becomes due.
                  </p>
                  <Link
                    to="/nisab-records?create=true"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Nisab Record
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* T023: Active Record Widget */}
          {hasActiveRecord && activeRecord && (
            <ActiveRecordWidget record={activeRecord} />
          )}

          {/* Wealth Summary */}
          <WealthSummaryCard
            totalWealth={totalWealth}
            nisabThreshold={nisabThreshold}
            currency={user?.preferences?.currency || 'USD'}
          />

          {/* T024: Quick Action Cards */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickActions.map((action, index) => (
                <QuickActionCard
                  key={index}
                  title={action.title}
                  description={action.description}
                  icon={action.icon}
                  href={action.href}
                  variant={action.variant}
                />
              ))}
            </div>
          </div>

          {/* T025: Educational Module */}
          <EducationalModule />

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
                  key={asset.assetId}
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
                        {asset.category} • {asset.subCategory?.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: asset.currency || 'USD',
                      }).format(asset.value || 0)}
                    </p>
                    {asset.zakatEligible && (
                      <span className="text-xs text-green-600 font-medium">Zakatable</span>
                    )}
                  </div>
                </div>
              ))}

              {assets.length > 5 && (
                <Link
                  to="/assets"
                  className="block text-center py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  +{assets.length - 5} more assets
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};