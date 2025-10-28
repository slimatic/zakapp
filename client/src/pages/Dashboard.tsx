import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Button } from '../components/ui/Button';
import { HawlProgressIndicator } from '../components/HawlProgressIndicator';
import { NisabComparisonWidget } from '../components/NisabComparisonWidget';
import type { Asset, ZakatCalculation } from '@zakapp/shared';

interface DashboardStats {
  totalAssets: number;
  totalValue: number;
  zakatableAssets: number;
  zakatableValue: number;
  lastCalculation?: ZakatCalculation;
  upcomingReminders: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentAssets: Asset[];
  recentCalculations: ZakatCalculation[];
}

/**
 * Hawl Tracking Section Component
 * Displays active Nisab Year Record with Hawl progress and wealth comparison
 */
const HawlTrackingSection: React.FC = () => {
  const [selectedRecordId, setSelectedRecordId] = React.useState<string | null>(null);

  // Fetch active Nisab Year Records (DRAFT status)
  const {
    data: recordsResponse,
    isLoading
  } = useQuery({
    queryKey: ['nisab-year-records', 'active'],
    queryFn: () => apiService.getNisabYearRecords({ status: ['DRAFT'], limit: 5 }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const records = recordsResponse?.data?.records || [];
  const activeRecord = selectedRecordId
    ? records.find((r: any) => r.id === selectedRecordId)
    : records[0]; // Default to first if available

  if (isLoading) {
    return (
      <section aria-labelledby="hawl-heading" className="mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center min-h-[200px]">
            <LoadingSpinner size="md" />
          </div>
        </div>
      </section>
    );
  }

  // Only show section if there are active Hawl records
  if (!records || records.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="hawl-heading" className="mb-6">
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 id="hawl-heading" className="text-2xl font-bold text-gray-900">
              🌙 Hawl Year Tracking
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Monitor your active Nisab Year Record and wealth status
            </p>
          </div>
          <Link to="/nisab-year-records">
            <Button variant="primary" size="sm">
              Manage Records
            </Button>
          </Link>
        </div>

        {activeRecord && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hawl Progress - Left Column */}
            <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Hawl Progress
              </h3>
              <HawlProgressIndicator
                record={activeRecord}
                progressColor="blue"
              />
              
              {/* Additional Hawl Info */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Nisab Basis
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {activeRecord.nisabBasis || 'GOLD'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Record Status
                  </p>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      activeRecord.recordStatus === 'DRAFT'
                        ? 'bg-blue-100 text-blue-800'
                        : activeRecord.recordStatus === 'FINALIZED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {activeRecord.recordStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Nisab Comparison - Right Column */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Wealth Status
              </h3>
              <NisabComparisonWidget
                record={activeRecord}
                currentWealth={activeRecord.finalZakatAmount ? 
                  activeRecord.finalZakatAmount / 0.025 : // Back-calculate total wealth from zakat (2.5%)
                  0
                }
                showDetails={false}
              />
              <Link to="/nisab-year-records" className="mt-4 block">
                <Button variant="secondary" className="w-full" size="sm">
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Multiple Records - Tabs */}
        {records.length > 1 && (
          <div className="mt-6 pt-6 border-t border-blue-200">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Other Active Records:
            </p>
            <div className="flex flex-wrap gap-2">
              {records.map((record: any) => (
                <button
                  key={record.id}
                  onClick={() => setSelectedRecordId(record.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    (selectedRecordId || records[0].id) === record.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {new Date(record.startDate).toLocaleDateString()} - 
                  {Math.round(record.liveHawlData?.daysRemaining || 0)} days remaining
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CTA Link */}
        <div className="mt-6 pt-6 border-t border-blue-200">
          <p className="text-sm text-gray-600">
            Want to start a new Nisab Year Record or manage existing ones?
          </p>
          <Link to="/nisab-year-records" className="mt-2 inline-block">
            <Button variant="secondary">
              Go to Nisab Year Records
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async (): Promise<DashboardData> => {
      // Since we don't have a specific dashboard endpoint, let's compose the data
      const [assetsResponse, calculationsResponse] = await Promise.all([
        apiService.getAssets(),
        apiService.getCalculationHistory()
      ]);

      const assets = assetsResponse.data?.assets || [];
      const calculations = calculationsResponse.data?.calculations || [];

      // Calculate stats
      const totalAssets = assets.length;
      const totalValue = assets.reduce((sum: number, asset: Asset) => sum + asset.value, 0);
      const zakatableAssets = assets.filter((asset: Asset) => asset.zakatEligible).length;
      const zakatableValue = assets
        .filter((asset: Asset) => asset.zakatEligible)
        .reduce((sum: number, asset: Asset) => sum + asset.value, 0);
      
      const recentCalculations = calculations
        .sort((a: ZakatCalculation, b: ZakatCalculation) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      
      const lastCalculation = recentCalculations[0];

      const stats: DashboardStats = {
        totalAssets,
        totalValue,
        zakatableAssets,
        zakatableValue,
        lastCalculation,
        upcomingReminders: 2 // Mock value for now
      };

      const recentAssets = assets
        .sort((a: Asset, b: Asset) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);

      return {
        stats,
        recentAssets,
        recentCalculations
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getAssetCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      cash: '💵',
      gold: '🥇',
      silver: '🥈',
      business: '🏢',
      property: '🏠',
      stocks: '📈',
      crypto: '₿',
      debts: '💰',
      expenses: '💸'
    };
    return icons[category] || '📦';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage 
          error={error} 
          onRetry={refetch}
          title="Failed to load dashboard"
        />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">
          No dashboard data available
        </div>
      </div>
    );
  }

  const { stats, recentAssets } = dashboardData;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Assalamu Alaikum, {user?.username}
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome to your Zakat management dashboard
          </p>
        </div>
        <div className="flex space-x-3">
          <Link to="/assets/new">
            <Button variant="secondary">Add Asset</Button>
          </Link>
          <Link to="/calculate">
            <Button variant="primary">Calculate Zakat</Button>
          </Link>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main role="main" aria-label="Dashboard overview">
      {/* Stats Overview Cards */}
      <section aria-labelledby="stats-heading" className="mb-6">
        <h2 id="stats-heading" className="sr-only">Statistics Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAssets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalValue, user?.preferences?.currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">🕌</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Zakatable Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.zakatableValue, user?.preferences?.currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <span className="text-2xl">⏰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reminders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingReminders}</p>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* Quick Actions */}
      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="sr-only">Quick Actions</h2>
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/assets" className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <span className="text-2xl mr-3">📦</span>
            <div>
              <p className="font-medium text-gray-900">Manage Assets</p>
              <p className="text-sm text-gray-600">View and edit your assets</p>
            </div>
          </Link>
          
          <Link to="/calculate" className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <span className="text-2xl mr-3">🧮</span>
            <div>
              <p className="font-medium text-gray-900">Calculate Zakat</p>
              <p className="text-sm text-gray-600">Run Zakat calculations</p>
            </div>
          </Link>
          
          <Link to="/history" className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <span className="text-2xl mr-3">📈</span>
            <div>
              <p className="font-medium text-gray-900">View History</p>
              <p className="text-sm text-gray-600">Track past calculations</p>
            </div>
          </Link>
          
          <Link to="/settings" className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <span className="text-2xl mr-3">⚙️</span>
            <div>
              <p className="font-medium text-gray-900">Settings</p>
              <p className="text-sm text-gray-600">Manage preferences</p>
            </div>
          </Link>
        </div>
      </div>
      </section>

      {/* Active Nisab Year Record / Hawl Tracking */}
      <HawlTrackingSection />

      {/* Main Content Grid */}
      <section aria-labelledby="content-heading">
        <h2 id="content-heading" className="sr-only">Recent Assets and Zakat Status</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assets */}
        <article className="bg-white rounded-lg shadow p-6" aria-labelledby="recent-assets-heading">
          <div className="flex items-center justify-between mb-4">
            <h3 id="recent-assets-heading" className="text-xl font-semibold text-gray-900">Recent Assets</h3>
            <Link to="/assets">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          
          {recentAssets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-4 block">📦</span>
              <p className="font-medium">No assets added yet</p>
              <p className="text-sm mt-1">Start by adding your first asset</p>
              <Link to="/assets/new" className="mt-4 inline-block">
                <Button variant="primary" size="sm">Add Asset</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAssets.map((asset) => (
                <div key={asset.assetId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getAssetCategoryIcon(asset.category)}</span>
                    <div>
                      <p className="font-medium text-gray-900">{asset.name}</p>
                      <p className="text-sm text-gray-600 capitalize">{asset.subCategory.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(asset.value, asset.currency)}
                    </p>
                    {asset.zakatEligible && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Zakatable
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        {/* Zakat Status */}
        <article className="bg-white rounded-lg shadow p-6" aria-labelledby="zakat-status-heading">
          <div className="flex items-center justify-between mb-4">
            <h3 id="zakat-status-heading" className="text-xl font-semibold text-gray-900">Zakat Status</h3>
            <Link to="/history">
              <Button variant="ghost" size="sm">View History</Button>
            </Link>
          </div>
          
          {stats.lastCalculation ? (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-700">Last Calculation</span>
                  <span className="text-sm text-purple-600">
                    {new Date(stats.lastCalculation.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-2xl font-bold text-purple-900 mb-1">
                  {formatCurrency(stats.lastCalculation.totals.totalZakatDue, 'USD')}
                </div>
                <div className="text-sm text-purple-700">
                  {stats.lastCalculation.method} • {stats.lastCalculation.status}
                </div>
              </div>

              {stats.zakatableValue > 0 && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-700 mb-1">Current Zakatable Wealth</p>
                  <p className="text-xl font-bold text-green-900">
                    {formatCurrency(stats.zakatableValue, user?.preferences?.currency)}
                  </p>
                  <p className="text-sm text-green-600 mt-2">
                    Estimated Zakat: ~{formatCurrency(stats.zakatableValue * 0.025, user?.preferences?.currency)}
                  </p>
                </div>
              )}

              <Link to="/calculate" className="block">
                <Button variant="primary" className="w-full">
                  Calculate Current Zakat
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-4 block">🕌</span>
              <p className="font-medium">No calculations yet</p>
              <p className="text-sm mt-1">Calculate your Zakat obligations</p>
              <Link to="/calculate" className="mt-4 inline-block">
                <Button variant="primary" size="sm">Start Calculation</Button>
              </Link>
            </div>
          )}
        </article>
      </div>
      </section>

      {/* Recent Calculations */}
      <section aria-labelledby="recent-calc-heading">
      <article className="bg-white rounded-lg shadow p-6" aria-labelledby="recent-calc-heading">
        <div className="flex items-center justify-between mb-4">
          <h3 id="recent-calc-heading" className="text-xl font-semibold text-gray-900">Recent Calculations</h3>
          <Link to="/history">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>

        <div className="text-center text-gray-600">
          <p>Visit the history page to view your calculations</p>
        </div>
      </article>
      </section>

      {/* Upcoming Reminders */}
      <aside aria-labelledby="reminders-heading">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 id="reminders-heading" className="text-lg leading-6 font-medium text-yellow-900">Upcoming Zakat Reminder</h3>
              <p className="mt-1 text-sm text-yellow-700">
                Your next Zakat payment is due in approximately 6 months (based on Hijri calendar).
              </p>
            </div>
            <div className="flex-shrink-0">
              <svg className="h-16 w-16 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/calculate"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Calculate Zakat Now
              <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
      </aside>

      {/* Islamic Calendar Integration */}
      <aside aria-labelledby="calendar-heading">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 border border-emerald-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-3xl mr-4" aria-hidden="true">🌙</span>
            <div>
              <h3 id="calendar-heading" className="text-lg font-semibold text-gray-900">Islamic Calendar</h3>
              <p className="text-gray-600">
                Today: {new Intl.DateTimeFormat('en-US-u-ca-islamic', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                }).format(new Date())}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-emerald-700">Next Recommended Zakat Period</p>
            <p className="text-lg font-semibold text-emerald-900">Ramadan 1446</p>
          </div>
        </div>
      </div>
      </aside>
      </main>
    </div>
  );
};