/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

/**
 * AnnualSummaryPage
 * Year-in-review dashboard: total assets, liabilities, zakat due vs paid,
 * nisab status, monthly bar chart, and PDF export.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ArrowLeft, Download, Calendar, TrendingUp, Scale, Wallet } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { usePrivacy, useMaskedCurrency } from '../../contexts/PrivacyContext';
import { useAssetRepository } from '../../hooks/useAssetRepository';
import { useLiabilityRepository } from '../../hooks/useLiabilityRepository';
import { useNisabRecordRepository } from '../../hooks/useNisabRecordRepository';
import { usePaymentRepository } from '../../hooks/usePaymentRepository';
import { formatCurrency } from '../../utils/formatters';
import { parseDecimalNumber } from '../../utils/parseDecimal';
import { downloadSummaryPDF } from '../../utils/summaryPdfExport';
import type { NisabYearRecord } from '../../types/nisabYearRecord';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function getMonthFromDate(d: string | Date | null | undefined): number {
  if (!d) return 0;
  try {
    const dt = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dt.getTime())) return 0;
    return dt.getMonth();
  } catch {
    return 0;
  }
}

function isDateInYear(d: string | Date | null | undefined, year: number): boolean {
  if (!d) return false;
  try {
    const dt = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dt.getTime())) return false;
    return dt.getFullYear() === year;
  } catch {
    return false;
  }
}

function getRecordYear(r: NisabYearRecord): number {
  if (r.hawlStartDate) return new Date(r.hawlStartDate).getFullYear();
  if (r.calculationDate) return new Date(r.calculationDate).getFullYear();
  if (r.createdAt) return new Date(r.createdAt).getFullYear();
  return 0;
}

function safeNumber(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  return parseDecimalNumber(val);
}

function currencyFormat(
  val: number,
  currency: string,
  privacyMode: boolean,
  compact?: boolean
) {
  if (privacyMode) return '****';
  try {
    return formatCurrency(val, (currency as any) || 'USD', true, !!compact);
  } catch {
    return `$${val.toLocaleString()}`;
  }
}

function percentFormat(val: number, privacyMode: boolean) {
  if (privacyMode) return '****';
  return `${val.toFixed(1)}%`;
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: 'green' | 'blue' | 'amber' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, accent = 'blue' }) => {
  const accentMap: Record<string, string> = {
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };
  return (
    <div className={`rounded-lg border p-5 shadow-sm ${accentMap[accent] || accentMap.blue}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="opacity-60">{icon}</div>
      </div>
    </div>
  );
};

export const AnnualSummaryPage: React.FC = () => {
  const { year } = useParams<{ year: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { privacyMode } = usePrivacy();
  const maskedCurrency = useMaskedCurrency();

  const userCurrency = (user as any)?.preferences?.currency || (user as any)?.settings?.currency || 'USD';

  const targetYear = useMemo(() => {
    const y = parseInt(year || '', 10);
    return Number.isFinite(y) ? y : new Date().getFullYear();
  }, [year]);

  const { assets, isLoading: assetsLoading } = useAssetRepository();
  const { liabilities, isLoading: liabilitiesLoading } = useLiabilityRepository();
  const { records: nisabRecords, isLoading: recordsLoading } = useNisabRecordRepository();
  const { payments, isLoading: paymentsLoading } = usePaymentRepository();

  const isLoading = assetsLoading || liabilitiesLoading || recordsLoading || paymentsLoading;

  // Year-scoped data
  const yearAssets = useMemo(
    () => assets.filter((a) => isDateInYear(a.createdAt, targetYear)),
    [assets, targetYear]
  );

  const yearLiabilities = useMemo(
    () => liabilities.filter((l) => isDateInYear(l.createdAt, targetYear)),
    [liabilities, targetYear]
  );

  const yearNisabRecords = useMemo(
    () => nisabRecords.filter((r) => getRecordYear(r) === targetYear),
    [nisabRecords, targetYear]
  );

  const yearPayments = useMemo(
    () =>
      payments.filter((p: any) => {
        const pd = p.paymentDate || p.createdAt;
        return isDateInYear(pd, targetYear);
      }),
    [payments, targetYear]
  );

  // Totals
  const totalAssets = useMemo(
    () => yearAssets.reduce((sum, a) => sum + (a.value || 0), 0),
    [yearAssets]
  );

  const totalLiabilitiesValue = useMemo(
    () => yearLiabilities.reduce((sum, l) => sum + safeNumber(l.amount), 0),
    [yearLiabilities]
  );

  const netWealth = totalAssets - totalLiabilitiesValue;

  const totalZakatDue = useMemo(
    () =>
      yearNisabRecords.reduce((sum, r) => {
        return sum + safeNumber(r.zakatAmount ?? r.finalZakatAmount);
      }, 0),
    [yearNisabRecords]
  );

  const totalZakatPaid = useMemo(
    () => yearPayments.reduce((sum, p: any) => sum + (Number(p.amount) || 0), 0),
    [yearPayments]
  );

  const outstandingZakat = Math.max(0, totalZakatDue - totalZakatPaid);
  const complianceRate = totalZakatDue > 0 ? (totalZakatPaid / totalZakatDue) * 100 : 0;

  // Nisab status: was the user above nisab at year start?
  const nisabStatus = useMemo(() => {
    if (yearNisabRecords.length === 0) return 'No records';
    const first = yearNisabRecords[yearNisabRecords.length - 1]; // oldest
    const initial = safeNumber(first.nisabThresholdAtStart ?? first.initialNisabThreshold);
    const wealth = safeNumber(first.totalWealth);
    if (initial <= 0) return 'No threshold set';
    return wealth >= initial ? 'Above Nisab' : 'Below Nisab';
  }, [yearNisabRecords]);

  const nisabStatusAccent = useMemo(() => {
    if (nisabStatus === 'Above Nisab') return 'green';
    if (nisabStatus === 'Below Nisab') return 'amber';
    return 'blue';
  }, [nisabStatus]);

  // Monthly due vs paid
  const monthlyData = useMemo(() => {
    const due = new Array(12).fill(0);
    const paid = new Array(12).fill(0);

    for (const r of yearNisabRecords) {
      const m = getMonthFromDate(r.hawlStartDate || r.calculationDate || r.createdAt);
      due[m] += safeNumber(r.zakatAmount ?? r.finalZakatAmount);
    }

    for (const p of yearPayments) {
      const m = getMonthFromDate(p.paymentDate || p.createdAt);
      paid[m] += Number(p.amount) || 0;
    }

    return MONTH_NAMES.map((month, i) => ({
      month,
      due: Number(due[i].toFixed(2)),
      paid: Number(paid[i].toFixed(2)),
    }));
  }, [yearNisabRecords, yearPayments]);

  const hasChartData = monthlyData.some((d) => d.due > 0 || d.paid > 0);

  const handleExportPDF = useCallback(() => {
    downloadSummaryPDF({
      year: targetYear,
      totalAssets,
      totalLiabilities: totalLiabilitiesValue,
      netWealth,
      totalZakatDue,
      totalZakatPaid,
      outstandingZakat,
      complianceRate,
      nisabStatus,
      currency: userCurrency,
      monthlyData,
      assetCount: yearAssets.length,
      liabilityCount: yearLiabilities.length,
      paymentCount: yearPayments.length,
    });
  }, [
    targetYear,
    totalAssets,
    totalLiabilitiesValue,
    netWealth,
    totalZakatDue,
    totalZakatPaid,
    outstandingZakat,
    complianceRate,
    nisabStatus,
    userCurrency,
    monthlyData,
    yearAssets.length,
    yearLiabilities.length,
    yearPayments.length,
  ]);

  const goToYear = (delta: number) => {
    navigate(`/dashboard/summary/${targetYear + delta}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="rounded-md p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {targetYear} Zakat Summary
              </h1>
              <p className="text-sm text-gray-600">
                Your year-in-review at a glance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goToYear(-1)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              aria-label="Previous year"
            >
              &larr;
            </button>
            <span className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900">
              <Calendar className="h-4 w-4" />
              {targetYear}
            </span>
            <button
              onClick={() => goToYear(1)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              aria-label="Next year"
            >
              &rarr;
            </button>
            <button
              onClick={handleExportPDF}
              className="ml-2 inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Assets"
            value={currencyFormat(totalAssets, userCurrency, privacyMode, true)}
            icon={<Wallet className="h-6 w-6" />}
            accent="blue"
          />
          <StatCard
            label="Total Liabilities"
            value={currencyFormat(totalLiabilitiesValue, userCurrency, privacyMode, true)}
            icon={<Scale className="h-6 w-6" />}
            accent="amber"
          />
          <StatCard
            label="Zakat Due"
            value={currencyFormat(totalZakatDue, userCurrency, privacyMode, true)}
            icon={<TrendingUp className="h-6 w-6" />}
            accent="red"
          />
          <StatCard
            label="Zakat Paid"
            value={currencyFormat(totalZakatPaid, userCurrency, privacyMode, true)}
            icon={<TrendingUp className="h-6 w-6" />}
            accent="green"
          />
        </div>

        {/* Secondary row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Net Wealth"
            value={currencyFormat(netWealth, userCurrency, privacyMode, true)}
            icon={<Wallet className="h-6 w-6" />}
            accent="blue"
          />
          <StatCard
            label="Outstanding"
            value={currencyFormat(outstandingZakat, userCurrency, privacyMode, true)}
            icon={<Scale className="h-6 w-6" />}
            accent={outstandingZakat > 0 ? 'red' : 'green'}
          />
          <StatCard
            label="Compliance"
            value={percentFormat(complianceRate, privacyMode)}
            icon={<TrendingUp className="h-6 w-6" />}
            accent={complianceRate >= 100 ? 'green' : complianceRate >= 50 ? 'blue' : 'amber'}
          />
          <StatCard
            label="Nisab Status"
            value={nisabStatus}
            icon={<Scale className="h-6 w-6" />}
            accent={nisabStatusAccent as any}
          />
        </div>

        {/* Monthly Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Due vs Paid by Month</h2>
          {hasChartData ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={8}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickFormatter={(v: number) =>
                      privacyMode ? '****' : `$${(v / 1000).toFixed(0)}k`
                    }
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      privacyMode ? '****' : currencyFormat(Number(value), userCurrency, false),
                      name,
                    ]}
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '13px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="due" name="Zakat Due" fill="#64748b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="paid" name="Zakat Paid" fill="#0f766e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-gray-400">
              <div className="text-center">
                <Calendar className="mx-auto mb-2 h-8 w-8 opacity-40" />
                <p>No zakat data for {targetYear} yet.</p>
                <p className="mt-1 text-sm">Add nisab records and payments to see your summary.</p>
              </div>
            </div>
          )}
        </div>

        {/* Breakdown cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Assets
            </h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {privacyMode ? '****' : yearAssets.length}
            </p>
            <p className="mt-1 text-sm text-gray-500">tracked this year</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Liabilities
            </h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {privacyMode ? '****' : yearLiabilities.length}
            </p>
            <p className="mt-1 text-sm text-gray-500">tracked this year</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Payments
            </h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {privacyMode ? '****' : yearPayments.length}
            </p>
            <p className="mt-1 text-sm text-gray-500">recorded this year</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnualSummaryPage;
