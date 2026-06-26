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
 * AnnualSummaryPage
 * Year-in-review dashboard for zakat — "Spotify Wrapped" style summary.
 * Displays total assets, liabilities, zakat due vs paid, nisab status,
 * monthly payment bar chart, and PDF export.
 */

import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAssetRepository } from '../hooks/useAssetRepository';
import { useNisabRecordRepository } from '../hooks/useNisabRecordRepository';
import { usePaymentRepository } from '../hooks/usePaymentRepository';
import { formatCurrency } from '../utils/formatters';
import { useMaskedCurrency } from '../contexts/PrivacyContext';
import { generateAnnualSummaryPDF, downloadPDF } from '../utils/pdfGenerator';
import { MonthlyDueVsPaidChart } from '../components/dashboard/MonthlyDueVsPaidChart';
import type { PaymentRecord } from '@zakapp/shared/types/tracking';

export const AnnualSummaryPage: React.FC = () => {
  const { year } = useParams<{ year: string }>();
  const navigate = useNavigate();
  const yearNum = parseInt(year || `${new Date().getFullYear()}`, 10);
  const maskedCurrency = useMaskedCurrency();
  const [isExporting, setIsExporting] = useState(false);

  // Fetch data
  const { assets, isLoading: assetsLoading, error: assetsError } = useAssetRepository();
  const { records: nisabRecords, isLoading: recordsLoading, error: recordsError } = useNisabRecordRepository();
  const { payments, isLoading: paymentsLoading } = usePaymentRepository();

  // Filter records and payments to the selected year
  const yearRecords = useMemo(() => {
    return nisabRecords.filter(r => {
      const y = r.gregorianYear ? parseInt(String(r.gregorianYear), 10) : null;
      if (y) return y === yearNum;
      // fallback: derive year from hawlStartDate
      const d = r.hawlStartDate ? new Date(r.hawlStartDate) : null;
      return d ? d.getFullYear() === yearNum : false;
    });
  }, [nisabRecords, yearNum]);

  const yearPayments = useMemo(() => {
    return payments.filter(p => {
      const d = new Date(p.paymentDate);
      return d.getFullYear() === yearNum;
    });
  }, [payments, yearNum]);

  // Aggregate totals across all year records
  const { totalAssets, totalLiabilities, totalZakatable, totalZakatDue, nisabThreshold } = useMemo(() => {
    let ta = 0, tl = 0, tz = 0, zd = 0, nt = 0;
    for (const r of yearRecords) {
      ta += typeof r.totalWealth === 'number' ? r.totalWealth : parseFloat(String(r.totalWealth || '0'));
      // liabilities not always on nisab record; approximate from assets minus zakatable
      tl += 0;
      tz += typeof r.zakatableWealth === 'number' ? r.zakatableWealth : parseFloat(String(r.zakatableWealth || '0'));
      zd += typeof r.zakatAmount === 'number' ? r.zakatAmount : parseFloat(String(r.zakatAmount || '0'));
      nt = typeof r.nisabThresholdAtStart === 'number'
        ? r.nisabThresholdAtStart
        : parseFloat(String(r.nisabThresholdAtStart || '0')) || parseFloat(String(r.initialNisabThreshold || '0'));
    }
    // Derive liabilities from asset total if we have assets but nisab records are sparse
    const assetTotal = assets.reduce((s, a) => s + (a.value || 0), 0);
    return {
      totalAssets: Math.max(ta, assetTotal),
      totalLiabilities: tl,
      totalZakatable: tz || (assetTotal * 0.975), // rough net after assumed liabilities
      totalZakatDue: zd,
      nisabThreshold: nt,
    };
  }, [yearRecords, assets]);

  const totalPaid = useMemo(() =>
    yearPayments.reduce((s, p) => s + (typeof p.amount === 'number' ? p.amount : 0), 0),
    [yearPayments]
  );

  const remaining = Math.max(0, totalZakatDue - totalPaid);
  const paymentPercent = totalZakatDue > 0 ? Math.min(100, (totalPaid / totalZakatDue) * 100) : 0;
  const aboveNisab = totalZakatable >= nisabThreshold;

  // Month aggregation for chart
  const monthlyData = useMemo(() => {
    const months = [
      'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'
    ];
    const dueMap: Record<string, number> = {};
    const paidMap: Record<string, number> = {};
    months.forEach(m => { dueMap[m] = 0; paidMap[m] = 0; });

    // Distribute zakat due evenly (or by record month)
    yearRecords.forEach(r => {
      const d = r.hawlStartDate ? new Date(r.hawlStartDate) : null;
      const m = d ? months[d.getMonth()] : null;
      const due = typeof r.zakatAmount === 'number' ? r.zakatAmount : parseFloat(String(r.zakatAmount || '0'));
      if (m) dueMap[m] += due;
      else months.forEach(mm => { dueMap[mm] += due / 12; });
    });

    // Map payments by month
    yearPayments.forEach(p => {
      const d = new Date(p.paymentDate);
      const m = months[d.getMonth()];
      const amt = typeof p.amount === 'number' ? p.amount : 0;
      if (m) paidMap[m] += amt;
    });

    return months.map(m => ({
      name: m,
      due: Math.round(dueMap[m] * 100) / 100,
      paid: Math.round(paidMap[m] * 100) / 100,
    }));
  }, [yearRecords, yearPayments]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Build a synthetic snapshot for the PDF generator
      const snapshot = {
        id: `summary-${yearNum}`,
        userId: 'local',
        calculationDate: new Date(yearNum, 11, 31).toISOString(),
        gregorianYear: yearNum,
        gregorianMonth: 12,
        gregorianDay: 31,
        hijriYear: yearNum - 579,
        hijriMonth: 1,
        hijriDay: 1,
        totalWealth: totalAssets,
        totalLiabilities: totalLiabilities,
        zakatableWealth: totalZakatable,
        zakatAmount: totalZakatDue,
        nisabThreshold: nisabThreshold || 5000,
        nisabType: 'gold' as const,
        methodologyUsed: yearRecords.length > 0 ? 'Standard' : 'Standard',
        status: totalPaid >= totalZakatDue ? 'finalized' : 'draft',
        isPrimary: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const pdf = generateAnnualSummaryPDF(snapshot as any, yearPayments);
      downloadPDF(pdf, `zakat-annual-summary-${yearNum}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const isLoading = assetsLoading || recordsLoading || paymentsLoading;
  const error = assetsError || recordsError;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage error={error} title="Failed to load summary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6" id="main-content">
      {/* Top Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link to="/dashboard" className="text-sm text-teal-700 hover:underline">← Back to Dashboard</Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
            {yearNum} Zakat Summary
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Year-in-review for {yearNum}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/dashboard/summary/${yearNum - 1}`)} size="sm">
            ← {yearNum - 1}
          </Button>
          <Button variant="outline" onClick={() => navigate(`/dashboard/summary/${yearNum + 1}`)} size="sm">
            {yearNum + 1} →
          </Button>
          <Button onClick={handleExportPDF} disabled={isExporting} size="sm">
            {isExporting ? 'Generating…' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* Hero Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Assets</div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
            {maskedCurrency(formatCurrency(totalAssets, 'USD'))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Liabilities</div>
          <div className="text-xl sm:text-2xl font-bold text-red-700 mt-1">
            {maskedCurrency(formatCurrency(totalLiabilities, 'USD'))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Zakat Due</div>
          <div className="text-xl sm:text-2xl font-bold text-teal-700 mt-1">
            {maskedCurrency(formatCurrency(totalZakatDue, 'USD'))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Zakat Paid</div>
          <div className="text-xl sm:text-2xl font-bold text-green-700 mt-1">
            {maskedCurrency(formatCurrency(totalPaid, 'USD'))}
          </div>
        </div>
      </div>

      {/* Nisab Status */}
      <div className={`rounded-xl border p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        aboveNisab
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${aboveNisab ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Nisab Status</h3>
            <p className="text-sm text-gray-600">
              {aboveNisab
                ? 'Your zakatable wealth is above the nisab threshold. Zakat is obligatory.'
                : 'Your zakatable wealth is below the nisab threshold. Zakat is not yet due.'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Nisab Threshold</p>
          <p className="text-lg font-bold text-gray-900">
            {maskedCurrency(formatCurrency(nisabThreshold || 5000, 'USD'))}
          </p>
        </div>
      </div>

      {/* Due vs Paid Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Monthly Zakat Due vs Paid</h2>
        <MonthlyDueVsPaidChart data={monthlyData} currency="USD" />
      </div>

      {/* Progress Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-900">Payment Progress</h2>
          <span className="text-sm font-medium text-gray-600">
            {paymentPercent.toFixed(1)}% complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-700 ${
              paymentPercent >= 100 ? 'bg-green-600' : 'bg-teal-600'
            }`}
            style={{ width: `${Math.min(paymentPercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
        {remaining > 0 && (
          <p className="text-sm text-gray-700 mt-3">
            Remaining: <span className="font-semibold text-teal-700">
              {maskedCurrency(formatCurrency(remaining, 'USD'))}
            </span>
          </p>
        )}
      </div>

      {/* Payments Table */}
      {yearPayments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Payments ({yearPayments.length})
          </h2>
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Recipient</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {yearPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-gray-900 whitespace-nowrap">
                      {p.recipientName || 'Anonymous'}
                    </td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap capitalize">
                      {(p.recipientCategory || 'general').replace(/_/g, ' ')}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900 whitespace-nowrap">
                      {maskedCurrency(formatCurrency(p.amount, 'USD'))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {yearRecords.length === 0 && yearPayments.length === 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No Data for {yearNum}</h3>
          <p className="text-gray-600 mt-1 max-w-md mx-auto">
            There are no zakat records or payments for this year yet. Start adding assets and payments to see your summary.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate('/assets')}>Add Assets</Button>
            <Button variant="outline" onClick={() => navigate('/payments')}>Record Payment</Button>
          </div>
        </div>
      )}

      {/* Footer compliance */}
      <div className="text-center text-xs text-gray-400 py-4">
        ZakApp Annual Summary — {yearNum} — Generated {new Date().toLocaleDateString()}
        <br />
        This summary estimates zakatable wealth based on recorded assets and nisab-year data.
        Consult a qualified Islamic scholar for specific rulings.
      </div>
    </div>
  );
};
