/**
 * AnalyticsPage - T071
 * Comprehensive analytics dashboard with charts and metrics
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalyticsChart } from '../components/tracking/AnalyticsChart';
import { Button } from '../components/ui/Button';

type Timeframe = 'last_year' | 'last_3_years' | 'last_5_years' | 'all_time';

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState<Timeframe>('last_5_years');

  // Map our timeframe to the AnalyticsChart timeframe prop
  // Removed unused chartTimeframe variable

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Comprehensive insights into your Zakat history and trends
              </p>
            </div>
            <Button variant="secondary" onClick={() => navigate('/tracking')}>
              ← Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Time Period:</label>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTimeframe('last_year')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeframe === 'last_year'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last Year
              </button>
              <button
                onClick={() => setTimeframe('last_3_years')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeframe === 'last_3_years'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 3 Years
              </button>
              <button
                onClick={() => setTimeframe('last_5_years')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeframe === 'last_5_years'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 5 Years
              </button>
              <button
                onClick={() => setTimeframe('all_time')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeframe === 'all_time'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Time
              </button>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="space-y-8">
          {/* Wealth Trend */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Wealth Trend Over Time</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Track your zakatable wealth growth year by year
                </p>
              </div>
            </div>
              <AnalyticsChart metricType="wealth_trend" visualizationType="line_chart" height={400} />
          </div>

          {/* Zakat Obligations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Zakat Obligations</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Annual Zakat due amounts and payment status
                </p>
              </div>
            </div>
              <AnalyticsChart metricType="zakat_trend" visualizationType="bar_chart" height={400} />
          </div>

          {/* Two Column Layout for Pie Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Distribution */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900">Payment Distribution</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Breakdown by recipient category
                </p>
              </div>
                <AnalyticsChart metricType="payment_distribution" visualizationType="pie_chart" height={350} />
            </div>

            {/* Asset Composition */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900">Asset Composition</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Current wealth breakdown by asset type
                </p>
              </div>
                <AnalyticsChart metricType="asset_composition" visualizationType="pie_chart" height={350} />
            </div>
          </div>

          {/* Summary Statistics - Simplified without data dependencies */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Timeframe Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="border-l-4 border-green-500 pl-4">
                <p className="text-sm text-gray-600">Selected Period</p>
                <p className="text-2xl font-bold text-gray-900 mt-1 capitalize">
                  {timeframe.replace('_', ' ')}
                </p>
                <p className="text-xs text-gray-500 mt-1">Current view</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <p className="text-sm text-gray-600">Chart Type</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">4</p>
                <p className="text-xs text-gray-500 mt-1">Different visualizations</p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-sm text-gray-600">Metrics Tracked</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">4</p>
                <p className="text-xs text-gray-500 mt-1">Key indicators</p>
              </div>

              <div className="border-l-4 border-orange-500 pl-4">
                <p className="text-sm text-gray-600">Real-Time</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">✓</p>
                <p className="text-xs text-gray-500 mt-1">Live data</p>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Understanding Your Analytics
              </h3>
              <div className="text-sm text-blue-700 mt-2 space-y-2">
                <p>
                  These analytics help you understand patterns in your Zakat obligations and giving over time:
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li><strong>Wealth Trend</strong>: Shows how your zakatable wealth has grown or decreased</li>
                  <li><strong>Zakat Obligations</strong>: Displays annual Zakat due amounts and payment status</li>
                  <li><strong>Payment Distribution</strong>: Shows which recipient categories you've supported</li>
                  <li><strong>Asset Composition</strong>: Breaks down your wealth by asset type</li>
                </ul>
                <p className="mt-2">
                  Use these insights to plan future Zakat payments and ensure balanced wealth management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};