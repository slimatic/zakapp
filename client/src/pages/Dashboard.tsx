import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Button } from '../components/ui/Button';
import type { Asset, ZakatCalculation } from '../../../shared/src/types';

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
        apiService.getZakatHistory()
      ]);

      const assets = assetsResponse.data || [];
      const calculations = calculationsResponse.data || [];

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

  const { stats, recentAssets, recentCalculations } = dashboardData;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
          <Link to="/zakat/calculator">
            <Button variant="primary">Calculate Zakat</Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview Cards */}
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

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/assets" className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <span className="text-2xl mr-3">📦</span>
            <div>
              <p className="font-medium text-gray-900">Manage Assets</p>
              <p className="text-sm text-gray-600">View and edit your assets</p>
            </div>
          </Link>
          
          <Link to="/zakat/calculator" className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <span className="text-2xl mr-3">🧮</span>
            <div>
              <p className="font-medium text-gray-900">Calculate Zakat</p>
              <p className="text-sm text-gray-600">Run Zakat calculations</p>
            </div>
          </Link>
          
          <Link to="/zakat/history" className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <span className="text-2xl mr-3">📈</span>
            <div>
              <p className="font-medium text-gray-900">View History</p>
              <p className="text-sm text-gray-600">Track past calculations</p>
            </div>
          </Link>
          
          <Link to="/user/profile" className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <span className="text-2xl mr-3">⚙️</span>
            <div>
              <p className="font-medium text-gray-900">Settings</p>
              <p className="text-sm text-gray-600">Manage preferences</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assets */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Assets</h2>
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
        </div>

        {/* Zakat Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Zakat Status</h2>
            <Link to="/zakat/history">
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

              <Link to="/zakat/calculator" className="block">
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
              <Link to="/zakat/calculator" className="mt-4 inline-block">
                <Button variant="primary" size="sm">Start Calculation</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Reminders */}
      {stats.upcomingReminders > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Reminders</h2>
            <Link to="/zakat/history">
              <Button variant="ghost" size="sm">Manage Reminders</Button>
            </Link>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📅</span>
                <div>
                  <p className="font-medium text-gray-900">Annual Zakat Calculation</p>
                  <p className="text-sm text-gray-600">Due in 2 weeks</p>
                </div>
              </div>
              <Button variant="secondary" size="sm">Review</Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🔄</span>
                <div>
                  <p className="font-medium text-gray-900">Asset Review</p>
                  <p className="text-sm text-gray-600">Monthly asset valuation update</p>
                </div>
              </div>
              <Button variant="secondary" size="sm">Update</Button>
            </div>
          </div>
        </div>
      )}

      {/* Islamic Calendar Integration */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 border border-emerald-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-3xl mr-4">🌙</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Islamic Calendar</h3>
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
    </div>
  );
};