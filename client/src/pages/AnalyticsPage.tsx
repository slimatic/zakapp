/**
 * AnalyticsPage - T071
 * Comprehensive analytics dashboard with charts and metrics
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalyticsChart } from '../components/tracking/AnalyticsChart';
import { Button } from '../components/ui/Button';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAssets } from '../services/apiHooks';
import { useNisabYearRecords } from '../hooks/useNisabYearRecords';
import { usePayments } from '../hooks/usePayments';
import { formatCurrency } from '../utils/formatters';
import { useMaskedCurrency } from '../contexts/PrivacyContext';
import type { Asset } from '@zakapp/shared';
import type { NisabYearRecord } from '../types/nisabYearRecord';

type Timeframe = 'last_year' | 'last_3_years' | 'last_5_years' | 'all_time';

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const maskedCurrency = useMaskedCurrency();
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('all_time');

  // Fetch data for summary statistics (T027)
  const { data: assetsData } = useAssets();
  const { data: nisabRecordsData } = useNisabYearRecords({ limit: 100 });
  const { data: paymentsData } = usePayments(); // Fetch all payments
  const { data: wealthData } = useAnalytics('wealth_trend', selectedTimeframe);
  
  // Extract Nisab Year Records from API response
  const nisabRecords = nisabRecordsData?.records || [];
  
  // Calculate summary statistics
  const totalWealth = assetsData?.data?.assets?.reduce((sum: number, asset: Asset) => sum + asset.value, 0) || 0;
  const totalZakatDue = nisabRecords.reduce((sum: number, record: NisabYearRecord) => {
    // Decrypt and parse zakatAmount if it's a string
    const amount = typeof record.zakatAmount === 'string'
      ? parseFloat(record.zakatAmount)
      : (record.zakatAmount || 0);
    return sum + amount;
  }, 0) || 0;
  
  // Calculate total Zakat paid from actual payment records
  const totalZakatPaid = paymentsData?.payments?.reduce((sum: number, payment: any) => {
    return sum + (payment.amount || 0);
  }, 0) || 0;
  
  const outstandingBalance = totalZakatDue - totalZakatPaid;
  const complianceRate = totalZakatDue > 0 ? (totalZakatPaid / totalZakatDue) * 100 : 0;

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
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
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
                onClick={() => setSelectedTimeframe('last_year')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTimeframe === 'last_year'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last Year
              </button>
              <button
                onClick={() => setSelectedTimeframe('last_3_years')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTimeframe === 'last_3_years'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 3 Years
              </button>
              <button
                onClick={() => setSelectedTimeframe('last_5_years')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTimeframe === 'last_5_years'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 5 Years
              </button>
              <button
                onClick={() => setSelectedTimeframe('all_time')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTimeframe === 'all_time'
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
          {/* Summary Statistics - T027 with real data */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Summary Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="border-l-4 border-green-500 pl-4">
                <p className="text-sm text-gray-600">Total Wealth</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {maskedCurrency(formatCurrency(totalWealth))}
                </p>
                <p className="text-xs text-gray-500 mt-1">Current assets value</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <p className="text-sm text-gray-600">Total Zakat Due</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {maskedCurrency(formatCurrency(totalZakatDue))}
                </p>
                <p className="text-xs text-gray-500 mt-1">All Nisab Years</p>
              </div>

              <div className="border-l-4 border-emerald-500 pl-4">
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {maskedCurrency(formatCurrency(totalZakatPaid))}
                </p>
                <p className="text-xs text-gray-500 mt-1">Across all years</p>
              </div>

              <div className="border-l-4 border-orange-500 pl-4">
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className={`text-2xl font-bold mt-1 ${outstandingBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {maskedCurrency(formatCurrency(Math.abs(outstandingBalance)))}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {outstandingBalance > 0 ? 'Remaining' : 'Fully paid'}
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-sm text-gray-600">Compliance Rate</p>
                <p className={`text-2xl font-bold mt-1 ${
                  complianceRate >= 100 ? 'text-green-600' : 
                  complianceRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {complianceRate.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Paid / Due ratio</p>
              </div>
            </div>
          </div>

          {/* Section 1: Wealth Over Time (Asset-based) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Wealth Over Time</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Track your total asset value growth independent of Nisab Year Records
                </p>
              </div>
            </div>
              <AnalyticsChart metricType="wealth_trend" visualizationType="line_chart" height={400} />
          </div>

          {/* Section 2: Zakat Obligations (Nisab Record-based) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Zakat Obligations</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Annual Zakat due, paid, and outstanding amounts per Nisab Year Record
                </p>
              </div>
            </div>
              <AnalyticsChart metricType="zakat_trend" visualizationType="bar_chart" height={400} />
          </div>

          {/* Section 3: Asset Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Asset Composition */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900">Asset Distribution</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Current wealth breakdown by asset type and category
                </p>
              </div>
                <AnalyticsChart metricType="asset_composition" visualizationType="pie_chart" height={350} />
            </div>

            {/* Payment Distribution */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900">Payment Distribution</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Zakat payments breakdown by Islamic recipient category
                </p>
              </div>
                <AnalyticsChart metricType="payment_distribution" visualizationType="pie_chart" height={350} />
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
                  This dashboard uses <strong>two separate data sources</strong> to provide comprehensive insights:
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li><strong>Wealth Over Time</strong>: Tracks your asset values continuously, independent of Zakat calculations</li>
                  <li><strong>Zakat Obligations</strong>: Shows due/paid/outstanding amounts per Nisab Year Record (each representing one Hawl period)</li>
                  <li><strong>Asset Distribution</strong>: Current breakdown of your wealth by asset type (cash, gold, investments, etc.)</li>
                  <li><strong>Payment Distribution</strong>: Breakdown of Zakat payments by Islamic recipient category</li>
                </ul>
                <p className="mt-3 pt-3 border-t border-blue-200">
                  <strong>Note:</strong> Assets are tracked continuously for wealth trends, while Nisab Year Records are created when your wealth reaches the nisab threshold and maintains it for a full lunar year (Hawl).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};