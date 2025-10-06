/**
 * TrackingDashboard Page - T067
 * Overview page showing tracking metrics, recent snapshots, and reminders
 */

import React from 'react';
import { useSnapshots } from '../hooks/useSnapshots';
import { FullReminderBanner } from '../components/tracking/ReminderBanner';
import { SnapshotCard } from '../components/tracking/SnapshotCard';
import { AnalyticsChart } from '../components/tracking/AnalyticsChart';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

export const TrackingDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // T090 Performance: Fetch only recent snapshots (3 items) with optimized query
  // Reduces initial load time by limiting data transfer and database query complexity
  const { data: snapshotsData, isLoading } = useSnapshots({
    page: 1,
    limit: 3,
    status: undefined // Fetch all statuses for dashboard overview
  });

  const snapshots = snapshotsData?.snapshots || [];

  // Calculate summary statistics
  const totalSnapshots = snapshotsData?.pagination?.totalItems || 0;
  const draftCount = snapshots.filter(s => s.status === 'draft').length;
  const finalizedCount = snapshots.filter(s => s.status === 'finalized').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Reminder Banner */}
      <FullReminderBanner />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tracking & Analytics</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive Zakat tracking and historical analysis
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button
            onClick={() => navigate('/tracking/snapshots/new')}
            className="h-auto py-4"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibold">Create Snapshot</div>
              <div className="text-sm opacity-90">Record this year's calculation</div>
            </div>
          </Button>

          <Button
            variant="secondary"
            onClick={() => navigate('/tracking/payments')}
            className="h-auto py-4"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">💰</div>
              <div className="font-semibold">Record Payment</div>
              <div className="text-sm opacity-90">Track your Zakat distribution</div>
            </div>
          </Button>

          <Button
            variant="secondary"
            onClick={() => navigate('/tracking/comparison')}
            className="h-auto py-4"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📈</div>
              <div className="font-semibold">Compare Years</div>
              <div className="text-sm opacity-90">Analyze trends over time</div>
            </div>
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600">Total Snapshots</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {totalSnapshots}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Historical records
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600">Finalized</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {finalizedCount}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Completed calculations
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600">Drafts</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">
              {draftCount}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              In progress
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600">Years Tracked</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">
              {Math.min(totalSnapshots, 10)}+
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Historical depth
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Snapshots */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Recent Snapshots</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/tracking/snapshots')}
                >
                  View All →
                </Button>
              </div>

              {snapshots.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No snapshots yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first yearly snapshot to start tracking your Zakat history.
                  </p>
                  <Button onClick={() => navigate('/tracking/snapshots/new')}>
                    Create First Snapshot
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {snapshots.map(snapshot => (
                    <SnapshotCard
                      key={snapshot.id}
                      snapshot={snapshot}
                      onView={() => navigate(`/tracking/snapshots/${snapshot.id}`)}
                      onEdit={() => navigate(`/tracking/snapshots/${snapshot.id}/edit`)}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Analytics Charts */}
            <div className="space-y-6">
              {/* Wealth Trend */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Wealth Trend</h2>
                <AnalyticsChart
                  metricType="wealth_trend"
                  visualizationType="line_chart"
                  height={300}
                  compact
                  timeframe="last_5_years"
                />
              </div>

              {/* Zakat Trend */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Zakat Obligations</h2>
                <AnalyticsChart
                  metricType="zakat_trend"
                  visualizationType="bar_chart"
                  height={300}
                  compact
                  timeframe="last_5_years"
                />
              </div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            📚 Quick Links
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/tracking/analytics')}
              className="text-left p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="font-medium text-blue-900">Analytics Dashboard</div>
              <div className="text-sm text-blue-700 mt-1">
                View detailed charts and insights
              </div>
            </button>

            <button
              onClick={() => navigate('/tracking/comparison')}
              className="text-left p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="font-medium text-blue-900">Year Comparison</div>
              <div className="text-sm text-blue-700 mt-1">
                Compare multiple years side-by-side
              </div>
            </button>

            <button
              onClick={() => navigate('/calculator')}
              className="text-left p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="font-medium text-blue-900">Zakat Calculator</div>
              <div className="text-sm text-blue-700 mt-1">
                Calculate current year's Zakat
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};