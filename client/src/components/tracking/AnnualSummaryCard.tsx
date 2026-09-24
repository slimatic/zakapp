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
 * AnnualSummaryCard Component - T065
 * Displays annual Zakat summary with PDF export functionality
 */

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { formatGregorianDate, formatHijriDate } from '../../utils/calendarConverter';
import { generateAnnualSummaryPDF, downloadPDF } from '../../utils/pdfGenerator';
import { usePaymentRepository } from '../../hooks/usePaymentRepository';
import { useAuth } from '../../contexts/AuthContext';
import type { YearlySnapshot } from '@zakapp/shared/types/tracking';

interface AnnualSummaryCardProps {
  snapshot: YearlySnapshot;
  compact?: boolean;
  showExportButtons?: boolean;
}

export const AnnualSummaryCard: React.FC<AnnualSummaryCardProps> = ({
  snapshot,
  compact = false,
  showExportButtons = true
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { user } = useAuth();
  const userCurrency = (user as any)?.settings?.currency || (user as any)?.preferences?.currency || 'USD';

  // Fetch payment records for this snapshot
  const { payments } = usePaymentRepository({ snapshotId: snapshot.id });

  // Calculate summary statistics
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingZakat = Math.max(0, snapshot.zakatAmount - totalPaid);
  const paymentProgress = snapshot.zakatAmount > 0 ? (totalPaid / snapshot.zakatAmount) * 100 : 0;
  const netWorth = snapshot.totalWealth - snapshot.totalLiabilities;
  const zakatRate = snapshot.zakatableWealth > 0 ? (snapshot.zakatAmount / snapshot.zakatableWealth) * 100 : 0;
  const isAboveNisab = snapshot.zakatableWealth >= snapshot.nisabThreshold;

  // Payment distribution by category
  const paymentsByCategory = payments.reduce((acc, payment) => {
    acc[payment.recipientCategory] = (acc[payment.recipientCategory] || 0) + payment.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryLabels = {
    fakir: 'Al-Fuqara (The Poor)',
    miskin: 'Al-Masakin (The Needy)',
    amil: 'Al-Amilin (Administrators)',
    muallaf: 'Al-Muallafah (New Muslims)',
    riqab: 'Ar-Riqab (Freeing Slaves)',
    gharimin: 'Al-Gharimin (Debt-ridden)',
    fisabilillah: 'Fi Sabilillah (In Allah\'s way)',
    ibnus_sabil: 'Ibn as-Sabil (Traveler)'
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = generateAnnualSummaryPDF(snapshot, payments, { currency: userCurrency });
      downloadPDF(pdf, `zakat-summary-${snapshot.gregorianYear}.pdf`);
    } catch (error) {
      toast.error('Failed to generate PDF report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = () => {
    const shareData = {
      title: `Zakat Summary ${snapshot.gregorianYear}`,
      text: `My Zakat calculation for ${snapshot.gregorianYear}: ${formatCurrency(snapshot.zakatAmount, userCurrency as any)} calculated on ${formatCurrency(snapshot.zakatableWealth, userCurrency as any)} zakatable wealth.`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      toast.success('Summary copied to clipboard!');
    }
  };

  return (
    <div className={`bg-card rounded-lg border border-border ${compact ? 'p-4' : 'p-6'} space-y-6`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className={`font-bold text-foreground ${compact ? 'text-lg' : 'text-xl'}`}>
            Annual Zakat Summary
          </h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>📅 {formatGregorianDate(snapshot.calculationDate)}</span>
            <span>🌙 {formatHijriDate({
              hy: snapshot.hijriYear,
              hm: snapshot.hijriMonth,
              hd: snapshot.hijriDay
            })}</span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${snapshot.status === 'finalized'
              ? 'bg-success-soft text-success'
              : 'bg-warn-soft text-warn-strong'
              }`}>
              {snapshot.status === 'finalized' ? '✅ Finalized' : '🔄 Draft'}
            </span>
          </div>
        </div>

        {snapshot.isPrimary && (
          <div className="bg-warn-soft text-warn-strong px-2 py-1 rounded-full text-xs font-medium">
            ⭐ Primary
          </div>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className={`grid gap-4 ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
        <div className="bg-success-soft border border-success/30 rounded-lg p-3">
          <div className="text-sm font-medium text-success">Zakat Obligated</div>
          <div className="text-xl font-bold text-success">
            {formatCurrency(snapshot.zakatAmount, userCurrency as any)}
          </div>
          <div className="text-xs text-success mt-1">
            {formatPercentage(zakatRate)} of zakatable wealth
          </div>
        </div>

        <div className="bg-accent border border-border rounded-lg p-3">
          <div className="text-sm font-medium text-secondary">Amount Paid</div>
          <div className="text-xl font-bold text-secondary">
            {formatCurrency(totalPaid, userCurrency as any)}
          </div>
          <div className="text-xs text-secondary mt-1">
            {formatPercentage(paymentProgress)} complete
          </div>
        </div>

        <div className="bg-accent border border-border rounded-lg p-3">
          <div className="text-sm font-medium text-secondary">Zakatable Wealth</div>
          <div className="text-xl font-bold text-secondary">
            {formatCurrency(snapshot.zakatableWealth, userCurrency as any)}
          </div>
          <div className="text-xs text-secondary mt-1">
            {isAboveNisab ? '✅ Above nisab' : '❌ Below nisab'}
          </div>
        </div>

        <div className="bg-warn-soft border border-warn/30 rounded-lg p-3">
          <div className="text-sm font-medium text-warn-strong">Net Worth</div>
          <div className="text-xl font-bold text-warn-strong">
            {formatCurrency(netWorth, userCurrency as any)}
          </div>
          <div className="text-xs text-warn-strong mt-1">
            After liabilities
          </div>
        </div>
      </div>

      {/* Payment Progress */}
      {!compact && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground/80">Payment Progress</span>
            <span className="text-sm text-muted-foreground">
              {formatCurrency(remainingZakat, userCurrency as any)} remaining
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${paymentProgress >= 100 ? 'bg-success' : 'bg-secondary'
                }`}
              style={{ width: `${Math.min(paymentProgress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Payment Distribution */}
      {!compact && Object.keys(paymentsByCategory).length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-foreground/80 mb-3">Payment Distribution by Category</h4>
          <div className="space-y-2">
            {Object.entries(paymentsByCategory).map(([category, amount]) => {
              const percentage = totalPaid > 0 ? (amount / totalPaid) * 100 : 0;
              return (
                <div key={category} className="flex items-center justify-between text-sm">
                  <span className="text-foreground/80">
                    {categoryLabels[category as keyof typeof categoryLabels] || category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-medium">
                      {formatCurrency(amount, userCurrency as any)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      ({formatPercentage(percentage)})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calculation Details */}
      {!compact && (
        <div className="bg-muted rounded-lg p-4">
          <h4 className="text-sm font-medium text-foreground/80 mb-3">Calculation Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Wealth:</span>
              <span className="font-medium text-foreground ms-2">
                {formatCurrency(snapshot.totalWealth, userCurrency as any)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Liabilities:</span>
              <span className="font-medium text-foreground ms-2">
                {formatCurrency(snapshot.totalLiabilities, userCurrency as any)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Methodology:</span>
              <span className="font-medium text-foreground ms-2">
                {snapshot.methodologyUsed}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Nisab ({snapshot.nisabType}):</span>
              <span className="font-medium text-foreground ms-2">
                {formatCurrency(snapshot.nisabThreshold, userCurrency as any)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {!compact && snapshot.userNotes && (
        <div className="bg-accent border border-border rounded-lg p-4">
          <h4 className="text-sm font-medium text-secondary mb-2">Notes</h4>
          <p className="text-sm text-secondary">{snapshot.userNotes}</p>
        </div>
      )}

      {/* Export Actions */}
      {showExportButtons && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
          <Button
            onClick={handleExportPDF}
            disabled={isExporting}
            size={compact ? 'sm' : 'default'}
          >
            {isExporting ? (
              <>
                <LoadingSpinner size="sm" className="me-2" />
                Generating PDF...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </>
            )}
          </Button>

          <Button
            variant="secondary"
            onClick={handleShare}
            size={compact ? 'sm' : 'default'}
          >
            <svg className="w-4 h-4 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Share
          </Button>

          <Button
            variant="ghost"
            onClick={() => window.print()}
            size={compact ? 'sm' : 'default'}
          >
            <svg className="w-4 h-4 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </Button>
        </div>
      )}

      {/* Compliance Note */}
      {!compact && (
        <div className="bg-success-soft border border-success/30 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ms-3">
              <h4 className="text-sm font-medium text-success">
                Islamic Compliance Note
              </h4>
              <p className="text-sm text-success mt-1">
                This calculation follows Islamic guidelines for Zakat obligation using the {snapshot.methodologyUsed} methodology.
                The nisab threshold is based on {snapshot.nisabType} prices.
                Please consult with a qualified Islamic scholar for specific rulings.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};