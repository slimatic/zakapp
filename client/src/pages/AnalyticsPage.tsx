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

/**
 * AnalyticsPage
 * Comprehensive analytics dashboard with charts and metrics
 * Refactored for Local-First Architecture
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { AssetsBreakdownChart } from '../components/dashboard/AssetsBreakdownChart';
import { PaymentDistributionChart } from '../components/dashboard/PaymentDistributionChart';
import { WealthTrendChart } from '../components/dashboard/WealthTrendChart';
import { ZakatObligationsChart } from '../components/dashboard/ZakatObligationsChart';
import { useAssetRepository } from '../hooks/useAssetRepository';
import { useNisabRecordRepository } from '../hooks/useNisabRecordRepository';
import { usePaymentRepository } from '../hooks/usePaymentRepository';
import { formatCurrency } from '../utils/formatters';
import { useMaskedCurrency } from '../contexts/PrivacyContext';
import { isAssetZakatable, getAssetZakatableValue } from '../core/calculations/zakat';
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

  // Calculate timeframe start date
  const timeframeStartDate = useMemo(() => {
    if (selectedTimeframe === 'all_time') return null;
    const now = new Date();
    switch (selectedTimeframe) {
      case 'last_year':
        return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      case 'last_3_years':
        return new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
      case 'last_5_years':
        return new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
      default:
        return null;
    }
  }, [selectedTimeframe]);

  // Filter nisabRecords by timeframe
  const filteredNisabRecords = useMemo(() => {
    if (!timeframeStartDate) return nisabRecords;
    return nisabRecords.filter(record => {
      const dateStr = record.hawlStartDate || record.createdAt || new Date().toISOString();
      const recordDate = new Date(dateStr);
      return recordDate >= timeframeStartDate;
    });
  }, [nisabRecords, timeframeStartDate]);

  // Filter payments by timeframe
  const filteredPayments = useMemo(() => {
    if (!timeframeStartDate) return payments;
    return payments.filter((payment: any) => {
      const dateStr = payment.paymentDate || payment.createdAt || new Date().toISOString();
      const paymentDate = new Date(dateStr);
      return paymentDate >= timeframeStartDate;
    });
  }, [payments, timeframeStartDate]);

  // Calculate summary statistics locally
  const totalWealth = assets.reduce<number>((sum, asset) => sum + (Number(asset.value) || 0), 0) || 0;

  const totalZakatableWealth = assets.reduce((sum: number, asset) => {
    // Use centralized calculation for consistency with Nisab records
    return sum + getAssetZakatableValue(asset, 'STANDARD');
  }, 0);

  const totalZakatDue = filteredNisabRecords.reduce((sum: number, record: NisabYearRecord) => {
    // Decrypt and parse zakatAmount if it's a string
    const amount = typeof record.zakatAmount === 'string'
      ? parseFloat(record.zakatAmount)
      : (record.zakatAmount || 0);
    return sum + amount;
  }, 0) || 0;

  // Calculate total Zakat paid from actual payment records (filtered by timeframe)
  const totalZakatPaid = filteredPayments.reduce((sum: number, payment: any) => {
    return sum + (Number(payment.amount) || 0);
  }, 0) || 0;

  const outstandingBalance = totalZakatDue - totalZakatPaid;
  const complianceRate = totalZakatDue > 0 ? (totalZakatPaid / totalZakatDue) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Comprehensive insights into your Zakat history and trends
              </p>
            </div>

          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 transition-shadow hover:shadow-md">
            <p className="text-sm font-medium text-gray-500">Total Wealth</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {maskedCurrency(formatCurrency(totalWealth))}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 transition-shadow hover:shadow-md">
            <p className="text-sm font-medium text-gray-500">Zakatable Wealth</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {maskedCurrency(formatCurrency(totalZakatableWealth))}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 transition-shadow hover:shadow-md">
            <p className="text-sm font-medium text-gray-500">Total Zakat Due</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {maskedCurrency(formatCurrency(totalZakatDue))}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 transition-shadow hover:shadow-md">
            <p className="text-sm font-medium text-gray-500">Compliance Rate</p>
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex justify-between items-baseline">
                <p className="text-2xl font-bold text-gray-900">{complianceRate.toFixed(1)}%</p>
                <span className="text-xs text-gray-500">
                  {maskedCurrency(formatCurrency(totalZakatPaid))} Paid
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${complianceRate >= 100 ? 'bg-green-600' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min(complianceRate, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Time Period:</label>
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar scroll-smooth">
              <button
                onClick={() => setSelectedTimeframe('last_year')}
                className={`flex-shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${selectedTimeframe === 'last_year'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Last Year
              </button>
              <button
                onClick={() => setSelectedTimeframe('last_3_years')}
                className={`flex-shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${selectedTimeframe === 'last_3_years'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Last 3 Years
              </button>
              <button
                onClick={() => setSelectedTimeframe('last_5_years')}
                className={`flex-shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${selectedTimeframe === 'last_5_years'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Last 5 Years
              </button>
              <button
                onClick={() => setSelectedTimeframe('all_time')}
                className={`flex-shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${selectedTimeframe === 'all_time'
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-transparent">
          {/* Wealth Trend (Full Width on mobile, half on desktop) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <WealthTrendChart records={filteredNisabRecords} />
          </div>

          {/* Asset Composition */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <AssetsBreakdownChart assets={assets} />
          </div>

          {/* Payment Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <PaymentDistributionChart payments={filteredPayments} />
          </div>

          {/* Obligations */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <ZakatObligationsChart records={filteredNisabRecords} payments={filteredPayments} />
          </div>
        </div>
      </div>
    </div>
  );
};