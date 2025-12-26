/**
 * AnalyticsPage
 * Comprehensive analytics dashboard with charts and metrics
 * Refactored for Local-First Architecture
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalyticsChart } from '../components/tracking/AnalyticsChart';
import { Button } from '../components/ui/Button';
import { useAssetRepository } from '../hooks/useAssetRepository';
import { useNisabRecordRepository } from '../hooks/useNisabRecordRepository';
import { usePaymentRepository } from '../hooks/usePaymentRepository';
import { formatCurrency } from '../utils/formatters';
import { useMaskedCurrency } from '../contexts/PrivacyContext';
import { isAssetZakatable } from '../core/calculations/zakat';
import type { NisabYearRecord } from '../types/nisabYearRecord';

type Timeframe = 'last_year' | 'last_3_years' | 'last_5_years' | 'all_time';

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const maskedCurrency = useMaskedCurrency();
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('all_time');

  // Fetch data from Local Repositories
  const { assets } = useAssetRepository();
  const { records: nisabRecords } = useNisabRecordRepository();
  const { payments } = usePaymentRepository();

  // Calculate summary statistics locally
  const totalWealth = assets.reduce<number>((sum, asset) => sum + (Number(asset.value) || 0), 0) || 0;

  const totalZakatableWealth = assets.reduce((sum: number, asset: any) => {
    const zakatable = isAssetZakatable(asset, 'STANDARD');
    if (!zakatable) return sum;
    const modifier = typeof asset.calculationModifier === 'number' ? asset.calculationModifier : 1.0;
    const zakVal = typeof asset.zakatableValue === 'number' ? asset.zakatableValue : (Number(asset.value) || 0) * modifier;
    return sum + (zakVal || 0);
  }, 0) || 0;

  const totalZakatDue = nisabRecords.reduce((sum: number, record: NisabYearRecord) => {
    // Decrypt and parse zakatAmount if it's a string
    const amount = typeof record.zakatAmount === 'string'
      ? parseFloat(record.zakatAmount)
      : (record.zakatAmount || 0);
    return sum + amount;
  }, 0) || 0;

  // Calculate total Zakat paid from actual payment records
  const totalZakatPaid = payments.reduce((sum: number, payment: any) => {
    return sum + (Number(payment.amount) || 0);
  }, 0) || 0;

  const outstandingBalance = totalZakatDue - totalZakatPaid;
  const complianceRate = totalZakatDue > 0 ? (totalZakatPaid / totalZakatDue) * 100 : 0;

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
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedTimeframe === 'last_year'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Last Year
              </button>
              <button
                onClick={() => setSelectedTimeframe('last_3_years')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedTimeframe === 'last_3_years'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Last 3 Years
              </button>
              <button
                onClick={() => setSelectedTimeframe('last_5_years')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedTimeframe === 'last_5_years'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Last 5 Years
              </button>
              <button
                onClick={() => setSelectedTimeframe('all_time')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedTimeframe === 'all_time'
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
          {/* Summary Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Summary Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="border-l-4 border-green-500 pl-4">
                <p className="text-sm text-gray-600">Total Wealth</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {maskedCurrency(formatCurrency(totalWealth))}
                </p>
                <p className="text-sm text-gray-700 mt-1">Zakatable: <span className="font-medium">{maskedCurrency(formatCurrency(totalZakatableWealth))}</span></p>
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
                <p className={`text-2xl font-bold mt-1 ${complianceRate >= 100 ? 'text-green-600' :
                  complianceRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                  {complianceRate.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Paid / Due ratio</p>
              </div>
            </div>
          </div>

          {/* Note: Additional Charts temporarily hidden or static until local chart logic is fully ported */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-blue-800 text-sm">
              Detailed historical charts will be available in authorized mode.
              Currently showing real-time local statistics above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};